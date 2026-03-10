import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

type Bindings = {
	DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// Auth Schemas
const registerSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	email: z.string().email('Invalid email address'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
	tenant_id: z.string().min(1, 'Tenant ID is required'),
});

const loginSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string().min(1, 'Password is required'),
});

app.get('/', (c) => {
	return c.text('LMS Auth API');
});

// POST /api/auth/register
app.post('/api/auth/register', zValidator('json', registerSchema), (c) => {
	return c.json({
		success: true,
		message: 'register stub ok',
	});
});

// POST /api/auth/login
app.post('/api/auth/login', zValidator('json', loginSchema), (c) => {
	return c.json({
		success: true,
		message: 'login stub ok',
	});
});

export default app;
