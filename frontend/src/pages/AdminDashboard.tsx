import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Users, BookOpen, Building2, Award, Search, ShieldBan, ChevronDown, Loader2 } from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';
import api from '../lib/api';

interface Stats {
    totalUsers: number;
    totalCourses: number;
    totalEnrollments: number;
    certificatesIssued: number;
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

    if (user?.role !== 'admin') return <Navigate to="/" replace />;

    useEffect(() => {
        Promise.all([
            api.get('/api/admin/tenant-stats'),
            api.get('/api/admin/tenant-users'),
            api.get('/api/courses'),
            api.get('/api/admin/upcoming-sessions'),
        ]).then(([statsRes, usersRes, coursesRes, sessionsRes]) => {
            if (statsRes.data.success) setStats(statsRes.data.stats);
            if (usersRes.data.success) setUsers(usersRes.data.users);
            if (coursesRes.data.success) setCourses(coursesRes.data.courses);
            if (sessionsRes.data.success) setSessions(sessionsRes.data.sessions);
        }).catch(err => setError(err.message || 'Failed to load dashboard'))
          .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="p-8 max-w-[1600px] mx-auto space-y-10 font-sans pb-24">
                <h1 className="text-4xl font-serif font-bold text-navy mb-8">Admin Dashboard</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="bg-white rounded-xl p-6 border border-border shadow-sm animate-pulse">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-slate-200 rounded-xl" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-8 bg-slate-200 rounded w-16" />
                                    <div className="h-4 bg-slate-100 rounded w-24" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-center py-20 text-muted">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading dashboard...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 max-w-[1600px] mx-auto">
                <h1 className="text-4xl font-serif font-bold text-navy mb-8">Admin Dashboard</h1>
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                    <p className="text-red-600 font-bold">{error}</p>
                    <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">Retry</button>
                </div>
            </div>
        );
    }

    const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-10 font-sans pb-24">
            <h1 className="text-4xl font-serif font-bold text-navy mb-8">Admin Dashboard</h1>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link to="/admin/users" className="block hover:scale-[1.02] transition-transform">
                    <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={<Users />} />
                </Link>
                <Link to="/admin/courses" className="block hover:scale-[1.02] transition-transform">
                    <StatCard title="Total Courses" value={stats?.totalCourses || 0} icon={<BookOpen />} />
                </Link>
                <StatCard title="Enrollments" value={stats?.totalEnrollments || 0} icon={<Building2 />} />
                <StatCard title="Certificates" value={stats?.certificatesIssued || 0} icon={<Award />} />
            </div>

            {/* Upcoming Sessions */}
            <section className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border">
                    <h2 className="text-2xl font-serif font-bold text-navy">Upcoming Live Sessions</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sessions.length === 0 ? (
                        <div className="col-span-full py-8 text-center text-muted font-serif italic">
                            No upcoming sessions scheduled.
                        </div>
                    ) : sessions.map(session => (
                        <div key={session.id} className="p-4 rounded-lg border border-slate-100 bg-slate-50 relative overflow-hidden group hover:border-primary/30 transition-colors">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 -mr-8 -mt-8 rounded-full" />
                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">{session.course_title}</p>
                            <h3 className="font-bold text-navy mb-3 line-clamp-1">{session.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-muted font-medium">
                                <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-navy font-bold">
                                    {new Date(session.start_time * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                                <span>at {new Date(session.start_time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            {session.meet_link && (
                                <a href={session.meet_link} target="_blank" rel="noopener noreferrer" className="mt-4 block text-center py-2 bg-white border border-primary/20 text-primary text-xs font-bold rounded-lg hover:bg-primary hover:text-white transition-all">
                                    Join Meeting
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* User Table */}
            <section className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-serif font-bold text-navy">User Management</h2>
                    <div className="relative max-w-sm w-full">
                        <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                        <input type="text" placeholder="Search users..." className="w-full pl-10 pr-4 py-2 bg-surface border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-surface text-muted uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr><td colSpan={4} className="py-12 text-center text-muted font-serif">No users found.</td></tr>
                            ) : filteredUsers.map((u, i) => (
                                <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${i % 2 !== 0 ? 'bg-slate-50/50' : ''}`}>
                                    <td className="px-6 py-4 font-bold text-navy">{u.name}</td>
                                    <td className="px-6 py-4 text-muted">{u.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-accent text-white' : u.role === 'instructor' ? 'bg-primary text-white' : 'bg-success text-white'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-muted">{new Date(u.created_at * 1000).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Course Table */}
            <section className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border">
                    <h2 className="text-2xl font-serif font-bold text-navy">Course Overview</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-surface text-muted uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4">Course Name</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Enrollments</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.length === 0 ? (
                                <tr><td colSpan={3} className="py-12 text-center text-muted font-serif">No courses found.</td></tr>
                            ) : courses.map((c, i) => (
                                <tr key={c.id} className={`hover:bg-slate-50 transition-colors ${i % 2 !== 0 ? 'bg-slate-50/50' : ''}`}>
                                    <td className="px-6 py-4 font-bold text-navy">{c.title}</td>
                                    <td className="px-6 py-4">
                                        <span className={`font-bold px-2 py-1 rounded ${c.status === 'completed' ? 'text-success bg-success/10' : 'text-muted bg-slate-100'}`}>
                                            {c.status === 'completed' ? 'Completed' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-ink">{c.enrollment_count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
    return (
        <div className="bg-white rounded-xl p-6 border border-border shadow-sm flex items-center gap-5">
            <div className="p-4 bg-surface rounded-xl text-primary flex items-center justify-center [&>svg]:w-8 [&>svg]:h-8">
                {icon}
            </div>
            <div>
                <p className="text-3xl font-serif font-bold text-navy">{value}</p>
                <p className="text-sm font-bold text-muted uppercase tracking-wider mt-1">{title}</p>
            </div>
        </div>
    );
}
