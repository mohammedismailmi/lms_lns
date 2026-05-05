import { create } from 'zustand';
import api from '../lib/api';

export interface ProctoringLogs {
    headTurns: number;
    multipleFaces: number;
    noFace: number;
    gazeViolations: number;
    audioViolations: number;
}

interface QuizState {
    answers: Record<string, string>;
    markedForReview: Set<string>;
    tabSwitchCount: number;
    proctoringLogs: ProctoringLogs;
    timeRemaining: number;
    isTerminated: boolean;

    saveAnswer: (questionId: string, answer: string) => void;
    loadAnswers: (answers: Record<string, string>) => void;
    toggleMarkForReview: (questionId: string) => void;
    incrementTabSwitch: () => void;
    incrementProctoringLog: (key: keyof ProctoringLogs) => void;
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
    proctoringLogs: { headTurns: 0, multipleFaces: 0, noFace: 0, gazeViolations: 0, audioViolations: 0 },
    timeRemaining: 0,
    isTerminated: false,

    saveAnswer: (questionId, answer) =>
        set((state) => ({
            answers: { ...state.answers, [questionId]: answer },
        })),

    loadAnswers: (answers) => set({ answers }),

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

    incrementProctoringLog: (key) =>
        set((state) => ({
            proctoringLogs: {
                ...state.proctoringLogs,
                [key]: state.proctoringLogs[key] + 1
            }
        })),

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
            proctoringLogs: { headTurns: 0, multipleFaces: 0, noFace: 0, gazeViolations: 0, audioViolations: 0 },
            timeRemaining: 0,
            isTerminated: false,
        }),

    submitQuiz: async (activityId) => {
        const { answers, tabSwitchCount, proctoringLogs } = get();
        try {
            const response = await api.post(`/api/quizzes/${activityId}/submit`, { answers, tabSwitchCount, proctoringLogs });
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
