import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';
import './RichTextRenderer.css';

interface Props {
    htmlContent: string;
}

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const RichTextRenderer: React.FC<Props> = ({ htmlContent }) => {
    const sanitizedHtml = useMemo(() => {
        if (!htmlContent) return '';

        // 【核心修复】：使用链式调用 (.replace().replace())
        // 第一步补全后端域名，第二步把 .jpg 强制转成实际存在的 .png
        const processedHtml = htmlContent
            .replace(/src="\/images\//g, `src="${BACKEND_URL}/images/`)
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