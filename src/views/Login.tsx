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

    // 表单提交成功的回调
    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            // 1. 发送登录请求 (根据你的 Django SimpleJWT 后端配置)
            const res: any = await api.post('/api/login/', {
                username: values.username,
                password: values.password,
            });

            // 2. 提取 Token 和角色 (这里假设后端返回 { access: "...", role: "..." })
            // 注意：具体的字段名需要根据你 Django 序列化器 CustomTokenObtainPairSerializer 的实际返回调整
            const token = res.access || res.token;
            const role = res.role;

            if (!token || !role) {
                throw new Error("后端返回数据格式异常，缺少 token 或 role");
            }

            // 3. 存入全局仓库
            setAuth(token, role);
            message.success('登录成功！');

            // 4. 根据角色动态跳转到对应的控制台
            if (role === 'admin') navigate('/admin/dashboard');
            else if (role === 'teacher') navigate('/teacher/dashboard');
            else if (role === 'student') navigate('/student/dashboard');

        } catch (error: any) {
            // 错误已在 request.ts 中被拦截并提示过，这里通常不需要额外处理
            // 但如果是 400 等错误导致走到这里，可以解除 loading 状态
            console.error("登录失败", error);
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
                    initialValues={{ remember: true }}
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