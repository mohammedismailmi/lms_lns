import React, { useState, useEffect } from 'react';
import { Activity } from '../../lib/mockData';
import { X, Plus, Trash2 } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (activity: Activity) => void;
    existingActivity?: Activity;
}

export default function ActivityModal({ isOpen, onClose, onSave, existingActivity }: Props) {
    const [type, setType] = useState<Activity['type']>('video');
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState(10);
    const [url, setUrl] = useState('');
    const [fileName, setFileName] = useState('');
    const [fileType, setFileType] = useState('');
    const [fileSize, setFileSize] = useState(0);
    const [dueAt, setDueAt] = useState<string | undefined>();
    const [uploadingFile, setUploadingFile] = useState(false);
    const [uploadError, setUploadError] = useState('');

    // For quizzes
    const [questions, setQuestions] = useState<any[]>([]);

    useEffect(() => {
        if (existingActivity) {
            const existing = existingActivity as any;
            setType(existing.type);
            setTitle(existing.title);
            setDuration(existing.durationMinutes || 0);
            setUrl(existing.url || existing.videoUrl || '');
            setQuestions(existing.questions || []);
            setDueAt(existing.dueAt);
            setFileName(existing.fileName || '');
            setFileType(existing.fileType || '');
            setFileSize(existing.fileSize || 0);
        } else {
            setType('video');
            setTitle('');
            setDuration(10);
            setUrl('');
            setQuestions([]);
            setDueAt(undefined);
            setFileName('');
            setFileType('');
            setFileSize(0);
        }
    }, [existingActivity, isOpen]);

    if (!isOpen) return null;

    const addQuestion = () => {
        setQuestions([...questions, {
            id: 'q' + Math.random().toString(36).substring(2),
            text: '',
            options: ['', '', '', ''],
            correctOptionIndex: 0
        }]);
    };

    const updateQuestionText = (index: number, text: string) => {
        const copy = [...questions];
        copy[index].text = text;
        setQuestions(copy);
    };

    const updateOption = (qIndex: number, oIndex: number, text: string) => {
        const copy = [...questions];
        copy[qIndex].options[oIndex] = text;
        setQuestions(copy);
    };

    const setCorrectOption = (qIndex: number, oIndex: number) => {
        const copy = [...questions];
        copy[qIndex].correctOptionIndex = oIndex;
        setQuestions(copy);
    };

    const handleSave = () => {
        if (!title.trim()) return;
        const newActivity: any = {
            id: existingActivity?.id || 'a' + Math.random().toString(36).substring(2),
            type,
            title,
            durationMinutes: duration,
        };

        if (url.trim()) newActivity.url = url;
        if (type === 'quiz' || type === 'exam') {
            newActivity.questions = questions;
        }
        if (type === 'submission') {
            newActivity.dueAt = dueAt;
        }
        if (type === 'file') {
            newActivity.fileName = fileName;
            newActivity.fileType = fileType;
            newActivity.fileSize = fileSize;
        }

        onSave(newActivity);
        onClose();
    };

    const isAssessment = type === 'quiz' || type === 'exam';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8 animate-in zoom-in-95">
                <div className="flex justify-between flex-row items-center p-6 border-b border-border bg-surface">
                    <h2 className="text-2xl font-serif text-navy font-bold">
                        {existingActivity ? 'Edit Activity' : 'Create New Activity'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-muted hover:text-navy transition-colors bg-white rounded-lg shadow-sm">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-navy mb-2 uppercase tracking-wider text-xs">Activity Type</label>
                            <select
                                value={type}
                                onChange={e => setType(e.target.value as any)}
                                className="w-full border-border border rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary shadow-sm"
                            >
                                <option value="video">Video</option>
                                <option value="blog">Text / Article</option>
                                <option value="file">Downloadable File</option>
                                <option value="quiz">Quiz</option>
                                <option value="exam">Final Exam</option>
                                <option value="live_class">Live Class</option>
                                <option value="submission">Assignment / Submission</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-navy mb-2 uppercase tracking-wider text-xs">Title</label>
                            <input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full border-border border rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary shadow-sm"
                                placeholder="e.g. Introduction to Variables"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-navy mb-2 uppercase tracking-wider text-xs">Estimated Duration (Mins)</label>
                            <input
                                type="number"
                                value={duration}
                                onChange={e => setDuration(parseInt(e.target.value) || 0)}
                                className="w-full border-border border rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary shadow-sm"
                            />
                        </div>

                        {(!isAssessment && type !== 'file') && (
                            <div>
                                <label className="block text-sm font-bold text-navy mb-2 uppercase tracking-wider text-xs">Target URL / Asset Link</label>
                                <input
                                    value={url}
                                    onChange={e => setUrl(e.target.value)}
                                    className="w-full border-border border rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary shadow-sm"
                                    placeholder="https://"
                                />
                            </div>
                        )}

                        {type === 'file' && (
                            <div className="md:col-span-2 space-y-3 p-4 border border-border rounded-xl bg-slate-50">
                                <div>
                                    <label className="block text-xs font-semibold text-navy uppercase tracking-wide mb-2">
                                        Upload File
                                    </label>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.webm,.jpg,.jpeg,.png,.gif,.txt,.zip"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            setUploadingFile(true);
                                            setUploadError('');
                                            try {
                                                const fd = new FormData();
                                                fd.append('file', file);
                                                const res = await fetch(`${(import.meta as any).env.VITE_API_URL || ''}/api/upload/lesson-file`, {
                                                    method: 'POST',
                                                    credentials: 'include',
                                                    body: fd,
                                                });
                                                const data = await res.json();
                                                if (!res.ok) throw new Error(data.error || 'Upload failed');
                                                setUrl(data.fileUrl);
                                                setFileName(data.fileName);
                                                setFileType(data.fileType);
                                                setFileSize(data.fileSize);
                                            } catch (err: any) {
                                                setUploadError(err.message || 'Upload failed');
                                            } finally {
                                                setUploadingFile(false);
                                            }
                                        }}
                                        className="block w-full text-sm text-ink border border-border rounded-md px-3 py-2 cursor-pointer bg-white file:mr-3 file:py-1.5 file:px-4 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary file:text-white hover:file:bg-navy transition-colors"
                                    />
                                    {uploadingFile && <p className="text-xs text-muted mt-2 font-medium">Uploading...</p>}
                                    {uploadError && <p className="text-xs text-accent mt-2 font-bold">{uploadError}</p>}
                                    {fileName && !uploadingFile && (
                                        <p className="text-xs text-success mt-2 font-bold">✓ {fileName}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 my-2">
                                    <div className="flex-1 border-t border-border"></div>
                                    <span className="text-xs text-muted font-bold uppercase">Or paste URL</span>
                                    <div className="flex-1 border-t border-border"></div>
                                </div>
                                <input
                                    type="url"
                                    placeholder="https://example.com/file.pdf"
                                    value={url ?? ''}
                                    onChange={e => setUrl(e.target.value)}
                                    className="w-full border-border border rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary shadow-sm"
                                />
                            </div>
                        )}

                        {type === 'submission' && (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-navy mb-2 uppercase tracking-wider text-xs">Due Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={dueAt ? new Date(dueAt).toISOString().slice(0, 16) : ''}
                                    onChange={e => setDueAt(e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                                    className="w-full border-border border rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary shadow-sm"
                                />
                                <p className="text-[10px] text-muted mt-1 italic">Students cannot submit files after this deadline.</p>
                            </div>
                        )}
                    </div>

                    {/* Question Builder */}
                    {isAssessment && (
                        <div className="border-t border-border pt-6 mt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-serif font-bold text-navy">Question Builder</h3>
                                <button
                                    onClick={addQuestion}
                                    className="flex items-center gap-2 text-primary font-bold hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors border border-primary/20"
                                >
                                    <Plus className="w-4 h-4" /> Add Question
                                </button>
                            </div>

                            {questions.length === 0 ? (
                                <p className="text-sm text-muted text-center py-8 bg-surface rounded-xl border border-dashed border-border border-2">
                                    No questions constructed yet.
                                </p>
                            ) : (
                                <div className="space-y-6">
                                    {questions.map((q, qIndex) => (
                                        <div key={q.id} className="p-5 border border-border rounded-xl bg-slate-50 relative">
                                            <button
                                                onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))}
                                                className="absolute top-4 right-4 text-muted hover:text-accent p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>

                                            <div className="mb-4 pr-8">
                                                <label className="block text-sm font-bold text-navy mb-2 uppercase tracking-wider text-xs">Question {qIndex + 1}</label>
                                                <input
                                                    value={q.text}
                                                    onChange={e => updateQuestionText(qIndex, e.target.value)}
                                                    className="w-full border-border border bg-white rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                                                    placeholder="Enter question prompt..."
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                {q.options.map((opt: string, oIndex: number) => (
                                                    <div key={oIndex} className="flex items-center gap-3">
                                                        <input
                                                            type="radio"
                                                            name={`correct-${q.id}`}
                                                            checked={q.correctOptionIndex === oIndex}
                                                            onChange={() => setCorrectOption(qIndex, oIndex)}
                                                            className="w-4 h-4 text-primary accent-primary cursor-pointer shrink-0"
                                                        />
                                                        <input
                                                            value={opt}
                                                            onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                                                            className="flex-1 border-border border bg-white rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary text-sm"
                                                            placeholder={`Option ${oIndex + 1}`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 p-6 border-t border-border bg-slate-50">
                    <button onClick={onClose} className="px-6 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 rounded-lg font-bold bg-primary text-white hover:bg-navy transition-colors">Save Activity</button>
                </div>
            </div>
        </div>
    );
}
