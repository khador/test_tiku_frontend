import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
// 换成这三个绝对存在的图标
import { AppOutline, UnorderedListOutline, StarOutline } from 'antd-mobile-icons';

const StudentLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;

  const tabs = [
    {
      key: '/student/dashboard',
      title: '学习看板',
      icon: <AppOutline />,
    },
    {
      key: '/student/practice',
      title: '自主刷题',
      icon: <UnorderedListOutline />, // 换成这个
    },
    {
      key: '/student/error-book',
      title: '错题本',
      icon: <StarOutline />, // 换成这个
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* 内容区域 */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </div>

      {/* 底部导航 */}
      <div style={{ borderTop: '1px solid #e5e5e5', backgroundColor: '#fff', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <TabBar activeKey={pathname} onChange={value => navigate(value)}>
          {tabs.map(item => (
            <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
          ))}
        </TabBar>
      </div>
    </div>
  );
};

export default StudentLayout;