import React, { useState, useEffect } from 'react';
import { X, UserPlus, Search, Loader2, Check, Plus } from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../lib/useToast';
import { useCourseStore } from '../../store/courseStore';

interface Instructor {
    id: string;
    name: string;
    email: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    courseId: string;
    courseName: string;
    currentInstructorId?: string;
}

export default function AssignInstructorModal({ isOpen, onClose, courseId, courseName, currentInstructorId }: Props) {
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const toast = useToast();
    const { hydrateCourses } = useCourseStore();

    useEffect(() => {
        if (isOpen) {
            fetchInstructors();
        }
    }, [isOpen]);

    const fetchInstructors = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/admin/instructors');
            if (res.data.success) {
                setInstructors(res.data.instructors);
            }
        } catch (err: any) {
            toast.error('Failed to load instructors');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (instructorId: string) => {
        setSaving(true);
        try {
            const res = await api.post(`/api/admin/courses/${courseId}/assign-instructor`, { instructorId });
            if (res.data.success) {
                toast.success(`Successfully assigned to ${res.data.instructor.name}`);
                await hydrateCourses();
                onClose();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Assignment failed');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const filtered = instructors.filter(i => 
        i.name.toLowerCase().includes(search.toLowerCase()) || 
        i.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/60 backdrop-blur-md p-0 sm:p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-none sm:rounded-3xl shadow-premium w-full h-full sm:h-auto sm:max-h-[85vh] flex flex-col sm:max-w-md overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 border border-white/20">
                <div className="bg-surface p-4 sm:p-7 border-b border-border/40 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-navy text-white flex items-center justify-center shadow-lg shadow-navy/20 -rotate-3 hover:rotate-0 transition-transform">
                            <UserPlus className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-serif font-black text-navy leading-tight">Assign Faculty</h2>
                            <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] mt-0.5 opacity-60 italic max-w-[200px] truncate">{courseName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-muted hover:text-white hover:bg-navy transition-all bg-white rounded-xl shadow-premium border border-border/40 group">
                        <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                    </button>
                </div>

                <div className="p-4 sm:p-7 flex-1 overflow-y-auto flex flex-col min-h-0 bg-[radial-gradient(circle_at_top_right,_#1b3a6b05,_transparent)]">
                    <div className="relative mb-5 shrink-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted font-bold" />
                        <input 
                            type="text" 
                            placeholder="Search instructor directory..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-5 py-3 bg-surface border border-border/40 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 text-xs font-bold text-navy shadow-inner transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2.5 flex-1 overflow-y-auto pr-1.5 custom-scrollbar">
                        {loading ? (
                            <div className="py-16 text-center text-muted flex flex-col items-center gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-primary/30" />
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Synchronizing Faculty Data...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="py-16 text-center text-muted italic font-serif opacity-40 text-sm">
                                No qualifying instructors found.
                            </div>
                        ) : (
                            filtered.map(instructor => (
                                <button
                                    key={instructor.id}
                                    onClick={() => handleAssign(instructor.id)}
                                    disabled={saving}
                                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left group ${
                                        currentInstructorId === instructor.id 
                                        ? 'bg-primary/5 border-primary/20 shadow-lg shadow-primary/5' 
                                        : 'bg-white border-transparent hover:border-border/40 hover:shadow-premium hover:-translate-y-0.5'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-surface border border-border/40 flex items-center justify-center font-black text-navy text-xs group-hover:bg-navy group-hover:text-white transition-all transform group-hover:scale-105">
                                            {instructor.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-black text-navy text-xs tracking-tight">{instructor.name}</p>
                                            <p className="text-[9px] text-muted font-bold uppercase tracking-widest opacity-60">{instructor.email}</p>
                                        </div>
                                    </div>
                                    {currentInstructorId === instructor.id ? (
                                        <div className="w-7 h-7 rounded-xl bg-success text-white flex items-center justify-center shadow-lg shadow-success/20">
                                            <Check className="w-3.5 h-3.5 stroke-[3px]" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-xl border border-border/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-white text-navy shadow-sm group-hover:bg-navy group-hover:text-white">
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-surface p-4 sm:p-6 border-t border-border/40 flex justify-end shrink-0">
                    <button 
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted hover:bg-slate-50 transition-all border border-transparent hover:border-border/40 active:scale-95"
                    >
                        Decline
                    </button>
                </div>
            </div>
        </div>
    );
}
