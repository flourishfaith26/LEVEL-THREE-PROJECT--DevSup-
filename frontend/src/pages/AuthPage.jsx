import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { styled, keyframes } from '../stitches.config.js';
import { Terminal, Code, Mail, Lock, User, AlertCircle, Eye, EyeOff, Check } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const float = keyframes({
    '0%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-10px)' },
    '100%': { transform: 'translateY(0px)' },
});

const PageContainer = styled('div', {
    minHeight: '100vh',
    '@supports (min-height: 100dvh)': {
        minHeight: '100dvh',
    },
    display: 'flex',
    backgroundColor: '$bg',
    color: '$textMain',
    fontFamily: 'system-ui, sans-serif',
    overflowX: 'hidden',
});

const LeftPanel = styled('div', {
    flex: 1,
    display: 'none',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '4rem',
    position: 'relative',
    background: 'linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(15,23,42,1) 100%)',
    '@media (min-width: 900px)': {
        display: 'flex',
    }
});

const RightPanel = styled('div', {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem',
    backgroundColor: '$surface',
    position: 'relative',
    zIndex: 1,
    boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
    overflowY: 'auto',
    '@media (max-width: 768px)': {
        padding: '16px env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
        width: '100%',
    }
});

const LogoContainer = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '2rem',
    color: '$accent',
    animation: `${float} 6s ease-in-out infinite`,
});

const AuthBox = styled('div', {
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
});

const Title = styled('h1', {
    fontSize: '2rem',
    fontWeight: '700',
    letterSpacing: '-0.5px',
    margin: '0 0 0.5rem 0',
    color: '$textMain',
});

const Subtitle = styled('p', {
    color: '$textMuted',
    margin: 0,
    fontSize: '1rem',
});

const Form = styled('form', {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
});

const InputGroup = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
});

const Label = styled('label', {
    fontSize: '0.9rem',
    color: '$textMuted',
    fontWeight: '500',
});

const InputWrapper = styled('div', {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
});

const InputIcon = styled('div', {
    position: 'absolute',
    left: '12px',
    color: '$textMuted',
    display: 'flex',
});

const Input = styled('input', {
    width: '100%',
    padding: '12px 12px 12px 40px',
    backgroundColor: '$bg',
    border: '1px solid $border',
    borderRadius: '8px',
    color: '$textMain',
    fontSize: '1rem',
    transition: 'all 0.2s',
    '&:focus': {
        outline: 'none',
        borderColor: '$accent',
        boxShadow: '0 0 0 2px rgba(6, 182, 212, 0.2)',
    }
});

const AuthButton = styled('button', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    width: '100%',
    padding: '14px',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    variants: {
        variant: {
            primary: {
                backgroundColor: '$accent',
                color: '#fff',
                '&:hover': {
                    backgroundColor: '$accentHover',
                    transform: 'translateY(-2px)',
                }
            },
            outline: {
                backgroundColor: 'transparent',
                border: '1px solid $border',
                color: '$textMain',
                '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.05)',
                }
            },
            ghost: {
                backgroundColor: 'transparent',
                color: '$accent',
                padding: '8px',
                '&:hover': {
                    textDecoration: 'underline',
                }
            }
        }
    }
});

const Divider = styled('div', {
    display: 'flex',
    alignItems: 'center',
    textAlign: 'center',
    color: '$textMuted',
    fontSize: '0.9rem',
    '&::before, &::after': {
        content: '""',
        flex: 1,
        borderBottom: '1px solid $border',
    },
    '&:not(:empty)::before': { marginRight: '1rem' },
    '&:not(:empty)::after': { marginLeft: '1rem' },
});

const PasswordToggle = styled('button', {
    position: 'absolute',
    right: '12px',
    background: 'transparent',
    border: 'none',
    color: '$textMuted',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    '&:hover': {
        color: '$textMain',
    }
});

const RequirementList = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '6px',
    fontSize: '0.78rem',
    color: '$textMuted',
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
            },
            false: {
                color: '$textMuted',
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
    const [isSignup, setIsSignup] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        identifier: '',
        password: ''
    });
    const [authError, setAuthError] = useState('');
    const [isResolving, setIsResolving] = useState(false);

    const passwordValue = formData.password || '';
    const hasMinLength = passwordValue.length >= 7;
    const hasLowercase = /[a-z]/.test(passwordValue);
    const hasNumber = /[0-9]/.test(passwordValue);

    const handleSocialLogin = (connection) => {
        setAuthError('');
        const authorizationParams = { connection };
        if (isSignup) {
            authorizationParams.screen_hint = 'signup';
        }
        loginWithRedirect({ authorizationParams });
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
                // Native direct signup
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
                // Native direct login (accepts email or @username)
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
        } finally {
            setIsResolving(false);
        }
    };

    const toggleAuthMode = () => {
        setAuthError('');
        setIsSignup(prev => !prev);
    };

    const handleChange = (e) => {
        setAuthError('');
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <PageContainer>
            <LeftPanel>
                <LogoContainer>
                    <img src="/favicon.svg" alt="DevSup Logo" style={{ width: '48px', height: '48px' }} />
                    <span style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>DevSup</span>
                </LogoContainer>
                <h2 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '1rem', background: 'linear-gradient(to right, #fff, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Where Code<br/>Meets Conversation.
                </h2>
                <p style={{ color: 'var(--colors-textMuted)', fontSize: '1.2rem', maxWidth: '80%', lineHeight: '1.6' }}>
                    Join the ultimate workspace for developers. Collaborate in real-time, share code snippets seamlessly, and whiteboard your next big architecture.
                </p>
                <div style={{ position: 'absolute', bottom: '2rem', left: '4rem', opacity: 0.1 }}>
                    <Code size={200} />
                </div>
            </LeftPanel>

            <RightPanel>
                <AuthBox>
                    <div>
                        <Title>{isSignup ? 'Create Account' : 'Welcome Back'}</Title>
                        <Subtitle>{isSignup ? 'Join DevSup to start collaborating.' : 'Log in to DevSup with your username or email and password.'}</Subtitle>
                    </div>

                    {authError && (
                        <div style={{ 
                            padding: '12px 16px', 
                            borderRadius: '8px', 
                            backgroundColor: 'rgba(239, 68, 68, 0.12)', 
                            border: '1px solid rgba(239, 68, 68, 0.3)', 
                            color: '#ef4444', 
                            fontSize: '0.88rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <AlertCircle size={18} style={{ flexShrink: 0 }} />
                            <span>{authError}</span>
                        </div>
                    )}

                    <Form onSubmit={handleFormSubmit}>
                        {isSignup && (
                            <InputGroup>
                                <Label>Full Name</Label>
                                <InputWrapper>
                                    <InputIcon><User size={18} /></InputIcon>
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
                                        ? <Mail size={18} /> 
                                        : <User size={18} />}
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
                            <Label>Password</Label>
                            <InputWrapper>
                                <InputIcon><Lock size={18} /></InputIcon>
                                <Input 
                                    type={showPassword ? "text" : "password"} 
                                    name="password" 
                                    placeholder="••••••••" 
                                    required 
                                    minLength={7}
                                    value={formData.password}
                                    onChange={handleChange}
                                    style={{ paddingRight: '40px' }}
                                />
                                <PasswordToggle 
                                    type="button" 
                                    onClick={() => setShowPassword(prev => !prev)}
                                    title={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </PasswordToggle>
                            </InputWrapper>
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

                        <AuthButton type="submit" variant="primary" style={{ marginTop: '8px' }} disabled={isResolving}>
                            {isResolving ? 'Connecting...' : (isSignup ? 'Sign Up' : 'Log In')}
                        </AuthButton>
                    </Form>

                    <Divider>or continue with</Divider>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <AuthButton 
                            type="button" 
                            variant="outline" 
                            onClick={() => handleSocialLogin('github')} 
                            style={{ padding: '12px', flex: 1, justifyContent: 'center' }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                            </svg>
                            <span>GitHub</span>
                        </AuthButton>
                        <AuthButton 
                            type="button" 
                            variant="outline" 
                            onClick={() => handleSocialLogin('google-oauth2')} 
                            style={{ padding: '12px', flex: 1, justifyContent: 'center' }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            <span>Google</span>
                        </AuthButton>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '8px' }}>
                        <span style={{ color: 'var(--colors-textMuted)', fontSize: '0.9rem' }}>
                            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
                        </span>
                        <AuthButton 
                            type="button" 
                            variant="ghost" 
                            onClick={toggleAuthMode}
                            style={{ display: 'inline', width: 'auto', padding: 0 }}
                        >
                            {isSignup ? 'Log in' : 'Sign up'}
                        </AuthButton>
                    </div>
                </AuthBox>
            </RightPanel>
        </PageContainer>
    );
}
