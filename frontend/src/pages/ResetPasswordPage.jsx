import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { styled, keyframes } from '../stitches.config.js';
import { Lock, AlertCircle, CheckCircle2, Eye, EyeOff, Check, ArrowLeft } from 'lucide-react';
import DevSupLogo from '../components/DevSupLogo.jsx';
import DevSupPumpLoader from '../components/DevSupPumpLoader.jsx';
import { validatePassword } from './AuthPage.jsx';

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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '$bg',
    color: '$textMain',
    fontFamily: 'system-ui, sans-serif',
    padding: '20px',
});

const Card = styled('div', {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '$surface',
    borderRadius: '16px',
    padding: '32px 28px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
});

const LogoContainer = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '$accent',
    animation: `${float} 6s ease-in-out infinite`,
});

const Title = styled('h1', {
    fontSize: '1.75rem',
    fontWeight: '700',
    letterSpacing: '-0.5px',
    margin: '0 0 0.5rem 0',
    color: '$textMain',
});

const Subtitle = styled('p', {
    color: '$textMuted',
    margin: 0,
    fontSize: '0.95rem',
    lineHeight: '1.5',
});

const Form = styled('form', {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
    padding: '12px 40px 12px 40px',
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

const SubmitButton = styled('button', {
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
    backgroundColor: '$accent',
    color: '#fff',
    '&:hover': {
        backgroundColor: '$accentHover',
        transform: 'translateY(-1px)',
    },
    '&:disabled': {
        opacity: 0.6,
        cursor: 'not-allowed',
        transform: 'none',
    }
});

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const hasMinLength = password.length >= 7;
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!token) {
        return (
            <PageContainer>
                <Card style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', margin: '0 auto' }}>
                        <AlertCircle size={36} />
                    </div>
                    <Title>Invalid Reset Link</Title>
                    <Subtitle>This password reset link is missing a valid security token or has expired.</Subtitle>
                    <SubmitButton type="button" onClick={() => navigate('/login')}>
                        Return to Login
                    </SubmitButton>
                </Card>
            </PageContainer>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const pwdError = validatePassword(password);
        if (pwdError) {
            setError(pwdError);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to reset password. The link may have expired.');
            }

            setSuccessMessage(data.message || 'Password successfully updated! You can now log in.');
        } catch (err) {
            setError(err.message || 'An error occurred while resetting your password.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PageContainer>
            <Card>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <LogoContainer>
                        <DevSupLogo size={36} />
                        <span style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>DevSup</span>
                    </LogoContainer>
                    <button 
                        type="button" 
                        onClick={() => navigate('/login')}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--colors-accent)', fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}
                    >
                        <ArrowLeft size={16} />
                        <span>Login</span>
                    </button>
                </div>

                <div>
                    <Title>Set New Password</Title>
                    <Subtitle>Create a new strong password for your DevSup account.</Subtitle>
                </div>

                {error && (
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
                        <span>{error}</span>
                    </div>
                )}

                {successMessage ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', padding: '10px 0' }}>
                        <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', margin: '0 auto' }}>
                            <CheckCircle2 size={40} />
                        </div>
                        <p style={{ color: '#e2e8f0', fontSize: '1rem', margin: 0 }}>
                            {successMessage}
                        </p>
                        <SubmitButton type="button" onClick={() => navigate('/login')}>
                            Continue to Login
                        </SubmitButton>
                    </div>
                ) : (
                    <Form onSubmit={handleSubmit}>
                        <InputGroup>
                            <Label>New Password</Label>
                            <InputWrapper>
                                <InputIcon><Lock size={18} /></InputIcon>
                                <Input 
                                    type={showPassword ? "text" : "password"} 
                                    name="password" 
                                    placeholder="••••••••" 
                                    required 
                                    minLength={7}
                                    value={password}
                                    onChange={(e) => { setError(''); setPassword(e.target.value); }}
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

                        <InputGroup>
                            <Label>Confirm Password</Label>
                            <InputWrapper>
                                <InputIcon><Lock size={18} /></InputIcon>
                                <Input 
                                    type={showConfirm ? "text" : "password"} 
                                    name="confirmPassword" 
                                    placeholder="••••••••" 
                                    required 
                                    minLength={7}
                                    value={confirmPassword}
                                    onChange={(e) => { setError(''); setConfirmPassword(e.target.value); }}
                                    style={{ paddingRight: '40px' }}
                                />
                                <PasswordToggle 
                                    type="button" 
                                    onClick={() => setShowConfirm(prev => !prev)}
                                    title={showConfirm ? "Hide password" : "Show password"}
                                >
                                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </PasswordToggle>
                            </InputWrapper>
                        </InputGroup>

                        <SubmitButton type="submit" disabled={isSubmitting} style={{ marginTop: '10px' }}>
                            {isSubmitting ? 'Updating Password...' : 'Reset Password'}
                        </SubmitButton>
                    </Form>
                )}
            </Card>

            {isSubmitting && <DevSupPumpLoader overlay size={36} />}
        </PageContainer>
    );
}
