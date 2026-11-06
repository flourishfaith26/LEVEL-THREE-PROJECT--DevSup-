import React, { useState } from 'react';
import { styled, keyframes } from '../stitches.config.js';
import { Trophy, Users, Calendar, Code, ChevronRight, Award, Timer, Rocket, Globe, Plus, Check, ThumbsUp, X, Sparkles, AlertCircle } from 'lucide-react';

const GithubIcon = ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
);

const fadeIn = keyframes({
    '0%': { opacity: 0, transform: 'translateY(10px)' },
    '100%': { opacity: 1, transform: 'translateY(0)' }
});

const Container = styled('div', {
    flex: 1,
    padding: '32px 48px',
    backgroundColor: 'var(--colors-bg)',
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    position: 'relative',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0, left: 0, right: 0, height: '400px',
        background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.05) 0%, rgba(15, 23, 42, 0) 100%)',
        pointerEvents: 'none'
    },
    '@media (max-width: 768px)': {
        padding: '16px',
    }
});

const Header = styled('div', {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    animation: `${fadeIn} 0.5s ease-out`
});

const Title = styled('h1', {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: 'var(--colors-textMain)',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
});

const Subtitle = styled('p', {
    color: 'var(--colors-textMuted)',
    fontSize: '1.1rem'
});

const Grid = styled('div', {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '24px',
    animation: `${fadeIn} 0.6s ease-out 0.1s both`,
    '@media (max-width: 768px)': {
        gridTemplateColumns: '1fr',
    }
});

const Card = styled('div', {
    backgroundColor: 'var(--colors-surface)',
    borderRadius: '20px',
    padding: '24px',
    border: '1px solid var(--colors-border)',
    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0, left: 0, right: 0, height: '4px',
        background: 'linear-gradient(90deg, var(--colors-accent), #3B82F6)',
        opacity: 0,
        transition: 'opacity 0.3s'
    },
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.4)',
        borderColor: 'rgba(6, 182, 212, 0.3)',
        '&::before': {
            opacity: 1
        }
    }
});

const Badge = styled('span', {
    padding: '4px 10px',
    borderRadius: 'full',
    fontSize: '0.75rem',
    fontWeight: '600',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    variants: {
        status: {
            active: { background: 'rgba(16, 185, 129, 0.1)', color: '#34D399' },
            upcoming: { background: 'rgba(59, 130, 246, 0.1)', color: '#60A5FA' },
            ended: { background: 'rgba(148, 163, 184, 0.1)', color: '#94A3B8' }
        }
    }
});

const CardHeader = styled('div', {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
});

const EventTitle = styled('h3', {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'var(--colors-textMain)',
    lineHeight: 1.4,
    marginBottom: '8px'
});

const EventDesc = styled('p', {
    color: 'var(--colors-textMuted)',
    fontSize: '0.9rem',
    lineHeight: 1.5,
    flex: 1
});

const MetaRow = styled('div', {
    display: 'flex',
    gap: '16px',
    marginTop: 'auto',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255,255,255,0.05)'
});

const MetaItem = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--colors-textMuted)',
    fontSize: '0.85rem',
    fontWeight: '500'
});

const Button = styled('button', {
    background: 'linear-gradient(135deg, var(--colors-accent) 0%, #3B82F6 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    '&:hover': {
        transform: 'scale(1.02)',
        boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)'
    }
});

const ModalOverlay = styled('div', {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
});

const ModalBox = styled('div', {
    backgroundColor: 'var(--colors-surface, #1e293b)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '680px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
    overflow: 'hidden',
    color: '#fff'
});

const INITIAL_HACKATHONS = [
    { 
        id: 1, 
        title: 'Global AI Hackathon 2026', 
        desc: 'Build the next generation of AI-powered applications. Top prize $50,000.', 
        status: 'active', 
        participants: 1240, 
        daysLeft: 2, 
        prize: '$50k',
        prompt: 'Develop an agentic developer tool, code generation pipeline, or real-time collaborative workspace leveraging LLM models.',
        leaderboard: [
            { id: 101, team: 'NeuralCoders', title: 'CodeMorph AI', github: 'https://github.com/neuralcoders/morph', votes: 142 },
            { id: 102, team: 'DevSup Pioneers', title: 'AgentPair', github: 'https://github.com/devsup/agent-pair', votes: 119 },
            { id: 103, team: 'StackBreakers', title: 'AutoRefactor', github: 'https://github.com/stackbreak/autorefactor', votes: 87 }
        ]
    },
    { 
        id: 2, 
        title: 'Web3 Innovators Sprint', 
        desc: 'Create decentralized apps that solve real-world problems using smart contracts.', 
        status: 'upcoming', 
        participants: 850, 
        daysLeft: 14, 
        prize: '$25k',
        prompt: 'Build decentralized messaging, zero-knowledge identity, or permissionless developer protocols.',
        leaderboard: []
    },
    { 
        id: 3, 
        title: 'GreenTech Challenge', 
        desc: 'Develop software solutions for climate change, carbon accounting, and sustainability.', 
        status: 'upcoming', 
        participants: 420, 
        daysLeft: 30, 
        prize: '$10k',
        prompt: 'Create telemetry trackers, energy reduction optimizers, or renewable microgrid monitors.',
        leaderboard: []
    },
    { 
        id: 4, 
        title: 'Fintech Disruption', 
        desc: 'Reinvent payments, banking, and financial services.', 
        status: 'ended', 
        participants: 2100, 
        daysLeft: 0, 
        prize: '$100k',
        prompt: 'Real-time payment settlements, fraud detection, and multi-currency rails.',
        leaderboard: [
            { id: 104, team: 'SovereignPay', title: 'InstantRail', github: 'https://github.com/sovereign/rail', votes: 310 }
        ]
    },
];

const INITIAL_COMPETITIONS = [
    { id: 1, title: 'Weekly Algorithms Arena', desc: 'Test your competitive programming skills against top developers globally.', status: 'active', participants: 5400, daysLeft: 1, prize: 'Rank' },
    { id: 2, title: 'Frontend UI Challenge', desc: 'Design and implement a pixel-perfect dashboard with complex animations.', status: 'upcoming', participants: 1200, daysLeft: 5, prize: 'Gear' },
    { id: 3, title: 'System Design Interview Prep', desc: 'Mock architecture design contest simulating FAANG interviews.', status: 'active', participants: 320, daysLeft: 3, prize: 'Premium' },
];

export default function EventsView({ type }) {
    const isHackathon = type === 'hackathons';
    const [hackathons, setHackathons] = useState(INITIAL_HACKATHONS);
    const [competitions, setCompetitions] = useState(INITIAL_COMPETITIONS);
    const data = isHackathon ? hackathons : competitions;
    const Icon = isHackathon ? Code : Trophy;
    const titleText = isHackathon ? 'Hackathons' : 'Competitions';

    // Interactive Hackathon Arena Modal State
    const [selectedHackathon, setSelectedHackathon] = useState(null);
    const [arenaTab, setArenaTab] = useState('submit'); // 'submit' | 'leaderboard'
    const [projectName, setProjectName] = useState('');
    const [githubUrl, setGithubUrl] = useState('');
    const [demoUrl, setDemoUrl] = useState('');
    const [techStack, setTechStack] = useState('');
    const [projectDesc, setProjectDesc] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);

    // Host Event Modal State
    const [isHostModalOpen, setIsHostModalOpen] = useState(false);
    const [hostTitle, setHostTitle] = useState('');
    const [hostDesc, setHostDesc] = useState('');
    const [hostPrize, setHostPrize] = useState('$10k');
    const [hostDays, setHostDays] = useState('7');

    const handleSelectCard = (item) => {
        if (isHackathon) {
            setSelectedHackathon(item);
            setArenaTab('submit');
            setHasSubmitted(false);
            setProjectName('');
            setGithubUrl('');
            setDemoUrl('');
            setTechStack('');
            setProjectDesc('');
        }
    };

    const handleSubmitProject = (e) => {
        e.preventDefault();
        if (!projectName.trim() || !githubUrl.trim()) return;

        const newEntry = {
            id: Date.now(),
            team: 'DevSup Team',
            title: projectName.trim(),
            github: githubUrl.trim(),
            demo: demoUrl.trim(),
            votes: 1
        };

        setHackathons(prev => prev.map(h => {
            if (h.id === selectedHackathon.id) {
                return {
                    ...h,
                    participants: h.participants + 1,
                    leaderboard: [newEntry, ...(h.leaderboard || [])]
                };
            }
            return h;
        }));

        setSelectedHackathon(prev => ({
            ...prev,
            participants: prev.participants + 1,
            leaderboard: [newEntry, ...(prev.leaderboard || [])]
        }));

        setHasSubmitted(true);
        setArenaTab('leaderboard');
    };

    const handleUpvote = (submissionId) => {
        setSelectedHackathon(prev => ({
            ...prev,
            leaderboard: (prev.leaderboard || []).map(sub => {
                if (sub.id === submissionId) {
                    return { ...sub, votes: (sub.votes || 0) + 1 };
                }
                return sub;
            })
        }));
    };

    const handleHostEvent = (e) => {
        e.preventDefault();
        if (!hostTitle.trim() || !hostDesc.trim()) return;

        const newEvent = {
            id: Date.now(),
            title: hostTitle.trim(),
            desc: hostDesc.trim(),
            status: 'active',
            participants: 1,
            daysLeft: parseInt(hostDays) || 7,
            prize: hostPrize || '$10k',
            prompt: hostDesc.trim(),
            leaderboard: []
        };

        if (isHackathon) {
            setHackathons(prev => [newEvent, ...prev]);
        } else {
            setCompetitions(prev => [newEvent, ...prev]);
        }

        setIsHostModalOpen(false);
        setHostTitle('');
        setHostDesc('');
    };

    return (
        <Container>
            <Header>
                <div>
                    <Title>
                        <div style={{ padding: '12px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '16px', display: 'flex' }}>
                            <Icon size={28} color="var(--colors-accent)" />
                        </div>
                        {titleText}
                    </Title>
                    <Subtitle>
                        {isHackathon 
                            ? 'Collaborate, build, and win prizes in global coding events.' 
                            : 'Sharpen your skills and climb the leaderboards.'}
                    </Subtitle>
                </div>
                <Button onClick={() => setIsHostModalOpen(true)}>
                    Host {isHackathon ? 'Hackathon' : 'Competition'}
                    <ChevronRight size={18} />
                </Button>
            </Header>

            <Grid>
                {data.map(item => (
                    <Card key={item.id} onClick={() => handleSelectCard(item)}>
                        <CardHeader>
                            <Badge status={item.status}>
                                {item.status === 'active' ? 'Live Now' : item.status === 'upcoming' ? 'Upcoming' : 'Ended'}
                            </Badge>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', color: 'var(--colors-textMain)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Award size={14} color="#F59E0B" /> {item.prize}
                            </div>
                        </CardHeader>
                        
                        <div>
                            <EventTitle>{item.title}</EventTitle>
                            <EventDesc>{item.desc}</EventDesc>
                        </div>
                        
                        <MetaRow>
                            <MetaItem>
                                <Users size={16} /> {item.participants.toLocaleString()} joined
                            </MetaItem>
                            <MetaItem>
                                {item.status === 'ended' ? <Calendar size={16} /> : <Timer size={16} />}
                                {item.status === 'ended' ? 'Finished' : `${item.daysLeft} days left`}
                            </MetaItem>
                        </MetaRow>
                    </Card>
                ))}
            </Grid>

            {/* Interactive Hackathon Arena Modal */}
            {selectedHackathon && (
                <ModalOverlay onClick={() => setSelectedHackathon(null)}>
                    <ModalBox onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(6, 182, 212, 0.15)' }}>
                                    <Rocket size={22} color="var(--colors-accent)" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{selectedHackathon.title}</h3>
                                    <span style={{ fontSize: '0.8rem', color: '#34D399', fontWeight: 600 }}>● {selectedHackathon.status === 'active' ? 'Active Hackathon' : 'Event'} • Prize Pool: {selectedHackathon.prize}</span>
                                </div>
                            </div>
                            <X size={20} style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => setSelectedHackathon(null)} />
                        </div>

                        {/* Sub-tabs */}
                        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                            <button
                                type="button"
                                onClick={() => setArenaTab('submit')}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    borderBottom: arenaTab === 'submit' ? '2px solid var(--colors-accent)' : '2px solid transparent',
                                    color: arenaTab === 'submit' ? 'var(--colors-textMain)' : '#94a3b8',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Project Submission
                            </button>
                            <button
                                type="button"
                                onClick={() => setArenaTab('leaderboard')}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    borderBottom: arenaTab === 'leaderboard' ? '2px solid var(--colors-accent)' : '2px solid transparent',
                                    color: arenaTab === 'leaderboard' ? 'var(--colors-textMain)' : '#94a3b8',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Leaderboard ({selectedHackathon.leaderboard?.length || 0})
                            </button>
                        </div>

                        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {arenaTab === 'submit' ? (
                                <>
                                    <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '12px', padding: '14px', fontSize: '0.88rem', color: '#c9d1d9' }}>
                                        <strong>Challenge Prompt:</strong> {selectedHackathon.prompt || selectedHackathon.desc}
                                    </div>

                                    {hasSubmitted && (
                                        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', color: '#34d399', fontSize: '0.9rem' }}>
                                            <Check size={18} />
                                            <span>Project successfully submitted to the hackathon leaderboard!</span>
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmitProject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Project Title</label>
                                            <input
                                                type="text"
                                                value={projectName}
                                                onChange={e => setProjectName(e.target.value)}
                                                placeholder="e.g. DevSup Agent Engine"
                                                required
                                                style={{ width: '100%', padding: '10px 12px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                                            />
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>GitHub Repository URL</label>
                                                <input
                                                    type="url"
                                                    value={githubUrl}
                                                    onChange={e => setGithubUrl(e.target.value)}
                                                    placeholder="https://github.com/..."
                                                    required
                                                    style={{ width: '100%', padding: '10px 12px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Live Demo URL (Optional)</label>
                                                <input
                                                    type="url"
                                                    value={demoUrl}
                                                    onChange={e => setDemoUrl(e.target.value)}
                                                    placeholder="https://my-demo.app"
                                                    style={{ width: '100%', padding: '10px 12px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Tech Stack</label>
                                            <input
                                                type="text"
                                                value={techStack}
                                                onChange={e => setTechStack(e.target.value)}
                                                placeholder="e.g. React, Node.js, WebSockets, WebRTC"
                                                style={{ width: '100%', padding: '10px 12px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Project Pitch & Overview</label>
                                            <textarea
                                                rows={3}
                                                value={projectDesc}
                                                onChange={e => setProjectDesc(e.target.value)}
                                                placeholder="Explain how your solution works and tackles the hackathon prompt..."
                                                style={{ width: '100%', padding: '10px 12px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', resize: 'vertical' }}
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            style={{
                                                padding: '12px',
                                                backgroundColor: 'var(--colors-accent)',
                                                color: '#000',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontWeight: 700,
                                                fontSize: '0.95rem',
                                                cursor: 'pointer',
                                                marginTop: '8px'
                                            }}
                                        >
                                            Submit Project for Judging
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {(!selectedHackathon.leaderboard || selectedHackathon.leaderboard.length === 0) ? (
                                        <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>
                                            No project submissions yet. Be the first to submit!
                                        </div>
                                    ) : (
                                        selectedHackathon.leaderboard.map((sub, idx) => (
                                            <div
                                                key={sub.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '12px 16px',
                                                    backgroundColor: 'rgba(255,255,255,0.03)',
                                                    borderRadius: '10px',
                                                    border: '1px solid rgba(255,255,255,0.06)'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: idx === 0 ? '#F59E0B' : idx === 1 ? '#94A3B8' : '#78350F', width: '24px' }}>
                                                        #{idx + 1}
                                                    </span>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>{sub.title}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>by {sub.team}</div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    {sub.github && (
                                                        <a href={sub.github} target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8' }}>
                                                            <GithubIcon size={18} />
                                                        </a>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpvote(sub.id)}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '6px 12px',
                                                            backgroundColor: 'rgba(6, 182, 212, 0.1)',
                                                            color: 'var(--colors-accent)',
                                                            border: '1px solid rgba(6, 182, 212, 0.3)',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.82rem',
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        <ThumbsUp size={14} /> {sub.votes || 0}
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </ModalBox>
                </ModalOverlay>
            )}

            {/* Host Hackathon Modal */}
            {isHostModalOpen && (
                <ModalOverlay onClick={() => setIsHostModalOpen(false)}>
                    <ModalBox onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Host a {isHackathon ? 'Hackathon' : 'Competition'}</h3>
                            <X size={20} style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => setIsHostModalOpen(false)} />
                        </div>
                        <form onSubmit={handleHostEvent} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Event Title</label>
                                <input
                                    type="text"
                                    value={hostTitle}
                                    onChange={e => setHostTitle(e.target.value)}
                                    placeholder="e.g. Next-Gen Web3 Sprint 2026"
                                    required
                                    style={{ width: '100%', padding: '10px 12px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Prize Pool</label>
                                    <input
                                        type="text"
                                        value={hostPrize}
                                        onChange={e => setHostPrize(e.target.value)}
                                        placeholder="$25k"
                                        style={{ width: '100%', padding: '10px 12px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Duration (Days)</label>
                                    <input
                                        type="number"
                                        value={hostDays}
                                        onChange={e => setHostDays(e.target.value)}
                                        min="1"
                                        max="60"
                                        style={{ width: '100%', padding: '10px 12px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Description & Challenge Goals</label>
                                <textarea
                                    rows={3}
                                    value={hostDesc}
                                    onChange={e => setHostDesc(e.target.value)}
                                    placeholder="Outline the core objective, judging guidelines, and eligibility..."
                                    required
                                    style={{ width: '100%', padding: '10px 12px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', resize: 'vertical' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsHostModalOpen(false)}
                                    style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: '8px 20px', backgroundColor: 'var(--colors-accent)', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Publish Event
                                </button>
                            </div>
                        </form>
                    </ModalBox>
                </ModalOverlay>
            )}
        </Container>
    );
}
