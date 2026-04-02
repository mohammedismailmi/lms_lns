import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { Camera, Save, Loader2, User as UserIcon } from 'lucide-react';
import { useToast } from '../lib/useToast';

export default function ProfilePage() {
    const { user } = useAuthStore();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useToast();

    useEffect(() => {
        api.get('/api/profile').then(res => {
            if (res.data.success) {
                setProfile(res.data.profile);
            }
        }).finally(() => setLoading(false));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const payload = { ...profile };
        try {
            await api.put('/api/profile', payload);
            toast.success('Profile updated successfully');
            if (user && profile.name !== user.name) {
                useAuthStore.setState({ user: { ...user, name: profile.name } });
            }
        } catch (err) {
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/api/profile/avatar', formData);
            if (res.data.success) {
                setProfile({ ...profile, avatar_url: res.data.avatarUrl });
                toast.success('Avatar updated');
                if (user) {
                    useAuthStore.setState({ user: { ...user, avatarUrl: res.data.avatarUrl } });
                }
            }
        } catch (err: any) {
            const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to upload avatar';
            toast.error(msg);
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    if (!profile) return <div className="p-4 sm:p-8 text-center text-red-500 font-bold">Failed to load profile.</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-5 py-4 sm:py-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-serif font-black text-navy leading-none tracking-tight">Institutional Profile</h1>
                    <p className="text-[8.5px] font-black text-muted uppercase tracking-[0.2em] mt-1.5 opacity-60">Identity Configuration Matrix</p>
                </div>
                <div className="flex gap-2">
                    <div className="px-2.5 py-1 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-1">
                        <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                        <span className="text-[8.5px] font-black text-primary uppercase tracking-wider leading-none">Active Matrix</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-premium border border-border/40 overflow-hidden relative group">
                <div className="h-24 sm:h-28 bg-gradient-to-br from-navy via-primary to-highlight relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,_white_1px,_transparent_0)] bg-[size:20px_20px]" />
                    <div className="absolute -bottom-12 sm:-bottom-14 left-4 sm:left-8 flex items-end gap-4 sm:gap-5 w-[calc(100%-2rem)] sm:w-auto">
                        <div className="relative group shrink-0">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-[3px] border-white bg-surface overflow-hidden shadow-premium flex items-center justify-center text-slate-300 transition-transform group-hover:scale-[1.02]">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-10 h-10 sm:w-12 sm:h-12 opacity-20" />
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="absolute bottom-1 right-1 p-1.5 bg-navy text-white rounded-xl shadow-lg hover:bg-primary transition-all disabled:opacity-50 border-2 border-white"
                            >
                                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                        </div>
                        <div className="pb-4 min-w-0 flex-1">
                            <h2 className="text-lg sm:text-xl font-black text-white drop-shadow-md truncate tracking-tight">{profile.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-md text-[8.5px] font-black text-white uppercase tracking-wider border border-white/20">{profile.role}</span>
                                <span className="text-[8.5px] font-bold text-white/60 uppercase tracking-wider truncate max-w-[120px]">{profile.email}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSave} className="p-5 sm:p-7 pt-16 sm:pt-20 space-y-5 bg-[radial-gradient(circle_at_top_right,_#1b3a6b05,_transparent)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-[8.5px] font-black text-muted mb-1 uppercase tracking-[0.15em] ml-3">Academic Name</label>
                            <input name="name" value={profile.name || ''} onChange={handleChange} className="w-full bg-surface border border-border/40 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner font-bold text-navy text-xs" required />
                        </div>
                        
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-[8.5px] font-black text-muted mb-1 uppercase tracking-[0.15em] ml-3">Professional Biography</label>
                            <textarea name="bio" value={profile.bio || ''} onChange={handleChange} className="w-full bg-surface border border-border/40 rounded-2xl px-4 py-3 min-h-[80px] focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner font-medium text-navy resize-none text-[10px] leading-relaxed" placeholder="Elaborate..." />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-[8.5px] font-black text-muted mb-1 uppercase tracking-[0.15em] ml-3">Contact Telephony</label>
                            <input name="phone" value={profile.phone || ''} onChange={handleChange} className="w-full bg-surface border border-border/40 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner font-bold text-navy text-xs" placeholder="+1..." />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-[8.5px] font-black text-muted mb-1 uppercase tracking-[0.15em] ml-3">Geographic Workspace</label>
                            <input name="location" value={profile.location || ''} onChange={handleChange} className="w-full bg-surface border border-border/40 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner font-bold text-navy text-xs" placeholder="City..." />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-[8.5px] font-black text-muted mb-1 uppercase tracking-[0.15em] ml-3">Online Portfolio</label>
                            <input name="website" value={profile.website || ''} onChange={handleChange} className="w-full bg-surface border border-border/40 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner font-bold text-navy text-xs" placeholder="https://..." />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-[8.5px] font-black text-muted mb-1 uppercase tracking-[0.15em] ml-3">LinkedIn Profile</label>
                            <input name="linkedin" value={profile.linkedin || ''} onChange={handleChange} className="w-full bg-surface border border-border/40 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner font-bold text-navy text-xs" placeholder="linkedin.com/..." />
                        </div>
                        
                        <div className="space-y-1">
                            <label className="block text-[8.5px] font-black text-muted mb-1 uppercase tracking-[0.15em] ml-3">GitHub Repository</label>
                            <input name="github" value={profile.github || ''} onChange={handleChange} className="w-full bg-surface border border-border/40 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner font-bold text-navy text-xs" placeholder="github.com/..." />
                        </div>
                        
                        <div className="space-y-1">
                            <label className="block text-[8.5px] font-black text-muted mb-1 uppercase tracking-[0.15em] ml-3">Identity (Read-only)</label>
                            <input value={profile.email || ''} readOnly className="w-full border border-slate-100 bg-slate-50/50 text-muted rounded-xl px-4 py-2.5 font-bold outline-none cursor-not-allowed opacity-60 text-xs" />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end pt-6 border-t border-border/40 gap-2.5">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-navy hover:bg-primary text-white font-black px-8 py-3 w-full sm:w-auto rounded-xl shadow-lg shadow-navy/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:-translate-y-0.5 active:scale-95 text-[9px] uppercase tracking-widest"
                        >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            Commit Profile
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
