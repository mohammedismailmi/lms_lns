import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const tenants = sqliteTable('tenants', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
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
    role: text('role', { enum: ['admin', 'instructor', 'learner'] })
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
