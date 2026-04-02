import React from 'react';
import { useNavigate } from 'react-router-dom';
export default function TenantComingSoonPage() { 
    const nav = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <h2 className="text-2xl sm:text-3xl font-serif text-navy font-bold mb-6">Tenant Management — Coming Soon</h2>
            <button onClick={() => nav('/admin')} className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition">← Back to Admin</button>
        </div>
    ); 
}
