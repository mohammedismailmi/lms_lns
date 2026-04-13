import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useLocation } from "react-router-dom";

import { useAuthStore } from "../store/authStore";
import TenantSelector from "../components/auth/TenantSelector";

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const login = useAuthStore((state) => state.login);
    const [apiError, setApiError] = useState("");
    const [selectedTenantId, setSelectedTenantId] = useState(null);
    const [tenantError, setTenantError] = useState(null);
    const [isSuperAdminMode, setIsSuperAdminMode] = useState(false);

    const preSelectedTenant = location.state?.tenantId;
    useEffect(() => {
        if (preSelectedTenant) setSelectedTenantId(preSelectedTenant);
    }, [preSelectedTenant]);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data) => {
        setApiError("");
        setTenantError(null);

        if (!isSuperAdminMode && !selectedTenantId) {
            setTenantError("Please select your institution");
            return;
        }

        const result = await login(
            data.email,
            data.password,
            isSuperAdminMode ? undefined : selectedTenantId
        );

        if (result.success) {
            setTimeout(() => {
                const user = useAuthStore.getState().user;
                if (user?.role === 'super_admin') navigate("/superadmin");
                else if (user?.role === 'admin') navigate("/courses");
                else if (user?.role === 'instructor') navigate("/teaching");
                else navigate("/home");
            }, 50);
        } else {
            setApiError(result.error || "Login failed. Please check your credentials.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8 bg-[radial-gradient(circle_at_top_right,_#1b3a6b0a,_transparent),_radial-gradient(circle_at_bottom_left,_#1b3a6b05,_transparent)]">
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-premium p-6 md:p-8 border border-border/40 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-highlight to-primary opacity-20" />
                
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-navy rounded-xl flex items-center justify-center text-white text-2xl font-black font-serif mx-auto mb-5 shadow-xl shadow-navy/20 rotate-3 transition-transform group-hover:rotate-0">A</div>
                    <h1 className="font-serif text-2xl md:text-3xl font-black text-navy tracking-tight leading-none mb-2">
                        {isSuperAdminMode ? "Management" : "Welcome Back"}
                    </h1>
                    <p className="text-[10px] text-muted font-bold tracking-wide opacity-60 uppercase">
                        {isSuperAdminMode ? "Platform Control" : "Sign in to your learning space"}
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {!isSuperAdminMode && (
                        <div className="space-y-1.5">
                             <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] ml-3">Institution</label>
                            <TenantSelector
                                value={selectedTenantId}
                                onChange={(id) => { setSelectedTenantId(id); setTenantError(null); }}
                                error={tenantError}
                            />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] ml-3">Email Address</label>
                        <input
                            {...register("email")}
                            type="email"
                            className={`w-full bg-surface border rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-4 transition-all shadow-inner font-bold ${errors.email ? "border-accent focus:ring-accent/10" : "border-border focus:ring-primary/10"}`}
                            placeholder="name@institution.edu"
                        />
                        {errors.email && <p className="text-accent text-[9px] mt-1 font-black uppercase tracking-wider ml-3">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center mb-0.5 px-3">
                            <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em]">Password</label>
                            <button
                                type="button"
                                onClick={() => navigate("/forgot-password")}
                                className="text-[9px] text-primary hover:text-navy font-black uppercase tracking-widest transition-colors"
                            >
                                Recover
                            </button>
                        </div>
                        <input
                            type="password"
                            {...register("password")}
                            className={`w-full bg-surface border rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-4 transition-all shadow-inner font-bold ${errors.password ? "border-accent focus:ring-accent/10" : "border-border focus:ring-primary/10"}`}
                            placeholder="••••••••"
                        />
                        {errors.password && <p className="text-accent text-[9px] mt-1 font-black uppercase tracking-wider ml-3">{errors.password.message}</p>}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-navy hover:bg-primary text-white rounded-xl py-4 text-xs font-black transition-all shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 mt-3 tracking-widest uppercase"
                    >
                        Sign In
                    </button>
                    {apiError && <p className="text-accent text-[10px] font-black text-center mt-4 bg-accent/5 py-2.5 rounded-lg border border-accent/10 uppercase tracking-tight">{apiError}</p>}
                </form>

                <div className="mt-8 pt-5 border-t border-border/40 text-center">
                    <p className="text-muted text-[10px] font-bold mb-3">Don't have an account?</p>
                    <button onClick={() => navigate("/signup")} className="w-full bg-white border border-slate-100 hover:border-primary/30 text-navy py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:shadow-md">
                        Join System
                    </button>
                </div>

                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => { setIsSuperAdminMode(!isSuperAdminMode); setApiError(""); setTenantError(null); }}
                        className="text-[9px] text-muted hover:text-primary transition-colors font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 cursor-pointer"
                    >
                        System Administration
                    </button>
                </div>
            </div>
        </div>
    );
}
