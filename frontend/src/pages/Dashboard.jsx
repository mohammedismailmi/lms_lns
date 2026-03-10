import React from "react";

export default function Dashboard() {
    const role = localStorage.getItem("role") || "learner";

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="mt-4 text-gray-700">
                Welcome to your dashboard! You are logged in as a <span className="font-bold text-indigo-600 capitalize">{role}</span>.
            </p>
        </div>
    );
}
