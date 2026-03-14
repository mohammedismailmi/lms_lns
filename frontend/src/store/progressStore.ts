import { create } from 'zustand';
import { Activity } from '../lib/mockData';
import api from '../lib/api';
import { useCourseStore } from './courseStore';

interface ProgressState {
    activityStatus: Record<string, 'not_started' | 'in_progress' | 'completed'>;
    videoProgress: Record<string, number>; // 0 to 100
    courseProgress: Record<string, number>; // 0 to 100

    hydrateProgress: () => Promise<void>;
    markDone: (activityId: string) => Promise<void>;
    markInProgress: (activityId: string) => Promise<void>;
    updateVideoProgress: (activityId: string, percent: number) => Promise<void>;
    getCourseProgress: (courseId: string, activities: Activity[]) => number;
    recalculateCourseProgress: (courseId: string, activities: Activity[]) => void;
}

function findCourseId(activityId: string) {
    const courses = useCourseStore.getState().coursesList;
    for (const c of courses) {
        for (const m of c.modules) {
            for (const a of m.activities) {
                if (a.id === activityId) return c.id;
            }
        }
    }
    return "c1"; // fallback
}

export const useProgressStore = create<ProgressState>((set, get) => ({
    activityStatus: {},
    videoProgress: {},
    courseProgress: {},

    hydrateProgress: async () => {
        try {
            const res = await api.get('/api/progress/me');
            if (res.data.success) {
                const activityStatus: Record<string, 'not_started' | 'in_progress' | 'completed'> = {};
                const videoProgress: Record<string, number> = {};

                res.data.progress.forEach((p: any) => {
                    videoProgress[p.lesson_id] = p.percent_complete;
                    activityStatus[p.lesson_id] = p.percent_complete >= 100 ? 'completed' : 'in_progress';
                });

                set(state => ({
                    activityStatus: { ...state.activityStatus, ...activityStatus },
                    videoProgress: { ...state.videoProgress, ...videoProgress }
                }));
            }
        } catch (err) {
            console.error('Failed to hydrate progress:', err);
        }
    },

    markDone: async (activityId) => {
        // Optimistic update
        set((state) => ({
            activityStatus: { ...state.activityStatus, [activityId]: 'completed' },
            videoProgress: { ...state.videoProgress, [activityId]: 100 },
        }));

        try {
            await api.post(`/api/progress`, {
                course_id: findCourseId(activityId),
                lesson_id: activityId,
                percent_complete: 100,
                tenant_id: 't1'
            });
        } catch (err) {
            console.error('Failed to sync completion:', err);
        }
    },

    markInProgress: async (activityId) => {
        if (get().activityStatus[activityId] === 'completed') return;

        set((state) => ({
            activityStatus: { ...state.activityStatus, [activityId]: 'in_progress' },
        }));

        try {
            await api.post(`/api/progress`, {
                course_id: findCourseId(activityId),
                lesson_id: activityId,
                percent_complete: 1,
                tenant_id: 't1'
            });
        } catch (err) {
            console.error('Failed to sync progress:', err);
        }
    },

    updateVideoProgress: async (activityId, percent) => {
        if (get().videoProgress[activityId] >= percent) return;

        set((state) => {
            const updates: Partial<ProgressState> = {
                videoProgress: { ...state.videoProgress, [activityId]: percent }
            };
            if (state.activityStatus[activityId] !== 'completed') {
                updates.activityStatus = { ...state.activityStatus, [activityId]: 'in_progress' };
            }
            return updates;
        });

        // Simple debounce could be added here, but for stub we just fire
        try {
            await api.post(`/api/progress`, {
                course_id: findCourseId(activityId),
                lesson_id: activityId,
                percent_complete: percent,
                tenant_id: 't1'
            });
        } catch (err) {
            console.error('Failed to sync video progress:', err);
        }
    },

    getCourseProgress: (courseId, activities) => {
        if (activities.length === 0) return 0;
        const state = get();
        const completedCount = activities.filter(
            (a) => state.activityStatus[a.id] === 'completed'
        ).length;
        return Math.round((completedCount / activities.length) * 100);
    },

    recalculateCourseProgress: (courseId, activities) => {
        set((state) => {
            const p = get().getCourseProgress(courseId, activities);
            return {
                courseProgress: { ...state.courseProgress, [courseId]: p },
            };
        });
    },
}));
