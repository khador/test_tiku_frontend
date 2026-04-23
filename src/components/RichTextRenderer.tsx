import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';
import './RichTextRenderer.css';

interface Props {
    htmlContent: string;
}

// 🔥 关键：移除这个变量，不再强制指向后端
// const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.31.93:8000';

const RichTextRenderer: React.FC<Props> = ({ htmlContent }) => {
    const sanitizedHtml = useMemo(() => {
        if (!htmlContent) return '';

        // 🔥 修复逻辑：确保图片路径是相对路径，供 Vite 代理
        const processedHtml = htmlContent
            // 1. 移除所有 localhost:8000 前缀
            .replace(/http:\/\/localhost:8000\/images\//g, '/images/')
            .replace(/http:\/\/127\.0\.0\.1:8000\/images\//g, '/images/')
            .replace(/http:\/\/192\.168\.31\.93:8000\/images\//g, '/images/')
            // 2. 移除 BACKEND_URL 前缀（防止被转换成后端地址）
            // .replace(/src="\/images\//g, `src="${BACKEND_URL}/images/`)  // ❌ 注释掉这一行
            // 3. 保留原有的 .jpg -> .png 转换
            .replace(/\.jpg/g, '.png');

        // DOMPurify 净化 HTML 防止 XSS
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