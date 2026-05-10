import React, { useCallback, useRef, useState, useMemo } from 'react';
import type { Graph, ColoringResult } from '../../domain/types';
import styles from './GraphCanvas.module.scss';

interface GraphCanvasProps {
  graph: Graph;
  result: ColoringResult | null;
  interactionMode: 'add-vertex' | 'add-edge' | 'select';
  onAddVertex: (x: number, y: number) => void;
  onAddEdge: (sourceId: string, targetId: string) => void;
  onRemoveVertex: (id: string) => void;
  onRemoveEdge: (id: string) => void;
}

const PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
  '#ec4899', '#14b8a6', '#a855f7', '#eab308',
  '#0ea5e9', '#22c55e', '#f43f5e', '#d946ef',
  '#fb923c', '#a3e635', '#38bdf8', '#4ade80',
  '#c084fc', '#fbbf24', '#f87171', '#34d399',
  '#818cf8', '#2dd4bf', '#fb7185', '#a78bfa',
  '#facc15', '#86efac', '#67e8f9', '#fca5a5',
];

const VERTEX_RADIUS = 19;
const UNCOLORED_FILL = '#1e293b';
const UNCOLORED_STROKE = '#334155';

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  graph, result, interactionMode,
  onAddVertex, onAddEdge, onRemoveVertex, onRemoveEdge,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pendingEdgeSource, setPendingEdgeSource] = useState<string | null>(null);
  const [hoveredVertex, setHoveredVertex] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);

  const getSVGPoint = useCallback((e: React.MouseEvent): { x: number; y: number } => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM()!.inverse());
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (interactionMode !== 'add-vertex') return;
    if ((e.target as SVGElement).closest('[data-vertex]')) return;
    const { x, y } = getSVGPoint(e);
    onAddVertex(x, y);
  }, [interactionMode, getSVGPoint, onAddVertex]);

  const handleVertexClick = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (interactionMode !== 'add-edge') return;
    if (!pendingEdgeSource) {
      setPendingEdgeSource(id);
    } else if (pendingEdgeSource !== id) {
      onAddEdge(pendingEdgeSource, id);
      setPendingEdgeSource(null);
    } else {
      setPendingEdgeSource(null);
    }
  }, [interactionMode, pendingEdgeSource, onAddEdge]);

  const handleVertexDoubleClick = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (interactionMode === 'select') onRemoveVertex(id);
  }, [interactionMode, onRemoveVertex]);

  const handleEdgeDoubleClick = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (interactionMode === 'select') onRemoveEdge(id);
  }, [interactionMode, onRemoveEdge]);

  const handleMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    if (interactionMode !== 'select') return;
    e.stopPropagation();
    const { x, y } = getSVGPoint(e);
    const v = graph.vertices.find(v => v.id === id)!;
    setDragging({ id, ox: x - v.x, oy: y - v.y });
  }, [interactionMode, getSVGPoint, graph.vertices]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging) return;
    const { x, y } = getSVGPoint(e);
    const nx = x - dragging.ox, ny = y - dragging.oy;
    const vEl = svgRef.current?.querySelector(`[data-vertex="${dragging.id}"]`);
    if (vEl) {
      vEl.setAttribute('transform', `translate(${nx}, ${ny})`);
      svgRef.current?.querySelectorAll(`[data-edge-src="${dragging.id}"]`)
        ?.forEach(l => { l.setAttribute('x1', String(nx)); l.setAttribute('y1', String(ny)); });
      svgRef.current?.querySelectorAll(`[data-edge-tgt="${dragging.id}"]`)
        ?.forEach(l => { l.setAttribute('x2', String(nx)); l.setAttribute('y2', String(ny)); });
      const v = graph.vertices.find(v => v.id === dragging.id)!;
      v.x = nx; v.y = ny;
    }
  }, [dragging, getSVGPoint, graph.vertices]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  const vertexFill = useCallback((id: string): string => {
    if (!result?.success) return UNCOLORED_FILL;
    const idx = result.coloring.get(id);
    return idx !== undefined ? PALETTE[idx % PALETTE.length] + '26' : UNCOLORED_FILL;
  }, [result]);

  const vertexStroke = useCallback((id: string): string => {
    if (!result?.success) return UNCOLORED_STROKE;
    const idx = result.coloring.get(id);
    return idx !== undefined ? PALETTE[idx % PALETTE.length] : UNCOLORED_STROKE;
  }, [result]);

  const edgeConflicts = useMemo(() => {
    if (!result) return new Set<string>();
    const s = new Set<string>();
    for (const e of graph.edges) {
      const sc = result.coloring.get(e.source);
      const tc = result.coloring.get(e.target);
      if (sc !== undefined && sc === tc) s.add(e.id);
    }
    return s;
  }, [result, graph.edges]);

  const cursorStyle =
    interactionMode === 'add-vertex' ? 'crosshair' :
    interactionMode === 'add-edge' ? 'cell' : 'default';

  const badgeText =
    interactionMode === 'add-vertex' ? 'Натисність щоб добавити вершину' :
    interactionMode === 'add-edge'
      ? (pendingEdgeSource ? 'Оберіть ціль' : 'Оберіть джерело')
      : 'Перетягування - рух | Подвійний клік - видалення';

  return (
    <div className={styles.wrapper}>
      <svg
        ref={svgRef}
        className={styles.canvas}
        style={{ cursor: cursorStyle }}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
          </pattern>

          <filter id="vtx-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="rgba(0,0,0,0.5)" />
          </filter>
        </defs>

        <rect width="100%" height="100%" fill="url(#grid)" />

        {graph.edges.map(edge => {
          const src = graph.vertices.find(v => v.id === edge.source);
          const tgt = graph.vertices.find(v => v.id === edge.target);
          if (!src || !tgt) return null;
          const isConflict = edgeConflicts.has(edge.id);
          return (
            <line
              key={edge.id}
              data-edge-src={edge.source}
              data-edge-tgt={edge.target}
              x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
              className={`${styles.edge} ${isConflict ? styles.edgeConflict : ''}`}
              onDoubleClick={e => handleEdgeDoubleClick(e, edge.id)}
            />
          );
        })}

        {pendingEdgeSource && (() => {
          const src = graph.vertices.find(v => v.id === pendingEdgeSource);
          return src
            ? <circle cx={src.x} cy={src.y} r={VERTEX_RADIUS + 9} className={styles.pendingRing} />
            : null;
        })()}

        {graph.vertices.map(vertex => {
          const fill = vertexFill(vertex.id);
          const stroke = vertexStroke(vertex.id);
          const isHovered = hoveredVertex === vertex.id;
          const isPending = pendingEdgeSource === vertex.id;

          return (
            <g
              key={vertex.id}
              data-vertex={vertex.id}
              transform={`translate(${vertex.x}, ${vertex.y})`}
              onClick={e => handleVertexClick(e, vertex.id)}
              onDoubleClick={e => handleVertexDoubleClick(e, vertex.id)}
              onMouseDown={e => handleMouseDown(e, vertex.id)}
              onMouseEnter={() => setHoveredVertex(vertex.id)}
              onMouseLeave={() => setHoveredVertex(null)}
              className={styles.vertex}
              style={{ cursor: interactionMode === 'select' ? 'grab' : 'pointer' }}
            >
              {(isHovered || isPending) && (
                <circle
                  r={VERTEX_RADIUS + 6}
                  fill="none"
                  stroke={isPending ? '#2563eb' : stroke}
                  strokeWidth="1.5"
                  opacity={0.4}
                />
              )}

              <circle
                r={VERTEX_RADIUS}
                fill={fill}
                stroke={isPending ? '#2563eb' : stroke}
                strokeWidth={isPending ? 2 : 1.5}
                style={{ filter: 'url(#vtx-shadow)' }}
              />

              <text
                textAnchor="middle"
                dominantBaseline="central"
                className={styles.vertexLabel}
                style={{ fill: stroke === UNCOLORED_STROKE ? 'rgba(255,255,255,0.45)' : stroke }}
              >
                {vertex.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className={styles.modeBadge}>{badgeText}</div>
    </div>
  );
};
