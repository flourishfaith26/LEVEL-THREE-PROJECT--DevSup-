import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, Users, Hash, X, Check, Copy, ArrowRight, 
    Sparkles, Compass, Shield, Terminal, Share2
} from 'lucide-react';

export default function CommunityDirectoryModal({
    isOpen,
    onClose,
    BACKEND_URL,
    getAccessTokenSilently,
    currentUserConversations = [],
    onOpenConversation,
    showToast
}) {
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState('all');
    const [joiningId, setJoiningId] = useState(null);
    const [copiedCode, setCopiedCode] = useState(null);

    // Fetch public communities
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        async function fetchPublic() {
            setLoading(true);
            try {
                const res = await fetch(`${BACKEND_URL}/api/conversations/public`);
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted) setCommunities(data);
                }
            } catch (err) {
                console.error('Error fetching public communities:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchPublic();
        return () => { isMounted = false; };
    }, [isOpen, BACKEND_URL]);

    // Set of IDs the user is already a member of
    const joinedConversationIds = useMemo(() => {
        return new Set(currentUserConversations.map(c => String(c._id)));
    }, [currentUserConversations]);

    // Unique tags across all communities
    const availableTags = useMemo(() => {
        const tagSet = new Set(['all']);
        communities.forEach(c => {
            if (c.tags && Array.isArray(c.tags)) {
                c.tags.forEach(t => tagSet.add(t.toLowerCase()));
            }
        });
        return Array.from(tagSet);
    }, [communities]);

    // Filtered list
    const filteredCommunities = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return communities.filter(c => {
            const matchesQuery = !query || 
                (c.name && c.name.toLowerCase().includes(query)) ||
                (c.description && c.description.toLowerCase().includes(query)) ||
                (c.tags && c.tags.some(t => t.toLowerCase().includes(query)));

            const matchesTag = selectedTag === 'all' || 
                (c.tags && c.tags.map(t => t.toLowerCase()).includes(selectedTag));

            return matchesQuery && matchesTag;
        });
    }, [communities, searchQuery, selectedTag]);

    // Join action
    const handleJoin = async (community) => {
        if (joinedConversationIds.has(String(community._id))) {
            onOpenConversation?.(community._id);
            onClose();
            return;
        }

        setJoiningId(community._id);
        try {
            const token = await getAccessTokenSilently();
            const inviteCode = community.inviteCode || `devsup-${community._id}`;
            const res = await fetch(`${BACKEND_URL}/api/conversations/join/${inviteCode}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                showToast?.(`Joined #${community.name}!`);
                onOpenConversation?.(community._id);
                onClose();
            } else {
                showToast?.('Could not join community.');
            }
        } catch (err) {
            console.error('Join error:', err);
            showToast?.('Error joining community.');
        } finally {
            setJoiningId(null);
        }
    };

    const handleCopyInviteLink = (e, community) => {
        e.stopPropagation();
        const origin = window.location.origin;
        const code = community.inviteCode || `devsup-${community._id}`;
        const url = `${origin}/join/${code}`;
        navigator.clipboard.writeText(url);
        setCopiedCode(community._id);
        showToast?.('Invite link copied to clipboard!');
        setTimeout(() => setCopiedCode(null), 2000);
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            padding: '20px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '740px',
                maxHeight: '85vh',
                backgroundColor: '#0B1120',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(6, 182, 212, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Compass size={24} color="#06B6D4" />
                        <div>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: '#FFF' }}>
                                Explore Public Developer Communities
                            </h2>
                            <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '2px' }}>
                                Discover active engineering channels, ask architectural questions, and connect with developers worldwide.
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: '#94A3B8',
                            padding: '6px',
                            cursor: 'pointer',
                            display: 'flex'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Search Bar & Tag Filters */}
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        padding: '10px 14px'
                    }}>
                        <Search size={18} color="#06B6D4" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter by keyword (e.g. algorithms, rust, react, system design)..."
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                color: '#FFF',
                                fontSize: '0.92rem'
                            }}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Tag Filter Pills */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {availableTags.map(tag => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => setSelectedTag(tag)}
                                style={{
                                    padding: '3px 10px',
                                    borderRadius: '14px',
                                    border: '1px solid ' + (selectedTag === tag ? '#06B6D4' : 'rgba(255, 255, 255, 0.08)'),
                                    backgroundColor: selectedTag === tag ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                                    color: selectedTag === tag ? '#06B6D4' : '#94A3B8',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    textTransform: tag === 'all' ? 'capitalize' : 'none'
                                }}
                            >
                                {tag === 'all' ? 'All Topics' : `#${tag}`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Communities List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
                            <Terminal size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                            <div>Loading public developer directory...</div>
                        </div>
                    ) : filteredCommunities.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
                            <Hash size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                            <div>No public communities match &ldquo;{searchQuery}&rdquo;</div>
                        </div>
                    ) : (
                        filteredCommunities.map(community => {
                            const isMember = joinedConversationIds.has(String(community._id));
                            const isJoining = joiningId === community._id;

                            return (
                                <div
                                    key={community._id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '16px',
                                        padding: '16px',
                                        borderRadius: '14px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                        border: '1px solid rgba(255, 255, 255, 0.06)',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', minWidth: 0 }}>
                                        <div style={{
                                            width: '42px',
                                            height: '42px',
                                            borderRadius: '12px',
                                            backgroundColor: 'rgba(6, 182, 212, 0.12)',
                                            color: '#06B6D4',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <Hash size={22} />
                                        </div>

                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '1rem', fontWeight: '700', color: '#FFF' }}>
                                                    {community.name}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.72rem',
                                                    color: '#94A3B8',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    <Users size={12} />
                                                    {community.participants?.length || 1} members
                                                </span>
                                            </div>

                                            <div style={{
                                                fontSize: '0.82rem',
                                                color: '#94A3B8',
                                                marginTop: '4px',
                                                lineHeight: '1.4'
                                            }}>
                                                {community.description || 'Open developer community.'}
                                            </div>

                                            {community.tags && community.tags.length > 0 && (
                                                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                                                    {community.tags.map((t, i) => (
                                                        <span key={i} style={{
                                                            fontSize: '0.68rem',
                                                            color: '#06B6D4',
                                                            backgroundColor: 'rgba(6, 182, 212, 0.08)',
                                                            padding: '1px 6px',
                                                            borderRadius: '4px'
                                                        }}>
                                                            #{t}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                        <button
                                            type="button"
                                            onClick={(e) => handleCopyInviteLink(e, community)}
                                            title="Copy Shareable Invite Link"
                                            style={{
                                                padding: '8px',
                                                borderRadius: '8px',
                                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                color: copiedCode === community._id ? '#10B981' : '#94A3B8',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            {copiedCode === community._id ? <Check size={16} /> : <Share2 size={16} />}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleJoin(community)}
                                            disabled={isJoining}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                backgroundColor: isMember ? 'rgba(255, 255, 255, 0.06)' : '#06B6D4',
                                                color: isMember ? '#CBD5E1' : '#000000',
                                                border: isMember ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                                                fontSize: '0.85rem',
                                                fontWeight: '700',
                                                cursor: isJoining ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <span>{isMember ? 'Open Chat' : (isJoining ? 'Joining...' : 'Join Channel')}</span>
                                            <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
