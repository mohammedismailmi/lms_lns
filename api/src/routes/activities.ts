import { Hono } from 'hono';

const app = new Hono();

// POST /api/activities/:id/complete
app.post('/:id/complete', (c) => {
    return c.json({
        success: true,
        message: 'activity marked as complete'
    });
});

// POST /api/activities/:id/progress
app.post('/:id/progress', (c) => {
    return c.json({
        success: true,
        message: 'progress updated'
    });
});

// POST /api/activities/:id/submit (for quizzes)
app.post('/:id/submit', (c) => {
    return c.json({
        success: true,
        score: 85,
        message: 'quiz submitted successfully'
    });
});

export default app;
