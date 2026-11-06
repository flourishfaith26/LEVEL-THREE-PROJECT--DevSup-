import React, { useState, useRef, useEffect } from 'react';
import { X, Type, Image as ImageIcon, Send, RefreshCw } from 'lucide-react';

const BACKGROUND_COLORS = [
    '#1E2B3C', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', 
    '#2196F3', '#009688', '#4CAF50', '#FF9800', '#FF5722'
];

const StatusUploadModal = ({ onClose, onUpload, BACKEND_URL, getAccessTokenSilently, initialMode = 'text' }) => {
    const [mode, setMode] = useState(initialMode); // 'text' or 'media'
    const [textContext, setTextContext] = useState('');
    const [bgColorIndex, setBgColorIndex] = useState(0);
    
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [mediaCaption, setMediaCaption] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    
    const [videoDuration, setVideoDuration] = useState(0);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(30);

    const fileInputRef = useRef(null);
    const videoRef = useRef(null);

    useEffect(() => {
        if (initialMode === 'media' && !mediaFile) {
            const timer = setTimeout(() => {
                fileInputRef.current?.click();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [initialMode]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setMediaFile(file);
        
        setTrimStart(0);
        setTrimEnd(30);
        setVideoDuration(0);

        const reader = new FileReader();
        reader.onloadend = () => {
            setMediaPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setIsUploading(true);
        try {
            if (mode === 'text') {
                if (!textContext.trim()) return;
                await onUpload({
                    type: 'text',
                    content: textContext,
                    backgroundColor: BACKGROUND_COLORS[bgColorIndex]
                });
            } else if (mode === 'media') {
                if (!mediaFile) return;
                
                // Upload to Cloudinary via backend
                const formData = new FormData();
                formData.append('file', mediaFile);
                
                const token = await getAccessTokenSilently();
                const uploadRes = await fetch(`${BACKEND_URL}/api/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                
                if (!uploadRes.ok) throw new Error('Upload failed');
                const uploadData = await uploadRes.json();
                
                const isVideo = mediaFile.type.startsWith('video/');
                let finalUrl = uploadData.fileUrl;
                
                if (isVideo) {
                    finalUrl = finalUrl.replace('/upload/', `/upload/so_${trimStart.toFixed(1)},eo_${trimEnd.toFixed(1)}/`);
                }
                
                await onUpload({
                    type: isVideo ? 'video' : 'image',
                    content: finalUrl,
                    caption: mediaCaption
                });
            }
            onClose();
        } catch (error) {
            console.error('Failed to create status:', error);
            alert('Failed to upload status');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', minHeight: '100dvh',
            backgroundColor: mode === 'text' ? BACKGROUND_COLORS[bgColorIndex] : '#000', zIndex: 10000,
            display: 'flex', flexDirection: 'column',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {/* Header Controls */}
            <div style={{ 
                display: 'flex', 
                justifyContent: mode === 'media' && mediaPreview ? 'flex-end' : 'space-between', 
                padding: '24px', 
                zIndex: 10, 
                flexShrink: 0,
                position: mode === 'media' && mediaPreview ? 'absolute' : 'relative',
                width: '100%', boxSizing: 'border-box'
            }}>
                {!(mode === 'media' && mediaPreview) && (
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button 
                            type="button"
                            style={{ backgroundColor: mode === 'text' ? 'rgba(255,255,255,0.2)' : 'transparent', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => setMode('text')}
                        >
                            <Type size={24} />
                        </button>
                        <button 
                            type="button"
                            style={{ backgroundColor: mode === 'media' ? 'rgba(255,255,255,0.2)' : 'transparent', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => { setMode('media'); fileInputRef.current?.click(); }}
                        >
                            <ImageIcon size={24} />
                        </button>
                        
                        {mode === 'text' && (
                            <button 
                                type="button"
                                style={{ color: '#fff', backgroundColor: 'transparent', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                                onClick={() => setBgColorIndex((prev) => (prev + 1) % BACKGROUND_COLORS.length)}
                                title="Change Background Color"
                            >
                                <RefreshCw size={24} />
                            </button>
                        )}
                    </div>
                )}
                <button type="button" onClick={onClose} style={{ color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                    <X size={28} />
                </button>
            </div>

            {/* Main Area */}
            <div style={{
                flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center',
                backgroundColor: 'transparent',
                transition: 'background-color 0.3s ease',
                position: mode === 'media' && mediaPreview ? 'absolute' : 'relative',
                top: 0, left: 0, width: '100%', height: '100%',
                minHeight: 0,
                overflow: 'hidden',
                zIndex: 1
            }}>
                {mode === 'text' ? (
                    <textarea 
                        value={textContext}
                        onChange={(e) => setTextContext(e.target.value)}
                        placeholder="Type a status..."
                        autoFocus
                        style={{
                            background: 'transparent', border: 'none', color: '#fff',
                            fontSize: textContext.length > 150 ? '1.25rem' : textContext.length > 70 ? '1.75rem' : '2.5rem', 
                            textAlign: 'center', 
                            width: 'calc(100% - 32px)', 
                            maxWidth: '700px',
                            height: '60%',
                            padding: '0 16px',
                            boxSizing: 'border-box',
                            resize: 'none', 
                            outline: 'none', 
                            fontFamily: 'inherit',
                            transition: 'font-size 0.2s ease'
                        }}
                    />
                ) : (
                    <>
                        {!mediaPreview && (
                            <div 
                                style={{ color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <ImageIcon size={64} />
                                <span>Click to select an image or video</span>
                            </div>
                        )}
                        {mediaPreview && (
                            mediaFile?.type?.startsWith('video/') ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%', padding: '20px', paddingBottom: '120px', boxSizing: 'border-box', justifyContent: 'center' }}>
                                    <video 
                                        src={mediaPreview} 
                                        ref={videoRef}
                                        controls 
                                        style={{ maxWidth: '100%', flex: 1, minHeight: 0, width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: '8px' }}
                                        onLoadedMetadata={(e) => {
                                            const duration = e.target.duration;
                                            setVideoDuration(duration);
                                            setTrimEnd(Math.min(30, duration));
                                        }}
                                        onTimeUpdate={(e) => {
                                            if (e.target.currentTime < trimStart || e.target.currentTime > trimEnd) {
                                                e.target.currentTime = trimStart;
                                                e.target.pause();
                                            }
                                        }}
                                    />
                                    <div style={{ width: '90%', maxWidth: '500px', marginTop: '16px', padding: '16px', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 10 }}>
                                        <div style={{ color: 'white', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', fontWeight: '500' }}>
                                            <span>Trim Video (Max 30s)</span>
                                            <span>Duration: {(trimEnd - trimStart).toFixed(1)}s</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ color: '#aaa', fontSize: '0.8rem', width: '35px', textAlign: 'right' }}>{trimStart.toFixed(1)}s</span>
                                            <div style={{ flex: 1, position: 'relative', height: '24px', display: 'flex', alignItems: 'center' }}>
                                                {/* Track background */}
                                                <div style={{ position: 'absolute', width: '100%', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', zIndex: 1 }} />
                                                {/* Active Range */}
                                                <div style={{ 
                                                    position: 'absolute', height: '6px', background: 'var(--colors-accent, #00C853)', borderRadius: '3px', zIndex: 2,
                                                    left: `${(trimStart / videoDuration) * 100}%`,
                                                    width: `${((trimEnd - trimStart) / videoDuration) * 100}%`
                                                }} />
                                                {/* Start Thumb Input */}
                                                <input 
                                                    type="range" 
                                                    className="dual-thumb"
                                                    min="0" max={videoDuration} step="0.1"
                                                    value={trimStart} 
                                                    onChange={(e) => {
                                                        let val = parseFloat(e.target.value);
                                                        if (val > trimEnd - 1) val = trimEnd - 1; 
                                                        if (trimEnd - val > 30) val = trimEnd - 30; 
                                                        setTrimStart(val);
                                                        if (videoRef.current) videoRef.current.currentTime = val;
                                                    }}
                                                    style={{ position: 'absolute', width: '100%', zIndex: 3, margin: 0, padding: 0 }}
                                                />
                                                {/* End Thumb Input */}
                                                <input 
                                                    type="range" 
                                                    className="dual-thumb"
                                                    min="0" max={videoDuration} step="0.1"
                                                    value={trimEnd} 
                                                    onChange={(e) => {
                                                        let val = parseFloat(e.target.value);
                                                        if (val < trimStart + 1) val = trimStart + 1;
                                                        if (val - trimStart > 30) val = trimStart + 30;
                                                        setTrimEnd(val);
                                                        if (videoRef.current) videoRef.current.currentTime = val - 1;
                                                    }}
                                                    style={{ position: 'absolute', width: '100%', zIndex: 4, margin: 0, padding: 0 }}
                                                />
                                            </div>
                                            <span style={{ color: '#aaa', fontSize: '0.8rem', width: '35px' }}>{trimEnd.toFixed(1)}s</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <img src={mediaPreview} alt="preview" style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain' }} />
                            )
                        )}
                    </>
                )}
                
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ opacity: 0, position: 'absolute', zIndex: -1 }} 
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                />
            </div>

            {/* Footer / Send Button */}
            <div style={{ 
                padding: '24px', display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                backgroundColor: mode === 'media' && mediaPreview ? 'transparent' : 'transparent',
                background: mode === 'media' && mediaPreview ? 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)' : 'none',
                position: mode === 'media' && mediaPreview ? 'absolute' : 'relative',
                bottom: mode === 'media' && mediaPreview ? '0' : 'auto', left: 0, width: '100%', boxSizing: 'border-box',
                zIndex: 10
            }}>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: mode === 'media' && mediaPreview ? 'center' : 'flex-end', 
                    alignItems: 'center', 
                    gap: '16px', 
                    width: '100%', 
                    maxWidth: '700px'
                }}>
                    {mode === 'media' && mediaPreview && (
                        <input 
                            type="text" 
                            placeholder="Add a caption..." 
                            value={mediaCaption}
                            onChange={(e) => setMediaCaption(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !isUploading) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            style={{
                                flex: 1,
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                borderRadius: '24px',
                                color: '#fff',
                                padding: '16px 24px',
                                fontSize: '1.1rem',
                                outline: 'none',
                                backdropFilter: 'blur(10px)'
                            }}
                        />
                    )}
                    <button 
                        type="button"
                        onClick={handleSubmit}
                        disabled={isUploading || (mode === 'text' && !textContext.trim()) || (mode === 'media' && !mediaFile)}
                        style={{
                            backgroundColor: 'var(--colors-accent, #00C853)',
                            color: '#fff', border: 'none', borderRadius: '50%',
                            width: '56px', height: '56px', display: 'flex', justifyContent: 'center', alignItems: 'center',
                            cursor: isUploading ? 'not-allowed' : 'pointer',
                            opacity: (mode === 'text' && !textContext.trim()) || (mode === 'media' && !mediaFile) ? 0.5 : 1,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            flexShrink: 0
                        }}
                    >
                        {isUploading ? <RefreshCw size={24} className="spin" /> : <Send size={24} style={{ marginLeft: '4px' }} />}
                    </button>
                </div>
            </div>
            
            <style>{`
                .dual-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    background: transparent;
                    pointer-events: none;
                }
                .dual-thumb::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    pointer-events: auto;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: #fff;
                    cursor: pointer;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                    border: 3px solid var(--colors-accent, #00C853);
                    position: relative;
                    z-index: 5;
                }
                .dual-thumb::-moz-range-thumb {
                    pointer-events: auto;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #fff;
                    cursor: pointer;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                    border: 3px solid var(--colors-accent, #00C853);
                    position: relative;
                    z-index: 5;
                }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default StatusUploadModal;
