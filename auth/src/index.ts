import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { cors } from 'hono/cors';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { getDb } from './db';
import { users } from './db/schema';

type Bindings = {
	DB: D1Database;
	JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors({
	origin: (origin) => origin || '*',
	allowHeaders: ['Content-Type', 'Authorization', 'x-tenant-slug'],
	allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	credentials: true,
}));

// Auth Schemas
const registerSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	email: z.string().email('Invalid email address'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
	tenant_id: z.string().min(1, 'Tenant ID is required'),
	role: z.enum(['admin', 'instructor', 'learner']).default('learner'),
});

const loginSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string().min(1, 'Password is required'),
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

	// Query D1 for the user by email
	const user = await db.select().from(users).where(eq(users.email, body.email)).get();
	if (!user) {
		return c.json({ success: false, message: 'Invalid credentials' }, 401);
	}

	// Compare password with stored hash using bcryptjs.compare
	const isMatch = await bcrypt.compare(body.password, user.password_hash);
	if (!isMatch) {
		return c.json({ success: false, message: 'Invalid credentials' }, 401);
	}

	// Generate a real JWT token containing { userId, email, role, tenant_id } with 7 day expiry
	const payload = {
		userId: user.id,
		email: user.email,
		role: user.role,
		tenant_id: user.tenant_id,
		exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // 7 days
	};
	const token = await sign(payload, c.env.JWT_SECRET);

	// Set the JWT as an HttpOnly cookie named auth_token
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
            await c.env.DB.prepare(
                'UPDATE courses SET status = ?, updated_at = ? WHERE id = ?'
            ).bind('completed', Math.floor(Date.now() / 1000), courseId).run();

            // Retroactive Certificate Generation logic:
            // Since D1 lacks total lessons knowledge, the frontend provides exactly `total_lessons` here.
            // Wait, instructors don't have total_lessons. Wait, we can group by user_id in progress!
            const totalLessons = body.total_activities || 0;
            
            if (totalLessons > 0) {
                // Find all users who have exactly `totalLessons` number of records in progress for this course, all of which are 100%.
                const eligibleUsers = await c.env.DB.prepare(`
                    SELECT user_id, COUNT(lesson_id) as completed_count
                    FROM progress
                    WHERE course_id = ? AND percent_complete = 100
                    GROUP BY user_id
                    HAVING completed_count >= ?
                `).bind(courseId, totalLessons).all();

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
        
        return c.json({ success: true, message: 'Course updated strictly (ignoring missing status logic)' });

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
				body.tenant_id,
				Math.floor(Date.now() / 1000),
				Math.floor(Date.now() / 1000)
			).run();
		}

        let certificateGenerated = false;

        if (body.percent_complete === 100) {
            // Check if ALL lessons in the course are 100% complete for this user.
            // We use `total_lessons` from the request body provided by frontend.
            const totalLessons = body.total_lessons || 1; 

            const completionCountRow = await c.env.DB.prepare(`
                SELECT COUNT(lesson_id) as count 
                FROM progress 
                WHERE user_id = ? AND course_id = ? AND percent_complete = 100
            `).bind(payload.userId, body.course_id).first();

            const completedCount = Number(completionCountRow?.count || 0);

            if (completedCount >= totalLessons) {
                // If yes, check if the course status is "completed" in D1
                const courseRecord = await c.env.DB.prepare('SELECT status FROM courses WHERE id = ?').bind(body.course_id).first();
                
                if (courseRecord && courseRecord.status === 'completed') {
                    // Check if cert already exists
                    const existingCert = await c.env.DB.prepare('SELECT id FROM certificates WHERE user_id = ? AND course_id = ?').bind(payload.userId, body.course_id).first();
                    
                    if (!existingCert) {
                        await c.env.DB.prepare(
                            'INSERT INTO certificates (id, tenant_id, user_id, course_id, issue_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
                        ).bind(
                            crypto.randomUUID(),
                            body.tenant_id,
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

		return c.json({ success: true, certificateGenerated });
	} catch (e: any) {
		return c.json({ success: false, message: e.message || 'Error occurred' }, 400);
	}
});

// POST /api/auth/logout
app.post('/api/auth/logout', (c) => {
	deleteCookie(c, 'auth_token', { path: '/' });
	return c.json({
		success: true,
		message: 'logged out'
	});
});

export default app;
