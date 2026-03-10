import { create } from 'zustand';

interface CourseState {
    starred: Set<string>; // courseIds
    toggleStar: (courseId: string) => void;

    instructorCompleted: Set<string>; // courseIds marked complete by teacher
    markCourseComplete: (courseId: string) => void;
}

export const useCourseStore = create<CourseState>((set) => ({
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
}));
