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
}

export type ActivityType = 'blog' | 'video' | 'file' | 'quiz' | 'exam' | 'live_class' | 'submission';

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

export const courses: Course[] = [
    {
        id: 'c1',
        name: 'Machine Learning Fundamentals',
        section: 'Section A · CSE 3rd Year',
        faculty: 'Dr. Priya Sharma',
        facultyInitial: 'PS',
        category: 'AI/ML',
        isCompleted: false,
        totalActivities: 6,
        modules: [
            {
                id: 'm1',
                courseId: 'c1',
                title: 'Introduction to ML Concepts',
                order: 1,
                activities: [
                    {
                        id: 'a1',
                        moduleId: 'm1',
                        title: 'What is Machine Learning?',
                        type: 'blog',
                        content: `<p>Machine Learning is the study of computer algorithms that can improve automatically through experience and by the use of data.</p>
                      <p>It is seen as a part of artificial intelligence. Machine learning algorithms build a model based on sample data, known as training data, in order to make predictions or decisions without being explicitly programmed to do so.</p>
                      <p>In this module, we will explore the three main types of ML: Supervised Learning, Unsupervised Learning, and Reinforcement Learning.</p>
                      <br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><p>You have reached the end of the reading.</p>`,
                    },
                    {
                        id: 'a2',
                        moduleId: 'm1',
                        title: 'Course Syllabus PDF',
                        type: 'file',
                        fileUrl: '/mock-syllabus.pdf',
                        fileName: 'ML_Fundamentals_Syllabus.pdf',
                        fileSize: '1.2 MB',
                        fileType: 'pdf',
                        durationMinutes: 15,
                    },
                    {
                        id: 'a3',
                        moduleId: 'm1',
                        title: 'Lecture 1: Intro to Supervised Learning',
                        type: 'video',
                        // public placeholder video
                        videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                        durationSeconds: 120, // using short duration for testing
                    },
                ],
            },
            {
                id: 'm2',
                courseId: 'c1',
                title: 'Assessments & Live Classes',
                order: 2,
                activities: [
                    {
                        id: 'a4',
                        moduleId: 'm2',
                        title: 'Module 1 Knowledge Check',
                        type: 'quiz',
                        duration: 10,
                        questions: mockQuestions,
                    },
                    {
                        id: 'a5',
                        moduleId: 'm2',
                        title: 'Q&A Session with Dr. Priya',
                        type: 'live_class',
                        scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                        durationMinutes: 60,
                        instructorName: 'Dr. Priya Sharma',
                    },
                    {
                        id: 'a6',
                        moduleId: 'm2',
                        title: 'Midterm Examination',
                        type: 'exam',
                        duration: 60,
                        questions: [...mockQuestions, ...mockQuestions.map(q => ({ ...q, id: `${q.id}-2` }))], // doubled for exam length with unique IDs
                    },
                ],
            },
        ],
    },
    {
        id: 'c2',
        name: 'Advanced JavaScript & Patterns',
        section: 'Section B · Web Dev Track',
        faculty: 'Prof. David Chen',
        facultyInitial: 'DC',
        category: 'Science',
        isCompleted: false,
        totalActivities: 2,
        modules: [
            {
                id: 'm3',
                courseId: 'c2',
                title: 'Closures & Scope',
                order: 1,
                activities: [
                    {
                        id: 'a7',
                        moduleId: 'm3',
                        title: 'Understanding the Execution Context',
                        type: 'blog',
                        content: '<p>The execution context is the core concept of JavaScript.</p>',
                    },
                    {
                        id: 'a8',
                        moduleId: 'm3',
                        title: 'Closures Quiz',
                        type: 'quiz',
                        duration: 5,
                        questions: mockQuestions,
                    },
                ],
            },
        ],
    },
    {
        id: 'c3',
        name: 'Corporate Ethics & Compliance',
        section: 'Elective · Business Management',
        faculty: 'Sarah Jenkins',
        facultyInitial: 'SJ',
        category: 'Business',
        isCompleted: false,
        totalActivities: 1,
        modules: [
            {
                id: 'm4',
                courseId: 'c3',
                title: 'Introduction to Ethics',
                order: 1,
                activities: [
                    {
                        id: 'a9',
                        moduleId: 'm4',
                        title: 'Readings on Corporate Responsibility',
                        type: 'file',
                        fileName: 'Corp_Ethics_Ch1.pdf',
                        fileUrl: '/ethics.pdf',
                        fileSize: '4.5 MB',
                        fileType: 'pdf',
                        durationMinutes: 25,
                    },
                ],
            },
        ],
    },
    {
        id: 'c4',
        name: 'Modern Cloud Architecture',
        section: 'Section A · IT Dept',
        faculty: 'Rahul Desai',
        facultyInitial: 'RD',
        category: 'Science',
        isCompleted: false,
        totalActivities: 1,
        modules: [
            {
                id: 'm5',
                courseId: 'c4',
                title: 'AWS vs GCP vs Cloudflare',
                order: 1,
                activities: [
                    {
                        id: 'a10',
                        moduleId: 'm5',
                        title: 'Cloudflare Workers Hands-on',
                        type: 'blog',
                        content: '<p>Edge computing is changing the paradigm...</p>',
                    },
                ],
            },
        ],
    },
    {
        id: 'c5',
        name: 'Renaissance Art History',
        section: 'Humanities 101',
        faculty: 'Dr. Elena Rossi',
        facultyInitial: 'ER',
        category: 'Arts',
        isCompleted: false,
        totalActivities: 1,
        modules: [
            {
                id: 'm6',
                courseId: 'c5',
                title: 'Italian Masters',
                order: 1,
                activities: [
                    {
                        id: 'a11',
                        moduleId: 'm6',
                        title: 'The Works of Da Vinci',
                        type: 'video',
                        videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
                        durationSeconds: 60,
                    },
                ],
            },
        ],
    },
    {
        id: 'c6',
        name: 'Financial Accounting II',
        section: 'Commerce 2nd Year',
        faculty: 'Michael Barnes',
        facultyInitial: 'MB',
        category: 'Business',
        isCompleted: false,
        totalActivities: 1,
        modules: [
            {
                id: 'm7',
                courseId: 'c6',
                title: 'Balance Sheets',
                order: 1,
                activities: [
                    {
                        id: 'a12',
                        moduleId: 'm7',
                        title: 'Final Term Exam',
                        type: 'exam',
                        duration: 120,
                        questions: mockQuestions,
                    },
                ],
            },
        ],
    },
];
