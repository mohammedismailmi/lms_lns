-- Test tenant
INSERT OR IGNORE INTO tenants (id, name, slug, created_at, updated_at) 
VALUES ('t1', 'Test University', 'test', unixepoch(), unixepoch());

-- Test users (passwords are bcrypt hash of "password123")
INSERT OR IGNORE INTO users (id, tenant_id, name, email, password, role, created_at, updated_at)
VALUES 
('u1', 't1', 'Alice Learner', 'alice@test.com', '$2b$10$vzmLO1.dNTdI4IwkZuWJmOAz3pWYGeduUFNCnTnc4UDubDEBXv/YW', 'learner', unixepoch(), unixepoch()),
('u2', 't1', 'Bob Instructor', 'bob@test.com', '$2b$10$vzmLO1.dNTdI4IwkZuWJmOAz3pWYGeduUFNCnTnc4UDubDEBXv/YW', 'instructor', unixepoch(), unixepoch()),
('u3', 't1', 'Admin User', 'admin@test.com', '$2b$10$vzmLO1.dNTdI4IwkZuWJmOAz3pWYGeduUFNCnTnc4UDubDEBXv/YW', 'admin', unixepoch(), unixepoch());

-- Test courses
INSERT OR IGNORE INTO courses (id, tenant_id, title, description, status, total_activities, created_at, updated_at)
VALUES 
('c1', 't1', 'Machine Learning Fundamentals', 'Learn the basics of ML.', 'draft', 3, unixepoch(), unixepoch()),
('c2', 't1', 'Advanced JavaScript & Patterns', 'Deep dive into JS patterns.', 'draft', 2, unixepoch(), unixepoch()),
('c3', 't1', 'Corporate Ethics & Compliance', 'Business ethics overview.', 'draft', 1, unixepoch(), unixepoch()),
('c4', 't1', 'Quantum Computing 101', 'Intro to quantum concepts.', 'draft', 1, unixepoch(), unixepoch()),
('c5', 't1', 'Sustainable Energy Systems', 'Clean energy fundamentals.', 'draft', 1, unixepoch(), unixepoch());

-- Test Enrollments
INSERT OR IGNORE INTO enrollments (id, user_id, course_id, tenant_id, created_at, updated_at)
VALUES 
('e1', 'u1', 'c2', 't1', unixepoch(), unixepoch());

-- Test Progress (Alice has finished course c2)
INSERT OR IGNORE INTO progress (id, user_id, course_id, lesson_id, percent_complete, tenant_id, created_at, updated_at)
VALUES 
('p1', 'u1', 'c2', 'a7', 100, 't1', unixepoch(), unixepoch()),
('p2', 'u1', 'c2', 'a8', 100, 't1', unixepoch(), unixepoch());
