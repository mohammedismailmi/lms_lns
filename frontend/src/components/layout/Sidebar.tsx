import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Home, BookOpen, GraduationCap, Shield, LayoutDashboard } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Sidebar() {
    const { user } = useAuthStore();

    const navItems = [
        { name: 'Home', path: '/home', icon: Home, roles: ['learner'] },
        { name: 'Home', path: '/teaching', icon: Home, roles: ['instructor'] },
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'instructor', 'learner'] },
        { name: 'Platform Catalog', path: '/courses', icon: BookOpen, roles: ['admin'] },
        { name: 'Certificates', path: '/certificates', icon: GraduationCap, roles: ['learner'] },
        { name: 'Admin Hub', path: '/admin', icon: Shield, roles: ['admin'] },
    ];

    return (
        <aside className="w-64 bg-navy text-muted flex flex-col h-full border-r border-slate-700/50 shadow-inner">
            <div className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
                {navItems
                    .filter((item) => item.roles.includes(user?.role || 'learner'))
                    .map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all group',
                                    isActive
                                        ? 'bg-primary text-white shadow-md'
                                        : 'hover:bg-slate-800/50 hover:text-surface'
                                )
                            }
                        >
                            <item.icon
                                className={cn(
                                    'w-5 h-5 transition-colors',
                                    'group-hover:text-highlight'
                                )}
                            />
                            {item.name}
                        </NavLink>
                    ))}
            </div>

            <div className="p-4 border-t border-slate-700/50">
                <div className="bg-slate-800/40 p-4 rounded-xl text-xs space-y-1">
                    <p className="text-surface font-semibold font-serif">Academia LMS</p>
                    <p>Version 2.0.1</p>
                    <p className="opacity-60 text-highlight">© 2026</p>
                </div>
            </div>
        </aside>
    );
}
