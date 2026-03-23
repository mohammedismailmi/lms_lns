import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Search, ShieldCheck, Mail, Calendar, Loader2, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

interface Instructor {
    id: string;
    name: string;
    email: string;
    created_at: number;
}

export default function AdminInstructorsPage() {
    const { user } = useAuthStore();
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const fetchInstructors = async () => {
        try {
            const res = await api.get('/api/admin/instructors');
            if (res.data.success) {
                setInstructors(res.data.instructors);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load instructors');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInstructors();
    }, []);

    const filteredInstructors = instructors.filter(i => 
        i.name.toLowerCase().includes(search.toLowerCase()) || 
        i.email.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="p-8 max-w-7xl mx-auto space-y-8 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-muted font-serif">Loading instructors...</span>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24 font-sans">
            <div>
                <Link to="/admin" className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mb-2">
                    <ChevronLeft className="w-3 h-3" /> Back to Admin Hub
                </Link>
                <h1 className="text-4xl font-serif font-bold text-navy">Instructors</h1>
                <p className="text-muted mt-2">Manage and view all faculty members for this institution.</p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-border flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input 
                        type="text" 
                        placeholder="Search by name or email..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        className="w-full bg-surface text-ink placeholder:text-muted rounded-lg py-2.5 pl-10 pr-4 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-sm transition-all shadow-sm"
                    />
                </div>
                <div className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-xs font-bold uppercase tracking-wider">
                    {filteredInstructors.length} Total instructors
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInstructors.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-border text-muted font-serif italic">
                        No instructors found matching your search.
                    </div>
                ) : filteredInstructors.map(instructor => (
                    <div key={instructor.id} className="bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 -mr-12 -mt-12 rounded-full group-hover:bg-primary/10 transition-colors" />
                        
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl font-serif shrink-0 border border-primary/20 shadow-inner">
                                {instructor.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-navy line-clamp-1">{instructor.name}</h3>
                                <div className="flex items-center gap-1.5 text-xs text-muted font-medium mt-0.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-highlight" />
                                    Faculty Member
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-ink bg-surface p-3 rounded-xl border border-border/50">
                                <Mail className="w-4 h-4 text-primary shrink-0" />
                                <span className="truncate">{instructor.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted p-3">
                                <Calendar className="w-4 h-4 text-primary shrink-0" />
                                <span>Joined {new Date(instructor.created_at * 1000).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-border/50 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Active Status</span>
                            <div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
