import { useState, useRef, useEffect } from 'react';
import { 
    LayoutTemplate, Square, Type, Image as ImageIcon, Video, Box, Minus, 
    Link, Navigation, PanelTop, List, CheckSquare, CircleDot, ChevronDown, 
    Calendar, UploadCloud, Map, BarChart, Table, CreditCard, Monitor, 
    Share2, PanelLeft, ToggleRight, User as UserIcon, Upload, Play, Check,
    Server, Database, Cpu, Cloud, Layers, Smartphone, Globe, Shield, Activity
} from 'lucide-react';

// === 1. Real Interactive Heading ===
export const RealHeading = ({ el, onUpdate, isEditing, setIsEditing }) => {
    const [localText, setLocalText] = useState(el.text || 'Heading Title');
    const inputRef = useRef(null);

    useEffect(() => {
        setLocalText(el.text || 'Heading Title');
    }, [el.text]);

    const handleBlur = () => {
        setIsEditing(false);
        if (localText !== el.text) {
            onUpdate({ text: localText });
        }
    };

    const handleKeyDown = (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') handleBlur();
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                autoFocus
                value={localText}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onChange={(e) => setLocalText(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                style={{
                    width: '100%',
                    height: '100%',
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '2px solid #06b6d4',
                    color: el.textColor || '#F8FAFC',
                    fontSize: `${el.fontSize || 24}px`,
                    fontWeight: el.fontWeight || '700',
                    outline: 'none',
                    padding: '0 6px',
                    fontFamily: 'inherit',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                }}
            />
        );
    }

    return (
        <div
            onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
            }}
            title="Double click to edit text"
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                color: el.textColor || '#F8FAFC',
                fontSize: `${el.fontSize || 24}px`,
                fontWeight: el.fontWeight || '700',
                padding: '0 4px',
                userSelect: 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textAlign: el.textAlign || 'left',
                justifyContent: el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'flex-end' : 'flex-start'
            }}
        >
            {el.text || 'Heading Title'}
        </div>
    );
};

// === 2. Real Interactive Paragraph ===
export const RealParagraph = ({ el, onUpdate, isEditing, setIsEditing }) => {
    const [localText, setLocalText] = useState(el.text || 'Enter your body text here...');

    useEffect(() => {
        setLocalText(el.text || 'Enter your body text here...');
    }, [el.text]);

    const handleBlur = () => {
        setIsEditing(false);
        if (localText !== el.text) {
            onUpdate({ text: localText });
        }
    };

    if (isEditing) {
        return (
            <textarea
                autoFocus
                value={localText}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                onChange={(e) => setLocalText(e.target.value)}
                onBlur={handleBlur}
                style={{
                    width: '100%',
                    height: '100%',
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '2px solid #06b6d4',
                    color: el.textColor || '#94A3B8',
                    fontSize: `${el.fontSize || 14}px`,
                    outline: 'none',
                    padding: '6px',
                    fontFamily: 'inherit',
                    borderRadius: '4px',
                    resize: 'none',
                    boxSizing: 'border-box'
                }}
            />
        );
    }

    return (
        <div
            onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
            }}
            title="Double click to edit text"
            style={{
                width: '100%',
                height: '100%',
                color: el.textColor || '#94A3B8',
                fontSize: `${el.fontSize || 14}px`,
                lineHeight: '1.5',
                padding: '4px',
                userSelect: 'none',
                overflow: 'hidden',
                whiteSpace: 'pre-wrap',
                textAlign: el.textAlign || 'left'
            }}
        >
            {el.text || 'Enter your body text here. Double-click to edit.'}
        </div>
    );
};

// === 3. Real Interactive Button ===
export const RealButton = ({ el, onUpdate, isEditing, setIsEditing }) => {
    const [localText, setLocalText] = useState(el.text || 'Button');

    useEffect(() => {
        setLocalText(el.text || 'Button');
    }, [el.text]);

    const handleBlur = () => {
        setIsEditing(false);
        if (localText !== el.text) {
            onUpdate({ text: localText });
        }
    };

    if (isEditing) {
        return (
            <input
                autoFocus
                value={localText}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onChange={(e) => setLocalText(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') handleBlur();
                }}
                style={{
                    width: '100%',
                    height: '100%',
                    background: el.bgColor || '#06B6D4',
                    border: '2px solid #FFFFFF',
                    color: el.textColor || '#0B0F19',
                    fontSize: `${el.fontSize || 14}px`,
                    fontWeight: el.fontWeight || '600',
                    textAlign: 'center',
                    outline: 'none',
                    borderRadius: `${el.borderRadius ?? 8}px`,
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                }}
            />
        );
    }

    return (
        <button
            type="button"
            onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
            }}
            title="Double click to edit button label"
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: el.bgColor || '#06B6D4',
                color: el.textColor || '#0B0F19',
                borderRadius: `${el.borderRadius ?? 8}px`,
                border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor || '#334155'}` : 'none',
                fontSize: `${el.fontSize || 14}px`,
                fontWeight: el.fontWeight || '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 16px',
                cursor: 'pointer',
                boxShadow: el.shadow || '0 2px 8px rgba(0,0,0,0.2)',
                userSelect: 'none',
                transition: 'transform 0.1s ease',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
            }}
        >
            {el.text || 'Button'}
        </button>
    );
};

// === 4. Real Input Field ===
export const RealInput = ({ el, onUpdate, isEditing, setIsEditing }) => {
    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
            <input
                type="text"
                placeholder={el.placeholder || 'Type here...'}
                defaultValue={el.text || ''}
                onChange={(e) => onUpdate({ text: e.target.value })}
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: el.bgColor || '#0F172A',
                    color: el.textColor || '#F8FAFC',
                    border: `${el.borderWidth ?? 1}px solid ${el.borderColor || '#334155'}`,
                    borderRadius: `${el.borderRadius ?? 6}px`,
                    padding: '0 12px',
                    fontSize: `${el.fontSize || 14}px`,
                    outline: 'none',
                    fontFamily: 'inherit'
                }}
            />
        </div>
    );
};

// === 5. Real Textarea ===
export const RealTextarea = ({ el, onUpdate }) => {
    return (
        <textarea
            placeholder={el.placeholder || 'Write multiple lines...'}
            defaultValue={el.text || ''}
            onChange={(e) => onUpdate({ text: e.target.value })}
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: el.bgColor || '#0F172A',
                color: el.textColor || '#F8FAFC',
                border: `${el.borderWidth ?? 1}px solid ${el.borderColor || '#334155'}`,
                borderRadius: `${el.borderRadius ?? 6}px`,
                padding: '10px 12px',
                fontSize: `${el.fontSize || 14}px`,
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'none'
            }}
        />
    );
};

// === 6. Real Badge / Pill ===
export const RealBadge = ({ el, onUpdate, isEditing, setIsEditing }) => {
    const [localText, setLocalText] = useState(el.text || 'Badge');

    useEffect(() => {
        setLocalText(el.text || 'Badge');
    }, [el.text]);

    const handleBlur = () => {
        setIsEditing(false);
        if (localText !== el.text) onUpdate({ text: localText });
    };

    if (isEditing) {
        return (
            <input
                autoFocus
                value={localText}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onChange={(e) => setLocalText(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') handleBlur();
                }}
                style={{
                    width: '100%',
                    height: '100%',
                    background: el.bgColor || 'rgba(6, 182, 212, 0.15)',
                    color: el.textColor || '#06B6D4',
                    border: '2px solid #06b6d4',
                    borderRadius: '999px',
                    textAlign: 'center',
                    fontSize: `${el.fontSize || 12}px`,
                    fontWeight: '600',
                    outline: 'none',
                    boxSizing: 'border-box'
                }}
            />
        );
    }

    return (
        <div
            onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
            }}
            title="Double click to edit badge"
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: el.bgColor || 'rgba(6, 182, 212, 0.15)',
                color: el.textColor || '#06B6D4',
                border: `${el.borderWidth ?? 1}px solid ${el.borderColor || '#06B6D4'}`,
                borderRadius: `${el.borderRadius ?? 999}px`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: `${el.fontSize || 12}px`,
                fontWeight: el.fontWeight || '600',
                padding: '0 10px',
                userSelect: 'none',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
            }}
        >
            {el.text || 'Badge'}
        </div>
    );
};

// === 7. Real Container Box / Card ===
export const RealContainer = ({ el }) => {
    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: el.bgColor || '#1E293B',
                border: `${el.borderWidth ?? 1}px solid ${el.borderColor || '#334155'}`,
                borderRadius: `${el.borderRadius ?? 12}px`,
                boxShadow: el.shadow || '0 10px 25px rgba(0, 0, 0, 0.3)',
                boxSizing: 'border-box'
            }}
        />
    );
};

// === 8. Real Navigation Bar ===
export const RealNavbar = ({ el, onUpdate }) => {
    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: el.bgColor || '#1E293B',
                borderBottom: `${el.borderWidth ?? 1}px solid ${el.borderColor || '#334155'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                color: el.textColor || '#F8FAFC',
                borderRadius: `${el.borderRadius ?? 8}px`,
                boxSizing: 'border-box'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '1rem', color: '#06B6D4' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#06B6D4' }}></div>
                <span>{el.brandText || 'DevSup'}</span>
            </div>
            <div style={{ display: 'flex', gap: '20px', fontSize: '0.86rem', color: '#94A3B8' }}>
                <span>Features</span>
                <span>Pricing</span>
                <span>Docs</span>
            </div>
            <button type="button" style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#06B6D4', color: '#0B0F19', fontWeight: '600', fontSize: '0.8rem' }}>
                Launch
            </button>
        </div>
    );
};

// === 9. Real Functional Image Component (Supports Upload, URL, Replace) ===
export const RealImage = ({ el, onUpdate }) => {
    const fileInputRef = useRef(null);
    const clickCountRef = useRef(0);
    const clickTimerRef = useRef(null);

    const handleTripleClick = (e) => {
        clickCountRef.current += 1;
        if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

        if (clickCountRef.current >= 3 || (e.detail && e.detail >= 3)) {
            clickCountRef.current = 0;
            fileInputRef.current?.click();
        } else {
            clickTimerRef.current = setTimeout(() => {
                clickCountRef.current = 0;
            }, 600);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            onUpdate({ src: event.target?.result, name: file.name });
        };
        reader.readAsDataURL(file);
    };

    if (el.src) {
        return (
            <div 
                onClick={handleTripleClick}
                title="Triple-click (3 clicks) to replace image"
                style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', borderRadius: `${el.borderRadius ?? 8}px` }}
            >
                <img
                    src={el.src}
                    alt={el.name || 'Imported asset'}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: el.fit || 'cover',
                        display: 'block',
                        pointerEvents: 'none'
                    }}
                />
                <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
            </div>
        );
    }

    return (
        <div
            onClick={handleTripleClick}
            title="Click 3 times to import image"
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: el.bgColor || '#1E293B',
                border: '2px dashed #475569',
                borderRadius: `${el.borderRadius ?? 8}px`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '12px',
                textAlign: 'center',
                userSelect: 'none'
            }}
        >
            <ImageIcon size={32} color="#06B6D4" />
            <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#E2E8F0' }}>Triple-click to Import Image</span>
            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Click 3 times to browse files (PNG, JPG, SVG, WebP)</span>
            <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
        </div>
    );
};

// === 10. Real Functional Video Player Component ===
export const RealVideo = ({ el, onUpdate }) => {
    const fileInputRef = useRef(null);
    const clickCountRef = useRef(0);
    const clickTimerRef = useRef(null);

    const handleTripleClick = (e) => {
        clickCountRef.current += 1;
        if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

        if (clickCountRef.current >= 3 || (e.detail && e.detail >= 3)) {
            clickCountRef.current = 0;
            fileInputRef.current?.click();
        } else {
            clickTimerRef.current = setTimeout(() => {
                clickCountRef.current = 0;
            }, 600);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            onUpdate({ src: event.target?.result, name: file.name });
        };
        reader.readAsDataURL(file);
    };

    if (el.src) {
        return (
            <div 
                onClick={handleTripleClick}
                title="Triple-click (3 clicks) to replace video"
                style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', borderRadius: `${el.borderRadius ?? 8}px`, backgroundColor: '#000000' }}
            >
                <video
                    src={el.src}
                    controls
                    playsInline
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        display: 'block'
                    }}
                />
                <input
                    type="file"
                    ref={fileInputRef}
                    accept="video/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
            </div>
        );
    }

    return (
        <div
            onClick={handleTripleClick}
            title="Click 3 times to import video"
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#0F172A',
                border: '2px dashed #06B6D4',
                borderRadius: `${el.borderRadius ?? 8}px`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '12px',
                textAlign: 'center',
                userSelect: 'none'
            }}
        >
            <Video size={36} color="#06B6D4" />
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#E2E8F0' }}>Triple-click to Import Video</span>
            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Click 3 times to browse files (MP4, WebM, MOV)</span>
            <input
                type="file"
                ref={fileInputRef}
                accept="video/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
        </div>
    );
};

// === 11. Real Toggle Switch ===
export const RealSwitch = ({ el, onUpdate }) => {
    const isChecked = el.checked ?? true;
    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onUpdate({ checked: !isChecked });
            }}
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                userSelect: 'none'
            }}
            title={isChecked ? "Toggle Switch: On" : "Toggle Switch: Off"}
        >
            <div
                style={{
                    width: '46px',
                    height: '24px',
                    borderRadius: '12px',
                    backgroundColor: isChecked ? (el.bgColor || '#06B6D4') : '#334155',
                    position: 'relative',
                    transition: 'background-color 0.2s ease',
                    flexShrink: 0,
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)'
                }}
            >
                <div
                    style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: '#FFFFFF',
                        position: 'absolute',
                        top: '3px',
                        left: isChecked ? '25px' : '3px',
                        transition: 'left 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
                    }}
                />
            </div>
        </div>
    );
};

// === 12. Real Checkbox ===
export const RealCheckbox = ({ el, onUpdate }) => {
    const isChecked = el.checked ?? false;
    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onUpdate({ checked: !isChecked });
            }}
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                userSelect: 'none'
            }}
            title={isChecked ? "Checkbox: Checked" : "Checkbox: Unchecked"}
        >
            <div
                style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '5px',
                    backgroundColor: isChecked ? (el.bgColor || '#06B6D4') : '#1E293B',
                    border: `2px solid ${isChecked ? (el.bgColor || '#06B6D4') : '#475569'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0B0F19',
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                }}
            >
                {isChecked && <Check size={16} strokeWidth={3} />}
            </div>
        </div>
    );
};

// === 13. Real Avatar ===
export const RealAvatar = ({ el, onUpdate }) => {
    if (el.src) {
        return (
            <img
                src={el.src}
                alt={el.text || 'User'}
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover'
                }}
            />
        );
    }
    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                backgroundColor: el.bgColor || '#3B82F6',
                color: el.textColor || '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: `${Math.round(el.w * 0.4)}px`,
                userSelect: 'none',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
            }}
        >
            {el.text || 'UX'}
        </div>
    );
};

// === 14. Real Divider ===
export const RealDivider = ({ el }) => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '100%', height: `${el.borderWidth || 1}px`, backgroundColor: el.borderColor || '#334155' }} />
    </div>
);

// === 15. Real Dropdown / Select ===
export const RealDropdown = ({ el, onUpdate }) => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
        <select
            defaultValue={el.text || 'Option 1'}
            onChange={(e) => onUpdate({ text: e.target.value })}
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: el.bgColor || '#0F172A',
                color: el.textColor || '#F8FAFC',
                border: `${el.borderWidth ?? 1}px solid ${el.borderColor || '#334155'}`,
                borderRadius: `${el.borderRadius ?? 6}px`,
                padding: '0 10px',
                fontSize: `${el.fontSize || 14}px`,
                outline: 'none',
                fontFamily: 'inherit',
                cursor: 'pointer'
            }}
        >
            <option value="Option 1">Option 1</option>
            <option value="Option 2">Option 2</option>
            <option value="Option 3">Option 3</option>
        </select>
    </div>
);

// === 16. Real Card with Content ===
export const RealInfoCard = ({ el, onUpdate }) => (
    <div
        style={{
            width: '100%',
            height: '100%',
            backgroundColor: el.bgColor || '#1E293B',
            border: `${el.borderWidth ?? 1}px solid ${el.borderColor || '#334155'}`,
            borderRadius: `${el.borderRadius ?? 12}px`,
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
            boxSizing: 'border-box'
        }}
    >
        <div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '6px' }}>
                {el.title || 'Product Feature'}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#94A3B8', lineHeight: '1.4' }}>
                {el.text || 'Detailed design specifications and interactive mock-up description.'}
            </div>
        </div>
        <button
            type="button"
            style={{
                padding: '8px 14px',
                borderRadius: '6px',
                backgroundColor: '#06B6D4',
                color: '#0B0F19',
                border: 'none',
                fontWeight: '600',
                fontSize: '0.82rem',
                alignSelf: 'flex-start',
                cursor: 'pointer'
            }}
        >
            Learn More
        </button>
    </div>
);

// === Architecture & Systems Components ===
export const RealArchService = ({ el }) => (
    <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#161b22',
        border: '2px solid #38bdf8',
        borderRadius: '10px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#f0f6fc',
        boxShadow: '0 8px 24px rgba(56, 189, 248, 0.15)'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server size={18} color="#38bdf8" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{el.text || 'API Service'}</span>
            </div>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 6px #10b981' }} />
        </div>
        <div style={{ fontSize: '0.74rem', color: '#8b949e', fontFamily: 'monospace' }}>
            PORT {el.port || ':5000'} • Node/Go
        </div>
    </div>
);

export const RealArchDatabase = ({ el }) => (
    <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#161b22',
        border: '2px solid #a855f7',
        borderRadius: '10px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#f0f6fc',
        boxShadow: '0 8px 24px rgba(168, 85, 247, 0.15)'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={18} color="#a855f7" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{el.text || 'PostgreSQL DB'}</span>
            </div>
            <span style={{ fontSize: '0.68rem', backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', padding: '2px 6px', borderRadius: '4px' }}>SQL</span>
        </div>
        <div style={{ fontSize: '0.74rem', color: '#8b949e', fontFamily: 'monospace' }}>
            cluster.primary:5432
        </div>
    </div>
);

export const RealArchCache = ({ el }) => (
    <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#161b22',
        border: '2px solid #ef4444',
        borderRadius: '10px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#f0f6fc',
        boxShadow: '0 8px 24px rgba(239, 68, 68, 0.15)'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} color="#ef4444" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{el.text || 'Redis Cache'}</span>
        </div>
        <div style={{ fontSize: '0.74rem', color: '#8b949e', fontFamily: 'monospace' }}>
            In-Memory • :6379
        </div>
    </div>
);

export const RealArchQueue = ({ el }) => (
    <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#161b22',
        border: '2px solid #f59e0b',
        borderRadius: '10px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#f0f6fc',
        boxShadow: '0 8px 24px rgba(245, 158, 11, 0.15)'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="#f59e0b" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{el.text || 'Kafka / RabbitMQ'}</span>
        </div>
        <div style={{ fontSize: '0.74rem', color: '#8b949e', fontFamily: 'monospace' }}>
            Event Stream Pipeline
        </div>
    </div>
);

export const RealArchCloud = ({ el }) => (
    <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(30, 41, 59, 0.3)',
        border: '2px dashed #64748b',
        borderRadius: '14px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        color: '#94a3b8'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cloud size={18} color="#64748b" />
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{el.text || 'Kubernetes / VPC Cluster'}</span>
        </div>
    </div>
);

export const RealArchClient = ({ el }) => (
    <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#161b22',
        border: '2px solid #10b981',
        borderRadius: '10px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#f0f6fc',
        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.15)'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} color="#10b981" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{el.text || 'Web App Client'}</span>
        </div>
        <div style={{ fontSize: '0.74rem', color: '#8b949e' }}>
            Next.js / React SPA
        </div>
    </div>
);

// === Element Categories for Sidebar ===
export const MOCKUP_CATEGORIES = [
    {
        id: 'architecture',
        title: 'System Architecture',
        items: ['archService', 'archDatabase', 'archCache', 'archQueue', 'archCloud', 'archClient']
    },
    {
        id: 'media',
        title: 'Media & Assets',
        items: ['imageBlock', 'videoEmbed', 'avatar']
    },
    {
        id: 'basic',
        title: 'Text & Typography',
        items: ['heading', 'paragraph', 'badge']
    },
    {
        id: 'actions',
        title: 'Buttons & Controls',
        items: ['button', 'switch', 'checkbox', 'dropdown']
    },
    {
        id: 'forms',
        title: 'Form Inputs',
        items: ['textInput', 'textarea']
    },
    {
        id: 'layout',
        title: 'Layout & Navigation',
        items: ['container', 'navbar', 'infoCard', 'divider']
    }
];

// === Element Registry with Default Dimensions & Icons ===
export const MOCKUP_TYPES = {
    // Architecture
    archService: { component: RealArchService, label: 'API Microservice', defaultW: 240, defaultH: 80, icon: Server },
    archDatabase: { component: RealArchDatabase, label: 'Database Cluster', defaultW: 240, defaultH: 80, icon: Database },
    archCache: { component: RealArchCache, label: 'Redis Cache', defaultW: 220, defaultH: 75, icon: Cpu },
    archQueue: { component: RealArchQueue, label: 'Message Queue', defaultW: 230, defaultH: 75, icon: Layers },
    archCloud: { component: RealArchCloud, label: 'Cloud / VPC Boundary', defaultW: 480, defaultH: 320, icon: Cloud },
    archClient: { component: RealArchClient, label: 'Client / Frontend', defaultW: 220, defaultH: 75, icon: Globe },

    // Media
    imageBlock: { component: RealImage, label: 'Image Asset', defaultW: 240, defaultH: 180, icon: ImageIcon },
    videoEmbed: { component: RealVideo, label: 'Video Player', defaultW: 340, defaultH: 200, icon: Video },
    avatar: { component: RealAvatar, label: 'User Avatar', defaultW: 50, defaultH: 50, icon: UserIcon },

    // Typography
    heading: { component: RealHeading, label: 'Heading Text', defaultW: 260, defaultH: 42, icon: Type },
    paragraph: { component: RealParagraph, label: 'Body Paragraph', defaultW: 280, defaultH: 80, icon: Type },
    badge: { component: RealBadge, label: 'Pill Badge', defaultW: 110, defaultH: 30, icon: Square },

    // Actions & Controls
    button: { component: RealButton, label: 'Button', defaultW: 140, defaultH: 44, icon: Square },
    switch: { component: RealSwitch, label: 'Toggle Switch', defaultW: 56, defaultH: 32, icon: ToggleRight },
    checkbox: { component: RealCheckbox, label: 'Checkbox', defaultW: 34, defaultH: 34, icon: CheckSquare },
    dropdown: { component: RealDropdown, label: 'Dropdown Select', defaultW: 180, defaultH: 40, icon: ChevronDown },

    // Forms
    textInput: { component: RealInput, label: 'Text Input', defaultW: 240, defaultH: 42, icon: Type },
    textarea: { component: RealTextarea, label: 'Textarea Field', defaultW: 260, defaultH: 90, icon: Type },

    // Layout
    container: { component: RealContainer, label: 'Card Container', defaultW: 320, defaultH: 220, icon: Box },
    navbar: { component: RealNavbar, label: 'Navigation Bar', defaultW: 550, defaultH: 54, icon: PanelTop },
    infoCard: { component: RealInfoCard, label: 'Content Card', defaultW: 260, defaultH: 160, icon: CreditCard },
    divider: { component: RealDivider, label: 'Horizontal Line', defaultW: 300, defaultH: 16, icon: Minus },
};
