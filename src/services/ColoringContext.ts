import type { IColoringStrategy } from '../domain/IColoringStrategy';
import type { Graph, ColoringResult, AlgorithmType } from '../domain/types';
import { GreedyColoring } from './algorithms/GreedyColoring';
import { BacktrackingMRV } from './algorithms/BacktrackingMRV';
import { BacktrackingDegree } from './algorithms/BacktrackingDegree.ts';

export class ColoringContext {
  private strategy: IColoringStrategy;

  private static readonly strategies: Record<AlgorithmType, IColoringStrategy> = {
    greedy: new GreedyColoring(),
    'backtracking-mrv': new BacktrackingMRV(),
    'backtracking-degree': new BacktrackingDegree(),
  };

  constructor(type: AlgorithmType = 'greedy') {
    this.strategy = ColoringContext.strategies[type];
  }

  setStrategy(type: AlgorithmType): void {
    this.strategy = ColoringContext.strategies[type];
  }

  getStrategy(): IColoringStrategy {
    return this.strategy;
  }

  execute(graph: Graph): ColoringResult {
    return this.strategy.color(graph);
  }

  static getAll(): Record<AlgorithmType, IColoringStrategy> {
    return ColoringContext.strategies;
  }

  static getByType(type: AlgorithmType): IColoringStrategy {
    return ColoringContext.strategies[type];
  }
}
