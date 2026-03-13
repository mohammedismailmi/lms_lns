import { create } from 'zustand';
import { User, users as mockUsers, Role } from '../lib/mockData';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    usersList: User[];
    login: (user: User) => void;
    logout: () => void;
    updateUserRole: (userId: string, role: Role) => void;
    addUser: (user: User) => void;
    removeUser: (userId: string) => void;
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
    return mockUsers.find((u) => u.role === role) || mockUsers[0];
};

export const useAuthStore = create<AuthState>((set) => {
    const initialUser = getInitialUser();

    return {
        user: initialUser,
        isAuthenticated: !!initialUser,
        usersList: [...mockUsers],
        login: (user) => {
            document.cookie = `auth_token=mock_token_${user.id}; path=/; max-age=86400`;
            localStorage.setItem('user_role', user.role);
            set({ user, isAuthenticated: true });
        },
        logout: () => {
            document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            localStorage.removeItem('user_role');
            set({ user: null, isAuthenticated: false });
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
    };
});
