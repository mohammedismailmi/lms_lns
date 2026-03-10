import React from 'react';
import { Question } from '../../lib/mockData';
import { useQuizStore } from '../../store/quizStore';
import { FileDown, RefreshCcw } from 'lucide-react';
import QuestionNavigator from './QuestionNavigator';

interface Props {
    questions: Question[];
    isExam: boolean;
    score: number | null;
    onReview: () => void;
    onSubmitFinal: () => void;
    visitedSet: Set<string>;
}

export default function QuizSummary({ questions, isExam, score, onReview, onSubmitFinal, visitedSet }: Props) {
    const { answers, markedForReview } = useQuizStore();

    const answeredCount = Object.keys(answers).filter(k => !!answers[k]).length;
    const unansweredCount = questions.length - answeredCount;
    const markedCount = markedForReview.size;

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="bg-white rounded-2xl shadow-lg border border-border overflow-hidden">
                <div className="bg-navy px-8 py-6 text-white text-center">
                    <h1 className="text-3xl font-serif font-bold mb-2">Assessment Summary</h1>
                    <p className="text-slate-300 font-medium tracking-wide">Please review your statistics before final submission.</p>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                        <StatBox label="Total Questions" value={questions.length} color="text-navy" />
                        <StatBox label="Answered" value={answeredCount} color="text-success" />
                        <StatBox label="Unanswered" value={unansweredCount} color="text-accent" />
                        <StatBox label="Marked Review" value={markedCount} color="text-highlight" />
                    </div>

                    <div className="mb-10 max-w-sm mx-auto">
                        <QuestionNavigator
                            questions={questions}
                            currentIndex={-1}
                            visitedSet={visitedSet}
                            onNavigate={() => { }} // Disabled read-only mode for summary
                        />
                    </div>

                    <div className="bg-surface border border-slate-200 rounded-xl p-6 text-center mb-10">
                        {score !== null ? (
                            <div>
                                <p className="text-muted font-bold uppercase tracking-widest text-sm mb-2">Final Score</p>
                                <p className="text-5xl font-serif font-bold text-success">{Math.round((score / questions.length) * 100)}%</p>
                                <p className="text-muted mt-2">({score} out of {questions.length} correct)</p>
                            </div>
                        ) : isExam ? (
                            <p className="text-xl font-serif text-navy">
                                Your submission has been received. Results will be published by the instructor.
                            </p>
                        ) : (
                            <p className="text-muted italic">Score computation pending...</p>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={onReview}
                            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold bg-white text-navy border-2 border-slate-200 hover:border-navy hover:bg-slate-50 transition-all"
                        >
                            <RefreshCcw className="w-5 h-5" /> Review Answers
                        </button>
                        <button
                            onClick={onSubmitFinal}
                            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold bg-success hover:bg-green-800 text-white shadow-md transition-all"
                        >
                            <FileDown className="w-5 h-5" /> Submit Final
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="bg-surface rounded-xl p-4 text-center border border-border shadow-inner">
            <p className={`text-3xl font-bold font-serif mb-1 ${color}`}>{value}</p>
            <p className="text-xs font-bold text-muted uppercase tracking-wider">{label}</p>
        </div>
    );
}
