import { create } from 'zustand';
import { Activity } from '../lib/mockData';

interface ProgressState {
    activityStatus: Record<string, 'not_started' | 'in_progress' | 'completed'>;
    videoProgress: Record<string, number>; // 0 to 100
    courseProgress: Record<string, number>; // 0 to 100

    markDone: (activityId: string) => void;
    markInProgress: (activityId: string) => void;
    updateVideoProgress: (activityId: string, percent: number) => void;
    getCourseProgress: (courseId: string, activities: Activity[]) => number;
    recalculateCourseProgress: (courseId: string, activities: Activity[]) => void;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
    activityStatus: {},
    videoProgress: {},
    courseProgress: {},

    markDone: (activityId) =>
        set((state) => ({
            activityStatus: { ...state.activityStatus, [activityId]: 'completed' },
            videoProgress: { ...state.videoProgress, [activityId]: 100 },
        })),

    markInProgress: (activityId) =>
        set((state) => {
            if (state.activityStatus[activityId] === 'completed') return state; // don't downgrade
            return {
                activityStatus: { ...state.activityStatus, [activityId]: 'in_progress' },
            };
        }),

    updateVideoProgress: (activityId, percent) =>
        set((state) => {
            if (state.videoProgress[activityId] >= percent) return state; // never downgrade

            const updates: Partial<ProgressState> = {
                videoProgress: { ...state.videoProgress, [activityId]: percent }
            };

            if (state.activityStatus[activityId] !== 'completed') {
                updates.activityStatus = { ...state.activityStatus, [activityId]: 'in_progress' };
            }

            return updates;
        }),

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
