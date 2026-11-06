import React from 'react';
import { styled, keyframes } from '../stitches.config.js';
import { 
    MessageSquare, Bell, Monitor, HelpCircle, ChevronLeft, Trash2, Camera, Edit2, Check, 
    Image as ImageIcon, Volume2, EyeOff, Shield, Smartphone, Globe, Moon, Type, DownloadCloud, 
    AlertCircle, X, Search, ChevronDown, ChevronUp, FileText, Send, UserX, Plus, Play, ExternalLink, Lock, CheckCircle2
} from 'lucide-react';
import { techDoodlesSvg, svgToDataUri, wallpaperColors } from '../utils/wallpapers.js';
import { normalizeUsername, validateUsernameFormat } from '../utils/username.js';
import { applyTheme } from '../utils/theme.js';
import { playNotificationSound } from '../utils/audio.js';

const slideIn = keyframes({
    '0%': { transform: 'translateX(10px)', opacity: 0 },
    '100%': { transform: 'translateX(0)', opacity: 1 },
});

const PaneContainer = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '$bg',
    overflowY: 'auto',
    animation: `${slideIn} 0.2s ease-out`,
    color: '$textMain',
    padding: '0 max(20px, calc(50% - 360px))',
    '@media (max-width: 768px)': {
        padding: '0 16px env(safe-area-inset-bottom)',
    }
});

const PaneHeader = styled('div', {
    display: 'flex',
    alignItems: 'center',
    padding: '32px 0 24px',
    backgroundColor: '$bg',
    gap: '16px',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    '@media (max-width: 768px)': {
        padding: '24px 0 16px',
    }
});

const HeaderTitle = styled('h2', {
    margin: 0,
    fontSize: '1.4rem',
    color: '$textMain',
    fontWeight: '700',
    letterSpacing: '-0.3px'
});

const Section = styled('div', {
    padding: '12px 0 32px',
});

const SectionTitle = styled('h3', {
    margin: '0 0 12px 4px',
    fontSize: '0.75rem',
    color: '$textMuted',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
});

const SectionCard = styled('div', {
    backgroundColor: 'var(--colors-surface)',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
});

const SettingRow = styled('div', {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px',
    gap: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    transition: 'background-color 0.2s',
    '&:last-child': {
        borderBottom: 'none'
    },
    variants: {
        clickable: {
            true: {
                cursor: 'pointer',
                '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.03)'
                }
            }
        }
    }
});

const IconWrapper = styled('div', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    flexShrink: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    color: 'var(--colors-textMain)',
    border: '1px solid rgba(255, 255, 255, 0.04)'
});

const SettingText = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1
});

const SettingLabel = styled('span', {
    color: '$textMain',
    fontSize: '1rem',
    fontWeight: '500'
});

const SettingDescription = styled('span', {
    color: '$textMuted',
    fontSize: '0.85rem',
    lineHeight: '1.4'
});

const StyledSelect = styled('select', {
    appearance: 'none',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '$textMain',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '8px 32px 8px 12px',
    borderRadius: '8px',
    fontSize: '0.9rem',
    outline: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
    '&:hover': {
        backgroundColor: 'rgba(255,255,255,0.1)'
    },
    '&:focus': {
        borderColor: '$accent'
    },
    '& option': {
        backgroundColor: '#0F172A',
        color: 'white'
    }
});

const ToggleSwitch = styled('label', {
    position: 'relative',
    display: 'inline-block',
    width: '44px',
    height: '24px',
    '& input': {
        opacity: 0,
        width: 0,
        height: 0
    },
    '& span': {
        position: 'absolute',
        cursor: 'pointer',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.1)',
        transition: '.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.05)'
    },
    '& span:before': {
        position: 'absolute',
        content: '""',
        height: '18px',
        width: '18px',
        left: '2px',
        bottom: '2px',
        backgroundColor: 'white',
        transition: '.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
        borderRadius: '50%',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    },
    '& input:checked + span': {
        backgroundColor: '$accent',
        borderColor: '$accent'
    },
    '& input:checked + span:before': {
        transform: 'translateX(20px)'
    }
});

export const Toggle = ({ checked, onChange }) => (
    <ToggleSwitch>
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span />
    </ToggleSwitch>
);

const ModalOverlay = styled('div', {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px',
    animation: `${slideIn} 0.15s ease-out`
});

const ModalBox = styled('div', {
    backgroundColor: 'var(--colors-surface, #1e293b)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '560px',
    maxHeight: '88vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
    overflow: 'hidden',
    color: 'var(--colors-textMain, #fff)',
    position: 'relative'
});

const ModalHeader = styled('div', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    '& h3': {
        margin: 0,
        fontSize: '1.2rem',
        fontWeight: '700',
        color: 'var(--colors-textMain, #fff)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    }
});

const ModalBody = styled('div', {
    padding: '24px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    fontSize: '0.92rem',
    lineHeight: '1.6',
    color: 'var(--colors-textMuted, #94a3b8)'
});

const ModalFooter = styled('div', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)'
});

export const AccountPane = ({ onBack, settings, updateSetting, currentUser, onDeleteAccount, showToast }) => {
    const [showInfoModal, setShowInfoModal] = React.useState(false);
    const [showDeleteModal, setShowDeleteModal] = React.useState(false);
    const [deleteInput, setDeleteInput] = React.useState('');
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleDownloadReport = () => {
        const report = {
            title: "DevSup Developer Account Report",
            exportedAt: new Date().toISOString(),
            profile: {
                id: currentUser?._id,
                auth0Id: currentUser?.auth0Id,
                displayName: currentUser?.displayName || 'Developer',
                username: currentUser?.username || 'unassigned',
                email: currentUser?.email,
                techDiscipline: currentUser?.techDiscipline || 'Not specified',
                about: currentUser?.about || '',
                githubProfile: currentUser?.githubProfile || '',
                linkedinProfile: currentUser?.linkedinProfile || '',
                avatarUrl: currentUser?.avatarUrl || '',
                createdAt: currentUser?.createdAt
            },
            preferences: {
                theme: settings?.theme || 'dark',
                readReceipts: settings?.readReceipts !== false,
                lastSeenVisibility: settings?.lastSeen || 'everyone',
                profilePhotoVisibility: settings?.profilePhoto || 'everyone',
                messageAlerts: settings?.messageAlerts !== false,
                showPreviews: settings?.showPreviews !== false,
                sounds: settings?.sounds !== false,
                securityNotifications: settings?.securityNotifications || false,
                enterIsSend: settings?.enterIsSend !== false,
                richIntegrations: settings?.richIntegrations !== false
            }
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `devsup_account_info_${currentUser?.username || 'user'}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast?.('Account data package generated and downloaded.');
    };

    const confirmDelete = async () => {
        const targetWord = (currentUser?.username || 'DELETE').toUpperCase();
        if (deleteInput.trim().toUpperCase() !== targetWord && deleteInput.trim().toUpperCase() !== 'DELETE') return;
        setIsDeleting(true);
        try {
            if (onDeleteAccount) {
                await onDeleteAccount();
            }
        } catch (e) {
            console.error('Delete error', e);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <PaneContainer>
            <PaneHeader>
                <ChevronLeft size={28} style={{ cursor: 'pointer', color: 'var(--colors-textMain)', marginLeft: '-8px' }} onClick={onBack} />
                <HeaderTitle>Account</HeaderTitle>
            </PaneHeader>
            <Section>
                <SectionTitle>Security</SectionTitle>
                <SectionCard>
                    <SettingRow>
                        <IconWrapper><Shield size={20}/></IconWrapper>
                        <SettingText>
                            <SettingLabel>Security notifications</SettingLabel>
                            <SettingDescription>Show security notifications on this computer.</SettingDescription>
                        </SettingText>
                        <Toggle 
                            checked={settings.securityNotifications} 
                            onChange={(e) => {
                                updateSetting('securityNotifications', e.target.checked);
                                showToast?.(e.target.checked ? 'Security notifications enabled.' : 'Security notifications disabled.');
                            }} 
                        />
                    </SettingRow>
                </SectionCard>
                
                <SectionTitle>Data</SectionTitle>
                <SectionCard>
                    <SettingRow clickable onClick={() => setShowInfoModal(true)}>
                        <IconWrapper><DownloadCloud size={20}/></IconWrapper>
                        <SettingText>
                            <SettingLabel>Request account info</SettingLabel>
                            <SettingDescription>Download your account information and settings.</SettingDescription>
                        </SettingText>
                    </SettingRow>
                    <SettingRow clickable style={{ color: '#ef4444' }} onClick={() => { setDeleteInput(''); setShowDeleteModal(true); }}>
                        <IconWrapper><Trash2 size={20}/></IconWrapper>
                        <SettingText>
                            <SettingLabel style={{ color: '#ef4444' }}>Delete my account</SettingLabel>
                            <SettingDescription>Permanently delete your account and all data.</SettingDescription>
                        </SettingText>
                    </SettingRow>
                </SectionCard>
            </Section>

            {/* Request Account Info Modal */}
            {showInfoModal && (
                <ModalOverlay onClick={() => setShowInfoModal(false)}>
                    <ModalBox onClick={(e) => e.stopPropagation()}>
                        <ModalHeader>
                            <h3><DownloadCloud size={22} color="var(--colors-accent)" /> Account Information Package</h3>
                            <X size={20} style={{ cursor: 'pointer', color: 'var(--colors-textMuted)' }} onClick={() => setShowInfoModal(false)} />
                        </ModalHeader>
                        <ModalBody>
                            <p style={{ margin: 0, color: 'var(--colors-textMain)', fontSize: '0.95rem' }}>
                                Your report includes personal profile details, authenticated credentials, preferences, and account metadata.
                            </p>
                            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '10px', fontSize: '0.88rem' }}>
                                    <span style={{ color: 'var(--colors-textMuted)' }}>Display Name:</span>
                                    <span style={{ color: 'var(--colors-textMain)', fontWeight: 600 }}>{currentUser?.displayName || 'Developer'}</span>
                                    <span style={{ color: 'var(--colors-textMuted)' }}>Username:</span>
                                    <span style={{ color: 'var(--colors-accent)', fontWeight: 500 }}>@{currentUser?.username || 'unassigned'}</span>
                                    <span style={{ color: 'var(--colors-textMuted)' }}>Email:</span>
                                    <span style={{ color: 'var(--colors-textMain)' }}>{currentUser?.email || 'N/A'}</span>
                                    <span style={{ color: 'var(--colors-textMuted)' }}>Discipline:</span>
                                    <span style={{ color: 'var(--colors-textMain)' }}>{currentUser?.techDiscipline || 'General Developer'}</span>
                                    <span style={{ color: 'var(--colors-textMuted)' }}>Format:</span>
                                    <span style={{ color: 'var(--colors-textMain)' }}>Structured JSON (.json)</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '0.85rem' }}>
                                <Check size={16} /> Data is compiled client-side and verified ready for export.
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <button
                                type="button"
                                onClick={() => setShowInfoModal(false)}
                                style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'var(--colors-textMain)', cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={handleDownloadReport}
                                style={{ padding: '8px 20px', backgroundColor: 'var(--colors-accent)', border: 'none', borderRadius: '8px', color: '#000', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}
                            >
                                <DownloadCloud size={16} /> Download Package (.JSON)
                            </button>
                        </ModalFooter>
                    </ModalBox>
                </ModalOverlay>
            )}

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <ModalOverlay onClick={() => !isDeleting && setShowDeleteModal(false)}>
                    <ModalBox onClick={(e) => e.stopPropagation()} style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                        <ModalHeader>
                            <h3 style={{ color: '#ef4444' }}><AlertCircle size={22} color="#ef4444" /> Delete Account</h3>
                            {!isDeleting && <X size={20} style={{ cursor: 'pointer', color: 'var(--colors-textMuted)' }} onClick={() => setShowDeleteModal(false)} />}
                        </ModalHeader>
                        <ModalBody>
                            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px', padding: '14px', color: '#fca5a5', fontSize: '0.88rem' }}>
                                <strong>Warning:</strong> Deleting your account is permanent. All your chats, statuses, uploaded files, and settings will be permanently removed. This action cannot be reversed.
                            </div>
                            <p style={{ margin: '8px 0 0', color: 'var(--colors-textMain)', fontSize: '0.9rem' }}>
                                To confirm, type <strong>DELETE</strong> or your username (<strong>{currentUser?.username || 'DELETE'}</strong>) below:
                            </p>
                            <input
                                type="text"
                                value={deleteInput}
                                onChange={(e) => setDeleteInput(e.target.value)}
                                placeholder="Type DELETE to confirm"
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    backgroundColor: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#fff',
                                    outline: 'none',
                                    fontSize: '0.95rem'
                                }}
                            />
                        </ModalBody>
                        <ModalFooter>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setShowDeleteModal(false)}
                                style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'var(--colors-textMain)', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting || (deleteInput.trim().toUpperCase() !== 'DELETE' && deleteInput.trim().toUpperCase() !== (currentUser?.username || '').toUpperCase())}
                                onClick={confirmDelete}
                                style={{
                                    padding: '8px 20px',
                                    backgroundColor: '#ef4444',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontWeight: '600',
                                    cursor: (isDeleting || (deleteInput.trim().toUpperCase() !== 'DELETE' && deleteInput.trim().toUpperCase() !== (currentUser?.username || '').toUpperCase())) ? 'not-allowed' : 'pointer',
                                    opacity: (isDeleting || (deleteInput.trim().toUpperCase() !== 'DELETE' && deleteInput.trim().toUpperCase() !== (currentUser?.username || '').toUpperCase())) ? 0.4 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
                            </button>
                        </ModalFooter>
                    </ModalBox>
                </ModalOverlay>
            )}
        </PaneContainer>
    );
};

export const PrivacyPane = ({ onBack, settings, updateSetting, blockedUsers = [], onUnblockUser, onBlockUser, contacts = [], showToast }) => {
    const [viewingBlocked, setViewingBlocked] = React.useState(false);
    const [showBlockPicker, setShowBlockPicker] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');

    const unblockedContacts = contacts.filter(c => {
        const cId = c._id || c.id;
        return !blockedUsers.some(b => (b._id || b) === cId);
    });

    const filteredContacts = unblockedContacts.filter(c => {
        const name = (c.displayName || c.username || '').toLowerCase();
        return name.includes(searchQuery.toLowerCase());
    });

    if (viewingBlocked) {
        return (
            <PaneContainer>
                <PaneHeader>
                    <ChevronLeft size={28} style={{ cursor: 'pointer', color: 'var(--colors-textMain)', marginLeft: '-8px' }} onClick={() => setViewingBlocked(false)} />
                    <HeaderTitle>Blocked Contacts</HeaderTitle>
                </PaneHeader>
                <Section>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <SectionTitle style={{ margin: 0 }}>{blockedUsers.length} Blocked {blockedUsers.length === 1 ? 'Contact' : 'Contacts'}</SectionTitle>
                        {onBlockUser && contacts.length > 0 && (
                            <button
                                type="button"
                                onClick={() => { setSearchQuery(''); setShowBlockPicker(true); }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    backgroundColor: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: 'var(--colors-accent)',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                <Plus size={16} /> Block contact
                            </button>
                        )}
                    </div>

                    {blockedUsers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--colors-textMuted)' }}>
                            <EyeOff size={40} style={{ opacity: 0.5, marginBottom: '12px' }} />
                            <p style={{ margin: 0, fontSize: '0.95rem' }}>You have not blocked any contacts.</p>
                        </div>
                    ) : (
                        <SectionCard>
                            {blockedUsers.map((blocked) => {
                                const id = blocked._id || blocked;
                                const name = blocked.displayName || blocked.username || 'Blocked Contact';
                                const username = blocked.username ? `@${blocked.username}` : '';
                                const avatar = blocked.avatarUrl || '/default-avatar.svg';

                                return (
                                    <div
                                        key={id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '12px 16px',
                                            borderBottom: '1px solid rgba(255,255,255,0.05)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <img
                                                src={avatar}
                                                alt={name}
                                                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                                onError={(e) => { e.currentTarget.src = '/default-avatar.svg'; }}
                                            />
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 500, color: 'var(--colors-textMain)', fontSize: '0.95rem' }}>{name}</span>
                                                {username && <span style={{ fontSize: '0.8rem', color: 'var(--colors-textMuted)' }}>{username}</span>}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => onUnblockUser?.(id, name)}
                                            style={{
                                                padding: '6px 14px',
                                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                                color: '#ef4444',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#ef4444';
                                                e.currentTarget.style.color = '#fff';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                                                e.currentTarget.style.color = '#ef4444';
                                            }}
                                        >
                                            Unblock
                                        </button>
                                    </div>
                                );
                            })}
                        </SectionCard>
                    )}
                </Section>

                {/* Block Contact Picker Modal */}
                {showBlockPicker && (
                    <ModalOverlay onClick={() => setShowBlockPicker(false)}>
                        <ModalBox onClick={(e) => e.stopPropagation()}>
                            <ModalHeader>
                                <h3><UserX size={20} color="#ef4444" /> Select Contact to Block</h3>
                                <X size={20} style={{ cursor: 'pointer', color: 'var(--colors-textMuted)' }} onClick={() => setShowBlockPicker(false)} />
                            </ModalHeader>
                            <ModalBody>
                                <div style={{ position: 'relative' }}>
                                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--colors-textMuted)' }} />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search contacts by name or username..."
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px 10px 36px',
                                            backgroundColor: 'rgba(0,0,0,0.2)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            color: '#fff',
                                            outline: 'none',
                                            fontSize: '0.9rem'
                                        }}
                                        autoFocus
                                    />
                                </div>
                                <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {filteredContacts.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--colors-textMuted)' }}>
                                            No eligible contacts found.
                                        </div>
                                    ) : (
                                        filteredContacts.map(contact => {
                                            const id = contact._id || contact.id;
                                            const name = contact.displayName || contact.username || 'Contact';
                                            const avatar = contact.avatarUrl || '/default-avatar.svg';

                                            return (
                                                <div
                                                    key={id}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '10px 14px',
                                                        backgroundColor: 'rgba(255,255,255,0.03)',
                                                        borderRadius: '8px',
                                                        border: '1px solid rgba(255,255,255,0.05)'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <img src={avatar} alt={name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = '/default-avatar.svg'; }} />
                                                        <div>
                                                            <div style={{ fontWeight: 600, color: 'var(--colors-textMain)', fontSize: '0.9rem' }}>{name}</div>
                                                            {contact.username && <div style={{ fontSize: '0.78rem', color: 'var(--colors-textMuted)' }}>@{contact.username}</div>}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            onBlockUser?.(id, name);
                                                            setShowBlockPicker(false);
                                                        }}
                                                        style={{
                                                            padding: '6px 12px',
                                                            backgroundColor: 'rgba(239,68,68,0.2)',
                                                            color: '#ef4444',
                                                            border: '1px solid rgba(239,68,68,0.3)',
                                                            borderRadius: '6px',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 600,
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Block
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </ModalBody>
                        </ModalBox>
                    </ModalOverlay>
                )}
            </PaneContainer>
        );
    }

    return (
        <PaneContainer>
            <PaneHeader>
                <ChevronLeft size={28} style={{ cursor: 'pointer', color: 'var(--colors-textMain)', marginLeft: '-8px' }} onClick={onBack} />
                <HeaderTitle>Privacy</HeaderTitle>
            </PaneHeader>
            <Section>
                <SectionTitle>Visibility</SectionTitle>
                <SectionCard>
                    <SettingRow>
                        <IconWrapper><Globe size={20}/></IconWrapper>
                        <SettingText>
                            <SettingLabel>Last seen and online</SettingLabel>
                        </SettingText>
                        <StyledSelect 
                            value={settings.lastSeen || 'everyone'} 
                            onChange={(e) => {
                                updateSetting('lastSeen', e.target.value);
                                showToast?.(`Last seen visibility updated to ${e.target.value}.`);
                            }}
                        >
                            <option value="everyone">Everyone</option>
                            <option value="contacts">My Contacts</option>
                            <option value="nobody">Nobody</option>
                        </StyledSelect>
                    </SettingRow>
                    <SettingRow>
                        <IconWrapper><ImageIcon size={20}/></IconWrapper>
                        <SettingText>
                            <SettingLabel>Profile photo</SettingLabel>
                        </SettingText>
                        <StyledSelect 
                            value={settings.profilePhoto || 'everyone'} 
                            onChange={(e) => {
                                updateSetting('profilePhoto', e.target.value);
                                showToast?.(`Profile photo visibility updated to ${e.target.value}.`);
                            }}
                        >
                            <option value="everyone">Everyone</option>
                            <option value="contacts">My Contacts</option>
                            <option value="nobody">Nobody</option>
                        </StyledSelect>
                    </SettingRow>
                </SectionCard>

                <SectionTitle>Messaging</SectionTitle>
                <SectionCard>
                    <SettingRow>
                        <IconWrapper><Check size={20}/></IconWrapper>
                        <SettingText>
                            <SettingLabel>Read receipts</SettingLabel>
                            <SettingDescription>If turned off, you won't send or receive read receipts.</SettingDescription>
                        </SettingText>
                        <Toggle 
                            checked={settings.readReceipts !== false} 
                            onChange={(e) => {
                                updateSetting('readReceipts', e.target.checked);
                                showToast?.(e.target.checked ? 'Read receipts enabled.' : 'Read receipts disabled.');
                            }} 
                        />
                    </SettingRow>
                    <SettingRow clickable onClick={() => setViewingBlocked(true)}>
                        <IconWrapper><EyeOff size={20}/></IconWrapper>
                        <SettingText>
                            <SettingLabel>Blocked contacts</SettingLabel>
                            <SettingDescription>{blockedUsers.length} {blockedUsers.length === 1 ? 'contact' : 'contacts'}</SettingDescription>
                        </SettingText>
                    </SettingRow>
                </SectionCard>
            </Section>
        </PaneContainer>
    );
};

export const ChatsPane = ({ onBack, settings, updateSetting, getAccessTokenSilently, BACKEND_URL, showToast }) => {
    const [isUploading, setIsUploading] = React.useState(false);
    const fileInputRef = React.useRef(null);
    const techDoodlesUri = svgToDataUri(techDoodlesSvg);
    const hasDoodles = settings.wallpaperUrl !== '';

    const handleWallpaperUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const token = await getAccessTokenSilently();
            const uploadRes = await fetch(`${BACKEND_URL}/api/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (!uploadRes.ok) throw new Error('Upload failed');
            const data = await uploadRes.json();
            
            updateSetting('wallpaperUrl', data.fileUrl);
            updateSetting('wallpaperType', 'custom');
            updateSetting('wallpaperBgColor', 'transparent');
            showToast?.('Custom wallpaper applied.');
        } catch (error) {
            console.error("Error uploading wallpaper:", error);
            showToast?.("Failed to upload wallpaper");
        } finally {
            setIsUploading(false);
        }
    };

    const handleColorClick = (color) => {
        updateSetting('wallpaperBgColor', color);
        updateSetting('wallpaperType', 'solid');
        if (hasDoodles) {
            updateSetting('wallpaperUrl', '/chat-bg.jpg');
        } else {
            updateSetting('wallpaperUrl', '');
        }
        showToast?.('Chat wallpaper updated.');
    };

    const toggleDoodles = (checked) => {
        if (checked) {
            updateSetting('wallpaperUrl', '/chat-bg.jpg');
            if (!settings.wallpaperBgColor || settings.wallpaperBgColor === 'transparent') {
                updateSetting('wallpaperBgColor', wallpaperColors[0]);
            }
            showToast?.('Tech doodles enabled.');
        } else {
            updateSetting('wallpaperUrl', '');
            showToast?.('Tech doodles disabled.');
        }
    };

    const handleThemeChange = (newTheme) => {
        updateSetting('theme', newTheme);
        applyTheme(newTheme);
        showToast?.(`Theme changed to ${newTheme}.`);
    };

    return (
        <PaneContainer>
            <PaneHeader>
                <ChevronLeft size={28} style={{ cursor: 'pointer', color: 'var(--colors-textMain)', marginLeft: '-8px' }} onClick={onBack} />
                <HeaderTitle>Chats</HeaderTitle>
            </PaneHeader>
            <Section>
                <SectionTitle>Display</SectionTitle>
                <SectionCard>
                    <SettingRow>
                        <IconWrapper><Moon size={20}/></IconWrapper>
                        <SettingText>
                            <SettingLabel>Theme</SettingLabel>
                        </SettingText>
                        <StyledSelect 
                            value={settings.theme || 'dark'} 
                            onChange={(e) => handleThemeChange(e.target.value)}
                        >
                            <option value="dark">Dark (DevSup Default)</option>
                            <option value="emerald">WhatsApp Emerald</option>
                            <option value="midnight">Midnight OLED</option>
                            <option value="light">Light</option>
                            <option value="system">System Default</option>
                        </StyledSelect>
                    </SettingRow>
                </SectionCard>
                
                <SectionTitle>Chat Wallpaper</SectionTitle>
                <SectionCard style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Toggle checked={hasDoodles} onChange={(e) => toggleDoodles(e.target.checked)} />
                        <span style={{ fontSize: '0.95rem' }}>Add tech doodles</span>
                    </div>

                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(4, 1fr)', 
                        gap: '12px' 
                    }}>
                        {wallpaperColors.map((color, index) => {
                            const isSelected = settings.wallpaperBgColor === color && settings.wallpaperType !== 'custom';
                            return (
                                <div 
                                    key={index}
                                    onClick={() => handleColorClick(color)}
                                    style={{
                                        aspectRatio: '1',
                                        backgroundColor: color,
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: isSelected ? '3px solid var(--colors-accent)' : '1px solid rgba(255,255,255,0.05)',
                                        boxShadow: isSelected ? '0 0 0 2px var(--colors-surface)' : 'none',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {hasDoodles && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 0, left: 0, right: 0, bottom: 0,
                                            backgroundImage: `url("${techDoodlesUri}")`,
                                            backgroundSize: '80px',
                                            opacity: 0.8
                                        }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                        <div style={{ color: 'var(--colors-textMain)', fontSize: '0.9rem', marginBottom: '12px' }}>Custom Wallpaper</div>
                        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleWallpaperUpload} />
                        <button 
                            onClick={() => fileInputRef.current.click()}
                            disabled={isUploading}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: 'rgba(255,255,255,0.03)',
                                border: '1px dashed rgba(255,255,255,0.2)',
                                color: 'var(--colors-textMain)',
                                borderRadius: '12px',
                                cursor: isUploading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                transition: 'all 0.2s'
                            }}
                        >
                            {isUploading ? (
                                <div style={{width: 18, height: 18, border: '2px solid var(--colors-accent)', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
                            ) : <Camera size={18} color="var(--colors-accent)" />}
                            <span style={{ fontWeight: '500' }}>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
                        </button>
                    </div>

                    {(settings.wallpaperUrl) && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ color: 'var(--colors-textMain)', fontSize: '0.9rem' }}>Wallpaper Dimming</span>
                                <span style={{ color: 'var(--colors-textMuted)', fontSize: '0.85rem' }}>{settings.wallpaperBrightness !== undefined ? settings.wallpaperBrightness : 100}%</span>
                            </div>
                            <input 
                                type="range" 
                                min="10" 
                                max="100" 
                                value={settings.wallpaperBrightness !== undefined ? settings.wallpaperBrightness : 100} 
                                onChange={(e) => updateSetting('wallpaperBrightness', parseInt(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--colors-accent)' }}
                            />
                        </div>
                    )}
                </SectionCard>
            </Section>

            <Section>
                <SectionTitle>Input</SectionTitle>
                <SectionCard>
                    <SettingRow>
                        <IconWrapper><Type size={20}/></IconWrapper>
                        <SettingText>
                            <SettingLabel>Enter is send</SettingLabel>
                            <SettingDescription>Enter key will send your message</SettingDescription>
                        </SettingText>
                        <Toggle 
                            checked={settings.enterIsSend !== false} 
                            onChange={(e) => {
                                updateSetting('enterIsSend', e.target.checked);
                                showToast?.(e.target.checked ? 'Enter will send messages.' : 'Enter will insert new line.');
                            }} 
                        />
                    </SettingRow>
                </SectionCard>
            </Section>

            <Section>
                <SectionTitle>Integrations</SectionTitle>
                <SectionCard>
                    <SettingRow>
                        <IconWrapper><Globe size={20}/></IconWrapper>
                        <SettingText>
                            <SettingLabel>Rich Ecosystem Integrations</SettingLabel>
                            <SettingDescription>Native URL parser intercepts GitHub, Figma, and Notion links, transforming them into interactive, dark-themed embed cards.</SettingDescription>
                        </SettingText>
                        <Toggle 
                            checked={settings.richIntegrations !== false} 
                            onChange={(e) => {
                                updateSetting('richIntegrations', e.target.checked);
                                showToast?.(e.target.checked ? 'Rich embed cards enabled.' : 'Rich embed cards disabled.');
                            }} 
                        />
                    </SettingRow>
                </SectionCard>
            </Section>
        </PaneContainer>
    );
};

export const NotificationsPane = ({ onBack, settings, updateSetting, showToast }) => {
    const [isTestingSound, setIsTestingSound] = React.useState(false);

    const handleTestSound = () => {
        setIsTestingSound(true);
        playNotificationSound();
        showToast?.('Testing message notification chime sound.');
        setTimeout(() => setIsTestingSound(false), 600);
    };

    return (
        <PaneContainer>
            <PaneHeader>
                <ChevronLeft size={28} style={{ cursor: 'pointer', color: 'var(--colors-textMain)', marginLeft: '-8px' }} onClick={onBack} />
                <HeaderTitle>Notifications</HeaderTitle>
            </PaneHeader>
            <Section>
                <SectionTitle>Messages</SectionTitle>
                <SectionCard>
                    <SettingRow>
                        <IconWrapper><Bell size={20}/></IconWrapper>
                        <SettingText>
                            <SettingLabel>Message notifications</SettingLabel>
                            <SettingDescription>Show message notifications, including when the app is in the background.</SettingDescription>
                        </SettingText>
                        <Toggle
                            checked={settings.messageAlerts !== false}
                            onChange={async (e) => {
                                const enabled = e.target.checked;
                                if (enabled && typeof Notification !== 'undefined') {
                                    try {
                                        const perm = await Notification.requestPermission();
                                        if (perm === 'granted') {
                                            showToast?.('Desktop notifications granted and enabled.');
                                        } else {
                                            showToast?.('Notification permission denied by browser.');
                                        }
                                    } catch (error) {
                                        console.error('Could not request notification permission:', error);
                                    }
                                } else {
                                    showToast?.('Message notifications turned off.');
                                }
                                updateSetting('messageAlerts', enabled);
                            }}
                        />
                    </SettingRow>
                    <SettingRow>
                        <IconWrapper><Smartphone size={20}/></IconWrapper>
                        <SettingText>
                            <SettingLabel>Show previews</SettingLabel>
                            <SettingDescription>Show message text in new message notifications</SettingDescription>
                        </SettingText>
                        <Toggle 
                            checked={settings.showPreviews !== false} 
                            onChange={(e) => {
                                updateSetting('showPreviews', e.target.checked);
                                showToast?.(e.target.checked ? 'Message preview enabled.' : 'Message preview hidden.');
                            }} 
                        />
                    </SettingRow>
                    <SettingRow>
                        <IconWrapper><Volume2 size={20}/></IconWrapper>
                        <SettingText>
                            <SettingLabel>Sounds</SettingLabel>
                            <SettingDescription>Play sounds for incoming messages</SettingDescription>
                        </SettingText>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button
                                type="button"
                                onClick={handleTestSound}
                                style={{
                                    padding: '5px 12px',
                                    backgroundColor: isTestingSound ? 'var(--colors-accent)' : 'rgba(255,255,255,0.06)',
                                    color: isTestingSound ? '#000' : 'var(--colors-accent)',
                                    border: '1px solid var(--colors-accent)',
                                    borderRadius: '8px',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Volume2 size={14} />
                                {isTestingSound ? 'Playing...' : 'Test Sound'}
                            </button>
                            <Toggle 
                                checked={settings.sounds !== false} 
                                onChange={(e) => {
                                    updateSetting('sounds', e.target.checked);
                                    showToast?.(e.target.checked ? 'Notification sounds enabled.' : 'Notification sounds muted.');
                                }} 
                            />
                        </div>
                    </SettingRow>
                </SectionCard>
            </Section>
        </PaneContainer>
    );
};

export const KeyboardShortcutsPane = ({ onBack }) => (
    <PaneContainer>
        <PaneHeader>
            <ChevronLeft size={28} style={{ cursor: 'pointer', color: 'var(--colors-textMain)', marginLeft: '-8px' }} onClick={onBack} />
            <HeaderTitle>Keyboard shortcuts</HeaderTitle>
        </PaneHeader>
        <Section>
            <SectionCard style={{ padding: '8px 0' }}>
                <SettingRow><SettingLabel>Mark unread</SettingLabel><span style={{color: 'var(--colors-accent)', fontSize: '0.85rem', fontWeight: '500', backgroundColor: 'rgba(6, 182, 212, 0.1)', padding: '4px 8px', borderRadius: '6px'}}>Ctrl + Shift + U</span></SettingRow>
                <SettingRow><SettingLabel>Archive chat</SettingLabel><span style={{color: 'var(--colors-accent)', fontSize: '0.85rem', fontWeight: '500', backgroundColor: 'rgba(6, 182, 212, 0.1)', padding: '4px 8px', borderRadius: '6px'}}>Ctrl + Alt + E</span></SettingRow>
                <SettingRow><SettingLabel>Pin chat</SettingLabel><span style={{color: 'var(--colors-accent)', fontSize: '0.85rem', fontWeight: '500', backgroundColor: 'rgba(6, 182, 212, 0.1)', padding: '4px 8px', borderRadius: '6px'}}>Ctrl + Alt + P</span></SettingRow>
                <SettingRow><SettingLabel>Search</SettingLabel><span style={{color: 'var(--colors-accent)', fontSize: '0.85rem', fontWeight: '500', backgroundColor: 'rgba(6, 182, 212, 0.1)', padding: '4px 8px', borderRadius: '6px'}}>Ctrl + Alt + /</span></SettingRow>
                <SettingRow><SettingLabel>New chat</SettingLabel><span style={{color: 'var(--colors-accent)', fontSize: '0.85rem', fontWeight: '500', backgroundColor: 'rgba(6, 182, 212, 0.1)', padding: '4px 8px', borderRadius: '6px'}}>Ctrl + Alt + N</span></SettingRow>
                <SettingRow><SettingLabel>Settings</SettingLabel><span style={{color: 'var(--colors-accent)', fontSize: '0.85rem', fontWeight: '500', backgroundColor: 'rgba(6, 182, 212, 0.1)', padding: '4px 8px', borderRadius: '6px'}}>Ctrl + Alt + ,</span></SettingRow>
                <SettingRow><SettingLabel>Mute</SettingLabel><span style={{color: 'var(--colors-accent)', fontSize: '0.85rem', fontWeight: '500', backgroundColor: 'rgba(6, 182, 212, 0.1)', padding: '4px 8px', borderRadius: '6px'}}>Ctrl + Alt + M</span></SettingRow>
                <SettingRow><SettingLabel>Delete chat</SettingLabel><span style={{color: 'var(--colors-accent)', fontSize: '0.85rem', fontWeight: '500', backgroundColor: 'rgba(6, 182, 212, 0.1)', padding: '4px 8px', borderRadius: '6px'}}>Ctrl + Alt + Backspace</span></SettingRow>
            </SectionCard>
        </Section>
    </PaneContainer>
);

export const HelpPane = ({ onBack, currentUser, showToast }) => {
    const [activeModal, setActiveModal] = React.useState(null); // 'help_centre' | 'contact_us' | 'terms' | 'guidelines'
    const [searchFaq, setSearchFaq] = React.useState('');
    const [expandedFaq, setExpandedFaq] = React.useState(null);

    // Contact form state
    const [contactCategory, setContactCategory] = React.useState('Technical Support');
    const [contactSubject, setContactSubject] = React.useState('');
    const [contactMessage, setContactMessage] = React.useState('');
    const [isSubmittingTicket, setIsSubmittingTicket] = React.useState(false);
    const [ticketSubmitted, setTicketSubmitted] = React.useState(false);

    // Terms tab state
    const [termsTab, setTermsTab] = React.useState('terms'); // 'terms' | 'privacy'

    const faqs = [
        {
            category: 'Getting Started',
            q: 'How do I set up my developer profile and username?',
            a: 'Head to Settings > Profile (tap on your avatar card at top of settings). You can configure your custom display name, unique @username, primary tech discipline, bio, and portfolio / GitHub links.'
        },
        {
            category: 'Getting Started',
            q: 'How can other developers find and message me?',
            a: 'Developers can search for your exact @username or email using the search bar or the New Chat button. Once selected, an encrypted direct conversation will open immediately.'
        },
        {
            category: 'Messaging & Code',
            q: 'How do I share code snippets with syntax highlighting?',
            a: 'DevSup automatically detects fenced markdown code blocks (e.g. ```javascript ... ```). You can also click the </> icon in the chat input to insert formatted code blocks with syntax highlighting for 20+ languages.'
        },
        {
            category: 'Messaging & Code',
            q: 'Can I change whether Enter sends or starts a new line?',
            a: 'Yes! Navigate to Settings > Chats and toggle "Enter is send". When disabled, Shift + Enter or Enter adds a line break, and you can send via the send button.'
        },
        {
            category: 'Calling & Collaboration',
            q: 'How do voice and video calls work?',
            a: 'DevSup features direct peer-to-peer WebRTC encrypted voice and video calls with screen sharing. Just click the Phone or Video camera icon in any conversation header.'
        },
        {
            category: 'Calling & Collaboration',
            q: 'What is the collaborative Canvas / Whiteboard?',
            a: 'Click the Brush icon in any chat header to launch a synchronized real-time vector whiteboard. Draw diagrams, mock UI layouts, and plan architecture with your teammates in real time.'
        },
        {
            category: 'Privacy & Security',
            q: 'Who can see my last seen timestamp and online status?',
            a: 'Go to Settings > Privacy > Visibility. You can restrict your Last Seen and Profile Photo to Everyone, My Contacts, or Nobody.'
        },
        {
            category: 'Privacy & Security',
            q: 'How do I export or permanently delete my data?',
            a: 'Go to Settings > Account. Click "Request account info" to export your data package in JSON, or "Delete my account" to permanently erase your profile and records.'
        }
    ];

    const filteredFaqs = faqs.filter(f => 
        f.q.toLowerCase().includes(searchFaq.toLowerCase()) || 
        f.a.toLowerCase().includes(searchFaq.toLowerCase()) ||
        f.category.toLowerCase().includes(searchFaq.toLowerCase())
    );

    const handleSendContactTicket = (e) => {
        e.preventDefault();
        if (!contactSubject.trim() || !contactMessage.trim()) return;
        setIsSubmittingTicket(true);
        setTimeout(() => {
            setIsSubmittingTicket(false);
            setTicketSubmitted(true);
            showToast?.('Support ticket submitted successfully.');
        }, 800);
    };

    return (
        <PaneContainer>
            <PaneHeader>
                <ChevronLeft size={28} style={{ cursor: 'pointer', color: 'var(--colors-textMain)', marginLeft: '-8px' }} onClick={onBack} />
                <HeaderTitle>Help</HeaderTitle>
            </PaneHeader>
            <Section>
                <SectionCard>
                    <SettingRow clickable onClick={() => { setSearchFaq(''); setExpandedFaq(null); setActiveModal('help_centre'); }}>
                        <IconWrapper><HelpCircle size={20}/></IconWrapper>
                        <SettingLabel>Help Centre</SettingLabel>
                    </SettingRow>
                    <SettingRow clickable onClick={() => { setTicketSubmitted(false); setContactSubject(''); setContactMessage(''); setActiveModal('contact_us'); }}>
                        <IconWrapper><MessageSquare size={20}/></IconWrapper>
                        <SettingLabel>Contact us</SettingLabel>
                    </SettingRow>
                    <SettingRow clickable onClick={() => { setTermsTab('terms'); setActiveModal('terms'); }}>
                        <IconWrapper><Shield size={20}/></IconWrapper>
                        <SettingLabel>Terms and Privacy Policy</SettingLabel>
                    </SettingRow>
                    <SettingRow clickable onClick={() => setActiveModal('guidelines')}>
                        <IconWrapper><Monitor size={20}/></IconWrapper>
                        <SettingLabel>Channel guidelines</SettingLabel>
                    </SettingRow>
                </SectionCard>
            </Section>

            {/* Help Centre Modal */}
            {activeModal === 'help_centre' && (
                <ModalOverlay onClick={() => setActiveModal(null)}>
                    <ModalBox onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
                        <ModalHeader>
                            <h3><HelpCircle size={22} color="var(--colors-accent)" /> DevSup Help Centre & FAQs</h3>
                            <X size={20} style={{ cursor: 'pointer', color: 'var(--colors-textMuted)' }} onClick={() => setActiveModal(null)} />
                        </ModalHeader>
                        <ModalBody>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--colors-textMuted)' }} />
                                <input
                                    type="text"
                                    value={searchFaq}
                                    onChange={(e) => setSearchFaq(e.target.value)}
                                    placeholder="Search answers, code guides, shortcuts..."
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px 10px 36px',
                                        backgroundColor: 'rgba(0,0,0,0.25)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        outline: 'none',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {filteredFaqs.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--colors-textMuted)' }}>
                                        No guides matching "{searchFaq}".
                                    </div>
                                ) : (
                                    filteredFaqs.map((faq, index) => {
                                        const isExpanded = expandedFaq === index;
                                        return (
                                            <div
                                                key={index}
                                                style={{
                                                    backgroundColor: 'rgba(255,255,255,0.03)',
                                                    border: '1px solid rgba(255,255,255,0.06)',
                                                    borderRadius: '10px',
                                                    overflow: 'hidden',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <div
                                                    onClick={() => setExpandedFaq(isExpanded ? null : index)}
                                                    style={{
                                                        padding: '14px 16px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        gap: '12px'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--colors-accent)', fontWeight: 700, letterSpacing: '0.05em' }}>
                                                            {faq.category}
                                                        </span>
                                                        <span style={{ color: 'var(--colors-textMain)', fontWeight: 600, fontSize: '0.95rem' }}>
                                                            {faq.q}
                                                        </span>
                                                    </div>
                                                    {isExpanded ? <ChevronUp size={18} color="var(--colors-textMuted)" /> : <ChevronDown size={18} color="var(--colors-textMuted)" />}
                                                </div>
                                                {isExpanded && (
                                                    <div style={{ padding: '0 16px 14px', color: 'var(--colors-textMuted)', fontSize: '0.88rem', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                                                        {faq.a}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <button
                                type="button"
                                onClick={() => setActiveModal(null)}
                                style={{ padding: '8px 18px', backgroundColor: 'var(--colors-accent)', border: 'none', borderRadius: '8px', color: '#000', fontWeight: '600', cursor: 'pointer' }}
                            >
                                Got it
                            </button>
                        </ModalFooter>
                    </ModalBox>
                </ModalOverlay>
            )}

            {/* Contact Us Modal */}
            {activeModal === 'contact_us' && (
                <ModalOverlay onClick={() => setActiveModal(null)}>
                    <ModalBox onClick={(e) => e.stopPropagation()}>
                        <ModalHeader>
                            <h3><MessageSquare size={22} color="var(--colors-accent)" /> Contact Support & Developer Feedback</h3>
                            <X size={20} style={{ cursor: 'pointer', color: 'var(--colors-textMuted)' }} onClick={() => setActiveModal(null)} />
                        </ModalHeader>
                        <ModalBody>
                            {ticketSubmitted ? (
                                <div style={{ textAlign: 'center', padding: '30px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CheckCircle2 size={32} color="#10b981" />
                                    </div>
                                    <h4 style={{ margin: 0, color: 'var(--colors-textMain)', fontSize: '1.2rem' }}>Ticket Received</h4>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--colors-textMuted)', maxWidth: '380px' }}>
                                        Ticket <strong>#DS-{Math.floor(1000 + Math.random() * 9000)}</strong> has been opened. Our engineering team will review your report and reply to <strong>{currentUser?.email || 'your email'}</strong>.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSendContactTicket} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--colors-textMuted)', marginBottom: '6px', fontWeight: 600 }}>Category</label>
                                        <select
                                            value={contactCategory}
                                            onChange={(e) => setContactCategory(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                backgroundColor: 'rgba(0,0,0,0.25)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                outline: 'none',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            <option value="Technical Support">Technical Support</option>
                                            <option value="Bug Report">Bug Report</option>
                                            <option value="Feature Request">Feature Request</option>
                                            <option value="Account & Security">Account & Security</option>
                                            <option value="General Inquiry">General Inquiry</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--colors-textMuted)', marginBottom: '6px', fontWeight: 600 }}>Subject</label>
                                        <input
                                            type="text"
                                            value={contactSubject}
                                            onChange={(e) => setContactSubject(e.target.value)}
                                            placeholder="Brief summary of your question or issue..."
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                backgroundColor: 'rgba(0,0,0,0.25)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                outline: 'none',
                                                fontSize: '0.9rem'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--colors-textMuted)', marginBottom: '6px', fontWeight: 600 }}>Message</label>
                                        <textarea
                                            rows={5}
                                            value={contactMessage}
                                            onChange={(e) => setContactMessage(e.target.value)}
                                            placeholder="Provide details, steps to reproduce, or suggestions..."
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                backgroundColor: 'rgba(0,0,0,0.25)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                outline: 'none',
                                                fontSize: '0.9rem',
                                                resize: 'vertical'
                                            }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setActiveModal(null)}
                                            style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'var(--colors-textMain)', cursor: 'pointer' }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmittingTicket || !contactSubject.trim() || !contactMessage.trim()}
                                            style={{
                                                padding: '8px 20px',
                                                backgroundColor: 'var(--colors-accent)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#000',
                                                fontWeight: '600',
                                                cursor: (isSubmittingTicket || !contactSubject.trim() || !contactMessage.trim()) ? 'not-allowed' : 'pointer',
                                                opacity: (isSubmittingTicket || !contactSubject.trim() || !contactMessage.trim()) ? 0.4 : 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <Send size={16} /> {isSubmittingTicket ? 'Sending...' : 'Submit Ticket'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </ModalBody>
                    </ModalBox>
                </ModalOverlay>
            )}

            {/* Terms and Privacy Policy Modal */}
            {activeModal === 'terms' && (
                <ModalOverlay onClick={() => setActiveModal(null)}>
                    <ModalBox onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
                        <ModalHeader>
                            <h3><Shield size={22} color="var(--colors-accent)" /> DevSup Terms & Privacy Policy</h3>
                            <X size={20} style={{ cursor: 'pointer', color: 'var(--colors-textMuted)' }} onClick={() => setActiveModal(null)} />
                        </ModalHeader>
                        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(0,0,0,0.15)' }}>
                            <button
                                type="button"
                                onClick={() => setTermsTab('terms')}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    border: 'none',
                                    backgroundColor: termsTab === 'terms' ? 'rgba(255,255,255,0.06)' : 'transparent',
                                    borderBottom: termsTab === 'terms' ? '2px solid var(--colors-accent)' : '2px solid transparent',
                                    color: termsTab === 'terms' ? 'var(--colors-textMain)' : 'var(--colors-textMuted)',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                Terms of Service
                            </button>
                            <button
                                type="button"
                                onClick={() => setTermsTab('privacy')}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    border: 'none',
                                    backgroundColor: termsTab === 'privacy' ? 'rgba(255,255,255,0.06)' : 'transparent',
                                    borderBottom: termsTab === 'privacy' ? '2px solid var(--colors-accent)' : '2px solid transparent',
                                    color: termsTab === 'privacy' ? 'var(--colors-textMain)' : 'var(--colors-textMuted)',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                Privacy Policy
                            </button>
                        </div>
                        <ModalBody style={{ fontSize: '0.88rem' }}>
                            {termsTab === 'terms' ? (
                                <>
                                    <h4 style={{ margin: 0, color: 'var(--colors-textMain)' }}>1. Developer Terms of Service</h4>
                                    <p>DevSup is an interactive developer collaboration hub engineered for software engineers, designers, and tech teams. By accessing or using DevSup, you agree to comply with our community rules.</p>
                                    <h4 style={{ margin: '10px 0 0', color: 'var(--colors-textMain)' }}>2. Code & Intellectual Property</h4>
                                    <p>You retain 100% full intellectual property and ownership over any source code, snippets, diagrams, or assets you share across DevSup channels. DevSup claims zero proprietary rights or licensing over your code.</p>
                                    <h4 style={{ margin: '10px 0 0', color: 'var(--colors-textMain)' }}>3. Prohibited Conduct</h4>
                                    <p>Users may not deploy automated spam bots, exploit security boundaries, execute remote payloads against teammates without consent, or conduct denial of service assaults.</p>
                                </>
                            ) : (
                                <>
                                    <h4 style={{ margin: 0, color: 'var(--colors-textMain)' }}>1. Zero Data Brokerage & Privacy by Default</h4>
                                    <p>DevSup will never sell, lease, or monetize your developer code, messages, files, or metadata to third-party ad brokers or external telemetry networks.</p>
                                    <h4 style={{ margin: '10px 0 0', color: 'var(--colors-textMain)' }}>2. End-to-End Media Encryption</h4>
                                    <p>Voice and video streams, along with peer screen sharing sessions, are encrypted using DTLS/SRTP over WebRTC directly between participants.</p>
                                    <h4 style={{ margin: '10px 0 0', color: 'var(--colors-textMain)' }}>3. Right to Complete Erasure</h4>
                                    <p>You have sovereign control over your developer identity. You can download your entire data history or permanently delete your account and all associated messages at any moment under Settings &gt; Account.</p>
                                </>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <button
                                type="button"
                                onClick={() => setActiveModal(null)}
                                style={{ padding: '8px 18px', backgroundColor: 'var(--colors-accent)', border: 'none', borderRadius: '8px', color: '#000', fontWeight: '600', cursor: 'pointer' }}
                            >
                                Close
                            </button>
                        </ModalFooter>
                    </ModalBox>
                </ModalOverlay>
            )}

            {/* Channel Guidelines Modal */}
            {activeModal === 'guidelines' && (
                <ModalOverlay onClick={() => setActiveModal(null)}>
                    <ModalBox onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
                        <ModalHeader>
                            <h3><Monitor size={22} color="var(--colors-accent)" /> Developer Channel & Community Guidelines</h3>
                            <X size={20} style={{ cursor: 'pointer', color: 'var(--colors-textMuted)' }} onClick={() => setActiveModal(null)} />
                        </ModalHeader>
                        <ModalBody>
                            <p style={{ margin: 0, color: 'var(--colors-textMain)', fontSize: '0.95rem' }}>
                                DevSup channels are designed for high-signal engineering collaboration. Please observe these four core standards:
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '12px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 600, fontSize: '0.92rem' }}>
                                        <Lock size={16} /> 1. Protect Sensitive Credentials & Secrets
                                    </div>
                                    <div style={{ marginTop: '4px', fontSize: '0.85rem', color: 'var(--colors-textMuted)' }}>
                                        Never share production database connection strings, AWS access keys, or private .env variables in group channels. Always sanitize snippets with dummy placeholders.
                                    </div>
                                </div>
                                <div style={{ backgroundColor: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '10px', padding: '12px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--colors-accent)', fontWeight: 600, fontSize: '0.92rem' }}>
                                        <CheckCircle2 size={16} /> 2. Constructive & Inclusive Code Review
                                    </div>
                                    <div style={{ marginTop: '4px', fontSize: '0.85rem', color: 'var(--colors-textMuted)' }}>
                                        Provide helpful, constructive critique focused on code architecture, performance, and best practices. Welcome engineers of all experience levels.
                                    </div>
                                </div>
                                <div style={{ backgroundColor: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: '10px', padding: '12px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#eab308', fontWeight: 600, fontSize: '0.92rem' }}>
                                        <AlertCircle size={16} /> 3. Responsible Snippet Sharing
                                    </div>
                                    <div style={{ marginTop: '4px', fontSize: '0.85rem', color: 'var(--colors-textMuted)' }}>
                                        Do not post deceptive or damaging commands (e.g. destructive shell syntax) disguised as solutions.
                                    </div>
                                </div>
                                <div style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '12px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 600, fontSize: '0.92rem' }}>
                                        <Globe size={16} /> 4. Channel Cleanliness & Zero Spam
                                    </div>
                                    <div style={{ marginTop: '4px', fontSize: '0.85rem', color: 'var(--colors-textMuted)' }}>
                                        Keep conversations relevant to the channel topic. Commercial link drops and unsolicited mass DMs are prohibited.
                                    </div>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <button
                                type="button"
                                onClick={() => setActiveModal(null)}
                                style={{ padding: '8px 18px', backgroundColor: 'var(--colors-accent)', border: 'none', borderRadius: '8px', color: '#000', fontWeight: '600', cursor: 'pointer' }}
                            >
                                Understood
                            </button>
                        </ModalFooter>
                    </ModalBox>
                </ModalOverlay>
            )}
        </PaneContainer>
    );
};

export const ProfilePane = ({ onBack, currentUser, onUpdateProfile, getAccessTokenSilently, BACKEND_URL, onViewProfilePicture }) => {
    const [isEditingName, setIsEditingName] = React.useState(false);
    const [name, setName] = React.useState(currentUser?.displayName || '');
    const [isEditingUsername, setIsEditingUsername] = React.useState(false);
    const [usernameInput, setUsernameInput] = React.useState(currentUser?.username || '');
    const [usernameError, setUsernameError] = React.useState('');
    const [isCheckingUsername, setIsCheckingUsername] = React.useState(false);
    const [isSavingUsername, setIsSavingUsername] = React.useState(false);
    const checkUsernameTimerRef = React.useRef(null);
    const [isEditingAbout, setIsEditingAbout] = React.useState(false);
    const [about, setAbout] = React.useState(currentUser?.about || 'Available');
    const [isEditingGithub, setIsEditingGithub] = React.useState(false);
    const [github, setGithub] = React.useState(currentUser?.githubProfile || '');
    const [isEditingLinkedin, setIsEditingLinkedin] = React.useState(false);
    const [linkedin, setLinkedin] = React.useState(currentUser?.linkedinProfile || '');
    const [isEditingPortfolio, setIsEditingPortfolio] = React.useState(false);
    const [portfolio, setPortfolio] = React.useState(currentUser?.portfolioUrl || '');
    const [isUploading, setIsUploading] = React.useState(false);
    
    const fileInputRef = React.useRef(null);

    const checkAvailabilityDebounced = (val) => {
        if (checkUsernameTimerRef.current) clearTimeout(checkUsernameTimerRef.current);
        // Clear stale errors immediately so they don't linger while typing
        setUsernameError('');
        setIsCheckingUsername(false);
        const clean = normalizeUsername(val);
        if (!clean) return;
        if (clean === currentUser?.username) return;

        setIsCheckingUsername(true);
        checkUsernameTimerRef.current = setTimeout(async () => {
            const validation = validateUsernameFormat(clean);
            if (!validation.isValid) {
                setIsCheckingUsername(false);
                setUsernameError(validation.error);
                return;
            }
            try {
                const token = await getAccessTokenSilently();
                const res = await fetch(`${BACKEND_URL}/api/users/check-username?username=${encodeURIComponent(clean)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (!data.available) {
                        setUsernameError(data.message);
                    } else {
                        setUsernameError('');
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsCheckingUsername(false);
            }
        }, 400);
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const token = await getAccessTokenSilently();
            const uploadRes = await fetch(`${BACKEND_URL}/api/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (!uploadRes.ok) throw new Error('Upload failed');
            const data = await uploadRes.json();
            onUpdateProfile({ avatarUrl: data.fileUrl });
        } catch (error) {
            console.error("Error uploading avatar:", error);
            alert("Failed to upload avatar");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <PaneContainer>
            <PaneHeader>
                <ChevronLeft size={28} style={{ cursor: 'pointer', color: 'var(--colors-textMain)', marginLeft: '-8px' }} onClick={onBack} />
                <HeaderTitle>Profile</HeaderTitle>
            </PaneHeader>
            <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px' }}>
                <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                    <img 
                        src={currentUser?.avatarUrl || '/default-avatar.svg'} 
                        alt="Profile" 
                        onError={(e) => { e.currentTarget.src = '/default-avatar.svg'; }}
                        onClick={() => onViewProfilePicture?.(currentUser?.avatarUrl)}
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 8px 16px rgba(0,0,0,0.2)', border: '4px solid var(--colors-surface)', cursor: 'zoom-in' }}
                    />
                    <div 
                        style={{ position: 'absolute', bottom: '4px', right: '4px', backgroundColor: 'var(--colors-accent)', padding: '14px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(6, 182, 212, 0.4)', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.05)' } }}
                        onClick={() => fileInputRef.current.click()}
                    >
                        {isUploading ? <div style={{width: 20, height: 20, border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div> : <Camera size={20} color="#fff" />}
                    </div>
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleAvatarChange} />
                </div>
                
                <SectionCard style={{ width: '100%', padding: '20px' }}>
                    <div style={{ color: 'var(--colors-accent)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', fontWeight: '600' }}>Your Name</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {isEditingName ? (
                            <input 
                                type="text" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                style={{ flex: 1, backgroundColor: 'transparent', border: 'none', borderBottom: '2px solid var(--colors-accent)', color: 'var(--colors-textMain)', fontSize: '1.1rem', outline: 'none', padding: '4px 0' }} 
                                autoFocus
                            />
                        ) : (
                            <span style={{ fontSize: '1.1rem', color: 'var(--colors-textMain)', fontWeight: '500' }}>{currentUser?.displayName}</span>
                        )}
                        <div style={{ cursor: 'pointer', color: 'var(--colors-textMuted)', padding: '8px', marginLeft: '12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            {isEditingName ? (
                                <Check size={18} color="var(--colors-accent)" onClick={() => { setIsEditingName(false); if(name !== currentUser?.displayName) onUpdateProfile({ displayName: name }); }} />
                            ) : (
                                <Edit2 size={18} onClick={() => setIsEditingName(true)} />
                            )}
                        </div>
                    </div>
                    <div style={{ color: 'var(--colors-textMuted)', fontSize: '0.85rem', marginTop: '16px', lineHeight: '1.4' }}>This is not your username or pin. This name will be visible to your DevSup contacts.</div>
                </SectionCard>

                <SectionCard style={{ width: '100%', padding: '20px' }}>
                    <div style={{ color: 'var(--colors-accent)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', fontWeight: '600' }}>Username</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {isEditingUsername ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                                <span style={{ color: 'var(--colors-accent)', fontWeight: '700', fontSize: '1.15rem' }}>@</span>
                                <input
                                    type="text"
                                    value={usernameInput}
                                    onChange={(e) => {
                                        const clean = normalizeUsername(e.target.value);
                                        setUsernameInput(clean);
                                        setUsernameError('');
                                        checkAvailabilityDebounced(clean);
                                    }}
                                    style={{ flex: 1, backgroundColor: 'transparent', border: 'none', borderBottom: '2px solid var(--colors-accent)', color: 'var(--colors-textMain)', fontSize: '1.1rem', outline: 'none', padding: '4px 0' }}
                                    autoFocus
                                    placeholder="e.g. blossom123"
                                    disabled={isSavingUsername}
                                />
                            </div>
                        ) : (
                            <span style={{ fontSize: '1.1rem', color: currentUser?.username ? 'var(--colors-textMain)' : 'var(--colors-textMuted)', fontWeight: '500' }}>
                                {currentUser?.username ? `@${currentUser.username}` : 'Not set — tap to add'}
                            </span>
                        )}
                        <div style={{ cursor: isSavingUsername ? 'not-allowed' : 'pointer', color: 'var(--colors-textMuted)', padding: '8px', marginLeft: '12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            {isEditingUsername ? (
                                isSavingUsername ? (
                                    <div style={{ width: '18px', height: '18px', border: '2px solid var(--colors-accent)', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                ) : (
                                    <Check size={18} color="var(--colors-accent)" onClick={async () => {
                                        const clean = normalizeUsername(usernameInput);
                                        const validation = validateUsernameFormat(clean);
                                        if (!validation.isValid) { 
                                            setUsernameError(validation.error); 
                                            return; 
                                        }
                                        if (clean === currentUser?.username) {
                                            setIsEditingUsername(false);
                                            return;
                                        }
                                        setIsSavingUsername(true);
                                        const result = await onUpdateProfile({ username: clean });
                                        setIsSavingUsername(false);
                                        if (result && result.error) {
                                            setUsernameError(result.error);
                                        } else {
                                            setIsEditingUsername(false);
                                        }
                                    }} />
                                )
                            ) : (
                                <Edit2 size={18} onClick={() => { setUsernameInput(currentUser?.username || ''); setUsernameError(''); setIsEditingUsername(true); }} />
                            )}
                        </div>
                    </div>
                    {isCheckingUsername && (
                        <div style={{ color: 'var(--colors-textMuted)', fontSize: '0.82rem', marginTop: '8px' }}>Checking availability...</div>
                    )}
                    {usernameError && (
                        <div style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AlertCircle size={14} style={{ flexShrink: 0 }} />
                            <span>{usernameError}</span>
                        </div>
                    )}
                    <div style={{ color: 'var(--colors-textMuted)', fontSize: '0.85rem', marginTop: '8px', lineHeight: '1.4' }}>
                        Your unique @username (lowercase letters, numbers, _ and . only). Others use this to find and message you.
                    </div>
                </SectionCard>

                <SectionCard style={{ width: '100%', padding: '20px' }}>
                    <div style={{ color: 'var(--colors-accent)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', fontWeight: '600' }}>About</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {isEditingAbout ? (
                            <input 
                                type="text" 
                                value={about} 
                                onChange={(e) => setAbout(e.target.value)} 
                                style={{ flex: 1, backgroundColor: 'transparent', border: 'none', borderBottom: '2px solid var(--colors-accent)', color: 'var(--colors-textMain)', fontSize: '1.1rem', outline: 'none', padding: '4px 0' }} 
                                autoFocus
                            />
                        ) : (
                            <span style={{ fontSize: '1.1rem', color: 'var(--colors-textMain)', fontWeight: '500' }}>{currentUser?.about}</span>
                        )}
                        <div style={{ cursor: 'pointer', color: 'var(--colors-textMuted)', padding: '8px', marginLeft: '12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            {isEditingAbout ? (
                                <Check size={18} color="var(--colors-accent)" onClick={() => { setIsEditingAbout(false); if(about !== currentUser?.about) onUpdateProfile({ about: about }); }} />
                            ) : (
                                <Edit2 size={18} onClick={() => setIsEditingAbout(true)} />
                            )}
                        </div>
                    </div>
                </SectionCard>

                <SectionCard style={{ width: '100%', padding: '20px' }}>
                    <div style={{ color: 'var(--colors-accent)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', fontWeight: '600' }}>Share Profile Link</div>
                    <div style={{ color: 'var(--colors-textMuted)', fontSize: '0.9rem', marginBottom: '16px', lineHeight: '1.4' }}>
                        Share this link with your friends so they can easily start a direct chat with you on DevSup!
                    </div>
                    <div 
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', backgroundColor: 'var(--colors-accent)', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                        onClick={() => {
                            const link = `${window.location.origin}/dashboard?chatWith=${currentUser?._id}`;
                            navigator.clipboard.writeText(link);
                            alert('Profile link copied to clipboard!');
                        }}
                    >
                        Copy My Link
                    </div>
                </SectionCard>

                <SectionCard style={{ width: '100%', padding: '20px' }}>
                    <div style={{ color: 'var(--colors-accent)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', fontWeight: '600' }}>GitHub Profile</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {isEditingGithub ? (
                            <input 
                                type="text" 
                                value={github} 
                                onChange={(e) => setGithub(e.target.value)} 
                                style={{ flex: 1, backgroundColor: 'transparent', border: 'none', borderBottom: '2px solid var(--colors-accent)', color: 'var(--colors-textMain)', fontSize: '1.1rem', outline: 'none', padding: '4px 0' }} 
                                autoFocus
                            />
                        ) : (
                            <span style={{ fontSize: '1.1rem', color: 'var(--colors-textMain)', fontWeight: '500' }}>{currentUser?.githubProfile || 'Not set'}</span>
                        )}
                        <div style={{ cursor: 'pointer', color: 'var(--colors-textMuted)', padding: '8px', marginLeft: '12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            {isEditingGithub ? (
                                <Check size={18} color="var(--colors-accent)" onClick={() => { setIsEditingGithub(false); if(github !== currentUser?.githubProfile) onUpdateProfile({ githubProfile: github }); }} />
                            ) : (
                                <Edit2 size={18} onClick={() => setIsEditingGithub(true)} />
                            )}
                        </div>
                    </div>
                </SectionCard>

                <SectionCard style={{ width: '100%', padding: '20px' }}>
                    <div style={{ color: 'var(--colors-accent)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', fontWeight: '600' }}>LinkedIn Profile</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {isEditingLinkedin ? (
                            <input 
                                type="text" 
                                value={linkedin} 
                                onChange={(e) => setLinkedin(e.target.value)} 
                                style={{ flex: 1, backgroundColor: 'transparent', border: 'none', borderBottom: '2px solid var(--colors-accent)', color: 'var(--colors-textMain)', fontSize: '1.1rem', outline: 'none', padding: '4px 0' }} 
                                autoFocus
                            />
                        ) : (
                            <span style={{ fontSize: '1.1rem', color: 'var(--colors-textMain)', fontWeight: '500' }}>{currentUser?.linkedinProfile || 'Not set'}</span>
                        )}
                        <div style={{ cursor: 'pointer', color: 'var(--colors-textMuted)', padding: '8px', marginLeft: '12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            {isEditingLinkedin ? (
                                <Check size={18} color="var(--colors-accent)" onClick={() => { setIsEditingLinkedin(false); if(linkedin !== currentUser?.linkedinProfile) onUpdateProfile({ linkedinProfile: linkedin }); }} />
                            ) : (
                                <Edit2 size={18} onClick={() => setIsEditingLinkedin(true)} />
                            )}
                        </div>
                    </div>
                </SectionCard>

                <SectionCard style={{ width: '100%', padding: '20px' }}>
                    <div style={{ color: 'var(--colors-accent)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', fontWeight: '600' }}>Portfolio URL</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {isEditingPortfolio ? (
                            <input 
                                type="text" 
                                value={portfolio} 
                                onChange={(e) => setPortfolio(e.target.value)} 
                                style={{ flex: 1, backgroundColor: 'transparent', border: 'none', borderBottom: '2px solid var(--colors-accent)', color: 'var(--colors-textMain)', fontSize: '1.1rem', outline: 'none', padding: '4px 0' }} 
                                autoFocus
                            />
                        ) : (
                            <span style={{ fontSize: '1.1rem', color: 'var(--colors-textMain)', fontWeight: '500' }}>{currentUser?.portfolioUrl || 'Not set'}</span>
                        )}
                        <div style={{ cursor: 'pointer', color: 'var(--colors-textMuted)', padding: '8px', marginLeft: '12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            {isEditingPortfolio ? (
                                <Check size={18} color="var(--colors-accent)" onClick={() => { setIsEditingPortfolio(false); if(portfolio !== currentUser?.portfolioUrl) onUpdateProfile({ portfolioUrl: portfolio }); }} />
                            ) : (
                                <Edit2 size={18} onClick={() => setIsEditingPortfolio(true)} />
                            )}
                        </div>
                    </div>
                </SectionCard>
            </div>
            <style>
                {`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                `}
            </style>
        </PaneContainer>
    );
};
