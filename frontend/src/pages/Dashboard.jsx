import { lazy, Suspense, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { io } from 'socket.io-client';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import hljs from 'highlight.js/lib/core';
import javascriptHighlight from 'highlight.js/lib/languages/javascript';
import typescriptHighlight from 'highlight.js/lib/languages/typescript';
import pythonHighlight from 'highlight.js/lib/languages/python';
import xmlHighlight from 'highlight.js/lib/languages/xml';
import cssHighlight from 'highlight.js/lib/languages/css';
import jsonHighlight from 'highlight.js/lib/languages/json';
import javaHighlight from 'highlight.js/lib/languages/java';
import cppHighlight from 'highlight.js/lib/languages/cpp';
import { styled, keyframes } from '../stitches.config.js';
import { detectEcosystemLink } from '../utils/urlParser.js';
import { getDailyUserColor } from '../utils/colorUtils.js';
const Whiteboard = lazy(() => import('../components/Whiteboard'));
const CallOverlay = lazy(() => import('../components/CallOverlay'));
import { Brush, MessageSquare, LogOut, Code2, Users, Settings, Video, Phone, PhoneOff, PhoneCall, Send, Search, MoreVertical, CircleDot, CircleDashed, Bell, BellOff, Lock, Key, HelpCircle, Monitor, Mic, Square, Play, Pause, Plus, X, ArrowLeft, Image, Star, Clock, ShieldAlert, ShieldCheck, ThumbsDown, Trash2, Briefcase, Link as LinkIcon, UserPlus, Timer, Info, Rocket, CheckSquare, XCircle, Eraser, ChevronRight, Check, CheckCheck, FileText, Maximize2, Camera, Edit3, ExternalLink, RefreshCw, Download, Eye, Share2, Sparkles } from 'lucide-react';
import { AccountPane, PrivacyPane, ChatsPane, NotificationsPane, KeyboardShortcutsPane, HelpPane, ProfilePane } from '../components/SettingsPanes';
import { playNotificationSound } from '../utils/audio.js';
const StoryViewer = lazy(() => import('../components/StoryViewer'));
import { motion } from 'framer-motion';
const StatusUploadModal = lazy(() => import('../components/StatusUploadModal'));
const EventsView = lazy(() => import('../components/EventsView'));
const LiveCodingWorkspace = lazy(() => import('../components/LiveCodingWorkspace'));
import StatusSection from '../components/StatusSection.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import { useNavigate } from 'react-router-dom';
import { normalizeUsername } from '../utils/username.js';
import DevSupLogo from '../components/DevSupLogo.jsx';
import { getAvatarUrl } from '../utils/defaultAvatar.js';
import { applyTheme } from '../utils/theme.js';

const STATUS_LIFETIME_MS = 24 * 60 * 60 * 1000;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

[
    ['javascript', javascript],
    ['typescript', typescript],
    ['python', python],
    ['xml', markup],
    ['html', markup],
    ['css', css],
    ['json', json],
    ['java', java],
    ['cpp', cpp],
].forEach(([name, language]) => SyntaxHighlighter.registerLanguage(name, language));

[
    ['javascript', javascriptHighlight],
    ['typescript', typescriptHighlight],
    ['python', pythonHighlight],
    ['xml', xmlHighlight],
    ['css', cssHighlight],
    ['json', jsonHighlight],
    ['java', javaHighlight],
    ['cpp', cppHighlight],
].forEach(([name, language]) => hljs.registerLanguage(name, language));

// --- Stitches Components ---
const AppContainer = styled('div', {
    display: 'flex',
    flexDirection: 'row',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    overflowX: 'hidden',
    backgroundColor: '$surface',
    '@media (max-width: 768px)': {
        flexDirection: 'column-reverse',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
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
        height: 'calc(60px + env(safe-area-inset-bottom, 0px))',
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: '0 $2 env(safe-area-inset-bottom, 0px) $2',
        borderRight: 'none',
        borderTop: '1px solid $border',
    }
});

const NavRailLogo = styled('div', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    '&:hover': {
        transform: 'scale(1.08)',
    },
    '@media (max-width: 768px)': {
        display: 'none',
    }
});

const NavRailTop = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
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
    gap: '12px',
    paddingBottom: '$2',
    '@media (max-width: 768px)': {
        display: 'none',
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
    borderRadius: '50%',
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



const Sidebar = styled('aside', {
    width: '300px',
    backgroundColor: '$surface',
    borderRight: '1px solid $border',
    display: 'flex',
    flexDirection: 'column',
    padding: 0,
    flexShrink: 0,
    overflowY: 'auto',
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
        flex: 1,
        minHeight: 0,
        padding: 0,
        borderRight: 'none',
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
    },
    variants: {
        desktopOnly: {
            true: {
                '@media (max-width: 768px)': {
                    display: 'none',
                }
            }
        }
    }
});

const SelectionCheck = styled('button', {
    width: '24px',
    height: '24px',
    minWidth: '24px',
    minHeight: '24px',
    padding: 0,
    borderRadius: '$round',
    border: '2px solid #8696a0',
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    color: '#fff',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    cursor: 'pointer',
    transition: 'background-color 0.16s ease, border-color 0.16s ease, transform 0.16s ease',
    '&:hover': {
        borderColor: '#00a884',
        transform: 'scale(1.06)',
    },
    '&:focus-visible': {
        outline: '2px solid #00a884',
        outlineOffset: '2px',
    },
    variants: {
        selected: {
            true: {
                backgroundColor: '#00a884',
                borderColor: '#00a884',
            },
        },
    },
});

const SelectionToolbar = styled('div', {
    padding: '12px 24px',
    minHeight: '64px',
    backgroundColor: 'var(--colors-surface)',
    borderTop: '1px solid var(--colors-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    '@media (max-width: 480px)': {
        padding: '10px 16px',
    },
});

const SelectionToolbarCount = styled('span', {
    color: 'var(--colors-textMain)',
    fontSize: '1.05rem',
    fontWeight: '500',
    whiteSpace: 'nowrap',
});

const SelectionToolbarActions = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
});

const MobileOnlyText = styled('span', {
    display: 'none',
    '@media (max-width: 768px)': {
        display: 'inline',
    }
});

const DesktopOnlyText = styled('span', {
    display: 'inline',
    '@media (max-width: 768px)': {
        display: 'none',
    }
});

const MobileOnlyOverlay = styled('div', {
    display: 'none',
    '@media (max-width: 768px)': {
        display: 'block',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1999,
        backdropFilter: 'blur(2px)',
    }
});

const ChannelItem = styled('div', {
    padding: '8px 16px',
    borderRadius: 0,
    color: '$textMuted',
    cursor: 'pointer',
    marginBottom: 0,
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
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
    minHeight: 0,
    '@media (max-width: 768px)': {
        width: '100%',
    }
});

const ChatHeader = styled('div', {
    padding: '$3 $4',
    borderBottom: '1px solid $border',
    color: '$textMain',
    fontWeight: 'bold',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    backgroundColor: '$bg',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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

const toastEnter = keyframes({
    from: { opacity: 0, transform: 'translate(-50%, 8px) scale(0.98)' },
    to: { opacity: 1, transform: 'translate(-50%, 0) scale(1)' },
});

const ToastNotification = styled('div', {
    position: 'fixed',
    left: '50%',
    bottom: '24px',
    transform: 'translateX(-50%)',
    maxWidth: 'calc(100vw - 32px)',
    boxSizing: 'border-box',
    backgroundColor: 'rgba(25, 34, 40, 0.95)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    color: '#f1f5f6',
    padding: '8px 16px',
    borderRadius: '20px',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85rem',
    lineHeight: 1.3,
    fontWeight: '400',
    textAlign: 'center',
    animation: `${toastEnter} 0.18s ease-out`,
    '@media (max-width: 768px)': {
        bottom: 'calc(68px + env(safe-area-inset-bottom, 0px))',
        padding: '6px 12px',
        fontSize: '0.8rem',
    },
});

const slideInRight = keyframes({
    from: { transform: 'translateX(120%)', opacity: 0 },
    to: { transform: 'translateX(0)', opacity: 1 },
});

const IncomingMessageNotification = styled('section', {
    position: 'fixed',
    top: '24px',
    right: '24px',
    width: 'min(380px, calc(100vw - 32px))',
    boxSizing: 'border-box',
    padding: '16px',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(32, 44, 51, 0.95)', // WhatsApp dark theme native color
    backdropFilter: 'blur(12px)',
    boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.3)',
    color: '#e9edef',
    zIndex: 10001,
    animation: `${slideInRight} 0.4s cubic-bezier(0.16, 1, 0.3, 1)`,
    '@media (max-width: 768px)': {
        top: '16px',
        right: '16px',
        borderRadius: '12px',
    }
});

const MessageList = styled('div', {
    flex: 1,
    minHeight: 0,
    padding: '$4',
    overflowY: 'auto',
    color: '$textMuted',
    position: 'relative',
    backgroundColor: 'var(--wallpaper-bg-color, #0b141a)',
    backgroundImage: `
        linear-gradient(rgba(11, 20, 26, calc(0.48 + var(--wallpaper-darken, 0) * 0.45)), rgba(11, 20, 26, calc(0.48 + var(--wallpaper-darken, 0) * 0.45))),
        var(--wallpaper-url, url("/chat-bg.jpg"))
    `,
    backgroundSize: '100% 100%, var(--wallpaper-size, 380px)',
    backgroundRepeat: 'no-repeat, repeat',
    backgroundBlendMode: 'normal, luminosity',
    backgroundAttachment: 'fixed, scroll',
    '@media (max-width: 576px)': {
        padding: '6px 4px',
    },
});

const ChatBubbleWrapper = styled('div', {
    display: 'flex',
    width: '100%',
    marginBottom: '4px',
    variants: {
        isOwn: {
            true: { justifyContent: 'flex-end' },
            false: { justifyContent: 'flex-start' }
        }
    }
});

const ChatBubble = styled('div', {
    maxWidth: '65%',
    minWidth: '70px',
    padding: '8px 12px 10px 12px',
    borderRadius: '12px',
    position: 'relative',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    fontSize: '0.93rem',
    lineHeight: '1.4',
    wordBreak: 'break-word',
    '@media (max-width: 992px)': {
        maxWidth: '75%',
    },
    '@media (max-width: 576px)': {
        maxWidth: '82%',
        padding: '4px 8px 8px 8px',
        fontSize: '0.86rem',
        borderRadius: '8px',
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
        },
        embedOnly: {
            true: {
                padding: '0px 0px 20px 0px',
                overflow: 'hidden',
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
    right: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    '@media (max-width: 576px)': {
        fontSize: '0.62rem',
        bottom: '2px',
        right: '6px',
    },
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(24px) saturate(1.2)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.7)',
    zIndex: 2000,
    minWidth: '220px',
    overflow: 'hidden',
    padding: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
});

const ContextMenuItem = styled('div', {
    padding: '12px 16px',
    cursor: 'pointer',
    color: '$textMain',
    fontSize: '0.95rem',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderRadius: '10px',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
        backgroundColor: 'rgba(6, 182, 212, 0.15)',
        color: '$accent',
    },
    '@media (max-width: 768px)': {
        padding: '16px',
        fontSize: '1.1rem',
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

const Label = styled('label', {
    color: '$textMuted',
    fontSize: '0.85rem',
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

// --- Input Area Components ---
const InputArea = styled('form', {
    padding: '12px 16px',
    backgroundColor: '$surface',
    borderTop: '1px solid $border',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '$2',
    '@media (max-width: 768px)': {
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
    }
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
    maxWidth: 'min(100%, 400px)',
    maxHeight: '450px',
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
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    borderBottom: '0.5px solid $border',
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

// Helper to parse WhatsApp-style status replies (both structured and legacy formats)
export const parseStatusReply = (content) => {
    if (!content || typeof content !== 'string') return null;

    // Structured format: $STATUS_REPLY$|{JSON}|replyText
    if (content.startsWith('$STATUS_REPLY$|')) {
        const firstPipe = content.indexOf('|');
        const secondPipe = content.indexOf('|', firstPipe + 1);
        if (secondPipe !== -1) {
            try {
                const metaJson = content.slice(firstPipe + 1, secondPipe);
                const replyText = content.slice(secondPipe + 1);
                const meta = JSON.parse(metaJson);
                return {
                    statusId: meta.statusId,
                    type: meta.type || 'image',
                    thumbnail: meta.type !== 'text' ? (meta.content || meta.thumbnail) : null,
                    text: meta.caption || (meta.type === 'text' ? meta.content : (meta.type === 'video' ? 'Video status' : 'Photo status')),
                    backgroundColor: meta.backgroundColor || '#1E2B3C',
                    uploaderName: meta.uploaderName || 'Status',
                    replyText: replyText.trim() || 'Status reply'
                };
            } catch (e) {
                const replyText = content.slice(secondPipe + 1);
                return {
                    type: 'image',
                    thumbnail: null,
                    text: 'Status',
                    uploaderName: 'Status',
                    replyText: replyText.trim() || 'Status reply'
                };
            }
        } else {
            return {
                type: 'image',
                thumbnail: null,
                text: 'Status',
                uploaderName: 'Status',
                replyText: 'Status reply'
            };
        }
    }

    // Legacy format: "[Status: Photo: Thanks for coming.]\n❤️"
    if (content.startsWith('[Status:') || content.startsWith('[Status :')) {
        const lines = content.split('\n');
        const headerLine = lines[0];
        const replyText = lines.slice(1).join('\n').trim();
        const headerMatch = headerLine.match(/^\[Status\s*:\s*(?:(Photo|Video|Text)\s*:\s*)?(.*?)\]/i);
        if (headerMatch) {
            const rawType = (headerMatch[1] || 'photo').toLowerCase();
            const desc = headerMatch[2]?.trim() || '';
            return {
                type: rawType === 'video' ? 'video' : rawType === 'text' ? 'text' : 'image',
                thumbnail: null,
                text: desc || (rawType === 'video' ? 'Video status' : rawType === 'text' ? 'Text status' : 'Photo status'),
                uploaderName: 'Status',
                replyText: replyText
            };
        }
    }

    return null;
};

// --- Custom Audio Player Component (WhatsApp Voice Note Style) ---
const WAVEFORM_BAR_HEIGHTS = [
    6, 10, 16, 22, 14, 8, 18, 24, 20, 12,
    16, 26, 22, 10, 14, 20, 18, 8, 12, 24,
    26, 16, 10, 18, 22, 14, 8, 12, 16, 10
];

const CustomAudioPlayer = ({ src, isOwnMessage, avatarUrl, time, statusTicks }) => {
    const audioRef = useRef(null);
    const waveformRef = useRef(null);
    const animFrameRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(() => {
        if (typeof src === 'string') {
            const match = src.match(/[?&#]duration=([\d.]+)/);
            if (match && parseFloat(match[1]) > 0) return parseFloat(match[1]);
        }
        return 0;
    });

    // Detect and resolve real duration (fixes Chrome MediaRecorder WebM duration Infinity bug)
    useEffect(() => {
        if (!src) return;

        const match = src.match(/[?&#]duration=([\d.]+)/);
        if (match && parseFloat(match[1]) > 0) {
            setDuration(parseFloat(match[1]));
            return;
        }

        let isCancelled = false;
        const tempAudio = new Audio();
        tempAudio.preload = 'metadata';
        tempAudio.src = src;

        const handleTempLoaded = () => {
            if (isCancelled) return;
            if (tempAudio.duration && isFinite(tempAudio.duration) && tempAudio.duration > 0) {
                setDuration(tempAudio.duration);
            } else {
                // Seek to a large timestamp to force browser to calculate true duration
                const onSeeked = () => {
                    if (isCancelled) return;
                    const calculated = tempAudio.duration && isFinite(tempAudio.duration) && tempAudio.duration > 0
                        ? tempAudio.duration
                        : tempAudio.currentTime;
                    if (calculated && isFinite(calculated) && calculated > 0) {
                        setDuration(calculated);
                    }
                    tempAudio.src = '';
                };
                tempAudio.addEventListener('seeked', onSeeked, { once: true });
                try {
                    tempAudio.currentTime = 1e10;
                } catch (e) {
                    // Ignore seek errors on some browsers
                }
            }
        };

        tempAudio.addEventListener('loadedmetadata', handleTempLoaded, { once: true });
        return () => {
            isCancelled = true;
            tempAudio.src = '';
        };
    }, [src]);

    // Smooth continuous slider movement at 60fps during playback
    useEffect(() => {
        if (!isPlaying) {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            return;
        }

        const tick = () => {
            const audio = audioRef.current;
            if (audio) {
                const cur = audio.currentTime || 0;
                setCurrentTime(cur);

                let dur = duration;
                if ((!dur || !isFinite(dur) || dur <= 0) && audio.duration && isFinite(audio.duration) && audio.duration > 0) {
                    dur = audio.duration;
                    setDuration(dur);
                }

                if (dur && isFinite(dur) && dur > 0) {
                    const pct = Math.min(100, Math.max(0, (cur / dur) * 100));
                    setProgress(pct);
                } else if (cur > 0) {
                    // Fallback while duration resolves: ensure slider moves forward smoothly
                    const estimatedDur = Math.max(10, cur * 1.25);
                    setProgress(Math.min(95, (cur / estimatedDur) * 100));
                }
            }
            animFrameRef.current = requestAnimationFrame(tick);
        };

        animFrameRef.current = requestAnimationFrame(tick);
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [isPlaying, duration]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            if (audioRef.current.ended || (duration > 0 && audioRef.current.currentTime >= duration)) {
                audioRef.current.currentTime = 0;
                setProgress(0);
                setCurrentTime(0);
            }
            audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(() => {
                setIsPlaying(false);
            });
        }
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const current = audioRef.current.currentTime || 0;
        setCurrentTime(current);
        const dur = (duration > 0 && isFinite(duration)) ? duration : (audioRef.current.duration > 0 && isFinite(audioRef.current.duration)) ? audioRef.current.duration : 0;
        if (dur > 0) {
            setProgress(Math.min(100, Math.max(0, (current / dur) * 100)));
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current && audioRef.current.duration && isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
            setDuration(audioRef.current.duration);
        }
    };

    const seekToPosition = (clientX) => {
        if (!waveformRef.current || !audioRef.current) return;
        const rect = waveformRef.current.getBoundingClientRect();
        const clickX = clientX - rect.left;
        const pct = Math.max(0, Math.min(1, clickX / rect.width));
        const dur = (duration > 0 && isFinite(duration)) ? duration : (audioRef.current.duration > 0 && isFinite(audioRef.current.duration)) ? audioRef.current.duration : 0;
        if (dur > 0) {
            const newTime = pct * dur;
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
            setProgress(pct * 100);
        }
    };

    const handlePointerDown = (e) => {
        seekToPosition(e.clientX);
        const onPointerMove = (moveEvent) => {
            seekToPosition(moveEvent.clientX);
        };
        const onPointerUp = () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    };

    const formatTime = (time) => {
        if (isNaN(time) || !isFinite(time) || time <= 0) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '2px 0',
            width: '260px',
            maxWidth: '100%',
            color: 'inherit',
            userSelect: 'none'
        }}>
            {/* Play/Pause Button */}
            <button
                type="button"
                onClick={togglePlay}
                style={{
                    background: 'none',
                    border: 'none',
                    color: isOwnMessage ? '#ffffff' : '#e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px',
                    flexShrink: 0,
                    outline: 'none',
                    transition: 'transform 0.1s ease'
                }}
                aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
            >
                {isPlaying ? (
                    <Pause size={24} fill="currentColor" strokeWidth={0} />
                ) : (
                    <Play size={24} fill="currentColor" strokeWidth={0} />
                )}
            </button>

            {/* Middle: Waveform + Timings */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {/* Waveform Bar Track with Scrubber Head */}
                <div
                    ref={waveformRef}
                    onPointerDown={handlePointerDown}
                    style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '2px',
                        height: '26px',
                        cursor: 'pointer',
                        touchAction: 'none'
                    }}
                >
                    {WAVEFORM_BAR_HEIGHTS.map((height, i) => {
                        const barPct = (i / WAVEFORM_BAR_HEIGHTS.length) * 100;
                        const isPlayed = barPct <= progress;
                        return (
                            <div
                                key={i}
                                style={{
                                    flex: 1,
                                    height: `${height}px`,
                                    borderRadius: '2px',
                                    backgroundColor: isPlayed ? '#06b6d4' : 'rgba(255, 255, 255, 0.28)',
                                    pointerEvents: 'none',
                                    transition: 'background-color 0.1s ease'
                                }}
                            />
                        );
                    })}

                    {/* Scrubber Circle Dot */}
                    <div
                        style={{
                            position: 'absolute',
                            left: `${Math.max(0, Math.min(100, progress))}%`,
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: '#06b6d4',
                            boxShadow: '0 0 6px rgba(6, 182, 212, 0.8)',
                            pointerEvents: 'none',
                            zIndex: 2,
                            transition: isPlaying ? 'left 0.08s linear' : 'none'
                        }}
                    />
                </div>

                {/* Duration on Left, Timestamp + ticks on Right */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.68rem',
                    lineHeight: 1
                }}>
                    <span style={{ color: isOwnMessage ? '#06b6d4' : 'rgba(255, 255, 255, 0.7)', fontWeight: '500' }}>
                        {formatTime(isPlaying ? currentTime : (duration || 0))}
                    </span>
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        whiteSpace: 'nowrap'
                    }}>
                        <span>{time}</span>
                        {statusTicks}
                    </span>
                </div>
            </div>

            {/* Avatar on Right with Microphone badge overlapping bottom-left */}
            <div style={{ position: 'relative', flexShrink: 0, width: '40px', height: '40px', marginLeft: '2px' }}>
                <img
                    src={avatarUrl || '/default-avatar.svg'}
                    onError={(e) => { e.currentTarget.src = '/default-avatar.svg'; }}
                    alt="Voice message sender"
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        display: 'block'
                    }}
                />
                <div style={{
                    position: 'absolute',
                    bottom: '-2px',
                    left: '-4px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: '#111b21',
                    border: '1.5px solid rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#06b6d4',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                }}>
                    <Mic size={10} fill="currentColor" />
                </div>
            </div>

            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
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

const ContactMenuItem = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    padding: '16px 24px',
    cursor: 'pointer',
    backgroundColor: '$surface',
    transition: 'background-color 0.2s',
    '&:hover': {
        backgroundColor: '$bg',
    }
});

const SubPaneHeader = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    backgroundColor: '$bg',
    color: '$textMain',
    fontWeight: '500',
    fontSize: '1.1rem',
    cursor: 'pointer',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    borderBottom: '1px solid $border'
});

hljs.configure({ languages: ['javascript', 'typescript', 'python', 'xml', 'css', 'json', 'java', 'cpp'] });

// Helper for readable message timestamps
const formatMessageTime = (dateString, isMessageList = false) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const today = new Date();
    
    // Normalize to start of day for accurate day differences
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffTime = startOfToday.getTime() - startOfDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
    
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (diffDays === 0) {
        return timeString; // Today
    } else if (diffDays === 1) {
        return isMessageList ? `Yesterday, ${timeString}` : 'Yesterday';
    } else if (diffDays > 1 && diffDays < 7) {
        // Within the last week
        const dayNameLong = date.toLocaleDateString([], { weekday: 'long' });
        const dayNameShort = date.toLocaleDateString([], { weekday: 'short' });
        return isMessageList ? `${dayNameShort}, ${timeString}` : dayNameLong;
    } else {
        // Older than a week
        const formattedDate = date.toLocaleDateString([], { 
            month: 'numeric', 
            day: 'numeric', 
            year: date.getFullYear() !== today.getFullYear() ? '2-digit' : undefined 
        });
        return isMessageList ? `${formattedDate}, ${timeString}` : formattedDate;
    }
};

const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';

    return date.toLocaleDateString([], {
        month: 'long',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
};

const formatMessageClock = (dateString) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const formatCallTimestamp = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) return '';
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (isToday) return `Today, ${timeStr}`;
    if (isYesterday) return `Yesterday, ${timeStr}`;
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`;
};

const compareMessages = (a, b) => {
    // Pending messages always go last (optimistic UI)
    if (Boolean(a.pending) !== Boolean(b.pending)) return a.pending ? 1 : -1;

    const aHasSequence = Number.isFinite(a.sequence);
    const bHasSequence = Number.isFinite(b.sequence);

    // Both have a DB sequence — most reliable ordering
    if (aHasSequence && bHasSequence) return a.sequence - b.sequence;

    // One or neither has a sequence (e.g. messages saved before sequence field was added):
    // fall back to createdAt so old messages stay before new ones
    const createdAtDifference = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (createdAtDifference !== 0) return createdAtDifference;
    return String(a._id || '').localeCompare(String(b._id || ''));
};

// --- Main Dashboard Component ---
export default function Dashboard() {
    const { user, logout, getAccessTokenSilently } = useAuth();
    const navigate = useNavigate();

    const [mongoUserId, setMongoUserId] = useState(null);
    const [currentUserData, setCurrentUserData] = useState(null);
    const [socket, setSocket] = useState(null);
    const [activeUsers, setActiveUsers] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [chatSearchQuery, setChatSearchQuery] = useState('');
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [showMessageDateLabel, setShowMessageDateLabel] = useState(false);

    // Status State
    const [statuses, setStatuses] = useState([]);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [storyViewerInitialUserIndex, setStoryViewerInitialUserIndex] = useState(null);
    const [statusClock, setStatusClock] = useState(Date.now);

    useEffect(() => {
        const refreshStatusClock = () => setStatusClock(Date.now());
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') refreshStatusClock();
        };
        const intervalId = window.setInterval(refreshStatusClock, 15 * 1000);
        window.addEventListener('focus', refreshStatusClock);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener('focus', refreshStatusClock);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const groupedStatuses = useMemo(() => {
        if (!Array.isArray(statuses)) return [];
        return Object.values(statuses
            .filter(status => status && status.uploader && (statusClock - new Date(status.createdAt).getTime() < STATUS_LIFETIME_MS))
            .reduce((groups, status) => {
                const uploaderId = String(status.uploader?._id || status.uploader || '');
                if (!uploaderId) return groups;
                if (!groups[uploaderId]) groups[uploaderId] = { user: status.uploader, statuses: [] };
                groups[uploaderId].statuses.push(status);
                return groups;
            }, {}));
    }, [statuses, statusClock]);

    const myGroupedStatuses = groupedStatuses.find(g => String(g.user?._id || g.user) === String(mongoUserId));
    const otherGroupedStatuses = groupedStatuses.filter(g => String(g.user?._id || g.user) !== String(mongoUserId));

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
            if (!res.ok) throw new Error('Status upload failed');
            const newStatus = await res.json();

            // Refresh statuses list with populated uploader
            const refreshRes = await fetch(`${BACKEND_URL}/api/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (refreshRes.ok) {
                const refreshed = await refreshRes.json();
                if (Array.isArray(refreshed)) {
                    setStatuses(refreshed);
                    showToast('Status posted');
                    return;
                }
            }
            setStatuses(prev => [...(Array.isArray(prev) ? prev : []), newStatus]);
            showToast('Status posted');
        } catch (error) {
            console.error("Error uploading status:", error);
            showToast('Failed to post status');
        }
    };

    const handleMarkStatusViewed = async (statusId) => {
        try {
            const token = await getAccessTokenSilently();
            await fetch(`${BACKEND_URL}/api/status/${statusId}/view`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setStatuses(prev => prev.map(s => s._id === statusId ? { ...s, viewers: [...(s.viewers || []), mongoUserId] } : s));
        } catch (error) {
            console.error("Error marking status viewed:", error);
        }
    };

    const handleDeleteStatus = async (statusId) => {
        try {
            const token = await getAccessTokenSilently();
            const response = await fetch(`${BACKEND_URL}/api/status/${statusId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`Status deletion failed (${response.status})`);

            setStatuses(previous => previous.filter(status => status._id !== statusId));
            const refreshResponse = await fetch(`${BACKEND_URL}/api/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!refreshResponse.ok) throw new Error(`Status refresh failed (${refreshResponse.status})`);
            const refreshedStatuses = await refreshResponse.json();
            if (!Array.isArray(refreshedStatuses)) throw new Error('Status refresh returned invalid data');
            setStatuses(refreshedStatuses);
            return true;
        } catch (error) {
            console.error("Error deleting status:", error);
            showToast('Could not delete or refresh status');
            return false;
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

    const handleReplyStatus = async (targetUser, replyText, status) => {
        if (!targetUser || !replyText?.trim() || !mongoUserId) return;
        const targetId = String(targetUser._id || targetUser);

        const statusMeta = {
            statusId: status._id,
            type: status.type || 'image',
            content: status.content || '',
            caption: status.caption || '',
            backgroundColor: status.backgroundColor || '#1E2B3C',
            uploaderName: targetUser.displayName || targetUser.name || 'Status'
        };
        const formattedContent = `$STATUS_REPLY$|${JSON.stringify(statusMeta)}|${replyText.trim()}`;

        try {
            let convId = null;
            const existing = conversations.find(c =>
                c.type === 'direct' &&
                c.participants &&
                c.participants.some(p => String(p._id || p) === targetId)
            );
            if (existing) {
                convId = existing._id;
            } else {
                const token = await getAccessTokenSilently();
                const res = await fetch(`${BACKEND_URL}/api/conversations`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        type: 'direct',
                        participantIds: [mongoUserId, targetId]
                    })
                });
                if (res.ok) {
                    const newConv = await res.json();
                    convId = newConv._id;
                    setConversations(prev => [newConv, ...prev]);
                }
            }

            if (convId) {
                sendMessage({
                    conversationId: convId,
                    senderId: mongoUserId,
                    content: formattedContent
                });
                showToast('Reply sent');
            }
        } catch (err) {
            console.error('Failed to reply to status:', err);
            showToast('Failed to send reply');
        }
    };

    // New 3-Pane Layout Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
    const [isChatsMenuOpen, setIsChatsMenuOpen] = useState(false);
    const [activeContactPane, setActiveContactPane] = useState(null);
    
    // Premium Context Menu State
    const [premiumModal, setPremiumModal] = useState(null);
    const [mutedConversations, setMutedConversations] = useState([]);
    const [disappearingConversations, setDisappearingConversations] = useState([]);
    const [toastMessage, setToastMessage] = useState(null);
    const [incomingMessageNotification, setIncomingMessageNotification] = useState(null);
    const [notificationReply, setNotificationReply] = useState('');
    const notifiedMessageIdsRef = useRef(new Set());
    const [isSelectingMessages, setIsSelectingMessages] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState([]);
    const [messageSelectionConversationId, setMessageSelectionConversationId] = useState(null);
    const [selectedChats, setSelectedChats] = useState([]);
    const [isChatsSelectionMode, setIsChatsSelectionMode] = useState(false);
    const [selectedCallLogs, setSelectedCallLogs] = useState([]);
    const [isCallLogsSelectionMode, setIsCallLogsSelectionMode] = useState(false);
    const [deleteMessagePrompt, setDeleteMessagePrompt] = useState({
        visible: false,
        conversationId: null,
        messageIds: [],
        allowDeleteForEveryone: false
    });
    const [isDeletingMessages, setIsDeletingMessages] = useState(false);
    const pendingEveryoneDeleteRef = useRef(null);
    const completeDeleteForEveryoneRef = useRef(null);

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const showToast = (msg) => setToastMessage(msg);

    const applyMessagesDeletedForEveryone = useCallback((conversationId, messageIds) => {
        const deletedIds = new Set(messageIds.map(String));
        const normalizedConversationId = String(conversationId);
        setMessages(previous => previous.map(message => {
            if (
                String(message.conversationId) !== normalizedConversationId ||
                !deletedIds.has(String(message._id))
            ) return message;

            return {
                ...message,
                content: '',
                caption: '',
                attachmentName: '',
                attachmentType: '',
                isCodeSnippet: false,
                isEdited: false,
                isDeletedForEveryone: true,
                replyTo: null
            };
        }));
        setConversations(previous => previous.map(conversation => {
            if (
                String(conversation._id) !== normalizedConversationId ||
                !deletedIds.has(String(conversation.lastMessage?._id))
            ) return conversation;

            return {
                ...conversation,
                lastMessage: {
                    ...conversation.lastMessage,
                    content: '',
                    caption: '',
                    attachmentName: '',
                    attachmentType: '',
                    isDeletedForEveryone: true
                }
            };
        }));
    }, []);

    const completeDeleteForEveryone = useCallback((conversationId, messageIds) => {
        applyMessagesDeletedForEveryone(conversationId, messageIds);
        setDeleteMessagePrompt({ visible: false, conversationId: null, messageIds: [], allowDeleteForEveryone: false });
        setIsDeletingMessages(false);
        setIsSelectingMessages(false);
        setSelectedMessages([]);
        setMessageSelectionConversationId(null);

        const pendingDelete = pendingEveryoneDeleteRef.current;
        if (
            pendingDelete &&
            String(pendingDelete.conversationId) === String(conversationId) &&
            messageIds.every(id => pendingDelete.messageIds.includes(String(id)))
        ) {
            pendingDelete.confirmedByBroadcast = true;
        }
    }, [
        applyMessagesDeletedForEveryone,
        setDeleteMessagePrompt,
        setIsDeletingMessages,
        setIsSelectingMessages,
        setSelectedMessages,
        setMessageSelectionConversationId
    ]);

    useEffect(() => {
        completeDeleteForEveryoneRef.current = completeDeleteForEveryone;
    }, [completeDeleteForEveryone]);

    const toggleSelection = (setSelectedItems, itemId) => {
        setSelectedItems(previous => previous.includes(itemId)
            ? previous.filter(id => id !== itemId)
            : [...previous, itemId]);
    };

    // Service Worker message listener for Native OS Notification Replies
    useEffect(() => {
        const handleServiceWorkerMessage = (event) => {
            if (event.data && event.data.type === 'NOTIFICATION_REPLY') {
                const { conversationId, text, messageId } = event.data;
                if (socket && mongoUserId) {
                    const messageData = {
                        sender: mongoUserId,
                        conversationId,
                        content: text,
                        replyTo: messageId
                    };
                    socket.emit('send_message', messageData);
                }
            }
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
        }
        return () => {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
            }
        };
    }, [socket, mongoUserId]);

    const selectMessage = (messageId) => {
        setIsSelectingMessages(true);
        if (messageSelectionConversationId !== activeConversationId) {
            setMessageSelectionConversationId(activeConversationId);
            setSelectedMessages([messageId]);
            return;
        }
        setSelectedMessages(previous => previous.includes(messageId) ? previous : [...previous, messageId]);
    };
    const toggleMessageSelection = (messageId) => {
        if (messageSelectionConversationId !== activeConversationId) {
            selectMessage(messageId);
            return;
        }
        toggleSelection(setSelectedMessages, messageId);
    };

    const selectChat = (conversationId) => {
        setIsChatsSelectionMode(true);
        setSelectedChats(previous => previous.includes(conversationId) ? previous : [...previous, conversationId]);
    };
    const toggleChatSelection = (conversationId) => toggleSelection(setSelectedChats, conversationId);

    const selectCallLog = (callLogId) => {
        setIsCallLogsSelectionMode(true);
        setSelectedCallLogs(previous => previous.includes(callLogId) ? previous : [...previous, callLogId]);
    };
    const toggleCallLogSelection = (callLogId) => toggleSelection(setSelectedCallLogs, callLogId);

    const consumeSuppressedSelectionClick = () => {
        if (!suppressNextSelectionClick.current) return false;
        suppressNextSelectionClick.current = false;
        return true;
    };

    const cancelMessageSelection = () => {
        setIsSelectingMessages(false);
        setSelectedMessages([]);
        setMessageSelectionConversationId(null);
    };
    const cancelChatSelection = () => {
        setIsChatsSelectionMode(false);
        setSelectedChats([]);
    };
    const cancelCallLogSelection = () => {
        setIsCallLogsSelectionMode(false);
        setSelectedCallLogs([]);
    };

    const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(() => {
        return window.innerWidth > 768 && sessionStorage.getItem('isWhiteboardOpen') === 'true';
    });
    const [mobileWhiteboardDesign, setMobileWhiteboardDesign] = useState(null);
    const [isMobileViewport, setIsMobileViewport] = useState(() => window.innerWidth <= 768);
    const [communityTab, setCommunityTab] = useState('chat');
    const [statusUploadMode, setStatusUploadMode] = useState('text');
    const [isLiveCodingOpen, setIsLiveCodingOpen] = useState(false);
    const [isHackathonOpen, setIsHackathonOpen] = useState(false);
    const [mediaViewer, setMediaViewer] = useState(null);
    const [documentViewer, setDocumentViewer] = useState(null);
    const [settingsSearchQuery, setSettingsSearchQuery] = useState('');

    useEffect(() => {
        const handleResize = () => {
            const isMobile = window.innerWidth <= 768;
            setIsMobileViewport(isMobile);
            if (isMobile) {
                setIsWhiteboardOpen(false);
                sessionStorage.removeItem('isWhiteboardOpen');
                setCommunityTab('chat');
                setIsLiveCodingOpen(false);
                setIsHackathonOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (isMobileViewport) {
            sessionStorage.removeItem('isWhiteboardOpen');
        } else {
            sessionStorage.setItem('isWhiteboardOpen', isWhiteboardOpen);
        }
    }, [isWhiteboardOpen, isMobileViewport]);

    useEffect(() => {
        if (!mediaViewer && !documentViewer) return undefined;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setMediaViewer(null);
                setDocumentViewer(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [mediaViewer, documentViewer]);

    useEffect(() => {
        const handleGlobalShortcuts = (e) => {
            const tag = e.target?.tagName?.toLowerCase();
            const isEditing = tag === 'input' || tag === 'textarea' || e.target?.isContentEditable;

            // Ctrl + Alt + , : Open Settings
            if (e.ctrlKey && e.altKey && e.key === ',') {
                e.preventDefault();
                setActiveTab('settings');
                setActiveSettingTab(null);
            }
            // Ctrl + Alt + N : New chat
            else if (e.ctrlKey && e.altKey && (e.key === 'n' || e.key === 'N')) {
                e.preventDefault();
                openCreateModal();
            }
            // Ctrl + Alt + / : Search chats
            else if (e.ctrlKey && e.altKey && e.key === '/') {
                e.preventDefault();
                setActiveTab('chats');
                const searchEl = document.querySelector('input[placeholder*="Search"]');
                if (searchEl) searchEl.focus();
            }
            // Ctrl + Alt + M : Toggle Mute active chat
            else if (e.ctrlKey && e.altKey && (e.key === 'm' || e.key === 'M') && !isEditing) {
                if (activeConversationId) {
                    e.preventDefault();
                    setMutedConversations(prev => 
                        prev.includes(activeConversationId) 
                            ? prev.filter(id => id !== activeConversationId)
                            : [...prev, activeConversationId]
                    );
                    showToast(mutedConversations.includes(activeConversationId) ? 'Chat unmuted' : 'Chat muted');
                }
            }
        };

        window.addEventListener('keydown', handleGlobalShortcuts);
        return () => window.removeEventListener('keydown', handleGlobalShortcuts);
    }, [activeConversationId, mutedConversations]);

    const [activeTab, setActiveTab] = useState('chats'); // 'chats', 'status', 'settings'
    const [activeSettingTab, setActiveSettingTab] = useState(null);
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return undefined;

        const handleServiceWorkerMessage = (event) => {
            if (event.data?.type !== 'OPEN_CONVERSATION' || !event.data.conversationId) return;
            setActiveTab('chats');
            setActiveConversationId(String(event.data.conversationId));
        };

        navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
        return () => navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    }, []);
    
    // Handle mobile back button
    useEffect(() => {
        const handlePopState = () => {
            if (window.innerWidth <= 768) {
                if (mobileWhiteboardDesign) {
                    setMobileWhiteboardDesign(null);
                } else if (isDrawerOpen) {
                    setIsDrawerOpen(false);
                } else if (isStatusModalOpen) {
                    setIsStatusModalOpen(false);
                } else if (storyViewerInitialUserIndex !== null) {
                    setStoryViewerInitialUserIndex(null);
                } else if (activeConversationId !== null) {
                    setActiveConversationId(null);
                }
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isDrawerOpen, isStatusModalOpen, storyViewerInitialUserIndex, activeConversationId, mobileWhiteboardDesign]);

    // Push state for mobile when opening views
    useEffect(() => {
        if (window.innerWidth <= 768) {
            if (activeConversationId !== null || storyViewerInitialUserIndex !== null || isStatusModalOpen || mobileWhiteboardDesign) {
                window.history.pushState({ opened: true }, '');
            }
        }
    }, [activeConversationId, storyViewerInitialUserIndex, isStatusModalOpen, mobileWhiteboardDesign]);

    // Call and Search State
    const [callConfig, setCallConfig] = useState({ active: false, isReceiving: false, callerData: null, callType: 'video' });
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [callLogs, setCallLogs] = useState([]);
    const [selectedCallLogId, setSelectedCallLogId] = useState(null);
    const [isNewCallModalOpen, setIsNewCallModalOpen] = useState(false);
    const [newCallSearchQuery, setNewCallSearchQuery] = useState('');
    const [quickCallMessage, setQuickCallMessage] = useState('');

    // App Settings State
    const [appSettings, setAppSettings] = useState(() => {
        const defaults = {
            securityNotifications: false,
            lastSeen: 'everyone',
            profilePhoto: 'everyone',
            readReceipts: true,
            theme: 'system',
            enterIsSend: true,
            messageAlerts: true,
            showPreviews: true,
            sounds: true,
            richIntegrations: true
        };
        const saved = localStorage.getItem('appSettings');
        return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    });

    useEffect(() => {
        localStorage.setItem('appSettings', JSON.stringify(appSettings));
        applyTheme(appSettings.theme);
    }, [appSettings]);

    const activeConversationIdRef = useRef(activeConversationId);
    const appSettingsRef = useRef(appSettings);
    const mutedConversationsRef = useRef(mutedConversations);

    useEffect(() => {
        activeConversationIdRef.current = activeConversationId;
        appSettingsRef.current = appSettings;
        mutedConversationsRef.current = mutedConversations;
    }, [activeConversationId, appSettings, mutedConversations]);

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
                return null;
            } else {
                const errData = await res.json().catch(() => ({}));
                return { error: errData.message || 'Failed to update profile' };
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            return { error: 'Network error. Please try again.' };
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
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);
    const [addMembersSearchQuery, setAddMembersSearchQuery] = useState('');
    const [selectedMembersToAdd, setSelectedMembersToAdd] = useState([]);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [userSearchResults, setUserSearchResults] = useState([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const userSearchTimerRef = useRef(null);
    const [forwardMessageData, setForwardMessageData] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [convType, setConvType] = useState('direct');
    const [convName, setConvName] = useState('');
    const [convDescription, setConvDescription] = useState('');
    const [convAvatarUrl, setConvAvatarUrl] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const availableContacts = useMemo(() => {
        const list = [];
        const seen = new Set();
        (conversations || []).forEach(c => {
            if (!c.isGroup && c.participants) {
                c.participants.forEach(p => {
                    const pId = String(p._id || p);
                    if (pId && pId !== String(mongoUserId) && !seen.has(pId)) {
                        seen.add(pId);
                        list.push(p);
                    }
                });
            }
        });
        (allUsers || []).forEach(u => {
            const uId = String(u._id || u);
            if (uId && uId !== String(mongoUserId) && !seen.has(uId)) {
                seen.add(uId);
                list.push(u);
            }
        });
        return list;
    }, [conversations, allUsers, mongoUserId]);

    const conversationsRef = useRef(conversations);
    const availableContactsRef = useRef(availableContacts);
    const allUsersRef = useRef(allUsers);

    useEffect(() => {
        conversationsRef.current = conversations;
        availableContactsRef.current = availableContacts;
        allUsersRef.current = allUsers;
    }, [conversations, availableContacts, allUsers]);

    const formatCallLog = useCallback((log, currentUserId) => {
        const myId = String(currentUserId || mongoUserId || '');
        const isCaller = String(log.caller?._id || log.caller) === myId;
        const isGroup = log.conversation?.type === 'group';
        let contact = isGroup ? log.conversation : (isCaller ? log.receiver : log.caller);

        let contactId = contact?._id || (typeof contact === 'string' ? contact : null);
        let contactName = isGroup
            ? (contact?.name || log.conversation?.name)
            : (contact?.displayName || contact?.name || contact?.username);
        let contactAvatar = contact?.avatarUrl || (isGroup ? log.conversation?.avatarUrl : null);

        // Fallback 1: Resolve from conversation if contact or name is missing
        if (!contactName || !contactId) {
            const allConvs = conversationsRef.current || conversations || [];
            const convId = log.conversation?._id || (typeof log.conversation === 'string' ? log.conversation : null);
            const conv = (log.conversation && typeof log.conversation === 'object' && log.conversation.participants)
                ? log.conversation
                : allConvs.find(c => String(c._id) === String(convId));

            if (conv) {
                if (conv.type === 'group') {
                    contactName = contactName || conv.name || 'Group Call';
                    contactAvatar = contactAvatar || conv.avatarUrl;
                    contactId = contactId || conv._id;
                } else if (Array.isArray(conv.participants)) {
                    const otherPart = conv.participants.find(p => String(p?._id || p) !== myId);
                    if (otherPart) {
                        contactId = contactId || (typeof otherPart === 'object' ? otherPart._id : otherPart);
                        if (typeof otherPart === 'object' && (otherPart.displayName || otherPart.username)) {
                            contactName = contactName || otherPart.displayName || otherPart.username;
                            contactAvatar = contactAvatar || otherPart.avatarUrl;
                        }
                    }
                }
            }
        }

        // Fallback 2: Look up contactId in available contacts or allUsers
        if (!contactName && contactId) {
            const pool = [...(availableContactsRef.current || availableContacts || []), ...(allUsersRef.current || allUsers || [])];
            const foundUser = pool.find(u => String(u._id || u) === String(contactId));
            if (foundUser && typeof foundUser === 'object') {
                contactName = foundUser.displayName || foundUser.username;
                contactAvatar = contactAvatar || foundUser.avatarUrl;
            }
        }

        // Fallback 3: If still no name but receiver/caller is populated
        if (!contactName) {
            const otherSide = isCaller ? log.receiver : log.caller;
            if (otherSide && typeof otherSide === 'object') {
                contactName = otherSide.displayName || otherSide.name || otherSide.username;
                contactAvatar = contactAvatar || otherSide.avatarUrl;
                contactId = contactId || otherSide._id;
            }
        }

        // Clean default if absolutely nothing could be resolved
        if (!contactName) {
            contactName = isGroup ? 'Group Call' : 'Contact';
        }

        return {
            id: log._id,
            contactId: contactId ? String(contactId) : null,
            contactName,
            contactAvatar: contactAvatar || '/default-avatar.svg',
            type: log.type,
            direction: isCaller ? 'outgoing' : 'incoming',
            status: log.status,
            timestamp: new Date(log.createdAt).getTime()
        };
    }, [mongoUserId, conversations, availableContacts, allUsers]);

    // Keep callLogs up-to-date whenever availableContacts or conversations change
    useEffect(() => {
        if (callLogs.length > 0 && (availableContacts?.length > 0 || conversations?.length > 0)) {
            setCallLogs(prev => prev.map(item => {
                if (item.contactName && item.contactName !== 'Unknown' && item.contactName !== 'Contact' && item.contactId) {
                    return item;
                }
                const pool = [...(availableContacts || []), ...(allUsers || [])];
                const matching = pool.find(u => String(u._id || u) === String(item.contactId));
                if (matching && (matching.displayName || matching.username)) {
                    return {
                        ...item,
                        contactName: matching.displayName || matching.username,
                        contactAvatar: matching.avatarUrl || item.contactAvatar
                    };
                }
                return item;
            }));
        }
    }, [availableContacts, conversations, allUsers]);

    // Edit/Delete State
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editInputContent, setEditInputContent] = useState('');
    const [replyingToMessage, setReplyingToMessage] = useState(null);
    const [openingDocId, setOpeningDocId] = useState(null);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null, callLog: null });
    const [connectionError, setConnectionError] = useState(null);

    const inputRef = useRef(null);
    const clientMessageSequenceRef = useRef(0);
    const isSendingMessageRef = useRef(false);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messageListRef = useRef(null);
    const messageDateHideTimerRef = useRef(null);
    const touchHoldTimer = useRef(null);
    const touchStartCoords = useRef({ x: 0, y: 0 });
    const suppressNextSelectionClick = useRef(false);

    const handleMessageListScroll = () => {
        const messageList = messageListRef.current;
        if (!messageList) return;
        
        setShowMessageDateLabel(true);

        if (messageDateHideTimerRef.current) {
            clearTimeout(messageDateHideTimerRef.current);
        }
        messageDateHideTimerRef.current = setTimeout(() => {
            setShowMessageDateLabel(false);
        }, 3000);
    };

    useEffect(() => () => {
        if (messageDateHideTimerRef.current) {
            clearTimeout(messageDateHideTimerRef.current);
        }
    }, []);

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

                // Only redirect to /setup if user does NOT have a username set.
                // Once a username is added, the user can use their dashboard freely, even after refreshing.
                if (!mongoUser.username) {
                    const justSaved = sessionStorage.getItem('profileJustSaved');
                    if (justSaved) {
                        sessionStorage.removeItem('profileJustSaved');
                    } else {
                        navigate('/setup', { replace: true });
                        return;
                    }
                }

                // Parallelize initial critical fetches to load dashboard fast
                const [statusRes, convResponse, callRes] = await Promise.all([
                    fetch(`${BACKEND_URL}/api/status`, { headers: apiHeaders }).catch(e => {
                        console.error('Failed to fetch status:', e);
                        return null;
                    }),
                    fetch(`${BACKEND_URL}/api/conversations`, { headers: apiHeaders }).catch(e => {
                        console.error('Failed to fetch conversations:', e);
                        return null;
                    }),
                    fetch(`${BACKEND_URL}/api/calls`, { headers: apiHeaders }).catch(e => {
                        console.error('Failed to fetch calls:', e);
                        return null;
                    })
                ]);

                if (!isActive) return;

                if (statusRes && statusRes.ok) {
                    try {
                        const fetchedStatuses = await statusRes.json();
                        if (isActive) setStatuses(Array.isArray(fetchedStatuses) ? fetchedStatuses : []);
                    } catch (e) {}
                }

                let initialConversations = [];
                if (convResponse && convResponse.ok) {
                    try {
                        initialConversations = await convResponse.json();
                        if (Array.isArray(initialConversations) && initialConversations.length > 0) {
                            setConversations(initialConversations);
                            if (window.innerWidth > 768 && !activeConversationIdRef.current) {
                                setActiveConversationId(initialConversations[0]._id);
                            }
                        }
                    } catch (e) {}
                }

                // Handle Shared Profile Links (?chatWith=USER_ID)
                const urlParams = new URLSearchParams(window.location.search);
                const notificationConversationId = urlParams.get('conversationId');
                if (initialConversations.some(conversation => String(conversation._id) === notificationConversationId)) {
                    setActiveConversationId(notificationConversationId);
                    urlParams.delete('conversationId');
                    const remainingQuery = urlParams.toString();
                    window.history.replaceState(
                        {},
                        document.title,
                        `${window.location.pathname}${remainingQuery ? `?${remainingQuery}` : ''}`
                    );
                }

                // GitHub OAuth Return Handler
                if (urlParams.get('github_verified') === 'true') {
                    const ghUser = urlParams.get('gh_user');
                    showToast(`GitHub verified successfully! Connected as @${ghUser || 'developer'}`);
                    try {
                        const refreshed = await fetch(`${BACKEND_URL}/api/users/profile`, { headers: apiHeaders });
                        if (refreshed.ok) {
                            const u = await refreshed.json();
                            setCurrentUserData(u);
                        }
                    } catch (e) {
                        console.error('Failed to refresh profile after GitHub auth:', e);
                    }
                    urlParams.delete('github_verified');
                    urlParams.delete('gh_user');
                    const cleanQuery = urlParams.toString();
                    window.history.replaceState({}, document.title, `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ''}`);
                } else if (urlParams.get('github_error')) {
                    showToast('GitHub verification was cancelled or failed.');
                    urlParams.delete('github_error');
                    const cleanQuery = urlParams.toString();
                    window.history.replaceState({}, document.title, `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ''}`);
                }

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

                // Call logs
                if (callRes && callRes.ok) {
                    try {
                        const logs = await callRes.json();
                        if (Array.isArray(logs)) {
                            setCallLogs(logs.map(log => formatCallLog(log, mongoUser._id)));
                        }
                    } catch (e) {
                        console.error('Failed to parse call logs:', e);
                    }
                }

                newSocket = io(BACKEND_URL, {
                    withCredentials: true,
                    transports: ['websocket', 'polling'],
                    reconnection: true,
                    reconnectionAttempts: Infinity,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000,
                    timeout: 20000
                });

                const onConnectOrReconnect = () => {
                    newSocket.emit('user_connected', mongoUser._id);
                    if (activeConversationIdRef.current) {
                        newSocket.emit('join_room', activeConversationIdRef.current);
                    }
                };

                newSocket.on('connect', onConnectOrReconnect);
                newSocket.on('reconnect', onConnectOrReconnect);
                if (newSocket.connected) {
                    onConnectOrReconnect();
                }

                newSocket.on('presence_update', (onlineUserIds) => {
                    setActiveUsers(onlineUserIds);
                });

                newSocket.on('receive_message', (incomingMessage) => {
                    const incomingSenderId = String(incomingMessage.sender?._id || incomingMessage.sender || '');
                    const currentUid = String(mongoUser?._id || mongoUserId || '');
                    const convId = String(incomingMessage.conversationId?._id || incomingMessage.conversationId || '');
                    const currentActiveConvId = String(activeConversationIdRef.current || '');
                    const receiptsEnabled = appSettingsRef.current?.readReceipts !== false;

                    if (incomingSenderId && currentUid && incomingSenderId !== currentUid) {
                        newSocket.emit('mark_messages_delivered', { 
                            conversationId: convId, 
                            userId: currentUid, 
                            messageIds: [incomingMessage._id] 
                        });

                        if (currentActiveConvId && currentActiveConvId === convId && receiptsEnabled) {
                            newSocket.emit('mark_messages_read', {
                                conversationId: convId,
                                userId: currentUid,
                                messageIds: [incomingMessage._id]
                            });
                        }

                        const messageId = String(incomingMessage._id || '');
                        const conversationId = String(incomingMessage.conversationId || '');
                        if (
                            messageId &&
                            !notifiedMessageIdsRef.current.has(messageId) &&
                            !mutedConversationsRef.current.includes(conversationId)
                        ) {
                            if (appSettingsRef.current?.sounds !== false) {
                                playNotificationSound();
                            }

                            if (appSettingsRef.current?.messageAlerts === true) {
                                notifiedMessageIdsRef.current.add(messageId);
                                if (notifiedMessageIdsRef.current.size > 200) {
                                    const oldestMessageId = notifiedMessageIdsRef.current.values().next().value;
                                    notifiedMessageIdsRef.current.delete(oldestMessageId);
                                }
                                const isConversationOpen = String(activeConversationIdRef.current) === conversationId;
                                
                                const nativeNotificationsEnabled = typeof Notification !== 'undefined' && Notification.permission === 'granted';

                                if (!isConversationOpen && !nativeNotificationsEnabled) {
                                    setIncomingMessageNotification(incomingMessage);
                                    setNotificationReply('');
                                }

                                if (
                                    (!isConversationOpen || document.visibilityState !== 'visible') &&
                                    nativeNotificationsEnabled
                                ) {
                                const notificationOptions = {
                                    body: appSettingsRef.current?.showPreviews === false
                                        ? 'You received a message'
                                        : (typeof incomingMessage.content === 'string' && incomingMessage.content.startsWith('$CALL_LOG$'))
                                            ? (() => {
                                                const parts = incomingMessage.content.split('|');
                                                const cType = parts[1] === 'video' ? 'video call' : 'voice call';
                                                return parts[2] === 'missed' ? `Missed ${cType}` : (parts[1] === 'video' ? 'Video call' : 'Voice call');
                                            })()
                                            : incomingMessage.content || 'You sent an attachment',
                                    icon: '/favicon.svg',
                                    tag: `message-${messageId}`,
                                    data: { conversationId },
                                    actions: [
                                        {
                                            action: 'reply',
                                            title: 'Reply',
                                            type: 'text',
                                            placeholder: 'Write a reply...'
                                        }
                                    ]
                                };
                                const title = incomingMessage.sender?.displayName || 'New message';
                                const showNotification = 'serviceWorker' in navigator
                                    ? navigator.serviceWorker.ready.then(registration => registration.showNotification(title, notificationOptions))
                                    : Promise.resolve(new Notification(title, notificationOptions));
                                showNotification.catch(error => console.error('Could not show message notification:', error));
                            }
                        }
                    }
                }

                    setMessages((prev) => {
                        const incomingConvId = String(incomingMessage.conversationId?._id || incomingMessage.conversationId || '');
                        if (String(activeConversationIdRef.current) !== incomingConvId) return prev;

                        // Deduplicate: if server message already exists, update in-place without creating a duplicate
                        const existingServerMsgIndex = prev.findIndex(msg => !msg.pending && String(msg._id) === String(incomingMessage._id));
                        if (existingServerMsgIndex !== -1) {
                            const nextMessages = [...prev];
                            nextMessages[existingServerMsgIndex] = { ...nextMessages[existingServerMsgIndex], ...incomingMessage };
                            return nextMessages;
                        }

                        // Reconcile optimistic pending message
                        // Note: never match whiteboard messages by content — each send must be a new message
                        const pendingIndex = prev.findIndex(msg =>
                            (incomingMessage.clientMessageId && (msg.clientMessageId === incomingMessage.clientMessageId || String(msg._id) === incomingMessage.clientMessageId)) ||
                            (msg.pending && 
                             incomingMessage.attachmentType !== 'whiteboard' &&
                             String(msg.sender?._id || msg.sender) === String(incomingMessage.sender?._id || incomingMessage.sender) && 
                             msg.content === incomingMessage.content)
                        );

                        if (pendingIndex !== -1) {
                            const nextMessages = [...prev];
                            nextMessages[pendingIndex] = incomingMessage;
                            return nextMessages;
                        }

                        return [...prev, incomingMessage];
                    });

                    setConversations((prev) => {
                        const incomingConvId = String(incomingMessage.conversationId?._id || incomingMessage.conversationId || '');
                        const convIndex = prev.findIndex(c => String(c._id) === incomingConvId);
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

                newSocket.on('messages_status_updated', ({ messageIds, status, userId }) => {
                    if (!Array.isArray(messageIds) || messageIds.length === 0) return;
                    const targetIds = new Set(messageIds.map(String));
                    const uid = String(userId);
                    setMessages(prev => prev.map(msg => {
                        if (targetIds.has(String(msg._id)) || (msg.clientMessageId && targetIds.has(String(msg.clientMessageId)))) {
                            const currentDelivered = (msg.deliveredTo || []).map(id => String(id?._id || id));
                            const currentRead = (msg.readBy || []).map(id => String(id?._id || id));
                            if (status === 'delivered') {
                                const deliveredTo = Array.from(new Set([...currentDelivered, uid]));
                                return { ...msg, deliveredTo };
                            } else if (status === 'read') {
                                const readBy = Array.from(new Set([...currentRead, uid]));
                                const deliveredTo = Array.from(new Set([...currentDelivered, uid]));
                                return { ...msg, readBy, deliveredTo };
                            }
                        }
                        return msg;
                    }));
                });

                newSocket.on('messages_deleted_for_everyone', ({ messageIds, conversationId }) => {
                    if (!Array.isArray(messageIds) || !conversationId) return;
                    completeDeleteForEveryoneRef.current?.(conversationId, messageIds);
                });

                newSocket.on('messages_deleted_for_me', (deletedMsgIds) => {
                    const deletedIds = new Set(deletedMsgIds.map(String));
                    setMessages(prev => prev.filter(msg =>
                        !deletedIds.has(String(msg._id)) ||
                        String(msg.conversationId) !== String(activeConversationIdRef.current)
                    ));
                });

                newSocket.on('conversation_deleted', (deletedConvId) => {
                    setConversations(prev => prev.filter(c => c._id !== deletedConvId));
                    setActiveConversationId(prev => prev === deletedConvId ? null : prev);
                });

                newSocket.on('member_left', ({ conversationId, userId }) => {
                    setConversations(prev => prev.map(c => {
                        if (c._id !== conversationId) return c;
                        return {
                            ...c,
                            participants: c.participants.filter(p => (p._id || p) !== userId && (p._id || p).toString() !== userId)
                        };
                    }));
                });

                newSocket.on('call_user', (data) => {
                    // When receiving a call
                    setCallConfig({
                        active: true,
                        isReceiving: true,
                        callerData: data,
                        callType: (data.callType === 'video') ? 'video' : 'audio',
                        conversationId: data.conversationId,
                        targetUserId: data.from,
                        targetUser: {
                            _id: data.from,
                            displayName: data.callerInfo?.name,
                            avatarUrl: data.callerInfo?.avatarUrl
                        }
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
                setConnectionError(`Could not connect to the backend API at ${BACKEND_URL}. Error: ${error.message || String(error)}`);
            }
        };

        initializeIntegration();

        return () => {
            isActive = false;
            if (newSocket) newSocket.disconnect();
        };
    }, [getAccessTokenSilently, user, navigate]);

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
                    if (!Array.isArray(history)) throw new Error('Message history returned invalid data');
                    setMessages(previousMessages => {
                        const currentConversationMessages = previousMessages.filter(message =>
                            String(message.conversationId) === String(activeConversationId)
                        );
                        const mergedMessages = [...history];
                        currentConversationMessages.forEach(message => {
                            const matchingIndex = mergedMessages.findIndex(historyMessage =>
                                String(historyMessage._id) === String(message._id) ||
                                (message.clientMessageId && historyMessage.clientMessageId === message.clientMessageId)
                            );
                            if (matchingIndex === -1) mergedMessages.push(message);
                        });
                        return mergedMessages;
                    });
                } catch (error) {
                    console.error('Failed to fetch messages:', error);
                }
            };

            fetchMessageHistory();
        }
    }, [socket, activeConversationId, getAccessTokenSilently]);

    // Mark messages as read when viewing a chat
    useEffect(() => {
        if (!socket || !activeConversationId || !mongoUserId || appSettings.readReceipts === false) return;
        
        const currentConvId = String(activeConversationId);
        const currentUid = String(mongoUserId);

        // Find messages in the active chat that are NOT from us, and NOT yet read by us
        const unreadMessages = messages.filter(m => 
            String(m.conversationId?._id || m.conversationId) === currentConvId && 
            String(m.sender?._id || m.sender) !== currentUid && 
            !(m.readBy && m.readBy.some(id => String(id?._id || id) === currentUid))
        );

        if (unreadMessages.length > 0) {
            const messageIds = unreadMessages.map(m => m._id);
            socket.emit('mark_messages_read', {
                conversationId: currentConvId,
                userId: currentUid,
                messageIds
            });

            // HTTP fallback to guarantee read receipt persists in DB even if socket reconnected
            getAccessTokenSilently().then(token => {
                fetch(`${BACKEND_URL}/api/messages/${currentConvId}/read`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ messageIds })
                }).catch(() => {});
            }).catch(() => {});

            // Optimistically update local messages to prevent re-triggering this effect
            setMessages(prev => prev.map(msg => {
                if (messageIds.some(id => String(id) === String(msg._id))) {
                    const currentRead = (msg.readBy || []).map(id => String(id?._id || id));
                    const currentDelivered = (msg.deliveredTo || []).map(id => String(id?._id || id));
                    return {
                        ...msg,
                        readBy: Array.from(new Set([...currentRead, currentUid])),
                        deliveredTo: Array.from(new Set([...currentDelivered, currentUid]))
                    };
                }
                return msg;
            }));
        }
    }, [messages, activeConversationId, socket, mongoUserId, appSettings.readReceipts]);

    // 3. Handle Modal and Creating Conversations
    const openCreateModal = async () => {
        setIsModalOpen(true);
        setUserSearchQuery('');
        setUserSearchResults([]);
        setSelectedUsers([]);
        // For communities tab (which is always group type), show friends-only contacts list
        if (activeTab === 'communities') {
            setConvType('group');
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch(`${BACKEND_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
                const users = await res.json();
                // Only keep friends (people we've had direct conversations with)
                const friendIds = [...new Set(conversations.filter(c => c.type === 'direct').flatMap(c => c.participants.map(p => p?._id)).filter(id => id && id !== mongoUserId))];
                setAllUsers(users.filter(u => u._id !== mongoUserId && friendIds.includes(u._id)));
            } catch (err) { console.error('Failed to fetch users:', err); }
        } else {
            // Pre-fetch all users so direct searching is instant and resilient
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch(`${BACKEND_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
                if (res.ok) {
                    const users = await res.json();
                    setAllUsers(users.filter(u => u._id !== mongoUserId));
                }
            } catch (err) { console.error('Failed to pre-fetch users:', err); }
        }
    };

    const searchUsersDebounced = async (query) => {
        if (userSearchTimerRef.current) clearTimeout(userSearchTimerRef.current);
        const cleanQuery = normalizeUsername(query);
        const rawQuery = (query || '').trim().replace(/^@+/, '').trim().toLowerCase();

        if (!cleanQuery && !rawQuery) {
            setUserSearchResults([]);
            setIsSearchingUsers(false);
            return;
        }

        // Instant responsive local filtering if allUsers is populated
        if (allUsers && allUsers.length > 0) {
            const localMatches = allUsers.filter(u => {
                const uName = (u.username || '').toLowerCase();
                const dName = (u.displayName || '').toLowerCase();
                const dCompact = dName.replace(/\s+/g, '');
                return (
                    (cleanQuery && uName.includes(cleanQuery)) ||
                    (rawQuery && dName.includes(rawQuery)) ||
                    (cleanQuery && dCompact.includes(cleanQuery))
                );
            }).map(u => ({
                ...u,
                isSelf: mongoUserId && String(u._id) === String(mongoUserId)
            }));
            if (localMatches.length > 0) {
                setUserSearchResults(localMatches);
            }
        }

        setIsSearchingUsers(true);
        userSearchTimerRef.current = setTimeout(async () => {
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch(`${BACKEND_URL}/api/users/search?username=${encodeURIComponent(cleanQuery || rawQuery)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const results = await res.json();
                    setUserSearchResults(results);
                    return;
                }
                
                // Fallback: If /api/users/search returns an error, fetch all users and filter client-side
                const fallbackRes = await fetch(`${BACKEND_URL}/api/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (fallbackRes.ok) {
                    const users = await fallbackRes.json();
                    setAllUsers(users.filter(u => u._id !== mongoUserId));
                    const filtered = users.filter(u => {
                        const uName = (u.username || '').toLowerCase();
                        const dName = (u.displayName || '').toLowerCase();
                        const dCompact = dName.replace(/\s+/g, '');
                        return (
                            (cleanQuery && uName.includes(cleanQuery)) ||
                            (rawQuery && dName.includes(rawQuery)) ||
                            (cleanQuery && dCompact.includes(cleanQuery))
                        );
                    }).map(u => ({
                        ...u,
                        isSelf: mongoUserId && String(u._id) === String(mongoUserId)
                    }));
                    setUserSearchResults(filtered);
                }
            } catch (err) {
                console.error('Failed to search users, using fallback:', err);
                try {
                    const token = await getAccessTokenSilently();
                    const fallbackRes = await fetch(`${BACKEND_URL}/api/users`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (fallbackRes.ok) {
                        const users = await fallbackRes.json();
                        setAllUsers(users.filter(u => u._id !== mongoUserId));
                        const filtered = users.filter(u => {
                            const uName = (u.username || '').toLowerCase();
                            const dName = (u.displayName || '').toLowerCase();
                            const dCompact = dName.replace(/\s+/g, '');
                            return (
                                (cleanQuery && uName.includes(cleanQuery)) ||
                                (rawQuery && dName.includes(rawQuery)) ||
                                (cleanQuery && dCompact.includes(cleanQuery))
                            );
                        }).map(u => ({
                            ...u,
                            isSelf: mongoUserId && String(u._id) === String(mongoUserId)
                        }));
                        setUserSearchResults(filtered);
                    }
                } catch (fallbackErr) {
                    console.error('Fallback search also failed:', fallbackErr);
                }
            } finally {
                setIsSearchingUsers(false);
            }
        }, 200);
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

    const sendMessage = async (payload) => {
        if (!mongoUserId || !payload?.conversationId) return;

        const clientMessageId = `pending-${Date.now()}-${++clientMessageSequenceRef.current}`;
        const optimisticMessage = {
            ...payload,
            _id: clientMessageId,
            clientMessageId,
            conversationId: String(payload.conversationId),
            sender: {
                _id: mongoUserId,
                displayName: currentUserData?.displayName || user?.name || 'You',
                avatarUrl: currentUserData?.avatarUrl || user?.picture
            },
            createdAt: new Date().toISOString(),
            pending: true
        };
        // Optimistically display the message immediately
        setMessages(previous => [...previous, optimisticMessage]);

        const handleConfirm = (confirmedMsg) => {
            if (!confirmedMsg) return;
            setMessages(previous => {
                const index = previous.findIndex(m =>
                    m.clientMessageId === clientMessageId ||
                    String(m._id) === clientMessageId ||
                    String(m._id) === String(confirmedMsg._id)
                );
                if (index !== -1) {
                    const next = [...previous];
                    next[index] = { ...confirmedMsg, pending: false };
                    return next;
                }
                return previous;
            });
            // Update sidebar conversation item immediately
            setConversations(prev => prev.map(c => {
                if (String(c._id) === String(payload.conversationId)) {
                    return {
                        ...c,
                        lastMessage: confirmedMsg,
                        updatedAt: confirmedMsg.createdAt || new Date().toISOString()
                    };
                }
                return c;
            }));
        };

        const sendHttpFallback = async () => {
            try {
                let token = null;
                try {
                    token = await getAccessTokenSilently();
                } catch (e) {}
                const headers = {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                };
                const res = await fetch(`${BACKEND_URL}/api/messages`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ ...payload, clientMessageId })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data?.message) {
                        handleConfirm(data.message);
                        return true;
                    }
                }
            } catch (err) {
                console.error('HTTP send fallback error:', err);
            }
            return false;
        };

        if (socket && socket.connected) {
            try {
                socket.timeout(6000).emit(
                    'send_message',
                    { ...payload, clientMessageId },
                    async (error, response) => {
                        if (error || !response?.ok) {
                            console.warn('Socket emit timed out or error, falling back to HTTP:', error || response?.error);
                            const fallbackOk = await sendHttpFallback();
                            if (!fallbackOk) {
                                setMessages(prev => prev.map(m => m.clientMessageId === clientMessageId ? { ...m, pending: false, failed: true } : m));
                                showToast(response?.error || 'Message delivery failed. Tap to retry.');
                            }
                        } else if (response?.message) {
                            handleConfirm(response.message);
                        }
                    }
                );
                return;
            } catch (sockErr) {
                console.warn('Socket emit exception, fallback to HTTP:', sockErr);
            }
        }

        // If socket was not connected, send directly via HTTP fallback
        const fallbackOk = await sendHttpFallback();
        if (!fallbackOk) {
            setMessages(prev => prev.map(m => m.clientMessageId === clientMessageId ? { ...m, pending: false, failed: true } : m));
            showToast('Failed to send message. Please check your connection.');
        }
    };

    const handleSendMessage = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (isSendingMessageRef.current) return;
        const text = messageInput.trim();
        if (!text || !mongoUserId || !activeConversationId) return;

        isSendingMessageRef.current = true;
        setMessageInput('');
        setReplyingToMessage(null);
        if (inputRef.current) inputRef.current.style.height = '48px';

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
            language: finalIsCode ? finalLang : 'plaintext',
            replyTo: replyingToMessage ? replyingToMessage._id : undefined
        };

        sendMessage(messagePayload);

        setTimeout(() => {
            isSendingMessageRef.current = false;
        }, 300);
    };

    const handleBlockUser = async (targetUserId, targetUserName) => {
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`${BACKEND_URL}/api/users/block/${targetUserId}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setCurrentUserData(prev => ({
                    ...prev,
                    blockedUsers: data.blockedUsers
                }));
                showToast(`${targetUserName || 'User'} has been blocked.`);
            } else {
                const err = await res.json();
                showToast(err.message || 'Failed to block user');
            }
        } catch (e) {
            console.error('Error blocking user:', e);
            showToast('Error blocking user');
        }
    };

    const handleUnblockUser = async (targetUserId, targetUserName) => {
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`${BACKEND_URL}/api/users/unblock/${targetUserId}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setCurrentUserData(prev => ({
                    ...prev,
                    blockedUsers: data.blockedUsers
                }));
                showToast(`${targetUserName || 'User'} has been unblocked.`);
            } else {
                const err = await res.json();
                showToast(err.message || 'Failed to unblock user');
            }
        } catch (e) {
            console.error('Error unblocking user:', e);
            showToast('Error unblocking user');
        }
    };

    const handleDeleteAccount = async () => {
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`${BACKEND_URL}/api/users/account`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (res.ok) {
                showToast('Account permanently deleted.');
                logout({ logoutParams: { returnTo: window.location.origin } });
            } else {
                const err = await res.json();
                showToast(err.message || 'Failed to delete account');
            }
        } catch (e) {
            console.error('Error deleting account:', e);
            showToast('Error deleting account');
        }
    };

    const handleNotificationReply = (e) => {
        e.preventDefault();
        const content = notificationReply.trim();
        if (!content || !socket || !mongoUserId || !incomingMessageNotification) return;

        sendMessage({
            conversationId: incomingMessageNotification.conversationId,
            senderId: mongoUserId,
            content,
            isCodeSnippet: false,
            language: 'plaintext',
            replyTo: incomingMessageNotification._id
        });
        setIncomingMessageNotification(null);
        setNotificationReply('');
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
        
        let clientX = e.clientX;
        let clientY = e.clientY;
        
        // Fallback if clientX/Y are not available (e.g., some touch events)
        if (clientX === undefined && e.touches?.length) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (clientX === undefined) {
            clientX = e.pageX;
            clientY = e.pageY;
        }

        const menuWidth = 240; // Approximate width including padding
        const menuHeight = 320; // Approximate max height

        let x = clientX;
        let y = clientY;

        if (x + menuWidth > window.innerWidth) {
            x = window.innerWidth - menuWidth - 8;
        }
        if (y + menuHeight > window.innerHeight) {
            y = Math.max(8, window.innerHeight - menuHeight - 8);
        }

        setContextMenu({
            visible: true,
            x,
            y,
            message: type === 'message' ? item : null,
            callLog: type === 'callLog' ? item : null,
            conversation: type === 'conversation' ? item : null
        });
    };

    const handleTouchStart = (e, msg) => {
        const touch = e.touches[0];
        const pageX = touch.pageX;
        const pageY = touch.pageY;
        touchStartCoords.current = { x: pageX, y: pageY };

        touchHoldTimer.current = setTimeout(() => {
            suppressNextSelectionClick.current = true;
            setTimeout(() => { suppressNextSelectionClick.current = false; }, 700);
            selectMessage(msg._id || msg.createdAt);
            touchHoldTimer.current = null;
        }, 500);
    };

    const handleSelectableTouchStart = (e, type, item) => {
        const touch = e.touches[0];
        touchStartCoords.current = { x: touch.pageX, y: touch.pageY };
        touchHoldTimer.current = setTimeout(() => {
            suppressNextSelectionClick.current = true;
            setTimeout(() => { suppressNextSelectionClick.current = false; }, 700);
            if (type === 'chat') selectChat(item._id);
            else selectCallLog(item.id);
            touchHoldTimer.current = null;
        }, 500);
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

    const confirmDeleteForMe = () => {
        const { conversationId, messageIds } = deleteMessagePrompt;
        if (!socket || !conversationId || !messageIds.length) return;
        
        // Optimistic UI update
        const deletedIdsSet = new Set(messageIds.map(String));
        setMessages(prev => prev.filter(msg =>
            String(msg.conversationId) !== String(conversationId) || !deletedIdsSet.has(String(msg._id))
        ));
        setDeleteMessagePrompt({ visible: false, conversationId: null, messageIds: [] });
        cancelMessageSelection();

        socket.timeout(15000).emit('delete_message_for_me', {
            messageIds,
            conversationId,
            userId: mongoUserId
        }, (error, result) => {
            if (error || !result?.ok) {
                console.error('Could not delete messages for me:', error || result?.error);
                // We could revert the UI here if we wanted to
            }
        });
    };

    const confirmDeleteForEveryone = () => {
        const { conversationId, messageIds } = deleteMessagePrompt;
        if (!socket || !conversationId || !messageIds.length) return;
        const normalizedIds = messageIds.map(String);
        
        // Optimistic UI update
        completeDeleteForEveryone(conversationId, normalizedIds);

        pendingEveryoneDeleteRef.current = {
            conversationId: String(conversationId),
            messageIds: normalizedIds,
            confirmedByBroadcast: false
        };
        
        socket.timeout(15000).emit('delete_message_for_everyone', {
            messageIds: normalizedIds,
            conversationId
        }, (error, result) => {
            const pendingDelete = pendingEveryoneDeleteRef.current;
            if (pendingDelete?.confirmedByBroadcast) {
                pendingEveryoneDeleteRef.current = null;
                return;
            }

            pendingEveryoneDeleteRef.current = null;
            if (error || !result?.ok) {
                console.error('Could not delete messages for everyone:', error || result?.error);
                // We could revert the UI here if we wanted to
                return;
            }
        });
    };

    const deleteMessage = (message) => {
        if (!message?._id || message.pending) {
            showToast('Wait for the message to finish sending before deleting it');
            return;
        }
        setDeleteMessagePrompt({
            visible: true,
            conversationId: String(message.conversationId || activeConversationId),
            messageIds: [String(message._id)],
            allowDeleteForEveryone:
                String(message.sender?._id || message.sender) === String(mongoUserId) &&
                message.isDeletedForEveryone !== true
        });
    };

    const deleteSelectedMessages = () => {
        const conversationId = String(activeConversationId || '');
        const selectedIds = new Set(selectedMessages.map(String));
        const selected = messages.filter(message =>
            String(message.conversationId) === conversationId &&
            selectedIds.has(String(message._id || message.createdAt))
        );
        const deletable = selected.filter(message => message._id && !message.pending);
        if (!deletable.length) {
            showToast('Selected messages could not be deleted');
            return;
        }
        setDeleteMessagePrompt({
            visible: true,
            conversationId,
            messageIds: deletable.map(message => String(message._id)),
            allowDeleteForEveryone: deletable.every(message =>
                String(message.sender?._id || message.sender) === String(mongoUserId) &&
                message.isDeletedForEveryone !== true
            )
        });
    };

    const deleteSelectedChats = () => {
        if (!socket) return;
        const selected = conversations.filter(conversation => selectedChats.includes(conversation._id));
        selected.forEach(conversation => {
            if (conversation.type === 'group') {
                socket.emit('leave_conversation', { conversationId: conversation._id, userId: mongoUserId });
            } else {
                socket.emit('delete_conversation', { conversationId: conversation._id, userId: mongoUserId });
            }
        });
        cancelChatSelection();
        showToast(`Removed ${selected.length} selected chat${selected.length === 1 ? '' : 's'}`);
    };

    const deleteSelectedCallLogs = async () => {
        if (!selectedCallLogs.length) return;
        const results = await Promise.allSettled(selectedCallLogs.map(async (logId) => {
            const token = await getAccessTokenSilently();
            const response = await fetch(`${BACKEND_URL}/api/calls/${logId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`Call log deletion failed (${response.status})`);
            return logId;
        }));
        const deletedIds = results
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value);
        const failedCount = results.length - deletedIds.length;
        if (deletedIds.length) {
            setCallLogs(previous => previous.filter(log => !deletedIds.includes(log.id)));
        }
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error(`Error deleting call log ${selectedCallLogs[index]}:`, result.reason);
            }
        });
        cancelCallLogSelection();
        showToast(failedCount
            ? `Deleted ${deletedIds.length}; ${failedCount} call log${failedCount === 1 ? '' : 's'} could not be deleted`
            : `Deleted ${deletedIds.length} call log${deletedIds.length === 1 ? '' : 's'}`);
    };

    const deleteCallLog = async (logId) => {
        try {
            const token = await getAccessTokenSilently();
            const response = await fetch(`${BACKEND_URL}/api/calls/${logId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`Call log deletion failed (${response.status})`);
            setCallLogs(prev => prev.filter(log => log.id !== logId));
            setContextMenu({ ...contextMenu, visible: false });
        } catch (error) {
            console.error('Error deleting call log:', error);
            showToast('Could not delete call log');
        }
    };

    const openConversationWith = async (contactId, thenCall = null) => {
        if (!contactId) {
            console.warn('openConversationWith: contactId is null or missing');
            return;
        }
        let conv = conversations.find(c => c.type === 'direct' && c.participants.some(p => String(p?._id || p) === String(contactId)));
        let targetContact = (availableContacts || []).find(u => String(u._id || u) === String(contactId))
            || (allUsers || []).find(u => String(u._id || u) === String(contactId));
        if (!conv) {
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch(`${BACKEND_URL}/api/conversations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ type: 'direct', participantIds: [mongoUserId, contactId] })
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
                const partner = conv.participants?.find(p => String(p._id || p) !== String(mongoUserId)) || targetContact;
                setTimeout(() => {
                    setCallConfig({
                        active: true,
                        isReceiving: false,
                        callerData: null,
                        callType: thenCall,
                        targetUserId: partner ? String(partner._id || partner) : String(contactId),
                        targetUser: partner || null,
                        conversationId: conv._id
                    });
                }, 300);
            }
        }
        setContextMenu({ ...contextMenu, visible: false });
    };

    const sendQuickMessageToContact = async (contactId, messageText) => {
        if (!contactId || !messageText?.trim()) return;
        const text = messageText.trim();
        let conv = conversations.find(c => c.type === 'direct' && c.participants.some(p => String(p?._id || p) === String(contactId)));
        if (!conv) {
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch(`${BACKEND_URL}/api/conversations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ type: 'direct', participantIds: [mongoUserId, contactId] })
                });
                if (res.ok) {
                    conv = await res.json();
                    setConversations(prev => [conv, ...prev]);
                }
            } catch (e) {
                console.error('Error creating conversation:', e);
            }
        }
        if (conv && socket) {
            socket.emit('send_message', {
                conversationId: conv._id,
                senderId: mongoUserId,
                content: text,
                sequence: ++clientMessageSequenceRef.current
            });
            showToast('Message sent');
            setActiveTab('chats');
            setActiveConversationId(conv._id);
        }
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
            caption: forwardMessageData.caption || '',
            attachmentName: forwardMessageData.attachmentName || '',
            attachmentType: forwardMessageData.attachmentType || ''
        };

        sendMessage(payload);
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
        setChatUploadPreview(URL.createObjectURL(file));

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
                attachmentName: chatUploadFile.name,
                attachmentType: chatUploadFile.type || 'application/octet-stream',
                isCodeSnippet: false,
                language: 'plaintext'
            };

            sendMessage(messagePayload);
        } catch (error) {
            console.error('Upload Error:', error);
            alert('File upload failed. Please try again.');
        } finally {
            setIsUploading(false);
            setChatUploadFile(null);
            if (chatUploadPreview) URL.revokeObjectURL(chatUploadPreview);
            setChatUploadPreview(null);
            setChatUploadCaption('');
        }
    };

    const cancelChatUpload = () => {
        if (chatUploadPreview) URL.revokeObjectURL(chatUploadPreview);
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
                    const durSec = Math.max(1, recordingTime);
                    const finalAudioUrl = data.fileUrl ? `${data.fileUrl}#duration=${durSec}` : '';

                    const messagePayload = {
                        conversationId: activeConversationId,
                        senderId: mongoUserId,
                        content: finalAudioUrl,
                        attachmentName: 'voice_note.webm',
                        attachmentType: 'audio/webm',
                        isCodeSnippet: false,
                        language: 'plaintext'
                    };

                    sendMessage(messagePayload);
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
    const directChatPartner = (activeConversation && activeConversation.type !== 'group')
        ? activeConversation.participants?.find(p => String(p._id || p) !== String(mongoUserId))
        : null;
    const isDirectChatBlocked = !!(
        directChatPartner &&
        currentUserData?.blockedUsers?.some(u => String(u._id || u) === String(directChatPartner._id || directChatPartner))
    );
    const isSelectingCurrentMessages = isSelectingMessages && messageSelectionConversationId === activeConversationId;
    const showChatArea = !!activeConversationId || (activeTab === 'settings' && !!activeSettingTab);

    const isAudioUrl = (url, mimeType) => {
        if (typeof url !== 'string' || url.startsWith('$STATUS_REPLY$') || url.startsWith('$CALL_LOG$')) return false;
        if (mimeType) {
            if (mimeType.startsWith('audio/') || mimeType === 'audio') return true;
            if (mimeType.startsWith('video/') || mimeType.startsWith('image/')) return false;
        }
        if (url.match(/\.(webm|mp3|wav|ogg|m4a|aac|flac|opus)(\?.*)?$/i) != null) return true;
        if (url.includes('res.cloudinary') && (url.includes('voice_note') || url.includes('/audio/'))) return true;
        return false;
    };

    const isVideoUrl = (url, mimeType) => {
        if (typeof url !== 'string' || url.startsWith('$STATUS_REPLY$') || url.startsWith('$CALL_LOG$')) return false;
        if (isAudioUrl(url, mimeType)) return false;
        if (mimeType) {
            if (mimeType.startsWith('video/') || mimeType === 'video') return true;
            if (mimeType.startsWith('audio/') || mimeType.startsWith('image/')) return false;
        }
        if (url.match(/\.(mp4|mov|avi|mkv|3gp|flv|wmv)(\?.*)?$/i) != null) return true;
        if (url.includes('/video/upload/') && !/\.(webm|mp3|wav|ogg|m4a|aac|flac|opus)(\?.*)?$/i.test(url) && !url.includes('voice_note')) return true;
        return false;
    };

    const isImageUrl = (url, mimeType) => {
        if (typeof url !== 'string' || url.startsWith('$STATUS_REPLY$') || url.startsWith('$CALL_LOG$')) return false;
        if (mimeType) {
            if (mimeType.startsWith('image/') || mimeType === 'image' || mimeType === 'photo' || mimeType === 'whiteboard') return true;
            if (mimeType.startsWith('video/') || mimeType.startsWith('audio/')) return false;
        }
        if (url.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i) != null || url.startsWith('data:image/')) return true;
        if (url.includes('/image/upload/') && !/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip)(\?.*)?$/i.test(url)) return true;
        return false;
    };

    const isDocumentUrl = (url, mimeType, attachmentName = '') => {
        if (typeof url !== 'string' || url.startsWith('$STATUS_REPLY$') || url.startsWith('$CALL_LOG$')) return false;
        if (isAudioUrl(url, mimeType) || isVideoUrl(url, mimeType) || isImageUrl(url, mimeType)) return false;
        if (mimeType) {
            if (mimeType.startsWith('application/') || mimeType.startsWith('text/') || mimeType === 'document' || mimeType === 'file') return true;
        }
        const checkStr = `${attachmentName || ''} ${url || ''}`;
        if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar|7z|tar|gz)(\?.*)?$/i.test(checkStr)) return true;
        if (url.includes('/raw/upload/') || url.includes('res.cloudinary.com')) return true;
        return false;
    };

    const getDocumentInfo = (filename, attachmentType = '', url = '') => {
        const rawUrl = (url || '').replace('/upload/fl_inline/', '/upload/');
        const safeName = filename || rawUrl.split('/').pop().split('?')[0] || 'Document';
        const ext = safeName.includes('.') ? safeName.split('.').pop().toLowerCase() : '';

        let label = 'Document';
        let appName = 'Document App';
        let color = '#06b6d4'; // default cyan
        let officeScheme = null;
        let canIframePreview = false;
        let mimeType = 'application/octet-stream';

        if (ext === 'pdf' || (attachmentType && attachmentType.includes('pdf'))) {
            label = 'PDF Document';
            appName = 'PDF Reader / Adobe';
            color = '#ef4444'; // Red
            canIframePreview = true;
            mimeType = 'application/pdf';
        } else if (['doc', 'docx'].includes(ext) || (attachmentType && (attachmentType.includes('word') || attachmentType.includes('officedocument.wordprocessingml')))) {
            label = ext.toUpperCase() + ' Document';
            appName = 'Microsoft Word / WPS';
            color = '#2563eb'; // Blue
            officeScheme = 'ms-word:ofv|u|';
            canIframePreview = true;
            mimeType = ext === 'doc' ? 'application/msword' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } else if (['xls', 'xlsx', 'csv'].includes(ext) || (attachmentType && (attachmentType.includes('sheet') || attachmentType.includes('excel')))) {
            label = ext.toUpperCase() + ' Spreadsheet';
            appName = 'Microsoft Excel / WPS';
            color = '#10b981'; // Green
            officeScheme = ext !== 'csv' ? 'ms-excel:ofv|u|' : null;
            canIframePreview = true;
            mimeType = ext === 'csv' ? 'text/csv' : ext === 'xls' ? 'application/vnd.ms-excel' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else if (['ppt', 'pptx'].includes(ext) || (attachmentType && (attachmentType.includes('presentation') || attachmentType.includes('powerpoint')))) {
            label = ext.toUpperCase() + ' Presentation';
            appName = 'Microsoft PowerPoint / WPS';
            color = '#f97316'; // Orange
            officeScheme = 'ms-powerpoint:ofv|u|';
            canIframePreview = true;
            mimeType = ext === 'ppt' ? 'application/vnd.ms-powerpoint' : 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
            label = ext.toUpperCase() + ' Archive';
            appName = 'Archive / File Manager';
            color = '#8b5cf6'; // Purple
            canIframePreview = false;
            mimeType = 'application/zip';
        } else if (['txt', 'log', 'md', 'json'].includes(ext)) {
            label = ext.toUpperCase() + ' File';
            appName = 'Text Editor';
            color = '#06b6d4';
            canIframePreview = true;
            mimeType = 'text/plain';
        }

        return { ext, safeName, label, appName, color, officeScheme, canIframePreview, mimeType };
    };

    const handleDownloadDocument = async (proxyUrl, filename, mimeType) => {
        try {
            const res = await fetch(proxyUrl);
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(new Blob([blob], { type: mimeType || 'application/octet-stream' }));
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
            showToast('Document downloaded');
        } catch {
            const a = document.createElement('a');
            a.href = proxyUrl;
            a.download = filename;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    const handleOpenInApp = async (docInfo, proxyUrl, preloadedBlob = null) => {
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth <= 768;

        // 1. Mobile devices: Open with system resolver (Word, WPS Office, Google Docs, Drive, Acrobat)
        if (isMobile) {
            try {
                let blob = preloadedBlob;
                if (!blob) {
                    const res = await fetch(proxyUrl);
                    if (res.ok) blob = await res.blob();
                }
                if (blob) {
                    const file = new File([blob], docInfo.safeName, { type: docInfo.mimeType || blob.type });
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            files: [file],
                            title: docInfo.safeName
                        });
                        return;
                    }
                }
            } catch (err) {
                if (err?.name === 'AbortError') return;
            }
        }

        // 2. Desktop: If Office application scheme is supported (ms-word:, ms-excel:, ms-powerpoint:), launch native app
        if (!isMobile && docInfo.officeScheme) {
            try {
                window.location.href = `${docInfo.officeScheme}${encodeURI(proxyUrl)}`;
                return;
            } catch (err) {
                console.warn('Native office scheme launch failed:', err);
            }
        }

        // 3. For PDFs: Open in system/browser PDF reader
        if (docInfo.ext === 'pdf') {
            window.open(proxyUrl, '_blank', 'noopener,noreferrer');
            return;
        }

        // 4. For Office documents: Open with Google Docs Viewer
        if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(docInfo.ext)) {
            window.open(`https://docs.google.com/viewer?url=${encodeURIComponent(proxyUrl)}`, '_blank', 'noopener,noreferrer');
            return;
        }

        // 5. Fallback
        window.open(proxyUrl, '_blank', 'noopener,noreferrer');
    };

    const handleOpenDocument = async (msg, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!msg?.content) return;

        // Clean up any accidental /fl_inline/ to avoid Cloudinary HTTP 400 Bad Request
        const rawUrl = msg.content.replace('/upload/fl_inline/', '/upload/');
        const filename = msg.attachmentName || rawUrl.split('/').pop().split('?')[0] || 'document';
        const docInfo = getDocumentInfo(filename, msg.attachmentType, rawUrl);

        const docId = msg._id || msg.createdAt;
        setOpeningDocId(docId);

        // Proxy through our backend to eliminate CORS issues and avoid redirecting to Cloudinary
        const proxyUrl = `${BACKEND_URL}/api/upload/file?url=${encodeURIComponent(rawUrl)}&name=${encodeURIComponent(docInfo.safeName)}`;

        // Open WhatsApp-style Document Viewer Modal immediately
        setDocumentViewer({
            msg,
            docInfo,
            proxyUrl,
            rawUrl,
            filename: docInfo.safeName,
            ext: docInfo.ext,
            blob: null,
            isLoading: true
        });

        // Background preload blob so "Open in App" or "Download" clicks respond instantly
        try {
            const response = await fetch(proxyUrl);
            if (response.ok) {
                const blob = await response.blob();
                setDocumentViewer(prev => (prev && prev.proxyUrl === proxyUrl ? { ...prev, blob, isLoading: false } : prev));
            } else {
                setDocumentViewer(prev => (prev && prev.proxyUrl === proxyUrl ? { ...prev, isLoading: false } : prev));
            }
        } catch (err) {
            console.warn('Proxy fetch warning:', err);
            setDocumentViewer(prev => (prev && prev.proxyUrl === proxyUrl ? { ...prev, isLoading: false } : prev));
        } finally {
            setOpeningDocId(null);
        }
    };

    const formatLastMessagePreview = (lastMsg, currentUserId) => {
        if (!lastMsg) return 'No messages yet';
        if (lastMsg.isDeletedForEveryone) return 'This message was deleted';

        const isOwn = String(lastMsg.sender?._id || lastMsg.sender) === String(currentUserId);
        const prefix = isOwn ? 'You: ' : '';

        if (lastMsg.attachmentType === 'whiteboard' || lastMsg.caption === 'View the mock-up' || (typeof lastMsg.content === 'string' && lastMsg.content.startsWith('data:image/'))) {
            return prefix + '🎨 Whiteboard Mock-up';
        }

        const content = typeof lastMsg.content === 'string' ? lastMsg.content : '';
        const mime = lastMsg.attachmentType || '';
        const name = lastMsg.attachmentName || '';
        const caption = lastMsg.caption?.trim() ? ` ${lastMsg.caption.trim()}` : '';

        if (content.startsWith('$STATUS_REPLY$|') || content.startsWith('[Status:') || content.startsWith('[Status :')) {
            const parsed = parseStatusReply(content);
            const icon = parsed?.type === 'video' ? '🎥' : parsed?.type === 'text' ? '📝' : '📷';
            return `${prefix}${icon} Status: ${parsed?.replyText || 'Replied to status'}`;
        }

        if (content.startsWith('$CALL_LOG$')) {
            const parts = content.split('|');
            const callType = parts[1] || 'voice';
            const callStatus = parts[2] || 'completed';
            const icon = callType === 'video' ? '📹' : '📞';
            const typeLabel = callType === 'video' ? 'Video call' : 'Voice call';

            if (callStatus === 'missed') {
                if (!isOwn) {
                    return `${icon} Missed ${callType === 'video' ? 'video call' : 'voice call'}`;
                }
                return `${prefix}${icon} ${typeLabel}`;
            }
            if (callStatus === 'rejected') {
                return `${prefix}${icon} Declined ${callType === 'video' ? 'video call' : 'voice call'}`;
            }
            return `${prefix}${icon} ${typeLabel}`;
        }

        if (isAudioUrl(content, mime) || /\.(mp3|wav|ogg|m4a|aac|flac|opus|webm)$/i.test(name)) {
            return prefix + '🎤 Audio';
        }

        if (isVideoUrl(content, mime) || /\.(mp4|mov|avi|mkv|3gp|flv|wmv)$/i.test(name)) {
            return prefix + (caption ? `🎥${caption}` : '🎥 Video');
        }

        if (isImageUrl(content, mime) || /\.(jpeg|jpg|png|gif|webp|svg)$/i.test(name)) {
            return prefix + (caption ? `📷${caption}` : '📷 Photo');
        }

        if (isDocumentUrl(content, mime, name)) {
            const docLabel = name || (lastMsg.caption?.trim() || 'Document');
            return prefix + '📄 ' + docLabel;
        }

        if (content) {
            return prefix + content;
        }

        return prefix + 'No messages yet';
    };

    const isCloudinaryUrl = (url) => typeof url === 'string' && !url.startsWith('$STATUS_REPLY$') && !url.startsWith('$CALL_LOG$') && url.includes('res.cloudinary.com');
    const openMediaViewer = (src, type = 'image', title = '') => {
        if (src) setMediaViewer({ src, type, title });
    };

    const handleTabChange = (tab) => {
        if (activeTab === tab) return;
        cancelMessageSelection();
        cancelChatSelection();
        cancelCallLogSelection();
        setActiveTab(tab);
        if (tab === 'communities' || tab === 'status' || tab === 'calls' || tab === 'settings') {
            setActiveConversationId(null);
            setIsDrawerOpen(false);
        }
        if (tab === 'chats') {
            if (!activeConversationId && conversations.length > 0) {
                if (window.innerWidth > 768) {
                    setActiveConversationId(conversations[0]._id);
                }
            }
        }
        if (tab === 'settings') {
            const hasVisited = localStorage.getItem('devsup_visited_settings');
            // On mobile, always show the settings list first (not the profile panel)
            const isMobile = window.innerWidth <= 768;
            if (!isMobile) {
                if (hasVisited && !activeSettingTab) {
                    setActiveSettingTab('Profile');
                } else if (!hasVisited) {
                    localStorage.setItem('devsup_visited_settings', 'true');
                }
            } else {
                // On mobile, reset to null so the sidebar (settings list) shows first
                setActiveSettingTab(null);
                if (!hasVisited) {
                    localStorage.setItem('devsup_visited_settings', 'true');
                }
            }
        }
    };

    if (connectionError) {
        return (
            <AppContainer>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--colors-bg)', padding: '20px', textAlign: 'center' }}>
                    <div style={{ color: '#EF4444', marginBottom: '20px' }}>
                        <ShieldAlert size={64} />
                    </div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '12px', color: 'var(--colors-textMain)' }}>Backend Connection Failed</h2>
                    <p style={{ color: 'var(--colors-textMuted)', maxWidth: '600px', lineHeight: '1.6', marginBottom: '24px' }}>
                        {connectionError}
                    </p>
                    <Button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
                        Log Out
                    </Button>
                </div>
            </AppContainer>
        );
    }

    return (
        <AppContainer>
            <NavRail className={showChatArea ? 'mobile-hidden' : ''}>
                <NavRailTop>
                    <NavRailItem active={activeTab === 'chats'} onClick={() => handleTabChange('chats')} title="Chats">
                        <MessageSquare size={22} />
                    </NavRailItem>
                    <NavRailItem
                        active={activeTab === 'communities'}
                        onClick={() => handleTabChange('communities')}
                        title="Communities"
                    >
                        <Users size={22} />
                    </NavRailItem>
                    <NavRailItem active={activeTab === 'calls'} onClick={() => handleTabChange('calls')} title="Calls">
                        <Phone size={22} />
                    </NavRailItem>
                    <NavRailItem active={activeTab === 'status'} onClick={() => handleTabChange('status')} title="Status" style={activeTab === 'status' ? {} : { color: 'var(--colors-textMuted)' }}>
                        <Code2 size={24} />
                    </NavRailItem>
                    <NavRailItem active={activeTab === 'settings'} onClick={() => handleTabChange('settings')} title="Settings">
                        <Settings size={22} />
                    </NavRailItem>
                </NavRailTop>

                <NavRailBottom>
                    <AvatarWrapper title={currentUserData?.displayName || user?.name || user?.nickname || user?.email}>
                        <Avatar
                            src={getAvatarUrl(currentUserData?.avatarUrl || user?.picture)}
                            alt={user?.name || user?.nickname || 'User'}
                            onClick={() => openMediaViewer(getAvatarUrl(currentUserData?.avatarUrl || user?.picture), 'image', currentUserData?.displayName || user?.name || 'Profile picture')}
                            style={{ width: '32px', height: '32px', cursor: 'zoom-in' }}
                            onError={(e) => {
                                e.currentTarget.src = '/default-avatar.svg';
                            }}
                        />
                        <OnlineDot style={{ width: '10px', height: '10px' }} />
                    </AvatarWrapper>
                    <NavRailItem title="Log Out" onClick={() => setIsLogoutModalOpen(true)}>
                        <LogOut size={22} />
                    </NavRailItem>
                </NavRailBottom>
            </NavRail>

            <Sidebar className={showChatArea ? 'mobile-hidden' : ''}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '12px 20px 4px 20px',
                    userSelect: 'none'
                }}>
                    <DevSupLogo size={14} />
                    <span style={{
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        color: 'var(--colors-textMain)',
                        letterSpacing: '0.2px'
                    }}>
                        DevSup
                    </span>
                </div>

                {activeTab === 'calls' && (
                    <>
                        <div style={{ padding: '8px 20px 12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '16px' }}>
                                <h2 style={{ fontSize: '1.45rem', margin: 0, fontWeight: '700', color: 'var(--colors-textMain)' }}>
                                    {isCallLogsSelectionMode ? `${selectedCallLogs.length} selected` : 'Recent Calls'}
                                </h2>
                                {isCallLogsSelectionMode ? (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <IconButton title="Delete selected call logs" onClick={deleteSelectedCallLogs} disabled={!selectedCallLogs.length} style={{ color: '#ff6b6b', backgroundColor: '#2a3942', width: '40px', height: '40px', opacity: selectedCallLogs.length ? 1 : 0.45 }}>
                                            <Trash2 size={20} />
                                        </IconButton>
                                        <IconButton title="Cancel selection" onClick={cancelCallLogSelection} style={{ color: '#d1d7db', backgroundColor: '#2a3942', width: '40px', height: '40px' }}>
                                            <X size={20} />
                                        </IconButton>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <IconButton title="New Call" onClick={() => { setNewCallSearchQuery(''); setIsNewCallModalOpen(true); }} style={{ color: 'var(--colors-accent, #00e5ff)', backgroundColor: 'rgba(0, 229, 255, 0.1)', width: '40px', height: '40px', borderRadius: '50%' }}>
                                            <PhoneCall size={19} />
                                        </IconButton>
                                        <IconButton title="Select call logs" onClick={() => setIsCallLogsSelectionMode(true)} style={{ color: '#d1d7db', backgroundColor: '#2a3942', width: '40px', height: '40px' }}>
                                            <CheckSquare size={20} />
                                        </IconButton>
                                    </div>
                                )}
                            </div>
                        </div>
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
                                        active={selectedCallLogs.includes(log.id)}
                                        style={{
                                            height: 'auto',
                                            padding: '10px 16px',
                                            gap: '14px',
                                            margin: 0,
                                            borderBottom: 'none',
                                            backgroundColor: selectedCallLogs.includes(log.id) ? 'rgba(0, 168, 132, 0.16)' : undefined
                                        }}
                                        onClick={() => {
                                            if (consumeSuppressedSelectionClick()) return;
                                            if (isCallLogsSelectionMode) {
                                                toggleCallLogSelection(log.id);
                                            } else {
                                                setSelectedCallLogId(log.id);
                                            }
                                        }}
                                        onTouchStart={(e) => handleSelectableTouchStart(e, 'callLog', log)}
                                        onTouchMove={handleTouchMove}
                                        onTouchEnd={handleTouchEnd}
                                        onTouchCancel={handleTouchEnd}
                                        onContextMenu={(e) => handleContextMenu(e, 'callLog', log)}
                                    >
                                        {isCallLogsSelectionMode && (
                                            <SelectionCheck
                                                type="button"
                                                selected={selectedCallLogs.includes(log.id)}
                                                aria-label={selectedCallLogs.includes(log.id) ? 'Deselect call log' : 'Select call log'}
                                                aria-pressed={selectedCallLogs.includes(log.id)}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleCallLogSelection(log.id);
                                                }}
                                            >
                                                {selectedCallLogs.includes(log.id) && <Check size={14} strokeWidth={3} />}
                                            </SelectionCheck>
                                        )}
                                        {(() => {
                                            const resolvedContact = (() => {
                                                if (log.contactName && log.contactName !== 'Contact' && log.contactName !== 'Unknown') {
                                                    return { name: log.contactName, avatar: log.contactAvatar };
                                                }
                                                if (log.contactId) {
                                                    const pool = [...(availableContacts || []), ...(allUsers || [])];
                                                    const u = pool.find(x => String(x?._id || x) === String(log.contactId));
                                                    if (u) return { name: u.displayName || u.username || 'Developer', avatar: u.avatarUrl || log.contactAvatar };
                                                }
                                                if (log.conversationId) {
                                                    const c = conversations?.find(cv => String(cv._id) === String(log.conversationId));
                                                    if (c) {
                                                        if (c.type === 'group') return { name: c.name || 'Group Call', avatar: c.avatarUrl || log.contactAvatar };
                                                        const other = c.participants?.find(p => String(p?._id || p) !== String(mongoUserId));
                                                        if (other) return { name: other.displayName || other.username || 'Developer', avatar: other.avatarUrl || log.contactAvatar };
                                                    }
                                                }
                                                return { name: log.contactName || 'Developer', avatar: log.contactAvatar };
                                            })();

                                            return (
                                                <>
                                                    <AvatarWrapper style={{ flexShrink: 0 }}>
                                                        <Avatar
                                                            src={resolvedContact.avatar || '/default-avatar.svg'}
                                                            style={{ width: '44px', height: '44px', borderRadius: '50%', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                                                            onError={(e) => { e.currentTarget.src = '/default-avatar.svg'; }}
                                                        />
                                                    </AvatarWrapper>
                                                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, justifyContent: 'center', gap: '3px', boxSizing: 'border-box' }}>
                                                        <span style={{ fontSize: '0.96rem', fontWeight: '500', color: 'var(--colors-textMain)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>
                                                            {resolvedContact.name}
                                                        </span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: (log.direction === 'incoming' && log.status === 'missed') ? '#ef4444' : 'var(--colors-textMuted)', lineHeight: 1.2 }}>
                                                            {log.direction === 'incoming' ? (
                                                                <svg viewBox="0 0 24 24" width="14" height="14" fill={log.status === 'missed' ? '#ef4444' : '#10b981'}>
                                                                    <path d="M20 5.41L18.59 4 7 15.59V9H5v10h10v-2H8.41L20 5.41z"></path>
                                                                </svg>
                                                            ) : (
                                                                <svg viewBox="0 0 24 24" width="14" height="14" fill="var(--colors-accent, #00e5ff)">
                                                                    <path d="M9 5v2h6.59L4 18.59 5.41 20 17 8.41V15h2V5H9z"></path>
                                                                </svg>
                                                            )}
                                                            <span>{formatCallTimestamp(log.timestamp)}</span>
                                                        </div>
                                                    </div>
                                                    {!isCallLogsSelectionMode && (
                                                        <IconButton
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openConversationWith(log.contactId, log.type === 'video' ? 'video' : 'audio');
                                                            }}
                                                            style={{ 
                                                                color: 'var(--colors-accent, #00e5ff)',
                                                                backgroundColor: 'rgba(0, 229, 255, 0.08)',
                                                                width: '36px',
                                                                height: '36px',
                                                                borderRadius: '50%',
                                                                flexShrink: 0,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                transition: 'all 0.15s ease'
                                                            }}
                                                            title={log.type === 'video' ? 'Video Call' : 'Voice Call'}
                                                        >
                                                            {log.type === 'video' ? <Video size={17} /> : <Phone size={17} />}
                                                        </IconButton>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </ChannelItem>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'chats' && (
                    <>
                        <div style={{ padding: '8px 20px 12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '16px' }}>
                                <h2 style={{ fontSize: '1.45rem', margin: 0, fontWeight: '700', color: 'var(--colors-textMain)' }}>
                                    {isChatsSelectionMode ? `${selectedChats.length} selected` : 'Chats'}
                                </h2>
                                {isChatsSelectionMode ? (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <IconButton title="Delete selected chats" onClick={deleteSelectedChats} disabled={!selectedChats.length} style={{ color: '#ff6b6b', backgroundColor: '#2a3942', width: '40px', height: '40px', opacity: selectedChats.length ? 1 : 0.45 }}>
                                            <Trash2 size={20} />
                                        </IconButton>
                                        <IconButton title="Cancel selection" onClick={cancelChatSelection} style={{ color: '#d1d7db', backgroundColor: '#2a3942', width: '40px', height: '40px' }}>
                                            <X size={20} />
                                        </IconButton>
                                    </div>
                                ) : <div style={{ display: 'flex', gap: '8px' }}>
                                    <IconButton title="New Chat" onClick={openCreateModal} style={{ backgroundColor: 'var(--colors-surface)', color: 'var(--colors-textMain)' }}>
                                        <Plus size={20} />
                                    </IconButton>
                                    <div style={{ position: 'relative' }}>
                                        <IconButton title="Menu" onClick={() => setIsChatsMenuOpen(!isChatsMenuOpen)} style={{ backgroundColor: 'transparent', color: 'var(--colors-textMuted)' }}>
                                            <MoreVertical size={20} />
                                        </IconButton>
                                        {isChatsMenuOpen && (
                                            <>
                                                <div
                                                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1999 }}
                                                    onClick={() => setIsChatsMenuOpen(false)}
                                                />
                                                <ContextMenuContainer style={{ top: '100%', right: 0, marginTop: '12px', zIndex: 2000 }}>
                                                    <ContextMenuItem onClick={() => { setConvType('group'); setIsModalOpen(true); setIsChatsMenuOpen(false); }}>
                                                        <Users size={18} style={{ opacity: 0.8 }} />
                                                        New group
                                                    </ContextMenuItem>
                                                    <ContextMenuItem onClick={() => { setIsChatsSelectionMode(true); setSelectedChats([]); setIsChatsMenuOpen(false); }}>
                                                        <CheckSquare size={18} style={{ opacity: 0.8 }} />
                                                        Select chats
                                                    </ContextMenuItem>
                                                    <ContextMenuItem onClick={() => { handleTabChange('settings'); setIsChatsMenuOpen(false); }}>
                                                        <Settings size={18} style={{ opacity: 0.8 }} />
                                                        Settings
                                                    </ContextMenuItem>
                                                    <ContextMenuItem onClick={() => { setIsLogoutModalOpen(true); setIsChatsMenuOpen(false); }}>
                                                        <LogOut size={18} style={{ opacity: 0.8 }} />
                                                        Log out
                                                    </ContextMenuItem>
                                                </ContextMenuContainer>
                                            </>
                                        )}
                                    </div>
                                </div>}
                            </div>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                backgroundColor: 'var(--colors-bg)', 
                                padding: '8px 12px', 
                                borderRadius: '8px', 
                                gap: '12px',
                                marginBottom: '16px'
                            }}>
                                <Search size={18} color="var(--colors-textMuted)" />
                                <input 
                                    type="text" 
                                    placeholder="Search or start a new chat"
                                    value={chatSearchQuery}
                                    onChange={(e) => setChatSearchQuery(e.target.value)}
                                    style={{ 
                                        border: 'none', 
                                        background: 'transparent', 
                                        outline: 'none', 
                                        color: 'var(--colors-textMain)', 
                                        fontSize: '0.95rem',
                                        width: '100%'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'none' }}></div>
                        </div>

                        {conversations.filter(c => {
                            if (!chatSearchQuery) return true;
                            const isGroup = c.type === 'group';
                            const otherParticipant = !isGroup ? c.participants?.find(p => p._id !== mongoUserId) : null;
                            const convName = isGroup ? c.name : (otherParticipant?.displayName || '');
                            return convName.toLowerCase().includes(chatSearchQuery.toLowerCase());
                        }).length === 0 ? (
                            chatSearchQuery.trim() ? (
                                <div style={{ color: 'var(--colors-textMuted)', fontSize: '0.85rem', padding: '16px 20px', textAlign: 'center' }}>
                                    Chat not found.
                                </div>
                            ) : (
                                <div 
                                    onClick={openCreateModal}
                                    style={{ 
                                        color: 'var(--colors-accent)', 
                                        fontSize: '0.9rem', 
                                        padding: '16px 20px', 
                                        textAlign: 'center', 
                                        cursor: 'pointer',
                                        fontWeight: '500',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <Plus size={16} />
                                    <span>Start chat</span>
                                </div>
                            )
                        ) : (
                            [...conversations].filter(c => {
                                if (!chatSearchQuery) return true;
                                const isGroup = c.type === 'group';
                                const otherParticipant = !isGroup ? c.participants?.find(p => p._id !== mongoUserId) : null;
                                const convName = isGroup ? c.name : (otherParticipant?.displayName || '');
                                return convName.toLowerCase().includes(chatSearchQuery.toLowerCase());
                            }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map(conv => {
                                const isGroup = conv.type === 'group';
                                const otherParticipant = !isGroup ? conv.participants?.find(p => p._id !== mongoUserId) : null;
                                const isOtherUserOnline = otherParticipant && activeUsers.includes(otherParticipant._id);
                                const userStatusIndex = otherParticipant ? groupedStatuses.findIndex(g => g.user._id === otherParticipant._id) : -1;
                                const hasStatus = userStatusIndex !== -1;
                                const groupStatuses = hasStatus ? groupedStatuses[userStatusIndex].statuses : [];
                                const allViewed = hasStatus ? groupStatuses.every(s => s.viewers && s.viewers.some(v => (v === mongoUserId || v._id === mongoUserId))) : true;
                                const showStatusRing = hasStatus && !allViewed;

                                return (
                                    <ChannelItem
                                        key={conv._id}
                                        active={activeConversationId === conv._id || selectedChats.includes(conv._id)}
                                        onClick={() => {
                                            if (consumeSuppressedSelectionClick()) return;
                                            if (isChatsSelectionMode) toggleChatSelection(conv._id);
                                            else { setActiveConversationId(conv._id); setIsLiveCodingOpen(false); setIsHackathonOpen(false); }
                                        }}
                                        onTouchStart={(e) => handleSelectableTouchStart(e, 'chat', conv)}
                                        onTouchMove={handleTouchMove}
                                        onTouchEnd={handleTouchEnd}
                                        onTouchCancel={handleTouchEnd}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            setContextMenu({ visible: true, x: e.pageX, y: e.pageY, message: null, callLog: null, conversation: conv });
                                        }}
                                        style={{
                                            padding: '6px 14px',
                                            borderRadius: 0,
                                            gap: '12px',
                                            alignItems: 'center',
                                            margin: 0,
                                            minHeight: '62px',
                                            boxSizing: 'border-box',
                                            borderBottom: 'none',
                                            backgroundColor: selectedChats.includes(conv._id) ? 'rgba(0, 168, 132, 0.16)' : (activeConversationId === conv._id ? 'rgba(255, 255, 255, 0.08)' : undefined)
                                        }}
                                        onMouseEnter={(e) => {
                                            const btn = e.currentTarget.querySelector('.conv-delete-btn');
                                            if (btn) btn.style.opacity = 1;
                                        }}
                                        onMouseLeave={(e) => {
                                            const btn = e.currentTarget.querySelector('.conv-delete-btn');
                                            if (btn) btn.style.opacity = 0;
                                        }}
                                    >
                                        {isChatsSelectionMode && (
                                            <SelectionCheck
                                                type="button"
                                                selected={selectedChats.includes(conv._id)}
                                                aria-label={selectedChats.includes(conv._id) ? 'Deselect chat' : 'Select chat'}
                                                aria-pressed={selectedChats.includes(conv._id)}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleChatSelection(conv._id);
                                                }}
                                            >
                                                {selectedChats.includes(conv._id) && <Check size={14} strokeWidth={3} />}
                                            </SelectionCheck>
                                        )}
                                        <AvatarWrapper 
                                            style={{ flexShrink: 0, padding: showStatusRing ? '2px' : '0', border: showStatusRing ? '2px solid var(--colors-accent)' : 'none', cursor: showStatusRing ? 'pointer' : 'default', width: showStatusRing ? '52px' : '48px', height: showStatusRing ? '52px' : '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}
                                            onClick={(e) => {
                                                if (isChatsSelectionMode) {
                                                    e.stopPropagation();
                                                    toggleChatSelection(conv._id);
                                                    return;
                                                }
                                                if (showStatusRing) {
                                                    e.stopPropagation();
                                                    setStoryViewerInitialUserIndex(userStatusIndex);
                                                }
                                            }}
                                        >
                                            <Avatar
                                                src={isGroup
                                                    ? getAvatarUrl(conv.avatarUrl)
                                                    : getAvatarUrl(otherParticipant?.avatarUrl)}
                                                onError={(e) => { e.currentTarget.src = '/default-avatar.svg'; }}
                                                style={{ width: '48px', height: '48px', border: 'none', flexShrink: 0 }}
                                            />
                                            {!isGroup && isOtherUserOnline && <OnlineDot style={{ width: '12px', height: '12px', bottom: '2px', right: '2px' }} />}
                                        </AvatarWrapper>

                                        <div className="chat-item-text" style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, justifyContent: 'center', alignSelf: 'center', gap: '4px', padding: 0, margin: 0, boxSizing: 'border-box', borderBottom: 'none' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: 1.2, margin: 0, padding: 0 }}>
                                                <span style={{ fontSize: '0.94rem', fontWeight: conv.unreadCount > 0 ? '600' : '500', color: 'var(--colors-textMain, #ffffff)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>
                                                    {isGroup ? conv.name : (otherParticipant?.displayName || 'Unknown User')}
                                                </span>
                                                {conv.lastMessage && (
                                                    <span style={{ fontSize: '0.72rem', color: conv.unreadCount > 0 ? 'var(--colors-accent)' : 'var(--colors-textMuted)', flexShrink: 0, fontWeight: conv.unreadCount > 0 ? '600' : 'normal', lineHeight: 1.2 }}>
                                                        {formatMessageTime(conv.lastMessage.createdAt, false)}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: 1.2, margin: 0, padding: 0 }}>
                                                <span style={{ 
                                                    fontSize: '0.82rem', 
                                                    color: (conv.lastMessage?.content?.startsWith('$CALL_LOG$') && conv.lastMessage?.content?.includes('|missed') && String(conv.lastMessage?.sender?._id || conv.lastMessage?.sender) !== String(mongoUserId))
                                                        ? '#ef4444' 
                                                        : (conv.unreadCount > 0 ? 'var(--colors-textMain)' : 'var(--colors-textMuted)'), 
                                                    fontWeight: (conv.unreadCount > 0 || (conv.lastMessage?.content?.startsWith('$CALL_LOG$') && conv.lastMessage?.content?.includes('|missed') && String(conv.lastMessage?.sender?._id || conv.lastMessage?.sender) !== String(mongoUserId))) ? '600' : 'normal', 
                                                    whiteSpace: 'nowrap', 
                                                    overflow: 'hidden', 
                                                    textOverflow: 'ellipsis', 
                                                    lineHeight: 1.2 
                                                }}>
                                                    {formatLastMessagePreview(conv.lastMessage, mongoUserId)}
                                                </span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {conv.unreadCount > 0 && (
                                                        <div style={{ backgroundColor: 'var(--colors-accent)', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '1px 6px', borderRadius: '10px', minWidth: '18px', textAlign: 'center', lineHeight: 1.2 }}>
                                                            {conv.unreadCount}
                                                        </div>
                                                    )}
                                                    {!isChatsSelectionMode && <IconButton
                                                        desktopOnly
                                                        className="conv-delete-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setContextMenu({ visible: true, x: e.clientX, y: e.clientY, message: null, callLog: null, conversation: conv });
                                                        }}
                                                        title="Options"
                                                        style={{ padding: '2px', height: '18px', width: '18px', opacity: 0, transition: 'opacity 0.2s', color: 'var(--colors-textMuted)', zIndex: 2 }}
                                                    >
                                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                                    </IconButton>}
                                                </div>
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
                        <div style={{ padding: '8px 20px 12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '16px' }}>
                                <h2 style={{ fontSize: '1.45rem', margin: 0, fontWeight: '700', color: 'var(--colors-textMain)' }}>
                                    {isChatsSelectionMode ? `${selectedChats.length} selected` : 'Communities'}
                                </h2>
                                {isChatsSelectionMode ? (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <IconButton title="Leave selected communities" onClick={deleteSelectedChats} disabled={!selectedChats.length} style={{ color: '#ff6b6b', backgroundColor: '#2a3942', width: '40px', height: '40px', opacity: selectedChats.length ? 1 : 0.45 }}>
                                            <Trash2 size={20} />
                                        </IconButton>
                                        <IconButton title="Cancel selection" onClick={cancelChatSelection} style={{ color: '#d1d7db', backgroundColor: '#2a3942', width: '40px', height: '40px' }}>
                                            <X size={20} />
                                        </IconButton>
                                    </div>
                                ) : <div style={{ display: 'flex', gap: '8px' }}>
                                    <IconButton title="New Community" onClick={() => { setConvType('group'); setIsModalOpen(true); }} style={{ backgroundColor: 'var(--colors-surface)', color: 'var(--colors-textMain)' }}>
                                        <Plus size={20} />
                                    </IconButton>
                                    <div style={{ position: 'relative' }}>
                                        <IconButton title="Menu" onClick={() => setIsChatsMenuOpen(!isChatsMenuOpen)} style={{ backgroundColor: 'transparent', color: 'var(--colors-textMuted)' }}>
                                            <MoreVertical size={20} />
                                        </IconButton>
                                        {isChatsMenuOpen && (
                                            <>
                                                <div
                                                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1999 }}
                                                    onClick={() => setIsChatsMenuOpen(false)}
                                                />
                                                <ContextMenuContainer style={{ top: '100%', right: 0, marginTop: '12px', zIndex: 2000 }}>
                                                    <ContextMenuItem onClick={() => { setIsChatsSelectionMode(true); setSelectedChats([]); setIsChatsMenuOpen(false); }}>
                                                        <CheckSquare size={18} style={{ opacity: 0.8 }} />
                                                        Select communities
                                                    </ContextMenuItem>
                                                    <ContextMenuItem onClick={() => { handleTabChange('settings'); setIsChatsMenuOpen(false); }}>
                                                        <Settings size={18} style={{ opacity: 0.8 }} />
                                                        Settings
                                                    </ContextMenuItem>
                                                    <ContextMenuItem onClick={() => { setIsLogoutModalOpen(true); setIsChatsMenuOpen(false); }}>
                                                        <LogOut size={18} style={{ opacity: 0.8 }} />
                                                        Log out
                                                    </ContextMenuItem>
                                                </ContextMenuContainer>
                                            </>
                                        )}
                                    </div>
                                </div>}
                            </div>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                backgroundColor: 'var(--colors-bg)', 
                                padding: '8px 12px', 
                                borderRadius: '8px', 
                                gap: '12px',
                                marginBottom: '16px'
                            }}>
                                <Search size={18} color="var(--colors-textMuted)" />
                                <input 
                                    type="text" 
                                    placeholder="Search communities"
                                    value={chatSearchQuery}
                                    onChange={(e) => setChatSearchQuery(e.target.value)}
                                    style={{ 
                                        border: 'none', 
                                        background: 'transparent', 
                                        outline: 'none', 
                                        color: 'var(--colors-textMain)', 
                                        fontSize: '0.95rem',
                                        width: '100%'
                                    }}
                                />
                            </div>
                        </div>

                        {conversations.filter(c => {
                            if (c.type !== 'group') return false;
                            if (!chatSearchQuery) return true;
                            return c.name.toLowerCase().includes(chatSearchQuery.toLowerCase());
                        }).length === 0 ? (
                            chatSearchQuery.trim() ? (
                                <div style={{ color: 'var(--colors-textMuted)', fontSize: '0.85rem', padding: '16px 20px', textAlign: 'center' }}>
                                    Group not found.
                                </div>
                            ) : (
                                <div 
                                    onClick={() => { setConvType('group'); setIsModalOpen(true); }}
                                    style={{ 
                                        color: 'var(--colors-accent)', 
                                        fontSize: '0.9rem', 
                                        padding: '16px 20px', 
                                        textAlign: 'center', 
                                        cursor: 'pointer',
                                        fontWeight: '500',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <Plus size={16} />
                                    <span>Start community</span>
                                </div>
                            )
                        ) : (
                            [...conversations].filter(c => {
                                if (c.type !== 'group') return false;
                                if (!chatSearchQuery) return true;
                                return c.name.toLowerCase().includes(chatSearchQuery.toLowerCase());
                            }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map(conv => (
                                <ChannelItem
                                    key={conv._id}
                                    active={activeConversationId === conv._id || selectedChats.includes(conv._id)}
                                    onClick={() => {
                                        if (consumeSuppressedSelectionClick()) return;
                                        if (isChatsSelectionMode) toggleChatSelection(conv._id);
                                        else { setActiveConversationId(conv._id); setCommunityTab('chat'); setIsLiveCodingOpen(false); setIsHackathonOpen(false); }
                                    }}
                                    onTouchStart={(e) => handleSelectableTouchStart(e, 'chat', conv)}
                                    onTouchMove={handleTouchMove}
                                    onTouchEnd={handleTouchEnd}
                                    onTouchCancel={handleTouchEnd}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        setContextMenu({ visible: true, x: e.pageX, y: e.pageY, message: null, callLog: null, conversation: conv });
                                    }}
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: 0,
                                        gap: '12px',
                                        alignItems: 'center',
                                        margin: 0,
                                        minHeight: '62px',
                                        boxSizing: 'border-box',
                                        borderBottom: 'none',
                                        backgroundColor: selectedChats.includes(conv._id) ? 'rgba(0, 168, 132, 0.16)' : (activeConversationId === conv._id ? 'rgba(255, 255, 255, 0.08)' : undefined)
                                    }}
                                    onMouseEnter={(e) => {
                                        const btn = e.currentTarget.querySelector('.conv-delete-btn');
                                        if (btn) btn.style.opacity = 1;
                                    }}
                                    onMouseLeave={(e) => {
                                        const btn = e.currentTarget.querySelector('.conv-delete-btn');
                                        if (btn) btn.style.opacity = 0;
                                    }}
                                >
                                    {isChatsSelectionMode && (
                                        <SelectionCheck
                                            type="button"
                                            selected={selectedChats.includes(conv._id)}
                                            aria-label={selectedChats.includes(conv._id) ? 'Deselect community' : 'Select community'}
                                            aria-pressed={selectedChats.includes(conv._id)}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleChatSelection(conv._id);
                                            }}
                                        >
                                            {selectedChats.includes(conv._id) && <Check size={14} strokeWidth={3} />}
                                        </SelectionCheck>
                                    )}
                                    <AvatarWrapper style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Avatar
                                            src={conv.avatarUrl || '/default-avatar.svg'}
                                            onError={(e) => { e.currentTarget.src = '/default-avatar.svg'; }}
                                            style={{ width: '48px', height: '48px', border: 'none', flexShrink: 0 }}
                                        />
                                    </AvatarWrapper>

                                    <div className="chat-item-text" style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, justifyContent: 'center', alignSelf: 'center', gap: '4px', padding: 0, margin: 0, boxSizing: 'border-box', borderBottom: 'none' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: 1.2, margin: 0, padding: 0 }}>
                                            <span style={{ fontSize: '0.94rem', fontWeight: conv.unreadCount > 0 ? '600' : '500', color: 'var(--colors-textMain, #ffffff)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>
                                                {conv.name}
                                            </span>
                                            {conv.lastMessage && (
                                                <span style={{ fontSize: '0.72rem', color: conv.unreadCount > 0 ? 'var(--colors-accent)' : 'var(--colors-textMuted)', flexShrink: 0, fontWeight: conv.unreadCount > 0 ? '600' : 'normal', lineHeight: 1.2 }}>
                                                    {formatMessageTime(conv.lastMessage.createdAt, false)}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: 1.2, margin: 0, padding: 0 }}>
                                            <span style={{ 
                                                fontSize: '0.82rem', 
                                                color: (conv.lastMessage?.content?.startsWith('$CALL_LOG$') && conv.lastMessage?.content?.includes('|missed') && String(conv.lastMessage?.sender?._id || conv.lastMessage?.sender) !== String(mongoUserId))
                                                    ? '#ef4444' 
                                                    : (conv.unreadCount > 0 ? 'var(--colors-textMain)' : 'var(--colors-textMuted)'), 
                                                fontWeight: (conv.unreadCount > 0 || (conv.lastMessage?.content?.startsWith('$CALL_LOG$') && conv.lastMessage?.content?.includes('|missed') && String(conv.lastMessage?.sender?._id || conv.lastMessage?.sender) !== String(mongoUserId))) ? '600' : 'normal', 
                                                whiteSpace: 'nowrap', 
                                                overflow: 'hidden', 
                                                textOverflow: 'ellipsis', 
                                                lineHeight: 1.2 
                                            }}>
                                                {formatLastMessagePreview(conv.lastMessage, mongoUserId)}
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {conv.unreadCount > 0 && (
                                                    <div style={{ backgroundColor: 'var(--colors-accent)', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '1px 6px', borderRadius: '10px', minWidth: '18px', textAlign: 'center', lineHeight: 1.2 }}>
                                                        {conv.unreadCount}
                                                    </div>
                                                )}
                                                {!isChatsSelectionMode && <IconButton
                                                    desktopOnly
                                                    className="conv-delete-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, message: null, callLog: null, conversation: conv });
                                                    }}
                                                    title="Options"
                                                    style={{ padding: '2px', height: '18px', width: '18px', opacity: 0, transition: 'opacity 0.2s', color: 'var(--colors-textMuted)', zIndex: 2 }}
                                                >
                                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                                </IconButton>}
                                            </div>
                                        </div>
                                    </div>
                                </ChannelItem>
                            ))
                        )}
                    </>
                )}

                {activeTab === 'settings' && (
                    <div style={{ padding: '16px 20px' }}>
                        <SidebarHeader>
                            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Settings</h2>
                        </SidebarHeader>
                        <div style={{ padding: '8px 0' }}>
                            <div style={{ backgroundColor: '$bg', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '$textMuted', marginBottom: '16px' }}>
                                <Search size={16} />
                                <input 
                                    type="text"
                                    placeholder="Search settings"
                                    value={settingsSearchQuery}
                                    onChange={(e) => setSettingsSearchQuery(e.target.value)}
                                    style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--colors-textMain)', fontSize: '0.9rem', width: '100%' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '16px' }}>
                                {/* Profile Section */}
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        padding: '16px 12px',
                                        cursor: 'pointer',
                                        backgroundColor: activeSettingTab === 'Profile' ? 'var(--colors-bg)' : 'transparent',
                                        borderRadius: '12px',
                                        marginBottom: '8px',
                                        transition: 'background-color 0.2s',
                                    }}
                                    onClick={() => setActiveSettingTab('Profile')}
                                    className="settings-item-profile"
                                >
                                    <img src={getAvatarUrl(currentUserData?.avatarUrl || user?.picture)} alt="Profile" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = '/default-avatar.svg'; }} />
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ color: 'var(--colors-textMain)', fontSize: '1.1rem', fontWeight: '500', marginBottom: '2px' }}>{currentUserData?.displayName || 'Profile'}</span>
                                        <span style={{ color: 'var(--colors-textMuted)', fontSize: '0.85rem' }}>{currentUserData?.about || 'Available'}</span>
                                    </div>
                                </div>

                                <div style={{ height: '1px', backgroundColor: 'var(--colors-border)', margin: '8px 0 16px 0' }} />

                                {[
                                    { id: 'Account', icon: <Key size={22} />, title: 'Account', sub: 'Security notifications, change number' },
                                    { id: 'Privacy', icon: <Lock size={22} />, title: 'Privacy', sub: 'Block contacts, disappearing messages' },
                                    { id: 'Chats', icon: <MessageSquare size={22} />, title: 'Chats', sub: 'Theme, wallpapers, chat settings' },
                                    { id: 'Notifications', icon: <Bell size={22} />, title: 'Notifications', sub: 'Message, group & call tones' },
                                    { id: 'Keyboard shortcuts', icon: <Monitor size={22} />, title: 'Keyboard shortcuts', sub: 'Quick actions' },
                                    { id: 'Help', icon: <HelpCircle size={22} />, title: 'Help', sub: 'Help centre, contact us, privacy policy' }
                                ].filter(item => item.title.toLowerCase().includes(settingsSearchQuery.toLowerCase()) || item.sub.toLowerCase().includes(settingsSearchQuery.toLowerCase())).map((item, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '20px',
                                            padding: '14px 12px',
                                            cursor: 'pointer',
                                            backgroundColor: activeSettingTab === item.id ? 'var(--colors-bg)' : 'transparent',
                                            borderRadius: '8px',
                                            transition: 'background-color 0.2s',
                                        }}
                                        className="settings-item"
                                        onClick={() => setActiveSettingTab(item.id)}
                                    >
                                        <div style={{ color: 'var(--colors-textMuted)', width: '28px', display: 'flex', justifyContent: 'center' }}>{item.icon}</div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ color: 'var(--colors-textMain)', fontSize: '1rem', marginBottom: '2px' }}>{item.title}</span>
                                            <span style={{ color: 'var(--colors-textMuted)', fontSize: '0.8rem' }}>{item.sub}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'status' && (
                    <ErrorBoundary>
                        <StatusSection
                            groupedStatuses={groupedStatuses}
                            myGroupedStatuses={myGroupedStatuses}
                            otherGroupedStatuses={otherGroupedStatuses}
                            mongoUserId={mongoUserId}
                            currentUserData={currentUserData}
                            onOpenStory={(userIndex) => setStoryViewerInitialUserIndex(userIndex)}
                            onOpenCreateStatus={(mode) => {
                                setStatusUploadMode(mode || 'text');
                                setIsStatusModalOpen(true);
                            }}
                            onDeleteStatus={handleDeleteStatus}
                            onForwardStatus={handleForwardStatus}
                            onReshareStatus={handleReshareStatus}
                            formatMessageTime={formatMessageTime}
                            isMobileViewport={isMobileViewport}
                            showToast={showToast}
                        />
                    </ErrorBoundary>
                )}
            </Sidebar>

            <ChatArea className={!showChatArea ? 'mobile-hidden' : ''}>
                {activeTab === 'settings' && activeSettingTab ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, backgroundColor: 'var(--colors-bg)', overflow: 'hidden' }}>
                        {activeSettingTab === 'Profile' ? (
                            <ProfilePane onBack={() => setActiveSettingTab(null)} currentUser={currentUserData} onUpdateProfile={handleUpdateProfile} getAccessTokenSilently={getAccessTokenSilently} BACKEND_URL={BACKEND_URL} onViewProfilePicture={(image) => openMediaViewer(image, 'image', 'Profile picture')} />
                        ) : activeSettingTab === 'Account' ? (
                            <AccountPane onBack={() => setActiveSettingTab(null)} settings={appSettings} updateSetting={updateSetting} currentUser={currentUserData} onDeleteAccount={handleDeleteAccount} showToast={showToast} />
                        ) : activeSettingTab === 'Privacy' ? (
                            <PrivacyPane onBack={() => setActiveSettingTab(null)} settings={appSettings} updateSetting={updateSetting} blockedUsers={currentUserData?.blockedUsers || []} onUnblockUser={handleUnblockUser} onBlockUser={handleBlockUser} contacts={availableContacts} showToast={showToast} />
                        ) : activeSettingTab === 'Chats' ? (
                            <ChatsPane onBack={() => setActiveSettingTab(null)} settings={appSettings} updateSetting={updateSetting} getAccessTokenSilently={getAccessTokenSilently} BACKEND_URL={BACKEND_URL} showToast={showToast} />
                        ) : activeSettingTab === 'Notifications' ? (
                            <NotificationsPane onBack={() => setActiveSettingTab(null)} settings={appSettings} updateSetting={updateSetting} showToast={showToast} />
                        ) : activeSettingTab === 'Keyboard shortcuts' ? (
                            <KeyboardShortcutsPane onBack={() => setActiveSettingTab(null)} />
                        ) : activeSettingTab === 'Help' ? (
                            <HelpPane onBack={() => setActiveSettingTab(null)} currentUser={currentUserData} showToast={showToast} />
                        ) : null}
                    </div>
                ) : activeTab === 'settings' ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--colors-bg)', overflow: 'hidden', position: 'relative' }}>
                        <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'var(--colors-accent)', filter: 'blur(200px)', opacity: 0.15, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                        <div style={{ 
                            width: '140px', height: '140px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(6,182,212,0.05) 100%)', 
                            border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', 
                            boxShadow: '0 0 40px rgba(6,182,212,0.15), inset 0 0 20px rgba(6,182,212,0.1)', position: 'relative', zIndex: 1
                        }}>
                            <Settings size={64} color="var(--colors-accent)" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.5))' }} />
                        </div>
                        <h2 style={{ color: 'var(--colors-textMain)', fontSize: '2.5rem', marginBottom: '16px', fontWeight: '500', letterSpacing: '-0.5px', position: 'relative', zIndex: 1, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Settings</h2>
                        <p style={{ color: 'var(--colors-textMuted)', fontSize: '1.1rem', maxWidth: '400px', textAlign: 'center', lineHeight: '1.6', position: 'relative', zIndex: 1 }}>
                            Configure your workspace and tailor the DevSup experience. Select an option from the sidebar to begin.
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '40px', color: 'var(--colors-textMuted)', fontSize: '0.85rem', position: 'relative', zIndex: 1 }}>
                            <Lock size={14} />
                            <span>Your preferences are synced securely across all devices</span>
                        </div>
                    </div>
                ) : activeTab === 'status' ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--colors-bg)', overflow: 'hidden', position: 'relative', padding: '24px' }}>
                        <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'var(--colors-accent)', filter: 'blur(200px)', opacity: 0.15, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                        <div style={{ 
                            width: '130px', height: '130px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0, 168, 132, 0.18) 0%, rgba(15, 23, 42, 0.4) 100%)', 
                            border: '2px solid rgba(0, 168, 132, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px', 
                            boxShadow: '0 0 40px rgba(0, 168, 132, 0.2), inset 0 0 20px rgba(0, 168, 132, 0.15)', position: 'relative', zIndex: 1
                        }}>
                            <Code2 size={60} color="var(--colors-accent, #00a884)" strokeWidth={1.8} style={{ filter: 'drop-shadow(0 0 8px rgba(0, 168, 132, 0.5))' }} />
                        </div>
                        <h2 style={{ color: 'var(--colors-textMain)', fontSize: '2rem', marginBottom: '12px', fontWeight: '600', letterSpacing: '-0.4px', position: 'relative', zIndex: 1, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Status updates</h2>
                        <p style={{ color: 'var(--colors-textMuted)', fontSize: '1rem', maxWidth: '380px', textAlign: 'center', lineHeight: '1.55', position: 'relative', zIndex: 1, margin: '0 0 24px 0' }}>
                            Click on a contact to view their status update, or share photos, videos, and code snippets with your developer network.
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '24px', color: 'var(--colors-textMuted)', fontSize: '0.85rem', position: 'relative', zIndex: 1 }}>
                            <Lock size={14} color="var(--colors-accent)" />
                            <span>Your status updates are end-to-end encrypted</span>
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
                        <h2 style={{ color: 'var(--colors-textMain)', fontSize: '2.5rem', marginBottom: '16px', fontWeight: '500', letterSpacing: '-0.5px', position: 'relative', zIndex: 1, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Calls</h2>
                        <p style={{ color: 'var(--colors-textMuted)', fontSize: '1.1rem', maxWidth: '400px', textAlign: 'center', lineHeight: '1.6', position: 'relative', zIndex: 1 }}>
                            Connect instantly with crystal-clear voice and video. Start a call from any of your chats.
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '40px', color: 'var(--colors-textMuted)', fontSize: '0.85rem', position: 'relative', zIndex: 1 }}>
                            <Lock size={14} />
                            <span>End-to-end encrypted calls</span>
                        </div>
                    </div>
                ) : activeConversation ? (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0 }}>
                            <ChatHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                                    <>
                                        <MobileBackButton onClick={() => setActiveConversationId(null)}>
                                            <ArrowLeft size={24} />
                                        </MobileBackButton>
                                        <div
                                            onClick={() => setIsDrawerOpen(true)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1, minWidth: 0 }}
                                            title={activeConversation.type === 'group' ? 'View Group Info' : 'View Contact Info'}
                                        >
                                            <AvatarWrapper style={{ flexShrink: 0 }}>
                                                <Avatar
                                                    src={activeConversation.type === 'group'
                                                        ? getAvatarUrl(activeConversation.avatarUrl)
                                                        : getAvatarUrl(activeConversation.participants?.find(p => String(p._id || p) !== String(mongoUserId))?.avatarUrl)}
                                                    onError={(e) => { e.currentTarget.src = '/default-avatar.svg'; }}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        const otherP = activeConversation.participants?.find(p => String(p._id || p) !== String(mongoUserId));
                                                        const image = activeConversation.type === 'group'
                                                            ? activeConversation.avatarUrl
                                                            : otherP?.avatarUrl;
                                                        openMediaViewer(image || '/default-avatar.svg', 'image', activeConversation.type === 'group'
                                                            ? activeConversation.name
                                                            : otherP?.displayName || 'Profile picture');
                                                    }}
                                                    style={{ width: '40px', height: '40px', flexShrink: 0, cursor: 'zoom-in' }}
                                                />
                                            </AvatarWrapper>
                                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                                <span style={{ fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                                    {(() => {
                                                        const name = activeConversation.type === 'group'
                                                            ? activeConversation.name
                                                            : (activeConversation.participants?.find(p => p._id !== mongoUserId)?.displayName || 'Direct Message');
                                                        return (
                                                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{name}</span>
                                                        );
                                                    })()}
                                                    {mutedConversations.includes(activeConversation._id) && <BellOff size={14} color="var(--colors-textMuted)" style={{ flexShrink: 0 }} />}
                                                    {disappearingConversations.includes(activeConversation._id) && <Timer size={14} color="var(--colors-accent)" style={{ flexShrink: 0 }} />}
                                                </span>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--colors-textMuted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {(() => {
                                                        if (activeConversation.type === 'group') {
                                                            return activeConversation.participants?.map(p => p._id === mongoUserId ? 'You' : p.displayName).join(', ');
                                                        }
                                                        const other = activeConversation.participants?.find(p => p._id !== mongoUserId);
                                                        return (
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                                <span>{other?.username ? `@${other.username}` : 'click here for contact info'}</span>
                                                                {other?.githubVerified && (
                                                                    <span title={`Verified GitHub Developer (@${other.githubUsername})`} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#10b981', fontSize: '0.72rem', backgroundColor: 'rgba(16, 185, 129, 0.12)', padding: '1px 6px', borderRadius: '10px' }}>
                                                                        <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path></svg>
                                                                        <span>@{other.githubUsername}</span>
                                                                    </span>
                                                                )}
                                                            </span>
                                                        );
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
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
                                                outline: 'none',
                                                width: '120px'
                                            }}
                                        />
                                    )}
                                    {activeConversation.type === 'group' && (
                                        activeConversation.admins?.includes(mongoUserId) || 
                                        activeConversation.allowAnyMemberToAdd || 
                                        (!activeConversation.admins?.length && activeConversation.participants?.[0]?._id === mongoUserId)
                                    ) && (
                                        <IconButton desktopOnly onClick={() => setIsAddMembersModalOpen(true)} title="Add Members">
                                            <UserPlus size={20} />
                                        </IconButton>
                                    )}
                                    <IconButton 
                                        onClick={() => {
                                            if (isDirectChatBlocked) {
                                                showToast('Cannot call a blocked contact. Unblock them first.');
                                                return;
                                            }
                                            setCallConfig({
                                                active: true,
                                                isReceiving: false,
                                                callerData: null,
                                                callType: 'video',
                                                targetUserId: directChatPartner ? String(directChatPartner._id || directChatPartner) : null,
                                                targetUser: directChatPartner || null,
                                                conversationId: activeConversation?._id
                                            });
                                        }} 
                                        title="Video Call"
                                    >
                                        <Video size={20} />
                                    </IconButton>
                                    <IconButton 
                                        onClick={() => {
                                            if (isDirectChatBlocked) {
                                                showToast('Cannot call a blocked contact. Unblock them first.');
                                                return;
                                            }
                                            setCallConfig({
                                                active: true,
                                                isReceiving: false,
                                                callerData: null,
                                                callType: 'audio',
                                                targetUserId: directChatPartner ? String(directChatPartner._id || directChatPartner) : null,
                                                targetUser: directChatPartner || null,
                                                conversationId: activeConversation?._id
                                            });
                                        }} 
                                        title="Voice Call"
                                    >
                                        <Phone size={20} />
                                    </IconButton>
                                    <IconButton desktopOnly onClick={() => setIsSearchOpen(!isSearchOpen)} title="Search" style={{ color: isSearchOpen ? 'var(--colors-accent)' : 'inherit' }}>
                                        <Search size={20} />
                                    </IconButton>
                                    <IconButton
                                        desktopOnly
                                        onClick={() => {
                                            if (activeTab === 'communities') {
                                                setCommunityTab('live coding');
                                            } else {
                                                setIsWhiteboardOpen(true);
                                            }
                                        }}
                                        title="Open Whiteboard"
                                        style={{ color: isWhiteboardOpen || (activeTab === 'communities' && communityTab === 'live coding') ? 'var(--colors-accent)' : 'inherit' }}
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
                                                <ContextMenuContainer style={{ top: '100%', right: 0, marginTop: '12px', zIndex: 2000 }}>
                                                    <ContextMenuItem onClick={() => { setIsDrawerOpen(true); setIsHeaderMenuOpen(false); }}>
                                                        <Info size={18} style={{ opacity: 0.8 }} />
                                                        {activeConversation.type === 'group' ? 'Group info' : 'Contact info'}
                                                    </ContextMenuItem>
                                                    <ContextMenuItem onClick={() => { setIsSearchOpen(!isSearchOpen); setIsHeaderMenuOpen(false); }}>
                                                        <Search size={18} style={{ opacity: 0.8 }} />
                                                        Search
                                                    </ContextMenuItem>
                                                    {!isMobileViewport && <ContextMenuItem onClick={() => {
                                                        if (activeTab === 'communities') {
                                                            setCommunityTab('live coding');
                                                        } else {
                                                            setIsWhiteboardOpen(true);
                                                        }
                                                        setIsHeaderMenuOpen(false);
                                                    }}>
                                                        <Brush size={18} style={{ opacity: 0.8 }} />
                                                        Whiteboard
                                                    </ContextMenuItem>}
                                                    <ContextMenuItem onClick={() => { 
                                                        setCallConfig({
                                                            active: true,
                                                            isReceiving: false,
                                                            callerData: null,
                                                            callType: 'video',
                                                            targetUserId: directChatPartner ? String(directChatPartner._id || directChatPartner) : null,
                                                            targetUser: directChatPartner || null,
                                                            conversationId: activeConversation?._id
                                                        });
                                                        setIsHeaderMenuOpen(false); 
                                                    }}>
                                                        <Video size={18} style={{ opacity: 0.8 }} />
                                                        {activeConversation.type === 'group' ? 'Group calls' : 'Calls'}
                                                    </ContextMenuItem>
                                                    {!isMobileViewport && (
                                                        <>
                                                            <ContextMenuItem onClick={() => { 
                                                                if (activeTab === 'communities') {
                                                                    setCommunityTab('live coding');
                                                                } else {
                                                                    setIsLiveCodingOpen(true);
                                                                    setIsHackathonOpen(false);
                                                                }
                                                                setIsHeaderMenuOpen(false); 
                                                            }}>
                                                                <Code2 size={18} style={{ opacity: 0.8 }} />
                                                                Live coding features
                                                            </ContextMenuItem>
                                                            <ContextMenuItem onClick={() => { 
                                                                if (activeTab === 'communities') {
                                                                    setCommunityTab('hackathons');
                                                                } else {
                                                                    setIsHackathonOpen(true);
                                                                    setIsLiveCodingOpen(false);
                                                                }
                                                                setIsHeaderMenuOpen(false); 
                                                            }}>
                                                                <Rocket size={18} style={{ opacity: 0.8 }} />
                                                                Hackathon
                                                            </ContextMenuItem>
                                                        </>
                                                    )}
                                                    <ContextMenuItem onClick={() => { 
                                                        if (isSelectingCurrentMessages) {
                                                            cancelMessageSelection();
                                                            showToast('Selection mode disabled');
                                                        } else {
                                                            setIsSelectingMessages(true);
                                                            setSelectedMessages([]);
                                                            setMessageSelectionConversationId(activeConversationId);
                                                            showToast('Select messages to delete');
                                                        }
                                                        setIsHeaderMenuOpen(false); 
                                                    }}>
                                                        {isSelectingCurrentMessages ? <XCircle size={18} style={{ opacity: 0.8 }} /> : <CheckSquare size={18} style={{ opacity: 0.8 }} />}
                                                        {isSelectingCurrentMessages ? 'Cancel selection' : 'Select messages'}
                                                    </ContextMenuItem>
                                                    <ContextMenuItem onClick={() => { setActiveConversationId(null); setIsHeaderMenuOpen(false); }}>
                                                        <X size={18} style={{ opacity: 0.8 }} />
                                                        Close chat
                                                    </ContextMenuItem>
                                                    <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '4px 8px' }} />
                                                    <ContextMenuItem onClick={() => { 
                                                        const isMuted = mutedConversations.includes(activeConversation._id);
                                                        if (isMuted) {
                                                            setMutedConversations(prev => prev.filter(id => id !== activeConversation._id));
                                                            showToast('Notifications unmuted');
                                                        } else {
                                                            setMutedConversations(prev => [...prev, activeConversation._id]);
                                                            showToast('Notifications muted');
                                                        }
                                                        setIsHeaderMenuOpen(false); 
                                                    }}>
                                                        {mutedConversations.includes(activeConversation._id) ? <Bell size={18} style={{ opacity: 0.8 }} /> : <BellOff size={18} style={{ opacity: 0.8 }} />}
                                                        {mutedConversations.includes(activeConversation._id) ? 'Unmute notifications' : 'Mute notifications'}
                                                    </ContextMenuItem>
                                                    <ContextMenuItem onClick={() => { 
                                                        const isDisappearing = disappearingConversations.includes(activeConversation._id);
                                                        if (isDisappearing) {
                                                            setDisappearingConversations(prev => prev.filter(id => id !== activeConversation._id));
                                                            showToast('Disappearing messages turned off');
                                                        } else {
                                                            setDisappearingConversations(prev => [...prev, activeConversation._id]);
                                                            showToast('Messages will now disappear after 24 hours');
                                                        }
                                                        setIsHeaderMenuOpen(false); 
                                                    }}>
                                                        <Timer size={18} style={{ opacity: 0.8 }} />
                                                        {disappearingConversations.includes(activeConversation._id) ? 'Keep messages permanently' : 'Disappearing messages'}
                                                    </ContextMenuItem>
                                                    <ContextMenuItem onClick={() => { setMessages([]); showToast('Messages cleared from this device'); setIsHeaderMenuOpen(false); }}>
                                                        <Eraser size={18} style={{ opacity: 0.8 }} />
                                                        Clear messages
                                                    </ContextMenuItem>
                                                    <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '4px 8px' }} />
                                                    <ContextMenuItem onClick={(e) => { 
                                                        if (activeConversation.type === 'group') {
                                                            socket.emit('leave_conversation', { conversationId: activeConversation._id, userId: mongoUserId });
                                                        } else {
                                                            deleteConversation(e, activeConversation._id); 
                                                        }
                                                        setIsHeaderMenuOpen(false); 
                                                    }} style={{ color: '#ef4444' }}>
                                                        <LogOut size={18} style={{ opacity: 0.8 }} />
                                                        {activeConversation.type === 'group' ? 'Exit group' : 'Delete chat'}
                                                    </ContextMenuItem>
                                                </ContextMenuContainer>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </ChatHeader>

                            {!isMobileViewport && activeTab === 'communities' && activeConversation.type === 'group' && (
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

                            {isLiveCodingOpen ? (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minHeight: 0 }}>
                                    <Suspense fallback={null}>
                                        <LiveCodingWorkspace
                                            onClose={() => setIsLiveCodingOpen(false)}
                                            onSendToChat={(codeSnippet) => {
                                                sendMessage({
                                                    conversationId: activeConversationId,
                                                    senderId: mongoUserId,
                                                    content: codeSnippet,
                                                    isCodeSnippet: true,
                                                    language: 'javascript'
                                                });
                                                setIsLiveCodingOpen(false);
                                            }}
                                            activeConversationName={activeConversation.name || (otherParticipant?.displayName) || 'Chat'}
                                            conversationId={activeConversationId}
                                            socket={socket}
                                            currentUser={{ _id: mongoUserId, displayName: user?.displayName || user?.name || user?.nickname }}
                                        />
                                    </Suspense>
                                </div>
                            ) : isHackathonOpen ? (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minHeight: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--colors-border)', background: 'var(--colors-surface)' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--colors-textMain)' }}>Hackathons &amp; Competitions</span>
                                        <button onClick={() => setIsHackathonOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--colors-textMuted)', cursor: 'pointer' }}>
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                                        <Suspense fallback={null}><EventsView type="hackathons" /></Suspense>
                                    </div>
                                </div>
                            ) : (!activeConversation || activeTab === 'chats' || (activeTab === 'communities' && communityTab === 'chat')) ? (
                                <>
                                    <MessageList
                                        ref={messageListRef}
                                        onScroll={handleMessageListScroll}
                                        style={{
                                        '--wallpaper-url': appSettings.wallpaperUrl === '' ? 'none' : (appSettings.wallpaperUrl ? `url("${appSettings.wallpaperUrl}")` : 'url("/chat-bg.jpg")'),
                                        '--wallpaper-darken': 1 - (appSettings.wallpaperBrightness !== undefined ? appSettings.wallpaperBrightness : 100) / 100,
                                        '--wallpaper-size': appSettings.wallpaperType === 'custom' ? 'cover' : '380px',
                                        '--wallpaper-bg-color': appSettings.wallpaperBgColor || '#0b141a',
                                        flex: 1
                                    }}>
                                        
                                                                                
                                        {messages.length === 0 ? (
                                            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                                                Welcome to the beginning of the conversation.
                                            </div>
                                        ) : (
                                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'flex-start' }}>
                                                {[...messages].sort(compareMessages).filter(msg => {
                                                    const senderId = String(msg.sender?._id || msg.sender || '');
                                                    const isOwnMessage = Boolean(senderId && mongoUserId && senderId === String(mongoUserId));
                                                    
                                                    if (msg.isDeletedForEveryone && isOwnMessage) {
                                                        return false;
                                                    }
                                                    
                                                    return !searchQuery || (msg.content && (typeof msg.content === 'string') && msg.content.toLowerCase().includes(searchQuery.toLowerCase()));
                                                }).map((msg, index, array) => {

                                                    const senderId = String(msg.sender?._id || msg.sender || '');
                                                    const isOwnMessage = Boolean(senderId && mongoUserId && senderId === String(mongoUserId));
                                                    const isGroup = activeConversation?.type === 'group';
                                                    const showSenderName = isGroup && !isOwnMessage && !msg.isDeletedForEveryone;
                                                    const isOnlyUrl = (msg.content && typeof msg.content === 'string') && (msg.content.trim().startsWith('http') || msg.content.trim().startsWith('data:')) && !msg.content.trim().includes(' ');
                                                    const embedDataTop = isOnlyUrl && msg.content.trim().startsWith('http') ? detectEcosystemLink(msg.content) : null;
                                                    const isEmbedOnly = isOnlyUrl && !!embedDataTop;
                                                    const isWhiteboardMessage = !msg.isDeletedForEveryone && (
                                                        msg.attachmentType === 'whiteboard' ||
                                                        (typeof msg.content === 'string' && msg.content.startsWith('data:image/')) ||
                                                        (typeof msg.attachmentName === 'string' && msg.attachmentName.toLowerCase().includes('whiteboard')) ||
                                                        (typeof msg.caption === 'string' && msg.caption.toLowerCase().includes('mock-up'))
                                                    );
                                                    const isStatusReplyMsg = !msg.isDeletedForEveryone && typeof msg.content === 'string' && (msg.content.startsWith('$STATUS_REPLY$') || msg.content.startsWith('[Status:'));
                                                    const isImageMsg = !msg.isDeletedForEveryone && !isWhiteboardMessage && !isStatusReplyMsg && isImageUrl(msg.content, msg.attachmentType);
                                                    const isVideoMsg = !msg.isDeletedForEveryone && !isWhiteboardMessage && !isStatusReplyMsg && isVideoUrl(msg.content, msg.attachmentType);
                                                    const isCodeMsg = !msg.isDeletedForEveryone && !isWhiteboardMessage && !isStatusReplyMsg && (
                                                        !!msg.isCodeSnippet ||
                                                        (typeof msg.content === 'string' && msg.content.trim().startsWith('```') && msg.content.trim().endsWith('```'))
                                                    );
                                                    const isDocMsg = !msg.isDeletedForEveryone && !isWhiteboardMessage && !isStatusReplyMsg && !isImageMsg && !isVideoMsg && !isCodeMsg && (
                                                        (isCloudinaryUrl(msg.content) && !isAudioUrl(msg.content, msg.attachmentType)) ||
                                                        (typeof msg.attachmentName === 'string' && msg.attachmentName.length > 0 && !isAudioUrl(msg.content, msg.attachmentType)) ||
                                                        (msg.attachmentType && !['whiteboard', 'audio'].some(t => msg.attachmentType.includes(t)) && (msg.attachmentType.includes('pdf') || msg.attachmentType.includes('document') || msg.attachmentType.includes('sheet') || msg.attachmentType.includes('zip') || msg.attachmentType.includes('text') || msg.attachmentType.includes('octet-stream')))
                                                    );
                                                    const hasVisualMedia = isImageMsg || isVideoMsg;
                                                    const hasThinBorder = isImageMsg || isVideoMsg || isCodeMsg || isDocMsg;
                                                    const isMediaMessage = !msg.isDeletedForEveryone && !isWhiteboardMessage && !isStatusReplyMsg && (
                                                        isCodeMsg || hasVisualMedia || isDocMsg
                                                    );
                                                    const isImageWithCaption = (hasVisualMedia || isDocMsg) && !!msg.caption;

                                                    const renderStatusTicks = () => {
                                                        if (!isOwnMessage) return null;
                                                        const receiptsEnabled = appSettings.readReceipts !== false;
                                                        const readCount = msg.readBy
                                                            ? msg.readBy.filter(id => String(id?._id || id) !== String(mongoUserId)).length
                                                            : 0;
                                                        const deliveredCount = msg.deliveredTo
                                                            ? msg.deliveredTo.filter(id => String(id?._id || id) !== String(mongoUserId)).length
                                                            : 0;

                                                        if (readCount > 0 && receiptsEnabled) {
                                                            return <CheckCheck size={14} color="#06B6D4" title="Read" />;
                                                        } else if (deliveredCount > 0 || (readCount > 0 && !receiptsEnabled)) {
                                                            return <CheckCheck size={14} color="rgba(255,255,255,0.6)" title="Delivered" />;
                                                        } else {
                                                            return <Check size={14} color="rgba(255,255,255,0.6)" title="Sent" />;
                                                        }
                                                    };

                                                    const renderInlineTimestamp = (extraMargin = '12px') => (
                                                        <span style={{
                                                            float: 'right',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '3px',
                                                            marginLeft: extraMargin,
                                                            marginTop: '6px',
                                                            position: 'relative',
                                                            bottom: '-2px',
                                                            fontSize: isMobileViewport ? '0.62rem' : '0.65rem',
                                                            color: isOwnMessage ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.6)',
                                                            whiteSpace: 'nowrap',
                                                            userSelect: 'none',
                                                            lineHeight: 1
                                                        }}>
                                                            {msg.isEdited && <i style={{ marginRight: '3px', fontSize: '0.6rem' }}>edited</i>}
                                                            <span>{formatMessageClock(msg.createdAt)}</span>
                                                            {isOwnMessage && (
                                                                <span style={{ marginLeft: '3px', display: 'inline-flex', alignItems: 'center' }}>
                                                                    {renderStatusTicks()}
                                                                </span>
                                                            )}
                                                        </span>
                                                    );

                                                    const renderOverlayTimestamp = () => (
                                                        <div style={{
                                                            position: 'absolute',
                                                            bottom: '8px',
                                                            right: '8px',
                                                            backgroundColor: 'rgba(0, 0, 0, 0.55)',
                                                            backdropFilter: 'blur(4px)',
                                                            WebkitBackdropFilter: 'blur(4px)',
                                                            padding: '2px 6px',
                                                            borderRadius: '10px',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '3px',
                                                            fontSize: '0.65rem',
                                                            color: '#ffffff',
                                                            userSelect: 'none',
                                                            pointerEvents: 'none',
                                                            zIndex: 2,
                                                            lineHeight: 1
                                                        }}>
                                                            {msg.isEdited && <i style={{ marginRight: '3px', fontSize: '0.6rem' }}>edited</i>}
                                                            <span>{formatMessageClock(msg.createdAt)}</span>
                                                            {isOwnMessage && (
                                                                <span style={{ marginLeft: '3px', display: 'inline-flex', alignItems: 'center' }}>
                                                                    {renderStatusTicks()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                    
                                                    const prevMsg = index > 0 ? array[index - 1] : null;
                                                    const showDateSeparator = !prevMsg || formatMessageDate(msg.createdAt) !== formatMessageDate(prevMsg.createdAt);
                                                    
                                                    return (
                                                        <div key={msg._id || msg.createdAt} style={{ display: 'contents' }}>
                                                            {showDateSeparator && (
                                                                <div style={{ 
                                                                    width: '100%', 
                                                                    display: 'flex', 
                                                                    justifyContent: 'center', 
                                                                    margin: '32px 0 16px 0',
                                                                    opacity: showMessageDateLabel ? 1 : 0,
                                                                    transition: 'opacity 300ms ease'
                                                                }}>
                                                                    <div style={{
                                                                        backgroundColor: 'rgba(30, 41, 59, 0.85)',
                                                                        backdropFilter: 'blur(8px)',
                                                                        padding: '6px 16px',
                                                                        borderRadius: '16px',
                                                                        fontSize: '0.85rem',
                                                                        fontWeight: '500',
                                                                        color: '#fff',
                                                                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                                                                    }}>
                                                                        {formatMessageDate(msg.createdAt)}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div id={`message-${msg._id || msg.createdAt}`} data-message-date={formatMessageDate(msg.createdAt)} style={{ 
                                                            display: 'flex', 
                                                            flexDirection: isOwnMessage ? 'row-reverse' : 'row', 
                                                            alignItems: 'center', 
                                                            gap: isMobileViewport ? '6px' : '12px', 
                                                            width: '100%',
                                                            padding: isMobileViewport ? '1px 2px' : '4px 8px',
                                                            borderRadius: '8px',
                                                            backgroundColor: selectedMessages.includes(msg._id || msg.createdAt)
                                                                ? 'rgba(0, 168, 132, 0.16)'
                                                                : ((contextMenu.visible && contextMenu.message?._id === (msg._id || msg.createdAt)) ? 'rgba(6, 182, 212, 0.2)' : 'transparent'),
                                                            transition: 'background-color 0.2s ease',
                                                        }}
                                                        onClick={() => {
                                                            if (isSelectingCurrentMessages) toggleMessageSelection(msg._id || msg.createdAt);
                                                        }}
                                                        >
                                                            <ChatBubbleWrapper
                                                                as={motion.div}
                                                                drag="x"
                                                                dragConstraints={{ left: 0, right: 0 }}
                                                                dragElastic={{ left: 0, right: 0.5 }}
                                                                onDragEnd={(e, info) => {
                                                                    if (info.offset.x > 50) {
                                                                        setReplyingToMessage(msg);
                                                                        if (inputRef.current) inputRef.current.focus();
                                                                    }
                                                                }}
                                                                isOwn={isOwnMessage}
                                                                style={{ flex: 1, maxWidth: '100%', alignItems: isOwnMessage ? 'flex-end' : 'flex-start', gap: isSelectingCurrentMessages ? '10px' : undefined }}
                                                            >
                                                                {isSelectingCurrentMessages && (
                                                                    <SelectionCheck
                                                                        type="button"
                                                                        selected={selectedMessages.includes(msg._id || msg.createdAt)}
                                                                        aria-label={selectedMessages.includes(msg._id || msg.createdAt) ? 'Deselect message' : 'Select message'}
                                                                        aria-pressed={selectedMessages.includes(msg._id || msg.createdAt)}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            toggleMessageSelection(msg._id || msg.createdAt);
                                                                        }}
                                                                    >
                                                                        {selectedMessages.includes(msg._id || msg.createdAt) && <Check size={14} strokeWidth={3} />}
                                                                    </SelectionCheck>
                                                                )}
                                                                <ChatBubble
                                                                isOwn={isOwnMessage}
                                                                mediaOnly={hasVisualMedia && !msg.caption}
                                                                embedOnly={isEmbedOnly}
                                                                style={
                                                                    hasThinBorder
                                                                        ? { padding: msg.caption ? '3px 3px 6px 3px' : '3px' }
                                                                        : (isWhiteboardMessage ? { width: 'fit-content', maxWidth: '360px', padding: '10px 10px 10px 10px' } : {})
                                                                }
                                                                onContextMenu={(e) => {
                                                                    if (!msg.isDeletedForEveryone) handleContextMenu(e, 'message', msg);
                                                                }}
                                                                onTouchStart={(e) => {
                                                                    if (!msg.isDeletedForEveryone) handleTouchStart(e, msg);
                                                                }}
                                                                onTouchMove={handleTouchMove}
                                                                onTouchEnd={handleTouchEnd}
                                                                onTouchCancel={handleTouchEnd}
                                                            >
                                                                {showSenderName && (
                                                                    <SenderName style={{
                                                                        color: activeConversation?.type === 'group' ? getDailyUserColor(msg.sender?._id) : undefined,
                                                                        ...(hasThinBorder ? { padding: '4px 6px 2px 6px' } : {})
                                                                    }}>
                                                                        {msg.sender?.displayName || 'Unknown User'}
                                                                        {msg.sender?.username && (
                                                                            <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: '6px', fontWeight: '400' }}>
                                                                                @{msg.sender.username}
                                                                            </span>
                                                                        )}
                                                                    </SenderName>
                                                                )}

                                                                <div style={{ wordBreak: 'break-word', marginTop: showSenderName && !hasThinBorder ? '2px' : '0', maxWidth: hasVisualMedia ? '320px' : isWhiteboardMessage ? '340px' : isDocMsg ? '320px' : 'none' }}>
                                                                    {msg.isDeletedForEveryone ? (
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--colors-textMuted)', fontStyle: 'italic' }}>
                                                                            <Trash2 size={14} />
                                                                            <span>{isOwnMessage ? 'You deleted this message' : 'This message was deleted'}</span>
                                                                            {renderInlineTimestamp('12px')}
                                                                        </div>
                                                                    ) : (
                                                                    <>
                                                                    {msg.replyTo && (
                                                                        <div 
                                                                            onClick={() => {
                                                                                const el = document.getElementById(`message-${msg.replyTo._id}`);
                                                                                if (el) {
                                                                                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                                    el.style.backgroundColor = 'rgba(6, 182, 212, 0.3)';
                                                                                    setTimeout(() => { el.style.backgroundColor = 'transparent' }, 1000);
                                                                                }
                                                                            }}
                                                                            style={{
                                                                                backgroundColor: 'rgba(0, 0, 0, 0.15)',
                                                                                borderLeft: `4px solid ${isOwnMessage ? 'rgba(255, 255, 255, 0.6)' : 'var(--colors-accent)'}`,
                                                                                padding: '6px 10px',
                                                                                borderRadius: '6px',
                                                                                marginBottom: '6px',
                                                                                fontSize: '0.85rem',
                                                                                cursor: 'pointer',
                                                                            }}
                                                                        >
                                                                            <div style={{ color: isOwnMessage ? 'rgba(255, 255, 255, 0.9)' : 'var(--colors-accent)', fontWeight: 'bold', marginBottom: '2px' }}>
                                                                                {msg.replyTo.sender?.displayName || 'Unknown'}
                                                                            </div>
                                                                            <div style={{ opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }}>
                                                                                {msg.replyTo.isDeletedForEveryone
                                                                                    ? 'This message was deleted'
                                                                                    : (typeof msg.replyTo.content === 'string' && msg.replyTo.content.startsWith('$CALL_LOG$'))
                                                                                        ? (msg.replyTo.content.includes('|video') ? '📹 Video call' : '📞 Voice call')
                                                                                        : (typeof msg.replyTo.content === 'string' && (msg.replyTo.content.startsWith('$STATUS_REPLY$') || msg.replyTo.content.startsWith('[Status:')))
                                                                                            ? (() => {
                                                                                                const parsed = parseStatusReply(msg.replyTo.content);
                                                                                                const icon = parsed?.type === 'video' ? '🎥' : parsed?.type === 'text' ? '📝' : '📷';
                                                                                                return `${icon} Status: ${parsed?.replyText || 'Status reply'}`;
                                                                                            })()
                                                                                            : (msg.replyTo.content || (msg.replyTo.isCodeSnippet ? 'Code Snippet' : 'Media'))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {(() => {
                                                                        const embedData = detectEcosystemLink(msg.content);

                                                                        // If it's a code snippet or pasted code, render the code block with right-aligned timestamp
                                                                        if (isCodeMsg) {
                                                                            const rawContent = msg.content || '';
                                                                            const cleanContent = rawContent.trim().startsWith('```') && rawContent.trim().endsWith('```')
                                                                                ? rawContent.trim().replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '')
                                                                                : rawContent;
                                                                            const detectedLang = msg.language && msg.language !== 'plaintext'
                                                                                ? msg.language
                                                                                : (rawContent.trim().startsWith('```') ? (rawContent.trim().match(/^```([a-zA-Z]+)/)?.[1] || 'text') : 'text');

                                                                            return (
                                                                                <div style={{ width: '100%', overflow: 'hidden' }}>
                                                                                    <SyntaxHighlighter
                                                                                        language={detectedLang === 'plaintext' ? 'text' : detectedLang}
                                                                                        style={vscDarkPlus}
                                                                                        customStyle={{ borderRadius: '8px', margin: '0', fontSize: '0.88rem', padding: '8px 12px', lineHeight: '1.4', maxHeight: '420px', overflowX: 'auto' }}
                                                                                    >
                                                                                        {cleanContent}
                                                                                    </SyntaxHighlighter>
                                                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '2px 4px 1px 0' }}>
                                                                                        {renderInlineTimestamp('0px')}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        }

                                                                        const isCallLog = msg.content && typeof msg.content === 'string' && msg.content.startsWith('$CALL_LOG$');
                                                                        if (isCallLog) {
                                                                            const parts = msg.content.split('|');
                                                                            const rawType = (parts[1] || 'audio').toLowerCase();
                                                                            const isVideo = rawType === 'video';
                                                                            const callStatus = parts[2] || 'completed';
                                                                            const isMissed = callStatus === 'missed';
                                                                            const isDeclined = callStatus === 'rejected';

                                                                            let statusText = 'Completed';
                                                                            if (isMissed) {
                                                                                statusText = isOwnMessage ? 'Unanswered' : 'Missed';
                                                                            } else if (isDeclined) {
                                                                                statusText = 'Declined';
                                                                            }

                                                                            const isMissedIncoming = !isOwnMessage && isMissed;
                                                                            const statusColor = isMissedIncoming ? '#ef4444' : 'var(--colors-textMuted)';
                                                                            const iconColor = isMissedIncoming ? '#ef4444' : 'var(--colors-accent, #00e5ff)';

                                                                            return (
                                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', minWidth: '190px' }}>
                                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                                        <div style={{
                                                                                            width: '38px',
                                                                                            height: '38px',
                                                                                            borderRadius: '50%',
                                                                                            backgroundColor: isMissedIncoming ? 'rgba(239, 68, 68, 0.16)' : 'rgba(0, 229, 255, 0.14)',
                                                                                            display: 'flex',
                                                                                            alignItems: 'center',
                                                                                            justifyContent: 'center',
                                                                                            flexShrink: 0
                                                                                        }}>
                                                                                            {isVideo ? (
                                                                                                <Video size={18} color={iconColor} />
                                                                                            ) : isMissedIncoming ? (
                                                                                                <PhoneOff size={18} color={iconColor} />
                                                                                            ) : (
                                                                                                <Phone size={18} color={iconColor} />
                                                                                            )}
                                                                                        </div>
                                                                                        <div>
                                                                                            <div style={{ fontWeight: '600', color: 'var(--colors-textMain)', fontSize: '0.94rem' }}>
                                                                                                {isVideo ? 'Video call' : 'Voice call'}
                                                                                            </div>
                                                                                            <div style={{ fontSize: '0.8rem', color: statusColor, fontWeight: isMissedIncoming ? '600' : 'normal', marginTop: '2px' }}>
                                                                                                {statusText}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    {renderInlineTimestamp('8px')}
                                                                                </div>
                                                                            );
                                                                        }

                                                                        // Check if message is strictly just a URL
                                                                        const isOnlyUrl = (msg.content.trim().startsWith('http') || msg.content.trim().startsWith('data:')) && !msg.content.trim().includes(' ');
                                                                        const hasAttachment = embedData || isWhiteboardMessage || isImageUrl(msg.content, msg.attachmentType) || isAudioUrl(msg.content, msg.attachmentType) || isVideoUrl(msg.content, msg.attachmentType) || isCloudinaryUrl(msg.content) || isDocMsg;
                                                                        const shouldShowText = !(isOnlyUrl && hasAttachment) && !isWhiteboardMessage;
                                                                        const statusReplyData = parseStatusReply(msg.content);

                                                                        return (
                                                                            <>
                                                                                {shouldShowText && (
                                                                                    statusReplyData ? (
                                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '190px', maxWidth: '320px' }}>
                                                                                            {/* WhatsApp Quoted Status Card */}
                                                                                            <div 
                                                                                                onClick={() => {
                                                                                                    if (statusReplyData.statusId) {
                                                                                                        const targetIdx = groupedStatuses.findIndex(g => 
                                                                                                            g.statuses?.some(s => String(s._id) === String(statusReplyData.statusId))
                                                                                                        );
                                                                                                        if (targetIdx !== -1) {
                                                                                                            setStoryViewerInitialUserIndex(targetIdx);
                                                                                                        }
                                                                                                    }
                                                                                                }}
                                                                                                style={{
                                                                                                    backgroundColor: isOwnMessage ? 'rgba(0, 0, 0, 0.22)' : 'rgba(0, 0, 0, 0.15)',
                                                                                                    borderLeft: `4px solid var(--colors-accent, #00a884)`,
                                                                                                    borderRadius: '6px',
                                                                                                    padding: '6px 10px',
                                                                                                    display: 'flex',
                                                                                                    alignItems: 'center',
                                                                                                    justifyContent: 'space-between',
                                                                                                    gap: '10px',
                                                                                                    cursor: statusReplyData.statusId ? 'pointer' : 'default',
                                                                                                    userSelect: 'none',
                                                                                                    overflow: 'hidden'
                                                                                                }}
                                                                                            >
                                                                                                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                                                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--colors-accent, #00a884)', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '2px' }}>
                                                                                                        <Code2 size={13} strokeWidth={2.4} />
                                                                                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                                                            {statusReplyData.uploaderName || 'Status'}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                    <div style={{ 
                                                                                                        fontSize: '0.82rem', 
                                                                                                        color: isOwnMessage ? 'rgba(255, 255, 255, 0.88)' : 'var(--colors-textMain)', 
                                                                                                        whiteSpace: 'nowrap', 
                                                                                                        overflow: 'hidden', 
                                                                                                        textOverflow: 'ellipsis',
                                                                                                        display: 'flex',
                                                                                                        alignItems: 'center',
                                                                                                        gap: '4px'
                                                                                                    }}>
                                                                                                        {statusReplyData.type === 'video' ? <span>🎥</span> : statusReplyData.type === 'text' ? null : <span>📷</span>}
                                                                                                        <span>{statusReplyData.text || (statusReplyData.type === 'video' ? 'Video' : statusReplyData.type === 'text' ? 'Status' : 'Photo')}</span>
                                                                                                    </div>
                                                                                                </div>

                                                                                                {statusReplyData.thumbnail ? (
                                                                                                    <img 
                                                                                                        src={statusReplyData.thumbnail} 
                                                                                                        alt="Status thumbnail"
                                                                                                        style={{ width: '42px', height: '42px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0, backgroundColor: '#000' }} 
                                                                                                    />
                                                                                                ) : statusReplyData.type === 'text' ? (
                                                                                                    <div style={{ 
                                                                                                        width: '38px', 
                                                                                                        height: '38px', 
                                                                                                        borderRadius: '4px', 
                                                                                                        backgroundColor: statusReplyData.backgroundColor || '#1E2B3C', 
                                                                                                        display: 'flex', 
                                                                                                        alignItems: 'center', 
                                                                                                        justifyContent: 'center', 
                                                                                                        flexShrink: 0,
                                                                                                        padding: '3px',
                                                                                                        fontSize: '8px',
                                                                                                        color: '#fff',
                                                                                                        textAlign: 'center',
                                                                                                        overflow: 'hidden',
                                                                                                        lineHeight: 1.1
                                                                                                    }}>
                                                                                                        {statusReplyData.text?.slice(0, 15)}
                                                                                                    </div>
                                                                                                ) : (
                                                                                                    <div style={{
                                                                                                        width: '38px',
                                                                                                        height: '38px',
                                                                                                        borderRadius: '4px',
                                                                                                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                                                                                        display: 'flex',
                                                                                                        alignItems: 'center',
                                                                                                        justifyContent: 'center',
                                                                                                        flexShrink: 0,
                                                                                                        color: 'var(--colors-accent, #00a884)'
                                                                                                    }}>
                                                                                                        <Camera size={18} />
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>

                                                                                            {/* Reply Message text / emoji */}
                                                                                            <div style={{ 
                                                                                                display: 'flex', 
                                                                                                alignItems: 'baseline', 
                                                                                                justifyContent: 'space-between', 
                                                                                                gap: '8px',
                                                                                                padding: '2px 2px 0 2px'
                                                                                            }}>
                                                                                                <span style={{ 
                                                                                                    fontSize: (/^(\p{Extended_Pictographic}|\p{Emoji_Presentation})+$/u.test(statusReplyData.replyText.trim()) && statusReplyData.replyText.trim().length <= 8) ? '1.5rem' : '0.94rem', 
                                                                                                    lineHeight: (/^(\p{Extended_Pictographic}|\p{Emoji_Presentation})+$/u.test(statusReplyData.replyText.trim()) && statusReplyData.replyText.trim().length <= 8) ? '1.2' : '1.4', 
                                                                                                    whiteSpace: 'pre-wrap', 
                                                                                                    wordBreak: 'break-word',
                                                                                                    color: 'inherit'
                                                                                                }}>
                                                                                                    {statusReplyData.replyText}
                                                                                                </span>
                                                                                                {renderInlineTimestamp('0px')}
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <>
                                                                                            <span style={{ whiteSpace: 'pre-wrap', display: 'inline' }}>
                                                                                                {msg.content}
                                                                                            </span>
                                                                                            {renderInlineTimestamp('12px')}
                                                                                        </>
                                                                                    )
                                                                                )}

                                                                                {isWhiteboardMessage && (
                                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', minWidth: '260px' }}>
                                                                                        {/* Card Header */}
                                                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
                                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '0.88rem', color: isOwnMessage ? '#ffffff' : 'var(--colors-textMain)' }}>
                                                                                                <Brush size={15} style={{ color: '#06b6d4' }} />
                                                                                                <span>Whiteboard Mock-up</span>
                                                                                            </div>
                                                                                            <span style={{ 
                                                                                                fontSize: '0.7rem', 
                                                                                                fontWeight: '600', 
                                                                                                textTransform: 'uppercase', 
                                                                                                letterSpacing: '0.5px', 
                                                                                                padding: '2px 6px', 
                                                                                                borderRadius: '6px', 
                                                                                                backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.18)' : 'rgba(6, 182, 212, 0.18)', 
                                                                                                color: isOwnMessage ? '#ffffff' : '#06b6d4' 
                                                                                            }}>
                                                                                                Design
                                                                                            </span>
                                                                                        </div>

                                                                                        {/* Mock-up Preview Thumbnail */}
                                                                                        <div 
                                                                                            onClick={() => openMediaViewer(msg.content, 'image', 'Whiteboard Mock-up')}
                                                                                            title="Click to view full mock-up"
                                                                                            style={{
                                                                                                position: 'relative',
                                                                                                borderRadius: '8px',
                                                                                                overflow: 'hidden',
                                                                                                backgroundColor: '#0a0f1d',
                                                                                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                                                                                cursor: 'pointer',
                                                                                                display: 'flex',
                                                                                                alignItems: 'center',
                                                                                                justifyContent: 'center',
                                                                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                                                                                                transition: 'border-color 0.15s ease',
                                                                                            }}
                                                                                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#06b6d4'; }}
                                                                                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'; }}
                                                                                        >
                                                                                            <img 
                                                                                                src={msg.content} 
                                                                                                alt="Whiteboard Mock-up" 
                                                                                                style={{ 
                                                                                                    display: 'block', 
                                                                                                    width: '100%', 
                                                                                                    maxHeight: '220px', 
                                                                                                    objectFit: 'contain' 
                                                                                                }} 
                                                                                            />
                                                                                            {/* Zoom overlay badge */}
                                                                                            <div style={{
                                                                                                position: 'absolute',
                                                                                                top: '6px',
                                                                                                right: '6px',
                                                                                                padding: '4px',
                                                                                                borderRadius: '50%',
                                                                                                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                                                                                                color: '#ffffff',
                                                                                                display: 'flex',
                                                                                                alignItems: 'center',
                                                                                                justifyContent: 'center'
                                                                                            }}>
                                                                                                <Maximize2 size={13} />
                                                                                            </div>
                                                                                        </div>

                                                                                        {/* Action Buttons */}
                                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => openMediaViewer(msg.content, 'image', 'Whiteboard Mock-up')}
                                                                                                style={{
                                                                                                    display: 'flex',
                                                                                                    alignItems: 'center',
                                                                                                    justifyContent: 'center',
                                                                                                    gap: '8px',
                                                                                                    width: '100%',
                                                                                                    padding: '8px 14px',
                                                                                                    borderRadius: '8px',
                                                                                                    backgroundColor: isOwnMessage ? 'rgba(255, 255, 255, 0.22)' : 'rgba(6, 182, 212, 0.22)',
                                                                                                    border: `1px solid ${isOwnMessage ? 'rgba(255, 255, 255, 0.35)' : 'rgba(6, 182, 212, 0.45)'}`,
                                                                                                    color: '#ffffff',
                                                                                                    fontSize: '0.85rem',
                                                                                                    fontWeight: '600',
                                                                                                    cursor: 'pointer',
                                                                                                    transition: 'all 0.2s ease',
                                                                                                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
                                                                                                }}
                                                                                                onMouseEnter={(e) => {
                                                                                                    e.currentTarget.style.backgroundColor = isOwnMessage ? 'rgba(255, 255, 255, 0.32)' : 'rgba(6, 182, 212, 0.35)';
                                                                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                                                                }}
                                                                                                onMouseLeave={(e) => {
                                                                                                    e.currentTarget.style.backgroundColor = isOwnMessage ? 'rgba(255, 255, 255, 0.22)' : 'rgba(6, 182, 212, 0.22)';
                                                                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                                                                }}
                                                                                            >
                                                                                                <Maximize2 size={14} />
                                                                                                <span>View the mock-up</span>
                                                                                            </button>

                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                    if (isMobileViewport) {
                                                                                                        setMobileWhiteboardDesign(msg.content);
                                                                                                    } else if (activeTab === 'communities') {
                                                                                                        setCommunityTab('live coding');
                                                                                                    } else {
                                                                                                        setIsWhiteboardOpen(true);
                                                                                                    }
                                                                                                }}
                                                                                                style={{
                                                                                                    display: 'flex',
                                                                                                    alignItems: 'center',
                                                                                                    justifyContent: 'center',
                                                                                                    gap: '6px',
                                                                                                    width: '100%',
                                                                                                    padding: '4px 8px',
                                                                                                    background: 'transparent',
                                                                                                    border: 'none',
                                                                                                    color: isOwnMessage ? 'rgba(255, 255, 255, 0.85)' : '#06b6d4',
                                                                                                    fontSize: '0.78rem',
                                                                                                    fontWeight: '500',
                                                                                                    cursor: 'pointer',
                                                                                                    opacity: 0.9,
                                                                                                    transition: 'opacity 0.2s ease'
                                                                                                }}
                                                                                                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                                                                                                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                                                                                            >
                                                                                                <Brush size={12} />
                                                                                                <span>Open in Whiteboard</span>
                                                                                            </button>
                                                                                        </div>

                                                                                        {msg.caption && msg.caption !== 'View the mock-up' ? (
                                                                                            <div style={{ fontSize: '0.82rem', opacity: 0.9, marginTop: '4px', padding: '0 2px' }}>
                                                                                                <span>{msg.caption}</span>
                                                                                                {renderInlineTimestamp('12px')}
                                                                                            </div>
                                                                                        ) : (
                                                                                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                                                                                                {renderInlineTimestamp('0px')}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                )}

                                                                                {embedData && appSettings.richIntegrations !== false && (
                                                                                    <div>
                                                                                        <EmbedCard style={{ marginTop: shouldShowText ? '8px' : '0', borderRadius: shouldShowText ? '8px' : '0', borderBottom: 'none' }}>
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
                                                                                        {isEmbedOnly && (
                                                                                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px', padding: '0 4px' }}>
                                                                                                {renderInlineTimestamp('0px')}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                )}

                                                                                {isVideoUrl(msg.content, msg.attachmentType) && (
                                                                                    <div style={{ position: 'relative', width: 'fit-content', maxWidth: '100%', margin: 0, lineHeight: 0 }}>
                                                                                        <video
                                                                                            src={msg.content}
                                                                                            controls
                                                                                            playsInline
                                                                                            style={{ display: 'block', maxWidth: '100%', maxHeight: '360px', borderRadius: '8px' }}
                                                                                        />
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => openMediaViewer(msg.content, 'video', msg.attachmentName || 'Video')}
                                                                                            aria-label="View video fullscreen"
                                                                                            title="View fullscreen"
                                                                                            style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', border: 'none', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.65)', color: '#fff', cursor: 'pointer', zIndex: 3 }}
                                                                                        >
                                                                                            <Maximize2 size={18} />
                                                                                        </button>
                                                                                        {!msg.caption && renderOverlayTimestamp()}
                                                                                    </div>
                                                                                )}

                                                                                {isImageUrl(msg.content, msg.attachmentType) && !isWhiteboardMessage && !isStatusReplyMsg && (
                                                                                    <div style={{ position: 'relative', display: 'block', width: '100%', lineHeight: 0 }}>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => openMediaViewer(msg.content, 'image', msg.attachmentName || 'Photo')}
                                                                                            aria-label="View photo fullscreen"
                                                                                            title="View fullscreen"
                                                                                            style={{ display: 'block', width: '100%', margin: 0, padding: 0, border: 0, background: 'transparent', cursor: 'zoom-in', lineHeight: 0 }}
                                                                                        >
                                                                                            <AttachmentImage
                                                                                                src={msg.content}
                                                                                                alt="User attachment"
                                                                                                style={{ width: '100%', height: 'auto', objectFit: 'cover', borderRadius: '8px', display: 'block' }}
                                                                                            />
                                                                                        </button>
                                                                                        {!msg.caption && renderOverlayTimestamp()}
                                                                                    </div>
                                                                                )}

                                                                                {isAudioUrl(msg.content, msg.attachmentType) && (
                                                                                    <CustomAudioPlayer
                                                                                        src={msg.content}
                                                                                        isOwnMessage={isOwnMessage}
                                                                                        avatarUrl={msg.sender?.avatarUrl}
                                                                                        time={formatMessageClock(msg.createdAt)}
                                                                                        statusTicks={renderStatusTicks()}
                                                                                    />
                                                                                )}

                                                                                {isDocMsg && (() => {
                                                                                    const docInfo = getDocumentInfo(msg.attachmentName, msg.attachmentType, msg.content);
                                                                                    return (
                                                                                        <div 
                                                                                            onClick={(e) => handleOpenDocument(msg, e)}
                                                                                            title={`Open ${docInfo.safeName} in ${docInfo.appName}`}
                                                                                            style={{
                                                                                                display: 'flex',
                                                                                                alignItems: 'center',
                                                                                                gap: '12px',
                                                                                                padding: '10px 12px',
                                                                                                backgroundColor: isOwnMessage ? 'rgba(0, 0, 0, 0.22)' : 'rgba(0, 0, 0, 0.32)',
                                                                                                borderRadius: '10px',
                                                                                                minWidth: '220px',
                                                                                                maxWidth: '320px',
                                                                                                margin: 0,
                                                                                                cursor: 'pointer',
                                                                                                transition: 'background-color 0.15s ease, transform 0.1s ease',
                                                                                                userSelect: 'none'
                                                                                            }}
                                                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isOwnMessage ? 'rgba(0,0,0,0.32)' : 'rgba(0,0,0,0.45)'}
                                                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isOwnMessage ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0.32)'}
                                                                                        >
                                                                                            <div style={{
                                                                                                width: '42px',
                                                                                                height: '42px',
                                                                                                borderRadius: '10px',
                                                                                                backgroundColor: docInfo.color,
                                                                                                display: 'flex',
                                                                                                alignItems: 'center',
                                                                                                justifyContent: 'center',
                                                                                                color: '#ffffff',
                                                                                                flexShrink: 0,
                                                                                                boxShadow: `0 2px 8px ${docInfo.color}55`
                                                                                            }}>
                                                                                                {openingDocId === (msg._id || msg.createdAt) ? (
                                                                                                    <RefreshCw size={20} className="spin" />
                                                                                                ) : (
                                                                                                    <FileText size={22} />
                                                                                                )}
                                                                                            </div>
                                                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                                                <span
                                                                                                    style={{
                                                                                                        display: 'block',
                                                                                                        fontWeight: '600',
                                                                                                        fontSize: '0.88rem',
                                                                                                        color: '#ffffff',
                                                                                                        overflow: 'hidden',
                                                                                                        textOverflow: 'ellipsis',
                                                                                                        whiteSpace: 'nowrap'
                                                                                                    }}
                                                                                                >
                                                                                                    {docInfo.safeName}
                                                                                                </span>
                                                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '3px' }}>
                                                                                                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>
                                                                                                        {openingDocId === (msg._id || msg.createdAt)
                                                                                                            ? 'Opening...'
                                                                                                            : `${docInfo.ext ? docInfo.ext.toUpperCase() : 'DOC'} • Open in ${docInfo.appName}`}
                                                                                                    </span>
                                                                                                    {!msg.caption && (
                                                                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)' }}>
                                                                                                            <span>{formatMessageClock(msg.createdAt)}</span>
                                                                                                            {isOwnMessage && renderStatusTicks()}
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                            <div style={{ color: 'rgba(255, 255, 255, 0.65)', display: 'flex', alignItems: 'center', flexShrink: 0, marginLeft: '4px' }}>
                                                                                                {openingDocId === (msg._id || msg.createdAt) ? (
                                                                                                    <span style={{ fontSize: '0.75rem', color: '#06b6d4' }}>●●●</span>
                                                                                                ) : (
                                                                                                    <ExternalLink size={16} />
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })()}

                                                                                {msg.caption && !isWhiteboardMessage && (
                                                                                    <div style={{ whiteSpace: 'pre-wrap', marginTop: hasThinBorder ? '4px' : '6px', padding: hasThinBorder ? '2px 6px 0px 6px' : '4px 0', fontSize: '0.93rem', lineHeight: '1.35', color: 'inherit' }}>
                                                                                        <span>{msg.caption}</span>
                                                                                        {renderInlineTimestamp('12px')}
                                                                                    </div>
                                                                                )}
                                                                            </>
                                                                        );
                                                                    })()}
                                                                    </>
                                                                    )}
                                                                </div>

                                                                {editingMessageId === msg._id && !msg.isDeletedForEveryone && (
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
                                                        </div>
                                                        </div>
                                                    )
                                                })}
                                                <div ref={messagesEndRef} />
                                            </div>
                                        )}

                                    </MessageList>

                                    {isSelectingCurrentMessages ? (
                                        <SelectionToolbar>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                                <IconButton type="button" onClick={cancelMessageSelection} title="Cancel">
                                                    <X size={24} />
                                                </IconButton>
                                                <SelectionToolbarCount>{selectedMessages.length} selected</SelectionToolbarCount>
                                            </div>
                                            <SelectionToolbarActions>
                                                <IconButton 
                                                    type="button" 
                                                    onClick={deleteSelectedMessages} 
                                                    disabled={!selectedMessages.length}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={24} />
                                                </IconButton>
                                            </SelectionToolbarActions>
                                        </SelectionToolbar>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, backgroundColor: 'var(--colors-surface)', borderTop: '1px solid var(--colors-border)' }}>
                                            {replyingToMessage && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', backgroundColor: 'var(--colors-bg)', borderLeft: '4px solid var(--colors-accent)', margin: '8px 16px 0 16px', borderRadius: '4px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--colors-accent)', fontWeight: 'bold' }}>
                                                            {replyingToMessage.sender?.displayName || 'Someone'}
                                                        </span>
                                                        <span style={{ fontSize: '0.9rem', color: 'var(--colors-textMuted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {(typeof replyingToMessage.content === 'string' && replyingToMessage.content.startsWith('$CALL_LOG$'))
                                                                ? (replyingToMessage.content.includes('|video') ? '📹 Video call' : '📞 Voice call')
                                                                : (typeof replyingToMessage.content === 'string' && (replyingToMessage.content.startsWith('$STATUS_REPLY$') || replyingToMessage.content.startsWith('[Status:')))
                                                                    ? (() => {
                                                                        const parsed = parseStatusReply(replyingToMessage.content);
                                                                        const icon = parsed?.type === 'video' ? '🎥' : parsed?.type === 'text' ? '📝' : '📷';
                                                                        return `${icon} Status: ${parsed?.replyText || 'Status reply'}`;
                                                                    })()
                                                                    : (replyingToMessage.content || (replyingToMessage.isCodeSnippet ? 'Code Snippet' : 'Media'))}
                                                        </span>
                                                    </div>
                                                    <IconButton type="button" onClick={() => setReplyingToMessage(null)} style={{ padding: '4px' }}>
                                                        <X size={16} />
                                                    </IconButton>
                                                </div>
                                            )}
                                            {isDirectChatBlocked ? (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '14px 20px',
                                                    margin: '8px 16px',
                                                    borderRadius: '12px',
                                                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                                    gap: '12px'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <ShieldAlert size={20} color="#ef4444" />
                                                        <span style={{ fontSize: '0.92rem', color: 'var(--colors-textMain)', fontWeight: '500' }}>
                                                            You blocked this contact. Unblock to send messages.
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUnblockUser(directChatPartner?._id, directChatPartner?.displayName)}
                                                        style={{
                                                            padding: '6px 16px',
                                                            backgroundColor: '#ef4444',
                                                            color: '#fff',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.85rem',
                                                            fontWeight: '600',
                                                            transition: 'opacity 0.2s',
                                                            flexShrink: 0
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                                                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                                    >
                                                        Unblock
                                                    </button>
                                                </div>
                                            ) : (
                                                <InputArea onSubmit={handleSendMessage} style={{ borderTop: 'none', backgroundColor: 'transparent' }}>
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        style={{ display: 'none' }}
                                                        onChange={handleFileSelect}
                                                        accept="*/*"
                                                    />

                                                    <AttachButton
                                                        type="button"
                                                        title="Attach a file or video"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        disabled={isUploading || isRecording}
                                                    >
                                                        {isUploading ? <Spinner /> : <PlusIcon />}
                                                    </AttachButton>

                                                    <IconButton
                                                        type="button"
                                                        title="Ask DevSup AI Assistant (@devsup-ai)"
                                                        onClick={() => {
                                                            if (!messageInput.includes('@devsup-ai')) {
                                                                setMessageInput(prev => prev ? `@devsup-ai ${prev}` : '@devsup-ai ');
                                                                inputRef.current?.focus();
                                                            }
                                                        }}
                                                        style={{
                                                            color: '#00e5ff',
                                                            backgroundColor: 'rgba(0, 229, 255, 0.08)',
                                                            border: '1px solid rgba(0, 229, 255, 0.25)',
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '50%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexShrink: 0,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.15s ease'
                                                        }}
                                                    >
                                                        <Sparkles size={17} />
                                                    </IconButton>

                                                    {isRecording ? (
                                                        <VoiceRecordingIndicator time={recordingTime} />
                                                    ) : (
                                                        <Input
                                                            ref={inputRef}
                                                            placeholder="Message, code snippet, or ask @devsup-ai..."
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
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : communityTab === 'live coding' ? (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minHeight: 0 }}>
                                    <Suspense fallback={null}>
                                        <LiveCodingWorkspace
                                            onClose={() => setCommunityTab('chat')}
                                            onSendToChat={(codeSnippet) => {
                                                sendMessage({
                                                    conversationId: activeConversationId,
                                                    senderId: mongoUserId,
                                                    content: codeSnippet,
                                                    isCodeSnippet: true,
                                                    language: 'javascript'
                                                });
                                                setCommunityTab('chat');
                                            }}
                                            activeConversationName={activeConversation.name}
                                            conversationId={activeConversationId}
                                            socket={socket}
                                            currentUser={{ _id: mongoUserId, displayName: user?.displayName || user?.name || user?.nickname }}
                                        />
                                    </Suspense>
                                </div>
                            ) : (
                                <Suspense fallback={null}><EventsView type={communityTab} /></Suspense>
                            )}
                        </div>
                ) : (
                    <>
                        {activeTab === 'settings' && (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '24px' }}>
                                <div style={{ 
                                    width: '100%', 
                                    maxWidth: '600px', 
                                    borderRadius: '24px', 
                                    overflow: 'hidden', 
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1)',
                                    position: 'relative'
                                }}>
                                    <img src="/settings-hero.jpg" alt="Settings Configuration" style={{ width: '100%', height: 'auto', display: 'block' }} />
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px', background: 'linear-gradient(to top, rgba(11, 20, 26, 0.9), transparent)' }}>
                                        <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>System Preferences</h2>
                                        <p style={{ margin: '8px 0 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>Configure your workspace and tailor the DevSup experience.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'status' && (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--colors-bg)', overflow: 'hidden', position: 'relative', padding: '24px' }}>
                                <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'var(--colors-accent)', filter: 'blur(200px)', opacity: 0.15, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                                <div style={{ 
                                    width: '130px', height: '130px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0, 168, 132, 0.18) 0%, rgba(15, 23, 42, 0.4) 100%)', 
                                    border: '2px solid rgba(0, 168, 132, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px', 
                                    boxShadow: '0 0 40px rgba(0, 168, 132, 0.2), inset 0 0 20px rgba(0, 168, 132, 0.15)', position: 'relative', zIndex: 1
                                }}>
                                    <Code2 size={60} color="var(--colors-accent, #00a884)" strokeWidth={1.8} style={{ filter: 'drop-shadow(0 0 8px rgba(0, 168, 132, 0.5))' }} />
                                </div>
                                <h2 style={{ color: 'var(--colors-textMain)', fontSize: '2rem', marginBottom: '12px', fontWeight: '600', letterSpacing: '-0.4px', position: 'relative', zIndex: 1, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Status updates</h2>
                                <p style={{ color: 'var(--colors-textMuted)', fontSize: '1rem', maxWidth: '380px', textAlign: 'center', lineHeight: '1.55', position: 'relative', zIndex: 1, margin: '0 0 24px 0' }}>
                                    Click on a contact to view their status update, or share photos, videos, and code snippets with your developer network.
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '24px', color: 'var(--colors-textMuted)', fontSize: '0.85rem', position: 'relative', zIndex: 1 }}>
                                    <Lock size={14} color="var(--colors-accent)" />
                                    <span>Your status updates are end-to-end encrypted</span>
                                </div>
                            </div>
                        )}
                        {activeTab === 'calls' && (
                            (() => {
                                const activeCallLog = callLogs.find(l => l.id === selectedCallLogId) || (callLogs.length > 0 ? callLogs[0] : null);
                                if (!activeCallLog) {
                                    return (
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--colors-bg)', overflow: 'hidden', position: 'relative', padding: '24px' }}>
                                            <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'var(--colors-accent)', filter: 'blur(200px)', opacity: 0.15, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                                            <div style={{ 
                                                width: '130px', height: '130px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,229,255,0.18) 0%, rgba(0,229,255,0.04) 100%)', 
                                                border: '1px solid rgba(0,229,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px', 
                                                boxShadow: '0 0 40px rgba(0,229,255,0.15)', position: 'relative', zIndex: 1
                                            }}>
                                                <Phone size={56} color="var(--colors-accent, #00e5ff)" strokeWidth={1.6} />
                                            </div>
                                            <h2 style={{ color: 'var(--colors-textMain)', fontSize: '2.2rem', marginBottom: '12px', fontWeight: '600', position: 'relative', zIndex: 1 }}>DevSup Calls</h2>
                                            <p style={{ color: 'var(--colors-textMuted)', fontSize: '1rem', maxWidth: '380px', textAlign: 'center', lineHeight: '1.6', position: 'relative', zIndex: 1, marginBottom: '24px' }}>
                                                Make high-definition end-to-end encrypted audio and video calls, or message anyone right from here.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => { setNewCallSearchQuery(''); setIsNewCallModalOpen(true); }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    padding: '12px 24px',
                                                    borderRadius: '24px',
                                                    backgroundColor: 'var(--colors-accent, #00e5ff)',
                                                    color: '#080f15',
                                                    fontWeight: '700',
                                                    border: 'none',
                                                    fontSize: '0.96rem',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 4px 18px rgba(0, 229, 255, 0.35)',
                                                    position: 'relative',
                                                    zIndex: 1,
                                                    transition: 'all 0.15s ease'
                                                }}
                                            >
                                                <PhoneCall size={18} />
                                                <span>Start a Call</span>
                                            </button>
                                        </div>
                                    );
                                }

                                const relatedLogs = callLogs.filter(l => l.contactId && String(l.contactId) === String(activeCallLog.contactId));

                                return (
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--colors-bg)', overflow: 'hidden' }}>
                                        {/* Header Profile Area */}
                                        <div style={{ padding: '36px 32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid var(--colors-border)', backgroundColor: 'var(--colors-surface)', flexShrink: 0 }}>
                                            <AvatarWrapper style={{ width: '92px', height: '92px', marginBottom: '16px', border: '2px solid rgba(0, 229, 255, 0.25)', boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}>
                                                <Avatar
                                                    src={activeCallLog.contactAvatar || '/default-avatar.svg'}
                                                    style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                                                    onError={(e) => { e.currentTarget.src = '/default-avatar.svg'; }}
                                                />
                                            </AvatarWrapper>
                                            <h3 style={{ fontSize: '1.4rem', fontWeight: '600', color: 'var(--colors-textMain)', margin: '0 0 6px' }}>
                                                {activeCallLog.contactName}
                                            </h3>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--colors-accent, #00e5ff)', marginBottom: '20px', fontWeight: '500' }}>
                                                Contact
                                            </span>

                                            {/* Quick WhatsApp-Style Action Hub */}
                                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => openConversationWith(activeCallLog.contactId)}
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: 'var(--colors-textMain)',
                                                        cursor: 'pointer',
                                                        padding: '8px 16px',
                                                        borderRadius: '12px',
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <div style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                                                        <MessageSquare size={20} />
                                                    </div>
                                                    <span style={{ fontSize: '0.82rem', fontWeight: '500' }}>Message</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => openConversationWith(activeCallLog.contactId, 'audio')}
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: 'var(--colors-textMain)',
                                                        cursor: 'pointer',
                                                        padding: '8px 16px',
                                                        borderRadius: '12px',
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <div style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(34, 197, 94, 0.25)' }}>
                                                        <Phone size={20} />
                                                    </div>
                                                    <span style={{ fontSize: '0.82rem', fontWeight: '500' }}>Voice</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => openConversationWith(activeCallLog.contactId, 'video')}
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: 'var(--colors-textMain)',
                                                        cursor: 'pointer',
                                                        padding: '8px 16px',
                                                        borderRadius: '12px',
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <div style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: 'rgba(0, 229, 255, 0.12)', color: 'var(--colors-accent, #00e5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0, 229, 255, 0.28)' }}>
                                                        <Video size={20} />
                                                    </div>
                                                    <span style={{ fontSize: '0.82rem', fontWeight: '500' }}>Video</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Call History with this person */}
                                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
                                            <div style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--colors-textMuted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>
                                                Call History
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {relatedLogs.map(rLog => (
                                                    <div
                                                        key={rLog.id}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            padding: '12px 16px',
                                                            backgroundColor: 'var(--colors-surface)',
                                                            borderRadius: '12px',
                                                            border: '1px solid var(--colors-border)'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{
                                                                width: '36px',
                                                                height: '36px',
                                                                borderRadius: '50%',
                                                                backgroundColor: rLog.type === 'video' ? 'rgba(0, 229, 255, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                                                                color: rLog.type === 'video' ? 'var(--colors-accent, #00e5ff)' : '#22c55e',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}>
                                                                {rLog.type === 'video' ? <Video size={17} /> : <Phone size={17} />}
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.92rem', color: 'var(--colors-textMain)', fontWeight: '500' }}>
                                                                    {rLog.direction === 'incoming' ? (
                                                                        <svg viewBox="0 0 24 24" width="14" height="14" fill={rLog.status === 'missed' ? '#ef4444' : '#10b981'}>
                                                                            <path d="M20 5.41L18.59 4 7 15.59V9H5v10h10v-2H8.41L20 5.41z"></path>
                                                                        </svg>
                                                                    ) : (
                                                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="var(--colors-accent, #00e5ff)">
                                                                            <path d="M9 5v2h6.59L4 18.59 5.41 20 17 8.41V15h2V5H9z"></path>
                                                                        </svg>
                                                                    )}
                                                                    <span>{rLog.direction === 'incoming' ? (rLog.status === 'missed' ? 'Missed Call' : 'Incoming') : 'Outgoing'}</span>
                                                                </div>
                                                                <span style={{ fontSize: '0.78rem', color: 'var(--colors-textMuted)' }}>
                                                                    {formatCallTimestamp(rLog.timestamp)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '6px' }}>
                                                            <IconButton
                                                                onClick={() => openConversationWith(activeCallLog.contactId, rLog.type === 'video' ? 'video' : 'audio')}
                                                                style={{ color: 'var(--colors-accent, #00e5ff)', backgroundColor: 'rgba(0, 229, 255, 0.08)', width: '34px', height: '34px', borderRadius: '50%' }}
                                                                title={`Call back (${rLog.type})`}
                                                            >
                                                                {rLog.type === 'video' ? <Video size={16} /> : <Phone size={16} />}
                                                            </IconButton>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Inline Fast Message Bar */}
                                        <div style={{ padding: '16px 24px', backgroundColor: 'var(--colors-surface)', borderTop: '1px solid var(--colors-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <input
                                                type="text"
                                                placeholder={`Message ${activeCallLog.contactName}...`}
                                                value={quickCallMessage}
                                                onChange={(e) => setQuickCallMessage(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        sendQuickMessageToContact(activeCallLog.contactId, quickCallMessage);
                                                        setQuickCallMessage('');
                                                    }
                                                }}
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: 'var(--colors-bg)',
                                                    border: '1px solid var(--colors-border)',
                                                    borderRadius: '24px',
                                                    padding: '12px 18px',
                                                    color: 'var(--colors-textMain)',
                                                    fontSize: '0.94rem',
                                                    outline: 'none'
                                                }}
                                            />
                                            <IconButton
                                                disabled={!quickCallMessage.trim()}
                                                onClick={() => {
                                                    sendQuickMessageToContact(activeCallLog.contactId, quickCallMessage);
                                                    setQuickCallMessage('');
                                                }}
                                                style={{
                                                    backgroundColor: quickCallMessage.trim() ? 'var(--colors-accent, #00e5ff)' : 'rgba(255, 255, 255, 0.08)',
                                                    color: quickCallMessage.trim() ? '#080f15' : 'var(--colors-textMuted)',
                                                    width: '42px',
                                                    height: '42px',
                                                    borderRadius: '50%',
                                                    transition: 'all 0.15s ease',
                                                    cursor: quickCallMessage.trim() ? 'pointer' : 'default'
                                                }}
                                                title="Send message"
                                            >
                                                <Send size={18} />
                                            </IconButton>
                                        </div>
                                    </div>
                                );
                            })()
                        )}
                        {(activeTab === 'chats' || activeTab === 'communities') && (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--colors-bg)', overflow: 'hidden', position: 'relative' }}>
                                <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'var(--colors-accent)', filter: 'blur(200px)', opacity: 0.15, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                                <div style={{ 
                                    width: '140px', height: '140px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(6,182,212,0.05) 100%)', 
                                    border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', 
                                    boxShadow: '0 0 40px rgba(6,182,212,0.15), inset 0 0 20px rgba(6,182,212,0.1)', position: 'relative', zIndex: 1
                                }}>
                                    {activeTab === 'communities' ? 
                                        <Users size={64} color="var(--colors-accent)" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.5))' }} /> : 
                                        <DevSupLogo size={70} />
                                    }
                                </div>
                                <h2 style={{ color: 'var(--colors-textMain)', fontSize: '2.5rem', marginBottom: '16px', fontWeight: '500', letterSpacing: '-0.5px', position: 'relative', zIndex: 1, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                                    {activeTab === 'communities' ? "Communities" : "Welcome to DevSup!"}
                                </h2>
                                <p style={{ color: 'var(--colors-textMuted)', fontSize: '1.1rem', maxWidth: '400px', textAlign: 'center', lineHeight: '1.6', position: 'relative', zIndex: 1 }}>
                                    {activeTab === 'communities' ? "Select a community or create a new one to get started." : "Click the + button in the sidebar to start a new conversation."}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </ChatArea>

            <RightDrawer isOpen={isDrawerOpen}>
                {isDrawerOpen && activeConversation && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', paddingBottom: '32px' }}>
                        {activeContactPane ? (
                            <>
                                <SubPaneHeader onClick={() => setActiveContactPane(null)}>
                                    <ArrowLeft size={20} />
                                    <span>
                                        {activeContactPane === 'media' && 'Media, links and docs'}
                                        {activeContactPane === 'starred' && 'Starred messages'}
                                        {activeContactPane === 'notifications' && 'Notification settings'}
                                        {activeContactPane === 'disappearing' && 'Disappearing messages'}
                                        {activeContactPane === 'encryption' && 'Encryption'}
                                    </span>
                                </SubPaneHeader>
                                <div style={{ flex: 1, backgroundColor: 'var(--colors-surface)', padding: '24px', overflowY: 'auto' }}>
                                    {activeContactPane === 'media' && (() => {
                                        const mediaMsgs = messages.filter(m => m.content && (isImageUrl(m.content, m.attachmentType) || isVideoUrl(m.content, m.attachmentType)));
                                        return (
                                            <div>
                                                {mediaMsgs.length === 0 ? (
                                                    <div style={{ textAlign: 'center', color: 'var(--colors-textMuted)', padding: '40px 0' }}>
                                                        <Image size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                                        <p>No media, links, or docs in this chat yet.</p>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                                        {mediaMsgs.map(msg => (
                                                            <div key={msg._id} style={{ width: '100%', aspectRatio: '1', backgroundColor: 'var(--colors-bg)', borderRadius: '8px', overflow: 'hidden' }}>
                                                                {isVideoUrl(msg.content, msg.attachmentType) ? (
                                                                    <video src={msg.content} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                ) : (
                                                                    <img src={msg.content} alt="Media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                    {activeContactPane === 'starred' && (
                                        <div style={{ textAlign: 'center', color: 'var(--colors-textMuted)', padding: '40px 0' }}>
                                            <Star size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                            <p>No starred messages.</p>
                                        </div>
                                    )}
                                    {activeContactPane === 'notifications' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: 'var(--colors-textMain)', fontSize: '1rem' }}>Mute notifications</span>
                                                <input type="checkbox" style={{ accentColor: 'var(--colors-accent)', width: '20px', height: '20px', cursor: 'pointer' }} />
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: 'var(--colors-textMain)', fontSize: '1rem' }}>Custom tone</span>
                                                <span style={{ color: 'var(--colors-accent)', cursor: 'pointer', fontSize: '0.9rem' }}>Default</span>
                                            </div>
                                        </div>
                                    )}
                                    {activeContactPane === 'disappearing' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                            <p style={{ color: 'var(--colors-textMuted)', fontSize: '0.9rem', marginBottom: '8px' }}>Make messages in this chat disappear for everyone after a selected duration.</p>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--colors-textMain)', cursor: 'pointer' }}>
                                                <input type="radio" name="disappearing" defaultChecked style={{ accentColor: 'var(--colors-accent)', width: '18px', height: '18px' }} /> <span style={{ fontSize: '1rem' }}>Off</span>
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--colors-textMain)', cursor: 'pointer' }}>
                                                <input type="radio" name="disappearing" style={{ accentColor: 'var(--colors-accent)', width: '18px', height: '18px' }} /> <span style={{ fontSize: '1rem' }}>24 hours</span>
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--colors-textMain)', cursor: 'pointer' }}>
                                                <input type="radio" name="disappearing" style={{ accentColor: 'var(--colors-accent)', width: '18px', height: '18px' }} /> <span style={{ fontSize: '1rem' }}>7 days</span>
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--colors-textMain)', cursor: 'pointer' }}>
                                                <input type="radio" name="disappearing" style={{ accentColor: 'var(--colors-accent)', width: '18px', height: '18px' }} /> <span style={{ fontSize: '1rem' }}>90 days</span>
                                            </label>
                                        </div>
                                    )}
                                    {activeContactPane === 'encryption' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px 0' }}>
                                            <Lock size={64} color="var(--colors-accent)" style={{ marginBottom: '24px' }} />
                                            <p style={{ color: 'var(--colors-textMain)', marginBottom: '24px', lineHeight: '1.6', fontSize: '0.95rem' }}>Messages and calls are end-to-end encrypted. No one outside of this chat, not even DevSup, can read or listen to them.</p>
                                            <div style={{ padding: '16px 24px', backgroundColor: 'var(--colors-bg)', borderRadius: '8px', letterSpacing: '2px', fontSize: '1.1rem', color: 'var(--colors-accent)', fontWeight: 'bold' }}>
                                                19340 50389 23901 88472 90123
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px', backgroundColor: 'var(--colors-surface)', position: 'sticky', top: 0, zIndex: 10 }}>
                                    <IconButton onClick={() => { setIsDrawerOpen(false); setActiveContactPane(null); }}>
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
                                        ? getAvatarUrl(activeConversation.avatarUrl)
                                        : getAvatarUrl(activeConversation.participants?.find(p => String(p._id || p) !== String(mongoUserId))?.avatarUrl)}
                                    onError={(e) => { e.currentTarget.src = '/default-avatar.svg'; }}
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
                            {(() => {
                                const other = activeConversation.participants?.find(p => p._id !== mongoUserId);
                                return (
                                    <>
                                        <h2 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', color: 'var(--colors-textMain)' }}>
                                            {activeConversation.type === 'group' ? activeConversation.name : (other?.displayName || 'User')}
                                        </h2>
                                        {(!activeConversation.type || activeConversation.type === 'direct') && other?.username && (
                                            <div style={{ color: 'var(--colors-accent)', fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px' }}>
                                                @{other.username}
                                            </div>
                                        )}
                                        {activeConversation.type === 'group' && <span style={{ color: 'var(--colors-textMuted)', fontSize: '1rem', marginBottom: '16px' }}>Group • {activeConversation.participants?.length || 0} participants</span>}
                                        {(!activeConversation.type || activeConversation.type === 'direct') ? <span style={{ color: 'var(--colors-textMuted)', fontSize: '0.95rem', marginBottom: '16px' }}>{other?.techDiscipline || 'Available'}</span> : null}
                                    </>
                                );
                            })()}

                            <div style={{ display: 'flex', gap: '32px', marginTop: '8px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--colors-accent)' }} onClick={() => setCallConfig({
                                    active: true,
                                    isReceiving: false,
                                    callerData: null,
                                    callType: 'audio',
                                    targetUserId: directChatPartner ? String(directChatPartner._id || directChatPartner) : null,
                                    targetUser: directChatPartner || null,
                                    conversationId: activeConversation?._id
                                })}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Phone size={20} />
                                    </div>
                                    <span style={{ fontSize: '0.85rem' }}>Audio</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--colors-accent)' }} onClick={() => setCallConfig({
                                    active: true,
                                    isReceiving: false,
                                    callerData: null,
                                    callType: 'video',
                                    targetUserId: directChatPartner ? String(directChatPartner._id || directChatPartner) : null,
                                    targetUser: directChatPartner || null,
                                    conversationId: activeConversation?._id
                                })}>
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

                        <div style={{ backgroundColor: 'var(--colors-surface)', display: 'flex', flexDirection: 'column' }}>
                            <ContactMenuItem onClick={() => setActiveContactPane('media')}>
                                <Image size={24} color="var(--colors-textMuted)" />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                                    <span style={{ fontSize: '1rem', color: 'var(--colors-textMain)' }}>Media, links and docs</span>
                                    <ChevronRight size={20} color="var(--colors-textMuted)" />
                                </div>
                            </ContactMenuItem>
                            <ContactMenuItem onClick={() => setActiveContactPane('starred')}>
                                <Star size={24} color="var(--colors-textMuted)" />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                                    <span style={{ fontSize: '1rem', color: 'var(--colors-textMain)' }}>Starred messages</span>
                                    <ChevronRight size={20} color="var(--colors-textMuted)" />
                                </div>
                            </ContactMenuItem>
                            <ContactMenuItem onClick={() => setActiveContactPane('notifications')}>
                                <Bell size={24} color="var(--colors-textMuted)" />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                                    <span style={{ fontSize: '1rem', color: 'var(--colors-textMain)' }}>Notification settings</span>
                                    <ChevronRight size={20} color="var(--colors-textMuted)" />
                                </div>
                            </ContactMenuItem>
                            <ContactMenuItem onClick={() => setActiveContactPane('disappearing')}>
                                <Clock size={24} color="var(--colors-textMuted)" />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                                    <span style={{ fontSize: '1rem', color: 'var(--colors-textMain)' }}>Disappearing messages</span>
                                    <ChevronRight size={20} color="var(--colors-textMuted)" />
                                </div>
                            </ContactMenuItem>
                            <ContactMenuItem onClick={() => setActiveContactPane('encryption')}>
                                <Lock size={24} color="var(--colors-textMuted)" style={{ flexShrink: 0 }} />
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                    <span style={{ fontSize: '1rem', color: 'var(--colors-textMain)' }}>Encryption</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--colors-textMuted)' }}>Messages are end-to-end encrypted. Click to verify.</span>
                                </div>
                            </ContactMenuItem>
                        </div>

                        <div style={{ height: '8px', backgroundColor: 'var(--colors-bg)' }}></div>

                        {activeConversation.type === 'group' && (
                            activeConversation.admins?.some(a => (a._id || a).toString() === mongoUserId) ||
                            (!activeConversation.admins?.length && activeConversation.participants?.[0]?._id === mongoUserId)
                        ) && (
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
                                                    if (res.ok) {
                                                        const updated = await res.json();
                                                        setConversations(prev => prev.map(c => c._id === updated._id ? updated : c));
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
                                                src={String(participant._id || participant) === String(mongoUserId) ? getAvatarUrl(currentUserData?.avatarUrl || user?.picture || participant.avatarUrl) : getAvatarUrl(participant.avatarUrl)} onError={(e) => { e.currentTarget.src = '/default-avatar.svg'; }}
                                                style={{ width: '40px', height: '40px' }}
                                            />
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ color: 'var(--colors-textMain)', fontSize: '1rem' }}>
                                                    {participant._id === mongoUserId ? 'You' : participant.displayName}
                                                </span>
                                                <span style={{ color: 'var(--colors-textMuted)', fontSize: '0.85rem' }}>
                                                    {participant.username ? `@${participant.username}` : (participant.techDiscipline || 'Fullstack')}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div style={{ backgroundColor: 'var(--colors-surface)', display: 'flex', flexDirection: 'column' }}>
                                <ContactMenuItem style={{ color: '#ef4444' }} onClick={(e) => {
                                    if (window.confirm('Are you sure you want to clear this chat? This cannot be undone.')) {
                                        deleteConversation(e, activeConversation._id);
                                    }
                                }}>
                                    <Trash2 size={24} color="#ef4444" />
                                    <span style={{ fontSize: '1rem', fontWeight: '500' }}>Clear chat</span>
                                </ContactMenuItem>
                                {(!activeConversation.type || activeConversation.type === 'direct') && (
                                    <>
                                        {isDirectChatBlocked ? (
                                            <ContactMenuItem style={{ color: 'var(--colors-accent)' }} onClick={() => {
                                                const target = activeConversation.participants?.find(p => p._id !== mongoUserId);
                                                if (window.confirm(`Are you sure you want to unblock ${target?.displayName}?`)) {
                                                    handleUnblockUser(target?._id, target?.displayName);
                                                }
                                            }}>
                                                <ShieldCheck size={24} color="var(--colors-accent)" />
                                                <span style={{ fontSize: '1rem', fontWeight: '500' }}>Unblock {activeConversation.participants?.find(p => p._id !== mongoUserId)?.displayName}</span>
                                            </ContactMenuItem>
                                        ) : (
                                            <ContactMenuItem style={{ color: '#ef4444' }} onClick={() => {
                                                const target = activeConversation.participants?.find(p => p._id !== mongoUserId);
                                                if (window.confirm(`Are you sure you want to block ${target?.displayName}? You will not be able to exchange messages or calls.`)) {
                                                    handleBlockUser(target?._id, target?.displayName);
                                                }
                                            }}>
                                                <ShieldAlert size={24} color="#ef4444" />
                                                <span style={{ fontSize: '1rem', fontWeight: '500' }}>Block {activeConversation.participants?.find(p => p._id !== mongoUserId)?.displayName}</span>
                                            </ContactMenuItem>
                                        )}
                                        <ContactMenuItem style={{ color: '#ef4444' }} onClick={() => {
                                            const userToReport = activeConversation.participants?.find(p => p._id !== mongoUserId)?.displayName;
                                            if (window.confirm(`Are you sure you want to report ${userToReport}?`)) {
                                                showToast(`User ${userToReport} has been reported. Our team will review the chat logs.`);
                                            }
                                        }}>
                                            <ThumbsDown size={24} color="#ef4444" />
                                            <span style={{ fontSize: '1rem', fontWeight: '500' }}>Report {activeConversation.participants?.find(p => p._id !== mongoUserId)?.displayName}</span>
                                        </ContactMenuItem>
                                    </>
                                )}
                            </div>
                        )}
                        </>
                    )}
                    </div>
                )}
            </RightDrawer>

            {mobileWhiteboardDesign && isMobileViewport && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: '#000', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: 'calc(12px + env(safe-area-inset-top)) 16px 12px', backgroundColor: '#111827', color: '#fff' }}>
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            aria-label="Back to chat"
                            title="Back to chat"
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', color: 'inherit', padding: '8px', cursor: 'pointer' }}
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <span style={{ fontSize: '1rem', fontWeight: 600 }}>Whiteboard design</span>
                    </div>
                    <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
                        <img src={mobileWhiteboardDesign} alt="Shared whiteboard design" style={{ display: 'block', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                </div>
            )}

            {mediaViewer && (
                <div
                    role="presentation"
                    onClick={() => setMediaViewer(null)}
                    style={{ position: 'fixed', inset: 0, zIndex: 11000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: 'rgba(0,0,0,0.96)' }}
                >
                    <div style={{ position: 'absolute', top: 'max(12px, env(safe-area-inset-top))', left: '16px', right: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff', zIndex: 1 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '16px' }}>{mediaViewer.title}</span>
                        <button
                            type="button"
                            onClick={() => setMediaViewer(null)}
                            aria-label="Close media viewer"
                            title="Close"
                            style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', border: 'none', borderRadius: '50%', color: '#fff', backgroundColor: 'rgba(255,255,255,0.12)', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>
                    </div>
                    {mediaViewer.type === 'video' ? (
                        <video
                            src={mediaViewer.src}
                            controls
                            autoPlay
                            playsInline
                            onClick={(event) => event.stopPropagation()}
                            style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                    ) : (
                        <img
                            src={mediaViewer.src}
                            alt={mediaViewer.title || 'Full-size image'}
                            onClick={(event) => event.stopPropagation()}
                            style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                    )}
                </div>
            )}

            {documentViewer && (
                <div
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setDocumentViewer(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 11000,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.92)',
                        backdropFilter: 'blur(12px)',
                        padding: (window.innerWidth <= 768 || isMobileViewport) ? '0' : '20px',
                        animation: 'fadeIn 0.15s ease'
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: (window.innerWidth <= 768 || isMobileViewport) ? '100vw' : '100%',
                            maxWidth: (window.innerWidth <= 768 || isMobileViewport) ? '100vw' : '1020px',
                            height: (window.innerWidth <= 768 || isMobileViewport) ? '100dvh' : '88vh',
                            maxHeight: (window.innerWidth <= 768 || isMobileViewport) ? '100dvh' : '920px',
                            backgroundColor: '#111b21',
                            borderRadius: (window.innerWidth <= 768 || isMobileViewport) ? '0' : '16px',
                            boxShadow: '0 24px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.08)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: (window.innerWidth <= 768 || isMobileViewport) ? '10px 12px' : '12px 18px',
                            backgroundColor: '#1f2c34',
                            borderBottom: '1px solid rgba(255,255,255,0.08)',
                            gap: '10px',
                            flexShrink: 0
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                                <button
                                    type="button"
                                    onClick={() => setDocumentViewer(null)}
                                    title="Close"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '34px',
                                        height: '34px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        backgroundColor: 'rgba(255,255,255,0.08)',
                                        color: '#ffffff',
                                        cursor: 'pointer',
                                        flexShrink: 0
                                    }}
                                >
                                    <X size={18} />
                                </button>
                                <div style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '8px',
                                    backgroundColor: documentViewer.docInfo.color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#ffffff',
                                    flexShrink: 0,
                                    boxShadow: `0 2px 8px ${documentViewer.docInfo.color}55`
                                }}>
                                    <FileText size={18} />
                                </div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <h3 style={{
                                        margin: 0,
                                        fontSize: (window.innerWidth <= 768 || isMobileViewport) ? '0.88rem' : '0.96rem',
                                        fontWeight: '600',
                                        color: '#ffffff',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {documentViewer.filename}
                                    </h3>
                                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)' }}>
                                        {documentViewer.docInfo.label} • {documentViewer.docInfo.appName}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                <button
                                    type="button"
                                    onClick={() => handleOpenInApp(documentViewer.docInfo, documentViewer.proxyUrl, documentViewer.blob)}
                                    title={`Open in ${documentViewer.docInfo.appName}`}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: (window.innerWidth <= 768 || isMobileViewport) ? '7px 10px' : '7px 14px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        backgroundColor: '#06b6d4',
                                        color: '#ffffff',
                                        fontSize: '0.82rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 6px rgba(6,182,212,0.35)'
                                    }}
                                >
                                    <ExternalLink size={15} />
                                    <span>{(window.innerWidth <= 768 || isMobileViewport) ? 'Open' : 'Open in App'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleDownloadDocument(documentViewer.proxyUrl, documentViewer.filename, documentViewer.docInfo.mimeType)}
                                    title="Download File"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '34px',
                                        height: '34px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        backgroundColor: 'rgba(255,255,255,0.06)',
                                        color: '#ffffff',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Download size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Preview Body */}
                        <div style={{ flex: 1, minHeight: 0, position: 'relative', backgroundColor: '#0c1317' }}>
                            {documentViewer.docInfo.ext === 'pdf' ? (
                                <iframe
                                    src={`${documentViewer.proxyUrl}#toolbar=1`}
                                    title={documentViewer.filename}
                                    style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#ffffff' }}
                                />
                            ) : ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(documentViewer.docInfo.ext) ? (
                                <iframe
                                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(documentViewer.proxyUrl)}&embedded=true`}
                                    title={documentViewer.filename}
                                    style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#ffffff' }}
                                />
                            ) : (
                                <div style={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '30px',
                                    textAlign: 'center',
                                    color: '#ffffff'
                                }}>
                                    <div style={{
                                        width: '72px',
                                        height: '72px',
                                        borderRadius: '18px',
                                        backgroundColor: documentViewer.docInfo.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '16px',
                                        boxShadow: `0 8px 24px ${documentViewer.docInfo.color}44`
                                    }}>
                                        <FileText size={36} />
                                    </div>
                                    <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: '600' }}>{documentViewer.filename}</h4>
                                    <p style={{ margin: '0 0 24px 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                                        {documentViewer.docInfo.label} • Open directly with your device applications
                                    </p>
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                        <button
                                            type="button"
                                            onClick={() => handleOpenInApp(documentViewer.docInfo, documentViewer.proxyUrl, documentViewer.blob)}
                                            style={{
                                                padding: '10px 20px',
                                                borderRadius: '10px',
                                                backgroundColor: '#06b6d4',
                                                color: '#ffffff',
                                                border: 'none',
                                                fontWeight: '600',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <ExternalLink size={18} />
                                            Open in {documentViewer.docInfo.appName}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDownloadDocument(documentViewer.proxyUrl, documentViewer.filename, documentViewer.docInfo.mimeType)}
                                            style={{
                                                padding: '10px 20px',
                                                borderRadius: '10px',
                                                backgroundColor: 'rgba(255,255,255,0.12)',
                                                color: '#ffffff',
                                                border: '1px solid rgba(255,255,255,0.16)',
                                                fontWeight: '600',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <Download size={18} />
                                            Download File
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isWhiteboardOpen && !isMobileViewport && (
                <Suspense fallback={null}><Whiteboard
                    socket={socket}
                    conversationId={activeConversationId}
                    mongoUserId={mongoUserId}
                    onClose={() => setIsWhiteboardOpen(false)}
                    onSendToChat={(dataUrl) => {
                        sendMessage({
                            conversationId: activeConversationId,
                            senderId: mongoUserId,
                            content: dataUrl,
                            attachmentType: 'whiteboard',
                            attachmentName: 'Whiteboard Mock-up',
                            caption: 'View the mock-up',
                            isCodeSnippet: false,
                            language: 'plaintext'
                        });
                        setIsWhiteboardOpen(false);
                    }}
                /></Suspense>
            )}

            {/* Create Conversation Modal */}
            {isModalOpen && (
                <ModalOverlay onClick={() => setIsModalOpen(false)}>
                    <ModalContent onClick={e => e.stopPropagation()} style={{ 
                        gap: '24px', 
                        padding: '32px', 
                        maxWidth: '440px', 
                        borderRadius: '24px', 
                        backgroundColor: 'var(--colors-surface)',
                        border: '1px solid var(--colors-border)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: 'var(--colors-textMain)' }}>
                                    {activeTab === 'communities' ? 'Create Community' : 'New Conversation'}
                                </h2>
                                <span style={{ fontSize: '0.85rem', color: 'var(--colors-accent)', fontWeight: '600' }}>
                                    {activeTab === 'communities' ? 'Start a new hub' : (convType === 'direct' ? 'Start a direct chat' : 'Start a group chat')}
                                </span>
                            </div>
                            <IconButton onClick={() => { setIsModalOpen(false); setUserSearchQuery(''); }} style={{ backgroundColor: 'var(--colors-bg)', border: '1px solid var(--colors-border)', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--colors-textMuted)', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--colors-textMain)'; e.currentTarget.style.borderColor = 'var(--colors-textMuted)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--colors-textMuted)'; e.currentTarget.style.borderColor = 'var(--colors-border)'; }}>
                                <X size={18} />
                            </IconButton>
                        </div>

                        {activeTab !== 'communities' && (
                            <div style={{ display: 'flex', gap: '8px', padding: '6px', backgroundColor: 'var(--colors-bg)', border: '1px solid var(--colors-border)', borderRadius: '12px' }}>
                                <div
                                    onClick={() => { setConvType('direct'); setSelectedUsers([]); }}
                                    style={{ flex: 1, padding: '10px', textAlign: 'center', cursor: 'pointer', borderRadius: '8px', backgroundColor: convType === 'direct' ? 'var(--colors-surface)' : 'transparent', color: convType === 'direct' ? 'var(--colors-accent)' : 'var(--colors-textMuted)', border: convType === 'direct' ? '1px solid var(--colors-border)' : '1px solid transparent', transition: 'all 0.2s ease', fontWeight: convType === 'direct' ? '600' : '500', boxShadow: convType === 'direct' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none' }}
                                >
                                    Direct Message
                                </div>
                                <div
                                    onClick={async () => { 
                                        setConvType('group'); 
                                        setSelectedUsers([]); 
                                        setUserSearchQuery('');
                                        setUserSearchResults([]);
                                        // Fetch friends (contacts) for group creation
                                        if (allUsers.length === 0) {
                                            try {
                                                const token = await getAccessTokenSilently();
                                                const res = await fetch(`${BACKEND_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
                                                const users = await res.json();
                                                const friendIds = [...new Set(conversations.filter(c => c.type === 'direct').flatMap(c => c.participants.map(p => p?._id)).filter(id => id && id !== mongoUserId))];
                                                setAllUsers(users.filter(u => u._id !== mongoUserId && friendIds.includes(u._id)));
                                            } catch (err) { console.error('Failed to fetch users:', err); }
                                        }
                                    }}
                                    style={{ flex: 1, padding: '10px', textAlign: 'center', cursor: 'pointer', borderRadius: '8px', backgroundColor: convType === 'group' ? 'var(--colors-surface)' : 'transparent', color: convType === 'group' ? 'var(--colors-accent)' : 'var(--colors-textMuted)', border: convType === 'group' ? '1px solid var(--colors-border)' : '1px solid transparent', transition: 'all 0.2s ease', fontWeight: convType === 'group' ? '600' : '500', boxShadow: convType === 'group' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none' }}
                                >
                                    Group Channel
                                </div>
                            </div>
                        )}

                        {convType === 'group' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <Label style={{ marginBottom: '8px', display: 'block', fontSize: '0.9rem', color: 'var(--colors-textMuted)' }}>{activeTab === 'communities' ? 'Community Name' : 'Group Name'}</Label>
                                    <ModalInput
                                        placeholder={activeTab === 'communities' ? "e.g. Open Source Contributors" : "e.g. Project Alpha"}
                                        value={convName}
                                        onChange={e => setConvName(e.target.value)}
                                        style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--colors-border)', backgroundColor: 'var(--colors-bg)', color: 'var(--colors-textMain)', transition: 'all 0.3s ease' }}
                                        onFocus={(e) => { e.target.style.borderColor = 'var(--colors-accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.15)'; }}
                                        onBlur={(e) => { e.target.style.borderColor = 'var(--colors-border)'; e.target.style.boxShadow = 'none'; }}
                                    />
                                </div>
                                <div>
                                    <Label style={{ marginBottom: '8px', display: 'block', fontSize: '0.9rem', color: 'var(--colors-textMuted)' }}>Description <span style={{fontSize: '0.8rem', opacity: 0.7}}>(optional)</span></Label>
                                    <ModalInput
                                        placeholder="What is this group about?"
                                        value={convDescription}
                                        onChange={e => setConvDescription(e.target.value)}
                                        style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--colors-border)', backgroundColor: 'var(--colors-bg)', color: 'var(--colors-textMain)', transition: 'all 0.3s ease' }}
                                        onFocus={(e) => { e.target.style.borderColor = 'var(--colors-accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.15)'; }}
                                        onBlur={(e) => { e.target.style.borderColor = 'var(--colors-border)'; e.target.style.boxShadow = 'none'; }}
                                    />
                                </div>
                                <div>
                                    <Label style={{ marginBottom: '8px', display: 'block', fontSize: '0.9rem', color: 'var(--colors-textMuted)' }}>Group Image <span style={{fontSize: '0.8rem', opacity: 0.7}}>(optional)</span></Label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        {convAvatarUrl && (
                                            <img src={convAvatarUrl} alt="Preview" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--colors-accent)' }} />
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
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Label style={{ margin: 0, fontSize: '0.9rem', color: 'var(--colors-textMuted)' }}>
                                    {convType === 'direct' ? 'Find by @username' : 'Select Members'}
                                </Label>
                                {convType === 'group' && <span style={{fontSize: '0.8rem', color: 'var(--colors-accent)', fontWeight: '600'}}>Your Contacts</span>}
                            </div>
                            
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--colors-textMuted)', pointerEvents: 'none', transition: 'color 0.3s ease', fontWeight: convType === 'direct' ? '600' : '400', fontSize: convType === 'direct' ? '1rem' : '0.9rem' }} id="new-conv-search-icon">
                                    {convType === 'direct' ? '@' : <Search size={18} />}
                                </div>
                                <ModalInput
                                    placeholder={convType === 'direct' ? 'Search by username (e.g. blossom123 or @blossom123)...' : 'Filter by name or @username...'}
                                    value={userSearchQuery}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setUserSearchQuery(val);
                                        if (convType === 'direct') {
                                            searchUsersDebounced(val);
                                        }
                                    }}
                                    style={{ 
                                        padding: '16px 16px 16px 44px', 
                                        borderRadius: '16px', 
                                        border: '1px solid var(--colors-border)', 
                                        backgroundColor: 'var(--colors-bg)', 
                                        fontSize: '0.95rem',
                                        color: 'var(--colors-textMain)',
                                        transition: 'all 0.3s ease',
                                    }}
                                    onFocus={(e) => { 
                                        e.target.style.borderColor = 'var(--colors-accent)'; 
                                        e.target.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.15)';
                                        document.getElementById('new-conv-search-icon').style.color = 'var(--colors-accent)';
                                    }}
                                    onBlur={(e) => { 
                                        e.target.style.borderColor = 'var(--colors-border)'; 
                                        e.target.style.boxShadow = 'none';
                                        document.getElementById('new-conv-search-icon').style.color = 'var(--colors-textMuted)';
                                    }}
                                />
                            </div>

                            <UserList style={{ 
                                borderRadius: '16px', 
                                backgroundColor: 'var(--colors-bg)', 
                                border: '1px solid var(--colors-border)',
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                minHeight: '200px',
                                maxHeight: convType === 'group' ? '200px' : '350px',
                                padding: '8px 0',
                                marginTop: '4px'
                            }}>
                                {convType === 'direct' ? (() => {
                                    // Direct: username search results
                                    const cleanSearch = normalizeUsername(userSearchQuery);
                                    if (!cleanSearch) {
                                        return (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '180px', padding: '20px', gap: '12px' }}>
                                                <div style={{ padding: '16px', borderRadius: '50%', backgroundColor: 'var(--colors-surface)', border: '1px solid var(--colors-border)' }}>
                                                    <Search size={28} color="var(--colors-textMuted)" strokeWidth={1.5} />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textAlign: 'center' }}>
                                                    <div style={{ color: 'var(--colors-textMain)', fontSize: '0.95rem', fontWeight: 'bold' }}>Search by @username</div>
                                                    <div style={{ color: 'var(--colors-textMuted)', fontSize: '0.82rem' }}>Type a username to find someone</div>

                                                </div>
                                            </div>
                                        );
                                    }
                                    if (isSearchingUsers) {
                                        return (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px', gap: '10px', color: 'var(--colors-textMuted)' }}>
                                                <div style={{ width: '18px', height: '18px', border: '2px solid var(--colors-accent)', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                                Searching...
                                            </div>
                                        );
                                    }
                                    if (userSearchResults.length === 0) {
                                        return (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '180px', padding: '20px', gap: '12px' }}>
                                                <div style={{ padding: '16px', borderRadius: '50%', backgroundColor: 'var(--colors-surface)', border: '1px solid var(--colors-border)' }}>
                                                    <Users size={28} color="var(--colors-textMuted)" strokeWidth={1.5} />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                    <div style={{ color: 'var(--colors-textMain)', fontSize: '0.95rem', fontWeight: 'bold' }}>No users found</div>
                                                    <div style={{ color: 'var(--colors-textMuted)', fontSize: '0.82rem', textAlign: 'center' }}>No user with that username exists</div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return userSearchResults.map(u => (
                                        <div
                                            key={u._id}
                                            onClick={() => toggleUserSelection(u._id)}
                                            style={{ 
                                                padding: '12px 16px', 
                                                margin: '4px 12px',
                                                borderRadius: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '14px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                backgroundColor: selectedUsers.includes(u._id) ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                                                border: '1px solid ' + (selectedUsers.includes(u._id) ? 'var(--colors-accent)' : 'transparent')
                                            }}
                                            onMouseEnter={(e) => { if (!selectedUsers.includes(u._id)) { e.currentTarget.style.backgroundColor = 'var(--colors-surface)'; e.currentTarget.style.borderColor = 'var(--colors-border)'; } }}
                                            onMouseLeave={(e) => { if (!selectedUsers.includes(u._id)) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
                                        >
                                            <AvatarWrapper>
                                                <Avatar src={getAvatarUrl(u.avatarUrl)} onError={(e) => { e.currentTarget.src = '/default-avatar.svg'; }} style={{ width: '40px', height: '40px', border: selectedUsers.includes(u._id) ? '2px solid var(--colors-accent)' : '2px solid var(--colors-surface)' }} />
                                                {activeUsers.includes(u._id) && <OnlineDot style={{ width: '12px', height: '12px', bottom: '-2px', right: '-2px', border: '2.5px solid var(--colors-bg)' }} />}
                                            </AvatarWrapper>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                                                <span style={{ color: 'var(--colors-textMain)', fontSize: '0.95rem', fontWeight: '600', transition: 'color 0.2s ease', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {u.displayName}
                                                    {u.isSelf && <span style={{ fontSize: '0.75rem', color: 'var(--colors-textMuted)', fontWeight: '400' }}>(You)</span>}
                                                </span>
                                                <span style={{ color: 'var(--colors-accent)', fontSize: '0.78rem', fontWeight: '500' }}>{u.username ? `@${u.username}` : (u.techDiscipline || 'Fullstack')}</span>
                                            </div>
                                            <div style={{ 
                                                width: '22px', 
                                                height: '22px', 
                                                borderRadius: '6px', 
                                                border: selectedUsers.includes(u._id) ? 'none' : '2px solid var(--colors-border)',
                                                backgroundColor: selectedUsers.includes(u._id) ? 'var(--colors-accent)' : 'var(--colors-surface)',
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                boxShadow: selectedUsers.includes(u._id) ? '0 0 10px rgba(6, 182, 212, 0.5)' : 'none',
                                                transform: selectedUsers.includes(u._id) ? 'scale(1.05)' : 'scale(1)'
                                            }}>
                                                {selectedUsers.includes(u._id) && (
                                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'popIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}>
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                    ));
                                })() : (() => {
                                    // Group: use contacts list filtered by name
                                    const contactIds = [...new Set(conversations.filter(c => c.type === 'direct').flatMap(c => c.participants.map(p => p?._id)).filter(id => id && id !== mongoUserId))];
                                    const displayedUsers = allUsers.filter(u => contactIds.includes(u._id));
                                    const filtered = displayedUsers.filter(u => u.displayName?.toLowerCase().includes(userSearchQuery.toLowerCase()) || u.username?.toLowerCase().includes(userSearchQuery.toLowerCase()));
                                    
                                    if (filtered.length === 0) {
                                        return (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '180px', padding: '20px', gap: '16px' }}>
                                                <div style={{ padding: '16px', borderRadius: '50%', backgroundColor: 'var(--colors-surface)', border: '1px solid var(--colors-border)' }}>
                                                    <Users size={32} color="var(--colors-textMuted)" strokeWidth={1.5} />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                    <div style={{ color: 'var(--colors-textMain)', fontSize: '1rem', fontWeight: 'bold' }}>No contacts found</div>
                                                    <div style={{ color: 'var(--colors-textMuted)', fontSize: '0.85rem', textAlign: 'center' }}>Start a direct chat with someone first!</div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    
                                    return filtered.map(u => (
                                        <div
                                            key={u._id}
                                            onClick={() => toggleUserSelection(u._id)}
                                            style={{ 
                                                padding: '12px 16px', 
                                                margin: '4px 12px',
                                                borderRadius: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '14px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                backgroundColor: selectedUsers.includes(u._id) ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                                                border: '1px solid ' + (selectedUsers.includes(u._id) ? 'var(--colors-accent)' : 'transparent')
                                            }}
                                            onMouseEnter={(e) => { if (!selectedUsers.includes(u._id)) { e.currentTarget.style.backgroundColor = 'var(--colors-surface)'; e.currentTarget.style.borderColor = 'var(--colors-border)'; } }}
                                            onMouseLeave={(e) => { if (!selectedUsers.includes(u._id)) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
                                        >
                                            <AvatarWrapper>
                                                <Avatar src={getAvatarUrl(u.avatarUrl)} onError={(e) => { e.currentTarget.src = '/default-avatar.svg'; }} style={{ width: '40px', height: '40px', border: selectedUsers.includes(u._id) ? '2px solid var(--colors-accent)' : '2px solid var(--colors-surface)' }} />
                                                {activeUsers.includes(u._id) && <OnlineDot style={{ width: '12px', height: '12px', bottom: '-2px', right: '-2px', border: '2.5px solid var(--colors-bg)' }} />}
                                            </AvatarWrapper>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                                                <span style={{ color: 'var(--colors-textMain)', fontSize: '0.95rem', fontWeight: '600', transition: 'color 0.2s ease' }}>{u.displayName}</span>
                                                <span style={{ color: selectedUsers.includes(u._id) ? 'var(--colors-accent)' : 'var(--colors-textMuted)', fontSize: '0.75rem', transition: 'color 0.2s ease' }}>{u.username ? `@${u.username}` : (u.techDiscipline || 'Fullstack')}</span>
                                            </div>
                                            
                                            {/* DevSup Premium Checkbox */}
                                            <div style={{ 
                                                width: '22px', 
                                                height: '22px', 
                                                borderRadius: '6px', 
                                                border: selectedUsers.includes(u._id) ? 'none' : '2px solid var(--colors-border)',
                                                backgroundColor: selectedUsers.includes(u._id) ? 'var(--colors-accent)' : 'var(--colors-surface)',
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                boxShadow: selectedUsers.includes(u._id) ? '0 0 10px rgba(6, 182, 212, 0.5)' : 'none',
                                                transform: selectedUsers.includes(u._id) ? 'scale(1.05)' : 'scale(1)'
                                            }}>
                                                {selectedUsers.includes(u._id) && (
                                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'popIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}>
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </UserList>
                        </div>

                        <Button
                            variant="primary"
                            fullWidth
                            onClick={handleCreateConversation}
                            disabled={selectedUsers.length === 0 || (convType === 'group' && !convName)}
                            style={{ 
                                padding: '16px', 
                                borderRadius: '16px', 
                                fontSize: '1.05rem', 
                                fontWeight: '700', 
                                marginTop: '4px',
                                backgroundColor: selectedUsers.length > 0 && (convType === 'direct' || convName) ? 'var(--colors-accent)' : 'var(--colors-bg)',
                                color: selectedUsers.length > 0 && (convType === 'direct' || convName) ? '#ffffff' : 'var(--colors-textMuted)',
                                border: selectedUsers.length > 0 && (convType === 'direct' || convName) ? 'none' : '1px solid var(--colors-border)',
                                cursor: selectedUsers.length === 0 || (convType === 'group' && !convName) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: selectedUsers.length > 0 && (convType === 'direct' || convName) ? '0 8px 25px -5px rgba(6, 182, 212, 0.5)' : 'none',
                                transform: selectedUsers.length > 0 && (convType === 'direct' || convName) ? 'translateY(-2px)' : 'none'
                            }}
                            onMouseEnter={(e) => { if (selectedUsers.length > 0 && (convType === 'direct' || convName)) { e.currentTarget.style.backgroundColor = 'var(--colors-accentHover)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px -5px rgba(6, 182, 212, 0.6)'; } }}
                            onMouseLeave={(e) => { if (selectedUsers.length > 0 && (convType === 'direct' || convName)) { e.currentTarget.style.backgroundColor = 'var(--colors-accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px -5px rgba(6, 182, 212, 0.5)'; } }}
                            onMouseDown={(e) => { if (selectedUsers.length > 0 && (convType === 'direct' || convName)) { e.currentTarget.style.transform = 'translateY(1px)'; e.currentTarget.style.boxShadow = '0 4px 15px -5px rgba(6, 182, 212, 0.4)'; } }}
                            onMouseUp={(e) => { if (selectedUsers.length > 0 && (convType === 'direct' || convName)) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px -5px rgba(6, 182, 212, 0.6)'; } }}
                        >
                            {activeTab === 'communities' ? 'Create Community' : (convType === 'group' ? 'Start Group Chat' : 'Start Direct Chat')}
                        </Button>
                    </ModalContent>
                </ModalOverlay>
            )}

            {/* Add Members Modal */}
            {isAddMembersModalOpen && activeConversation?.type === 'group' && (
                <ModalOverlay onClick={() => setIsAddMembersModalOpen(false)}>
                    <ModalContent onClick={e => e.stopPropagation()} style={{ 
                        gap: '24px', 
                        padding: '32px', 
                        maxWidth: '440px', 
                        borderRadius: '24px', 
                        backgroundColor: 'var(--colors-surface)',
                        border: '1px solid var(--colors-border)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: 'var(--colors-textMain)' }}>Add Members</h2>
                                <span style={{ fontSize: '0.85rem', color: 'var(--colors-accent)', fontWeight: '600' }}>Expand your group</span>
                            </div>
                            <IconButton onClick={() => setIsAddMembersModalOpen(false)} style={{ backgroundColor: 'var(--colors-bg)', border: '1px solid var(--colors-border)', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--colors-textMuted)', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--colors-textMain)'; e.currentTarget.style.borderColor = 'var(--colors-textMuted)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--colors-textMuted)'; e.currentTarget.style.borderColor = 'var(--colors-border)'; }}>
                                <X size={18} />
                            </IconButton>
                        </div>

                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--colors-textMuted)', pointerEvents: 'none', transition: 'color 0.3s ease' }} id="add-members-search-icon">
                                <Search size={18} />
                            </div>
                            <ModalInput
                                placeholder="Search by name..."
                                value={addMembersSearchQuery}
                                onChange={e => setAddMembersSearchQuery(e.target.value)}
                                style={{ 
                                    padding: '16px 16px 16px 44px', 
                                    borderRadius: '16px', 
                                    border: '1px solid var(--colors-border)', 
                                    backgroundColor: 'var(--colors-bg)', 
                                    fontSize: '0.95rem',
                                    color: 'var(--colors-textMain)',
                                    transition: 'all 0.3s ease',
                                }}
                                onFocus={(e) => { 
                                    e.target.style.borderColor = 'var(--colors-accent)'; 
                                    e.target.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.15)';
                                    document.getElementById('add-members-search-icon').style.color = 'var(--colors-accent)';
                                }}
                                onBlur={(e) => { 
                                    e.target.style.borderColor = 'var(--colors-border)'; 
                                    e.target.style.boxShadow = 'none';
                                    document.getElementById('add-members-search-icon').style.color = 'var(--colors-textMuted)';
                                }}
                            />
                        </div>

                        <UserList style={{ 
                            borderRadius: '16px', 
                            backgroundColor: 'var(--colors-bg)', 
                            border: '1px solid var(--colors-border)',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            minHeight: '240px',
                            maxHeight: '350px',
                            padding: '8px 0',
                        }}>
                            {(() => {
                                const contactIds = [...new Set(conversations.filter(c => c.type === 'direct').flatMap(c => c.participants.map(p => p?._id)).filter(id => id && id !== mongoUserId))];
                                const existingMemberIds = activeConversation.participants?.map(p => p._id) || [];
                                
                                const availableContacts = allUsers.filter(u => contactIds.includes(u._id) && !existingMemberIds.includes(u._id));
                                const cleanQ = normalizeUsername(addMembersSearchQuery);
                                const filtered = availableContacts.filter(u => 
                                    u.displayName?.toLowerCase().includes(addMembersSearchQuery.toLowerCase()) || 
                                    (cleanQ && u.username?.toLowerCase().includes(cleanQ))
                                );
                                
                                if (filtered.length === 0) {
                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '220px', padding: '40px 20px', gap: '16px' }}>
                                            <div style={{ padding: '16px', borderRadius: '50%', backgroundColor: 'var(--colors-surface)', border: '1px solid var(--colors-border)' }}>
                                                <Users size={36} color="var(--colors-textMuted)" strokeWidth={1.5} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                <div style={{ color: 'var(--colors-textMain)', fontSize: '1.05rem', fontWeight: 'bold' }}>No contacts found</div>
                                                <div style={{ color: 'var(--colors-textMuted)', fontSize: '0.85rem', textAlign: 'center' }}>Try searching for a different name</div>
                                            </div>
                                        </div>
                                    );
                                }
                                
                                return filtered.map(u => (
                                    <div
                                        key={u._id}
                                        onClick={() => {
                                            setSelectedMembersToAdd(prev => 
                                                prev.includes(u._id) ? prev.filter(id => id !== u._id) : [...prev, u._id]
                                            );
                                        }}
                                        style={{ 
                                            padding: '12px 16px', 
                                            margin: '4px 12px',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '14px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            backgroundColor: selectedMembersToAdd.includes(u._id) ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                                            border: '1px solid ' + (selectedMembersToAdd.includes(u._id) ? 'var(--colors-accent)' : 'transparent')
                                        }}
                                        onMouseEnter={(e) => { if (!selectedMembersToAdd.includes(u._id)) { e.currentTarget.style.backgroundColor = 'var(--colors-surface)'; e.currentTarget.style.borderColor = 'var(--colors-border)'; } }}
                                        onMouseLeave={(e) => { if (!selectedMembersToAdd.includes(u._id)) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
                                    >
                                        <AvatarWrapper>
                                            <Avatar src={getAvatarUrl(u.avatarUrl)} onError={(e) => { e.currentTarget.src = '/default-avatar.svg'; }} style={{ width: '40px', height: '40px', border: selectedMembersToAdd.includes(u._id) ? '2px solid var(--colors-accent)' : '2px solid var(--colors-surface)' }} />
                                            {activeUsers.includes(u._id) && <OnlineDot style={{ width: '12px', height: '12px', bottom: '-2px', right: '-2px', border: '2.5px solid var(--colors-bg)' }} />}
                                        </AvatarWrapper>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                                            <span style={{ color: 'var(--colors-textMain)', fontSize: '0.95rem', fontWeight: '600', transition: 'color 0.2s ease' }}>{u.displayName}</span>
                                            <span style={{ color: selectedMembersToAdd.includes(u._id) ? 'var(--colors-accent)' : 'var(--colors-textMuted)', fontSize: '0.75rem', transition: 'color 0.2s ease' }}>
                                                {u.username ? `@${u.username}` : (u.techDiscipline || 'Fullstack')}
                                            </span>
                                        </div>
                                        
                                        {/* DevSup Premium Checkbox */}
                                        <div style={{ 
                                            width: '22px', 
                                            height: '22px', 
                                            borderRadius: '6px', 
                                            border: selectedMembersToAdd.includes(u._id) ? 'none' : '2px solid var(--colors-border)',
                                            backgroundColor: selectedMembersToAdd.includes(u._id) ? 'var(--colors-accent)' : 'var(--colors-surface)',
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: selectedMembersToAdd.includes(u._id) ? '0 0 10px rgba(6, 182, 212, 0.5)' : 'none',
                                            transform: selectedMembersToAdd.includes(u._id) ? 'scale(1.05)' : 'scale(1)'
                                        }}>
                                            {selectedMembersToAdd.includes(u._id) && (
                                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'popIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}>
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                ));
                            })()}
                        </UserList>

                        <Button
                            variant="primary"
                            fullWidth
                            onClick={handleAddMembersToGroup}
                            disabled={selectedMembersToAdd.length === 0}
                            style={{ 
                                padding: '16px', 
                                borderRadius: '16px', 
                                fontSize: '1.05rem', 
                                fontWeight: '700', 
                                marginTop: '4px',
                                backgroundColor: selectedMembersToAdd.length > 0 ? 'var(--colors-accent)' : 'var(--colors-bg)',
                                color: selectedMembersToAdd.length > 0 ? '#ffffff' : 'var(--colors-textMuted)',
                                border: selectedMembersToAdd.length > 0 ? 'none' : '1px solid var(--colors-border)',
                                cursor: selectedMembersToAdd.length === 0 ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: selectedMembersToAdd.length > 0 ? '0 8px 25px -5px rgba(6, 182, 212, 0.5)' : 'none',
                                transform: selectedMembersToAdd.length > 0 ? 'translateY(-2px)' : 'none'
                            }}
                            onMouseEnter={(e) => { if (selectedMembersToAdd.length > 0) { e.currentTarget.style.backgroundColor = 'var(--colors-accentHover)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px -5px rgba(6, 182, 212, 0.6)'; } }}
                            onMouseLeave={(e) => { if (selectedMembersToAdd.length > 0) { e.currentTarget.style.backgroundColor = 'var(--colors-accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px -5px rgba(6, 182, 212, 0.5)'; } }}
                            onMouseDown={(e) => { if (selectedMembersToAdd.length > 0) { e.currentTarget.style.transform = 'translateY(1px)'; e.currentTarget.style.boxShadow = '0 4px 15px -5px rgba(6, 182, 212, 0.4)'; } }}
                            onMouseUp={(e) => { if (selectedMembersToAdd.length > 0) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 30px -5px rgba(6, 182, 212, 0.6)'; } }}
                        >
                            {selectedMembersToAdd.length > 0 ? `Add ${selectedMembersToAdd.length} Member${selectedMembersToAdd.length !== 1 ? 's' : ''}` : 'Add Members'}
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
                                                        ? getAvatarUrl(c.avatarUrl)
                                                        : getAvatarUrl(otherParticipant?.avatarUrl)}
                                                    onError={(e) => { e.currentTarget.src = '/default-avatar.svg'; }}
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
                <Suspense fallback={null}><StatusUploadModal
                    onClose={() => setIsStatusModalOpen(false)}
                    BACKEND_URL={BACKEND_URL}
                    getAccessTokenSilently={getAccessTokenSilently}
                    onUpload={handleStatusUpload}
                    initialMode={statusUploadMode}
                    isMobileViewport={isMobileViewport}
                /></Suspense>
            )}

            {storyViewerInitialUserIndex !== null && (
                <Suspense fallback={null}><StoryViewer
                    groupedStatuses={groupedStatuses}
                    initialUserIndex={storyViewerInitialUserIndex}
                    onClose={() => setStoryViewerInitialUserIndex(null)}
                    currentUserId={mongoUserId}
                    markViewed={handleMarkStatusViewed}
                    onDelete={handleDeleteStatus}
                    onForward={handleForwardStatus}
                    onReshare={handleReshareStatus}
                    readReceipts={appSettings.readReceipts}
                    onReply={handleReplyStatus}
                /></Suspense>
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
                            ) : chatUploadFile?.type?.startsWith('image/') ? (
                                <img src={chatUploadPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '32px', color: '#fff', textAlign: 'center' }}>
                                    <FileText size={48} />
                                    <span style={{ overflowWrap: 'anywhere' }}>{chatUploadFile?.name}</span>
                                    <span style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
                                        {chatUploadFile ? `${(chatUploadFile.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                                    </span>
                                </div>
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

            <Suspense fallback={null}><CallOverlay
                socket={socket}
                mongoUserId={mongoUserId}
                activeConversation={activeConversation}
                callConfig={callConfig}
                currentUserData={currentUserData}
                getAccessTokenSilently={getAccessTokenSilently}
                backendUrl={BACKEND_URL}
                availableContacts={availableContacts}
                allUsers={allUsers}
                onEndCall={() => setCallConfig({ active: false, isReceiving: false, callerData: null, callType: 'video' })}
            /></Suspense>

            {contextMenu.visible && (contextMenu.message || contextMenu.callLog || contextMenu.conversation) && (
                <>
                    <MobileOnlyOverlay onClick={() => setContextMenu({ ...contextMenu, visible: false })} />
                    <ContextMenuContainer style={{ top: contextMenu.y, left: contextMenu.x, zIndex: 2000, position: 'fixed' }}>
                    {contextMenu.conversation && (
                        <>
                            <ContextMenuItem onClick={() => {
                                selectChat(contextMenu.conversation._id);
                                setContextMenu({ ...contextMenu, visible: false });
                            }}>
                                <CheckSquare size={16} />
                                Select {contextMenu.conversation.type === 'group' ? 'community' : 'chat'}
                            </ContextMenuItem>
                            <ContextMenuItem onClick={(e) => { 
                                setContextMenu({ ...contextMenu, visible: false }); 
                                if (contextMenu.conversation.type === 'group') {
                                    socket.emit('leave_conversation', { conversationId: contextMenu.conversation._id, userId: mongoUserId });
                                } else {
                                    deleteConversation(e, contextMenu.conversation._id); 
                                }
                            }} style={{ color: '#ef4444' }}>
                                <Trash2 size={16} />
                                {contextMenu.conversation.type === 'group' ? 'Leave Community' : 'Delete Chat'}
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
                            {!contextMenu.message.isDeletedForEveryone && <ContextMenuItem onClick={() => {
                                selectMessage(contextMenu.message._id || contextMenu.message.createdAt);
                                setContextMenu({ ...contextMenu, visible: false });
                            }}>
                                <CheckSquare size={16} />
                                Select message
                            </ContextMenuItem>}
                            {!contextMenu.message.isDeletedForEveryone && !isAudioUrl(contextMenu.message.content) && contextMenu.message.sender._id === mongoUserId && (
                                <ContextMenuItem onClick={() => startEditing(contextMenu.message)}>
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
                                    Edit Message
                                </ContextMenuItem>
                            )}
                            {!contextMenu.message.isDeletedForEveryone && !isAudioUrl(contextMenu.message.content) && (
                                <ContextMenuItem onClick={() => {
                                    navigator.clipboard.writeText(contextMenu.message.content);
                                    setContextMenu({ ...contextMenu, visible: false });
                                }}>
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg>
                                    Copy Text
                                </ContextMenuItem>
                            )}
                            {!contextMenu.message.isDeletedForEveryone && <ContextMenuItem onClick={() => {
                                setForwardMessageData(contextMenu.message);
                                setContextMenu({ ...contextMenu, visible: false });
                            }}>
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 4l-1.41 1.41L15.17 10H4v2h11.17l-4.58 4.59L12 18l7-7z"></path></svg>
                                Forward Message
                            </ContextMenuItem>}
                            {!contextMenu.message.isDeletedForEveryone && <ContextMenuItem onClick={() => {
                                deleteMessage(contextMenu.message);
                                setContextMenu({ ...contextMenu, visible: false });
                            }} style={{ color: '#ef4444' }}>
                                <Trash2 size={16} />
                                Delete Message
                            </ContextMenuItem>}
                        </>
                    )}
                    {contextMenu.callLog && (
                        <>
                            <ContextMenuItem onClick={() => {
                                selectCallLog(contextMenu.callLog.id);
                                setContextMenu({ ...contextMenu, visible: false });
                            }}>
                                <CheckSquare size={16} />
                                Select call log
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => openConversationWith(contextMenu.callLog.contactId)}>
                                <MessageSquare size={16} />
                                Message
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => openConversationWith(contextMenu.callLog.contactId, 'audio')}>
                                <Phone size={16} />
                                Voice Call
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => openConversationWith(contextMenu.callLog.contactId, 'video')}>
                                <Video size={16} />

                                Video Call
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => deleteCallLog(contextMenu.callLog.id)} style={{ color: '#ef4444' }}>
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                                Delete Call Log
                            </ContextMenuItem>
                        </>
                    )}
                </ContextMenuContainer>
                </>
            )}

            {/* Premium Feature Placeholder Modal */}
            {premiumModal && (
                <ModalOverlay onClick={() => setPremiumModal(null)} style={{ zIndex: 9999, backdropFilter: 'blur(8px)', backgroundColor: 'rgba(11, 15, 25, 0.8)' }}>
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
                            {premiumModal.type === 'hackathon' ? <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> : <DevSupLogo size={42} />}
                        </div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '500', color: 'var(--colors-textMain)', margin: 0, letterSpacing: '-0.5px', position: 'relative', zIndex: 1, textAlign: 'center' }}>{premiumModal.title}</h2>
                        <p style={{ color: 'var(--colors-textMuted)', fontSize: '1.05rem', textAlign: 'center', margin: '0 0 24px 0', lineHeight: 1.6, position: 'relative', zIndex: 1 }}>
                            {premiumModal.subtitle}
                        </p>
                        <div style={{ display: 'flex', gap: '16px', width: '100%', position: 'relative', zIndex: 1 }}>
                            <Button 
                                variant="outline" 
                                onClick={() => setPremiumModal(null)}
                                style={{ flex: 1, padding: '14px', borderRadius: '12px', fontWeight: '500', fontSize: '1rem', border: '1px solid var(--colors-border)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--colors-textMain)' }}
                            >
                                Not Now
                            </Button>
                            <Button 
                                variant="primary" 
                                onClick={() => { setPremiumModal(null); showToast('Joined waitlist!'); }}
                                style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--colors-accent) 0%, #0891b2 100%)', color: '#fff', border: 'none', fontWeight: '500', fontSize: '1rem', boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)' }}
                            >
                                Join Waitlist
                            </Button>
                        </div>
                    </ModalContent>
                </ModalOverlay>
            )}

            {/* Toast Notification */}
            {toastMessage && (
                <ToastNotification role="status" aria-live="polite">

                    {toastMessage}
                </ToastNotification>
            )}

            {incomingMessageNotification && (
                <IncomingMessageNotification aria-label="New message notification" aria-live="polite">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <img 
                            src={getAvatarUrl(incomingMessageNotification.sender?.avatarUrl)} 
                            alt="" 
                            onError={(e) => { e.currentTarget.src = '/default-avatar.svg'; }}
                            style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }} 
                        />
                        <div style={{ minWidth: 0, flex: 1, marginTop: '2px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ fontSize: '1rem', color: '#e9edef', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {incomingMessageNotification.sender?.displayName || 'New message'}
                                </strong>
                                <span style={{ fontSize: '0.75rem', color: '#8696a0' }}>Now</span>
                            </div>
                            <div style={{ marginTop: '4px', color: '#8696a0', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {appSettings.showPreviews === false
                                    ? 'You received a message'
                                    : (typeof incomingMessageNotification.content === 'string' && incomingMessageNotification.content.startsWith('$CALL_LOG$'))
                                        ? (() => {
                                            const parts = incomingMessageNotification.content.split('|');
                                            const cType = parts[1] === 'video' ? 'video call' : 'voice call';
                                            return parts[2] === 'missed' ? `Missed ${cType}` : (parts[1] === 'video' ? 'Video call' : 'Voice call');
                                        })()
                                        : incomingMessageNotification.content || 'You sent an attachment'}
                            </div>
                        </div>
                        <button
                            type="button"
                            aria-label="Dismiss message notification"
                            onClick={() => setIncomingMessageNotification(null)}
                            style={{ background: 'none', border: 0, color: '#8696a0', cursor: 'pointer', padding: '4px', marginLeft: '-4px', transition: 'color 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.color = '#e9edef'}
                            onMouseOut={e => e.currentTarget.style.color = '#8696a0'}
                        >
                            <X size={18} />
                        </button>
                    </div>
                    <form onSubmit={handleNotificationReply} style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <input
                            aria-label="Reply to message"
                            value={notificationReply}
                            onChange={(e) => setNotificationReply(e.target.value)}
                            placeholder="Reply..."
                            autoFocus
                            style={{
                                minWidth: 0,
                                flex: 1,
                                padding: '10px 14px',
                                borderRadius: '20px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                color: '#e9edef',
                                outline: 'none',
                                fontSize: '0.95rem',
                                transition: 'all 0.2s',
                            }}
                            onFocus={e => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.borderColor = '#00a884'; }}
                            onBlur={e => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
                        />
                        <button
                            type="submit"
                            disabled={!notificationReply.trim()}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                border: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: notificationReply.trim() ? '#00a884' : 'rgba(255, 255, 255, 0.1)',
                                color: notificationReply.trim() ? '#111b21' : '#8696a0',
                                cursor: notificationReply.trim() ? 'pointer' : 'default',
                                transition: 'all 0.2s',
                                transform: notificationReply.trim() ? 'scale(1)' : 'scale(0.95)',
                            }}
                        >
                            <SendIcon />
                        </button>
                    </form>
                </IncomingMessageNotification>
            )}

            {/* Delete Message Confirmation Modal */}
            {deleteMessagePrompt.visible && (
                <ModalOverlay onClick={() => {
                    if (!isDeletingMessages) setDeleteMessagePrompt({ visible: false, conversationId: null, messageIds: [], allowDeleteForEveryone: false });
                }} style={{ zIndex: 9999, backdropFilter: 'blur(4px)', backgroundColor: 'rgba(11, 20, 26, 0.85)' }}>
                    <ModalContent onClick={e => e.stopPropagation()} style={{ 
                        maxWidth: '360px', 
                        width: '100%',
                        padding: '24px', 
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        background: 'var(--colors-surface)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '16px',
                        boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
                        animation: '0.2s cubic-bezier(0.16, 1, 0.3, 1) 0s 1 normal none running toastEnter'
                    }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--colors-textMain)', margin: '0 0 8px 0' }}>Delete message?</h2>
                            <p style={{ color: 'var(--colors-textMuted)', fontSize: '0.9rem', margin: 0, lineHeight: 1.4 }}>
                                {deleteMessagePrompt.allowDeleteForEveryone
                                    ? 'You can delete this message for everyone, or just for yourself.'
                                    : 'This message will be deleted for you.'}
                            </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '8px' }}>
                            {deleteMessagePrompt.allowDeleteForEveryone && (
                                <Button
                                    variant="outline" 
                                    onClick={confirmDeleteForEveryone}
                                    style={{ padding: '12px', borderRadius: '10px', background: 'transparent', color: 'var(--colors-textMain)', border: '1px solid var(--colors-border)', fontWeight: '600', fontSize: '0.95rem', transition: 'all 0.2s', cursor: 'pointer' }}
                                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    Delete for everyone
                                </Button>
                            )}
                            <Button 
                                variant="outline" 
                                onClick={confirmDeleteForMe}
                                style={{ padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '0.95rem', border: '1px solid var(--colors-border)', backgroundColor: 'transparent', color: 'var(--colors-textMain)', transition: 'all 0.2s', cursor: 'pointer' }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            >
                                {deleteMessagePrompt.allowDeleteForEveryone ? 'Delete for me' : 'Delete'}
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => setDeleteMessagePrompt({ visible: false, conversationId: null, messageIds: [], allowDeleteForEveryone: false })}
                                style={{ padding: '12px', borderRadius: '10px', fontWeight: '500', fontSize: '0.95rem', border: 'none', backgroundColor: 'transparent', color: 'var(--colors-textMuted)', marginTop: '4px', cursor: 'pointer' }}
                                onMouseOver={e => e.currentTarget.style.color = 'var(--colors-textMain)'}
                                onMouseOut={e => e.currentTarget.style.color = 'var(--colors-textMuted)'}
                            >
                                Cancel
                            </Button>
                        </div>
                    </ModalContent>
                </ModalOverlay>
            )}

            {/* New Call / Message Picker Modal */}
            {isNewCallModalOpen && (
                <ModalOverlay onClick={() => setIsNewCallModalOpen(false)} style={{ zIndex: 9999 }}>
                    <ModalContent onClick={e => e.stopPropagation()} style={{
                        gap: '20px',
                        padding: '28px',
                        maxWidth: '460px',
                        borderRadius: '24px',
                        backgroundColor: 'var(--colors-surface)',
                        border: '1px solid var(--colors-border)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        maxHeight: '85vh',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: '800', color: 'var(--colors-textMain)' }}>
                                    New Call
                                </h2>
                                <span style={{ fontSize: '0.85rem', color: 'var(--colors-accent, #00e5ff)', fontWeight: '500' }}>
                                    Select a contact to call
                                </span>
                            </div>
                            <IconButton onClick={() => setIsNewCallModalOpen(false)} style={{ backgroundColor: 'var(--colors-bg)', border: '1px solid var(--colors-border)', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--colors-textMuted)' }}>
                                <X size={18} />
                            </IconButton>
                        </div>

                        {/* Search Input */}
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--colors-textMuted)' }} />
                            <input
                                type="text"
                                placeholder="Search name or username..."
                                value={newCallSearchQuery}
                                onChange={(e) => setNewCallSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    backgroundColor: 'var(--colors-bg)',
                                    border: '1px solid var(--colors-border)',
                                    borderRadius: '12px',
                                    padding: '12px 14px 12px 42px',
                                    color: 'var(--colors-textMain)',
                                    fontSize: '0.92rem',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Contact List */}
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px' }}>
                            {(() => {
                                const pool = [...(availableContacts || []), ...(allUsers || [])];
                                const uniqueContacts = [];
                                const seen = new Set();
                                pool.forEach(u => {
                                    const id = String(u._id || u);
                                    if (id && id !== String(mongoUserId) && !seen.has(id)) {
                                        seen.add(id);
                                        uniqueContacts.push(u);
                                    }
                                });

                                if (!newCallSearchQuery.trim()) {
                                    return (
                                        <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--colors-textMuted)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                            <Search size={34} style={{ opacity: 0.35, color: 'var(--colors-accent, #00e5ff)' }} />
                                            <span>Type a name or username to search for someone to call</span>
                                        </div>
                                    );
                                }

                                const q = newCallSearchQuery.toLowerCase().trim();
                                const filtered = uniqueContacts.filter(u => {
                                    const name = (u.displayName || '').toLowerCase();
                                    const uname = (u.username || '').toLowerCase();
                                    return name.includes(q) || uname.includes(q);
                                });

                                if (filtered.length === 0) {
                                    return (
                                        <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--colors-textMuted)', fontSize: '0.9rem' }}>
                                            No users found matching "{newCallSearchQuery}"
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
                                            padding: '10px 14px',
                                            backgroundColor: 'var(--colors-bg)',
                                            borderRadius: '12px',
                                            border: '1px solid var(--colors-border)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                                            <AvatarWrapper style={{ width: '42px', height: '42px', flexShrink: 0 }}>
                                                <Avatar
                                                    src={contact.avatarUrl || '/default-avatar.svg'}
                                                    style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                                                    onError={(e) => { e.currentTarget.src = '/default-avatar.svg'; }}
                                                />
                                            </AvatarWrapper>
                                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                                <span style={{ fontSize: '0.94rem', fontWeight: '600', color: 'var(--colors-textMain)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {contact.displayName || contact.username || 'Developer'}
                                                </span>
                                                <span style={{ fontSize: '0.78rem', color: 'var(--colors-textMuted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {contact.techDiscipline || (contact.username ? `@${contact.username}` : 'Available')}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                            <IconButton
                                                onClick={() => {
                                                    setIsNewCallModalOpen(false);
                                                    openConversationWith(contact._id, 'audio');
                                                }}
                                                style={{ color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)', width: '38px', height: '38px', borderRadius: '50%' }}
                                                title="Voice Call"
                                            >
                                                <Phone size={17} />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => {
                                                    setIsNewCallModalOpen(false);
                                                    openConversationWith(contact._id, 'video');
                                                }}
                                                style={{ color: 'var(--colors-accent, #00e5ff)', backgroundColor: 'rgba(0, 229, 255, 0.1)', width: '38px', height: '38px', borderRadius: '50%' }}
                                                title="Video Call"
                                            >
                                                <Video size={17} />
                                            </IconButton>
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </ModalContent>
                </ModalOverlay>
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
                            <DevSupLogo size={42} />
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