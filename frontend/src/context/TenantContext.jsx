import React, { createContext, useContext, useState, useEffect } from "react";

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
export default TenantContext;
