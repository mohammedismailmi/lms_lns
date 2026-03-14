import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

const app = new Hono();

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

// GET /api/auth/me
app.get('/api/auth/me', (c) => {
    let token = getCookie(c, 'auth_token');

    if (!token) {
        const authHeader = c.req.header('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
    }

    // If no token, return success: false so the frontend knows they aren't logged in
    if (!token) {
        return c.json({ success: false, message: 'Not authenticated' }, 401);
    }

    // Determine role from the mock token string we set during login
    let role = 'learner';
    if (token.includes('admin')) role = 'admin';
    else if (token.includes('instructor')) role = 'instructor';
    else if (token.includes('learner')) role = 'learner';

    // Set a matching mock name based on role to avoid confusion 
    // (since we don't store the name in the cookie in this basic stub)
    let mockName = 'Test User';
    if (role === 'learner') mockName = 'Arjun Mehta';
    if (role === 'instructor') mockName = 'Dr. Priya Sharma';
    if (role === 'admin') mockName = 'Mohammed Ismail';

    return c.json({
        success: true,
        user: {
            id: 'mock_id',
            name: mockName,
            email: `${role}@reva.edu`,
            role: role,
            tenantId: 'reva'
        }
    });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (c) => {
    deleteCookie(c, 'auth_token', { path: '/' });
    return c.json({
        success: true,
        message: 'logged out'
    });
});

// POST /api/auth/login
app.post('/api/auth/login', zValidator('json', loginSchema), (c) => {
    const { email } = c.req.valid('json');

    // Determine the role based on the email provided
    let role = 'learner';
    if (email.includes('admin')) role = 'admin';
    else if (email.includes('instructor')) role = 'instructor';

    // Set a mock cookie so `/me` knows who is logged in
    setCookie(c, 'auth_token', `mock_token_${role}`, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'None', // required for cross-origin cookies in dev
    });

    return c.json({
        success: true,
        message: 'login stub ok',
        user: {
            id: 'mock_id',
            name: email.split('@')[0],
            email: email,
            role: role,
            tenantId: 'reva'
        }
    });
});

export default app;
