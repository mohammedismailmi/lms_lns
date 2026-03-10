import { Hono } from 'hono';
import type { Env, Variables } from './types/env';
import { corsMiddleware } from './middleware/cors';
import { requestSizeLimit } from './middleware/requestSize';
import { tenantMiddleware } from './middleware/tenant';
import healthRoute from './routes/health';
import pingRoute from './routes/ping';
import authRoute from './routes/auth';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Global middleware
app.use('*', corsMiddleware);
app.use('*', requestSizeLimit);
app.use('*', tenantMiddleware);

// Routes
app.route('/health', healthRoute);
app.route('/api/ping', pingRoute);
app.route('/api/auth', authRoute);

// 404 fallback
app.notFound((c) => {
    return c.json({ error: 'Not found' }, 404);
});

export default app;
