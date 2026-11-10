import { useRef, useState, useEffect } from 'react';
import { styled } from '../stitches.config.js';
import { 
    X, Brush, Eraser, Trash2, Undo2, Redo2, ChevronDown, ChevronRight, 
    Square, ArrowUpToLine, ArrowDownToLine, Send, Lock, Unlock, 
    Image as ImageIcon, Video as VideoIcon, Copy, Plus, Minus, Type,
    MousePointer2, Download, Grid, Search, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { MOCKUP_TYPES, MOCKUP_CATEGORIES } from './MockupComponents';
import html2canvas from 'html2canvas';

const WhiteboardOverlay = styled('div', {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#070A12',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    variants: {
        embedded: {
            true: {
                position: 'relative',
                zIndex: 1,
                backgroundColor: '#070A12',
                flex: 1,
                height: '100%',
                width: '100%',
            }
        }
    }
});

const Toolbar = styled('div', {
    height: '56px',
    backgroundColor: '#0B0F19',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    gap: '8px',
    justifyContent: 'space-between',
    zIndex: 20,
});

const ToolsGroup = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
});

const IconButton = styled('button', {
    background: 'none',
    border: 'none',
    color: '$textMuted',
    cursor: 'pointer',
    padding: '7px 9px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
    '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        color: '$textMain',
    },
    '&:disabled': {
        opacity: 0.35,
        cursor: 'not-allowed',
    },
    variants: {
        active: {
            true: {
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                color: '#06B6D4',
                border: '1px solid rgba(6, 182, 212, 0.35)',
            }
        },
        danger: {
            true: {
                '&:hover': {
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
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
    position: 'relative',
    '@media (max-width: 768px)': {
        flexDirection: 'column-reverse',
    }
});

const Sidebar = styled('div', {
    width: '260px',
    backgroundColor: '#0B0F19',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    padding: '14px',
    gap: '10px',
    overflowY: 'auto',
    transition: 'width 0.2s ease, padding 0.2s ease',
    '@media (max-width: 768px)': {
        width: '100%',
        flexDirection: 'row',
        height: 'auto',
        maxHeight: '120px',
        overflowX: 'auto',
        overflowY: 'hidden',
        borderRight: 'none',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    }
});

const SidebarItem = styled('div', {
    padding: '10px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    borderRadius: '6px',
    cursor: 'grab',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.84rem',
    fontWeight: '500',
    color: '$textMain',
    transition: 'all 0.15s ease',
    '&:hover': {
        backgroundColor: 'rgba(6, 182, 212, 0.08)',
        borderColor: 'rgba(6, 182, 212, 0.3)',
        transform: 'translateX(2px)'
    },
    '&:active': {
        cursor: 'grabbing',
    }
});

const CanvasContainer = styled('div', {
    flex: 1,
    position: 'relative',
    overflow: 'auto',
    backgroundColor: '#080C16',
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
    const [bgColor, setBgColor] = useState('#080C16');
    const [size, setSize] = useState(2);
    const [tool, setTool] = useState('select'); // 'select', 'pencil', 'eraser'
    const [showGrid, setShowGrid] = useState(true);
    const [componentSearch, setComponentSearch] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
        if (e && e.stopPropagation) e.stopPropagation();
        if (selectedElements.length === 0) return;
        const unselected = droppedElements.filter(el => !selectedElements.includes(el.id));
        const selected = droppedElements.filter(el => selectedElements.includes(el.id));
        const updated = [...unselected, ...selected];
        setDroppedElements(updated);
        if (socket && conversationId) socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: updated });
    };

    const handleSendToBack = (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        if (selectedElements.length === 0) return;
        const unselected = droppedElements.filter(el => !selectedElements.includes(el.id));
        const selected = droppedElements.filter(el => selectedElements.includes(el.id));
        const updated = [...selected, ...unselected];
        setDroppedElements(updated);
        if (socket && conversationId) socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: updated });
    };

    // --- Dedicated Element Action Handlers (100% functional, bulletproof) ---
    const handleToggleElementLock = (targetEl, e) => {
        if (e) e.stopPropagation();
        if (targetEl.ownerId && targetEl.ownerId !== mongoUserId) {
            alert("Only the owner can lock or unlock this element.");
            return;
        }
        const updated = droppedElements.map(item => {
            if (item.id === targetEl.id) {
                return { ...item, allowOthersToEdit: !item.allowOthersToEdit };
            }
            return item;
        });
        setDroppedElements(updated);
        if (socket && conversationId) {
            socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: updated });
        }
    };

    const handleSendElementToBack = (targetEl, e) => {
        if (e) e.stopPropagation();
        const unselected = droppedElements.filter(item => item.id !== targetEl.id);
        const updated = [targetEl, ...unselected];
        setDroppedElements(updated);
        if (socket && conversationId) {
            socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: updated });
        }
    };

    const handleBringElementToFront = (targetEl, e) => {
        if (e) e.stopPropagation();
        const unselected = droppedElements.filter(item => item.id !== targetEl.id);
        const updated = [...unselected, targetEl];
        setDroppedElements(updated);
        if (socket && conversationId) {
            socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: updated });
        }
    };

    const handleDuplicateElement = (targetEl, e) => {
        if (e) e.stopPropagation();
        const newEl = {
            ...JSON.parse(JSON.stringify(targetEl)),
            id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
            x: targetEl.x + 24,
            y: targetEl.y + 24,
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

    const handleDeleteElement = (targetEl, e) => {
        if (e) e.stopPropagation();
        if (!canEditElement(targetEl)) {
            alert("You don't have permission to delete this element.");
            return;
        }
        const updated = droppedElements.filter(item => item.id !== targetEl.id);
        setDroppedElements(updated);
        setSelectedElements([]);
        if (socket && conversationId) {
            socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: updated });
        }
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

    // Keyboard shortcuts for selected design elements (Delete, Duplicate) and tool switching
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
            } else if (e.key.toLowerCase() === 'v' && !e.ctrlKey && !e.metaKey) {
                setTool('select');
            } else if (e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.metaKey) {
                setTool('pencil');
            } else if (e.key.toLowerCase() === 'e' && !e.ctrlKey && !e.metaKey) {
                setTool('eraser');
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
        if (tool !== 'pencil' && tool !== 'eraser') return;
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
        if (!isDrawing || (tool !== 'pencil' && tool !== 'eraser')) return;
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

    const handleExportPNG = async () => {
        if (!containerRef.current) return;
        try {
            setSelectedElements([]);
            setContextMenu(null);
            await new Promise(r => setTimeout(r, 100));

            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            if (droppedElements.length > 0) {
                droppedElements.forEach(el => {
                    if (el.x < minX) minX = el.x;
                    if (el.y < minY) minY = el.y;
                    if (el.x + el.w > maxX) maxX = el.x + el.w;
                    if (el.y + el.h > maxY) maxY = el.y + el.h;
                });
            } else {
                minX = 0; minY = 0; maxX = 1200; maxY = 800;
            }

            const padding = 40;
            const captureX = Math.max(0, minX - padding);
            const captureY = Math.max(0, minY - padding);
            const captureW = Math.max(400, (maxX - minX) + padding * 2);
            const captureH = Math.max(300, (maxY - minY) + padding * 2);

            const canvas = await html2canvas(containerRef.current, {
                x: captureX,
                y: captureY,
                width: captureW,
                height: captureH,
                backgroundColor: bgColor === 'transparent' ? '#080C16' : bgColor,
                scale: 2,
                useCORS: true,
                logging: false,
            });

            const link = document.createElement('a');
            link.download = `DevSup-Design-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Failed to export image:', err);
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
                    {/* Tool Mode Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', padding: '3px', gap: '2px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <IconButton 
                            title="Select / Move tool (V)" 
                            active={tool === 'select'} 
                            onClick={() => setTool('select')}
                            style={{ gap: '6px', padding: '5px 10px', height: '32px' }}
                        >
                            <MousePointer2 size={16} />
                            <span style={{ fontSize: '0.78rem', fontWeight: '600' }}>Select</span>
                        </IconButton>
                        <IconButton 
                            title="Pen / Freehand Draw (P)" 
                            active={tool === 'pencil'} 
                            onClick={() => setTool('pencil')}
                            style={{ gap: '6px', padding: '5px 10px', height: '32px' }}
                        >
                            <Brush size={16} />
                            <span style={{ fontSize: '0.78rem', fontWeight: '600' }}>Draw</span>
                        </IconButton>
                        <IconButton 
                            title="Eraser tool (E)" 
                            active={tool === 'eraser'} 
                            onClick={() => setTool('eraser')}
                            style={{ gap: '6px', padding: '5px 10px', height: '32px' }}
                        >
                            <Eraser size={16} />
                            <span style={{ fontSize: '0.78rem', fontWeight: '600' }}>Eraser</span>
                        </IconButton>
                    </div>

                    <div style={{ width: '1px', height: '22px', backgroundColor: 'rgba(255, 255, 255, 0.1)', margin: '0 4px' }}></div>

                    {/* Dot Grid Toggle */}
                    <IconButton 
                        title={showGrid ? "Hide Dot Grid" : "Show Dot Grid"} 
                        active={showGrid} 
                        onClick={() => setShowGrid(!showGrid)}
                        style={{ gap: '6px', padding: '5px 9px', height: '32px' }}
                    >
                        <Grid size={16} />
                        <span style={{ fontSize: '0.78rem', fontWeight: '600' }}>Grid</span>
                    </IconButton>

                    <div style={{ width: '1px', height: '22px', backgroundColor: 'rgba(255, 255, 255, 0.1)', margin: '0 4px' }}></div>

                    {/* Canvas Background Color */}
                    <ColorPickerContainer title="Canvas Background Color">
                        <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: '600' }}>Canvas:</span>
                        <ColorPicker 
                            type="color" 
                            value={bgColor} 
                            onChange={handleBgColorChange}
                            title="Canvas Background Color"
                        />
                    </ColorPickerContainer>

                    {/* Pen Drawing Controls (visible when pen or eraser active) */}
                    {tool !== 'select' && (
                        <>
                            <div style={{ width: '1px', height: '22px', backgroundColor: 'rgba(255, 255, 255, 0.1)', margin: '0 4px' }}></div>
                            <ColorPickerContainer title="Pen Stroke Color">
                                <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: '600' }}>Pen:</span>
                                <ColorPicker 
                                    type="color" 
                                    value={color} 
                                    onChange={(e) => setColor(e.target.value)}
                                    disabled={tool === 'eraser'}
                                    title="Pen Color"
                                />
                            </ColorPickerContainer>

                            <SizeInput 
                                type="range" 
                                min="1" 
                                max="24" 
                                value={size} 
                                onChange={(e) => setSize(parseInt(e.target.value))}
                                title="Brush Stroke Size"
                            />
                            <span style={{ fontSize: '0.78rem', color: '#94A3B8', minWidth: '32px' }}>{size}px</span>
                        </>
                    )}

                    <div style={{ width: '1px', height: '22px', backgroundColor: 'rgba(255, 255, 255, 0.1)', margin: '0 4px' }}></div>

                    <IconButton title="Undo (Ctrl+Z)" onClick={handleUndo} disabled={historyStep <= 0} style={{ padding: '6px' }}>
                        <Undo2 size={17} />
                    </IconButton>
                    <IconButton title="Redo (Ctrl+Y)" onClick={handleRedo} disabled={historyStep >= history.length - 1} style={{ padding: '6px' }}>
                        <Redo2 size={17} />
                    </IconButton>

                    <IconButton title="Clear Canvas Strokes" danger={true} onClick={clearCanvas} style={{ padding: '6px' }}>
                        <Trash2 size={17} />
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
                            backgroundColor: 'rgba(6, 182, 212, 0.1)',
                            border: '1px solid rgba(6, 182, 212, 0.35)',
                            borderRadius: '6px',
                            color: '#06B6D4',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                        title="Import image asset from computer"
                    >
                        <ImageIcon size={14} /> Import Image
                    </button>

                    <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            backgroundColor: 'rgba(168, 85, 247, 0.1)',
                            border: '1px solid rgba(168, 85, 247, 0.35)',
                            borderRadius: '6px',
                            color: '#C084FC',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                        title="Import video asset with real playback"
                    >
                        <VideoIcon size={14} /> Import Video
                    </button>

                    {/* Export PNG */}
                    <button
                        type="button"
                        onClick={handleExportPNG}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '6px',
                            color: '#F8FAFC',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                        title="Download high-resolution design PNG"
                    >
                        <Download size={14} /> Export PNG
                    </button>

                    {onSendToChat && (
                        <button 
                            type="button"
                            onClick={exportToChat}
                            disabled={isSendingToChat}
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                padding: '6px 14px', 
                                backgroundColor: isSendingToChat ? 'rgba(6, 182, 212, 0.4)' : '#06B6D4', 
                                color: '#0B0F19', 
                                border: 'none', 
                                borderRadius: '6px', 
                                cursor: isSendingToChat ? 'not-allowed' : 'pointer', 
                                fontSize: '0.82rem', 
                                fontWeight: '700', 
                                transition: 'all 0.15s ease'
                            }}
                            title="Send design screenshot directly into conversation chat"
                        >
                            <Send size={14} /> {isSendingToChat ? 'Sending…' : 'Send to Chat'}
                        </button>
                    )}
                    <IconButton title="Close Whiteboard" onClick={onClose} style={{ padding: '6px' }}>
                        <X size={20} />
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
                {isSidebarOpen && (
                    <Sidebar>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#06B6D4', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                🎨 Component Library
                            </div>
                            <IconButton 
                                title="Collapse Library" 
                                onClick={() => setIsSidebarOpen(false)}
                                style={{ padding: '4px', height: '26px', width: '26px' }}
                            >
                                <PanelLeftClose size={15} />
                            </IconButton>
                        </div>

                        {/* Search Bar */}
                        <div style={{ position: 'relative', marginTop: '2px', marginBottom: '4px' }}>
                            <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }} />
                            <input 
                                type="text"
                                value={componentSearch}
                                onChange={(e) => setComponentSearch(e.target.value)}
                                placeholder="Search components..."
                                style={{
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    padding: '6px 24px 6px 28px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '6px',
                                    color: '#F8FAFC',
                                    fontSize: '0.78rem',
                                    outline: 'none'
                                }}
                            />
                            {componentSearch && (
                                <button
                                    type="button"
                                    onClick={() => setComponentSearch('')}
                                    style={{
                                        position: 'absolute',
                                        right: '7px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#94A3B8',
                                        cursor: 'pointer',
                                        padding: 0,
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Component List / Search Results */}
                        {componentSearch.trim() ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
                                {Object.keys(MOCKUP_TYPES)
                                    .filter(key => MOCKUP_TYPES[key].label.toLowerCase().includes(componentSearch.toLowerCase()))
                                    .map(itemKey => {
                                        const config = MOCKUP_TYPES[itemKey];
                                        const Icon = config.icon || Square;
                                        return (
                                            <SidebarItem 
                                                key={itemKey} 
                                                draggable
                                                onDragStart={(e) => handleDragStartSidebar(e, itemKey)}
                                                onTouchStart={(e) => handleDragStartSidebar(e, itemKey)}
                                                onTouchEnd={(e) => handleSidebarTouchEnd(e, itemKey)}
                                            >
                                                <Icon size={15} color="#06B6D4" />
                                                <span>{config.label}</span>
                                            </SidebarItem>
                                        );
                                    })}
                                {Object.keys(MOCKUP_TYPES).filter(key => MOCKUP_TYPES[key].label.toLowerCase().includes(componentSearch.toLowerCase())).length === 0 && (
                                    <div style={{ fontSize: '0.78rem', color: '#64748B', textAlign: 'center', padding: '16px 0' }}>
                                        No components found
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
                                {MOCKUP_CATEGORIES.map(category => {
                                    const isExpanded = expandedCategories.includes(category.id);
                                    return (
                                        <div key={category.id} style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '3px' }}>
                                            <div 
                                                style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'space-between', 
                                                    padding: '7px 8px', 
                                                    cursor: 'pointer', 
                                                    backgroundColor: isExpanded ? 'rgba(6, 182, 212, 0.08)' : 'transparent', 
                                                    borderRadius: '6px', 
                                                    color: isExpanded ? '#06B6D4' : '#E2E8F0',
                                                    transition: 'all 0.15s ease'
                                                }}
                                                onClick={() => {
                                                    if (isExpanded) {
                                                        setExpandedCategories(expandedCategories.filter(id => id !== category.id));
                                                    } else {
                                                        setExpandedCategories([...expandedCategories, category.id]);
                                                    }
                                                }}
                                            >
                                                <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{category.title}</span>
                                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            </div>
                                            
                                            {isExpanded && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '6px' }}>
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
                                                            >
                                                                <Icon size={15} color="#06B6D4" />
                                                                <span>{config.label}</span>
                                                            </SidebarItem>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        
                        <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 'auto', lineHeight: '1.4', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            💡 Drag onto canvas. Click to select. Grab handles to resize. Double-click text to edit.
                        </div>
                    </Sidebar>
                )}

                <CanvasContainer 
                    style={{ 
                        backgroundColor: bgColor,
                        cursor: tool === 'pencil' ? 'crosshair' : tool === 'eraser' ? 'cell' : 'default'
                    }}
                >
                    {/* Collapsed Library Floating Pill */}
                    {!isSidebarOpen && (
                        <button
                            type="button"
                            onClick={() => setIsSidebarOpen(true)}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                left: '16px',
                                zIndex: 40,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 14px',
                                backgroundColor: '#0B0F19',
                                border: '1px solid rgba(6, 182, 212, 0.4)',
                                borderRadius: '8px',
                                color: '#06B6D4',
                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: '600'
                            }}
                            title="Open Component Library"
                        >
                            <PanelLeftOpen size={16} />
                            <span>Components</span>
                        </button>
                    )}

                    <CanvasInner 
                        ref={containerRef}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={(e) => {
                            if (tool === 'select') {
                                setSelectedElements([]);
                                setEditingElementId(null);
                            }
                        }}
                        style={{
                            backgroundColor: bgColor,
                            backgroundImage: showGrid 
                                ? 'radial-gradient(circle, rgba(255, 255, 255, 0.12) 1.5px, transparent 1.5px)' 
                                : 'none',
                            backgroundSize: '24px 24px',
                            backgroundPosition: '0 0'
                        }}
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
                                            top: el.y < 55 ? `${el.h + 10}px` : '-50px',
                                            left: el.x + 400 > 4000 ? 'auto' : '0px',
                                            right: el.x + 400 > 4000 ? '0px' : 'auto',
                                            display: 'flex',
                                            alignItems: 'center',
                                            flexWrap: 'nowrap',
                                            width: 'max-content',
                                            minWidth: 'max-content',
                                            maxWidth: 'none',
                                            gap: '6px',
                                            backgroundColor: '#0B0F19',
                                            border: '1.5px solid #06B6D4',
                                            borderRadius: '8px',
                                            padding: '4px 8px',
                                            boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
                                            zIndex: 9999,
                                            whiteSpace: 'nowrap',
                                            userSelect: 'none',
                                            pointerEvents: 'auto'
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
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    height: '32px',
                                                    background: editingElementId === el.id ? '#06B6D4' : 'rgba(255,255,255,0.08)',
                                                    color: editingElementId === el.id ? '#0B0F19' : '#F8FAFC',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    padding: '0 10px',
                                                    fontSize: '0.78rem',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    flexShrink: 0
                                                }}
                                                title="Edit text content (or double-click text directly)"
                                            >
                                                <Type size={13} style={{ width: '13px', height: '13px', minWidth: '13px', minHeight: '13px', flexShrink: 0 }} /> Edit Text
                                            </button>
                                        )}

                                        {/* Fill Color */}
                                        <label title="Background Fill Color" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#94A3B8', cursor: 'pointer', fontWeight: '600', height: '32px', padding: '0 4px', flexShrink: 0 }}>
                                            Fill
                                            <input 
                                                type="color" 
                                                value={el.bgColor || '#1E293B'} 
                                                onChange={(e) => handleUpdateElement(el.id, { bgColor: e.target.value })} 
                                                style={{ width: '22px', height: '22px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', cursor: 'pointer', borderRadius: '4px', padding: 0 }}
                                            />
                                        </label>

                                        {/* Text Color */}
                                        {el.textColor !== undefined && (
                                            <label title="Text Color" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#94A3B8', cursor: 'pointer', fontWeight: '600', height: '32px', padding: '0 4px', flexShrink: 0 }}>
                                                Text
                                                <input 
                                                    type="color" 
                                                    value={el.textColor || '#FFFFFF'} 
                                                    onChange={(e) => handleUpdateElement(el.id, { textColor: e.target.value })} 
                                                    style={{ width: '22px', height: '22px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', cursor: 'pointer', borderRadius: '4px', padding: 0 }}
                                                />
                                            </label>
                                        )}

                                        {/* Font Size (+ / -) */}
                                        {el.fontSize !== undefined && (
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: '6px', height: '32px', flexShrink: 0 }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateElement(el.id, { fontSize: Math.max(10, (el.fontSize || 16) - 2) })}
                                                    style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '2px 4px', fontSize: '0.8rem', fontWeight: 'bold' }}
                                                    title="Decrease font size"
                                                >
                                                    A-
                                                </button>
                                                <span style={{ fontSize: '0.75rem', color: '#CBD5E1', minWidth: '26px', textAlign: 'center' }}>
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
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: '6px', height: '32px', flexShrink: 0 }}>
                                                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Radius:</span>
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

                                        {/* Subtle Section Divider before Action Buttons */}
                                        <div style={{ width: '1px', height: '22px', backgroundColor: 'rgba(255, 255, 255, 0.15)', margin: '0 2px', flexShrink: 0 }} />

                                        {/* 1. Lock / Unlock Toggle Button (Image 2) */}
                                        <button
                                            type="button"
                                            onClick={(e) => handleToggleElementLock(el, e)}
                                            title={el.allowOthersToEdit ? "Editable by everyone (Click to lock)" : "Locked to you (Click to unlock)"}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                height: '32px',
                                                padding: '0 12px',
                                                backgroundColor: el.allowOthersToEdit ? '#10B981' : '#EF4444',
                                                color: '#FFFFFF',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.82rem',
                                                fontWeight: '700',
                                                flexShrink: 0,
                                                minWidth: 'fit-content'
                                            }}
                                        >
                                            {el.allowOthersToEdit ? (
                                                <Unlock size={15} style={{ width: '15px', height: '15px', minWidth: '15px', minHeight: '15px', flexShrink: 0 }} />
                                            ) : (
                                                <Lock size={15} style={{ width: '15px', height: '15px', minWidth: '15px', minHeight: '15px', flexShrink: 0 }} />
                                            )}
                                            <span>{el.allowOthersToEdit ? 'Unlocked' : 'Lock'}</span>
                                        </button>

                                        {/* 2. Send to Back Button (Image 2) */}
                                        <button
                                            type="button"
                                            onClick={(e) => handleSendElementToBack(el, e)}
                                            title="Send to Back (Lower Layer)"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '32px',
                                                height: '32px',
                                                minWidth: '32px',
                                                minHeight: '32px',
                                                backgroundColor: '#0EA5E9',
                                                color: '#FFFFFF',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                flexShrink: 0
                                            }}
                                        >
                                            <ArrowDownToLine size={16} style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px', flexShrink: 0 }} />
                                        </button>

                                        {/* 3. Bring to Front Button (Image 2) */}
                                        <button
                                            type="button"
                                            onClick={(e) => handleBringElementToFront(el, e)}
                                            title="Bring to Front (Upper Layer)"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '32px',
                                                height: '32px',
                                                minWidth: '32px',
                                                minHeight: '32px',
                                                backgroundColor: '#0EA5E9',
                                                color: '#FFFFFF',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                flexShrink: 0
                                            }}
                                        >
                                            <ArrowUpToLine size={16} style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px', flexShrink: 0 }} />
                                        </button>

                                        {/* 4. Duplicate Button (Image 2) */}
                                        <button
                                            type="button"
                                            onClick={(e) => handleDuplicateElement(el, e)}
                                            title="Duplicate Element (Ctrl+D)"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                height: '32px',
                                                padding: '0 14px',
                                                backgroundColor: '#0EA5E9',
                                                color: '#FFFFFF',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.82rem',
                                                fontWeight: '700',
                                                flexShrink: 0,
                                                minWidth: 'fit-content'
                                            }}
                                        >
                                            <Copy size={15} style={{ width: '15px', height: '15px', minWidth: '15px', minHeight: '15px', flexShrink: 0 }} />
                                            <span>Duplicate</span>
                                        </button>

                                        {/* 5. Delete Button (Image 2) */}
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteElement(el, e)}
                                            title="Delete Element (Del)"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '32px',
                                                height: '32px',
                                                minWidth: '32px',
                                                minHeight: '32px',
                                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                                border: '1.5px solid #EF4444',
                                                color: '#EF4444',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                flexShrink: 0
                                            }}
                                        >
                                            <Trash2 size={16} style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px', flexShrink: 0 }} />
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
                                
                                {/* 4-Corner Professional Selection & Resize Handles */}
                                {isSelected && (
                                    <>
                                        {/* Top-Left */}
                                        <div style={{ position: 'absolute', top: -5, left: -5, width: 9, height: 9, backgroundColor: '#FFFFFF', border: '2px solid #06B6D4', borderRadius: 2, pointerEvents: 'none', zIndex: 22 }} />
                                        {/* Top-Right */}
                                        <div style={{ position: 'absolute', top: -5, right: -5, width: 9, height: 9, backgroundColor: '#FFFFFF', border: '2px solid #06B6D4', borderRadius: 2, pointerEvents: 'none', zIndex: 22 }} />
                                        {/* Bottom-Left */}
                                        <div style={{ position: 'absolute', bottom: -5, left: -5, width: 9, height: 9, backgroundColor: '#FFFFFF', border: '2px solid #06B6D4', borderRadius: 2, pointerEvents: 'none', zIndex: 22 }} />
                                        {/* Bottom-Right (Interactive Resize Handle) */}
                                        <div
                                            style={{
                                                position: 'absolute',
                                                bottom: -6,
                                                right: -6,
                                                width: 13,
                                                height: 13,
                                                backgroundColor: '#06B6D4',
                                                border: '2px solid #FFFFFF',
                                                borderRadius: 3,
                                                cursor: 'nwse-resize',
                                                zIndex: 25,
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
                                            }}
                                            title="Drag to resize"
                                            onMouseDown={(e) => handleResizeMouseDown(e, el)}
                                            onTouchStart={(e) => handleResizeMouseDown(e, el)}
                                        />
                                    </>
                                )}
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
                                            position: 'absolute', 
                                            top: box.y < 50 ? `${box.h + 8}px` : '-48px', 
                                            right: 0, 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            gap: '6px',
                                            backgroundColor: '#0B0F19',
                                            border: '1.5px solid #06B6D4',
                                            borderRadius: '8px',
                                            padding: '4px 8px',
                                            boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
                                            zIndex: 9999,
                                            whiteSpace: 'nowrap'
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        {selectedElements.every(id => droppedElements.find(el => el.id === id)?.ownerId === mongoUserId) && (
                                            <button
                                                type="button"
                                                title={droppedElements.find(el => el.id === selectedElements[0])?.allowOthersToEdit ? "Revoke edit permission from group" : "Allow others to edit"}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    height: '32px',
                                                    padding: '0 12px',
                                                    backgroundColor: droppedElements.find(el => el.id === selectedElements[0])?.allowOthersToEdit ? '#10B981' : '#EF4444',
                                                    color: '#FFFFFF',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.82rem',
                                                    fontWeight: '700',
                                                    flexShrink: 0
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
                                            >
                                                {droppedElements.find(el => el.id === selectedElements[0])?.allowOthersToEdit ? (
                                                    <Unlock size={15} style={{ width: '15px', height: '15px', minWidth: '15px', minHeight: '15px', flexShrink: 0 }} />
                                                ) : (
                                                    <Lock size={15} style={{ width: '15px', height: '15px', minWidth: '15px', minHeight: '15px', flexShrink: 0 }} />
                                                )}
                                                <span>{droppedElements.find(el => el.id === selectedElements[0])?.allowOthersToEdit ? 'Unlocked' : 'Lock'}</span>
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            title="Send to Back"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '32px',
                                                height: '32px',
                                                minWidth: '32px',
                                                minHeight: '32px',
                                                backgroundColor: '#0EA5E9',
                                                color: '#FFFFFF',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                flexShrink: 0
                                            }}
                                            onClick={handleSendToBack}
                                        >
                                            <ArrowDownToLine size={16} style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px', flexShrink: 0 }} />
                                        </button>
                                        <button
                                            type="button"
                                            title="Bring to Front"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '32px',
                                                height: '32px',
                                                minWidth: '32px',
                                                minHeight: '32px',
                                                backgroundColor: '#0EA5E9',
                                                color: '#FFFFFF',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                flexShrink: 0
                                            }}
                                            onClick={handleBringToFront}
                                        >
                                            <ArrowUpToLine size={16} style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px', flexShrink: 0 }} />
                                        </button>
                                        <button
                                            type="button"
                                            title="Duplicate (Ctrl+D)"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                height: '32px',
                                                padding: '0 14px',
                                                backgroundColor: '#0EA5E9',
                                                color: '#FFFFFF',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.82rem',
                                                fontWeight: '700',
                                                flexShrink: 0
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newElements = droppedElements.filter(el => selectedElements.includes(el.id)).map(el => ({
                                                    ...JSON.parse(JSON.stringify(el)),
                                                    id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
                                                    x: el.x + 24,
                                                    y: el.y + 24,
                                                    ownerId: mongoUserId,
                                                    allowOthersToEdit: false
                                                }));
                                                const updated = [...droppedElements, ...newElements];
                                                setDroppedElements(updated);
                                                setSelectedElements(newElements.map(el => el.id));
                                                if (socket && conversationId) socket.emit('whiteboard_draw', { conversationId, action: 'sync_elements', elements: updated });
                                            }}
                                        >
                                            <Copy size={15} style={{ width: '15px', height: '15px', minWidth: '15px', minHeight: '15px', flexShrink: 0 }} />
                                            <span>Duplicate</span>
                                        </button>
                                        <button
                                            type="button"
                                            title="Delete Group (Del)"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '32px',
                                                height: '32px',
                                                minWidth: '32px',
                                                minHeight: '32px',
                                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                                border: '1.5px solid #EF4444',
                                                color: '#EF4444',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                flexShrink: 0
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteSelected();
                                            }}
                                        >
                                            <Trash2 size={16} style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px', flexShrink: 0 }} />
                                        </button>
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
                        style={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0, 
                            zIndex: 1, 
                            touchAction: 'none',
                            pointerEvents: tool === 'select' ? 'none' : 'auto'
                        }}
                        onMouseDown={(e) => {
                            if (tool !== 'pencil' && tool !== 'eraser') return;
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
                            if (tool !== 'pencil' && tool !== 'eraser') return;
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
                        onTouchMove={(e) => { if (tool === 'pencil' || tool === 'eraser') { e.preventDefault(); draw(e); } }}
                        onTouchEnd={(e) => { if (tool === 'pencil' || tool === 'eraser') { e.preventDefault(); stopDrawing(); } }}
                        onTouchCancel={(e) => { if (tool === 'pencil' || tool === 'eraser') { e.preventDefault(); stopDrawing(); } }}
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
