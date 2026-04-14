import axios from 'axios';
import { message } from 'antd';

const api = axios.create({
    // 开发环境下默认请求本地 8000 端口，生产环境可通过环境变量覆盖
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    timeout: 10000,
});

// 请求拦截器：自动携带 Token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 响应拦截器：严格处理需求单中的 401 和 403
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const status = error.response?.status;

        if (status === 401) {
            // 401：清除本地数据，强制跳回登录页
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_role');
            message.error('登录已过期，请重新登录');
            window.location.href = '/login';

        } else if (status === 403) {
            // 403：只提示无权限，不删 token，根据当前角色安全回退
            message.warning('无权限访问该页面');
            const role = localStorage.getItem('user_role');
            if (role === 'admin') window.location.href = '/admin/dashboard';
            else if (role === 'teacher') window.location.href = '/teacher/dashboard';
            else if (role === 'student') window.location.href = '/student/dashboard';

        } else {
            // 其他错误（如 400 业务报错，500 服务器崩了）
            message.error(error.response?.data?.detail || '网络请求错误，请稍后重试');
        }
        return Promise.reject(error);
    }
);

export default api;