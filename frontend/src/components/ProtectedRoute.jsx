import React from "react";
import { Navigate, Outlet } from "react-router-dom";

function getCookie(name) {
    return document.cookie
        .split("; ")
        .some((row) => row.startsWith(`${name}=`));
}

export default function ProtectedRoute() {
    const isAuthenticated = getCookie("auth_token");

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
