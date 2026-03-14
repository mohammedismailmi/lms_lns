import { create } from 'zustand';
import { User, users as mockUsers, Role } from '../lib/mockData';
import api from '../lib/api';
import { useCourseStore } from './courseStore';
import { useProgressStore } from './progressStore';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    usersList: User[];
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    hydrate: () => Promise<void>;
    updateUserRole: (userId: string, role: Role) => void;
    addUser: (user: User) => void;
    removeUser: (userId: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true, // Start in loading state for hydration
    usersList: [...mockUsers],

    login: async (email, password) => {
        try {
            const response = await api.post('/api/auth/login', { email, password });
            const data = response.data;

            if (data.success && data.user) {
                // Store minimal info in localStorage for router if needed, 
                // but rely on D1 user object ultimately.
                localStorage.setItem('user_role', data.user.role);
                localStorage.setItem('user_name', data.user.name);

                set({ user: data.user, isAuthenticated: true, isLoading: false });

                // Hydrate associated stores
                useCourseStore.getState().hydrateEnrollments(data.user.id);
                useProgressStore.getState().hydrateProgress();

                return { success: true };
            } else {
                return { success: false, error: data.message || 'Login failed' };
            }
        } catch (err: any) {
            console.error('Login error:', err);
            return {
                success: false,
                error: err.response?.data?.message || 'Invalid credentials'
            };
        }
    },

    logout: async () => {
        try {
            await api.post('/api/auth/logout');
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            localStorage.removeItem('user_role');
            localStorage.removeItem('user_name');
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    hydrate: async () => {
        try {
            // Check session against D1 backend
            const response = await api.get('/api/auth/me');

            if (response.data.success && response.data.user) {
                localStorage.setItem('user_role', response.data.user.role);
                localStorage.setItem('user_name', response.data.user.name);
                set({ user: response.data.user, isAuthenticated: true, isLoading: false });

                // Hydrate associated stores
                useCourseStore.getState().hydrateEnrollments(response.data.user.id);
                useProgressStore.getState().hydrateProgress();
            } else {
                localStorage.removeItem('user_role');
                localStorage.removeItem('user_name');
                set({ user: null, isAuthenticated: false, isLoading: false });
            }
        } catch (err) {
            console.error('Hydration error:', err);
            localStorage.removeItem('user_role');
            localStorage.removeItem('user_name');
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    updateUserRole: (userId, role) => set(state => {
        const updatedUsers = state.usersList.map(u => u.id === userId ? { ...u, role } : u);
        return {
            usersList: updatedUsers,
            user: state.user?.id === userId ? { ...state.user, role } : state.user
        };
    }),

    addUser: (user) => set(state => ({ usersList: [...state.usersList, user] })),
    removeUser: (userId) => set(state => ({ usersList: state.usersList.filter(u => u.id !== userId) })),
}));
