import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    };

    const token = getCookie("auth_token");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
