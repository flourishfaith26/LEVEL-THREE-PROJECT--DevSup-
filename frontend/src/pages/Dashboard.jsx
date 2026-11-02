import { lazy, Suspense, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
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
import { Brush, MessageSquare, LogOut, Code2, Users, Settings, Video, Phone, Search, MoreVertical, CircleDashed, Bell, BellOff, Lock, Key, HelpCircle, Monitor, Mic, Square, Play, Pause, Plus, X, ArrowLeft, Image, Star, Clock, ShieldAlert, ShieldCheck, ThumbsDown, Trash2, Briefcase, Link as LinkIcon, UserPlus, Timer, Info, Rocket, CheckSquare, XCircle, Eraser, ChevronRight, Check, CheckCheck, FileText, Maximize2 } from 'lucide-react';
import { AccountPane, PrivacyPane, ChatsPane, NotificationsPane, KeyboardShortcutsPane, HelpPane, ProfilePane } from '../components/SettingsPanes';
const StoryViewer = lazy(() => import('../components/StoryViewer'));
import { motion } from 'framer-motion';
const StatusUploadModal = lazy(() => import('../components/StatusUploadModal'));
const EventsView = lazy(() => import('../components/EventsView'));
import { useNavigate } from 'react-router-dom';
import { normalizeUsername } from '../utils/username.js';

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
    padding: '$3',
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
        padding: '16px',
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

const floatDoodle = keyframes({
    '0%': { backgroundPosition: 'center, 0px 0px, 0% 50%' },
    '50%': { backgroundPosition: 'center, 200px 200px, 100% 50%' },
    '100%': { backgroundPosition: 'center, 400px 400px, 0% 50%' },
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
    minWidth: '90px',
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
            width: '240px',
            maxWidth: '100%',
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

const compareMessages = (a, b) => {
    if (Boolean(a.pending) !== Boolean(b.pending)) return a.pending ? 1 : -1;

    const aHasSequence = Number.isFinite(a.sequence);
    const bHasSequence = Number.isFinite(b.sequence);

    if (aHasSequence !== bHasSequence) return aHasSequence ? 1 : -1;
    if (aHasSequence && a.sequence !== b.sequence) return a.sequence - b.sequence;

    const createdAtDifference = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (createdAtDifference !== 0) return createdAtDifference;
    return String(a._id || '').localeCompare(String(b._id || ''));
};

// --- Main Dashboard Component ---
export default function Dashboard() {
    const { user, logout, getAccessTokenSilently } = useAuth0();
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

    const groupedStatuses = useMemo(() => Object.values(statuses
        .filter(status => status.uploader && statusClock - new Date(status.createdAt).getTime() < STATUS_LIFETIME_MS)
        .reduce((groups, status) => {
            const uploaderId = status.uploader._id;
            if (!uploaderId) return groups;
            if (!groups[uploaderId]) groups[uploaderId] = { user: status.uploader, statuses: [] };
            groups[uploaderId].statuses.push(status);
            return groups;
        }, {})), [statuses, statusClock]);
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
    const [mediaViewer, setMediaViewer] = useState(null);
    const [settingsSearchQuery, setSettingsSearchQuery] = useState('');

    useEffect(() => {
        const handleResize = () => {
            const isMobile = window.innerWidth <= 768;
            setIsMobileViewport(isMobile);
            if (isMobile) {
                setIsWhiteboardOpen(false);
                sessionStorage.removeItem('isWhiteboardOpen');
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
        if (!mediaViewer) return undefined;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') setMediaViewer(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [mediaViewer]);
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

    const formatCallLog = (log, currentUserId) => {
        const isCaller = String(log.caller?._id || log.caller) === String(currentUserId);
        const isGroup = log.conversation?.type === 'group';
        const contact = isGroup ? log.conversation : (isCaller ? log.receiver : log.caller);
        
        return {
            id: log._id,
            contactId: contact ? contact._id : null,
            contactName: isGroup ? contact.name : (contact ? contact.displayName : 'Unknown'),
            contactAvatar: contact ? (isGroup ? contact.avatarUrl || `https://ui-avatars.com/api/?name=${contact.name}&background=06B6D4&color=fff` : contact.avatarUrl) : null,
            type: log.type,
            direction: isCaller ? 'outgoing' : 'incoming',
            status: log.status,
            timestamp: new Date(log.createdAt).getTime()
        };
    };

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

    // Edit/Delete State
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editInputContent, setEditInputContent] = useState('');
    const [replyingToMessage, setReplyingToMessage] = useState(null);

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
                    if (window.innerWidth > 768) {
                        setActiveConversationId(initialConversations[0]._id);
                    }
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
                newSocket.on('reconnect', () => {
                    newSocket.emit('user_connected', mongoUser._id);
                });
                if (newSocket.connected) {
                    newSocket.emit('user_connected', mongoUser._id);
                }

                newSocket.on('presence_update', (onlineUserIds) => {
                    setActiveUsers(onlineUserIds);
                });

                newSocket.on('receive_message', (incomingMessage) => {
                    const incomingSenderId = String(incomingMessage.sender?._id || incomingMessage.sender || '');
                    const currentUid = String(mongoUser._id || '');
                    if (incomingSenderId && currentUid && incomingSenderId !== currentUid) {
                        newSocket.emit('mark_messages_delivered', { 
                            conversationId: incomingMessage.conversationId, 
                            userId: currentUid, 
                            messageIds: [incomingMessage._id] 
                        });

                        if (activeConversationIdRef.current === incomingMessage.conversationId && appSettingsRef.current?.readReceipts) {
                            newSocket.emit('mark_messages_read', {
                                conversationId: incomingMessage.conversationId,
                                userId: currentUid,
                                messageIds: [incomingMessage._id]
                            });
                        }

                        const messageId = String(incomingMessage._id || '');
                        const conversationId = String(incomingMessage.conversationId || '');
                        if (
                            messageId &&
                            !notifiedMessageIdsRef.current.has(messageId) &&
                            appSettingsRef.current?.messageAlerts === true &&
                            !mutedConversationsRef.current.includes(conversationId)
                        ) {
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

                    setMessages((prev) => {
                        if (String(activeConversationIdRef.current) !== String(incomingMessage.conversationId)) return prev;

                        // Deduplicate: if server message already exists, update in-place without creating a duplicate
                        const existingServerMsgIndex = prev.findIndex(msg => !msg.pending && String(msg._id) === String(incomingMessage._id));
                        if (existingServerMsgIndex !== -1) {
                            const nextMessages = [...prev];
                            nextMessages[existingServerMsgIndex] = { ...nextMessages[existingServerMsgIndex], ...incomingMessage };
                            return nextMessages;
                        }

                        // Reconcile optimistic pending message
                        const pendingIndex = prev.findIndex(msg =>
                            (incomingMessage.clientMessageId && (msg.clientMessageId === incomingMessage.clientMessageId || String(msg._id) === incomingMessage.clientMessageId)) ||
                            (msg.pending && 
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

                newSocket.on('messages_status_updated', ({ messageIds, status, userId }) => {
                    setMessages(prev => prev.map(msg => {
                        if (messageIds && messageIds.some(id => String(id) === String(msg._id))) {
                            const uid = String(userId);
                            if (status === 'delivered') {
                                const deliveredTo = Array.from(new Set([...(msg.deliveredTo || []).map(String), uid]));
                                return { ...msg, deliveredTo };
                            } else if (status === 'read') {
                                const readBy = Array.from(new Set([...(msg.readBy || []).map(String), uid]));
                                const deliveredTo = Array.from(new Set([...(msg.deliveredTo || []).map(String), uid]));
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
        if (!socket || !activeConversationId || !mongoUserId || !appSettings.readReceipts) return;
        
        // Find messages in the active chat that are NOT from us, and NOT yet read by us
        const unreadMessages = messages.filter(m => 
            m.conversationId === activeConversationId && 
            String(m.sender?._id || m.sender) !== String(mongoUserId) && 
            !(m.readBy && m.readBy.some(id => String(id) === String(mongoUserId)))
        );

        if (unreadMessages.length > 0) {
            const messageIds = unreadMessages.map(m => m._id);
            socket.emit('mark_messages_read', {
                conversationId: activeConversationId,
                userId: mongoUserId,
                messageIds
            });
        }
    }, [messages, activeConversationId, socket, mongoUserId, appSettings.readReceipts]);

    // 3. Handle Modal and Creating Conversations
    const openCreateModal = async () => {
        setIsModalOpen(true);
        setUserSearchQuery('');
        setUserSearchResults([]);
        setSelectedUsers([]);
        // For communities tab (which is always group type), pre-fetch users
        if (activeTab === 'communities') {
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch(`${BACKEND_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
                const users = await res.json();
                setAllUsers(users.filter(u => u._id !== mongoUserId));
            } catch (err) { console.error('Failed to fetch users:', err); }
        }
    };

    const searchUsersDebounced = async (query) => {
        if (userSearchTimerRef.current) clearTimeout(userSearchTimerRef.current);
        const cleanQuery = normalizeUsername(query);
        if (!cleanQuery) {
            setUserSearchResults([]);
            setIsSearchingUsers(false);
            return;
        }
        setIsSearchingUsers(true);
        userSearchTimerRef.current = setTimeout(async () => {
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch(`${BACKEND_URL}/api/users/search?username=${encodeURIComponent(cleanQuery)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const results = await res.json();
                    setUserSearchResults(results);
                }
            } catch (err) {
                console.error('Failed to search users:', err);
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

    const sendMessage = (payload) => {
        if (!socket || !mongoUserId || !payload?.conversationId) return;

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
        setMessages(previous => [...previous, optimisticMessage]);

        socket.timeout(15000).emit(
            'send_message',
            { ...payload, clientMessageId },
            (error, response) => {
                if (error || !response?.ok) {
                    setMessages(previous => previous.filter(message => message.clientMessageId !== clientMessageId && message._id !== clientMessageId));
                    console.error('Message send failed:', error || response?.error || 'Unknown socket error');
                    showToast(response?.error || 'Message could not be sent. Please try again.');
                } else if (response?.message) {
                    const confirmedMsg = response.message;
                    setMessages(previous => {
                        const index = previous.findIndex(m =>
                            m.clientMessageId === clientMessageId ||
                            String(m._id) === clientMessageId ||
                            String(m._id) === String(confirmedMsg._id)
                        );
                        if (index !== -1) {
                            const next = [...previous];
                            next[index] = confirmedMsg;
                            return next;
                        }
                        return previous;
                    });
                }
            }
        );
    };

    const handleSendMessage = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (isSendingMessageRef.current) return;
        const text = messageInput.trim();
        if (!text || !socket || !mongoUserId || !activeConversationId) return;

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

                    const messagePayload = {
                        conversationId: activeConversationId,
                        senderId: mongoUserId,
                        content: data.fileUrl,
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

    const isImageUrl = (url, mimeType) => (mimeType && (mimeType.startsWith('image/') || mimeType === 'whiteboard'))
        ? true
        : typeof url === 'string' && (url.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$|blob:/i) != null || url.startsWith('data:image/'));
    const isAudioUrl = (url, mimeType) => mimeType
        ? mimeType.startsWith('audio/')
        : typeof url === 'string' && url.match(/\.(webm|mp3|wav|ogg|m4a)(\?.*)?$/i) != null;
    const isVideoUrl = (url, mimeType) => mimeType
        ? mimeType.startsWith('video/')
        : typeof url === 'string' && (url.match(/\.(mp4|mov|avi|mkv)(\?.*)?$/i) != null || (url.includes('/video/upload/') && !/\.webm(\?.*)?$/i.test(url)));
    const isCloudinaryUrl = (url) => typeof url === 'string' && url.includes('res.cloudinary.com');
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
                            src={currentUserData?.avatarUrl || user?.picture}
                            alt={user?.name || user?.nickname || 'User'}
                            onClick={() => openMediaViewer(currentUserData?.avatarUrl || user?.picture, 'image', currentUserData?.displayName || user?.name || 'Profile picture')}
                            style={{ width: '32px', height: '32px', cursor: 'zoom-in' }}
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

            <Sidebar className={showChatArea ? 'mobile-hidden' : ''}>
                {activeTab === 'calls' && (
                    <>
                        <div style={{ padding: '16px 20px 12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '16px' }}>
                                <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: '700', color: 'var(--colors-textMain)' }}>
                                    {isCallLogsSelectionMode
                                        ? `${selectedCallLogs.length} selected`
                                        : <><MobileOnlyText>DevSup</MobileOnlyText><DesktopOnlyText>Recent Calls</DesktopOnlyText></>}
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
                                    <IconButton title="Select call logs" onClick={() => setIsCallLogsSelectionMode(true)} style={{ color: '#d1d7db', backgroundColor: '#2a3942', width: '40px', height: '40px' }}>
                                        <CheckSquare size={20} />
                                    </IconButton>
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
                                            padding: '12px 16px',
                                            gap: '16px',
                                            backgroundColor: selectedCallLogs.includes(log.id) ? 'rgba(0, 168, 132, 0.16)' : undefined
                                        }}
                                        onClick={() => {
                                            if (consumeSuppressedSelectionClick()) return;
                                            if (isCallLogsSelectionMode) toggleCallLogSelection(log.id);
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
                                        {!isCallLogsSelectionMode && <IconButton
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openConversationWith(log.contactId, log.type === 'video' ? 'video' : 'audio');
                                            }}
                                            style={{ color: 'var(--colors-textMuted)' }}
                                            title={log.type === 'video' ? 'Start video call' : 'Start voice call'}
                                        >
                                            {log.type === 'video' ? <Video size={20} /> : <Phone size={20} />}
                                        </IconButton>}
                                    </ChannelItem>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'chats' && (
                    <>
                        <div style={{ padding: '16px 20px 12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '16px' }}>
                                <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: '700', color: 'var(--colors-textMain)' }}>
                                    {isChatsSelectionMode
                                        ? `${selectedChats.length} selected`
                                        : <><MobileOnlyText>DevSup</MobileOnlyText><DesktopOnlyText>Chats</DesktopOnlyText></>}
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
                            <div style={{ color: 'var(--colors-textMuted)', fontSize: '0.85rem' }}>No conversations yet.</div>
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
                                            else setActiveConversationId(conv._id);
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
                                            padding: '12px 20px',
                                            borderRadius: 0,
                                            gap: '16px',
                                            alignItems: 'center',
                                            margin: 0,
                                            borderBottom: 'none',
                                            backgroundColor: selectedChats.includes(conv._id) ? 'rgba(0, 168, 132, 0.16)' : undefined
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
                                            style={{ flexShrink: 0, padding: showStatusRing ? '2px' : '0', border: showStatusRing ? '2px solid var(--colors-accent)' : 'none', cursor: showStatusRing ? 'pointer' : 'default', width: showStatusRing ? '56px' : '48px', height: showStatusRing ? '56px' : '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}
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
                                                    ? (conv.avatarUrl || `https://ui-avatars.com/api/?name=${conv.name}&background=06B6D4&color=fff`)
                                                    : (otherParticipant?.avatarUrl || `https://ui-avatars.com/api/?name=${otherParticipant?.displayName || 'User'}&background=06B6D4&color=fff`)}
                                                style={{ width: '48px', height: '48px', border: 'none', flexShrink: 0 }}
                                            />
                                            {!isGroup && isOtherUserOnline && <OnlineDot style={{ width: '12px', height: '12px', bottom: '2px', right: '2px' }} />}
                                        </AvatarWrapper>

                                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, justifyContent: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                                <span style={{ fontSize: '0.95rem', fontWeight: conv.unreadCount > 0 ? '600' : '500', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {isGroup ? conv.name : (otherParticipant?.displayName || 'Unknown User')}
                                                </span>
                                                {conv.lastMessage && (
                                                    <span style={{ fontSize: '0.75rem', color: conv.unreadCount > 0 ? 'var(--colors-accent)' : 'var(--colors-textMuted)', flexShrink: 0, fontWeight: conv.unreadCount > 0 ? '600' : 'normal' }}>
                                                        {formatMessageTime(conv.lastMessage.createdAt, false)}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.85rem', color: conv.unreadCount > 0 ? 'var(--colors-textMain)' : 'var(--colors-textMuted)', fontWeight: conv.unreadCount > 0 ? '500' : 'normal', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {conv.lastMessage
                                                        ? (conv.lastMessage.isDeletedForEveryone
                                                            ? 'This message was deleted'
                                                            : ((conv.lastMessage.sender === mongoUserId ? 'You: ' : '') +
                                                                (conv.lastMessage.attachmentType === 'whiteboard' || conv.lastMessage.content?.startsWith('data:image/') || conv.lastMessage.caption === 'View the mock-up'
                                                                    ? '🎨 Whiteboard Mock-up'
                                                                    : conv.lastMessage.content?.includes('res.cloudinary')
                                                                        ? (conv.lastMessage.content.includes('video') ? '🎥 Video' : '📷 Photo')
                                                                        : conv.lastMessage.content)))
                                                        : 'No messages yet'}
                                                </span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {conv.unreadCount > 0 && (
                                                        <div style={{ backgroundColor: 'var(--colors-accent)', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', minWidth: '18px', textAlign: 'center' }}>
                                                            {conv.unreadCount}
                                                        </div>
                                                    )}
                                                    {!isChatsSelectionMode && <IconButton
                                                        className="conv-delete-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setContextMenu({ visible: true, x: e.clientX, y: e.clientY, message: null, callLog: null, conversation: conv });
                                                        }}
                                                        title="Options"
                                                        style={{ padding: '2px', opacity: 0, transition: 'opacity 0.2s', color: 'var(--colors-textMuted)', zIndex: 2 }}
                                                    >
                                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
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
                        <div style={{ padding: '16px 20px 12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '16px' }}>
                                <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: '700', color: 'var(--colors-textMain)' }}>
                                    {isChatsSelectionMode
                                        ? `${selectedChats.length} selected`
                                        : <><MobileOnlyText>DevSup</MobileOnlyText><DesktopOnlyText>Communities</DesktopOnlyText></>}
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
                            <div style={{ color: 'var(--colors-textMuted)', fontSize: '0.85rem' }}>No communities found.</div>
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
                                        else { setActiveConversationId(conv._id); setCommunityTab('chat'); }
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
                                        padding: '12px 20px',
                                        borderRadius: 0,
                                        gap: '16px',
                                        alignItems: 'center',
                                        margin: 0,
                                        borderBottom: 'none',
                                        backgroundColor: selectedChats.includes(conv._id) ? 'rgba(0, 168, 132, 0.16)' : undefined
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
                                            src={conv.avatarUrl || `https://ui-avatars.com/api/?name=${conv.name}&background=06B6D4&color=fff`}
                                            style={{ width: '48px', height: '48px', border: 'none', flexShrink: 0 }}
                                        />
                                    </AvatarWrapper>

                                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, justifyContent: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                            <span style={{ fontSize: '0.95rem', fontWeight: conv.unreadCount > 0 ? '600' : '500', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {conv.name}
                                            </span>
                                            {conv.lastMessage && (
                                                <span style={{ fontSize: '0.75rem', color: conv.unreadCount > 0 ? 'var(--colors-accent)' : 'var(--colors-textMuted)', flexShrink: 0, fontWeight: conv.unreadCount > 0 ? '600' : 'normal' }}>
                                                    {formatMessageTime(conv.lastMessage.createdAt, false)}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.85rem', color: conv.unreadCount > 0 ? 'var(--colors-textMain)' : 'var(--colors-textMuted)', fontWeight: conv.unreadCount > 0 ? '500' : 'normal', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {conv.lastMessage
                                                    ? (conv.lastMessage.isDeletedForEveryone
                                                        ? 'This message was deleted'
                                                        : ((conv.lastMessage.sender === mongoUserId ? 'You: ' : '') +
                                                            (conv.lastMessage.content?.includes('res.cloudinary') ? (conv.lastMessage.content.includes('video') ? '🎥 Video' : '📷 Photo') : conv.lastMessage.content)))
                                                    : 'No messages yet'}
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {conv.unreadCount > 0 && (
                                                    <div style={{ backgroundColor: 'var(--colors-accent)', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', minWidth: '18px', textAlign: 'center' }}>
                                                        {conv.unreadCount}
                                                    </div>
                                                )}
                                                {!isChatsSelectionMode && <IconButton
                                                    className="conv-delete-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, message: null, callLog: null, conversation: conv });
                                                    }}
                                                    title="Options"
                                                    style={{ padding: '2px', opacity: 0, transition: 'opacity 0.2s', color: 'var(--colors-textMuted)', zIndex: 2 }}
                                                >
                                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
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
                    <>
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
                                    <img src={currentUserData?.avatarUrl || 'https://ui-avatars.com/api/?name=User&background=06B6D4&color=fff'} alt="Profile" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=User&background=06B6D4&color=fff' }} />
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
                    </>
                )}

                {activeTab === 'status' && (
                    <>
                        <div style={{ padding: '16px 20px 12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: '700', color: 'var(--colors-textMain)' }}>
                                    <MobileOnlyText>DevSup</MobileOnlyText>
                                    <DesktopOnlyText>Status</DesktopOnlyText>
                                </h2>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <IconButton title="New Status" onClick={() => setIsStatusModalOpen(true)} style={{ backgroundColor: 'var(--colors-surface)', color: 'var(--colors-textMain)' }}>
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
                                </div>
                            </div>
                        </div>

                        <ChannelItem active={false} onClick={() => {
                            if (myGroupedStatuses) {
                                setStoryViewerInitialUserIndex(groupedStatuses.findIndex(g => g.user._id === mongoUserId));
                            } else {
                                setIsStatusModalOpen(true);
                            }
                        }} style={{ height: 'auto', padding: '12px 8px', gap: '16px' }}>
                            <AvatarWrapper style={{ flexShrink: 0, width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', border: myGroupedStatuses && myGroupedStatuses.statuses.length > 0 ? `2px solid ${myGroupedStatuses.statuses.every(s => s.viewers && s.viewers.some(v => (v === mongoUserId || v._id === mongoUserId))) ? 'rgba(128, 128, 128, 0.4)' : 'var(--colors-accent)'}` : 'none', padding: myGroupedStatuses && myGroupedStatuses.statuses.length > 0 ? '2px' : '0' }}>
                                {myGroupedStatuses && myGroupedStatuses.statuses.length > 0 ? (
                                    (() => {
                                        const last = myGroupedStatuses.statuses[myGroupedStatuses.statuses.length - 1];
                                        if (last.type === 'text') {
                                            return <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: last.backgroundColor || '#1E2B3C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', overflow: 'hidden', textAlign: 'center', padding: '4px', boxSizing: 'border-box', flexShrink: 0 }}>
                                                <span style={{ transform: 'scale(0.8)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{last.content}</span>
                                            </div>
                                        } else if (last.type === 'video') {
                                            return <video src={last.content} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                        } else {
                                            return <Avatar src={last.content} style={{ width: '48px', height: '48px', objectFit: 'cover', flexShrink: 0 }} />
                                        }
                                    })()
                                ) : (
                                    <Avatar src={currentUserData?.avatarUrl || user?.picture} style={{ width: '48px', height: '48px', flexShrink: 0 }} />
                                )}
                                <div
                                    onClick={(e) => { e.stopPropagation(); setIsStatusModalOpen(true); }}
                                    style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: 'var(--colors-accent)', borderRadius: '50%', padding: '2px', color: 'white', display: 'flex', zIndex: 2 }}
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
                            otherGroupedStatuses.map((group) => {
                                const allViewed = group.statuses.every(s => s.viewers && s.viewers.some(v => (v === mongoUserId || v._id === mongoUserId)));
                                const borderColor = allViewed ? 'rgba(128, 128, 128, 0.4)' : 'var(--colors-accent)';
                                return (
                                <ChannelItem key={group.user._id} onClick={() => setStoryViewerInitialUserIndex(groupedStatuses.findIndex(g => g.user._id === group.user._id))} style={{ height: 'auto', padding: '12px 8px', gap: '16px' }}>
                                    <AvatarWrapper style={{ flexShrink: 0, border: `2px solid ${borderColor}`, padding: '2px', width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
                                        {(() => {
                                            const last = group.statuses[group.statuses.length - 1];
                                            if (last.type === 'text') {
                                                return <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: last.backgroundColor || '#1E2B3C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '9px', overflow: 'hidden', textAlign: 'center', padding: '4px', boxSizing: 'border-box', flexShrink: 0 }}>
                                                    <span style={{ transform: 'scale(0.8)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{last.content}</span>
                                                </div>
                                            } else if (last.type === 'video') {
                                                return <video src={last.content} style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '50%', flexShrink: 0 }} />
                                            } else {
                                                return <Avatar src={last.content} style={{ width: '44px', height: '44px', objectFit: 'cover', flexShrink: 0 }} />
                                            }
                                        })()}
                                    </AvatarWrapper>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '1rem', color: 'var(--colors-textMain)' }}>{group.user.displayName}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--colors-textMuted)' }}>
                                            {formatMessageTime(group.statuses[group.statuses.length - 1].createdAt, true)}
                                        </span>
                                    </div>
                                </ChannelItem>
                                );
                            })
                        )}
                    </>
                )}
            </Sidebar>

            <ChatArea className={!showChatArea ? 'mobile-hidden' : ''}>
                {activeTab === 'settings' && activeSettingTab ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, backgroundColor: 'var(--colors-bg)', overflow: 'hidden' }}>
                        {activeSettingTab === 'Profile' ? (
                            <ProfilePane onBack={() => setActiveSettingTab(null)} currentUser={currentUserData} onUpdateProfile={handleUpdateProfile} getAccessTokenSilently={getAccessTokenSilently} BACKEND_URL={BACKEND_URL} onViewProfilePicture={(image) => openMediaViewer(image, 'image', 'Profile picture')} />
                        ) : activeSettingTab === 'Account' ? (
                            <AccountPane onBack={() => setActiveSettingTab(null)} settings={appSettings} updateSetting={updateSetting} />
                        ) : activeSettingTab === 'Privacy' ? (
                            <PrivacyPane onBack={() => setActiveSettingTab(null)} settings={appSettings} updateSetting={updateSetting} blockedUsers={currentUserData?.blockedUsers || []} onUnblockUser={handleUnblockUser} />
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
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--colors-bg)', overflow: 'hidden', position: 'relative' }}>
                        <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'var(--colors-accent)', filter: 'blur(200px)', opacity: 0.15, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                        <div style={{ 
                            width: '140px', height: '140px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(6,182,212,0.05) 100%)', 
                            border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', 
                            boxShadow: '0 0 40px rgba(6,182,212,0.15), inset 0 0 20px rgba(6,182,212,0.1)', position: 'relative', zIndex: 1
                        }}>
                            <CircleDashed size={64} color="var(--colors-accent)" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.5))' }} />
                        </div>
                        <h2 style={{ color: 'var(--colors-textMain)', fontSize: '2.5rem', marginBottom: '16px', fontWeight: '500', letterSpacing: '-0.5px', position: 'relative', zIndex: 1, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Status</h2>
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
                                                        ? (activeConversation.avatarUrl || `https://ui-avatars.com/api/?name=${activeConversation.name}&background=06B6D4&color=fff`)
                                                        : (activeConversation.participants?.find(p => p._id !== mongoUserId)?.avatarUrl || `https://ui-avatars.com/api/?name=User&background=06B6D4&color=fff`)}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        const image = activeConversation.type === 'group'
                                                            ? activeConversation.avatarUrl
                                                            : activeConversation.participants?.find(p => p._id !== mongoUserId)?.avatarUrl;
                                                        openMediaViewer(image, 'image', activeConversation.type === 'group'
                                                            ? activeConversation.name
                                                            : activeConversation.participants?.find(p => p._id !== mongoUserId)?.displayName || 'Profile picture');
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
                                                        return other?.username ? `@${other.username}` : 'click here for contact info';
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
                                            setCallConfig({ active: true, isReceiving: false, callerData: null, callType: 'video' });
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
                                            setCallConfig({ active: true, isReceiving: false, callerData: null, callType: 'audio' });
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
                                                        setCallConfig({ active: true, isReceiving: false, callerData: null, callType: 'video' });
                                                        setIsHeaderMenuOpen(false); 
                                                    }}>
                                                        <Video size={18} style={{ opacity: 0.8 }} />
                                                        {activeConversation.type === 'group' ? 'Group calls' : 'Calls'}
                                                    </ContextMenuItem>
                                                    <ContextMenuItem onClick={() => { 
                                                        setIsWhiteboardOpen(true);
                                                        showToast('Live Whiteboard & Collaborative Canvas started');
                                                        setIsHeaderMenuOpen(false); 
                                                    }}>
                                                        <Code2 size={18} style={{ opacity: 0.8 }} />
                                                        Live coding features
                                                    </ContextMenuItem>
                                                    <ContextMenuItem onClick={() => { 
                                                        setPremiumModal({ title: 'Hackathons & Competitions', subtitle: 'Join live coding battles or organize an event for this group.', type: 'hackathon' });
                                                        setIsHeaderMenuOpen(false); 
                                                    }}>
                                                        <Rocket size={18} style={{ opacity: 0.8 }} />
                                                        Hackathon
                                                    </ContextMenuItem>
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
                                    <MessageList
                                        ref={messageListRef}
                                        onScroll={handleMessageListScroll}
                                        style={{
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
                                                    const isMediaMessage = !msg.isDeletedForEveryone && !isWhiteboardMessage && (msg.isCodeSnippet || (isOnlyUrl && isImageUrl(msg.content, msg.attachmentType)));
                                                    const isImageWithCaption = isMediaMessage && !msg.isCodeSnippet && !!msg.caption;
                                                    
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
                                                            gap: '12px', 
                                                            width: '100%',
                                                            padding: '4px 8px',
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
                                                                mediaOnly={isMediaMessage}
                                                                embedOnly={isEmbedOnly}
                                                                style={isWhiteboardMessage ? {
                                                                    width: 'fit-content',
                                                                    maxWidth: '360px',
                                                                    padding: '10px 10px 24px 10px',
                                                                } : {}}
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
                                                                        ...(isMediaMessage ? { padding: '6px 8px 0 8px' } : {})
                                                                    }}>
                                                                        {msg.sender?.displayName || 'Unknown User'}
                                                                        {msg.sender?.username && (
                                                                            <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: '6px', fontWeight: '400' }}>
                                                                                @{msg.sender.username}
                                                                            </span>
                                                                        )}
                                                                    </SenderName>
                                                                )}

                                                                <div style={{ wordBreak: 'break-word', marginTop: showSenderName && !isMediaMessage ? '2px' : '0', maxWidth: isImageWithCaption ? '300px' : isWhiteboardMessage ? '340px' : 'none' }}>
                                                                    {msg.isDeletedForEveryone ? (
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--colors-textMuted)', fontStyle: 'italic' }}>
                                                                            <Trash2 size={14} />
                                                                            {isOwnMessage ? 'You deleted this message' : 'This message was deleted'}
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
                                                                                    : (msg.replyTo.content || (msg.replyTo.isCodeSnippet ? 'Code Snippet' : 'Media'))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {(() => {
                                                                        const embedData = detectEcosystemLink(msg.content);

                                                                        // If it's a code snippet, just render the code block
                                                                        if (msg.isCodeSnippet) {
                                                                            return (
                                                                                <SyntaxHighlighter
                                                                                    language={msg.language === 'plaintext' ? 'text' : msg.language}
                                                                                    style={vscDarkPlus}
                                                                                    customStyle={{ borderRadius: '10px', margin: '0', fontSize: '0.9rem' }}
                                                                                >
                                                                                    {msg.content}
                                                                                </SyntaxHighlighter>
                                                                            );
                                                                        }

                                                                        
                                                                        const isCallLog = msg.content && typeof msg.content === 'string' && msg.content.startsWith('$CALL_LOG$');
                                                                        if (isCallLog) {
                                                                            const parts = msg.content.split('|');
                                                                            const callType = parts[1];
                                                                            const callStatus = parts[2];
                                                                            
                                                                            return (
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                    {callType === 'video' ? <Video size={18} color="rgba(255,255,255,0.7)" /> : <Phone size={18} color="rgba(255,255,255,0.7)" />}
                                                                                    <div>
                                                                                        <div style={{ fontWeight: '500', color: 'var(--colors-textMain)' }}>
                                                                                            {callType === 'video' ? 'Video call' : 'Voice call'}
                                                                                        </div>
                                                                                        <div style={{ fontSize: '0.85rem', color: callStatus === 'missed' ? '#ef4444' : 'var(--colors-textMuted)' }}>
                                                                                            {callStatus === 'missed' ? 'Missed' : callStatus === 'rejected' ? 'Declined' : 'Completed'}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        }

                                                                        // Check if message is strictly just a URL
                                                                        const isOnlyUrl = (msg.content.trim().startsWith('http') || msg.content.trim().startsWith('data:')) && !msg.content.trim().includes(' ');
                                                                        const hasAttachment = embedData || isWhiteboardMessage || isImageUrl(msg.content, msg.attachmentType) || isAudioUrl(msg.content, msg.attachmentType) || isVideoUrl(msg.content, msg.attachmentType) || isCloudinaryUrl(msg.content);
                                                                        const shouldShowText = !(isOnlyUrl && hasAttachment) && !isWhiteboardMessage;

                                                                        return (
                                                                            <>
                                                                                {shouldShowText && (
                                                                                    <div style={{ whiteSpace: 'pre-wrap' }}>
                                                                                        {msg.content}
                                                                                    </div>
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

                                                                                        {msg.caption && msg.caption !== 'View the mock-up' && (
                                                                                            <div style={{ fontSize: '0.82rem', opacity: 0.9, marginTop: '2px', padding: '0 2px' }}>
                                                                                                {msg.caption}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                )}

                                                                                {embedData && appSettings.richIntegrations !== false && (
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
                                                                                )}

                                                                                {isVideoUrl(msg.content, msg.attachmentType) && (
                                                                                    <div style={{ position: 'relative', width: 'fit-content', maxWidth: '100%', marginTop: shouldShowText ? '8px' : '0' }}>
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
                                                                                            style={{ position: 'absolute', top: '8px', right: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', border: 'none', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.65)', color: '#fff', cursor: 'pointer' }}
                                                                                        >
                                                                                            <Maximize2 size={18} />
                                                                                        </button>
                                                                                    </div>
                                                                                )}

                                                                                {isImageUrl(msg.content, msg.attachmentType) && !isWhiteboardMessage && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => openMediaViewer(msg.content, 'image', msg.attachmentName || 'Photo')}
                                                                                        aria-label="View photo fullscreen"
                                                                                        title="View fullscreen"
                                                                                        style={{ display: 'block', marginTop: isMediaMessage ? '0' : '8px', padding: 0, border: 0, background: 'transparent', cursor: 'zoom-in' }}
                                                                                    >
                                                                                        <AttachmentImage src={msg.content} alt="User attachment" style={isMediaMessage ? { width: '100%', height: 'auto', objectFit: 'cover', borderRadius: '8px' } : {}} />
                                                                                    </button>
                                                                                )}

                                                                                {isAudioUrl(msg.content, msg.attachmentType) && (
                                                                                    <CustomAudioPlayer src={msg.content} isOwnMessage={isOwnMessage} avatarUrl={msg.sender?.avatarUrl} />
                                                                                )}

                                                                                {isCloudinaryUrl(msg.content) && !isImageUrl(msg.content, msg.attachmentType) && !isAudioUrl(msg.content, msg.attachmentType) && !isVideoUrl(msg.content, msg.attachmentType) && (
                                                                                    <AttachmentLink href={msg.content} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', marginTop: '8px' }}>
                                                                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg>
                                                                                        {msg.attachmentName || 'Download file'}
                                                                                    </AttachmentLink>
                                                                                )}

                                                                                {msg.caption && !isWhiteboardMessage && (
                                                                                    <div style={{ whiteSpace: 'pre-wrap', marginTop: '4px', padding: isMediaMessage ? '4px 6px 4px 6px' : '4px 0', borderTop: isMediaMessage ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>
                                                                                        {msg.caption}
                                                                                    </div>
                                                                                )}
                                                                            </>
                                                                        );
                                                                    })()}
                                                                    </>
                                                                    )}
                                                                    <span style={{ display: 'inline-block', width: msg.isEdited ? '80px' : '50px', height: '10px' }}>&#8203;</span>
                                                                </div>

                                                                <MessageTime isOwn={isOwnMessage}>
                                                                    {msg.isEdited && <i style={{ marginRight: '4px' }}>edited</i>}
                                                                    {formatMessageClock(msg.createdAt)}
                                                                    {isOwnMessage && (
                                                                        <span style={{ marginLeft: '4px', display: 'inline-flex', alignItems: 'center' }}>
                                                                            {(() => {
                                                                                if (!appSettings.readReceipts) {
                                                                                    return <CheckCheck size={14} color="rgba(255,255,255,0.6)" />; // Always show 2 grey ticks if receipts are disabled
                                                                                }
                                                                                
                                                                                // Exclude the sender's own ID from counts (only other users count)
                                                                                const readCount = msg.readBy
                                                                                    ? msg.readBy.filter(id => String(id?._id || id) !== String(mongoUserId)).length
                                                                                    : 0;
                                                                                const deliveredCount = msg.deliveredTo
                                                                                    ? msg.deliveredTo.filter(id => String(id?._id || id) !== String(mongoUserId)).length
                                                                                    : 0;
                                                                                
                                                                                if (readCount > 0) {
                                                                                    return <CheckCheck size={14} color="#06B6D4" />; // Blue ticks = read
                                                                                } else if (deliveredCount > 0) {
                                                                                    return <CheckCheck size={14} color="rgba(255,255,255,0.6)" />; // Two grey ticks = delivered
                                                                                } else {
                                                                                    return <Check size={14} color="rgba(255,255,255,0.6)" />; // One grey tick = sent
                                                                                }
                                                                            })()}
                                                                        </span>
                                                                    )}
                                                                </MessageTime>

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
                                                            {replyingToMessage.content}
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
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : communityTab === 'live coding' ? (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minHeight: 0 }}>
                                    <Suspense fallback={null}><Whiteboard
                                        socket={socket}
                                        conversationId={activeConversationId}
                                        mongoUserId={mongoUserId}
                                        onClose={() => setCommunityTab('chat')}
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
                                            setCommunityTab('chat');
                                        }}
                                        embedded={true}
                                    /></Suspense>
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
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--colors-bg)', overflow: 'hidden', position: 'relative' }}>
                                <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'var(--colors-accent)', filter: 'blur(200px)', opacity: 0.15, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                                <div style={{ 
                                    width: '140px', height: '140px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(6,182,212,0.05) 100%)', 
                                    border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', 
                                    boxShadow: '0 0 40px rgba(6,182,212,0.15), inset 0 0 20px rgba(6,182,212,0.1)', position: 'relative', zIndex: 1
                                }}>
                                    <CircleDashed size={64} color="var(--colors-accent)" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.5))' }} />
                                </div>
                                <h2 style={{ color: 'var(--colors-textMain)', fontSize: '2.5rem', marginBottom: '16px', fontWeight: '500', letterSpacing: '-0.5px', position: 'relative', zIndex: 1, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Share statuses</h2>
                                <p style={{ color: 'var(--colors-textMuted)', fontSize: '1.1rem', maxWidth: '400px', textAlign: 'center', lineHeight: '1.6', position: 'relative', zIndex: 1 }}>
                                    Share photos, videos and text that disappear after 24 hours.
                                </p>
                            </div>
                        )}
                        {activeTab === 'calls' && (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--colors-bg)', overflow: 'hidden', position: 'relative' }}>
                                <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'var(--colors-accent)', filter: 'blur(200px)', opacity: 0.15, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                                <div style={{ 
                                    width: '140px', height: '140px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(6,182,212,0.05) 100%)', 
                                    border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', 
                                    boxShadow: '0 0 40px rgba(6,182,212,0.15), inset 0 0 20px rgba(6,182,212,0.1)', position: 'relative', zIndex: 1
                                }}>
                                    <Phone size={64} color="var(--colors-accent)" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.5))' }} />
                                </div>
                                <h2 style={{ color: 'var(--colors-textMain)', fontSize: '2.5rem', marginBottom: '16px', fontWeight: '500', letterSpacing: '-0.5px', position: 'relative', zIndex: 1, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Your Calls</h2>
                                <p style={{ color: 'var(--colors-textMuted)', fontSize: '1.1rem', maxWidth: '400px', textAlign: 'center', lineHeight: '1.6', position: 'relative', zIndex: 1 }}>
                                    Start a voice or video call from any of your chats.
                                </p>
                            </div>
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
                                        <MessageSquare size={64} color="var(--colors-accent)" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.5))' }} />
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
                                                src={participant._id === mongoUserId ? (currentUserData?.avatarUrl || participant.avatarUrl) : participant.avatarUrl}
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
                                        // Fetch all users for group contacts list
                                        if (allUsers.length === 0) {
                                            try {
                                                const token = await getAccessTokenSilently();
                                                const res = await fetch(`${BACKEND_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
                                                const users = await res.json();
                                                setAllUsers(users.filter(u => u._id !== mongoUserId));
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
                                                <Avatar src={u.avatarUrl} style={{ width: '40px', height: '40px', border: selectedUsers.includes(u._id) ? '2px solid var(--colors-accent)' : '2px solid var(--colors-surface)' }} />
                                                {activeUsers.includes(u._id) && <OnlineDot style={{ width: '12px', height: '12px', bottom: '-2px', right: '-2px', border: '2.5px solid var(--colors-bg)' }} />}
                                            </AvatarWrapper>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                                                <span style={{ color: 'var(--colors-textMain)', fontSize: '0.95rem', fontWeight: '600', transition: 'color 0.2s ease', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {u.displayName}
                                                    {u.isSelf && <span style={{ fontSize: '0.75rem', color: 'var(--colors-textMuted)', fontWeight: '400' }}>(You)</span>}
                                                </span>
                                                <span style={{ color: 'var(--colors-accent)', fontSize: '0.78rem', fontWeight: '500' }}>@{u.username}</span>
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
                                                <Avatar src={u.avatarUrl} style={{ width: '40px', height: '40px', border: selectedUsers.includes(u._id) ? '2px solid var(--colors-accent)' : '2px solid var(--colors-surface)' }} />
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
                                            <Avatar src={u.avatarUrl} style={{ width: '40px', height: '40px', border: selectedMembersToAdd.includes(u._id) ? '2px solid var(--colors-accent)' : '2px solid var(--colors-surface)' }} />
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
                <Suspense fallback={null}><StatusUploadModal
                    onClose={() => setIsStatusModalOpen(false)}
                    BACKEND_URL={BACKEND_URL}
                    getAccessTokenSilently={getAccessTokenSilently}
                    onUpload={handleStatusUpload}
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
                            {premiumModal.type === 'hackathon' ? <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> : <img src="/favicon.svg" alt="DevSup Logo" style={{ width: '40px', height: '40px', filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.5))' }} />}
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
                        {incomingMessageNotification.sender?.avatarUrl ? (
                            <img 
                                src={incomingMessageNotification.sender.avatarUrl} 
                                alt="" 
                                style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }} 
                            />
                        ) : (
                            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#00a884', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                                {(incomingMessageNotification.sender?.displayName || 'N')[0].toUpperCase()}
                            </div>
                        )}
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