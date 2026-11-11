import React, { useState } from 'react';
import { 
    Code2, MessageSquare, Sparkles, Copy, Check, CheckCircle2, 
    CornerDownRight, Send, X, Play, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function CodeReviewBlock({
    message,
    isOwnMessage,
    onOpenInPairIDE,
    onAddLineReview,
    onToggleResolveReview,
    currentUser,
    renderTimestamp
}) {
    const rawContent = message?.content || '';
    const cleanContent = rawContent.trim().startsWith('```') && rawContent.trim().endsWith('```')
        ? rawContent.trim().replace(/^```[a-zA-Z0-9_-]*\n?/, '').replace(/```$/, '')
        : rawContent;

    const detectedLang = message?.language && message.language !== 'plaintext'
        ? message.language
        : (rawContent.trim().startsWith('```') ? (rawContent.trim().match(/^```([a-zA-Z0-9_-]+)/)?.[1] || 'text') : 'text');

    const [copied, setCopied] = useState(false);
    const [activeCommentLine, setActiveCommentLine] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showReviews, setShowReviews] = useState(true);

    // AI Review state
    const [aiReviewOpen, setAiReviewOpen] = useState(false);
    const [aiReviewLoading, setAiReviewLoading] = useState(false);
    const [aiReviewContent, setAiReviewContent] = useState('');

    const lines = cleanContent.split('\n');
    const reviews = message?.codeReviews || [];

    const handleCopy = () => {
        navigator.clipboard.writeText(cleanContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleOpenPair = () => {
        if (onOpenInPairIDE) {
            onOpenInPairIDE(cleanContent, detectedLang);
        }
    };

    const handlePostReview = async (lineNum) => {
        if (!commentText.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            if (onAddLineReview) {
                await onAddLineReview(message._id, lineNum, commentText.trim());
            }
            setCommentText('');
            setActiveCommentLine(null);
        } catch (e) {
            console.error('Failed to post review comment:', e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAskAiReview = async () => {
        setAiReviewOpen(true);
        if (aiReviewContent) return; // already loaded

        setAiReviewLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/code/ai-fix`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language: detectedLang,
                    code: cleanContent,
                    error: 'Perform a comprehensive senior staff engineer code review: analyze Big-O complexity, correctness, edge cases, potential security issues, and style.'
                })
            });
            const data = await res.json();
            if (res.ok && data.analysis) {
                setAiReviewContent(data.analysis);
            } else {
                setAiReviewContent('AI reviewer unavailable at this moment.');
            }
        } catch (err) {
            setAiReviewContent(`Review failed: ${err.message}`);
        } finally {
            setAiReviewLoading(false);
        }
    };

    const totalComments = reviews.length;
    const resolvedComments = reviews.filter(r => r.resolved).length;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            maxWidth: '680px',
            backgroundColor: '#161b22',
            borderRadius: '10px',
            border: '1px solid #30363d',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            userSelect: 'text'
        }}>
            {/* Snippet Header Toolbar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 14px',
                backgroundColor: '#0d1117',
                borderBottom: '1px solid #30363d',
                gap: '8px',
                flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Code2 size={15} color="#58a6ff" />
                    <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: '#58a6ff',
                        backgroundColor: 'rgba(56, 189, 248, 0.12)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        letterSpacing: '0.5px'
                    }}>
                        {detectedLang}
                    </span>
                    <span style={{ fontSize: '0.76rem', color: '#8b949e' }}>
                        {lines.length} {lines.length === 1 ? 'line' : 'lines'}
                    </span>

                    {totalComments > 0 && (
                        <button
                            type="button"
                            onClick={() => setShowReviews(!showReviews)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'rgba(234, 179, 8, 0.15)',
                                color: '#facc15',
                                border: '1px solid rgba(234, 179, 8, 0.3)',
                                borderRadius: '12px',
                                padding: '2px 8px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            <MessageSquare size={11} />
                            <span>{totalComments} {totalComments === 1 ? 'comment' : 'comments'} {resolvedComments > 0 ? `(${resolvedComments} resolved)` : ''}</span>
                            {showReviews ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        </button>
                    )}
                </div>

                {/* Header Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* Open in Live Pair Programming IDE */}
                    <button
                        type="button"
                        onClick={handleOpenPair}
                        title="Open in Live Pair Programming IDE"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#21262d',
                            color: '#58a6ff',
                            border: '1px solid #30363d',
                            borderRadius: '5px',
                            padding: '3px 8px',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        <Play size={11} fill="#58a6ff" />
                        <span>Pair IDE</span>
                    </button>

                    {/* Ask @devsup-ai to Review */}
                    <button
                        type="button"
                        onClick={handleAskAiReview}
                        title="Ask @devsup-ai to perform staff engineering code review"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(168, 85, 247, 0.15)',
                            color: '#c084fc',
                            border: '1px solid rgba(168, 85, 247, 0.3)',
                            borderRadius: '5px',
                            padding: '3px 8px',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        <Sparkles size={11} />
                        <span>AI Review</span>
                    </button>

                    {/* Copy Snippet */}
                    <button
                        type="button"
                        onClick={handleCopy}
                        title="Copy code"
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#8b949e',
                            cursor: 'pointer',
                            padding: '3px 6px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        {copied ? <Check size={14} color="#3fb950" /> : <Copy size={14} />}
                    </button>
                </div>
            </div>

            {/* Code Lines with Line Review Triggers */}
            <div style={{
                position: 'relative',
                maxHeight: '440px',
                overflowY: 'auto',
                overflowX: 'auto',
                backgroundColor: '#1e1e1e',
                fontSize: '0.84rem',
                fontFamily: 'Consolas, "Fira Code", Monaco, monospace'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                    <tbody>
                        {lines.map((lineText, idx) => {
                            const lineNum = idx + 1;
                            const lineReviews = reviews.filter(r => r.lineNumber === lineNum);
                            const hasComments = lineReviews.length > 0;
                            const isCommentingThisLine = activeCommentLine === lineNum;

                            return (
                                <React.Fragment key={lineNum}>
                                    <tr 
                                        className="code-line-row"
                                        style={{
                                            backgroundColor: hasComments ? 'rgba(56, 189, 248, 0.05)' : 'transparent',
                                            transition: 'background 0.15s ease'
                                        }}
                                    >
                                        {/* Line number + comment trigger button */}
                                        <td style={{
                                            width: '54px',
                                            minWidth: '54px',
                                            padding: '2px 8px 2px 10px',
                                            textAlign: 'right',
                                            color: '#6e7681',
                                            userSelect: 'none',
                                            verticalAlign: 'top',
                                            borderRight: '1px solid #30363d',
                                            position: 'relative'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveCommentLine(isCommentingThisLine ? null : lineNum)}
                                                    title={`Review line ${lineNum}`}
                                                    style={{
                                                        padding: '1px 3px',
                                                        borderRadius: '3px',
                                                        border: 'none',
                                                        backgroundColor: hasComments ? '#0284c7' : '#30363d',
                                                        color: '#ffffff',
                                                        cursor: 'pointer',
                                                        fontSize: '0.68rem',
                                                        lineHeight: '1',
                                                        opacity: hasComments ? 1 : 0.6
                                                    }}
                                                >
                                                    {hasComments ? lineReviews.length : '+'}
                                                </button>
                                                <span>{lineNum}</span>
                                            </div>
                                        </td>

                                        {/* Code Content Line */}
                                        <td style={{
                                            padding: '2px 14px',
                                            whiteSpace: 'pre',
                                            color: '#d4d4d4',
                                            verticalAlign: 'top'
                                        }}>
                                            {lineText || ' '}
                                        </td>
                                    </tr>

                                    {/* Existing Line Review Comments */}
                                    {showReviews && hasComments && (
                                        <tr>
                                            <td colSpan={2} style={{ padding: '0 0 6px 54px', backgroundColor: '#131820' }}>
                                                <div style={{
                                                    margin: '4px 14px 6px 0',
                                                    padding: '8px 12px',
                                                    borderRadius: '6px',
                                                    backgroundColor: '#161b22',
                                                    border: '1px solid #38bdf844',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '6px'
                                                }}>
                                                    {lineReviews.map((rev, revIdx) => (
                                                        <div key={rev._id || revIdx} style={{
                                                            display: 'flex',
                                                            alignItems: 'flex-start',
                                                            justifyContent: 'space-between',
                                                            fontSize: '0.78rem',
                                                            borderBottom: revIdx < lineReviews.length - 1 ? '1px solid #21262d' : 'none',
                                                            paddingBottom: revIdx < lineReviews.length - 1 ? '6px' : '0'
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                                <CornerDownRight size={13} color="#38bdf8" style={{ marginTop: '2px', flexShrink: 0 }} />
                                                                <div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                        <span style={{ fontWeight: 600, color: '#f0f6fc' }}>
                                                                            {rev.authorName || 'Developer'}
                                                                        </span>
                                                                        <span style={{ fontSize: '0.7rem', color: '#8b949e' }}>
                                                                            on line {lineNum}
                                                                        </span>
                                                                        {rev.resolved && (
                                                                            <span style={{
                                                                                fontSize: '0.68rem',
                                                                                color: '#3fb950',
                                                                                backgroundColor: 'rgba(63, 185, 80, 0.15)',
                                                                                padding: '1px 5px',
                                                                                borderRadius: '3px'
                                                                            }}>
                                                                                Resolved
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div style={{ marginTop: '2px', color: '#c9d1d9', whiteSpace: 'pre-wrap' }}>
                                                                        {rev.comment}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {onToggleResolveReview && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => onToggleResolveReview(message._id, rev._id)}
                                                                    title={rev.resolved ? 'Mark as unresolved' : 'Mark as resolved'}
                                                                    style={{
                                                                        background: 'none',
                                                                        border: 'none',
                                                                        color: rev.resolved ? '#3fb950' : '#8b949e',
                                                                        cursor: 'pointer',
                                                                        padding: '2px'
                                                                    }}
                                                                >
                                                                    <CheckCircle2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    )}

                                    {/* Inline Add Comment Input */}
                                    {isCommentingThisLine && (
                                        <tr>
                                            <td colSpan={2} style={{ padding: '0 0 6px 54px', backgroundColor: '#131820' }}>
                                                <div style={{
                                                    margin: '4px 14px 6px 0',
                                                    padding: '8px 10px',
                                                    borderRadius: '6px',
                                                    backgroundColor: '#161b22',
                                                    border: '1px solid #58a6ff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    <input
                                                        type="text"
                                                        value={commentText}
                                                        onChange={(e) => setCommentText(e.target.value)}
                                                        onKeyDown={(e) => { if (e.key === 'Enter') handlePostReview(lineNum); }}
                                                        placeholder={`Comment or suggest fix on line ${lineNum}...`}
                                                        autoFocus
                                                        style={{
                                                            flex: 1,
                                                            background: 'transparent',
                                                            border: 'none',
                                                            outline: 'none',
                                                            color: '#f0f6fc',
                                                            fontSize: '0.8rem'
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePostReview(lineNum)}
                                                        disabled={!commentText.trim() || isSubmitting}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            backgroundColor: '#1f6feb',
                                                            color: '#fff',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            padding: '4px 10px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            cursor: commentText.trim() ? 'pointer' : 'default',
                                                            opacity: commentText.trim() ? 1 : 0.5
                                                        }}
                                                    >
                                                        <Send size={11} />
                                                        <span>Comment</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => { setActiveCommentLine(null); setCommentText(''); }}
                                                        style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* AI Review Drawer */}
            {aiReviewOpen && (
                <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#0d1117',
                    borderTop: '1px solid #30363d',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c084fc', fontSize: '0.82rem', fontWeight: 600 }}>
                            <Sparkles size={14} />
                            <span>@devsup-ai Staff Review Analysis</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setAiReviewOpen(false)}
                            style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {aiReviewLoading ? (
                        <div style={{ color: '#8b949e', fontSize: '0.8rem', fontStyle: 'italic', padding: '6px 0' }}>
                            Analyzing Big-O complexity, correctness, edge cases & best practices with Gemini...
                        </div>
                    ) : (
                        <div style={{
                            color: '#e6edf3',
                            fontSize: '0.82rem',
                            lineHeight: '1.5',
                            whiteSpace: 'pre-wrap',
                            maxHeight: '220px',
                            overflowY: 'auto'
                        }}>
                            {aiReviewContent}
                        </div>
                    )}
                </div>
            )}

            {/* Bottom Footer with Timestamp */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                padding: '4px 10px',
                backgroundColor: '#0d1117',
                borderTop: '1px solid #21262d',
                fontSize: '0.72rem',
                color: '#8b949e'
            }}>
                {renderTimestamp && renderTimestamp()}
            </div>
        </div>
    );
}
