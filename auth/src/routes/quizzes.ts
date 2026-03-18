import { Hono } from 'hono';
import { requireRole } from '../middleware/roleGuard';

type Bindings = { DB: D1Database; JWT_SECRET: string };
const quizzesApp = new Hono<{ Bindings: Bindings, Variables: { user: any } }>();

// GET /api/quizzes/:quizId/attempt
quizzesApp.get('/:quizId/attempt', requireRole(['admin', 'instructor', 'learner']), async (c) => {
    const quizId = c.req.param('quizId');
    const user = c.get('user');

    try {
        const attempt = await c.env.DB.prepare('SELECT * FROM quiz_attempts WHERE quiz_id = ? AND user_id = ? AND tenant_id = ? ORDER BY created_at DESC LIMIT 1')
            .bind(quizId, user.userId, user.tenant_id).first();
        
        return c.json({ success: true, attempt });
    } catch (err) {
        return c.json({ success: false, message: 'Error fetching attempt' }, 500);
    }
});

// POST /api/quizzes/:quizId/submit
quizzesApp.post('/:quizId/submit', requireRole(['admin', 'instructor', 'learner']), async (c) => {
    const quizId = c.req.param('quizId');
    const user = c.get('user');
    const body = await c.req.json();
    const { answers, tabSwitchCount } = body;
    const now = Math.floor(Date.now() / 1000);

    try {
        // Evaluate score
        const { results: questions } = await c.env.DB.prepare('SELECT id, content FROM questions WHERE quiz_id = ? AND tenant_id = ?').bind(quizId, user.tenant_id).all();
        
        let correctCount = 0;
        let total = questions.length;

        if (total > 0) {
            questions.forEach((q: any) => {
                try {
                    const parsed = JSON.parse(q.content);
                    const userAnswer = answers[q.id];
                    if (userAnswer !== undefined && (String(userAnswer) === String(parsed.correctAnswerIndex) || String(userAnswer) === String(parsed.correctAnswer))) {
                        correctCount++;
                    }
                } catch (e) {
                    // ignore
                }
            });
        }

        const score = total > 0 ? (correctCount / total) * 100 : 100; // Default to 100 if no questions for testing
        
        // Save Attempt
        const attemptId = crypto.randomUUID();
        await c.env.DB.prepare('INSERT INTO quiz_attempts (id, tenant_id, user_id, quiz_id, score, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
            .bind(attemptId, user.tenant_id, user.userId, quizId, score, 'completed', now, now).run();

        // Save Answers — only for questions that exist in DB
        if (answers && typeof answers === 'object') {
            const dbQuestionIds = new Set(questions.map((q: any) => q.id));
            for (const [qId, ans] of Object.entries(answers)) {
                // Skip if this question ID doesn't exist in DB (avoids FK violation)
                if (!dbQuestionIds.has(qId)) continue;

                let isCorrect = 0;
                const q = questions.find((item: any) => item.id === qId);
                if (q) {
                    try {
                        const parsed = JSON.parse(q.content as string);
                        if (String(ans) === String(parsed.correctAnswerIndex) || String(ans) === String(parsed.correctAnswer)) isCorrect = 1;
                    } catch(e) {}
                }

                await c.env.DB.prepare('INSERT INTO attempt_answers (id, tenant_id, attempt_id, question_id, answer_data, is_correct, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
                    .bind(crypto.randomUUID(), user.tenant_id, attemptId, qId, String(ans), isCorrect, now, now).run();
            }
        }

        return c.json({ success: true, score });
    } catch (err) {
        console.error('Submit error:', err);
        return c.json({ success: false, message: 'Error submitting quiz' }, 500);
    }
});

export default quizzesApp;
