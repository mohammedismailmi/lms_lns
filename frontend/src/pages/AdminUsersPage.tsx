import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Search, Plus, ChevronDown, ChevronUp, UserMinus, X, Loader2, BookOpen } from 'lucide-react';
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
            <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
                <h2 className="text-3xl font-serif font-bold text-navy">Manage Users</h2>
                <div className="flex items-center justify-center py-20 text-muted">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading users...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 max-w-7xl mx-auto">
                <h2 className="text-3xl font-serif font-bold text-navy mb-4">Manage Users</h2>
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                    <p className="text-red-600 font-bold">{error}</p>
                    <button onClick={() => { setError(null); setLoading(true); fetchUsers(); }} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-navy">Manage Users</h2>
                    <p className="text-muted text-sm mt-1">Add, edit, and orchestrate platform user roles.</p>
                </div>
                <button onClick={() => setAddModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-navy transition-colors font-medium shadow-sm w-max">
                    <Plus className="w-5 h-5" /> <span>Add User</span>
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-border flex flex-col md:flex-row gap-4 mb-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-surface text-ink placeholder:text-muted rounded-lg py-2 pl-10 pr-4 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-sm transition-all" />
                </div>
                <div className="w-full md:w-48">
                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full bg-surface border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-sm transition-all">
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="instructor">Instructor</option>
                        <option value="learner">Learner</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-border text-navy uppercase font-bold tracking-wider text-xs">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Courses</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredUsers.length === 0 ? (
                                <tr><td colSpan={4} className="py-12 text-center text-muted font-serif">No users found.</td></tr>
                            ) : null}
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-serif shrink-0">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-navy">{user.name}</p>
                                                <p className="text-xs text-muted">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider', getRolePillColor(user.role))}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-navy font-bold">
                                            <BookOpen className="w-3.5 h-3.5 text-primary" />
                                            {user.enrollment_count}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-muted text-sm">
                                        {new Date(user.created_at * 1000).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <select
                                                className="text-sm bg-surface border border-border rounded px-2 py-1 outline-none cursor-pointer focus:border-primary transition-colors"
                                                value={user.role}
                                                disabled={changingRole === user.id}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            >
                                                <option value="admin">Admin</option>
                                                <option value="instructor">Instructor</option>
                                                <option value="learner">Learner</option>
                                            </select>

                                            {confirmRemoveRole === user.id ? (
                                                <div className="flex items-center gap-2 bg-accent/10 px-2 py-1 rounded border border-accent/20">
                                                    <span className="text-xs text-accent font-bold">Demote?</span>
                                                    <button className="text-xs text-accent hover:underline font-bold" onClick={() => handleRemoveRole(user.id)}>Yes</button>
                                                    <button className="text-xs text-muted hover:underline" onClick={() => setConfirmRemoveRole(null)}>Cancel</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setConfirmRemoveRole(user.id)} className="text-muted hover:text-accent p-1 transition-colors" title="Demote to Learner">
                                                    <UserMinus className="w-4 h-4" />
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
