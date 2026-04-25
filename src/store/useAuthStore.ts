import { create } from 'zustand';

interface AuthState {
    token: string | null;
    role: string | null;
    name: string | null; // ✨ 新增：存储用户的真实姓名
    setAuth: (token: string, role: string, name: string) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    // 初始化时从本地存储读取，确保刷新页面不丢失状态
    token: localStorage.getItem('token'),
    role: localStorage.getItem('role'),
    name: localStorage.getItem('name'),

    // 登录成功后保存所有状态
    setAuth: (token, role, name) => {
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('name', name);
        set({ token, role, name });
    },

    // 退出登录时清除所有状态
    clearAuth: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('name');
        set({ token: null, role: null, name: null });
    }
}));