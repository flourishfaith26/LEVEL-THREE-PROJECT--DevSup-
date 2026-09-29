import { useEffect, useState, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { io } from 'socket.io-client';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import hljs from 'highlight.js';
import { styled, keyframes } from '../stitches.config.js';
import { detectEcosystemLink } from '../utils/urlParser.js';
import { getDailyUserColor } from '../utils/colorUtils.js';
import Whiteboard from '../components/Whiteboard';
import CallOverlay from '../components/CallOverlay';
import { Brush, MessageSquare, LogOut, Code2, Users, Settings, Video, Phone, Search, MoreVertical, CircleDashed, Bell, Lock, Key, HelpCircle, Monitor, Mic, Square, Play, Pause, Plus, X, ArrowLeft, Image, Star, Clock, ShieldAlert, ThumbsDown, Trash2, Globe, Briefcase, Link as LinkIcon, UserPlus } from 'lucide-react';
import { AccountPane, PrivacyPane, ChatsPane, NotificationsPane, KeyboardShortcutsPane, HelpPane, ProfilePane } from '../components/SettingsPanes';
import StoryViewer from '../components/StoryViewer';
import StatusUploadModal from '../components/StatusUploadModal';
import { useNavigate } from 'react-router-dom';

// --- Stitches Components ---
const AppContainer = styled('div', {
    display: 'flex',
    flexDirection: 'row',
    height: '100vh',
    position: 'relative',
    backgroundColor: '$surface',
    '@media (max-width: 768px)': {
        flexDirection: 'column-reverse',
    }
});

const NavRail = styled('nav', {
    width: '64px',
    backgroundColor: '$bg',
    borderRight: '1px solid $border',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '$3 0',
    zIndex: 10,
    '@media (min-width: 1200px)': {
        width: '72px',
    },
    '@media (max-width: 768px)': {
        width: '100%',
        height: '60px',
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: '0 $2',
        borderRight: 'none',
        borderTop: '1px solid $border',
    },
    variants: {
        mobileHidden: {
            true: {
                '@media (max-width: 768px)': {
                    display: 'none',
                }
            }
        }
    }
});

const NavRailTop = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '$4',
    flex: 1,
    '@media (max-width: 768px)': {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    }
});

const NavRailBottom = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '$4',
    paddingBottom: '$2',
    '@media (max-width: 768px)': {
        flexDirection: 'row',
        paddingBottom: '0',
        gap: '8px',
    }
});

const NavRailItem = styled('button', {
    background: 'none',
    border: 'none',
    color: '$textMuted',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    transition: 'all 0.2s',
    '&:hover': {
        backgroundColor: '$surface',
        color: '$textMain',
    },
    variants: {
        active: {
            true: {
                backgroundColor: '$surface',
                color: '$accent',
            }
        }
    }
});

const AvatarWrapper = styled('div', {
    position: 'relative',
    display: 'inline-block',
});

const Avatar = styled('img', {
    width: '36px',
    height: '36px',
    borderRadius: '$round',
    objectFit: 'cover',
});

const OnlineDot = styled('div', {
    position: 'absolute',
    bottom: '-2px',
    right: '-2px',
    width: '12px',
    height: '12px',
    backgroundColor: '#10B981',
    borderRadius: '$round',
    border: '2px solid $surface',
});

const Button = styled('button', {
    padding: '$2 $4',
    borderRadius: '$1',
    border: 'none',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
    variants: {
        variant: {
            primary: {
                backgroundColor: '$accent',
                color: '$bg',
                '&:hover': { backgroundColor: '$accentHover' },
            },
            outline: {
                backgroundColor: 'transparent',
                border: '1px solid $textMuted',
                color: '$textMuted',
                padding: '$1 $3',
                fontSize: '0.9rem',
                '&:hover': { color: '$textMain', borderColor: '$textMain' },
            }
        },
        fullWidth: {
            true: { width: '100%' }
        }
    },
    defaultVariants: {
        variant: 'primary'
    }
});



const PlaceholderContainer = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    backgroundColor: '$bg',
    color: '$textMuted',
    gap: '16px'
});

const PlaceholderView = ({ icon, title, subtitle }) => (
    <PlaceholderContainer>
        <div style={{ color: 'rgba(255,255,255,0.2)' }}>{icon}</div>
        <h2 style={{ color: 'var(--colors-textMain)', fontWeight: 'normal', margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ margin: 0 }}>{subtitle}</p>}
    </PlaceholderContainer>
);

const Sidebar = styled('aside', {
    width: '300px',
    backgroundColor: '$surface',
    borderRight: '1px solid $border',
    display: 'flex',
    flexDirection: 'column',
    padding: '$3',
    flexShrink: 0,
    '@media (min-width: 1400px)': {
        width: '350px',
    },
    '@media (max-width: 1200px)': {
        width: '280px',
    },
    '@media (max-width: 992px)': {
        width: '260px',
    },
    '@media (max-width: 768px)': {
        width: '100%',
        borderRight: 'none',
    },
    variants: {
        mobileHidden: {
            true: {
                '@media (max-width: 768px)': {
                    display: 'none',
                }
            }
        }
    }
});

const SidebarHeader = styled('div', {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '$2',
});

const SectionTitle = styled('h6', {
    color: '$textMuted',
    textTransform: 'uppercase',
    fontSize: '0.75rem',
    letterSpacing: '0.05em',
});

const IconButton = styled('button', {
    background: 'none',
    border: 'none',
    color: '$textMuted',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: '$round',
    '&:hover': {
        backgroundColor: '$bg',
        color: '$textMain',
    }
});

const ChannelItem = styled('div', {
    padding: '$2',
    borderRadius: '$1',
    color: '$textMuted',
    cursor: 'pointer',
    marginBottom: '4px',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        color: '$textMain',
    },
    variants: {
        active: {
            true: {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '$accent',
            }
        }
    }
});

const ChatArea = styled('main', {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '$bg',
    minWidth: 0,
    '@media (max-width: 768px)': {
        width: '100%',
    },
    variants: {
        mobileHidden: {
            true: {
                '@media (max-width: 768px)': {
                    display: 'none',
                }
            }
        }
    }
});

const ChatHeader = styled('div', {
    padding: '$3 $4',
    borderBottom: '1px solid $border',
    color: '$textMain',
    fontWeight: 'bold',
});

const MobileBackButton = styled('button', {
    display: 'none',
    background: 'none',
    border: 'none',
    color: '$textMain',
    cursor: 'pointer',
    padding: '4px',
    marginRight: '8px',
    '@media (max-width: 768px)': {
        display: 'inline-flex',
        alignItems: 'center',
    }
});

const floatDoodle = keyframes({
    '0%': { backgroundPosition: 'center, 0px 0px, 0% 50%' },
    '50%': { backgroundPosition: 'center, 200px 200px, 100% 50%' },
    '100%': { backgroundPosition: 'center, 400px 400px, 0% 50%' },
});

const MessageList = styled('div', {
    flex: 1,
    padding: '$4',
    overflowY: 'auto',
    color: '$textMuted',
    position: 'relative',
    backgroundColor: 'var(--wallpaper-bg-color, #0b141a)',
    backgroundImage: `
        linear-gradient(rgba(0, 0, 0, var(--wallpaper-darken, 0)), rgba(0, 0, 0, var(--wallpaper-darken, 0))),
        var(--wallpaper-url, url("/chat-bg.jpg")),
        radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.05), transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(0, 0, 0, 0.15), transparent 50%)
    `,
    backgroundSize: '100% 100%, var(--wallpaper-size, 400px), 100% 100%, 100% 100%',
    backgroundRepeat: 'no-repeat, repeat, no-repeat, no-repeat',
    backgroundBlendMode: 'normal, color-dodge, normal, normal',
    backgroundAttachment: 'fixed, scroll, fixed, fixed',
    animation: `${floatDoodle} 60s linear infinite`,
});

const ChatBubbleWrapper = styled('div', {
    display: 'flex',
    width: '100%',
    marginBottom: '8px',
    variants: {
        isOwn: {
            true: { justifyContent: 'flex-end' },
            false: { justifyContent: 'flex-start' }
        }
    }
});

const ChatBubble = styled('div', {
    maxWidth: '65%',
    padding: '8px 12px 10px 12px',
    borderRadius: '12px',
    position: 'relative',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    '@media (max-width: 992px)': {
        maxWidth: '75%',
    },
    '@media (max-width: 576px)': {
        maxWidth: '85%',
    },
    variants: {
        isOwn: {
            true: {
                backgroundColor: 'rgba(6, 182, 212, 0.2)', // Premium cyan glass
                color: '#ffffff',
                borderTopRightRadius: '2px',
            },
            false: {
                backgroundColor: 'rgba(30, 41, 59, 0.7)', // Premium surface glass
                color: '#e9edef',
                borderTopLeftRadius: '2px',
            }
        },
        mediaOnly: {
            true: {
                padding: '2px',
            }
        }
    }
});

const SenderName = styled('span', {
    display: 'block',
    fontWeight: 'bold',
    fontSize: '0.8rem',
    color: '$accent',
    marginBottom: '2px',
});

const MessageTime = styled('span', {
    fontSize: '0.65rem',
    color: 'rgba(255,255,255,0.6)',
    position: 'absolute',
    bottom: '4px',
    right: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    variants: {
        isOwn: {
            true: {
                color: 'rgba(255,255,255,0.7)',
            },
            false: {
                color: 'rgba(255,255,255,0.6)', // Light semi-transparent for received messages
            }
        }
    },
    defaultVariants: {
        isOwn: false
    }
});
const ContextMenuContainer = styled('div', {
    position: 'absolute',
    backgroundColor: '$surface',
    border: '1px solid $border',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
    zIndex: 2000,
    minWidth: '150px',
    overflow: 'hidden',
    padding: '4px 0'
});

const ContextMenuItem = styled('div', {
    padding: '10px 16px',
    cursor: 'pointer',
    color: '$textMain',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'background-color 0.2s',
    '&:hover': {
        backgroundColor: '$bg',
    }
});

const EditInput = styled('input', {
    width: '100%',
    padding: '6px 10px',
    borderRadius: '4px',
    backgroundColor: '$bg',
    border: '1px solid $accent',
    color: '$textMain',
    outline: 'none',
    marginTop: '4px',
    fontFamily: 'inherit'
});

// --- Modal Components ---
const ModalOverlay = styled('div', {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
});

const ModalContent = styled('div', {
    backgroundColor: '$surface',
    padding: '$4',
    borderRadius: '8px',
    width: '400px',
    maxWidth: '90%',
    border: '1px solid $border',
});

const ModalTitle = styled('h3', {
    color: '$textMain',
    marginBottom: '$3',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
});

const FormGroup = styled('div', {
    marginBottom: '$3',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
});

const Label = styled('label', {
    color: '$textMuted',
    fontSize: '0.85rem',
});

const Select = styled('select', {
    padding: '$2',
    borderRadius: '$1',
    backgroundColor: '$bg',
    color: '$textMain',
    border: '1px solid $border',
    outline: 'none',
});

const ModalInput = styled('input', {
    padding: '$2',
    borderRadius: '$1',
    backgroundColor: '$bg',
    border: '1px solid $border',
    color: '$textMain',
    outline: 'none',
    '&:focus': { borderColor: '$accent' }
});

const UserList = styled('div', {
    maxHeight: '150px',
    overflowY: 'auto',
    border: '1px solid $border',
    borderRadius: '$1',
    backgroundColor: '$bg',
});

const UserListItem = styled('div', {
    padding: '$2',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    borderBottom: '1px solid $border',
    '&:hover': { backgroundColor: '$surface' },
    '&:last-child': { borderBottom: 'none' },
    variants: {
        selected: {
            true: { backgroundColor: 'rgba(6, 182, 212, 0.1)' }
        }
    }
});

// --- Input Area Components ---
const InputArea = styled('form', {
    padding: '$3 $4',
    backgroundColor: '$surface',
    borderTop: '1px solid $border',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '$2',
});

const AttachButton = styled('button', {
    width: '42px',
    height: '42px',
    borderRadius: '$round',
    backgroundColor: 'transparent',
    color: '$textMuted',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    marginBottom: '3px',
    transition: 'all 0.2s',
    '&:hover': {
        backgroundColor: '$bg',
        color: '$textMain',
    },
    '&:disabled': {
        cursor: 'not-allowed',
        opacity: 0.5
    }
});

const PlusIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>
);

const spin = keyframes({
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
});

const Spinner = styled('div', {
    border: '2px solid rgba(255,255,255,0.1)',
    borderTopColor: '$accent',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    animation: `${spin} 1s linear infinite`,
});

const Input = styled('textarea', {
    flex: 1,
    padding: '12px 20px',
    borderRadius: '24px',
    backgroundColor: '$bg',
    border: 'none',
    color: '$textMain',
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit',
    lineHeight: '1.5',
    minHeight: '48px',
    maxHeight: '150px',
    overflowY: 'auto',
    transition: 'border-color 0.2s',
    '&:focus': { borderColor: '$accent' },
    '&::-webkit-scrollbar': { width: '6px' },
    '&::-webkit-scrollbar-thumb': { backgroundColor: '$border', borderRadius: '10px' },
    '&::placeholder': { color: '#6B7280' }
});

const SendButton = styled('button', {
    width: '48px',
    height: '48px',
    borderRadius: '$round',
    backgroundColor: '$accent',
    color: '$bg',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.2s',
    '&:hover': { backgroundColor: '$accentHover', transform: 'scale(1.05)' },
});

const SendIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
);

const CustomMicIcon = ({ size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" fill="currentColor" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
);

const AttachmentImage = styled('img', {
    maxWidth: '300px',
    maxHeight: '300px',
    borderRadius: '10px',
    objectFit: 'contain',
    cursor: 'pointer',
    display: 'block'
});

const AttachmentLink = styled('a', {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '$surface',
    border: '1px solid $border',
    borderRadius: '6px',
    color: '$accent',
    textDecoration: 'none',
    marginTop: '4px',
    fontSize: '0.9rem',
    '&:hover': { backgroundColor: '$bg' }
});

// --- Rich Embed Components ---
const EmbedCard = styled('div', {
    backgroundColor: '$surface',
    border: '1px solid $border',
    borderRadius: '8px',
    padding: '$3',
    marginTop: '$2',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxWidth: '400px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
});

const EmbedHeader = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '$textMain',
    fontWeight: 'bold',
    fontSize: '0.95rem',
});

const EmbedDescription = styled('div', {
    color: '$textMuted',
    fontSize: '0.85rem',
});

const EmbedAction = styled('a', {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '4px',
    padding: '6px 12px',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    color: '$accent',
    textDecoration: 'none',
    fontSize: '0.85rem',
    borderRadius: '4px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
    '&:hover': { backgroundColor: 'rgba(6, 182, 212, 0.2)' }
});

const AudioSlider = styled('input', {
    WebkitAppearance: 'none',
    appearance: 'none',
    width: '100%',
    height: '4px',
    borderRadius: '2px',
    outline: 'none',
    border: 'none',
    padding: 0,
    margin: 0,
    cursor: 'pointer',
    background: 'transparent',
    '&::-webkit-slider-thumb': {
        WebkitAppearance: 'none',
        appearance: 'none',
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        background: 'var(--thumb-color, #06b6d4)',
        cursor: 'pointer',
        border: 'none',
        boxShadow: 'none',
        marginTop: '0'
    },
    '&::-moz-range-thumb': {
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        background: 'var(--thumb-color, #06b6d4)',
        cursor: 'pointer',
        border: 'none',
        boxShadow: 'none'
    },
    '&:focus': { outline: 'none', boxShadow: 'none' },
    '&::-moz-focus-outer': { border: 0 }
});

const waveAnimation = keyframes({
    '0%': { height: '4px' },
    '50%': { height: '16px' },
    '100%': { height: '4px' }
});

const pulseAnimation = keyframes({
    '0%': { opacity: 1 },
    '50%': { opacity: 0.3 },
    '100%': { opacity: 1 }
});

const WaveBar = styled('div', {
    width: '3px',
    backgroundColor: '#94A3B8',
    borderRadius: '2px',
    animation: `${waveAnimation} 1s infinite ease-in-out`,
    variants: {
        delay: {
            0: { animationDelay: '0s' },
            1: { animationDelay: '0.1s' },
            2: { animationDelay: '0.2s' },
            3: { animationDelay: '0.3s' },
            4: { animationDelay: '0.4s' },
        }
    }
});

const VoiceRecordingIndicator = ({ time }) => {
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div style={{ flex: 1, padding: '0 20px', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'var(--colors-bg)', borderRadius: '24px', minHeight: '48px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--colors-danger)', animation: `${pulseAnimation} 1.5s infinite` }} />
                <span style={{ fontWeight: '500', fontVariantNumeric: 'tabular-nums', fontSize: '0.9rem', color: '#94A3B8' }}>{formatTime(time)}</span>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '24px', opacity: 0.7 }}>
                {Array.from({ length: 40 }).map((_, i) => (
                    <WaveBar key={i} delay={i % 5} />
                ))}
            </div>
        </div>
    );
};

// --- Custom Audio Player Component ---
const CustomAudioPlayer = ({ src, isOwnMessage, avatarUrl }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const current = audioRef.current.currentTime;
        const dur = audioRef.current.duration;
        setCurrentTime(current);
        if (dur > 0) {
            setProgress((current / dur) * 100);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const formatTime = (time) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: '4px',
            backgroundColor: 'transparent',
            padding: '4px 0px',
            minWidth: '240px',
            color: 'inherit'
        }}>
            {avatarUrl && (
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img src={avatarUrl} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', bottom: -2, right: -4, color: isOwnMessage ? '#06b6d4' : '#94A3B8' }}>
                        <Mic size={16} fill="currentColor" />
                    </div>
                </div>
            )}

            <button
                onClick={togglePlay}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    opacity: 1,
                    flexShrink: 0,
                    outline: 'none'
                }}
            >
                {isPlaying ? <Pause size={28} fill="currentColor" strokeWidth={0} /> : <Play size={28} fill="currentColor" strokeWidth={0} />}
            </button>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', paddingTop: '4px' }}>
                <AudioSlider
                    type="range"
                    min="0"
                    max="100"
                    value={progress || 0}
                    onChange={(e) => {
                        if (!audioRef.current) return;
                        const newTime = (e.target.value / 100) * duration;
                        audioRef.current.currentTime = newTime;
                        setProgress(e.target.value);
                    }}
                    style={{
                        '--thumb-color': isOwnMessage ? '#06b6d4' : '#94A3B8',
                        background: `linear-gradient(to right, ${isOwnMessage ? '#06b6d4' : '#94A3B8'} ${progress || 0}%, rgba(255, 255, 255, 0.2) ${progress || 0}%)`
                    }}
                />
                <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: '500', alignSelf: 'flex-start', marginTop: '4px' }}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                </span>
            </div>

            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => {
                    setIsPlaying(false);
                    setProgress(0);
                    setCurrentTime(0);
                    if (audioRef.current) {
                        audioRef.current.currentTime = 0;
                    }
                }}
            />
        </div>
    );
};

// --- Right Drawer Components ---
const RightDrawer = styled('aside', {
    width: '300px',
    backgroundColor: '$surface',
    borderLeft: '1px solid $border',
    display: 'flex',
    flexDirection: 'column',
    padding: '$3 $4',
    transition: 'all 0.3s ease',
    overflowY: 'auto',
    '@media (min-width: 1400px)': {
        width: '350px',
    },
    '@media (max-width: 1200px)': {
        width: '280px',
    },
    '@media (max-width: 992px)': {
        position: 'absolute',
        top: 0,
        right: 0,
        height: '100%',
        width: '320px',
        zIndex: 100,
        boxShadow: '-4px 0 15px rgba(0,0,0,0.1)',
    },
    '@media (max-width: 768px)': {
        width: '100%',
        borderLeft: 'none',
    },
    variants: {
        isOpen: {
            false: {
                width: '0px',
                padding: '0px',
                borderLeft: 'none',
                opacity: 0,
                '@media (min-width: 1400px)': { width: '0px' },
                '@media (max-width: 1200px)': { width: '0px' },
                '@media (max-width: 992px)': { width: '0px', padding: '0px' },
                '@media (max-width: 768px)': { width: '0px', padding: '0px' },
            }
        }
    }
});

const DrawerSection = styled('div', {
    marginBottom: '$4',
});

const ParticipantRow = styled('div', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '$2 0',
});

const ParticipantInfo = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
});

const TechBadge = styled('span', {
    fontSize: '0.65rem',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    variants: {
        discipline: {
            Frontend: { backgroundColor: 'rgba(6, 182, 212, 0.1)', color: '#06B6D4' },
            Backend: { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' },
            UIUX: { backgroundColor: 'rgba(244, 63, 94, 0.1)', color: '#F43F5E' },
            Fullstack: { backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }
        }
    },
    defaultVariants: {
        discipline: 'Fullstack'
    }
});

const ResourceLink = styled('a', {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '$textMuted',
    textDecoration: 'none',
    fontSize: '0.85rem',
    padding: '$2 0',
    transition: 'color 0.2s',
    '&:hover': { color: '$accent' }
});

hljs.configure({ languages: ['javascript', 'typescript', 'python', 'xml', 'css', 'json', 'java', 'cpp'] });

// --- Main Dashboard Component ---
export default function Dashboard() {
    const { user, logout, getAccessTokenSilently } = useAuth0();
    const navigate = useNavigate();

    const [mongoUserId, setMongoUserId] = useState(null);
    const [currentUserData, setCurrentUserData] = useState(null);
    const [socket, setSocket] = useState(null);
    const [activeUsers, setActiveUsers] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [messages, setMessages] = useState([]);

    // Status State
    const [statuses, setStatuses] = useState([]);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [storyViewerInitialUserIndex, setStoryViewerInitialUserIndex] = useState(null);

    // Group statuses by user
    const groupedStatuses = Object.values(statuses.filter(s => (Date.now() - new Date(s.createdAt).getTime()) < 24 * 60 * 60 * 1000).reduce((acc, status) => {
        const uploaderId = status.uploader._id;
        if (!acc[uploaderId]) acc[uploaderId] = { user: status.uploader, statuses: [] };
        acc[uploaderId].statuses.push(status);
        return acc;
    }, {}));
    const myGroupedStatuses = groupedStatuses.find(g => g.user._id === mongoUserId);
    const otherGroupedStatuses = groupedStatuses.filter(g => g.user._id !== mongoUserId);

    const handleStatusUpload = async (statusData) => {
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`${BACKEND_URL}/api/status`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(statusData)
            });
            const newStatus = await res.json();
            setStatuses(prev => [...prev, newStatus]);
        } catch (error) {
            console.error("Error uploading status:", error);
        }
    };

    const handleMarkStatusViewed = async (statusId) => {
        try {
            const token = await getAccessTokenSilently();
            await fetch(`${BACKEND_URL}/api/status/${statusId}/view`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setStatuses(prev => prev.map(s => s._id === statusId ? { ...s, viewers: [...s.viewers, mongoUserId] } : s));
        } catch (error) {
            console.error("Error marking status viewed:", error);
        }
    };

    const handleDeleteStatus = async (statusId) => {
        // Optimistic update for instant UI response
        setStatuses(prev => prev.filter(s => s._id !== statusId));

        try {
            const token = await getAccessTokenSilently();
            await fetch(`${BACKEND_URL}/api/status/${statusId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Error deleting status:", error);
            // We could revert the state here on error, but for UX simplicity we leave it
        }
    };

    const handleReshareStatus = (status) => {
        handleStatusUpload({
            type: status.type,
            content: status.content,
            caption: status.caption || '',
            backgroundColor: status.backgroundColor || '#1E2B3C'
        });
    };

    const handleForwardStatus = (status) => {
        // Adapt the status object to look like a message for the ForwardMessageModal
        setForwardMessageData({
            _id: status._id,
            content: status.content,
            type: status.type, // 'text', 'image', 'video'
            caption: status.caption || '',
            backgroundColor: status.backgroundColor,
            isStatus: true
        });
    };

    // New 3-Pane Layout Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
    const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(() => {
        return sessionStorage.getItem('isWhiteboardOpen') === 'true';
    });

    useEffect(() => {
        sessionStorage.setItem('isWhiteboardOpen', isWhiteboardOpen);
    }, [isWhiteboardOpen]);
    const [activeTab, setActiveTab] = useState('chats'); // 'chats', 'status', 'settings'
    const [activeSettingTab, setActiveSettingTab] = useState(null);
    const [activeStatus, setActiveStatus] = useState(null);

    // Call and Search State
    const [callConfig, setCallConfig] = useState({ active: false, isReceiving: false, callerData: null, callType: 'video' });
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [callLogs, setCallLogs] = useState([]);

    const formatCallLog = (log, currentUserId) => {
        const isCaller = log.caller._id === currentUserId;
        const contact = isCaller ? log.receiver : log.caller;
        return {
            id: log._id,
            contactId: contact._id,
            contactName: contact.displayName || 'Unknown',
            contactAvatar: contact.avatarUrl,
            type: log.type,
            direction: isCaller ? 'outgoing' : 'incoming',
            status: log.status,
            timestamp: new Date(log.createdAt).getTime()
        };
    };

    // App Settings State
    const [appSettings, setAppSettings] = useState(() => {
        const saved = localStorage.getItem('appSettings');
        return saved ? JSON.parse(saved) : {
            securityNotifications: false,
            lastSeen: 'everyone',
            profilePhoto: 'everyone',
            readReceipts: true,
            theme: 'system',
            enterIsSend: true,
            messageAlerts: true,
            showPreviews: true,
            sounds: true
        };
    });

    useEffect(() => {
        localStorage.setItem('appSettings', JSON.stringify(appSettings));
    }, [appSettings]);

    const handleUpdateProfile = async (updates) => {
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`${BACKEND_URL}/api/users/profile`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                const updatedUser = await res.json();
                setCurrentUserData(updatedUser);
            }
        } catch (error) {
            console.error("Error updating profile:", error);
        }
    };

    const updateSetting = (key, value) => {
        setAppSettings(prev => ({ ...prev, [key]: value }));
    };

    // Input & Upload State
    const [messageInput, setMessageInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [chatUploadFile, setChatUploadFile] = useState(null);
    const [chatUploadPreview, setChatUploadPreview] = useState(null);
    const [chatUploadCaption, setChatUploadCaption] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const [recordingTime, setRecordingTime] = useState(0);
    const recordingIntervalRef = useRef(null);
    const [communityTab, setCommunityTab] = useState('chat');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);
    const [addMembersSearchQuery, setAddMembersSearchQuery] = useState('');
    const [selectedMembersToAdd, setSelectedMembersToAdd] = useState([]);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [forwardMessageData, setForwardMessageData] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [convType, setConvType] = useState('direct');
    const [convName, setConvName] = useState('');
    const [convDescription, setConvDescription] = useState('');
    const [convAvatarUrl, setConvAvatarUrl] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    // Edit/Delete State
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editInputContent, setEditInputContent] = useState('');

    // Context Menu State
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null, callLog: null });

    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const touchHoldTimer = useRef(null);
    const touchStartCoords = useRef({ x: 0, y: 0 });
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 1. Initialize API and Socket Connection
    useEffect(() => {
        let isActive = true;
        let newSocket;

        const initializeIntegration = async () => {
            try {
                const token = await getAccessTokenSilently();
                const apiHeaders = {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };

                const syncResponse = await fetch(`${BACKEND_URL}/api/users/sync`, {
                    method: 'POST',
                    headers: apiHeaders,
                    body: JSON.stringify({
                        email: user.email,
                        displayName: user.name || user.nickname || user.email,
                        avatarUrl: user.picture,
                        techDiscipline: 'Fullstack'
                    })
                });
                if (syncResponse.status === 401) {
                    throw new Error('Unauthorized');
                }
                const mongoUser = await syncResponse.json();

                if (!isActive) return;
                setMongoUserId(mongoUser._id);
                setCurrentUserData(mongoUser);

                if (!mongoUser.hasCompletedProfile) {
                    navigate('/setup');
                    return;
                }

                const statusRes = await fetch(`${BACKEND_URL}/api/status`, { headers: apiHeaders });
                const fetchedStatuses = await statusRes.json();
                if (isActive) setStatuses(fetchedStatuses);

                const convResponse = await fetch(`${BACKEND_URL}/api/conversations`, {
                    headers: apiHeaders
                });
                const initialConversations = await convResponse.json();

                if (!isActive) return;

                if (initialConversations.length > 0) {
                    setConversations(initialConversations);
                    setActiveConversationId(initialConversations[0]._id);
                }

                // Handle Shared Profile Links (?chatWith=USER_ID)
                const urlParams = new URLSearchParams(window.location.search);
                const chatWithId = urlParams.get('chatWith');
                if (chatWithId && chatWithId !== mongoUser._id) {
                    try {
                        const createRes = await fetch(`${BACKEND_URL}/api/conversations`, {
                            method: 'POST',
                            headers: apiHeaders,
                            body: JSON.stringify({
                                type: 'direct',
                                participantIds: [mongoUser._id, chatWithId]
                            })
                        });
                        if (createRes.ok) {
                            const newConv = await createRes.json();
                            setConversations(prev => {
                                const exists = prev.find(c => c._id === newConv._id);
                                if (!exists) return [newConv, ...prev];
                                return prev;
                            });
                            setActiveConversationId(newConv._id);
                            
                            // Clean up URL
                            const newUrl = window.location.origin + window.location.pathname;
                            window.history.replaceState({}, document.title, newUrl);
                        }
                    } catch (err) {
                        console.error('Failed to start chat from share link', err);
                    }
                }

                // Fetch call logs
                try {
                    const callRes = await fetch(`${BACKEND_URL}/api/calls`, { headers: apiHeaders });
                    if (callRes.ok) {
                        const logs = await callRes.json();
                        setCallLogs(logs.map(log => formatCallLog(log, mongoUser._id)));
                    }
                } catch (e) { console.error('Failed to fetch call logs:', e); }

                newSocket = io(BACKEND_URL);

                newSocket.on('connect', () => {
                    newSocket.emit('user_connected', mongoUser._id);
                });

                newSocket.on('presence_update', (onlineUserIds) => {
                    setActiveUsers(onlineUserIds);
                });

                newSocket.on('receive_message', (incomingMessage) => {
                    setMessages((prev) => {
                        if (prev.some(msg => msg._id === incomingMessage._id)) return prev;
                        return [...prev, incomingMessage];
                    });

                    setConversations((prev) => {
                        const convIndex = prev.findIndex(c => c._id === incomingMessage.conversationId);
                        if (convIndex === -1) return prev;
                        
                        const newConvs = [...prev];
                        const updatedConv = { 
                            ...newConvs[convIndex], 
                            lastMessage: incomingMessage, 
                            updatedAt: new Date().toISOString() 
                        };
                        newConvs.splice(convIndex, 1);
                        newConvs.unshift(updatedConv);
                        return newConvs;
                    });
                });

                newSocket.on('message_edited', (updatedMsg) => {
                    setMessages(prev => prev.map(msg => msg._id === updatedMsg._id ? updatedMsg : msg));
                });

                newSocket.on('message_deleted', (deletedMsgId) => {
                    setMessages(prev => prev.filter(msg => msg._id !== deletedMsgId));
                });

                newSocket.on('conversation_deleted', (deletedConvId) => {
                    setConversations(prev => prev.filter(c => c._id !== deletedConvId));
                    setActiveConversationId(prev => prev === deletedConvId ? null : prev);
                });

                newSocket.on('call_user', (data) => {
                    // When receiving a call
                    setCallConfig({
                        active: true,
                        isReceiving: true,
                        callerData: data,
                        callType: data.callType
                    });
                });

                newSocket.on('call_logged', (log) => {
                    setCallLogs(prev => {
                        if (prev.some(l => l.id === log._id)) return prev;
                        return [formatCallLog(log, mongoUser._id), ...prev];
                    });
                });

                setSocket(newSocket);
            } catch (error) {
                console.error('Integration failure:', error);
                if (
                    error.message === 'Unauthorized' ||
                    error.error === 'consent_required' ||
                    error.error === 'login_required' ||
                    String(error).includes('Consent required') ||
                    String(error).includes('Login required') ||
                    String(error).includes('Unexpected token') ||
                    String(error).includes('SyntaxError')
                ) {
                    logout({ logoutParams: { returnTo: window.location.origin } });
                }
            }
        };

        initializeIntegration();

        return () => {
            isActive = false;
            if (newSocket) newSocket.disconnect();
        };
    }, [getAccessTokenSilently, user]);

    // 2. Handle Room Joining and Message History Fetching
    useEffect(() => {
        if (socket && activeConversationId) {
            socket.emit('join_room', activeConversationId);

            const fetchMessageHistory = async () => {
                try {
                    const token = await getAccessTokenSilently();
                    const res = await fetch(`${BACKEND_URL}/api/messages/${activeConversationId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const history = await res.json();
                    setMessages(history);
                } catch (error) {
                    console.error('Failed to fetch messages:', error);
                }
            };

            fetchMessageHistory();
        }
    }, [socket, activeConversationId, getAccessTokenSilently]);

    // 3. Handle Modal and Creating Conversations
    const openCreateModal = async () => {
        setIsModalOpen(true);
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`${BACKEND_URL}/api/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const users = await res.json();
            setAllUsers(users.filter(u => u._id !== mongoUserId));
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const toggleUserSelection = (userId) => {
        if (convType === 'direct') {
            setSelectedUsers([userId]);
        } else {
            setSelectedUsers(prev =>
                prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
            );
        }
    };

    const handleCreateConversation = async () => {
        if (selectedUsers.length === 0) return;
        if (convType === 'group' && !convName.trim()) return;

        if (convType === 'direct') {
            const existing = conversations.find(c => 
                c.type === 'direct' && 
                c.participants.some(p => p._id === selectedUsers[0])
            );
            if (existing) {
                setActiveConversationId(existing._id);
                setIsModalOpen(false);
                setSelectedUsers([]);
                return;
            }
        }

        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`${BACKEND_URL}/api/conversations`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: convType,
                    name: convType === 'group' ? convName : undefined,
                    description: convType === 'group' ? convDescription : undefined,
                    avatarUrl: convType === 'group' ? convAvatarUrl : undefined,
                    participantIds: [mongoUserId, ...selectedUsers]
                })
            });

            const newConv = await res.json();

            setConversations(prev => {
                if (prev.some(c => c._id === newConv._id)) return prev;
                return [newConv, ...prev];
            });

            setActiveConversationId(newConv._id);
            setIsModalOpen(false);
            setConvName('');
            setConvDescription('');
            setConvAvatarUrl('');
            setSelectedUsers([]);
            setConvType('direct');
            setUserSearchQuery('');
        } catch (error) {
            console.error('Failed to create conversation:', error);
        }
    };

    const handleAddMembersToGroup = async () => {
        if (selectedMembersToAdd.length === 0 || !activeConversationId) return;

        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`${BACKEND_URL}/api/conversations/${activeConversationId}/members`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    newMemberIds: selectedMembersToAdd
                })
            });

            if (res.ok) {
                const updatedConv = await res.json();
                setConversations(prev => prev.map(c => c._id === updatedConv._id ? updatedConv : c));
                setIsAddMembersModalOpen(false);
                setSelectedMembersToAdd([]);
                setAddMembersSearchQuery('');
            }
        } catch (error) {
            console.error('Failed to add members:', error);
        }
    };

    // 4. Handle Text Input and Sending
    const handleInputChange = (e) => {
        setMessageInput(e.target.value);
        e.target.style.height = '48px';
        e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        const text = messageInput.trim();
        if (!text || !socket || !mongoUserId || !activeConversationId) return;

        let finalIsCode = false;
        let finalLang = 'plaintext';

        if (text.length > 20) {
            const detected = hljs.highlightAuto(text);
            const hasCodeSyntax = text.includes('\n') || text.includes('{') || text.includes('</');

            if (detected.language && detected.relevance >= 3 && hasCodeSyntax) {
                finalIsCode = true;
                finalLang = detected.language === 'xml' ? 'html' : detected.language;
            }
        }

        const messagePayload = {
            conversationId: activeConversationId,
            senderId: mongoUserId,
            content: text,
            isCodeSnippet: finalIsCode,
            language: finalIsCode ? finalLang : 'plaintext'
        };

        socket.emit('send_message', messagePayload);

        setMessageInput('');
        if (inputRef.current) inputRef.current.style.height = '48px';
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    // 4.5 Handle Edit, Delete and Context Menu Actions
    useEffect(() => {
        const handleClick = () => {
            if (contextMenu.visible) setContextMenu({ ...contextMenu, visible: false });
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [contextMenu]);

    const handleContextMenu = (e, type, item) => {
        if (e.preventDefault) e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.pageX,
            y: e.pageY,
            message: type === 'message' ? item : null,
            callLog: type === 'callLog' ? item : null
        });
    };

    const handleTouchStart = (e, msg) => {
        const touch = e.touches[0];
        const pageX = touch.pageX;
        const pageY = touch.pageY;
        touchStartCoords.current = { x: pageX, y: pageY };

        touchHoldTimer.current = setTimeout(() => {
            handleContextMenu({ preventDefault: () => { }, pageX, pageY }, 'message', msg);
            touchHoldTimer.current = null;
        }, 500); // 500ms long press for context menu
    };

    const handleTouchMove = (e) => {
        if (!touchHoldTimer.current) return;
        const touch = e.touches[0];
        const diffX = Math.abs(touch.pageX - touchStartCoords.current.x);
        const diffY = Math.abs(touch.pageY - touchStartCoords.current.y);

        // Cancel long press if user swipes/scrolls
        if (diffX > 10 || diffY > 10) {
            clearTimeout(touchHoldTimer.current);
            touchHoldTimer.current = null;
        }
    };

    const handleTouchEnd = () => {
        if (touchHoldTimer.current) {
            clearTimeout(touchHoldTimer.current);
            touchHoldTimer.current = null;
        }
    };
    const startEditing = (msg) => {
        setEditingMessageId(msg._id);
        setEditInputContent(msg.content);
    };

    const cancelEditing = () => {
        setEditingMessageId(null);
        setEditInputContent('');
    };

    const submitEdit = (e) => {
        e.preventDefault();
        if (!editInputContent.trim() || !socket || !activeConversationId) return;
        socket.emit('edit_message', {
            messageId: editingMessageId,
            newContent: editInputContent.trim(),
            conversationId: activeConversationId
        });
        setEditingMessageId(null);
        setEditInputContent('');
    };

    const deleteMessage = (msgId) => {
        if (!socket || !activeConversationId) return;
        socket.emit('delete_message', {
            messageId: msgId,
            conversationId: activeConversationId
        });
    };

    const deleteCallLog = async (logId) => {
        try {
            const token = await getAccessTokenSilently();
            await fetch(`${BACKEND_URL}/api/calls/${logId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            setCallLogs(prev => prev.filter(log => log.id !== logId));
            setContextMenu({ ...contextMenu, visible: false });
        } catch (error) {
            console.error('Error deleting call log:', error);
        }
    };

    const openConversationWith = async (contactId, thenCall = null) => {
        let conv = conversations.find(c => c.type === 'direct' && c.participants.some(p => p._id === contactId));
        if (!conv) {
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch(`${BACKEND_URL}/api/conversations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ type: 'direct', participants: [mongoUserId, contactId] })
                });
                if (res.ok) {
                    conv = await res.json();
                    setConversations(prev => [conv, ...prev]);
                }
            } catch (e) {
                console.error('Error creating conversation', e);
            }
        }

        if (conv) {
            setActiveTab('chats');
            setActiveConversationId(conv._id);
            if (thenCall) {
                setTimeout(() => {
                    setCallConfig({ active: true, isReceiving: false, callerData: null, callType: thenCall });
                }, 300);
            }
        }
        setContextMenu({ ...contextMenu, visible: false });
    };

    const confirmForward = (targetConvId) => {
        if (!socket || !forwardMessageData) return;

        // If forwarding a status, we treat image/video as just URL content, and pass caption
        const payload = {
            conversationId: targetConvId,
            senderId: mongoUserId,
            content: forwardMessageData.content,
            isCodeSnippet: forwardMessageData.isCodeSnippet || false,
            language: forwardMessageData.language || 'plaintext',
            caption: forwardMessageData.caption || ''
        };

        socket.emit('send_message', payload);
        setForwardMessageData(null);
    };

    const deleteConversation = (e, convId) => {
        e.stopPropagation(); // prevent setting it as active
        if (!socket) return;
        socket.emit('delete_conversation', {
            conversationId: convId,
            userId: mongoUserId
        });
    };

    // 5. Handle File Uploads to Cloudinary
    const handleImageUpload = async (file, setter) => {
        if (!file) return;
        
        const previewUrl = URL.createObjectURL(file);
        setter(previewUrl);

        const formData = new FormData();
        formData.append('file', file);
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`${BACKEND_URL}/api/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                setter(data.fileUrl);
            }
        } catch (error) {
            console.error('Upload Error:', error);
        }
    };

    const handleUpdateGroupAvatar = async (file) => {
        if (!file || !activeConversation || activeConversation.type !== 'group') return;

        const previewUrl = URL.createObjectURL(file);
        setConversations(prev => prev.map(c => 
            c._id === activeConversation._id ? { ...c, avatarUrl: previewUrl } : c
        ));

        const formData = new FormData();
        formData.append('file', file);
        try {
            const token = await getAccessTokenSilently();
            const uploadRes = await fetch(`${BACKEND_URL}/api/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            if (!uploadRes.ok) throw new Error('Upload failed');
            const uploadData = await uploadRes.json();

            const updateRes = await fetch(`${BACKEND_URL}/api/conversations/${activeConversation._id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ avatarUrl: uploadData.fileUrl })
            });
            if (updateRes.ok) {
                const updatedConv = await updateRes.json();
                setConversations(prev => prev.map(c => c._id === updatedConv._id ? updatedConv : c));
            }
        } catch (error) {
            console.error('Error updating group avatar:', error);
            alert('Failed to update group picture.');
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file || !socket || !mongoUserId || !activeConversationId) return;

        setChatUploadFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setChatUploadPreview(reader.result);
        };
        reader.readAsDataURL(file);

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const confirmChatUpload = async () => {
        if (!chatUploadFile) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', chatUploadFile);

        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`${BACKEND_URL}/api/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (!res.ok) throw new Error('Failed to upload file');

            const data = await res.json();

            const messagePayload = {
                conversationId: activeConversationId,
                senderId: mongoUserId,
                content: data.fileUrl,
                caption: chatUploadCaption,
                isCodeSnippet: false,
                language: 'plaintext'
            };

            socket.emit('send_message', messagePayload);
        } catch (error) {
            console.error('Upload Error:', error);
            alert('File upload failed. Please try again.');
        } finally {
            setIsUploading(false);
            setChatUploadFile(null);
            setChatUploadPreview(null);
            setChatUploadCaption('');
        }
    };

    const cancelChatUpload = () => {
        setChatUploadFile(null);
        setChatUploadPreview(null);
        setChatUploadCaption('');
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], 'voice_note.webm', { type: 'audio/webm' });

                if (!socket || !mongoUserId || !activeConversationId) return;
                setIsUploading(true);
                const formData = new FormData();
                formData.append('file', audioFile);

                try {
                    const token = await getAccessTokenSilently();
                    const res = await fetch(`${BACKEND_URL}/api/upload`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                        body: formData
                    });

                    if (!res.ok) throw new Error('Failed to upload audio');

                    const data = await res.json();

                    const messagePayload = {
                        conversationId: activeConversationId,
                        senderId: mongoUserId,
                        content: data.fileUrl,
                        isCodeSnippet: false,
                        language: 'plaintext'
                    };

                    socket.emit('send_message', messagePayload);
                } catch (error) {
                    console.error('Upload Audio Error:', error);
                    alert('Voice note upload failed. Please try again.');
                } finally {
                    setIsUploading(false);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please check your permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }
        }
    };

    const activeConversation = conversations.find(c => c._id === activeConversationId);
    const showChatArea = !!activeConversationId || (activeTab === 'settings' && !!activeSettingTab);

    const isImageUrl = (url) => typeof url === 'string' && url.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$|blob:/i) != null;
    const isAudioUrl = (url) => typeof url === 'string' && url.match(/\.(webm|mp3|wav|ogg|m4a)(\?.*)?$/i) != null;
    const isCloudinaryUrl = (url) => typeof url === 'string' && url.includes('res.cloudinary.com');

    const handleTabChange = (tab) => {
        if (activeTab === tab) return;
        setActiveTab(tab);
    };

    return (
        <AppContainer>
            <NavRail mobileHidden={showChatArea}>
                <NavRailTop>
                    <NavRailItem active={activeTab === 'status'} onClick={() => handleTabChange('status')} title="Status" style={activeTab === 'status' ? {} : { color: 'var(--colors-textMuted)' }}>
                        <Code2 size={24} />
                    </NavRailItem>
                    <NavRailItem active={activeTab === 'chats'} onClick={() => handleTabChange('chats')} title="Chats">
                        <MessageSquare size={22} />
                    </NavRailItem>
                    <NavRailItem active={activeTab === 'calls'} onClick={() => handleTabChange('calls')} title="Calls">
                        <Phone size={22} />
                    </NavRailItem>
                    <NavRailItem
                        active={activeTab === 'communities'}
                        onClick={() => handleTabChange('communities')}
                        title="Communities"
                    >
                        <Users size={22} />
                    </NavRailItem>
                    <NavRailItem active={activeTab === 'settings'} onClick={() => handleTabChange('settings')} title="Settings">
                        <Settings size={22} />
                    </NavRailItem>
                </NavRailTop>

                <NavRailBottom>
                    <AvatarWrapper title={currentUserData?.displayName || user?.name || user?.nickname || user?.email}>
                        <Avatar
                            src={currentUserData?.avatarUrl || user?.picture}
                            alt={user?.name || user?.nickname || 'User'}
                            style={{ width: '32px', height: '32px' }}
                            onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${user?.name || user?.nickname || 'User'}&background=06B6D4&color=fff`;
                            }}
                        />
                        <OnlineDot style={{ width: '10px', height: '10px' }} />
                    </AvatarWrapper>
                    <NavRailItem title="Log Out" onClick={() => setIsLogoutModalOpen(true)}>
                        <LogOut size={22} />
                    </NavRailItem>
                </NavRailBottom>
            </NavRail>

            <Sidebar mobileHidden={showChatArea}>
                {activeTab === 'calls' && (
                    <>
                        <SidebarHeader>
                            <SectionTitle>Recent Calls</SectionTitle>
                        </SidebarHeader>
                        {callLogs.length === 0 ? (
                            <div style={{ color: 'var(--colors-textMuted)', fontSize: '0.85rem', textAlign: 'center', marginTop: '40px' }}>
                                <Phone size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                <p>No recent calls</p>
                                <p style={{ fontSize: '0.75rem', marginTop: '8px' }}>Your call history will appear here.</p>
                            </div>
                        ) : (
                            <div style={{ overflowY: 'auto', flex: 1 }}>
                                {callLogs.map(log => (
                                    <ChannelItem
                                        key={log.id}
                                        style={{ height: 'auto', padding: '12px 16px', gap: '16px' }}
                                        onContextMenu={(e) => handleContextMenu(e, 'callLog', log)}
                                    >
                                        <AvatarWrapper style={{ flexShrink: 0 }}>
                                            <Avatar
                                                src={log.contactAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(log.contactName)}&background=06B6D4&color=fff`}
                                                style={{ width: '40px', height: '40px', border: 'none' }}
                                                onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(log.contactName)}&background=06B6D4&color=fff`; }}
                                            />
                                        </AvatarWrapper>
                                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                            <span style={{ fontSize: '1rem', color: log.status === 'missed' ? '#EF4444' : 'var(--colors-textMain)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {log.contactName}
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--colors-textMuted)' }}>
                                                {log.direction === 'incoming' ? (
                                                    <svg viewBox="0 0 24 24" width="14" height="14" fill={log.status === 'missed' ? '#EF4444' : '#10B981'}><path d="M20 5.41L18.59 4 7 15.59V9H5v10h10v-2H8.41L20 5.41z"></path></svg>
                                                ) : (
                                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="#06B6D4"><path d="M9 5v2h6.59L4 18.59 5.41 20 17 8.41V15h2V5H9z"></path></svg>
                                                )}
                                                <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</span>
                                            </div>
                                        </div>
                                        <div>
                                            {log.type === 'video' ? <Video size={20} color="var(--colors-textMuted)" /> : <Phone size={20} color="var(--colors-textMuted)" />}
                                        </div>
                                    </ChannelItem>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'chats' && (
                    <>
                        <SidebarHeader>
                            <SectionTitle>Chats</SectionTitle>
                            <IconButton title="New Chat" onClick={openCreateModal}>
                                <PlusIcon />
                            </IconButton>
                        </SidebarHeader>

                        {conversations.length === 0 ? (
                            <div style={{ color: 'var(--colors-textMuted)', fontSize: '0.85rem' }}>No conversations yet.</div>
                        ) : (
                            [...conversations].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map(conv => {
                                const isGroup = conv.type === 'group';
                                const otherParticipant = !isGroup ? conv.participants?.find(p => p._id !== mongoUserId) : null;
                                const isOtherUserOnline = otherParticipant && activeUsers.includes(otherParticipant._id);
                                const userStatusIndex = otherParticipant ? groupedStatuses.findIndex(g => g.user._id === otherParticipant._id) : -1;
                                const hasStatus = userStatusIndex !== -1;

                                return (
                                    <ChannelItem
                                        key={conv._id}
                                        active={activeConversationId === conv._id}
                                        onClick={() => setActiveConversationId(conv._id)}
                                        style={{ padding: '8px 12px', borderBottom: '1px solid var(--colors-border)', borderRadius: 0, gap: '12px', alignItems: 'center', margin: 0 }}
                                        onMouseEnter={(e) => {
                                            const btn = e.currentTarget.querySelector('.conv-delete-btn');
                                            if (btn) btn.style.opacity = 1;
                                        }}
                                        onMouseLeave={(e) => {
                                            const btn = e.currentTarget.querySelector('.conv-delete-btn');
                                            if (btn) btn.style.opacity = 0;
                                        }}
                                    >
                                        <AvatarWrapper 
                                            style={{ flexShrink: 0, padding: hasStatus ? '2px' : '0', border: hasStatus ? '2px solid var(--colors-accent)' : 'none', cursor: hasStatus ? 'pointer' : 'default' }}
                                            onClick={(e) => {
                                                if (hasStatus) {
                                                    e.stopPropagation();
                                                    setStoryViewerInitialUserIndex(userStatusIndex);
                                                }
                                            }}
                                        >
                                            <Avatar
                                                src={isGroup
                                                    ? (conv.avatarUrl || `https://ui-avatars.com/api/?name=${conv.name}&background=06B6D4&color=fff`)
                                                    : (otherParticipant?.avatarUrl || `https://ui-avatars.com/api/?name=${otherParticipant?.displayName || 'User'}&background=06B6D4&color=fff`)}
                                                style={{ width: '40px', height: '40px', border: 'none' }}
                                            />
                                            {!isGroup && isOtherUserOnline && <OnlineDot style={{ width: '12px', height: '12px', bottom: '2px', right: '2px' }} />}
                                        </AvatarWrapper>

                                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, justifyContent: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '1.05rem', fontWeight: 'normal', color: 'var(--colors-textMain)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {isGroup ? conv.name : (otherParticipant?.displayName || 'Unknown User')}
                                                </span>
                                                {conv.lastMessage && (
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--colors-textMuted)', flexShrink: 0 }}>
                                                        {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--colors-textMuted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {conv.unreadCount > 0 ? (
                                                        conv.lastMessage
                                                            ? ((conv.lastMessage.sender === mongoUserId ? 'You: ' : '') +
                                                                (conv.lastMessage.content?.includes('res.cloudinary') ? (conv.lastMessage.content.includes('video') ? '🎥 Video' : '📷 Photo') : conv.lastMessage.content))
                                                            : 'No messages yet'
                                                    ) : null}
                                                </span>
                                                <IconButton
                                                    className="conv-delete-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, message: null, callLog: null, conversation: conv });
                                                    }}
                                                    title="Options"
                                                    style={{ padding: '2px', opacity: 0, transition: 'opacity 0.2s', color: 'var(--colors-textMuted)', zIndex: 2 }}
                                                >
                                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                                </IconButton>
                                            </div>
                                        </div>
                                    </ChannelItem>
                                );
                            })
                        )}
                    </>
                )}

                {activeTab === 'communities' && (
                    <>
                        <SidebarHeader>
                            <SectionTitle>Communities</SectionTitle>
                            <IconButton title="New Community" onClick={() => { setConvType('group'); setIsModalOpen(true); }}>
                                <PlusIcon />
                            </IconButton>
                        </SidebarHeader>

                        {conversations.filter(c => c.type === 'group').length === 0 ? (
                            <div style={{ color: 'var(--colors-textMuted)', fontSize: '0.85rem' }}>No communities yet.</div>
                        ) : (
                            [...conversations].filter(c => c.type === 'group').sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map(conv => (
                                <ChannelItem
                                    key={conv._id}
                                    active={activeConversationId === conv._id}
                                    onClick={() => { setActiveConversationId(conv._id); setCommunityTab('chat'); }}
                                    style={{ padding: '8px 12px', borderBottom: '1px solid var(--colors-border)', borderRadius: 0, gap: '12px', alignItems: 'center', margin: 0 }}
                                    onMouseEnter={(e) => {
                                        const btn = e.currentTarget.querySelector('.conv-delete-btn');
                                        if (btn) btn.style.opacity = 1;
                                    }}
                                    onMouseLeave={(e) => {
                                        const btn = e.currentTarget.querySelector('.conv-delete-btn');
                                        if (btn) btn.style.opacity = 0;
                                    }}
                                >
                                    <AvatarWrapper style={{ flexShrink: 0 }}>
                                        <Avatar
                                            src={conv.avatarUrl || `https://ui-avatars.com/api/?name=${conv.name}&background=06B6D4&color=fff`}
                                            style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none' }}
                                        />
                                    </AvatarWrapper>

                                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, justifyContent: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '1.05rem', fontWeight: 'normal', color: 'var(--colors-textMain)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {conv.name}
                                            </span>
                                            {conv.lastMessage && (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--colors-textMuted)', flexShrink: 0 }}>
                                                    {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--colors-textMuted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {conv.unreadCount > 0 ? (
                                                    conv.lastMessage
                                                        ? ((conv.lastMessage.sender === mongoUserId ? 'You: ' : '') +
                                                            (conv.lastMessage.content?.includes('res.cloudinary') ? (conv.lastMessage.content.includes('video') ? '🎥 Video' : '📷 Photo') : conv.lastMessage.content))
                                                        : 'No messages yet'
                                                ) : null}
                                            </span>
                                            <IconButton
                                                className="conv-delete-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, message: null, callLog: null, conversation: conv });
                                                }}
                                                title="Options"
                                                style={{ padding: '2px', opacity: 0, transition: 'opacity 0.2s', color: 'var(--colors-textMuted)', zIndex: 2 }}
                                            >
                                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                            </IconButton>
                                        </div>
                                    </div>
                                </ChannelItem>
                            ))
                        )}
                    </>
                )}

                {activeTab === 'settings' && (
                    <>
                        <SidebarHeader>
                            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Settings</h2>
                        </SidebarHeader>
                        <div style={{ padding: '8px 0' }}>
                            <div style={{ backgroundColor: '$bg', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '$textMuted', marginBottom: '16px' }}>
                                <Search size={16} />
                                <span style={{ fontSize: '0.9rem' }}>Search settings</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '16px' }}>
                                {[
                                    { id: 'Profile', icon: <img src={currentUserData?.avatarUrl || 'https://via.placeholder.com/40'} alt="Profile" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />, title: currentUserData?.displayName || 'Profile', sub: currentUserData?.about || 'Available' },
                                    { id: 'Account', icon: <Key size={20} />, title: 'Account', sub: 'Security notifications, change number' },
                                    { id: 'Privacy', icon: <Lock size={20} />, title: 'Privacy', sub: 'Block contacts, disappearing messages' },
                                    { id: 'Chats', icon: <MessageSquare size={20} />, title: 'Chats', sub: 'Theme, wallpapers, chat settings' },
                                    { id: 'Notifications', icon: <Bell size={20} />, title: 'Notifications', sub: 'Message, group & call tones' },
                                    { id: 'Keyboard shortcuts', icon: <Monitor size={20} />, title: 'Keyboard shortcuts', sub: 'Quick actions' },
                                    { id: 'Help', icon: <HelpCircle size={20} />, title: 'Help', sub: 'Help centre, contact us, privacy policy' }
                                ].map((item, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '16px',
                                            padding: '12px 8px',
                                            cursor: 'pointer',
                                            backgroundColor: activeSettingTab === item.id ? 'var(--colors-bg)' : 'transparent',
                                            borderRadius: '8px'
                                        }}
                                        className="settings-item"
                                        onClick={() => setActiveSettingTab(item.id)}
                                    >
                                        <div style={{ color: 'var(--colors-textMuted)' }}>{item.icon}</div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ color: 'var(--colors-textMain)', fontSize: '0.95rem' }}>{item.title}</span>
                                            <span style={{ color: 'var(--colors-textMuted)', fontSize: '0.75rem' }}>{item.sub}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'status' && (
                    <>
                        <SidebarHeader>
                            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Status</h2>
                        </SidebarHeader>

                        <ChannelItem active={activeStatus === 'My status'} onClick={() => {
                            if (myGroupedStatuses) {
                                setStoryViewerInitialUserIndex(groupedStatuses.findIndex(g => g.user._id === mongoUserId));
                            } else {
                                setIsStatusModalOpen(true);
                            }
                        }} style={{ height: 'auto', padding: '12px 8px', gap: '16px' }}>
                            <AvatarWrapper style={{ flexShrink: 0 }}>
                                <Avatar src={currentUserData?.avatarUrl || user?.picture} style={{ width: '48px', height: '48px', border: myGroupedStatuses ? '2px solid var(--colors-accent)' : 'none', padding: myGroupedStatuses ? '2px' : '0' }} />
                                <div
                                    onClick={(e) => { e.stopPropagation(); setIsStatusModalOpen(true); }}
                                    style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: 'var(--colors-accent)', borderRadius: '50%', padding: '2px', color: 'white', display: 'flex' }}
                                >
                                    <Plus size={16} />
                                </div>
                            </AvatarWrapper>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '1rem', color: 'var(--colors-textMain)' }}>My status</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--colors-textMuted)' }}>{myGroupedStatuses ? 'Tap to view your status' : 'Tap to add status update'}</span>
                            </div>
                        </ChannelItem>

                        <SectionTitle style={{ marginTop: '16px', marginBottom: '8px' }}>Recent updates</SectionTitle>
                        {otherGroupedStatuses.length === 0 ? (
                            <div style={{ color: 'var(--colors-textMuted)', fontSize: '0.9rem', textAlign: 'center', marginTop: '32px' }}>
                                No recent updates to show right now.
                            </div>
                        ) : (
                            otherGroupedStatuses.map((group) => (
                                <ChannelItem key={group.user._id} onClick={() => setStoryViewerInitialUserIndex(groupedStatuses.findIndex(g => g.user._id === group.user._id))} style={{ height: 'auto', padding: '12px 8px', gap: '16px' }}>
                                    <AvatarWrapper style={{ flexShrink: 0, border: '2px solid var(--colors-accent)', padding: '2px' }}>
                                        <Avatar src={group.user.avatarUrl} style={{ width: '44px', height: '44px' }} />
                                    </AvatarWrapper>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '1rem', color: 'var(--colors-textMain)' }}>{group.user.displayName}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--colors-textMuted)' }}>
                                            {new Date(group.statuses[group.statuses.length - 1].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </ChannelItem>
                            ))
                        )}
                    </>
                )}
            </Sidebar>

            <ChatArea mobileHidden={!showChatArea}>
                {activeTab === 'settings' && activeSettingTab ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, backgroundColor: 'var(--colors-bg)', overflow: 'hidden' }}>
                        {activeSettingTab === 'Profile' ? (
                            <ProfilePane onBack={() => setActiveSettingTab(null)} currentUser={currentUserData} onUpdateProfile={handleUpdateProfile} getAccessTokenSilently={getAccessTokenSilently} BACKEND_URL={BACKEND_URL} />
                        ) : activeSettingTab === 'Account' ? (
                            <AccountPane onBack={() => setActiveSettingTab(null)} settings={appSettings} updateSetting={updateSetting} />
                        ) : activeSettingTab === 'Privacy' ? (
                            <PrivacyPane onBack={() => setActiveSettingTab(null)} settings={appSettings} updateSetting={updateSetting} />
                        ) : activeSettingTab === 'Chats' ? (
                            <ChatsPane onBack={() => setActiveSettingTab(null)} settings={appSettings} updateSetting={updateSetting} getAccessTokenSilently={getAccessTokenSilently} BACKEND_URL={BACKEND_URL} />
                        ) : activeSettingTab === 'Notifications' ? (
                            <NotificationsPane onBack={() => setActiveSettingTab(null)} settings={appSettings} updateSetting={updateSetting} />
                        ) : activeSettingTab === 'Keyboard shortcuts' ? (
                            <KeyboardShortcutsPane onBack={() => setActiveSettingTab(null)} />
                        ) : activeSettingTab === 'Help' ? (
                            <HelpPane onBack={() => setActiveSettingTab(null)} />
                        ) : null}
                    </div>
                ) : activeTab === 'status' ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--colors-bg)', overflow: 'hidden', position: 'relative' }}>
                        <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'var(--colors-accent)', filter: 'blur(200px)', opacity: 0.15, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                        <div style={{ 
                            width: '140px', height: '140px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(6,182,212,0.05) 100%)', 
                            border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', 
                            boxShadow: '0 0 40px rgba(6,182,212,0.15), inset 0 0 20px rgba(6,182,212,0.1)', position: 'relative', zIndex: 1
                        }}>
                            <CircleDashed size={64} color="var(--colors-accent)" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.5))' }} />
                        </div>
                        <h2 style={{ color: 'var(--colors-textMain)', fontSize: '2.5rem', marginBottom: '16px', fontWeight: '500', letterSpacing: '-0.5px', position: 'relative', zIndex: 1, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>DevSup Status</h2>
                        <p style={{ color: 'var(--colors-textMuted)', fontSize: '1.1rem', maxWidth: '400px', textAlign: 'center', lineHeight: '1.6', position: 'relative', zIndex: 1 }}>
                            Share ephemeral updates with your developer community. Statuses automatically disappear after 24 hours.
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '40px', color: 'var(--colors-textMuted)', fontSize: '0.85rem', position: 'relative', zIndex: 1 }}>
                            <Lock size={14} />
                            <span>Your updates are secure and private</span>
                        </div>
                    </div>
                ) : activeTab === 'calls' ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--colors-bg)', overflow: 'hidden', position: 'relative' }}>
                        <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'var(--colors-accent)', filter: 'blur(200px)', opacity: 0.15, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                        <div style={{ 
                            width: '140px', height: '140px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(6,182,212,0.05) 100%)', 
                            border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', 
                            boxShadow: '0 0 40px rgba(6,182,212,0.15), inset 0 0 20px rgba(6,182,212,0.1)', position: 'relative', zIndex: 1
                        }}>
                            <Phone size={64} color="var(--colors-accent)" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.5))' }} />
                        </div>
                        <h2 style={{ color: 'var(--colors-textMain)', fontSize: '2.5rem', marginBottom: '16px', fontWeight: '500', letterSpacing: '-0.5px', position: 'relative', zIndex: 1, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>DevSup Calls</h2>
                        <p style={{ color: 'var(--colors-textMuted)', fontSize: '1.1rem', maxWidth: '400px', textAlign: 'center', lineHeight: '1.6', position: 'relative', zIndex: 1 }}>
                            Connect instantly with crystal-clear voice and video. Start a call from any of your chats.
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '40px', color: 'var(--colors-textMuted)', fontSize: '0.85rem', position: 'relative', zIndex: 1 }}>
                            <Lock size={14} />
                            <span>End-to-end encrypted calls</span>
                        </div>
                    </div>
                ) : activeConversation ? (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
                            <ChatHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <>
                                        <MobileBackButton onClick={() => setActiveConversationId(null)}>
                                            <ArrowLeft size={24} />
                                        </MobileBackButton>
                                        <div
                                            onClick={() => setIsDrawerOpen(true)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                                            title={activeConversation.type === 'group' ? 'View Group Info' : 'View Contact Info'}
                                        >
                                            <AvatarWrapper>
                                                <Avatar
                                                    src={activeConversation.type === 'group'
                                                        ? (activeConversation.avatarUrl || `https://ui-avatars.com/api/?name=${activeConversation.name}&background=06B6D4&color=fff`)
                                                        : (activeConversation.participants?.find(p => p._id !== mongoUserId)?.avatarUrl || `https://ui-avatars.com/api/?name=User&background=06B6D4&color=fff`)}
                                                    style={{ width: '40px', height: '40px' }}
                                                />
                                            </AvatarWrapper>
                                            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '400px' }}>
                                                <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                                                    {activeConversation.type === 'group'
                                                        ? activeConversation.name
                                                        : (activeConversation.participants?.find(p => p._id !== mongoUserId)?.displayName || 'Direct Message')}
                                                </span>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--colors-textMuted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {activeConversation.type === 'group' ? activeConversation.participants?.map(p => p._id === mongoUserId ? 'You' : p.displayName).join(', ') : 'click here for contact info'}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                </div>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    {isSearchOpen && (
                                        <input
                                            type="text"
                                            placeholder="Search messages..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                border: '1px solid var(--colors-border)',
                                                backgroundColor: 'var(--colors-bg)',
                                                color: 'var(--colors-textMain)',
                                                outline: 'none'
                                            }}
                                        />
                                    )}
                                    {activeConversation.type === 'group' && (activeConversation.admins?.includes(mongoUserId) || activeConversation.allowAnyMemberToAdd) && (
                                        <IconButton onClick={() => setIsAddMembersModalOpen(true)} title="Add Members">
                                            <UserPlus size={20} />
                                        </IconButton>
                                    )}
                                    <IconButton onClick={() => setCallConfig({ active: true, isReceiving: false, callerData: null, callType: 'video' })} title="Video Call">
                                        <Video size={20} />
                                    </IconButton>
                                    <IconButton onClick={() => setCallConfig({ active: true, isReceiving: false, callerData: null, callType: 'audio' })} title="Voice Call">
                                        <Phone size={20} />
                                    </IconButton>
                                    <IconButton onClick={() => setIsSearchOpen(!isSearchOpen)} title="Search" style={{ color: isSearchOpen ? 'var(--colors-accent)' : 'inherit' }}>
                                        <Search size={20} />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => setIsWhiteboardOpen(true)}
                                        title="Open Whiteboard"
                                        style={{ color: isWhiteboardOpen ? 'var(--colors-accent)' : 'inherit' }}
                                    >
                                        <Brush size={20} />
                                    </IconButton>
                                    <div style={{ position: 'relative' }}>
                                        <IconButton onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)} title="More Options">
                                            <MoreVertical size={20} />
                                        </IconButton>
                                        {isHeaderMenuOpen && (
                                            <>
                                                <div
                                                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1999 }}
                                                    onClick={() => setIsHeaderMenuOpen(false)}
                                                />
                                                <ContextMenuContainer style={{ top: '100%', right: 0, marginTop: '8px', zIndex: 2000, width: '220px' }}>
                                                    <ContextMenuItem onClick={() => { setIsDrawerOpen(true); setIsHeaderMenuOpen(false); }}>
                                                        {activeConversation.type === 'group' ? 'Group info' : 'Contact info'}
                                                    </ContextMenuItem>
                                                    <ContextMenuItem onClick={() => { alert(activeConversation.type === 'group' ? 'Group calls coming soon!' : 'Calls coming soon!'); setIsHeaderMenuOpen(false); }}>
                                                        {activeConversation.type === 'group' ? 'Group calls' : 'Calls'}
                                                    </ContextMenuItem>
                                                    <ContextMenuItem onClick={() => { alert('Live coding features coming soon!'); setIsHeaderMenuOpen(false); }}>
                                                        Live coding features
                                                    </ContextMenuItem>
                                                    <ContextMenuItem onClick={() => { alert('Hackathon coming soon!'); setIsHeaderMenuOpen(false); }}>
                                                        Hackathon
                                                    </ContextMenuItem>
                                                    <ContextMenuItem onClick={() => { alert('Select messages coming soon!'); setIsHeaderMenuOpen(false); }}>
                                                        Select messages
                                                    </ContextMenuItem>
                                                    <ContextMenuItem onClick={() => { setActiveConversationId(null); setIsHeaderMenuOpen(false); }}>
                                                        Close chat
                                                    </ContextMenuItem>
                                                    <ContextMenuItem onClick={() => { alert('Mute notifications coming soon!'); setIsHeaderMenuOpen(false); }}>
                                                        Mute notifications
                                                    </ContextMenuItem>
                                                    <ContextMenuItem onClick={() => { alert('Disappearing messages coming soon!'); setIsHeaderMenuOpen(false); }}>
                                                        Disappearing messages
                                                    </ContextMenuItem>
                                                    <ContextMenuItem onClick={() => { setMessages([]); setIsHeaderMenuOpen(false); }}>
                                                        Clear messages
                                                    </ContextMenuItem>
                                                    <ContextMenuItem onClick={(e) => { deleteConversation(e, activeConversation._id); setIsHeaderMenuOpen(false); }} style={{ color: '#ef4444' }}>
                                                        {activeConversation.type === 'group' ? 'Exit group' : 'Delete chat'}
                                                    </ContextMenuItem>
                                                </ContextMenuContainer>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </ChatHeader>

                            {activeTab === 'communities' && activeConversation.type === 'group' && (
                                <div style={{ display: 'flex', gap: '24px', padding: '0 24px', borderBottom: '1px solid var(--colors-border)', backgroundColor: 'var(--colors-surface)', flexShrink: 0 }}>
                                    {['chat', 'live coding', 'hackathons', 'competitions'].map(tab => (
                                        <div
                                            key={tab}
                                            onClick={() => setCommunityTab(tab)}
                                            style={{
                                                padding: '16px 0',
                                                textTransform: 'capitalize',
                                                cursor: 'pointer',
                                                color: communityTab === tab ? 'var(--colors-accent)' : 'var(--colors-textMuted)',
                                                borderBottom: communityTab === tab ? '3px solid var(--colors-accent)' : '3px solid transparent',
                                                fontWeight: communityTab === tab ? '600' : '500',
                                                transition: 'all 0.2s',
                                                marginBottom: '-1px'
                                            }}
                                        >
                                            {tab}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {(!activeConversation || activeTab === 'chats' || (activeTab === 'communities' && communityTab === 'chat')) ? (
                                <>
                                    <MessageList style={{
                                        '--wallpaper-url': appSettings.wallpaperUrl ? `url("${appSettings.wallpaperUrl}")` : 'none',
                                        '--wallpaper-darken': 1 - (appSettings.wallpaperBrightness !== undefined ? appSettings.wallpaperBrightness : 100) / 100,
                                        '--wallpaper-size': appSettings.wallpaperType === 'custom' ? 'cover' : '400px',
                                        '--wallpaper-bg-color': appSettings.wallpaperBgColor || '#0b141a',
                                        flex: 1
                                    }}>
                                        {messages.length === 0 ? (
                                            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                                                Welcome to the beginning of the conversation.
                                            </div>
                                        ) : (
                                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'flex-start' }}>
                                                {messages.filter(msg => !searchQuery || (msg.content && (typeof msg.content === 'string') && msg.content.toLowerCase().includes(searchQuery.toLowerCase()))).map((msg) => {
                                                    const isOwnMessage = msg.sender?._id === mongoUserId;
                                                    const isGroup = activeConversation?.type === 'group';
                                                    const showSenderName = isGroup && !isOwnMessage;
                                                    const isOnlyUrl = msg.content && typeof msg.content === 'string' && msg.content.trim().startsWith('http') && !msg.content.trim().includes(' ');
                                                    const isMediaMessage = msg.isCodeSnippet || (isOnlyUrl && isImageUrl(msg.content));
                                                    const isImageWithCaption = isMediaMessage && !msg.isCodeSnippet && !!msg.caption;
                                                    return (
                                                        <ChatBubbleWrapper
                                                            key={msg._id || msg.createdAt}
                                                            isOwn={isOwnMessage}
                                                        >
                                                            <ChatBubble
                                                                isOwn={isOwnMessage}
                                                                mediaOnly={isMediaMessage}
                                                                onContextMenu={(e) => handleContextMenu(e, 'message', msg)}
                                                                onTouchStart={(e) => handleTouchStart(e, msg)}
                                                                onTouchMove={handleTouchMove}
                                                                onTouchEnd={handleTouchEnd}
                                                                onTouchCancel={handleTouchEnd}
                                                            >
                                                                {showSenderName && (
                                                                    <SenderName style={{
                                                                        color: activeConversation?.type === 'group' ? getDailyUserColor(msg.sender?._id) : undefined,
                                                                        ...(isMediaMessage ? { padding: '6px 8px 0 8px' } : {})
                                                                    }}>
                                                                        {msg.sender?.displayName || 'Unknown User'}
                                                                    </SenderName>
                                                                )}

                                                                <div style={{ wordBreak: 'break-word', marginTop: showSenderName && !isMediaMessage ? '2px' : '0', maxWidth: isImageWithCaption ? '300px' : 'none' }}>
                                                                    {(() => {
                                                                        const embedData = detectEcosystemLink(msg.content);

                                                                        // If it's a code snippet, just render the code block
                                                                        if (msg.isCodeSnippet) {
                                                                            return (
                                                                                <SyntaxHighlighter
                                                                                    language={msg.language}
                                                                                    style={vscDarkPlus}
                                                                                    customStyle={{ borderRadius: '10px', margin: '0', fontSize: '0.9rem' }}
                                                                                >
                                                                                    {msg.content}
                                                                                </SyntaxHighlighter>
                                                                            );
                                                                        }

                                                                        // Check if message is strictly just a URL
                                                                        const isOnlyUrl = msg.content.trim().startsWith('http') && !msg.content.trim().includes(' ');
                                                                        const hasAttachment = embedData || isImageUrl(msg.content) || isAudioUrl(msg.content) || isCloudinaryUrl(msg.content);
                                                                        const shouldShowText = !(isOnlyUrl && hasAttachment);

                                                                        return (
                                                                            <>
                                                                                {shouldShowText && (
                                                                                    <div style={{ whiteSpace: 'pre-wrap' }}>
                                                                                        {msg.content}
                                                                                    </div>
                                                                                )}

                                                                                {embedData && (
                                                                                    <EmbedCard style={{ marginTop: '8px' }}>
                                                                                        <EmbedHeader>
                                                                                            {embedData.type === 'github' && (
                                                                                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path></svg>
                                                                                            )}
                                                                                            {embedData.type === 'figma' && (
                                                                                                <svg viewBox="0 0 38 57" width="14" height="18" fill="currentColor"><path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" fill="#1abcfe" /><path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" fill="#0acf83" /><path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" fill="#ff7262" /><path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" fill="#f24e1e" /><path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" fill="#a259ff" /></svg>
                                                                                            )}
                                                                                            {embedData.type === 'notion' && (
                                                                                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M4.459 4.208c.746.606 1.026.56 2.422.466V4.44h8.33v.234c1.164.047 1.63.14 2.237.792l4.009 4.383v11.854c-.653.606-1.118.56-2.515.466v.233H9.278v-.233c-1.352.093-1.631.14-2.423-.513L4.46 17.653V4.208zm11.751 13.987V8.583L9.65 18.289h6.56zM6.929 16.7l6.387-9.511H7.814l-1.957 2.19v7.927l1.072-.606z" /></svg>
                                                                                            )}
                                                                                            {embedData.type === 'github' ? `${embedData.owner}/${embedData.repo}` : embedData.type === 'figma' ? 'Figma Design Workspace' : 'Notion Document'}
                                                                                        </EmbedHeader>
                                                                                        <EmbedDescription>
                                                                                            {embedData.type === 'github' && 'GitHub Repository Preview'}
                                                                                            {embedData.type === 'figma' && 'Live UI/UX File'}
                                                                                            {embedData.type === 'notion' && 'Workspace Documentation'}
                                                                                        </EmbedDescription>
                                                                                        <EmbedAction href={embedData.url} target="_blank" rel="noopener noreferrer">
                                                                                            Open in {embedData.type.charAt(0).toUpperCase() + embedData.type.slice(1)}
                                                                                        </EmbedAction>
                                                                                    </EmbedCard>
                                                                                )}

                                                                                {isImageUrl(msg.content) && (
                                                                                    <a href={msg.content} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: isMediaMessage ? '0' : '8px' }}>
                                                                                        <AttachmentImage src={msg.content} alt="User attachment" style={isMediaMessage ? { maxWidth: '100%', width: '300px' } : {}} />
                                                                                    </a>
                                                                                )}

                                                                                {isAudioUrl(msg.content) && (
                                                                                    <CustomAudioPlayer src={msg.content} isOwnMessage={isOwnMessage} avatarUrl={msg.sender?.avatarUrl} />
                                                                                )}

                                                                                {isCloudinaryUrl(msg.content) && !isImageUrl(msg.content) && !isAudioUrl(msg.content) && (
                                                                                    <AttachmentLink href={msg.content} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', marginTop: '8px' }}>
                                                                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg>
                                                                                        View Document
                                                                                    </AttachmentLink>
                                                                                )}

                                                                                {msg.caption && (
                                                                                    <div style={{ whiteSpace: 'pre-wrap', marginTop: '4px', padding: isMediaMessage ? '4px 6px 4px 6px' : '4px 0', borderTop: isMediaMessage ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>
                                                                                        {msg.caption}
                                                                                    </div>
                                                                                )}
                                                                            </>
                                                                        );
                                                                    })()}
                                                                    <span style={{ display: 'inline-block', width: msg.isEdited ? '80px' : '50px', height: '10px' }}>&#8203;</span>
                                                                </div>

                                                                <MessageTime isOwn={isOwnMessage}>
                                                                    {msg.isEdited && <i>edited</i>}
                                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </MessageTime>

                                                                {editingMessageId === msg._id && (
                                                                    <form onSubmit={submitEdit} style={{ marginTop: '8px', zIndex: 10 }}>
                                                                        <EditInput
                                                                            autoFocus
                                                                            value={editInputContent}
                                                                            onChange={e => setEditInputContent(e.target.value)}
                                                                            style={{ color: 'black' }}
                                                                        />
                                                                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                                                            <Button type="button" variant="outline" onClick={cancelEditing} style={{ padding: '2px 8px', fontSize: '0.8rem', color: 'inherit', borderColor: 'currentColor' }}>Cancel</Button>
                                                                            <Button type="submit" variant="primary" style={{ padding: '2px 8px', fontSize: '0.8rem', backgroundColor: '$bg', color: '$textMain' }}>Save</Button>
                                                                        </div>
                                                                    </form>
                                                                )}
                                                            </ChatBubble>
                                                        </ChatBubbleWrapper>
                                                    )
                                                })}
                                                <div ref={messagesEndRef} />
                                            </div>
                                        )}

                                    </MessageList>

                                    <InputArea onSubmit={handleSendMessage} style={{ flexShrink: 0 }}>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            style={{ display: 'none' }}
                                            onChange={handleFileSelect}
                                            accept="image/*,.pdf,.doc,.docx"
                                        />

                                        <AttachButton
                                            type="button"
                                            title="Attach File"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading || isRecording}
                                        >
                                            {isUploading ? <Spinner /> : <PlusIcon />}
                                        </AttachButton>

                                        {isRecording ? (
                                            <VoiceRecordingIndicator time={recordingTime} />
                                        ) : (
                                            <Input
                                                ref={inputRef}
                                                placeholder="Message..."
                                                value={messageInput}
                                                onChange={handleInputChange}
                                                onKeyDown={handleKeyDown}
                                                rows={1}
                                            />
                                        )}

                                        {messageInput.trim().length > 0 ? (
                                            <SendButton type="submit" title="Send Message" disabled={isUploading || isRecording}>
                                                <SendIcon />
                                            </SendButton>
                                        ) : (
                                            <SendButton
                                                type="button"
                                                title={isRecording ? "Stop Recording" : "Record Voice Note"}
                                                onClick={isRecording ? stopRecording : startRecording}
                                                disabled={isUploading}
                                                style={isRecording ? { backgroundColor: 'var(--colors-danger)' } : {}}
                                            >
                                                {isRecording ? <Square size={20} /> : <CustomMicIcon size={20} />}
                                            </SendButton>
                                        )}
                                    </InputArea>
                                </>
                            ) : (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--colors-bg)' }}>
                                    <PlaceholderView
                                        icon={
                                            communityTab === 'live coding' ? <Code2 size={64} /> :
                                                communityTab === 'hackathons' ? <Users size={64} /> :
                                                    <Monitor size={64} />
                                        }
                                        title={`${communityTab.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Space`}
                                        subtitle={`This dedicated space for community ${communityTab} is coming soon. Stay tuned!`}
                                    />
                                </div>
                            )}
                        </div>
                ) : (
                    <>
                        {activeTab === 'settings' && <PlaceholderView icon={<Settings size={64} />} title="Settings" />}
                        {activeTab === 'status' && (activeStatus ? <PlaceholderView icon={<CircleDashed size={64} />} title={`${activeStatus}`} subtitle="No current status updates to show." /> : <PlaceholderView icon={<CircleDashed size={64} />} title="Share statuses" subtitle="Share photos, videos and text that disappear after 24 hours." />)}
                        {activeTab === 'calls' && <PlaceholderView icon={<Phone size={64} />} title="Your Calls" subtitle="Start a voice or video call from any of your chats." />}
                        {(activeTab === 'chats' || activeTab === 'communities') && (
                            <PlaceholderView
                                icon={activeTab === 'communities' ? <Users size={64} /> : <MessageSquare size={64} />}
                                title={activeTab === 'communities' ? "Communities" : "Welcome to DevSup!"}
                                subtitle={activeTab === 'communities' ? "Select a community or create a new one to get started." : "Click the + button in the sidebar to start a new conversation."}
                            />
                        )}
                    </>
                )}
            </ChatArea>

            <RightDrawer isOpen={isDrawerOpen}>
                {isDrawerOpen && activeConversation && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', paddingBottom: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px', backgroundColor: 'var(--colors-surface)', position: 'sticky', top: 0, zIndex: 10 }}>
                            <IconButton onClick={() => setIsDrawerOpen(false)}>
                                <X size={20} />
                            </IconButton>
                            <span style={{ fontSize: '1.1rem', color: 'var(--colors-textMain)', fontWeight: '500' }}>
                                {activeConversation.type === 'group' ? 'Group Info' : 'Contact Info'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', backgroundColor: 'var(--colors-surface)' }}>
                            <label htmlFor={`group-avatar-upload-${activeConversation._id}`} style={{ cursor: activeConversation.type === 'group' ? 'pointer' : 'default', position: 'relative', display: 'inline-block' }}>
                                <Avatar
                                    src={activeConversation.type === 'group'
                                        ? (activeConversation.avatarUrl || `https://ui-avatars.com/api/?name=${activeConversation.name}&background=06B6D4&color=fff&size=200`)
                                        : (activeConversation.participants?.find(p => p._id !== mongoUserId)?.avatarUrl || `https://ui-avatars.com/api/?name=User&background=06B6D4&color=fff&size=200`)}
                                    style={{ width: '160px', height: '160px', borderRadius: '50%', marginBottom: '16px', border: 'none', objectFit: 'cover' }}
                                />
                                {activeConversation.type === 'group' && (
                                    <input
                                        id={`group-avatar-upload-${activeConversation._id}`}
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            handleUpdateGroupAvatar(e.target.files[0]);
                                            e.target.value = null;
                                        }}
                                    />
                                )}
                            </label>
                            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', color: 'var(--colors-textMain)' }}>
                                {activeConversation.type === 'group' ? activeConversation.name : activeConversation.participants?.find(p => p._id !== mongoUserId)?.displayName}
                            </h2>
                            {activeConversation.type === 'group' && <span style={{ color: 'var(--colors-textMuted)', fontSize: '1rem', marginBottom: '16px' }}>Group • {activeConversation.participants?.length || 0} participants</span>}
                            {(!activeConversation.type || activeConversation.type === 'direct') ? <span style={{ color: 'var(--colors-textMuted)', fontSize: '1rem', marginBottom: '16px' }}>{activeConversation.participants?.find(p => p._id !== mongoUserId)?.techDiscipline || 'Available'}</span> : null}

                            <div style={{ display: 'flex', gap: '32px', marginTop: '8px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--colors-accent)' }} onClick={() => setCallConfig({ active: true, isReceiving: false, callerData: null, callType: 'audio' })}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Phone size={20} />
                                    </div>
                                    <span style={{ fontSize: '0.85rem' }}>Audio</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--colors-accent)' }} onClick={() => setCallConfig({ active: true, isReceiving: false, callerData: null, callType: 'video' })}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Video size={20} />
                                    </div>
                                    <span style={{ fontSize: '0.85rem' }}>Video</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--colors-accent)' }} onClick={() => { setIsSearchOpen(true); setIsDrawerOpen(false); }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Search size={20} />
                                    </div>
                                    <span style={{ fontSize: '0.85rem' }}>Search</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ height: '8px', backgroundColor: 'var(--colors-bg)' }}></div>

                        {(!activeConversation.type || activeConversation.type === 'direct') && (() => {
                            const contact = activeConversation.participants?.find(p => p._id !== mongoUserId);
                            return (
                                <>
                                    <div style={{ padding: '16px', backgroundColor: 'var(--colors-surface)' }}>
                                        <div style={{ color: 'var(--colors-textMuted)', fontSize: '0.9rem', marginBottom: '8px' }}>About</div>
                                        <div style={{ color: 'var(--colors-textMain)', fontSize: '1rem', marginBottom: '16px' }}>
                                            {contact?.about || 'Available'}
                                        </div>
                                        <div style={{ color: 'var(--colors-textMuted)', fontSize: '0.9rem', marginBottom: '8px' }}>Tech Discipline</div>
                                        <div style={{ color: 'var(--colors-textMain)', fontSize: '1rem', marginBottom: '16px' }}>
                                            {contact?.techDiscipline || 'Fullstack'}
                                        </div>

                                        {(contact?.githubProfile || contact?.linkedinProfile || contact?.portfolioUrl) && (
                                            <>
                                                <div style={{ color: 'var(--colors-textMuted)', fontSize: '0.9rem', marginBottom: '12px' }}>Professional Profiles</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    {contact?.githubProfile && (
                                                        <a href={contact.githubProfile} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--colors-accent)', textDecoration: 'none' }}>
                                                            <Code2 size={18} />
                                                            <span style={{ fontSize: '0.95rem' }}>GitHub Profile</span>
                                                        </a>
                                                    )}
                                                    {contact?.linkedinProfile && (
                                                        <a href={contact.linkedinProfile} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--colors-accent)', textDecoration: 'none' }}>
                                                            <Briefcase size={18} />
                                                            <span style={{ fontSize: '0.95rem' }}>LinkedIn Profile</span>
                                                        </a>
                                                    )}
                                                    {contact?.portfolioUrl && (
                                                        <a href={contact.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--colors-accent)', textDecoration: 'none' }}>
                                                            <LinkIcon size={18} />
                                                            <span style={{ fontSize: '0.95rem' }}>Portfolio Website</span>
                                                        </a>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div style={{ height: '8px', backgroundColor: 'var(--colors-bg)' }}></div>
                                </>
                            );
                        })()}

                        <div style={{ padding: '24px 16px', backgroundColor: 'var(--colors-surface)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', cursor: 'pointer' }}>
                                <Image size={24} color="var(--colors-textMuted)" />
                                <span style={{ fontSize: '1rem' }}>Media, links and docs</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', cursor: 'pointer' }}>
                                <Star size={24} color="var(--colors-textMuted)" />
                                <span style={{ fontSize: '1rem' }}>Starred messages</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', cursor: 'pointer' }}>
                                <Bell size={24} color="var(--colors-textMuted)" />
                                <span style={{ fontSize: '1rem' }}>Notification settings</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', cursor: 'pointer' }}>
                                <Clock size={24} color="var(--colors-textMuted)" />
                                <span style={{ fontSize: '1rem' }}>Disappearing messages</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', cursor: 'pointer' }}>
                                <Lock size={24} color="var(--colors-textMuted)" />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '1rem' }}>Encryption</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--colors-textMuted)' }}>Messages are end-to-end encrypted. Click to verify.</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ height: '8px', backgroundColor: 'var(--colors-bg)' }}></div>

                        {activeConversation.type === 'group' && activeConversation.admins?.includes(mongoUserId) && (
                            <>
                                <div style={{ padding: '24px 16px', backgroundColor: 'var(--colors-surface)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ color: 'var(--colors-accent)', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Group Settings</div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '1rem', color: 'var(--colors-textMain)' }}>Allow Members to Add Others</span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--colors-textMuted)' }}>If disabled, only admins can add new members.</span>
                                        </div>
                                        <div 
                                            style={{ width: '40px', height: '24px', borderRadius: '12px', backgroundColor: activeConversation.allowAnyMemberToAdd ? 'var(--colors-accent)' : 'var(--colors-border)', position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s' }}
                                            onClick={async () => {
                                                try {
                                                    const token = await getAccessTokenSilently();
                                                    const res = await fetch(`${BACKEND_URL}/api/conversations/${activeConversation._id}`, {
                                                        method: 'PUT',
                                                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ allowAnyMemberToAdd: !activeConversation.allowAnyMemberToAdd })
                                                    });
                                                    if(res.ok) {
                                                        const updated = await res.json();
                                                        setConversations(prev => prev.map(c => c._id === updated._id ? updated : c));
                                                        if (activeConversationId === updated._id) setActiveConversationId(updated._id);
                                                    }
                                                } catch (e) {
                                                    console.error('Failed to update group settings', e);
                                                }
                                            }}
                                        >
                                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '2px', left: activeConversation.allowAnyMemberToAdd ? '18px' : '2px', transition: 'left 0.2s' }} />
                                        </div>
                                    </div>
                                </div>
                                <div style={{ height: '8px', backgroundColor: 'var(--colors-bg)' }}></div>
                            </>
                        )}

                        {activeConversation.type === 'group' ? (
                            <div style={{ padding: '16px', backgroundColor: 'var(--colors-surface)' }}>
                                <div style={{ color: 'var(--colors-textMuted)', fontSize: '0.9rem', marginBottom: '16px' }}>{activeConversation.participants?.length || 0} participants</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {activeConversation?.participants?.map(participant => (
                                        <div key={participant._id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <Avatar
                                                src={participant._id === mongoUserId ? (currentUserData?.avatarUrl || participant.avatarUrl) : participant.avatarUrl}
                                                style={{ width: '40px', height: '40px' }}
                                            />
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ color: 'var(--colors-textMain)', fontSize: '1rem' }}>
                                                    {participant._id === mongoUserId ? 'You' : participant.displayName}
                                                </span>
                                                <span style={{ color: 'var(--colors-textMuted)', fontSize: '0.85rem' }}>
                                                    {participant.techDiscipline || 'Fullstack'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: '24px 16px', backgroundColor: 'var(--colors-surface)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', cursor: 'pointer', color: '#ef4444' }} onClick={(e) => deleteConversation(e, activeConversation._id)}>
                                    <Trash2 size={24} color="#ef4444" />
                                    <span style={{ fontSize: '1rem' }}>Clear chat</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', cursor: 'pointer', color: '#ef4444' }}>
                                    <ShieldAlert size={24} color="#ef4444" />
                                    <span style={{ fontSize: '1rem' }}>Block {activeConversation.participants?.find(p => p._id !== mongoUserId)?.displayName}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', cursor: 'pointer', color: '#ef4444' }}>
                                    <ThumbsDown size={24} color="#ef4444" />
                                    <span style={{ fontSize: '1rem' }}>Report {activeConversation.participants?.find(p => p._id !== mongoUserId)?.displayName}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </RightDrawer>

            {isWhiteboardOpen && (
                <Whiteboard
                    socket={socket}
                    conversationId={activeConversationId}
                    onClose={() => setIsWhiteboardOpen(false)}
                />
            )}

            {/* Create Conversation Modal */}
            {isModalOpen && (
                <ModalOverlay onClick={() => setIsModalOpen(false)}>
                    <ModalContent onClick={e => e.stopPropagation()}>
                        <ModalTitle style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                            {activeTab === 'communities' ? 'Create Community' : 'New Conversation'}
                            <IconButton onClick={() => { setIsModalOpen(false); setUserSearchQuery(''); }}>✕</IconButton>
                        </ModalTitle>

                        {activeTab !== 'communities' && (
                            <FormGroup>
                                <Label>Type</Label>
                                <div style={{ display: 'flex', gap: '4px', padding: '4px', backgroundColor: 'var(--colors-bg)', border: '1px solid var(--colors-border)', borderRadius: '8px' }}>
                                    <div
                                        onClick={() => { setConvType('direct'); setSelectedUsers([]); }}
                                        style={{ flex: 1, padding: '8px', textAlign: 'center', cursor: 'pointer', borderRadius: '6px', backgroundColor: convType === 'direct' ? 'var(--colors-surface)' : 'transparent', color: convType === 'direct' ? 'var(--colors-textMain)' : 'var(--colors-textMuted)', border: convType === 'direct' ? '1px solid var(--colors-border)' : '1px solid transparent', transition: 'all 0.2s', fontWeight: convType === 'direct' ? '600' : 'normal', boxShadow: convType === 'direct' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}
                                    >
                                        Direct Message
                                    </div>
                                    <div
                                        onClick={() => { setConvType('group'); setSelectedUsers([]); }}
                                        style={{ flex: 1, padding: '8px', textAlign: 'center', cursor: 'pointer', borderRadius: '6px', backgroundColor: convType === 'group' ? 'var(--colors-surface)' : 'transparent', color: convType === 'group' ? 'var(--colors-textMain)' : 'var(--colors-textMuted)', border: convType === 'group' ? '1px solid var(--colors-border)' : '1px solid transparent', transition: 'all 0.2s', fontWeight: convType === 'group' ? '600' : 'normal', boxShadow: convType === 'group' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}
                                    >
                                        Group Channel
                                    </div>
                                </div>
                            </FormGroup>
                        )}

                        {convType === 'group' && (
                            <>
                                <FormGroup>
                                    <Label>{activeTab === 'communities' ? 'Community Name' : 'Group Name'}</Label>
                                    <ModalInput
                                        placeholder={activeTab === 'communities' ? "e.g. Open Source Contributors" : "e.g. Project Alpha"}
                                        value={convName}
                                        onChange={e => setConvName(e.target.value)}
                                        style={{ padding: '12px', borderRadius: '8px' }}
                                    />
                                </FormGroup>
                                <FormGroup>
                                    <Label>Description (optional)</Label>
                                    <ModalInput
                                        placeholder="What is this group about?"
                                        value={convDescription}
                                        onChange={e => setConvDescription(e.target.value)}
                                        style={{ padding: '12px', borderRadius: '8px' }}
                                    />
                                </FormGroup>
                                <FormGroup>
                                    <Label>Group Image (optional)</Label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                                        {convAvatarUrl && (
                                            <img src={convAvatarUrl} alt="Preview" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                handleImageUpload(e.target.files[0], setConvAvatarUrl);
                                                e.target.value = null;
                                            }}
                                            style={{ color: 'var(--colors-textMuted)', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                </FormGroup>
                            </>
                        )}

                        <FormGroup>
                            <Label>Select User(s) {convType === 'group' ? <span style={{fontSize: '0.8rem', color: 'var(--colors-accent)'}}>(Your Contacts)</span> : ''}</Label>
                            <ModalInput
                                placeholder="Search by name..."
                                value={userSearchQuery}
                                onChange={e => setUserSearchQuery(e.target.value)}
                                style={{ padding: '10px 12px', borderRadius: '8px', marginBottom: '8px' }}
                            />
                            <UserList style={{ border: '1px solid var(--colors-border)', borderRadius: '8px', backgroundColor: 'var(--colors-bg)', overflow: 'hidden' }}>
                                {(() => {
                                    let displayedUsers = allUsers;
                                    if (convType === 'group') {
                                        const contactIds = [...new Set(conversations.filter(c => c.type === 'direct').flatMap(c => c.participants.map(p => p?._id)).filter(id => id && id !== mongoUserId))];
                                        displayedUsers = allUsers.filter(u => contactIds.includes(u._id));
                                    }
                                    const filtered = displayedUsers.filter(u => u.displayName?.toLowerCase().includes(userSearchQuery.toLowerCase()));
                                    
                                    if (filtered.length === 0) {
                                        return <div style={{ padding: '16px', color: 'var(--colors-textMuted)', fontSize: '0.85rem', textAlign: 'center' }}>{convType === 'group' ? 'No contacts found. Start a direct chat first!' : 'No users found.'}</div>;
                                    }
                                    
                                    return filtered.map(u => (
                                        <UserListItem
                                            key={u._id}
                                            selected={selectedUsers.includes(u._id)}
                                            onClick={() => toggleUserSelection(u._id)}
                                            style={{ padding: '12px 16px', borderBottom: '1px solid var(--colors-border)' }}
                                        >
                                            <AvatarWrapper>
                                                <Avatar src={u.avatarUrl} style={{ width: '32px', height: '32px' }} />
                                                {activeUsers.includes(u._id) && <OnlineDot style={{ width: '8px', height: '8px', bottom: '0px', right: '0px' }} />}
                                            </AvatarWrapper>
                                            <span style={{ color: 'var(--colors-textMain)', fontSize: '0.95rem', fontWeight: '500' }}>{u.displayName}</span>
                                            {selectedUsers.includes(u._id) && (
                                                <div style={{ marginLeft: 'auto', color: 'var(--colors-accent)' }}>
                                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>
                                                </div>
                                            )}
                                        </UserListItem>
                                    ));
                                })()}
                            </UserList>
                        </FormGroup>

                        <Button
                            variant="primary"
                            fullWidth
                            onClick={handleCreateConversation}
                            disabled={selectedUsers.length === 0 || (convType === 'group' && !convName)}
                            style={{ padding: '14px', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', marginTop: '8px' }}
                        >
                            {activeTab === 'communities' ? 'Create Community' : 'Start Chat'}
                        </Button>
                    </ModalContent>
                </ModalOverlay>
            )}

            {/* Add Members Modal */}
            {isAddMembersModalOpen && activeConversation?.type === 'group' && (
                <ModalOverlay onClick={() => setIsAddMembersModalOpen(false)}>
                    <ModalContent onClick={e => e.stopPropagation()}>
                        <ModalTitle>
                            Add Members
                            <IconButton onClick={() => setIsAddMembersModalOpen(false)}>✕</IconButton>
                        </ModalTitle>

                        <FormGroup>
                            <Label>Select Contacts to Add</Label>
                            <ModalInput
                                placeholder="Search contacts..."
                                value={addMembersSearchQuery}
                                onChange={e => setAddMembersSearchQuery(e.target.value)}
                                style={{ padding: '10px 12px', borderRadius: '8px', marginBottom: '8px' }}
                            />
                            <UserList style={{ border: '1px solid var(--colors-border)', borderRadius: '8px', backgroundColor: 'var(--colors-bg)', overflow: 'hidden' }}>
                                {(() => {
                                    const contactIds = [...new Set(conversations.filter(c => c.type === 'direct').flatMap(c => c.participants.map(p => p?._id)).filter(id => id && id !== mongoUserId))];
                                    const existingMemberIds = activeConversation.participants?.map(p => p._id) || [];
                                    
                                    const availableContacts = allUsers.filter(u => contactIds.includes(u._id) && !existingMemberIds.includes(u._id));
                                    const filtered = availableContacts.filter(u => u.displayName?.toLowerCase().includes(addMembersSearchQuery.toLowerCase()));
                                    
                                    if (filtered.length === 0) {
                                        return <div style={{ padding: '16px', color: 'var(--colors-textMuted)', fontSize: '0.85rem', textAlign: 'center' }}>No available contacts to add.</div>;
                                    }
                                    
                                    return filtered.map(u => (
                                        <UserListItem
                                            key={u._id}
                                            selected={selectedMembersToAdd.includes(u._id)}
                                            onClick={() => {
                                                setSelectedMembersToAdd(prev => 
                                                    prev.includes(u._id) ? prev.filter(id => id !== u._id) : [...prev, u._id]
                                                );
                                            }}
                                            style={{ padding: '12px 16px', borderBottom: '1px solid var(--colors-border)' }}
                                        >
                                            <AvatarWrapper>
                                                <Avatar src={u.avatarUrl} style={{ width: '32px', height: '32px' }} />
                                                {activeUsers.includes(u._id) && <OnlineDot style={{ width: '8px', height: '8px', bottom: '0px', right: '0px' }} />}
                                            </AvatarWrapper>
                                            <span style={{ color: 'var(--colors-textMain)', fontSize: '0.95rem', fontWeight: '500' }}>{u.displayName}</span>
                                            {selectedMembersToAdd.includes(u._id) && (
                                                <div style={{ marginLeft: 'auto', color: 'var(--colors-accent)' }}>
                                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>
                                                </div>
                                            )}
                                        </UserListItem>
                                    ));
                                })()}
                            </UserList>
                        </FormGroup>

                        <Button
                            variant="primary"
                            fullWidth
                            onClick={handleAddMembersToGroup}
                            disabled={selectedMembersToAdd.length === 0}
                            style={{ padding: '14px', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', marginTop: '8px' }}
                        >
                            Add to Group
                        </Button>
                    </ModalContent>
                </ModalOverlay>
            )}

            {/* Forward Message Modal */}
            {forwardMessageData && (
                <ModalOverlay onClick={() => setForwardMessageData(null)}>
                    <ModalContent onClick={e => e.stopPropagation()}>
                        <ModalTitle>
                            Forward Message
                            <IconButton onClick={() => setForwardMessageData(null)}>✕</IconButton>
                        </ModalTitle>
                        <div style={{ marginTop: '16px', maxHeight: '300px', overflowY: 'auto' }}>
                            {conversations.length === 0 ? (
                                <div style={{ color: 'var(--colors-textMuted)', textAlign: 'center', padding: '16px' }}>No active conversations found.</div>
                            ) : (
                                [...conversations].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map(c => {
                                    const isGroup = c.type === 'group';
                                    const otherParticipant = !isGroup ? c.participants?.find(p => p._id !== mongoUserId) : null;

                                    return (
                                        <div
                                            key={c._id}
                                            onClick={() => confirmForward(c._id)}
                                            style={{
                                                padding: '12px 16px',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid var(--colors-border)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                transition: 'background-color 0.2s',
                                                borderRadius: '6px'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--colors-border)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <AvatarWrapper style={{ flexShrink: 0 }}>
                                                <Avatar
                                                    src={isGroup
                                                        ? (c.avatarUrl || `https://ui-avatars.com/api/?name=${c.name}&background=06B6D4&color=fff`)
                                                        : (otherParticipant?.avatarUrl || `https://ui-avatars.com/api/?name=${otherParticipant?.displayName || 'User'}&background=06B6D4&color=fff`)}
                                                    style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none' }}
                                                />
                                            </AvatarWrapper>
                                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, justifyContent: 'center' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--colors-textMain)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {isGroup ? c.name : (otherParticipant?.displayName || 'Unknown User')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </ModalContent>
                </ModalOverlay>
            )}

            {isStatusModalOpen && (
                <StatusUploadModal
                    onClose={() => setIsStatusModalOpen(false)}
                    BACKEND_URL={BACKEND_URL}
                    getAccessTokenSilently={getAccessTokenSilently}
                    onUpload={handleStatusUpload}
                />
            )}

            {storyViewerInitialUserIndex !== null && (
                <StoryViewer
                    groupedStatuses={groupedStatuses}
                    initialUserIndex={storyViewerInitialUserIndex}
                    onClose={() => setStoryViewerInitialUserIndex(null)}
                    currentUserId={mongoUserId}
                    markViewed={handleMarkStatusViewed}
                    onDelete={handleDeleteStatus}
                    onForward={handleForwardStatus}
                    onReshare={handleReshareStatus}
                />
            )}

            {/* Chat Image Upload Modal */}
            {chatUploadPreview && (
                <ModalOverlay style={{ zIndex: 9999 }}>
                    <ModalContent style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px', width: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: 'var(--colors-textMain)' }}>Send Media</h3>
                            <IconButton onClick={cancelChatUpload}><X size={24} /></IconButton>
                        </div>
                        <div style={{ flex: 1, minHeight: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                            {chatUploadFile?.type?.startsWith('video/') ? (
                                <video src={chatUploadPreview} controls style={{ maxWidth: '100%', maxHeight: '400px' }} />
                            ) : (
                                <img src={chatUploadPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                            )}
                        </div>
                        <input
                            type="text"
                            placeholder="Add a caption..."
                            value={chatUploadCaption}
                            onChange={(e) => setChatUploadCaption(e.target.value)}
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--colors-border)', backgroundColor: 'var(--colors-surface)', color: 'var(--colors-textMain)', outline: 'none', fontSize: '1rem' }}
                            autoFocus
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={cancelChatUpload}
                                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--colors-border)', backgroundColor: 'transparent', color: 'var(--colors-textMain)', cursor: 'pointer', fontSize: '1rem' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmChatUpload}
                                disabled={isUploading}
                                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--colors-accent, #00C853)', color: '#fff', cursor: isUploading ? 'not-allowed' : 'pointer', fontSize: '1rem', opacity: isUploading ? 0.7 : 1 }}
                            >
                                {isUploading ? 'Sending...' : 'Send'}
                            </button>
                        </div>
                    </ModalContent>
                </ModalOverlay>
            )}

            <CallOverlay
                socket={socket}
                mongoUserId={mongoUserId}
                activeConversation={activeConversation}
                callConfig={callConfig}
                onEndCall={() => setCallConfig({ active: false, isReceiving: false, callerData: null, callType: 'video' })}
            />

            {contextMenu.visible && (contextMenu.message || contextMenu.callLog || contextMenu.conversation) && (
                <ContextMenuContainer style={{ top: contextMenu.y, left: contextMenu.x, zIndex: 9999, position: 'fixed' }}>
                    {contextMenu.conversation && (
                        <>
                            <ContextMenuItem onClick={(e) => { setContextMenu({ ...contextMenu, visible: false }); deleteConversation(e, contextMenu.conversation._id); }} style={{ color: '#ef4444' }}>
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                                Delete {contextMenu.conversation.type === 'group' ? 'Community' : 'Chat'}
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => setContextMenu({ ...contextMenu, visible: false })}>
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"></path></svg>
                                Archive Chat
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => setContextMenu({ ...contextMenu, visible: false })}>
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6zM7.58 4.08L6.15 2.65C3.75 4.48 2.17 7.3 2.03 10.5h2c.15-2.65 1.51-4.97 3.55-6.42zm12.39 6.42h2c-.15-3.2-1.73-6.02-4.12-7.85l-1.42 1.43c2.02 1.45 3.39 3.77 3.54 6.42z"></path></svg>
                                Mute Notifications
                            </ContextMenuItem>
                        </>
                    )}
                    {contextMenu.message && (
                        <>
                            {!isAudioUrl(contextMenu.message.content) && contextMenu.message.sender._id === mongoUserId && (
                                <ContextMenuItem onClick={() => startEditing(contextMenu.message)}>
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
                                    Edit Message
                                </ContextMenuItem>
                            )}
                            {!isAudioUrl(contextMenu.message.content) && (
                                <ContextMenuItem onClick={() => {
                                    navigator.clipboard.writeText(contextMenu.message.content);
                                    setContextMenu({ ...contextMenu, visible: false });
                                }}>
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg>
                                    Copy Text
                                </ContextMenuItem>
                            )}
                            <ContextMenuItem onClick={() => {
                                setForwardMessageData(contextMenu.message);
                                setContextMenu({ ...contextMenu, visible: false });
                            }}>
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 4l-1.41 1.41L15.17 10H4v2h11.17l-4.58 4.59L12 18l7-7z"></path></svg>
                                Forward Message
                            </ContextMenuItem>
                            {contextMenu.message.sender._id === mongoUserId && (
                                <ContextMenuItem onClick={() => deleteMessage(contextMenu.message._id)} style={{ color: '#ef4444' }}>
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                                    Delete Message
                                </ContextMenuItem>
                            )}
                        </>
                    )}
                    {contextMenu.callLog && (
                        <>
                            <ContextMenuItem onClick={() => openConversationWith(contextMenu.callLog.contactId)}>
                                <MessageSquare size={14} />
                                Message
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => openConversationWith(contextMenu.callLog.contactId, 'audio')}>
                                <Phone size={14} />
                                Voice Call
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => openConversationWith(contextMenu.callLog.contactId, 'video')}>
                                <Video size={14} />
                                Video Call
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => deleteCallLog(contextMenu.callLog.id)} style={{ color: '#ef4444' }}>
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                                Delete Call Log
                            </ContextMenuItem>
                        </>
                    )}
                </ContextMenuContainer>
            )}

            {/* Logout Confirmation Modal */}
            {isLogoutModalOpen && (
                <ModalOverlay onClick={() => setIsLogoutModalOpen(false)} style={{ zIndex: 9999, backdropFilter: 'blur(8px)', backgroundColor: 'rgba(11, 15, 25, 0.8)' }}>
                    <ModalContent onClick={e => e.stopPropagation()} style={{ 
                        maxWidth: '420px', 
                        padding: '40px 32px', 
                        alignItems: 'center', 
                        gap: '16px',
                        background: 'linear-gradient(180deg, var(--colors-surface) 0%, rgba(17, 24, 39, 0.95) 100%)',
                        border: '1px solid rgba(6, 182, 212, 0.2)',
                        boxShadow: '0 25px 50px -12px rgba(6, 182, 212, 0.25), 0 0 0 1px rgba(6, 182, 212, 0.1)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'var(--colors-accent)', filter: 'blur(100px)', opacity: 0.15, borderRadius: '50%' }} />

                        <div style={{ 
                            width: '80px', height: '80px', borderRadius: '50%', 
                            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0.05) 100%)', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--colors-accent)', 
                            marginBottom: '8px',
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                            boxShadow: '0 0 30px rgba(6, 182, 212, 0.2), inset 0 0 15px rgba(6, 182, 212, 0.1)',
                            position: 'relative', zIndex: 1
                        }}>
                            <img src="/favicon.svg" alt="DevSup Logo" style={{ width: '40px', height: '40px', filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.5))' }} />
                        </div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '500', color: 'var(--colors-textMain)', margin: 0, letterSpacing: '-0.5px', position: 'relative', zIndex: 1 }}>Log out of DevSup?</h2>
                        <p style={{ color: 'var(--colors-textMuted)', fontSize: '1.05rem', textAlign: 'center', margin: '0 0 24px 0', lineHeight: 1.6, position: 'relative', zIndex: 1 }}>
                            See you later!
                        </p>
                        <div style={{ display: 'flex', gap: '16px', width: '100%', position: 'relative', zIndex: 1 }}>
                            <Button 
                                variant="outline" 
                                onClick={() => setIsLogoutModalOpen(false)}
                                style={{ flex: 1, padding: '14px', borderRadius: '12px', fontWeight: '500', fontSize: '1rem', border: '1px solid var(--colors-border)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--colors-textMain)' }}
                            >
                                Cancel
                            </Button>
                            <Button 
                                variant="primary" 
                                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                                style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--colors-accent) 0%, #0891b2 100%)', color: '#fff', border: 'none', fontWeight: '500', fontSize: '1rem', boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)' }}
                            >
                                Log Out
                            </Button>
                        </div>
                    </ModalContent>
                </ModalOverlay>
            )}

        </AppContainer>
    );
}