import type { Graph, ColoringResult } from '../../domain/types';
import type { IColoringStrategy } from '../../domain/IColoringStrategy';

export class GreedyColoring implements IColoringStrategy {
  readonly name = 'Greedy';
  readonly description = 'Класичний жадібний алгоритм. Швидкий, але не завжди оптимальний.';

  color(graph: Graph): ColoringResult {
    const start = performance.now();
    const coloring = new Map<string, number>();
    let comparisons = 0;

    for (const vertex of graph.vertices) {
      const usedColors = new Set<number>();
      for (const neighborId of graph.adjacency.get(vertex.id) ?? []) {
        const c = coloring.get(neighborId);
        comparisons++;
        if (c !== undefined) usedColors.add(c);
      }

      let color = 0;
      while (usedColors.has(color)) {
        comparisons++;
        color++;
      }
      comparisons++;
      coloring.set(vertex.id, color);
    }

    const chromaticNumber = new Set(coloring.values()).size;
    return {
      coloring,
      chromaticNumber,
      timeMs: performance.now() - start,
      success: true,
      comparisons,
    };
  }
}