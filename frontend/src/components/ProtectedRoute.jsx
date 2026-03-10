import React from "react";
import { Navigate, Outlet } from "react-router-dom";

<<<<<<< HEAD
export default function ProtectedRoute() {
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    };

    const token = getCookie("auth_token");

    if (!token) {
=======
function getCookie(name) {
    return document.cookie
        .split("; ")
        .some((row) => row.startsWith(`${name}=`));
}

export default function ProtectedRoute() {
    const isAuthenticated = getCookie("auth_token");

    if (!isAuthenticated) {
>>>>>>> 0445047e6fe2c2eda9dfbcf0e37f49c8eea14ade
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
