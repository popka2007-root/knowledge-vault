import React, { useState } from 'react';
import { Plus, Move, Trash2, ArrowRight, FileText, ZoomIn, ZoomOut } from 'lucide-react';
import { CanvasNode, CanvasConnection, Note } from '../types';

interface CanvasViewProps {
  notes: Note[];
  onOpenNote: (id: string) => void;
}

export const CanvasView: React.FC<CanvasViewProps> = ({ notes, onOpenNote }) => {
  const [nodes, setNodes] = useState<CanvasNode[]>([
    { id: 'node-1', title: 'Main Project Vision', content: 'Notesnook + Obsidian + AFFiNE hybrid knowledge workspace.', x: 100, y: 120, width: 220, height: 120, color: '#1f6feb' },
    { id: 'node-2', title: 'Security & E2EE', content: 'Client-side AES-256 encrypted vaults for password protection.', x: 420, y: 80, width: 220, height: 120, color: '#a371f7' },
    { id: 'node-3', title: 'Graph & WikiLinks', content: 'Bi-directional [[links]] and interactive 2D graph view.', x: 420, y: 260, width: 220, height: 120, color: '#2ea043' }
  ]);

  const [connections, setConnections] = useState<CanvasConnection[]>([
    { id: 'conn-1', fromNodeId: 'node-1', toNodeId: 'node-2' },
    { id: 'conn-2', fromNodeId: 'node-1', toNodeId: 'node-3' }
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const handleAddNode = () => {
    const newNode: CanvasNode = {
      id: `node-${Date.now()}`,
      title: 'New Canvas Card',
      content: 'Click to edit card details...',
      x: 200 + Math.random() * 50,
      y: 200 + Math.random() * 50,
      width: 220,
      height: 120,
      color: '#1f6feb'
    };
    setNodes([...nodes, newNode]);
    setSelectedNodeId(newNode.id);
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
      x: e.clientX - node.x,
      y: e.clientY - node.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId) {
      setNodes(nodes.map(n => {
        if (n.id === draggingNodeId) {
          return {
            ...n,
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y
          };
        }
        return n;
      }));
    }
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  return (
    <div 
      style={{ flex: 1, height: '100%', position: 'relative', overflow: 'hidden', background: 'var(--bg-primary)', userSelect: 'none' }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Floating Controls */}
      <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, display: 'flex', gap: '8px', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
        <button className="btn btn-primary" onClick={handleAddNode} style={{ padding: '6px 12px', fontSize: '12px' }}>
          <Plus size={14} />
          <span>Add Card</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderLeft: '1px solid var(--border-color)', paddingLeft: '8px' }}>
          <button className="btn-icon" onClick={() => setZoom(Math.min(zoom + 0.1, 1.5))} title="Zoom In">
            <ZoomIn size={16} />
          </button>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{Math.round(zoom * 100)}%</span>
          <button className="btn-icon" onClick={() => setZoom(Math.max(zoom - 0.1, 0.6))} title="Zoom Out">
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
            <line
              key={conn.id}
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke="var(--accent-hover)"
              strokeWidth={2 * zoom}
              strokeDasharray="4 4"
            />
          );
        })}
      </svg>

      {/* Render Canvas Nodes */}
      <div style={{ transform: `scale(${zoom})`, transformOrigin: '0 0', width: '100%', height: '100%' }}>
        {nodes.map(node => {
          const isSelected = node.id === selectedNodeId;
          return (
            <div
              key={node.id}
              className={`canvas-node ${isSelected ? 'selected' : ''}`}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: `${node.width}px`,
                borderColor: isSelected ? 'var(--border-focus)' : node.color || 'var(--border-color)'
              }}
              onMouseDown={(e) => handleMouseDown(node, e)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{node.title}</span>
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
                  height: '60px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
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
