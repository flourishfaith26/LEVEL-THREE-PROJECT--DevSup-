import { useEffect, useRef, useState, useCallback } from 'react';
import { styled, keyframes } from '../stitches.config.js';
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff, UserPlus, X } from 'lucide-react';

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
    '0%': { boxShadow: '0 0 0 0 rgba(6, 182, 212, 0.6), 0 0 0 0 rgba(6, 182, 212, 0.4)' },
    '50%': { boxShadow: '0 0 0 28px rgba(6, 182, 212, 0), 0 0 0 55px rgba(6, 182, 212, 0.1)' },
    '100%': { boxShadow: '0 0 0 0 rgba(6, 182, 212, 0), 0 0 0 0 rgba(6, 182, 212, 0)' },
});

const CallingAnimation = styled('div', {
    position: 'relative',
    animation: `${pulseAnimation} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: -10, left: -10, right: -10, bottom: -10,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))',
        zIndex: 1,
    }
});

const ControlsBar = styled('div', {
    position: 'absolute',
    bottom: '40px',
    display: 'flex',
    gap: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: '18px 28px',
    borderRadius: '40px',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
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
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    color: '#fff',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    '&:hover': { transform: 'translateY(-3px) scale(1.05)' },
    variants: {
        variant: {
            danger: {
                backgroundColor: '#EF4444',
                boxShadow: '0 10px 25px rgba(239, 68, 68, 0.4)',
                '&:hover': { backgroundColor: '#DC2626', boxShadow: '0 15px 30px rgba(239, 68, 68, 0.5)' }
            },
            success: {
                backgroundColor: '#10B981',
                boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
                '&:hover': { backgroundColor: '#059669' }
            },
            active: {
                backgroundColor: 'rgba(6, 182, 212, 0.25)',
                color: '#06B6D4',
                border: '1px solid rgba(6, 182, 212, 0.5)',
            },
        },
        pulsing: {
            true: { animation: `${pulseAnimation} 2s infinite` }
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
    backendUrl
}) => {
    const [callAccepted, setCallAccepted] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(callConfig?.callType === 'audio');
    const [remoteVideoActive, setRemoteVideoActive] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [isAddingPerson, setIsAddingPerson] = useState(false);
    const [toastMsg, setToastMsg] = useState(null);
    const [isAnswering, setIsAnswering] = useState(false);

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
        timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
        return () => clearInterval(timerRef.current);
    }, [callAccepted]);

    // Ringtone: play while ringing/receiving, stop when accepted or ended
    useEffect(() => {
        if (!callConfig?.active) return;
        if (callAccepted) {
            // Stop ringing once call is accepted
            ringtoneRef.current?.pause();
            ringtoneRef.current = null;
            return;
        }
        // Create and play ringtone
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.loop = true;
        audio.volume = 0.5;
        audio.play().catch((error) => {
            console.warn('Unable to play call ringtone:', error);
        });
        ringtoneRef.current = audio;
        return () => {
            audio.pause();
            audio.currentTime = 0;
            ringtoneRef.current = null;
        };
    }, [callConfig?.active, callAccepted]);

    const buildPeerConnection = useCallback((targetUserId, iceServers) => {
        const pc = new RTCPeerConnection({ iceServers });

        pc.onicecandidate = (e) => {
            if (e.candidate && socket) {
                socket.emit('webrtc_ice_candidate', { to: targetUserId, candidate: e.candidate });
            }
        };

        pc.ontrack = (e) => {
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

    const getOtherParticipant = useCallback(() => {
        if (!activeConversation?.participants) return null;
        return activeConversation.participants.find(p => {
            const id = typeof p === 'object' && p !== null ? (p._id || p.id) : p;
            return String(id) !== String(mongoUserId);
        }) || null;
    }, [activeConversation?.participants, mongoUserId]);

    const getOtherParticipantId = useCallback(() => {
        const other = getOtherParticipant();
        if (!other) return null;
        return String(typeof other === 'object' && other !== null ? (other._id || other.id) : other);
    }, [getOtherParticipant]);

    const handleEndCallRef = useRef(null);

    const handleEndCall = useCallback((emitEvent = true) => {
        clearInterval(timerRef.current);
        if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
        if (socket && callConfig && !callConfig.isReceiving) {
            const isGroup = activeConversation?.type === 'group';
            const otherUserId = isGroup ? null : getOtherParticipantId();
            socket.emit('log_call', {
                callerId: mongoUserId,
                receiverId: otherUserId,
                conversationId: activeConversation?._id,
                type: callConfig.callType,
                status: callAcceptedRef.current ? 'completed' : 'missed'
            });
        }
        if (emitEvent && socket && callConfig) {
            const otherUserId = callConfig.isReceiving
                ? (callConfig.callerData?.from ? String(callConfig.callerData.from) : null)
                : getOtherParticipantId();
            if (otherUserId) {
                if (!callAcceptedRef.current && callConfig.isReceiving) {
                    socket.emit('reject_call', { to: otherUserId });
                } else {
                    socket.emit('end_call', { to: otherUserId });
                }
            }
        }
        // Stop ringtone
        ringtoneRef.current?.pause();
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
                callType: callConfig.callType
            });

            if (!response?.ok) {
                throw new Error(response?.error || 'Could not connect the call.');
            }
        } catch (error) {
            // Only abort if the call hasn't already been accepted — a stale timeout
            // must not tear down a call that connected just fine.
            if (!callAcceptedRef.current) {
                console.error('Unable to start call:', error);
                alert(error.message || 'Could not connect the call. Please try again.');
                handleEndCallRef.current?.(false);
            }
        }
    };

    const answerCall = async () => {
        if (isAnswering) return;
        setIsAnswering(true);
        try {
            await getMedia();
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
                alert(err.message || 'Could not access camera or microphone.');
                handleEndCallRef.current?.(true);
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
                ringTimeoutRef.current = setTimeout(() => {
                    if (!callAcceptedRef.current) handleEndCallRef.current?.(true);
                }, 30000);
            } catch (err) {
                console.error('initMedia error:', err);
                if (!cancelled) { alert(err.message || 'Could not access camera/microphone.'); handleEndCallRef.current?.(); }
            }
        })();
        return () => { cancelled = true; };
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
                if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
            } catch (error) {
                console.error('Unable to apply call answer:', error);
                // If the call is already accepted and running, don't kill it over a
                // duplicate or late call_accepted event.
                if (!callAcceptedRef.current) {
                    alert('Could not connect the call. Please try again.');
                    handleEndCall(true);
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
        const onCallEnded = () => handleEndCall(false);
        const onCallRejected = () => { if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current); handleEndCall(false); };

        socket.on('call_accepted', onCallAccepted);
        socket.on('webrtc_ice_candidate', onIceCandidate);
        socket.on('call_ended', onCallEnded);
        socket.on('call_rejected', onCallRejected);
        return () => {
            socket.off('call_accepted', onCallAccepted);
            socket.off('webrtc_ice_candidate', onIceCandidate);
            socket.off('call_ended', onCallEnded);
            socket.off('call_rejected', onCallRejected);
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
    const otherDisplayName = otherParticipant?.displayName || 'Contact';
    const otherAvatarUrl = otherParticipant?.avatarUrl;

    const callerName = callConfig.isReceiving
        ? callConfig.callerData?.callerInfo?.name || 'Someone'
        : otherDisplayName;

    const callerAvatar = callConfig.isReceiving
        ? (callConfig.callerData?.callerInfo?.avatarUrl
            || otherAvatarUrl
            || '/default-avatar.svg')
        : (otherAvatarUrl
            || '/default-avatar.svg');

    const myName = currentUserData?.displayName || 'You';
    const myAvatar = currentUserData?.avatarUrl || user?.picture || '/default-avatar.svg';

    const isVideoCall = callConfig.callType === 'video';

    const avatarFallback = () => '/default-avatar.svg';

    return (
        <OverlayContainer>
            <BackgroundBlur style={{ backgroundImage: `url(${callerAvatar})` }} />

            {!callAccepted ? (
                <CallerInfo>
                    <CallingAnimation>
                        <AvatarImg src={callerAvatar} alt={callerName} onError={e => { e.target.onerror = null; e.target.src = avatarFallback(callerName); }} />
                    </CallingAnimation>
                    <CallerNameText>
                        {callConfig.isReceiving ? `${callerName} is calling…` : `Calling ${callerName}…`}
                    </CallerNameText>
                    <CallStatusText>{isVideoCall ? '📹 Video Call' : '🎙️ Voice Call'}</CallStatusText>

                    {callConfig.isReceiving && (
                        <div style={{ display: 'flex', gap: '32px', marginTop: '44px' }}>
                            <ControlButton variant="danger" onClick={() => handleEndCall(true)} title="Decline">
                                <PhoneOff size={26} />
                            </ControlButton>
                            <ControlButton
                                variant="success"
                                pulsing={!isAnswering}
                                onClick={answerCall}
                                title={isAnswering ? 'Connecting' : 'Accept'}
                                disabled={isAnswering}
                                style={{ opacity: isAnswering ? 0.7 : 1, cursor: isAnswering ? 'wait' : 'pointer' }}
                            >
                                {isAnswering ? <span>…</span> : <Phone size={26} />}
                            </ControlButton>
                        </div>
                    )}
                </CallerInfo>

            ) : isVideoCall ? (
                <VideoGrid>
                    {/* Remote tile */}
                    <VideoWrapper>
                                <video
                            ref={remoteVideoCallbackRef}
                            autoPlay
                            playsInline
                                    muted
                                    onPlaying={() => setRemoteVideoActive(true)}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: remoteVideoActive ? 'block' : 'none' }}
                                />
                        {!remoteVideoActive && (
                            <AvatarFallback>
                                <SmallAvatarImg src={callerAvatar} alt={callerName} onError={e => { e.target.onerror = null; e.target.src = avatarFallback(callerName); }} />
                                <span style={{ color: '#94A3B8', fontSize: '0.9rem' }}>Connecting…</span>
                            </AvatarFallback>
                        )}
                        <VideoLabel>{callerName}</VideoLabel>
                    </VideoWrapper>

                    {/* Local tile */}
                    <VideoWrapper isLocal={true}>
                        <video
                            ref={localVideoCallbackRef}
                            autoPlay
                            playsInline
                            muted
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: isVideoOff ? 'none' : 'block' }}
                        />
                        {isVideoOff && (
                            <AvatarFallback>
                                <SmallAvatarImg src={myAvatar} alt={myName} onError={e => { e.target.onerror = null; e.target.src = avatarFallback(myName); }} />
                                <span style={{ color: '#94A3B8', fontSize: '0.9rem' }}>Camera off</span>
                            </AvatarFallback>
                        )}
                        <VideoLabel>You {isMuted ? '🔇' : ''}</VideoLabel>
                    </VideoWrapper>
                </VideoGrid>

            ) : (
                /* Audio call UI */
                <CallerInfo>
                    <CallingAnimation>
                        <AvatarImg src={callerAvatar} alt={callerName} onError={e => { e.target.onerror = null; e.target.src = avatarFallback(callerName); }} style={{ border: '4px solid #10B981' }} />
                    </CallingAnimation>
                    <CallerNameText>{callerName}</CallerNameText>
                    <CallStatusText style={{ color: '#10B981' }}>{formatDuration(callDuration)}</CallStatusText>
                    <video ref={remoteVideoCallbackRef} autoPlay playsInline muted style={{ display: 'none' }} />
                    <video ref={localVideoCallbackRef} autoPlay playsInline muted style={{ display: 'none' }} />
                </CallerInfo>
            )}

            <audio ref={remoteAudioCallbackRef} autoPlay playsInline />

            {/* Duration badge (video calls) */}
            {callAccepted && isVideoCall && (
                <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: '20px', padding: '6px 16px', fontSize: '0.9rem', fontWeight: '600', color: '#10B981', letterSpacing: '1px' }}>
                    {formatDuration(callDuration)}
                </div>
            )}

            {/* Controls */}
            {(!callConfig.isReceiving || callAccepted) && (
                <ControlsBar>
                    <ControlButton variant={isMuted ? 'danger' : undefined} onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
                        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </ControlButton>
                    {isVideoCall && (
                        <ControlButton variant={isVideoOff ? 'danger' : undefined} onClick={toggleVideo} title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}>
                            {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                        </ControlButton>
                    )}
                    <ControlButton onClick={() => setIsAddingPerson(true)} title="Add Person">
                        <UserPlus size={20} />
                    </ControlButton>
                    <ControlButton variant="danger" onClick={() => handleEndCall(true)} title="End Call">
                        <PhoneOff size={20} />
                    </ControlButton>
                </ControlsBar>
            )}

            {/* Add person modal */}
            {isAddingPerson && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(5px)' }}>
                    <div style={{ width: '90%', maxWidth: '400px', backgroundColor: 'rgba(30, 41, 59, 0.97)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Add to Call</h3>
                            <button onClick={() => setIsAddingPerson(false)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={22} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
                            {activeConversation?.participants?.filter(p => p._id !== mongoUserId).map(p => (
                                <div key={p._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <img src={p.avatarUrl || '/default-avatar.svg'} alt={p.displayName} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} onError={e => { e.currentTarget.src = '/default-avatar.svg'; }} />
                                        <span style={{ fontWeight: '500', fontSize: '0.95rem' }}>{p.displayName}</span>
                                    </div>
                                    <button onClick={() => { setToastMsg(`Ringing ${p.displayName}…`); setIsAddingPerson(false); }} style={{ backgroundColor: '#06B6D4', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: '20px', cursor: 'pointer', fontWeight: '500', fontSize: '0.85rem' }}>Add</button>
                                </div>
                            ))}
                            {(!activeConversation?.participants || activeConversation.participants.filter(p => p._id !== mongoUserId).length === 0) && (
                                <div style={{ color: '#94A3B8', textAlign: 'center', padding: '20px', fontSize: '0.9rem' }}>No other participants available.</div>
                            )}
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
        </OverlayContainer>
    );
};

export default CallOverlay;
