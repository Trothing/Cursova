import React, { useState, useCallback } from 'react';
import { GraphCanvas } from './components/GraphCanvas/GraphCanvas';
import { Sidebar } from './components/Sidebar/Sidebar';
import { AlgorithmStatistics } from './components/AlgorithmStatistics/AlgorithmStatistics';
import { LogPanel } from './components/LogPanel/LogPanel';
import { useGraph } from './hooks/useGraph';
import { useColoring } from './hooks/useColoring';
import type { AlgorithmType } from './domain/types';
import styles from './App.module.scss';

const App: React.FC = () => {
  const [interactionMode, setInteractionMode] = useState<'add-vertex' | 'add-edge' | 'select'>('add-vertex');

  const {
    graph, result, setResult,
    addVertex, addEdge, removeVertex, removeEdge,
    generateRandom, clearGraph,
    importJSON, exportJSON, exportJSONWithResult,
  } = useGraph();

  const {
    isRunning, logs, selectedAlgorithm,
    setAlgorithm, runColoring, validateColoring,
    clearLogs, addLog, cancelColoring,
  } = useColoring();

  const handleRun = useCallback(async () => {
    const res = await runColoring(graph);
    if (res) setResult(res);
  }, [graph, runColoring, setResult]);

  const handleValidate = useCallback(() => {
    if (!result) { addLog('Спочатку запустіть алгоритм', 'warn'); return; }
    validateColoring(graph, result);
  }, [result, graph, validateColoring, addLog]);

  const handleImport = useCallback((json: string) => {
    try {
      cancelColoring();
      const restored = importJSON(json);
      if (restored) {
        addLog(`Граф імпортовано з результатом (χ = ${restored.chromaticNumber})`, 'success');
      } else {
        addLog('Граф успішно імпортовано', 'success');
      }
    } catch (e) {
      addLog(`Помилка імпорту: ${String(e)}`, 'error');
    }
  }, [importJSON, addLog, cancelColoring]);

  const handleAlgorithmChange = useCallback((type: AlgorithmType) => {
    setAlgorithm(type);
    setResult(null);
  }, [setAlgorithm, setResult]);

  const handleGenerate = useCallback((count: number, density: number) => {
    cancelColoring();
    generateRandom(count, density);
    addLog(`Згенеровано: ${count} вершин, щільність ${Math.round(density * 100)}%`, 'info');
  }, [generateRandom, addLog, cancelColoring]);

  const handleClear = useCallback(() => {
    cancelColoring();
    clearGraph();
    addLog('Граф очищено', 'info');
  }, [clearGraph, addLog, cancelColoring]);

  const handleAddVertex = useCallback((x: number, y: number) => {
    if (isRunning) cancelColoring();
    addVertex(x, y);
  }, [isRunning, cancelColoring, addVertex]);

  const handleAddEdge = useCallback((sourceId: string, targetId: string) => {
    if (isRunning) cancelColoring();
    addEdge(sourceId, targetId);
  }, [isRunning, cancelColoring, addEdge]);

  const handleRemoveVertex = useCallback((id: string) => {
    if (isRunning) cancelColoring();
    removeVertex(id);
  }, [isRunning, cancelColoring, removeVertex]);

  const handleRemoveEdge = useCallback((id: string) => {
    if (isRunning) cancelColoring();
    removeEdge(id);
  }, [isRunning, cancelColoring, removeEdge]);

  return (
      <div className={styles.app}>
        <Sidebar
            interactionMode={interactionMode}
            selectedAlgorithm={selectedAlgorithm}
            isRunning={isRunning}
            vertexCount={graph.vertices.length}
            edgeCount={graph.edges.length}
            hasResult={result !== null}
            onModeChange={setInteractionMode}
            onAlgorithmChange={handleAlgorithmChange}
            onRun={handleRun}
            onClear={handleClear}
            onGenerate={handleGenerate}
            onImport={handleImport}
            onExport={exportJSON}
            onExportWithResult={exportJSONWithResult}
            onValidate={handleValidate}
        />

        <div className={styles.main}>
          <div className={styles.canvasArea}>
            <GraphCanvas
                graph={graph}
                result={result}
                interactionMode={interactionMode}
                onAddVertex={handleAddVertex}
                onAddEdge={handleAddEdge}
                onRemoveVertex={handleRemoveVertex}
                onRemoveEdge={handleRemoveEdge}
            />
          </div>

          <div className={styles.bottomBar}>
            <div className={styles.statsArea}>
              <AlgorithmStatistics
                  result={result}
                  selectedAlgorithm={selectedAlgorithm}
                  vertexCount={graph.vertices.length}
                  edgeCount={graph.edges.length}
              />
            </div>
            <div className={styles.logArea}>
              <LogPanel logs={logs} onClear={clearLogs} />
            </div>
          </div>
        </div>
      </div>
  );
};

export default App;