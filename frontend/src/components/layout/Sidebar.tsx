import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Home, BookOpen, GraduationCap, Shield, LayoutDashboard, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
    onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
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
        <div className="w-full text-muted flex flex-col h-full border-r border-slate-700/50 shadow-inner bg-navy/95 backdrop-blur-md">
            {/* Mobile Close Bar */}
            <div className="md:hidden flex items-center justify-between p-3 border-b border-slate-700/50">
                <span className="font-serif font-bold text-white tracking-wide text-sm">Menu</span>
                <button onClick={onClose} className="p-1.5 -mr-1.5 text-slate-400 hover:text-white transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 py-3 md:py-5 px-3 space-y-1.5 overflow-y-auto">
                {navItems
                    .filter((item) => item.roles.includes(user?.role || 'learner'))
                    .map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            onClick={onClose} // close drawer on click for mobile
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-medium transition-all group min-h-[38px] text-xs',
                                    isActive
                                        ? 'bg-primary text-white shadow-lg'
                                        : 'hover:bg-slate-800/40 hover:text-surface text-slate-300'
                                )
                            }
                        >
                            <item.icon
                                className={cn(
                                    'w-4.5 h-4.5 transition-colors',
                                    'group-hover:text-highlight'
                                )}
                            />
                            {item.name}
                        </NavLink>
                    ))}
            </div>

            <div className="p-3 border-t border-slate-700/50">
                <div className="bg-slate-800/40 p-4 rounded-2xl text-[10px] space-y-0.5">
                    <p className="text-surface font-semibold font-serif text-xs">Academia LMS</p>
                    <p className="opacity-80">v2.0.1</p>
                    <p className="opacity-40 text-highlight font-bold tracking-widest">© 2026</p>
                </div>
            </div>
        </div>
    );
}
