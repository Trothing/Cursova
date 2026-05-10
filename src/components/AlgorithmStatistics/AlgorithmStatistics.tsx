import React from 'react';
import type { ColoringResult, AlgorithmType } from '../../domain/types';
import { ColoringContext } from '../../services/ColoringContext';
import styles from './AlgorithmStatistics.module.scss';

interface AlgorithmStatisticsProps {
  result: ColoringResult | null;
  selectedAlgorithm: AlgorithmType;
  vertexCount: number;
  edgeCount: number;
}

const PALETTE = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
    '#ec4899', '#14b8a6', '#a855f7', '#eab308',
    '#0ea5e9', '#22c55e', '#f43f5e', '#d946ef',
    '#fb923c', '#a3e635', '#38bdf8', '#4ade80',
    '#c084fc', '#fbbf24', '#f87171', '#34d399',
    '#818cf8', '#2dd4bf', '#fb7185', '#a78bfa',
    '#facc15', '#86efac', '#67e8f9', '#fca5a5',
];

function formatComparisons(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export const AlgorithmStatistics: React.FC<AlgorithmStatisticsProps> = ({
                                                                          result,
                                                                          selectedAlgorithm,
                                                                          vertexCount,
                                                                          edgeCount,
                                                                        }) => {
  const strategyName = ColoringContext.getByType(selectedAlgorithm).name;

  const usedColors = result?.success
      ? Array.from(new Set(result.coloring.values())).sort((a, b) => a - b)
      : [];

  const colorGroups = usedColors.map(c => ({
    colorIdx: c,
    count: [...result!.coloring.values()].filter(v => v === c).length,
  }));

  return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>Статистика</span>
          <span className={styles.algoTag}>{strategyName}</span>
        </div>

        <div className={styles.body}>
          {!result ? (
              <span className={styles.empty}>Запустіть алгоритм для перегляду результатів</span>
          ) : (
              <>
                <div className={styles.metrics}>
                  <div className={styles.metric}>
                <span
                    className={styles.metricValue}
                    style={{ color: result.success ? 'var(--success)' : 'var(--error)' }}
                >
                  {result.success ? result.chromaticNumber : '—'}
                </span>
                    <span className={styles.metricLabel}>Хром. число</span>
                  </div>

                  <div className={styles.metric}>
                    <span className={styles.metricValue}>{result.timeMs.toFixed(2)}</span>
                    <span className={styles.metricLabel}>Час (мс)</span>
                  </div>

                  <div className={styles.metric}>
                    <span className={styles.metricValue}>{vertexCount}</span>
                    <span className={styles.metricLabel}>Вершин</span>
                  </div>

                  <div className={styles.metric}>
                    <span className={styles.metricValue}>{edgeCount}</span>
                    <span className={styles.metricLabel}>Ребер</span>
                  </div>
                </div>

                <div className={styles.metricsWide}>
                  <div className={styles.metric}>
                <span
                    className={styles.metricValue}
                    title={result.comparisons !== undefined ? String(result.comparisons) : '—'}
                >
                  {result.comparisons !== undefined ? formatComparisons(result.comparisons) : '—'}
                </span>
                    <span className={styles.metricLabel}>Порівнянь</span>
                  </div>
                </div>

                <div className={`${styles.status} ${result.success ? styles.statusOk : styles.statusFail}`}>
                  {result.success ? 'Розфарбовування знайдено' : 'Розв\'язок не знайдено'}
                </div>

                {result.success && colorGroups.length > 0 && (
                    <div className={styles.legendContainer}>
                      <span className={styles.legendTitle}>Розподіл кольорів по вершинах:</span>
                      <div className={styles.legend}>
                        {colorGroups.map(({ colorIdx, count }) => (
                            <div key={colorIdx} className={styles.legendItem}>
                              <div className={styles.legendColorBlock}>
                        <span
                            className={styles.legendDot}
                            style={{ background: PALETTE[colorIdx % PALETTE.length] }}
                        />
                                <span className={styles.legendText}>Колір {colorIdx + 1}</span>
                              </div>
                              <span className={styles.legendCount} title={`Кількість вершин: ${count}`}>
                        {count}
                      </span>
                            </div>
                        ))}
                      </div>
                    </div>
                )}
              </>
          )}
        </div>
      </div>
  );
};