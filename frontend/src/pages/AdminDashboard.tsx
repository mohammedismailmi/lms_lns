import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Users, BookOpen, GraduationCap, UserCheck, Search, ShieldBan, ChevronDown, Loader2, Plus, X, Video } from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';
import api from '../lib/api';
import CalendarWidget from '../components/dashboard/CalendarWidget';

interface Stats {
    totalUsers: number;
    totalCourses: number;
    totalInstructors: number;
    totalLearners: number;
}

interface TenantUser {
    id: string;
    name: string;
    email: string;
    role: string;
    tenant_id: string;
    created_at: number;
}

interface CourseRow {
    id: string;
    title: string;
    status: string;
    enrollment_count: number;
}

interface UpcomingSession {
    id: string;
    course_id: string;
    title: string;
    course_title: string;
    start_time: number;
    meet_link: string | null;
}

export default function AdminDashboard() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<TenantUser[]>([]);
    const [courses, setCourses] = useState<CourseRow[]>([]);
    const [sessions, setSessions] = useState<UpcomingSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Schedule Meeting state
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [meetForm, setMeetForm] = useState({ title: '', description: '', scheduledAt: '', durationMin: 60 });
    const [userSearch, setUserSearch] = useState('');
    const [meetFilteredUsers, setMeetFilteredUsers] = useState<TenantUser[]>([]);
    const [invitees, setInvitees] = useState<TenantUser[]>([]);
    const [meetError, setMeetError] = useState('');
    const [debugTrace, setDebugTrace] = useState<any>(null);
    const [selectedSession, setSelectedSession] = useState<UpcomingSession | null>(null);

    if (user?.role !== 'admin') return <Navigate to="/" replace />;

    const fetchData = async () => {
        // Fetch each independently to avoid one failure blocking all
        api.get('/api/admin/stats').then(res => {
            if (res.data.success) setStats(res.data.stats);
        }).catch(e => console.error('Stats failed', e));

        api.get('/api/admin/users').then(res => {
            if (res.data.success) setUsers(res.data.users);
        }).catch(e => console.error('Users failed', e));

        api.get('/api/courses').then(res => {
            if (res.data.success) setCourses(res.data.courses);
        }).catch(e => console.error('Courses failed', e));

        api.get('/api/admin/upcoming-sessions').then(res => {
            if (res.data.success) {
                setSessions(res.data.sessions);
            } else {
                setError(res.data.error || 'Meetings fetch failed');
            }
            if (res.data.trace) setDebugTrace(res.data.trace);
        }).catch(err => {
            setError(err.message || 'Failed to load meetings');
        }).finally(() => {
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleScheduleMeeting = async () => {
        setMeetError('');
        try {
            const res = await api.post('/api/admin/meetings', {
                title: meetForm.title,
                description: meetForm.description,
                scheduledAt: new Date(meetForm.scheduledAt).toISOString(),
                durationMin: meetForm.durationMin,
                inviteeIds: invitees.map(i => i.id),
            });
            if (res.data.success) {
                alert(`Meeting scheduled! Link: ${res.data.meetLink}`);
                setShowMeetingModal(false);
                setMeetForm({ title: '', description: '', scheduledAt: '', durationMin: 60 });
                setInvitees([]);
                fetchData();
            } else {
                setMeetError(res.data.error || 'Failed to schedule meeting');
            }
        } catch (err: any) {
            setMeetError(err.response?.data?.error || err.message || 'Error scheduling meeting');
        }
    };

    if (loading) {
        return (
            <div className="p-4 sm:p-5 max-w-[1400px] mx-auto space-y-7 font-sans pb-16">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-navy mb-5">Admin Dashboard</h1>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="bg-white rounded-xl p-4 border border-border shadow-sm animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-200 rounded-lg" />
                                <div className="space-y-1.5 flex-1">
                                    <div className="h-6 bg-slate-200 rounded w-12" />
                                    <div className="h-3 bg-slate-100 rounded w-20" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-center py-12 text-muted text-sm">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading dashboard...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 sm:p-5 max-w-[1400px] mx-auto">
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-navy mb-5">Admin Dashboard</h1>
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-600 font-bold text-sm">{error}</p>
                    <button onClick={() => window.location.reload()} className="mt-3 px-3 py-1.5 bg-primary text-white rounded-lg text-xs">Retry</button>
                </div>
            </div>
        );
    }

    const filteredUsers = users.filter(u => (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-4 sm:p-5 max-w-[1400px] mx-auto space-y-7 font-sans pb-16">
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-navy mb-5">Admin Dashboard</h1>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to="/admin/users" className="block hover:scale-[1.01] transition-transform">
                    <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={<Users />} />
                </Link>
                <Link to="/admin/courses" className="block hover:scale-[1.01] transition-transform">
                    <StatCard title="Total Courses" value={stats?.totalCourses || 0} icon={<BookOpen />} />
                </Link>
                <Link to="/admin/instructors" className="block hover:scale-[1.01] transition-transform">
                    <StatCard title="Instructors" value={stats?.totalInstructors || 0} icon={<UserCheck />} />
                </Link>
                <Link to="/admin/learners" className="block hover:scale-[1.01] transition-transform">
                    <StatCard title="Learners" value={stats?.totalLearners || 0} icon={<GraduationCap />} />
                </Link>
            </div>

            <CalendarWidget />

            {/* Upcoming Sessions */}
            <section className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-serif font-bold text-navy flex items-center gap-2">
                        <Video className="w-4.5 h-4.5 text-highlight" />
                        Upcoming Meetings & Sessions
                    </h2>
                    <div className="flex items-center gap-3">
                        <Link to="/admin/meetings" className="text-[10px] text-primary underline font-bold">View All</Link>
                        <button
                            onClick={() => setShowMeetingModal(true)}
                            className="flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" /> Schedule Meeting
                        </button>
                    </div>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {sessions.length === 0 ? (
                        <div className="col-span-full py-6 text-center text-muted font-serif italic text-sm">
                            No upcoming sessions scheduled.
                        </div>
                    ) : sessions.map(session => (
                        <div 
                            key={session.id} 
                            onClick={() => setSelectedSession(session)}
                            className="p-3.5 rounded-lg border border-slate-100 bg-slate-50 relative overflow-hidden group hover:border-primary/30 transition-colors cursor-pointer"
                        >
                            <div className="absolute top-0 right-0 w-12 h-12 bg-primary/5 -mr-6 -mt-6 rounded-full" />
                            <p className="text-[9px] font-bold text-primary uppercase tracking-widest mb-1">{session.course_title}</p>
                            <h3 className="font-bold text-navy mb-1 line-clamp-1 group-hover:text-primary transition-colors text-xs">{session.title}</h3>
                            {(session as any).description && (
                                <p className="text-[10px] text-muted mb-2.5 line-clamp-2 italic leading-relaxed">{(session as any).description}</p>
                            )}
                            <div className="flex items-center gap-1.5 text-[10px] text-muted font-medium mb-0.5">
                                <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-navy font-bold">
                                    {new Date(session.start_time * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                                <span>at {new Date(session.start_time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="mt-2.5 flex items-center gap-1 text-[9px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                View Details <Plus className="w-2.5 h-2.5" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* User Table */}
            <section className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <h2 className="text-lg font-serif font-bold text-navy">User Management</h2>
                    <div className="relative max-w-xs w-full">
                        <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input type="text" placeholder="Search users..." className="w-full pl-8 pr-3 py-1.5 bg-surface border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                <div className="overflow-x-auto min-w-full">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-surface text-muted uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr><td colSpan={4} className="py-8 text-center text-muted font-serif">No users found.</td></tr>
                            ) : filteredUsers.map((u, i) => (
                                <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${i % 2 !== 0 ? 'bg-slate-50/50' : ''}`}>
                                    <td className="px-4 py-3 font-bold text-navy">{u.name}</td>
                                    <td className="px-4 py-3 text-muted">{u.email}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-accent text-white' : u.role === 'instructor' ? 'bg-primary text-white' : 'bg-success text-white'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-muted">{new Date(u.created_at * 1000).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Course Table */}
            <section className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="p-4 border-b border-border">
                    <h2 className="text-lg font-serif font-bold text-navy">Course Overview</h2>
                </div>
                <div className="overflow-x-auto min-w-full">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-surface text-muted uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-4 py-3">Course Name</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Enrollments</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.length === 0 ? (
                                <tr><td colSpan={3} className="py-8 text-center text-muted font-serif">No courses found.</td></tr>
                            ) : courses.map((c, i) => (
                                <tr key={c.id} className={`hover:bg-slate-50 transition-colors ${i % 2 !== 0 ? 'bg-slate-50/50' : ''}`}>
                                    <td className="px-4 py-3 font-bold text-navy">{c.title}</td>
                                    <td className="px-4 py-3">
                                        <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${c.status === 'completed' ? 'text-success bg-success/10' : 'text-muted bg-slate-100'}`}>
                                            {c.status === 'completed' ? 'Completed' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-ink font-medium">{c.enrollment_count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Schedule Meeting Modal */}
            {showMeetingModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface">
                            <h3 className="text-base font-serif font-bold text-navy">Schedule a Meeting</h3>
                            <button onClick={() => setShowMeetingModal(false)} className="p-1 hover:bg-slate-200 rounded transition group">
                                <X className="w-4 h-4 text-muted group-hover:text-navy transition-colors" />
                            </button>
                        </div>
                        <div className="p-5 space-y-3.5">
                            <div>
                                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Meeting Title *</label>
                                <input type="text" placeholder="e.g. Weekly Sync" value={meetForm.title}
                                    onChange={e => setMeetForm(p => ({ ...p, title: e.target.value }))}
                                    className="w-full border border-border rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 bg-surface shadow-inner" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Description</label>
                                <textarea placeholder="Optional description" value={meetForm.description}
                                    onChange={e => setMeetForm(p => ({ ...p, description: e.target.value }))}
                                    className="w-full border border-border rounded-lg px-3.5 py-2 text-xs h-16 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 bg-surface shadow-inner" />
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Date & Time *</label>
                                    <input type="datetime-local" value={meetForm.scheduledAt}
                                        onChange={e => setMeetForm(p => ({ ...p, scheduledAt: e.target.value }))}
                                        className="w-full border border-border rounded-lg px-3.5 py-2 text-[10px] focus:outline-none focus:ring-2 focus:ring-primary/20 bg-surface shadow-inner" />
                                </div>
                                <div className="w-24">
                                    <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Min</label>
                                    <input type="number" value={meetForm.durationMin}
                                        onChange={e => setMeetForm(p => ({ ...p, durationMin: Number(e.target.value) }))}
                                        className="w-full border border-border rounded-lg px-3.5 py-2 text-[10px] focus:outline-none focus:ring-2 focus:ring-primary/20 bg-surface shadow-inner" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Invite Participants</label>
                                <input type="text" placeholder="Search users by name or email..." value={userSearch}
                                    onChange={e => {
                                        setUserSearch(e.target.value);
                                        setMeetFilteredUsers(users.filter(u =>
                                            u.name.toLowerCase().includes(e.target.value.toLowerCase()) ||
                                            u.email.toLowerCase().includes(e.target.value.toLowerCase())
                                        ));
                                    }}
                                    className="w-full border border-border rounded-lg px-3.5 py-2 text-xs mb-2 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-surface shadow-inner" />
                                {userSearch && meetFilteredUsers.length > 0 && (
                                    <div className="max-h-24 overflow-y-auto border border-border rounded-lg">
                                        {meetFilteredUsers.map(u => (
                                            <div key={u.id}
                                                onClick={() => setInvitees(prev => prev.find(i => i.id === u.id) ? prev.filter(i => i.id !== u.id) : [...prev, u])}
                                                className={`flex items-center justify-between px-2.5 py-1.5 cursor-pointer hover:bg-surface text-[11px] ${invitees.find(i => i.id === u.id) ? 'bg-surface' : ''}`}>
                                                <span>{u.name} <span className="text-muted text-[10px]">({u.email})</span></span>
                                                {invitees.find(i => i.id === u.id) && <span className="text-green-600 text-[10px] font-bold">✓</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {invitees.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {invitees.map(i => (
                                            <span key={i.id} className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-full cursor-pointer hover:bg-navy flex items-center gap-1 transition-colors"
                                                onClick={() => setInvitees(prev => prev.filter(p => p.id !== i.id))}>
                                                {i.name} <X className="w-2 h-2" />
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {meetError && <p className="text-red-600 text-[10px] font-bold">{meetError}</p>}
                            <div className="flex gap-2.5 pt-1.5">
                                <button type="button" onClick={() => setShowMeetingModal(false)}
                                    className="flex-1 px-4 py-2 border border-border rounded-lg font-bold text-muted hover:bg-surface transition text-xs">Cancel</button>
                                <button onClick={handleScheduleMeeting}
                                    disabled={!meetForm.title || !meetForm.scheduledAt}
                                    className="flex-1 px-4 py-2 bg-navy hover:bg-primary text-white rounded-lg font-bold transition shadow-sm disabled:opacity-50 text-xs">
                                    Schedule & Link
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Session Details Modal */}
            {selectedSession && (
                <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-border">
                        <div className="p-4.5 border-b border-border flex items-center justify-between bg-surface/50">
                            <div>
                                <p className="text-[9px] font-bold text-primary uppercase tracking-widest mb-0.5">{selectedSession.course_title}</p>
                                <h3 className="text-lg font-serif font-bold text-navy">{selectedSession.title}</h3>
                            </div>
                            <button onClick={() => setSelectedSession(null)} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-muted hover:text-navy">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-5 sm:p-6 space-y-5">
                            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="space-y-0.5">
                                    <p className="text-[9px] text-muted uppercase font-bold tracking-wider">Date</p>
                                    <p className="text-navy font-bold text-xs flex items-center gap-1.5">
                                        <Users className="w-3 h-3 text-primary" />
                                        {new Date(selectedSession.start_time * 1000).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                                <div className="w-px h-7 bg-slate-200" />
                                <div className="space-y-0.5">
                                    <p className="text-[9px] text-muted uppercase font-bold tracking-wider">Time</p>
                                    <p className="text-navy font-bold text-xs">
                                        {new Date(selectedSession.start_time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <p className="text-[9px] text-muted uppercase font-bold tracking-wider">Description</p>
                                <div className="p-3 bg-surface/50 rounded-xl border border-border min-h-[80px] text-xs text-navy/80 leading-relaxed italic">
                                    {(selectedSession as any).description || 'No description provided for this session.'}
                                </div>
                            </div>

                            {selectedSession.meet_link ? (
                                <div className="space-y-2 pt-1 border-t border-border/20">
                                    <p className="text-[9px] text-muted uppercase font-bold tracking-wider">Meeting Access</p>
                                    <a 
                                        href={selectedSession.meet_link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-white rounded-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all hover:bg-navy text-xs"
                                    >
                                        <Video className="w-4 h-4" /> Join Live Meeting
                                    </a>
                                    <p className="text-[8px] text-center text-muted uppercase tracking-widest font-black opacity-40">Link opens in new tab</p>
                                </div>
                            ) : (
                                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-2 text-amber-700 text-[10px] italic">
                                    <ShieldBan className="w-4 h-4" /> No meeting link available.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
    return (
        <div className="bg-white rounded-xl p-4 border border-border shadow-sm flex items-center gap-3.5">
            <div className="p-2.5 bg-surface rounded-lg text-primary flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5">
                {icon}
            </div>
            <div>
                <p className="text-xl sm:text-2xl font-serif font-black text-navy leading-none">{value}</p>
                <p className="text-[10px] font-black text-muted uppercase tracking-wider mt-1">{title}</p>
            </div>
        </div>
    );
}
