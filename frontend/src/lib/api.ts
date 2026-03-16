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

export default api;
