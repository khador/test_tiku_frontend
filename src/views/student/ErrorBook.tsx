import React, { useState, useEffect } from 'react';
import { Card, Button, Toast, Empty, Tag, Popup, Radio, Space, TextArea } from 'antd-mobile';
import { StarFilled, StarOutlined, CloseOutlined } from '@ant-design/icons';
import api from '../../utils/request';
import RichTextRenderer from '../../components/RichTextRenderer';

interface ErrorQuestion {
    id: number;
    question: any;
    error_count: number;
    consecutive_correct: number;
}

const ErrorBook: React.FC = () => {
    const [errorList, setErrorList] = useState<ErrorQuestion[]>([]);
    const [loading, setLoading] = useState(true);

    // 重练弹窗控制状态
    const [activeItem, setActiveItem] = useState<ErrorQuestion | null>(null);
    const [retryAnswer, setRetryAnswer] = useState<string>('');
    const [feedback, setFeedback] = useState<any>(null); // 答错时展示正确答案

    useEffect(() => {
        fetchErrorBook();
    }, []);

    const fetchErrorBook = async () => {
        try {
            setLoading(true);
            const res: any = await api.get('/api/practices/error_book/');
            setErrorList(res.results || res);
        } catch (error) {
            console.error("获取错题本失败", error);
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (consecutiveCorrect: number) => {
        const target = 2;
        const stars = [];
        for (let i = 0; i < target; i++) {
            if (i < consecutiveCorrect) {
                stars.push(<StarFilled key={i} style={{ color: '#faad14', fontSize: '18px', margin: '0 2px' }} />);
            } else {
                stars.push(<StarOutlined key={i} style={{ color: '#d9d9d9', fontSize: '18px', margin: '0 2px' }} />);
            }
        }
        return stars;
    };

    const renderAnswer = (ans: any) => {
        if (!ans) return '无';
        if (typeof ans === 'string') return ans;
        if (ans.correct_options) return ans.correct_options.join(', ');
        if (ans.blanks && Array.isArray(ans.blanks)) {
            return ans.blanks.map((b: any) => b.accepted_values ? b.accepted_values.join(' 或 ') : '[图片参考]').join(' | ');
        }
        return JSON.stringify(ans);
    };

    // 打开重练面板
    const openRetry = (item: ErrorQuestion) => {
        setActiveItem(item);
        setRetryAnswer('');
        setFeedback(null);
    };

    // 提交重练答案
    const handleRetrySubmit = async () => {
        if (!retryAnswer) return Toast.show('不能交白卷哦！');

        Toast.show({ icon: 'loading', content: '判分中...' });
        try {
            const res: any = await api.post(`/api/practices/error_book/${activeItem!.id}/retry/`, {
                user_answer: retryAnswer
            });

            if (res.is_correct) {
                Toast.show({ icon: 'success', content: res.msg });
                if (res.eliminated) {
                    // 彻底消除，从列表中移除！
                    setErrorList(prev => prev.filter(item => item.id !== activeItem!.id));
                    setActiveItem(null);
                } else {
                    // 答对1次，点亮一颗星，关闭面板
                    setErrorList(prev => prev.map(item =>
                        item.id === activeItem!.id ? { ...item, consecutive_correct: res.consecutive_correct } : item
                    ));
                    setActiveItem(null);
                }
            } else {
                // 答错了，展示解析，进度清零
                Toast.show({ icon: 'fail', content: res.msg });
                setFeedback(res);
                setErrorList(prev => prev.map(item =>
                    item.id === activeItem!.id ? { ...item, consecutive_correct: 0 } : item
                ));
            }
        } catch (error) {
            console.error(error);
            Toast.show({ icon: 'fail', content: '提交失败，请重试' });
        }
    };

    return (
        <div style={{ padding: '12px', paddingBottom: '60px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <h2 style={{ paddingLeft: '8px', marginBottom: '16px' }}>我的错题本</h2>

            {loading ? <div style={{ textAlign: 'center', padding: '24px' }}>加载中...</div> : null}

            {!loading && errorList.length === 0 && (
                <Empty style={{ marginTop: '100px' }} description="太棒了！你的错题已被全部消灭~" />
            )}

            {errorList.map((item) => (
                <Card key={item.id} style={{ marginBottom: '16px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <Tag color="danger" fill="outline">累计答错 {item.error_count} 次</Tag>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#666', marginRight: '6px' }}>消除进度:</span>
                            {renderStars(item.consecutive_correct)}
                        </div>
                    </div>

                    <div style={{ fontSize: '16px', marginBottom: '16px', maxHeight: '150px', overflow: 'hidden', position: 'relative' }}>
                        <RichTextRenderer htmlContent={item.question?.stem || '加载失败'} />
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px',
                            background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1))'
                        }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button size="small" color="primary" fill="outline" onClick={() => openRetry(item)}>
                            立刻重练
                        </Button>
                    </div>
                </Card>
            ))}

            {/* 沉浸式重练弹窗面板 */}
            <Popup
                visible={!!activeItem}
                onMaskClick={() => setActiveItem(null)}
                bodyStyle={{ height: '85vh', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column' }}
            >
                {activeItem && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '16px' }}>
                            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>错题重练</span>
                            <CloseOutlined style={{ fontSize: '24px' }} onClick={() => setActiveItem(null)} />
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <div style={{ fontSize: '18px', marginBottom: '24px' }}>
                                <RichTextRenderer htmlContent={activeItem.question.stem} />
                            </div>

                            {/* 选择题 UI */}
                            {activeItem.question.type === 'choice' && (
                                <Radio.Group value={retryAnswer} onChange={(val) => setRetryAnswer(val.toString())}>
                                    <Space direction='vertical' style={{ width: '100%' }}>
                                        {activeItem.question.options?.map((opt: any, i: number) => {
                                            const optId = typeof opt === 'string' ? opt : opt.id;
                                            const optContent = typeof opt === 'string' ? opt : opt.content;
                                            return (
                                                <Radio key={optId || i} value={optId} style={{ padding: '8px 0', fontSize: '16px', width: '100%' }}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                                        <span style={{ marginRight: '8px', fontWeight: 'bold' }}>{optId}.</span>
                                                        <div style={{ flex: 1 }}><RichTextRenderer htmlContent={optContent} /></div>
                                                    </div>
                                                </Radio>
                                            )
                                        })}
                                    </Space>
                                </Radio.Group>
                            )}

                            {/* 填空题 UI */}
                            {activeItem.question.type === 'fill' && (
                                <div style={{ marginTop: '16px' }}>
                                    <div style={{ marginBottom: '8px', color: '#666', fontSize: '14px' }}>请输入答案 (多个空用逗号隔开)：</div>
                                    <TextArea
                                        placeholder="在此输入答案..."
                                        value={retryAnswer}
                                        onChange={(val) => setRetryAnswer(val)}
                                        rows={3}
                                        style={{ '--background-color': '#f5f5f5', padding: '12px', borderRadius: '8px', fontSize: '16px' }}
                                    />
                                </div>
                            )}

                            {/* 答错时的反馈面板 */}
                            {feedback && (
                                <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#fff1f0', borderRadius: '8px', border: '1px solid #ffa39e' }}>
                                    <p style={{ color: '#cf1322', fontWeight: 'bold', marginBottom: '8px' }}>
                                        回答错误。正确答案是: {renderAnswer(feedback.answer)}
                                    </p>
                                    <hr style={{ border: '0.5px solid #ffa39e', margin: '12px 0' }} />
                                    <h4 style={{ color: '#cf1322' }}>解析：</h4>
                                    <RichTextRenderer htmlContent={feedback.analysis || '暂无解析'} />
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '16px' }}>
                            <Button block color="primary" onClick={handleRetrySubmit} disabled={!!feedback}>
                                提交答案
                            </Button>
                        </div>
                    </>
                )}
            </Popup>
        </div>
    );
};

export default ErrorBook;