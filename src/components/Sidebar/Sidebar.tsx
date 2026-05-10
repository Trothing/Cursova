import React, { useRef, useState } from 'react';
import type { AlgorithmType } from '../../domain/types';
import { ColoringContext } from '../../services/ColoringContext';
import styles from './Sidebar.module.scss';

interface SidebarProps {
  interactionMode: 'add-vertex' | 'add-edge' | 'select';
  selectedAlgorithm: AlgorithmType;
  isRunning: boolean;
  vertexCount: number;
  edgeCount: number;
  hasResult: boolean;
  onModeChange: (mode: 'add-vertex' | 'add-edge' | 'select') => void;
  onAlgorithmChange: (type: AlgorithmType) => void;
  onRun: () => void;
  onClear: () => void;
  onGenerate: (count: number, density: number) => void;
  onImport: (json: string) => void;
  onExport: () => void;
  onExportWithResult: () => void;
  onValidate: () => void;
}

const ALGORITHMS: { value: AlgorithmType; label: string; badge: string }[] = [
  { value: 'greedy', label: 'Greedy', badge: 'Швидкий' },
  { value: 'backtracking-mrv', label: 'Backtracking MRV', badge: 'Евристика 1' },
  { value: 'backtracking-degree', label: 'Backtracking Degree', badge: 'Евристика 2' },
];

const MODES: { value: SidebarProps['interactionMode']; label: string; icon: string }[] = [
  { value: 'add-vertex', label: 'Вершина', icon: '☉' },
  { value: 'add-edge', label: 'Ребро', icon: '↔' },
  { value: 'select', label: 'Вибір', icon: '𖤂' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  interactionMode, selectedAlgorithm, isRunning,
  vertexCount, edgeCount, hasResult,
  onModeChange, onAlgorithmChange, onRun, onClear,
  onGenerate, onImport, onExport, onExportWithResult, onValidate,
}) => {
  const [genCount, setGenCount] = useState(10);
  const [genDensity, setGenDensity] = useState(0.4);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onImport(ev.target?.result as string);
    reader.readAsText(file);
    e.target.value = '';
  };

  const strategyDesc = ColoringContext.getByType(selectedAlgorithm).description;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <span className={styles.logoText}>Graph Coloring</span>
      </div>

      <div className={styles.statsStrip}>
        <div className={styles.stat}>
          <span className={styles.statVal}>{vertexCount}</span>
          <span className={styles.statLbl}>Вершин</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statVal}>{edgeCount}</span>
          <span className={styles.statLbl}>Ребр</span>
        </div>
      </div>

      <section className={styles.section}>
        <p className={styles.sectionLabel}>Режим</p>
        <div className={styles.modeGroup}>
          {MODES.map(m => (
            <button
              key={m.value}
              className={`${styles.modeBtn} ${interactionMode === m.value ? styles.active : ''}`}
              onClick={() => onModeChange(m.value)}
            >
              <span className={styles.modeIcon}>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <p className={styles.sectionLabel}>Алгоритм</p>
        <div className={styles.algoList}>
          {ALGORITHMS.map(a => (
            <button
              key={a.value}
              className={`${styles.algoBtn} ${selectedAlgorithm === a.value ? styles.active : ''}`}
              onClick={() => onAlgorithmChange(a.value)}
            >
              <span className={styles.algoLabel}>{a.label}</span>
              <span className={styles.algoBadge}>{a.badge}</span>
            </button>
          ))}
        </div>
        <p className={styles.algoDesc}>{strategyDesc}</p>
      </section>

      <section className={styles.section}>
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={onRun}
          disabled={isRunning}
        >
          {isRunning
            ? <><span className={styles.spinner} />Працює…</>
            : 'Запустити Алгоритм'}
        </button>
        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onValidate}>
          Перевірити розфарбування
        </button>
        <button className={`${styles.btn} ${styles.btnGhost}`} onClick={onClear}>
          Очистити граф
        </button>
      </section>

      <section className={styles.section}>
        <p className={styles.sectionLabel}>Рандомний граф</p>

        <div className={styles.sliderLabel}>
          <span>Вершини</span>
          <strong>{genCount}</strong>
        </div>
        <input
          type="range" min={3} max={50} value={genCount}
          onChange={e => setGenCount(+e.target.value)}
          className={styles.slider}
        />

        <div className={styles.sliderLabel} style={{ marginTop: 6 }}>
          <span>Щільність</span>
          <strong>{Math.round(genDensity * 100)}%</strong>
        </div>
        <input
          type="range" min={0.05} max={0.9} step={0.05} value={genDensity}
          onChange={e => setGenDensity(+e.target.value)}
          className={styles.slider}
        />

        <button
          className={`${styles.btn} ${styles.btnSecondary}`}
          style={{ marginTop: 6 }}
          onClick={() => onGenerate(genCount, genDensity)}
        >
          Згенерувати
        </button>
      </section>

      <section className={styles.section}>
        <p className={styles.sectionLabel}>JSON</p>
        <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => fileRef.current?.click()}>
          Імпорт
        </button>
        <div className={styles.row}>
          <button
            className={`${styles.btn} ${styles.btnGhost} ${styles.half}`}
            onClick={onExport}
            title="Export graph without coloring"
          >
            Експорт
          </button>
          <button
            className={`${styles.btn} ${styles.btnGhost} ${styles.half} ${!hasResult ? styles.disabled : ''}`}
            onClick={onExportWithResult}
            disabled={!hasResult}
            title={hasResult ? 'Export with coloring result' : 'Run algorithm first'}
          >
            + Кольори
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileImport}
        />
      </section>
    </aside>
  );
};
