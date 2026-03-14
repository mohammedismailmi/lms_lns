import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { users, courses, tenants, User } from '../lib/mockData';
import { useProgressStore } from '../store/progressStore';
import { useCourseStore } from '../store/courseStore';
import { Users, BookOpen, Building2, Award, Search, ShieldBan, ChevronDown } from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';

export default function AdminDashboard() {
    const { user } = useAuthStore();
    const { instructorCompleted } = useCourseStore();
    const { getCourseProgress } = useProgressStore();

    const [searchTerm, setSearchTerm] = useState('');

    // Guard
    if (user?.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    // Derived stats
    const totalUsers = users.length;
    const totalCourses = courses.length;
    const activeTenants = tenants.length;
    const certifiedCourses = instructorCompleted.size;

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-10 font-sans pb-24">
            <h1 className="text-4xl font-serif font-bold text-navy mb-8">Admin Dashboard</h1>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link to="/admin/users" className="block hover:scale-[1.02] transition-transform">
                    <StatCard title="Total Users" value={totalUsers} icon={<Users />} />
                </Link>
                <Link to="/admin/courses" className="block hover:scale-[1.02] transition-transform">
                    <StatCard title="Total Courses" value={totalCourses} icon={<BookOpen />} />
                </Link>
                <Link to="/admin/tenants" className="block hover:scale-[1.02] transition-transform">
                    <StatCard title="Active Tenants" value={activeTenants} icon={<Building2 />} />
                </Link>
                <Link to="/admin/analytics" className="block hover:scale-[1.02] transition-transform">
                    <StatCard title="Certified Courses" value={certifiedCourses} icon={<Award />} />
                </Link>
            </div>

            {/* User Management */}
            <section className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-serif font-bold text-navy">User Management</h2>
                    <div className="relative max-w-sm w-full">
                        <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full pl-10 pr-4 py-2 bg-surface border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-surface text-muted uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Tenant</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map((u, i) => (i % 2 === 0 ? <UserRow key={u.id} user={u} bg="bg-white" /> : <UserRow key={u.id} user={u} bg="bg-slate-50/50" />))}
                        </tbody>
                    </table>
                </div>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {/* Course Management */}
                <section className="bg-white rounded-xl shadow-sm border border-border overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-border">
                        <h2 className="text-2xl font-serif font-bold text-navy">Course Overview</h2>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-surface text-muted uppercase tracking-wider font-bold">
                                <tr>
                                    <th className="px-6 py-4">Course Name</th>
                                    <th className="px-6 py-4">Faculty</th>
                                    <th className="px-6 py-4">Certified</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses.map((c, i) => (
                                    <tr key={c.id} className={`hover:bg-slate-50 transition-colors ${i % 2 !== 0 ? 'bg-slate-50/50' : ''}`}>
                                        <td className="px-6 py-4 font-bold text-navy">{c.name}</td>
                                        <td className="px-6 py-4 text-ink">{c.faculty}</td>
                                        <td className="px-6 py-4">
                                            {instructorCompleted.has(c.id)
                                                ? <span className="text-success font-bold bg-success/10 px-2 py-1 rounded">Yes</span>
                                                : <span className="text-muted font-bold bg-slate-100 px-2 py-1 rounded">No</span>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Tenant Management */}
                <section className="bg-white rounded-xl shadow-sm border border-border overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-border">
                        <h2 className="text-2xl font-serif font-bold text-navy">Tenant Management</h2>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-surface text-muted uppercase tracking-wider font-bold">
                                <tr>
                                    <th className="px-6 py-4">Tenant Name</th>
                                    <th className="px-6 py-4">Subdomain</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenants.map((t, i) => (
                                    <tr key={t.id} className={`hover:bg-slate-50 transition-colors ${i % 2 !== 0 ? 'bg-slate-50/50' : ''}`}>
                                        <td className="px-6 py-4 font-bold text-navy">{t.name}</td>
                                        <td className="px-6 py-4 text-muted font-mono">{t.slug}.lms.com</td>
                                        <td className="px-6 py-4">
                                            <span className="text-primary font-bold bg-primary/10 px-2 py-1 rounded">Active</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

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

function UserRow({ user, bg }: { user: User; bg: string }) {
    const [role, setRole] = useState(user.role);

    return (
        <tr className={`${bg} hover:bg-slate-100 transition-colors`}>
            <td className="px-6 py-4 font-bold text-ink">{user.name}</td>
            <td className="px-6 py-4 text-muted">{user.email}</td>
            <td className="px-6 py-4 font-medium">{tenants.find(t => t.id === user.tenantId)?.name || user.tenantId}</td>
            <td className="px-6 py-4">
                <div className="relative inline-block border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <select
                        className="appearance-none bg-transparent pl-3 pr-8 py-1.5 focus:outline-none text-sm font-bold text-navy capitalize cursor-pointer"
                        value={role}
                        onChange={(e) => setRole(e.target.value as any)}
                    >
                        <option value="admin">Admin</option>
                        <option value="instructor">Instructor</option>
                        <option value="learner">Learner</option>
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                </div>
            </td>
            <td className="px-6 py-4 text-right">
                <button className="text-muted hover:text-accent font-bold text-sm flex items-center justify-end gap-1 w-full transition-colors group">
                    <ShieldBan className="w-4 h-4 group-hover:animate-pulse" /> Deactivate
                </button>
            </td>
        </tr>
    );
}
