export interface Vertex {
  id: string;
  x: number;
  y: number;
  color: number | null;
  label: string;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
}

export interface Graph {
  vertices: Vertex[];
  edges: Edge[];
  adjacency: Map<string, Set<string>>;
}

export interface ColoringResult {
  coloring: Map<string, number>;
  chromaticNumber: number;
  timeMs: number;
  success: boolean;
  comparisons: number;
}

export type AlgorithmType = 'greedy' | 'backtracking-mrv' | 'backtracking-degree';

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'warn';
}

