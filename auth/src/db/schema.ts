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
    role: text('role', { enum: ['admin', 'instructor', 'learner', 'super_admin'] })
        .notNull()
        .default('learner'),
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
    instructor_id: text('instructor_id'),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status').notNull().default('draft'),
    total_activities: integer('total_activities').notNull().default(0),
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

export const modules = sqliteTable('modules', {
    id: text('id').primaryKey(),
    courseId: text('course_id').notNull().references(() => courses.id),
    title: text('title').notNull(),
    orderIndex: integer('order_index').notNull().default(0),
    tenantId: text('tenant_id').notNull().references(() => tenants.id),
    created_at: integer('created_at').notNull(),
    updated_at: integer('updated_at').notNull(),
});

export const activities = sqliteTable('activities', {
    id: text('id').primaryKey(),
    moduleId: text('module_id').notNull(),
    courseId: text('course_id').references(() => courses.id),
    tenantId: text('tenant_id').references(() => tenants.id),
    title: text('title').notNull(),
    type: text('type', { enum: ['blog', 'video', 'file', 'quiz', 'exam', 'live_class', 'submission'] }).notNull(),
    content: text('content'),
    fileUrl: text('file_url'),
    videoUrl: text('video_url'),
    duration: integer('duration'),
    scheduledAt: text('scheduled_at'),
    meetLink: text('meet_link'),
    dueAt: text('due_at'),
    order: integer('order').notNull().default(0),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
});

export const submissions = sqliteTable('submissions', {
    id: text('id').primaryKey(),
    activityId: text('activity_id').notNull().references(() => activities.id),
    userId: text('user_id').notNull().references(() => users.id),
    courseId: text('course_id').notNull().references(() => courses.id),
    tenantId: text('tenant_id').notNull().references(() => tenants.id),
    fileUrl: text('file_url').notNull(),
    fileName: text('file_name'),
    fileType: text('file_type'),
    fileSize: integer('file_size'),
    submittedAt: text('submitted_at').notNull(),
    dueAt: text('due_at'),
    grade: text('grade'),
    feedback: text('feedback'),
    gradedAt: text('graded_at'),
    gradedBy: text('graded_by').references(() => users.id),
});
