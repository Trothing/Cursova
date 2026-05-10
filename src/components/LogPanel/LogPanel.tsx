import React, { useEffect, useRef } from 'react';
import type { LogEntry } from '../../domain/types';
import styles from './LogPanel.module.scss';

interface LogPanelProps {
  logs: LogEntry[];
  onClear: () => void;
}

const TYPE_ICONS: Record<LogEntry['type'], string> = {
  info: '›',
  success: '✓',
  error: '✕',
  warn: '⚠',
};

export const LogPanel: React.FC<LogPanelProps> = ({ logs, onClear }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const fmt = (ts: number) =>
    new Date(ts).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Лог</span>
        <span className={styles.count}>{logs.length}</span>
        <button className={styles.clearBtn} onClick={onClear}>Очистити</button>
      </div>
      <div className={styles.body}>
        {logs.length === 0 && (
          <span className={styles.empty}>Поки що нічого...</span>
        )}
        {logs.map(entry => (
          <div key={entry.id} className={`${styles.entry} ${styles[entry.type]}`}>
            <span className={styles.icon}>{TYPE_ICONS[entry.type]}</span>
            <span className={styles.time}>{fmt(entry.timestamp)}</span>
            <span className={styles.message}>{entry.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
