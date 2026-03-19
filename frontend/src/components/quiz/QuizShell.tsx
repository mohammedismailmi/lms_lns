import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courses } from '../../lib/mockData';
import { useQuizStore } from '../../store/quizStore';
import { useProgressStore } from '../../store/progressStore';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import QuizResults from './QuizResults';

import ProctoringOverlay from './ProctoringOverlay';
import QuizTimer from './QuizTimer';
import QuestionCard from './QuestionCard';
import QuestionNavigator from './QuestionNavigator';
import QuizSummary from './QuizSummary';

interface Props {
    isExam: boolean;
}

export default function QuizShell({ isExam }: Props) {
    const { id } = useParams(); // quizId or examId
    const navigate = useNavigate();

    const { markDone } = useProgressStore();
    const { answers, resetQuiz, setTimer, isTerminated } = useQuizStore();

    const [visitedSet, setVisitedSet] = useState<Set<string>>(new Set());
    const [currentIndex, setCurrentIndex] = useState(0);
    const [viewState, setViewState] = useState<'intro' | 'active' | 'summary'>('intro');
    const [readOnlyMode, setReadOnlyMode] = useState(false);
    const [computedScore, setComputedScore] = useState<number | null>(null);

    const { user } = useAuthStore();
    const isInstructor = user?.role === 'admin' || user?.role === 'instructor';
    const [existingResult, setExistingResult] = useState<any>(null);
    const [loadingResult, setLoadingResult] = useState(false);

    // Find the activity in mockData
    const course = courses.find(c => c.modules.some(m => m.activities.some(a => a.id === id)));
    const activity: any = course?.modules.flatMap(m => m.activities).find(a => a.id === id);

    useEffect(() => {
        if (!activity) return;
        resetQuiz();
        setTimer(activity.duration * 60);
        if (activity.questions.length > 0) {
            setVisitedSet(new Set([activity.questions[0].id]));
        }

        if (!isInstructor) {
            setLoadingResult(true);
            api.get(`/api/quizzes/${activity.id}/my-result`).then(res => {
                if (res.data.success && res.data.result) {
                    setExistingResult(res.data.result);
                }
            }).finally(() => setLoadingResult(false));
        }

        return () => resetQuiz();
    }, [activity?.id, isInstructor]);

    if (!activity || (activity.type !== 'quiz' && activity.type !== 'exam')) {
        return (
            <div className="p-8 font-serif text-2xl text-accent border border-accent bg-white min-h-screen text-center flex flex-col items-center justify-center gap-4">
                <p>Quiz not found.</p>
                <button onClick={() => navigate(-1)} className="text-sm font-bold text-navy hover:underline">Go back</button>
            </div>
        );
    }

    if (isInstructor) {
        return (
            <div className="min-h-screen bg-surface flex flex-col pt-8">
                <div className="px-6 mb-4">
                    <button onClick={() => navigate(-1)} className="text-sm font-bold text-navy hover:underline">← Back to Course</button>
                </div>
                <QuizResults activityId={activity.id} title={activity.title} />
            </div>
        );
    }

    if (loadingResult) {
        return <div className="min-h-screen bg-surface flex items-center justify-center p-6 text-muted font-bold animate-pulse">Loading assessment...</div>;
    }

    if (existingResult) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center p-6">
                <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl border border-border p-12 text-center">
                    <h1 className="text-4xl font-serif font-bold text-navy mb-4">{activity.title}</h1>
                    
                    {existingResult.isPublished ? (
                        <div className="bg-success/5 border border-success/20 p-8 rounded-xl mb-8">
                            <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-navy mb-2">Assessment Graded</h2>
                            <p className="text-sm text-muted mb-6">Submitted on {new Date(existingResult.submittedAt).toLocaleString()}</p>
                            
                            <div className="inline-block bg-white px-8 py-4 rounded-xl shadow-sm border border-border mb-4">
                                <p className="text-xs uppercase tracking-widest text-muted font-bold mb-1">Final Score</p>
                                <p className="text-4xl font-serif font-bold text-primary">
                                    {existingResult.modifiedScore ?? existingResult.score} <span className="text-2xl text-slate-300">/ {existingResult.maxScore}</span>
                                </p>
                            </div>
                            
                            {existingResult.instructorNote && (
                                <div className="mt-6 text-left bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <p className="text-xs font-bold uppercase text-navy mb-1 tracking-wider">Instructor Note:</p>
                                    <p className="text-sm text-ink">{existingResult.instructorNote}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-highlight/5 border border-highlight/20 p-8 rounded-xl mb-8">
                            <AlertCircle className="w-16 h-16 text-highlight-foreground mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-navy mb-2">Submitted Successfully</h2>
                            <p className="text-sm text-muted">Your attempt has been recorded and is pending instructor review.</p>
                            <p className="text-xs text-muted mt-2">Submitted on {new Date(existingResult.submittedAt).toLocaleString()}</p>
                        </div>
                    )}

                    <button
                        onClick={() => navigate(`/course/${course?.id}`)}
                        className="px-8 py-3 rounded-xl font-bold text-navy bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                        Back to Course
                    </button>
                </div>
            </div>
        );
    }

    const handleStart = () => {
        setViewState('active');
    };

    const handleNavigate = (index: number) => {
        setCurrentIndex(index);
        setVisitedSet(prev => new Set(prev).add(activity.questions[index].id));
    };

    const handleNext = () => {
        if (currentIndex < activity.questions.length - 1) {
            handleNavigate(currentIndex + 1);
        } else {
            handleAutoSubmit();
        }
    };

    const handleAutoSubmit = () => {
        setViewState('summary');

        // Compute score if it's a quiz
        if (!isExam) {
            let score = 0;
            activity.questions.forEach((q: any) => {
                const correctStr = q.options[q.correctAnswerIndex];
                if (answers[q.id] === correctStr) score++;
            });
            setComputedScore(score);
        }
    };

    const handleFinalSubmit = () => {
        // Fire-and-forget API call without touching quiz store state
        // This avoids the race condition where resetQuiz() in submitQuiz
        // would clear the state of the next quiz/exam that mounts
        const currentAnswers = { ...useQuizStore.getState().answers };
        const currentTabSwitchCount = useQuizStore.getState().tabSwitchCount;
        import('../../lib/api').then(({ default: apiClient }) => {
            apiClient.post(`/api/quizzes/${activity.id}/submit`, {
                answers: currentAnswers,
                tabSwitchCount: currentTabSwitchCount
            }).catch(() => {});
        });
        markDone(activity.id);
        navigate(`/course/${course?.id}`, { replace: true });
    };

    const currentQuestion = activity.questions[currentIndex];

    if (viewState === 'intro') {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center p-6">
                <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl border border-border p-12 text-center">
                    <h1 className="text-4xl font-serif font-bold text-navy mb-4">{activity.title}</h1>
                    <p className="text-lg text-muted mb-8">This assessment is strictly timed for {activity.duration} minutes.</p>

                    {isExam && (
                        <div className="bg-accent/10 border border-accent/20 p-6 rounded-xl text-left mb-8 shadow-inner">
                            <h3 className="font-bold text-accent mb-2">⚠ Strict Proctoring Rules</h3>
                            <ul className="list-disc pl-5 text-sm text-ink space-y-2 font-medium">
                                <li>You may not switch tabs, minimize the browser, or open other applications.</li>
                                <li>Doing so will issue a severe warning.</li>
                                <li>After 3 violations, your exam will be automatically terminated and submitted as-is.</li>
                            </ul>
                        </div>
                    )}

                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => navigate(`/course/${course?.id}`)}
                            className="px-6 py-3 rounded-xl font-bold text-navy bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                            Back to Course
                        </button>
                        <button
                            onClick={handleStart}
                            className={`px-8 py-3 rounded-xl font-bold text-white shadow-md transition-all hover:-translate-y-0.5 ${isExam ? 'bg-accent hover:bg-red-800' : 'bg-success hover:bg-green-800'}`}
                        >
                            Begin Attempt
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (viewState === 'summary') {
        return (
            <QuizSummary
                questions={activity.questions}
                isExam={isExam}
                score={computedScore}
                onReview={() => {
                    setReadOnlyMode(true);
                    setViewState('active');
                    setCurrentIndex(0);
                }}
                onSubmitFinal={handleFinalSubmit}
                visitedSet={visitedSet}
            />
        );
    }

    return (
        <div className="min-h-screen bg-surface flex flex-col font-sans">
            {!readOnlyMode && <ProctoringOverlay isProctored={isExam} onAutoSubmit={handleAutoSubmit} />}

            {/* Top Bar */}
            <header className="bg-navy text-white h-20 flex items-center justify-between px-8 shadow-md shrink-0">
                <div>
                    <h2 className="text-2xl font-serif font-bold leading-tight">{activity.title}</h2>
                    <p className="text-sm text-slate-300 font-medium">{course?.name}</p>
                </div>

                <div className="flex items-center gap-6">
                    {readOnlyMode ? (
                        <button
                            onClick={() => setViewState('summary')}
                            className="bg-white text-navy font-bold px-6 py-2 rounded-lg hover:bg-slate-100"
                        >
                            Exit Review
                        </button>
                    ) : (
                        <>
                            <QuizTimer onTimeUp={handleAutoSubmit} />
                            <button
                                onClick={handleAutoSubmit}
                                className="bg-success hover:bg-green-700 text-white font-bold px-8 py-3 rounded-xl shadow-inner transition-colors border border-green-600"
                            >
                                Submit Assessment
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* Main Execution Area */}
            <main className="flex-1 overflow-hidden p-6 flex gap-6 max-w-[1600px] w-full mx-auto">
                <div className="flex-[7] min-w-0 pointer-events-auto h-full relative">
                    {readOnlyMode && <div className="absolute inset-0 z-10" />} {/* Block clicks in review mode */}
                    <QuestionCard
                        question={currentQuestion}
                        questionNumber={currentIndex + 1}
                        totalQuestions={activity.questions.length}
                        onNext={handleNext}
                    />
                </div>

                <div className="flex-[3] min-w-[300px] h-full overflow-y-auto pr-2 pb-8">
                    <QuestionNavigator
                        questions={activity.questions}
                        currentIndex={currentIndex}
                        visitedSet={visitedSet}
                        onNavigate={handleNavigate}
                    />
                </div>
            </main>
        </div>
    );
}
