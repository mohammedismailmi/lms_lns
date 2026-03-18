-- Phase 1: Add logo_url column to tenants (skip if already exists)
-- ALTER TABLE tenants ADD COLUMN logo_url TEXT;
-- (Already done — skipping)

-- Insert system tenant (hidden, for super_admin FK)
INSERT OR IGNORE INTO tenants (id, name, slug, created_at, updated_at)
VALUES ('system', 'System', 'system', unixepoch(), unixepoch());

-- Fix t1 — give it a proper name and logo
UPDATE tenants SET name = 'Test University', slug = 'test-uni',
  updated_at = unixepoch()
WHERE id = 't1';

-- Fix uni1 — already Reva University, just add logo
UPDATE tenants SET
  logo_url = 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/Reva_University_logo.png/220px-Reva_University_logo.png',
  updated_at = unixepoch()
WHERE id = 'uni1';

-- Insert Christ University
INSERT OR IGNORE INTO tenants (id, name, slug, logo_url, created_at, updated_at)
VALUES ('t2', 'Christ University', 'christ',
  'https://upload.wikimedia.org/wikipedia/en/0/05/Christ_University_logo.png',
  unixepoch(), unixepoch());

-- Insert RV University
INSERT OR IGNORE INTO tenants (id, name, slug, logo_url, created_at, updated_at)
VALUES ('t3', 'RV University', 'rvu', NULL, unixepoch(), unixepoch());

-- Insert Super Admin user (password: SuperAdmin@123)
INSERT OR IGNORE INTO users (id, tenant_id, name, email, password, role, created_at, updated_at)
VALUES ('superadmin-001', 'system', 'Super Admin', 'superadmin@lms.com',
  '$2b$10$7OpetvmPQMCA1b1XkvsoPewDtmAwNlmKYlkgc/hTap8WpLn/B9j0u',
  'super_admin', unixepoch(), unixepoch());
