import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';
import './RichTextRenderer.css'; // 确保导入CSS

interface Props {
    htmlContent: string;
}

const RichTextRenderer: React.FC<Props> = ({ htmlContent }) => {
    const sanitizedHtml = useMemo(() => {
        if (!htmlContent) return '';

        // 处理HTML内容，确保图片路径正确
        const processedHtml = htmlContent
            .replace(/http:\/\/localhost:8000\/images\//g, '/images/')
            .replace(/http:\/\/127\.0\.0\.1:8000\/images\//g, '/images/')
            .replace(/http:\/\/192\.168\.31\.93:8000\/images\//g, '/images/')
            .replace(/\.jpg/g, '.png');

        return DOMPurify.sanitize(processedHtml, {
            ADD_TAGS: ['img'],
            ADD_ATTR: ['src', 'style', 'class', 'alt', 'title']
        });
    }, [htmlContent]);

    return (
        // 🔥 确保使用正确的CSS类名
        <div
            className="rich-text-content"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
    );
};

export default RichTextRenderer;