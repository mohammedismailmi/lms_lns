import axios from 'axios';

export const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8787';

/**
 * Axios instance pre-configured for the backend API.
 * - Adds credentials: true for secure HttpOnly cookie handling cross-origin.
 */
export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Interceptor to auto-attach tenant slug from domain (if applicable)
api.interceptors.request.use((config) => {
    const hostname = window.location.hostname;
    let tenantSlug = 'reva'; // Default for local dev

    if (hostname.includes('.') && !hostname.includes('localhost') && !hostname.match(/\d+\.\d+\.\d+\.\d+/)) {
        tenantSlug = hostname.split('.')[0];
    }

    config.headers['x-tenant-slug'] = tenantSlug;
    return config;
});

export default api;
