import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import AIChatWidget from '../ai/AIChatWidget';

export default function Layout() {
    const { isAuthenticated } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    // Close sidebar on route change
    React.useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-surface flex flex-col text-ink font-sans">
            <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            
            <div className="flex flex-1 overflow-hidden relative">
                {/* Mobile overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={`
                    fixed md:sticky top-0 h-[calc(100vh-4rem)]
                    w-64 bg-navy z-40 transform transition-transform duration-300 ease-in-out shadow-xl md:shadow-none
                    md:translate-x-0 md:flex-shrink-0 left-0
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}>
                    <Sidebar onClose={() => setSidebarOpen(false)} />
                </aside>

                {/* Main content */}
                <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
            
            <AIChatWidget />
        </div>
    );
}
