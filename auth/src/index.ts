import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { cors } from 'hono/cors';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import { eq, inArray, and, or, isNotNull, sql } from 'drizzle-orm';
import { getDb } from './db';
import { users, tenants, activities, submissions, enrollments, courses, progress, modules, certificates } from './db/schema';

type Bindings = {
	DB: D1Database;
	R2: R2Bucket;
	JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings, Variables: { user: any } }>();

app.use('*', cors({
	origin: 'http://localhost:5173',
	credentials: true,
	allowHeaders: ['Content-Type', 'Authorization', 'X-Tenant'],
	allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	exposeHeaders: ['Set-Cookie'],
}));

const jwtMiddleware = async (c: any, next: any) => {
	const token = getCookie(c, 'auth_token');
	if (!token) {
		return c.json({ success: false, message: 'Not authenticated' }, 401);
	}
	try {
		const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
		c.set('user', {
			id: payload.userId,
			email: payload.email,
			role: payload.role,
			tenantId: payload.tenant_id
		});
		await next();
	} catch (e) {
		return c.json({ success: false, message: 'Invalid token' }, 401);
	}
};

app.get('/api/tenants', async (c) => {
	try {
		const db = getDb(c.env);
		const allTenants = await db
			.select({
				id: tenants.id,
				name: tenants.name,
				slug: tenants.slug,
				logoUrl: tenants.logo_url,
			})
			.from(tenants)
			.orderBy(tenants.name);
		return c.json({ success: true, tenants: allTenants });
	} catch (err) {
		console.error('GET /api/tenants error:', err);
		return c.json({ error: String(err) }, 500);
	}
});

// Auth Schemas
const registerSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	email: z.string().email('Invalid email address'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
	tenant_id: z.string().min(1, 'Tenant ID is required'),
	role: z.enum(['admin', 'instructor', 'learner', 'super_admin']).default('learner'),
});

const loginSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string().min(1, 'Password is required'),
	tenantId: z.string().optional(),
});

app.get('/', (c) => {
	return c.text('LMS Auth API');
});

// POST /api/auth/register
app.post('/api/auth/register', zValidator('json', registerSchema), async (c) => {
	const body = c.req.valid('json');
	const db = getDb(c.env);

	// Check if email already exists
	const existingUser = await db.select().from(users).where(eq(users.email, body.email)).get();
	if (existingUser) {
		return c.json({ success: false, message: 'Email already registered' }, 400);
	}

	// Hash the password using bcryptjs with salt rounds of 10
	const passwordHash = await bcrypt.hash(body.password, 10);

	// Generate a UUID for the user id
	const userId = crypto.randomUUID();

	// Insert the new user into the users table in D1
	await db.insert(users).values({
		id: userId,
		tenant_id: body.tenant_id,
		name: body.name,
		email: body.email,
		password_hash: passwordHash,
		role: body.role,
		created_at: Math.floor(Date.now() / 1000),
		updated_at: Math.floor(Date.now() / 1000),
	});

	return c.json({ success: true, message: "User registered successfully" });
});

// POST /api/auth/login
app.post('/api/auth/login', zValidator('json', loginSchema), async (c) => {
	const body = c.req.valid('json');
	const db = getDb(c.env);

	// Special case — super admin bypasses tenant check
	if (body.email === 'superadmin@lms.com') {
		const user = await db.select().from(users).where(eq(users.email, body.email)).get();
		if (!user || user.role !== 'super_admin') {
			return c.json({ success: false, message: 'Invalid credentials' }, 401);
		}
		const isMatch = await bcrypt.compare(body.password, user.password_hash);
		if (!isMatch) {
			return c.json({ success: false, message: 'Invalid credentials' }, 401);
		}

		const payload = {
			userId: user.id,
			email: user.email,
			role: user.role,
			tenant_id: 'system',
			exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
		};
		const token = await sign(payload, c.env.JWT_SECRET);
		setCookie(c, 'auth_token', token, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'None',
			maxAge: 7 * 24 * 60 * 60
		});

		return c.json({
			success: true,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				tenantId: 'system'
			}
		});
	}

	// Normal users — validate tenant first
	if (!body.tenantId) {
		return c.json({ success: false, message: 'Please select your institution' }, 400);
	}

	// Find user scoped to this tenant only
	// Note: using raw preparation since complex 'and' with drizzle might need more imports or setup
	const user = await db.select().from(users).where(eq(users.email, body.email)).get();
	if (!user || user.tenant_id !== body.tenantId) {
		return c.json({ success: false, message: 'No account found for this email in the selected institution.' }, 401);
	}

	const isMatch = await bcrypt.compare(body.password, user.password_hash);
	if (!isMatch) {
		return c.json({ success: false, message: 'Invalid credentials' }, 401);
	}

	const payload = {
		userId: user.id,
		email: user.email,
		role: user.role,
		tenant_id: user.tenant_id,
		exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
	};
	const token = await sign(payload, c.env.JWT_SECRET);

	setCookie(c, 'auth_token', token, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'None',
		maxAge: 7 * 24 * 60 * 60
	});

	return c.json({
		success: true,
		user: {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			tenantId: user.tenant_id
		}
	});
});

// GET /api/auth/me
app.get('/api/auth/me', async (c) => {
	const token = getCookie(c, 'auth_token');
	if (!token) {
		return c.json({ success: false, message: 'Not authenticated' }, 401);
	}

	try {
		// Verify and decode the JWT
		const payload = await verify(token, c.env.JWT_SECRET, 'HS256');

		// Query D1 for the user by the userId in the JWT
		const db = getDb(c.env);
		const user = await db.select().from(users).where(eq(users.id, payload.userId as string)).get();

		if (!user) {
			return c.json({ success: false, message: 'User not found' }, 401);
		}

		return c.json({
			success: true,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				tenantId: user.tenant_id
			}
		});
	} catch (e) {
		return c.json({ success: false, message: 'Invalid token' }, 401);
	}
});

// GET /api/enrollments/me
app.get('/api/enrollments/me', async (c) => {
	const token = getCookie(c, 'auth_token');
	if (!token) return c.json({ success: false, message: 'Not authenticated' }, 401);

	try {
		const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
		const db = getDb(c.env);
		// Assuming an enrollments table exists natively in the namespace or we just do raw sql if needed, 
		// but since we added them to schema.ts, let's use the D1 client.

		// To avoid complex schema imports right now, we can use raw SQL if schema.ts is out of sync, 
		// but we updated schema.ts so let's import the schemas at the top.
		// Wait, schema.ts imports are at the top: import { users } from './db/schema';
		// We didn't import enrollments or progress there yet. We need to use db.select() from raw or just add it.
		// Let's use raw sql to be safe and fast for this step.
		const result = await c.env.DB.prepare('SELECT * FROM enrollments WHERE user_id = ?').bind(payload.userId).all();

		return c.json({ success: true, enrollments: result.results || [] });
	} catch (e) {
		return c.json({ success: false, message: 'Invalid token' }, 401);
	}
});

// POST /api/enrollments
app.post('/api/enrollments', async (c) => {
	const token = getCookie(c, 'auth_token');
	if (!token) return c.json({ success: false, message: 'Not authenticated' }, 401);

	try {
		const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
		const body = await c.req.json();

		const existing = await c.env.DB.prepare('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?').bind(payload.userId, body.course_id).first();
		if (existing) {
			return c.json({ success: true, alreadyEnrolled: true });
		}

		await c.env.DB.prepare(
			'INSERT INTO enrollments (id, user_id, course_id, tenant_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
		).bind(
			crypto.randomUUID(),
			payload.userId,
			body.course_id,
			body.tenant_id,
			Math.floor(Date.now() / 1000),
			Math.floor(Date.now() / 1000)
		).run();

		return c.json({ success: true });
	} catch (e: any) {
		return c.json({ success: false, message: e.message || 'Error occurred' }, 400);
	}
});

// GET /api/progress/me
app.get('/api/progress/me', async (c) => {
	const token = getCookie(c, 'auth_token');
	if (!token) return c.json({ success: false, message: 'Not authenticated' }, 401);

	try {
		const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
		const result = await c.env.DB.prepare('SELECT * FROM progress WHERE user_id = ?').bind(payload.userId).all();
		return c.json({ success: true, progress: result.results || [] });
	} catch (e) {
		return c.json({ success: false, message: 'Invalid token' }, 401);
	}
});

// =============================
// PHASE 8: CERTIFICATES & COURSES
// =============================

// PUT /api/courses/:id (Instructor Action)
app.put('/api/courses/:id', async (c) => {
	const token = getCookie(c, 'auth_token');
	if (!token) return c.json({ success: false, message: 'Not authenticated' }, 401);

	try {
        const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
		if (payload.role !== 'instructor' && payload.role !== 'admin') {
			return c.json({ success: false, message: 'Unauthorized' }, 403);
		}

		const courseId = c.req.param('id');
		const body = await c.req.json();
        
        if (body.status === 'completed') {
            // 1. Get accurate activity count from DB
            const activityCountRow = await c.env.DB.prepare(
                'SELECT COUNT(id) as count FROM activities WHERE course_id = ?'
            ).bind(courseId).first();
            const totalActivities = Number(activityCountRow?.count || 0);

            // 2. Update course status and total_activities
            await c.env.DB.prepare(
                'UPDATE courses SET status = ?, total_activities = ?, updated_at = ? WHERE id = ?'
            ).bind('completed', totalActivities, Math.floor(Date.now() / 1000), courseId).run();

            // 3. Retroactive Certificate Generation
            if (totalActivities > 0) {
                const eligibleUsers = await c.env.DB.prepare(`
                    SELECT user_id, COUNT(lesson_id) as completed_count
                    FROM progress
                    WHERE course_id = ? AND percent_complete = 100
                    GROUP BY user_id
                    HAVING completed_count >= ?
                `).bind(courseId, totalActivities).all();

                if (eligibleUsers.results) {
                    for (const row of eligibleUsers.results) {
                        const existingCert = await c.env.DB.prepare('SELECT id FROM certificates WHERE user_id = ? AND course_id = ?').bind(row.user_id, courseId).first();
                        
                        if (!existingCert) {
                            await c.env.DB.prepare(
                                'INSERT INTO certificates (id, tenant_id, user_id, course_id, issue_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
                            ).bind(
                                crypto.randomUUID(),
                                body.tenant_id || payload.tenant_id,
                                row.user_id,
                                courseId,
                                Math.floor(Date.now() / 1000),
                                Math.floor(Date.now() / 1000),
                                Math.floor(Date.now() / 1000)
                            ).run();
                        }
                    }
                }
            }

            return c.json({ success: true, message: 'Course marked completed and retroactive certificates generated' });
        }
        
        // Handle other updates (like title/description)
        await c.env.DB.prepare(
            'UPDATE courses SET title = ?, description = ?, instructor_id = ?, updated_at = ? WHERE id = ?'
        ).bind(
            body.title || '',
            body.description || '',
            body.instructor_id || payload.userId,
            Math.floor(Date.now() / 1000),
            courseId
        ).run();

        return c.json({ success: true, message: 'Course updated successfully' });

	} catch (e: any) {
		return c.json({ success: false, message: e.message || 'Error occurred' }, 400);
	}
});

// GET /api/certificates
app.get('/api/certificates', async (c) => {
	const token = getCookie(c, 'auth_token');
	if (!token) return c.json({ success: false, message: 'Not authenticated' }, 401);

	try {
		const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
		const result = await c.env.DB.prepare('SELECT * FROM certificates WHERE user_id = ?').bind(payload.userId).all();
		return c.json({ success: true, certificates: result.results || [] });
	} catch (e) {
		return c.json({ success: false, message: 'Invalid token' }, 401);
	}
});

// POST /api/progress
app.post('/api/progress', async (c) => {
	const token = getCookie(c, 'auth_token');
	if (!token) return c.json({ success: false, message: 'Not authenticated' }, 401);

	try {
		const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
		const body = await c.req.json();

		const existing = await c.env.DB.prepare(
			'SELECT id FROM progress WHERE user_id = ? AND course_id = ? AND lesson_id = ?'
		).bind(payload.userId, body.course_id, body.lesson_id).first();

		if (existing) {
			await c.env.DB.prepare(
				'UPDATE progress SET percent_complete = ?, updated_at = ? WHERE id = ?'
			).bind(body.percent_complete, Math.floor(Date.now() / 1000), existing.id).run();
		} else {
			await c.env.DB.prepare(
				'INSERT INTO progress (id, user_id, course_id, lesson_id, percent_complete, tenant_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
			).bind(
				crypto.randomUUID(),
				payload.userId,
				body.course_id,
				body.lesson_id,
				body.percent_complete,
				payload.tenant_id || body.tenant_id,
				Math.floor(Date.now() / 1000),
				Math.floor(Date.now() / 1000)
			).run();
		}

        let certificateGenerated = false;

        if (body.percent_complete === 100) {
            // 1. Get accurate activity count from DB
            const activityCountRow = await c.env.DB.prepare(
                'SELECT COUNT(id) as count FROM activities WHERE course_id = ?'
            ).bind(body.course_id).first();
            const totalActivities = Number(activityCountRow?.count || 0);

            if (totalActivities > 0) {
                // 2. Get completed count for this user
                const completionCountRow = await c.env.DB.prepare(`
                    SELECT COUNT(lesson_id) as count 
                    FROM progress 
                    WHERE user_id = ? AND course_id = ? AND percent_complete = 100
                `).bind(payload.userId, body.course_id).first();

                const completedCount = Number(completionCountRow?.count || 0);

                if (completedCount >= totalActivities) {
                    // 3. Check if course is marked complete by teacher
                    const courseRecord = await c.env.DB.prepare('SELECT status FROM courses WHERE id = ?').bind(body.course_id).first();
                    
                    if (courseRecord && courseRecord.status === 'completed') {
                        const existingCert = await c.env.DB.prepare('SELECT id FROM certificates WHERE user_id = ? AND course_id = ?').bind(payload.userId, body.course_id).first();
                        
                        if (!existingCert) {
                            await c.env.DB.prepare(
                                'INSERT INTO certificates (id, tenant_id, user_id, course_id, issue_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
                            ).bind(
                                crypto.randomUUID(),
                                payload.tenant_id || body.tenant_id,
                                payload.userId,
                                body.course_id,
                                Math.floor(Date.now() / 1000),
                                Math.floor(Date.now() / 1000),
                                Math.floor(Date.now() / 1000)
                            ).run();
                            
                            certificateGenerated = true;
                        }
                    }
                }
            }
        }

		return c.json({ success: true, certificateGenerated });
	} catch (e: any) {
		return c.json({ success: false, message: e.message || 'Error occurred' }, 400);
	}
});

// POST /api/auth/logout
// ----------------------------------------------------------------------------
// ASSIGNMENT & CALENDAR FEATURE ENDPOINTS
// ----------------------------------------------------------------------------

// Endpoint 1 — Create Assignment Activity (Updated)
const activitySchema = z.object({
	moduleId: z.string().min(1),
	title: z.string().min(1),
	type: z.enum(['blog', 'video', 'file', 'quiz', 'exam', 'live_class', 'submission']),
	content: z.string().optional(),
	fileUrl: z.string().optional(),
	videoUrl: z.string().optional(),
	duration: z.number().optional(),
	scheduledAt: z.string().optional(),
	meetLink: z.string().optional(),
	dueAt: z.string().optional(),
	order: z.number().default(0),
});

app.post('/api/courses/:courseId/activities', jwtMiddleware, zValidator('json', activitySchema), async (c) => {
	const user = c.get('user');
	const { courseId } = c.req.param();
	const body = c.req.valid('json');
	const db = getDb(c.env);

	try {
		const id = crypto.randomUUID();
		await db.insert(activities).values({
			id,
			moduleId: body.moduleId,
			courseId,
			tenantId: user.tenantId,
			title: body.title,
			type: body.type,
			content: body.content ?? null,
			fileUrl: body.fileUrl ?? null,
			videoUrl: body.videoUrl ?? null,
			duration: body.duration ?? null,
			scheduledAt: body.scheduledAt ?? null,
			meetLink: body.meetLink ?? null,
			dueAt: body.dueAt ?? null,
			order: body.order,
			createdAt: Math.floor(Date.now() / 1000),
			updatedAt: Math.floor(Date.now() / 1000),
		});

		return c.json({ success: true, activity: { id, ...body } });
	} catch (err) {
		console.error('POST /api/activities error:', err);
		return c.json({ error: String(err) }, 500);
	}
});

// Endpoint 2 — Student Submit Assignment
app.post('/api/activities/:activityId/submit', jwtMiddleware, async (c) => {
	const user = c.get('user');
	const { activityId } = c.req.param();
	const db = getDb(c.env);

	try {
		// 1. Get activity info to check due date
		const activity = await db.select().from(activities).where(and(eq(activities.id, activityId), eq(activities.tenantId, user.tenantId))).get();
		if (!activity) return c.json({ error: 'Activity not found' }, 404);

		// 2. Check if due date has passed
		if (activity.dueAt && new Date() > new Date(activity.dueAt)) {
			return c.json({ error: 'The due date for this assignment has passed.' }, 403);
		}

		// 3. Handle multipart form data
		const formData = await c.req.parseBody();
		const file = formData['file'] as File;
		if (!file) return c.json({ error: 'No file uploaded' }, 400);

		// 4. Validate file size (50MB)
		if (file.size > 50 * 1024 * 1024) return c.json({ error: 'File size exceeds 50MB limit' }, 400);

		// 5. Upload to R2
		const key = `submissions/${user.tenantId}/${activityId}/${user.id}-${Date.now()}-${file.name}`;
		await c.env.R2.put(key, file.stream(), {
			httpMetadata: { contentType: file.type }
		});

		// 6. Insert into submissions
		const submissionId = crypto.randomUUID();
		const submittedAt = new Date().toISOString();
		await db.insert(submissions).values({
			id: submissionId,
			activityId,
			userId: user.id,
			courseId: activity.courseId!,
			tenantId: user.tenantId,
			fileUrl: key,
			fileName: file.name,
			fileType: file.type,
			fileSize: file.size,
			submittedAt,
			dueAt: activity.dueAt ?? null,
		});

		// 7. Mark as done in progress (Upsert)
		const existingProgress = await db.select().from(progress).where(and(
			eq(progress.user_id, user.id),
			eq(progress.course_id, activity.courseId!),
			eq(progress.lesson_id, activityId)
		)).get();

		if (existingProgress) {
			await db.update(progress).set({
				percent_complete: 100,
				updated_at: Math.floor(Date.now() / 1000)
			}).where(eq(progress.id, (existingProgress as any).id)).run();
		} else {
			await db.insert(progress).values({
				id: crypto.randomUUID(),
				user_id: user.id,
				course_id: activity.courseId!,
				lesson_id: activityId,
				percent_complete: 100,
				tenant_id: user.tenantId,
				created_at: Math.floor(Date.now() / 1000),
				updated_at: Math.floor(Date.now() / 1000)
			}).run();
		}

		return c.json({ success: true, submission: { id: submissionId, fileName: file.name, submittedAt, dueAt: activity.dueAt } });
	} catch (err) {
		console.error('POST /submit error:', err);
		return c.json({ error: String(err) }, 500);
	}
});

// Endpoint 3 — Get All Submissions for an Activity
app.get('/api/activities/:activityId/submissions', jwtMiddleware, async (c) => {
	const user = c.get('user');
	if (user.role !== 'instructor' && user.role !== 'admin') {
		return c.json({ error: 'Unauthorized' }, 403);
	}
	const { activityId } = c.req.param();
	const db = getDb(c.env);

	try {
		const subs = await db.select({
			id: submissions.id,
			fileName: submissions.fileName,
			fileType: submissions.fileType,
			fileSize: submissions.fileSize,
			submittedAt: submissions.submittedAt,
			dueAt: submissions.dueAt,
			grade: submissions.grade,
			feedback: submissions.feedback,
			gradedAt: submissions.gradedAt,
			studentName: users.name,
			studentEmail: users.email,
			isLate: sql<number>`CASE WHEN ${submissions.dueAt} IS NOT NULL AND ${submissions.submittedAt} > ${submissions.dueAt} THEN 1 ELSE 0 END`,
		})
		.from(submissions)
		.innerJoin(users, eq(submissions.userId, users.id))
		.where(and(
			eq(submissions.activityId, activityId),
			eq(submissions.tenantId, user.tenantId)
		))
		.orderBy(submissions.submittedAt);

		return c.json({ success: true, submissions: subs });
	} catch (err) {
		console.error('GET /submissions error:', err);
		return c.json({ error: String(err) }, 500);
	}
});

// Endpoint 4 — Grade a Submission
app.put('/api/submissions/:submissionId/grade', jwtMiddleware, zValidator('json', z.object({
	grade: z.string().min(1),
	feedback: z.string().optional(),
})), async (c) => {
	const user = c.get('user');
	if (user.role !== 'instructor' && user.role !== 'admin') {
		return c.json({ error: 'Unauthorized' }, 403);
	}
	const { submissionId } = c.req.param();
	const body = c.req.valid('json');
	const db = getDb(c.env);

	try {
		await db.update(submissions)
			.set({
				grade: body.grade,
				feedback: body.feedback ?? null,
				gradedAt: new Date().toISOString(),
				gradedBy: user.id,
			})
			.where(and(
				eq(submissions.id, submissionId),
				eq(submissions.tenantId, user.tenantId)
			));

		return c.json({ success: true });
	} catch (err) {
		console.error('PUT /grade error:', err);
		return c.json({ error: String(err) }, 500);
	}
});

// Endpoint 5 — Calendar Events for a Student
app.get('/api/calendar/events', jwtMiddleware, async (c) => {
	const user = c.get('user');
	const db = getDb(c.env);

	try {
		const enrolled = await db.select({ courseId: enrollments.course_id })
			.from(enrollments)
			.where(and(
				eq(enrollments.user_id, user.id),
				eq(enrollments.tenant_id, user.tenantId)
			));

		const courseIds = enrolled.map(e => e.courseId);
		if (courseIds.length === 0) return c.json({ success: true, events: [] });

		const results = await db.select({
			id: activities.id,
			title: activities.title,
			type: activities.type,
			dueAt: activities.dueAt,
			scheduledAt: activities.scheduledAt,
			courseId: activities.courseId,
			courseName: courses.title,
		})
		.from(activities)
		.innerJoin(courses, eq(activities.courseId, courses.id))
		.where(and(
			inArray(activities.courseId, courseIds),
			eq(activities.tenantId, user.tenantId),
			or(
				isNotNull(activities.dueAt),
				isNotNull(activities.scheduledAt)
			)
		))
		.orderBy(activities.dueAt, activities.scheduledAt);

		const events = results.map(a => ({
			id: a.id,
			title: a.title,
			type: a.type,
			courseName: a.courseName,
			courseId: a.courseId,
			date: a.dueAt ?? a.scheduledAt,
			eventKind: a.dueAt ? 'deadline' : 'session',
		}));

		return c.json({ success: true, events });
	} catch (err) {
		console.error('GET /calendar/events error:', err);
		return c.json({ error: String(err) }, 500);
	}
});

// Endpoint 6 — Get Student's Own Submission
app.get('/api/activities/:activityId/my-submission', jwtMiddleware, async (c) => {
	const user = c.get('user');
	const { activityId } = c.req.param();
	const db = getDb(c.env);

	try {
		const submission = await db.select()
			.from(submissions)
			.where(and(
				eq(submissions.activityId, activityId),
				eq(submissions.userId, user.id),
				eq(submissions.tenantId, user.tenantId)
			))
			.get();

		return c.json({ success: true, submission: submission ?? null });
	} catch (err) {
		console.error('GET /my-submission error:', err);
		return c.json({ error: String(err) }, 500);
	}
});

// Additional Helpers to make Frontend work
app.get('/api/courses', jwtMiddleware, async (c) => {
	const user = c.get('user');
	const db = getDb(c.env);
	try {
		const results = await db.select().from(courses).where(eq(courses.tenant_id, user.tenantId)).all();
		return c.json({ success: true, courses: results });
	} catch (err) {
		return c.json({ error: String(err) }, 500);
	}
});

app.get('/api/courses/:id', jwtMiddleware, async (c) => {
	const user = c.get('user');
	const { id } = c.req.param();
	const db = getDb(c.env);
	try {
		const course = await db.select().from(courses).where(and(eq(courses.id, id), eq(courses.tenant_id, user.tenantId))).get();
		if (!course) return c.json({ error: 'Course not found' }, 404);

		// Get modules and activities
		const resultsModules = await db.select().from(modules).where(eq(modules.courseId, id)).all();
		const allActivities = await db.select().from(activities).where(eq(activities.courseId, id)).all();

		const resultModules = resultsModules.map((m: any) => ({
			...m,
			activities: allActivities.filter((a: any) => a.moduleId === m.id)
		}));

		return c.json({ success: true, course: { ...course, modules: resultModules } });
	} catch (err) {
		return c.json({ error: String(err) }, 500);
	}
});

app.post('/api/courses/:courseId/modules', jwtMiddleware, zValidator('json', z.object({ title: z.string(), orderIndex: z.number().optional() })), async (c) => {
	const user = c.get('user');
	const { courseId } = c.req.param();
	const body = c.req.valid('json');
	const db = getDb(c.env);
	try {
		const id = crypto.randomUUID();
		await db.insert(modules).values({
			id,
			courseId: courseId,
			title: body.title,
			orderIndex: body.orderIndex ?? 0,
			tenantId: user.tenantId,
			created_at: Math.floor(Date.now() / 1000),
			updated_at: Math.floor(Date.now() / 1000)
		}).run();
		return c.json({ success: true, module: { id, title: body.title } });
	} catch (err) {
		return c.json({ error: String(err) }, 500);
	}
});

app.post('/api/auth/logout', (c) => {
	deleteCookie(c, 'auth_token', { path: '/' });
	return c.json({
		success: true,
		message: 'logged out'
	});
});

export default app;
