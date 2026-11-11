import React from 'react';
import { 
    GitBranch, GitCommit, GitPullRequest, ExternalLink, 
    CheckCircle2, XCircle, Clock, AlertTriangle, ShieldAlert, 
    Terminal, Globe, Activity, ArrowUpRight
} from 'lucide-react';

export default function DevOpsAlertCard({ alert, isOwnMessage, timestamp }) {
    if (!alert) return null;

    const {
        service = 'custom',
        status = 'info',
        title = 'DevOps Notification',
        description = '',
        branch = '',
        commit = '',
        author = '',
        url = '',
        environment = '',
        fields = []
    } = alert;

    // Status styling
    let statusBg = 'rgba(6, 182, 212, 0.12)';
    let statusBorder = 'rgba(6, 182, 212, 0.35)';
    let statusColor = '#38bdf8';
    let StatusIcon = Activity;

    if (status === 'success') {
        statusBg = 'rgba(16, 185, 129, 0.12)';
        statusBorder = 'rgba(16, 185, 129, 0.4)';
        statusColor = '#34d399';
        StatusIcon = CheckCircle2;
    } else if (status === 'failure' || status === 'error') {
        statusBg = 'rgba(239, 68, 68, 0.12)';
        statusBorder = 'rgba(239, 68, 68, 0.4)';
        statusColor = '#f87171';
        StatusIcon = XCircle;
    } else if (status === 'pending') {
        statusBg = 'rgba(245, 158, 11, 0.12)';
        statusBorder = 'rgba(245, 158, 11, 0.4)';
        statusColor = '#fbbf24';
        StatusIcon = Clock;
    }

    // Service label
    const serviceLabel = service.toUpperCase();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            maxWidth: '460px',
            backgroundColor: '#161b22',
            border: `1px solid ${statusBorder}`,
            borderLeft: `4px solid ${statusColor}`,
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
            color: '#c9d1d9',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                backgroundColor: '#0d1117',
                borderBottom: '1px solid #21262d',
                gap: '8px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: statusBg,
                        color: statusColor,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '0.5px'
                    }}>
                        <StatusIcon size={12} />
                        <span>{serviceLabel}</span>
                    </div>

                    {environment && (
                        <span style={{
                            fontSize: '0.68rem',
                            color: '#8b949e',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            padding: '1px 5px',
                            borderRadius: '3px'
                        }}>
                            {environment}
                        </span>
                    )}
                </div>

                {url && (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#58a6ff',
                            fontSize: '0.72rem',
                            textDecoration: 'none',
                            fontWeight: 600
                        }}
                    >
                        <span>View</span>
                        <ArrowUpRight size={12} />
                    </a>
                )}
            </div>

            {/* Body */}
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: '#f0f6fc',
                    lineHeight: '1.3'
                }}>
                    {title}
                </div>

                {description && (
                    <div style={{
                        fontSize: '0.78rem',
                        color: '#8b949e',
                        lineHeight: '1.4',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        maxHeight: '120px',
                        overflowY: 'auto'
                    }}>
                        {description}
                    </div>
                )}

                {/* Git Meta Tags: Branch, Commit, Author */}
                {(branch || commit || author) && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginTop: '4px',
                        paddingTop: '6px',
                        borderTop: '1px solid #21262d',
                        fontSize: '0.74rem'
                    }}>
                        {branch && (
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: '#58a6ff',
                                backgroundColor: 'rgba(56, 189, 248, 0.08)',
                                padding: '2px 6px',
                                borderRadius: '4px'
                            }}>
                                <GitBranch size={12} />
                                <span>{branch}</span>
                            </span>
                        )}

                        {commit && (
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: '#a5d6ff',
                                fontFamily: 'monospace'
                            }}>
                                <GitCommit size={12} />
                                <span>{commit}</span>
                            </span>
                        )}

                        {author && (
                            <span style={{ color: '#8b949e' }}>
                                by <strong style={{ color: '#e6edf3' }}>{author}</strong>
                            </span>
                        )}
                    </div>
                )}

                {/* Additional custom fields */}
                {Array.isArray(fields) && fields.length > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '6px',
                        marginTop: '4px'
                    }}>
                        {fields.map((f, i) => (
                            <div key={i} style={{ backgroundColor: '#0d1117', padding: '4px 8px', borderRadius: '4px', fontSize: '0.72rem' }}>
                                <div style={{ color: '#8b949e', fontSize: '0.65rem' }}>{f.label}</div>
                                <div style={{ color: '#f0f6fc', fontWeight: 600 }}>{f.value}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Timestamp footer */}
            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '2px 10px 6px 10px',
                fontSize: '0.68rem',
                color: '#6e7681'
            }}>
                {timestamp}
            </div>
        </div>
    );
}

