import { create } from 'zustand';

interface AuthState {
    token: string | null;
    role: string | null;
    setAuth: (token: string, role: string) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    // 初始化时从本地存储读取
    token: localStorage.getItem('access_token'),
    role: localStorage.getItem('user_role'),

    // 登录成功后保存状态
    setAuth: (token, role) => {
        localStorage.setItem('access_token', token);
        localStorage.setItem('user_role', role);
        set({ token, role });
    },

    // 退出或 token 失效时清除状态
    clearAuth: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_role');
        set({ token: null, role: null });
    }
}));