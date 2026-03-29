// @AI-HINT: Selection bar showing count and batch actions for selected rows.
'use client';

import React, { useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import commonStyles from './SelectionBar.common.module.css';
import lightStyles from './SelectionBar.light.module.css';
import darkStyles from './SelectionBar.dark.module.css';
import type { ExportFormat } from '@/app/lib/csv';

interface SelectionBarProps {
  count: number;
  onClear: () => void;
  onExportCSV?: () => void;
  onExport?: (format: ExportFormat) => void;
}

const SelectionBar: React.FC<SelectionBarProps> = ({ count, onClear, onExportCSV, onExport }) => {
  const { resolvedTheme } = useTheme();
  const styles = useMemo(() => (resolvedTheme === 'dark' ? { ...commonStyles, ...darkStyles } : { ...commonStyles, ...lightStyles }), [resolvedTheme]);
  const [fmt, setFmt] = useState<ExportFormat>('csv');
  if (count === 0) return null;
  return (
    <div className={styles.bar} role="status" aria-live="polite" title="Selection status and actions">
      <span className={styles.info}>{count} selected</span>
      <span className={styles.srOnly}>Selection updated: {count} rows selected</span>
      <div className={styles.actions} role="group" aria-label="Selection actions" title="Selection actions">
        {onExport && (
          <>
            <label htmlFor="selection-export-format" className={styles.srOnly}>Export format</label>
            <select
              id="selection-export-format"
              className={styles.select}
              value={fmt}
              onChange={(e) => setFmt(e.target.value as ExportFormat)}
              aria-label="Export selected format"
            >
              {(['csv','xlsx','pdf'] as ExportFormat[]).map(f => (
                <option key={f} value={f}>{f.toUpperCase()}</option>
              ))}
            </select>
            <button type="button" className={styles.button} onClick={() => onExport(fmt)} aria-label={`Export selected ${fmt.toUpperCase()}`} title={`Export selected as ${fmt.toUpperCase()}`}>Export Selected</button>
          </>
        )}
        {!onExport && onExportCSV && <button type="button" className={styles.button} onClick={onExportCSV} aria-label="Export selected as CSV" title="Export selected rows as CSV">Export Selected</button>}
        <button type="button" className={styles.button} onClick={onClear} aria-label="Clear selection" title="Clear current selection">Clear</button>
      </div>
    </div>
  );
};

export default SelectionBar;
