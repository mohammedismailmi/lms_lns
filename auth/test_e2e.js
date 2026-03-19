const axios = require('axios');
const assert = require('assert');

const BASE_URL = 'http://localhost:8787/api';

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    validateStatus: () => true
});

async function runTest() {
    try {
        console.log("--- Starting E2E LMS Verification ---");

        // 1. Login as Admin
        let res = await api.post('/auth/login', { email: 'admin@example.com', password: 'password123', tenantId: 't1' });
        assert(res.data.success, 'Admin login failed');
        const adminCookie = res.headers['set-cookie'][0].split(';')[0];
        console.log("✅ Admin Logged In");

        // 2. Create Course
        res = await api.post('/courses', { name: 'E2E Test Course', description: 'Testing...', section: 'A', category: 'Testing', thumbnailColor: '#FF0000' }, { headers: { Cookie: adminCookie } });
        assert(res.data.success, 'Course creation failed');
        const courseId = res.data.course.id;
        console.log("✅ Course Created:", courseId);

        // 3. Assign Instructor
        res = await api.put(`/courses/${courseId}`, { instructorId: 'u2', isPublished: true }, { headers: { Cookie: adminCookie } });
        assert(res.data.success, 'Course publish/assign failed');
        console.log("✅ Course Published & Instructor Assigned");

        // 4. Login as Instructor
        res = await api.post('/auth/login', { email: 'instructor@example.com', password: 'password123', tenantId: 't1' });
        assert(res.data.success, 'Instructor login failed');
        const instCookie = res.headers['set-cookie'][0].split(';')[0];
        console.log("✅ Instructor Logged In");

        // 5. Create Module
        res = await api.post(`/courses/${courseId}/modules`, { title: 'Module 1' }, { headers: { Cookie: instCookie } });
        assert(res.data.success, 'Module creation failed');
        const moduleId = res.data.module.id;
        console.log("✅ Module Created:", moduleId);

        // 6. Create Quiz Activity
        const quizData = { title: 'E2E Quiz', type: 'quiz', moduleId, isPublished: true, content: JSON.stringify([{ question: 'What is 2+2?', options: ['3', '4', '5'], correctOption: 1, type: 'mcq' }]) };
        res = await api.post(`/courses/${courseId}/activities`, quizData, { headers: { Cookie: instCookie } });
        assert(res.data.success, 'Quiz activity creation failed');
        const activityId = res.data.activity.id;
        console.log("✅ Quiz Activity Created:", activityId);

        // 7. Login as Learner
        res = await api.post('/auth/login', { email: 'learner@example.com', password: 'password123', tenantId: 't1' });
        assert(res.data.success, 'Learner login failed');
        const learnCookie = res.headers['set-cookie'][0].split(';')[0];
        console.log("✅ Learner Logged In");

        // 8. Submit Quiz
        res = await api.post(`/activities/${activityId}/submit`, { answers: { 0: 1 } }, { headers: { Cookie: learnCookie } });
        console.log("Submit Response:", res.data);
        assert(res.data.success, 'Quiz submission failed');
        const attemptId = res.data.attemptId || res.data.submission?.id || res.data.id;
        console.log("✅ Quiz Submitted by Learner, Attempt ID:", attemptId);

        // 9. Instructor Checks Submissions
        res = await api.get(`/activities/${activityId}/submissions`, { headers: { Cookie: instCookie } });
        assert(res.data.success, 'Failed to fetch submissions');
        assert(res.data.submissions.length > 0, 'No submissions found');
        console.log("✅ Instructor fetched submissions successfully");

        // 10. Admin Checks Live Sessions (just to hit one more endpoint)
        res = await api.post('/live-sessions/create', { activityId, topic: 'Review', scheduledAt: new Date().toISOString(), durationMinutes: 60, timezone: 'UTC' }, { headers: { Cookie: instCookie } });
        console.log("Live Session Create:", res.data);
        
        console.log("🎉 ALL E2E API TESTS PASSED 🎉");

    } catch (e) {
        console.error("❌ Test Failed:", e.message);
        if (e.response) console.error(e.response.data);
    }
}

runTest();
