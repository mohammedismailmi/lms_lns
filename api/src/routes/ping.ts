import { Hono } from 'hono';
import type { Env, Variables } from '../types/env';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.get('/', (c) => {
    const tenant = c.get('tenant');
    return c.json({
        tenant,
        status: 'ok'
    });
});

export default app;
