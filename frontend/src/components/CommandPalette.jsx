import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    Search, Terminal, Hash, User, Code2, Headphones, Brush, 
    Sparkles, Webhook, Settings, Sun, Moon, Keyboard, Bell, 
    Shield, X, ChevronRight, CornerDownLeft, ArrowUpDown, Award, Compass
} from 'lucide-react';

export default function CommandPalette({
    isOpen,
    onClose,
    conversations = [],
    activeConversationId,
    onSelectConversation,
    onOpenPairCoding,
    onOpenWhiteboard,
    onToggleHuddle,
    onOpenWebhooks,
    onOpenInterview,
    onOpenCommunityDirectory,
    onTriggerAi,
    onOpenSetting,
    onToggleTheme,
    currentTheme = 'dark',
    mongoUserId
}) {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    // Auto-focus input when opened & reset state
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [isOpen]);

    // Build the collection of executable actions
    const defaultActions = useMemo(() => [
        {
            id: 'action-pair-code',
            type: 'action',
            title: 'Start Live Pair Programming',
            subtitle: 'Multi-language sandbox runner (Python, JS, Go, Rust, C++)',
            icon: Code2,
            category: 'Developer Tools',
            shortcut: 'RUN',
            handler: () => onOpenPairCoding?.()
        },
        {
            id: 'action-interview',
            type: 'action',
            title: 'Technical Interview & Mentorship Mode',
            subtitle: 'Split-screen coding challenge, live timer, rubric & AI scorecard',
            icon: Award,
            category: 'Developer Tools',
            shortcut: 'INTERVIEW',
            handler: () => onOpenInterview?.()
        },
        {
            id: 'action-communities',
            type: 'action',
            title: 'Explore Public Developer Communities',
            subtitle: 'Browse and join open engineering channels (#algorithms, #system-design, #rust)',
            icon: Compass,
            category: 'Communities',
            shortcut: 'DISCOVER',
            handler: () => onOpenCommunityDirectory?.()
        },
        {
            id: 'action-huddle',
            type: 'action',
            title: 'Drop-in Audio Huddle',
            subtitle: 'Join / leave low-latency voice lounge in channel',
            icon: Headphones,
            category: 'Developer Tools',
            shortcut: 'VOICE',
            handler: () => onToggleHuddle?.()
        },
        {
            id: 'action-whiteboard',
            type: 'action',
            title: 'Open Architecture Whiteboard',
            subtitle: 'Real-time collaborative system design & diagrams',
            icon: Brush,
            category: 'Developer Tools',
            shortcut: 'ARCH',
            handler: () => onOpenWhiteboard?.()
        },
        {
            id: 'action-ai',
            type: 'action',
            title: 'Ask @devsup-ai Assistant',
            subtitle: 'Invoke Gemini AI for code review, debugging & architecture',
            icon: Sparkles,
            category: 'Developer Tools',
            shortcut: 'AI',
            handler: () => onTriggerAi?.()
        },
        {
            id: 'action-webhooks',
            type: 'action',
            title: 'Manage DevOps Webhooks',
            subtitle: 'Configure GitHub, Vercel, Sentry & CI/CD deployment alerts',
            icon: Webhook,
            category: 'DevOps',
            shortcut: 'CI/CD',
            handler: () => onOpenWebhooks?.()
        },
        {
            id: 'action-theme',
            type: 'action',
            title: `Switch Theme to ${currentTheme === 'dark' ? 'Light' : 'Dark'}`,
            subtitle: 'Toggle UI color theme',
            icon: currentTheme === 'dark' ? Sun : Moon,
            category: 'Preferences',
            shortcut: 'THEME',
            handler: () => onToggleTheme?.()
        },
        {
            id: 'action-settings-profile',
            type: 'action',
            title: 'Edit Developer Profile',
            subtitle: 'Configure GitHub bio, tech stack & username',
            icon: Settings,
            category: 'Settings',
            shortcut: 'PROFILE',
            handler: () => onOpenSetting?.('Profile')
        },
        {
            id: 'action-settings-notifications',
            type: 'action',
            title: 'Web Push & Notification Settings',
            subtitle: 'Manage background push notifications and sounds',
            icon: Bell,
            category: 'Settings',
            shortcut: 'NOTIF',
            handler: () => onOpenSetting?.('Notifications')
        },
        {
            id: 'action-settings-shortcuts',
            type: 'action',
            title: 'View Keyboard Shortcuts',
            subtitle: 'Comprehensive list of DevSup keyboard shortcuts',
            icon: Keyboard,
            category: 'Settings',
            shortcut: 'KEYS',
            handler: () => onOpenSetting?.('Keyboard shortcuts')
        }
    ], [currentTheme, onOpenPairCoding, onOpenInterview, onOpenCommunityDirectory, onToggleHuddle, onOpenWhiteboard, onTriggerAi, onOpenWebhooks, onToggleTheme, onOpenSetting]);

    // Build items from channels and direct chats
    const conversationItems = useMemo(() => {
        return conversations.map(c => {
            const isGroup = c.type === 'group';
            let title = c.name || 'Untitled Channel';
            let subtitle = isGroup ? `${c.participants?.length || 0} developers` : 'Direct message';
            let icon = isGroup ? Hash : User;

            if (!isGroup && c.participants) {
                const partner = c.participants.find(p => String(p._id || p) !== String(mongoUserId));
                if (partner && typeof partner === 'object') {
                    title = partner.displayName || partner.username || title;
                    subtitle = partner.discipline ? `@${partner.username || ''} • ${partner.discipline}` : `@${partner.username || 'developer'}`;
                }
            }

            return {
                id: `conv-${c._id}`,
                type: isGroup ? 'channel' : 'dm',
                title,
                subtitle,
                icon,
                category: isGroup ? 'Channels' : 'Direct Messages',
                conversationId: c._id,
                isActive: String(c._id) === String(activeConversationId),
                handler: () => onSelectConversation?.(c._id)
            };
        });
    }, [conversations, activeConversationId, mongoUserId, onSelectConversation]);

    // Filter items based on user query and prefix syntax
    const filteredItems = useMemo(() => {
        const trimmed = query.trim().toLowerCase();
        
        // Mode prefix: ">" commands only
        if (trimmed.startsWith('>')) {
            const sub = trimmed.slice(1).trim();
            if (!sub) return defaultActions;
            return defaultActions.filter(a => 
                a.title.toLowerCase().includes(sub) || 
                a.subtitle.toLowerCase().includes(sub) ||
                a.category.toLowerCase().includes(sub)
            );
        }

        // Mode prefix: "#" channels only
        if (trimmed.startsWith('#')) {
            const sub = trimmed.slice(1).trim();
            const channels = conversationItems.filter(i => i.type === 'channel');
            if (!sub) return channels;
            return channels.filter(c => c.title.toLowerCase().includes(sub));
        }

        // Mode prefix: "@" users only
        if (trimmed.startsWith('@')) {
            const sub = trimmed.slice(1).trim();
            const dms = conversationItems.filter(i => i.type === 'dm');
            if (!sub) return dms;
            return dms.filter(d => 
                d.title.toLowerCase().includes(sub) || 
                d.subtitle.toLowerCase().includes(sub)
            );
        }

        if (!trimmed) {
            // Default top suggestions: first 4 actions + all conversations
            return [
                ...defaultActions.slice(0, 5),
                ...conversationItems.slice(0, 8)
            ];
        }

        // Full search across actions and conversations
        const matchedActions = defaultActions.filter(a => 
            a.title.toLowerCase().includes(trimmed) || 
            a.subtitle.toLowerCase().includes(trimmed) ||
            a.category.toLowerCase().includes(trimmed)
        );

        const matchedConversations = conversationItems.filter(c => 
            c.title.toLowerCase().includes(trimmed) || 
            c.subtitle.toLowerCase().includes(trimmed)
        );

        return [...matchedActions, ...matchedConversations];
    }, [query, defaultActions, conversationItems]);

    // Keep selected index within bounds
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
            scrollSelectedIntoView((selectedIndex + 1) % Math.max(1, filteredItems.length));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
            scrollSelectedIntoView((selectedIndex - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const item = filteredItems[selectedIndex];
            if (item) {
                item.handler();
                onClose();
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    };

    const scrollSelectedIntoView = (index) => {
        if (!listRef.current) return;
        const items = listRef.current.querySelectorAll('[data-command-item]');
        if (items[index]) {
            items[index].scrollIntoView({ block: 'nearest' });
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99999,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: '12vh',
                backgroundColor: 'rgba(0, 0, 0, 0.72)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                animation: 'devsupFadeIn 0.15s ease-out'
            }}
            onClick={onClose}
        >
            <div 
                style={{
                    width: '100%',
                    maxWidth: '620px',
                    margin: '0 16px',
                    backgroundColor: '#0F172A',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65), 0 0 30px rgba(6, 182, 212, 0.15)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '75vh'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search Bar Input */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)'
                }}>
                    <Search size={20} color="var(--colors-accent, #06B6D4)" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search chats, #channels, @developers, or > commands..."
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: '#F8FAFC',
                            fontSize: '1rem',
                            fontWeight: '500',
                            letterSpacing: '-0.2px'
                        }}
                    />
                    {query ? (
                        <button
                            type="button"
                            onClick={() => setQuery('')}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#94A3B8',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <X size={16} />
                        </button>
                    ) : (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 7px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#94A3B8',
                            fontSize: '0.72rem',
                            fontWeight: '600'
                        }}>
                            ESC
                        </div>
                    )}
                </div>

                {/* Filter tags pill bar */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    fontSize: '0.72rem',
                    color: '#94A3B8'
                }}>
                    <span style={{ fontWeight: '600', color: '#64748B', marginRight: '4px' }}>Hints:</span>
                    <button
                        type="button"
                        onClick={() => { setQuery('> '); inputRef.current?.focus(); }}
                        style={{
                            background: query.startsWith('>') ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.04)',
                            border: '1px solid ' + (query.startsWith('>') ? '#06B6D4' : 'rgba(255,255,255,0.08)'),
                            color: query.startsWith('>') ? '#06B6D4' : '#94A3B8',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.72rem'
                        }}
                    >
                        &gt; Actions
                    </button>
                    <button
                        type="button"
                        onClick={() => { setQuery('# '); inputRef.current?.focus(); }}
                        style={{
                            background: query.startsWith('#') ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.04)',
                            border: '1px solid ' + (query.startsWith('#') ? '#06B6D4' : 'rgba(255,255,255,0.08)'),
                            color: query.startsWith('#') ? '#06B6D4' : '#94A3B8',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.72rem'
                        }}
                    >
                        # Channels
                    </button>
                    <button
                        type="button"
                        onClick={() => { setQuery('@ '); inputRef.current?.focus(); }}
                        style={{
                            background: query.startsWith('@') ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.04)',
                            border: '1px solid ' + (query.startsWith('@') ? '#06B6D4' : 'rgba(255,255,255,0.08)'),
                            color: query.startsWith('@') ? '#06B6D4' : '#94A3B8',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.72rem'
                        }}
                    >
                        @ Developers
                    </button>
                </div>

                {/* Results List */}
                <div 
                    ref={listRef}
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '8px'
                    }}
                >
                    {filteredItems.length === 0 ? (
                        <div style={{
                            padding: '36px 20px',
                            textAlign: 'center',
                            color: '#94A3B8',
                            fontSize: '0.9rem'
                        }}>
                            <Terminal size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                            <div>No commands or conversations matching &ldquo;{query}&rdquo;</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px' }}>
                                Try searching for pair programming, whiteboard, audio huddles, or specific contacts.
                            </div>
                        </div>
                    ) : (
                        filteredItems.map((item, index) => {
                            const isSelected = index === selectedIndex;
                            const IconComponent = item.icon || Terminal;

                            return (
                                <div
                                    key={item.id}
                                    data-command-item
                                    onClick={() => {
                                        item.handler();
                                        onClose();
                                    }}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '10px 14px',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                                        border: isSelected ? '1px solid rgba(6, 182, 212, 0.35)' : '1px solid transparent',
                                        transition: 'all 0.12s ease'
                                    }}
                                >
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: isSelected ? 'var(--colors-accent, #06B6D4)' : 'rgba(255, 255, 255, 0.05)',
                                        color: isSelected ? '#000000' : 'var(--colors-accent, #06B6D4)',
                                        flexShrink: 0
                                    }}>
                                        <IconComponent size={17} />
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <span style={{
                                                fontSize: '0.92rem',
                                                fontWeight: '600',
                                                color: isSelected ? '#FFFFFF' : '#E2E8F0',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {item.title}
                                            </span>
                                            {item.isActive && (
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    fontWeight: '700',
                                                    padding: '1px 6px',
                                                    borderRadius: '4px',
                                                    backgroundColor: 'rgba(6, 182, 212, 0.2)',
                                                    color: '#06B6D4'
                                                }}>
                                                    ACTIVE
                                                </span>
                                            )}
                                        </div>
                                        <div style={{
                                            fontSize: '0.78rem',
                                            color: isSelected ? '#94A3B8' : '#64748B',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            marginTop: '2px'
                                        }}>
                                            {item.subtitle}
                                        </div>
                                    </div>

                                    {item.shortcut ? (
                                        <span style={{
                                            fontSize: '0.68rem',
                                            fontWeight: '700',
                                            letterSpacing: '0.5px',
                                            color: '#94A3B8',
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)'
                                        }}>
                                            {item.shortcut}
                                        </span>
                                    ) : (
                                        <span style={{
                                            fontSize: '0.7rem',
                                            color: '#64748B',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            fontWeight: '600'
                                        }}>
                                            {item.category}
                                        </span>
                                    )}

                                    {isSelected && (
                                        <CornerDownLeft size={14} color="#06B6D4" style={{ flexShrink: 0, marginLeft: '4px' }} />
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Navigation Hints */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    fontSize: '0.75rem',
                    color: '#64748B'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <kbd style={{ padding: '2px 5px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.06)', color: '#CBD5E1', fontSize: '0.7rem' }}>↑</kbd>
                            <kbd style={{ padding: '2px 5px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.06)', color: '#CBD5E1', fontSize: '0.7rem' }}>↓</kbd>
                            to navigate
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <kbd style={{ padding: '2px 5px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.06)', color: '#CBD5E1', fontSize: '0.7rem' }}>↵</kbd>
                            to select
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <kbd style={{ padding: '2px 5px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.06)', color: '#CBD5E1', fontSize: '0.7rem' }}>esc</kbd>
                            to close
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--colors-accent, #06B6D4)', fontWeight: '600' }}>
                        <span>DevSup Command Palette</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

