import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Search, Bell, UserCircle, LogOut, Settings, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
    onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

    const handleMouseEnter = () => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        setIsDropdownOpen(true);
    };

    const handleMouseLeave = () => {
        closeTimerRef.current = setTimeout(() => {
            setIsDropdownOpen(false);
        }, 300);
    };

    const toggleDropdownMobile = () => {
        // Only toggle via click on mobile, hover handles desktop
        if (window.innerWidth < 768) {
            setIsDropdownOpen(!isDropdownOpen);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        };
    }, []);

    return (
        <nav className="bg-navy text-white h-16 md:h-[4.5rem] flex items-center justify-between px-3 md:px-5 shadow-sm border-b border-slate-700/30 z-50 sticky top-0 backdrop-blur-sm">
            {/* Left: Hamburger (Mobile) + Logo */}
            <div className="flex items-center gap-1.5 md:gap-2.5">
                {/* Mobile Menu Toggle */}
                {onMenuClick && (
                    <button 
                        onClick={onMenuClick}
                        className="md:hidden p-1 -ml-1 rounded-md hover:bg-slate-800 transition-colors flex items-center justify-center min-h-[40px] min-w-[40px]"
                        aria-label="Toggle Navigation Menu"
                    >
                        <Menu className="w-5 h-5 text-slate-200" />
                    </button>
                )}

                {/* Logo */}
                <div 
                    onClick={() => navigate('/')} 
                    className="w-7 h-7 md:w-8 md:h-8 bg-highlight rounded-lg flex items-center justify-center text-navy font-black font-serif cursor-pointer shrink-0 shadow-sm transition-transform active:scale-95"
                >
                    A
                </div>
                <h1 
                    onClick={() => navigate('/')} 
                    className="text-base md:text-lg font-serif font-semibold tracking-wide hidden sm:block cursor-pointer truncate"
                >
                    Academia
                </h1>
            </div>

            {/* Center: SearchBar */}
            <div className="flex-1 max-w-md mx-2 md:mx-5 relative hidden sm:block">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted group-focus-within:text-highlight transition-colors" />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        className="w-full bg-slate-800/40 text-white placeholder:text-muted rounded-xl py-1 pl-9 pr-4 border border-slate-700/50 focus:outline-none focus:bg-slate-800/60 focus:border-highlight/50 focus:ring-4 focus:ring-highlight/10 text-xs transition-all min-h-[34px] shadow-inner"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && search.trim()) {
                                navigate(`/home?q=${encodeURIComponent(search.trim())}`);
                            }
                        }}
                    />
                </div>
            </div>

            {/* Right: Actions & User Dropdown */}
            <div className="flex items-center gap-1.5 md:gap-4 shrink-0">
                {/* Mobile Search Icon */}
                <button className="sm:hidden p-1.5 rounded-full hover:bg-slate-800 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center">
                    <Search className="w-4.5 h-4.5 text-slate-300" />
                </button>

                <button className="relative p-1.5 rounded-full hover:bg-slate-800 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center">
                    <Bell className="w-4.5 h-4.5 text-slate-300" />
                    <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-accent rounded-full border border-navy"></span>
                </button>

                <div
                    className="flex items-center gap-2.5 border-l-0 md:border-l border-slate-700 md:pl-4 relative"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <div className="hidden md:block text-right">
                        <p className="text-xs font-medium truncate max-w-[120px]">{user?.name}</p>
                        <p className="text-[10px] text-highlight capitalize truncate opacity-80">{user?.role}</p>
                    </div>
                    
                    <button 
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity min-h-[40px] min-w-[40px] justify-center" 
                        onClick={toggleDropdownMobile}
                    >
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-xl object-cover border border-slate-700 shadow-md" title="Manage Profile" />
                        ) : (
                            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-black border border-slate-700 shadow-md text-slate-200">
                                {user?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                        )}
                    </button>

                    {/* User Dropdown */}
                    {isDropdownOpen && (
                        <div className="absolute top-10 right-0 md:mt-1 w-52 bg-white rounded-xl shadow-2xl border border-border py-1.5 z-[60] origin-top-right animate-in fade-in zoom-in-95 duration-200 shadow-premium overflow-hidden">
                            {/* Mobile User Info */}
                            <div className="md:hidden px-3 py-3 bg-slate-50 border-b border-border mb-1.5">
                                <p className="text-xs font-black text-navy truncate">{user?.name}</p>
                                <p className="text-[10px] text-muted truncate">{user?.email}</p>
                            </div>
                            
                            {/* Desktop User Info */}
                            <div className="hidden md:block px-3 py-2 bg-slate-50/50 border-b border-border mb-1.5">
                                <p className="text-[9px] font-bold text-muted uppercase tracking-widest mb-0.5">Signed in as</p>
                                <p className="text-xs font-black text-ink truncate">{user?.email}</p>
                            </div>

                            <button
                                onClick={() => { setIsDropdownOpen(false); navigate('/profile'); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-navy hover:bg-slate-50 transition-colors text-left font-bold min-h-[38px]"
                            >
                                <Settings className="w-3.5 h-3.5 text-slate-400" />
                                My Profile
                            </button>
                            <button
                                onClick={() => { setIsDropdownOpen(false); logout(); navigate('/login'); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-accent hover:bg-red-50 transition-colors text-left font-bold min-h-[38px]"
                            >
                                <LogOut className="w-3.5 h-3.5 text-red-500" />
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
