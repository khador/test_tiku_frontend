import React, { useState, useEffect } from 'react';
import { Card, Grid, ProgressCircle, List, Tag, Skeleton } from 'antd-mobile';
import { FireFill, CheckShieldFill, StarFill } from 'antd-mobile-icons';
import api from '../../utils/request';

const Dashboard: React.FC = () => {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // 请求后端统计数据
            const res = await api.get('/api/practices/dashboard/');
            setData(res);
        } catch (e) {
            console.error(e);
        }
    };

    if (!data) return <div style={{ padding: '20px' }}><Skeleton.Paragraph lineCount={10} animated /></div>;

    return (
        <div style={{ padding: '16px', backgroundColor: '#f5f5f5', minHeight: '100vh', paddingBottom: '80px' }}>
            <h2 style={{ marginBottom: '20px', paddingLeft: '8px' }}>学习看板</h2>

            {/* 核心指标卡片 */}
            <Grid columns={2} gap={12}>
                <Grid.Item>
                    <Card style={{ textAlign: 'center', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <FireFill fontSize={32} color='#ff4d4f' />
                        <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>
                            {data.overview.total_questions}
                        </div>
                        <div style={{ color: '#999', fontSize: '14px' }}>累计刷题 (道)</div>
                    </Card>
                </Grid.Item>
                <Grid.Item>
                    <Card style={{ textAlign: 'center', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <CheckShieldFill fontSize={32} color='#52c41a' />
                        <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>
                            {data.overview.accuracy}%
                        </div>
                        <div style={{ color: '#999', fontSize: '14px' }}>综合正确率</div>
                    </Card>
                </Grid.Item>
            </Grid>

            {/* 错题消除进度 */}
            <Card title={<span style={{ fontWeight: 'bold', fontSize: '16px' }}>错题消除进度</span>} style={{ marginTop: '16px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '10px 0' }}>
                    <ProgressCircle
                        percent={data.overview.cleared_errors + data.overview.remaining_errors === 0 ? 0 : Math.round((data.overview.cleared_errors / (data.overview.cleared_errors + data.overview.remaining_errors)) * 100)}
                        style={{ '--size': '100px', '--fill-color': '#faad14' }}
                    >
                        <span style={{ fontSize: '14px', color: '#666' }}>已消除</span>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#faad14' }}>{data.overview.cleared_errors}</div>
                    </ProgressCircle>
                    <div style={{ fontSize: '15px', color: '#666', lineHeight: '2' }}>
                        <p><StarFill color='#faad14' style={{ marginRight: '6px' }} /> 待消除: <strong style={{ color: '#333' }}>{data.overview.remaining_errors}</strong> 道</p>
                        <p><StarFill color='#52c41a' style={{ marginRight: '6px' }} /> 已达成: <strong style={{ color: '#333' }}>{data.overview.cleared_errors}</strong> 道</p>
                    </div>
                </div>
            </Card>

            {/* 知识点掌握度 (模拟数据，后期可以连真实表) */}
            <Card title={<span style={{ fontWeight: 'bold', fontSize: '16px' }}>知识点强弱项</span>} style={{ marginTop: '16px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <List>
                    {data.topics.map((topic: any) => (
                        <List.Item
                            key={topic.name}
                            extra={<Tag color={topic.value >= 80 ? 'success' : (topic.value >= 60 ? 'primary' : 'danger')}>{topic.value}%</Tag>}
                            style={{ paddingLeft: 0 }}
                        >
                            <div style={{ fontSize: '15px', marginBottom: '8px' }}>{topic.name}</div>
                            <div style={{ height: '6px', background: '#eee', borderRadius: '3px', width: '100%' }}>
                                <div style={{
                                    width: `${topic.value}%`,
                                    height: '100%',
                                    background: topic.value >= 80 ? '#52c41a' : (topic.value >= 60 ? '#1677ff' : '#ff4d4f'),
                                    borderRadius: '3px',
                                    transition: 'width 0.5s ease-in-out'
                                }} />
                            </div>
                        </List.Item>
                    ))}
                </List>
            </Card>
        </div>
    );
};

export default Dashboard;