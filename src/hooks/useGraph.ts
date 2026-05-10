import { useState, useCallback } from 'react';
import type { Graph, ColoringResult } from '../domain/types';
import { GraphService } from '../services/GraphService';

interface UseGraphReturn {
  graph: Graph;
  result: ColoringResult | null;
  setGraph: (g: Graph) => void;
  setResult: (r: ColoringResult | null) => void;
  addVertex: (x: number, y: number) => void;
  addEdge: (sourceId: string, targetId: string) => void;
  removeVertex: (id: string) => void;
  removeEdge: (id: string) => void;
  generateRandom: (count: number, density: number) => void;
  clearGraph: () => void;
  clearColoring: () => void;
  importJSON: (json: string) => ColoringResult | null;
  exportJSON: () => void;
  exportJSONWithResult: () => void;
}

const CANVAS_W = 1200;
const CANVAS_H = 520;

export function useGraph(): UseGraphReturn {
  const [graph, setGraph] = useState<Graph>(GraphService.createEmpty());
  const [result, setResult] = useState<ColoringResult | null>(null);

  const addVertex = useCallback((x: number, y: number) => {
    setGraph(prev => GraphService.addVertex(prev, x, y));
    setResult(null);
  }, []);

  const addEdge = useCallback((sourceId: string, targetId: string) => {
    setGraph(prev => GraphService.addEdge(prev, sourceId, targetId));
    setResult(null);
  }, []);

  const removeVertex = useCallback((id: string) => {
    setGraph(prev => GraphService.removeVertex(prev, id));
    setResult(null);
  }, []);
  const removeEdge = useCallback((id: string) => {
    setGraph(prev => GraphService.removeEdge(prev, id))
    setResult(null)
  }, []);

  const generateRandom = useCallback((count: number, density: number) => {
    setGraph(GraphService.generateRandom(count, density, CANVAS_W, CANVAS_H));
    setResult(null);
  }, []);

  const clearGraph = useCallback(() => {
    setGraph(GraphService.createEmpty());
    setResult(null);
  }, []);

  const clearColoring = useCallback(() => {
    setResult(null);
  }, []);

  const importJSON = useCallback((json: string): ColoringResult | null => {
    try {
      const { graph: g, result: r } = GraphService.fromJSON(json);
      setGraph(g);
      setResult(r);
      return r;
    } catch {
      throw new Error('Невалідний JSON формат графа');
    }
  }, []);

  const exportJSON = useCallback(() => {
    const json = GraphService.toJSON(graph);
    downloadJSON(json, 'graph.json');
  }, [graph]);

  const exportJSONWithResult = useCallback(() => {
    const json = result
        ? GraphService.toJSONWithResult(graph, result)
        : GraphService.toJSON(graph);
    downloadJSON(json, 'graph_colored.json');
  }, [graph, result]);

  return {
    graph,
    result,
    setGraph,
    setResult,
    addVertex,
    addEdge,
    removeVertex,
    generateRandom,
    clearGraph,
    clearColoring,
    importJSON,
    exportJSON,
    removeEdge,
    exportJSONWithResult
  };
}

function downloadJSON(json: string, filename: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
