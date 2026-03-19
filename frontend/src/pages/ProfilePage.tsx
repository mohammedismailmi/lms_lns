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
        try {
            await api.put('/api/profile', profile);
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
                    useAuthStore.setState({ user: { ...user, avatarUrl: res.data.avatarUrl } as any });
                }
            }
        } catch (err) {
            toast.error('Failed to upload avatar');
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    if (!profile) return <div className="p-8 text-center text-red-500 font-bold">Failed to load profile.</div>;

    return (
        <div className="max-w-4xl mx-auto p-8 py-12">
            <h1 className="text-4xl font-serif font-bold text-navy mb-8">My Profile</h1>

            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="h-32 bg-primary/10 relative">
                    <div className="absolute -bottom-16 left-8 flex items-end gap-6">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full border-4 border-white bg-slate-100 overflow-hidden flex items-center justify-center text-slate-300">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-16 h-16" />
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="absolute bottom-2 right-2 p-2 bg-navy text-white rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                            >
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                        </div>
                        <div className="pb-2">
                            <h2 className="text-2xl font-bold text-navy">{profile.name}</h2>
                            <p className="text-sm font-bold text-muted uppercase tracking-wider">{profile.role}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSave} className="p-8 pt-24 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-bold text-navy mb-2">Full Name</label>
                            <input name="name" value={profile.name || ''} onChange={handleChange} className="w-full border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20" required />
                        </div>
                        
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-bold text-navy mb-2">Bio</label>
                            <textarea name="bio" value={profile.bio || ''} onChange={handleChange} className="w-full border border-border rounded-lg px-4 py-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Tell us a little bit about yourself..." />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-navy mb-2">Phone</label>
                            <input name="phone" value={profile.phone || ''} onChange={handleChange} className="w-full border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="+1 (555) 000-0000" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-navy mb-2">Location</label>
                            <input name="location" value={profile.location || ''} onChange={handleChange} className="w-full border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="City, Country" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-navy mb-2">Website</label>
                            <input name="website" value={profile.website || ''} onChange={handleChange} className="w-full border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="https://..." />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-navy mb-2">LinkedIn</label>
                            <input name="linkedin" value={profile.linkedin || ''} onChange={handleChange} className="w-full border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="linkedin.com/in/..." />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-navy mb-2">GitHub</label>
                            <input name="github" value={profile.github || ''} onChange={handleChange} className="w-full border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="github.com/..." />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-navy mb-2">Email Address (Read-only)</label>
                            <input value={profile.email || ''} readOnly className="w-full border border-slate-200 bg-slate-50 text-muted rounded-lg px-4 py-3 outline-none" />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-primary hover:bg-navy text-white font-bold px-8 py-3 rounded-xl shadow transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
