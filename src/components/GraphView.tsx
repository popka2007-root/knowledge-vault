import React, { useEffect, useRef } from 'react';
import { Layers, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
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

// Color palette based on note tags (Obsidian-like)
function getNodeColor(note: Note, index: number): string {
  const palette = ['#1f6feb', '#a371f7', '#2ea043', '#d29922', '#f85149', '#3fb950', '#58a6ff', '#e3b341'];
  if (note.tags && note.tags.length > 0) {
    // Deterministic color from first tag
    let hash = 0;
    for (let i = 0; i < note.tags[0].length; i++) {
      hash = note.tags[0].charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
  }
  return palette[index % palette.length];
}

export const GraphView: React.FC<GraphViewProps> = ({ notes, onSelectNote }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoveredNodeIdRef = useRef<string | null>(null);
  // Store simulation and zoom refs so controls can access them
  const simulationRef = useRef<d3.Simulation<NodeDatum, LinkDatum> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<HTMLCanvasElement, unknown> | null>(null);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // === Build Graph Data ===
    const linkCounts: Record<string, number> = {};
    const links: LinkDatum[] = [];

    notes.forEach(note => {
      linkCounts[note.id] = linkCounts[note.id] || 0;
      const wikiLinks = extractWikiLinks(note.content);
      wikiLinks.forEach(targetTitle => {
        const targetNote = notes.find(n => n.title.toLowerCase().trim() === targetTitle.toLowerCase().trim());
        if (targetNote) {
          // avoid duplicate links
          const alreadyExists = links.some(
            l => (l.source === note.id && l.target === targetNote.id) ||
                 (l.source === targetNote.id && l.target === note.id)
          );
          if (!alreadyExists) {
            links.push({ source: note.id, target: targetNote.id });
          }
          linkCounts[note.id] = (linkCounts[note.id] || 0) + 1;
          linkCounts[targetNote.id] = (linkCounts[targetNote.id] || 0) + 1;
        }
      });
    });

    const nodes: NodeDatum[] = notes.map((note, idx) => ({
      id: note.id,
      title: note.title,
      color: getNodeColor(note, idx),
      linkCount: linkCounts[note.id] || 0,
      radius: Math.min(Math.max(6 + (linkCounts[note.id] || 0) * 2, 6), 20),
    }));

    // Adjacency list for hover highlighting
    const adjacencyList = new Map<string, Set<string>>();
    nodes.forEach(n => adjacencyList.set(n.id, new Set()));
    links.forEach(l => {
      adjacencyList.get(l.source as string)?.add(l.target as string);
      adjacencyList.get(l.target as string)?.add(l.source as string);
    });

    // === Draw Function ===
    function draw() {
      if (!ctx || !container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      const t = transformRef.current;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.scale(t.k, t.k);

      const hoveredId = hoveredNodeIdRef.current;
      const connectedIds = hoveredId ? (adjacencyList.get(hoveredId) || new Set<string>()) : null;

      // Draw Links
      links.forEach(link => {
        const source = link.source as NodeDatum;
        const target = link.target as NodeDatum;
        if (!source.x || !target.x) return;

        const isHighlighted = hoveredId && (source.id === hoveredId || target.id === hoveredId);
        const isDimmed = hoveredId && !isHighlighted;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y || 0);
        ctx.lineTo(target.x, target.y || 0);

        if (isHighlighted) {
          ctx.strokeStyle = 'rgba(88, 166, 255, 0.95)';
          ctx.lineWidth = 2 / t.k;
        } else if (isDimmed) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.lineWidth = 1 / t.k;
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
          ctx.lineWidth = 1 / t.k;
        }
        ctx.stroke();
      });

      // Draw Nodes
      nodes.forEach(node => {
        const isHovered = hoveredId === node.id;
        const isNeighbor = !!(connectedIds?.has(node.id));
        const isDimmed = !!(hoveredId && !isHovered && !isNeighbor);

        // Glow effect
        if (isHovered) {
          ctx.shadowBlur = 20 / t.k;
          ctx.shadowColor = node.color;
        } else if (isNeighbor) {
          ctx.shadowBlur = 10 / t.k;
          ctx.shadowColor = node.color;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.arc(node.x || 0, node.y || 0, isHovered ? node.radius * 1.3 : node.radius, 0, 2 * Math.PI);
        ctx.fillStyle = isDimmed ? 'rgba(120, 120, 130, 0.2)' : node.color;
        ctx.fill();

        // Node border on hover
        if (isHovered) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2 / t.k;
          ctx.stroke();
        }

        ctx.shadowBlur = 0;

        // Labels: always show for hub nodes (many connections), hovered, neighbors, or zoomed in
        const showLabel = !isDimmed && (isHovered || isNeighbor || t.k > 1.5 || node.radius >= 12);
        if (showLabel) {
          const fontSize = Math.max(12 / t.k, 7);
          ctx.font = `${isHovered ? '700' : '500'} ${fontSize}px Inter, -apple-system, sans-serif`;
          ctx.fillStyle = isHovered ? '#ffffff' : (isNeighbor ? 'rgba(255,255,255,0.9)' : 'rgba(220,220,230,0.7)');
          ctx.textAlign = 'center';
          ctx.fillText(node.title, node.x || 0, (node.y || 0) + node.radius + (16 / t.k));
        }
      });

      ctx.restore();
    }

    // === Setup D3 Simulation ===
    const simulation = d3.forceSimulation<NodeDatum>(nodes)
      .force('charge', d3.forceManyBody<NodeDatum>().strength(n => -150 - n.linkCount * 20).distanceMax(600))
      .force('link', d3.forceLink<NodeDatum, LinkDatum>(links).id(d => d.id).distance(d => {
        const s = d.source as NodeDatum;
        const t = d.target as NodeDatum;
        return 80 + (s.linkCount + t.linkCount) * 4;
      }))
      .force('center', d3.forceCenter(container.clientWidth / 2, container.clientHeight / 2))
      .force('collide', d3.forceCollide<NodeDatum>().radius(d => d.radius + 18).iterations(3))
      .on('tick', draw);

    simulationRef.current = simulation as unknown as d3.Simulation<NodeDatum, LinkDatum>;

    // === Setup Canvas Size ===
    const resizeCanvas = () => {
      const { clientWidth, clientHeight } = container;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = clientWidth * dpr;
      canvas.height = clientHeight * dpr;
      canvas.style.width = `${clientWidth}px`;
      canvas.style.height = `${clientHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      simulation.force('center', d3.forceCenter(clientWidth / 2, clientHeight / 2));
      simulation.alpha(0.2).restart();
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // === Setup D3 Zoom ===
    const d3Canvas = d3.select(canvas);

    const zoomBehavior = d3.zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.05, 6])
      .on('zoom', event => {
        transformRef.current = event.transform;
        draw();
      });

    zoomRef.current = zoomBehavior;
    d3Canvas.call(zoomBehavior);

    // Double click to reset zoom
    d3Canvas.on('dblclick.zoom', null);
    d3Canvas.on('dblclick', () => {
      d3Canvas.transition().duration(600).call(zoomBehavior.transform, d3.zoomIdentity);
    });

    // === Setup Drag ===
    const getNodeAtPoint = (ex: number, ey: number): NodeDatum | null => {
      const [x, y] = transformRef.current.invert([ex, ey]);
      let closest: NodeDatum | null = null;
      let minDist = Infinity;
      for (const node of nodes) {
        const dx = x - (node.x || 0);
        const dy = y - (node.y || 0);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < node.radius + 12 && dist < minDist) {
          minDist = dist;
          closest = node;
        }
      }
      return closest;
    };

    d3Canvas.call(
      d3.drag<HTMLCanvasElement, unknown>()
        .subject(event => getNodeAtPoint(event.x, event.y))
        .on('start', event => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
          canvas.style.cursor = 'grabbing';
        })
        .on('drag', event => {
          const [x, y] = transformRef.current.invert([event.x, event.y]);
          event.subject.fx = x;
          event.subject.fy = y;
        })
        .on('end', event => {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
          canvas.style.cursor = hoveredNodeIdRef.current ? 'pointer' : 'default';
        })
    );

    // === Hover & Click ===
    d3Canvas.on('mousemove', event => {
      const node = getNodeAtPoint(event.offsetX, event.offsetY);
      if (node?.id !== hoveredNodeIdRef.current) {
        hoveredNodeIdRef.current = node?.id || null;
        canvas.style.cursor = node ? 'pointer' : 'default';
        draw();
      }
    });

    d3Canvas.on('mouseleave', () => {
      if (hoveredNodeIdRef.current) {
        hoveredNodeIdRef.current = null;
        canvas.style.cursor = 'default';
        draw();
      }
    });

    d3Canvas.on('click', event => {
      if (event.defaultPrevented) return;
      const node = getNodeAtPoint(event.offsetX, event.offsetY);
      if (node) onSelectNote(node.id);
    });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      simulation.stop();
      simulationRef.current = null;
      zoomRef.current = null;
    };
  }, [notes, onSelectNote]);

  const handleZoomIn = () => {
    if (!canvasRef.current || !zoomRef.current) return;
    d3.select(canvasRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.5);
  };

  const handleZoomOut = () => {
    if (!canvasRef.current || !zoomRef.current) return;
    d3.select(canvasRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1 / 1.5);
  };

  const handleResetZoom = () => {
    if (!canvasRef.current || !zoomRef.current) return;
    d3.select(canvasRef.current).transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity);
  };

  return (
    <div ref={containerRef} style={{ flex: 1, height: '100%', position: 'relative', overflow: 'hidden', background: '#0d1117' }}>
      {/* Top-left info badge */}
      <div style={{
        position: 'absolute', top: '16px', left: '16px', zIndex: 10,
        display: 'flex', alignItems: 'center', gap: '10px',
        background: 'rgba(22, 27, 34, 0.85)', padding: '8px 14px',
        borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(16px)'
      }}>
        <Layers size={16} style={{ color: '#58a6ff' }} />
        <div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#e6edf3' }}>Graph View</div>
          <div style={{ fontSize: '11px', color: '#7d8590' }}>{notes.length} notes · D3 Force Graph</div>
        </div>
      </div>

      {/* Zoom Controls (bottom right) */}
      <div style={{
        position: 'absolute', bottom: '20px', right: '20px', zIndex: 10,
        display: 'flex', flexDirection: 'column', gap: '8px'
      }}>
        {[
          { icon: <ZoomIn size={16} />, action: handleZoomIn, title: 'Zoom In' },
          { icon: <ZoomOut size={16} />, action: handleZoomOut, title: 'Zoom Out' },
          { icon: <RotateCcw size={16} />, action: handleResetZoom, title: 'Reset View' },
        ].map(({ icon, action, title }) => (
          <button key={title} title={title} onClick={action} style={{
            width: '36px', height: '36px', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', background: 'rgba(22, 27, 34, 0.85)',
            color: '#e6edf3', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(12px)', transition: 'background 0.15s'
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(88,166,255,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(22,27,34,0.85)')}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Hint */}
      <div style={{
        position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 10, fontSize: '11px', color: 'rgba(125,133,144,0.7)',
        pointerEvents: 'none', userSelect: 'none'
      }}>
        Scroll to zoom · Drag to pan · Drag nodes · Double-click to reset
      </div>

      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
};
