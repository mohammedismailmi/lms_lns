import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';

export const requireRole = (allowedRoles: string[]) => {
    return async (c: Context, next: Next) => {
        const token = getCookie(c, 'auth_token');
        if (!token) return c.json({ success: false, message: 'Not authenticated' }, 401);

        try {
            const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
            if (!allowedRoles.includes(payload.role as string)) {
                return c.json({ success: false, message: 'Forbidden: Insufficient permissions' }, 403);
            }
            c.set('user', payload);
            await next();
        } catch (err) {
            return c.json({ success: false, message: 'Invalid token' }, 401);
        }
    };
};
