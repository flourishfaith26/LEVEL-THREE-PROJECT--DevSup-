import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
    Plus, Camera, Edit3, MoreVertical, Search, X, ChevronDown, ChevronUp, 
    Eye, Trash2, Lock, Shield, VolumeX, Volume2, Check
} from 'lucide-react';
import { getAvatarUrl } from '../utils/defaultAvatar.js';

export const isSameUser = (u1, u2) => {
    if (!u1 || !u2) return false;
    const id1 = String(u1?._id || u1);
    const id2 = String(u2?._id || u2);
    return id1 !== '' && id1 === id2;
};

export const formatStatusTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / (1000 * 3600 * 24));
    const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    
    if (diffDays === 0) {
        return `Today at ${timeStr}`;
    } else if (diffDays === 1) {
        return `Yesterday at ${timeStr}`;
    } else {
        const dateStr = date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' });
        return `${dateStr} at ${timeStr}`;
    }
};

/**
 * WhatsApp Segmented SVG Status Ring
 * Divides circle into segments based on status count.
 */
export const SegmentedStatusRing = ({
    count = 1,
    statuses = [],
    currentUserId,
    size = 54,
    strokeWidth = 2.5,
    children
}) => {
    if (!count || count <= 0) {
        return (
            <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {children}
            </div>
        );
    }

    const radius = (size - strokeWidth * 2) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;

    // Single status: continuous circle
    if (count === 1) {
        const isViewed = statuses[0]?.viewers?.some(v => isSameUser(v, currentUserId));
        const color = isViewed ? '#8696a0' : 'var(--colors-accent, #00a884)';
        return (
            <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />
                </svg>
                {children}
            </div>
        );
    }

    // Multiple statuses: segmented arc ring with gaps
    const gapDeg = count <= 3 ? 12 : count <= 6 ? 8 : 5;
    const totalGapDeg = count * gapDeg;
    const arcDeg = (360 - totalGapDeg) / count;
    const arcLength = (arcDeg / 360) * circumference;
    const gapLength = circumference - arcLength;

    return (
        <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', transform: 'rotate(-90deg)' }}>
                {Array.from({ length: count }).map((_, i) => {
                    const status = statuses[i];
                    const isViewed = status?.viewers?.some(v => isSameUser(v, currentUserId));
                    const color = isViewed ? '#8696a0' : 'var(--colors-accent, #00a884)';
                    const rotation = i * (arcDeg + gapDeg) + (gapDeg / 2);

                    return (
                        <circle
                            key={i}
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="none"
                            stroke={color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${arcLength} ${gapLength}`}
                            strokeDashoffset={0}
                            strokeLinecap="round"
                            transform={`rotate(${rotation} ${center} ${center})`}
                        />
                    );
                })}
            </svg>
            {children}
        </div>
    );
};

export default function StatusSection({
    groupedStatuses = [],
    myGroupedStatuses,
    otherGroupedStatuses = [],
    mongoUserId,
    currentUserData,
    onOpenStory,
    onOpenCreateStatus, // (mode: 'text' | 'media') => void
    onDeleteStatus,
    onForwardStatus,
    onReshareStatus,
    formatMessageTime,
    isMobileViewport,
    showToast
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isViewedExpanded, setIsViewedExpanded] = useState(true);
    const [isMutedExpanded, setIsMutedExpanded] = useState(false);
    const [isMyStatusesModalOpen, setIsMyStatusesModalOpen] = useState(false);
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
    const [viewersModalStatus, setViewersModalStatus] = useState(null);
    const [privacySetting, setPrivacySetting] = useState(() => {
        try {
            return localStorage.getItem('devsup_status_privacy') || 'contacts';
        } catch {
            return 'contacts';
        }
    });
    const [mutedUserIds, setMutedUserIds] = useState(() => {
        try {
            const parsed = JSON.parse(localStorage.getItem('devsup_muted_status_users') || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    });

    const searchInputRef = useRef(null);

    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchOpen]);

    const handleToggleMute = (userId, userName) => {
        if (!userId) return;
        const uidStr = String(userId);
        setMutedUserIds(prev => {
            const arr = Array.isArray(prev) ? prev : [];
            const exists = arr.includes(uidStr);
            const next = exists ? arr.filter(id => id !== uidStr) : [...arr, uidStr];
            try {
                localStorage.setItem('devsup_muted_status_users', JSON.stringify(next));
            } catch (e) {
                console.error(e);
            }
            showToast?.(exists ? `Unmuted ${userName || 'contact'}'s status updates` : `Muted ${userName || 'contact'}'s status updates`);
            return next;
        });
    };

    const handleSavePrivacy = (val) => {
        setPrivacySetting(val);
        try {
            localStorage.setItem('devsup_status_privacy', val);
        } catch (e) {
            console.error(e);
        }
        setIsPrivacyModalOpen(false);
        showToast?.('Status privacy updated');
    };

    // Comprehensive search across contacts and status content
    const filteredOtherStatuses = useMemo(() => {
        if (!Array.isArray(otherGroupedStatuses)) return [];
        if (!searchQuery.trim()) return otherGroupedStatuses;
        const q = searchQuery.toLowerCase().trim();
        return otherGroupedStatuses.filter(g => {
            const user = g?.user;
            const displayName = String(user?.displayName || '').toLowerCase();
            const name = String(user?.name || '').toLowerCase();
            const username = String(user?.username || '').toLowerCase();
            const nickname = String(user?.nickname || '').toLowerCase();
            const email = String(user?.email || '').toLowerCase();
            if (displayName.includes(q) || name.includes(q) || username.includes(q) || nickname.includes(q) || email.includes(q)) {
                return true;
            }
            const statuses = Array.isArray(g?.statuses) ? g.statuses : [];
            return statuses.some(s => 
                (typeof s?.content === 'string' && s.content.toLowerCase().includes(q)) ||
                (typeof s?.caption === 'string' && s.caption.toLowerCase().includes(q))
            );
        });
    }, [otherGroupedStatuses, searchQuery]);

    const myMatchesSearch = useMemo(() => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        if ('my status'.includes(q) || 'you'.includes(q) || 'me'.includes(q)) return true;
        const displayName = String(currentUserData?.displayName || '').toLowerCase();
        const username = String(currentUserData?.username || '').toLowerCase();
        if (displayName.includes(q) || username.includes(q)) return true;
        const statuses = Array.isArray(myGroupedStatuses?.statuses) ? myGroupedStatuses.statuses : [];
        return statuses.some(s => 
            (typeof s?.content === 'string' && s.content.toLowerCase().includes(q)) ||
            (typeof s?.caption === 'string' && s.caption.toLowerCase().includes(q))
        );
    }, [searchQuery, currentUserData, myGroupedStatuses]);

    // Partition into Recent, Viewed, and Muted
    const { recentUpdates, viewedUpdates, mutedUpdates } = useMemo(() => {
        const recent = [];
        const viewed = [];
        const muted = [];
        const safeMuted = Array.isArray(mutedUserIds) ? mutedUserIds : [];

        filteredOtherStatuses.forEach(group => {
            if (!group || !group.user) return;
            const uidStr = String(group.user?._id || group.user);
            if (safeMuted.includes(uidStr)) {
                muted.push(group);
                return;
            }
            const allViewed = (group.statuses || []).length > 0 && group.statuses.every(s => 
                s.viewers && s.viewers.some(v => isSameUser(v, mongoUserId))
            );
            if (allViewed) {
                viewed.push(group);
            } else {
                recent.push(group);
            }
        });

        return { recentUpdates: recent, viewedUpdates: viewed, mutedUpdates: muted };
    }, [filteredOtherStatuses, mutedUserIds, mongoUserId]);

    const myActiveStatuses = Array.isArray(myGroupedStatuses?.statuses) ? myGroupedStatuses.statuses : [];
    const myTotalStatuses = myActiveStatuses.length;
    const lastMyStatus = myTotalStatuses > 0 ? myActiveStatuses[myTotalStatuses - 1] : null;

    const myIndexInGrouped = useMemo(() => {
        if (!Array.isArray(groupedStatuses)) return -1;
        return groupedStatuses.findIndex(g => isSameUser(g?.user, mongoUserId));
    }, [groupedStatuses, mongoUserId]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            width: '100%',
            overflowY: 'auto',
            position: 'relative',
            backgroundColor: 'var(--colors-bg)'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px 20px 12px',
                borderBottom: '1px solid var(--colors-border)',
                backgroundColor: 'var(--colors-surface)',
                position: 'sticky',
                top: 0,
                zIndex: 20
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: '700', color: 'var(--colors-textMain)', letterSpacing: '-0.3px' }}>
                        Status
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {/* Search Toggle */}
                        <button
                            type="button"
                            onClick={() => {
                                setIsSearchOpen(!isSearchOpen);
                                if (isSearchOpen) setSearchQuery('');
                            }}
                            title="Search statuses"
                            style={{
                                background: isSearchOpen ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                border: 'none',
                                color: isSearchOpen ? 'var(--colors-accent)' : 'var(--colors-textMuted)',
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Search size={19} />
                        </button>

                        {/* New Status Button */}
                        <button
                            type="button"
                            onClick={() => onOpenCreateStatus?.('media')}
                            title="New status"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--colors-textMuted)',
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--colors-textMain)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--colors-textMuted)'}
                        >
                            <Plus size={20} />
                        </button>

                        {/* 3-dots Menu */}
                        <div style={{ position: 'relative' }}>
                            <button
                                type="button"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                title="Status options"
                                style={{
                                    background: isMenuOpen ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                    border: 'none',
                                    color: 'var(--colors-textMuted)',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <MoreVertical size={19} />
                            </button>

                            {isMenuOpen && (
                                <>
                                    <div
                                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1999 }}
                                        onClick={() => setIsMenuOpen(false)}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        marginTop: '8px',
                                        backgroundColor: '#1f2c34',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
                                        padding: '6px 0',
                                        minWidth: '180px',
                                        zIndex: 2000
                                    }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsPrivacyModalOpen(true);
                                                setIsMenuOpen(false);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                width: '100%',
                                                padding: '10px 16px',
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#e9edef',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer',
                                                textAlign: 'left'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <Shield size={16} color="var(--colors-accent)" />
                                            Status privacy
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Collapsible Search Input */}
                {isSearchOpen && (
                    <div style={{ marginTop: '12px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--colors-textMuted)', pointerEvents: 'none' }} />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search contacts' statuses..."
                            style={{
                                width: '100%',
                                padding: '8px 36px 8px 38px',
                                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid var(--colors-border)',
                                borderRadius: '18px',
                                color: 'var(--colors-textMain)',
                                fontSize: '0.88rem',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--colors-textMuted)',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                <X size={15} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* My Status Row */}
            {myMatchesSearch && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 20px',
                        borderBottom: '1px solid var(--colors-border)',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        position: 'relative'
                    }}
                    onClick={() => {
                        if (myTotalStatuses > 0 && myIndexInGrouped !== -1) {
                            onOpenStory?.(myIndexInGrouped);
                        } else {
                            onOpenCreateStatus?.('media');
                        }
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                        <div style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <SegmentedStatusRing
                                count={myTotalStatuses}
                                statuses={myActiveStatuses}
                                currentUserId={mongoUserId}
                                size={52}
                                strokeWidth={2.5}
                            >
                                <div style={{ width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden' }}>
                                    <img
                                        src={getAvatarUrl(currentUserData?.avatarUrl)}
                                        alt="My avatar"
                                        onError={e => { e.currentTarget.src = '/default-avatar.svg'; }}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                            </SegmentedStatusRing>
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenCreateStatus?.('media');
                                }}
                                title="Add status update"
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--colors-accent, #00a884)',
                                    border: '2px solid var(--colors-surface, #111b21)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    zIndex: 10,
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
                                }}
                            >
                                <Plus size={13} strokeWidth={3} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--colors-textMain)' }}>
                                My status
                            </span>
                            <span style={{ fontSize: '0.82rem', color: 'var(--colors-textMuted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                                {myTotalStatuses > 0 
                                    ? (lastMyStatus ? formatStatusTime(lastMyStatus.createdAt) : 'Tap to view status')
                                    : 'Tap to add status update'}
                            </span>
                        </div>
                    </div>

                    {/* Right side actions for My Status */}
                    {myTotalStatuses > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={e => e.stopPropagation()}>
                            <button
                                type="button"
                                onClick={() => setIsMyStatusesModalOpen(true)}
                                title="Manage my statuses"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    border: 'none',
                                    color: 'var(--colors-textMuted)',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = 'var(--colors-textMuted)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
                            >
                                <MoreVertical size={16} />
                            </button>
                        </div>
                    ) : (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenCreateStatus?.('media');
                            }}
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(0, 168, 132, 0.12)',
                                color: 'var(--colors-accent, #00a884)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <Plus size={18} strokeWidth={2.5} />
                        </div>
                    )}
                </div>
            )}

            {/* Empty Search Results */}
            {searchQuery.trim() && !myMatchesSearch && recentUpdates.length === 0 && viewedUpdates.length === 0 && mutedUpdates.length === 0 && (
                <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--colors-textMuted)' }}>
                    <Search size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
                    <div style={{ fontSize: '0.95rem', color: 'var(--colors-textMain)', fontWeight: 500, marginBottom: '4px' }}>
                        No status updates found
                    </div>
                    <div style={{ fontSize: '0.82rem', marginBottom: '16px' }}>
                        No contacts or updates matching "{searchQuery}"
                    </div>
                    <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        style={{
                            padding: '6px 14px',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            border: 'none',
                            borderRadius: '16px',
                            color: 'var(--colors-accent)',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                        }}
                    >
                        Clear search
                    </button>
                </div>
            )}

            {/* Recent Updates Section */}
            {(recentUpdates.length > 0 || !searchQuery) && (
                <>
                    <div style={{ padding: '16px 20px 8px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--colors-textMuted)' }}>
                            Recent
                        </span>
                    </div>

                    {recentUpdates.length === 0 ? (
                        <div style={{ padding: '16px 20px', color: 'var(--colors-textMuted)', fontSize: '0.88rem', textAlign: 'center' }}>
                            No recent updates right now.
                        </div>
                    ) : (
                        recentUpdates.map(group => {
                            const groupIndex = groupedStatuses.findIndex(g => isSameUser(g?.user, group?.user));
                            const lastStatus = (group.statuses || [])[group.statuses?.length - 1];

                            return (
                                <div
                                    key={group.user?._id || Math.random()}
                                    onClick={() => {
                                        if (groupIndex !== -1) onOpenStory?.(groupIndex);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 20px',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.03)'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                                        <SegmentedStatusRing
                                            count={group.statuses?.length || 1}
                                            statuses={group.statuses || []}
                                            currentUserId={mongoUserId}
                                            size={52}
                                            strokeWidth={2.5}
                                        >
                                            <img
                                                src={getAvatarUrl(group.user?.avatarUrl)}
                                                alt={group.user?.displayName || 'Avatar'}
                                                style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                        </SegmentedStatusRing>

                                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                            <span style={{ fontSize: '0.98rem', fontWeight: '600', color: 'var(--colors-textMain)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {group.user?.displayName || 'Contact'}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--colors-textMuted)', marginTop: '2px' }}>
                                                {formatStatusTime(lastStatus?.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleMute(group.user?._id || group.user, group.user?.displayName);
                                        }}
                                        title="Mute status updates"
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--colors-textMuted)',
                                            cursor: 'pointer',
                                            padding: '6px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            opacity: 0.6
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = '#ef4444'; }}
                                        onMouseLeave={e => { e.currentTarget.style.opacity = 0.6; e.currentTarget.style.color = 'var(--colors-textMuted)'; }}
                                    >
                                        <VolumeX size={16} />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </>
            )}

            {/* Viewed Updates Section (Collapsible Accordion) */}
            {viewedUpdates.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                    <div
                        onClick={() => setIsViewedExpanded(!isViewedExpanded)}
                        style={{
                            padding: '12px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            userSelect: 'none',
                            backgroundColor: 'rgba(255, 255, 255, 0.02)'
                        }}
                    >
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--colors-textMuted)' }}>
                            Viewed ({viewedUpdates.length})
                        </span>
                        {isViewedExpanded ? <ChevronUp size={18} color="var(--colors-textMuted)" /> : <ChevronDown size={18} color="var(--colors-textMuted)" />}
                    </div>

                    {(isViewedExpanded || !!searchQuery) && viewedUpdates.map(group => {
                        const groupIndex = groupedStatuses.findIndex(g => isSameUser(g?.user, group?.user));
                        const lastStatus = (group.statuses || [])[group.statuses?.length - 1];

                        return (
                            <div
                                key={group.user?._id || Math.random()}
                                onClick={() => {
                                    if (groupIndex !== -1) onOpenStory?.(groupIndex);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 20px',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.03)'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                                    <SegmentedStatusRing
                                        count={group.statuses?.length || 1}
                                        statuses={group.statuses || []}
                                        currentUserId={mongoUserId}
                                        size={52}
                                        strokeWidth={2.5}
                                    >
                                        <img
                                            src={getAvatarUrl(group.user?.avatarUrl)}
                                            alt={group.user?.displayName || 'Avatar'}
                                            style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', opacity: 0.8 }}
                                        />
                                    </SegmentedStatusRing>

                                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                        <span style={{ fontSize: '0.98rem', fontWeight: '500', color: 'rgba(255, 255, 255, 0.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {group.user?.displayName || 'Contact'}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--colors-textMuted)', marginTop: '2px' }}>
                                            {formatStatusTime(lastStatus?.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleMute(group.user?._id || group.user, group.user?.displayName);
                                    }}
                                    title="Mute status updates"
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--colors-textMuted)',
                                        cursor: 'pointer',
                                        padding: '6px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        opacity: 0.6
                                    }}
                                >
                                    <VolumeX size={16} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Muted Updates Section (Collapsible Accordion) */}
            {mutedUpdates.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                    <div
                        onClick={() => setIsMutedExpanded(!isMutedExpanded)}
                        style={{
                            padding: '12px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            userSelect: 'none',
                            backgroundColor: 'rgba(255, 255, 255, 0.02)'
                        }}
                    >
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--colors-textMuted)' }}>
                            Muted ({mutedUpdates.length})
                        </span>
                        {isMutedExpanded ? <ChevronUp size={18} color="var(--colors-textMuted)" /> : <ChevronDown size={18} color="var(--colors-textMuted)" />}
                    </div>

                    {(isMutedExpanded || !!searchQuery) && mutedUpdates.map(group => {
                        const groupIndex = groupedStatuses.findIndex(g => isSameUser(g?.user, group?.user));
                        const lastStatus = (group.statuses || [])[group.statuses?.length - 1];

                        return (
                            <div
                                key={group.user?._id || Math.random()}
                                onClick={() => {
                                    if (groupIndex !== -1) onOpenStory?.(groupIndex);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 20px',
                                    cursor: 'pointer',
                                    opacity: 0.6
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                                    <SegmentedStatusRing
                                        count={group.statuses?.length || 1}
                                        statuses={group.statuses || []}
                                        currentUserId={mongoUserId}
                                        size={52}
                                        strokeWidth={2.5}
                                    >
                                        <img
                                            src={getAvatarUrl(group.user?.avatarUrl)}
                                            alt={group.user?.displayName || 'Avatar'}
                                            style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                                        />
                                    </SegmentedStatusRing>

                                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                        <span style={{ fontSize: '0.98rem', fontWeight: '500', color: 'var(--colors-textMain)' }}>
                                            {group.user?.displayName || 'Contact'}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--colors-textMuted)', marginTop: '2px' }}>
                                            {formatStatusTime(lastStatus?.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleMute(group.user?._id || group.user, group.user?.displayName);
                                    }}
                                    title="Unmute status updates"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        border: 'none',
                                        color: 'var(--colors-accent)',
                                        padding: '6px 12px',
                                        borderRadius: '16px',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                        fontWeight: 600
                                    }}
                                >
                                    Unmute
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Bottom Security Note */}
            <div style={{
                padding: '28px 20px 40px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'var(--colors-textMuted)',
                fontSize: '0.78rem'
            }}>
                <Lock size={13} color="var(--colors-accent)" />
                <span>Your status updates are end-to-end encrypted</span>
            </div>

            {/* Floating Action Buttons (FAB) for Mobile Viewports */}
            {isMobileViewport && (
                <div style={{
                    position: 'fixed',
                    bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
                    right: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    zIndex: 100
                }}>
                    {/* Secondary FAB: Text Status */}
                    <button
                        type="button"
                        onClick={() => onOpenCreateStatus?.('text')}
                        title="New text status"
                        style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            backgroundColor: '#202c33',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#e9edef',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                            cursor: 'pointer',
                            transition: 'transform 0.15s ease'
                        }}
                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
                        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <Edit3 size={19} />
                    </button>

                    {/* Primary FAB: Media Camera Status */}
                    <button
                        type="button"
                        onClick={() => onOpenCreateStatus?.('media')}
                        title="New photo/video status"
                        style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            backgroundColor: '#00a884',
                            border: 'none',
                            color: '#111b21',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 6px 16px rgba(0, 168, 132, 0.35)',
                            cursor: 'pointer',
                            transition: 'transform 0.15s ease'
                        }}
                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
                        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <Camera size={24} color="#111b21" strokeWidth={2.2} />
                    </button>
                </div>
            )}

            {/* "My Status Updates" Modal Sheet */}
            {isMyStatusesModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(6px)',
                    zIndex: 10005,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: '#1f2c34',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '20px',
                        width: '100%',
                        maxWidth: '460px',
                        maxHeight: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            padding: '18px 24px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#e9edef', fontWeight: 600 }}>
                                    My status updates
                                </h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#8696a0' }}>
                                    {myTotalStatuses} active update{myTotalStatuses !== 1 ? 's' : ''} (expires in 24 hours)
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsMyStatusesModalOpen(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#8696a0',
                                    cursor: 'pointer',
                                    padding: '6px'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
                            {myActiveStatuses.map((status) => {
                                const actualViewers = (status.viewers || []).filter(v => !isSameUser(v, mongoUserId));

                                return (
                                    <div
                                        key={status._id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '12px 24px',
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                                            {/* Preview Thumbnail */}
                                            <div style={{
                                                width: '46px',
                                                height: '46px',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                backgroundColor: status.type === 'text' ? (status.backgroundColor || '#1E2B3C') : '#000',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                {status.type === 'text' ? (
                                                    <span style={{ fontSize: '9px', color: '#fff', textAlign: 'center', padding: '4px', overflow: 'hidden' }}>
                                                        {status.content.slice(0, 30)}
                                                    </span>
                                                ) : (
                                                    <img src={status.content} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                                <span style={{ fontSize: '0.9rem', color: '#e9edef', fontWeight: 500 }}>
                                                    {formatMessageTime?.(status.createdAt, true)}
                                                </span>
                                                {/* Viewers trigger */}
                                                <div
                                                    onClick={() => setViewersModalStatus(status)}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        color: 'var(--colors-accent, #00a884)',
                                                        fontSize: '0.8rem',
                                                        cursor: 'pointer',
                                                        marginTop: '4px'
                                                    }}
                                                >
                                                    <Eye size={14} />
                                                    <span>{actualViewers.length} view{actualViewers.length !== 1 ? 's' : ''}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Delete action */}
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (window.confirm('Delete this status update? It will be removed for everyone.')) {
                                                    await onDeleteStatus?.(status._id);
                                                    showToast?.('Status update deleted');
                                                }
                                            }}
                                            title="Delete update"
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                                padding: '8px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <Trash2 size={17} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{
                            padding: '14px 24px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            gap: '10px'
                        }}>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsMyStatusesModalOpen(false);
                                    onOpenCreateStatus?.('media');
                                }}
                                style={{
                                    flex: 1,
                                    padding: '10px 16px',
                                    backgroundColor: '#00a884',
                                    border: 'none',
                                    borderRadius: '24px',
                                    color: '#111b21',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Plus size={16} strokeWidth={2.5} />
                                Add update
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Viewers List Modal */}
            {viewersModalStatus && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(6px)',
                    zIndex: 10010,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: '#1f2c34',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '20px',
                        width: '100%',
                        maxWidth: '400px',
                        maxHeight: '70vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e9edef', fontWeight: 600 }}>
                                <Eye size={18} color="var(--colors-accent)" />
                                <span>Viewed by {((viewersModalStatus.viewers || []).filter(v => !isSameUser(v, mongoUserId))).length}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewersModalStatus(null)}
                                style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
                            {((viewersModalStatus.viewers || []).filter(v => !isSameUser(v, mongoUserId))).length === 0 ? (
                                <div style={{ padding: '32px 20px', textAlign: 'center', color: '#8696a0', fontSize: '0.88rem' }}>
                                    No views yet. When contacts view your status, they will appear here.
                                </div>
                            ) : (
                                (viewersModalStatus.viewers || [])
                                    .filter(v => !isSameUser(v, mongoUserId))
                                    .map(viewer => (
                                        <div
                                            key={viewer._id || viewer}
                                            style={{
                                                padding: '10px 20px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
                                            }}
                                        >
                                            <img
                                                src={getAvatarUrl(viewer.avatarUrl)}
                                                alt={viewer.displayName || 'Contact'}
                                                onError={e => { e.currentTarget.src = '/default-avatar.svg'; }}
                                                style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '0.92rem', color: '#e9edef', fontWeight: 500 }}>
                                                    {viewer.displayName || 'Unknown Contact'}
                                                </span>
                                                {viewer.username && (
                                                    <span style={{ fontSize: '0.78rem', color: '#8696a0' }}>
                                                        @{viewer.username}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Status Privacy Modal */}
            {isPrivacyModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(6px)',
                    zIndex: 10010,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: '#1f2c34',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '20px',
                        width: '100%',
                        maxWidth: '420px',
                        padding: '24px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                        color: '#e9edef'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Status privacy</h3>
                            <button
                                type="button"
                                onClick={() => setIsPrivacyModalOpen(false)}
                                style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#8696a0', lineHeight: 1.45 }}>
                            Who can see my status updates:
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                            {[
                                { id: 'contacts', title: 'My contacts', desc: 'Share updates with all your contacts' },
                                { id: 'except', title: 'My contacts except...', desc: 'Hide status updates from specific contacts' },
                                { id: 'only', title: 'Only share with...', desc: 'Only selected contacts can see your updates' }
                            ].map(opt => (
                                <label
                                    key={opt.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '12px',
                                        cursor: 'pointer',
                                        padding: '10px 12px',
                                        borderRadius: '12px',
                                        backgroundColor: privacySetting === opt.id ? 'rgba(0, 168, 132, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                                        border: privacySetting === opt.id ? '1px solid #00a884' : '1px solid transparent'
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="status_privacy"
                                        checked={privacySetting === opt.id}
                                        onChange={() => setPrivacySetting(opt.id)}
                                        style={{ marginTop: '3px', accentColor: '#00a884' }}
                                    />
                                    <div>
                                        <div style={{ fontSize: '0.92rem', fontWeight: 500, color: '#e9edef' }}>{opt.title}</div>
                                        <div style={{ fontSize: '0.78rem', color: '#8696a0', marginTop: '2px' }}>{opt.desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <p style={{ margin: '0 0 24px 0', fontSize: '0.75rem', color: '#8696a0', lineHeight: 1.4 }}>
                            Changes to your privacy settings will only apply to status updates you share after this change.
                        </p>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={() => setIsPrivacyModalOpen(false)}
                                style={{
                                    flex: 1,
                                    padding: '10px 16px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    border: 'none',
                                    borderRadius: '24px',
                                    color: '#e9edef',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSavePrivacy(privacySetting)}
                                style={{
                                    flex: 1,
                                    padding: '10px 16px',
                                    backgroundColor: '#00a884',
                                    border: 'none',
                                    borderRadius: '24px',
                                    color: '#111b21',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
