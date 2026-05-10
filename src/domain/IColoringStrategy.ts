import type { Graph, ColoringResult } from './types';

export interface IColoringStrategy {
    readonly name: string;
    readonly description: string;
    color(graph: Graph): ColoringResult;
}