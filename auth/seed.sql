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
INSERT OR IGNORE INTO courses (id, tenant_id, title, description, status, created_at, updated_at)
VALUES 
('c1', 't1', 'Machine Learning Fundamentals', 'Learn the basics of ML.', 'draft', unixepoch(), unixepoch()),
('c2', 't1', 'Advanced JavaScript & Patterns', 'Deep dive into JS patterns.', 'draft', unixepoch(), unixepoch()),
('c3', 't1', 'Corporate Ethics & Compliance', 'Business ethics overview.', 'draft', unixepoch(), unixepoch()),
('c4', 't1', 'Quantum Computing 101', 'Intro to quantum concepts.', 'draft', unixepoch(), unixepoch()),
('c5', 't1', 'Sustainable Energy Systems', 'Clean energy fundamentals.', 'draft', unixepoch(), unixepoch());
