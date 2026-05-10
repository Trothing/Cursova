import type { AlgorithmType, Graph } from '../domain/types';
import { ColoringContext } from '../services/ColoringContext';
import { GraphService } from '../services/GraphService';

interface WorkerInput {
  algorithm: AlgorithmType;
  vertices: Graph['vertices'];
  edges: Graph['edges'];
  adjacency: Record<string, string[]>;
}

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { algorithm, vertices, edges, adjacency } = e.data;

  const adjMap = new Map<string, Set<string>>(
    Object.entries(adjacency).map(([k, v]) => [k, new Set(v)])
  );

  const graph: Graph = { vertices, edges, adjacency: adjMap };

  graph.adjacency = GraphService.buildAdjacency(vertices, edges);

  const ctx = new ColoringContext(algorithm);
  const result = ctx.execute(graph);

  self.postMessage({
    ...result,
    coloring: Object.fromEntries(result.coloring.entries()),
  });
};
