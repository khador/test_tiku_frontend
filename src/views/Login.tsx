import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/useAuthStore';
import api from '../utils/request';

const Login: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            // 发送登录请求
            const res: any = await api.post('/api/login/', {
                username: values.username,
                password: values.password,
            });

            // ✨ 直接从后端 CustomTokenObtainPairSerializer 的返回体中解构数据
            const { access, role, real_name } = res;

            if (!access || !role) {
                throw new Error("后端返回数据格式异常，缺少核心字段");
            }

            // 如果后端没有返回 real_name，则使用用户名作为兜底显示
            const displayName = real_name || values.username;

            // 存入全局仓库
            setAuth(access, role, displayName);
            message.success(`欢迎回来，${displayName}！`);

            // 根据角色动态跳转
            if (role === 'admin') {
                navigate('/admin/dashboard');
            } else if (role === 'teacher') {
                navigate('/teacher/dashboard');
            } else if (role === 'student') {
                navigate('/student/dashboard');
            }

        } catch (error: any) {
            console.error("登录失败", error);
            // 具体的错误提示通常已在 request.ts 的响应拦截器中处理
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#f0f2f5'
        }}>
            <Card title="题库系统登录" style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <Form
                    name="login_form"
                    onFinish={onFinish}
                    size="large"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: '请输入用户名！' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="用户名/学号/工号" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: '请输入密码！' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}>
                            登录
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default Login;