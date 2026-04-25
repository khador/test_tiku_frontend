import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

// 允许传入一个 allowedRoles 数组
const AuthGuard: React.FC<{ allowedRoles?: string[] }> = ({ allowedRoles }) => {
    const { token, role } = useAuthStore();
    const location = useLocation();

    // 1. 未登录，踢回登录页，并记录原本想去的地址
    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. 检查角色权限（如果设定了 allowedRoles）
    if (allowedRoles && role && !allowedRoles.includes(role)) {
        // 角色不匹配，踢回他们该去的地方
        if (role === 'student') return <Navigate to="/student/dashboard" replace />;
        if (role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
        return <Navigate to="/login" replace />;
    }

    // 3. 验证通过，渲染子路由
    return <Outlet />;
};

export default AuthGuard;