import { createMiddleware } from 'hono/factory';
import type { Env, Variables } from '../types/env';

export const tenantMiddleware = createMiddleware<{ Bindings: Env; Variables: Variables }>(async (c, next) => {
    const host = c.req.header('host') || '';

    let tenant = 'local';

    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        // Extract subdomain: e.g. "acme.lms.com" -> extract "acme"
        const parts = host.split('.');
        if (parts.length >= 3) {
            tenant = parts[0];
        }
    }

    console.log(`[Tenant Middleware] Resolved tenant: ${tenant} for host: ${host}`);

    c.set('tenant', tenant);

    await next();
});
