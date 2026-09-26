import React, { useState, useEffect, useRef } from 'react';
import { X, Eye, ChevronLeft, ChevronRight, MoreVertical, Forward, RefreshCw, Trash2 } from 'lucide-react';

const StoryViewer = ({ groupedStatuses, initialUserIndex = 0, onClose, currentUserId, markViewed, onDelete, onForward, onReshare }) => {
    const [userIndex, setUserIndex] = useState(initialUserIndex);
    const [statusIndex, setStatusIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showMenu, setShowMenu] = useState(false);
    const [showViewers, setShowViewers] = useState(false);
    
    const currentUserGroup = groupedStatuses[userIndex];
    const currentStatuses = currentUserGroup?.statuses || [];
    const safeStatusIndex = Math.min(statusIndex, Math.max(0, currentStatuses.length - 1));
    const currentStatus = currentStatuses[safeStatusIndex];
    const isOwnStatus = currentUserGroup?.user?._id === currentUserId;

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
        if (group && group.statuses && statusIndex >= group.statuses.length) {
            setStatusIndex(Math.max(0, group.statuses.length - 1));
        }
    }, [groupedStatuses, userIndex, statusIndex, onClose]);

    const DURATION = 5000; // 5 seconds per story
    const UPDATE_INTERVAL = 50; // Update progress every 50ms

    // Reset progress when index changes
    useEffect(() => {
        setProgress(0);
    }, [safeStatusIndex, userIndex]);

    // Mark as viewed when status changes
    useEffect(() => {
        if (currentStatus && !isOwnStatus && !currentStatus.viewers.includes(currentUserId)) {
            markViewed(currentStatus._id);
        }
    }, [currentStatus, isOwnStatus, currentUserId, markViewed]);

    // Handle timer
    useEffect(() => {
        if (isPaused || showMenu || showViewers || !currentStatus) return;

        // If it's a video, let the video element control the progress instead of the timer?
        // For simplicity, we'll use fixed timer for text/image, and maybe let video play through.
        // Actually, we'll just stick to 5s for everything unless it's a video, but let's just do 5s for now to keep it simple.

        const timer = setInterval(() => {
            setProgress(prev => {
                const next = prev + (UPDATE_INTERVAL / DURATION) * 100;
                if (next >= 100) {
                    handleNext();
                    return 0;
                }
                return next;
            });
        }, UPDATE_INTERVAL);

        return () => clearInterval(timer);
    }, [statusIndex, userIndex, isPaused, currentStatus]);

    const handleNext = () => {
        setProgress(0);
        if (statusIndex < currentStatuses.length - 1) {
            setStatusIndex(prev => prev + 1);
        } else if (userIndex < groupedStatuses.length - 1) {
            setUserIndex(prev => prev + 1);
            setStatusIndex(0);
        } else {
            onClose(); // Reached the end
        }
    };

    const handlePrev = () => {
        setProgress(0);
        if (statusIndex > 0) {
            setStatusIndex(prev => prev - 1);
        } else if (userIndex > 0) {
            setUserIndex(prev => prev - 1);
            setStatusIndex(groupedStatuses[userIndex - 1].statuses.length - 1);
        } else {
            // At the very beginning, just reset progress
        }
    };

    if (!currentStatus) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {/* Progress Bars */}
            <div style={{ display: 'flex', gap: '4px', padding: '16px 8px 8px 8px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
                {currentStatuses.map((s, i) => (
                    <div key={s._id} style={{ flex: 1, height: '3px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            backgroundColor: '#fff',
                            width: i === statusIndex ? `${progress}%` : i < statusIndex ? '100%' : '0%',
                            transition: i === statusIndex ? 'width 50ms linear' : 'none'
                        }} />
                    </div>
                ))}
            </div>

            {/* Header */}
            <div style={{ position: 'absolute', top: '24px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={currentUserGroup.user.avatarUrl} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
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
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setShowMenu(false); 
                                                onDelete(currentStatus._id); 
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
            <div 
                style={{ position: 'absolute', top: 0, left: 0, width: '30%', height: '100%', zIndex: 5 }}
                onClick={handlePrev}
                onMouseDown={() => setIsPaused(true)}
                onMouseUp={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
            />
            <div 
                style={{ position: 'absolute', top: 0, right: 0, width: '70%', height: '100%', zIndex: 5 }}
                onClick={handleNext}
                onMouseDown={() => setIsPaused(true)}
                onMouseUp={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
            />

            {/* Content Content */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: currentStatus.type === 'text' ? currentStatus.backgroundColor : '#000', position: 'relative' }}>
                {currentStatus.type === 'text' && (
                    <div style={{ color: '#fff', fontSize: '2rem', textAlign: 'center', padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '80%' }}>
                        {currentStatus.content}
                    </div>
                )}
                {currentStatus.type === 'image' && (
                    <img src={currentStatus.content} alt="status" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                )}
                {currentStatus.type === 'video' && (
                    <video src={currentStatus.content} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                )}
                
            </div>

            {/* Footer (Viewers count if own) */}
            {isOwnStatus && !showViewers && (
                <div style={{ position: 'absolute', bottom: '24px', width: '100%', display: 'flex', justifyContent: 'center', zIndex: 10 }}>
                    <div 
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#fff', cursor: 'pointer', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }} 
                        onClick={(e) => { e.stopPropagation(); setShowViewers(true); setIsPaused(true); }}
                    >
                        <Eye size={24} />
                        <span style={{ fontSize: '0.9rem', marginTop: '4px', fontWeight: '500' }}>{currentStatus.viewers.length}</span>
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
                                <Eye size={20} /> Viewed by {currentStatus.viewers.length}
                            </div>
                            <button onClick={() => { setShowViewers(false); setIsPaused(false); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                            {currentStatus.viewers.length === 0 ? (
                                <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                                    No views yet
                                </div>
                            ) : (
                                currentStatus.viewers.map(viewer => (
                                    <div key={viewer._id || viewer} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <img 
                                            src={viewer.avatarUrl || 'https://via.placeholder.com/40'} 
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
                    padding: '80px 24px 80px 24px', // extra padding bottom to clear the footer
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                    pointerEvents: 'none',
                    zIndex: 20 // Below viewers panel (50) and menu (100)
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
        </div>
    );
};

export default StoryViewer;
