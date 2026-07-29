import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, ZoomIn, ZoomOut, StickyNote, RotateCcw, Palette } from 'lucide-react';
import { CanvasNode, CanvasConnection, Note } from '../types';

interface CanvasViewProps {
  notes: Note[];
  onOpenNote: (id: string) => void;
}

export function screenToCanvasCoordinates(
  screenX: number,
  screenY: number,
  panX: number,
  panY: number,
  zoom: number
): { x: number; y: number } {
  return {
    x: (screenX - panX) / zoom,
    y: (screenY - panY) / zoom,
  };
}

export function canvasToScreenCoordinates(
  canvasX: number,
  canvasY: number,
  panX: number,
  panY: number,
  zoom: number
): { x: number; y: number } {
  return {
    x: canvasX * zoom + panX,
    y: canvasY * zoom + panY,
  };
}

export function clampZoom(zoom: number, minZoom = 0.2, maxZoom = 2.5): number {
  return Math.min(Math.max(zoom, minZoom), maxZoom);
}

export function calculateConnectorPath(
  fromNode: { x: number; y: number; width: number; height: number },
  toNode: { x: number; y: number; width: number; height: number },
  zoom = 1,
  pan = { x: 0, y: 0 }
): { startX: number; startY: number; endX: number; endY: number; pathData: string } {
  const startX = (fromNode.x + fromNode.width / 2) * zoom + pan.x;
  const startY = (fromNode.y + fromNode.height / 2) * zoom + pan.y;
  const endX = (toNode.x + toNode.width / 2) * zoom + pan.x;
  const endY = (toNode.y + toNode.height / 2) * zoom + pan.y;

  const distX = Math.abs(endX - startX) * 0.5;
  const pathData = `M ${startX},${startY} C ${startX + distX},${startY} ${endX - distX},${endY} ${endX},${endY}`;

  return { startX, startY, endX, endY, pathData };
}

export const CanvasView: React.FC<CanvasViewProps> = ({ notes, onOpenNote }) => {
  const [nodes, setNodes] = useState<CanvasNode[]>([
    { id: 'node-1', title: 'Main Project Vision', content: 'Notesnook + Obsidian + AFFiNE hybrid knowledge workspace.', x: 100, y: 120, width: 240, height: 130, color: '#1f6feb', type: 'card' },
    { id: 'node-2', title: 'Security & E2EE', content: 'Client-side AES-256 encrypted vaults for password protection.', x: 440, y: 80, width: 240, height: 130, color: '#a371f7', type: 'card' },
    { id: 'node-3', title: 'AFFiNE Edgeless Whiteboard', content: 'Sticky notes, connecting arrows, shapes, and 2D canvas nodes.', x: 440, y: 270, width: 240, height: 130, color: '#2ea043', type: 'note' }
  ]);

  const [connections, setConnections] = useState<CanvasConnection[]>([
    { id: 'conn-1', fromNodeId: 'node-1', toNodeId: 'node-2' },
    { id: 'conn-2', fromNodeId: 'node-1', toNodeId: 'node-3' }
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [resizingNodeId, setResizingNodeId] = useState<string | null>(null);
  
  // Panning state
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialPan, setInitialPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [resizeOffset, setResizeOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);

  const containerRef = useRef<HTMLDivElement>(null);

  // Global mousemove & mouseup listeners for smooth panning, card dragging and resizing
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        setPanX(initialPan.x + (e.clientX - panStart.x));
        setPanY(initialPan.y + (e.clientY - panStart.y));
      } else if (draggingNodeId) {
        setNodes(prevNodes => prevNodes.map(n => {
          if (n.id === draggingNodeId) {
            return {
              ...n,
              x: (e.clientX - dragOffset.x - panX) / zoom,
              y: (e.clientY - dragOffset.y - panY) / zoom
            };
          }
          return n;
        }));
      } else if (resizingNodeId) {
        setNodes(prevNodes => prevNodes.map(n => {
          if (n.id === resizingNodeId) {
            return {
              ...n,
              width: Math.max(100, (e.clientX - resizeOffset.x - panX) / zoom - n.x),
              height: Math.max(60, (e.clientY - resizeOffset.y - panY) / zoom - n.y)
            };
          }
          return n;
        }));
      }
    };

    const handleGlobalMouseUp = () => {
      setIsPanning(false);
      setDraggingNodeId(null);
      setResizingNodeId(null);
    };

    if (isPanning || draggingNodeId || resizingNodeId) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isPanning, draggingNodeId, resizingNodeId, panStart, initialPan, dragOffset, resizeOffset, panX, panY, zoom]);

  const handleBackgroundMouseDown = (e: React.MouseEvent) => {
    // Only start panning if clicked directly on canvas background or SVG
    const target = e.target as HTMLElement;
    const isNodeOrControl = target.closest('.canvas-node') || target.closest('.floating-toolbar');
    if (isNodeOrControl) return;

    setSelectedNodeId(null);
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
    setInitialPan({ x: panX, y: panY });
  };

  const addCard = () => {
    const canvasCenter = screenToCanvasCoordinates(
      (containerRef.current?.clientWidth || 800) / 2,
      (containerRef.current?.clientHeight || 600) / 2,
      panX,
      panY,
      zoom
    );
    const newNode: CanvasNode = {
      id: `node-${Date.now()}`,
      title: 'New Canvas Card',
      content: 'Click to edit card content...',
      x: canvasCenter.x - 110 + Math.random() * 30,
      y: canvasCenter.y - 60 + Math.random() * 30,
      width: 220,
      height: 130,
      color: '#1f6feb',
      type: 'card'
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  };

  const addStickyNote = (color: string) => {
    const canvasCenter = screenToCanvasCoordinates(
      (containerRef.current?.clientWidth || 800) / 2,
      (containerRef.current?.clientHeight || 600) / 2,
      panX,
      panY,
      zoom
    );
    const newNode: CanvasNode = {
      id: `sticky-${Date.now()}`,
      title: 'Sticky Note 📌',
      content: 'Write quick idea or reminder...',
      x: canvasCenter.x - 90 + Math.random() * 30,
      y: canvasCenter.y - 70 + Math.random() * 30,
      width: 190,
      height: 140,
      color: color,
      type: 'note'
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  };

  const handleDeleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setConnections(prev => prev.filter(c => c.fromNodeId !== id && c.toNodeId !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const handleChangeNodeColor = (id: string, color: string) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, color } : n));
  };

  const handleMouseDownNode = (node: CanvasNode, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName.toLowerCase() === 'textarea') return;
    if ((e.target as HTMLElement).classList.contains('resize-handle')) return;
    if ((e.target as HTMLElement).closest('button')) return;

    setSelectedNodeId(node.id);
    setDraggingNodeId(node.id);
    setDragOffset({
      x: e.clientX - (node.x * zoom + panX),
      y: e.clientY - (node.y * zoom + panY)
    });
  };

  const handleResizeMouseDown = (node: CanvasNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
    setResizingNodeId(node.id);
    setResizeOffset({
      x: e.clientX - ((node.x + node.width) * zoom + panX),
      y: e.clientY - ((node.y + node.height) * zoom + panY)
    });
  };

  const handleResetView = () => {
    setPanX(0);
    setPanY(0);
    setZoom(1);
  };

  const stickyColors = [
    { label: 'Yellow', color: '#ffb703' },
    { label: 'Pink', color: '#ff007f' },
    { label: 'Green', color: '#2ea043' },
    { label: 'Blue', color: '#1f6feb' },
    { label: 'Purple', color: '#a371f7' }
  ];

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleBackgroundMouseDown}
      style={{
        flex: 1,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
        backgroundImage: 'radial-gradient(var(--border-color) 1px, transparent 1px)',
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${panX}px ${panY}px`,
        userSelect: 'none',
        cursor: isPanning ? 'grabbing' : 'default'
      }}
    >
      {/* Floating Toolbar */}
      <div
        className="floating-toolbar"
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-secondary)',
          padding: '6px 12px',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(16px)'
        }}
      >
        <button className="btn btn-primary" onClick={addCard} style={{ padding: '6px 12px', fontSize: '12px' }}>
          <Plus size={14} />
          <span>Note Card</span>
        </button>

        {/* Multi-color Sticky Note Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderLeft: '1px solid var(--border-color)', paddingLeft: '8px' }}>
          {stickyColors.map(sc => (
            <button
              key={sc.color}
              className="btn"
              onClick={() => addStickyNote(sc.color)}
              title={`Add ${sc.label} Sticky Note`}
              style={{ padding: '6px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <StickyNote size={14} style={{ color: sc.color }} />
            </button>
          ))}
        </div>

        {/* Selected Node Color Picker */}
        {selectedNode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderLeft: '1px solid var(--border-color)', paddingLeft: '8px' }}>
            <Palette size={14} style={{ color: 'var(--text-muted)' }} />
            {stickyColors.map(sc => (
              <button
                key={sc.color}
                onClick={() => handleChangeNodeColor(selectedNode.id, sc.color)}
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: sc.color,
                  border: selectedNode.color === sc.color ? '2px solid #ffffff' : 'none',
                  cursor: 'pointer'
                }}
                title={`Change color to ${sc.label}`}
              />
            ))}
          </div>
        )}

        {/* Zoom & Reset Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderLeft: '1px solid var(--border-color)', paddingLeft: '8px' }}>
          <button className="btn-icon" onClick={() => setZoom(prev => clampZoom(prev + 0.1))} title="Zoom In">
            <ZoomIn size={16} />
          </button>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '36px', textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button className="btn-icon" onClick={() => setZoom(prev => clampZoom(prev - 0.1))} title="Zoom Out">
            <ZoomOut size={16} />
          </button>
          <button className="btn-icon" onClick={handleResetView} title="Reset View & Pan">
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* SVG Canvas Connections Overlay */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent-hover)" />
          </marker>
        </defs>
        {connections.map(conn => {
          const fromNode = nodes.find(n => n.id === conn.fromNodeId);
          const toNode = nodes.find(n => n.id === conn.toNodeId);
          if (!fromNode || !toNode) return null;

          const { pathData } = calculateConnectorPath(fromNode, toNode, zoom, { x: panX, y: panY });

          return (
            <g key={conn.id}>
              <path
                d={pathData}
                fill="none"
                stroke="var(--accent-hover)"
                strokeWidth={2 * zoom}
                markerEnd="url(#arrow)"
              />
            </g>
          );
        })}
      </svg>

      {/* Render Canvas Nodes in Scaled & Panned Space */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}>
        {nodes.map(node => {
          const isSelected = node.id === selectedNodeId;
          const isSticky = node.type === 'note';
          const screenPos = canvasToScreenCoordinates(node.x, node.y, panX, panY, zoom);

          return (
            <div
              key={node.id}
              className={`canvas-node ${isSelected ? 'selected' : ''}`}
              style={{
                left: `${screenPos.x}px`,
                top: `${screenPos.y}px`,
                width: `${node.width * zoom}px`,
                height: `${node.height * zoom}px`,
                background: isSticky ? `${node.color || '#ffb703'}22` : 'var(--bg-secondary)',
                borderColor: isSelected ? 'var(--border-focus)' : node.color || 'var(--border-color)',
                boxShadow: isSticky ? `0 4px 16px ${node.color || '#ffb703'}33` : '0 8px 32px rgba(0,0,0,0.4)',
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                padding: `${12 * zoom}px`,
                borderRadius: `${8 * zoom}px`,
                borderWidth: `${Math.max(1, 1 * zoom)}px`,
                borderStyle: 'solid',
                pointerEvents: 'auto',
                boxSizing: 'border-box'
              }}
              onMouseDown={(e) => handleMouseDownNode(node, e)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: `${6 * zoom}px` }}>
                <span style={{ fontSize: `${Math.max(10, 13 * zoom)}px`, fontWeight: '600', color: isSticky ? node.color || '#d29922' : 'var(--text-primary)' }}>
                  {node.title}
                </span>
                <button 
                  className="btn-icon" 
                  style={{ padding: '2px', color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer' }} 
                  onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id); }}
                  title="Delete Node"
                >
                  <Trash2 size={Math.max(10, 13 * zoom)} />
                </button>
              </div>

              <textarea
                value={node.content}
                onChange={(e) => {
                  const val = e.target.value;
                  setNodes(prev => prev.map(n => n.id === node.id ? { ...n, content: val } : n));
                }}
                onMouseDown={(e) => {
                  setSelectedNodeId(node.id);
                  e.stopPropagation();
                }}
                style={{
                  width: '100%',
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: isSticky ? '#f0f6fc' : 'var(--text-secondary)',
                  fontSize: `${Math.max(9, 12 * zoom)}px`,
                  outline: 'none',
                  resize: 'none'
                }}
              />
              
              {/* Resize Handle */}
              <div
                className="resize-handle"
                onMouseDown={(e) => handleResizeMouseDown(node, e)}
                style={{
                  position: 'absolute',
                  right: 0,
                  bottom: 0,
                  width: `${16 * zoom}px`,
                  height: `${16 * zoom}px`,
                  cursor: 'nwse-resize',
                  borderBottomRightRadius: `${8 * zoom}px`,
                  background: 'linear-gradient(135deg, transparent 50%, var(--border-color) 50%)'
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
