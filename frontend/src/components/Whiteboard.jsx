import { useRef, useState, useEffect } from 'react';
import { styled } from '../stitches.config.js';
import { 
    X, Brush, Eraser, Trash2, Undo2, Redo2, ChevronDown, ChevronRight, 
    Square, ArrowUpToLine, ArrowDownToLine, Send, Lock, Unlock, 
    Image as ImageIcon, Video as VideoIcon, Copy, Plus, Minus, Type
} from 'lucide-react';
import { MOCKUP_TYPES, MOCKUP_CATEGORIES } from './MockupComponents';
import html2canvas from 'html2canvas';

const WhiteboardOverlay = styled('div', {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    variants: {
        embedded: {
            true: {
                position: 'relative',
                zIndex: 1,
                backgroundColor: 'transparent',
                flex: 1,
                height: '100%',
                width: '100%',
            }
        }
    }
});

const Toolbar = styled('div', {
    height: '60px',
    backgroundColor: '$surface',
    borderBottom: '1px solid $border',
    display: 'flex',
    alignItems: 'center',
    padding: '0 $4',
    gap: '$3',
    justifyContent: 'space-between',
});

const ToolsGroup = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '$2',
});

const IconButton = styled('button', {
    background: 'none',
    border: 'none',
    color: '$textMuted',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '$1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    '&:hover': {
        backgroundColor: '$bg',
        color: '$textMain',
    },
    '&:disabled': {
        opacity: 0.5,
        cursor: 'not-allowed',
    },
    variants: {
        active: {
            true: {
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                color: '$accent',
            }
        },
        danger: {
            true: {
                '&:hover': {
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '$danger',
                }
            }
        }
    }
});

const ColorPickerContainer = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.8rem',
    color: '$textMuted'
});

const ColorPicker = styled('input', {
    width: '32px',
    height: '32px',
    padding: '0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    background: 'transparent',
    '&::-webkit-color-swatch-wrapper': {
        padding: 0,
    },
    '&::-webkit-color-swatch': {
        border: '2px solid $border',
        borderRadius: '4px',
    }
});

const SizeInput = styled('input', {
    width: '80px',
});

const MainArea = styled('div', {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    '@media (max-width: 768px)': {
        flexDirection: 'column-reverse',
    }
});

const Sidebar = styled('div', {
    width: '200px',
    backgroundColor: '$surface',
    borderRight: '1px solid $border',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    gap: '12px',
    overflowY: 'auto',
    '@media (max-width: 768px)': {
        width: '100%',
        flexDirection: 'row',
        height: 'auto',
        maxHeight: '120px',
        overflowX: 'auto',
        overflowY: 'hidden',
        borderRight: 'none',
        borderTop: '1px solid $border',
    }
});

const SidebarItem = styled('div', {
    padding: '12px',
    backgroundColor: '$bg',
    border: '1px solid $border',
    borderRadius: '4px',
    cursor: 'grab',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.9rem',
    color: '$textMain',
    '&:active': {
        cursor: 'grabbing',
    }
});

const CanvasContainer = styled('div', {
    flex: 1,
    position: 'relative',
    overflow: 'auto',
    cursor: 'crosshair',
});

const CanvasInner = styled('div', {
    position: 'relative',
    width: '4000px',
    height: '4000px',
});


export default function Whiteboard({ socket, conversationId, mongoUserId, onClose, onSendToChat, embedded = false }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    
    const canEditElement = (el) => {
        if (!el.ownerId) return true;
        if (el.ownerId === mongoUserId) return true;
        return el.allowOthersToEdit;
    };
    
    const [color, setColor] = useState('#06B6D4');
    const [bgColor, setBgColor] = useState('transparent');
    const [size, setSize] = useState(2);
    const [tool, setTool] = useState('pencil'); // 'pencil' or 'eraser'
    const [isSendingToChat, setIsSendingToChat] = useState(false);
    
    const [history, setHistory] = useState([]);
    const [historyStep, setHistoryStep] = useState(-1);

    const [droppedElements, setDroppedElements] = useState(() => {
        try {
            const saved = localStorage.getItem(`whiteboard_elements_${conversationId}`);
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error(e);
        }
        return [];
    });
    
    useEffect(() => {
        localStorage.setItem(`whiteboard_elements_${conversationId}`, JSON.stringify(droppedElements));
    }, [droppedElements, conversationId]);
    const [draggedItem, setDraggedItem] = useState(null);
    const [draggingElementId, setDraggingElementId] = useState(null);
    
    const [resizingElementId, setResizingElementId] = useState(null);
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });

    const [expandedCategories, setExpandedCategories] = useState(['media', 'basic', 'actions', 'layout']);
    const [editingElementId, setEditingElementId] = useState(null);
    const imageInputRef = useRef(null);
    const videoInputRef = useRef(null);

    // Group selection state
    const [lastTap, setLastTap] = useState(0);
    const [selectedElements, setSelectedElements] = useState([]);
    const [isGroupDragging, setIsGroupDragging] = useState(false);
    const [isGroupResizing, setIsGroupResizing] = useState(false);
    const [groupDragStart, setGroupDragStart] = useState({ x: 0, y: 0, initialElements: [] });
    const [groupResizeStart, setGroupResizeStart] = useState({ x: 0, y: 0, initialW: 0, initialH: 0, boxX: 0, boxY: 0, initialElements: [] });
    const [alignmentLines, setAlignmentLines] = useState({ v: null, h: null });
    const [contextMenu, setContextMenu] = useState(null);
    const SNAP_THRESHOLD = 8;

    // Element Styling State & Updates
    const [elementColor, setElementColor] = useState('transparent');

    const handleUpdateElement = (id, updates) => {
        setDroppedElements(prev => {
            const updated = prev.map(el => el.id === id ? { ...el, ...updates } : el);
            if (socket && conversationId) {
                socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: updated });
            }
            return updated;
        });
    };

    const handleImportMedia = (file, isVideo) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const rect = containerRef.current?.getBoundingClientRect() || { width: 800, height: 600 };
            const newEl = {
                id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
                type: isVideo ? 'videoEmbed' : 'imageBlock',
                src: e.target?.result,
                name: file.name,
                x: Math.max(20, Math.round(((rect.width || 800) - (isVideo ? 360 : 280)) / 2)),
                y: Math.max(20, Math.round(((rect.height || 600) - (isVideo ? 220 : 200)) / 2)),
                w: isVideo ? 360 : 280,
                h: isVideo ? 220 : 200,
                ownerId: mongoUserId,
                allowOthersToEdit: false
            };
            const updated = [...droppedElements, newEl];
            setDroppedElements(updated);
            setSelectedElements([newEl.id]);
            if (socket && conversationId) {
                socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: updated });
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteSelected = () => {
        if (selectedElements.length === 0) return;
        const updated = droppedElements.filter(el => !selectedElements.includes(el.id));
        setDroppedElements(updated);
        setSelectedElements([]);
        if (socket && conversationId) {
            socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: updated });
        }
    };

    const handleDuplicateSelected = () => {
        if (selectedElements.length === 0) return;
        const toDup = droppedElements.filter(el => selectedElements.includes(el.id));
        const newEls = toDup.map(el => ({
            ...el,
            id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
            x: el.x + 24,
            y: el.y + 24,
            ownerId: mongoUserId,
            allowOthersToEdit: false
        }));
        const updated = [...droppedElements, ...newEls];
        setDroppedElements(updated);
        setSelectedElements(newEls.map(el => el.id));
        if (socket && conversationId) {
            socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: updated });
        }
    };

    const handleElementColorChange = (e) => {
        const newColor = e.target.value;
        setElementColor(newColor);
        if (selectedElements.length > 0) {
            const updated = droppedElements.map(el => {
                if (selectedElements.includes(el.id)) {
                    return { ...el, bgColor: newColor };
                }
                return el;
            });
            setDroppedElements(updated);
            if (socket && conversationId) socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: updated });
        }
    };

    const handleBringToFront = (e) => {
        e.stopPropagation();
        if (selectedElements.length === 0) return;
        const unselected = droppedElements.filter(el => !selectedElements.includes(el.id));
        const selected = droppedElements.filter(el => selectedElements.includes(el.id));
        const updated = [...unselected, ...selected];
        setDroppedElements(updated);
        if (socket && conversationId) socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: updated });
    };

    const handleSendToBack = (e) => {
        e.stopPropagation();
        if (selectedElements.length === 0) return;
        const unselected = droppedElements.filter(el => !selectedElements.includes(el.id));
        const selected = droppedElements.filter(el => selectedElements.includes(el.id));
        const updated = [...selected, ...unselected];
        setDroppedElements(updated);
        if (socket && conversationId) socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: updated });
    };

    const getGroupBoundingBox = () => {
        if (selectedElements.length === 0) return null;
        const selected = droppedElements.filter(el => selectedElements.includes(el.id));
        if (selected.length === 0) return null;
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        selected.forEach(el => {
            if (el.x < minX) minX = el.x;
            if (el.y < minY) minY = el.y;
            if (el.x + el.w > maxX) maxX = el.x + el.w;
            if (el.y + el.h > maxY) maxY = el.y + el.h;
        });
        
        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    };

    // Keyboard shortcuts for selected design elements (Delete, Duplicate)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (editingElementId) return;
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElements.length > 0) {
                e.preventDefault();
                handleDeleteSelected();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selectedElements.length > 0) {
                e.preventDefault();
                handleDuplicateSelected();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedElements, droppedElements, editingElementId]);

    const saveState = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataURL = canvas.toDataURL();
        
        let newHistory = history.slice(0, historyStep + 1);
        newHistory.push(dataURL);
        
        if (newHistory.length > 20) newHistory = newHistory.slice(newHistory.length - 20);
        
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    };

    // Request sync on mount
    useEffect(() => {
        if (socket && conversationId) {
            socket.emit('whiteboard_draw', { conversationId, action: 'request_sync' });
        }
    }, [socket, conversationId]);

    // Initialize empty history state for undo/redo tracking properly
    useEffect(() => {
        saveState();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            const currentData = canvas.toDataURL(); // Save before resize
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
            // Restore context settings
            const ctx = canvas.getContext('2d');
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            // Restore drawing
            if (currentData.length > 10) {
                const img = new window.Image();
                img.src = currentData;
                img.onload = () => ctx.drawImage(img, 0, 0);
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleIncomingDraw = (data) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');

            if (data.action === 'clear') {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                setHistory([]);
                setHistoryStep(-1);
                return;
            }

            if (data.action === 'request_sync') {
                if (droppedElements.length > 0) {
                    socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: droppedElements });
                }
                return;
            }

            if (data.action === 'sync_image') {
                if (data.image) {
                    const img = new window.Image();
                    img.onload = () => {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0);
                    };
                    img.src = data.image;
                } else {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
                return;
            }

            if (data.action === 'sync_bg') {
                setBgColor(data.bgColor);
                return;
            }

            if (data.action === 'sync_elements') {
                setDroppedElements(data.elements);
                return;
            }

            // Normal Drawing
            ctx.lineWidth = data.size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            if (data.tool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.strokeStyle = 'rgba(0,0,0,1)';
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = data.color;
            }

            if (data.action === 'start') {
                ctx.beginPath();
                ctx.moveTo(data.x, data.y);
            } else if (data.action === 'draw') {
                ctx.lineTo(data.x, data.y);
                ctx.stroke();
            } else if (data.action === 'end') {
                ctx.closePath();
            }
        };

        socket.on('whiteboard_draw', handleIncomingDraw);

        return () => {
            socket.off('whiteboard_draw', handleIncomingDraw);
        };
    }, [socket]);

    const getCoordinates = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        // Handle touch events
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const emitDrawEvent = (action, coords) => {
        if (!socket || !conversationId) return;
        socket.emit('whiteboard_draw', {
            conversationId,
            action,
            x: coords?.x || 0,
            y: coords?.y || 0,
            color,
            size,
            tool
        });
    };

    const startDrawing = (e) => {
        const coords = getCoordinates(e);
        setIsDrawing(true);
        const ctx = canvasRef.current.getContext('2d');
        
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = color;
        }

        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        emitDrawEvent('start', coords);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const coords = getCoordinates(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        emitDrawEvent('draw', coords);
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        const ctx = canvasRef.current.getContext('2d');
        ctx.closePath();
        emitDrawEvent('end', null);
        saveState();
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        emitDrawEvent('clear', null);
        saveState();
        
        // Also clear mockup elements
        setDroppedElements([]);
        socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: [] });
    };

    const handleUndo = () => {
        if (historyStep > 0) {
            const prevStep = historyStep - 1;
            setHistoryStep(prevStep);
            restoreImage(history[prevStep]);
            socket.emit('whiteboard_draw', { conversationId, action: 'sync_image', image: history[prevStep] });
        }
    };

    const handleRedo = () => {
        if (historyStep < history.length - 1) {
            const nextStep = historyStep + 1;
            setHistoryStep(nextStep);
            restoreImage(history[nextStep]);
            socket.emit('whiteboard_draw', { conversationId, action: 'sync_image', image: history[nextStep] });
        }
    };

    const restoreImage = (dataUrl) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new window.Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = dataUrl;
    };

    const handleBgColorChange = (e) => {
        const newColor = e.target.value;
        setBgColor(newColor);
        if (socket && conversationId) {
            socket.emit('whiteboard_draw', { conversationId, action: 'sync_bg', bgColor: newColor });
        }
    };

    const exportToChat = async () => {
        if (!onSendToChat || !containerRef.current || isSendingToChat) return;
        setIsSendingToChat(true);
        try {
            setSelectedElements([]);
            setContextMenu(null);
            
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait for re-render
            
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            if (droppedElements.length > 0) {
                droppedElements.forEach(el => {
                    if (el.x < minX) minX = el.x;
                    if (el.y < minY) minY = el.y;
                    if (el.x + el.w > maxX) maxX = el.x + el.w;
                    if (el.y + el.h > maxY) maxY = el.y + el.h;
                });
            } else {
                minX = 0; minY = 0; maxX = window.innerWidth; maxY = window.innerHeight;
            }
            
            const padding = 50;
            minX = Math.max(0, minX - padding);
            minY = Math.max(0, minY - padding);
            maxX += padding;
            maxY += padding;
            
            const w = maxX - minX;
            const h = maxY - minY;
            
            const originalWidth = containerRef.current.style.width;
            const originalHeight = containerRef.current.style.height;
            containerRef.current.style.width = `${maxX}px`;
            containerRef.current.style.height = `${maxY}px`;

            const canvas = await html2canvas(containerRef.current, {
                backgroundColor: bgColor === 'transparent' ? '#0f172a' : bgColor,
                useCORS: true,
                x: minX,
                y: minY,
                width: w,
                height: h,
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight,
                scale: 1 // prevent too large resolutions on retina displays
            });
            
            containerRef.current.style.width = originalWidth;
            containerRef.current.style.height = originalHeight;
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            onSendToChat(dataUrl);
        } catch (err) {
            console.error("Failed to export whiteboard:", err);
            alert("Failed to export whiteboard as image. " + err.message);
        } finally {
            setIsSendingToChat(false);
        }
    };

    // --- Mockup Elements Drag and Drop Logic ---
    const handleDragStartSidebar = (e, type) => {
        setDraggedItem(type);
        // For HTML5 drag and drop (desktop)
        if (e.dataTransfer) {
            e.dataTransfer.setData('type', type);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const rect = containerRef.current.getBoundingClientRect();
        
        let clientX = e.clientX;
        let clientY = e.clientY;
        
        if (e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        }

        // Support direct file drop from desktop/files (Images & Videos)
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            const isVideo = file.type.startsWith('video/');
            const isImage = file.type.startsWith('image/');
            if (isVideo || isImage) {
                const reader = new FileReader();
                reader.onload = (uploadEvent) => {
                    const newEl = {
                        id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
                        type: isVideo ? 'videoEmbed' : 'imageBlock',
                        src: uploadEvent.target?.result,
                        name: file.name,
                        x: Math.max(0, clientX - rect.left - (isVideo ? 170 : 120)),
                        y: Math.max(0, clientY - rect.top - (isVideo ? 100 : 90)),
                        w: isVideo ? 340 : 240,
                        h: isVideo ? 200 : 180,
                        ownerId: mongoUserId,
                        allowOthersToEdit: false
                    };
                    const updated = [...droppedElements, newEl];
                    setDroppedElements(updated);
                    setSelectedElements([newEl.id]);
                    if (socket && conversationId) {
                        socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: updated });
                    }
                };
                reader.readAsDataURL(file);
                return;
            }
        }

        const type = e.dataTransfer ? e.dataTransfer.getData('type') : draggedItem;
        if (!type || !MOCKUP_TYPES[type]) return;

        const typeConfig = MOCKUP_TYPES[type];

        // Specific element defaults
        const defaults = {};
        if (type === 'heading') {
            defaults.text = 'Heading Title';
            defaults.textColor = '#F8FAFC';
            defaults.fontSize = 28;
            defaults.fontWeight = '700';
        } else if (type === 'paragraph') {
            defaults.text = 'Enter your copy or UI description text here...';
            defaults.textColor = '#94A3B8';
            defaults.fontSize = 15;
        } else if (type === 'button') {
            defaults.text = 'Get Started';
            defaults.bgColor = '#06B6D4';
            defaults.textColor = '#0B0F19';
            defaults.borderRadius = 8;
        } else if (type === 'badge') {
            defaults.text = 'Featured';
            defaults.bgColor = 'rgba(6, 182, 212, 0.15)';
            defaults.textColor = '#06B6D4';
            defaults.borderRadius = 999;
        } else if (type === 'container') {
            defaults.bgColor = '#1E293B';
            defaults.borderColor = '#334155';
            defaults.borderRadius = 12;
        } else if (type === 'navbar') {
            defaults.brand = 'DevSup Platform';
            defaults.bgColor = '#0F172A';
            defaults.textColor = '#F8FAFC';
        } else if (type === 'textInput') {
            defaults.text = 'Enter text...';
            defaults.bgColor = '#0F172A';
            defaults.textColor = '#F8FAFC';
            defaults.borderRadius = 6;
        } else if (type === 'textarea') {
            defaults.text = 'Type notes or feedback...';
            defaults.bgColor = '#0F172A';
            defaults.textColor = '#F8FAFC';
            defaults.borderRadius = 6;
        } else if (type === 'switch') {
            defaults.text = 'Active toggle';
            defaults.checked = true;
        } else if (type === 'checkbox') {
            defaults.text = 'Enable option';
            defaults.checked = true;
        } else if (type === 'dropdown') {
            defaults.text = 'Option 1';
        } else if (type === 'infoCard') {
            defaults.title = 'Analytics Feature';
            defaults.text = 'Detailed design specifications and interactive component description.';
            defaults.bgColor = '#1E293B';
        } else if (type === 'avatar') {
            defaults.text = 'UX';
            defaults.bgColor = '#3B82F6';
            defaults.textColor = '#FFFFFF';
        }

        const newElement = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
            type,
            x: Math.max(0, clientX - rect.left - (typeConfig.defaultW / 2)),
            y: Math.max(0, clientY - rect.top - (typeConfig.defaultH / 2)),
            w: typeConfig.defaultW,
            h: typeConfig.defaultH,
            ownerId: mongoUserId,
            allowOthersToEdit: false,
            ...defaults
        };

        const updatedElements = [...droppedElements, newElement];
        setDroppedElements(updatedElements);
        setSelectedElements([newElement.id]);
        setDraggedItem(null);

        if (socket && conversationId) {
            socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: updatedElements });
        }
    };

    const handleSidebarTouchEnd = (e, type) => {
        const touch = e.changedTouches[0];
        const canvasRect = containerRef.current.getBoundingClientRect();
        
        if (touch.clientX >= canvasRect.left && touch.clientX <= canvasRect.right && 
            touch.clientY >= canvasRect.top && touch.clientY <= canvasRect.bottom) {
            
            const newElement = {
                id: crypto.randomUUID(),
                type,
                x: touch.clientX - canvasRect.left - (MOCKUP_TYPES[type].defaultW / 2),
                y: touch.clientY - canvasRect.top - (MOCKUP_TYPES[type].defaultH / 2),
                w: MOCKUP_TYPES[type].defaultW,
                h: MOCKUP_TYPES[type].defaultH,
                color: elementColor !== 'transparent' ? elementColor : undefined,
                ownerId: mongoUserId,
                allowOthersToEdit: false
            };
            const updatedElements = [...droppedElements, newElement];
            setDroppedElements(updatedElements);
            if (socket && conversationId) {
                socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: updatedElements });
            }
        }
        setDraggedItem(null);
    };

    // For moving already dropped elements
    const handleElementMouseDown = (e, id) => {
        e.stopPropagation();
        const el = droppedElements.find(el => el.id === id);
        if (el && !canEditElement(el)) return;
        setDraggingElementId(id);
    };

    const handleElementMouseMove = (e) => {
        if (!draggingElementId) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        const draggedEl = droppedElements.find(el => el.id === draggingElementId);
        if (!draggedEl) return;

        let targetX = clientX - rect.left - (draggedEl.w / 2);
        let targetY = clientY - rect.top - (draggedEl.h / 2);
        let centerX = targetX + (draggedEl.w / 2);
        let centerY = targetY + (draggedEl.h / 2);

        let newV = null;
        let newH = null;

        const canvasCenterX = rect.width / 2;
        const canvasCenterY = rect.height / 2;

        if (Math.abs(centerX - canvasCenterX) < SNAP_THRESHOLD) {
            targetX = canvasCenterX - (draggedEl.w / 2);
            newV = canvasCenterX;
        }
        if (Math.abs(centerY - canvasCenterY) < SNAP_THRESHOLD) {
            targetY = canvasCenterY - (draggedEl.h / 2);
            newH = canvasCenterY;
        }

        droppedElements.forEach(other => {
            if (other.id === draggingElementId) return;
            const otherCenterX = other.x + (other.w / 2);
            const otherCenterY = other.y + (other.h / 2);
            
            if (Math.abs(centerX - otherCenterX) < SNAP_THRESHOLD) {
                targetX = otherCenterX - (draggedEl.w / 2);
                newV = otherCenterX;
            }
            if (Math.abs(centerY - otherCenterY) < SNAP_THRESHOLD) {
                targetY = otherCenterY - (draggedEl.h / 2);
                newH = otherCenterY;
            }
        });

        setAlignmentLines({ v: newV, h: newH });

        const updatedElements = droppedElements.map(el => {
            if (el.id === draggingElementId) {
                return { ...el, x: targetX, y: targetY };
            }
            return el;
        });

        setDroppedElements(updatedElements);
        
        if (socket && conversationId) {
            socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: updatedElements });
        }
    };

    const handleElementMouseUp = () => {
        setDraggingElementId(null);
        setResizingElementId(null);
        setIsGroupDragging(false);
        setIsGroupResizing(false);
        setAlignmentLines({ v: null, h: null });
    };

    const handleGroupMouseDown = (e) => {
        e.stopPropagation();
        const hasUneditable = droppedElements.some(el => selectedElements.includes(el.id) && !canEditElement(el));
        if (hasUneditable) return;
        
        setIsGroupDragging(true);
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        setGroupDragStart({ x: clientX, y: clientY, initialElements: JSON.parse(JSON.stringify(droppedElements)), initialBox: getGroupBoundingBox() });
    };

    const handleGroupResizeMouseDown = (e) => {
        e.stopPropagation();
        const hasUneditable = droppedElements.some(el => selectedElements.includes(el.id) && !canEditElement(el));
        if (hasUneditable) return;
        
        setIsGroupResizing(true);
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        const box = getGroupBoundingBox();
        setGroupResizeStart({ x: clientX, y: clientY, initialW: box.w, initialH: box.h, boxX: box.x, boxY: box.y, initialElements: JSON.parse(JSON.stringify(droppedElements)) });
    };

    const handleGroupMouseMove = (e) => {
        if (!isGroupDragging && !isGroupResizing) return;
        
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        if (isGroupDragging) {
            let deltaX = clientX - groupDragStart.x;
            let deltaY = clientY - groupDragStart.y;
            
            const box = groupDragStart.initialBox;
            if (box) {
                let targetCenterX = box.x + deltaX + (box.w / 2);
                let targetCenterY = box.y + deltaY + (box.h / 2);
                let newV = null;
                let newH = null;
                const rect = containerRef.current.getBoundingClientRect();
                const canvasCenterX = rect.width / 2;
                const canvasCenterY = rect.height / 2;

                if (Math.abs(targetCenterX - canvasCenterX) < SNAP_THRESHOLD) {
                    deltaX += canvasCenterX - targetCenterX;
                    newV = canvasCenterX;
                }
                if (Math.abs(targetCenterY - canvasCenterY) < SNAP_THRESHOLD) {
                    deltaY += canvasCenterY - targetCenterY;
                    newH = canvasCenterY;
                }

                droppedElements.forEach(other => {
                    if (selectedElements.includes(other.id)) return;
                    const otherCenterX = other.x + (other.w / 2);
                    const otherCenterY = other.y + (other.h / 2);
                    
                    if (Math.abs(targetCenterX - otherCenterX) < SNAP_THRESHOLD) {
                        deltaX += otherCenterX - targetCenterX;
                        newV = otherCenterX;
                    }
                    if (Math.abs(targetCenterY - otherCenterY) < SNAP_THRESHOLD) {
                        deltaY += otherCenterY - targetCenterY;
                        newH = otherCenterY;
                    }
                });
                setAlignmentLines({ v: newV, h: newH });
            }

            const updatedElements = groupDragStart.initialElements.map(el => {
                if (selectedElements.includes(el.id)) {
                    return { ...el, x: el.x + deltaX, y: el.y + deltaY };
                }
                return el;
            });
            setDroppedElements(updatedElements);
            if (socket && conversationId) socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: updatedElements });
        }
        
        if (isGroupResizing) {
            const deltaX = clientX - groupResizeStart.x;
            const deltaY = clientY - groupResizeStart.y;
            
            const newW = Math.max(50, groupResizeStart.initialW + deltaX);
            const newH = Math.max(50, groupResizeStart.initialH + deltaY);
            const scaleX = newW / groupResizeStart.initialW;
            const scaleY = newH / groupResizeStart.initialH;
            
            const updatedElements = groupResizeStart.initialElements.map(el => {
                if (selectedElements.includes(el.id)) {
                    return { 
                        ...el, 
                        x: groupResizeStart.boxX + (el.x - groupResizeStart.boxX) * scaleX, 
                        y: groupResizeStart.boxY + (el.y - groupResizeStart.boxY) * scaleY,
                        w: el.w * scaleX,
                        h: el.h * scaleY
                    };
                }
                return el;
            });
            setDroppedElements(updatedElements);
            if (socket && conversationId) socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: updatedElements });
        }
    };

    const handleResizeMouseDown = (e, el) => {
        e.stopPropagation();
        if (!canEditElement(el)) return;
        setResizingElementId(el.id);
        
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        
        setResizeStart({ x: clientX, y: clientY, w: el.w, h: el.h });
    };

    const handleResizeMouseMove = (e) => {
        if (!resizingElementId) return;
        
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        const deltaX = clientX - resizeStart.x;
        const deltaY = clientY - resizeStart.y;

        const updatedElements = droppedElements.map(el => {
            if (el.id === resizingElementId) {
                return {
                    ...el,
                    w: Math.max(20, resizeStart.w + deltaX), // Min width
                    h: Math.max(20, resizeStart.h + deltaY)  // Min height
                };
            }
            return el;
        });

        setDroppedElements(updatedElements);
        
        if (socket && conversationId) {
            socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: updatedElements });
        }
    };

    return (
        <WhiteboardOverlay embedded={embedded}>
            <Toolbar>
                <ToolsGroup>
                    <IconButton 
                        title="Pencil" 
                        active={tool === 'pencil'} 
                        onClick={() => setTool('pencil')}
                    >
                        <Brush size={20} />
                    </IconButton>
                    <IconButton 
                        title="Eraser" 
                        active={tool === 'eraser'} 
                        onClick={() => setTool('eraser')}
                    >
                        <Eraser size={20} />
                    </IconButton>
                    
                    <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--colors-border)', margin: '0 8px' }}></div>
                    
                    <ColorPickerContainer>
                        Pen:
                        <ColorPicker 
                            type="color" 
                            value={color} 
                            onChange={(e) => setColor(e.target.value)}
                            disabled={tool === 'eraser'}
                            title="Pen Color"
                        />
                    </ColorPickerContainer>

                    <ColorPickerContainer>
                        Bg:
                        <ColorPicker 
                            type="color" 
                            value={bgColor} 
                            onChange={handleBgColorChange}
                            title="Background Color"
                        />
                    </ColorPickerContainer>

                    <ColorPickerContainer>
                        Element:
                        <ColorPicker 
                            type="color" 
                            value={elementColor} 
                            onChange={handleElementColorChange}
                            title="Selected Element Color"
                        />
                    </ColorPickerContainer>
                    
                    <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--colors-border)', margin: '0 8px' }}></div>

                    <SizeInput 
                        type="range" 
                        min="1" 
                        max="20" 
                        value={size} 
                        onChange={(e) => setSize(parseInt(e.target.value))}
                        title="Brush Size"
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--colors-textMuted)' }}>{size}px</span>

                    <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--colors-border)', margin: '0 8px' }}></div>

                    <IconButton title="Undo" onClick={handleUndo} disabled={historyStep <= 0}>
                        <Undo2 size={20} />
                    </IconButton>
                    <IconButton title="Redo" onClick={handleRedo} disabled={historyStep >= history.length - 1}>
                        <Redo2 size={20} />
                    </IconButton>

                    <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--colors-border)', margin: '0 8px' }}></div>

                    <IconButton title="Clear Canvas" danger={true} onClick={clearCanvas}>
                        <Trash2 size={20} />
                    </IconButton>
                </ToolsGroup>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Media File Inputs */}
                    <input 
                        type="file" 
                        ref={imageInputRef} 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        onChange={(e) => {
                            if (e.target.files?.[0]) handleImportMedia(e.target.files[0], false);
                            e.target.value = '';
                        }} 
                    />
                    <input 
                        type="file" 
                        ref={videoInputRef} 
                        accept="video/*" 
                        style={{ display: 'none' }} 
                        onChange={(e) => {
                            if (e.target.files?.[0]) handleImportMedia(e.target.files[0], true);
                            e.target.value = '';
                        }} 
                    />

                    {/* Import Buttons */}
                    <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            backgroundColor: 'rgba(6, 182, 212, 0.12)',
                            border: '1px solid rgba(6, 182, 212, 0.35)',
                            borderRadius: '6px',
                            color: '#06B6D4',
                            fontSize: '0.82rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                        title="Import image asset from computer"
                    >
                        <ImageIcon size={15} /> Import Image
                    </button>

                    <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            backgroundColor: 'rgba(168, 85, 247, 0.12)',
                            border: '1px solid rgba(168, 85, 247, 0.35)',
                            borderRadius: '6px',
                            color: '#C084FC',
                            fontSize: '0.82rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                        title="Import video asset with real playback"
                    >
                        <VideoIcon size={15} /> Import Video
                    </button>

                    {onSendToChat && (
                        <button 
                            onClick={exportToChat}
                            disabled={isSendingToChat}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: isSendingToChat ? 'var(--colors-border)' : 'var(--colors-accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: isSendingToChat ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: '600', opacity: isSendingToChat ? 0.7 : 1 }}
                            title="Send design to chat"
                        >
                            <Send size={15} /> {isSendingToChat ? 'Sending…' : 'Send to Chat'}
                        </button>
                    )}
                    <IconButton title="Close Whiteboard" onClick={onClose}>
                        <X size={24} />
                    </IconButton>
                </div>
            </Toolbar>

            <MainArea 
                onMouseMove={(e) => {
                    if (draggingElementId) handleElementMouseMove(e);
                    if (resizingElementId) handleResizeMouseMove(e);
                    if (isGroupDragging || isGroupResizing) handleGroupMouseMove(e);
                }}
                onTouchMove={(e) => {
                    if (draggingElementId) handleElementMouseMove(e);
                    if (resizingElementId) handleResizeMouseMove(e);
                    if (isGroupDragging || isGroupResizing) handleGroupMouseMove(e);
                }}
                onMouseUp={handleElementMouseUp}
                onTouchEnd={handleElementMouseUp}
                onMouseLeave={handleElementMouseUp}
            >
                <Sidebar>
                    <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#06B6D4', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.2px' }}>
                        🎨 UI/UX Components
                    </div>
                    
                    {MOCKUP_CATEGORIES.map(category => {
                        const isExpanded = expandedCategories.includes(category.id);
                        return (
                            <div key={category.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '4px' }}>
                                <div 
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', cursor: 'pointer', backgroundColor: isExpanded ? 'rgba(6, 182, 212, 0.1)' : 'transparent', borderRadius: '4px', color: isExpanded ? 'var(--colors-accent)' : 'var(--colors-textMain)' }}
                                    onClick={() => {
                                        if (isExpanded) {
                                            setExpandedCategories(expandedCategories.filter(id => id !== category.id));
                                        } else {
                                            setExpandedCategories([...expandedCategories, category.id]);
                                        }
                                    }}
                                >
                                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{category.title}</span>
                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </div>
                                
                                {isExpanded && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px' }}>
                                        {category.items.map(itemKey => {
                                            const config = MOCKUP_TYPES[itemKey];
                                            if (!config) return null;
                                            const Icon = config.icon || Square;
                                            return (
                                                <SidebarItem 
                                                    key={itemKey} 
                                                    draggable
                                                    onDragStart={(e) => handleDragStartSidebar(e, itemKey)}
                                                    onTouchStart={(e) => handleDragStartSidebar(e, itemKey)}
                                                    onTouchEnd={(e) => handleSidebarTouchEnd(e, itemKey)}
                                                    style={{ padding: '8px', fontSize: '0.8rem' }}
                                                >
                                                    <Icon size={16} />
                                                    {config.label}
                                                </SidebarItem>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    
                    <div style={{ fontSize: '0.75rem', color: 'var(--colors-textMuted)', marginTop: 'auto', lineHeight: '1.4', paddingTop: '16px' }}>
                        Drag items onto the canvas. Right-click dropped items to remove them. Grab bottom-right to resize.
                    </div>
                </Sidebar>

                <CanvasContainer style={{ backgroundColor: bgColor }}>
                    <CanvasInner 
                        ref={containerRef}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        {/* Render Alignment Lines */}
                    {alignmentLines.v !== null && (
                        <div style={{ position: 'absolute', top: 0, bottom: 0, left: alignmentLines.v, width: '1px', backgroundColor: '#d946ef', zIndex: 9999, pointerEvents: 'none' }} />
                    )}
                    {alignmentLines.h !== null && (
                        <div style={{ position: 'absolute', left: 0, right: 0, top: alignmentLines.h, height: '1px', backgroundColor: '#d946ef', zIndex: 9999, pointerEvents: 'none' }} />
                    )}

                    {/* Render Dropped UI/UX Design Elements */}
                    {droppedElements.map(el => {
                        const Component = MOCKUP_TYPES[el.type]?.component;
                        if (!Component) return null;
                        const isSelected = selectedElements.includes(el.id);
                        
                        return (
                            <div
                                key={el.id}
                                style={{
                                    position: 'absolute',
                                    left: el.x,
                                    top: el.y,
                                    width: el.w,
                                    height: el.h,
                                    cursor: 'move',
                                    zIndex: isSelected ? 25 : 10,
                                    boxSizing: 'border-box',
                                    outline: isSelected ? '2px solid #06B6D4' : (draggingElementId === el.id ? '1px dashed #06B6D4' : 'none'),
                                    outlineOffset: '2px',
                                    userSelect: 'none'
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedElements([el.id]);
                                }}
                                onMouseDown={(e) => {
                                    handleElementMouseDown(e, el.id);
                                }}
                                onTouchStart={(e) => {
                                    handleElementMouseDown(e, el.id);
                                }}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (!selectedElements.includes(el.id)) {
                                        setSelectedElements([el.id]);
                                    }
                                    setContextMenu({ x: e.clientX, y: e.clientY });
                                }}
                            >
                                {/* Floating Design Inspector Bar for Selected Element */}
                                {isSelected && selectedElements.length === 1 && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: el.y < 55 ? `${el.h + 8}px` : '-48px',
                                            left: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            backgroundColor: '#0F172A',
                                            border: '1px solid #06B6D4',
                                            borderRadius: '8px',
                                            padding: '4px 10px',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                                            zIndex: 9999,
                                            whiteSpace: 'nowrap'
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        {/* Direct Edit Text Button */}
                                        {(el.text !== undefined || el.title !== undefined) && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingElementId(el.id);
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    background: editingElementId === el.id ? '#06B6D4' : 'rgba(255,255,255,0.08)',
                                                    color: editingElementId === el.id ? '#0B0F19' : '#F8FAFC',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    padding: '3px 8px',
                                                    fontSize: '0.72rem',
                                                    fontWeight: '600',
                                                    cursor: 'pointer'
                                                }}
                                                title="Edit text content (or double-click text directly)"
                                            >
                                                <Type size={12} /> Edit Text
                                            </button>
                                        )}

                                        {/* Fill Color */}
                                        <label title="Background Fill Color" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', color: '#94A3B8', cursor: 'pointer', fontWeight: '600' }}>
                                            Fill
                                            <input 
                                                type="color" 
                                                value={el.bgColor || '#1E293B'} 
                                                onChange={(e) => handleUpdateElement(el.id, { bgColor: e.target.value })} 
                                                style={{ width: '22px', height: '22px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '4px' }}
                                            />
                                        </label>

                                        {/* Text Color */}
                                        {el.textColor !== undefined && (
                                            <label title="Text Color" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', color: '#94A3B8', cursor: 'pointer', fontWeight: '600' }}>
                                                Text
                                                <input 
                                                    type="color" 
                                                    value={el.textColor || '#FFFFFF'} 
                                                    onChange={(e) => handleUpdateElement(el.id, { textColor: e.target.value })} 
                                                    style={{ width: '22px', height: '22px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '4px' }}
                                                />
                                            </label>
                                        )}

                                        {/* Font Size (+ / -) */}
                                        {el.fontSize !== undefined && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', borderLeft: '1px solid #334155', paddingLeft: '6px' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateElement(el.id, { fontSize: Math.max(10, (el.fontSize || 16) - 2) })}
                                                    style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '2px 4px', fontSize: '0.8rem', fontWeight: 'bold' }}
                                                    title="Decrease font size"
                                                >
                                                    A-
                                                </button>
                                                <span style={{ fontSize: '0.72rem', color: '#CBD5E1', minWidth: '24px', textAlign: 'center' }}>
                                                    {el.fontSize}px
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateElement(el.id, { fontSize: Math.min(72, (el.fontSize || 16) + 2) })}
                                                    style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '2px 4px', fontSize: '0.8rem', fontWeight: 'bold' }}
                                                    title="Increase font size"
                                                >
                                                    A+
                                                </button>
                                            </div>
                                        )}

                                        {/* Border Radius */}
                                        {el.borderRadius !== undefined && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', borderLeft: '1px solid #334155', paddingLeft: '6px' }}>
                                                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Radius:</span>
                                                {[0, 6, 12, 999].map(r => (
                                                    <button
                                                        key={r}
                                                        type="button"
                                                        onClick={() => handleUpdateElement(el.id, { borderRadius: r })}
                                                        style={{
                                                            background: (el.borderRadius ?? 0) === r ? '#06B6D4' : 'rgba(255,255,255,0.08)',
                                                            color: (el.borderRadius ?? 0) === r ? '#0B0F19' : '#CBD5E1',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            padding: '2px 5px',
                                                            fontSize: '0.7rem',
                                                            fontWeight: '600',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {r === 999 ? 'pill' : `${r}`}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Lock / Unlock Toggle */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleUpdateElement(el.id, { allowOthersToEdit: !el.allowOthersToEdit });
                                            }}
                                            title={el.allowOthersToEdit ? "Editable by everyone (Click to lock)" : "Locked to you (Click to unlock)"}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '5px',
                                                padding: '5px 9px',
                                                backgroundColor: el.allowOthersToEdit ? '#10B981' : '#EF4444',
                                                color: '#FFFFFF',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                marginLeft: '4px'
                                            }}
                                        >
                                            {el.allowOthersToEdit ? <Unlock size={14} /> : <Lock size={14} />}
                                            <span>{el.allowOthersToEdit ? 'Unlocked' : 'Lock'}</span>
                                        </button>

                                        {/* Layering (Send to Back & Bring to Front) */}
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
                                            <button
                                                type="button"
                                                onClick={handleSendToBack}
                                                title="Send to Back"
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    padding: '5px 8px',
                                                    backgroundColor: '#0EA5E9',
                                                    color: '#FFFFFF',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <ArrowDownToLine size={15} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleBringToFront}
                                                title="Bring to Front"
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    padding: '5px 8px',
                                                    backgroundColor: '#0EA5E9',
                                                    color: '#FFFFFF',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <ArrowUpToLine size={15} />
                                            </button>
                                        </div>

                                        {/* Duplicate Button */}
                                        <button
                                            type="button"
                                            onClick={handleDuplicateSelected}
                                            title="Duplicate Element (Ctrl+D)"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '5px',
                                                padding: '5px 12px',
                                                backgroundColor: '#0EA5E9',
                                                color: '#FFFFFF',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.78rem',
                                                fontWeight: '700',
                                                marginLeft: '4px'
                                            }}
                                        >
                                            <Copy size={14} />
                                            <span>Duplicate</span>
                                        </button>

                                        {/* Delete Button */}
                                        <button
                                            type="button"
                                            onClick={handleDeleteSelected}
                                            title="Delete Element (Del)"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '5px 8px',
                                                backgroundColor: 'rgba(239, 68, 68, 0.25)',
                                                border: '1px solid #EF4444',
                                                color: '#EF4444',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                marginLeft: '4px'
                                            }}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                )}

                                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                    <Component 
                                        el={el} 
                                        onUpdate={(updates) => handleUpdateElement(el.id, updates)}
                                        isSelected={isSelected}
                                        isEditing={editingElementId === el.id}
                                        setIsEditing={(editing) => setEditingElementId(editing ? el.id : null)}
                                    />
                                </div>
                                
                                {/* Resize Handle */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 0,
                                        width: '16px',
                                        height: '16px',
                                        cursor: 'se-resize',
                                        background: 'linear-gradient(135deg, transparent 50%, #06b6d4 50%)',
                                        zIndex: 20
                                    }}
                                    onMouseDown={(e) => handleResizeMouseDown(e, el)}
                                    onTouchStart={(e) => handleResizeMouseDown(e, el)}
                                />
                            </div>
                        )
                    })}

                    {/* Render Group Selection Box (Only when multiple elements are selected) */}
                    {selectedElements.length > 1 && (
                        (() => {
                            const box = getGroupBoundingBox();
                            if (!box) return null;
                            return (
                                <div style={{
                                    position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h,
                                    border: '2px solid #0ea5e9', backgroundColor: 'rgba(14, 165, 233, 0.1)',
                                    cursor: 'move', zIndex: 30
                                }}
                                onMouseDown={handleGroupMouseDown}
                                onTouchStart={handleGroupMouseDown}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setContextMenu({ x: e.clientX, y: e.clientY });
                                }}
                                >
                                    {/* Toolbar over the Group Bounding Box */}
                                    <div
                                        style={{
                                            position: 'absolute', top: '-36px', right: 0, 
                                            display: 'flex', gap: '8px',
                                        }}
                                    >
                                        {selectedElements.every(id => droppedElements.find(el => el.id === id)?.ownerId === mongoUserId) && (
                                            <div
                                                title={droppedElements.find(el => el.id === selectedElements[0])?.allowOthersToEdit ? "Revoke edit permission from group" : "Allow others to edit"}
                                                style={{
                                                    padding: '6px', backgroundColor: droppedElements.find(el => el.id === selectedElements[0])?.allowOthersToEdit ? '#10B981' : '#ef4444', color: 'white', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const isCurrentlyAllowed = droppedElements.find(el => el.id === selectedElements[0])?.allowOthersToEdit;
                                                    const updated = droppedElements.map(el => {
                                                        if (selectedElements.includes(el.id) && el.ownerId === mongoUserId) {
                                                            return { ...el, allowOthersToEdit: !isCurrentlyAllowed };
                                                        }
                                                        return el;
                                                    });
                                                    setDroppedElements(updated);
                                                    if (socket && conversationId) socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: updated });
                                                }}
                                                onTouchStart={(e) => {
                                                    e.stopPropagation();
                                                    const isCurrentlyAllowed = droppedElements.find(el => el.id === selectedElements[0])?.allowOthersToEdit;
                                                    const updated = droppedElements.map(el => {
                                                        if (selectedElements.includes(el.id) && el.ownerId === mongoUserId) {
                                                            return { ...el, allowOthersToEdit: !isCurrentlyAllowed };
                                                        }
                                                        return el;
                                                    });
                                                    setDroppedElements(updated);
                                                    if (socket && conversationId) socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: updated });
                                                }}
                                            >
                                                {droppedElements.find(el => el.id === selectedElements[0])?.allowOthersToEdit ? <Unlock size={16} /> : <Lock size={16} />}
                                            </div>
                                        )}
                                        <div
                                            title="Send to Back"
                                            style={{
                                                padding: '6px', backgroundColor: '#0ea5e9', color: 'white', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                            onClick={handleSendToBack}
                                            onTouchStart={handleSendToBack}
                                        >
                                            <ArrowDownToLine size={16} />
                                        </div>
                                        <div
                                            title="Bring to Front"
                                            style={{
                                                padding: '6px', backgroundColor: '#0ea5e9', color: 'white', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                            onClick={handleBringToFront}
                                            onTouchStart={handleBringToFront}
                                        >
                                            <ArrowUpToLine size={16} />
                                        </div>
                                        <div
                                            title="Duplicate"
                                            style={{
                                                padding: '6px 12px', backgroundColor: '#0ea5e9', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const newElements = droppedElements.filter(el => selectedElements.includes(el.id)).map(el => ({
                                                ...el,
                                                id: Date.now().toString() + Math.random(),
                                                x: el.x + 20,
                                                y: el.y + 20,
                                                ownerId: mongoUserId,
                                                allowOthersToEdit: false
                                            }));
                                            const updated = [...droppedElements, ...newElements];
                                            setDroppedElements(updated);
                                            setSelectedElements(newElements.map(el => el.id));
                                            if (socket && conversationId) socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: updated });
                                        }}
                                        onTouchStart={(e) => {
                                            e.stopPropagation();
                                            const newElements = droppedElements.filter(el => selectedElements.includes(el.id)).map(el => ({
                                                ...el,
                                                id: Date.now().toString() + Math.random(),
                                                x: el.x + 20,
                                                y: el.y + 20,
                                                ownerId: mongoUserId,
                                                allowOthersToEdit: false
                                            }));
                                            const updated = [...droppedElements, ...newElements];
                                            setDroppedElements(updated);
                                            setSelectedElements(newElements.map(el => el.id));
                                            if (socket && conversationId) socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: updated });
                                        }}
                                    >
                                        Duplicate
                                    </div>
                                    </div>

                                    {/* Group Resize Handle */}
                                    <div
                                        style={{
                                            position: 'absolute', bottom: 0, right: 0, width: '20px', height: '20px',
                                            cursor: 'se-resize', background: 'linear-gradient(135deg, transparent 50%, #0ea5e9 50%)'
                                        }}
                                        onMouseDown={handleGroupResizeMouseDown}
                                        onTouchStart={handleGroupResizeMouseDown}
                                    />
                                </div>
                            );
                        })()
                    )}

                    <canvas
                        ref={canvasRef}
                        style={{ position: 'absolute', top: 0, left: 0, zIndex: 1, touchAction: 'none' }}
                        onMouseDown={(e) => {
                            const now = Date.now();
                            if (now - lastTap < 300) {
                                if (droppedElements.length > 0) setSelectedElements(droppedElements.map(el => el.id));
                            } else {
                                setSelectedElements([]);
                                startDrawing(e);
                            }
                            setLastTap(now);
                        }}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseOut={stopDrawing}
                        onTouchStart={(e) => { 
                            e.preventDefault(); 
                            const now = Date.now();
                            if (now - lastTap < 300) {
                                if (droppedElements.length > 0) setSelectedElements(droppedElements.map(el => el.id));
                            } else {
                                setSelectedElements([]);
                                startDrawing(e); 
                            }
                            setLastTap(now);
                        }}
                        onTouchMove={(e) => { e.preventDefault(); draw(e); }}
                        onTouchEnd={(e) => { e.preventDefault(); stopDrawing(); }}
                        onTouchCancel={(e) => { e.preventDefault(); stopDrawing(); }}
                    />

                    {/* Context Menu */}
                    {contextMenu && (
                        <>
                            <div 
                                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100000 }} 
                                onClick={() => setContextMenu(null)}
                                onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
                            />
                            <div style={{
                                position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 100001,
                                backgroundColor: 'var(--colors-surface)', border: '1px solid var(--colors-border)',
                                borderRadius: '4px', padding: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                                display: 'flex', flexDirection: 'column', minWidth: '150px'
                            }}>
                                <div 
                                    style={{ 
                                        padding: '8px 12px', cursor: 'pointer', color: '#ef4444', 
                                        fontSize: '0.9rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' 
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    onClick={() => {
                                        const hasUneditable = droppedElements.some(el => selectedElements.includes(el.id) && !canEditElement(el));
                                        if (hasUneditable) {
                                            alert("You don't have permission to delete one or more of these elements.");
                                            setContextMenu(null);
                                            return;
                                        }
                                        const filtered = droppedElements.filter(el => !selectedElements.includes(el.id));
                                        setDroppedElements(filtered);
                                        setSelectedElements([]);
                                        if (socket && conversationId) {
                                            socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: filtered });
                                        }
                                        setContextMenu(null);
                                    }}
                                >
                                    <Trash2 size={16} /> Delete Element{selectedElements.length > 1 ? 's' : ''}
                                </div>
                            </div>
                        </>
                    )}
                    </CanvasInner>
                </CanvasContainer>
            </MainArea>
        </WhiteboardOverlay>
    );
}
