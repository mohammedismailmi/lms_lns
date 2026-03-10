import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, SignupFormData } from "../lib/validations/auth";
import { apiFetch } from "../lib/api";

export default function SignUp() {
    const navigate = useNavigate();
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema)
    });

    const onSubmit = async (data: SignupFormData) => {
        setGlobalError(null);
        setSuccessMessage(null);

        try {
            // Strip out confirmPassword for the backend API
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { confirmPassword, ...registerData } = data;

            await apiFetch("/api/auth/register", {
                method: "POST",
                data: registerData,
            });

            // Show success message and redirect after short delay
            setSuccessMessage("Account created! Please log in.");
            setTimeout(() => {
                navigate("/login", { state: { message: "Account created! Please log in." } });
            }, 2000);

        } catch (error: unknown) {
            setGlobalError(error instanceof Error ? error.message : "Registration failed. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
                <h2 className="text-3xl font-bold text-indigo-700 mb-2 text-center">Create Account</h2>
                <p className="text-center text-gray-400 text-sm mb-6">Join your learning platform</p>

                {globalError && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200 text-center">
                        {globalError}
                    </div>
                )}

                {successMessage && (
                    <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200 text-center">
                        {successMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-600" htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            placeholder="Jane Doe"
                            className={`border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.name ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'}`}
                            {...register("name")}
                        />
                        {errors.name && (
                            <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-600" htmlFor="signup-email">Email</label>
                        <input
                            id="signup-email"
                            type="email"
                            placeholder="you@example.com"
                            className={`border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.email ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'}`}
                            {...register("email")}
                        />
                        {errors.email && (
                            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-600" htmlFor="signup-password">Password</label>
                        <input
                            id="signup-password"
                            type="password"
                            placeholder="Min. 8 characters"
                            className={`border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.password ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'}`}
                            {...register("password")}
                        />
                        {errors.password && (
                            <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-600" htmlFor="confirm-password">Confirm Password</label>
                        <input
                            id="confirm-password"
                            type="password"
                            placeholder="Re-enter password"
                            className={`border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.confirmPassword ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'}`}
                            {...register("confirmPassword")}
                        />
                        {errors.confirmPassword && (
                            <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || successMessage !== null}
                        className={`mt-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex justify-center items-center ${(isSubmitting || successMessage) ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isSubmitting ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : 'Create Account'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-5">
                    Already have an account?{" "}
                    <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="text-indigo-600 font-medium hover:underline"
                    >
                        Sign In
                    </button>
                </p>
            </div>
        </div>
    );
}
