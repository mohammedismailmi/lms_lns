import React, { useState, useEffect, useRef } from 'react';
import api from '../../lib/api';
import { Search, ChevronDown, Check, RefreshCw, Building2 } from 'lucide-react';

interface Tenant {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
}

interface TenantSelectorProps {
    value: string | null;
    onChange: (tenantId: string) => void;
    error?: string;
}

export default function TenantSelector({ value, onChange, error }: TenantSelectorProps) {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const fetchTenants = async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
            const res = await api.get('/api/tenants');
            if (res.data.success) {
                setTenants(res.data.tenants);
            }
        } catch (err) {
            setFetchError('Could not load institutions. Please refresh.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const selectedTenant = tenants.find(t => t.id === value);

    const filtered = tenants.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.slug.toLowerCase().includes(search.toLowerCase())
    );

    const renderLogo = (tenant: Tenant, size = 32) => {
        if (tenant.logoUrl) {
            return (
                <img
                    src={tenant.logoUrl}
                    alt={tenant.name}
                    className="rounded-full object-cover bg-white border border-slate-200"
                    style={{ width: size, height: size }}
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                />
            );
        }
        return null;
    };

    const renderInitial = (tenant: Tenant, size = 32) => (
        <div
            className={`rounded-full flex items-center justify-center font-bold text-white shrink-0 ${tenant.logoUrl ? 'hidden' : ''}`}
            style={{
                width: size, height: size,
                backgroundColor: '#0F2040', fontSize: size * 0.4
            }}
        >
            {tenant.name.charAt(0).toUpperCase()}
        </div>
    );

    if (isLoading) {
        return (
            <div className="w-full">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Your Institution
                </label>
                <div className="w-full h-12 bg-slate-100 rounded-lg animate-pulse border border-slate-200" />
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="w-full">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Your Institution
                </label>
                <div className="w-full px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center justify-between">
                    <span>{fetchError}</span>
                    <button onClick={fetchTenants} className="flex items-center gap-1 text-red-700 font-bold hover:underline text-xs">
                        <RefreshCw className="w-3 h-3" /> Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full relative" ref={dropdownRef}>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Your Institution
            </label>

            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-4 py-2.5 bg-white border rounded-lg flex items-center justify-between gap-3 transition hover:border-slate-400 text-left ${
                    error ? 'border-red-400 ring-1 ring-red-200' : 'border-slate-200'
                }`}
            >
                {selectedTenant ? (
                    <div className="flex items-center gap-3 min-w-0">
                        {renderLogo(selectedTenant, 28)}
                        {renderInitial(selectedTenant, 28)}
                        <span className="font-semibold text-slate-800 truncate">{selectedTenant.name}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-slate-400">
                        <Building2 className="w-4 h-4" />
                        <span className="font-medium">Select your institution...</span>
                    </div>
                )}
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {error && <p className="text-red-500 text-xs mt-1 font-bold">{error}</p>}

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
                    {/* Search */}
                    <div className="sticky top-0 bg-white border-b border-slate-100 px-3 py-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search institutions..."
                                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400"
                            />
                        </div>
                    </div>

                    {/* Options */}
                    <div className="overflow-y-auto max-h-48">
                        {filtered.length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-slate-400">
                                No institutions found
                            </div>
                        ) : (
                            filtered.map(tenant => {
                                const isSelected = tenant.id === value;
                                return (
                                    <button
                                        key={tenant.id}
                                        type="button"
                                        onClick={() => {
                                            onChange(tenant.id);
                                            setIsOpen(false);
                                            setSearch('');
                                        }}
                                        className={`w-full px-3 py-2.5 flex items-center gap-3 text-left transition ${
                                            isSelected
                                                ? 'bg-indigo-50 border-l-2 border-indigo-500'
                                                : 'hover:bg-slate-50 border-l-2 border-transparent'
                                        }`}
                                    >
                                        {renderLogo(tenant, 32)}
                                        {renderInitial(tenant, 32)}
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-sm font-semibold truncate ${isSelected ? 'text-indigo-700' : 'text-slate-800'}`}>
                                                {tenant.name}
                                            </p>
                                            <p className="text-xs text-slate-400 font-medium">{tenant.slug}</p>
                                        </div>
                                        {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
