import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Search, GraduationCap, Mail, BookOpen, Loader2, ChevronRight, User, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

interface Learner {
    id: string;
    name: string;
    email: string;
}

interface CourseGroup {
    id: string;
    title: string;
    learners: Learner[];
}

export default function AdminLearnersPage() {
    const { user } = useAuthStore();
    const [courseGroups, setCourseGroups] = useState<CourseGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const fetchLearners = async () => {
        try {
            const res = await api.get('/api/admin/learners-by-course');
            if (res.data.success) {
                setCourseGroups(res.data.courses);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load learners');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLearners();
    }, []);

    const filteredGroups = courseGroups.map(group => ({
        ...group,
        learners: group.learners.filter(l => 
            l.name.toLowerCase().includes(search.toLowerCase()) || 
            l.email.toLowerCase().includes(search.toLowerCase())
        )
    })).filter(group => group.learners.length > 0);

    if (loading) {
        return (
            <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-muted font-serif text-lg animate-pulse tracking-wide">Orchestrating learner directory...</span>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-10 pb-24 font-sans">
            <div>
                <Link to="/admin" className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mb-2">
                    <ChevronLeft className="w-3 h-3" /> Back to Admin Hub
                </Link>
                <h1 className="text-2xl sm:text-3xl sm:text-4xl font-serif font-bold text-navy tracking-tight flex items-center gap-3">
                    <GraduationCap className="w-10 h-10 text-primary" />
                    Learner Directory
                </h1>
                <p className="text-muted mt-2 text-lg font-medium max-w-2xl">View all enrolled students partitioned by their active course cohorts.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-border flex flex-col md:flex-row gap-5 items-center backdrop-blur-sm bg-white/80 sticky top-4 z-10">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input 
                        type="text" 
                        placeholder="Search for a student by name or email..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        className="w-full bg-slate-50 text-ink placeholder:text-muted rounded-xl py-3 pl-12 pr-4 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all font-medium"
                    />
                </div>
                <div className="px-6 py-2.5 bg-primary/10 text-primary rounded-xl text-sm font-bold border border-primary/20">
                    {filteredGroups.reduce((acc, g) => acc + g.learners.length, 0)} Active Enrollments
                </div>
            </div>

            <div className="grid grid-cols-1 gap-10">
                {filteredGroups.length === 0 ? (
                    <div className="col-span-full py-32 text-center bg-white rounded-3xl border-2 border-dashed border-border text-muted font-serif italic text-xl">
                        No learner cohorts found matching your criteria.
                    </div>
                ) : filteredGroups.map(group => (
                    <section key={group.id} className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-2xl font-serif font-bold text-navy flex items-center gap-2">
                                <BookOpen className="w-6 h-6 text-highlight" />
                                {group.title}
                                <span className="text-sm font-sans text-muted ml-2 font-bold bg-slate-100 px-3 py-1 rounded-full">{group.learners.length} Students</span>
                            </h2>
                            <div className="h-px bg-border flex-1 mx-6 opacity-50" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {group.learners.map(learner => (
                                <div key={learner.id} className="bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-lg transition-all hover:scale-[1.01] group relative">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 text-navy flex items-center justify-center font-bold text-lg font-serif shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                            {learner.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-navy truncate group-hover:text-primary transition-colors">{learner.name}</h3>
                                            <div className="flex items-center gap-1.5 text-xs text-muted font-medium mt-1">
                                                <Mail className="w-3.5 h-3.5" />
                                                <span className="truncate">{learner.email}</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                    
                                    <div className="mt-5 flex items-center gap-2">
                                        <div className="px-2 py-1 rounded-md bg-success/10 text-[10px] font-bold text-success uppercase tracking-widest flex items-center gap-1">
                                            <User className="w-2.5 h-2.5" /> Verified Student
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}
