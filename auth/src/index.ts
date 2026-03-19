import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { cors } from 'hono/cors';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import { eq, and, ne, sql, gt, isNull, inArray } from 'drizzle-orm';
import { getDb } from './db';
import { users, tenants, enrollments, courses, progress, certificates, submissions, modules, activities, liveSessions, quizAttempts, userEvents } from './db/schema';
import { Context, Next } from 'hono';

type Bindings = {
	DB: D1Database;
	JWT_SECRET: string;
	GROQ_API_KEY?: string;
	R2: R2Bucket;
};

type Variables = {
	user: any;
};

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>();

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

	// ── Super admin bypass — no tenantId required ──────────────────
	if (!body.tenantId) {
		const superAdmin = await db.select()
			.from(users)
			.where(and(
				eq(users.email, body.email),
				eq(users.role, 'super_admin')
			))
			.get();

		if (!superAdmin) {
			return c.json({ success: false, message: 'Tenant is required for non-admin users.' }, 400);
		}

		const match = await bcrypt.compare(body.password, superAdmin.password_hash);
		if (!match) return c.json({ success: false, message: 'Invalid credentials.' }, 401);

		const payload = { userId: superAdmin.id, email: superAdmin.email, role: superAdmin.role, tenant_id: 'system', exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 };
		const token = await sign(payload, c.env.JWT_SECRET);
		setCookie(c, 'auth_token', token, { path: '/', httpOnly: true, secure: true, sameSite: 'None', maxAge: 7 * 24 * 60 * 60 });

		return c.json({ 
			success: true, 
			user: { id: superAdmin.id, name: superAdmin.name, email: superAdmin.email, role: superAdmin.role, tenantId: 'system' } 
		});
	}

	// ── Normal user login continues below ─────────────────────────
	const user = await db.select().from(users).where(and(eq(users.email, body.email), eq(users.tenant_id, body.tenantId))).get();

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
	const id = c.req.param('id') as string;
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

		// Attach active meetLink for live classes
		const activeLiveSessions = await db.select().from(liveSessions).where(isNull(liveSessions.ended_at)).all();
		const finalActivities = allActivities.map(a => {
			const s = activeLiveSessions.find(ls => ls.activity_id === a.id);
			return { ...a, meetLink: s?.meet_link };
		});

		const resultModules = courseModules.map(m => ({
			...m,
			order: m.order_index,
			activities: finalActivities.filter(a => a.section_id === m.id).map(a => ({
				...a,
				order: a.order_index,
			}))
		}));

		return c.json({
			success: true,
			course: {
				...course,
				name: course.title,
				faculty: course.faculty_name || 'Unassigned',
				facultyInitial: (course.faculty_name || '??').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
				modules: resultModules
			}
		});
	} catch (err: any) {
		return c.json({ success: false, message: err.message }, 500);
	}
});

app.put('/api/courses/:courseId', jwtMiddleware, requireRole('instructor', 'admin', 'super_admin'), async (c) => {
	const { courseId } = c.req.param();
	const user = c.get('user');
	const body = await c.req.json();
	const db = getDb(c.env);

	const schema = z.object({
		title: z.string().min(1).optional(),
		section: z.string().optional(),
		category: z.string().optional(),
		description: z.string().optional(),
		thumbnailColor: z.string().optional(),
		instructor_id: z.string().optional(),
		facultyName: z.string().optional(),
	});

	const parsed = schema.safeParse(body);
	if (!parsed.success) {
		return c.json({ success: false, error: parsed.error.flatten() }, 400);
	}

	try {
		const existing = await db.select()
			.from(courses)
			.where(and(
				eq(courses.id, courseId),
				eq(courses.tenant_id, user.tenant_id)
			))
			.get();

		if (!existing) return c.json({ success: false, error: 'Course not found' }, 404);

		if (parsed.data.instructor_id) {
			const instructor = await db.select()
				.from(users)
				.where(and(
					eq(users.id, parsed.data.instructor_id),
					eq(users.tenant_id, user.tenant_id),
					eq(users.role, 'instructor')
				))
				.get();

			if (!instructor) {
				return c.json({ success: false, error: 'Instructor not found in this tenant' }, 404);
			}

			parsed.data.facultyName = instructor.name;
		}

		const updateData: Record<string, unknown> = {};
		if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
		if (parsed.data.section !== undefined) updateData.section = parsed.data.section;
		if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
		if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
		if (parsed.data.thumbnailColor !== undefined) updateData.thumbnail_color = parsed.data.thumbnailColor;
		if (parsed.data.instructor_id !== undefined) updateData.instructor_id = parsed.data.instructor_id;
		if (parsed.data.facultyName !== undefined) updateData.faculty_name = parsed.data.facultyName;
		updateData.updated_at = Math.floor(Date.now() / 1000);

		await db.update(courses)
			.set(updateData)
			.where(and(
				eq(courses.id, courseId),
				eq(courses.tenant_id, user.tenant_id)
			));

		const updated = await db.select()
			.from(courses)
			.where(eq(courses.id, courseId))
			.get();

		return c.json({ success: true, course: updated });
	} catch (err: any) {
		console.error('PUT /api/courses/:courseId error:', err);
		return c.json({ success: false, error: String(err) }, 500);
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

app.post('/api/upload/lesson-file', jwtMiddleware, requireRole('instructor', 'admin'), async (c) => {
	const user = c.get('user');
	const formData = await c.req.formData();
	const file = formData.get('file') as File;

	if (!file) return c.json({ error: 'No file provided' }, 400);
	if (file.size > 100 * 1024 * 1024) return c.json({ error: 'Max file size is 100MB' }, 413);

	try {
		const key = `lessons/${user.tenant_id}/${crypto.randomUUID()}-${file.name}`;
		await c.env.R2.put(key, file.stream(), {
			httpMetadata: { contentType: file.type }
		});
		return c.json({
			fileUrl:  `/api/files/${key}`,
			fileName: file.name,
			fileType: file.type,
			fileSize: file.size,
		});
	} catch (err) {
		return c.json({ error: String(err) }, 500);
	}
});

app.get('/api/files/*', async (c) => {
	const path = c.req.path.replace('/api/files/', '');
	const object = await c.env.R2.get(path);
	if (!object) return c.json({ error: 'Not found' }, 404);
	
	const headers = new Headers();
	object.writeHttpMetadata(headers);
	headers.set('etag', object.httpEtag);
	return new Response(object.body, { headers });
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

app.post('/api/activities/:activityId/submit', jwtMiddleware, requireRole('learner'), async (c) => {
	const activityId = c.req.param('activityId') as string;
	const user = c.get('user');
	const formData = await c.req.formData();
	const file = formData.get('file') as File;
	if (!file) return c.json({ success: false, error: 'No file' }, 400);

	const db = getDb(c.env);
	try {
			const key = `submissions/${user.tenant_id}/${activityId}/${crypto.randomUUID()}-${file.name}`;
			await c.env.R2.put(key, file.stream(), {
					httpMetadata: { contentType: file.type }
			});

			const fileUrl = `/api/files/${key}`;
			const now = Math.floor(Date.now() / 1000);

			const subId = crypto.randomUUID();
			await db.insert(submissions).values({
					id: subId,
					tenant_id: user.tenant_id,
					activity_id: activityId,
					user_id: user.userId,
					file_url: fileUrl,
					file_name: file.name,
					status: 'pending',
					created_at: now,
					updated_at: now,
			} as any);

			const newSub = await db.select().from(submissions).where(eq(submissions.id, subId)).get();
			return c.json({ success: true, submission: { ...newSub, submittedAt: newSub?.created_at ? newSub.created_at * 1000 : Date.now() } });
	} catch (err: any) {
			return c.json({ success: false, error: err.message }, 500);
	}
});

app.get('/api/activities/:activityId/submissions', jwtMiddleware, requireRole('instructor', 'admin'), async (c) => {
	const activityId = c.req.param('activityId') as string;
	const user = c.get('user');
	const db = getDb(c.env);
	try {
			const subs = await db.select({
					id: submissions.id,
					studentName: users.name,
					fileUrl: submissions.file_url,
					fileName: submissions.file_name,
					submittedAt: submissions.created_at,
					grade: submissions.grade,
					feedback: submissions.feedback,
					status: submissions.status,
			}).from(submissions)
				.innerJoin(users, eq(submissions.user_id, users.id))
				.where(and(eq(submissions.activity_id, activityId), eq(submissions.tenant_id, user.tenant_id)));

			return c.json({ 
					success: true, 
					submissions: subs.map(s => ({
							...s,
							submittedAt: s.submittedAt * 1000,
							isLate: 0 
					}))
			});
	} catch (err: any) {
			return c.json({ success: false, error: err.message }, 500);
	}
});

app.get('/api/activities/:activityId/my-submission', jwtMiddleware, requireRole('learner'), async (c) => {
	const activityId = c.req.param('activityId') as string;
	const user = c.get('user');
	const db = getDb(c.env);
	try {
			const sub = await db.select().from(submissions)
					.where(and(eq(submissions.activity_id, activityId), eq(submissions.user_id, user.userId))).get();
			if (!sub) return c.json({ success: false });
			return c.json({ 
					success: true, 
					submission: {
							...sub,
							submittedAt: sub.created_at * 1000
					}
			});
	} catch (err: any) {
			return c.json({ success: false, error: err.message }, 500);
	}
});

app.put('/api/submissions/:subId/grade', jwtMiddleware, requireRole('instructor', 'admin'), async (c) => {
	const subId = c.req.param('subId') as string;
	const user = c.get('user');
	const body = await c.req.json();
	const db = getDb(c.env);
	try {
			await db.update(submissions)
					.set({ 
							grade: typeof body.grade === 'string' ? parseFloat(body.grade) : body.grade, 
							feedback: body.feedback,
							status: 'graded',
							updated_at: Math.floor(Date.now() / 1000)
					})
					.where(and(eq(submissions.id, subId), eq(submissions.tenant_id, user.tenant_id)));
			return c.json({ success: true });
	} catch (err: any) {
			return c.json({ success: false, error: err.message }, 500);
	}
});

app.post('/api/live-sessions/create', jwtMiddleware, requireRole('instructor', 'admin'), async (c) => {
	const user = c.get('user');
	const body = await c.req.json();
	const db = getDb(c.env);

	if (!body.activityId) return c.json({ success: false, error: 'Activity ID required' }, 400);

	try {
			const existing = await db.select().from(liveSessions)
					.where(and(eq(liveSessions.activity_id, body.activityId), isNull(liveSessions.ended_at)))
					.get();

			if (existing) return c.json({ success: true, session: existing });

			const sessionId = crypto.randomUUID();
			const now = Math.floor(Date.now() / 1000);
			const randomCode = () => Math.random().toString(36).substring(2, 5);
			const mockLink = `https://meet.google.com/${randomCode()}-${randomCode()}-${randomCode()}`;

			await db.insert(liveSessions).values({
					id: sessionId,
					activity_id: body.activityId,
					meet_link: mockLink,
					start_time: now,
					created_at: now,
					updated_at: now,
			});

			const session = await db.select().from(liveSessions).where(eq(liveSessions.id, sessionId)).get();
			return c.json({ success: true, session });
	} catch (err: any) {
			return c.json({ success: false, error: err.message }, 500);
	}
});

app.post('/api/quizzes/:quizId/submit', jwtMiddleware, requireRole('learner'), async (c) => {
	const quizId = c.req.param('quizId') as string;
	const user = c.get('user');
	const body = await c.req.json();
	const db = getDb(c.env);
	
	const existing = await db.select().from(quizAttempts).where(and(eq(quizAttempts.activity_id, quizId), eq(quizAttempts.user_id, user.userId))).get();
	if (existing) return c.json({ success: true, attempt: existing });

	const activity = await db.select().from(activities).where(eq(activities.id, quizId)).get();
	if (!activity) return c.json({ success: false, error: 'Quiz not found' }, 404);

	let maxScore = 0;
	let score = 0;
	
	try {
			const contentStr = activity.content || '{}';
			const parsed = JSON.parse(contentStr);
			const questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
			
			maxScore = questions.length;
			questions.forEach((q: any) => {
					const correctStr = q.options[q.correctAnswerIndex];
					if (body.answers && body.answers[q.id] === correctStr) {
							score++;
					}
			});
	} catch {}

	const now = Math.floor(Date.now() / 1000);
	const attemptId = crypto.randomUUID();

	await db.insert(quizAttempts).values({
			id: attemptId,
			tenant_id: user.tenant_id,
			activity_id: quizId,
			user_id: user.userId,
			score,
			max_score: maxScore,
			answers_json: JSON.stringify(body.answers || {}),
			is_published: 0,
			created_at: now,
			updated_at: now,
	});

	return c.json({ success: true, score, maxScore });
});

app.get('/api/quizzes/:quizId/attempts', jwtMiddleware, requireRole('instructor', 'admin'), async (c) => {
	const quizId = c.req.param('quizId') as string;
	const user = c.get('user');
	const db = getDb(c.env);

	try {
			const attempts = await db.select({
					id: quizAttempts.id,
					studentName: users.name,
					score: quizAttempts.score,
					maxScore: quizAttempts.max_score,
					modifiedScore: quizAttempts.modified_score,
					instructorNote: quizAttempts.instructor_note,
					isPublished: quizAttempts.is_published,
					submittedAt: quizAttempts.created_at,
			}).from(quizAttempts)
			.innerJoin(users, eq(quizAttempts.user_id, users.id))
			.where(and(eq(quizAttempts.activity_id, quizId), eq(quizAttempts.tenant_id, user.tenant_id)));

			return c.json({ success: true, attempts });
	} catch(err: any) {
			return c.json({ success: false, error: err.message }, 500);
	}
});

app.get('/api/quiz-attempts/:attemptId/answers', jwtMiddleware, requireRole('instructor', 'admin'), async (c) => {
	const attemptId = c.req.param('attemptId') as string;
	const user = c.get('user');
	const db = getDb(c.env);
	
	const attempt = await db.select().from(quizAttempts).where(and(eq(quizAttempts.id, attemptId), eq(quizAttempts.tenant_id, user.tenant_id))).get();
	if (!attempt) return c.json({ success: false, error: 'Not found' }, 404);

	return c.json({ success: true, answers: JSON.parse(attempt.answers_json) });
});

app.put('/api/quiz-attempts/:attemptId/score', jwtMiddleware, requireRole('instructor', 'admin'), async (c) => {
	const attemptId = c.req.param('attemptId') as string;
	const user = c.get('user');
	const body = await c.req.json();
	const db = getDb(c.env);
	
	await db.update(quizAttempts)
			.set({
					modified_score: body.modifiedScore,
					instructor_note: body.instructorNote,
					updated_at: Math.floor(Date.now() / 1000)
			})
			.where(and(eq(quizAttempts.id, attemptId), eq(quizAttempts.tenant_id, user.tenant_id)));
	
	return c.json({ success: true });
});

app.post('/api/quiz-attempts/:attemptId/publish', jwtMiddleware, requireRole('instructor', 'admin'), async (c) => {
	const attemptId = c.req.param('attemptId') as string;
	const user = c.get('user');
	const db = getDb(c.env);
	
	await db.update(quizAttempts)
			.set({ is_published: 1, updated_at: Math.floor(Date.now() / 1000) })
			.where(and(eq(quizAttempts.id, attemptId), eq(quizAttempts.tenant_id, user.tenant_id)));
	
	return c.json({ success: true });
});

app.post('/api/quizzes/:quizId/publish-all', jwtMiddleware, requireRole('instructor', 'admin'), async (c) => {
	const quizId = c.req.param('quizId') as string;
	const user = c.get('user');
	const db = getDb(c.env);
	
	await db.update(quizAttempts)
			.set({ is_published: 1, updated_at: Math.floor(Date.now() / 1000) })
			.where(and(eq(quizAttempts.activity_id, quizId), eq(quizAttempts.tenant_id, user.tenant_id)));
	
	return c.json({ success: true });
});

app.get('/api/quizzes/:quizId/my-result', jwtMiddleware, requireRole('learner'), async (c) => {
	const quizId = c.req.param('quizId') as string;
	const user = c.get('user');
	const db = getDb(c.env);
	
	const attempt = await db.select().from(quizAttempts)
			.where(and(eq(quizAttempts.activity_id, quizId), eq(quizAttempts.user_id, user.userId)))
			.get();

	if (!attempt) return c.json({ success: true, result: null });
	
	return c.json({ 
			success: true, 
			result: {
					score: attempt.score,
					maxScore: attempt.max_score,
					modifiedScore: attempt.modified_score,
					instructorNote: attempt.instructor_note,
					isPublished: attempt.is_published === 1,
					submittedAt: attempt.created_at * 1000
			}
	});
});

app.get('/api/user-events', jwtMiddleware, async (c) => {
	const user = c.get('user');
	const db = getDb(c.env);
	try {
			const events = await db.select().from(userEvents)
					.where(and(eq(userEvents.user_id, user.userId), eq(userEvents.tenant_id, user.tenant_id)))
					.orderBy(userEvents.date_time);
			return c.json({ success: true, events });
	} catch (err: any) {
			return c.json({ success: false, error: err.message }, 500);
	}
});

app.post('/api/user-events', jwtMiddleware, async (c) => {
	const user = c.get('user');
	const body = await c.req.json();
	const db = getDb(c.env);
	
	if (!body.title || !body.dateTime) return c.json({ success: false, error: 'Missing title or dateTime' }, 400);

	const eventId = crypto.randomUUID();
	const now = Math.floor(Date.now() / 1000);

	try {
			await db.insert(userEvents).values({
					id: eventId,
					tenant_id: user.tenant_id,
					user_id: user.userId,
					title: body.title,
					date_time: body.dateTime,
					created_at: now,
			});
			const newEvent = await db.select().from(userEvents).where(eq(userEvents.id, eventId)).get();
			return c.json({ success: true, event: newEvent });
	} catch (err: any) {
			return c.json({ success: false, error: err.message }, 500);
	}
});

app.delete('/api/user-events/:eventId', jwtMiddleware, async (c) => {
	const eventId = c.req.param('eventId') as string;
	const user = c.get('user');
	const db = getDb(c.env);
	
	try {
			await db.delete(userEvents)
					.where(and(eq(userEvents.id, eventId), eq(userEvents.user_id, user.userId), eq(userEvents.tenant_id, user.tenant_id)));
			return c.json({ success: true });
	} catch (err: any) {
			return c.json({ success: false, error: err.message }, 500);
	}
});

app.get('/api/profile', jwtMiddleware, async (c) => {
	const user = c.get('user');
	const db = getDb(c.env);
	try {
			const profile = await db.select().from(users).where(eq(users.id, user.userId)).get();
			if (!profile) return c.json({ success: false, error: 'User not found' }, 404);
			
			const { password_hash, ...safeProfile } = profile;
			return c.json({ success: true, profile: safeProfile });
	} catch (err: any) {
			return c.json({ success: false, error: err.message }, 500);
	}
});

app.put('/api/profile', jwtMiddleware, async (c) => {
	const user = c.get('user');
	const body = await c.req.json();
	const db = getDb(c.env);
	try {
			await db.update(users)
					.set({
							name: body.name,
							bio: body.bio,
							phone: body.phone,
							location: body.location,
							website: body.website,
							linkedin: body.linkedin,
							github: body.github,
							updated_at: Math.floor(Date.now() / 1000)
					} as any)
					.where(eq(users.id, user.userId));
			return c.json({ success: true });
	} catch (err: any) {
			return c.json({ success: false, error: err.message }, 500);
	}
});

app.post('/api/profile/avatar', jwtMiddleware, async (c) => {
	const user = c.get('user');
	const formData = await c.req.formData();
	const file = formData.get('file') as File;
	if (!file) return c.json({ success: false, error: 'No file' }, 400);

	const db = getDb(c.env);
	try {
			const key = `avatars/${user.userId}/${crypto.randomUUID()}-${file.name}`;
			await c.env.R2.put(key, file.stream(), {
					httpMetadata: { contentType: file.type }
			});

			const avatarUrl = `/api/files/${key}`;
			await db.update(users)
					.set({ avatar_url: avatarUrl, updated_at: Math.floor(Date.now() / 1000) } as any)
					.where(eq(users.id, user.userId));

			return c.json({ success: true, avatarUrl });
	} catch (err: any) {
			return c.json({ success: false, error: err.message }, 500);
	}
});

app.post('/api/courses', jwtMiddleware, requireRole('instructor', 'admin', 'super_admin'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const db = getDb(c.env);

  const schema = z.object({
    name:        z.string().optional(),
    title:       z.string().optional(),
    section:     z.string().optional(),
    category:    z.string().optional(),
    description: z.string().optional(),
		thumbnailColor: z.string().optional(),
		instructorId: z.string().optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    console.error('POST /api/courses validation failed:', parsed.error.flatten());
    return c.json({ success: false, error: parsed.error.flatten() }, 400);
  }

  const courseTitle = parsed.data.title || parsed.data.name;
  if (!courseTitle || courseTitle.trim().length === 0) {
    return c.json({ success: false, error: 'Course name/title is required' }, 400);
  }

  try {
    const id = crypto.randomUUID();
    await db.insert(courses).values({
      id,
      tenant_id:    user.tenant_id,
      title:        courseTitle,
      section:     parsed.data.section ?? '',
      category:    parsed.data.category ?? 'Default',
			thumbnail_color: parsed.data.thumbnailColor ?? null,
      description: parsed.data.description ?? null,
      faculty_name: user.name,
      instructor_id: parsed.data.instructorId ?? user.userId,
      created_at:   Math.floor(Date.now() / 1000),
      updated_at:   Math.floor(Date.now() / 1000),
      status:       'draft'
    });
    return c.json({ success: true, course: { id, name: parsed.data.name } }, 201);
  } catch (err) {
    console.error('POST /api/courses insert failed:', err);
    return c.json({ success: false, error: String(err) }, 500);
  }
});

app.get('/api/superadmin/stats', jwtMiddleware, requireRole('super_admin'), async (c) => {
  const db = getDb(c.env);
  try {
    const tenantsList = await db.select().from(tenants).all();
    const usersList = await db.select().from(users).where(sql`role != 'super_admin'`).all();
    const coursesList = await db.select().from(courses).all();
    
    return c.json({
      success: true,
      totalTenants: tenantsList.length,
      totalUsers:   usersList.length,
      totalCourses: coursesList.length,
    });
  } catch (err) {
    return c.json({ success: false, error: String(err) }, 500);
  }
});

app.get('/api/superadmin/tenants', jwtMiddleware, requireRole('super_admin'), async (c) => {
  const db = getDb(c.env);
  try {
    const tenantList = await db.select({
      id:      tenants.id,
      name:    tenants.name,
      slug:    tenants.slug,
      logo_url: tenants.logo_url,
      user_count: sql<number>`(SELECT COUNT(*) FROM users WHERE users.tenant_id = tenants.id AND users.role != 'super_admin')`,
      course_count: sql<number>`(SELECT COUNT(*) FROM courses WHERE courses.tenant_id = tenants.id)`,
      admin_email: sql<string>`(SELECT email FROM users WHERE users.tenant_id = tenants.id AND users.role = 'admin' LIMIT 1)`,
    })
    .from(tenants)
    .where(sql`${tenants.id} != 'system'`)
    .orderBy(tenants.name);

    return c.json({ success: true, tenants: tenantList });
  } catch (err) {
    return c.json({ success: false, error: String(err) }, 500);
  }
});

app.get('/api/superadmin/users', jwtMiddleware, requireRole('super_admin'), async (c) => {
  const db = getDb(c.env);
  try {
    const userList = await db.select({
      id:        users.id,
      name:      users.name,
      email:     users.email,
      role:      users.role,
      tenant_id:  users.tenant_id,
      tenant_name: sql<string>`(SELECT name FROM tenants WHERE tenants.id = users.tenant_id)`,
      created_at: users.created_at,
    })
    .from(users)
    .where(sql`${users.role} != 'super_admin'`)
    .orderBy(users.created_at);

    return c.json({ success: true, users: userList });
  } catch (err) {
    return c.json({ success: false, error: String(err) }, 500);
  }
});

export default app;
