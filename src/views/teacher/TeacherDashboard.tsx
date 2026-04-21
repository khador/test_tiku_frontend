import React, { useState, useEffect } from 'react';
import { Card, Table, Drawer, Tag, Button, Typography, Space, message, Spin } from 'antd';
import { EyeOutlined, FireOutlined } from '@ant-design/icons';
import api from '../../utils/request';
import RichTextRenderer from '../../components/RichTextRenderer';

const { Title, Text } = Typography;

interface ErrorRecord {
    id: number;
    sn: string;
    type: string;
    stem: string;
    answer: any;
    analysis: string;
    error_count: number;
}

const TeacherDashboard: React.FC = () => {
    const [data, setData] = useState<ErrorRecord[]>([]);
    const [className, setClassName] = useState('');
    const [loading, setLoading] = useState(true);

    // 抽屉控制状态
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [activeQuestion, setActiveQuestion] = useState<ErrorRecord | null>(null);

    useEffect(() => {
        fetchTopErrors();
    }, []);

    const fetchTopErrors = async () => {
        try {
            setLoading(true);
            const res: any = await api.get('/api/practices/teacher/dashboard/');
            setClassName(res.class_name);
            setData(res.top_errors);
        } catch (error) {
            console.error(error);
            message.error('获取全班错题数据失败');
        } finally {
            setLoading(false);
        }
    };

    // 格式化答案显示
    const renderAnswer = (ans: any) => {
        if (!ans) return '无';
        if (typeof ans === 'string') return ans;
        if (ans.correct_options) return ans.correct_options.join(', ');
        if (ans.blanks && Array.isArray(ans.blanks)) {
            return ans.blanks.map((b: any) => b.accepted_values ? b.accepted_values.join(' 或 ') : '[图片/图表]').join(' | ');
        }
        return JSON.stringify(ans);
    };

    // 定义 Ant Design 表格的列
    const columns = [
        {
            title: '排名',
            key: 'rank',
            width: 80,
            render: (_: any, __: any, index: number) => {
                const rank = index + 1;
                return rank <= 3 ? (
                    <Tag color="volcano" icon={<FireOutlined />}>Top {rank}</Tag>
                ) : (
                    <Text type="secondary">{rank}</Text>
                );
            }
        },
        {
            title: '题号',
            dataIndex: 'sn',
            key: 'sn',
            width: 100,
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: '题型',
            dataIndex: 'type',
            key: 'type',
            width: 100,
            render: (type: string) => {
                const colors: Record<string, string> = { choice: 'blue', fill: 'cyan', judge: 'purple', draw: 'orange' };
                const labels: Record<string, string> = { choice: '选择题', fill: '填空题', judge: '判断题', draw: '画图题' };
                return <Tag color={colors[type] || 'default'}>{labels[type] || type}</Tag>;
            }
        },
        {
            title: '全班错误总人次',
            dataIndex: 'error_count',
            key: 'error_count',
            width: 150,
            sorter: (a: ErrorRecord, b: ErrorRecord) => b.error_count - a.error_count,
            render: (count: number) => <Text type="danger" strong style={{ fontSize: '16px' }}>{count} 次</Text>
        },
        {
            title: '操作',
            key: 'action',
            width: 120,
            render: (_: any, record: ErrorRecord) => (
                <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => {
                        setActiveQuestion(record);
                        setDrawerVisible(true);
                    }}
                >
                    查看原题
                </Button>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ marginBottom: '24px' }}>
                    <Title level={3}>📊 教学工作台</Title>
                    <Text type="secondary">当前班级：{className || '加载中...'} | 这里的题目是全班同学最容易踩坑的“重灾区”</Text>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>
                ) : (
                    <Table
                        columns={columns}
                        dataSource={data}
                        rowKey="id"
                        pagination={false}
                        bordered
                    />
                )}
            </Card>

            {/* 侧边抽屉：展示题目详情 */}
            <Drawer
                title={
                    <Space>
                        <span>题目详情解析</span>
                        <Tag color="red">全班累计答错 {activeQuestion?.error_count} 次</Tag>
                    </Space>
                }
                width={600}
                placement="right"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
            >
                {activeQuestion && (
                    <div>
                        <div style={{ marginBottom: '24px', fontSize: '16px' }}>
                            <Title level={5}>【原题呈现】</Title>
                            <div style={{ padding: '16px', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                                <RichTextRenderer htmlContent={activeQuestion.stem} />
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <Title level={5}>【标准答案】</Title>
                            <div style={{ padding: '12px 16px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '8px', color: '#389e0d', fontWeight: 'bold' }}>
                                {renderAnswer(activeQuestion.answer)}
                            </div>
                        </div>

                        <div>
                            <Title level={5}>【深度解析】</Title>
                            <div style={{ padding: '16px', backgroundColor: '#e6f4ff', border: '1px solid #91caff', borderRadius: '8px' }}>
                                <RichTextRenderer htmlContent={activeQuestion.analysis || '暂无解析'} />
                            </div>
                        </div>
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default TeacherDashboard;