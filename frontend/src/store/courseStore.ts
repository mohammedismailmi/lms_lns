import { create } from 'zustand';
import { Course, courses as mockCourses, Module, Activity } from '../lib/mockData';

interface CourseState {
    // Legacy flags
    starred: Set<string>; // courseIds
    toggleStar: (courseId: string) => void;

    instructorCompleted: Set<string>; // courseIds marked complete by teacher
    markCourseComplete: (courseId: string) => void;

    // Mutability State
    coursesList: Course[];
    enrolledCourseIds: Record<string, string[]>;

    // Helpers exposed directly
    getAllCourses: () => Course[];
    getEnrolledCourses: (userId: string) => Course[];
    getTeachingCourses: (facultyName: string) => Course[];
    
    // Actions
    enrollUser: (userId: string, courseId: string) => void;
    unenrollUser: (userId: string, courseId: string) => void;
    
    addCourse: (course: Course) => void;
    updateCourse: (course: Course) => void;
    deleteCourse: (courseId: string) => void;

    addModule: (courseId: string, title: string) => void;
    addActivity: (courseId: string, moduleId: string, activity: Activity) => void;
    updateActivity: (courseId: string, moduleId: string, activity: Activity) => void;
    deleteActivity: (courseId: string, moduleId: string, activityId: string) => void;
}

const initialEnrolled: Record<string, string[]> = { 
    'u3': ['c1', 'c2'] // Pre-enroll Arjun Mehta in some courses
};

export const useCourseStore = create<CourseState>((set, get) => ({
    starred: new Set<string>(),
    toggleStar: (courseId) =>
        set((state) => {
            const newStarred = new Set(state.starred);
            if (newStarred.has(courseId)) {
                newStarred.delete(courseId);
            } else {
                newStarred.add(courseId);
            }
            return { starred: newStarred };
        }),

    instructorCompleted: new Set<string>(),
    markCourseComplete: (courseId) =>
        set((state) => {
            const newCompleted = new Set(state.instructorCompleted);
            newCompleted.add(courseId);
            return { instructorCompleted: newCompleted };
        }),

    coursesList: [...mockCourses],
    enrolledCourseIds: { ...initialEnrolled },

    getAllCourses: () => get().coursesList,
    getEnrolledCourses: (userId) => {
        const state = get();
        const enrolledIds = state.enrolledCourseIds[userId] || [];
        return state.coursesList.filter(c => enrolledIds.includes(c.id));
    },
    getTeachingCourses: (facultyName) => {
        return get().coursesList.filter(c => c.faculty === facultyName);
    },

    enrollUser: (userId, courseId) => set(state => {
        const userEnrollments = state.enrolledCourseIds[userId] || [];
        if (userEnrollments.includes(courseId)) return state;
        return {
            enrolledCourseIds: {
                ...state.enrolledCourseIds,
                [userId]: [...userEnrollments, courseId]
            }
        };
    }),
    unenrollUser: (userId, courseId) => set(state => {
        const userEnrollments = state.enrolledCourseIds[userId] || [];
        return {
            enrolledCourseIds: {
                ...state.enrolledCourseIds,
                [userId]: userEnrollments.filter(id => id !== courseId)
            }
        };
    }),

    addCourse: (course) => set(state => ({ coursesList: [...state.coursesList, course] })),
    
    updateCourse: (updatedCourse) => set(state => ({
        coursesList: state.coursesList.map(c => c.id === updatedCourse.id ? updatedCourse : c)
    })),
    
    deleteCourse: (courseId) => set(state => {
        // Also clean up enrollments and starred
        const newEnrolled = { ...state.enrolledCourseIds };
        Object.keys(newEnrolled).forEach(userId => {
            newEnrolled[userId] = newEnrolled[userId].filter(id => id !== courseId);
        });
        const newStarred = new Set(state.starred);
        newStarred.delete(courseId);

        return {
            coursesList: state.coursesList.filter(c => c.id !== courseId),
            enrolledCourseIds: newEnrolled,
            starred: newStarred
        };
    }),

    addModule: (courseId, title) => set(state => {
        return {
            coursesList: state.coursesList.map(course => {
                if (course.id !== courseId) return course;
                const newModule: Module = {
                    id: Math.random().toString(36).substring(2, 9),
                    courseId,
                    title,
                    order: course.modules.length + 1,
                    activities: []
                };
                return { ...course, modules: [...course.modules, newModule] };
            })
        };
    }),

    addActivity: (courseId, moduleId, activity) => set(state => {
        return {
            coursesList: state.coursesList.map(course => {
                if (course.id !== courseId) return course;
                const newModules = course.modules.map(mod => {
                    if (mod.id !== moduleId) return mod;
                    return { ...mod, activities: [...mod.activities, activity] };
                });
                return { ...course, modules: newModules, totalActivities: course.totalActivities + 1 };
            })
        };
    }),

    updateActivity: (courseId, moduleId, activity) => set(state => {
        return {
            coursesList: state.coursesList.map(course => {
                if (course.id !== courseId) return course;
                const newModules = course.modules.map(mod => {
                    if (mod.id !== moduleId) return mod;
                    const newActivities = mod.activities.map(a => a.id === activity.id ? activity : a);
                    return { ...mod, activities: newActivities };
                });
                return { ...course, modules: newModules };
            })
        };
    }),

    deleteActivity: (courseId, moduleId, activityId) => set(state => {
        return {
            coursesList: state.coursesList.map(course => {
                if (course.id !== courseId) return course;
                const newModules = course.modules.map(mod => {
                    if (mod.id !== moduleId) return mod;
                    return { ...mod, activities: mod.activities.filter(a => a.id !== activityId) };
                });
                return { ...course, modules: newModules, totalActivities: Math.max(0, course.totalActivities - 1) };
            })
        };
    }),
}));
