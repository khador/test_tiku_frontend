import React, { useState, useEffect } from 'react';
import { Card, Table, Drawer, Tag, Button, Typography, Space, message, Spin, Row, Col, Statistic } from 'antd';
import { EyeOutlined, FireOutlined, TeamOutlined } from '@ant-design/icons';
import api from '../../utils/request';
import RichTextRenderer from '../../components/RichTextRenderer';

const { Title, Text } = Typography;

// --- 类型定义 ---
interface ErrorRecord {
    id: number;
    sn: string;
    type: string;
    stem: string;
    answer: any;
    analysis: string;
    error_count: number;
}

interface ClassSummary {
    id: number;
    name: string;
    student_count: number;
}

interface StudentPerformance {
    student_id: string; 
    real_name: string;
    class_name: string;
    total_sessions: number;
    avg_accuracy: number;
}

const TeacherDashboard: React.FC = () => {
    // --- 状态管理 ---
    // 1. 学情概览状态
    const [classes, setClasses] = useState<ClassSummary[]>([]);
    const [performance, setPerformance] = useState<StudentPerformance[]>([]);
    const [loadingDashboard, setLoadingDashboard] = useState(true);

    // 2. 错题排行状态
    const [topErrors, setTopErrors] = useState<ErrorRecord[]>([]); // 修复了原代码缺失的 data 状态
    const [className, setClassName] = useState('');
    const [loadingErrors, setLoadingErrors] = useState(true);

    // 3. 抽屉控制状态
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [activeQuestion, setActiveQuestion] = useState<ErrorRecord | null>(null);

    // --- 数据获取 ---
    useEffect(() => {
        // 组件挂载时，同时拉取两部分数据
        fetchDashboardData();
        fetchTopErrors();
    }, []);

    // 获取：班级概览与学生学情
    const fetchDashboardData = async () => {
        try {
            setLoadingDashboard(true);
            const res: any = await api.get('/api/practices/teacher/dashboard/');
            setClasses(res.classes); 
            setPerformance(res.students_performance);
        } catch (error) {
            console.error('Dashboard error:', error);
            message.error('获取学情概览数据失败');
        } finally {
            setLoadingDashboard(false);
        }
    };

    // 获取：全班高频错题
    const fetchTopErrors = async (classId?: number) => {
        try {
            setLoadingErrors(true);
            const url = classId 
                ? `/api/practices/teacher/top-errors/?class_id=${classId}`
                : '/api/practices/teacher/top-errors/';
            const res: any = await api.get(url);
            
            setClassName(res.current_class.name); 
            setTopErrors(res.top_errors); // 存入 topErrors
        } catch (error) {
            console.error('Top errors fetch error:', error);
            message.error('获取全班错题数据失败');
        } finally {
            setLoadingErrors(false);
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

    // --- Table 列定义 ---

    // 1. 学生学情表 Columns
    const performanceColumns = [
        { title: '姓名', dataIndex: 'real_name', key: 'real_name' },
        { title: '学号', dataIndex: 'student_id', key: 'student_id' },
        { title: '所属班级', dataIndex: 'class_name', key: 'class_name' },
        { 
            title: '累计练习', 
            dataIndex: 'total_sessions', 
            key: 'total_sessions',
            render: (text: number) => <Tag color="blue">{text} 次</Tag>
        },
        { 
            title: '平均正确率', 
            dataIndex: 'avg_accuracy', 
            key: 'avg_accuracy',
            render: (text: number) => {
                const color = text >= 80 ? 'success' : (text < 60 ? 'error' : 'warning');
                return <Text type={color} strong>{text}%</Text>;
            }
        },
    ];

    // 2. 错题排行表 Columns (你之前写好的)
    const errorColumns = [
        {
            title: '排名',
            key: 'rank',
            width: 80,
            render: (_: any, __: any, index: number) => {
                const rank = index + 1;
                return rank <= 3 ? (
                    <Tag color="volcano" icon={<FireOutlined />}>Top {rank}</Tag>
                ) : <Text type="secondary">{rank}</Text>;
            }
        },
        { title: '题号', dataIndex: 'sn', key: 'sn', width: 100, render: (text: string) => <Text strong>{text}</Text> },
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
            title: '错误人次',
            dataIndex: 'error_count',
            key: 'error_count',
            width: 150,
            render: (count: number) => <Text type="danger" strong>{count} 次</Text>
        },
        {
            title: '操作',
            key: 'action',
            width: 120,
            render: (_: any, record: ErrorRecord) => (
                <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => { setActiveQuestion(record); setDrawerVisible(true); }}>
                    查看原题
                </Button>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            <div style={{ marginBottom: '24px' }}>
                <Title level={3}>👨‍🏫 教师工作台</Title>
                <Text type="secondary">查看您负责班级的整体学情与高频错题</Text>
            </div>

            {/* 模块 1：班级人数统计卡片 */}
            <Spin spinning={loadingDashboard}>
                <Row gutter={16} style={{ marginBottom: '24px' }}>
                    {classes.map(c => (
                        <Col span={6} key={c.id}>
                            <Card bordered={false} style={{ borderRadius: '8px' }}>
                                <Statistic 
                                    title={`班级: ${c.name}`} 
                                    value={c.student_count} 
                                    suffix="人" 
                                    prefix={<TeamOutlined />} 
                                />
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* 模块 2：学生学情明细表 */}
                <Card title="🎓 学生练习学情" bordered={false} style={{ borderRadius: '8px', marginBottom: '24px' }}>
                    <Table
                        columns={performanceColumns} // 使用学情列
                        dataSource={performance}     // 使用 performance 数据
                        rowKey="student_id"
                        pagination={{ pageSize: 5 }} // 加个简单分页，免得太长
                        size="middle"
                    />
                </Card>
            </Spin>

            {/* 模块 3：高频错题表 */}
            <Card title={`🔥 全班高频错题 (当前显示：${className || '加载中'})`} bordered={false} style={{ borderRadius: '8px' }}>
                {loadingErrors ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}><Spin /></div>
                ) : (
                    <Table
                        columns={errorColumns}       // 使用错题列
                        dataSource={topErrors}       // 使用正确的 topErrors 状态
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
                        <div style={{ marginBottom: '24px' }}>
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