import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

interface GuardProps {
    allowedRole: 'admin' | 'teacher' | 'student';
}

export const AuthGuard = ({ allowedRole }: GuardProps) => {
    // 从全局仓库获取当前用户的状态
    const { token, role } = useAuthStore();

    // 1. 如果没有 Token，说明没登录，直接踢回登录页
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // 2. 如果角色不匹配，说明越权访问，送回他该去的地方
    if (role !== allowedRole) {
        if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
        if (role === 'student') return <Navigate to="/student/dashboard" replace />;
        return <Navigate to="/login" replace />;
    }

    // 3. 身份合法，放行渲染子组件 (Outlet 代表子路由的占位符)
    return <Outlet />;
};