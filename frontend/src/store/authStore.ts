import { create } from 'zustand';
import { User, users } from '../lib/mockData';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    login: (user: User) => void;
    logout: () => void;
}

function getCookie(name: string) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
}

const getInitialUser = (): User | null => {
    const isAuthenticated = !!getCookie('auth_token');
    if (!isAuthenticated) return null;

    const role = localStorage.getItem('user_role');
    if (!role) return null;

    // Find a mock user with this role
    return users.find((u) => u.role === role) || users[0];
};

export const useAuthStore = create<AuthState>((set) => {
    const initialUser = getInitialUser();

    return {
        user: initialUser,
        isAuthenticated: !!initialUser,
        login: (user) => {
            set({ user, isAuthenticated: true });
        },
        logout: () => {
            document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            localStorage.removeItem('user_role');
            set({ user: null, isAuthenticated: false });
        },
    };
});
