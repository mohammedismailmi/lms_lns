import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { cors } from 'hono/cors';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import { eq, and, ne, sql, gt, isNull, inArray } from 'drizzle-orm';
import { getDb } from './db';
import { users, tenants, enrollments, courses, progress, certificates, submissions, modules, activities, liveSessions } from './db/schema';
import { Context, Next } from 'hono';

type Bindings = {
	DB: D1Database;
	JWT_SECRET: string;
	GROQ_API_KEY?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors({
	origin: 'http://localhost:5173',
	allowHeaders: ['Content-Type', 'Authorization'],
	allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	credentials: true,
	exposeHeaders: ['Set-Cookie'],
}));

// =============================
// Helper: verify JWT and return payload
// =============================
async function getAuthPayload(c: any) {
	const token = getCookie(c, 'auth_token');
	if (!token) return null;
	try {
		return await verify(token, c.env.JWT_SECRET, 'HS256');
	} catch { return null; }
}

const requireRole = (...roles: string[]) => async (c: Context, next: Next) => {
	const payload = await getAuthPayload(c);
	if (!payload) return c.json({ success: false, message: 'Not authenticated' }, 401);
	if (!roles.includes(payload.role as string)) return c.json({ success: false, message: 'Forbidden' }, 403);
	c.set('user', payload);
	await next();
};

const jwtMiddleware = async (c: Context, next: Next) => {
	const payload = await getAuthPayload(c);
	if (!payload) return c.json({ success: false, message: 'Not authenticated' }, 401);
	c.set('user', payload);
	await next();
};

// =============================
// Auth Schemas
// =============================
const registerSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	email: z.string().email('Invalid email address'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
	tenantId: z.string().min(1, 'Institution is required'),
	role: z.enum(['admin', 'instructor', 'learner']).default('learner'),
});

const loginSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string().min(1, 'Password is required'),
	tenantId: z.string().optional(),
});

app.get('/', (c) => c.text('LMS Auth API'));

// =============================
// TENANT ENDPOINTS
// =============================

app.get('/api/tenants', async (c) => {
	try {
		const db = getDb(c.env);
		const allTenants = await db.select({
			id: tenants.id, name: tenants.name, slug: tenants.slug, logoUrl: tenants.logo_url,
		}).from(tenants).where(ne(tenants.id, 'system')).orderBy(tenants.name);
		return c.json({ success: true, tenants: allTenants });
	} catch (e: any) {
		return c.json({ success: false, message: e.message }, 500);
	}
});

// =============================
// AUTH ENDPOINTS
// =============================

app.post('/api/auth/register', zValidator('json', registerSchema), async (c) => {
	const body = c.req.valid('json');
	const db = getDb(c.env);

	const existingUser = await db.select().from(users).where(and(eq(users.email, body.email), eq(users.tenant_id, body.tenantId))).get();
	if (existingUser) return c.json({ success: false, message: 'Email already exists in this institution.' }, 409);

	const passwordHash = await bcrypt.hash(body.password, 10);
	const userId = crypto.randomUUID();
	const now = Math.floor(Date.now() / 1000);
	await db.insert(users).values({ id: userId, tenant_id: body.tenantId, name: body.name, email: body.email, password_hash: passwordHash, role: body.role, created_at: now, updated_at: now });
	return c.json({ success: true, message: 'User registered successfully' });
});

app.post('/api/auth/login', zValidator('json', loginSchema), async (c) => {
	const body = c.req.valid('json');
	const db = getDb(c.env);
	let user: any = null;

	if (body.email === 'superadmin@lms.com' || !body.tenantId) {
		user = await db.select().from(users).where(and(eq(users.email, body.email), eq(users.role, 'super_admin'))).get();
		if (!user && !body.tenantId) return c.json({ success: false, message: 'Please select an institution.' }, 400);
	}

	if (!user && body.tenantId) {
		user = await db.select().from(users).where(and(eq(users.email, body.email), eq(users.tenant_id, body.tenantId))).get();
	}

	if (!user) return c.json({ success: false, message: 'Invalid credentials' }, 401);
	const isMatch = await bcrypt.compare(body.password, user.password_hash);
	if (!isMatch) return c.json({ success: false, message: 'Invalid credentials' }, 401);

	const payload = { userId: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 };
	const token = await sign(payload, c.env.JWT_SECRET);
	setCookie(c, 'auth_token', token, { path: '/', httpOnly: true, secure: true, sameSite: 'None', maxAge: 7 * 24 * 60 * 60 });

	return c.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenant_id } });
});

app.get('/api/auth/me', async (c) => {
	const payload = await getAuthPayload(c);
	if (!payload) return c.json({ success: false, message: 'Not authenticated' }, 401);
	const db = getDb(c.env);
	const user = await db.select().from(users).where(eq(users.id, payload.userId as string)).get();
	if (!user) return c.json({ success: false, message: 'User not found' }, 401);
	return c.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenant_id } });
});

app.post('/api/auth/logout', (c) => {
	deleteCookie(c, 'auth_token', { path: '/' });
	return c.json({ success: true, message: 'logged out' });
});

// =============================
// COURSE & PROGRESS ENDPOINTS
// =============================

app.get('/api/courses', async (c) => {
	const payload = await getAuthPayload(c);
	if (!payload) return c.json({ success: false, message: 'Not authenticated' }, 401);
	const db = getDb(c.env);
	const tid = payload.tenant_id as string;
	
	try {
		let result;
		if (payload.role === 'instructor') {
			result = await db.select().from(courses)
				.where(and(eq(courses.tenant_id, tid), eq(courses.instructor_id, payload.userId as string)))
				.all();
		} else {
			result = await db.select().from(courses)
				.where(eq(courses.tenant_id, tid))
				.all();
		}
		return c.json({ success: true, courses: result });
	} catch (err: any) {
		return c.json({ success: false, message: err.message }, 500);
	}
});

app.get('/api/enrollments/me', async (c) => {
	const payload = await getAuthPayload(c);
	if (!payload) return c.json({ success: false, message: 'Not authenticated' }, 401);
	const result = await c.env.DB.prepare('SELECT * FROM enrollments WHERE user_id = ?').bind(payload.userId).all();
	return c.json({ success: true, enrollments: result.results || [] });
});

app.post('/api/enrollments', async (c) => {
	const payload = await getAuthPayload(c);
	if (!payload) return c.json({ success: false, message: 'Not authenticated' }, 401);
	const body = await c.req.json();
	const existing = await c.env.DB.prepare('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?').bind(payload.userId, body.course_id).first();
	if (existing) return c.json({ success: true, alreadyEnrolled: true });

	await c.env.DB.prepare('INSERT INTO enrollments (id, user_id, course_id, tenant_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
		.bind(crypto.randomUUID(), payload.userId, body.course_id, body.tenant_id, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000)).run();
	return c.json({ success: true });
});

app.get('/api/progress/me', async (c) => {
	const payload = await getAuthPayload(c);
	if (!payload) return c.json({ success: false, message: 'Not authenticated' }, 401);
	const result = await c.env.DB.prepare('SELECT * FROM progress WHERE user_id = ?').bind(payload.userId).all();
	return c.json({ success: true, progress: result.results || [] });
});

app.post('/api/progress', async (c) => {
	const payload = await getAuthPayload(c);
	if (!payload) return c.json({ success: false, message: 'Not authenticated' }, 401);
	const body = await c.req.json();
	const existing = await c.env.DB.prepare('SELECT id FROM progress WHERE user_id = ? AND course_id = ? AND lesson_id = ?').bind(payload.userId, body.course_id, body.lesson_id).first();

	if (existing) {
		await c.env.DB.prepare('UPDATE progress SET percent_complete = ?, updated_at = ? WHERE id = ?').bind(body.percent_complete, Math.floor(Date.now() / 1000), existing.id).run();
	} else {
		await c.env.DB.prepare('INSERT INTO progress (id, user_id, course_id, lesson_id, percent_complete, tenant_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
			.bind(crypto.randomUUID(), payload.userId, body.course_id, body.lesson_id, body.percent_complete, payload.tenant_id || body.tenant_id, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000)).run();
	}

	// Certificate Generation Logic
	if (body.percent_complete === 100) {
		const course: any = await c.env.DB.prepare('SELECT total_activities, status FROM courses WHERE id = ?').bind(body.course_id).first();
		if (course && course.status === 'completed' && course.total_activities > 0) {
			const completed: any = await c.env.DB.prepare('SELECT COUNT(*) as count FROM progress WHERE user_id = ? AND course_id = ? AND percent_complete = 100').bind(payload.userId, body.course_id).first();
			if (completed && Number(completed.count) >= Number(course.total_activities)) {
				const existingCert = await c.env.DB.prepare('SELECT id FROM certificates WHERE user_id = ? AND course_id = ?').bind(payload.userId, body.course_id).first();
				if (!existingCert) {
					await c.env.DB.prepare('INSERT INTO certificates (id, tenant_id, user_id, course_id, issue_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
						.bind(crypto.randomUUID(), payload.tenant_id || body.tenant_id, payload.userId, body.course_id, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000)).run();
				}
			}
		}
	}

	return c.json({ success: true });
});

app.get('/api/certificates', async (c) => {
	const payload = await getAuthPayload(c);
	if (!payload) return c.json({ success: false, message: 'Not authenticated' }, 401);
	const result = await c.env.DB.prepare('SELECT * FROM certificates WHERE user_id = ?').bind(payload.userId).all();
	return c.json({ success: true, certificates: result.results || [] });
});

// =============================
// ADMIN ENDPOINTS
// =============================

app.get('/api/admin/stats', requireRole('admin', 'super_admin'), async (c) => {
	const user = c.get('user');
	const db = getDb(c.env);
	const tid = user.tenant_id;
	try {
		const [uc, cc, ec, cert] = await Promise.all([
			db.select({ count: sql<number>`COUNT(*)` }).from(users).where(eq(users.tenant_id, tid)).get(),
			db.select({ count: sql<number>`COUNT(*)` }).from(courses).where(eq(courses.tenant_id, tid)).get(),
			db.select({ count: sql<number>`COUNT(*)` }).from(enrollments).where(eq(enrollments.tenant_id, tid)).get(),
			db.select({ count: sql<number>`COUNT(*)` }).from(certificates).where(eq(certificates.tenant_id, tid)).get(),
		]);
		return c.json({
			success: true,
			stats: {
				totalUsers: uc?.count || 0,
				totalCourses: cc?.count || 0,
				totalEnrollments: ec?.count || 0,
				certificatesIssued: cert?.count || 0,
			}
		});
	} catch (err: any) {
		return c.json({ success: false, message: err.message }, 500);
	}
});

app.get('/api/admin/users', requireRole('admin', 'super_admin'), async (c) => {
	const user = c.get('user');
	const db = getDb(c.env);
	try {
		const userList = await db.select({
			id: users.id,
			name: users.name,
			email: users.email,
			role: users.role,
			created_at: users.created_at,
			enrollment_count: sql<number>`(SELECT COUNT(*) FROM enrollments WHERE user_id = ${users.id} AND tenant_id = ${user.tenant_id})`,
		})
		.from(users)
		.where(eq(users.tenant_id, user.tenant_id))
		.orderBy(users.created_at);
		return c.json({ success: true, users: userList });
	} catch (err: any) {
		return c.json({ success: false, message: err.message }, 500);
	}
});

app.get('/api/admin/upcoming-sessions', requireRole('admin', 'instructor'), async (c) => {
	const user = c.get('user');
	const db = getDb(c.env);
	const now = Math.floor(Date.now() / 1000);
	try {
		const sessions = await db
			.select({
				id: liveSessions.id,
				title: activities.title,
				start_time: liveSessions.start_time,
				meet_link: liveSessions.meet_link,
				course_id: activities.course_id,
				course_title: courses.title,
			})
			.from(liveSessions)
			.innerJoin(activities, eq(liveSessions.activity_id, activities.id))
			.innerJoin(courses, eq(activities.course_id, courses.id))
			.where(and(
				eq(courses.tenant_id, user.tenant_id),
				gt(liveSessions.start_time, now),
				isNull(liveSessions.ended_at)
			))
			.orderBy(liveSessions.start_time)
			.limit(5);
		return c.json({ success: true, sessions });
	} catch (err: any) {
		return c.json({ success: true, sessions: [] });
	}
});

app.put('/api/admin/users/:userId/role', requireRole('admin'), async (c) => {
	const { userId } = c.req.param();
	const user = c.get('user');
	const body = await c.req.json();
	const db = getDb(c.env);
	const roleSchema = z.object({ role: z.enum(['admin', 'instructor', 'learner']) });
	const parsed = roleSchema.safeParse(body);
	if (!parsed.success) return c.json({ success: false, message: 'Invalid role' }, 400);
	try {
		const target = await db.select().from(users)
			.where(and(eq(users.id, userId), eq(users.tenant_id, user.tenant_id))).get();
		if (!target) return c.json({ success: false, message: 'User not found' }, 404);
		if (target.role === 'super_admin') return c.json({ success: false, message: 'Cannot modify super admin' }, 403);
		await db.update(users)
			.set({ role: parsed.data.role, updated_at: Math.floor(Date.now() / 1000) })
			.where(and(eq(users.id, userId), eq(users.tenant_id, user.tenant_id)));
		return c.json({ success: true });
	} catch (err: any) {
		return c.json({ success: false, message: err.message }, 500);
	}
});

// =============================
// COURSE MANAGEMENT ENDPOINTS
// =============================

app.get('/api/courses/:id', jwtMiddleware, async (c) => {
	const id = c.req.param('id');
	const db = getDb(c.env);
	try {
		const course = await db.select().from(courses).where(eq(courses.id, id)).get();
		if (!course) return c.json({ success: false, message: 'Course not found' }, 404);

		const courseModules = await db.select().from(modules).where(eq(modules.course_id, id)).orderBy(modules.order_index);
		const moduleIds = courseModules.map(m => m.id);
		
		let allActivities: any[] = [];
		if (moduleIds.length > 0) {
			allActivities = await db.select().from(activities).where(inArray(activities.section_id, moduleIds)).orderBy(activities.order_index);
		}

		const resultModules = courseModules.map(m => ({
			...m,
			activities: allActivities.filter(a => a.section_id === m.id)
		}));

		return c.json({
			success: true,
			course: {
				...course,
				modules: resultModules
			}
		});
	} catch (err: any) {
		return c.json({ success: false, message: err.message }, 500);
	}
});

app.post('/api/courses/:courseId/activities', requireRole('instructor', 'admin'), async (c) => {
	const { courseId } = c.req.param();
	const body = await c.req.json();
	const db = getDb(c.env);
	try {
		const id = crypto.randomUUID();
		const now = Math.floor(Date.now() / 1000);
		await db.insert(activities).values({
			id,
			section_id: body.moduleId,
			course_id: courseId,
			title: body.title,
			type: body.type,
			content: body.content,
			order_index: body.orderIndex || 0,
			created_at: now,
			updated_at: now
		});
		
		// Map back to expected frontend shape
		return c.json({ 
			success: true, 
			activity: { id, title: body.title, type: body.type } 
		}, 201);
	} catch (err: any) {
		return c.json({ success: false, message: err.message }, 500);
	}
});

app.get('/api/admin/instructors', requireRole('admin', 'super_admin'), async (c) => {
	const user = c.get('user');
	const db = getDb(c.env);
	try {
		const instructorList = await db.select({
			id: users.id,
			name: users.name,
			email: users.email,
		})
		.from(users)
		.where(and(
			eq(users.tenant_id, user.tenant_id),
			eq(users.role, 'instructor')
		))
		.orderBy(users.name);
		return c.json({ success: true, instructors: instructorList });
	} catch (err: any) {
		return c.json({ success: false, message: err.message }, 500);
	}
});

app.post('/api/admin/courses/:courseId/assign-instructor', requireRole('admin', 'super_admin'), async (c) => {
	const { courseId } = c.req.param();
	const user = c.get('user');
	const body = await c.req.json();
	const db = getDb(c.env);

	const instructorId = body.instructorId;
	if (!instructorId) return c.json({ success: false, message: 'Invalid instructor ID' }, 400);

	try {
		const instructor = await db.select().from(users)
			.where(and(eq(users.id, instructorId), eq(users.tenant_id, user.tenant_id), eq(users.role, 'instructor'))).get();
		if (!instructor) return c.json({ success: false, message: 'Instructor not found' }, 404);

		await db.update(courses)
			.set({ instructor_id: instructor.id, faculty_name: instructor.name, updated_at: Math.floor(Date.now() / 1000) })
			.where(and(eq(courses.id, courseId), eq(courses.tenant_id, user.tenant_id)));

		return c.json({
			success: true,
			instructor: { id: instructor.id, name: instructor.name, email: instructor.email }
		});
	} catch (err: any) {
		return c.json({ success: false, message: err.message }, 500);
	}
});

export default app;
