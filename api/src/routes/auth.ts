import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Env, Variables } from '../types/env';

const auth = new Hono<{ Bindings: Env; Variables: Variables }>();

// Auth Schemas (same as before)
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

// POST /api/auth/register
auth.post('/register', zValidator('json', registerSchema), (c) => {
    return c.json({
        success: true,
        message: 'register stub ok',
    });
});

// POST /api/auth/login
auth.post('/login', zValidator('json', loginSchema), (c) => {
    return c.json({
        success: true,
        message: 'login stub ok',
    });
});

export default auth;
