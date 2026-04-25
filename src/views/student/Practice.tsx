import React, { useState, useEffect, useRef } from 'react';
import { Swiper, Button, Radio, Space, Card, Toast, Dialog, TextArea } from 'antd-mobile'; 
import type { SwiperRef } from 'antd-mobile/es/components/swiper';
import api from '../../utils/request';
import RichTextRenderer from '../../components/RichTextRenderer';

// 数据结构定义
interface Question {
    id: number;
    sn: string;
    type: string;
    stem: string;
    options?: any[]; 
    answer?: any;    
    analysis?: string;
}

const Practice: React.FC = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    
    // 计时相关状态
    const [timeElapsed, setTimeElapsed] = useState(0); // 整卷总用时
    const [questionTimes, setQuestionTimes] = useState<Record<number, number>>({}); // 每题用时 { questionId: seconds }
    
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [sessionId, setSessionId] = useState<number | null>(null);
    const swiperRef = useRef<SwiperRef>(null);

    // 初始化获取题目
    useEffect(() => {
        fetchQuestions();
    }, []);

    // 核心计时器：每秒更新总用时和当前题目的用时
    useEffect(() => {
        if (isSubmitted || questions.length === 0) return;

        const timer = setInterval(() => {
            // 1. 更新整卷总时间
            setTimeElapsed((prev) => prev + 1);

            // 2. 更新当前题目的独立时间
            const currentQuestionId = questions[currentIndex]?.id;
            if (currentQuestionId) {
                setQuestionTimes(prev => ({
                    ...prev,
                    [currentQuestionId]: (prev[currentQuestionId] || 0) + 1
                }));
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [isSubmitted, questions, currentIndex]);

    const fetchQuestions = async () => {
        try {
            const res: any = await api.post('/api/practices/generate/');
            setSessionId(res.session_id);
            setQuestions(res.questions);
        } catch (error) {
            console.error("获取题目失败", error);
            Toast.show({ icon: 'fail', content: '获取题目失败' });
        }
    };

    const handleOptionChange = (questionId: number, val: string) => {
        if (isSubmitted) return;
        setAnswers(prev => ({ ...prev, [questionId]: val }));
    };

    const goNext = () => swiperRef.current?.swipeNext();
    const goPrev = () => swiperRef.current?.swipePrev();

    // 严格按照后端结构提交数据
    const handleSubmit = async () => {
        if (Object.keys(answers).length < questions.length) {
            const confirm = await Dialog.confirm({ 
                content: '您还有题目未作答，确定要交卷吗？',
                confirmText: '确定交卷',
                cancelText: '再检查下'
            });
            if (!confirm) return;
        }

        try {
            Toast.show({ icon: 'loading', content: '正在智能批改...', duration: 0 });
            
            // 构造后端要求的 answers 数组结构
            const formattedAnswers = questions.map(q => ({
                question_id: q.id,
                user_answer: answers[q.id] || "", // 未填则传空字符串
                time_spent: questionTimes[q.id] || 0 // 传入该题实际耗时
            }));

            const res: any = await api.post('/api/practices/submit/', {
                session_id: sessionId,
                duration: timeElapsed, // 整卷总耗时
                answers: formattedAnswers
            });

            // 更新题目列表以获取包含解析和正确答案的信息
            const fullQuestions = res.details.map((item: any) => ({
                ...item.question,
                is_user_correct: item.is_correct // 保存后端判定的对错状态
            }));
            
            setQuestions(fullQuestions);
            setIsSubmitted(true);
            Toast.clear();
            Toast.show({ icon: 'success', content: '交卷成功！' });
            
            // 自动回到第一题方便查看解析
            swiperRef.current?.swipeTo(0);
        } catch (error) {
            Toast.clear();
            console.error('交卷失败', error);
            Toast.show({ icon: 'fail', content: '交卷失败，请重试' });
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const renderAnswer = (ans: any) => {
        if (!ans) return '无';
        if (typeof ans === 'string') return ans;
        if (ans.correct_options) return ans.correct_options.join(', ');
        if (ans.blanks && Array.isArray(ans.blanks)) {
            return ans.blanks.map((b: any) => {
                if (b.accepted_values && Array.isArray(b.accepted_values)) {
                    return b.accepted_values.join(' 或 ');
                }
                if (b.standard_image) return '[图片参考答案]';
                return '[特殊格式]';
            }).join('  |  ');
        }
        return JSON.stringify(ans);
    };

    if (questions.length === 0) return <div style={{ textAlign: 'center', marginTop: '50px' }}>加载题目中...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '12px', boxSizing: 'border-box' }}>
            {/* 顶部状态栏 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                <Space direction="vertical" gap="4px">
                    <span style={{ fontSize: '16px', fontWeight: 'bold' }}>进度: {currentIndex + 1} / {questions.length}</span>
                    <span style={{ fontSize: '12px', color: '#999' }}>本题已用时: {formatTime(questionTimes[questions[currentIndex]?.id] || 0)}</span>
                </Space>
                <span style={{ color: isSubmitted ? '#52c41a' : '#ff4d4f', fontWeight: 'bold', fontSize: '16px' }}>
                    {isSubmitted ? '已交卷' : `总用时: ${formatTime(timeElapsed)}`}
                </span>
            </div>

            {/* 题目区域 */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <Swiper 
                    allowTouchMove={!isSubmitted} 
                    ref={swiperRef} 
                    onIndexChange={setCurrentIndex} 
                    indicator={() => null}
                    style={{ height: '100%' }}
                >
                    {questions.map((q) => {
                        const userAnswer = answers[q.id];
                        // 从后端返回的判定结果中获取对错
                        const isCorrect = (q as any).is_user_correct;
                        const cardStyle = isSubmitted
                            ? { border: isCorrect ? '2px solid #52c41a' : '2px solid #ff4d4f' }
                            : {};

                        return (
                            <Swiper.Item key={q.id}>
                                <Card style={{ height: 'calc(100vh - 180px)', overflowY: 'auto', ...cardStyle }}>
                                    <div style={{ fontSize: '18px', marginBottom: '24px' }}>
                                        <RichTextRenderer htmlContent={q.stem} />
                                    </div>

                                    {/* 选择题 */}
                                    {q.type === 'choice' && (
                                        <Radio.Group value={userAnswer} onChange={(val) => handleOptionChange(q.id, val.toString())} disabled={isSubmitted}>
                                            <Space direction='vertical' style={{ width: '100%' }}>
                                                {q.options?.map((opt: any, i) => {
                                                    const optId = typeof opt === 'string' ? opt : opt.id;
                                                    const optContent = typeof opt === 'string' ? opt : opt.content;
                                                    return (
                                                        <Radio key={optId || i} value={optId} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0', width: '100%' }}>
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

                                    {/* 判断题 */}
                                    {q.type === 'judge' && (
                                        <Radio.Group value={userAnswer} onChange={(val) => handleOptionChange(q.id, val.toString())} disabled={isSubmitted}>
                                            <Space direction='vertical' style={{ width: '100%' }}>
                                                <Radio value="正确" style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>正确</Radio>
                                                <Radio value="错误" style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>错误</Radio>
                                            </Space>
                                        </Radio.Group>
                                    )}

                                    {/* 填空/解答题 */}
                                    {(q.type === 'fill' || q.type === 'draw') && (
                                        <div style={{ marginTop: '16px' }}>
                                            <TextArea
                                                placeholder="请在此输入答案..."
                                                value={userAnswer || ''}
                                                onChange={(val) => handleOptionChange(q.id, val)}
                                                disabled={isSubmitted}
                                                rows={5}
                                                style={{ '--background-color': '#f5f5f5', padding: '12px', borderRadius: '8px' }}
                                            />
                                        </div>
                                    )}

                                    {/* 批改结果展示 */}
                                    {isSubmitted && (
                                        <div style={{ marginTop: '24px', padding: '16px', backgroundColor: isCorrect ? '#f6ffed' : '#fff1f0', borderRadius: '8px' }}>
                                            <p style={{ color: isCorrect ? '#52c41a' : '#f5222d', fontWeight: 'bold', fontSize: '16px' }}>
                                                {isCorrect ? '✓ 回答正确' : `✗ 回答错误`}
                                            </p>
                                            <p style={{ marginTop: '8px' }}>
                                                <strong>正确答案：</strong> {renderAnswer(q.answer)}
                                            </p>
                                            <div style={{ marginTop: '16px', borderTop: '1px dashed #ddd', paddingTop: '12px' }}>
                                                <strong style={{ display: 'block', marginBottom: '8px' }}>题目解析：</strong>
                                                <RichTextRenderer htmlContent={q.analysis || '暂无解析'} />
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </Swiper.Item>
                        );
                    })}
                </Swiper>
            </div>

            {/* 底部操作栏 */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', paddingBottom: '12px' }}>
                <Button block disabled={currentIndex === 0} onClick={goPrev}>上一题</Button>
                {currentIndex === questions.length - 1 && !isSubmitted ? (
                    <Button block color="primary" onClick={handleSubmit}>确认交卷</Button>
                ) : (
                    <Button block onClick={goNext} disabled={currentIndex === questions.length - 1}>下一题</Button>
                )}
            </div>
        </div>
    );
};

export default Practice;