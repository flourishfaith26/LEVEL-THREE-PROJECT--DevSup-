import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Eye, EyeOff, MoreVertical, Forward, RefreshCw, Trash2, Send, Check } from 'lucide-react';

const matchesUserId = (target, currentId) => {
    if (!target || !currentId) return false;
    return String(target?._id || target) === String(currentId);
};

const StoryViewer = ({ groupedStatuses, initialUserIndex = 0, onClose, currentUserId, markViewed, onDelete, onForward, onReshare, readReceipts = true, onReply }) => {
    const [userIndex, setUserIndex] = useState(initialUserIndex);
    const [statusIndex, setStatusIndex] = useState(() => {
        const group = groupedStatuses[initialUserIndex];
        if (!group || !group.statuses) return 0;
        const firstUnviewed = group.statuses.findIndex(s => !s.viewers || !s.viewers.some(v => matchesUserId(v, currentUserId)));
        return firstUnviewed !== -1 ? firstUnviewed : 0;
    });
    const [isPaused, setIsPaused] = useState(false);
    const [progressState, setProgressState] = useState({ userIndex: initialUserIndex, statusIndex: 0, value: 0 });
    const [showMenu, setShowMenu] = useState(false);
    const [showViewers, setShowViewers] = useState(false);
    const [transitionDirection, setTransitionDirection] = useState('next');
    const [replyText, setReplyText] = useState('');
    const [replySentNotice, setReplySentNotice] = useState(false);
    
    const touchStartY = useRef(0);
    const touchCurrentY = useRef(0);
    const containerRef = useRef(null);
    const videoRef = useRef(null);

    const handleSendReply = (textToSend) => {
        const text = (typeof textToSend === 'string' ? textToSend : replyText || '').trim();
        if (!text || !currentUserGroup?.user || !currentStatus) return;
        onReply?.(currentUserGroup.user, text, currentStatus);
        setReplyText('');
        setReplySentNotice(true);
        setTimeout(() => {
            setReplySentNotice(false);
            setIsPaused(false);
        }, 1800);
    };

    useEffect(() => {
        if (videoRef.current) {
            if (isPaused || showMenu || showViewers) {
                videoRef.current.pause();
            } else {
                videoRef.current.play().catch(error => console.log('Auto-play prevented:', error));
            }
        }
    }, [isPaused, showMenu, showViewers, statusIndex]);
    
    const currentUserGroup = groupedStatuses[userIndex];
    const currentStatuses = currentUserGroup?.statuses || [];
    const safeStatusIndex = Math.min(statusIndex, Math.max(0, currentStatuses.length - 1));
    const currentStatus = currentStatuses[safeStatusIndex];
    const isOwnStatus = matchesUserId(currentUserGroup?.user, currentUserId);

    // Robust bounds checking for when statuses or groups are deleted/shuffled
    useEffect(() => {
        if (!groupedStatuses || groupedStatuses.length === 0) {
            onClose();
            return;
        }

        if (userIndex >= groupedStatuses.length) {
            onClose();
            return;
        }

        const group = groupedStatuses[userIndex];
        if (!group?.statuses?.length) {
            onClose();
        }
    }, [groupedStatuses, userIndex, statusIndex, onClose]);

    const DURATION = 5000; // 5 seconds per story
    const UPDATE_INTERVAL = 50; // Update progress every 50ms
    const progress = progressState.userIndex === userIndex && progressState.statusIndex === safeStatusIndex
        ? progressState.value
        : 0;
    const setProgress = useCallback((value) => {
        setProgressState({ userIndex, statusIndex: safeStatusIndex, value });
    }, [userIndex, safeStatusIndex]);

    const handleNext = useCallback(() => {
        setProgress(0);
        setTransitionDirection('next');
        if (statusIndex < currentStatuses.length - 1) {
            setStatusIndex(prev => prev + 1);
        } else if (userIndex < groupedStatuses.length - 1) {
            const nextUserIndex = userIndex + 1;
            setUserIndex(nextUserIndex);
            const nextGroup = groupedStatuses[nextUserIndex];
            if (nextGroup && nextGroup.statuses) {
                const firstUnviewed = nextGroup.statuses.findIndex(s => !s.viewers || !s.viewers.some(v => matchesUserId(v, currentUserId)));
                setStatusIndex(firstUnviewed !== -1 ? firstUnviewed : 0);
            } else {
                setStatusIndex(0);
            }
        } else {
            onClose();
        }
    }, [setProgress, statusIndex, currentStatuses.length, userIndex, groupedStatuses, currentUserId, onClose]);

    // Mark as viewed when status changes
    useEffect(() => {
        if (currentStatus && readReceipts && !currentStatus.viewers.some(v => matchesUserId(v, currentUserId))) {
            markViewed(currentStatus._id);
        }
    }, [currentStatus, isOwnStatus, currentUserId, markViewed, readReceipts]);

    // Handle timer
    useEffect(() => {
        if (isPaused || showMenu || showViewers || !currentStatus) return;
        if (currentStatus.type === 'video') return; // Let video control its own progress

        let currentProgress = progress;
        const timer = setInterval(() => {
            currentProgress += (UPDATE_INTERVAL / DURATION) * 100;
            if (currentProgress >= 100) {
                currentProgress = 0;
                handleNext();
            } else {
                setProgress(currentProgress);
            }
        }, UPDATE_INTERVAL);

        return () => clearInterval(timer);
    }, [statusIndex, userIndex, isPaused, showMenu, showViewers, currentStatus, progress, setProgress, handleNext]);

    const handlePrev = useCallback(() => {
        setProgress(0);
        setTransitionDirection('previous');
        if (statusIndex > 0) {
            setStatusIndex(prev => prev - 1);
        } else if (userIndex > 0) {
            setUserIndex(prev => prev - 1);
            setStatusIndex(groupedStatuses[userIndex - 1].statuses.length - 1);
        } else {
            // At the very beginning, just reset progress
        }
    }, [setProgress, statusIndex, userIndex, groupedStatuses]);

    // Keyboard navigation (WhatsApp Web style)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowRight') {
                handleNext();
            } else if (e.key === 'ArrowLeft') {
                handlePrev();
            } else if (e.key === ' ' || e.code === 'Space') {
                e.preventDefault();
                setIsPaused(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleNext, handlePrev, onClose]);

    const handleTouchStart = (e) => {
        touchStartY.current = e.touches[0].clientY;
        touchCurrentY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
        touchCurrentY.current = e.touches[0].clientY;
        const deltaY = touchCurrentY.current - touchStartY.current;
        if (deltaY > 0 && containerRef.current) {
            containerRef.current.style.transform = `translateY(${deltaY}px)`;
            containerRef.current.style.transition = 'none';
        }
    };

    const handleTouchEnd = () => {
        const deltaY = touchCurrentY.current - touchStartY.current;
        if (deltaY > 120) {
            onClose();
        } else if (containerRef.current) {
            containerRef.current.style.transform = 'translateY(0)';
            containerRef.current.style.transition = 'transform 0.2s ease-out';
        }
    };

    if (!currentStatus) return null;

    const actualViewers = currentStatus.viewers.filter(v => !matchesUserId(v, currentUserId));

    return (
        <>
        <div 
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', minHeight: '100dvh',
            backgroundColor: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            transition: 'transform 0.2s ease-out'
        }}>
            {/* Progress Bars */}
            <div style={{ display: 'flex', gap: '4px', padding: '16px 8px 8px 8px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
                {currentStatuses.map((s, i) => (
                    <div key={s._id} style={{ flex: 1, height: '3px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            backgroundColor: '#fff',
                            width: i === statusIndex ? `${progress}%` : i < statusIndex ? '100%' : '0%',
                            transition: i === statusIndex ? (s.type === 'video' ? 'width 250ms linear' : 'width 50ms linear') : 'none'
                        }} />
                    </div>
                ))}
            </div>

            {/* Header */}
            <div style={{ position: 'absolute', top: '24px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={currentUserGroup.user.avatarUrl || '/default-avatar.svg'} onError={(e) => { e.currentTarget.src = '/default-avatar.svg'; }} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                        <div style={{ fontWeight: '600', fontSize: '1rem' }}>{currentUserGroup.user.displayName}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                            {new Date(currentStatus.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ position: 'relative' }}>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); setIsPaused(!showMenu); }} 
                            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px' }}
                        >
                            <MoreVertical size={24} />
                        </button>
                        {showMenu && (
                            <div style={{
                                position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                                backgroundColor: 'var(--colors-surface, #1e293b)', borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 100,
                                minWidth: '150px'
                            }}>
                                <div 
                                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); setIsPaused(false); onForward(currentStatus); }}
                                    style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--colors-text, #fff)', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                                >
                                    <Forward size={16} /> Forward
                                </div>
                                {isOwnStatus && (
                                    <>
                                        <div 
                                            onClick={(e) => { e.stopPropagation(); setShowMenu(false); setIsPaused(false); onReshare(currentStatus); }}
                                            style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--colors-text, #fff)', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                                        >
                                            <RefreshCw size={16} /> Reshare
                                        </div>
                                        <div 
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                setShowMenu(false);
                                                setIsPaused(true);
                                                const deleted = await onDelete(currentStatus._id);
                                                if (deleted) setProgress(0);
                                                setIsPaused(false);
                                            }}
                                            style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--colors-danger, #ef4444)', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={16} /> Delete
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px' }}>
                        <X size={28} />
                    </button>
                </div>
            </div>

            {/* Click/Hold Areas */}
            <button
                type="button"
                aria-label="Previous status"
                className="story-nav-area left-nav"
                style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: isOwnStatus ? '100%' : 'calc(100% - 130px)', zIndex: 5, background: 'transparent', border: 0, padding: 0, cursor: 'pointer', WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                onClick={handlePrev}
                onMouseDown={() => setIsPaused(true)}
                onMouseUp={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
            />
            <button
                type="button"
                aria-label="Next status"
                className="story-nav-area right-nav"
                style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: isOwnStatus ? '100%' : 'calc(100% - 130px)', zIndex: 5, background: 'transparent', border: 0, padding: 0, cursor: 'pointer', WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                onClick={handleNext}
                onMouseDown={() => setIsPaused(true)}
                onMouseUp={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
            />

            {/* Content Content */}
            <div key={`${userIndex}-${currentStatus._id}`} className={`story-content story-${transitionDirection}`} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: currentStatus.type === 'text' ? currentStatus.backgroundColor : 'transparent', position: 'relative', minHeight: 0, overflow: 'hidden', zIndex: 1 }}>
                {currentStatus.type === 'text' && (
                    <div style={{ color: '#fff', fontSize: '2rem', textAlign: 'center', padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '80%' }}>
                        {currentStatus.content}
                    </div>
                )}
                {currentStatus.type === 'image' && (
                    <img src={currentStatus.content} alt="status" style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain' }} />
                )}
                {currentStatus.type === 'video' && (
                    <video 
                        ref={videoRef}
                        src={currentStatus.content} 
                        autoPlay 
                        muted 
                        playsInline 
                        onEnded={() => {
                            if (!isPaused && !showMenu && !showViewers) handleNext();
                        }}
                        onTimeUpdate={(e) => {
                            if (!isPaused && e.target.duration) {
                                setProgress((e.target.currentTime / e.target.duration) * 100);
                            }
                        }}
                        style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain' }} 
                    />
                )}
                
            </div>

            {/* Footer (Viewers count if own) */}
            {isOwnStatus && !showViewers && (
                <div style={{ position: 'absolute', bottom: '120px', width: '100%', display: 'flex', justifyContent: 'center', zIndex: 10 }}>
                    <div 
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#fff', cursor: 'pointer', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }} 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            if (readReceipts) {
                                setShowViewers(true); 
                                setIsPaused(true); 
                            }
                        }}
                    >
                        {readReceipts ? (
                            <>
                                <Eye size={24} />
                                <span style={{ fontSize: '0.9rem', marginTop: '4px', fontWeight: '500' }}>{actualViewers.length}</span>
                            </>
                        ) : (
                            <>
                                <EyeOff size={24} />
                                <span style={{ fontSize: '0.7rem', marginTop: '4px', fontWeight: '500' }}>Disabled</span>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Viewers Panel Overlay */}
            {showViewers && (
                <div 
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50 }}
                    onClick={(e) => { e.stopPropagation(); setShowViewers(false); setIsPaused(false); }}
                >
                    <div 
                        style={{ 
                            position: 'absolute', bottom: 0, left: 0, right: 0, 
                            margin: '0 auto', width: '100%', maxWidth: '500px',
                            backgroundColor: 'var(--colors-surface, #1e293b)', 
                            borderTopLeftRadius: '16px', borderTopRightRadius: '16px',
                            maxHeight: '60vh', display: 'flex', flexDirection: 'column',
                            boxShadow: '0 -4px 20px rgba(0,0,0,0.3)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ fontWeight: '600', fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Eye size={20} /> Viewed by {actualViewers.length}
                            </div>
                            <button onClick={() => { setShowViewers(false); setIsPaused(false); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                            {actualViewers.length === 0 ? (
                                <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                                    No views yet
                                </div>
                            ) : (
                                actualViewers.map(viewer => (
                                    <div key={viewer._id || viewer} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <img 
                                            src={viewer.avatarUrl || '/default-avatar.svg'} 
                                            onError={(e) => { e.currentTarget.src = '/default-avatar.svg'; }}
                                            alt="avatar" 
                                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
                                        />
                                        <div style={{ color: '#fff', fontWeight: '500' }}>
                                            {viewer.displayName || 'Unknown User'}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Global Caption Overlay for Media */}
            {currentStatus.type !== 'text' && currentStatus.caption && (
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    padding: isOwnStatus ? '80px 24px 80px 24px' : '20px 24px 140px 24px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                    pointerEvents: 'none',
                    zIndex: 20
                }}>
                    <span style={{
                        color: '#fff',
                        fontSize: '1.1rem',
                        fontWeight: '400',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        textAlign: 'center',
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                        maxWidth: '800px',
                        lineHeight: '1.4'
                    }}>
                        {currentStatus.caption}
                    </span>
                </div>
            )}

            {/* WhatsApp Status Reply Bar (When viewing another contact's status) */}
            {!isOwnStatus && !showMenu && (
                <div 
                    style={{ 
                        position: 'absolute', 
                        bottom: 0, 
                        left: 0, 
                        right: 0, 
                        padding: '16px 20px', 
                        background: 'linear-gradient(to top, rgba(11, 20, 26, 0.95) 0%, rgba(11, 20, 26, 0.6) 70%, transparent 100%)',
                        zIndex: 35,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px'
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Quick emoji reaction strip */}
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', maxWidth: '100%', padding: '2px 4px', scrollbarWidth: 'none' }}>
                        {['❤️', '😂', '😮', '😢', '🙏', '👏', '🔥', '🎉'].map(emoji => (
                            <button
                                key={emoji}
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendReply(emoji);
                                }}
                                title={`React ${emoji}`}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.12)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: '20px',
                                    padding: '6px 12px',
                                    fontSize: '1.25rem',
                                    cursor: 'pointer',
                                    transition: 'transform 0.15s, background-color 0.15s',
                                    userSelect: 'none'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.25)'; e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.22)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)'; }}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>

                    {/* Reply input and Send button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', maxWidth: '520px' }}>
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.12)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.22)',
                            borderRadius: '24px',
                            padding: '10px 18px',
                            transition: 'border-color 0.2s'
                        }}>
                            <input
                                type="text"
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                onFocus={() => setIsPaused(true)}
                                onBlur={() => {
                                    if (!replyText.trim() && !replySentNotice) setIsPaused(false);
                                }}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSendReply(replyText);
                                    }
                                }}
                                placeholder={`Reply to ${currentUserGroup?.user?.displayName || currentUserGroup?.user?.name || 'status'}...`}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: '#fff',
                                    fontSize: '0.95rem',
                                    width: '100%'
                                }}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => handleSendReply(replyText)}
                            disabled={!replyText.trim()}
                            title="Send reply"
                            style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                backgroundColor: replyText.trim() ? 'var(--colors-accent, #00a884)' : 'rgba(255, 255, 255, 0.12)',
                                color: replyText.trim() ? '#111b21' : 'rgba(255, 255, 255, 0.4)',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: replyText.trim() ? 'pointer' : 'default',
                                transition: 'all 0.2s',
                                flexShrink: 0
                            }}
                        >
                            <Send size={18} />
                        </button>
                    </div>

                    {/* Temporary Sent Notification */}
                    {replySentNotice && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: 'var(--colors-accent, #00a884)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            animation: 'story-next 0.2s ease'
                        }}>
                            <Check size={16} strokeWidth={3} />
                            <span>Reply sent</span>
                        </div>
                    )}
                </div>
            )}
        </div>
            <style>{`
                @keyframes story-next {
                    from { opacity: 0.72; transform: translateX(18px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes story-previous {
                    from { opacity: 0.72; transform: translateX(-18px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .story-next { animation: story-next 220ms cubic-bezier(0.22, 1, 0.36, 1) both; }
                .story-previous { animation: story-previous 220ms cubic-bezier(0.22, 1, 0.36, 1) both; }
                .story-nav-area {
                    -webkit-tap-highlight-color: transparent !important;
                    user-select: none;
                    -webkit-user-select: none;
                    outline: none;
                }
                .story-nav-area:focus:not(:focus-visible) { outline: none; }
                @media (prefers-reduced-motion: reduce) {
                    .story-content { animation: none !important; }
                }
            `}</style>
        </>
    );
};

export default StoryViewer;
