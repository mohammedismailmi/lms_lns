import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { Building2, Users, BookOpen, Plus, X, Shield, Search, ChevronDown } from 'lucide-react';
import Navbar from '../components/layout/Navbar';

interface TenantRow {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    user_count: number;
    course_count: number;
    admin_email: string | null;
}

interface UserRow {
    id: string;
    name: string;
    email: string;
    role: string;
    tenant_id: string;
    tenant_name: string | null;
    created_at: number;
}

export default function SuperAdminDashboard() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState({ totalTenants: 0, totalUsers: 0, totalCourses: 0 });
    const [tenants, setTenants] = useState<TenantRow[]>([]);
    const [allUsers, setAllUsers] = useState<UserRow[]>([]);
    const [activeTab, setActiveTab] = useState<'tenants' | 'users'>('tenants');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userFilter, setUserFilter] = useState<string>('all');

    // Create tenant form
    const [newTenant, setNewTenant] = useState({ name: '', slug: '', logoUrl: '', adminName: '', adminEmail: '', adminPassword: '' });
    const [createError, setCreateError] = useState('');
    const [createSuccess, setCreateSuccess] = useState('');

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [statsRes, tenantsRes, usersRes] = await Promise.all([
                api.get('/api/superadmin/stats'),
                api.get('/api/superadmin/tenants'),
                api.get('/api/superadmin/users'),
            ]);
            if (statsRes.data.success) setStats(statsRes.data);
            if (tenantsRes.data.success) setTenants(tenantsRes.data.tenants);
            if (usersRes.data.success) setAllUsers(usersRes.data.users);
        } catch (err) {
            console.error('Failed to fetch admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const handleCreateTenant = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError('');
        setCreateSuccess('');

        try {
            // Step 1: Create tenant
            const tenantRes = await api.post('/api/tenants', {
                name: newTenant.name,
                slug: newTenant.slug,
                logoUrl: newTenant.logoUrl || undefined,
            });

            if (!tenantRes.data.success) {
                setCreateError(tenantRes.data.message || 'Failed to create tenant');
                return;
            }

            const tenantId = tenantRes.data.tenant.id;

            // Step 2: Create admin account in the new tenant
            if (newTenant.adminEmail && newTenant.adminPassword) {
                await api.post('/api/auth/register', {
                    name: newTenant.adminName || 'Admin',
                    email: newTenant.adminEmail,
                    password: newTenant.adminPassword,
                    tenantId: tenantId,
                    role: 'admin',
                });
            }

            setCreateSuccess(`Tenant "${newTenant.name}" created${newTenant.adminEmail ? `. Admin account ${newTenant.adminEmail} is ready.` : '.'}`);
            setNewTenant({ name: '', slug: '', logoUrl: '', adminName: '', adminEmail: '', adminPassword: '' });
            setTimeout(() => {
                setIsCreateOpen(false);
                setCreateSuccess('');
                fetchAll();
            }, 2000);
        } catch (err: any) {
            setCreateError(err.response?.data?.message || 'Error creating tenant');
        }
    };

    const filteredUsers = userFilter === 'all'
        ? allUsers
        : allUsers.filter(u => u.tenant_id === userFilter);

    const renderLogo = (t: TenantRow) => {
        if (t.logo_url) {
            return <img src={t.logo_url} alt={t.name} className="w-8 h-8 rounded-full object-cover bg-white border border-slate-200" />;
        }
        return (
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs" style={{ backgroundColor: '#0F2040' }}>
                {t.name.charAt(0)}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-8 py-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-6 h-6 text-indigo-400" />
                        <span className="text-indigo-400 font-bold text-sm uppercase tracking-widest">Platform Administration</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-1">Super Admin Dashboard</h1>
                    <p className="text-slate-400 text-sm">Welcome, {user?.name}. Manage all tenants from one place.</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-indigo-600" />
                            </div>
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Tenants</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-800">{stats.totalTenants}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <Users className="w-5 h-5 text-emerald-600" />
                            </div>
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Users</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-800">{stats.totalUsers}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-amber-600" />
                            </div>
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Courses</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-800">{stats.totalCourses}</p>
                    </div>
                </div>

                {/* Tab Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('tenants')}
                            className={`px-5 py-2 rounded-md text-sm font-bold transition ${activeTab === 'tenants' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Building2 className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                            Tenants
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-5 py-2 rounded-md text-sm font-bold transition ${activeTab === 'users' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Users className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                            All Users
                        </button>
                    </div>

                    {activeTab === 'tenants' && (
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-lg transition shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Create New Tenant
                        </button>
                    )}

                    {activeTab === 'users' && (
                        <select
                            value={userFilter}
                            onChange={(e) => setUserFilter(e.target.value)}
                            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-white"
                        >
                            <option value="all">All Tenants</option>
                            {tenants.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Tenants Table */}
                {activeTab === 'tenants' && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Institution</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Slug</th>
                                    <th className="text-center px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Users</th>
                                    <th className="text-center px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Courses</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Admin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenants.map((t) => (
                                    <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {renderLogo(t)}
                                                <span className="font-semibold text-slate-800">{t.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">{t.slug}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-700">{t.user_count}</td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-700">{t.course_count}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{t.admin_email || '—'}</td>
                                    </tr>
                                ))}
                                {tenants.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">No tenants found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* All Users Table */}
                {activeTab === 'users' && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Institution</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((u) => (
                                    <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                                        <td className="px-6 py-3 font-semibold text-slate-800 text-sm">{u.name}</td>
                                        <td className="px-6 py-3 text-sm text-slate-600">{u.email}</td>
                                        <td className="px-6 py-3">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                                u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                u.role === 'instructor' ? 'bg-blue-100 text-blue-700' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-sm text-slate-500">{u.tenant_name || u.tenant_id}</td>
                                        <td className="px-6 py-3 text-sm text-slate-400">
                                            {new Date(u.created_at * 1000).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">No users found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Tenant Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800">Create New Tenant</h3>
                            <button onClick={() => { setIsCreateOpen(false); setCreateError(''); setCreateSuccess(''); }} className="p-1 hover:bg-slate-200 rounded transition">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTenant} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Institution Name *</label>
                                <input
                                    value={newTenant.name}
                                    onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value, slug: newTenant.slug || autoSlug(e.target.value) })}
                                    placeholder="e.g. Bangalore University"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Slug *</label>
                                <input
                                    value={newTenant.slug}
                                    onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                    placeholder="e.g. bangalore-uni"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Logo URL (optional)</label>
                                <input
                                    value={newTenant.logoUrl}
                                    onChange={(e) => setNewTenant({ ...newTenant, logoUrl: e.target.value })}
                                    placeholder="https://example.com/logo.png"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                />
                            </div>

                            <div className="pt-2 border-t border-slate-100">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">First Admin Account (optional)</p>
                                <div className="space-y-3">
                                    <input
                                        value={newTenant.adminName}
                                        onChange={(e) => setNewTenant({ ...newTenant, adminName: e.target.value })}
                                        placeholder="Admin Name"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    />
                                    <input
                                        value={newTenant.adminEmail}
                                        onChange={(e) => setNewTenant({ ...newTenant, adminEmail: e.target.value })}
                                        placeholder="admin@institution.edu"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    />
                                    <input
                                        type="password"
                                        value={newTenant.adminPassword}
                                        onChange={(e) => setNewTenant({ ...newTenant, adminPassword: e.target.value })}
                                        placeholder="Admin Password"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    />
                                </div>
                            </div>

                            {createError && <p className="text-red-600 text-sm font-bold">{createError}</p>}
                            {createSuccess && <p className="text-green-600 text-sm font-bold">{createSuccess}</p>}

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsCreateOpen(false)}
                                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50 transition">
                                    Cancel
                                </button>
                                <button type="submit"
                                    className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition shadow-sm">
                                    Create Tenant
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
