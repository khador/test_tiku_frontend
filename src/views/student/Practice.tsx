import React, { useState, useEffect, useRef } from 'react';
import { Swiper, Button, Radio, Space, Card, Toast, Dialog, TextArea } from 'antd-mobile'; import type { SwiperRef } from 'antd-mobile/es/components/swiper';
import api from '../../utils/request';
import RichTextRenderer from '../../components/RichTextRenderer';

// 1. 升级数据结构，允许 options 和 answer 是对象
interface Question {
    id: number;
    sn: string;
    type: string;
    stem: string;
    options?: any[]; // 兼容后端传来的 [{id: 'A', content: '...'}]
    answer?: any;    // 兼容后端传来的 {"correct_options": ["C"]}
    analysis?: string;
}

const Practice: React.FC = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [sessionId, setSessionId] = useState<number | null>(null);
    const swiperRef = useRef<SwiperRef>(null);

    useEffect(() => {
        fetchQuestions();
        const timer = setInterval(() => setTimeElapsed((prev) => prev + 1), 1000);
        return () => clearInterval(timer);
    }, []);

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

    const handleSubmit = async () => {
        if (Object.keys(answers).length < questions.length) {
            const confirm = await Dialog.confirm({ content: '您还有题目未作答，确定要交卷吗？' });
            if (!confirm) return;
        }

        try {
            Toast.show({ icon: 'loading', content: '提交中...' });
            const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
                question_id: parseInt(qId),
                user_answer: ans,
                time_spent: 0
            }));

            const res: any = await api.post('/api/practices/submit/', {
                session_id: sessionId,
                duration: timeElapsed,
                answers: formattedAnswers
            });

            const fullQuestions = res.details.map((item: any) => item.question);
            setQuestions(fullQuestions);
            setIsSubmitted(true);
            Toast.show({ icon: 'success', content: '交卷成功！' });
        } catch (error) {
            console.error('交卷失败', error);
            Toast.show({ icon: 'fail', content: '交卷失败，请重试' });
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // 辅助函数：把后端复杂的 JSON 答案转成人类能看懂的字符串
    // 辅助函数：把后端复杂的 JSON 答案转成人类能看懂的字符串
    const renderAnswer = (ans: any) => {
        if (!ans) return '无';
        if (typeof ans === 'string') return ans;

        // 处理选择题答案
        if (ans.correct_options) return ans.correct_options.join(', ');

        // 处理填空题答案（增加强大的防御性容错）
        if (ans.blanks && Array.isArray(ans.blanks)) {
            return ans.blanks.map((b: any) => {
                // 如果有正常的文本答案
                if (b.accepted_values && Array.isArray(b.accepted_values)) {
                    return b.accepted_values.join(' 或 ');
                }
                // 如果是类似前面遇到的图片参考答案
                if (b.standard_image) {
                    return '[图片参考答案]';
                }
                // 未知格式兜底
                return '[特殊格式答案]';
            }).join('  |  ');
        }

        // 其他兜底情况
        return JSON.stringify(ans);
    };

    if (questions.length === 0) return <div>加载中...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>进度: {currentIndex + 1} / {questions.length}</span>
                <span style={{ color: isSubmitted ? 'green' : 'red', fontWeight: 'bold' }}>
                    {isSubmitted ? '已交卷' : `用时: ${formatTime(timeElapsed)}`}
                </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                <Swiper allowTouchMove={false} ref={swiperRef} onIndexChange={setCurrentIndex} indicator={() => null}>
                    {questions.map((q) => {
                        const userAnswer = answers[q.id];
                        // 简单判断对错（真实对错其实后端在 res.details 里返回了 is_correct，这里做简化展示）
                        const isCorrect = isSubmitted && userAnswer === renderAnswer(q.answer);
                        const cardStyle = isSubmitted
                            ? { border: isCorrect ? '2px solid #4caf50' : '2px solid #f44336' }
                            : {};

                        return (
                            <Swiper.Item key={q.id}>
                                <Card style={{ minHeight: '60vh', ...cardStyle }}>
                                    <div style={{ fontSize: '18px', marginBottom: '24px' }}>
                                        <RichTextRenderer htmlContent={q.stem} />
                                    </div>

                                    {/* 1. 选择题 UI */}
                                    {q.type === 'choice' && (
                                        <Radio.Group value={userAnswer} onChange={(val) => handleOptionChange(q.id, val.toString())}>
                                            <Space direction='vertical' style={{ width: '100%' }}>
                                                {q.options?.map((opt: any, i) => {
                                                    const optId = typeof opt === 'string' ? opt : opt.id;
                                                    const optContent = typeof opt === 'string' ? opt : opt.content;
                                                    return (
                                                        <Radio key={optId || i} value={optId} style={{ padding: '8px 0', fontSize: '16px', width: '100%' }}>
                                                            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                                                <span style={{ marginRight: '8px', fontWeight: 'bold' }}>{optId}.</span>
                                                                <div style={{ flex: 1 }}>
                                                                    <RichTextRenderer htmlContent={optContent} />
                                                                </div>
                                                            </div>
                                                        </Radio>
                                                    )
                                                })}
                                            </Space>
                                        </Radio.Group>
                                    )}

                                    {/* 2. 判断题 UI (手动生成对错选项) */}
                                    {q.type === 'judge' && (
                                        <Radio.Group value={userAnswer} onChange={(val) => handleOptionChange(q.id, val.toString())}>
                                            <Space direction='vertical' style={{ width: '100%' }}>
                                                <Radio value="正确" style={{ padding: '8px 0', fontSize: '16px' }}>正确</Radio>
                                                <Radio value="错误" style={{ padding: '8px 0', fontSize: '16px' }}>错误</Radio>
                                            </Space>
                                        </Radio.Group>
                                    )}

                                    {/* 3. 填空题 / 解答题 / 画图题 UI */}
                                    {(q.type === 'fill' || q.type === 'draw') && (
                                        <div style={{ marginTop: '16px' }}>
                                            <div style={{ marginBottom: '8px', color: '#666', fontSize: '14px' }}>
                                                请输入你的答案（如有多个空，请用空格或逗号隔开）：
                                            </div>
                                            <TextArea
                                                placeholder="在此输入答案..."
                                                value={userAnswer || ''}
                                                onChange={(val) => handleOptionChange(q.id, val)}
                                                disabled={isSubmitted}
                                                rows={4}
                                                style={{
                                                    '--background-color': '#f5f5f5',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    fontSize: '16px'
                                                }}
                                            />
                                        </div>
                                    )}
                                    {isSubmitted && q.answer && (
                                        <div style={{ marginTop: '24px', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                                            <p style={{ color: isCorrect ? 'green' : 'red', fontWeight: 'bold' }}>
                                                {/* 将 JSON 对象答案转化为字符串展示 */}
                                                {isCorrect ? '回答正确！' : `回答错误。正确答案是: ${renderAnswer(q.answer)}`}
                                            </p>
                                            <hr style={{ border: '0.5px solid #eee', margin: '12px 0' }} />
                                            <h4>解析：</h4>
                                            <RichTextRenderer htmlContent={q.analysis || '暂无解析'} />
                                        </div>
                                    )}
                                </Card>
                            </Swiper.Item>
                        );
                    })}
                </Swiper>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <Button block disabled={currentIndex === 0} onClick={goPrev}>上一题</Button>
                <Button block disabled={currentIndex === questions.length - 1} onClick={goNext}>下一题</Button>
                {!isSubmitted && <Button block color="primary" onClick={handleSubmit}>交卷</Button>}
            </div>
        </div>
    );
};

export default Practice;