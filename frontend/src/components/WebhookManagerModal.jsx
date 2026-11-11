import React, { useState, useEffect } from 'react';
import { 
    X, Copy, Check, Plus, Trash2, Webhook, RefreshCw, 
    ExternalLink, CheckCircle2, ShieldCheck, Zap
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function WebhookManagerModal({ isOpen, onClose, conversationId, conversationName, getAccessTokenSilently }) {
    if (!isOpen) return null;

    const [webhooks, setWebhooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [webhookName, setWebhookName] = useState('');
    const [service, setService] = useState('github');
    const [copiedToken, setCopiedToken] = useState(null);
    const [createdUrl, setCreatedUrl] = useState(null);

    const fetchWebhooks = async () => {
        if (!conversationId) return;
        setLoading(true);
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`${BACKEND_URL}/api/webhooks/conversation/${conversationId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setWebhooks(data.webhooks || []);
            }
        } catch (e) {
            console.error('Failed to fetch webhooks:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWebhooks();
    }, [conversationId]);

    const handleCreateWebhook = async (e) => {
        e.preventDefault();
        if (creating) return;
        setCreating(true);
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`${BACKEND_URL}/api/webhooks/conversation/${conversationId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: webhookName || `${service.toUpperCase()} CI Alert`,
                    service
                })
            });

            if (res.ok) {
                const data = await res.json();
                setWebhooks(prev => [...prev, data.webhook]);
                setCreatedUrl(data.webhookUrl);
                setWebhookName('');
            }
        } catch (err) {
            console.error('Failed to create webhook:', err);
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteWebhook = async (webhookId) => {
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`${BACKEND_URL}/api/webhooks/conversation/${conversationId}/${webhookId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setWebhooks(prev => prev.filter(w => w._id !== webhookId && w.token !== webhookId));
            }
        } catch (err) {
            console.error('Failed to delete webhook:', err);
        }
    };

    const handleCopy = (url, id) => {
        navigator.clipboard.writeText(url);
        setCopiedToken(id);
        setTimeout(() => setCopiedToken(null), 2000);
    };

    const getFullWebhookUrl = (webhookToken) => {
        return `${BACKEND_URL}/api/webhooks/incoming/${webhookToken}`;
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '580px',
                backgroundColor: '#161b22',
                border: '1px solid #30363d',
                borderRadius: '14px',
                boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '90vh'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: '1px solid #30363d',
                    backgroundColor: '#0d1117'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(6, 182, 212, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#06b6d4'
                        }}>
                            <Webhook size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#f0f6fc' }}>
                                DevOps CI/CD Webhooks
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#8b949e' }}>
                                Connected to #{conversationName || 'Channel'}
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', padding: '4px' }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Create New Webhook Form */}
                    <form onSubmit={handleCreateWebhook} style={{
                        padding: '16px',
                        borderRadius: '10px',
                        backgroundColor: '#0d1117',
                        border: '1px solid #30363d',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e6edf3' }}>
                            Create Incoming Webhook
                        </div>

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                placeholder="Webhook Name (e.g. GitHub Actions, Vercel Production)"
                                value={webhookName}
                                onChange={(e) => setWebhookName(e.target.value)}
                                style={{
                                    flex: 1,
                                    minWidth: '200px',
                                    padding: '8px 12px',
                                    backgroundColor: '#161b22',
                                    border: '1px solid #30363d',
                                    borderRadius: '6px',
                                    color: '#f0f6fc',
                                    fontSize: '0.84rem',
                                    outline: 'none'
                                }}
                            />

                            <select
                                value={service}
                                onChange={(e) => setService(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#161b22',
                                    border: '1px solid #30363d',
                                    borderRadius: '6px',
                                    color: '#f0f6fc',
                                    fontSize: '0.84rem',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="github">GitHub (Push / PR / CI)</option>
                                <option value="vercel">Vercel Deployments</option>
                                <option value="sentry">Sentry Exceptions</option>
                                <option value="custom">Generic / Custom CI</option>
                            </select>

                            <button
                                type="submit"
                                disabled={creating}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 16px',
                                    backgroundColor: '#238636',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '0.84rem',
                                    fontWeight: 600,
                                    cursor: creating ? 'wait' : 'pointer'
                                }}
                            >
                                <Plus size={14} />
                                <span>{creating ? 'Generating...' : 'Add Webhook'}</span>
                            </button>
                        </div>

                        {/* Quick Setup Instructions */}
                        <div style={{ fontSize: '0.74rem', color: '#8b949e', lineHeight: '1.4' }}>
                            {service === 'github' && '💡 Paste the generated URL into your GitHub Repo ➔ Settings ➔ Webhooks ➔ Payload URL (Content type: application/json).'}
                            {service === 'vercel' && '💡 Paste into Vercel ➔ Project Settings ➔ Webhooks to stream build and deploy events.'}
                            {service === 'sentry' && '💡 Add in Sentry ➔ Project Settings ➔ Integrations ➔ Webhooks to stream production exceptions.'}
                            {service === 'custom' && '💡 Send a POST request with JSON { title, status, description, branch, url }.'}
                        </div>
                    </form>

                    {/* Active Webhooks List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e6edf3' }}>
                            Active Webhooks ({webhooks.length})
                        </div>

                        {loading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px 0', gap: '8px', color: '#8b949e' }}>
                                <RefreshCw size={16} className="spin" />
                                <span>Loading webhooks...</span>
                            </div>
                        ) : webhooks.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: '#8b949e', fontSize: '0.85rem', backgroundColor: '#0d1117', borderRadius: '8px' }}>
                                No webhooks configured yet. Create one above to pipe CI/CD alerts into this channel.
                            </div>
                        ) : (
                            webhooks.map((w) => {
                                const fullUrl = getFullWebhookUrl(w.token);
                                const isCopied = copiedToken === w._id || copiedToken === w.token;

                                return (
                                    <div key={w._id || w.token} style={{
                                        padding: '12px 14px',
                                        borderRadius: '8px',
                                        backgroundColor: '#0d1117',
                                        border: '1px solid #30363d',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{
                                                    fontSize: '0.72rem',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    color: '#38bdf8',
                                                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px'
                                                }}>
                                                    {w.service || 'custom'}
                                                </span>
                                                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f0f6fc' }}>
                                                    {w.name}
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleDeleteWebhook(w._id || w.token)}
                                                title="Revoke Webhook"
                                                style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', padding: '2px' }}
                                            >
                                                <Trash2 size={14} color="#f85149" />
                                            </button>
                                        </div>

                                        {/* URL Bar with Copy Button */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '6px 10px',
                                            backgroundColor: '#161b22',
                                            borderRadius: '6px',
                                            border: '1px solid #21262d',
                                            gap: '8px'
                                        }}>
                                            <span style={{
                                                fontSize: '0.78rem',
                                                fontFamily: 'monospace',
                                                color: '#8b949e',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {fullUrl}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => handleCopy(fullUrl, w._id || w.token)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    background: isCopied ? '#238636' : '#21262d',
                                                    color: isCopied ? '#fff' : '#c9d1d9',
                                                    border: '1px solid #30363d',
                                                    borderRadius: '4px',
                                                    padding: '4px 8px',
                                                    fontSize: '0.74rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    flexShrink: 0
                                                }}
                                            >
                                                {isCopied ? <Check size={12} /> : <Copy size={12} />}
                                                <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '12px 20px',
                    borderTop: '1px solid #30363d',
                    backgroundColor: '#0d1117',
                    display: 'flex',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: '6px 16px',
                            backgroundColor: '#21262d',
                            color: '#c9d1d9',
                            border: '1px solid #30363d',
                            borderRadius: '6px',
                            fontSize: '0.84rem',
                            cursor: 'pointer'
                        }}
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
