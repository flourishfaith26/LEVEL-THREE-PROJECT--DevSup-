import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function parseInlineTokens(text) {
    if (!text || typeof text !== 'string') return [{ type: 'text', value: text || '' }];

    // Regex pattern matching:
    // 1. Inline code: `...`
    // 2. Double asterisk bold: **...**
    // 3. Mentions: @...
    // 4. URLs: https://... or http://...
    // 5. Single asterisk bold: *...*
    // 6. Underscore italic: _..._
    // 7. Tilde strikethrough: ~...~
    const regex = /(`[^`]+`|\*\*[^*]+\*\*|@[a-zA-Z0-9_.-]+|https?:\/\/[^\s<]+|(?<=^|[\s(])\*(?!\s)[^*]+?(?<!\s)\*(?=[\s).,!?]|$)|(?<=^|[\s(])_(?!\s)[^_]+?(?<!\s)_(?=[\s).,!?]|$)|(?<=^|[\s(])~(?!\s)[^~]+?(?<!\s)~(?=[\s).,!?]|$))/g;

    const tokens = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) });
        }
        const val = match[0];
        if (val.startsWith('`') && val.endsWith('`') && val.length >= 2) {
            tokens.push({ type: 'code', value: val.slice(1, -1) });
        } else if (val.startsWith('**') && val.endsWith('**') && val.length >= 4) {
            tokens.push({ type: 'bold', value: val.slice(2, -2) });
        } else if (val.startsWith('@')) {
            tokens.push({ type: 'mention', value: val });
        } else if (/^https?:\/\//i.test(val)) {
            tokens.push({ type: 'link', value: val });
        } else if (val.startsWith('*') && val.endsWith('*') && val.length >= 2) {
            tokens.push({ type: 'bold', value: val.slice(1, -1) });
        } else if (val.startsWith('_') && val.endsWith('_') && val.length >= 2) {
            tokens.push({ type: 'italic', value: val.slice(1, -1) });
        } else if (val.startsWith('~') && val.endsWith('~') && val.length >= 2) {
            tokens.push({ type: 'strike', value: val.slice(1, -1) });
        } else {
            tokens.push({ type: 'text', value: val });
        }
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        tokens.push({ type: 'text', value: text.slice(lastIndex) });
    }

    return tokens;
}

export function renderInlineMarkdown(text, isOwn = false, options = {}) {
    const tokens = parseInlineTokens(text);

    return tokens.map((token, idx) => {
        if (token.type === 'code') {
            return (
                <code
                    key={idx}
                    style={{
                        backgroundColor: isOwn ? 'rgba(0, 0, 0, 0.35)' : 'rgba(15, 23, 42, 0.75)',
                        color: isOwn ? '#ffffff' : '#00e5ff',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '0.88em',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        border: isOwn ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(6, 182, 212, 0.35)',
                        wordBreak: 'break-word',
                        verticalAlign: 'baseline'
                    }}
                >
                    {token.value}
                </code>
            );
        }

        if (token.type === 'bold') {
            return (
                <strong
                    key={idx}
                    style={{
                        fontWeight: '700',
                        color: isOwn ? '#ffffff' : 'inherit'
                    }}
                >
                    {renderInlineMarkdown(token.value, isOwn, options)}
                </strong>
            );
        }

        if (token.type === 'italic') {
            return (
                <em key={idx} style={{ fontStyle: 'italic' }}>
                    {renderInlineMarkdown(token.value, isOwn, options)}
                </em>
            );
        }

        if (token.type === 'strike') {
            return (
                <del key={idx} style={{ textDecoration: 'line-through', opacity: 0.75 }}>
                    {renderInlineMarkdown(token.value, isOwn, options)}
                </del>
            );
        }

        if (token.type === 'mention') {
            const handle = token.value.slice(1).toLowerCase();
            const myU = (options.myUsername || '').toLowerCase();
            const myN = (options.myName || '').toLowerCase();
            const isMe = (myU && handle === myU) || (myN && handle === myN) || handle === 'everyone' || handle === 'all';
            const isBot = handle === 'devsup-ai';

            return (
                <span
                    key={idx}
                    style={{
                        color: isMe ? '#ffffff' : (isBot ? '#c084fc' : 'var(--colors-accent, #06b6d4)'),
                        backgroundColor: isMe
                            ? 'rgba(6, 182, 212, 0.35)'
                            : (isBot ? 'rgba(192, 132, 252, 0.16)' : 'rgba(6, 182, 212, 0.12)'),
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontWeight: '600',
                        display: 'inline-block',
                        margin: '0 1px',
                        lineHeight: '1.2'
                    }}
                >
                    {token.value}
                </span>
            );
        }

        if (token.type === 'link') {
            return (
                <a
                    key={idx}
                    href={token.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: isOwn ? '#ffffff' : 'var(--colors-accent, #06b6d4)',
                        textDecoration: 'underline',
                        textUnderlineOffset: '2px',
                        wordBreak: 'break-all'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {token.value}
                </a>
            );
        }

        return <React.Fragment key={idx}>{token.value}</React.Fragment>;
    });
}

function CodeBlock({ code, language }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e) => {
        e.stopPropagation();
        if (navigator.clipboard) {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div
            style={{
                margin: '8px 0',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#090d16',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '5px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '0.72rem',
                    color: '#8b949e',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}
            >
                <span>{language || 'code'}</span>
                <button
                    type="button"
                    onClick={handleCopy}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: copied ? '#10b981' : '#06b6d4',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 6px',
                        borderRadius: '4px'
                    }}
                >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
            </div>
            <pre
                style={{
                    margin: 0,
                    padding: '10px 14px',
                    overflowX: 'auto',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: '0.84rem',
                    lineHeight: '1.5',
                    color: '#e2e8f0'
                }}
            >
                <code>{code}</code>
            </pre>
        </div>
    );
}

export default function MarkdownRenderer({ content, isOwn = false, options = {} }) {
    if (!content || typeof content !== 'string') {
        return <span>{content || ''}</span>;
    }

    const lines = content.split('\n');
    const elements = [];
    let inCodeBlock = false;
    let codeBlockLang = '';
    let codeBlockLines = [];

    lines.forEach((line, lineIdx) => {
        // Fenced code blocks ```
        if (line.trim().startsWith('```')) {
            if (inCodeBlock) {
                const codeString = codeBlockLines.join('\n');
                elements.push(
                    <CodeBlock
                        key={`code-${lineIdx}`}
                        code={codeString}
                        language={codeBlockLang}
                    />
                );
                inCodeBlock = false;
                codeBlockLines = [];
                codeBlockLang = '';
            } else {
                inCodeBlock = true;
                codeBlockLang = line.trim().slice(3).trim();
            }
            return;
        }

        if (inCodeBlock) {
            codeBlockLines.push(line);
            return;
        }

        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
            elements.push(<div key={`empty-${lineIdx}`} style={{ height: '6px' }} />);
            return;
        }

        // Headings: #### Subtitle
        if (/^####\s+/.test(trimmed)) {
            const headingText = trimmed.replace(/^####\s+/, '');
            elements.push(
                <div
                    key={`h4-${lineIdx}`}
                    style={{
                        fontSize: '0.94rem',
                        fontWeight: '700',
                        color: isOwn ? '#ffffff' : 'var(--colors-textMain, #f1f5f9)',
                        marginTop: lineIdx === 0 ? '0' : '8px',
                        marginBottom: '4px',
                        letterSpacing: '-0.2px'
                    }}
                >
                    {renderInlineMarkdown(headingText, isOwn, options)}
                </div>
            );
            return;
        }

        // Headings: ### Title
        if (/^###\s+/.test(trimmed)) {
            const headingText = trimmed.replace(/^###\s+/, '');
            elements.push(
                <div
                    key={`h3-${lineIdx}`}
                    style={{
                        fontSize: '1.05rem',
                        fontWeight: '700',
                        color: 'var(--colors-accent, #06b6d4)',
                        marginTop: lineIdx === 0 ? '0' : '10px',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        letterSpacing: '-0.3px'
                    }}
                >
                    {renderInlineMarkdown(headingText, isOwn, options)}
                </div>
            );
            return;
        }

        // Headings: ## or # Title
        if (/^#{1,2}\s+/.test(trimmed)) {
            const headingText = trimmed.replace(/^#{1,2}\s+/, '');
            elements.push(
                <div
                    key={`h12-${lineIdx}`}
                    style={{
                        fontSize: '1.18rem',
                        fontWeight: '800',
                        color: 'var(--colors-accent, #06b6d4)',
                        marginTop: lineIdx === 0 ? '0' : '12px',
                        marginBottom: '6px',
                        letterSpacing: '-0.4px'
                    }}
                >
                    {renderInlineMarkdown(headingText, isOwn, options)}
                </div>
            );
            return;
        }

        // Numbered list: 1. Item
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
            const num = numMatch[1];
            const text = numMatch[2];
            elements.push(
                <div
                    key={`num-${lineIdx}`}
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        margin: '3px 0',
                        paddingLeft: '2px',
                        lineHeight: '1.45'
                    }}
                >
                    <span
                        style={{
                            color: 'var(--colors-accent, #06b6d4)',
                            fontWeight: '700',
                            fontSize: '0.88rem',
                            minWidth: '18px',
                            flexShrink: 0
                        }}
                    >
                        {num}.
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {renderInlineMarkdown(text, isOwn, options)}
                    </div>
                </div>
            );
            return;
        }

        // Bullet list: - Item or * Item (must be followed by space)
        if (/^[-*]\s+/.test(trimmed)) {
            const text = trimmed.replace(/^[-*]\s+/, '');
            elements.push(
                <div
                    key={`bullet-${lineIdx}`}
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        margin: '3px 0',
                        paddingLeft: '2px',
                        lineHeight: '1.45'
                    }}
                >
                    <span
                        style={{
                            color: 'var(--colors-accent, #06b6d4)',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            lineHeight: '1.2',
                            flexShrink: 0
                        }}
                    >
                        •
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {renderInlineMarkdown(text, isOwn, options)}
                    </div>
                </div>
            );
            return;
        }

        // Italic footnote line like *Analyzed by @devsup-ai staff review engine.*
        if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.slice(1, -1).includes('*')) {
            const text = trimmed.slice(1, -1);
            elements.push(
                <div
                    key={`italic-${lineIdx}`}
                    style={{
                        fontSize: '0.78rem',
                        fontStyle: 'italic',
                        color: 'var(--colors-textMuted, #94a3b8)',
                        marginTop: '6px'
                    }}
                >
                    {renderInlineMarkdown(text, isOwn, options)}
                </div>
            );
            return;
        }

        // Blockquote: > Quote
        if (trimmed.startsWith('>')) {
            const quoteText = trimmed.replace(/^>\s*/, '');
            elements.push(
                <div
                    key={`quote-${lineIdx}`}
                    style={{
                        borderLeft: '3px solid var(--colors-accent, #06b6d4)',
                        paddingLeft: '10px',
                        margin: '4px 0',
                        color: 'var(--colors-textMuted, #94a3b8)',
                        fontStyle: 'italic'
                    }}
                >
                    {renderInlineMarkdown(quoteText, isOwn, options)}
                </div>
            );
            return;
        }

        // Regular line
        elements.push(
            <div
                key={`line-${lineIdx}`}
                style={{
                    margin: '1px 0',
                    lineHeight: '1.45',
                    wordBreak: 'break-word'
                }}
            >
                {renderInlineMarkdown(line, isOwn, options)}
            </div>
        );
    });

    // If an unclosed code block was left at end
    if (inCodeBlock && codeBlockLines.length > 0) {
        elements.push(
            <CodeBlock
                key="code-unclosed"
                code={codeBlockLines.join('\n')}
                language={codeBlockLang}
            />
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            {elements}
        </div>
    );
}
