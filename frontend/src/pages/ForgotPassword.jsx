import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Reset link sent to:", email);
        setSubmitted(true);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Forgot Password</h2>
                <p className="text-sm text-slate-500 mb-6 font-medium">No worries, we'll send you reset instructions.</p>

                {submitted ? (
                    <div className="text-center">
                        <div className="text-indigo-600 font-medium mb-4 italic">Done! Reset link sent to {email}</div>
                        <button onClick={() => navigate("/login")} className="text-indigo-600 hover:underline text-sm font-semibold">Back to Login</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                            <input
                                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder:text-slate-400"
                                placeholder="you@example.com"
                            />
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-lg hover:bg-indigo-700 transition active:scale-95 shadow-lg shadow-indigo-100">Send Reset Link</button>
                        <div className="text-center pt-2">
                            <button onClick={() => navigate("/login")} className="text-indigo-600 hover:underline text-sm font-semibold">Back to Login</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
