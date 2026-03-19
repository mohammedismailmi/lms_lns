import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const tenants = sqliteTable('tenants', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    logo_url: text('logo_url'),
    created_at: integer('created_at').notNull(),
    updated_at: integer('updated_at').notNull(),
});

export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id')
        .notNull()
        .references(() => tenants.id),
    name: text('name').notNull(),
    email: text('email').notNull(),
    password_hash: text('password').notNull(),
    role: text('role', { enum: ['super_admin', 'admin', 'instructor', 'learner'] })
        .notNull()
        .default('learner'),
    avatar_url: text('avatar_url'),
    bio: text('bio'),
    phone: text('phone'),
    location: text('location'),
    website: text('website'),
    linkedin: text('linkedin'),
    github: text('github'),
    created_at: integer('created_at').notNull(),
    updated_at: integer('updated_at').notNull(),
});

export const enrollments = sqliteTable('enrollments', {
    id: text('id').primaryKey(),
    user_id: text('user_id').notNull().references(() => users.id),
    course_id: text('course_id').notNull(),
    tenant_id: text('tenant_id').notNull().references(() => tenants.id),
    created_at: integer('created_at').notNull(),
    updated_at: integer('updated_at').notNull(),
});

export const courses = sqliteTable('courses', {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id').notNull().references(() => tenants.id),
    title: text('title').notNull(),
    section: text('section'),
    category: text('category'),
    description: text('description'),
    thumbnail_color: text('thumbnail_color'),
    status: text('status').notNull().default('draft'),
    total_activities: integer('total_activities').notNull().default(0),
    instructor_id: text('instructor_id'),
    faculty_name: text('faculty_name'),
    created_at: integer('created_at').notNull(),
    updated_at: integer('updated_at').notNull(),
});

export const progress = sqliteTable('progress', {
    id: text('id').primaryKey(),
    user_id: text('user_id').notNull().references(() => users.id),
    course_id: text('course_id').notNull(),
    lesson_id: text('lesson_id').notNull(),
    percent_complete: integer('percent_complete').notNull(),
    tenant_id: text('tenant_id').notNull().references(() => tenants.id),
    created_at: integer('created_at').notNull(),
    updated_at: integer('updated_at').notNull(),
});

export const certificates = sqliteTable('certificates', {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id').notNull().references(() => tenants.id),
    user_id: text('user_id').notNull().references(() => users.id),
    course_id: text('course_id').notNull().references(() => courses.id),
    issue_date: integer('issue_date').notNull(),
    created_at: integer('created_at').notNull(),
    updated_at: integer('updated_at').notNull(),
});

export const submissions = sqliteTable('submissions', {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id').notNull().references(() => tenants.id),
    activity_id: text('activity_id').notNull(),
    user_id: text('user_id').notNull().references(() => users.id),
    file_url: text('file_url').notNull(),
    file_name: text('file_name').notNull(),
    status: text('status', { enum: ['pending', 'graded'] }).notNull().default('pending'),
    grade: integer('grade'),
    feedback: text('feedback'),
    created_at: integer('created_at').notNull(),
    updated_at: integer('updated_at').notNull(),
});

export const modules = sqliteTable('sections', {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id').notNull().references(() => tenants.id),
    course_id: text('course_id').notNull().references(() => courses.id),
    title: text('title').notNull(),
    order_index: integer('order_index').notNull(),
    created_at: integer('created_at').notNull(),
    updated_at: integer('updated_at').notNull(),
});

export const activities = sqliteTable('lessons', {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id').notNull().references(() => tenants.id),
    section_id: text('section_id').references(() => modules.id),
    course_id: text('course_id').notNull().references(() => courses.id),
    title: text('title').notNull(),
    content: text('content'),
    description: text('description'),
    file_url: text('file_url'),
    file_name: text('file_name'),
    file_type: text('file_type'),
    file_size: integer('file_size'),
    video_url: text('video_url'),
    scheduled_at: text('scheduled_at'),
    meet_link: text('meet_link'),
    due_at: text('due_at'),
    order_index: integer('order_index').notNull(),
    type: text('type', { enum: ['video', 'blog', 'file', 'quiz', 'exam', 'live_class', 'submission', 'announcement'] }).notNull().default('blog'),
    duration_minutes: integer('duration_minutes').default(0),
    created_at: integer('created_at').notNull(),
    updated_at: integer('updated_at').notNull(),
});

export const liveSessions = sqliteTable('live_sessions', {
    id: text('id').primaryKey(),
    activity_id: text('activity_id').notNull().references(() => activities.id),
    meet_link: text('meet_link'),
    start_time: integer('start_time'),
    end_time: integer('end_time'),
    ended_at: integer('ended_at'),
    created_at: integer('created_at').notNull(),
    updated_at: integer('updated_at').notNull(),
});

export const quizAttempts = sqliteTable('quiz_attempts', {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id').notNull().references(() => tenants.id),
    activity_id: text('activity_id').notNull().references(() => activities.id),
    user_id: text('user_id').notNull().references(() => users.id),
    score: integer('score').notNull(),
    max_score: integer('max_score').notNull(),
    answers_json: text('answers_json').notNull(),
    is_published: integer('is_published').notNull().default(0),
    modified_score: integer('modified_score'),
    instructor_note: text('instructor_note'),
    created_at: integer('created_at').notNull(),
    updated_at: integer('updated_at').notNull(),
});

export const userEvents = sqliteTable('user_events', {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id').notNull().references(() => tenants.id),
    user_id: text('user_id').notNull().references(() => users.id),
    title: text('title').notNull(),
    date_time: integer('date_time').notNull(),
    created_at: integer('created_at').notNull(),
});

export const questions = sqliteTable('questions', {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id').notNull().references(() => tenants.id),
    activity_id: text('activity_id').notNull().references(() => activities.id),
    text: text('text').notNull(),
    question_type: text('question_type').notNull().default('mcq'),
    sample_answer: text('sample_answer'),
    match_pairs: text('match_pairs'),
    correct_answer_id: text('correct_answer_id'),
    order_index: integer('order_index').notNull().default(0),
});

export const answerOptions = sqliteTable('answer_options', {
    id: text('id').primaryKey(),
    tenant_id: text('tenant_id').notNull().references(() => tenants.id),
    question_id: text('question_id').notNull().references(() => questions.id),
    text: text('text').notNull(),
});
