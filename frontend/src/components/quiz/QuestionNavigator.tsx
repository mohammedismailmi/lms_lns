import React from 'react';
import { Question } from '../../lib/mockData';
import { useQuizStore } from '../../store/quizStore';
import { cn } from '../../lib/utils';

interface Props {
    questions: Question[];
    currentIndex: number;
    visitedSet: Set<string>;
    onNavigate: (index: number) => void;
}

export default function QuestionNavigator({ questions, currentIndex, visitedSet, onNavigate }: Props) {
    const { answers, markedForReview } = useQuizStore();

    const getSquareColor = (q: Question) => {
        const isAnswered = !!answers[q.id];
        const isMarked = markedForReview.has(q.id);
        const isVisited = visitedSet.has(q.id);

        if (isAnswered && isMarked) return 'bg-success text-white border-success ring-2 ring-highlight ring-offset-2';
        if (isMarked) return 'bg-highlight text-white border-highlight';
        if (isAnswered) return 'bg-success text-white border-success';
        if (isVisited) return 'bg-accent text-white border-accent'; // Visited, unanswered

        return 'bg-white text-navy border-border hover:border-slate-400'; // Not visited
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h3 className="text-sm font-bold text-navy uppercase tracking-wider mb-4">Question Palette</h3>

            <div className="grid grid-cols-5 gap-3 mb-8">
                {questions.map((q, idx) => {
                    const isActive = idx === currentIndex;
                    return (
                        <button
                            key={q.id}
                            onClick={() => onNavigate(idx)}
                            className={cn(
                                "w-full aspect-square rounded-lg flex items-center justify-center font-bold text-sm transition-all border-2",
                                getSquareColor(q),
                                isActive && "ring-2 ring-offset-2 ring-navy outline-none"
                            )}
                        >
                            {idx + 1}
                        </button>
                    );
                })}
            </div>

            <div className="space-y-3 text-xs font-medium text-muted">
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded border-2 bg-success border-success" /> Answered
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded border-2 bg-accent border-accent" /> Not Answered
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded border-2 bg-white border-border" /> Not Visited
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded border-2 bg-highlight border-highlight" /> Marked for Review
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded border-2 bg-success border-success ring-2 ring-offset-1 ring-highlight" /> Answered & Marked
                </div>
            </div>
        </div>
    );
}
