import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { 
    Users, Hash, CheckCircle2, ArrowRight, Shield, 
    Sparkles, LogIn, GitBranch, Terminal, AlertCircle 
} from 'lucide-react';
import DevSupLogo from '../components/DevSupLogo.jsx';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function JoinInvitePage() {
    const { inviteCode } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, getAccessTokenSilently, loginWithRedirect, user } = useAuth();

    const [communityData, setCommunityData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState(null);

    // Fetch community metadata
    useEffect(() => {
        let isMounted = true;
        async function fetchInvite() {
            try {
                const res = await fetch(`${BACKEND_URL}/api/conversations/invite/${inviteCode}`);
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.message || 'Invalid or expired invite link.');
                }
                const data = await res.json();
                if (isMounted) setCommunityData(data);
            } catch (err) {
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        if (inviteCode) {
            fetchInvite();
        }
        return () => { isMounted = false; };
    }, [inviteCode]);

    // Handle Join
    const handleJoin = async () => {
        if (!isAuthenticated) {
            // Save return target in sessionStorage and redirect to login
            sessionStorage.setItem('devsup_post_login_redirect', `/join/${inviteCode}`);
            loginWithRedirect({
                appState: { targetUrl: `/join/${inviteCode}` }
            });
            return;
        }

        setJoining(true);
        try {
            const token = await getAccessTokenSilently();
            const res = await fetch(`${BACKEND_URL}/api/conversations/join/${inviteCode}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Failed to join community.');
            }

            const data = await res.json();
            const convId = data.conversation?._id;
            // Redirect to dashboard with active conversation
            navigate('/dashboard', { state: { targetConversationId: convId } });
        } catch (err) {
            setError(err.message);
            setJoining(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#070B14',
            color: '#F8FAFC',
            padding: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Glows */}
            <div style={{
                position: 'absolute',
                top: '20%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, rgba(0, 0, 0, 0) 70%)',
                pointerEvents: 'none'
            }} />

            {/* Top Logo */}
            <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <DevSupLogo size={36} />
                <span style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
                    DevSup
                </span>
            </div>

            {/* Invite Card */}
            <div style={{
                width: '100%',
                maxWidth: '480px',
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '20px',
                padding: '36px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(6, 182, 212, 0.1)',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1
            }}>
                {loading ? (
                    <div style={{ padding: '40px 0', color: '#94A3B8' }}>
                        <Terminal size={36} style={{ margin: '0 auto 16px', opacity: 0.6 }} />
                        <div style={{ fontSize: '0.95rem' }}>Resolving invite link...</div>
                    </div>
                ) : error ? (
                    <div style={{ padding: '20px 0' }}>
                        <AlertCircle size={44} color="#EF4444" style={{ margin: '0 auto 16px' }} />
                        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px', color: '#FFF' }}>
                            Invite Link Expired or Invalid
                        </h2>
                        <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '24px' }}>
                            {error}
                        </p>
                        <Link 
                            to="/"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 20px',
                                borderRadius: '10px',
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                color: '#FFF',
                                textDecoration: 'none',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                            }}
                        >
                            Return to DevSup Home
                        </Link>
                    </div>
                ) : (
                    <div>
                        {/* Channel Badge / Avatar */}
                        <div style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: '20px',
                            margin: '0 auto 20px',
                            backgroundColor: 'rgba(6, 182, 212, 0.15)',
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#06B6D4',
                            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)'
                        }}>
                            {communityData.type === 'group' ? <Hash size={36} /> : <Users size={36} />}
                        </div>

                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(6, 182, 212, 0.1)',
                            border: '1px solid rgba(6, 182, 212, 0.2)',
                            color: '#06B6D4',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            marginBottom: '12px'
                        }}>
                            <Sparkles size={12} />
                            <span>YOU HAVE BEEN INVITED TO JOIN</span>
                        </div>

                        <h1 style={{
                            fontSize: '1.6rem',
                            fontWeight: '800',
                            color: '#FFFFFF',
                            letterSpacing: '-0.5px',
                            margin: '0 0 8px'
                        }}>
                            {communityData.name}
                        </h1>

                        <p style={{
                            color: '#94A3B8',
                            fontSize: '0.92rem',
                            lineHeight: '1.5',
                            margin: '0 0 20px'
                        }}>
                            {communityData.description || 'A collaborative developer community on DevSup.'}
                        </p>

                        {/* Metadata stats */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '20px',
                            padding: '12px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            marginBottom: '28px',
                            fontSize: '0.85rem',
                            color: '#CBD5E1'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Users size={16} color="#06B6D4" />
                                <span><b>{communityData.memberCount || 1}</b> Members</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' }} />
                                <span>Active Community</span>
                            </div>
                        </div>

                        {/* Join Button */}
                        <button
                            type="button"
                            onClick={handleJoin}
                            disabled={joining}
                            style={{
                                width: '100%',
                                padding: '14px 24px',
                                borderRadius: '12px',
                                backgroundColor: '#06B6D4',
                                color: '#000000',
                                border: 'none',
                                fontSize: '1rem',
                                fontWeight: '700',
                                cursor: joining ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 10px 20px -5px rgba(6, 182, 212, 0.4)',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <span>{joining ? 'Joining Channel...' : (isAuthenticated ? 'Accept Invite & Open Chat' : 'Sign in to Join Community')}</span>
                            <ArrowRight size={18} />
                        </button>

                        {!isAuthenticated && (
                            <div style={{ marginTop: '14px', fontSize: '0.78rem', color: '#64748B' }}>
                                Free, end-to-end encrypted developer collaboration platform.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
