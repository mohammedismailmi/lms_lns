import React, { createContext, useContext, useState, useEffect } from "react";

<<<<<<< HEAD
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
=======
const TenantContext = createContext({ tenantSlug: "dev" });

export function TenantContextProvider({ children }) {
  const [tenantSlug, setTenantSlug] = useState("dev");

  useEffect(() => {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      setTenantSlug("dev");
    } else {
      // e.g. "uni1.lms.com" → "uni1"
      const parts = hostname.split(".");
      if (parts.length >= 3) {
        setTenantSlug(parts[0]);
      } else {
        setTenantSlug("dev");
      }
    }
  }, []);

  return (
    <TenantContext.Provider value={{ tenantSlug }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}

>>>>>>> 0445047e6fe2c2eda9dfbcf0e37f49c8eea14ade
export default TenantContext;
