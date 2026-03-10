import { create } from 'zustand';
import { User, users } from '../lib/mockData';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    login: (user: User) => void;
    logout: () => void;
}

// Seeded with admin mock user
const adminUser = users.find((u) => u.role === 'admin') || null;

export const useAuthStore = create<AuthState>((set) => ({
    user: adminUser,
    isAuthenticated: !!adminUser,
    login: (user) => set({ user, isAuthenticated: true }),
    logout: () => set({ user: null, isAuthenticated: false }),
}));
