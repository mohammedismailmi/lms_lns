import React, { useState, useEffect } from 'react';
import { X, UserPlus, Search, Loader2, Check } from 'lucide-react';
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-surface p-6 border-b border-border flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <UserPlus className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-serif font-bold text-navy">Assign Instructor</h2>
                            <p className="text-xs text-muted font-medium line-clamp-1">{courseName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-border">
                        <X className="w-5 h-5 text-muted" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input 
                            type="text" 
                            placeholder="Find instructors..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-sm transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="py-12 text-center text-muted flex flex-col items-center gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                                <p className="text-sm font-medium">Fetching faculty...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="py-12 text-center text-muted italic font-serif">
                                No instructors found.
                            </div>
                        ) : (
                            filtered.map(instructor => (
                                <button
                                    key={instructor.id}
                                    onClick={() => handleAssign(instructor.id)}
                                    disabled={saving}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left group ${
                                        currentInstructorId === instructor.id 
                                        ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/10' 
                                        : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-navy text-xs border border-slate-200 group-hover:bg-white group-hover:border-primary/20 transition-colors">
                                            {instructor.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-navy text-sm">{instructor.name}</p>
                                            <p className="text-[10px] text-muted font-medium uppercase tracking-wider">{instructor.email}</p>
                                        </div>
                                    </div>
                                    {currentInstructorId === instructor.id ? (
                                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                                            <Check className="w-4 h-4" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-white text-primary">
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-slate-50 p-4 border-t border-border flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl text-sm font-bold text-muted hover:bg-white transition-all border border-transparent hover:border-slate-200"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
