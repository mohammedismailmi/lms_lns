export type Role = 'super_admin' | 'admin' | 'instructor' | 'learner';

export interface Tenant {
    id: string;
    name: string;
    slug: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    tenantId: string;
    avatarUrl?: string;
}

export type ActivityType = 'blog' | 'video' | 'file' | 'quiz' | 'exam' | 'live_class' | 'submission' | 'announcement';

export interface BaseActivity {
    id: string;
    moduleId: string;
    title: string;
    type: ActivityType;
}

export interface BlogActivity extends BaseActivity {
    type: 'blog';
    content: string;
}

export interface FileActivity extends BaseActivity {
    type: 'file';
    fileUrl: string;
    fileName: string;
    fileSize: string;
    fileType: 'pdf' | 'doc' | 'ppt' | 'video' | 'image';
    durationMinutes?: number;
}

export interface VideoActivity extends BaseActivity {
    type: 'video';
    videoUrl: string;
    durationSeconds: number;
}

export interface Question {
    id: string;
    text: string;
    options: string[];
    correctAnswerIndex: number; // mock data knows correct answer
    type?: 'mcq' | 'short_answer' | 'long_answer';
    sampleAnswer?: string;
    matchPairs?: string;
}

export interface AssessmentActivity extends BaseActivity {
    type: 'quiz' | 'exam';
    duration: number; // minutes
    questions: Question[];
}

export interface LiveClassActivity extends BaseActivity {
    type: 'live_class';
    scheduledAt: string; // ISO date
    meetLink?: string;
    transcriptUrl?: string | null;
    durationMinutes: number;
    instructorName: string;
}

export interface SubmissionActivity extends BaseActivity {
    type: 'submission';
    dueAt?: string;
}

export type Activity =
    | BlogActivity
    | FileActivity
    | VideoActivity
    | AssessmentActivity
    | LiveClassActivity
    | SubmissionActivity;

export interface Module {
    id: string;
    courseId: string;
    title: string;
    order: number;
    activities: Activity[];
}

export interface Course {
    id: string;
    name: string;
    section: string;
    faculty: string;
    facultyInitial: string;
    category: 'AI/ML' | 'Science' | 'Arts' | 'Business' | 'Default';
    isCompleted: boolean;
    totalActivities: number;
    enrolledCount?: number;
    progressPercent?: number;
    description?: string;
    thumbnailColor?: string;
    modules: Module[];
}

// =======================
// MOCK DATA
// =======================

export const tenants: Tenant[] = [
    { id: 'uni1', name: 'Reva University', slug: 'reva' },
    { id: 'uni2', name: 'Christ University', slug: 'christ' },
    { id: 't1', name: 'Test University', slug: 'test' },
];

export const users: User[] = [
    { id: 'u1', name: 'Mohammed Ismail', email: 'ismail@reva.edu', role: 'admin', tenantId: 'uni1' },
    { id: 'u2', name: 'Dr. Priya Sharma', email: 'priya@reva.edu', role: 'instructor', tenantId: 'uni1' },
    { id: 'u3', name: 'Arjun Mehta', email: 'arjun@reva.edu', role: 'learner', tenantId: 'uni1' },
];

const mockQuestions: Question[] = [
    {
        id: 'q1',
        text: 'Which of the following describes a supervised learning problem?',
        options: [
            'Clustering customers by purchasing behavior',
            'Predicting house prices based on historical sales data',
            'Navigating a robot through a maze without prior data',
            'Reducing the dimensions of a dataset for visualization',
        ],
        correctAnswerIndex: 1,
    },
    {
        id: 'q2',
        text: 'What is the primary function of a loss function in neural networks?',
        options: [
            'To define the network architecture',
            'To measure how far the predictions are from the true labels',
            'To normalize input data',
            'To generate random numbers for initialization',
        ],
        correctAnswerIndex: 1,
    },
    {
        id: 'q3',
        text: 'Which algorithm is typically used for classification?',
        options: [
            'Linear Regression',
            'K-Means Clustering',
            'Logistic Regression',
            'Principal Component Analysis',
        ],
        correctAnswerIndex: 2,
    },
];

export const courses: Course[] = [];
