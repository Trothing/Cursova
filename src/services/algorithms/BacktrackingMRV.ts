import type { Graph, ColoringResult } from '../../domain/types';
import type { IColoringStrategy } from '../../domain/IColoringStrategy';
import { GreedyColoring } from './GreedyColoring';

export class BacktrackingMRV implements IColoringStrategy {
  readonly name = 'Backtracking + MRV';
  readonly description = 'Пошук з поверненням (MRV). Оптимізовано жадібною верхньою межею.';

  color(graph: Graph): ColoringResult {
    const start = performance.now();
    const TIME_LIMIT = 9500;

    const greedy = new GreedyColoring();
    let bestResult = greedy.color(graph);

    let timeoutOccurred = false;
    let iterations = 0;
    let comparisons = bestResult.comparisons ?? 0;

    for (let allowedColors = bestResult.chromaticNumber - 1; allowedColors >= 1; allowedColors--) {
      const coloring = new Map<string, number>();

      const solve = (): boolean => {
        if (iterations++ % 1000 === 0 && performance.now() - start > TIME_LIMIT) {
          timeoutOccurred = true;
          return false;
        }

        let bestVertex = null;
        let minRemaining = Infinity;

        for (const v of graph.vertices) {
          if (coloring.has(v.id)) continue;

          const used = this.getUsedColors(v.id, coloring, graph, (n) => { comparisons += n; });
          const remaining = allowedColors - used.size;

          comparisons++;
          if (remaining <= 0) return false;

          comparisons++;
          if (remaining < minRemaining) {
            minRemaining = remaining;
            bestVertex = v;
          }
        }

        if (!bestVertex) return true;

        const usedByNeighbors = this.getUsedColors(bestVertex.id, coloring, graph, (n) => { comparisons += n; });

        for (let c = 0; c < allowedColors; c++) {
          comparisons++;
          if (usedByNeighbors.has(c)) continue;

          coloring.set(bestVertex.id, c);

          if (solve()) return true;

          if (timeoutOccurred) return false;

          coloring.delete(bestVertex.id);
        }

        return false;
      };

      if (solve() && !timeoutOccurred) {
        bestResult = {
          coloring,
          chromaticNumber: allowedColors,
          timeMs: performance.now() - start,
          success: true,
          comparisons,
        };
      } else {
        break;
      }
    }

    bestResult.timeMs = performance.now() - start;
    bestResult.comparisons = comparisons;
    return bestResult;
  }

  private getUsedColors(
      id: string,
      coloring: Map<string, number>,
      graph: Graph,
      addComparisons: (n: number) => void,
  ): Set<number> {
    const used = new Set<number>();
    for (const nId of graph.adjacency.get(id) ?? []) {
      const c = coloring.get(nId);
      addComparisons(1);
      if (c !== undefined) used.add(c);
    }
    return used;
  }
}