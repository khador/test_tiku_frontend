import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import {
    AppstoreOutline,
    EditSOutline,
    UnorderedListOutline
} from 'antd-mobile-icons';

const StudentLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const tabs = [
        { key: '/student/dashboard', title: '主页', icon: <AppstoreOutline /> },
        { key: '/student/practice', title: '刷题', icon: <EditSOutline /> },
        { key: '/student/error-book', title: '错题本', icon: <UnorderedListOutline /> },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f5f5f5' }}>
            {/* 顶部或内容区 */}
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
                <Outlet />
            </div>

            {/* 底部导航栏 */}
            <div style={{ borderTop: 'solid 1px #eee', backgroundColor: '#fff' }}>
                <TabBar activeKey={location.pathname} onChange={key => navigate(key)}>
                    {tabs.map(item => (
                        <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
                    ))}
                </TabBar>
            </div>
        </div>
    );
};

export default StudentLayout;