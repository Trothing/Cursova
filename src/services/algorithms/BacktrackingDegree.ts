import type { Graph, ColoringResult } from '../../domain/types';
import type { IColoringStrategy } from '../../domain/IColoringStrategy';
import { GreedyColoring } from './GreedyColoring';

export class BacktrackingDegree implements IColoringStrategy {
  readonly name = 'Backtracking + Degree';
  readonly description = 'Знаходить мінімальне хроматичне число. Оптимізовано жадібною верхньою межею.';

  color(graph: Graph): ColoringResult {
    const start = performance.now();
    const TIME_LIMIT = 9500;

    const greedy = new GreedyColoring();
    let bestResult = greedy.color(graph);

    const sorted = [...graph.vertices].sort(
        (a, b) =>
            (graph.adjacency.get(b.id)?.size ?? 0) -
            (graph.adjacency.get(a.id)?.size ?? 0),
    );

    let timeoutOccurred = false;
    let iterations = 0;
    let comparisons = bestResult.comparisons ?? 0;

    for (let allowedColors = bestResult.chromaticNumber - 1; allowedColors >= 1; allowedColors--) {
      const coloring = new Map<string, number>();

      const solve = (idx: number): boolean => {
        if (iterations++ % 1000 === 0 && performance.now() - start > TIME_LIMIT) {
          timeoutOccurred = true;
          return false;
        }

        if (idx === sorted.length) return true;

        const vertex = sorted[idx];
        const usedColors = new Set<number>();
        for (const nId of graph.adjacency.get(vertex.id) ?? []) {
          const c = coloring.get(nId);
          comparisons++;
          if (c !== undefined) usedColors.add(c);
        }

        for (let c = 0; c < allowedColors; c++) {
          comparisons++;
          if (usedColors.has(c)) continue;

          coloring.set(vertex.id, c);

          if (solve(idx + 1)) return true;

          if (timeoutOccurred) return false;

          coloring.delete(vertex.id);
        }

        return false;
      };

      if (solve(0) && !timeoutOccurred) {
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
}