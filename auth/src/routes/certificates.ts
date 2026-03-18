import { Hono } from 'hono';
import { requireRole } from '../middleware/roleGuard';

type Bindings = { DB: D1Database; JWT_SECRET: string };
const certificatesApp = new Hono<{ Bindings: Bindings, Variables: { user: any } }>();

// GET /api/certificates/:courseId
certificatesApp.get('/:courseId', requireRole(['admin', 'instructor', 'learner']), async (c) => {
    const courseId = c.req.param('courseId');
    const user = c.get('user');

    try {
        const cert = await c.env.DB.prepare('SELECT * FROM certificates WHERE user_id = ? AND course_id = ? AND tenant_id = ?')
            .bind(user.userId, courseId, user.tenant_id).first();
        
        if (cert) {
            return c.json({ success: true, isEligible: true, certificate: cert });
        }

        // For this feature, we consider the user eligible if they hit this endpoint without a cert
        return c.json({ success: true, isEligible: true, message: 'Eligible to generate certificate' });
    } catch (err) {
        return c.json({ success: false, message: 'Error checking certificate' }, 500);
    }
});

// POST /api/certificates/:courseId
certificatesApp.post('/:courseId', requireRole(['admin', 'instructor', 'learner']), async (c) => {
    const courseId = c.req.param('courseId');
    const user = c.get('user');
    const now = Math.floor(Date.now() / 1000);

    try {
        const certId = crypto.randomUUID();
        await c.env.DB.prepare('INSERT INTO certificates (id, tenant_id, user_id, course_id, issue_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .bind(certId, user.tenant_id, user.userId, courseId, now, now, now).run();
        
        return c.json({ success: true, certificateId: certId, issueDate: now });
    } catch (err) {
        return c.json({ success: false, message: 'Error generating certificate' }, 500);
    }
});

export default certificatesApp;
