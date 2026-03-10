import React from 'react';
import { Question } from '../../lib/mockData';
import { useQuizStore } from '../../store/quizStore';
import { CheckCircle2, Bookmark, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
    question: Question;
    questionNumber: number;
    totalQuestions: number;
    onNext: () => void;
}

export default function QuestionCard({ question, questionNumber, totalQuestions, onNext }: Props) {
    const { answers, saveAnswer, markedForReview, toggleMarkForReview } = useQuizStore();

    const selectedAnswer = answers[question.id];
    const isMarked = markedForReview.has(question.id);

    const handleSelect = (option: string) => {
        saveAnswer(question.id, option);
    };

    const handleClear = () => {
        saveAnswer(question.id, '');
    };

    const handleSaveAndNext = () => {
        // Already saved implicitly on click, just advance
        onNext();
    };

    const handleMarkAndNext = () => {
        if (!isMarked) toggleMarkForReview(question.id);
        onNext();
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-border flex flex-col h-full">
            <div className="p-8 border-b border-border bg-slate-50 rounded-t-xl flex items-center justify-between">
                <h2 className="text-xl font-bold text-navy">Question {questionNumber} of {totalQuestions}</h2>
                {isMarked && (
                    <span className="flex items-center gap-1.5 text-highlight bg-highlight/10 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider border border-highlight/20">
                        <Bookmark className="w-4 h-4 fill-highlight" /> Marked for Review
                    </span>
                )}
            </div>

            <div className="p-8 flex-1 overflow-y-auto">
                <div className="text-xl text-ink font-serif mb-8 leading-relaxed">
                    {question.text}
                </div>

                <div className="space-y-4">
                    {question.options.map((option, index) => {
                        const isSelected = selectedAnswer === option;
                        const letter = String.fromCharCode(65 + index); // A, B, C, D

                        return (
                            <button
                                key={index}
                                onClick={() => handleSelect(option)}
                                className={cn(
                                    "w-full text-left p-5 rounded-xl border-2 transition-all flex items-start gap-4 group",
                                    isSelected
                                        ? "border-primary bg-primary/5 shadow-inner"
                                        : "border-border bg-white hover:bg-slate-50 hover:border-slate-300"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors border-2",
                                    isSelected
                                        ? "bg-primary text-white border-primary"
                                        : "bg-surface text-muted border-slate-300 group-hover:border-slate-400"
                                )}>
                                    {letter}
                                </div>
                                <span className={cn("text-lg pt-0.5", isSelected ? "text-primary font-medium" : "text-ink")}>
                                    {option}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="p-6 border-t border-border bg-surface rounded-b-xl flex items-center justify-between gap-4">
                <button
                    onClick={handleClear}
                    disabled={!selectedAnswer}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-muted font-bold hover:text-navy disabled:opacity-50 transition-colors"
                >
                    <XCircle className="w-5 h-5" /> Clear Response
                </button>

                <div className="flex gap-4">
                    <button
                        onClick={handleMarkAndNext}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-highlight hover:bg-yellow-600 text-white font-bold transition-all shadow-sm"
                    >
                        <Bookmark className="w-5 h-5" /> Mark for Review & Next
                    </button>

                    <button
                        onClick={handleSaveAndNext}
                        className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-success hover:bg-green-800 text-white font-bold transition-all shadow-sm"
                    >
                        <CheckCircle2 className="w-5 h-5" /> Save & Next
                    </button>
                </div>
            </div>
        </div>
    );
}
