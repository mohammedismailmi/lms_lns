const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8787";

/**
 * Parses the current hostname to extract the tenant slug.
 * Matches backend `tenantMiddleware` logic.
 */
function getTenantSlug(): string {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
        return "dev";
    }

    const parts = hostname.split(".");
    if (parts.length >= 3) {
        return parts[0];
    }
    return "dev";
}

interface ApiOptions extends RequestInit {
    data?: unknown;
}

/**
 * A wrapper around native `fetch` with standard defaults:
 * - Credentials included automatically
 * - Content-Type set to json automatically
 * - X-Tenant header injected automatically
 * - Throws standard Error on non-2xx response
 */
export async function apiFetch<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const headers = new Headers(options.headers || {});

    headers.set("Content-Type", "application/json");
    headers.set("X-Tenant", getTenantSlug());

    const config: RequestInit = {
        ...options,
        headers,
        credentials: "include",
    };

    if (options.data) {
        config.body = JSON.stringify(options.data);
    }

    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, config);

    // Try parsing JSON first, grab error message from backend if available
    let responseData;
    try {
        responseData = await response.json();
    } catch {
        // If not valid JSON, we'll just fall back to text
        responseData = null;
    }

    if (!response.ok) {
        const errorMsg = responseData?.error || responseData?.message || "An unexpected error occurred.";
        throw new Error(errorMsg);
    }

    return responseData as T;
}
