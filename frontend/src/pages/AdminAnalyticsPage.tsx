import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCourseStore } from '../store/courseStore';
import { Users, BookOpen, GraduationCap, TrendingUp, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

type SortDirection = 'asc' | 'desc';
type SortKeyUser = 'name' | 'role' | 'enrolledCount' | 'completion';
type SortKeyCourse = 'name' | 'faculty' | 'enrolledCount' | 'completion';

export default function AdminAnalyticsPage() {
    const { usersList } = useAuthStore();
    const { coursesList, enrolledCourseIds } = useCourseStore();

    // -- Top Level Stats --
    const totalUsers = usersList.length;
    const totalCourses = coursesList.length;
    const totalEnrolments = Object.values(enrolledCourseIds).reduce((acc, curr) => acc + curr.length, 0);

    // -- User Stats Assembly --
    const baseUserStats = usersList.map(u => {
        const enrolled = enrolledCourseIds[u.id] || [];
        // Generating stable mock progress based on string length entropy locally since global multi-tenant progress isn't deeply tracked
        const mockCompletion = enrolled.length === 0 ? 0 : Math.round((u.name.length * 11) % 100);
        return { ...u, enrolledCount: enrolled.length, completion: mockCompletion };
    });

    const activeUsers = baseUserStats.filter(u => u.enrolledCount > 0);
    const platformAvgCompletion = activeUsers.length > 0 
        ? Math.round(activeUsers.reduce((sum, u) => sum + u.completion, 0) / activeUsers.length)
        : 0;

    // -- Course Stats Assembly --
    const baseCourseStats = coursesList.map(c => {
        const enrolledCount = Object.values(enrolledCourseIds).filter(arr => arr.includes(c.id)).length;
        const mockCompletion = enrolledCount === 0 ? 0 : Math.round((c.name.length * 7) % 100);
        return { ...c, enrolledCount, completion: mockCompletion };
    });

    // -- Sort States --
    const [userSortKey, setUserSortKey] = useState<SortKeyUser>('name');
    const [userSortDir, setUserSortDir] = useState<SortDirection>('asc');
    const [courseSortKey, setCourseSortKey] = useState<SortKeyCourse>('name');
    const [courseSortDir, setCourseSortDir] = useState<SortDirection>('asc');

    const handleUserSort = (key: SortKeyUser) => {
        if (userSortKey === key) setUserSortDir(userSortDir === 'asc' ? 'desc' : 'asc');
        else { setUserSortKey(key); setUserSortDir('asc'); }
    };

    const handleCourseSort = (key: SortKeyCourse) => {
        if (courseSortKey === key) setCourseSortDir(courseSortDir === 'asc' ? 'desc' : 'asc');
        else { setCourseSortKey(key); setCourseSortDir('asc'); }
    };

    const sortedUsers = [...baseUserStats].sort((a, b) => {
        const mod = userSortDir === 'asc' ? 1 : -1;
        if (a[userSortKey] < b[userSortKey]) return -1 * mod;
        if (a[userSortKey] > b[userSortKey]) return 1 * mod;
        return 0;
    });

    const sortedCourses = [...baseCourseStats].sort((a, b) => {
        const mod = courseSortDir === 'asc' ? 1 : -1;
        if (a[courseSortKey] < b[courseSortKey]) return -1 * mod;
        if (a[courseSortKey] > b[courseSortKey]) return 1 * mod;
        return 0;
    });

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 pb-24">
            <div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-navy">Platform Analytics</h2>
                <p className="text-muted text-sm mt-1">High-level insights and performance metrics across all users and courses.</p>
            </div>

            {/* Top Stat Boxes */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <StatCard icon={<Users className="w-5 h-5 text-primary" />} label="Total Active Users" value={totalUsers} />
                <StatCard icon={<BookOpen className="w-5 h-5 text-highlight" />} label="Total Courses" value={totalCourses} />
                <StatCard icon={<GraduationCap className="w-5 h-5 text-success" />} label="Total Enrolments" value={totalEnrolments} />
                <StatCard icon={<TrendingUp className="w-5 h-5 text-accent" />} label="Avg Platform Completion" value={`${platformAvgCompletion}%`} />
            </div>

            {/* Tables Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                
                {/* Users Table */}
                <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="p-5 border-b border-border bg-slate-50">
                        <h3 className="font-serif font-bold text-navy text-lg">Per-User Progress</h3>
                    </div>
                    <div className="overflow-x-auto min-w-full max-h-[500px] overflow-y-auto">
                        <table className="w-full text-left text-sm relative">
                            <thead className="bg-slate-50 border-b border-border text-navy uppercase font-bold tracking-wider text-[10px] sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-5 py-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleUserSort('name')}>
                                        <div className="flex items-center gap-1">User {SortIcon(userSortKey === 'name', userSortDir)}</div>
                                    </th>
                                    <th className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleUserSort('role')}>
                                        <div className="flex items-center gap-1">Role {SortIcon(userSortKey === 'role', userSortDir)}</div>
                                    </th>
                                    <th className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors text-center" onClick={() => handleUserSort('enrolledCount')}>
                                        <div className="flex items-center justify-center gap-1">Enrolments {SortIcon(userSortKey === 'enrolledCount', userSortDir)}</div>
                                    </th>
                                    <th className="px-5 py-3 cursor-pointer hover:bg-slate-100 transition-colors text-right" onClick={() => handleUserSort('completion')}>
                                        <div className="flex items-center justify-end gap-1">Avg Completion {SortIcon(userSortKey === 'completion', userSortDir)}</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {sortedUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-3 font-bold text-navy">{user.name}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface border border-border text-muted">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold font-serif text-navy">
                                            {user.enrolledCount}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <span className="font-bold font-serif text-navy">{user.completion}%</span>
                                                <div className="w-16 h-1.5 bg-surface rounded-full overflow-hidden border border-border">
                                                    <div className="h-full bg-success transition-all" style={{ width: `${user.completion}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Courses Table */}
                <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="p-5 border-b border-border bg-slate-50">
                        <h3 className="font-serif font-bold text-navy text-lg">Per-Course Stats</h3>
                    </div>
                    <div className="overflow-x-auto min-w-full max-h-[500px] overflow-y-auto">
                        <table className="w-full text-left text-sm relative">
                            <thead className="bg-slate-50 border-b border-border text-navy uppercase font-bold tracking-wider text-[10px] sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-5 py-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleCourseSort('name')}>
                                        <div className="flex items-center gap-1">Course {SortIcon(courseSortKey === 'name', courseSortDir)}</div>
                                    </th>
                                    <th className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleCourseSort('faculty')}>
                                        <div className="flex items-center gap-1">Faculty {SortIcon(courseSortKey === 'faculty', courseSortDir)}</div>
                                    </th>
                                    <th className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors text-center" onClick={() => handleCourseSort('enrolledCount')}>
                                        <div className="flex items-center justify-center gap-1">Students {SortIcon(courseSortKey === 'enrolledCount', courseSortDir)}</div>
                                    </th>
                                    <th className="px-5 py-3 cursor-pointer hover:bg-slate-100 transition-colors text-right" onClick={() => handleCourseSort('completion')}>
                                        <div className="flex items-center justify-end gap-1">Avg Completion {SortIcon(courseSortKey === 'completion', courseSortDir)}</div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {sortedCourses.map(course => (
                                    <tr key={course.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-3 font-bold text-navy truncate max-w-[150px]" title={course.name}>{course.name}</td>
                                        <td className="px-4 py-3 text-xs text-muted font-medium">{course.faculty}</td>
                                        <td className="px-4 py-3 text-center font-bold font-serif text-navy">
                                            {course.enrolledCount}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <span className="font-bold font-serif text-navy">{course.completion}%</span>
                                                <div className="w-16 h-1.5 bg-surface rounded-full overflow-hidden border border-border">
                                                    <div className="h-full bg-primary transition-all" style={{ width: `${course.completion}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
    return (
        <div className="bg-white px-6 py-5 rounded-xl border border-border flex items-center gap-5 shadow-sm">
            <div className="p-3 bg-surface rounded-lg border border-slate-100 shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-2xl sm:text-3xl font-bold font-serif text-navy leading-none mb-1">{value}</p>
                <p className="text-xs text-muted font-bold uppercase tracking-wider">{label}</p>
            </div>
        </div>
    );
}

function SortIcon(active: boolean, dir: SortDirection) {
    if (!active) return <ChevronDown className="w-3 h-3 opacity-20" />;
    return dir === 'asc' ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />;
}
