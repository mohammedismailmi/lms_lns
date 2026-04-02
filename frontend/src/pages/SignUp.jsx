import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";

import api from "../lib/api";
import TenantSelector from "../components/auth/TenantSelector";

const signUpSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export default function SignUp() {
    const navigate = useNavigate();
    const [apiError, setApiError] = useState("");
    const [apiSuccess, setApiSuccess] = useState("");
    const [selectedTenantId, setSelectedTenantId] = useState(null);
    const [tenantError, setTenantError] = useState(null);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(signUpSchema),
    });

    const onSubmit = async (data) => {
        setApiError("");
        setApiSuccess("");
        setTenantError(null);

        if (!selectedTenantId) {
            setTenantError("Please select your institution to register");
            return;
        }

        try {
            const response = await api.post('/api/auth/register', {
                name: data.name,
                email: data.email,
                password: data.password,
                tenantId: selectedTenantId,
                role: "learner"
            });

            if (response.data.success) {
                setApiSuccess("Account created! Redirecting to sign in...");
                setTimeout(() => navigate("/login", { state: { tenantId: selectedTenantId } }), 1500);
            }
        } catch (err) {
            setApiError(err.response?.data?.message || "Failed to create account. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8 bg-[radial-gradient(circle_at_top_right,_#1b3a6b0a,_transparent),_radial-gradient(circle_at_bottom_left,_#1b3a6b05,_transparent)]">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-premium p-6 md:p-8 border border-border/40 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-highlight to-primary opacity-20" />
                
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-navy rounded-xl flex items-center justify-center text-white text-2xl font-black font-serif mx-auto mb-5 shadow-xl shadow-navy/20 -rotate-3 transition-transform group-hover:rotate-0">A</div>
                    <h1 className="font-serif text-2xl md:text-3xl font-black text-navy tracking-tight leading-none mb-2.5">
                        Create Account
                    </h1>
                    <p className="text-[10px] text-muted font-bold tracking-wide opacity-60 uppercase">
                        Join your digital campus
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] ml-3">Institution</label>
                        <TenantSelector
                            value={selectedTenantId}
                            onChange={(id) => { setSelectedTenantId(id); setTenantError(null); }}
                            error={tenantError}
                        />
                    </div>

                    {selectedTenantId && (
                        <div className="bg-success/5 border border-success/20 px-3.5 py-2 rounded-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
                            <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                            <p className="text-[9px] text-success font-black uppercase tracking-widest leading-relaxed">
                                Learner Registration Active
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] ml-3">Full Name</label>
                            <input
                                {...register("name")}
                                className={`w-full bg-surface border rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-4 transition-all shadow-inner font-bold ${errors.name ? "border-accent focus:ring-accent/10" : "border-border focus:ring-primary/10"}`}
                                placeholder="Enter full name"
                            />
                            {errors.name && <p className="text-accent text-[9px] mt-1 font-black uppercase tracking-wider ml-3">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] ml-3">Email Address</label>
                            <input
                                {...register("email")}
                                className={`w-full bg-surface border rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-4 transition-all shadow-inner font-bold ${errors.email ? "border-accent focus:ring-accent/10" : "border-border focus:ring-primary/10"}`}
                                placeholder="name@institution.edu"
                            />
                            {errors.email && <p className="text-accent text-[9px] mt-1 font-black uppercase tracking-wider ml-3">{errors.email.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] ml-3">Password</label>
                                <input
                                    type="password"
                                    {...register("password")}
                                    className={`w-full bg-surface border rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-4 transition-all shadow-inner font-bold ${errors.password ? "border-accent focus:ring-accent/10" : "border-border focus:ring-primary/10"}`}
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] ml-3">Confirm</label>
                                <input
                                    type="password"
                                    {...register("confirmPassword")}
                                    className={`w-full bg-surface border rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-4 transition-all shadow-inner font-bold ${errors.confirmPassword ? "border-accent focus:ring-accent/10" : "border-border focus:ring-primary/10"}`}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        {(errors.password || errors.confirmPassword) && (
                            <p className="text-accent text-[9px] font-black uppercase tracking-wider ml-3">
                                {errors.password?.message || errors.confirmPassword?.message}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-navy hover:bg-primary text-white rounded-xl py-4 text-xs font-black transition-all shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 mt-2 tracking-widest uppercase"
                    >
                        Create Account
                    </button>
                    {apiError && <p className="text-accent text-[10px] font-black text-center mt-4 bg-accent/5 py-2.5 rounded-lg border border-accent/10 uppercase tracking-tight">{apiError}</p>}
                    {apiSuccess && <p className="text-success text-[10px] font-black text-center mt-4 bg-success/5 py-2.5 rounded-lg border border-success/10 uppercase tracking-tight">{apiSuccess}</p>}
                </form>

                <div className="mt-8 pt-5 border-t border-border/40 text-center">
                    <button onClick={() => navigate("/login")} className="w-full bg-white border border-slate-100 hover:border-primary/30 text-navy py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:shadow-md">
                        Sign In
                    </button>
                </div>
            </div>
        </div>
    );
}
