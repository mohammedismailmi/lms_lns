import axios from 'axios';

export const API_URL = (import.meta as any).env.VITE_API_URL || '';

/**
 * Axios instance pre-configured for the backend API.
 * - Adds credentials: true for secure HttpOnly cookie handling cross-origin.
 */
export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const resolveMediaUrl = (url?: string | null): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default api;
