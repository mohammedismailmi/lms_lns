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
    const [sortConfig, setSortConfig] = useState<{ key: keyof TenantRow, direction: 'asc' | 'desc' } | null>(null);

    // Add Admin state
    const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
    const [selectedTenantId, setSelectedTenantId] = useState('');
    const [selectedTenantName, setSelectedTenantName] = useState('');
    const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });

    // Create tenant form
    const [newTenant, setNewTenant] = useState({ name: '', slug: '', logoUrl: '', adminName: '', adminEmail: '', adminPassword: '' });
    const [createError, setCreateError] = useState('');
    const [createSuccess, setCreateSuccess] = useState('');
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);

    const sortedTenants = React.useMemo(() => {
        let sortable = [...tenants];
        if (sortConfig !== null) {
            sortable.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue === null || aValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
                if (bValue === null || bValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortable;
    }, [tenants, sortConfig]);

    const requestSort = (key: keyof TenantRow) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

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

    const setLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setIsUploadingLogo(true);
        setCreateError('');
        
        const fd = new FormData();
        fd.append('file', file);
        
        try {
            const res = await api.post('/api/upload/tenant-logo', fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success || res.status === 200) {
                setNewTenant({ ...newTenant, logoUrl: res.data.logoUrl });
            } else {
                setCreateError(res.data.message || res.data.error || 'Failed to upload logo');
            }
        } catch (err: any) {
            setCreateError(err.response?.data?.error || err.response?.data?.message || 'Error uploading logo');
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const handleCreateTenant = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError('');
        setCreateSuccess('');

        try {
            // Step 1: Create tenant
            const tenantRes = await api.post('/api/superadmin/tenants', {
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

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError('');
        setCreateSuccess('');
        try {
            await api.post('/api/auth/register', {
                name: newAdmin.name || 'Admin',
                email: newAdmin.email,
                password: newAdmin.password,
                tenantId: selectedTenantId,
                role: 'admin',
            });
            setCreateSuccess(`Admin account ${newAdmin.email} created for ${selectedTenantName}.`);
            setNewAdmin({ name: '', email: '', password: '' });
            setTimeout(() => {
                setIsAddAdminOpen(false);
                setCreateSuccess('');
                fetchAll();
            }, 2000);
        } catch (err: any) {
            setCreateError(err.response?.data?.message || 'Error creating admin');
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
            <div className="bg-gradient-to-r from-navy to-slate-800 text-white px-5 py-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Shield className="w-4.5 h-4.5 text-highlight" />
                            <span className="text-highlight font-black text-[9px] uppercase tracking-[0.2em] opacity-80">Platform Administration</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-serif font-black mb-0.5 tracking-tight">Super Admin Dashboard</h1>
                        <p className="text-slate-400 text-xs font-medium">Welcome back, {user?.name}. Global Nexus Management Portal.</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-5 py-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
                    <div className="bg-white rounded-xl border border-border/40 p-4 shadow-sm flex items-center gap-4">
                        <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                            <Building2 className="w-4.5 h-4.5 text-indigo-600" />
                        </div>
                        <div>
                            <span className="text-[9px] font-black text-muted uppercase tracking-[0.15em] block mb-0.5">Institutions</span>
                            <p className="text-xl sm:text-2xl font-serif font-black text-navy leading-none">{stats.totalTenants}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-border/40 p-4 shadow-sm flex items-center gap-4">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                            <Users className="w-4.5 h-4.5 text-emerald-600" />
                        </div>
                        <div>
                            <span className="text-[9px] font-black text-muted uppercase tracking-[0.15em] block mb-0.5">Identities</span>
                            <p className="text-xl sm:text-2xl font-serif font-black text-navy leading-none">{stats.totalUsers}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-border/40 p-4 shadow-sm flex items-center gap-4">
                        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-4.5 h-4.5 text-amber-600" />
                        </div>
                        <div>
                            <span className="text-[9px] font-black text-muted uppercase tracking-[0.15em] block mb-0.5">Catalog Courses</span>
                            <p className="text-xl sm:text-2xl font-serif font-black text-navy leading-none">{stats.totalCourses}</p>
                        </div>
                    </div>
                </div>

                {/* Tab Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('tenants')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition ${activeTab === 'tenants' ? 'bg-white shadow-sm text-navy' : 'text-muted hover:text-navy'}`}
                        >
                            Tenants
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition ${activeTab === 'users' ? 'bg-white shadow-sm text-navy' : 'text-muted hover:text-navy'}`}
                        >
                            Identities
                        </button>
                    </div>

                    {activeTab === 'tenants' && (
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="flex items-center gap-1.5 bg-navy hover:bg-primary text-white font-black px-4 py-2 rounded-xl transition shadow-lg shadow-navy/20 text-[10px] uppercase tracking-widest active:scale-95"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Create Tenant
                        </button>
                    )}

                    {activeTab === 'users' && (
                        <div className="relative">
                            <select
                                value={userFilter}
                                onChange={(e) => setUserFilter(e.target.value)}
                                className="px-4 py-2 border border-border/60 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white shadow-sm appearance-none pr-8 cursor-pointer text-navy"
                            >
                                <option value="all">Global Matrix</option>
                                {tenants.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted pointer-events-none" />
                        </div>
                    )}
                </div>

                {/* Tenants Table */}
                {activeTab === 'tenants' && (
                    <div className="bg-white rounded-3xl border border-border/40 shadow-premium overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-border/40 bg-surface/50 select-none">
                                        <th onClick={() => requestSort('name')} className="px-5 py-3 text-[9px] font-black text-muted uppercase tracking-[0.2em] cursor-pointer hover:bg-slate-100 transition">
                                            Institutional Identity {sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                                        </th>
                                        <th onClick={() => requestSort('slug')} className="px-5 py-3 text-[9px] font-black text-muted uppercase tracking-[0.2em] cursor-pointer hover:bg-slate-100 transition">
                                            Handshake Slug
                                        </th>
                                        <th onClick={() => requestSort('user_count')} className="text-center px-5 py-3 text-[9px] font-black text-muted uppercase tracking-[0.2em] cursor-pointer hover:bg-slate-100 transition">
                                            Matrix {sortConfig?.key === 'user_count' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                                        </th>
                                        <th onClick={() => requestSort('course_count')} className="text-center px-5 py-3 text-[9px] font-black text-muted uppercase tracking-[0.2em] cursor-pointer hover:bg-slate-100 transition">
                                            Catalog {sortConfig?.key === 'course_count' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                                        </th>
                                        <th className="px-5 py-3 text-[9px] font-black text-muted uppercase tracking-[0.2em]">Administrative Gateway</th>
                                        <th className="text-right px-5 py-3 text-[9px] font-black text-muted uppercase tracking-[0.2em]">Management</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    {sortedTenants.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    {renderLogo(t)}
                                                    <span className="font-bold text-navy text-xs">{t.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="text-[10px] font-mono bg-surface border border-border/40 text-muted px-1.5 py-0.5 rounded leading-none">{t.slug}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-center font-black text-navy text-xs">{t.user_count}</td>
                                            <td className="px-5 py-3.5 text-center font-black text-navy text-xs">{t.course_count}</td>
                                            <td className="px-5 py-3.5 text-[11px] text-muted font-medium">{t.admin_email || '—'}</td>
                                            <td className="px-5 py-3.5 text-right">
                                                <button
                                                    onClick={() => {
                                                        setSelectedTenantId(t.id);
                                                        setSelectedTenantName(t.name);
                                                        setIsAddAdminOpen(true);
                                                    }}
                                                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-navy transition bg-surface hover:bg-primary/5 px-3 py-1.5 rounded-lg border border-border/40 active:scale-95"
                                                >
                                                    Provision Admin
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {tenants.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-12 text-center text-muted font-serif italic text-sm">Deployment registry is empty.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* All Users Table */}
                {activeTab === 'users' && (
                    <div className="bg-white rounded-3xl border border-border/40 shadow-premium overflow-hidden">
                        <div className="overflow-x-auto text-xs">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-border/40 bg-surface/50">
                                        <th className="px-5 py-3 text-[9px] font-black text-muted uppercase tracking-[0.2em]">Academic Identity</th>
                                        <th className="px-5 py-3 text-[9px] font-black text-muted uppercase tracking-[0.2em]">Contact Node</th>
                                        <th className="px-5 py-3 text-[9px] font-black text-muted uppercase tracking-[0.2em]">Classification</th>
                                        <th className="px-5 py-3 text-[9px] font-black text-muted uppercase tracking-[0.2em]">Terminal Hub</th>
                                        <th className="px-5 py-3 text-[9px] font-black text-muted uppercase tracking-[0.2em]">Initial Handshake</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    {filteredUsers.map((u) => (
                                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-5 py-3 font-bold text-navy text-[11px]">{u.name}</td>
                                            <td className="px-5 py-3 text-[11px] text-muted font-medium">{u.email}</td>
                                            <td className="px-5 py-3">
                                                <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                                                    u.role === 'admin' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                                                    u.role === 'instructor' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                    'bg-slate-50 text-slate-500 border border-slate-100'
                                                }`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-[11px] text-navy font-bold">{u.tenant_name || u.tenant_id}</td>
                                            <td className="px-5 py-3 text-[10px] text-muted font-medium">
                                                {new Date(u.created_at * 1000).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-12 text-center text-muted font-serif italic text-sm">Identity matrix is empty.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Tenant Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 bg-navy/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-premium w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-surface">
                            <h3 className="text-lg font-serif font-black text-navy tracking-tight">Deploy New Hub</h3>
                            <button onClick={() => { setIsCreateOpen(false); setCreateError(''); setCreateSuccess(''); }} className="p-1.5 hover:bg-slate-200 rounded-full transition group">
                                <X className="w-4.5 h-4.5 text-muted group-hover:text-navy transition-colors" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTenant} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="block text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-1.5 ml-2">Institution Name *</label>
                                    <input
                                        value={newTenant.name}
                                        onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value, slug: newTenant.slug || autoSlug(e.target.value) })}
                                        placeholder="e.g. Bangalore University"
                                        className="w-full px-4 py-2 border border-border/40 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 bg-surface text-xs font-bold shadow-inner"
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-1.5 ml-2">Institutional Slug *</label>
                                    <input
                                        value={newTenant.slug}
                                        onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                        placeholder="e.g. bangalore-uni"
                                        className="w-full px-4 py-2 border border-border/40 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 font-mono text-[10px] bg-surface shadow-inner"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-1.5 ml-2">Handshake Visuals</label>
                                {!newTenant.logoUrl ? (
                                    <div className="relative border border-dashed border-border/60 rounded-xl p-4 text-center hover:bg-slate-50 transition cursor-pointer bg-surface/50">
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={setLogoFile} 
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            disabled={isUploadingLogo}
                                        />
                                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">{isUploadingLogo ? 'Processing...' : 'Upload Identity Logo'}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 bg-surface p-2 rounded-xl border border-border/40">
                                        <img src={newTenant.logoUrl} alt="Logo" className="w-8 h-8 object-cover rounded-lg shadow-sm border border-white" />
                                        <button 
                                            type="button" 
                                            onClick={() => setNewTenant({ ...newTenant, logoUrl: '' })} 
                                            className="text-[9px] text-accent hover:underline font-black uppercase tracking-widest"
                                        >
                                            Purge
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 border-t border-border/40 bg-surface/30 -mx-5 px-5">
                                <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-2.5 opacity-60 italic">Root Administrative Gateway</p>
                                <div className="space-y-2">
                                    <input
                                        value={newTenant.adminName}
                                        onChange={(e) => setNewTenant({ ...newTenant, adminName: e.target.value })}
                                        placeholder="Gateway Name"
                                        className="w-full px-4 py-2 border border-border/40 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 text-[10px] font-bold bg-white"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            value={newTenant.adminEmail}
                                            onChange={(e) => setNewTenant({ ...newTenant, adminEmail: e.target.value })}
                                            placeholder="admin@node.edu"
                                            className="w-full px-4 py-2 border border-border/40 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 text-[10px] font-bold bg-white"
                                        />
                                        <input
                                            type="password"
                                            value={newTenant.adminPassword}
                                            onChange={(e) => setNewTenant({ ...newTenant, adminPassword: e.target.value })}
                                            placeholder="Security Key"
                                            className="w-full px-4 py-2 border border-border/40 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 text-[10px] font-bold bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {createError && <p className="text-accent text-[9px] font-black uppercase tracking-wider text-center">{createError}</p>}
                            {createSuccess && <p className="text-success text-[9px] font-black uppercase tracking-wider text-center">{createSuccess}</p>}

                            <div className="flex gap-2.5 pt-2">
                                <button type="button" onClick={() => setIsCreateOpen(false)}
                                    className="flex-1 px-4 py-2 rounded-xl font-black text-muted hover:bg-slate-50 border border-border/40 transition text-[10px] uppercase tracking-widest">
                                    Abort
                                </button>
                                <button type="submit"
                                    className="flex-1 px-4 py-2 bg-navy hover:bg-primary text-white rounded-xl font-black transition shadow-lg shadow-navy/20 text-[10px] uppercase tracking-widest">
                                    Deploy Hub
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Admin Modal */}
            {isAddAdminOpen && (
                <div className="fixed inset-0 bg-navy/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-premium w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-surface">
                            <h3 className="text-lg font-serif font-black text-navy tracking-tight">Provision Gateway</h3>
                            <button onClick={() => { setIsAddAdminOpen(false); setCreateError(''); setCreateSuccess(''); }} className="p-1.5 hover:bg-slate-200 rounded-full transition group">
                                <X className="w-4.5 h-4.5 text-muted group-hover:text-navy transition-colors" />
                            </button>
                        </div>
                        <form onSubmit={handleAddAdmin} className="p-5 space-y-3.5">
                            <p className="text-[10px] text-muted font-bold text-center mb-2 px-4 py-1 bg-surface rounded-lg border border-border/30">Target: {selectedTenantName}</p>
                            <div className="space-y-2.5">
                                <div>
                                    <label className="block text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-1 ml-2">Identity Name *</label>
                                    <input
                                        value={newAdmin.name}
                                        onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                                        placeholder="Full Name"
                                        className="w-full px-4 py-2 border border-border/40 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 text-xs font-bold bg-surface shadow-inner"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-1 ml-2">Network Contact *</label>
                                    <input
                                        value={newAdmin.email}
                                        onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                        placeholder="admin@institution.edu"
                                        className="w-full px-4 py-2 border border-border/40 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 text-xs font-bold bg-surface shadow-inner"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-1 ml-2">Access Key *</label>
                                    <input
                                        type="password"
                                        value={newAdmin.password}
                                        onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                        placeholder="Security Key"
                                        className="w-full px-4 py-2 border border-border/40 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 text-xs font-bold bg-surface shadow-inner"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            {createError && <p className="text-accent text-[9px] font-black uppercase tracking-wider text-center mt-2">{createError}</p>}
                            {createSuccess && <p className="text-success text-[9px] font-black uppercase tracking-wider text-center mt-2">{createSuccess}</p>}

                            <div className="flex gap-2.5 pt-3">
                                <button type="button" onClick={() => setIsAddAdminOpen(false)}
                                    className="flex-1 px-4 py-2 rounded-xl font-black text-muted hover:bg-slate-50 border border-border/40 transition text-[10px] uppercase tracking-widest">
                                    Abort
                                </button>
                                <button type="submit"
                                    className="flex-1 px-4 py-2 bg-navy hover:bg-primary text-white rounded-xl font-black transition shadow-lg shadow-navy/20 text-[10px] uppercase tracking-widest">
                                    Provision
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
