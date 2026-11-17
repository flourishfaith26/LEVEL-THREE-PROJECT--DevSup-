import { useEffect, useRef, useState, useCallback } from 'react';
import { styled, keyframes } from '../stitches.config.js';
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff, UserPlus, X, ChevronLeft, Search } from 'lucide-react';
import { playWhatsAppCallSound } from '../utils/audio.js';

const OverlayContainer = styled('div', {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    overflow: 'hidden',
});

const BackgroundBlur = styled('div', {
    position: 'absolute',
    top: '-10%',
    left: '-10%',
    width: '120%',
    height: '120%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(80px) brightness(0.3)',
    zIndex: -1,
    transform: 'scale(1.1)',
});

const VideoGrid = styled('div', {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '1200px',
    padding: '40px 20px 140px',
    height: '100%',
    alignItems: 'center',
});

const VideoWrapper = styled('div', {
    position: 'relative',
    width: '45%',
    minWidth: '300px',
    aspectRatio: '16/9',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    transition: 'all 0.3s ease',
    '@media (max-width: 768px)': {
        width: '100%',
        minWidth: 'unset',
        aspectRatio: '4/3',
    },
    variants: {
        isLocal: {
            true: {
                border: '2px solid rgba(6, 182, 212, 0.6)',
                boxShadow: '0 0 30px rgba(6, 182, 212, 0.15), 0 25px 50px -12px rgba(0, 0, 0, 0.6)',
            }
        }
    }
});

const VideoLabel = styled('div', {
    position: 'absolute',
    bottom: '12px',
    left: '12px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(8px)',
    borderRadius: '8px',
    padding: '4px 10px',
    fontSize: '0.82rem',
    fontWeight: '600',
    color: '#fff',
    zIndex: 5,
});

const AvatarFallback = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0, left: 0,
});

const CallerInfo = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '80px',
    zIndex: 10,
});

const CallerNameText = styled('h2', {
    fontSize: '2.2rem',
    fontWeight: '700',
    margin: '28px 0 8px 0',
    textShadow: '0 4px 20px rgba(0,0,0,0.6)',
    letterSpacing: '0.5px',
    background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textAlign: 'center',
});

const CallStatusText = styled('p', {
    fontSize: '1rem',
    color: '#94A3B8',
    margin: 0,
    fontWeight: '600',
    letterSpacing: '2px',
    textTransform: 'uppercase',
});

const AvatarImg = styled('img', {
    width: '130px',
    height: '130px',
    borderRadius: '50%',
    border: '4px solid rgba(255, 255, 255, 0.8)',
    boxShadow: '0 15px 35px rgba(0,0,0,0.5)',
    objectFit: 'cover',
    backgroundColor: '#0F172A',
});

const SmallAvatarImg = styled('img', {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid rgba(255,255,255,0.3)',
    backgroundColor: '#0F172A',
});

const pulseAnimation = keyframes({
    '0%': { transform: 'scale(0.97)', opacity: 0.9 },
    '50%': { transform: 'scale(1.03)', opacity: 1 },
    '100%': { transform: 'scale(0.97)', opacity: 0.9 },
});

const CallingAnimation = styled('div', {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '50%',
    animation: `${pulseAnimation} 2.5s ease-in-out infinite`,
});

const ControlsBar = styled('div', {
    position: 'absolute',
    bottom: '40px',
    display: 'flex',
    gap: '20px',
    backgroundColor: 'rgba(17, 27, 33, 0.88)',
    padding: '14px 28px',
    borderRadius: '40px',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
    zIndex: 100,
});

const ControlButton = styled('button', {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: '#fff',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    '&:hover': { transform: 'translateY(-2px) scale(1.05)', backgroundColor: 'rgba(255, 255, 255, 0.14)' },
    variants: {
        variant: {
            danger: {
                backgroundColor: '#EF4444',
                boxShadow: '0 8px 24px rgba(239, 68, 68, 0.45)',
                '&:hover': { backgroundColor: '#DC2626', boxShadow: '0 12px 28px rgba(239, 68, 68, 0.55)' }
            },
            success: {
                backgroundColor: '#10B981',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.45)',
                '&:hover': { backgroundColor: '#059669' }
            },
            active: {
                backgroundColor: 'rgba(0, 229, 255, 0.2)',
                color: '#00e5ff',
                border: '1px solid rgba(0, 229, 255, 0.5)',
            },
        }
    }
});

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
    ]
};

const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

const CallOverlay = ({
    socket,
    mongoUserId,
    activeConversation,
    callConfig,
    onEndCall,
    currentUserData,
    getAccessTokenSilently,
    backendUrl,
    availableContacts = [],
    allUsers = []
}) => {
    const [callAccepted, setCallAccepted] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(callConfig?.callType === 'audio');
    const [remoteVideoActive, setRemoteVideoActive] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [isAddingPerson, setIsAddingPerson] = useState(false);
    const [addPersonSearchQuery, setAddPersonSearchQuery] = useState('');
    const [toastMsg, setToastMsg] = useState(null);
    const [isAnswering, setIsAnswering] = useState(false);
    const [callDialog, setCallDialog] = useState(null);
    const [groupParticipants, setGroupParticipants] = useState([]);
    const groupPeersRef = useRef(new Map()); // socketId -> { pc, queue, user }

    const callSessionIdRef = useRef(callConfig?.callSessionId || callConfig?.callerData?.callSessionId || `${mongoUserId}-${Date.now()}`);
    const hasLoggedCallRef = useRef(false);
    const callDurationRef = useRef(0);

    useEffect(() => {
        if (callConfig?.active) {
            const incomingSessionId = callConfig?.callSessionId || callConfig?.callerData?.callSessionId;
            if (incomingSessionId) {
                callSessionIdRef.current = incomingSessionId;
            } else if (!callConfig.isReceiving) {
                callSessionIdRef.current = `${mongoUserId}-${Date.now()}`;
            }
            hasLoggedCallRef.current = false;
        }
    }, [callConfig?.active, callConfig?.callSessionId, callConfig?.callerData?.callSessionId, callConfig?.isReceiving, mongoUserId]);

    const localStream = useRef(null);
    const remoteStream = useRef(null);
    const peerConnection = useRef(null);
    const callAcceptedRef = useRef(false);
    const ringTimeoutRef = useRef(null);
    const timerRef = useRef(null);
    const pendingCandidates = useRef([]);
    const remoteVideoEl = useRef(null);
    const remoteAudioEl = useRef(null);
    const localVideoEl = useRef(null);
    const ringtoneRef = useRef(null);

    const remoteVideoCallbackRef = useCallback((el) => {
        remoteVideoEl.current = el;
        if (el && remoteStream.current) {
            el.srcObject = remoteStream.current;
            void el.play().catch(error => console.warn('Unable to start remote video playback:', error));
        }
    }, []);

    const remoteAudioCallbackRef = useCallback((el) => {
        remoteAudioEl.current = el;
        if (el && remoteStream.current) {
            el.srcObject = remoteStream.current;
            void el.play().catch(error => console.warn('Unable to start remote audio playback:', error));
        }
    }, []);

    const localVideoCallbackRef = useCallback((el) => {
        localVideoEl.current = el;
        if (el && localStream.current) {
            el.srcObject = localStream.current;
            void el.play().catch(error => console.warn('Unable to start local video preview:', error));
        }
    }, []);

    useEffect(() => {
        if (!toastMsg) return;
        const t = setTimeout(() => setToastMsg(null), 3000);
        return () => clearTimeout(t);
    }, [toastMsg]);

    useEffect(() => {
        if (!callAccepted) return;
        timerRef.current = setInterval(() => setCallDuration(d => {
            const next = d + 1;
            callDurationRef.current = next;
            return next;
        }), 1000);
        return () => clearInterval(timerRef.current);
    }, [callAccepted]);

    // Ringtone: play while ringing/receiving, stop when accepted or ended
    useEffect(() => {
        if (!callConfig?.active) return;
        if (callAccepted) {
            // Stop ringing once call is accepted
            ringtoneRef.current?.stop?.();
            ringtoneRef.current?.pause?.();
            ringtoneRef.current = null;
            return;
        }

        // Play gentle, authentic WhatsApp call sound (Marimba for incoming, soft dual-sine for outgoing)
        const callSoundController = playWhatsAppCallSound(Boolean(callConfig.isReceiving));
        ringtoneRef.current = callSoundController;

        return () => {
            callSoundController?.stop?.();
            callSoundController?.pause?.();
            ringtoneRef.current = null;
        };
    }, [callConfig?.active, callConfig?.isReceiving, callAccepted]);

    const buildPeerConnection = useCallback((targetUserId, iceServers) => {
        const pc = new RTCPeerConnection({ iceServers });

        pc.onicecandidate = (e) => {
            if (e.candidate && socket) {
                socket.emit('webrtc_ice_candidate', { to: targetUserId, candidate: e.candidate });
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'connected') {
                if (ringTimeoutRef.current) {
                    clearTimeout(ringTimeoutRef.current);
                    ringTimeoutRef.current = null;
                }
                callAcceptedRef.current = true;
                setCallAccepted(true);
                ringtoneRef.current?.stop?.();
                ringtoneRef.current?.pause?.();
                ringtoneRef.current = null;
            }
        };

        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
                if (ringTimeoutRef.current) {
                    clearTimeout(ringTimeoutRef.current);
                    ringTimeoutRef.current = null;
                }
                callAcceptedRef.current = true;
                setCallAccepted(true);
                ringtoneRef.current?.stop?.();
                ringtoneRef.current?.pause?.();
                ringtoneRef.current = null;
            }
        };

        pc.ontrack = (e) => {
            // Once media arrives, connection is alive — stop ringtone and clear any timeout
            if (ringTimeoutRef.current) {
                clearTimeout(ringTimeoutRef.current);
                ringTimeoutRef.current = null;
            }
            callAcceptedRef.current = true;
            setCallAccepted(true);
            ringtoneRef.current?.stop?.();
            ringtoneRef.current?.pause?.();
            ringtoneRef.current = null;

            const remoteStr = e.streams[0] || remoteStream.current || new MediaStream();
            if (!e.streams[0] && !remoteStr.getTracks().includes(e.track)) {
                remoteStr.addTrack(e.track);
            }
            remoteStream.current = remoteStr;
            if (remoteVideoEl.current) {
                remoteVideoEl.current.srcObject = remoteStr;
                void remoteVideoEl.current.play().catch(error => console.warn('Unable to start remote video playback:', error));
            }
            if (remoteAudioEl.current) {
                remoteAudioEl.current.srcObject = remoteStr;
                void remoteAudioEl.current.play().catch(error => console.warn('Unable to start remote audio playback:', error));
            }
            const updateRemoteVideoState = () => {
                setRemoteVideoActive(remoteStr.getVideoTracks().some(
                    track => track.enabled && track.readyState === 'live' && !track.muted
                ));
            };
            remoteStr.getVideoTracks().forEach(track => {
                track.onmute = updateRemoteVideoState;
                track.onunmute = updateRemoteVideoState;
                track.onended = updateRemoteVideoState;
            });
            updateRemoteVideoState();
            e.track.onunmute = updateRemoteVideoState;
            e.track.onmute = updateRemoteVideoState;
            e.track.onended = updateRemoteVideoState;
        };

        if (localStream.current) {
            localStream.current.getTracks().forEach(track => {
                pc.addTrack(track, localStream.current);
            });
        }

        return pc;
    }, [socket]);

    const flushPendingCandidates = async () => {
        if (!peerConnection.current) return;
        for (const c of pendingCandidates.current) {
            try { await peerConnection.current.addIceCandidate(new RTCIceCandidate(c)); } catch (e) { console.error(e); }
        }
        pendingCandidates.current = [];
    };

    const buildGroupPeerConnection = useCallback((targetSocketId, targetUser, iceServers) => {
        let entry = groupPeersRef.current.get(targetSocketId);
        if (entry?.pc) return entry.pc;

        const pc = new RTCPeerConnection(iceServers ? { iceServers } : ICE_SERVERS);
        const queue = [];
        entry = { pc, queue, user: targetUser };
        groupPeersRef.current.set(targetSocketId, entry);

        if (localStream.current) {
            localStream.current.getTracks().forEach(track => {
                pc.addTrack(track, localStream.current);
            });
        }

        pc.onicecandidate = (e) => {
            if (e.candidate) {
                socket.emit('group_call:signal', {
                    toSocketId: targetSocketId,
                    signal: { type: 'candidate', candidate: e.candidate },
                    fromUser: currentUserData,
                    conversationId: activeConversation?._id || callConfig?.conversationId
                });
            }
        };

        pc.ontrack = (e) => {
            const stream = e.streams[0] || new MediaStream([e.track]);
            if (!callAcceptedRef.current) {
                callAcceptedRef.current = true;
                setCallAccepted(true);
                if (ringTimeoutRef.current) {
                    clearTimeout(ringTimeoutRef.current);
                    ringTimeoutRef.current = null;
                }
                ringtoneRef.current?.stop?.();
                ringtoneRef.current?.pause?.();
                ringtoneRef.current = null;
            }
            setGroupParticipants(prev => {
                const existing = prev.find(p => p.socketId === targetSocketId);
                const isVideo = stream.getVideoTracks().some(t => t.enabled && t.readyState === 'live');
                if (existing) {
                    return prev.map(p => p.socketId === targetSocketId ? { ...p, stream, isVideo } : p);
                }
                return [...prev, {
                    socketId: targetSocketId,
                    userId: targetUser?._id || targetUser?.userId,
                    name: targetUser?.displayName || targetUser?.name || 'Member',
                    avatarUrl: targetUser?.avatarUrl || '',
                    stream,
                    isVideo
                }];
            });
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                try { pc.close(); } catch (e) {}
                groupPeersRef.current.delete(targetSocketId);
                setGroupParticipants(prev => prev.filter(p => p.socketId !== targetSocketId));
            }
        };

        return pc;
    }, [socket, currentUserData, activeConversation, callConfig]);

    const getOtherParticipant = useCallback(() => {
        if (callConfig?.targetUser && typeof callConfig.targetUser === 'object') {
            return callConfig.targetUser;
        }
        if (!activeConversation?.participants) return null;
        return activeConversation.participants.find(p => {
            const id = typeof p === 'object' && p !== null ? (p._id || p.id) : p;
            return String(id) !== String(mongoUserId);
        }) || null;
    }, [activeConversation?.participants, mongoUserId, callConfig?.targetUser]);

    const getOtherParticipantId = useCallback(() => {
        if (callConfig?.targetUserId) return String(callConfig.targetUserId);
        const other = getOtherParticipant();
        if (!other) return null;
        return String(typeof other === 'object' && other !== null ? (other._id || other.id) : other);
    }, [getOtherParticipant, callConfig?.targetUserId]);

    const handleEndCallRef = useRef(null);

    const handleEndCall = useCallback((emitEvent = true) => {
        clearInterval(timerRef.current);
        if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
        if (socket && callConfig) {
            const isGroup = !!(callConfig.isGroupCall || callConfig.callerData?.isGroupCall || activeConversation?.type === 'group');
            const convId = activeConversation?._id || callConfig.conversationId || callConfig.callerData?.conversationId;
            if (isGroup) {
                socket.emit('leave_group_call', { conversationId: convId });
                groupPeersRef.current.forEach(peerEntry => {
                    try { peerEntry.pc?.close(); } catch (e) {}
                });
                groupPeersRef.current.clear();
                setGroupParticipants([]);
            }
            const otherUserId = isGroup ? null : (getOtherParticipantId() || callConfig.targetUserId);
            const callerId = callConfig.isReceiving ? (callConfig.callerData?.from || otherUserId) : mongoUserId;
            const receiverId = callConfig.isReceiving ? mongoUserId : otherUserId;
            
            // Log direct call only once per session and only if initiating the end/reject action (not when receiving call_ended)
            // Group calls are automatically logged by backend's leave_group_call when participants leave
            if (emitEvent && !isGroup && receiverId && !hasLoggedCallRef.current) {
                hasLoggedCallRef.current = true;
                socket.emit('log_call', {
                    callerId,
                    receiverId,
                    conversationId: convId,
                    type: (callConfig.callType === 'video') ? 'video' : 'audio',
                    status: callAcceptedRef.current ? 'completed' : 'missed',
                    callSessionId: callSessionIdRef.current,
                    duration: callDurationRef.current || callDuration || 0
                });
            }
        }
        if (emitEvent && socket && callConfig && !isGroup) {
            const otherUserId = callConfig.isReceiving
                ? (callConfig.callerData?.from ? String(callConfig.callerData.from) : null)
                : (getOtherParticipantId() || callConfig.targetUserId);
            const convId = activeConversation?._id || callConfig.conversationId || callConfig.callerData?.conversationId;
            if (otherUserId) {
                if (!callAcceptedRef.current && callConfig.isReceiving) {
                    socket.emit('reject_call', { to: otherUserId, conversationId: convId });
                } else {
                    socket.emit('end_call', { to: otherUserId, conversationId: convId });
                }
            }
        }
        // Stop ringtone
        ringtoneRef.current?.stop?.();
        ringtoneRef.current?.pause?.();
        ringtoneRef.current = null;
        localStream.current?.getTracks().forEach(t => t.stop());
        localStream.current = null;
        remoteStream.current = null;
        peerConnection.current?.close();
        peerConnection.current = null;
        callAcceptedRef.current = false;
        pendingCandidates.current = [];
        setCallAccepted(false);
        setIsAnswering(false);
        setIsVideoOff(callConfig?.callType === 'audio');
        setRemoteVideoActive(false);
        setCallDuration(0);
        onEndCall();
    }, [socket, callConfig, activeConversation, mongoUserId, onEndCall, getOtherParticipantId]);

    handleEndCallRef.current = handleEndCall;

    const getMedia = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: callConfig?.callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
            audio: { echoCancellation: true, noiseSuppression: true },
        });
        localStream.current = stream;
        if (localVideoEl.current) localVideoEl.current.srcObject = stream;
        return stream;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [callConfig?.callType]);

    const getIceServers = async () => {
        const token = await getAccessTokenSilently();
        const response = await fetch(`${backendUrl}/api/call-config`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const contentType = response.headers.get("content-type");
        if (response.status === 404 || (contentType && contentType.includes("text/html"))) {
            console.warn('Call network settings endpoint was not found or returned HTML; continuing with public STUN servers. Configure the backend call-config route and TURN settings for more reliable calls across restrictive networks.');
            return ICE_SERVERS.iceServers;
        }
        if (!response.ok) throw new Error(`Could not load call network settings (${response.status}).`);
        
        const callConfigResponse = await response.json();
        if (!callConfigResponse.turnConfigured) {
            console.warn('No TURN server is configured; calls may not connect on restrictive mobile networks.');
        }
        return callConfigResponse.iceServers || ICE_SERVERS.iceServers;
    };

    const initiateCall = async () => {
        const isGroup = !!(callConfig?.isGroupCall || callConfig?.callerData?.isGroupCall || activeConversation?.type === 'group');
        if (isGroup) {
            const convId = activeConversation?._id || callConfig?.conversationId || callConfig?.callerData?.conversationId;
            const callerInfo = {
                _id: mongoUserId,
                displayName: currentUserData?.displayName || 'Someone',
                avatarUrl: currentUserData?.avatarUrl || ''
            };
            socket.emit('start_group_call', {
                conversationId: convId,
                callType: (callConfig.callType === 'video') ? 'video' : 'audio',
                callerInfo,
                callSessionId: callSessionIdRef.current
            }, async (res) => {
                if (!res?.ok) {
                    console.warn('start_group_call ack error:', res?.error);
                    return;
                }
                if (Array.isArray(res.participants)) {
                    const otherParticipants = res.participants.filter(p => p.socketId && p.socketId !== socket.id);
                    if (otherParticipants.length > 0) {
                        // Other participants already present in the group call
                        setCallAccepted(true);
                        callAcceptedRef.current = true;
                        if (ringTimeoutRef.current) {
                            clearTimeout(ringTimeoutRef.current);
                            ringTimeoutRef.current = null;
                        }
                        ringtoneRef.current?.stop?.();
                        ringtoneRef.current?.pause?.();
                        ringtoneRef.current = null;
                    }
                    const iceServers = await getIceServers();
                    res.participants.forEach(async (p) => {
                        if (!p.socketId || p.socketId === socket.id) return;
                        if (socket.id < p.socketId) {
                            try {
                                const pc = buildGroupPeerConnection(p.socketId, p.user, iceServers);
                                const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: (res.callType || callConfig.callType) === 'video' });
                                await pc.setLocalDescription(offer);
                                socket.emit('group_call:signal', {
                                    toSocketId: p.socketId,
                                    signal: { type: 'offer', sdp: offer },
                                    fromUser: currentUserData,
                                    conversationId: convId
                                });
                            } catch (e) {
                                console.error('Error offering to existing group peer in initiateCall:', e);
                            }
                        }
                    });
                }
            });
            return;
        }

        const otherId = getOtherParticipantId();
        if (!otherId) {
            console.error('initiateCall: could not find other participant in', activeConversation?.participants);
            handleEndCallRef.current?.();
            return;
        }
        const iceServers = await getIceServers();
        const pc = buildPeerConnection(otherId, iceServers);
        peerConnection.current = pc;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        try {
            const response = await socket.timeout(15000).emitWithAck('call_user', {
                userToCall: otherId,
                signalData: offer,
                from: mongoUserId,
                callerInfo: {
                    name: currentUserData?.displayName || 'Someone',
                    avatarUrl: currentUserData?.avatarUrl || ''
                },
                callType: (callConfig.callType === 'video') ? 'video' : 'audio',
                conversationId: activeConversation?._id || callConfig?.conversationId,
                callSessionId: callSessionIdRef.current
            });

            if (!response?.ok) {
                throw new Error(response?.error || 'Could not connect the call.');
            }
        } catch (error) {
            // Only abort if the call hasn't already been accepted — a stale timeout
            // must not tear down a call that connected just fine.
            if (!callAcceptedRef.current) {
                console.error('Unable to start call:', error);
                ringtoneRef.current?.stop?.();
                ringtoneRef.current?.pause?.();
                ringtoneRef.current = null;
                setCallDialog({
                    title: 'Call unavailable',
                    message: `${otherDisplayName} is not connected or online right now. You can leave them a message or try calling again later.`
                });
            }
        }
    };

    const answerCall = async () => {
        if (isAnswering) return;
        setIsAnswering(true);
        try {
            await getMedia();
            const isGroup = !!(callConfig?.isGroupCall || callConfig?.callerData?.isGroupCall || activeConversation?.type === 'group');
            if (isGroup) {
                const convId = callConfig?.conversationId || callConfig?.callerData?.conversationId || activeConversation?._id;
                const sessionId = callConfig?.callSessionId || callConfig?.callerData?.callSessionId || callSessionIdRef.current;
                
                setCallAccepted(true);
                callAcceptedRef.current = true;
                if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
                ringtoneRef.current?.stop?.();
                ringtoneRef.current?.pause?.();
                ringtoneRef.current = null;

                socket.emit('join_group_call', {
                    conversationId: convId,
                    callSessionId: sessionId,
                    user: {
                        _id: mongoUserId,
                        displayName: currentUserData?.displayName || 'Someone',
                        avatarUrl: currentUserData?.avatarUrl || ''
                    }
                }, async (res) => {
                    setIsAnswering(false);
                    if (res?.ok && Array.isArray(res.participants)) {
                        const iceServers = await getIceServers();
                        res.participants.forEach(async (p) => {
                            if (!p.socketId || p.socketId === socket.id) return;
                            if (socket.id < p.socketId) {
                                try {
                                    const pc = buildGroupPeerConnection(p.socketId, p.user, iceServers);
                                    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: callConfig.callType === 'video' });
                                    await pc.setLocalDescription(offer);
                                    socket.emit('group_call:signal', {
                                        toSocketId: p.socketId,
                                        signal: { type: 'offer', sdp: offer },
                                        fromUser: currentUserData,
                                        conversationId: convId
                                    });
                                } catch (e) {
                                    console.error('Error offering to existing group peer:', e);
                                }
                            }
                        });
                    }
                });
                return;
            }

            const iceServers = await getIceServers();
            const pc = buildPeerConnection(String(callConfig.callerData.from), iceServers);
            peerConnection.current = pc;
            await pc.setRemoteDescription(new RTCSessionDescription(callConfig.callerData.signal));
            await flushPendingCandidates();
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // Mark the call as accepted immediately — the WebRTC handshake is
            // already set up at this point. The emitWithAck below is just a
            // delivery confirmation; we must not let its timeout gate the UI.
            setCallAccepted(true);
            callAcceptedRef.current = true;
            if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);

            // Send the answer signal to the caller in the background.
            // If delivery fails we log it, but we do NOT tear down an already-
            // live call (ICE candidates will keep the connection going).
            socket.timeout(15000).emitWithAck('answer_call', {
                to: String(callConfig.callerData.from),
                signal: answer
            }).then((response) => {
                if (!response?.ok) {
                    console.warn('answer_call ack error:', response?.error);
                }
            }).catch((err) => {
                // Ack timed out — log it but leave the call alive; ICE has
                // likely already connected both peers by this point.
                console.warn('answer_call ack timed out, call may still be connected via ICE:', err.message);
            });
        } catch (err) {
            console.error('answerCall error:', err);
            if (!callAcceptedRef.current) {
                ringtoneRef.current?.stop?.();
                ringtoneRef.current?.pause?.();
                ringtoneRef.current = null;
                setCallDialog({
                    title: 'Permissions needed',
                    message: err.message || 'Could not access camera or microphone. Please check your browser permissions.'
                });
            }
        }
    };

    useEffect(() => {
        if (!callConfig?.active || callAccepted || !callConfig.isReceiving) return undefined;

        ringTimeoutRef.current = setTimeout(() => {
            handleEndCallRef.current?.(true);
        }, 30000);
        return () => {
            if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
        };
    }, [callConfig?.active, callConfig?.isReceiving, callConfig?.callerData, callAccepted]);

    // Init media on mount (caller side)
    useEffect(() => {
        if (!callConfig?.active || callConfig.isReceiving) return;
        let cancelled = false;
        (async () => {
            try {
                await getMedia();
                if (cancelled) { localStream.current?.getTracks().forEach(t => t.stop()); return; }
                await initiateCall();
                if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
                ringTimeoutRef.current = setTimeout(() => {
                    if (!callAcceptedRef.current && peerConnection.current?.connectionState !== 'connected') {
                        handleEndCallRef.current?.(true);
                    }
                }, 45000);
            } catch (err) {
                console.error('initMedia error:', err);
                if (!cancelled) { 
                    ringtoneRef.current?.stop?.();
                    ringtoneRef.current?.pause?.();
                    ringtoneRef.current = null;
                    setCallDialog({
                        title: 'Permissions needed',
                        message: err.message || 'Could not access camera/microphone. Please check your browser permissions.'
                    });
                }
            }
        })();
        return () => {
            cancelled = true;
            if (ringTimeoutRef.current) {
                clearTimeout(ringTimeoutRef.current);
                ringTimeoutRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [callConfig?.active]);

    // Socket listeners
    useEffect(() => {
        if (!socket) return;
        const onCallAccepted = async (signal) => {
            try {
                if (peerConnection.current) {
                    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signal));
                    await flushPendingCandidates();
                } else {
                    throw new Error('The call connection is not ready yet.');
                }
                setCallAccepted(true);
                callAcceptedRef.current = true;
                if (ringTimeoutRef.current) {
                    clearTimeout(ringTimeoutRef.current);
                    ringTimeoutRef.current = null;
                }
                ringtoneRef.current?.stop?.();
                ringtoneRef.current?.pause?.();
                ringtoneRef.current = null;
            } catch (error) {
                console.error('Unable to apply call answer:', error);
                // If the call is already accepted and running, don't kill it over a
                // duplicate or late call_accepted event.
                if (!callAcceptedRef.current) {
                    ringtoneRef.current?.stop?.();
                    ringtoneRef.current?.pause?.();
                    ringtoneRef.current = null;
                    setCallDialog({
                        title: 'Call unavailable',
                        message: 'Could not connect the call. Please try again later.'
                    });
                }
            }
        };
        const onIceCandidate = async (candidate) => {
            if (peerConnection.current?.remoteDescription) {
                try { await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) { console.error(e); }
            } else {
                pendingCandidates.current.push(candidate);
            }
        };
        const onCallEnded = (data) => {
            if (data?.conversationId) {
                const currentConvId = activeConversation?._id || callConfig?.conversationId || callConfig?.callerData?.conversationId;
                if (currentConvId && String(data.conversationId) !== String(currentConvId)) {
                    return;
                }
            }
            handleEndCall(false);
        };
        const onCallRejected = () => { if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current); handleEndCall(false); };

        const onGroupPeerJoined = async ({ socketId, user, conversationId }) => {
            if (!socketId || socketId === socket.id) return;
            if (!callAcceptedRef.current) {
                callAcceptedRef.current = true;
                setCallAccepted(true);
                if (ringTimeoutRef.current) {
                    clearTimeout(ringTimeoutRef.current);
                    ringTimeoutRef.current = null;
                }
                ringtoneRef.current?.stop?.();
                ringtoneRef.current?.pause?.();
                ringtoneRef.current = null;
            }
            if (socket.id < socketId) {
                try {
                    const iceServers = await getIceServers();
                    const pc = buildGroupPeerConnection(socketId, user, iceServers);
                    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: callConfig?.callType === 'video' });
                    await pc.setLocalDescription(offer);
                    socket.emit('group_call:signal', {
                        toSocketId: socketId,
                        signal: { type: 'offer', sdp: offer },
                        fromUser: currentUserData,
                        conversationId
                    });
                } catch (err) {
                    console.error('Error offering to newcomer peer in group call:', err);
                }
            }
        };

        const onGroupPeerLeft = ({ socketId }) => {
            const entry = groupPeersRef.current.get(socketId);
            if (entry?.pc) {
                try { entry.pc.close(); } catch (e) {}
                groupPeersRef.current.delete(socketId);
            }
            setGroupParticipants(prev => prev.filter(p => p.socketId !== socketId));
        };

        const onGroupCallSignal = async ({ signal, fromSocketId, fromUser, conversationId }) => {
            if (!fromSocketId || fromSocketId === socket.id) return;
            if (!callAcceptedRef.current) {
                callAcceptedRef.current = true;
                setCallAccepted(true);
                if (ringTimeoutRef.current) {
                    clearTimeout(ringTimeoutRef.current);
                    ringTimeoutRef.current = null;
                }
                ringtoneRef.current?.stop?.();
                ringtoneRef.current?.pause?.();
                ringtoneRef.current = null;
            }
            const iceServers = await getIceServers();
            const pc = buildGroupPeerConnection(fromSocketId, fromUser, iceServers);
            const entry = groupPeersRef.current.get(fromSocketId);

            if (signal.type === 'offer') {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                    if (entry?.queue?.length) {
                        for (const c of entry.queue) {
                            await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
                        }
                        entry.queue = [];
                    }
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    socket.emit('group_call:signal', {
                        toSocketId: fromSocketId,
                        signal: { type: 'answer', sdp: answer },
                        fromUser: currentUserData,
                        conversationId
                    });
                } catch (err) {
                    console.error('Error answering group call offer:', err);
                }
            } else if (signal.type === 'answer') {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                    if (entry?.queue?.length) {
                        for (const c of entry.queue) {
                            await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
                        }
                        entry.queue = [];
                    }
                } catch (err) {
                    console.error('Error applying group call answer:', err);
                }
            } else if (signal.type === 'candidate' && signal.candidate) {
                try {
                    if (pc.remoteDescription && pc.remoteDescription.type) {
                        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                    } else {
                        entry.queue = entry.queue || [];
                        entry.queue.push(signal.candidate);
                    }
                } catch (candErr) {
                    console.warn('Ignored transient group ICE candidate:', candErr);
                }
            }
        };

        socket.on('call_accepted', onCallAccepted);
        socket.on('webrtc_ice_candidate', onIceCandidate);
        socket.on('call_ended', onCallEnded);
        socket.on('call_rejected', onCallRejected);
        socket.on('group_call:peer_joined', onGroupPeerJoined);
        socket.on('group_call:peer_left', onGroupPeerLeft);
        socket.on('group_call:signal', onGroupCallSignal);
        return () => {
            socket.off('call_accepted', onCallAccepted);
            socket.off('webrtc_ice_candidate', onIceCandidate);
            socket.off('call_ended', onCallEnded);
            socket.off('call_rejected', onCallRejected);
            socket.off('group_call:peer_joined', onGroupPeerJoined);
            socket.off('group_call:peer_left', onGroupPeerLeft);
            socket.off('group_call:signal', onGroupCallSignal);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket]);

    const toggleMute = () => {
        const track = localStream.current?.getAudioTracks()[0];
        if (track) { track.enabled = !track.enabled; setIsMuted(!track.enabled); }
    };

    const toggleVideo = () => {
        const track = localStream.current?.getVideoTracks()[0];
        if (track) { track.enabled = !track.enabled; setIsVideoOff(!track.enabled); }
    };

    if (!callConfig?.active) return null;

    const otherParticipant = getOtherParticipant();
    const otherDisplayName = otherParticipant?.displayName || otherParticipant?.name || otherParticipant?.username || callConfig?.targetUser?.displayName || 'Contact';
    const otherAvatarUrl = otherParticipant?.avatarUrl || callConfig?.targetUser?.avatarUrl;

    const isGroupCall = !!(callConfig?.isGroupCall || callConfig?.callerData?.isGroupCall || activeConversation?.type === 'group');
    const groupName = callConfig?.groupName || callConfig?.callerData?.groupName || activeConversation?.name || 'Group';
    const groupAvatar = callConfig?.groupAvatarUrl || callConfig?.callerData?.groupAvatarUrl || activeConversation?.avatarUrl;

    const callerName = isGroupCall
        ? (callConfig.isReceiving
            ? `${groupName} (from ${callConfig.callerData?.callerInfo?.name || callConfig.callerData?.callerInfo?.displayName || 'Member'})`
            : `${groupName} (Group Call)`)
        : (callConfig.isReceiving
            ? (callConfig.callerData?.callerInfo?.name || otherDisplayName || 'Someone')
            : otherDisplayName);

    const callerAvatar = isGroupCall
        ? (groupAvatar || '/default-avatar.svg')
        : (callConfig.isReceiving
            ? (callConfig.callerData?.callerInfo?.avatarUrl || otherAvatarUrl || '/default-avatar.svg')
            : (otherAvatarUrl || '/default-avatar.svg'));

    const myName = currentUserData?.displayName || 'You';
    const myAvatar = currentUserData?.avatarUrl || user?.picture || '/default-avatar.svg';

    const isVideoCall = callConfig.callType === 'video';

    const avatarFallback = () => '/default-avatar.svg';

    return (
        <OverlayContainer>
            <BackgroundBlur style={{ backgroundImage: `url(${callerAvatar})` }} />

            {!callAccepted ? (
                <CallerInfo>
                    {/* DevSup Call Pill (WhatsApp Style with DevSup Theme) */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 18px',
                        borderRadius: '24px',
                        border: '1.5px solid rgba(0, 229, 255, 0.45)',
                        backgroundColor: 'rgba(0, 229, 255, 0.08)',
                        backdropFilter: 'blur(10px)',
                        color: '#00e5ff',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        marginBottom: '20px',
                        boxShadow: '0 4px 16px rgba(0, 229, 255, 0.18)',
                        userSelect: 'none'
                    }}>
                        {isVideoCall ? <Video size={16} color="#00e5ff" /> : <Phone size={16} color="#00e5ff" />}
                        <span>{isGroupCall ? (isVideoCall ? 'DevSup Group Video Call' : 'DevSup Group Voice Call') : (isVideoCall ? 'DevSup Video Call' : 'DevSup Voice Call')}</span>
                    </div>

                    <CallingAnimation>
                        <AvatarImg 
                            src={callerAvatar} 
                            alt={callerName} 
                            onError={e => { e.target.onerror = null; e.target.src = avatarFallback(callerName); }} 
                            style={{
                                width: '124px',
                                height: '124px',
                                borderRadius: '50%',
                                border: '3px solid #00e5ff',
                                boxShadow: '0 0 35px rgba(0, 229, 255, 0.35)',
                                objectFit: 'cover'
                            }}
                        />
                    </CallingAnimation>
                    <CallerNameText>
                        {callerName}
                    </CallerNameText>
                    <CallStatusText>
                        {callConfig.isReceiving 
                            ? (isGroupCall ? `Incoming group call from ${callConfig.callerData?.callerInfo?.name || 'a member'}…` : 'Incoming call…') 
                            : (isGroupCall ? 'Calling group members…' : 'Ringing…')}
                    </CallStatusText>

                    {callConfig.isReceiving ? (
                        <div style={{ display: 'flex', gap: '56px', marginTop: '48px', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => handleEndCall(true)}
                                    title="Decline"
                                    style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        backgroundColor: '#ef4444',
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        boxShadow: '0 8px 24px rgba(239, 68, 68, 0.45)',
                                        transition: 'transform 0.15s ease'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <PhoneOff size={28} />
                                </button>
                                <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.75)', fontWeight: '500' }}>Decline</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={answerCall}
                                    title={isAnswering ? 'Connecting' : 'Accept'}
                                    disabled={isAnswering}
                                    style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        backgroundColor: '#10b981',
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: isAnswering ? 'wait' : 'pointer',
                                        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.45)',
                                        opacity: isAnswering ? 0.7 : 1,
                                        transition: 'transform 0.15s ease'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    {isAnswering ? <span style={{ fontSize: '1.2rem' }}>…</span> : <Phone size={28} />}
                                </button>
                                <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.75)', fontWeight: '500' }}>Accept</span>
                            </div>
                        </div>
                    ) : (
                        <div style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <button
                                type="button"
                                onClick={() => handleEndCall(true)}
                                title="End Call"
                                style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    backgroundColor: '#ef4444',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    boxShadow: '0 8px 24px rgba(239, 68, 68, 0.45)',
                                    transition: 'transform 0.15s ease'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <PhoneOff size={28} />
                            </button>
                            <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.75)', fontWeight: '500' }}>Cancel</span>
                        </div>
                    )}
                </CallerInfo>

            ) : isVideoCall ? (
                <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#080f15' }}>
                    {/* Top Header Controls (Back chevron button + duration badge) */}
                    <div style={{
                        position: 'absolute',
                        top: 'max(16px, env(safe-area-inset-top))',
                        left: '16px',
                        right: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        zIndex: 60,
                        pointerEvents: 'none'
                    }}>
                        <button
                            type="button"
                            onClick={() => handleEndCall(true)}
                            title="Minimize / Exit Call"
                            style={{
                                pointerEvents: 'auto',
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(0, 0, 0, 0.45)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <ChevronLeft size={24} />
                        </button>

                        {/* DevSup Video Call Pill */}
                        <div style={{
                            pointerEvents: 'auto',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: 'rgba(0, 0, 0, 0.55)',
                            backdropFilter: 'blur(10px)',
                            border: '1.5px solid rgba(0, 229, 255, 0.45)',
                            borderRadius: '24px',
                            padding: '6px 16px',
                            fontSize: '0.88rem',
                            fontWeight: '600',
                            color: '#00e5ff',
                            boxShadow: '0 4px 16px rgba(0, 229, 255, 0.15)'
                        }}>
                            <Video size={15} color="#00e5ff" />
                            <span>DevSup Video Call</span>
                        </div>

                        <div style={{
                            pointerEvents: 'auto',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '20px',
                            padding: '6px 14px',
                            fontSize: '0.88rem',
                            fontWeight: '600',
                            color: '#00e5ff'
                        }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                            <span>{formatDuration(callDuration)}</span>
                        </div>
                    </div>

                    {/* Main Video Area */}
                    <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
                        {isGroupCall ? (
                            groupParticipants.length === 0 ? (
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '16px',
                                    backgroundColor: '#080f15',
                                    padding: '24px'
                                }}>
                                    <CallingAnimation>
                                        <AvatarImg 
                                            src={callerAvatar} 
                                            alt={callerName} 
                                            onError={e => { e.currentTarget.src = avatarFallback(callerName); }} 
                                            style={{
                                                width: '110px',
                                                height: '110px',
                                                borderRadius: '50%',
                                                border: '3px solid #00e5ff',
                                                boxShadow: '0 0 35px rgba(0, 229, 255, 0.35)',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    </CallingAnimation>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '1.4rem', fontWeight: '700', color: '#ffffff' }}>{callerName}</span>
                                        <span style={{ color: '#00e5ff', fontSize: '0.92rem', fontWeight: '500' }}>Waiting for group members to join…</span>
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    padding: '70px 16px 110px',
                                    display: 'grid',
                                    gridTemplateColumns: groupParticipants.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))',
                                    gap: '14px',
                                    overflowY: 'auto'
                                }}>
                                    {groupParticipants.map(peer => (
                                        <div
                                            key={peer.socketId}
                                            style={{
                                                position: 'relative',
                                                backgroundColor: '#0c1622',
                                                borderRadius: '16px',
                                                overflow: 'hidden',
                                                border: '1.5px solid rgba(0, 229, 255, 0.25)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                minHeight: '200px'
                                            }}
                                        >
                                            <video
                                                autoPlay
                                                playsInline
                                                ref={el => {
                                                    if (el && peer.stream && el.srcObject !== peer.stream) {
                                                        el.srcObject = peer.stream;
                                                        el.play().catch(() => {});
                                                    }
                                                }}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    display: peer.isVideo ? 'block' : 'none'
                                                }}
                                            />
                                            {!peer.isVideo && (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                                    <img
                                                        src={peer.avatarUrl || '/default-avatar.svg'}
                                                        alt={peer.name}
                                                        onError={e => { e.currentTarget.src = '/default-avatar.svg'; }}
                                                        style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #00e5ff' }}
                                                    />
                                                    <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.9rem' }}>{peer.name}</span>
                                                </div>
                                            )}
                                            <audio
                                                autoPlay
                                                playsInline
                                                ref={el => {
                                                    if (el && peer.stream && el.srcObject !== peer.stream) {
                                                        el.srcObject = peer.stream;
                                                        el.play().catch(() => {});
                                                    }
                                                }}
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '8px',
                                                left: '8px',
                                                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                                                padding: '3px 8px',
                                                borderRadius: '8px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                color: '#ffffff'
                                            }}>
                                                {peer.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            <>
                                <video
                                    ref={remoteVideoCallbackRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    onPlaying={() => setRemoteVideoActive(true)}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        display: remoteVideoActive ? 'block' : 'none'
                                    }}
                                />

                                {!remoteVideoActive && (
                                    <div style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '16px',
                                        backgroundColor: '#080f15'
                                    }}>
                                        <img
                                            src={callerAvatar}
                                            alt={callerName}
                                            onError={e => { e.currentTarget.src = avatarFallback(callerName); }}
                                            style={{
                                                width: '110px',
                                                height: '110px',
                                                borderRadius: '50%',
                                                border: '3px solid #00e5ff',
                                                boxShadow: '0 0 35px rgba(0, 229, 255, 0.35)',
                                                objectFit: 'cover'
                                            }}
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontSize: '1.4rem', fontWeight: '700', color: '#ffffff' }}>{callerName}</span>
                                            <span style={{ color: '#00e5ff', fontSize: '0.92rem', fontWeight: '500' }}>Connecting…</span>
                                        </div>
                                    </div>
                                )}

                                {/* Remote User label pill in bottom-left */}
                                {remoteVideoActive && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '115px',
                                        left: '20px',
                                        backgroundColor: 'rgba(0, 0, 0, 0.55)',
                                        backdropFilter: 'blur(8px)',
                                        borderRadius: '12px',
                                        padding: '6px 14px',
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        color: '#ffffff',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        zIndex: 10
                                    }}>
                                        {callerName}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Floating Picture-in-Picture Local Video (WhatsApp style across mobile & desktop) */}
                    <div
                        title="Your camera"
                        style={{
                            position: 'absolute',
                            top: 'max(70px, env(safe-area-inset-top) + 60px)',
                            right: '18px',
                            width: 'clamp(100px, 26vw, 175px)',
                            aspectRatio: '3/4',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            backgroundColor: '#0c1622',
                            border: '2px solid rgba(0, 229, 255, 0.5)',
                            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.75)',
                            zIndex: 50,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform 0.2s ease'
                        }}
                    >
                        <video
                            ref={localVideoCallbackRef}
                            autoPlay
                            playsInline
                            muted
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transform: 'scaleX(-1)',
                                display: isVideoOff ? 'none' : 'block'
                            }}
                        />

                        {isVideoOff && (
                            <div style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '10px',
                                textAlign: 'center',
                                backgroundColor: '#0f172a'
                            }}>
                                <img
                                    src={myAvatar}
                                    alt={myName}
                                    onError={e => { e.currentTarget.src = avatarFallback(myName); }}
                                    style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                                />
                                <span style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: '500' }}>Camera off</span>
                            </div>
                        )}

                        <div style={{
                            position: 'absolute',
                            bottom: '6px',
                            left: '6px',
                            backgroundColor: 'rgba(0, 0, 0, 0.65)',
                            borderRadius: '6px',
                            padding: '2px 6px',
                            fontSize: '0.68rem',
                            fontWeight: '600',
                            color: '#ffffff'
                        }}>
                            You {isMuted ? '🔇' : ''}
                        </div>
                    </div>
                </div>

            ) : (
                /* Audio call UI */
                <CallerInfo>
                    {/* DevSup Voice Call Pill (WhatsApp Style with DevSup Theme) */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 18px',
                        borderRadius: '24px',
                        border: '1.5px solid rgba(0, 229, 255, 0.45)',
                        backgroundColor: 'rgba(0, 229, 255, 0.08)',
                        backdropFilter: 'blur(10px)',
                        color: '#00e5ff',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        marginBottom: '20px',
                        boxShadow: '0 4px 16px rgba(0, 229, 255, 0.18)',
                        userSelect: 'none'
                    }}>
                        <Phone size={16} color="#00e5ff" />
                        <span>{isGroupCall ? 'DevSup Group Voice Call' : 'DevSup Voice Call'}</span>
                    </div>

                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AvatarImg 
                            src={callerAvatar} 
                            alt={callerName} 
                            onError={e => { e.target.onerror = null; e.target.src = avatarFallback(callerName); }} 
                            style={{ 
                                width: '124px',
                                height: '124px',
                                borderRadius: '50%',
                                border: '3px solid #00e5ff', 
                                boxShadow: '0 0 35px rgba(0, 229, 255, 0.35)',
                                objectFit: 'cover'
                            }} 
                        />
                    </div>
                    <CallerNameText>{callerName}</CallerNameText>
                    {isGroupCall && groupParticipants.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '320px' }}>
                            {groupParticipants.map(peer => (
                                <div key={peer.socketId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                                    <img
                                        src={peer.avatarUrl || '/default-avatar.svg'}
                                        alt={peer.name}
                                        onError={e => { e.currentTarget.src = '/default-avatar.svg'; }}
                                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #00e5ff' }}
                                    />
                                    <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.75)', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {peer.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
                        <span style={{ color: '#00e5ff', fontSize: '1.2rem', fontWeight: '600', letterSpacing: '1px' }}>
                            {formatDuration(callDuration)}
                        </span>
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.55)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🔒 End-to-end encrypted</span>
                    </div>
                    <video ref={remoteVideoCallbackRef} autoPlay playsInline muted style={{ display: 'none' }} />
                    <video ref={localVideoCallbackRef} autoPlay playsInline muted style={{ display: 'none' }} />
                </CallerInfo>
            )}

            <audio ref={remoteAudioCallbackRef} autoPlay playsInline />
            {isGroupCall && groupParticipants.map(peer => (
                <audio
                    key={`group-audio-stream-${peer.socketId}`}
                    autoPlay
                    playsInline
                    ref={el => {
                        if (el && peer.stream && el.srcObject !== peer.stream) {
                            el.srcObject = peer.stream;
                            el.play().catch(() => {});
                        }
                    }}
                />
            ))}

            {/* Controls */}
            {callAccepted && (
                <ControlsBar>
                    <ControlButton variant={isMuted ? 'danger' : undefined} onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
                        {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                    </ControlButton>
                    {isVideoCall && (
                        <ControlButton variant={isVideoOff ? 'danger' : undefined} onClick={toggleVideo} title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}>
                            {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
                        </ControlButton>
                    )}
                    <ControlButton onClick={() => { setIsAddingPerson(true); setAddPersonSearchQuery(''); }} title="Add Person">
                        <UserPlus size={22} />
                    </ControlButton>
                    <ControlButton variant="danger" onClick={() => handleEndCall(true)} title="End Call">
                        <PhoneOff size={22} />
                    </ControlButton>
                </ControlsBar>
            )}

            {/* Add person modal (WhatsApp Style with DevSup Theme) */}
            {isAddingPerson && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(8px)' }}>
                    <div style={{ width: '92%', maxWidth: '440px', backgroundColor: '#0f172a', border: '1px solid rgba(0, 229, 255, 0.3)', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <UserPlus size={20} color="#00e5ff" />
                                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '600', color: '#ffffff' }}>Add to Ongoing Call</h3>
                            </div>
                            <button onClick={() => setIsAddingPerson(false)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
                        </div>

                        {/* Search Input */}
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
                            <input
                                type="text"
                                placeholder="Search by name or username..."
                                value={addPersonSearchQuery}
                                onChange={e => setAddPersonSearchQuery(e.target.value)}
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '10px 14px 10px 38px',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    color: '#ffffff',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Participant List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                            {(() => {
                                const currentParticipantIds = new Set([
                                    String(mongoUserId || ''),
                                    String(callConfig?.callerData?._id || callConfig?.callerData || ''),
                                    String(getOtherParticipantId() || '')
                                ]);

                                const pool = [];
                                const seenIds = new Set();
                                [...(availableContacts || []), ...(allUsers || []), ...(activeConversation?.participants || [])].forEach(u => {
                                    const id = String(u?._id || u);
                                    if (id && !currentParticipantIds.has(id) && !seenIds.has(id)) {
                                        seenIds.add(id);
                                        pool.push(u);
                                    }
                                });

                                const q = addPersonSearchQuery.trim().toLowerCase();
                                const filtered = pool.filter(u => {
                                    if (!q) return true;
                                    const name = (u.displayName || '').toLowerCase();
                                    const uname = (u.username || '').toLowerCase();
                                    return name.includes(q) || uname.includes(q);
                                });

                                if (filtered.length === 0) {
                                    return (
                                        <div style={{ color: '#94A3B8', textAlign: 'center', padding: '30px 16px', fontSize: '0.9rem' }}>
                                            {addPersonSearchQuery.trim() ? `No contacts found matching "${addPersonSearchQuery}"` : 'No other contacts available to add.'}
                                        </div>
                                    );
                                }

                                return filtered.map(contact => (
                                    <div
                                        key={contact._id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '10px 12px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255, 255, 255, 0.06)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                                            <img
                                                src={contact.avatarUrl || '/default-avatar.svg'}
                                                alt={contact.displayName || 'User'}
                                                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                                onError={e => { e.currentTarget.src = '/default-avatar.svg'; }}
                                            />
                                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                                <span style={{ fontWeight: '600', fontSize: '0.92rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {contact.displayName || contact.username || 'Developer'}
                                                </span>
                                                <span style={{ fontSize: '0.78rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {contact.techDiscipline || (contact.username ? `@${contact.username}` : 'Available')}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                const targetId = String(contact._id || contact);
                                                if (!targetId || !socket) return;
                                                const targetName = contact.displayName || contact.username || 'user';
                                                try {
                                                    setToastMsg(`Inviting ${targetName} to call…`);
                                                    const iceServers = await getIceServers();
                                                    const pc = buildPeerConnection(targetId, iceServers);
                                                    const offer = await pc.createOffer();
                                                    await pc.setLocalDescription(offer);

                                                    socket.emit('call_user', {
                                                        userToCall: targetId,
                                                        signalData: offer,
                                                        from: mongoUserId,
                                                        callerInfo: {
                                                            name: currentUserData?.displayName || 'Someone',
                                                            avatarUrl: currentUserData?.avatarUrl || '',
                                                            techDiscipline: currentUserData?.techDiscipline || ''
                                                        },
                                                        callType: isVideoCall ? 'video' : 'audio',
                                                        conversationId: activeConversation?._id || callConfig?.conversationId,
                                                        callSessionId: callSessionIdRef.current,
                                                        isGroupCall: true
                                                    });

                                                    setIsAddingPerson(false);
                                                    setToastMsg(`Invited ${targetName} to the call!`);
                                                } catch (err) {
                                                    console.error('Error adding user to call:', err);
                                                    setToastMsg(`Could not invite ${targetName}`);
                                                }
                                            }}
                                            style={{
                                                backgroundColor: '#06B6D4',
                                                color: '#ffffff',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '20px',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                fontSize: '0.82rem',
                                                transition: 'all 0.15s ease',
                                                flexShrink: 0
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0891b2'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#06b6d4'}
                                        >
                                            Invite
                                        </button>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toastMsg && (
                <div style={{ position: 'fixed', top: '32px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#06B6D4', color: '#fff', padding: '10px 22px', borderRadius: '30px', fontWeight: '500', boxShadow: '0 10px 25px rgba(6, 182, 212, 0.4)', zIndex: 10001 }}>
                    {toastMsg}
                </div>
            )}

            {/* Call Unavailable Dialog (DevSup Theme) */}
            {callDialog && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.82)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10002,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: '#0c1622',
                        border: '1px solid rgba(0, 229, 255, 0.25)',
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: '380px',
                        padding: '30px 24px 24px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.85), 0 0 30px rgba(0, 229, 255, 0.1)',
                        color: '#ffffff'
                    }}>
                        <div style={{ position: 'relative', marginBottom: '18px' }}>
                            <img
                                src={callerAvatar}
                                alt={callerName}
                                onError={(e) => { e.currentTarget.src = '/default-avatar.svg'; }}
                                style={{ width: '68px', height: '68px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0, 229, 255, 0.35)' }}
                            />
                            <div style={{
                                position: 'absolute',
                                bottom: '-2px',
                                right: '-2px',
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                backgroundColor: '#ef4444',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid #0c1622',
                                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                            }}>
                                <PhoneOff size={14} color="#fff" />
                            </div>
                        </div>

                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.3px' }}>
                            {callDialog.title}
                        </h3>
                        <p style={{ margin: '0 0 26px 0', fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.5 }}>
                            {callDialog.message}
                        </p>

                        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    setCallDialog(null);
                                    handleEndCallRef.current?.(false);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '11px 16px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    borderRadius: '24px',
                                    color: '#e2e8f0',
                                    fontSize: '0.92rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.14)'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setCallDialog(null);
                                    handleEndCallRef.current?.(false);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '11px 16px',
                                    backgroundColor: '#00e5ff',
                                    border: 'none',
                                    borderRadius: '24px',
                                    color: '#080f15',
                                    fontSize: '0.92rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 18px rgba(0, 229, 255, 0.38)',
                                    transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#06b6d4'; e.currentTarget.style.color = '#ffffff'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#00e5ff'; e.currentTarget.style.color = '#080f15'; }}
                            >
                                Message
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </OverlayContainer>
    );
};

export default CallOverlay;
