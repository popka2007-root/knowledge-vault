import React, { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RefreshCw, Layers } from 'lucide-react';
import { Note } from '../types';
import { extractWikiLinks } from '../utils/crypto';

interface GraphViewProps {
  notes: Note[];
  onSelectNote: (id: string) => void;
}

interface NodeItem {
  id: string;
  title: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  linkCount: number;
}

interface LinkItem {
  source: string;
  target: string;
}

export const GraphView: React.FC<GraphViewProps> = ({ notes, onSelectNote }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [hoveredNode, setHoveredNode] = useState<NodeItem | null>(null);

  const nodesRef = useRef<NodeItem[]>([]);
  const linksRef = useRef<LinkItem[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Initialize graph nodes & links from note WikiLinks
  useEffect(() => {
    const width = 800;
    const height = 600;

    // Calculate WikiLinks connections
    const links: LinkItem[] = [];
    const linkCounts: Record<string, number> = {};

    notes.forEach(note => {
      linkCounts[note.id] = linkCounts[note.id] || 0;
      const wikiLinks = extractWikiLinks(note.content);
      wikiLinks.forEach(targetTitle => {
        const targetNote = notes.find(n => n.title.toLowerCase().trim() === targetTitle.toLowerCase().trim());
        if (targetNote) {
          links.push({ source: note.id, target: targetNote.id });
          linkCounts[note.id] = (linkCounts[note.id] || 0) + 1;
          linkCounts[targetNote.id] = (linkCounts[targetNote.id] || 0) + 1;
        }
      });
    });

    const colors = ['#1f6feb', '#a371f7', '#2ea043', '#d29922', '#f85149'];
    const nodes: NodeItem[] = notes.map((note, idx) => {
      const count = linkCounts[note.id] || 0;
      const radius = Math.min(Math.max(12 + count * 4, 12), 32);
      const angle = (idx / notes.length) * Math.PI * 2;
      const distance = 150 + Math.random() * 100;
      return {
        id: note.id,
        title: note.title,
        x: width / 2 + Math.cos(angle) * distance,
        y: height / 2 + Math.sin(angle) * distance,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius,
        color: colors[idx % colors.length],
        linkCount: count
      };
    });

    nodesRef.current = nodes;
    linksRef.current = links;
  }, [notes]);

  // Physics force simulation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const runSimulation = () => {
      const nodes = nodesRef.current;
      const links = linksRef.current;

      // Apply Repulsion between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 200) {
            const force = (200 - dist) / dist * 0.05;
            n1.vx -= dx * force;
            n1.vy -= dy * force;
            n2.vx += dx * force;
            n2.vy += dy * force;
          }
        }
      }

      // Apply Attraction along WikiLink connections
      links.forEach(link => {
        const n1 = nodes.find(n => n.id === link.source);
        const n2 = nodes.find(n => n.id === link.target);
        if (n1 && n2) {
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 100) * 0.005;
          n1.vx += dx * force;
          n1.vy += dy * force;
          n2.vx -= dx * force;
          n2.vy -= dy * force;
        }
      });

      // Update positions with damping
      nodes.forEach(n => {
        n.vx *= 0.85;
        n.vy *= 0.85;
        n.x += n.vx;
        n.y += n.vy;

        // Keep inside bounds
        n.x = Math.max(n.radius, Math.min(width - n.radius, n.x));
        n.y = Math.max(n.radius, Math.min(height - n.radius, n.y));
      });

      // Render Canvas
      ctx.clearRect(0, 0, width, height);

      // Draw Grid Background
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Links
      links.forEach(link => {
        const n1 = nodes.find(n => n.id === link.source);
        const n2 = nodes.find(n => n.id === link.target);
        if (n1 && n2) {
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.strokeStyle = 'rgba(88, 166, 255, 0.35)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // Draw Nodes
      nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.shadowColor = n.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw Node Titles
        ctx.fillStyle = '#f0f6fc';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(n.title, n.x, n.y + n.radius + 16);
      });

      animFrameRef.current = requestAnimationFrame(runSimulation);
    };

    runSimulation();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const clickedNode = nodesRef.current.find(n => {
      const dx = clickX - n.x;
      const dy = clickY - n.y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius;
    });

    if (clickedNode) {
      onSelectNote(clickedNode.id);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const targetNode = nodesRef.current.find(n => {
      const dx = mouseX - n.x;
      const dy = mouseY - n.y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius;
    });

    setHoveredNode(targetNode || null);
  };

  return (
    <div style={{ flex: 1, height: '100%', position: 'relative', overflow: 'hidden', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Floating Bar */}
      <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-secondary)', padding: '8px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', backdropFilter: 'blur(12px)' }}>
        <Layers size={18} style={{ color: 'var(--accent-hover)' }} />
        <div>
          <h2 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Obsidian Force-Directed Graph</h2>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{notes.length} Notes connected via [[WikiLinks]]</p>
        </div>
      </div>

      {/* Hover Card Tooltip */}
      {hoveredNode && (
        <div style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border-focus)', borderRadius: '8px', padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{hoveredNode.title}</div>
          <div style={{ fontSize: '11px', color: 'var(--accent-hover)' }}>{hoveredNode.linkCount} [[WikiLinks]] connections</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Click node to open note</div>
        </div>
      )}

      {/* HTML5 Interactive Graph Canvas */}
      <canvas
        ref={canvasRef}
        width={1000}
        height={700}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        style={{ width: '100%', height: '100%', cursor: hoveredNode ? 'pointer' : 'default' }}
      />
    </div>
  );
};
