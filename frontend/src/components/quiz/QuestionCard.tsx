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
    readOnly?: boolean;
}

export default function QuestionCard({ question, questionNumber, totalQuestions, onNext, readOnly }: Props) {
    const { answers, saveAnswer, markedForReview, toggleMarkForReview } = useQuizStore();

    const selectedAnswer = answers[question.id];
    const isMarked = markedForReview.has(question.id);
    const correctAnswer = question.options[question.correctAnswerIndex];

    const handleSelect = (option: string) => {
        if (readOnly) return;
        saveAnswer(question.id, option);
    };

    const handleClear = () => {
        if (readOnly) return;
        saveAnswer(question.id, '');
    };

    const handleSaveAndNext = () => {
        onNext();
    };

    const handleMarkAndNext = () => {
        if (!readOnly && !isMarked) toggleMarkForReview(question.id);
        onNext();
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-border flex flex-col h-full">
            <div className="p-4 sm:p-8 border-b border-border bg-slate-50 rounded-t-xl flex items-center justify-between">
                <h2 className="text-xl font-bold text-navy">Question {questionNumber} of {totalQuestions}</h2>
                {!readOnly && isMarked && (
                    <span className="flex items-center gap-1.5 text-highlight bg-highlight/10 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider border border-highlight/20">
                        <Bookmark className="w-4 h-4 fill-highlight" /> Marked for Review
                    </span>
                )}
                {readOnly && (
                    <span className="bg-navy/10 text-navy px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-navy/20">
                        Review Mode
                    </span>
                )}
            </div>

            <div className="p-4 sm:p-8 flex-1 overflow-y-auto">
                <div className="text-xl text-ink font-serif mb-8 leading-relaxed">
                    {question.text}
                </div>

                <div className="space-y-4">
                    {(!question.type || question.type === 'mcq') && question.options?.map((option, index) => {
                        const isSelected = selectedAnswer === option;
                        const isCorrect = option === correctAnswer;
                        const letter = String.fromCharCode(65 + index); // A, B, C, D

                        let buttonStyles = "border-border bg-white hover:bg-slate-50 hover:border-slate-300";
                        let circleStyles = "bg-surface text-muted border-slate-300 group-hover:border-slate-400";
                        
                        if (readOnly) {
                            if (isCorrect) {
                                buttonStyles = "border-success bg-success/5 shadow-sm ring-1 ring-success/20";
                                circleStyles = "bg-success text-white border-success";
                            } else if (isSelected && !isCorrect) {
                                buttonStyles = "border-accent bg-accent/5 shadow-sm ring-1 ring-accent/20";
                                circleStyles = "bg-accent text-white border-accent";
                            } else {
                                buttonStyles = "border-border bg-white opacity-60 grayscale-[0.5]";
                                circleStyles = "bg-surface text-muted border-slate-300";
                            }
                        } else if (isSelected) {
                            buttonStyles = "border-primary bg-primary/5 shadow-inner";
                            circleStyles = "bg-primary text-white border-primary";
                        }

                        return (
                            <button
                                key={index}
                                onClick={() => handleSelect(option)}
                                disabled={readOnly}
                                className={cn(
                                    "w-full text-left p-5 rounded-xl border-2 transition-all flex items-start gap-4 group",
                                    buttonStyles
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors border-2",
                                    circleStyles
                                )}>
                                    {isCorrect && readOnly ? <CheckCircle2 className="w-5 h-5" /> : letter}
                                </div>
                                <div className="flex-1 flex justify-between items-start">
                                    <span className={cn("text-lg pt-0.5", isSelected ? "text-primary font-medium" : "text-ink")}>
                                        {option}
                                    </span>
                                    {readOnly && isSelected && !isCorrect && (
                                        <div className="flex items-center gap-1.5 text-accent text-xs font-bold uppercase tracking-widest mt-1">
                                            <XCircle className="w-4 h-4" /> Incorrect Selection
                                        </div>
                                    )}
                                    {readOnly && isCorrect && (
                                        <div className="flex items-center gap-1.5 text-success text-xs font-bold uppercase tracking-widest mt-1">
                                            <CheckCircle2 className="w-4 h-4" /> Correct Answer
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}

                    {question.type === 'short_answer' && (
                        <input
                            type="text"
                            placeholder="Type your short answer here..."
                            value={selectedAnswer || ''}
                            onChange={(e) => handleSelect(e.target.value)}
                            disabled={readOnly}
                            className={cn(
                                "w-full p-4 rounded-xl border-2 transition-all text-lg focus:outline-none focus:ring-4 focus:ring-primary/20",
                                readOnly ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-white border-border hover:border-slate-300 focus:border-primary text-ink"
                            )}
                        />
                    )}

                    {question.type === 'long_answer' && (
                        <textarea
                            placeholder="Type your detailed answer here..."
                            value={selectedAnswer || ''}
                            onChange={(e) => handleSelect(e.target.value)}
                            disabled={readOnly}
                            rows={8}
                            className={cn(
                                "w-full p-5 rounded-xl border-2 transition-all text-lg leading-relaxed focus:outline-none focus:ring-4 focus:ring-primary/20 resize-y min-h-[200px]",
                                readOnly ? "bg-slate-50 border-slate-200 text-slate-800 cursor-not-allowed" : "bg-white border-border hover:border-slate-300 focus:border-primary text-ink"
                            )}
                        />
                    )}

                    {readOnly && (question.type === 'short_answer' || question.type === 'long_answer') && (question as any).sampleAnswer && (
                        <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                            <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Sample Answer / Rubric</h4>
                            <p className="text-sm text-ink/80 whitespace-pre-wrap">{(question as any).sampleAnswer}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6 border-t border-border bg-surface rounded-b-xl flex items-center justify-end gap-4">
                {!readOnly ? (
                    <>
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
                    </>
                ) : (
                    <button
                        onClick={handleSaveAndNext}
                        className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-navy hover:bg-slate-800 text-white font-bold transition-all shadow-sm"
                    >
                        Next Question <CheckCircle2 className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
}

