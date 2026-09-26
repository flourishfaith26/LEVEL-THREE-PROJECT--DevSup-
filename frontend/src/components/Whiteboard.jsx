import { useRef, useState, useEffect } from 'react';
import { styled } from '../stitches.config.js';
import { X, Brush, Eraser, Trash2, Undo2, Redo2, ChevronDown, ChevronRight, Square, ArrowUpToLine, ArrowDownToLine } from 'lucide-react';
import { MOCKUP_TYPES, MOCKUP_CATEGORIES } from './MockupComponents';

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
});

const Sidebar = styled('div', {
    width: '200px',
    backgroundColor: '$surface',
    borderRight: '1px solid $border',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    gap: '12px',
    overflowY: 'auto'
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
    overflow: 'hidden',
    cursor: 'crosshair',
});


export default function Whiteboard({ socket, conversationId, onClose }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    
    const [color, setColor] = useState('#06B6D4');
    const [bgColor, setBgColor] = useState('transparent');
    const [size, setSize] = useState(2);
    const [tool, setTool] = useState('pencil'); // 'pencil' or 'eraser'
    
    const [history, setHistory] = useState([]);
    const [historyStep, setHistoryStep] = useState(-1);

    const [droppedElements, setDroppedElements] = useState([]);
    const [draggedItem, setDraggedItem] = useState(null);
    const [draggingElementId, setDraggingElementId] = useState(null);
    
    const [resizingElementId, setResizingElementId] = useState(null);
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });

    const [expandedCategories, setExpandedCategories] = useState(['layout']);

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

    // Element Color State
    const [elementColor, setElementColor] = useState('transparent');

    const handleElementColorChange = (e) => {
        const newColor = e.target.value;
        setElementColor(newColor);
        if (selectedElements.length > 0) {
            const updated = droppedElements.map(el => {
                if (selectedElements.includes(el.id)) {
                    return { ...el, color: newColor };
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
        const type = e.dataTransfer ? e.dataTransfer.getData('type') : draggedItem;
        if (!type || !MOCKUP_TYPES[type]) return;

        const rect = containerRef.current.getBoundingClientRect();
        
        let clientX = e.clientX;
        let clientY = e.clientY;
        
        if (e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        }

        const newElement = {
            id: Date.now().toString(),
            type,
            x: clientX - rect.left - (MOCKUP_TYPES[type].defaultW / 2),
            y: clientY - rect.top - (MOCKUP_TYPES[type].defaultH / 2),
            w: MOCKUP_TYPES[type].defaultW,
            h: MOCKUP_TYPES[type].defaultH,
        };

        const updatedElements = [...droppedElements, newElement];
        setDroppedElements(updatedElements);
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
                color: elementColor !== 'transparent' ? elementColor : undefined
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
        <WhiteboardOverlay>
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

                <IconButton title="Close Whiteboard" onClick={onClose}>
                    <X size={24} />
                </IconButton>
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
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--colors-textMuted)', marginBottom: '8px' }}>Mockup UI</div>
                    
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

                <CanvasContainer 
                    ref={containerRef}
                    style={{ backgroundColor: bgColor }}
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

                    {/* Render Dropped Mockup Elements */}
                    {droppedElements.map(el => {
                        const Component = MOCKUP_TYPES[el.type]?.component;
                        if (!Component) return null;
                        
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
                                    zIndex: 10,
                                    // Add a slight outline on hover for grabbing visibility
                                    outline: (draggingElementId === el.id || selectedElements.includes(el.id)) ? '2px solid #06b6d4' : 'none',
                                    userSelect: 'none'
                                }}
                                onMouseDown={(e) => {
                                    if (selectedElements.includes(el.id)) return;
                                    handleElementMouseDown(e, el.id);
                                }}
                                onTouchStart={(e) => {
                                    if (selectedElements.includes(el.id)) return;
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
                                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                    <Component />
                                    {el.color && (
                                        <div style={{
                                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                            backgroundColor: el.color,
                                            mixBlendMode: 'color',
                                            pointerEvents: 'none'
                                        }} />
                                    )}
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
                                        background: 'linear-gradient(135deg, transparent 50%, #0ea5e9 50%)',
                                        zIndex: 20
                                    }}
                                    onMouseDown={(e) => handleResizeMouseDown(e, el)}
                                    onTouchStart={(e) => handleResizeMouseDown(e, el)}
                                />
                            </div>
                        )
                    })}

                    {/* Render Group Selection Box */}
                    {selectedElements.length > 0 && (
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
                                                y: el.y + 20
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
                                                y: el.y + 20
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
                </CanvasContainer>
            </MainArea>
        </WhiteboardOverlay>
    );
}
