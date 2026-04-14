import React, { useState, useEffect, useRef } from 'react';
import { Swiper, Button, Radio, Space, Card, Toast, Dialog } from 'antd-mobile';
import type { SwiperRef } from 'antd-mobile/es/components/swiper';
import api from '../../utils/request';
import RichTextRenderer from '../../components/RichTextRenderer';

// 定义题目数据结构 (需与你的 DRF 返回格式对齐)
interface Question {
    id: number;
    stem_full: string;
    options?: string[]; // 假设选择题有选项数组
    answer: string;
    analysis: string;
}

const Practice: React.FC = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const swiperRef = useRef<SwiperRef>(null);

    // 1. 初始化拉取题目 & 启动计时器
    useEffect(() => {
        fetchQuestions();

        // 启动正向计时器
        const timer = setInterval(() => {
            setTimeElapsed((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(timer); // 组件卸载或交卷时清理计时器
    }, []);

    const fetchQuestions = async () => {
        try {
            // 替换为你真实的获取题目 API
            // const res: any = await api.get('/api/practices/list/');

            // 本地测试Mock数据 (等待后端真实数据联调时可注释掉)
            const mockData = [
                { id: 1, stem_full: '<p>1 + 1 = ?</p>', options: ['A. 1', 'B. 2', 'C. 3'], answer: 'B. 2', analysis: '<p>基础算术题</p>' },
                { id: 2, stem_full: '<p>地球是圆的吗？</p>', options: ['A. 是', 'B. 否'], answer: 'A. 是', analysis: '<p>科学常识</p>' },
            ];
            setQuestions(mockData);
        } catch (error) {
            console.error("获取题目失败");
        }
    };

    // 2. 答题选项改变
    const handleOptionChange = (questionId: number, val: string) => {
        if (isSubmitted) return; // 交卷后禁止修改
        setAnswers(prev => ({ ...prev, [questionId]: val }));
    };

    // 3. 翻页控制 (防误触设计)
    const goNext = () => swiperRef.current?.swipeNext();
    const goPrev = () => swiperRef.current?.swipePrev();

    // 4. 交卷逻辑
    const handleSubmit = async () => {
        if (Object.keys(answers).length < questions.length) {
            const confirm = await Dialog.confirm({ content: '您还有题目未作答，确定要交卷吗？' });
            if (!confirm) return;
        }

        try {
            Toast.show({ icon: 'loading', content: '提交中...' });
            // 调用真实交卷接口
            // await api.post('/api/practices/submit/', {
            //   time_spent: timeElapsed,
            //   answers: answers
            // });

            setIsSubmitted(true);
            Toast.show({ icon: 'success', content: '交卷成功！' });
        } catch (error) {
            console.error('交卷失败');
        }
    };

    // 格式化时间 (秒 -> MM:SS)
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (questions.length === 0) return <div>加载中...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '12px' }}>
            {/* 顶部状态栏 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    进度: {currentIndex + 1} / {questions.length}
                </span>
                <span style={{ color: isSubmitted ? 'green' : 'red', fontWeight: 'bold' }}>
                    {isSubmitted ? '已交卷' : `用时: ${formatTime(timeElapsed)}`}
                </span>
            </div>

            {/* 题目轮播区 (禁用原生触控滑动，防止写字时误触) */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <Swiper
                    allowTouchMove={false}
                    ref={swiperRef}
                    onIndexChange={setCurrentIndex}
                    indicator={() => null} // 隐藏默认指示器
                >
                    {questions.map((q) => {
                        const userAnswer = answers[q.id];
                        const isCorrect = userAnswer === q.answer;
                        // 交卷后的边框颜色反馈
                        const cardStyle = isSubmitted
                            ? { border: isCorrect ? '2px solid #4caf50' : '2px solid #f44336' }
                            : {};

                        return (
                            <Swiper.Item key={q.id}>
                                <Card style={{ minHeight: '60vh', ...cardStyle }}>
                                    {/* 题干渲染 (通过防XSS组件) */}
                                    <div style={{ fontSize: '18px', marginBottom: '24px' }}>
                                        <RichTextRenderer htmlContent={q.stem_full} />
                                    </div>

                                    {/* 选项区 */}
                                    <Radio.Group
                                        value={userAnswer}
                                        onChange={(val) => handleOptionChange(q.id, val.toString())}
                                    >
                                        <Space direction='vertical' style={{ width: '100%' }}>
                                            {q.options?.map((opt, i) => (
                                                <Radio key={i} value={opt} style={{ padding: '8px 0', fontSize: '16px' }}>
                                                    {opt}
                                                </Radio>
                                            ))}
                                        </Space>
                                    </Radio.Group>

                                    {/* 交卷后：原地展开解析区 */}
                                    {isSubmitted && (
                                        <div style={{ marginTop: '24px', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                                            <p style={{ color: isCorrect ? 'green' : 'red', fontWeight: 'bold' }}>
                                                {isCorrect ? '回答正确！' : `回答错误。正确答案是: ${q.answer}`}
                                            </p>
                                            <hr style={{ border: '0.5px solid #eee', margin: '12px 0' }} />
                                            <h4>解析：</h4>
                                            <RichTextRenderer htmlContent={q.analysis} />
                                        </div>
                                    )}
                                </Card>
                            </Swiper.Item>
                        );
                    })}
                </Swiper>
            </div>

            {/* 底部控制台 */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <Button block disabled={currentIndex === 0} onClick={goPrev}>上一题</Button>
                <Button block disabled={currentIndex === questions.length - 1} onClick={goNext}>下一题</Button>
                {!isSubmitted && (
                    <Button block color="primary" onClick={handleSubmit}>交卷</Button>
                )}
            </div>
        </div>
    );
};

export default Practice;