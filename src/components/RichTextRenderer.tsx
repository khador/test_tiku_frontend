import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';
import './RichTextRenderer.css';

interface Props {
    htmlContent: string;
}

// 获取环境变量中的后端地址，默认回退到本地 8000 端口
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const RichTextRenderer: React.FC<Props> = ({ htmlContent }) => {
    const sanitizedHtml = useMemo(() => {
        if (!htmlContent) return '';

        // 1. 正则替换：拦截题干中的 <img> 标签，补全后端域名
        const processedHtml = htmlContent.replace(
            /src="\/images\//g,
            `src="${BACKEND_URL}/images/`
        );

        // 2. DOMPurify 净化：防止 XSS 攻击，只允许图片和基本样式
        return DOMPurify.sanitize(processedHtml, {
            ADD_TAGS: ['img'],
            ADD_ATTR: ['src', 'style', 'class']
        });
    }, [htmlContent]);

    return (
        <div
            className="rich-text-content"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
    );
};

export default RichTextRenderer;