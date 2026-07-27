import React, { useEffect, useRef } from 'react';
import { Layers } from 'lucide-react';
import * as d3 from 'd3';
import { Note } from '../types';
import { extractWikiLinks } from '../utils/crypto';

interface GraphViewProps {
  notes: Note[];
  onSelectNote: (id: string) => void;
}

interface NodeDatum extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  color: string;
  radius: number;
  linkCount: number;
}

interface LinkDatum extends d3.SimulationLinkDatum<NodeDatum> {
  source: string | NodeDatum;
  target: string | NodeDatum;
}

export const GraphView: React.FC<GraphViewProps> = ({ notes, onSelectNote }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Track hover state outside of d3 react cycle
  const hoveredNodeIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize observer to keep canvas perfectly scaled for High DPI (Retina)
    const resizeCanvas = () => {
      const { clientWidth, clientHeight } = container;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = clientWidth * dpr;
      canvas.height = clientHeight * dpr;
      canvas.style.width = `${clientWidth}px`;
      canvas.style.height = `${clientHeight}px`;
      ctx.scale(dpr, dpr);
      
      // Update center force on resize
      if (simulation) {
        simulation.force('center', d3.forceCenter(clientWidth / 2, clientHeight / 2));
        simulation.alpha(0.3).restart();
      }
    };

    window.addEventListener('resize', resizeCanvas);

    // Build Graph Data
    const linkCounts: Record<string, number> = {};
    const links: LinkDatum[] = [];
    
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
    const nodes: NodeDatum[] = notes.map((note, idx) => ({
      id: note.id,
      title: note.title,
      color: colors[idx % colors.length],
      linkCount: linkCounts[note.id] || 0,
      radius: Math.min(Math.max(5 + (linkCounts[note.id] || 0) * 1.5, 5), 18), // Sizes like Obsidian based on connections
    }));

    // Precalculate adjacency list for fast hover highlighting
    const adjacencyList = new Map<string, Set<string>>();
    nodes.forEach(n => adjacencyList.set(n.id, new Set()));
    links.forEach(l => {
      adjacencyList.get(l.source as string)?.add(l.target as string);
      adjacencyList.get(l.target as string)?.add(l.source as string);
    });

    let currentTransform = d3.zoomIdentity;

    // Simulation
    const simulation = d3.forceSimulation<NodeDatum>(nodes)
      .force('charge', d3.forceManyBody().strength(-200).distanceMax(500))
      .force('link', d3.forceLink<NodeDatum, LinkDatum>(links).id(d => d.id).distance(80))
      .force('center', d3.forceCenter(container.clientWidth / 2, container.clientHeight / 2))
      .force('collide', d3.forceCollide().radius(d => (d as NodeDatum).radius + 15).iterations(2))
      .on('tick', draw);

    // Draw Function
    function draw() {
      if (!ctx || !container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;

      // Fill with dark theme background like Obsidian
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, width, height);
      
      ctx.save();
      ctx.translate(currentTransform.x, currentTransform.y);
      ctx.scale(currentTransform.k, currentTransform.k);

      const hoveredId = hoveredNodeIdRef.current;
      let connectedIds: Set<string> | null = null;
      if (hoveredId) {
        connectedIds = adjacencyList.get(hoveredId) || new Set();
      }

      // Draw Links
      links.forEach(link => {
        const source = link.source as NodeDatum;
        const target = link.target as NodeDatum;
        
        let isHighlighted = false;
        let isDimmed = false;

        if (hoveredId) {
          if (source.id === hoveredId || target.id === hoveredId) {
            isHighlighted = true;
          } else {
            isDimmed = true;
          }
        }

        ctx.beginPath();
        ctx.moveTo(source.x || 0, source.y || 0);
        ctx.lineTo(target.x || 0, target.y || 0);
        
        if (isHighlighted) {
          ctx.strokeStyle = 'rgba(88, 166, 255, 0.9)'; // Bright blue for active links
          ctx.lineWidth = Math.max(2 / currentTransform.k, 1.5);
        } else if (isDimmed) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'; // Barely visible when something else is hovered
          ctx.lineWidth = Math.max(1 / currentTransform.k, 0.5);
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; // Default subtle link
          ctx.lineWidth = Math.max(1 / currentTransform.k, 0.5);
        }
        
        ctx.stroke();
      });

      // Draw Nodes
      nodes.forEach(node => {
        let isHovered = false;
        let isNeighbor = false;
        let isDimmed = false;

        if (hoveredId) {
          if (node.id === hoveredId) {
            isHovered = true;
          } else if (connectedIds?.has(node.id)) {
            isNeighbor = true;
          } else {
            isDimmed = true;
          }
        }

        ctx.beginPath();
        ctx.moveTo((node.x || 0) + node.radius, node.y || 0);
        ctx.arc(node.x || 0, node.y || 0, node.radius, 0, 2 * Math.PI);
        
        if (isDimmed) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        } else {
          ctx.fillStyle = node.color;
        }

        // Obsidian-like glow for hovered/neighbors
        if (isHovered || isNeighbor) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = node.color;
        } else {
          ctx.shadowBlur = 0;
        }
        
        ctx.fill();
        ctx.shadowBlur = 0; // reset
        
        // Draw Labels
        // Show labels if hovered, neighbor, zoomed in enough, or if it's a big node
        if (!isDimmed && (currentTransform.k > 1.2 || isHovered || isNeighbor || node.radius > 8)) {
          const fontSize = Math.max(11 / currentTransform.k, 5);
          ctx.font = `500 ${fontSize}px Inter, sans-serif`;
          ctx.fillStyle = (isHovered || isNeighbor) ? '#ffffff' : 'rgba(255, 255, 255, 0.7)';
          ctx.textAlign = 'center';
          ctx.fillText(node.title, node.x || 0, (node.y || 0) + node.radius + (14 / currentTransform.k));
        }
      });

      ctx.restore();
    }

    // Interaction Setup
    const d3Canvas = d3.select(canvas);

    // Zoom & Pan
    const zoomBehavior = d3.zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        currentTransform = event.transform;
        draw();
      });
      
    d3Canvas.call(zoomBehavior);
    
    // Double click to reset zoom
    d3Canvas.on('dblclick.zoom', null);
    d3Canvas.on('dblclick', () => {
      d3Canvas.transition().duration(750).call(zoomBehavior.transform, d3.zoomIdentity);
    });

    // Drag
    d3Canvas.call(d3.drag<HTMLCanvasElement, unknown>()
      .subject((event) => {
        const [x, y] = currentTransform.invert([event.x, event.y]);
        let closestNode = null;
        let minDistance = Infinity;
        for (const node of nodes) {
          const dx = x - (node.x || 0);
          const dy = y - (node.y || 0);
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < node.radius + 10 && dist < minDistance) {
            minDistance = dist;
            closestNode = node;
          }
        }
        return closestNode;
      })
      .on('start', (event) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
        document.body.style.cursor = 'grabbing';
      })
      .on('drag', (event) => {
        event.subject.fx = currentTransform.invertX(event.x);
        event.subject.fy = currentTransform.invertY(event.y);
      })
      .on('end', (event) => {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
        document.body.style.cursor = 'default';
      })
    );

    // Hover (MouseMove) & Click
    d3Canvas.on('mousemove', (event) => {
      const [x, y] = currentTransform.invert(d3.pointer(event));
      let closestNode: NodeDatum | null = null;
      let minDistance = Infinity;
      
      for (const node of nodes) {
        const dx = x - (node.x || 0);
        const dy = y - (node.y || 0);
        const dist = Math.sqrt(dx * dx + dy * dy);
        // generously increase hit area for hover
        if (dist < node.radius + 8 && dist < minDistance) {
          minDistance = dist;
          closestNode = node;
        }
      }

      if (closestNode?.id !== hoveredNodeIdRef.current) {
        hoveredNodeIdRef.current = closestNode?.id || null;
        canvas.style.cursor = closestNode ? 'pointer' : 'default';
        draw();
      }
    });

    d3Canvas.on('click', (event) => {
      // Prevent click if we were dragging
      if (event.defaultPrevented) return;
      if (hoveredNodeIdRef.current) {
        onSelectNote(hoveredNodeIdRef.current);
      }
    });

    // Initial sizing
    resizeCanvas();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      simulation.stop();
    };
  }, [notes, onSelectNote]);

  return (
    <div ref={containerRef} style={{ flex: 1, height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-secondary)', padding: '8px 16px', borderRadius: '10px', border: '1px solid var(--border-color)', backdropFilter: 'blur(12px)' }}>
        <Layers size={18} style={{ color: 'var(--accent-hover)' }} />
        <div>
          <h2 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Obsidian Graph View</h2>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{notes.length} Notes (Powered by D3.js)</p>
        </div>
      </div>
      
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
};
