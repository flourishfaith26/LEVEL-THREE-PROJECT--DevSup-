import { useAuth0 } from '@auth0/auth0-react';
import { styled, keyframes } from '../stitches.config.js';
import { Terminal, Code, Layers, Zap, MessageSquare, LayoutTemplate, PenTool } from 'lucide-react';

const scroll = keyframes({
    '0%': { transform: 'translateX(0)' },
    '100%': { transform: 'translateX(-50%)' },
});

const glowPulse = keyframes({
    '0%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.2)' },
    '50%': { boxShadow: '0 0 40px rgba(6, 182, 212, 0.5)' },
    '100%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.2)' },
});

const HomeContainer = styled('div', {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '$bg',
    color: '$textMain',
    overflowY: 'auto',
});

const HeroSection = styled('section', {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '$4 20px',
    minHeight: '70vh',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
});

const GlowBackground = styled('div', {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    height: '600px',
    background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, rgba(15, 23, 42, 0) 70%)',
    zIndex: 0,
});

const Title = styled('h1', {
    fontSize: '4rem',
    fontWeight: '900',
    marginBottom: '$3',
    background: 'linear-gradient(to right, #F8FAFC, #94A3B8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    zIndex: 1,
});

const Subtitle = styled('p', {
    fontSize: '1.25rem',
    color: '$textMuted',
    maxWidth: '600px',
    marginBottom: '$4',
    lineHeight: '1.6',
    zIndex: 1,
});

const CyanGlowButton = styled('button', {
    padding: '16px 40px',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    backgroundColor: '$accent',
    color: '$bg',
    border: 'none',
    borderRadius: '$1',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    animation: `${glowPulse} 3s infinite`,
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    '&:hover': {
        backgroundColor: '$accentHover',
        transform: 'translateY(-2px)',
    }
});

const MarqueeContainer = styled('div', {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '$surface',
    padding: '$3 0',
    borderTop: '1px solid $border',
    borderBottom: '1px solid $border',
    display: 'flex',
});

const MarqueeTrack = styled('div', {
    display: 'flex',
    width: '200%',
    animation: `${scroll} 20s linear infinite`,
});

const TechLogo = styled('div', {
    flex: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '$textMuted',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    gap: '10px',
    filter: 'grayscale(100%)',
    transition: 'filter 0.3s',
    '&:hover': {
        filter: 'grayscale(0%)',
        color: '$accent',
    }
});

const BentoSection = styled('section', {
    padding: '80px 20px',
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
});

const SectionTitle = styled('h2', {
    fontSize: '2.5rem',
    marginBottom: '3rem',
    color: '$textMain',
});

const BentoGrid = styled('div', {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: '20px',
    width: '100%',
});

const BentoCard = styled('div', {
    backgroundColor: '$surface',
    borderRadius: '$2',
    padding: '$4',
    border: '1px solid $border',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s',
    '&:hover': {
        transform: 'translateY(-4px)',
        borderColor: '$accent',
    },
    variants: {
        span: {
            4: { gridColumn: 'span 12', '@media (min-width: 768px)': { gridColumn: 'span 4' } },
            8: { gridColumn: 'span 12', '@media (min-width: 768px)': { gridColumn: 'span 8' } },
            6: { gridColumn: 'span 12', '@media (min-width: 768px)': { gridColumn: 'span 6' } },
            12: { gridColumn: 'span 12' },
        }
    }
});

const CardIcon = styled('div', {
    color: '$accent',
    marginBottom: '$3',
});

const CardTitle = styled('h3', {
    fontSize: '1.25rem',
    marginBottom: '$2',
    color: '$textMain',
});

const CardText = styled('p', {
    color: '$textMuted',
    lineHeight: '1.5',
});

const FooterCTA = styled('footer', {
    backgroundColor: '$bg',
    padding: '60px 20px',
    borderTop: '1px solid $border',
    display: 'flex',
    justifyContent: 'center',
});

const TerminalBox = styled('div', {
    backgroundColor: '$surface',
    borderRadius: '$1',
    border: '1px solid $border',
    width: '100%',
    maxWidth: '600px',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
});

const TerminalHeader = styled('div', {
    backgroundColor: '#0F172A',
    padding: '10px',
    display: 'flex',
    gap: '6px',
    borderBottom: '1px solid $border',
});

const TerminalDot = styled('div', {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    variants: {
        color: {
            red: { backgroundColor: '#EF4444' },
            yellow: { backgroundColor: '#F59E0B' },
            green: { backgroundColor: '#10B981' },
        }
    }
});

const TerminalBody = styled('div', {
    padding: '$4',
    fontFamily: 'monospace',
    color: '$textMain',
});

const TerminalPrompt = styled('span', {
    color: '$accent',
    marginRight: '10px',
});

export default function Home() {
    const { loginWithRedirect } = useAuth0();

    const techStack = [
        { name: 'React', icon: <Code size={24} /> },
        { name: 'Auth0', icon: <Zap size={24} /> },
        { name: 'MongoDB', icon: <Layers size={24} /> },
        { name: 'Socket.io', icon: <MessageSquare size={24} /> },
        { name: 'Cloudinary', icon: <LayoutTemplate size={24} /> },
    ];

    // Duplicate for continuous marquee effect
    const marqueeItems = [...techStack, ...techStack];

    return (
        <HomeContainer>
            <HeroSection>
                <GlowBackground />
                <Title>Code Meets Conversation</Title>
                <Subtitle>
                    DevSup is a developer-centric chat application engineered to bridge the gap between casual communication and heavy-duty technical collaboration. No more context switching.
                </Subtitle>
                <CyanGlowButton onClick={() => loginWithRedirect()}>
                    <Terminal size={20} />
                    Launch DevSup
                </CyanGlowButton>
            </HeroSection>

            <MarqueeContainer>
                <MarqueeTrack>
                    {marqueeItems.map((tech, index) => (
                        <TechLogo key={index}>
                            {tech.icon}
                            {tech.name}
                        </TechLogo>
                    ))}
                </MarqueeTrack>
            </MarqueeContainer>

            <BentoSection>
                <SectionTitle>Engineered for Developers</SectionTitle>
                <BentoGrid>
                    <BentoCard span={8}>
                        <CardIcon><Code size={32} /></CardIcon>
                        <CardTitle>Developer-Centric Messaging</CardTitle>
                        <CardText>Intelligent text parsing automatically detects syntax, rendering multi-line code blocks cleanly and accurately using highlight.js with the vscDarkPlus theme.</CardText>
                    </BentoCard>
                    <BentoCard span={4}>
                        <CardIcon><Layers size={32} /></CardIcon>
                        <CardTitle>Dynamic Tech Identity</CardTitle>
                        <CardText>Every participant bears a specific tech discipline badge (Frontend, Backend, UI/UX) directly in their profile.</CardText>
                    </BentoCard>
                    
                    <BentoCard span={4}>
                        <CardIcon><LayoutTemplate size={32} /></CardIcon>
                        <CardTitle>3-Pane Architecture</CardTitle>
                        <CardText>A WhatsApp-meets-IDE layout featuring a Nav Sidebar, central Chat Arena, and a Productivity Drawer for pinned resources.</CardText>
                    </BentoCard>
                    <BentoCard span={4}>
                        <CardIcon><PenTool size={32} /></CardIcon>
                        <CardTitle>In-Chat Whiteboarding</CardTitle>
                        <CardText>A lightweight, WebSocket-synced collaborative canvas overlay. Sketch system architecture diagrams or UI wireframes in real-time.</CardText>
                    </BentoCard>
                    <BentoCard span={4}>
                        <CardIcon><Zap size={32} /></CardIcon>
                        <CardTitle>Rich Ecosystem Integrations</CardTitle>
                        <CardText>Native URL parser intercepts GitHub, Figma, and Notion links, transforming them into interactive, dark-themed embed cards.</CardText>
                    </BentoCard>
                </BentoGrid>
            </BentoSection>

            <FooterCTA>
                <TerminalBox>
                    <TerminalHeader>
                        <TerminalDot color="red" />
                        <TerminalDot color="yellow" />
                        <TerminalDot color="green" />
                    </TerminalHeader>
                    <TerminalBody>
                        <div><TerminalPrompt>~</TerminalPrompt><span>npm install @devsup/collaboration</span></div>
                        <div style={{ color: '#94A3B8', margin: '10px 0' }}>{'>'} Resolving dependencies...</div>
                        <div style={{ color: '#10B981', margin: '10px 0' }}>{'>'} Ready to bridge code and chat.</div>
                        <div style={{ marginTop: '20px' }}>
                            <CyanGlowButton onClick={() => loginWithRedirect()} style={{ padding: '8px 20px', fontSize: '1rem', width: '100%', justifyContent: 'center' }}>
                                initialize()
                            </CyanGlowButton>
                        </div>
                    </TerminalBody>
                </TerminalBox>
            </FooterCTA>
        </HomeContainer>
    );
}