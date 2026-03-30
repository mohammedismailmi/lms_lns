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
    const [formData, setFormData] = useState<any>({ type: 'video' });
    const [uploadingFile, setUploadingFile] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [questions, setQuestions] = useState<any[]>([]);

    useEffect(() => {
        if (existingActivity) {
            setFormData({ ...existingActivity });
            setQuestions((existingActivity as any).questions || []);
        } else {
            setFormData({ type: 'video', duration: 10 });
            setQuestions([]);
        }
        setUploadError('');
    }, [existingActivity, isOpen]);

    if (!isOpen) return null;

    const addQuestion = () => {
        setQuestions([...questions, {
            id: 'q' + Math.random().toString(36).substring(2),
            text: '',
            type: 'mcq',
            options: ['', '', '', ''],
            correctOptionIndex: 0,
            sampleAnswer: '',
            matchPairs: ''
        }]);
    };

    const addOpenQuestion = (type: 'short_answer' | 'long_answer') => {
        setQuestions([...questions, {
            id: 'q' + Math.random().toString(36).substring(2),
            text: '',
            type,
            sampleAnswer: ''
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

    const updateSampleAnswer = (qIndex: number, text: string) => {
        const copy = [...questions];
        copy[qIndex].sampleAnswer = text;
        setQuestions(copy);
    };

    const handleSave = () => {
        if (!formData.title?.trim()) return;
        const newActivity = {
            id: existingActivity?.id || 'a' + Math.random().toString(36).substring(2),
            ...formData,
        };

        if (formData.type === 'quiz' || formData.type === 'exam') {
            newActivity.questions = questions;
        }

        onSave(newActivity as any);
        onClose();
    };

    const isAssessment = formData.type === 'quiz' || formData.type === 'exam';

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
                                value={formData.type || 'video'}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
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
                                value={formData.title || ''}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full border-border border rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary shadow-sm"
                                placeholder="e.g. Introduction to Variables"
                            />
                        </div>

                        <div className="md:col-span-2">
                            {formData.type === 'blog' && (
                              <div>
                                <label className="block text-xs font-semibold text-[#1B3A6B] uppercase tracking-wide mb-1">
                                  Article Content
                                </label>
                                <textarea
                                  placeholder="Write your article, lecture notes, or reading material here..."
                                  value={formData.content ?? ''}
                                  onChange={e => setFormData((p: any) => ({ ...p, content: e.target.value }))}
                                  className="w-full border border-[#D4CFC6] rounded-md px-3 py-2 text-sm min-h-[200px] resize-y focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                                />
                                <p className="text-xs text-[#6B6B6B] mt-1">
                                  Students must scroll to the end to mark this as complete.
                                </p>
                              </div>
                            )}

                            {formData.type === 'video' && (
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-xs font-semibold text-[#1B3A6B] uppercase tracking-wide mb-1">
                                    Description
                                  </label>
                                  <textarea
                                    placeholder="Describe what this video covers..."
                                    value={formData.description ?? ''}
                                    onChange={e => setFormData((p: any) => ({ ...p, description: e.target.value }))}
                                    className="w-full border border-[#D4CFC6] rounded-md px-3 py-2 text-sm h-20 resize-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-[#1B3A6B] uppercase tracking-wide mb-1">
                                    Upload Video File
                                  </label>
                                  <input
                                    type="file"
                                    accept="video/mp4,video/webm,video/ogg"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      setUploadingFile(true);
                                      try {
                                        const fd = new FormData();
                                        fd.append('file', file);
                                        const res = await fetch(
                                          `${(import.meta as any).env.VITE_API_URL || ''}/api/upload/lesson-file`,
                                          { method: 'POST', credentials: 'include', body: fd }
                                        );
                                        const data = await res.json();
                                        setFormData((p: any) => ({ ...p, videoUrl: data.fileUrl, fileName: file.name }));
                                      } catch {
                                        setUploadError('Upload failed');
                                      } finally {
                                        setUploadingFile(false);
                                      }
                                    }}
                                    className="block w-full text-sm border border-[#D4CFC6] rounded-md px-3 py-2 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[#1B3A6B] file:text-white file:text-xs cursor-pointer"
                                  />
                                  {uploadingFile && <p className="text-xs text-[#6B6B6B] mt-1">Uploading video...</p>}
                                  {formData.fileName && !uploadingFile && (
                                    <p className="text-xs text-[#2D5A27] mt-1">✓ {formData.fileName}</p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-[#1B3A6B] uppercase tracking-wide mb-1">
                                    OR Paste Video URL
                                  </label>
                                  <input
                                    type="url"
                                    placeholder="https://youtube.com/... or https://vimeo.com/..."
                                    value={formData.videoUrl ?? ''}
                                    onChange={e => setFormData((p: any) => ({ ...p, videoUrl: e.target.value }))}
                                    className="w-full border border-[#D4CFC6] rounded-md px-3 py-2 text-sm"
                                  />
                                  <p className="text-xs text-[#6B6B6B] mt-1">
                                    YouTube, Vimeo, or direct video link. Students must watch 80% to mark complete.
                                  </p>
                                </div>
                              </div>
                            )}

                            {formData.type === 'file' && (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-semibold text-[#1B3A6B] uppercase tracking-wide mb-1">
                                    Description
                                  </label>
                                  <textarea
                                    placeholder="Describe what this file contains..."
                                    value={formData.description ?? ''}
                                    onChange={e => setFormData((p: any) => ({ ...p, description: e.target.value }))}
                                    className="w-full border border-[#D4CFC6] rounded-md px-3 py-2 text-sm h-16 resize-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-[#1B3A6B] uppercase tracking-wide mb-1">
                                    Upload File
                                  </label>
                                  <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.jpg,.png"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      setUploadingFile(true);
                                      try {
                                        const fd = new FormData();
                                        fd.append('file', file);
                                        const res = await fetch(
                                          `${(import.meta as any).env.VITE_API_URL || ''}/api/upload/lesson-file`,
                                          { method: 'POST', credentials: 'include', body: fd }
                                        );
                                        const data = await res.json();
                                        setFormData((p: any) => ({
                                          ...p,
                                          fileUrl:  data.fileUrl,
                                          fileName: file.name,
                                          fileType: file.type,
                                          fileSize: file.size,
                                        }));
                                      } catch {
                                        setUploadError('Upload failed');
                                      } finally {
                                        setUploadingFile(false);
                                      }
                                    }}
                                    className="block w-full text-sm border border-[#D4CFC6] rounded-md px-3 py-2 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[#1B3A6B] file:text-white file:text-xs cursor-pointer"
                                  />
                                  {uploadingFile && <p className="text-xs text-[#6B6B6B] mt-1">Uploading...</p>}
                                  {formData.fileName && !uploadingFile && (
                                    <p className="text-xs text-[#2D5A27] mt-1">✓ {formData.fileName} uploaded</p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-[#1B3A6B] uppercase tracking-wide mb-1">
                                    OR Paste File URL
                                  </label>
                                  <input
                                    type="url"
                                    placeholder="https://example.com/file.pdf"
                                    value={formData.fileUrl ?? ''}
                                    onChange={e => setFormData((p: any) => ({ ...p, fileUrl: e.target.value }))}
                                    className="w-full border border-[#D4CFC6] rounded-md px-3 py-2 text-sm"
                                  />
                                </div>
                              </div>
                            )}

                            {formData.type === 'submission' && (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-semibold text-[#1B3A6B] uppercase tracking-wide mb-1">
                                    Assignment Description
                                  </label>
                                  <textarea
                                    placeholder="Describe the assignment clearly — what to submit, format, requirements..."
                                    value={formData.description ?? ''}
                                    onChange={e => setFormData((p: any) => ({ ...p, description: e.target.value }))}
                                    className="w-full border border-[#D4CFC6] rounded-md px-3 py-2 text-sm min-h-[120px] resize-y"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-[#1B3A6B] uppercase tracking-wide mb-1">
                                    Due Date & Time
                                  </label>
                                  <input
                                    type="datetime-local"
                                    value={formData.dueAt ? new Date(formData.dueAt).toISOString().slice(0, 16) : ''}
                                    onChange={e => setFormData((p: any) => ({
                                      ...p,
                                      dueAt: e.target.value ? new Date(e.target.value).toISOString() : undefined
                                    }))}
                                    className="w-full border border-[#D4CFC6] rounded-md px-3 py-2 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-[#1B3A6B] uppercase tracking-wide mb-1">
                                    Maximum Grade / Points
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="100"
                                    value={formData.maxScore ?? ''}
                                    onChange={e => setFormData((p: any) => ({ ...p, maxScore: Number(e.target.value) }))}
                                    className="w-full border border-[#D4CFC6] rounded-md px-3 py-2 text-sm"
                                  />
                                </div>
                              </div>
                            )}

                            {formData.type === 'live_class' && (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-semibold text-[#1B3A6B] uppercase tracking-wide mb-1">
                                    Session Description
                                  </label>
                                  <textarea
                                    placeholder="What will be covered in this live session?"
                                    value={formData.description ?? ''}
                                    onChange={e => setFormData((p: any) => ({ ...p, description: e.target.value }))}
                                    className="w-full border border-[#D4CFC6] rounded-md px-3 py-2 text-sm h-20 resize-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-[#1B3A6B] uppercase tracking-wide mb-1">
                                    Scheduled Date & Time
                                  </label>
                                  <input
                                    type="datetime-local"
                                    value={formData.scheduledAt ? new Date(formData.scheduledAt).toISOString().slice(0, 16) : ''}
                                    onChange={e => setFormData((p: any) => ({
                                      ...p,
                                      scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : undefined
                                    }))}
                                    className="w-full border border-[#D4CFC6] rounded-md px-3 py-2 text-sm"
                                  />
                                </div>
                                <div className="space-y-3">
                                  <label className="block text-xs font-semibold text-[#1B3A6B] uppercase tracking-wide mb-1">
                                    Meeting Link
                                  </label>
                                  <div className="flex gap-2">
                                    <input 
                                      type="text"
                                      placeholder="https://meet.google.com/..."
                                      value={formData.meetLink || ''}
                                      onChange={e => setFormData((p: any) => ({ ...p, meetLink: e.target.value }))}
                                      className="flex-1 border border-[#D4CFC6] rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const r = () => Math.random().toString(36).substring(2, 5);
                                        const link = `https://meet.google.com/${r()}-${r()}-${r()}`;
                                        setFormData((p: any) => ({ ...p, meetLink: link }));
                                      }}
                                      className="bg-primary hover:bg-navy text-white px-3 py-2 rounded-md text-xs font-bold transition-all shadow-sm"
                                    >
                                      Generate Link
                                    </button>
                                  </div>
                                  <div className="bg-[#EDE8DC] rounded-md p-3 text-xs text-[#6B6B6B]">
                                    💡 You can generate a link now or it will be created when you start the session.
                                    {!((import.meta as any).env?.VITE_GOOGLE_CLIENT_EMAIL) && (
                                      <span className="block text-[#C9A84C] mt-1">
                                        ⚠ Google Workspace integration not connected — using placeholder links.
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {formData.type === 'quiz' && (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-semibold text-[#1B3A6B] uppercase tracking-wide mb-1">
                                    Instructions
                                  </label>
                                  <textarea
                                    placeholder="Quiz instructions for students..."
                                    value={formData.description ?? ''}
                                    onChange={e => setFormData((p: any) => ({ ...p, description: e.target.value }))}
                                    className="w-full border border-[#D4CFC6] rounded-md px-3 py-2 text-sm h-20 resize-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-[#1B3A6B] uppercase tracking-wide mb-1">
                                    Time Limit (minutes)
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    placeholder="30"
                                    value={formData.duration ?? ''}
                                    onChange={e => setFormData((p: any) => ({ ...p, duration: Number(e.target.value) }))}
                                    className="w-full border border-[#D4CFC6] rounded-md px-3 py-2 text-sm"
                                  />
                                </div>
                                <p className="text-xs text-[#6B6B6B]">
                                  Add questions after creating the activity by clicking "Manage Questions" on the activity card.
                                </p>
                              </div>
                            )}

                            {formData.type === 'exam' && (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-semibold text-[#1B3A6B] uppercase tracking-wide mb-1">
                                    Exam Instructions
                                  </label>
                                  <textarea
                                    placeholder="Read all instructions carefully before attempting..."
                                    value={formData.description ?? ''}
                                    onChange={e => setFormData((p: any) => ({ ...p, description: e.target.value }))}
                                    className="w-full border border-[#D4CFC6] rounded-md px-3 py-2 text-sm h-24 resize-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-[#1B3A6B] uppercase tracking-wide mb-1">
                                    Duration (minutes)
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    placeholder="120"
                                    value={formData.duration ?? ''}
                                    onChange={e => setFormData((p: any) => ({ ...p, duration: Number(e.target.value) }))}
                                    className="w-full border border-[#D4CFC6] rounded-md px-3 py-2 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-[#1B3A6B] uppercase tracking-wide mb-1">
                                    Question Types Allowed
                                  </label>
                                  <div className="space-y-2">
                                    {['mcq', 'short_answer', 'long_answer', 'match_following'].map(qt => (
                                      <label key={qt} className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={formData.questionTypes?.includes(qt) ?? true}
                                          onChange={e => {
                                            const types = formData.questionTypes ?? ['mcq', 'short_answer', 'long_answer', 'match_following']
                                            setFormData((p: any) => ({
                                              ...p,
                                              questionTypes: e.target.checked
                                                ? [...types, qt]
                                                : types.filter((t: string) => t !== qt)
                                            }))
                                          }}
                                          className="rounded border-[#D4CFC6]"
                                        />
                                        <span className="text-[#1A1A1A]">
                                          {qt === 'mcq' ? 'Multiple Choice (MCQ)'
                                            : qt === 'short_answer' ? 'Short Answer'
                                            : qt === 'long_answer' ? 'Long Answer / Essay'
                                            : 'Match the Following'}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                                <p className="text-xs text-[#6B6B6B]">
                                  Add questions after creating — click "Manage Questions" on the exam card.
                                </p>
                              </div>
                            )}

                        </div>
                    </div>

                    {isAssessment && (
                        <div className="border-t border-border pt-6 mt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-serif font-bold text-navy">Question Builder</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={addQuestion}
                                        className="flex items-center gap-2 text-primary font-bold hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors border border-primary/20"
                                    >
                                        <Plus className="w-4 h-4" /> Add MCQ
                                    </button>
                                    <button
                                        onClick={() => addOpenQuestion('short_answer')}
                                        className="flex items-center gap-2 text-primary font-bold hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors border border-primary/20"
                                    >
                                        <Plus className="w-4 h-4" /> Add Short Answer
                                    </button>
                                    <button
                                        onClick={() => addOpenQuestion('long_answer')}
                                        className="flex items-center gap-2 text-primary font-bold hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors border border-primary/20"
                                    >
                                        <Plus className="w-4 h-4" /> Add Long Answer
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {questions.map((q, qIndex) => (
                                    <div key={q.id} className="p-4 border border-border rounded-xl bg-slate-50 relative group">
                                        <button 
                                            onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))}
                                            className="absolute top-4 right-4 text-muted hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="mb-4 pr-16 flex items-center gap-3">
                                            <div className="flex-1">
                                                <label className="block text-xs font-bold text-navy mb-2 uppercase tracking-wide">
                                                  Question {qIndex + 1} ({q.type === 'mcq' ? 'MCQ' : q.type === 'short_answer' ? 'Short' : 'Long'})
                                                </label>
                                                <input
                                                    value={q.text}
                                                    onChange={e => updateQuestionText(qIndex, e.target.value)}
                                                    className="w-full border-border border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary shadow-sm bg-white font-medium"
                                                    placeholder="Enter question text..."
                                                />
                                            </div>
                                        </div>

                                        {q.type === 'mcq' ? (
                                          <div className="space-y-2">
                                              {q.options?.map((opt: string, oIndex: number) => (
                                                  <div key={oIndex} className="flex items-center gap-3">
                                                      <input
                                                          type="radio"
                                                          name={`correct-${q.id}`}
                                                          checked={q.correctOptionIndex === oIndex}
                                                          onChange={() => setCorrectOption(qIndex, oIndex)}
                                                          className="text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                                          title="Mark as correct answer"
                                                      />
                                                      <input
                                                          value={opt}
                                                          onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                                                          className={`flex-1 border-border border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary shadow-sm bg-white ${q.correctOptionIndex === oIndex ? 'ring-1 ring-primary/50 bg-primary/5' : ''}`}
                                                          placeholder={`Option ${oIndex + 1}`}
                                                      />
                                                  </div>
                                              ))}
                                          </div>
                                        ) : (
                                          <div className="space-y-3">
                                            <div>
                                              <label className="block text-[10px] font-bold text-muted mb-1 uppercase">Sample Answer / Keywords</label>
                                              <textarea
                                                value={q.sampleAnswer || ''}
                                                onChange={e => updateSampleAnswer(qIndex, e.target.value)}
                                                placeholder="Enter sample answer for the evaluator..."
                                                className="w-full border-border border rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary shadow-sm bg-white h-16 resize-none"
                                              />
                                            </div>
                                          </div>
                                        )}
                                    </div>
                                ))}
                                {questions.length === 0 && (
                                    <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
                                        <p className="text-muted text-sm italic">Add questions above to populate your assessment.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-border bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                    <button onClick={onClose} className="px-5 py-2 hover:bg-black/5 text-navy font-bold rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="px-6 py-2 bg-primary hover:bg-navy text-white font-bold rounded-lg shadow-sm transition-colors">
                        Save Activity
                    </button>
                </div>
            </div>
        </div>
    );
}
