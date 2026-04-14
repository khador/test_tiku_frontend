import React, { useState } from 'react';
import { Layout, Menu, Button, theme } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { UserOutlined, TeamOutlined, BookOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/useAuthStore';

const { Header, Sider, Content } = Layout;

const AdminLayout: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // 引入我们之前写的 Zustand 全局状态
    const clearAuth = useAuthStore((state) => state.clearAuth);
    const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

    // 退出登录逻辑
    const handleLogout = () => {
        clearAuth(); // 清除本地 Token 和角色
        navigate('/login'); // 跳回登录页
    };

    // 左侧菜单配置
    const menuItems = [
        { key: '/admin/teachers', icon: <UserOutlined />, label: '教师管理' },
        { key: '/admin/students', icon: <TeamOutlined />, label: '学生管理' },
        { key: '/admin/classes', icon: <BookOutlined />, label: '班级配置' },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* 左侧边栏 */}
            <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
                <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 6 }} />
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={({ key }) => navigate(key)} // 点击菜单跳转对应路由
                />
            </Sider>

            {/* 右侧主体 */}
            <Layout>
                {/* 顶部 Header */}
                <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} danger>
                        退出登录
                    </Button>
                </Header>

                {/* 核心内容区 */}
                <Content style={{ margin: '24px 16px', padding: 24, background: colorBgContainer, borderRadius: borderRadiusLG }}>
                    {/* <Outlet /> 是 React Router 的魔法，点击左边菜单时，对应的页面会在这里渲染 */}
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminLayout;