import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { styled, keyframes } from '../stitches.config.js';
import { 
    Code, Mail, Lock, User, AlertCircle, Eye, EyeOff, Check, CheckCircle2, 
    ArrowLeft, ArrowRight, ShieldCheck, Terminal, Layers
} from 'lucide-react';
import DevSupPumpLoader from '../components/DevSupPumpLoader.jsx';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const float = keyframes({
    '0%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-6px)' },
    '100%': { transform: 'translateY(0px)' },
});

const pulseGlow = keyframes({
    '0%, 100%': { opacity: 0.4 },
    '50%': { opacity: 0.8 },
});

const PageContainer = styled('div', {
    minHeight: '100vh',
    '@supports (min-height: 100dvh)': {
        minHeight: '100dvh',
    },
    display: 'flex',
    backgroundColor: '#0B0F19',
    color: '#F8FAFC',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    overflowX: 'hidden',
    position: 'relative',
});

const LeftPanel = styled('div', {
    flex: '1.1',
    display: 'none',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '3.5rem 4.5rem',
    position: 'relative',
    backgroundColor: '#0F172A',
    backgroundImage: `
        radial-gradient(circle at 15% 25%, rgba(6, 182, 212, 0.15) 0%, transparent 45%),
        radial-gradient(circle at 85% 75%, rgba(14, 165, 233, 0.08) 0%, transparent 40%),
        radial-gradient(circle, rgba(255, 255, 255, 0.06) 1px, transparent 1px)
    `,
    backgroundSize: '100% 100%, 100% 100%, 28px 28px',
    borderRight: '1px solid #1E293B',
    overflow: 'hidden',
    '@media (min-width: 960px)': {
        display: 'flex',
    }
});

const RightPanel = styled('div', {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2.5rem 2rem',
    backgroundColor: '#0B0F19',
    backgroundImage: 'radial-gradient(circle at 50% 10%, rgba(6, 182, 212, 0.05) 0%, transparent 50%)',
    position: 'relative',
    zIndex: 1,
    overflowY: 'auto',
    '@media (max-width: 768px)': {
        padding: '2rem 1.25rem env(safe-area-inset-bottom) 1.25rem',
        width: '100%',
    }
});

const AuthCard = styled('div', {
    width: '100%',
    maxWidth: '430px',
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '2.25rem 2rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    position: 'relative',
    '@media (max-width: 480px)': {
        padding: '1.75rem 1.25rem',
        backgroundColor: 'transparent',
        border: 'none',
        boxShadow: 'none',
    }
});

const TabSwitch = styled('div', {
    display: 'flex',
    backgroundColor: '#0F172A',
    padding: '3px',
    borderRadius: '10px',
    border: '1px solid #334155',
    marginBottom: '0.25rem',
});

const TabButton = styled('button', {
    flex: 1,
    padding: '8px 12px',
    fontSize: '0.85rem',
    fontWeight: '600',
    fontFamily: '"JetBrains Mono", monospace',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    variants: {
        active: {
            true: {
                backgroundColor: '#06B6D4',
                color: '#0B0F19',
                boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)',
            },
            false: {
                backgroundColor: 'transparent',
                color: '#94A3B8',
                '&:hover': {
                    color: '#F8FAFC',
                }
            }
        }
    }
});

const Title = styled('h1', {
    fontSize: '1.75rem',
    fontWeight: '800',
    letterSpacing: '-0.02em',
    margin: '0 0 0.35rem 0',
    color: '#F8FAFC',
});

const Subtitle = styled('p', {
    color: '#94A3B8',
    margin: 0,
    fontSize: '0.9rem',
    lineHeight: '1.4',
});

const Form = styled('form', {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.95rem',
});

const InputGroup = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
});

const Label = styled('label', {
    fontSize: '0.82rem',
    color: '#CBD5E1',
    fontWeight: '600',
    letterSpacing: '0.01em',
});

const InputWrapper = styled('div', {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
});

const InputIcon = styled('div', {
    position: 'absolute',
    left: '12px',
    color: '#64748B',
    display: 'flex',
    pointerEvents: 'none',
    transition: 'color 0.2s ease',
});

const Input = styled('input', {
    width: '100%',
    padding: '11px 12px 11px 38px',
    backgroundColor: '#0F172A',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#F8FAFC',
    fontSize: '0.92rem',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    '&:focus': {
        outline: 'none',
        borderColor: '#06B6D4',
        boxShadow: '0 0 0 2px rgba(6, 182, 212, 0.2)',
        backgroundColor: '#0A0F1D',
    },
    '&::placeholder': {
        color: '#475569',
    }
});

const AuthButton = styled('button', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '700',
    fontFamily: '"JetBrains Mono", monospace',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    variants: {
        variant: {
            primary: {
                backgroundColor: '#06B6D4',
                color: '#0B0F19',
                boxShadow: '0 4px 16px rgba(6, 182, 212, 0.3)',
                '&:hover:not(:disabled)': {
                    backgroundColor: '#22D3EE',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 20px rgba(6, 182, 212, 0.4)',
                },
                '&:active:not(:disabled)': {
                    transform: 'translateY(0)',
                },
                '&:disabled': {
                    opacity: 0.6,
                    cursor: 'not-allowed',
                }
            },
            outline: {
                backgroundColor: '#0F172A',
                border: '1px solid #334155',
                color: '#E2E8F0',
                '&:hover': {
                    borderColor: '#475569',
                    backgroundColor: '#1E293B',
                    color: '#FFFFFF',
                }
            },
            ghost: {
                backgroundColor: 'transparent',
                color: '#06B6D4',
                padding: '4px',
                '&:hover': {
                    textDecoration: 'underline',
                    color: '#22D3EE',
                }
            }
        }
    }
});

const Divider = styled('div', {
    display: 'flex',
    alignItems: 'center',
    textAlign: 'center',
    color: '#64748B',
    fontSize: '0.78rem',
    fontWeight: '500',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    margin: '0.2rem 0',
    '&::before, &::after': {
        content: '""',
        flex: 1,
        borderBottom: '1px solid #334155',
    },
    '&:not(:empty)::before': { marginRight: '0.75rem' },
    '&:not(:empty)::after': { marginLeft: '0.75rem' },
});

const PasswordToggle = styled('button', {
    position: 'absolute',
    right: '12px',
    background: 'transparent',
    border: 'none',
    color: '#64748B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    '&:hover': {
        color: '#94A3B8',
    }
});

const RequirementList = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    marginTop: '4px',
    fontSize: '0.75rem',
    color: '#64748B',
});

const RequirementItem = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'color 0.2s ease',
    variants: {
        met: {
            true: {
                color: '#10B981',
                fontWeight: '500',
            },
            false: {
                color: '#64748B',
            }
        }
    }
});

export const validatePassword = (password) => {
    if (!password) {
        return 'Password is required.';
    }
    const missing = [];
    if (password.length < 7) {
        missing.push('at least 7 characters');
    }
    if (!/[a-z]/.test(password)) {
        missing.push('at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        missing.push('at least one number');
    }
    if (missing.length > 0) {
        return `Password must contain ${missing.join(', ')}.`;
    }
    return null;
};

export default function AuthPage() {
    const navigate = useNavigate();
    const { loginNative, signupNative, loginWithRedirect } = useAuth();
    const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup' | 'forgot' | 'forgot-sent'
    const isSignup = authMode === 'signup';
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        identifier: '',
        password: ''
    });
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotResult, setForgotResult] = useState(null);
    const [authError, setAuthError] = useState('');
    const [isResolving, setIsResolving] = useState(false);

    const passwordValue = formData.password || '';
    const hasMinLength = passwordValue.length >= 7;
    const hasLowercase = /[a-z]/.test(passwordValue);
    const hasNumber = /[0-9]/.test(passwordValue);

    const handleSocialLogin = (connection) => {
        setAuthError('');
        setIsResolving(true);
        const authorizationParams = { connection };
        if (isSignup) {
            authorizationParams.screen_hint = 'signup';
        }
        loginWithRedirect({ authorizationParams });
    };

    const handleForgotPasswordSubmit = async (e) => {
        e.preventDefault();
        setAuthError('');

        const cleanEmail = forgotEmail.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!cleanEmail || !emailRegex.test(cleanEmail)) {
            setAuthError('Please enter a valid email address.');
            return;
        }

        setIsResolving(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: cleanEmail })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to send reset link.');
            }

            setForgotResult(data);
            setAuthMode('forgot-sent');
        } catch (err) {
            console.error('Forgot password error:', err);
            setAuthError(err.message || 'Failed to send password reset link. Please try again.');
        } finally {
            setIsResolving(false);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setAuthError('');

        const rawIdentifier = formData.identifier.trim();
        if (!rawIdentifier) {
            setAuthError('Please enter your username or email address.');
            return;
        }

        const pwdError = validatePassword(formData.password);
        if (pwdError) {
            setAuthError(pwdError);
            return;
        }

        setIsResolving(true);
        try {
            if (isSignup) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(rawIdentifier)) {
                    setAuthError('Please enter a valid email address to create an account.');
                    setIsResolving(false);
                    return;
                }
                const user = await signupNative(rawIdentifier, formData.password, formData.name);
                if (user?.hasCompletedProfile) {
                    navigate('/dashboard', { replace: true });
                } else {
                    navigate('/setup', { replace: true });
                }
            } else {
                const user = await loginNative(rawIdentifier, formData.password);
                if (user?.hasCompletedProfile || user?.username) {
                    navigate('/dashboard', { replace: true });
                } else {
                    navigate('/setup', { replace: true });
                }
            }
        } catch (err) {
            console.error('Authentication error:', err);
            setAuthError(err.message || 'Authentication failed. Please check your credentials.');
            setIsResolving(false);
        }
    };

    const toggleAuthMode = () => {
        setAuthError('');
        setAuthMode(prev => prev === 'signup' ? 'login' : 'signup');
    };

    const handleChange = (e) => {
        setAuthError('');
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <PageContainer>
            {/* Left Hero & Developer Collab Showcase */}
            <LeftPanel>
                {/* Back to Homepage pill */}
                <button
                    type="button"
                    onClick={() => navigate('/')}
                    style={{
                        position: 'absolute',
                        top: '2.5rem',
                        left: '4.5rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'transparent',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#94A3B8',
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        fontFamily: '"JetBrains Mono", monospace',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#06B6D4';
                        e.currentTarget.style.color = '#F8FAFC';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#334155';
                        e.currentTarget.style.color = '#94A3B8';
                    }}
                >
                    <ArrowLeft size={14} />
                    <span>Return to Home</span>
                </button>

                {/* Brand Logo & Version Tag */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.75rem' }}>
                    <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        backgroundColor: '#1E293B',
                        border: '1.5px solid #06B6D4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: '"JetBrains Mono", monospace',
                        fontWeight: '700',
                        fontSize: '0.95rem',
                        color: '#22D3EE',
                        boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)',
                    }}>
                        &lt;/&gt;
                    </div>
                    <span style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '-0.02em', color: '#F8FAFC' }}>
                        DevSup
                    </span>
                    <span style={{ fontSize: '0.72rem', fontFamily: '"JetBrains Mono", monospace', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#06B6D4', fontWeight: '600' }}>
                        v2.4
                    </span>
                </div>

                {/* Headline with vibrant gradient */}
                <h2 style={{ 
                    fontSize: '3rem', 
                    fontWeight: '900', 
                    lineHeight: '1.15', 
                    letterSpacing: '-0.03em', 
                    margin: '0 0 1rem 0',
                    color: '#F8FAFC' 
                }}>
                    Where code meets <br />
                    <span style={{
                        background: 'linear-gradient(135deg, #06B6D4 0%, #22D3EE 50%, #38BDF8 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        conversation.
                    </span>
                </h2>

                <p style={{ color: '#94A3B8', fontSize: '1.05rem', maxWidth: '480px', lineHeight: '1.6', margin: '0 0 1.5rem 0' }}>
                    Join the dedicated developer communication workspace. High-fidelity syntax messaging, WebRTC encrypted HD audio, and vector whiteboard diagrams in one unified flow.
                </p>

                {/* Interactive IDE Mockup Card */}
                <div style={{
                    backgroundColor: '#090D16',
                    border: '1px solid #334155',
                    borderRadius: '14px',
                    padding: '16px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
                    maxWidth: '460px',
                    position: 'relative'
                }}>
                    {/* IDE Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#EF4444' }} />
                            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10B981' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontFamily: '"JetBrains Mono", monospace', color: '#94A3B8' }}>devsup_mesh.ts</span>
                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(6,182,212,0.15)', color: '#22D3EE', fontFamily: '"JetBrains Mono", monospace', fontWeight: '600' }}>
                            ● active
                        </span>
                    </div>

                    {/* Code Lines */}
                    <div style={{ fontFamily: '"JetBrains Mono", Consolas, monospace', fontSize: '0.82rem', lineHeight: '1.7', color: '#E2E8F0' }}>
                        <div><span style={{ color: '#EC4899', fontWeight: '600' }}>import</span> {'{'} DevSupMesh {'}'} <span style={{ color: '#EC4899', fontWeight: '600' }}>from</span> <span style={{ color: '#10B981' }}>'@devsup/ws'</span>;</div>
                        <div style={{ marginTop: '2px' }}>
                            <span style={{ color: '#22D3EE' }}>const</span> session = <span style={{ color: '#EC4899' }}>await</span> DevSupMesh.<span style={{ color: '#38BDF8' }}>connect</span>({'{'}
                        </div>
                        <div style={{ paddingLeft: '18px', color: '#94A3B8' }}>
                            channel: <span style={{ color: '#10B981' }}>'#frontend-engineers'</span>,
                        </div>
                        <div style={{ paddingLeft: '18px', color: '#94A3B8' }}>
                            audio: <span style={{ color: '#F59E0B' }}>'Opus 48kHz'</span>,
                        </div>
                        <div style={{ paddingLeft: '18px', color: '#94A3B8' }}>
                            whiteboard: <span style={{ color: '#22D3EE' }}>true</span>
                        </div>
                        <div>{'}'});</div>
                    </div>

                    {/* Voice Mesh Live Strip */}
                    <div style={{
                        marginTop: '12px',
                        padding: '8px 12px',
                        backgroundColor: '#1E293B',
                        borderRadius: '8px',
                        border: '1px solid #334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' }} />
                            <span style={{ fontSize: '0.78rem', color: '#F8FAFC', fontWeight: '600' }}>WebRTC Mesh Live</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#06B6D4', fontFamily: '"JetBrains Mono", monospace' }}>
                            18ms latency • P2P
                        </span>
                    </div>
                </div>

                {/* Feature Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '1.75rem', maxWidth: '460px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#CBD5E1', fontSize: '0.75rem', fontFamily: '"JetBrains Mono", monospace' }}>
                        ⚡ Real-Time WebSockets
                    </span>
                    <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#CBD5E1', fontSize: '0.75rem', fontFamily: '"JetBrains Mono", monospace' }}>
                        💻 50+ Languages
                    </span>
                    <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#CBD5E1', fontSize: '0.75rem', fontFamily: '"JetBrains Mono", monospace' }}>
                        🔒 WebRTC HD Calls
                    </span>
                    <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#CBD5E1', fontSize: '0.75rem', fontFamily: '"JetBrains Mono", monospace' }}>
                        🎨 Vector Whiteboard
                    </span>
                </div>
            </LeftPanel>

            {/* Right Authentication Form Panel */}
            <RightPanel>
                <AuthCard>
                    {authMode === 'forgot' ? (
                        <>
                            <div>
                                <Title>Forgot Password</Title>
                                <Subtitle>Enter your registered email address and we'll send you a secure password reset link.</Subtitle>
                            </div>

                            {authError && (
                                <div style={{ 
                                    padding: '10px 14px', 
                                    borderRadius: '8px', 
                                    backgroundColor: 'rgba(239, 68, 68, 0.12)', 
                                    border: '1px solid rgba(239, 68, 68, 0.3)', 
                                    color: '#EF4444', 
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                                    <span>{authError}</span>
                                </div>
                            )}

                            <Form onSubmit={handleForgotPasswordSubmit}>
                                <InputGroup>
                                    <Label>Email Address</Label>
                                    <InputWrapper>
                                        <InputIcon><Mail size={16} /></InputIcon>
                                        <Input 
                                            type="email" 
                                            name="forgotEmail" 
                                            placeholder="developer@example.com" 
                                            required 
                                            value={forgotEmail}
                                            onChange={(e) => { setAuthError(''); setForgotEmail(e.target.value); }}
                                            autoCapitalize="none"
                                            autoCorrect="off"
                                        />
                                    </InputWrapper>
                                </InputGroup>

                                <AuthButton type="submit" variant="primary" style={{ marginTop: '6px' }} disabled={isResolving}>
                                    Send Reset Link
                                </AuthButton>
                            </Form>

                            <div style={{ textAlign: 'center', marginTop: '6px' }}>
                                <AuthButton 
                                    type="button" 
                                    variant="ghost" 
                                    onClick={() => { setAuthError(''); setAuthMode('login'); }}
                                    style={{ display: 'inline', width: 'auto', padding: 0 }}
                                >
                                    Back to Log In
                                </AuthButton>
                            </div>
                        </>
                    ) : authMode === 'forgot-sent' ? (
                        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
                            <div style={{ display: 'inline-flex', padding: '14px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981', margin: '0 auto' }}>
                                <CheckCircle2 size={38} />
                            </div>
                            <div>
                                <Title style={{ fontSize: '1.5rem' }}>Check Your Email</Title>
                                <Subtitle style={{ marginTop: '4px' }}>
                                    {forgotResult?.message || 'If an account exists with this email, a password reset link has been sent.'}
                                </Subtitle>
                            </div>

                            {forgotResult?.resetUrl && (
                                <a 
                                    href={forgotResult.resetUrl}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '12px 18px',
                                        borderRadius: '8px',
                                        backgroundColor: '#06B6D4',
                                        color: '#0B0F19',
                                        textDecoration: 'none',
                                        fontWeight: '700',
                                        fontFamily: '"JetBrains Mono", monospace',
                                        fontSize: '0.9rem',
                                        marginTop: '4px'
                                    }}
                                >
                                    Reset Password Now
                                </a>
                            )}

                            <AuthButton 
                                type="button" 
                                variant="outline" 
                                onClick={() => { setAuthError(''); setForgotResult(null); setAuthMode('login'); }}
                                style={{ marginTop: '6px' }}
                            >
                                Back to Log In
                            </AuthButton>
                        </div>
                    ) : (
                        <>
                            {/* Seamless Tab Switcher (Log In vs Sign Up) */}
                            <TabSwitch>
                                <TabButton 
                                    type="button" 
                                    active={!isSignup} 
                                    onClick={() => { if (isSignup) toggleAuthMode(); }}
                                >
                                    Log In
                                </TabButton>
                                <TabButton 
                                    type="button" 
                                    active={isSignup} 
                                    onClick={() => { if (!isSignup) toggleAuthMode(); }}
                                >
                                    Create Account
                                </TabButton>
                            </TabSwitch>

                            <div>
                                <Title>{isSignup ? 'Create Account' : 'Welcome Back'}</Title>
                                <Subtitle>{isSignup ? 'Set up your developer profile to start collaborating.' : 'Enter your credentials to access your workspaces.'}</Subtitle>
                            </div>

                            {authError && (
                                <div style={{ 
                                    padding: '10px 14px', 
                                    borderRadius: '8px', 
                                    backgroundColor: 'rgba(239, 68, 68, 0.12)', 
                                    border: '1px solid rgba(239, 68, 68, 0.3)', 
                                    color: '#EF4444', 
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                                    <span>{authError}</span>
                                </div>
                            )}

                            <Form onSubmit={handleFormSubmit}>
                                {isSignup && (
                                    <InputGroup>
                                        <Label>Full Name</Label>
                                        <InputWrapper>
                                            <InputIcon><User size={16} /></InputIcon>
                                            <Input 
                                                type="text" 
                                                name="name" 
                                                placeholder="John Doe" 
                                                required 
                                                value={formData.name}
                                                onChange={handleChange}
                                            />
                                        </InputWrapper>
                                    </InputGroup>
                                )}

                                <InputGroup>
                                    <Label>{isSignup ? 'Email Address' : 'Username or Email'}</Label>
                                    <InputWrapper>
                                        <InputIcon>
                                            {isSignup || (formData.identifier.includes('@') && formData.identifier.includes('.')) 
                                                ? <Mail size={16} /> 
                                                : <User size={16} />}
                                        </InputIcon>
                                        <Input 
                                            type="text" 
                                            name="identifier" 
                                            placeholder={isSignup ? "developer@example.com" : "e.g. blossom123 or dev@example.com"} 
                                            required 
                                            value={formData.identifier}
                                            onChange={handleChange}
                                            autoCapitalize="none"
                                            autoCorrect="off"
                                        />
                                    </InputWrapper>
                                </InputGroup>

                                <InputGroup>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Label>Password</Label>
                                        {!isSignup && (
                                            <button
                                                type="button"
                                                onClick={() => { setAuthError(''); setAuthMode('forgot'); }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#06B6D4',
                                                    fontSize: '0.78rem',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    padding: 0
                                                }}
                                            >
                                                Forgot password?
                                            </button>
                                        )}
                                    </div>
                                    <InputWrapper>
                                        <InputIcon><Lock size={16} /></InputIcon>
                                        <Input 
                                            type={showPassword ? "text" : "password"} 
                                            name="password" 
                                            placeholder="••••••••" 
                                            required 
                                            minLength={7}
                                            value={formData.password}
                                            onChange={handleChange}
                                            style={{ paddingRight: '38px' }}
                                        />
                                        <PasswordToggle 
                                            type="button" 
                                            onClick={() => setShowPassword(prev => !prev)}
                                            title={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </PasswordToggle>
                                    </InputWrapper>

                                    {/* Password Requirements Checklist */}
                                    <RequirementList>
                                        <RequirementItem met={hasMinLength}>
                                            {hasMinLength ? <Check size={12} strokeWidth={3} /> : <span style={{ width: 12, textAlign: 'center', lineHeight: 1 }}>•</span>}
                                            <span>At least 7 characters</span>
                                        </RequirementItem>
                                        <RequirementItem met={hasLowercase}>
                                            {hasLowercase ? <Check size={12} strokeWidth={3} /> : <span style={{ width: 12, textAlign: 'center', lineHeight: 1 }}>•</span>}
                                            <span>At least one lowercase letter</span>
                                        </RequirementItem>
                                        <RequirementItem met={hasNumber}>
                                            {hasNumber ? <Check size={12} strokeWidth={3} /> : <span style={{ width: 12, textAlign: 'center', lineHeight: 1 }}>•</span>}
                                            <span>At least one number</span>
                                        </RequirementItem>
                                    </RequirementList>
                                </InputGroup>

                                <AuthButton type="submit" variant="primary" style={{ marginTop: '6px' }} disabled={isResolving}>
                                    <span>{isSignup ? 'Create Account' : 'Log In'}</span>
                                    <ArrowRight size={15} />
                                </AuthButton>
                            </Form>

                            <Divider>or continue with</Divider>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <AuthButton 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => handleSocialLogin('github')} 
                                    style={{ padding: '10px 14px', flex: 1, justifyContent: 'center', fontSize: '0.85rem' }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                                    </svg>
                                    <span>GitHub</span>
                                </AuthButton>
                                <AuthButton 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => handleSocialLogin('google-oauth2')} 
                                    style={{ padding: '10px 14px', flex: 1, justifyContent: 'center', fontSize: '0.85rem' }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                    <span>Google</span>
                                </AuthButton>
                            </div>

                            <div style={{ textAlign: 'center', marginTop: '4px' }}>
                                <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
                                    {isSignup ? 'Already have an account? ' : "Don't have an account? "}
                                </span>
                                <AuthButton 
                                    type="button" 
                                    variant="ghost" 
                                    onClick={toggleAuthMode}
                                    style={{ display: 'inline', width: 'auto', padding: 0, fontWeight: '700', fontSize: '0.85rem' }}
                                >
                                    {isSignup ? 'Log in' : 'Sign up'}
                                </AuthButton>
                            </div>
                        </>
                    )}
                </AuthCard>
            </RightPanel>

            {isResolving && <DevSupPumpLoader overlay size={36} />}
        </PageContainer>
    );
}
