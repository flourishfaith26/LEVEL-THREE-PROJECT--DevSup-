import { useNavigate } from 'react-router-dom';
import { styled } from '../stitches.config.js';
import { 
    Terminal, Code, Layers, Zap, MessageSquare, 
    PenTool, Video, FileText, Users, ArrowRight 
} from 'lucide-react';
import DevSupLogo from '../components/DevSupLogo.jsx';

const PageContainer = styled('div', {
    minHeight: '100vh',
    '@supports (min-height: 100dvh)': {
        minHeight: '100dvh',
    },
    width: '100%',
    backgroundColor: '#0B0F19',
    color: '#F8FAFC',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    overflowX: 'hidden',
    overflowY: 'auto',
});

// Top Navigation Bar
const Navbar = styled('nav', {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
});

const Brand = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    userSelect: 'none',
});

const BrandTitle = styled('span', {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: '-0.02em',
    '& span': {
        color: '#06B6D4',
    }
});

const NavActions = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
});

const SignInButton = styled('button', {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    fontSize: '0.9rem',
    fontWeight: '500',
    padding: '8px 16px',
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'color 0.15s ease',
    '&:hover': {
        color: '#FFFFFF',
    }
});

const LaunchSmallButton = styled('button', {
    backgroundColor: '#06B6D4',
    color: '#0B0F19',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 18px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'background-color 0.15s ease',
    '&:hover': {
        backgroundColor: '#22d3ee',
    }
});

// Hero Section
const Hero = styled('header', {
    padding: '80px 24px 60px 24px',
    maxWidth: '900px',
    margin: '0 auto',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    '@media (max-width: 768px)': {
        padding: '50px 20px 40px 20px',
    }
});

const MainHeading = styled('h1', {
    fontSize: '3.75rem',
    fontWeight: '800',
    lineHeight: '1.12',
    letterSpacing: '-0.03em',
    color: '#FFFFFF',
    margin: '24px 0 20px 0',
    '@media (max-width: 768px)': {
        fontSize: '2.5rem',
        lineHeight: '1.2',
        margin: '20px 0 16px 0',
    }
});

const HeroDescription = styled('p', {
    fontSize: '1.2rem',
    lineHeight: '1.6',
    color: '#94A3B8',
    maxWidth: '680px',
    margin: '0 0 32px 0',
    fontWeight: '400',
    '@media (max-width: 768px)': {
        fontSize: '1.05rem',
    }
});

const ActionRow = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: '20px',
});

const PrimaryCTA = styled('button', {
    backgroundColor: '#06B6D4',
    color: '#0B0F19',
    border: 'none',
    borderRadius: '8px',
    padding: '14px 32px',
    fontSize: '1.05rem',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.15s ease',
    '&:hover': {
        backgroundColor: '#22d3ee',
    }
});

const SecondaryCTA = styled('button', {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    color: '#FFFFFF',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '8px',
    padding: '14px 28px',
    fontSize: '1.05rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
    }
});

// Tech Stack Bar
const TechStackSection = styled('section', {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '30px 24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
});

const TechStackLabel = styled('div', {
    fontSize: '0.78rem',
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    textAlign: 'center',
    marginBottom: '18px',
});

const TechGrid = styled('div', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '32px',
    flexWrap: 'wrap',
    color: '#94A3B8',
    fontSize: '0.95rem',
    fontWeight: '500',
    '@media (max-width: 640px)': {
        gap: '20px',
        fontSize: '0.85rem',
    }
});

const TechItem = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#94A3B8',
    transition: 'color 0.15s ease',
    '&:hover': {
        color: '#FFFFFF',
    }
});

// Features Section
const FeaturesSection = styled('section', {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '80px 24px',
    '@media (max-width: 768px)': {
        padding: '50px 20px',
    }
});

const SectionHeader = styled('div', {
    marginBottom: '48px',
    textAlign: 'left',
});

const SectionTitle = styled('h2', {
    fontSize: '2rem',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    color: '#FFFFFF',
    margin: '0 0 10px 0',
});

const SectionSubtitle = styled('p', {
    fontSize: '1.05rem',
    color: '#94A3B8',
    margin: 0,
});

const Grid = styled('div', {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    '@media (max-width: 960px)': {
        gridTemplateColumns: 'repeat(2, 1fr)',
    },
    '@media (max-width: 640px)': {
        gridTemplateColumns: '1fr',
    }
});

const Card = styled('div', {
    backgroundColor: '#111827',
    border: '1px solid #1F2937',
    borderRadius: '10px',
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    transition: 'border-color 0.15s ease',
    '&:hover': {
        borderColor: '#374151',
    }
});

const CardIconWrapper = styled('div', {
    width: '42px',
    height: '42px',
    borderRadius: '8px',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    color: '#06B6D4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '18px',
});

const CardHeading = styled('h3', {
    fontSize: '1.15rem',
    fontWeight: '600',
    color: '#FFFFFF',
    margin: '0 0 10px 0',
});

const CardBody = styled('p', {
    fontSize: '0.92rem',
    lineHeight: '1.55',
    color: '#94A3B8',
    margin: 0,
});

// Call-to-action Section
const BottomCTASection = styled('section', {
    width: '100%',
    backgroundColor: '#0F172A',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    padding: '70px 24px',
    textAlign: 'center',
});

const BottomCTAContainer = styled('div', {
    maxWidth: '680px',
    margin: '0 auto',
});

const CTAHeading = styled('h2', {
    fontSize: '2.2rem',
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: '-0.02em',
    margin: '0 0 14px 0',
});

const CTADescription = styled('p', {
    fontSize: '1.05rem',
    color: '#94A3B8',
    lineHeight: '1.6',
    margin: '0 0 28px 0',
});

// Footer
const Footer = styled('footer', {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 24px 50px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
    fontSize: '0.88rem',
    color: '#64748B',
});

const FooterLinks = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    '& span': {
        color: '#94A3B8',
        cursor: 'pointer',
        transition: 'color 0.15s ease',
        '&:hover': {
            color: '#FFFFFF',
        }
    }
});

export default function Home() {
    const navigate = useNavigate();

    return (
        <PageContainer>
            {/* Navigation Bar */}
            <Navbar>
                <Brand onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <DevSupLogo size={32} glow={false} />
                    <BrandTitle>Dev<span>Sup</span></BrandTitle>
                </Brand>

                <NavActions>
                    <SignInButton onClick={() => navigate('/login')}>
                        Sign In
                    </SignInButton>
                    <LaunchSmallButton onClick={() => navigate('/login')}>
                        Get Started
                        <ArrowRight size={15} />
                    </LaunchSmallButton>
                </NavActions>
            </Navbar>

            {/* Hero Section */}
            <Hero>
                <DevSupLogo size={76} glow={false} style={{ marginBottom: '8px' }} />
                <MainHeading>Code meets conversation.</MainHeading>
                <HeroDescription>
                    DevSup is a developer communication platform engineered for engineering teams.
                    Syntax-highlighted code sharing, in-chat collaborative whiteboards, WebRTC calls,
                    and document viewing without context switching.
                </HeroDescription>

                <ActionRow>
                    <PrimaryCTA onClick={() => navigate('/login')}>
                        <Terminal size={18} />
                        Launch DevSup
                    </PrimaryCTA>
                    <SecondaryCTA onClick={() => navigate('/login')}>
                        Sign in to account
                    </SecondaryCTA>
                </ActionRow>
            </Hero>

            {/* Tech Stack Strip */}
            <TechStackSection>
                <TechStackLabel>Built on modern open standards</TechStackLabel>
                <TechGrid>
                    <TechItem><Code size={18} /> React</TechItem>
                    <TechItem><Zap size={18} /> Socket.io</TechItem>
                    <TechItem><Video size={18} /> WebRTC</TechItem>
                    <TechItem><Layers size={18} /> MongoDB</TechItem>
                    <TechItem><FileText size={18} /> Cloudinary</TechItem>
                    <TechItem><Terminal size={18} /> Node.js</TechItem>
                </TechGrid>
            </TechStackSection>

            {/* Core Features */}
            <FeaturesSection>
                <SectionHeader>
                    <SectionTitle>Engineered for Software Developers</SectionTitle>
                    <SectionSubtitle>
                        A unified workspace combining chat with essential engineering tools.
                    </SectionSubtitle>
                </SectionHeader>

                <Grid>
                    <Card>
                        <CardIconWrapper>
                            <Code size={22} />
                        </CardIconWrapper>
                        <CardHeading>Syntax Highlighting</CardHeading>
                        <CardBody>
                            Automatic syntax detection and formatted multi-line code blocks supporting 50+ languages with clean monospace typography and one-click copy.
                        </CardBody>
                    </Card>

                    <Card>
                        <CardIconWrapper>
                            <PenTool size={22} />
                        </CardIconWrapper>
                        <CardHeading>In-Chat Whiteboarding</CardHeading>
                        <CardBody>
                            A collaborative real-time canvas to diagram system architecture, database schemas, and interface wireframes together directly in chat.
                        </CardBody>
                    </Card>

                    <Card>
                        <CardIconWrapper>
                            <FileText size={22} />
                        </CardIconWrapper>
                        <CardHeading>Document & File Viewer</CardHeading>
                        <CardBody>
                            Open PDFs, Word documents, and spreadsheets inside DevSup or launch them in native desktop and phone applications like Microsoft Word and WPS Office.
                        </CardBody>
                    </Card>

                    <Card>
                        <CardIconWrapper>
                            <Video size={22} />
                        </CardIconWrapper>
                        <CardHeading>Audio & Video Calls</CardHeading>
                        <CardBody>
                            Low-latency WebRTC group audio and video calling with screen sharing for rapid pair programming and sprint standups.
                        </CardBody>
                    </Card>

                    <Card>
                        <CardIconWrapper>
                            <Users size={22} />
                        </CardIconWrapper>
                        <CardHeading>Tech Role Identity</CardHeading>
                        <CardBody>
                            Participants carry explicit discipline indicators (Frontend, Backend, UI/UX, Mobile) so specialties and context are immediately clear.
                        </CardBody>
                    </Card>

                    <Card>
                        <CardIconWrapper>
                            <MessageSquare size={22} />
                        </CardIconWrapper>
                        <CardHeading>Statuses & Media</CardHeading>
                        <CardBody>
                            Share 24-hour progress updates with photos, videos, and text notes, complete with read status ticks and inline replies.
                        </CardBody>
                    </Card>
                </Grid>
            </FeaturesSection>

            {/* Bottom Call to Action */}
            <BottomCTASection>
                <BottomCTAContainer>
                    <CTAHeading>Ready to streamline technical chat?</CTAHeading>
                    <CTADescription>
                        Stop switching between chat apps, external whiteboard tools, and code sharing sites.
                        Connect with your team on DevSup.
                    </CTADescription>
                    <PrimaryCTA onClick={() => navigate('/login')}>
                        Get Started Free
                        <ArrowRight size={18} />
                    </PrimaryCTA>
                </BottomCTAContainer>
            </BottomCTASection>

            {/* Footer */}
            <Footer>
                <div>
                    © {new Date().getFullYear()} DevSup. Developer Support Network.
                </div>
                <FooterLinks>
                    <span onClick={() => navigate('/login')}>Sign In</span>
                    <span onClick={() => navigate('/login')}>Register</span>
                    <span onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Top</span>
                </FooterLinks>
            </Footer>
        </PageContainer>
    );
}
