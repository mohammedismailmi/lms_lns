import { create } from 'zustand';
import api from '../lib/api';

interface QuizState {
    answers: Record<string, string>;
    markedForReview: Set<string>;
    tabSwitchCount: number;
    timeRemaining: number;
    isTerminated: boolean;

    saveAnswer: (questionId: string, answer: string) => void;
    toggleMarkForReview: (questionId: string) => void;
    incrementTabSwitch: () => void;
    terminateQuiz: () => void;
    tickTimer: () => void;
    setTimer: (seconds: number) => void;
    resetQuiz: () => void;
    submitQuiz: (activityId: string) => Promise<{ success: boolean; score?: number }>;
}

export const useQuizStore = create<QuizState>((set, get) => ({
    answers: {},
    markedForReview: new Set<string>(),
    tabSwitchCount: 0,
    timeRemaining: 0,
    isTerminated: false,

    saveAnswer: (questionId, answer) =>
        set((state) => ({
            answers: { ...state.answers, [questionId]: answer },
        })),

    toggleMarkForReview: (questionId) =>
        set((state) => {
            const newMarked = new Set(state.markedForReview);
            if (newMarked.has(questionId)) {
                newMarked.delete(questionId);
            } else {
                newMarked.add(questionId);
            }
            return { markedForReview: newMarked };
        }),

    incrementTabSwitch: () =>
        set((state) => ({ tabSwitchCount: state.tabSwitchCount + 1 })),

    terminateQuiz: () => set({ isTerminated: true }),

    tickTimer: () =>
        set((state) => ({
            timeRemaining: Math.max(0, state.timeRemaining - 1),
        })),

    setTimer: (seconds) => set({ timeRemaining: Math.max(0, seconds) }),

    resetQuiz: () =>
        set({
            answers: {},
            markedForReview: new Set<string>(),
            tabSwitchCount: 0,
            timeRemaining: 0,
            isTerminated: false,
        }),

    submitQuiz: async (activityId) => {
        const { answers, tabSwitchCount } = get();
        try {
            const response = await api.post(`/api/quizzes/${activityId}/submit`, { answers, tabSwitchCount });
            const data = response.data;
            if (data.success) {
                get().resetQuiz();
                return { success: true, score: data.score };
            }
            return { success: false };
        } catch (err) {
            console.error('Quiz submission error:', err);
            return { success: false };
        }
    },
}));
