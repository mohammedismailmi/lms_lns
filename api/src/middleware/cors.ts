import { cors } from 'hono/cors';

export const corsMiddleware = cors({
    origin: (origin) => {
        // Allow origin based on request origin (tighten later for tenant subdomains)
        return origin || '*';
    },
    allowHeaders: ['Content-Type', 'Authorization', 'x-tenant-slug'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
});
