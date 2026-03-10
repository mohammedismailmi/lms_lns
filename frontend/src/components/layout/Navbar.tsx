import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Search, Bell, UserCircle, LogOut } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuthStore();
    const [search, setSearch] = useState('');

    return (
        <nav className="bg-navy text-white h-16 flex items-center justify-between px-6 shadow-md z-50">
            {/* Left: Logo */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-highlight rounded flex items-center justify-center text-navy font-bold font-serif">
                    A
                </div>
                <h1 className="text-xl font-serif font-semibold tracking-wide">
                    Academia Platform
                </h1>
            </div>

            {/* Center: SearchBar (Mocked debounced input) */}
            <div className="flex-1 max-w-lg mx-6 relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                        type="text"
                        placeholder="Search courses, faculty, or sections..."
                        className="w-full bg-slate-800/50 text-white placeholder:text-muted rounded-full py-1.5 pl-10 pr-4 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-highlight text-sm transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Right: Actions & User Dropdown */}
            <div className="flex items-center gap-6">
                <button className="relative p-1 hover:text-highlight transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-accent rounded-full border border-navy"></span>
                </button>

                <div className="flex items-center gap-3 border-l border-slate-700 pl-6 group relative">
                    <div className="text-right">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-highlight capitalize">{user?.role}</p>
                    </div>
                    <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <UserCircle className="w-8 h-8 text-slate-300" />
                    </button>

                    {/* User Dropdown (Hover based for now for simplicity, but could be click) */}
                    <div className="absolute top-10 right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-border py-2 hidden group-hover:block transition-all">
                        <div className="px-4 py-2 border-b border-border mb-2">
                            <p className="text-sm font-bold text-ink truncate">{user?.email}</p>
                            <p className="text-xs text-muted">Tenant: {user?.tenantId}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-accent hover:bg-slate-50 transition-colors text-left font-medium"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
