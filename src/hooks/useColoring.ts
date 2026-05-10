import { useState, useCallback, useRef } from 'react';
import type { Graph, ColoringResult, AlgorithmType, LogEntry } from '../domain/types';
import { ColoringContext } from '../services/ColoringContext';
import { GraphService } from '../services/GraphService';

interface UseColoringReturn {
  isRunning: boolean;
  logs: LogEntry[];
  selectedAlgorithm: AlgorithmType;
  setAlgorithm: (type: AlgorithmType) => void;
  runColoring: (graph: Graph) => Promise<ColoringResult | null>;
  validateColoring: (graph: Graph, result: ColoringResult) => void;
  clearLogs: () => void;
  addLog: (message: string, type?: LogEntry['type']) => void;
  cancelColoring: () => void;
}

const ctx = new ColoringContext('greedy');

export function useColoring(): UseColoringReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType>('greedy');

  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveRef = useRef<((value: ColoringResult | null) => void) | null>(null);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [
      ...prev,
      { id: `${Date.now()}_${Math.random()}`, timestamp: Date.now(), message, type },
    ]);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  const setAlgorithm = useCallback((type: AlgorithmType) => {
    ctx.setStrategy(type);
    setSelectedAlgorithm(type);
    addLog(`Алгоритм змінено: ${ColoringContext.getByType(type).name}`, 'info');
  }, [addLog]);

  const cancelColoring = useCallback(() => {
    let wasCanceled = false;

    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      wasCanceled = true;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (resolveRef.current) {
      resolveRef.current(null);
      resolveRef.current = null;
    }

    if (wasCanceled) {
      setIsRunning(false);
      addLog('Обчислення алгоритму примусово скасовано', 'warn');
    }
  }, [addLog]);

  const runColoring = useCallback(async (graph: Graph): Promise<ColoringResult | null> => {
    if (graph.vertices.length === 0) {
      addLog('Граф порожній. Додайте вершини.', 'warn');
      return null;
    }

    cancelColoring();

    setIsRunning(true);
    const strategyName = ctx.getStrategy().name;
    addLog(`Запуск алгоритму: ${strategyName} (${graph.vertices.length} вершин, ${graph.edges.length} ребер)`, 'info');

    return new Promise<ColoringResult | null>(resolve => {
      resolveRef.current = resolve;

      const isHeavy = selectedAlgorithm !== 'greedy' && graph.vertices.length > 13;

      if (isHeavy && typeof Worker !== 'undefined') {
        const worker = new Worker(
            new URL('../workers/coloring.worker.ts', import.meta.url),
            { type: 'module' },
        );
        workerRef.current = worker;

        timeoutRef.current = setTimeout(() => {
          worker.terminate();
          addLog('Критичний таймаут Worker (>10с). Спробуйте жадібний алгоритм.', 'error');
          setIsRunning(false);

          if (resolveRef.current) {
            resolveRef.current(null);
            resolveRef.current = null;
          }
        }, 10000);

        worker.onmessage = (e: MessageEvent<ColoringResult>) => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);

          const result = {
            ...e.data,
            coloring: new Map(Object.entries(e.data.coloring as unknown as Record<string, number>)),
          };

          if (result.timeMs >= 9000) {
            addLog(`Знайдено за таймаутом (${(result.timeMs / 1000).toFixed(1)} с). Результат може бути не оптимальним. Кольорів: ${result.chromaticNumber}`, 'warn');
          } else {
            addLog(`Завершено за ${result.timeMs.toFixed(2)} мс. Хроматичне число: ${result.chromaticNumber}`, 'success');
          }

          setIsRunning(false);
          if (resolveRef.current) {
            resolveRef.current(result);
            resolveRef.current = null;
          }
          worker.terminate();
          workerRef.current = null;
        };

        worker.onerror = () => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          addLog('Помилка у Web Worker', 'error');
          setIsRunning(false);

          if (resolveRef.current) {
            resolveRef.current(null);
            resolveRef.current = null;
          }
          worker.terminate();
          workerRef.current = null;
        };

        worker.postMessage({
          algorithm: selectedAlgorithm,
          vertices: graph.vertices,
          edges: graph.edges,
          adjacency: Object.fromEntries(
              [...graph.adjacency.entries()].map(([k, v]) => [k, [...v]])
          ),
        });
      } else {
        try {
          const result = ctx.execute(graph);
          if (result.success) {
            addLog(`Завершено за ${result.timeMs.toFixed(2)} мс. Хроматичне число: ${result.chromaticNumber}`, 'success');
          } else {
            addLog('Розв\'язок не знайдено', 'error');
          }
          setIsRunning(false);
          resolveRef.current = null;
          resolve(result);
        } catch (err) {
          addLog(`Помилка алгоритму: ${String(err)}`, 'error');
          setIsRunning(false);
          resolveRef.current = null;
          resolve(null);
        }
      }
    });
  }, [selectedAlgorithm, addLog, cancelColoring]);

  const validateColoring = useCallback((graph: Graph, result: ColoringResult) => {
    const { valid, conflicts } = GraphService.validate(graph, result.coloring);
    if (valid) {
      addLog(`Розфарбовування коректне. Використано ${result.chromaticNumber} кольорів.`, 'success');
    } else {
      addLog(`Знайдено ${conflicts.length} конфліктних ребер!`, 'error');
    }
  }, [addLog]);



  return {
    isRunning,
    logs,
    selectedAlgorithm,
    setAlgorithm,
    runColoring,
    validateColoring,
    clearLogs,
    addLog,
    cancelColoring
  };
}
