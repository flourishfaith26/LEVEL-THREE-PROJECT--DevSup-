import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { styled, keyframes } from '../stitches.config.js';
import { 
    Terminal, Code, Layers, Zap, MessageSquare, LayoutTemplate, 
    PenTool, Video, Phone, Mic, FileText, Sparkles, Shield, 
    Users, CheckCircle2, ArrowRight, ExternalLink, Play, Check, 
    Copy, Monitor, ChevronRight, Globe, Lock, Cpu
} from 'lucide-react';
import DevSupLogo from '../components/DevSupLogo.jsx';

// Keyframes
const float = keyframes({
    '0%, 100%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-10px)' },
});

const pulseGlow = keyframes({
    '0%, 100%': { opacity: 0.4, transform: 'scale(1)' },
    '50%': { opacity: 0.8, transform: 'scale(1.06)' },
});

const marqueeScroll = keyframes({
    '0%': { transform: 'translateX(0)' },
    '100%': { transform: 'translateX(-50%)' },
});

const badgeGleam = keyframes({
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
});

// Styled Components
const PageWrapper = styled('div', {
    minHeight: '100vh',
    '@supports (min-height: 100dvh)': {
        minHeight: '100dvh',
    },
    width: '100%',
    backgroundColor: '#070B14',
    color: '#F8FAFC',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflowX: 'hidden',
    overflowY: 'auto',
    position: 'relative',
});

// Ambient Background Elements
const BackgroundGrid = styled('div', {
    position: 'fixed',
    inset: 0,
    backgroundImage: `
        linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
    `,
    backgroundSize: '40px 40px',
    maskImage: 'radial-gradient(circle at 50% 30%, black 40%, transparent 85%)',
    WebkitMaskImage: 'radial-gradient(circle at 50% 30%, black 40%, transparent 85%)',
    pointerEvents: 'none',
    zIndex: 0,
});

const GlowSphere = styled('div', {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(90px)',
    pointerEvents: 'none',
    zIndex: 0,
});

// Navigation Header
const Navbar = styled('header', {
    position: 'sticky',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 24px',
    backgroundColor: 'rgba(7, 11, 20, 0.8)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    maxWidth: '1300px',
    margin: '0 auto',
    width: '100%',
});

const NavLogoGroup = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
});

const BrandName = styled('span', {
    fontSize: '1.25rem',
    fontWeight: '800',
    letterSpacing: '-0.02em',
    color: '#FFFFFF',
    '& span': {
        color: '#06B6D4',
    }
});

const VersionPill = styled('span', {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: '#06B6D4',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    border: '1px solid rgba(6, 182, 212, 0.3)',
    borderRadius: '999px',
    padding: '2px 8px',
    letterSpacing: '0.04em',
    '@media (max-width: 640px)': {
        display: 'none',
    }
});

const NavLinks = styled('nav', {
    display: 'flex',
    alignItems: 'center',
    gap: '28px',
    '@media (max-width: 768px)': {
        display: 'none',
    }
});

const NavLink = styled('a', {
    color: '#94A3B8',
    fontSize: '0.9rem',
    fontWeight: '500',
    textDecoration: 'none',
    transition: 'color 0.15s ease',
    '&:hover': {
        color: '#06B6D4',
    }
});

const NavActionGroup = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
});

const GhostButton = styled('button', {
    backgroundColor: 'transparent',
    color: '#F8FAFC',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '0.88rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderColor: 'rgba(255, 255, 255, 0.25)',
    }
});

const PrimaryButton = styled('button', {
    backgroundColor: '#06B6D4',
    color: '#070B14',
    border: 'none',
    borderRadius: '8px',
    padding: '9px 20px',
    fontSize: '0.88rem',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    boxShadow: '0 0 20px rgba(6, 182, 212, 0.35)',
    '&:hover': {
        backgroundColor: '#22d3ee',
        transform: 'translateY(-1px)',
        boxShadow: '0 0 28px rgba(6, 182, 212, 0.55)',
    },
    '&:active': {
        transform: 'translateY(1px)',
    }
});

// Hero Section
const HeroSection = styled('section', {
    position: 'relative',
    zIndex: 1,
    padding: '70px 20px 40px 20px',
    maxWidth: '1240px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    '@media (max-width: 768px)': {
        padding: '40px 16px 20px 16px',
    }
});

const AnnouncementBadge = styled('div', {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 16px',
    borderRadius: '999px',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(6, 182, 212, 0.3)',
    color: '#E2E8F0',
    fontSize: '0.84rem',
    fontWeight: '500',
    marginBottom: '28px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
    backdropFilter: 'blur(8px)',
    transition: 'transform 0.2s ease, border-color 0.2s ease',
    cursor: 'pointer',
    '&:hover': {
        transform: 'translateY(-1px)',
        borderColor: '#06B6D4',
    }
});

const HeroTitle = styled('h1', {
    fontSize: '4.5rem',
    fontWeight: '900',
    lineHeight: '1.08',
    letterSpacing: '-0.035em',
    maxWidth: '920px',
    margin: '0 0 24px 0',
    color: '#FFFFFF',
    background: 'linear-gradient(180deg, #FFFFFF 20%, #94A3B8 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    '@media (max-width: 768px)': {
        fontSize: '2.6rem',
        lineHeight: '1.15',
    }
});

const HeroSubtitle = styled('p', {
    fontSize: '1.25rem',
    lineHeight: '1.65',
    color: '#94A3B8',
    maxWidth: '720px',
    margin: '0 0 36px 0',
    fontWeight: '400',
    '@media (max-width: 768px)': {
        fontSize: '1.05rem',
        lineHeight: '1.55',
        margin: '0 0 28px 0',
    }
});

const HeroButtonGroup = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: '44px',
});

const LargeLaunchButton = styled('button', {
    backgroundColor: '#06B6D4',
    color: '#070B14',
    border: 'none',
    borderRadius: '12px',
    padding: '16px 36px',
    fontSize: '1.1rem',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    boxShadow: '0 0 35px rgba(6, 182, 212, 0.45)',
    '&:hover': {
        backgroundColor: '#22d3ee',
        transform: 'translateY(-2px) scale(1.02)',
        boxShadow: '0 0 50px rgba(6, 182, 212, 0.7)',
    },
    '&:active': {
        transform: 'translateY(1px)',
    }
});

const LargeSecondaryButton = styled('a', {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#F8FAFC',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '12px',
    padding: '16px 30px',
    fontSize: '1.05rem',
    fontWeight: '600',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(8px)',
    '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        transform: 'translateY(-1px)',
    }
});

// Trust Pillars
const PillarsRow = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    color: '#64748B',
    fontSize: '0.85rem',
    fontWeight: '500',
    marginBottom: '60px',
    '@media (max-width: 640px)': {
        gap: '14px',
        marginBottom: '40px',
    }
});

const PillarItem = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#94A3B8',
});

// Realistic Product Showcase Mockup
const MockupContainer = styled('div', {
    width: '100%',
    maxWidth: '1120px',
    margin: '0 auto 100px auto',
    borderRadius: '16px',
    border: '1px solid rgba(6, 182, 212, 0.35)',
    backgroundColor: '#0F172A',
    boxShadow: '0 30px 100px -20px rgba(6, 182, 212, 0.22), 0 0 0 1px rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
    animation: `${float} 8s ease-in-out infinite`,
});

const MockupWindowBar = styled('div', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 18px',
    backgroundColor: '#0B1120',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
});

const MockupDots = styled('div', {
    display: 'flex',
    gap: '7px',
});

const MockupDot = styled('div', {
    width: '11px',
    height: '11px',
    borderRadius: '50%',
    variants: {
        color: {
            red: { backgroundColor: '#EF4444' },
            yellow: { backgroundColor: '#F59E0B' },
            green: { backgroundColor: '#10B981' },
        }
    }
});

const MockupBody = styled('div', {
    display: 'grid',
    gridTemplateColumns: '260px 1fr 280px',
    height: '520px',
    backgroundColor: '#0A0F1D',
    '@media (max-width: 1024px)': {
        gridTemplateColumns: '240px 1fr',
    },
    '@media (max-width: 768px)': {
        gridTemplateColumns: '1fr',
        height: '420px',
    }
});

// Left Column (Chats / Channels)
const MockupSidebar = styled('div', {
    backgroundColor: '#0B1222',
    borderRight: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    padding: '12px',
    gap: '8px',
    '@media (max-width: 768px)': {
        display: 'none',
    }
});

// Center Column (Chat Stream)
const MockupChatArena = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '16px',
    backgroundColor: '#070B14',
    overflowY: 'hidden',
    position: 'relative',
});

// Right Column (Drawer)
const MockupDrawer = styled('div', {
    backgroundColor: '#0B1222',
    borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    '@media (max-width: 1024px)': {
        display: 'none',
    }
});

// Marquee Section
const MarqueeWrapper = styled('div', {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#0A101D',
    padding: '24px 0',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    position: 'relative',
    '&::before, &::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: '120px',
        zIndex: 2,
        pointerEvents: 'none',
    },
    '&::before': {
        left: 0,
        background: 'linear-gradient(to right, #070B14, transparent)',
    },
    '&::after': {
        right: 0,
        background: 'linear-gradient(to left, #070B14, transparent)',
    }
});

const MarqueeTrack = styled('div', {
    display: 'flex',
    gap: '40px',
    width: 'max-content',
    animation: `${marqueeScroll} 30s linear infinite`,
});

const TechBadge = styled('div', {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    color: '#94A3B8',
    fontSize: '0.95rem',
    fontWeight: '600',
    padding: '8px 18px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    transition: 'all 0.2s ease',
    '&:hover': {
        color: '#06B6D4',
        borderColor: 'rgba(6, 182, 212, 0.4)',
        backgroundColor: 'rgba(6, 182, 212, 0.06)',
        transform: 'translateY(-2px)',
    }
});

// Bento Grid Section
const BentoSection = styled('section', {
    padding: '100px 20px',
    maxWidth: '1240px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 1,
});

const SectionHeader = styled('div', {
    textAlign: 'center',
    marginBottom: '56px',
});

const SectionTag = styled('span', {
    color: '#06B6D4',
    fontSize: '0.85rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '10px',
    display: 'inline-block',
});

const SectionHeadline = styled('h2', {
    fontSize: '2.8rem',
    fontWeight: '800',
    letterSpacing: '-0.025em',
    color: '#FFFFFF',
    margin: '0 0 16px 0',
    '@media (max-width: 768px)': {
        fontSize: '2rem',
    }
});

const SectionDescription = styled('p', {
    fontSize: '1.15rem',
    color: '#94A3B8',
    maxWidth: '640px',
    margin: '0 auto',
    lineHeight: '1.6',
});

const BentoGrid = styled('div', {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: '24px',
    width: '100%',
});

const BentoCard = styled('div', {
    backgroundColor: '#0F172A',
    borderRadius: '16px',
    padding: '32px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'all 0.25s ease',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
    '&:hover': {
        transform: 'translateY(-4px)',
        borderColor: 'rgba(6, 182, 212, 0.45)',
        boxShadow: '0 20px 40px -15px rgba(6, 182, 212, 0.15)',
    },
    variants: {
        span: {
            4: { gridColumn: 'span 12', '@media (min-width: 768px)': { gridColumn: 'span 4' } },
            6: { gridColumn: 'span 12', '@media (min-width: 768px)': { gridColumn: 'span 6' } },
            8: { gridColumn: 'span 12', '@media (min-width: 768px)': { gridColumn: 'span 8' } },
            12: { gridColumn: 'span 12' },
        }
    }
});

const FeatureIcon = styled('div', {
    width: '52px',
    height: '52px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
    color: '#06B6D4',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    border: '1px solid rgba(6, 182, 212, 0.25)',
});

const FeatureTitle = styled('h3', {
    fontSize: '1.35rem',
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: '10px',
    letterSpacing: '-0.015em',
});

const FeatureText = styled('p', {
    color: '#94A3B8',
    fontSize: '0.96rem',
    lineHeight: '1.6',
    margin: 0,
});

// Interactive Terminal Section
const TerminalSection = styled('section', {
    padding: '80px 20px 100px 20px',
    maxWidth: '900px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 1,
});

const TerminalConsole = styled('div', {
    backgroundColor: '#090D16',
    borderRadius: '14px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(6, 182, 212, 0.15)',
});

const ConsoleBar = styled('div', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 18px',
    backgroundColor: '#0F172A',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
});

const ConsoleBody = styled('div', {
    padding: '24px',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '0.92rem',
    color: '#F8FAFC',
    lineHeight: '1.7',
});

// Footer
const Footer = styled('footer', {
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    backgroundColor: '#05080F',
    padding: '60px 20px 40px 20px',
    position: 'relative',
    zIndex: 1,
});

const FooterContent = styled('div', {
    maxWidth: '1240px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    textAlign: 'center',
});

export default function Home() {
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);
    const [activeTechTab, setActiveTechTab] = useState('npm');

    const handleCopyCmd = () => {
        navigator.clipboard.writeText('npm install @devsup/chat');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const techStack = [
        { name: 'React 19', icon: <Code size={20} /> },
        { name: 'Socket.io Real-time', icon: <Zap size={20} /> },
        { name: 'WebRTC Calls', icon: <Phone size={20} /> },
        { name: 'MongoDB Atlas', icon: <Layers size={20} /> },
        { name: 'Cloudinary Assets', icon: <FileText size={20} /> },
        { name: 'Auth0 Security', icon: <Shield size={20} /> },
        { name: 'Canvas Whiteboard', icon: <PenTool size={20} /> },
        { name: 'Vite & Rolldown', icon: <Cpu size={20} /> },
    ];

    // Double for marquee
    const marqueeList = [...techStack, ...techStack];

    return (
        <PageWrapper>
            <BackgroundGrid />
            <GlowSphere style={{ top: '150px', left: '20%', width: '500px', height: '500px', backgroundColor: 'rgba(6, 182, 212, 0.12)' }} />
            <GlowSphere style={{ top: '650px', right: '15%', width: '450px', height: '450px', backgroundColor: 'rgba(14, 165, 233, 0.08)' }} />

            {/* Navigation Header */}
            <Navbar>
                <NavLogoGroup onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <DevSupLogo size={34} glow={true} />
                    <BrandName>Dev<span>Sup</span></BrandName>
                    <VersionPill>v2.4 DEV EDITION</VersionPill>
                </NavLogoGroup>

                <NavLinks>
                    <NavLink href="#features">Features</NavLink>
                    <NavLink href="#preview">Experience</NavLink>
                    <NavLink href="#architecture">Architecture</NavLink>
                    <NavLink href="#terminal">CLI</NavLink>
                </NavLinks>

                <NavActionGroup>
                    <GhostButton onClick={() => navigate('/login')}>
                        Sign In
                    </GhostButton>
                    <PrimaryButton onClick={() => navigate('/login')}>
                        Launch App
                        <ArrowRight size={16} />
                    </PrimaryButton>
                </NavActionGroup>
            </Navbar>

            {/* Hero Section */}
            <HeroSection>
                <AnnouncementBadge onClick={() => navigate('/login')}>
                    <Sparkles size={15} color="#06B6D4" />
                    <span>DevSup 2.4 Released: WhatsApp-Style Statuses & In-App Doc Viewer</span>
                    <ChevronRight size={14} color="#06B6D4" />
                </AnnouncementBadge>

                <HeroTitle>
                    Where Code Meets Conversation.
                </HeroTitle>

                <HeroSubtitle>
                    The developer-first messaging platform engineered exclusively for software teams. Syntax-highlighted code snippets, real-time whiteboards, audio/video calls, and WhatsApp-grade polish—zero context switching.
                </HeroSubtitle>

                <HeroButtonGroup>
                    <LargeLaunchButton onClick={() => navigate('/login')}>
                        <Terminal size={20} />
                        Launch DevSup Free
                        <ArrowRight size={18} />
                    </LargeLaunchButton>
                    <LargeSecondaryButton href="#features">
                        Explore Features
                    </LargeSecondaryButton>
                </HeroButtonGroup>

                <PillarsRow>
                    <PillarItem><CheckCircle2 size={16} color="#06B6D4" /> Real-time WebSockets</PillarItem>
                    <PillarItem><CheckCircle2 size={16} color="#06B6D4" /> 50+ Languages Highlighted</PillarItem>
                    <PillarItem><CheckCircle2 size={16} color="#06B6D4" /> WebRTC HD Calls</PillarItem>
                    <PillarItem><CheckCircle2 size={16} color="#06B6D4" /> In-Chat Whiteboarding</PillarItem>
                </PillarsRow>

                {/* Interactive Product Mockup */}
                <MockupContainer id="preview">
                    <MockupWindowBar>
                        <MockupDots>
                            <MockupDot color="red" />
                            <MockupDot color="yellow" />
                            <MockupDot color="green" />
                        </MockupDots>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#94A3B8', fontWeight: '500' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }}></span>
                            <span>DevSup Workspace — #frontend-engineers • Sprint v2.4</span>
                        </div>
                        <div style={{ width: '50px' }}></div>
                    </MockupWindowBar>

                    <MockupBody>
                        {/* Sidebar */}
                        <MockupSidebar>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', padding: '6px 8px' }}>
                                Engineering Channels
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', backgroundColor: 'rgba(6, 182, 212, 0.14)', color: '#06B6D4', fontWeight: '600', fontSize: '0.88rem' }}>
                                <MessageSquare size={16} />
                                <span># frontend-engineers</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', color: '#94A3B8', fontSize: '0.88rem' }}>
                                <MessageSquare size={16} />
                                <span># backend-infra</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', color: '#94A3B8', fontSize: '0.88rem' }}>
                                <MessageSquare size={16} />
                                <span># ui-ux-design</span>
                            </div>

                            <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', padding: '14px 8px 6px 8px' }}>
                                Direct Messages
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', color: '#E2E8F0', fontSize: '0.85rem' }}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700' }}>SC</div>
                                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                                    <div style={{ fontWeight: '600' }}>Sarah Chen</div>
                                    <div style={{ fontSize: '0.72rem', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Whiteboard looks great!</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', color: '#E2E8F0', fontSize: '0.85rem' }}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700' }}>AV</div>
                                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                                    <div style={{ fontWeight: '600' }}>Alex Vance</div>
                                    <div style={{ fontSize: '0.72rem', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>API route deployed 🚀</div>
                                </div>
                            </div>
                        </MockupSidebar>

                        {/* Central Chat Stream */}
                        <MockupChatArena>
                            {/* Message 1: Status Reply */}
                            <div style={{ alignSelf: 'flex-start', maxWidth: '380px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '10px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ fontSize: '0.75rem', color: '#06B6D4', fontWeight: '600', marginBottom: '4px' }}>[Status: Photo: Production Deploy 🚀]</div>
                                <div style={{ fontSize: '0.88rem', color: '#F8FAFC' }}>Congrats team, the new v2.4 socket engine is live!</div>
                            </div>

                            {/* Message 2: Syntax Highlighted Code Snippet */}
                            <div style={{ alignSelf: 'flex-end', maxWidth: '440px', backgroundColor: 'rgba(6, 182, 212, 0.1)', borderRadius: '12px', padding: '12px 14px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.75rem', color: '#06B6D4', fontWeight: '600' }}>
                                    <span>typescript • pipeline.ts</span>
                                    <span>You • 3:42 PM</span>
                                </div>
                                <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.82rem', color: '#E2E8F0', backgroundColor: '#0B1120', padding: '10px', borderRadius: '8px', overflowX: 'hidden', textAlign: 'left' }}>
                                    <code>{`// Real-time synchronization worker\nexport const useSocketStream = (id) => {\n  const socket = io(WS_GATEWAY);\n  socket.emit('join:room', { id });\n};`}</code>
                                </pre>
                            </div>

                            {/* Message 3: Document Card */}
                            <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                                    <FileText size={20} />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '0.86rem', fontWeight: '600', color: '#FFF' }}>Architecture-v3-Sprint.pdf</div>
                                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>PDF DOCUMENT • Open in Viewer / App</div>
                                </div>
                            </div>

                            {/* Bottom Input Mockup */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#0F172A', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <Code size={18} color="#06B6D4" />
                                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Type message or insert code block (```)...</span>
                            </div>
                        </MockupChatArena>

                        {/* Right Drawer */}
                        <MockupDrawer>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>
                                Live Call (3 Active)
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', animation: `${pulseGlow} 1.5s infinite` }}></div>
                                <span style={{ fontSize: '0.82rem', color: '#10B981', fontWeight: '600' }}>WebRTC HD Voice Room</span>
                            </div>

                            <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', marginTop: '10px' }}>
                                Collaborative Canvas
                            </div>
                            <div style={{ height: '110px', borderRadius: '8px', backgroundColor: '#070B14', border: '1px dashed rgba(6, 182, 212, 0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#06B6D4' }}>
                                <PenTool size={22} />
                                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>In-Chat Whiteboard Active</span>
                            </div>
                        </MockupDrawer>
                    </MockupBody>
                </MockupContainer>
            </HeroSection>

            {/* Marquee Section */}
            <MarqueeWrapper id="architecture">
                <MarqueeTrack>
                    {marqueeList.map((item, index) => (
                        <TechBadge key={index}>
                            <span style={{ color: '#06B6D4' }}>{item.icon}</span>
                            <span>{item.name}</span>
                        </TechBadge>
                    ))}
                </MarqueeTrack>
            </MarqueeWrapper>

            {/* Bento Grid Features */}
            <BentoSection id="features">
                <SectionHeader>
                    <SectionTag>BUILT SPECIFICALLY FOR DEVELOPERS</SectionTag>
                    <SectionHeadline>Tools You Love, Integrated Without Friction</SectionHeadline>
                    <SectionDescription>
                        DevSup combines the agility of modern chat apps with the technical depth of an IDE so engineering teams stay in their flow state.
                    </SectionDescription>
                </SectionHeader>

                <BentoGrid>
                    {/* Card 1: Code Sharing */}
                    <BentoCard span={8}>
                        <FeatureIcon><Code size={28} /></FeatureIcon>
                        <div>
                            <FeatureTitle>Syntax-Highlighted Code Snippets</FeatureTitle>
                            <FeatureText>
                                Paste or write code directly into the chat arena. Auto-detects 50+ languages with VSCode Dark Plus styling, line counters, and one-click copy to clipboard.
                            </FeatureText>
                        </div>
                    </BentoCard>

                    {/* Card 2: Developer Badges */}
                    <BentoCard span={4}>
                        <FeatureIcon><Users size={28} /></FeatureIcon>
                        <div>
                            <FeatureTitle>Tech Identity & Roles</FeatureTitle>
                            <FeatureText>
                                Distinguish teammates instantly with role tags (Frontend, Backend, UI/UX, Mobile) and custom color identities.
                            </FeatureText>
                        </div>
                    </BentoCard>

                    {/* Card 3: Whiteboard */}
                    <BentoCard span={4}>
                        <FeatureIcon><PenTool size={28} /></FeatureIcon>
                        <div>
                            <FeatureTitle>Live Canvas Whiteboard</FeatureTitle>
                            <FeatureText>
                                Sketch architecture diagrams, ER diagrams, or UI mockups collaboratively in real-time and export directly to chat.
                            </FeatureText>
                        </div>
                    </BentoCard>

                    {/* Card 4: WhatsApp-Style Statuses */}
                    <BentoCard span={4}>
                        <FeatureIcon><Sparkles size={28} /></FeatureIcon>
                        <div>
                            <FeatureTitle>WhatsApp-Grade Statuses</FeatureTitle>
                            <FeatureText>
                                Share 24h disappearing progress updates with photo, video, and text stories—with view receipts and instant emoji replies.
                            </FeatureText>
                        </div>
                    </BentoCard>

                    {/* Card 5: Voice & Video */}
                    <BentoCard span={4}>
                        <FeatureIcon><Video size={28} /></FeatureIcon>
                        <div>
                            <FeatureTitle>HD Calls & Voice Notes</FeatureTitle>
                            <FeatureText>
                                Low-latency WebRTC group audio/video calling with screen share, plus WhatsApp-style animated voice notes.
                            </FeatureText>
                        </div>
                    </BentoCard>

                    {/* Card 6: Native Document Viewing */}
                    <BentoCard span={12} style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
                            <FeatureIcon><FileText size={28} /></FeatureIcon>
                            <div style={{ flex: 1, minWidth: '280px' }}>
                                <FeatureTitle>In-App Document Viewer & Native App Opener</FeatureTitle>
                                <FeatureText>
                                    View PDFs, Word documents, Excel spreadsheets, and presentations right inside DevSup without forced downloads. Tap once on mobile or desktop to open directly inside Microsoft Word, WPS Office, or Google Docs.
                                </FeatureText>
                            </div>
                        </div>
                    </BentoCard>
                </BentoGrid>
            </BentoSection>

            {/* Terminal CLI Section */}
            <TerminalSection id="terminal">
                <TerminalConsole>
                    <ConsoleBar>
                        <MockupDots>
                            <MockupDot color="red" />
                            <MockupDot color="yellow" />
                            <MockupDot color="green" />
                        </MockupDots>
                        <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>bash — devsup-cli</span>
                        <button
                            type="button"
                            onClick={handleCopyCmd}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'transparent',
                                border: 'none',
                                color: copied ? '#10B981' : '#94A3B8',
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                            }}
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </ConsoleBar>

                    <ConsoleBody>
                        <div><span style={{ color: '#06B6D4' }}>$</span> npm install @devsup/chat</div>
                        <div style={{ color: '#64748B', margin: '8px 0' }}>{'>'} Authenticating with DevSup cloud cluster...</div>
                        <div style={{ color: '#10B981', margin: '8px 0' }}>{'>'} Ready to collaborate. Zero context switching guaranteed.</div>
                        <div style={{ marginTop: '24px' }}>
                            <LargeLaunchButton onClick={() => navigate('/login')} style={{ width: '100%', justifyContent: 'center' }}>
                                initialize(DevSup)
                                <ArrowRight size={18} />
                            </LargeLaunchButton>
                        </div>
                    </ConsoleBody>
                </TerminalConsole>
            </TerminalSection>

            {/* Footer */}
            <Footer>
                <FooterContent>
                    <NavLogoGroup onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <DevSupLogo size={32} glow={true} />
                        <BrandName>Dev<span>Sup</span></BrandName>
                    </NavLogoGroup>

                    <p style={{ color: '#64748B', fontSize: '0.9rem', maxWidth: '500px', margin: 0 }}>
                        Engineered with precision for software developers and technical teams worldwide.
                    </p>

                    <div style={{ display: 'flex', gap: '20px', color: '#94A3B8', fontSize: '0.85rem' }}>
                        <span style={{ cursor: 'pointer' }} onClick={() => navigate('/login')}>Launch App</span>
                        <span>•</span>
                        <span style={{ cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to Top</span>
                        <span>•</span>
                        <span style={{ cursor: 'pointer' }} onClick={() => navigate('/login')}>Sign In</span>
                    </div>

                    <div style={{ color: '#475569', fontSize: '0.78rem', marginTop: '12px' }}>
                        © {new Date().getFullYear()} DevSup Platform. All rights reserved.
                    </div>
                </FooterContent>
            </Footer>
        </PageWrapper>
    );
}
