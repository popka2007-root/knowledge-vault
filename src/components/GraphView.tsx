import React, { useEffect, useRef } from 'react';
import { Note } from '../types';
import { extractWikiLinks } from '../utils/crypto';

interface GraphViewProps {
  notes: Note[];
  onSelectNote: (id: string) => void;
}

export const GraphView: React.FC<GraphViewProps> = ({ notes, onSelectNote }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = canvas.parentElement?.clientHeight || 600;

    const width = canvas.width;
    const height = canvas.height;

    // Map notes into Graph Nodes with layout coordinates
    const graphNodes = notes.map((note, index) => {
      const angle = (index / Math.max(notes.length, 1)) * Math.PI * 2;
      const radius = 180 + (index % 3) * 40;
      return {
        id: note.id,
        title: note.title || 'Untitled',
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        links: extractWikiLinks(note.content),
        isEncrypted: note.isEncrypted
      };
    });

    // Draw Loop
    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw Connections (Edges)
      graphNodes.forEach((node) => {
        node.links.forEach((targetTitle) => {
          const targetNode = graphNodes.find((n) => n.title.toLowerCase() === targetTitle.toLowerCase());
          if (targetNode) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(targetNode.x, targetNode.y);
            ctx.strokeStyle = 'rgba(88, 166, 255, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        });
      });

      // Draw Nodes (Circles + Labels)
      graphNodes.forEach((node) => {
        // Node Glow Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = node.isEncrypted ? '#a371f7' : '#1f6feb';
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Node Title Text
        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = '#f0f6fc';
        ctx.textAlign = 'center';
        ctx.fillText(node.title, node.x, node.y + 22);
      });
    };

    render();

    // Click handler to open note from node
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      graphNodes.forEach((node) => {
        const dist = Math.hypot(clickX - node.x, clickY - node.y);
        if (dist <= 12) {
          onSelectNote(node.id);
        }
      });
    };

    canvas.addEventListener('click', handleCanvasClick);

    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [notes, onSelectNote]);

  return (
    <div style={{ flex: 1, height: '100%', position: 'relative', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Interactive Knowledge Graph</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Visualizing bi-directional [[wikilinks]] between notes</p>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', cursor: 'pointer' }} />
      </div>
    </div>
  );
};
