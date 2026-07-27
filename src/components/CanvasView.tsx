import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ZoomIn, ZoomOut, StickyNote } from 'lucide-react';
import { CanvasNode, CanvasConnection, Note } from '../types';

interface CanvasViewProps {
  notes: Note[];
  onOpenNote: (id: string) => void;
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
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Global mousemove & mouseup listeners for smooth 60fps canvas dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (draggingNodeId) {
        setNodes(prevNodes => prevNodes.map(n => {
          if (n.id === draggingNodeId) {
            return {
              ...n,
              x: (e.clientX - dragOffset.x) / zoom,
              y: (e.clientY - dragOffset.y) / zoom
            };
          }
          return n;
        }));
      }
    };

    const handleGlobalMouseUp = () => {
      setDraggingNodeId(null);
    };

    if (draggingNodeId) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggingNodeId, dragOffset, zoom]);

  const handleAddCardNode = () => {
    const newNode: CanvasNode = {
      id: `node-${Date.now()}`,
      title: 'New Canvas Card',
      content: 'Click to edit card details...',
      x: 200 + Math.random() * 60,
      y: 200 + Math.random() * 60,
      width: 240,
      height: 130,
      color: '#1f6feb',
      type: 'card'
    };
    setNodes([...nodes, newNode]);
    setSelectedNodeId(newNode.id);
  };

  const handleAddStickyNote = () => {
    const newSticky: CanvasNode = {
      id: `sticky-${Date.now()}`,
      title: 'Sticky Note 📌',
      content: 'Idea or quick thought...',
      x: 220 + Math.random() * 40,
      y: 220 + Math.random() * 40,
      width: 200,
      height: 140,
      color: '#d29922',
      type: 'note'
    };
    setNodes([...nodes, newSticky]);
    setSelectedNodeId(newSticky.id);
  };

  const handleDeleteNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
    setConnections(connections.filter(c => c.fromNodeId !== id && c.toNodeId !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const handleMouseDown = (node: CanvasNode, e: React.MouseEvent) => {
    setSelectedNodeId(node.id);
    setDraggingNodeId(node.id);
    setDragOffset({
      x: e.clientX - node.x * zoom,
      y: e.clientY - node.y * zoom
    });
  };

  return (
    <div style={{ flex: 1, height: '100%', position: 'relative', overflow: 'hidden', background: 'var(--bg-primary)', userSelect: 'none' }}>
      {/* AFFiNE Floating Toolbar */}
      <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, display: 'flex', gap: '8px', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)' }}>
        <button className="btn btn-primary" onClick={handleAddCardNode} style={{ padding: '6px 12px', fontSize: '12px' }}>
          <Plus size={14} />
          <span>Note Card</span>
        </button>

        <button className="btn" onClick={handleAddStickyNote} style={{ padding: '6px 12px', fontSize: '12px' }}>
          <StickyNote size={14} style={{ color: '#d29922' }} />
          <span>Sticky Note</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderLeft: '1px solid var(--border-color)', paddingLeft: '8px' }}>
          <button className="btn-icon" onClick={() => setZoom(Math.min(zoom + 0.1, 1.5))} title="Zoom In">
            <ZoomIn size={16} />
          </button>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{Math.round(zoom * 100)}%</span>
          <button className="btn-icon" onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))} title="Zoom Out">
            <ZoomOut size={16} />
          </button>
        </div>
      </div>

      {/* SVG Canvas Connections Overlay */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {connections.map(conn => {
          const fromNode = nodes.find(n => n.id === conn.fromNodeId);
          const toNode = nodes.find(n => n.id === conn.toNodeId);
          if (!fromNode || !toNode) return null;

          const startX = (fromNode.x + fromNode.width / 2) * zoom;
          const startY = (fromNode.y + fromNode.height / 2) * zoom;
          const endX = (toNode.x + toNode.width / 2) * zoom;
          const endY = (toNode.y + toNode.height / 2) * zoom;

          return (
            <g key={conn.id}>
              <line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke="var(--accent-hover)"
                strokeWidth={2 * zoom}
                strokeDasharray="4 4"
              />
            </g>
          );
        })}
      </svg>

      {/* Render AFFiNE Edgeless Canvas Nodes */}
      <div style={{ transform: `scale(${zoom})`, transformOrigin: '0 0', width: '100%', height: '100%' }}>
        {nodes.map(node => {
          const isSelected = node.id === selectedNodeId;
          const isSticky = node.type === 'note';
          return (
            <div
              key={node.id}
              className={`canvas-node ${isSelected ? 'selected' : ''}`}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: `${node.width}px`,
                background: isSticky ? 'rgba(210, 153, 34, 0.15)' : 'var(--bg-secondary)',
                borderColor: isSelected ? 'var(--border-focus)' : node.color || 'var(--border-color)',
                boxShadow: isSticky ? '0 4px 16px rgba(210, 153, 34, 0.2)' : '0 8px 32px rgba(0,0,0,0.4)'
              }}
              onMouseDown={(e) => handleMouseDown(node, e)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: isSticky ? '#d29922' : 'var(--text-primary)' }}>{node.title}</span>
                <button 
                  className="btn-icon" 
                  style={{ padding: '2px', color: 'var(--danger)' }} 
                  onClick={() => handleDeleteNode(node.id)}
                  title="Delete Card"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <textarea
                value={node.content}
                onChange={(e) => {
                  const val = e.target.value;
                  setNodes(nodes.map(n => n.id === node.id ? { ...n, content: val } : n));
                }}
                style={{
                  width: '100%',
                  height: '65px',
                  background: 'transparent',
                  border: 'none',
                  color: isSticky ? '#f0f6fc' : 'var(--text-secondary)',
                  fontSize: '12px',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
