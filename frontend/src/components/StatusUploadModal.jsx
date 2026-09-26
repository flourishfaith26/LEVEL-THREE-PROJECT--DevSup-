import React, { useState, useRef } from 'react';
import { X, Type, Image as ImageIcon, Send, RefreshCw } from 'lucide-react';

const BACKGROUND_COLORS = [
    '#1E2B3C', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', 
    '#2196F3', '#009688', '#4CAF50', '#FF9800', '#FF5722'
];

const StatusUploadModal = ({ onClose, onUpload, BACKEND_URL, getAccessTokenSilently }) => {
    const [mode, setMode] = useState('text'); // 'text' or 'media'
    const [textContext, setTextContext] = useState('');
    const [bgColorIndex, setBgColorIndex] = useState(0);
    
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [mediaCaption, setMediaCaption] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setMediaFile(file);
        
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
                
                await onUpload({
                    type: isVideo ? 'video' : 'image',
                    content: uploadData.fileUrl,
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
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
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
                            fontSize: '2.5rem', textAlign: 'center', width: '80%', height: '50%',
                            resize: 'none', outline: 'none', fontFamily: 'inherit'
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
                                <video src={mediaPreview} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                                <img src={mediaPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            )
                        )}
                    </>
                )}
                
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
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
                bottom: 0, left: 0, width: '100%', boxSizing: 'border-box',
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
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default StatusUploadModal;
