import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Search, Plus, ChevronDown, ChevronUp, UserMinus, X, Loader2, BookOpen, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import AddUserModal from '../components/admin/AddUserModal';
import { cn } from '../lib/utils';
import api from '../lib/api';

interface DBUser {
    id: string;
    name: string;
    email: string;
    role: string;
    tenant_id: string;
    created_at: number;
    enrollment_count: number;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<DBUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [confirmRemoveRole, setConfirmRemoveRole] = useState<string | null>(null);
    const [changingRole, setChangingRole] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/api/admin/users');
            if (res.data.success) setUsers(res.data.users);
        } catch (err: any) {
            setError(err.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleRoleChange = async (userId: string, newRole: string) => {
        setChangingRole(userId);
        try {
            await api.put(`/api/admin/users/${userId}/role`, { role: newRole });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (err) {
            console.error('Failed to update role:', err);
        } finally {
            setChangingRole(null);
        }
    };

    const handleRemoveRole = (userId: string) => {
        handleRoleChange(userId, 'learner');
        setConfirmRemoveRole(null);
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const getRolePillColor = (role: string) => {
        if (role === 'admin') return 'bg-accent text-white';
        if (role === 'instructor') return 'bg-primary text-white';
        return 'bg-success text-white';
    };

    if (loading) {
        return (
            <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 pb-24">
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-navy">Manage Users</h2>
                <div className="flex items-center justify-center py-20 text-muted">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading users...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 sm:p-8 max-w-7xl mx-auto">
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-navy mb-4">Manage Users</h2>
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                    <p className="text-red-600 font-bold">{error}</p>
                    <button onClick={() => { setError(null); setLoading(true); fetchUsers(); }} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-5 max-w-7xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Link to="/admin" className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 mb-1.5">
                        <ChevronLeft className="w-2.5 h-2.5" /> Back to Admin Hub
                    </Link>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-navy tracking-tight">Manage Users</h2>
                    <p className="text-muted text-xs mt-0.5 opacity-80">Add, edit, and orchestrate platform user roles.</p>
                </div>
                <button onClick={() => setAddModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-navy text-white rounded-xl hover:bg-primary transition-all font-bold shadow-lg shadow-navy/20 w-max text-xs active:scale-95">
                    <Plus className="w-4 h-4" /> <span>Add User</span>
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-premium border border-border/40 flex flex-col md:flex-row gap-5 mb-6 items-center bg-[radial-gradient(circle_at_top_right,_#1b3a6b05,_transparent)]">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted font-bold" />
                    <input 
                        type="text" 
                        placeholder="Search identity directory by name or email..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        className="w-full bg-surface text-navy placeholder:text-muted rounded-xl py-2.5 pl-10 pr-4 border border-border/40 focus:outline-none focus:ring-4 focus:ring-primary/10 text-xs font-bold shadow-inner transition-all" 
                    />
                </div>
                <div className="w-full md:w-48">
                    <select 
                        value={roleFilter} 
                        onChange={(e) => setRoleFilter(e.target.value)} 
                        className="w-full bg-surface border border-border/40 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-4 focus:ring-primary/10 text-[10px] font-black uppercase tracking-widest text-navy cursor-pointer shadow-inner appearance-none transition-all"
                    >
                        <option value="all">All Classifications</option>
                        <option value="admin">Administrators</option>
                        <option value="instructor">Academic Faculty</option>
                        <option value="learner">Learners / Students</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-3xl shadow-premium border border-border/40 overflow-hidden">
                <div className="overflow-x-auto min-w-full">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-surface border-b border-border/40 text-navy uppercase font-black tracking-[0.2em] text-[9px]">
                            <tr>
                                <th className="px-6 py-4">Academic Identity</th>
                                <th className="px-6 py-3.5">Classification</th>
                                <th className="px-6 py-3.5 text-center">Enrollments</th>
                                <th className="px-6 py-3.5">Joined Matrix</th>
                                <th className="px-6 py-3.5 text-right">Operational Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {filteredUsers.length === 0 ? (
                                <tr><td colSpan={5} className="py-12 text-center text-muted font-serif text-sm">No users found.</td></tr>
                            ) : null}
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-serif shrink-0 text-xs shadow-sm border border-primary/5">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-navy text-[11px] leading-tight">{user.name}</p>
                                                <p className="text-[10px] text-muted opacity-70">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={cn('px-1.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider', getRolePillColor(user.role))}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1 text-navy font-bold text-[10px]">
                                            <BookOpen className="w-3 h-3 text-primary" />
                                            {user.enrollment_count}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-muted text-[10px] font-medium">
                                        {new Date(user.created_at * 1000).toLocaleDateString()}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2.5">
                                            <select
                                                className="text-[10px] font-bold bg-surface border border-border/60 rounded px-1.5 py-1 outline-none cursor-pointer focus:border-primary transition-colors text-navy shadow-sm"
                                                value={user.role}
                                                disabled={changingRole === user.id}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            >
                                                <option value="admin">Admin</option>
                                                <option value="instructor">Instructor</option>
                                                <option value="learner">Learner</option>
                                            </select>

                                            {confirmRemoveRole === user.id ? (
                                                <div className="flex items-center gap-1.5 bg-accent/5 px-2 py-1 rounded border border-accent/20 animate-in fade-in slide-in-from-right-2 duration-300">
                                                    <span className="text-[9px] text-accent font-black uppercase tracking-tighter">Demote?</span>
                                                    <button className="text-[9px] text-accent hover:underline font-bold" onClick={() => handleRemoveRole(user.id)}>Yes</button>
                                                    <button className="text-[9px] text-muted hover:underline" onClick={() => setConfirmRemoveRole(null)}>Cancel</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setConfirmRemoveRole(user.id)} className="text-muted hover:text-accent p-1 transition-colors group/btn" title="Demote to Learner">
                                                    <UserMinus className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddUserModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} />
        </div>
    );
}
