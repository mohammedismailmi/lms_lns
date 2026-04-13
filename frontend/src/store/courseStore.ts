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
    enrollUser: (userId: string, courseId: string) => Promise<void>;
    unenrollUser: (userId: string, courseId: string) => void;
    hydrateEnrollments: (userId: string) => Promise<void>;
    hydrateCourses: () => Promise<void>;

    addCourse: (course: any) => Promise<void>;
    updateCourse: (course: any) => Promise<void>;
    deleteCourse: (courseId: string) => Promise<void>;

    fetchCourse: (courseId: string) => Promise<void>;
    addModule: (courseId: string, title: string) => Promise<void>;
    addActivity: (courseId: string, moduleId: string, activity: Activity) => Promise<void>;
    updateActivity: (courseId: string, moduleId: string, activity: Activity) => void;
    deleteActivity: (courseId: string, moduleId: string, activityId: string) => void;
}

const initialEnrolled: Record<string, string[]> = {};

import api, { resolveMediaUrl } from '../lib/api';
import { useAuthStore } from './authStore';

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
    markCourseComplete: async (courseId) => {
        set((state) => {
            const newCompleted = new Set(state.instructorCompleted);
            newCompleted.add(courseId);
            return { instructorCompleted: newCompleted };
        });

        // Sync with backend
        try {
            const course = get().coursesList.find(c => c.id === courseId);
            if (course) {
                await api.put(`/api/courses/${courseId}`, { 
                    status: 'completed',
                    total_activities: course.totalActivities,
                });
            }
        } catch (err) {
            console.error('Failed to sync course completion:', err);
        }
    },

    coursesList: [],
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

    hydrateEnrollments: async (userId) => {
        try {
            const res = await api.get('/api/enrollments/me');
            if (res.data.success) {
                const courseIds = res.data.enrollments.map((e: any) => e.course_id);
                set(state => ({
                    enrolledCourseIds: {
                        ...state.enrolledCourseIds,
                        [userId]: courseIds
                    }
                }));
            }
        } catch (err) {
            console.error('Failed to hydrate enrollments:', err);
        }
    },

    enrollUser: async (userId, courseId) => {
        set((state) => {
            const userEnrollments = state.enrolledCourseIds[userId] || [];
            if (userEnrollments.includes(courseId)) return state;
            return {
                enrolledCourseIds: {
                    ...state.enrolledCourseIds,
                    [userId]: [...userEnrollments, courseId]
                }
            };
        });
        try {
            const tenantId = useAuthStore.getState().user?.tenantId;
            await api.post('/api/enrollments', { course_id: courseId, tenant_id: tenantId });
        } catch (err) {
            console.error('Failed to sync enrollment:', err);
        }
    },
    unenrollUser: (userId, courseId) => set(state => {
        const userEnrollments = state.enrolledCourseIds[userId] || [];
        return {
            enrolledCourseIds: {
                ...state.enrolledCourseIds,
                [userId]: userEnrollments.filter(id => id !== courseId)
            }
        };
    }),

    hydrateCourses: async () => {
        try {
            const res = await api.get('/api/courses');
            if (res.data.success) {
                // Map backend fields to frontend Course type
                const courses = res.data.courses.map((c: any) => ({
                    id: c.id,
                    name: c.title,
                    description: c.description || '',
                    section: c.section || 'Platform Course',
                    faculty: c.faculty_name || c.instructor_name || 'Unassigned',
                    facultyInitial: (c.faculty_name || c.instructor_name || '??').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
                    instructorId: c.instructor_id,
                    category: c.category || 'Default',
                    thumbnailColor: c.thumbnail_color || '#1B3A6B',
                    isCompleted: c.status === 'completed',
                    totalActivities: c.total_activities,
                    enrolledCount: c.enrolled_count || 0,
                    progressPercent: c.total_activities > 0 ? Math.round(c.progress_sum / c.total_activities) : 0,
                    modules: []
                }));
                set({ coursesList: courses });
            }
        } catch (err) {
            console.error('Failed to hydrate courses:', err);
        }
    },

    addCourse: async (courseData) => {
        try {
            const res = await api.post('/api/courses', {
                title: courseData.name,
                description: courseData.description,
                category: courseData.category,
                section: courseData.section,
                thumbnailColor: courseData.thumbnailColor,
                instructorId: courseData.instructorId
            });
            if (res.data.success) {
                await get().hydrateCourses();
            }
        } catch (err) {
            console.error('Failed to add course:', err);
        }
    },

    updateCourse: async (updatedCourse) => {
        try {
            await api.put(`/api/courses/${updatedCourse.id}`, {
                title: updatedCourse.name,
                description: updatedCourse.description,
                category: updatedCourse.category,
                section: updatedCourse.section,
                thumbnailColor: updatedCourse.thumbnailColor,
                status: updatedCourse.isCompleted ? 'completed' : 'draft',
                instructor_id: (updatedCourse as any).instructorId
            });
            await get().hydrateCourses();
        } catch (err) {
            console.error('Failed to update course:', err);
        }
    },

    deleteCourse: async (courseId) => {
        try {
            await api.delete(`/api/courses/${courseId}`);
            await get().hydrateCourses();
        } catch (err) {
            console.error('Failed to delete course:', err);
        }
        
        set(state => {
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
        });
    },

    fetchCourse: async (courseId) => {
        try {
            const res = await api.get(`/api/courses/${courseId}`);
            if (res.data.success) {
                const c = res.data.course;
                const normalized: any = {
                    id: c.id,
                    name: c.title,
                    description: c.description || '',
                    section: c.section || 'Platform Course',
                    faculty: c.faculty_name || c.instructor_name || 'Unassigned',
                    facultyInitial: (c.faculty_name || c.instructor_name || '??').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
                    instructorId: c.instructor_id,
                    category: c.category || 'Default',
                    thumbnailColor: c.thumbnail_color || '#1B3A6B',
                    isCompleted: c.status === 'completed',
                    totalActivities: c.total_activities,
                    enrolledCount: c.enrolledCount || 0,
                    modules: (c.modules || []).map((m: any) => ({
                        id: m.id,
                        courseId: c.id,
                        title: m.title,
                        order: m.order ?? m.order_index ?? 0,
                        activities: (m.activities || []).map((a: any) => ({
                            ...a,
                            id: a.id,
                            moduleId: m.id,
                            title: a.title,
                            type: a.type,
                            content: a.content,
                            videoUrl: resolveMediaUrl(a.video_url || a.videoUrl),
                            maxScore: a.max_score || a.maxScore || 0,
                            fileUrl: resolveMediaUrl(a.file_url || a.fileUrl),
                            fileName: a.file_name || a.fileName,
                            fileType: a.file_type || a.fileType,
                            fileSize: a.file_size || a.fileSize,
                            duration: a.duration,
                            durationMinutes: a.duration,
                            scheduledAt: a.scheduled_at || a.scheduledAt,
                            meetLink: a.meet_link || a.meetLink,
                            dueAt: a.due_at || a.dueAt,
                            questions: a.questions || [],
                            order: a.order ?? a.order_index ?? 0,
                        }))
                    }))
                };
                set(state => ({
                    coursesList: state.coursesList.map(item => item.id === courseId ? normalized : item)
                }));
            }
        } catch (err) {
            console.error('Failed to fetch course details:', err);
        }
    },

    addModule: async (courseId, title) => {
        try {
            const res = await api.post(`/api/courses/${courseId}/modules`, { title, orderIndex: get().coursesList.find(c => c.id === courseId)?.modules.length || 0 });
            if (res.data.success) {
                // Optimal: just reload course
                await get().fetchCourse(courseId);
            }
        } catch (err) {
            console.error('Failed to add module:', err);
        }
    },

    addActivity: async (courseId, moduleId, activity) => {
        try {
            const payload = { 
                ...activity, 
                moduleId,
                content: (activity as any).url || (activity as any).content || '',
                videoUrl: (activity as any).videoUrl || (activity as any).video_url || '',
                video_url: (activity as any).videoUrl || (activity as any).video_url || '',
                maxScore: (activity as any).maxScore || (activity as any).max_score || 0,
                orderIndex: (activity as any).orderIndex || 0
            };
            const res = await api.post(`/api/courses/${courseId}/activities`, payload);
            if (res.data.success) {
                await get().fetchCourse(courseId);
            }
        } catch (err) {
            console.error('Failed to add activity:', err);
        }
    },

    updateActivity: async (courseId, moduleId, activity) => {
        try {
            const payload = {
                ...activity,
                videoUrl: (activity as any).videoUrl || (activity as any).video_url || '',
                video_url: (activity as any).videoUrl || (activity as any).video_url || '',
                maxScore: (activity as any).maxScore || (activity as any).max_score || 0,
                content: (activity as any).url || (activity as any).content || ''
            };
            const res = await api.put(`/api/courses/${courseId}/activities/${activity.id}`, payload);
            if (res.data.success) {
                await get().fetchCourse(courseId);
            }
        } catch (err) {
            console.error('Failed to update activity:', err);
        }
    },

    deleteActivity: async (courseId, moduleId, activityId) => {
        try {
            await api.delete(`/api/courses/${courseId}/activities/${activityId}`);
        } catch (err) {
            console.error('Failed to delete activity from backend:', err);
        }

        set(state => {
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
        });
    },
}));
