import React, { useState, useEffect } from 'react';
import { useToast } from '../../lib/useToast';
import { Users, FileDiff, CheckCircle, Save, AlertCircle } from 'lucide-react';
import api from '../../lib/api';

interface Props {
    activityId: string;
    title: string;
}

export default function QuizResults({ activityId, title }: Props) {
    const [attempts, setAttempts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAttempt, setSelectedAttempt] = useState<any>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [modScore, setModScore] = useState<number | ''>('');
    const [instructorNote, setInstructorNote] = useState('');
    const toast = useToast();

    const fetchAttempts = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/quizzes/${activityId}/attempts`);
            if (res.data.success) setAttempts(res.data.attempts);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttempts();
    }, [activityId]);

    const handleSelectAttempt = async (attempt: any) => {
        setSelectedAttempt(attempt);
        setModScore(attempt.modifiedScore ?? attempt.score);
        setInstructorNote(attempt.instructorNote || '');
        setAnswers({});
        try {
            const res = await api.get(`/api/quiz-attempts/${attempt.id}/answers`);
            if (res.data.success) setAnswers(res.data.answers);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveScore = async () => {
        if (!selectedAttempt) return;
        try {
            await api.put(`/api/quiz-attempts/${selectedAttempt.id}/score`, {
                modifiedScore: modScore === '' ? null : Number(modScore),
                instructorNote: instructorNote
            });
            toast.success('Score updated');
            fetchAttempts();
            setSelectedAttempt(null);
        } catch (err) {
            toast.error('Failed to update score');
        }
    };

    const handlePublish = async (attemptId: string) => {
        try {
            await api.post(`/api/quiz-attempts/${attemptId}/publish`);
            toast.success('Result published');
            fetchAttempts();
        } catch (err) {
            toast.error('Failed to publish');
        }
    };

    const handlePublishAll = async () => {
        try {
            await api.post(`/api/quizzes/${activityId}/publish-all`);
            toast.success('All results published');
            fetchAttempts();
        } catch (err) {
            toast.error('Failed to publish all');
        }
    };

    if (loading) return <div className="p-4 sm:p-8 text-center text-muted font-serif italic">Loading results...</div>;

    return (
        <div className="flex-1 overflow-hidden flex flex-col p-6 max-w-[1600px] w-full mx-auto">
            <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-xl shadow-sm border border-border">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-navy mb-2">{title} - Results</h2>
                    <p className="text-sm font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                        <Users className="w-4 h-4" /> {attempts.length} Submissions
                    </p>
                </div>
                {attempts.length > 0 && (
                    <button
                        onClick={handlePublishAll}
                        className="bg-accent hover:bg-red-800 text-white font-bold px-6 py-3 rounded-xl shadow transition-colors flex items-center gap-2"
                    >
                        <CheckCircle className="w-5 h-5" /> Publish All Unpublished
                    </button>
                )}
            </div>

            <div className="flex gap-6 flex-1 min-h-0">
                <div className="w-1/3 bg-white border border-border rounded-xl shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-border items-center flex justify-between">
                        <span className="font-bold text-navy uppercase text-xs tracking-wider">Submissions</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {attempts.map(att => (
                            <div 
                                key={att.id} 
                                onClick={() => handleSelectAttempt(att)}
                                className={`p-4 rounded-xl border cursor-pointer transition-colors ${selectedAttempt?.id === att.id ? 'border-primary bg-primary/5' : 'border-border hover:border-slate-300'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-navy text-sm">{att.studentName}</h4>
                                    {att.isPublished === 1 && (
                                        <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full font-bold uppercase">Published</span>
                                    )}
                                </div>
                                <div className="flex justify-between text-xs text-muted font-medium">
                                    <span>Base: {att.score}/{att.maxScore}</span>
                                    {att.modifiedScore !== null && (
                                        <span className="text-primary font-bold">Mod: {att.modifiedScore}/{att.maxScore}</span>
                                    )}
                                </div>
                                {att.isPublished === 0 && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handlePublish(att.id); }}
                                        className="mt-3 text-xs font-bold text-primary hover:text-navy hover:underline flex px-0 gap-1 items-center"
                                    >
                                        <FileDiff className="w-3 h-3" /> Publish Singly
                                    </button>
                                )}
                            </div>
                        ))}
                        {attempts.length === 0 && (
                            <p className="text-sm text-center italic text-muted mt-8">No submissions yet.</p>
                        )}
                    </div>
                </div>

                <div className="w-2/3 bg-white border border-border rounded-xl shadow-sm flex flex-col overflow-hidden">
                    {selectedAttempt ? (
                        <>
                            <div className="p-6 bg-slate-50 border-b border-border flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-lg text-navy">{selectedAttempt.studentName}'s Attempt</h3>
                                    <p className="text-xs text-muted font-medium mt-1">Submitted: {new Date(selectedAttempt.submittedAt * 1000).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted uppercase font-bold tracking-wider mb-1">Final Score</p>
                                    <p className="text-2xl font-serif font-bold text-primary">
                                        {selectedAttempt.modifiedScore ?? selectedAttempt.score} <span className="text-lg text-muted">/ {selectedAttempt.maxScore}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-6 bg-surface p-6 rounded-xl border border-slate-200">
                                    <div>
                                        <label className="block text-xs uppercase font-bold text-navy mb-2 tracking-wider">Modify Score (Optional)</label>
                                        <input
                                            type="number"
                                            value={modScore}
                                            onChange={e => setModScore(e.target.value === '' ? '' : Number(e.target.value))}
                                            className="w-full border-border border rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary shadow-sm text-sm"
                                            placeholder={`Base score: ${selectedAttempt.score}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase font-bold text-navy mb-2 tracking-wider">Instructor Note</label>
                                        <textarea
                                            value={instructorNote}
                                            onChange={e => setInstructorNote(e.target.value)}
                                            className="w-full border-border border rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary shadow-sm text-sm min-h-[46px]"
                                            placeholder="Notes for student..."
                                        />
                                    </div>
                                    <div className="col-span-2 flex justify-end">
                                        <button
                                            onClick={handleSaveScore}
                                            className="bg-navy hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl shadow text-sm flex items-center gap-2 transition-colors"
                                        >
                                            <Save className="w-4 h-4" /> Save Adjustments
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="mb-6">
                                    <h4 className="font-bold text-navy uppercase tracking-widest text-xs mb-4">Proctoring Report</h4>
                                    {selectedAttempt.proctoringLogsJson ? (() => {
                                        try {
                                            const logs = JSON.parse(selectedAttempt.proctoringLogsJson);
                                            const totalViolations = (logs.headTurns || 0) + (logs.multipleFaces || 0) + (logs.noFace || 0) + (logs.gazeViolations || 0) + (logs.audioViolations || 0);
                                            return (
                                                <div className="bg-white border border-border p-5 rounded-xl shadow-sm">
                                                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                                                        <AlertCircle className={`w-6 h-6 ${totalViolations > 10 ? 'text-red-500' : totalViolations > 0 ? 'text-amber-500' : 'text-green-500'}`} />
                                                        <div>
                                                            <span className="block font-bold text-navy text-base">Total AI Infractions: {totalViolations}</span>
                                                            <span className="text-xs text-muted">A high number of infractions indicates potential academic misconduct.</span>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                            <span className="block text-muted text-xs uppercase font-bold tracking-wider mb-1">Head Turns</span>
                                                            <span className="text-lg font-bold text-navy">{logs.headTurns || 0}</span>
                                                        </div>
                                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                            <span className="block text-muted text-xs uppercase font-bold tracking-wider mb-1">Gaze Deviations</span>
                                                            <span className="text-lg font-bold text-navy">{logs.gazeViolations || 0}</span>
                                                        </div>
                                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                            <span className="block text-muted text-xs uppercase font-bold tracking-wider mb-1">Multiple Faces</span>
                                                            <span className="text-lg font-bold text-navy">{logs.multipleFaces || 0}</span>
                                                        </div>
                                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                            <span className="block text-muted text-xs uppercase font-bold tracking-wider mb-1">Missing Face</span>
                                                            <span className="text-lg font-bold text-navy">{logs.noFace || 0}</span>
                                                        </div>
                                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                            <span className="block text-muted text-xs uppercase font-bold tracking-wider mb-1">Audio Spikes</span>
                                                            <span className="text-lg font-bold text-navy">{logs.audioViolations || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        } catch (e) {
                                            return <p className="text-sm text-muted">Invalid log data format.</p>;
                                        }
                                    })() : (
                                        <div className="bg-slate-50 p-4 rounded-xl border border-border text-center">
                                            <p className="text-sm text-muted italic">No AI proctoring logs were recorded for this attempt.</p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h4 className="font-bold text-navy uppercase tracking-widest text-xs mb-4">Student Answers</h4>
                                    {Object.keys(answers).length > 0 ? (
                                        <div className="space-y-3">
                                            {Object.entries(answers).map(([qId, ans]) => (
                                                <div key={qId} className="bg-slate-50 p-4 rounded-lg border border-border">
                                                    <span className="text-xs font-mono text-muted block mb-1">QID: {qId}</span>
                                                    <span className="text-sm font-bold text-navy">Ans: {ans}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted italic">Click attempt to load answers</p>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted p-12 text-center">
                            <FileDiff className="w-16 h-16 opacity-20 mb-4" />
                            <p className="font-serif italic text-lg opacity-80">Select a submission from the list to view and grade.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
