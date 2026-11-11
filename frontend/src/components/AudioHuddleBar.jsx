import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Mic, MicOff, Volume2, VolumeX, PhoneOff, Users, 
    Maximize2, Minimize2, Radio, Sparkles, ChevronUp, ChevronDown
} from 'lucide-react';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

export default function AudioHuddleBar({
    huddleData, // { conversationId, channelName }
    currentUser,
    socket,
    onLeaveHuddle
}) {
    if (!huddleData) return null;

    const { conversationId, channelName = 'Channel' } = huddleData;

    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    const [members, setMembers] = useState([]);

    const localStreamRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const peerConnectionsRef = useRef(new Map()); // socketId -> RTCPeerConnection
    const remoteAudioElementsRef = useRef(new Map()); // socketId -> HTMLAudioElement
    const animFrameRef = useRef(null);

    const currentUserId = String(currentUser?._id || currentUser?.id || '');

    // 1. Initialize Microphone & Web Audio Analyser
    useEffect(() => {
        let isCancelled = false;

        const startMic = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                if (isCancelled) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }
                localStreamRef.current = stream;

                // Setup AudioContext for real-time speech detection
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    const ctx = new AudioCtx();
                    audioContextRef.current = ctx;
                    const source = ctx.createMediaStreamSource(stream);
                    const analyser = ctx.createAnalyser();
                    analyser.fftSize = 256;
                    source.connect(analyser);
                    analyserRef.current = analyser;

                    const dataArray = new Uint8Array(analyser.frequencyBinCount);
                    let lastSpeaking = false;

                    const checkVolume = () => {
                        if (!analyserRef.current || !socket) return;
                        analyserRef.current.getByteFrequencyData(dataArray);
                        let sum = 0;
                        for (let i = 0; i < dataArray.length; i++) {
                            sum += dataArray[i];
                        }
                        const average = sum / dataArray.length;
                        const speaking = average > 18 && !isMuted;

                        if (speaking !== lastSpeaking) {
                            lastSpeaking = speaking;
                            setIsSpeaking(speaking);
                            socket.emit('huddle:state_change', {
                                conversationId,
                                isSpeaking: speaking
                            });
                        }
                        animFrameRef.current = requestAnimationFrame(checkVolume);
                    };
                    animFrameRef.current = requestAnimationFrame(checkVolume);
                }

                // Join Huddle on socket
                if (socket) {
                    socket.emit('huddle:join', {
                        conversationId,
                        user: {
                            _id: currentUserId,
                            displayName: currentUser?.displayName || currentUser?.name || 'Developer',
                            avatarUrl: currentUser?.avatarUrl || currentUser?.avatar || ''
                        },
                        isMuted: false
                    });
                }
            } catch (err) {
                console.warn('Microphone access denied for huddle:', err.message);
                if (socket) {
                    socket.emit('huddle:join', {
                        conversationId,
                        user: {
                            _id: currentUserId,
                            displayName: currentUser?.displayName || currentUser?.name || 'Developer',
                            avatarUrl: currentUser?.avatarUrl || ''
                        },
                        isMuted: true
                    });
                }
            }
        };

        startMic();

        return () => {
            isCancelled = true;
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => t.stop());
            }
            // Close peer connections
            peerConnectionsRef.current.forEach(pc => pc.close());
            peerConnectionsRef.current.clear();
            remoteAudioElementsRef.current.forEach(audio => {
                audio.pause();
                audio.remove();
            });
            remoteAudioElementsRef.current.clear();

            if (socket) {
                socket.emit('huddle:leave', {
                    conversationId,
                    user: { _id: currentUserId }
                });
            }
        };
    }, [conversationId, socket]);

    // 2. Socket Listeners for Huddle Updates
    useEffect(() => {
        if (!socket) return;

        const handleHuddleUpdated = (data) => {
            if (data?.members) {
                setMembers(data.members);
            }
        };

        const handleMemberState = (data) => {
            setMembers(prev => prev.map(m => {
                if (String(m.id) === String(data.userId)) {
                    return {
                        ...m,
                        isMuted: data.isMuted !== undefined ? data.isMuted : m.isMuted,
                        isSpeaking: data.isSpeaking !== undefined ? data.isSpeaking : m.isSpeaking
                    };
                }
                return m;
            }));
        };

        // WebRTC Signaling
        const handleHuddleSignal = async ({ signal, fromSocketId, fromUser }) => {
            let pc = peerConnectionsRef.current.get(fromSocketId);

            if (!pc) {
                pc = new RTCPeerConnection(ICE_SERVERS);
                peerConnectionsRef.current.set(fromSocketId, pc);

                if (localStreamRef.current) {
                    localStreamRef.current.getTracks().forEach(track => {
                        pc.addTrack(track, localStreamRef.current);
                    });
                }

                pc.onicecandidate = (e) => {
                    if (e.candidate) {
                        socket.emit('huddle:signal', {
                            toSocketId: fromSocketId,
                            signal: { type: 'candidate', candidate: e.candidate },
                            fromUser: currentUser,
                            conversationId
                        });
                    }
                };

                pc.ontrack = (e) => {
                    let audio = remoteAudioElementsRef.current.get(fromSocketId);
                    if (!audio) {
                        audio = new Audio();
                        audio.autoplay = true;
                        remoteAudioElementsRef.current.set(fromSocketId, audio);
                    }
                    audio.srcObject = e.streams[0];
                    audio.muted = isDeafened;
                };
            }

            if (signal.type === 'offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('huddle:signal', {
                    toSocketId: fromSocketId,
                    signal: { type: 'answer', sdp: answer },
                    fromUser: currentUser,
                    conversationId
                });
            } else if (signal.type === 'answer') {
                await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            } else if (signal.type === 'candidate' && signal.candidate) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                } catch (candErr) {
                    // Ignore transient ICE candidates
                }
            }
        };

        socket.on('huddle:updated', handleHuddleUpdated);
        socket.on('huddle:member_state', handleMemberState);
        socket.on('huddle:signal', handleHuddleSignal);

        return () => {
            socket.off('huddle:updated', handleHuddleUpdated);
            socket.off('huddle:member_state', handleMemberState);
            socket.off('huddle:signal', handleHuddleSignal);
        };
    }, [socket, conversationId, isDeafened, currentUser]);

    // 3. Toggle Mute
    const toggleMute = () => {
        const nextMute = !isMuted;
        setIsMuted(nextMute);
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !nextMute;
            });
        }
        if (socket) {
            socket.emit('huddle:state_change', {
                conversationId,
                isMuted: nextMute,
                isSpeaking: false
            });
        }
    };

    // 4. Toggle Deafen
    const toggleDeafen = () => {
        const nextDeafen = !isDeafened;
        setIsDeafened(nextDeafen);
        remoteAudioElementsRef.current.forEach(audio => {
            audio.muted = nextDeafen;
        });
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9000,
            display: 'flex',
            flexDirection: 'column',
            width: isExpanded ? '340px' : '220px',
            backgroundColor: '#161b22',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            borderRadius: '14px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.6), 0 0 20px rgba(6, 182, 212, 0.15)',
            overflow: 'hidden',
            backdropFilter: 'blur(12px)',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {/* Top Bar / Room Title */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: '#0d1117',
                borderBottom: '1px solid #21262d',
                cursor: 'pointer'
            }} onClick={() => setIsExpanded(!isExpanded)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        boxShadow: '0 0 10px #10b981',
                        animation: 'pulse 2s infinite'
                    }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f0f6fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>🔊 #{channelName}</span>
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 500 }}>
                            Voice Huddle ({members.length || 1})
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                        style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', padding: '2px' }}
                    >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                </div>
            </div>

            {/* Member List (Visible when expanded) */}
            {isExpanded && (
                <div style={{
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    backgroundColor: '#161b22'
                }}>
                    {members.length === 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#8b949e' }}>
                            <Radio size={14} className="spin" color="#10b981" />
                            <span>Connecting audio mesh...</span>
                        </div>
                    ) : (
                        members.map(member => {
                            const isMe = String(member.id) === currentUserId;
                            const speaking = isMe ? isSpeaking : member.isSpeaking;
                            const muted = isMe ? isMuted : member.isMuted;

                            return (
                                <div key={member.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    backgroundColor: speaking ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                    transition: 'all 0.15s ease'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {/* Avatar with dynamic speaking glow */}
                                        <div style={{
                                            position: 'relative',
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '50%',
                                            border: speaking ? '2px solid #10b981' : '1px solid #30363d',
                                            boxShadow: speaking ? '0 0 10px rgba(16, 185, 129, 0.7)' : 'none',
                                            transition: 'all 0.15s ease'
                                        }}>
                                            <img
                                                src={member.avatar || '/default-avatar.svg'}
                                                onError={(e) => { e.currentTarget.src = '/default-avatar.svg'; }}
                                                alt={member.name}
                                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: isMe ? '#58a6ff' : '#f0f6fc', fontWeight: 500 }}>
                                            {member.name} {isMe && '(You)'}
                                        </span>
                                    </div>

                                    <div>
                                        {muted ? (
                                            <MicOff size={14} color="#f85149" />
                                        ) : speaking ? (
                                            <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>
                                                Talking...
                                            </span>
                                        ) : (
                                            <Mic size={14} color="#8b949e" />
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Bottom Controls */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 14px',
                backgroundColor: '#0d1117',
                borderTop: '1px solid #21262d'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* Mute Button */}
                    <button
                        type="button"
                        onClick={toggleMute}
                        title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: isMuted ? 'rgba(239, 68, 68, 0.15)' : '#21262d',
                            border: `1px solid ${isMuted ? '#f85149' : '#30363d'}`,
                            color: isMuted ? '#f85149' : '#c9d1d9',
                            cursor: 'pointer'
                        }}
                    >
                        {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>

                    {/* Deafen Button */}
                    <button
                        type="button"
                        onClick={toggleDeafen}
                        title={isDeafened ? 'Undeafen audio' : 'Deafen audio'}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: isDeafened ? 'rgba(239, 68, 68, 0.15)' : '#21262d',
                            border: `1px solid ${isDeafened ? '#f85149' : '#30363d'}`,
                            color: isDeafened ? '#f85149' : '#c9d1d9',
                            cursor: 'pointer'
                        }}
                    >
                        {isDeafened ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                </div>

                {/* Leave Huddle Button */}
                <button
                    type="button"
                    onClick={onLeaveHuddle}
                    title="Leave Voice Huddle"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        backgroundColor: '#da3633',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                    }}
                >
                    <PhoneOff size={14} />
                    <span>Leave</span>
                </button>
            </div>
        </div>
    );
}
