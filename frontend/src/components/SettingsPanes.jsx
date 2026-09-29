import React, { useState, useRef } from 'react';
import { styled, keyframes } from '../stitches.config.js';
import { Key, Lock, MessageSquare, Bell, Monitor, HelpCircle, ChevronLeft, Trash2, Camera, Edit2, Check, Image as ImageIcon, Volume2, EyeOff, Shield, Smartphone, Globe, Sun, Moon, Type, DownloadCloud } from 'lucide-react';
import { techDoodlesSvg, svgToDataUri, wallpaperColors } from '../utils/wallpapers.js';

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
    color: '$textMain'
});

const PaneHeader = styled('div', {
    display: 'flex',
    alignItems: 'center',
    padding: '24px 20px',
    backgroundColor: '$bg',
    gap: '16px',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    borderBottom: '1px solid rgba(255,255,255,0.05)'
});

const HeaderTitle = styled('h2', {
    margin: 0,
    fontSize: '1.2rem',
    color: '$textMain',
    fontWeight: '600',
    letterSpacing: '0.3px'
});

const Section = styled('div', {
    padding: '0 20px 24px',
});

const SectionTitle = styled('h3', {
    margin: '24px 0 12px 12px',
    fontSize: '0.85rem',
    color: '$accent',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
});

const SectionCard = styled('div', {
    backgroundColor: '$surface',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.02)'
});

const SettingRow = styled('div', {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px',
    gap: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    transition: 'background-color 0.2s',
    '&:last-child': {
        borderBottom: 'none'
    },
    variants: {
        clickable: {
            true: {
                cursor: 'pointer',
                '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.02)'
                }
            }
        }
    }
});

const IconWrapper = styled('div', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    flexShrink: 0
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

export const AccountPane = ({ onBack, settings, updateSetting }) => (
    <PaneContainer>
        <PaneHeader>
            <ChevronLeft size={28} style={{ cursor: 'pointer', color: 'var(--colors-textMain)', marginLeft: '-8px' }} onClick={onBack} />
            <HeaderTitle>Account</HeaderTitle>
        </PaneHeader>
        <Section>
            <SectionTitle>Security</SectionTitle>
            <SectionCard>
                <SettingRow>
                    <IconWrapper style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}><Shield size={20}/></IconWrapper>
                    <SettingText>
                        <SettingLabel>Security notifications</SettingLabel>
                        <SettingDescription>Show security notifications on this computer.</SettingDescription>
                    </SettingText>
                    <Toggle checked={settings.securityNotifications} onChange={(e) => updateSetting('securityNotifications', e.target.checked)} />
                </SettingRow>
            </SectionCard>
            
            <SectionTitle>Data</SectionTitle>
            <SectionCard>
                <SettingRow clickable>
                    <IconWrapper style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}><DownloadCloud size={20}/></IconWrapper>
                    <SettingText>
                        <SettingLabel>Request account info</SettingLabel>
                        <SettingDescription>Download your account information and settings.</SettingDescription>
                    </SettingText>
                </SettingRow>
                <SettingRow clickable style={{ color: '#ef4444' }}>
                    <IconWrapper style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><Trash2 size={20}/></IconWrapper>
                    <SettingText>
                        <SettingLabel style={{ color: '#ef4444' }}>Delete my account</SettingLabel>
                        <SettingDescription>Permanently delete your account and all data.</SettingDescription>
                    </SettingText>
                </SettingRow>
            </SectionCard>
        </Section>
    </PaneContainer>
);

export const PrivacyPane = ({ onBack, settings, updateSetting }) => (
    <PaneContainer>
        <PaneHeader>
            <ChevronLeft size={28} style={{ cursor: 'pointer', color: 'var(--colors-textMain)', marginLeft: '-8px' }} onClick={onBack} />
            <HeaderTitle>Privacy</HeaderTitle>
        </PaneHeader>
        <Section>
            <SectionTitle>Visibility</SectionTitle>
            <SectionCard>
                <SettingRow>
                    <IconWrapper style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', color: '#06B6D4' }}><Globe size={20}/></IconWrapper>
                    <SettingText>
                        <SettingLabel>Last seen and online</SettingLabel>
                    </SettingText>
                    <StyledSelect 
                        value={settings.lastSeen} 
                        onChange={(e) => updateSetting('lastSeen', e.target.value)}
                    >
                        <option value="everyone">Everyone</option>
                        <option value="contacts">My Contacts</option>
                        <option value="nobody">Nobody</option>
                    </StyledSelect>
                </SettingRow>
                <SettingRow>
                    <IconWrapper style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)', color: '#EC4899' }}><ImageIcon size={20}/></IconWrapper>
                    <SettingText>
                        <SettingLabel>Profile photo</SettingLabel>
                    </SettingText>
                    <StyledSelect 
                        value={settings.profilePhoto} 
                        onChange={(e) => updateSetting('profilePhoto', e.target.value)}
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
                    <IconWrapper style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}><Check size={20}/></IconWrapper>
                    <SettingText>
                        <SettingLabel>Read receipts</SettingLabel>
                        <SettingDescription>If turned off, you won't send or receive read receipts.</SettingDescription>
                    </SettingText>
                    <Toggle checked={settings.readReceipts} onChange={(e) => updateSetting('readReceipts', e.target.checked)} />
                </SettingRow>
                <SettingRow clickable>
                    <IconWrapper style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}><EyeOff size={20}/></IconWrapper>
                    <SettingText>
                        <SettingLabel>Blocked contacts</SettingLabel>
                        <SettingDescription>0 contacts</SettingDescription>
                    </SettingText>
                </SettingRow>
            </SectionCard>
        </Section>
    </PaneContainer>
);

export const ChatsPane = ({ onBack, settings, updateSetting, getAccessTokenSilently, BACKEND_URL }) => {
    const [isUploading, setIsUploading] = React.useState(false);
    const fileInputRef = React.useRef(null);
    const techDoodlesUri = svgToDataUri(techDoodlesSvg);
    const hasDoodles = settings.wallpaperUrl === techDoodlesUri;

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
        } catch (error) {
            console.error("Error uploading wallpaper:", error);
            alert("Failed to upload wallpaper");
        } finally {
            setIsUploading(false);
        }
    };

    const handleColorClick = (color) => {
        updateSetting('wallpaperBgColor', color);
        updateSetting('wallpaperType', 'solid');
        if (hasDoodles) {
            updateSetting('wallpaperUrl', techDoodlesUri);
        } else {
            updateSetting('wallpaperUrl', '');
        }
    };

    const toggleDoodles = (checked) => {
        if (checked) {
            updateSetting('wallpaperUrl', techDoodlesUri);
            if (!settings.wallpaperBgColor || settings.wallpaperBgColor === 'transparent') {
                updateSetting('wallpaperBgColor', wallpaperColors[0]);
            }
        } else {
            updateSetting('wallpaperUrl', '');
        }
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
                        <IconWrapper style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#A855F7' }}><Moon size={20}/></IconWrapper>
                        <SettingText>
                            <SettingLabel>Theme</SettingLabel>
                        </SettingText>
                        <StyledSelect 
                            value={settings.theme} 
                            onChange={(e) => updateSetting('theme', e.target.value)}
                        >
                            <option value="system">System Default</option>
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
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
                                transition: 'all 0.2s',
                                '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    borderColor: 'var(--colors-accent)'
                                }
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
                        <IconWrapper style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}><Type size={20}/></IconWrapper>
                        <SettingText>
                            <SettingLabel>Enter is send</SettingLabel>
                            <SettingDescription>Enter key will send your message</SettingDescription>
                        </SettingText>
                        <Toggle checked={settings.enterIsSend} onChange={(e) => updateSetting('enterIsSend', e.target.checked)} />
                    </SettingRow>
                </SectionCard>
            </Section>
        </PaneContainer>
    );
};

export const NotificationsPane = ({ onBack, settings, updateSetting }) => (
    <PaneContainer>
        <PaneHeader>
            <ChevronLeft size={28} style={{ cursor: 'pointer', color: 'var(--colors-textMain)', marginLeft: '-8px' }} onClick={onBack} />
            <HeaderTitle>Notifications</HeaderTitle>
        </PaneHeader>
        <Section>
            <SectionTitle>Messages</SectionTitle>
            <SectionCard>
                <SettingRow>
                    <IconWrapper style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', color: '#06B6D4' }}><Bell size={20}/></IconWrapper>
                    <SettingText>
                        <SettingLabel>Message notifications</SettingLabel>
                        <SettingDescription>Show notifications for new messages</SettingDescription>
                    </SettingText>
                    <Toggle checked={settings.messageAlerts} onChange={(e) => updateSetting('messageAlerts', e.target.checked)} />
                </SettingRow>
                <SettingRow>
                    <IconWrapper style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}><Smartphone size={20}/></IconWrapper>
                    <SettingText>
                        <SettingLabel>Show previews</SettingLabel>
                        <SettingDescription>Show message text in new message notifications</SettingDescription>
                    </SettingText>
                    <Toggle checked={settings.showPreviews} onChange={(e) => updateSetting('showPreviews', e.target.checked)} />
                </SettingRow>
                <SettingRow>
                    <IconWrapper style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)', color: '#EC4899' }}><Volume2 size={20}/></IconWrapper>
                    <SettingText>
                        <SettingLabel>Sounds</SettingLabel>
                        <SettingDescription>Play sounds for incoming messages</SettingDescription>
                    </SettingText>
                    <Toggle checked={settings.sounds} onChange={(e) => updateSetting('sounds', e.target.checked)} />
                </SettingRow>
            </SectionCard>
        </Section>
    </PaneContainer>
);

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

export const HelpPane = ({ onBack }) => (
    <PaneContainer>
        <PaneHeader>
            <ChevronLeft size={28} style={{ cursor: 'pointer', color: 'var(--colors-textMain)', marginLeft: '-8px' }} onClick={onBack} />
            <HeaderTitle>Help</HeaderTitle>
        </PaneHeader>
        <Section>
            <SectionCard>
                <SettingRow clickable><IconWrapper style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}><HelpCircle size={20}/></IconWrapper><SettingLabel>Help Centre</SettingLabel></SettingRow>
                <SettingRow clickable><IconWrapper style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}><MessageSquare size={20}/></IconWrapper><SettingLabel>Contact us</SettingLabel></SettingRow>
                <SettingRow clickable><IconWrapper style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}><Shield size={20}/></IconWrapper><SettingLabel>Terms and Privacy Policy</SettingLabel></SettingRow>
                <SettingRow clickable><IconWrapper style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}><Monitor size={20}/></IconWrapper><SettingLabel>Channel guidelines</SettingLabel></SettingRow>
            </SectionCard>
        </Section>
    </PaneContainer>
);

export const ProfilePane = ({ onBack, currentUser, onUpdateProfile, getAccessTokenSilently, BACKEND_URL }) => {
    const [isEditingName, setIsEditingName] = React.useState(false);
    const [name, setName] = React.useState(currentUser?.displayName || '');
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
                        src={currentUser?.avatarUrl || 'https://via.placeholder.com/200'} 
                        alt="Profile" 
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 8px 16px rgba(0,0,0,0.2)', border: '4px solid var(--colors-surface)' }}
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
