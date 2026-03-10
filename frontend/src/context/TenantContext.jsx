import React, { createContext, useContext, useState, useEffect } from "react";

const TenantContext = createContext();

export const TenantContextProvider = ({ children }) => {
    const [tenantSlug, setTenantSlug] = useState("dev");

    useEffect(() => {
        const hostname = window.location.hostname;
        // Example: uni1.lms.com -> uni1
        const parts = hostname.split(".");
        if (parts.length > 2 && parts[0] !== "www") {
            setTenantSlug(parts[0]);
        } else {
            setTenantSlug("dev");
        }
    }, []);

    return (
        <TenantContext.Provider value={{ tenantSlug }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => useContext(TenantContext);
export default TenantContext;
