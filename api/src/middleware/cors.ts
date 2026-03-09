import { cors } from 'hono/cors';

export const corsMiddleware = cors({
    origin: (origin) => {
        // Allow origin based on request origin (tighten later for tenant subdomains)
        return origin || '*';
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
});
