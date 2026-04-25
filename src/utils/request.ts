import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { message } from 'antd'; // 或 antd-mobile 的 Toast

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://192.168.31.93:8000',
    timeout: 10000,
});

// 请求拦截器
api.interceptors.request.use((config) => {
    // 💡 关键：直接从 Zustand 的 getState() 获取最新 token，而不是只在文件初始化时取一次
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// 响应拦截器
api.interceptors.response.use(
    (response) => response.data, // 约定俗成：直接返回 data 层，页面里就不用 res.data.xxx 了
    (error) => {
        if (error.response) {
            if (error.response.status === 401) {
                // 💡 关键：Token 失效，强制登出并跳转
                useAuthStore.getState().clearAuth();
                message.error('登录已过期，请重新登录');
                window.location.href = '/login'; // 强暴但有效的路由跳转
            } else if (error.response.status === 403) {
                message.error('您没有权限执行此操作');
            } else {
                message.error(error.response.data?.detail || '服务器请求失败');
            }
        } else {
            message.error('网络连接异常，请检查网络');
        }
        return Promise.reject(error);
    }
);

export default api;