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

    const toLocalISO = (isoString?: string) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return '';
        const tzo = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - tzo).toISOString().slice(0, 16);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/60 backdrop-blur-md p-0 sm:p-4 overflow-hidden animate-in fade-in duration-300">
            <div className="bg-white rounded-none sm:rounded-3xl shadow-premium w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-2xl my-0 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 flex flex-col border border-white/20 relative">
                <div className="flex justify-between flex-row items-center p-4 sm:p-5 border-b border-border/40 bg-surface shrink-0">
                    <div>
                        <h2 className="text-lg sm:text-xl font-serif font-black text-navy leading-tight tracking-tight">
                            {existingActivity ? 'Modify Experience' : 'New Knowledge Node'}
                        </h2>
                        <p className="text-[8.5px] font-black text-muted uppercase tracking-[0.15em] mt-0.5 opacity-60">Curriculum Development Matrix</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-muted hover:text-white hover:bg-navy transition-all bg-white rounded-xl shadow-premium border border-border/40 group">
                        <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                    </button>
                </div>

                <div className="p-4 sm:p-6 space-y-4.5 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,_#1b3a6b05,_transparent)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
                        <div className="md:col-span-2">
                            <label className="block text-[8.5px] font-black text-muted mb-1 uppercase tracking-[0.15em] ml-3">Activity Architecture</label>
                            <select
                                value={formData.type || 'video'}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="w-full bg-surface border-border/40 border rounded-xl px-4 py-2.5 outline-none focus:ring-4 focus:ring-primary/10 shadow-inner font-bold text-navy appearance-none transition-all cursor-pointer hover:border-primary/30 text-xs"
                            >
                                <option value="video">Interactive Video Lesson</option>
                                <option value="blog">Scientific Article / Text</option>
                                <option value="file">Downloadable Material</option>
                                <option value="quiz">Formative Quiz</option>
                                <option value="exam">Summative Examination</option>
                                <option value="live_class">Real-time Live Session</option>
                                <option value="submission">Technical Assignment</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-[8.5px] font-black text-muted mb-1 uppercase tracking-[0.15em] ml-3">Functional Title</label>
                            <input
                                value={formData.title || ''}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-surface border-border/40 border rounded-xl px-4 py-2.5 outline-none focus:ring-4 focus:ring-primary/10 shadow-inner font-bold text-navy transition-all text-xs"
                                placeholder="e.g. Fundamental Concepts"
                            />
                        </div>

                        <div className="md:col-span-2">
                            {formData.type === 'blog' && (
                              <div className="space-y-3">
                                <label className="block text-[8.5px] font-black text-muted uppercase tracking-[0.15em] ml-3.5">
                                  Manuscript Content
                                </label>
                                <textarea
                                  placeholder="Write your detailed lecture notes or scientific material here..."
                                  value={formData.content ?? ''}
                                  onChange={e => setFormData((p: any) => ({ ...p, content: e.target.value }))}
                                  className="w-full bg-surface border border-border/40 rounded-2xl px-5 py-4 text-xs min-h-[220px] resize-y focus:outline-none focus:ring-4 focus:ring-primary/10 shadow-inner font-medium text-navy scrollbar-thin transition-all"
                                />
                                <div className="flex items-center gap-1.5 text-[8.5px] text-muted ml-3.5 font-bold uppercase tracking-widest opacity-40">
                                  <Plus className="w-2.5 h-2.5" /> Registry requirement: Complete interaction with content
                                </div>
                              </div>
                            )}

                            {formData.type === 'video' && (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-[8.5px] font-black text-muted uppercase tracking-[0.15em] mb-1 ml-3">
                                    Contextual Description
                                  </label>
                                  <textarea
                                    placeholder="Describe video context..."
                                    value={formData.description ?? ''}
                                    onChange={e => setFormData((p: any) => ({ ...p, description: e.target.value }))}
                                    className="w-full bg-surface border border-border/40 rounded-xl px-4 py-2 text-xs h-16 resize-none focus:ring-4 focus:ring-primary/10 transition-all font-medium text-navy"
                                  />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[8.5px] font-black text-muted uppercase tracking-[0.15em] mb-1 ml-3">
                                      Video Payload
                                    </label>
                                    <div className="relative">
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
                                              { 
                                                  method: 'POST', 
                                                  credentials: 'include', 
                                                  headers: {
                                                      'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
                                                  },
                                                  body: fd 
                                              }
                                            );
                                            const data = await res.json();
                                            setFormData((p: any) => ({ ...p, videoUrl: data.fileUrl, fileName: file.name }));
                                          } catch {
                                            setUploadError('Upload failed');
                                          } finally {
                                            setUploadingFile(false);
                                          }
                                        }}
                                        className="block w-full text-[10px] border border-border/40 rounded-xl px-3 py-1.5 file:mr-3 file:py-0.5 file:px-2 file:rounded-lg file:border-0 file:bg-navy file:text-white file:text-[9px] file:font-black file:uppercase file:tracking-widest cursor-pointer bg-surface/50 font-bold"
                                      />
                                      {uploadingFile && <p className="text-[9px] text-muted mt-1 ml-2 animate-pulse font-bold">Uploading binary stream...</p>}
                                      {formData.fileName && !uploadingFile && (
                                        <p className="text-[9px] text-success mt-1 ml-2 font-black">✓ {formData.fileName}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-[8.5px] font-black text-muted uppercase tracking-[0.15em] mb-1 ml-3">
                                      External Source URL
                                    </label>
                                    <input
                                      type="url"
                                      placeholder="YouTube / Vimeo / Direct Link"
                                      value={formData.videoUrl ?? ''}
                                      onChange={e => setFormData((p: any) => ({ ...p, videoUrl: e.target.value }))}
                                      className="w-full bg-surface border border-border/40 rounded-xl px-4 py-2 text-xs font-bold text-navy focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                                    />
                                  </div>
                                </div>
                                <p className="text-[9px] text-muted italic ml-3 opacity-60">Engagement requirement: 80% watch time for completion.</p>
                              </div>
                            )}

                            {formData.type === 'file' && (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-[8.5px] font-black text-muted uppercase tracking-[0.15em] mb-1 ml-3">
                                    Resource Abstract
                                  </label>
                                  <textarea
                                    placeholder="Describe file contents..."
                                    value={formData.description ?? ''}
                                    onChange={e => setFormData((p: any) => ({ ...p, description: e.target.value }))}
                                    className="w-full bg-surface border border-border/40 rounded-xl px-4 py-2 text-xs h-14 resize-none focus:ring-4 focus:ring-primary/10 transition-all font-medium text-navy"
                                  />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[8.5px] font-black text-muted uppercase tracking-[0.15em] mb-1 ml-3">
                                      Binary Upload
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
                                            { 
                                                method: 'POST', 
                                                credentials: 'include', 
                                                headers: {
                                                    'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
                                                },
                                                body: fd 
                                            }
                                          );
                                          
                                          if (!res.ok) {
                                            const errorData = await res.json().catch(() => ({}));
                                            throw new Error(errorData.message || errorData.error || `Upload failed with status ${res.status}`);
                                          }
                                          
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
                                      className="block w-full text-[10px] border border-border/40 rounded-xl px-3 py-1.5 file:mr-3 file:py-0.5 file:px-2 file:rounded-lg file:border-0 file:bg-navy file:text-white file:text-[9px] file:font-black file:uppercase file:tracking-widest cursor-pointer bg-surface/50 font-bold"
                                    />
                                    {uploadingFile && <p className="text-[9px] text-muted mt-1 ml-2 animate-pulse font-bold">Transferring packet...</p>}
                                    {formData.fileName && !uploadingFile && (
                                      <p className="text-[9px] text-success mt-1 ml-2 font-black">✓ {formData.fileName}</p>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-[8.5px] font-black text-muted uppercase tracking-[0.15em] mb-1 ml-3">
                                      Mirror Link
                                    </label>
                                    <input
                                      type="url"
                                      placeholder="https://..."
                                      value={formData.fileUrl ?? ''}
                                      onChange={e => setFormData((p: any) => ({ ...p, fileUrl: e.target.value }))}
                                      className="w-full bg-surface border border-border/40 rounded-xl px-4 py-2 text-xs font-bold text-navy focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {formData.type === 'submission' && (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-[8.5px] font-black text-muted uppercase tracking-[0.15em] mb-1 ml-3">
                                    Project Directives
                                  </label>
                                  <textarea
                                    placeholder="Specify technical constraints and submission protocols..."
                                    value={formData.description ?? ''}
                                    onChange={e => setFormData((p: any) => ({ ...p, description: e.target.value }))}
                                    className="w-full bg-surface border border-border/40 rounded-xl px-4 py-2 text-xs min-h-[100px] resize-y focus:ring-4 focus:ring-primary/10 transition-all font-medium text-navy shadow-inner"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[8.5px] font-black text-muted uppercase tracking-[0.15em] mb-1 ml-3">
                                      Critical Deadline
                                    </label>
                                    <input
                                      type="datetime-local"
                                      value={formData.dueAt ? new Date(formData.dueAt).toISOString().slice(0, 16) : ''}
                                      onChange={e => setFormData((p: any) => ({
                                        ...p,
                                        dueAt: e.target.value ? new Date(e.target.value).toISOString() : undefined
                                      }))}
                                      className="w-full bg-surface border border-border/40 rounded-xl px-4 py-2 text-[10px] font-black text-navy focus:ring-4 focus:ring-primary/10 transition-all font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[8.5px] font-black text-muted uppercase tracking-[0.15em] mb-1 ml-3">
                                      Point Ceiling
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      placeholder="100"
                                      value={formData.maxScore ?? ''}
                                      onChange={e => setFormData((p: any) => ({ ...p, maxScore: Number(e.target.value) }))}
                                      className="w-full bg-surface border border-border/40 rounded-xl px-4 py-2 text-xs font-black text-navy focus:ring-4 focus:ring-primary/10 transition-all"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {formData.type === 'live_class' && (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-[8.5px] font-black text-muted uppercase tracking-[0.15em] mb-1 ml-3">
                                    Broadcast Synopsis
                                  </label>
                                  <textarea
                                    placeholder="Agenda for real-time engagement..."
                                    value={formData.description ?? ''}
                                    onChange={e => setFormData((p: any) => ({ ...p, description: e.target.value }))}
                                    className="w-full bg-surface border border-border/40 rounded-xl px-4 py-2 text-xs h-16 resize-none focus:ring-4 focus:ring-primary/10 transition-all font-medium text-navy shadow-inner"
                                  />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-[8.5px] font-black text-muted uppercase tracking-[0.15em] mb-1 ml-3">
                                      Launch Schedule
                                    </label>
                                    <input
                                      type="datetime-local"
                                      value={toLocalISO(formData.scheduledAt)}
                                      onChange={e => {
                                        if (!e.target.value) {
                                          setFormData((p: any) => ({ ...p, scheduledAt: undefined }));
                                          return;
                                        }
                                        setFormData((p: any) => ({ ...p, scheduledAt: new Date(e.target.value).toISOString() }));
                                      }}
                                      className="w-full bg-surface border border-border/40 rounded-xl px-4 py-2 text-[10px] font-black text-navy focus:ring-4 focus:ring-primary/10 transition-all font-mono shadow-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[8.5px] font-black text-muted uppercase tracking-[0.15em] mb-1 ml-3">
                                      Session Duration (Min)
                                    </label>
                                    <input
                                      type="number"
                                      min="5"
                                      max="480"
                                      placeholder="60"
                                      value={formData.duration ?? ''}
                                      onChange={e => setFormData((p: any) => ({ ...p, duration: Number(e.target.value) || undefined }))}
                                      className="w-full bg-surface border border-border/40 rounded-xl px-4 py-2 text-xs font-black text-navy focus:ring-4 focus:ring-primary/10 transition-all"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="block text-[8.5px] font-black text-muted uppercase tracking-[0.15em] mb-1 ml-3">
                                      Stream Access Gateway
                                    </label>
                                    <div className="flex gap-1.5">
                                      <input 
                                        type="text"
                                        placeholder="Meeting URL"
                                        value={formData.meetLink || ''}
                                        onChange={e => setFormData((p: any) => ({ ...p, meetLink: e.target.value }))}
                                        className="flex-1 bg-surface border border-border/40 rounded-xl px-2 py-2 text-[10px] font-mono text-navy focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const r = () => Math.random().toString(36).substring(2, 5);
                                          const link = `https://meet.google.com/${r()}-${r()}-${r()}`;
                                          setFormData((p: any) => ({ ...p, meetLink: link }));
                                        }}
                                        className="bg-navy hover:bg-primary text-white px-2 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-navy/10 active:scale-95"
                                      >
                                        Gen
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-surface rounded-xl p-2.5 text-[8.5px] text-muted font-bold border border-border/30 opacity-70">
                                  💡 Access Node protocol: Links can be provisioned now or at launch.
                                  {!((import.meta as any).env?.VITE_GOOGLE_CLIENT_EMAIL) && (
                                    <span className="block text-accent mt-0.5 uppercase tracking-wider">
                                      ⚠ Infrastructure Alert: Cloud Workspace not coupled — using generic nodes.
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {formData.type === 'quiz' && (
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div className="sm:col-span-2">
                                    <label className="block text-[8.5px] font-black text-muted uppercase tracking-[0.15em] mb-1 ml-3">
                                      Formative Directives
                                    </label>
                                    <textarea
                                      placeholder="Assessment instructions..."
                                      value={formData.description ?? ''}
                                      onChange={e => setFormData((p: any) => ({ ...p, description: e.target.value }))}
                                      className="w-full bg-surface border border-border/40 rounded-xl px-4 py-2 text-xs h-16 resize-none focus:ring-4 focus:ring-primary/10 transition-all font-medium text-navy shadow-inner"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[8.5px] font-black text-muted uppercase tracking-[0.15em] mb-1 ml-3">
                                      Temporal Limit (Min)
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      placeholder="30"
                                      value={formData.duration ?? ''}
                                      onChange={e => setFormData((p: any) => ({ ...p, duration: Number(e.target.value) }))}
                                      className="w-full bg-surface border border-border/40 rounded-xl px-4 py-2 text-xs font-black text-navy focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                                    />
                                    <p className="text-[8px] text-muted italic mt-1.5 ml-2 opacity-60 font-bold uppercase tracking-widest leading-none">
                                      Add nodes below after commit.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {formData.type === 'exam' && (
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-3">
                                    <div>
                                      <label className="block text-[8.5px] font-black text-muted uppercase tracking-[0.15em] mb-1 ml-3">
                                        Summative Protocols
                                      </label>
                                      <textarea
                                        placeholder="Read all instructions carefully..."
                                        value={formData.description ?? ''}
                                        onChange={e => setFormData((p: any) => ({ ...p, description: e.target.value }))}
                                        className="w-full bg-surface border border-border/40 rounded-xl px-4 py-2 text-xs h-20 resize-none focus:ring-4 focus:ring-primary/10 transition-all font-medium text-navy shadow-inner"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[8.5px] font-black text-muted uppercase tracking-[0.15em] mb-1 ml-3">
                                        Temporal Window (Min)
                                      </label>
                                      <input
                                        type="number"
                                        min="1"
                                        placeholder="120"
                                        value={formData.duration ?? ''}
                                        onChange={e => setFormData((p: any) => ({ ...p, duration: Number(e.target.value) }))}
                                        className="w-full bg-surface border border-border/40 rounded-xl px-4 py-2 text-xs font-black text-navy focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-[8.5px] font-black text-muted uppercase tracking-[0.15em] mb-2 ml-3">
                                      Permitted Logic Clusters
                                    </label>
                                    <div className="space-y-1.5 p-3 bg-white border border-border/40 rounded-xl shadow-inner">
                                      {['mcq', 'short_answer', 'long_answer', 'match_following'].map(qt => (
                                        <label key={qt} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest cursor-pointer hover:text-primary transition-colors text-muted select-none">
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
                                            className="rounded border-border/40 w-3 h-3 text-navy focus:ring-0 focus:ring-offset-0"
                                          />
                                          <span>{qt.replace('_', ' ')}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                        </div>
                    </div>

                    {isAssessment && (
                        <div className="border-t border-border/40 pt-4 mt-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                                <h3 className="text-base font-serif font-black text-navy tracking-tight">Question Builder</h3>
                                <div className="flex flex-wrap gap-1.5">
                                    <button
                                        onClick={addQuestion}
                                        className="flex items-center gap-1.5 text-primary font-black hover:bg-primary/5 px-2.5 py-1 rounded-lg transition-colors border border-primary/20 text-[9px] uppercase tracking-widest"
                                    >
                                        <Plus className="w-3 h-3" /> Add MCQ
                                    </button>
                                    <button
                                        onClick={() => addOpenQuestion('short_answer')}
                                        className="flex items-center gap-1.5 text-primary font-black hover:bg-primary/5 px-2.5 py-1 rounded-lg transition-colors border border-primary/20 text-[9px] uppercase tracking-widest"
                                    >
                                        <Plus className="w-3 h-3" /> Add Short
                                    </button>
                                    <button
                                        onClick={() => addOpenQuestion('long_answer')}
                                        className="flex items-center gap-1.5 text-primary font-black hover:bg-primary/5 px-2.5 py-1 rounded-lg transition-colors border border-primary/20 text-[9px] uppercase tracking-widest"
                                    >
                                        <Plus className="w-3 h-3" /> Add Long
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

                <div className="p-4 sm:p-5 border-t border-border/40 bg-surface flex flex-col sm:flex-row justify-end gap-2.5 rounded-none sm:rounded-b-3xl shrink-0">
                    <button onClick={onClose} className="w-full sm:w-auto px-5 py-2.5 bg-white border border-border/60 hover:bg-slate-50 text-navy font-black rounded-xl transition-all shadow-sm active:scale-95 text-[9px] uppercase tracking-widest">
                        Decline
                    </button>
                    <button onClick={handleSave} disabled={uploadingFile} className="w-full sm:w-auto px-6 py-2.5 bg-navy hover:bg-primary text-white font-black rounded-xl shadow-xl shadow-navy/20 transition-all hover:-translate-y-0.5 active:scale-95 text-[9px] uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed">
                        Commit Resource
                    </button>
                </div>
            </div>
        </div>
    );
}
