# LMS Platform Setup Guide

Welcome to the team! Follow this step-by-step guide to get the LMS platform running from scratch on a new Mac machine.

## SECTION 1 — Prerequisites

You must have the following installed:
- Node.js (v20 or higher)
- npm
- Git
- Wrangler CLI

### 1. Check Node and install `nvm` if needed:
```bash
# Check if Node is installed and correct version
node --version   # must be v20.x.x or higher

# Install nvm if not installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install correct Node version
nvm install 20
nvm use 20
```

### 2. Install Cloudflare Wrangler
```bash
# Install Wrangler globally
npm install -g wrangler

# Verify wrangler installed
wrangler --version

# Login to Cloudflare (required for D1/KV/R2)
wrangler login
# This opens a browser — log into the Cloudflare account
```

## SECTION 2 — Clone and Install

```bash
# Clone the repo
git clone https://github.com/mohammedismailmi/lms_lns.git
cd lms_lns

# Install backend dependencies
cd auth
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## SECTION 3 — Environment Variables Setup

### Backend
Create a `.dev.vars` file inside the `auth` directory:
```bash
cd ../auth
touch .dev.vars
```

Edit `auth/.dev.vars` and add the following:
```
JWT_SECRET=any_long_random_string_at_least_32_chars
GROQ_API_KEY=get_from_https://console.groq.com/keys
GOOGLE_CLIENT_EMAIL=optional_for_google_meet
GOOGLE_PRIVATE_KEY=optional_for_google_meet
```

> **Tip to generate `JWT_SECRET`**:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

> **How to get GROQ_API_KEY**:
> 1. Go to `https://console.groq.com`
> 2. Sign up or log in
> 3. Go to API Keys section
> 4. Create new key
> 5. Copy and paste into `.dev.vars`

### Frontend
Create a `.env.local` file inside the `frontend` directory:
```bash
cd ../frontend
touch .env.local
```

Edit `frontend/.env.local` and add:
```
VITE_API_URL=http://localhost:8787
```

## SECTION 4 — Cloudflare Local Setup (D1 + KV + R2)

Every database and storage resource must be created locally for the backend to function.

### Step 1 — Create D1 database
```bash
cd ../auth
npx wrangler d1 create lms-db
```
Copy the database ID from the output. Open `auth/wrangler.jsonc` and replace `local-db-id` under `d1_databases`:
```json
    "d1_databases": [
        {
            "binding": "DB",
            "database_name": "lms-db",
            "database_id": "PASTE_ID_HERE",
            "migrations_dir": "migrations"
        }
    ],
```

### Step 2 — Create KV namespace
*(The current application does not utilize a KV namespace explicitly in config, but if required in the future:)*
```bash
npx wrangler kv:namespace create KV
```
Copy the ID. Update `auth/wrangler.jsonc` and add:
```json
    "kv_namespaces": [
        {
            "binding": "KV",
            "id": "PASTE_ID_HERE"
        }
    ]
```

### Step 3 — Create R2 bucket
```bash
npx wrangler r2 bucket create lms-files
```
Verify `auth/wrangler.jsonc` matches:
```json
    "r2_buckets": [
        {
            "binding": "R2",
            "bucket_name": "lms-files"
        }
    ]
```

### Step 4 — Run all database migrations / create all tables

Execute the following commands inside the `auth` directory:

```bash
# Create all tables
npx wrangler d1 execute lms-db --local --command="CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)"

npx wrangler d1 execute lms-db --local --command="CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'learner',
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  date_of_birth TEXT,
  linkedin TEXT,
  github TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)"

npx wrangler d1 execute lms-db --local --command="CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  section TEXT,
  category TEXT DEFAULT 'Default',
  description TEXT,
  faculty_name TEXT,
  instructor_id TEXT,
  thumbnail_color TEXT,
  status TEXT DEFAULT 'draft',
  total_activities INTEGER DEFAULT 0,
  is_instructor_completed INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)"

npx wrangler d1 execute lms-db --local --command="CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  'order' INTEGER DEFAULT 0
)"

npx wrangler d1 execute lms-db --local --command="CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  module_id TEXT,
  course_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  video_url TEXT,
  duration INTEGER,
  scheduled_at TEXT,
  meet_link TEXT,
  due_at TEXT,
  question_types TEXT,
  'order' INTEGER DEFAULT 0
)"

npx wrangler d1 execute lms-db --local --command="CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  created_at TEXT NOT NULL
)"

npx wrangler d1 execute lms-db --local --command="CREATE TABLE IF NOT EXISTS progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  percent_complete INTEGER DEFAULT 0,
  tenant_id TEXT NOT NULL,
  updated_at TEXT,
  UNIQUE(user_id, lesson_id)
)"

npx wrangler d1 execute lms-db --local --command="CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL,
  quiz_id TEXT,
  tenant_id TEXT NOT NULL,
  text TEXT NOT NULL,
  question_type TEXT DEFAULT 'mcq',
  correct_answer_id TEXT,
  sample_answer TEXT,
  match_pairs TEXT,
  'order' INTEGER DEFAULT 0
)"

npx wrangler d1 execute lms-db --local --command="CREATE TABLE IF NOT EXISTS answer_options (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  text TEXT NOT NULL,
  match_pair TEXT,
  'order' INTEGER DEFAULT 0
)"

npx wrangler d1 execute lms-db --local --command="CREATE TABLE IF NOT EXISTS quiz_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  quiz_id TEXT NOT NULL,
  score INTEGER,
  modified_score INTEGER,
  instructor_note TEXT,
  time_taken INTEGER,
  tab_switches INTEGER DEFAULT 0,
  auto_submitted INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 0,
  tenant_id TEXT NOT NULL,
  completed_at TEXT
)"

npx wrangler d1 execute lms-db --local --command="CREATE TABLE IF NOT EXISTS attempt_answers (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  selected_answer_id TEXT,
  is_correct INTEGER DEFAULT 0,
  tenant_id TEXT NOT NULL
)"

npx wrangler d1 execute lms-db --local --command="CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  certificate_data TEXT
)"

npx wrangler d1 execute lms-db --local --command="CREATE TABLE IF NOT EXISTS live_sessions (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  meet_link TEXT,
  transcript_url TEXT,
  transcript_text TEXT,
  started_at TEXT,
  ended_at TEXT
)"

npx wrangler d1 execute lms-db --local --command="CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  submitted_at TEXT NOT NULL,
  due_at TEXT,
  grade TEXT,
  feedback TEXT,
  graded_at TEXT,
  graded_by TEXT
)"

npx wrangler d1 execute lms-db --local --command="CREATE TABLE IF NOT EXISTS user_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'reminder',
  created_at TEXT NOT NULL
)"
```

### Step 5 — Verify all tables were created

```bash
npx wrangler d1 execute lms-db --local --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
```

The output must show all tables exactly as created above.

## SECTION 5 — Seed Test Data

Before logging in, we need valid database records and password hashes.

```bash
# First generate a bcrypt hash for password "password123"
cat > /tmp/gen_hash.js << 'EOF'
const bcrypt = require('bcryptjs')
async function main() {
  const hash = await bcrypt.hash('password123', 10)
  const superHash = await bcrypt.hash('SuperAdmin@123', 10)
  console.log('REGULAR_HASH=' + hash)
  console.log('SUPER_HASH=' + superHash)
}
main()
EOF

node /tmp/gen_hash.js
# Copy the two hashes from output — REGULAR_HASH and SUPER_HASH
```

Then run the following commands, replacing `PASTE_REGULAR_HASH_HERE` and `PASTE_SUPER_HASH_HERE` with your copied values:

```bash
# Seed tenants
npx wrangler d1 execute lms-db --local --command="INSERT OR IGNORE INTO tenants (id, name, slug, logo_url, created_at, updated_at) VALUES ('t1', 'Reva University', 'reva', null, datetime('now'), datetime('now'))"

npx wrangler d1 execute lms-db --local --command="INSERT OR IGNORE INTO tenants (id, name, slug, logo_url, created_at, updated_at) VALUES ('t2', 'Christ University', 'christ', null, datetime('now'), datetime('now'))"

npx wrangler d1 execute lms-db --local --command="INSERT OR IGNORE INTO tenants (id, name, slug, logo_url, created_at, updated_at) VALUES ('t3', 'RV University', 'rvu', null, datetime('now'), datetime('now'))"

# Seed super admin (use SUPER_HASH from above)
npx wrangler d1 execute lms-db --local --command="INSERT OR IGNORE INTO users (id, tenant_id, name, email, password, role, created_at, updated_at) VALUES ('superadmin-001', 'system', 'Super Admin', 'superadmin@lms.com', 'PASTE_SUPER_HASH_HERE', 'super_admin', datetime('now'), datetime('now'))"

# Seed admin for t1 (use REGULAR_HASH)
npx wrangler d1 execute lms-db --local --command="INSERT OR IGNORE INTO users (id, tenant_id, name, email, password, role, created_at, updated_at) VALUES ('admin-001', 't1', 'Admin User', 'admin@example.com', 'PASTE_REGULAR_HASH_HERE', 'admin', datetime('now'), datetime('now'))"

# Seed instructor for t1
npx wrangler d1 execute lms-db --local --command="INSERT OR IGNORE INTO users (id, tenant_id, name, email, password, role, created_at, updated_at) VALUES ('inst-001', 't1', 'Instructor User', 'instructor@example.com', 'PASTE_REGULAR_HASH_HERE', 'instructor', datetime('now'), datetime('now'))"

# Seed learner for t1
npx wrangler d1 execute lms-db --local --command="INSERT OR IGNORE INTO users (id, tenant_id, name, email, password, role, created_at, updated_at) VALUES ('learner-001', 't1', 'Learner User', 'learner@example.com', 'PASTE_REGULAR_HASH_HERE', 'learner', datetime('now'), datetime('now'))"

# Seed a sample course
npx wrangler d1 execute lms-db --local --command="INSERT OR IGNORE INTO courses (id, tenant_id, name, section, category, description, faculty_name, instructor_id, is_instructor_completed, created_at, updated_at) VALUES ('course-001', 't1', 'Introduction to Computer Science', 'Section A', 'Computer Science', 'A foundational course covering core CS concepts', 'Instructor User', 'inst-001', 0, datetime('now'), datetime('now'))"

# Assign the course to instructor
npx wrangler d1 execute lms-db --local --command="UPDATE courses SET instructor_id='inst-001', faculty_name='Instructor User' WHERE id='course-001'"
```

**Verify seed data:**
```bash
npx wrangler d1 execute lms-db --local --command="SELECT id, name, slug FROM tenants"
npx wrangler d1 execute lms-db --local --command="SELECT email, role, tenant_id FROM users"
npx wrangler d1 execute lms-db --local --command="SELECT name, faculty_name FROM courses"
```

## SECTION 6 — Running the Project

```bash
# Open two separate terminal windows/tabs

# Terminal 1 — Backend
cd auth
npx wrangler dev
# Wait for: Ready on http://localhost:8787

# Terminal 2 — Frontend
cd frontend
npm run dev
# Wait for: Local: http://localhost:5173
```

Open browser: `http://localhost:5173`

## SECTION 7 — Test Accounts

| Role | Email | Password | Institution |
|------|-------|----------|-------------|
| Super Admin | superadmin@lms.com | SuperAdmin@123 | (click "Platform administrator") |
| Admin | admin@example.com | password123 | Reva University (or Test University if t1 is mapped differently) |
| Instructor | instructor@example.com | password123 | Reva University |
| Learner | learner@example.com | password123 | Reva University |

## SECTION 8 — Common Errors and Fixes

**Error: `Cannot read properties of undefined (reading 'put')` on image upload**
- **Fix**: R2 binding is missing from wrangler.jsonc
- **Check**: `npx wrangler r2 bucket list`
- **Fix**: `npx wrangler r2 bucket create lms-files`
- **Add to wrangler.jsonc**: `[[r2_buckets]] binding = "R2" bucket_name = "lms-files"`

**Error: `No such table: modules` or any table**
- **Fix**: Run the `CREATE TABLE` commands from Section 4 again. Ensure you match D1 to the Drizzle schema. (e.g., `modules` logic vs `sections` in production environments — handle via direct execute).

**Error: `401 Unauthorized` on all requests**
- **Fix**: `JWT_SECRET` is missing from `auth/.dev.vars`
- **Create the file and add**: `JWT_SECRET=any_32_char_random_string`

**Error: Tenant dropdown shows "Could not load institutions"**
- **Fix**: Backend is not running on proper port.
- **Run**: `cd auth && npx wrangler dev`

**Error: `D1_ERROR: no such column`**
- **Fix**: A column was added after initial table creation. Run the `ALTER TABLE` command for the missing column manually matching the `auth/src/db/schema.ts` definition.

**Error: `wrangler: command not found`**
- **Fix**: `npm install -g wrangler`

**Error: Port 8787 already in use**
- **Fix**: `kill -9 $(lsof -ti:8787)`

**Error: Port 5173 already in use**
- **Fix**: `kill -9 $(lsof -ti:5173)`

## SECTION 9 — Git Workflow for the Team

```bash
# Always pull latest before starting work
git pull origin dev

# Create your feature branch
git checkout -b frontend/your-feature-name   # for frontend work
git checkout -b backend/your-feature-name    # for backend work

# After your work is done
git add .
git commit -m "feat: description of what you built"
git push origin your-branch-name

# Open PR to dev branch — never push directly to main
```

## SECTION 10 — Project Structure Reference

```
lms_lns/
├── auth/                    ← Backend (Cloudflare Worker)
│   ├── src/
│   │   ├── index.ts         ← All API endpoints
│   │   └── db/
│   │       ├── schema.ts    ← Drizzle ORM table definitions
│   │       └── client.ts    ← D1 connection
│   ├── wrangler.jsonc       ← Cloudflare config (D1, KV, R2 bindings)
│   ├── .dev.vars            ← Local secrets (DO NOT COMMIT)
│   └── package.json
│
├── frontend/                ← Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/           ← All page components
│   │   ├── components/      ← Reusable components
│   │   ├── store/           ← Zustand state stores
│   │   └── lib/
│   │       ├── api.ts       ← API fetch wrapper
│   │       └── mockData.ts  ← Mock data
│   ├── .env.local           ← Local env vars (DO NOT COMMIT)
│   └── package.json
│
└── SETUP.md                 ← This file
```
