import React, { useState, useEffect } from 'react';
import { Card, Grid, ProgressCircle, List, Tag, Skeleton } from 'antd-mobile';
import { FireFill, CheckShieldFill, StarFill } from 'antd-mobile-icons';
import api from '../../utils/request';

// ✨ 新增：定义历史记录的数据结构，对齐后端新加的字段
interface HistoryRecord {
    session_id: number;
    start_time: string;
    duration: number;
    accuracy: number;
    correct_count: number; // 后端算好的对题数
    total_count: number;   // 后端算好的总题数
}

const Dashboard: React.FC = () => {
    const [data, setData] = useState<any>(null);
    // ✨ 新增：存放历史记录的状态
    const [history, setHistory] = useState<HistoryRecord[]>([]); 

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // ✨ 优化：使用 Promise.all 同时并行请求看板统计和历史记录，提高加载速度
            const [dashboardRes, historyRes] = await Promise.all([
                api.get('/api/practices/dashboard/'),
                api.get('/api/practices/history/')
            ]);
            
            setData(dashboardRes);
            setHistory(historyRes as any);
        } catch (e) {
            console.error('获取看板数据失败:', e);
        }
    };

    if (!data) return <div style={{ padding: '20px' }}><Skeleton.Paragraph lineCount={10} animated /></div>;

    // 辅助函数：将秒数格式化为 分:秒
    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return m > 0 ? `${m}分${s}秒` : `${s}秒`;
    };

    return (
        <div style={{ padding: '16px', backgroundColor: '#f5f5f5', minHeight: '100vh', paddingBottom: '80px' }}>
            <h2 style={{ marginBottom: '20px', paddingLeft: '8px' }}>学习看板</h2>

            {/* 1. 核心指标卡片 */}
            <Grid columns={2} gap={12}>
                <Grid.Item>
                    <Card style={{ textAlign: 'center', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <FireFill fontSize={32} color='#ff4d4f' />
                        <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>
                            {data.overview?.total_questions || 0}
                        </div>
                        <div style={{ color: '#999', fontSize: '14px' }}>累计刷题 (道)</div>
                    </Card>
                </Grid.Item>
                <Grid.Item>
                    <Card style={{ textAlign: 'center', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <CheckShieldFill fontSize={32} color='#52c41a' />
                        <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>
                            {data.overview?.accuracy || 0}%
                        </div>
                        <div style={{ color: '#999', fontSize: '14px' }}>综合正确率</div>
                    </Card>
                </Grid.Item>
            </Grid>

            {/* 2. 错题消除进度 */}
            <Card title={<span style={{ fontWeight: 'bold', fontSize: '16px' }}>错题消除进度</span>} style={{ marginTop: '16px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '10px 0' }}>
                    <ProgressCircle
                        percent={data.overview?.cleared_errors + data.overview?.remaining_errors === 0 ? 0 : Math.round((data.overview.cleared_errors / (data.overview.cleared_errors + data.overview.remaining_errors)) * 100)}
                        style={{ '--size': '100px', '--fill-color': '#faad14' }}
                    >
                        <span style={{ fontSize: '14px', color: '#666' }}>已消除</span>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#faad14' }}>{data.overview?.cleared_errors || 0}</div>
                    </ProgressCircle>
                    <div style={{ fontSize: '15px', color: '#666', lineHeight: '2' }}>
                        <p><StarFill color='#faad14' style={{ marginRight: '6px' }} /> 待消除: <strong style={{ color: '#333' }}>{data.overview?.remaining_errors || 0}</strong> 道</p>
                        <p><StarFill color='#52c41a' style={{ marginRight: '6px' }} /> 已达成: <strong style={{ color: '#333' }}>{data.overview?.cleared_errors || 0}</strong> 道</p>
                    </div>
                </div>
            </Card>

            {/* 3. 知识点强弱项 */}
            {data.topics && data.topics.length > 0 && (
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
            )}

            {/* ✨ 4. 新增：最近刷题记录列表 */}
            <Card title={<span style={{ fontWeight: 'bold', fontSize: '16px' }}>最近刷题记录</span>} style={{ marginTop: '16px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <List>
                    {history.length > 0 ? history.map((record) => (
                        <List.Item
                            key={record.session_id}
                            description={`用时: ${formatDuration(record.duration)} | 正确率: ${record.accuracy}%`}
                            extra={
                                // ✨ 直接使用后端算好的 correct_count 和 total_count 进行渲染
                                <div style={{ 
                                    color: record.accuracy >= 60 ? '#52c41a' : '#ff4d4f', 
                                    fontWeight: 'bold',
                                    fontSize: '15px'
                                }}>
                                    答对 {record.correct_count} / {record.total_count}
                                </div>
                            }
                            style={{ paddingLeft: 0 }}
                        >
                            <div style={{ fontSize: '15px', color: '#333' }}>
                                练习场次: {record.start_time.substring(5, 16)} {/* 截取显示 MM-DD HH:mm */}
                            </div>
                        </List.Item>
                    )) : (
                        <div style={{ textAlign: 'center', color: '#999', padding: '20px 0', fontSize: '14px' }}>
                            暂无刷题记录，快去开启第一次练习吧！
                        </div>
                    )}
                </List>
            </Card>
        </div>
    );
};

export default Dashboard;