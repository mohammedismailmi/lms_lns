import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useProgressStore } from '../../store/progressStore';
import { Upload, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../lib/useToast';

interface Props {
    activity: {
        id: string;
        title: string;
        content?: string;
    };
}

export default function SubmissionActivity({ activity }: Props) {
    const { user } = useAuthStore();
    const { activityStatus, markDone } = useProgressStore();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [submitted, setSubmitted] = useState(activityStatus[activity.id] === 'completed');
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const toast = useToast();

    const isInstructor = user?.role === 'admin' || user?.role === 'instructor';

    useEffect(() => {
        if (isInstructor) {
            setLoadingSubmissions(true);
            api.get(`/api/activities/${activity.id}/submissions`)
                .then(res => setSubmissions(res.data.submissions || []))
                .catch(() => toast.error('Failed to load submissions'))
                .finally(() => setLoadingSubmissions(false));
        }
    }, [activity.id, isInstructor]);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        try {
            const res = await api.post(`/api/activities/${activity.id}/submit`, {
                fileName: file.name,
                fileUrl: `https://storage.lms.com/submissions/${activity.id}/${file.name}`
            });

            if (res.data.success) {
                setSubmitted(true);
                markDone(activity.id);
                toast.success('Assignment submitted successfully!');
            }
        } catch (err) {
            toast.error('Failed to submit assignment.');
        } finally {
            setUploading(false);
        }
    };

    const handleGrade = async (subId: string, grade: string, feedback: string) => {
        try {
            await api.put(`/api/submissions/${subId}/grade`, { grade, feedback });
            toast.success('Graded successfully');
            setSubmissions(prev => prev.map(s => s.id === subId ? { ...s, grade, feedback, status: 'graded' } : s));
        } catch (err) {
            toast.error('Failed to grade');
        }
    };

    if (isInstructor) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-border p-6">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary rounded-lg text-white">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-navy">{activity.title} (Instructor)</h2>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold text-navy uppercase text-xs tracking-widest">Student Submissions</h3>
                    {loadingSubmissions ? (
                        <div className="py-12 text-center text-muted animate-pulse">Loading submissions...</div>
                    ) : submissions.length === 0 ? (
                        <div className="py-12 text-center text-muted font-serif italic border-2 border-dashed border-slate-100 rounded-xl">No submissions yet.</div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {submissions.map(sub => (
                                <div key={sub.id} className="py-4 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-bold text-navy">{sub.user_name}</p>
                                        <p className="text-xs text-muted">Submitted on {new Date(sub.created_at * 1000).toLocaleDateString()}</p>
                                        <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline font-bold mt-1 inline-block">View File</a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {sub.status === 'graded' ? (
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-success">Grade: {sub.grade}</p>
                                                <p className="text-[10px] text-muted italic">"{sub.feedback}"</p>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <input id={`grade-${sub.id}`} placeholder="Grade" className="w-16 px-2 py-1 text-sm border border-border rounded-lg" />
                                                <button onClick={() => {
                                                    const grade = (document.getElementById(`grade-${sub.id}`) as HTMLInputElement).value;
                                                    handleGrade(sub.id, grade, 'Good work.');
                                                }} className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg transition-colors hover:bg-navy">Grade</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-border p-6" id={`activity-${activity.id}`}>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary rounded-lg text-white">
                    <FileText className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-navy">{activity.title}</h2>
            </div>

            <div className="bg-surface rounded-xl p-6 border border-slate-200 mb-6">
                <h3 className="font-bold text-navy mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    Instructions
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                    {activity.content || 'Please upload your completed assignment file (PDF, DOCX, or ZIP). Ensure all requirements mentioned in the module are met before submission.'}
                </p>
            </div>

            {submitted ? (
                <div className="bg-success/5 border border-success/20 rounded-xl p-8 text-center animate-in zoom-in-95">
                    <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-navy mb-2">Assignment Submitted</h3>
                    <p className="text-muted text-sm mb-6">Your submission has been recorded and is traceably stored. A faculty member will review and grade it shortly.</p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-success/30 rounded-full text-success text-xs font-bold uppercase tracking-widest">
                        Status: Pending Review
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer relative group">
                        <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            disabled={uploading}
                        />
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8 text-muted group-hover:text-primary" />
                        </div>
                        <p className="font-bold text-navy mb-1">
                            {file ? file.name : 'Click or drag file to upload'}
                        </p>
                        <p className="text-xs text-muted uppercase tracking-widest font-medium">PDF, DOCX, ZIP (MAX 25MB)</p>
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="w-full bg-primary hover:bg-navy text-white font-bold py-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {uploading ? (
                            <Clock className="w-5 h-5 animate-spin" />
                        ) : (
                            <Upload className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                        )}
                        Submit Assignment
                    </button>
                </div>
            )}
        </div>
    );
}
