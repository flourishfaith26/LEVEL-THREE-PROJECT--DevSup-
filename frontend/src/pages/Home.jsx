import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { styled, keyframes } from '../stitches.config.js';
import { 
    Terminal, Code, Layers, Zap, MessageSquare, 
    PenTool, Video, FileText, Users, ArrowUpRight, 
    Activity, Shield, Cpu, Database, Radio, Check
} from 'lucide-react';
import DevSupLogo from '../components/DevSupLogo.jsx';

// Precision Ticker Animation
const tickerForward = keyframes({
    '0%': { transform: 'translateX(0)' },
    '100%': { transform: 'translateX(-50%)' },
});

const tickerReverse = keyframes({
    '0%': { transform: 'translateX(-50%)' },
    '100%': { transform: 'translateX(0)' },
});

// Root Container - Authentic Deep Abyss Canvas
const Root = styled('div', {
    minHeight: '100vh',
    '@supports (min-height: 100dvh)': {
        minHeight: '100dvh',
    },
    width: '100%',
    backgroundColor: '#070A0F',
    color: '#E2E8F0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "SF Pro Display", sans-serif',
    display: 'flex',
    flexDirection: 'column',
    overflowX: 'hidden',
    overflowY: 'auto',
    WebkitFontSmoothing: 'antialiased',
});

// Structural Bar
const TopNav = styled('header', {
    width: '100%',
    borderBottom: '1px solid #161F30',
    backgroundColor: 'rgba(7, 10, 15, 0.92)',
    backdropFilter: 'blur(8px)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
});

const NavInner = styled('div', {
    maxWidth: '1240px',
    margin: '0 auto',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
});

const BrandGroup = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    cursor: 'pointer',
    userSelect: 'none',
});

const BrandName = styled('span', {
    fontSize: '1.2rem',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    color: '#F8FAFC',
});

const SystemStatus = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 9px',
    borderRadius: '4px',
    backgroundColor: 'rgba(0, 210, 180, 0.08)',
    border: '1px solid rgba(0, 210, 180, 0.25)',
    color: '#00D2B4',
    fontSize: '0.72rem',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontWeight: '600',
    '@media (max-width: 640px)': {
        display: 'none',
    }
});

const NavActions = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
});

const TextLinkButton = styled('button', {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    fontSize: '0.88rem',
    fontWeight: '500',
    padding: '8px 14px',
    cursor: 'pointer',
    borderRadius: '5px',
    transition: 'color 0.15s ease',
    '&:hover': {
        color: '#F8FAFC',
    }
});

const SolidButton = styled('button', {
    backgroundColor: '#00D2B4',
    color: '#070A0F',
    border: 'none',
    borderRadius: '6px',
    padding: '9px 18px',
    fontSize: '0.88rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'background-color 0.15s ease',
    '&:hover': {
        backgroundColor: '#1ae2c5',
    }
});

// Hero Arena
const HeroContainer = styled('section', {
    maxWidth: '1240px',
    margin: '0 auto',
    padding: '80px 24px 70px 24px',
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '1.15fr 0.85fr',
    gap: '48px',
    alignItems: 'center',
    '@media (max-width: 960px)': {
        gridTemplateColumns: '1fr',
        padding: '50px 20px 40px 20px',
        gap: '36px',
    }
});

const HeroCopyBlock = styled('div', {
    textAlign: 'left',
});

const SectionMarker = styled('div', {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '0.78rem',
    color: '#00D2B4',
    fontWeight: '600',
    marginBottom: '16px',
});

const Headline = styled('h1', {
    fontSize: '3.6rem',
    fontWeight: '800',
    lineHeight: '1.08',
    letterSpacing: '-0.035em',
    color: '#F8FAFC',
    margin: '0 0 24px 0',
    '@media (max-width: 768px)': {
        fontSize: '2.5rem',
        lineHeight: '1.14',
    }
});

const Subhead = styled('p', {
    fontSize: '1.18rem',
    lineHeight: '1.65',
    color: '#94A3B8',
    maxWidth: '580px',
    margin: '0 0 36px 0',
    fontWeight: '400',
});

const ActionRow = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap',
});

const PrimaryLaunch = styled('button', {
    backgroundColor: '#00D2B4',
    color: '#070A0F',
    border: 'none',
    borderRadius: '6px',
    padding: '14px 28px',
    fontSize: '0.98rem',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.15s ease',
    '&:hover': {
        backgroundColor: '#1ae2c5',
        transform: 'translateY(-1px)',
    }
});

const SecondaryDocLink = styled('button', {
    backgroundColor: 'transparent',
    color: '#CBD5E1',
    border: '1px solid #1E293B',
    borderRadius: '6px',
    padding: '14px 24px',
    fontSize: '0.98rem',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.15s ease',
    '&:hover': {
        backgroundColor: '#0E1420',
        borderColor: '#334155',
        color: '#F8FAFC',
    }
});

// Telemetry Hero Inspector (Real Architectural Graphic)
const TelemetryConsole = styled('div', {
    backgroundColor: '#0B111A',
    border: '1px solid #1A263B',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)',
});

const ConsoleTop = styled('div', {
    padding: '10px 14px',
    backgroundColor: '#080D14',
    borderBottom: '1px solid #162133',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    color: '#64748B',
});

const ConsoleInner = styled('div', {
    padding: '18px',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '0.82rem',
    lineHeight: '1.6',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
});

const ConsoleRow = styled('div', {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    borderLeft: '2px solid transparent',
    paddingLeft: '8px',
    variants: {
        active: {
            true: {
                borderLeftColor: '#00D2B4',
                backgroundColor: 'rgba(0, 210, 180, 0.04)',
            }
        }
    }
});

// Magnificent Dual-Tiered Marquee Section
const MarqueeZone = styled('section', {
    width: '100%',
    backgroundColor: '#05070B',
    borderTop: '1px solid #161F30',
    borderBottom: '1px solid #161F30',
    padding: '28px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    overflow: 'hidden',
    position: 'relative',
    '&::before, &::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: '140px',
        zIndex: 10,
        pointerEvents: 'none',
    },
    '&::before': {
        left: 0,
        background: 'linear-gradient(to right, #070A0F, transparent)',
    },
    '&::after': {
        right: 0,
        background: 'linear-gradient(to left, #070A0F, transparent)',
    }
});

const Track = styled('div', {
    display: 'flex',
    gap: '16px',
    width: 'max-content',
    whiteSpace: 'nowrap',
    variants: {
        direction: {
            forward: { animation: `${tickerForward} 45s linear infinite` },
            reverse: { animation: `${tickerReverse} 40s linear infinite` },
        }
    }
});

const TelemetryChip = styled('div', {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    padding: '7px 14px',
    borderRadius: '5px',
    backgroundColor: '#0C121D',
    border: '1px solid #1A263B',
    fontSize: '0.8rem',
    color: '#CBD5E1',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    transition: 'border-color 0.15s ease',
    '&:hover': {
        borderColor: '#00D2B4',
    }
});

const MetricPill = styled('span', {
    color: '#00D2B4',
    fontWeight: '700',
});

// Asymmetric Architectural Breakdown (Replaces Generic SaaS Cards)
const ArchitectureSection = styled('section', {
    maxWidth: '1240px',
    margin: '0 auto',
    padding: '90px 24px',
    width: '100%',
});

const SectionHeader = styled('div', {
    marginBottom: '54px',
    textAlign: 'left',
    maxWidth: '720px',
});

const MainSectionTitle = styled('h2', {
    fontSize: '2.4rem',
    fontWeight: '800',
    letterSpacing: '-0.025em',
    color: '#F8FAFC',
    margin: '0 0 14px 0',
});

const SectionDescription = styled('p', {
    fontSize: '1.1rem',
    color: '#94A3B8',
    lineHeight: '1.6',
    margin: 0,
});

const ColumnsLayout = styled('div', {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1px',
    backgroundColor: '#161F30',
    border: '1px solid #161F30',
    borderRadius: '10px',
    overflow: 'hidden',
    '@media (max-width: 900px)': {
        gridTemplateColumns: '1fr',
    }
});

const LayerColumn = styled('div', {
    backgroundColor: '#090E17',
    padding: '36px 30px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '360px',
});

const LayerIndex = styled('div', {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '0.78rem',
    color: '#00D2B4',
    fontWeight: '700',
    marginBottom: '20px',
});

const LayerHeading = styled('h3', {
    fontSize: '1.35rem',
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: '-0.015em',
    margin: '0 0 12px 0',
});

const LayerBody = styled('p', {
    fontSize: '0.94rem',
    lineHeight: '1.65',
    color: '#94A3B8',
    margin: '0 0 24px 0',
});

const LayerSpecsList = styled('ul', {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    borderTop: '1px solid #162133',
    paddingTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
});

const LayerSpec = styled('li', {
    fontSize: '0.8rem',
    color: '#64748B',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    '& span': {
        color: '#94A3B8',
    }
});

// Precision Terminal Action Zone
const DirectLaunchZone = styled('section', {
    borderTop: '1px solid #161F30',
    backgroundColor: '#05080E',
    padding: '70px 24px',
});

const DirectLaunchInner = styled('div', {
    maxWidth: '1240px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '30px',
    flexWrap: 'wrap',
    '@media (max-width: 768px)': {
        flexDirection: 'column',
        alignItems: 'flex-start',
    }
});

// Grounded Footer
const BaseFooter = styled('footer', {
    borderTop: '1px solid #121A28',
    backgroundColor: '#04060A',
    padding: '36px 24px 44px 24px',
});

const FooterInner = styled('div', {
    maxWidth: '1240px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '20px',
    fontSize: '0.84rem',
    color: '#475569',
});

export default function Home() {
    const navigate = useNavigate();

    // Upper Tier: Operational Runtimes & Infrastructure
    const infrastructureTape = [
        { key: 'TRANSPORT', val: 'WebSocket Full-Duplex (4ms)' },
        { key: 'MEDIA-ENGINE', val: 'WebRTC Mesh / VP8 + Opus 48kHz' },
        { key: 'AST-PARSER', val: 'Prism Engine / 50+ Grammars' },
        { key: 'DOCUMENT-PROXY', val: 'Signed Cloudinary Streaming' },
        { key: 'SYNC-PIPELINE', val: 'Vector Canvas Socket Delta' },
        { key: 'AUTH-SUBSYSTEM', val: 'JWT Bearer & Auth0 RS256' },
        { key: 'DATABASE', val: 'MongoDB Atlas Sharded Cluster' },
    ];

    // Lower Tier: Protocol Standards & Engineering Workflows
    const protocolsTape = [
        { key: 'OFFICE-PROTOCOL', val: 'ms-word: / ms-excel: Direct Launch' },
        { key: 'ATTACHMENT-EXT', val: 'PDF • DOCX • XLSX • PPTX • RAW' },
        { key: 'STATUS-LIFECYCLE', val: '24-Hour Ephemeral Cache' },
        { key: 'VOICE-NOTES', val: 'MediaRecorder Audio/WebM Stream' },
        { key: 'WHITEBOARD', val: 'Vector Path Canvas Serialization' },
        { key: 'DEPLOY-TARGET', val: 'Vercel Edge & Render Engine' },
    ];

    const doubleInfra = [...infrastructureTape, ...infrastructureTape];
    const doubleProto = [...protocolsTape, ...protocolsTape];

    return (
        <Root>
            {/* Top Navigation */}
            <TopNav>
                <NavInner>
                    <BrandGroup onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <DevSupLogo size={28} glow={false} />
                        <BrandName>DevSup</BrandName>
                        <SystemStatus>
                            <Activity size={12} />
                            CLUSTERS OPERATIONAL
                        </SystemStatus>
                    </BrandGroup>

                    <NavActions>
                        <TextLinkButton onClick={() => navigate('/login')}>
                            Sign In
                        </TextLinkButton>
                        <SolidButton onClick={() => navigate('/login')}>
                            Enter Workspace
                            <ArrowUpRight size={15} />
                        </SolidButton>
                    </NavActions>
                </NavInner>
            </TopNav>

            {/* Hero Section */}
            <HeroContainer>
                <HeroCopyBlock>
                    <SectionMarker>
                        <Terminal size={14} />
                        ENGINEERING COMMUNICATION PLATFORM
                    </SectionMarker>
                    <Headline>
                        The messaging engine built for software engineering.
                    </Headline>
                    <Subhead>
                        DevSup unifies real-time chat, syntax-highlighted code blocks, collaborative vector whiteboarding, and native document workflows into a single high-performance workspace. Zero context-switching penalty.
                    </Subhead>
                    <ActionRow>
                        <PrimaryLaunch onClick={() => navigate('/login')}>
                            Launch DevSup Free
                            <ArrowUpRight size={17} />
                        </PrimaryLaunch>
                        <SecondaryDocLink onClick={() => navigate('/login')}>
                            Sign In to Account
                        </SecondaryDocLink>
                    </ActionRow>
                </HeroCopyBlock>

                {/* Telemetry Console (Demonstrating Real System Architecture) */}
                <TelemetryConsole>
                    <ConsoleTop>
                        <span>devsup-cluster-telemetry // v2.4</span>
                        <span style={{ color: '#00D2B4' }}>● LIVE</span>
                    </ConsoleTop>
                    <ConsoleInner>
                        <ConsoleRow active={true}>
                            <span style={{ color: '#64748B' }}>01</span>
                            <div>
                                <span style={{ color: '#00D2B4' }}>WS_SOCKET:</span>{' '}
                                <span style={{ color: '#CBD5E1' }}>handshake confirmed on /chat-gateway</span>
                            </div>
                        </ConsoleRow>
                        <ConsoleRow>
                            <span style={{ color: '#64748B' }}>02</span>
                            <div>
                                <span style={{ color: '#94A3B8' }}>SYNTAX_AST:</span>{' '}
                                <span style={{ color: '#E2E8F0' }}>vscDarkPlus active (TypeScript, Go, Rust, Python)</span>
                            </div>
                        </ConsoleRow>
                        <ConsoleRow active={true}>
                            <span style={{ color: '#64748B' }}>03</span>
                            <div>
                                <span style={{ color: '#00D2B4' }}>CANVAS_DELTA:</span>{' '}
                                <span style={{ color: '#CBD5E1' }}>collaborative whiteboard sync buffer ready</span>
                            </div>
                        </ConsoleRow>
                        <ConsoleRow>
                            <span style={{ color: '#64748B' }}>04</span>
                            <div>
                                <span style={{ color: '#94A3B8' }}>DOC_RESOLVER:</span>{' '}
                                <span style={{ color: '#E2E8F0' }}>native launch routes [Word, WPS, PDF] mapped</span>
                            </div>
                        </ConsoleRow>
                        <ConsoleRow>
                            <span style={{ color: '#64748B' }}>05</span>
                            <div>
                                <span style={{ color: '#94A3B8' }}>WEBRTC_AUDIO:</span>{' '}
                                <span style={{ color: '#E2E8F0' }}>Opus 48kHz full-duplex session pool online</span>
                            </div>
                        </ConsoleRow>
                    </ConsoleInner>
                </TelemetryConsole>
            </HeroContainer>

            {/* Magnificent Dual-Tiered Marquee (High-Density Telemetry Stream) */}
            <MarqueeZone>
                {/* Upper Tier: Forward Flow */}
                <Track direction="forward">
                    {doubleInfra.map((item, idx) => (
                        <TelemetryChip key={`infra-${idx}`}>
                            <span style={{ color: '#64748B' }}>{item.key} //</span>
                            <MetricPill>{item.val}</MetricPill>
                        </TelemetryChip>
                    ))}
                </Track>

                {/* Lower Tier: Reverse Flow */}
                <Track direction="reverse">
                    {doubleProto.map((item, idx) => (
                        <TelemetryChip key={`proto-${idx}`}>
                            <span style={{ color: '#64748B' }}>{item.key} //</span>
                            <span style={{ color: '#CBD5E1' }}>{item.val}</span>
                        </TelemetryChip>
                    ))}
                </Track>
            </MarqueeZone>

            {/* Architectural Pillars (Asymmetric 3-Column System Breakdown) */}
            <ArchitectureSection>
                <SectionHeader>
                    <SectionMarker>
                        <Cpu size={14} />
                        SYSTEM CAPABILITIES
                    </SectionMarker>
                    <MainSectionTitle>Built to replace fragmented developer stacks.</MainSectionTitle>
                    <SectionDescription>
                        Engineers typically juggle four separate windows for chat, code snippets, visual diagramming, and file exchange. DevSup unifies all four under one persistent connection.
                    </SectionDescription>
                </SectionHeader>

                <ColumnsLayout>
                    {/* Column 1: Syntax & Code Pipeline */}
                    <LayerColumn>
                        <div>
                            <LayerIndex>SYS_LAYER_01 // CODE</LayerIndex>
                            <LayerHeading>Native Syntax Tokenization</LayerHeading>
                            <LayerBody>
                                Multi-line code snippets are parsed and tokenized across 50+ languages with line numbering, accurate indentation retention, and clean one-click clipboard copying.
                            </LayerBody>
                        </div>
                        <LayerSpecsList>
                            <LayerSpec>ENGINE: <span>highlight.js AST parser</span></LayerSpec>
                            <LayerSpec>THEME: <span>VS Code Dark Plus compliant</span></LayerSpec>
                            <LayerSpec>COPY_BUFFER: <span>Preserves CRLF/LF line endings</span></LayerSpec>
                        </LayerSpecsList>
                    </LayerColumn>

                    {/* Column 2: Vector Whiteboarding */}
                    <LayerColumn>
                        <div>
                            <LayerIndex>SYS_LAYER_02 // CANVAS</LayerIndex>
                            <LayerHeading>Real-Time Whiteboard Vector</LayerHeading>
                            <LayerBody>
                                An in-chat collaborative vector canvas overlay. Sketch distributed system architectures, database schemas, and wireframes together without launching external tools.
                            </LayerBody>
                        </div>
                        <LayerSpecsList>
                            <LayerSpec>SYNC: <span>Full-duplex WebSocket path delta</span></LayerSpec>
                            <LayerSpec>EXPORT: <span>Direct-to-chat image commit</span></LayerSpec>
                            <LayerSpec>TOOLING: <span>Pen, shape, erase, stroke weights</span></LayerSpec>
                        </LayerSpecsList>
                    </LayerColumn>

                    {/* Column 3: Native Document Execution */}
                    <LayerColumn>
                        <div>
                            <LayerIndex>SYS_LAYER_03 // RUNTIME</LayerIndex>
                            <LayerHeading>Native Document Resolver</LayerHeading>
                            <LayerBody>
                                View PDFs, Word documents, and spreadsheets directly in-app or launch them immediately on your device using native application protocols (Microsoft Word, WPS Office, Acrobat).
                            </LayerBody>
                        </div>
                        <LayerSpecsList>
                            <LayerSpec>DESKTOP: <span>ms-word: & ms-excel: protocol handlers</span></LayerSpec>
                            <LayerSpec>MOBILE: <span>Android/iOS system share resolver</span></LayerSpec>
                            <LayerSpec>STREAM: <span>Authenticated signed Cloudinary pipe</span></LayerSpec>
                        </LayerSpecsList>
                    </LayerColumn>
                </ColumnsLayout>
            </ArchitectureSection>

            {/* Direct Launch Banner */}
            <DirectLaunchZone>
                <DirectLaunchInner>
                    <div>
                        <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#F8FAFC', marginBottom: '6px' }}>
                            Ready to consolidate your engineering team communication?
                        </div>
                        <div style={{ fontSize: '0.94rem', color: '#94A3B8' }}>
                            Authenticate with your developer identity and begin collaborating in seconds.
                        </div>
                    </div>
                    <PrimaryLaunch onClick={() => navigate('/login')}>
                        Launch DevSup Workspace
                        <ArrowUpRight size={17} />
                    </PrimaryLaunch>
                </DirectLaunchInner>
            </DirectLaunchZone>

            {/* Grounded Minimal Footer */}
            <BaseFooter>
                <FooterInner>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <DevSupLogo size={22} glow={false} />
                        <span>DevSup Platform // Developer Communication Network</span>
                    </div>

                    <div style={{ display: 'flex', gap: '24px' }}>
                        <span style={{ cursor: 'pointer', color: '#94A3B8' }} onClick={() => navigate('/login')}>Sign In</span>
                        <span style={{ cursor: 'pointer', color: '#94A3B8' }} onClick={() => navigate('/login')}>Register</span>
                        <span style={{ cursor: 'pointer', color: '#94A3B8' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Return to Top</span>
                    </div>

                    <div>
                        © {new Date().getFullYear()} DevSup. All systems operational.
                    </div>
                </FooterInner>
            </BaseFooter>
        </Root>
    );
}
