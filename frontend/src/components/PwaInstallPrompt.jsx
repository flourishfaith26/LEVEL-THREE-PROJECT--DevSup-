import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Share, PlusSquare, Check } from 'lucide-react';

export default function PwaInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIos, setIsIos] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already running as standalone app
        const isStandaloneApp = window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone === true ||
            document.referrer.includes('android-app://');

        setIsStandalone(isStandaloneApp);
        if (isStandaloneApp) return;

        // Check if user dismissed prompt recently
        const dismissedUntil = localStorage.getItem('devsup_pwa_dismissed_until');
        if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
            return;
        }

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
        setIsIos(isIosDevice);

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // For iOS, show after a delay if not standalone
        if (isIosDevice && !isStandaloneApp) {
            const timer = setTimeout(() => {
                setShowPrompt(true);
            }, 3000);
            return () => clearTimeout(timer);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowPrompt(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Suppress prompt for 7 days
        localStorage.setItem('devsup_pwa_dismissed_until', String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    };

    if (!showPrompt || isStandalone) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 99990,
            maxWidth: '380px',
            width: 'calc(100% - 48px)',
            backgroundColor: '#0F172A',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '16px',
            padding: '16px 20px',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 25px rgba(6, 182, 212, 0.15)',
            backdropFilter: 'blur(12px)',
            color: '#F8FAFC',
            animation: 'devsupSlideUp 0.3s ease-out'
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(6, 182, 212, 0.12)',
                        border: '1px solid rgba(6, 182, 212, 0.25)',
                        color: '#06B6D4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <Download size={18} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#FFF' }}>
                            Install DevSup App
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '2px' }}>
                            Fast desktop & mobile experience with offline sync.
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleDismiss}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748B',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex'
                    }}
                >
                    <X size={16} />
                </button>
            </div>

            {isIos ? (
                <div style={{
                    marginTop: '12px',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    fontSize: '0.78rem',
                    color: '#CBD5E1',
                    lineHeight: '1.4'
                }}>
                    To install on iOS: Tap <Share size={13} style={{ verticalAlign: 'middle', margin: '0 2px' }} /> <b>Share</b> in Safari, then select <PlusSquare size={13} style={{ verticalAlign: 'middle', margin: '0 2px' }} /> <b>Add to Home Screen</b>.
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                    <button
                        type="button"
                        onClick={handleInstallClick}
                        style={{
                            flex: 1,
                            padding: '8px 14px',
                            borderRadius: '8px',
                            backgroundColor: '#06B6D4',
                            color: '#000',
                            border: 'none',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}
                    >
                        <Download size={14} />
                        <span>Install Now</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleDismiss}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            backgroundColor: 'transparent',
                            color: '#94A3B8',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            fontSize: '0.82rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Maybe Later
                    </button>
                </div>
            )}
        </div>
    );
}

