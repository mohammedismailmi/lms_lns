import crypto from 'crypto';

async function test() {
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const scheduledTs = now + 3600;
    const meetLink = 'https://meet.google.com/test-link';

    console.log(`INSERT INTO user_events (id, tenant_id, user_id, title, description, meet_link, date_time, created_at) VALUES ('${id}', 't1', '45fbd467-8d5e-44e2-b9e3-abd6bb5ae77d', 'Test Meeting', 'Test Description', '${meetLink}', ${scheduledTs}, ${now});`);
}
test();
