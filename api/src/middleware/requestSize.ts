import { createMiddleware } from 'hono/factory';

const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB

export const requestSizeLimit = createMiddleware(async (c, next) => {
    const contentLength = c.req.header('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
        return c.json({ error: 'Payload Too Large' }, 413);
    }

    await next();
});
