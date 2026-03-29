// @AI-HINT: Column visibility menu with persisted state via useColumnVisibility.
'use client';

import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import commonStyles from './ColumnVisibilityMenu.common.module.css';
import lightStyles from './ColumnVisibilityMenu.light.module.css';
import darkStyles from './ColumnVisibilityMenu.dark.module.css';

export interface ColumnDef { key: string; label: string; }

interface ColumnVisibilityMenuProps {
  columns: ColumnDef[];
  visibleKeys: string[];
  onToggle: (key: string) => void;
  onShowAll?: () => void;
  onHideAll?: () => void;
  'aria-label'?: string;
}

const ColumnVisibilityMenu: React.FC<ColumnVisibilityMenuProps> = ({ columns, visibleKeys, onToggle, onShowAll, onHideAll, 'aria-label': ariaLabel = 'Columns' }) => {
  const { resolvedTheme } = useTheme();
  const styles = useMemo(() => (resolvedTheme === 'dark' ? { ...commonStyles, ...darkStyles } : { ...commonStyles, ...lightStyles }), [resolvedTheme]);
  const descId = 'column-visibility-help';
  return (
    <div className={styles.menu} role="group" aria-label={ariaLabel} title={ariaLabel} aria-describedby={descId}>
      <div className={styles.menuHeader}>
        <span className={styles.menuTitle}>Columns</span>
        <div className={styles.menuActions}>
          {onShowAll && <button type="button" className={styles.linkButton} onClick={onShowAll} title="Show all columns">Show all</button>}
          {onHideAll && <button type="button" className={styles.linkButton} onClick={onHideAll} title="Hide all columns">Hide all</button>}
        </div>
      </div>
      <span className={styles.srOnly} aria-live="polite">
        {visibleKeys.length} column{visibleKeys.length === 1 ? '' : 's'} visible
      </span>
      <p id={descId} className={styles.srOnly}>Use the checkboxes to show or hide table columns.</p>
      <ul className={styles.menuList} aria-label="Toggle columns">
        {columns.map(col => (
          <li key={col.key} className={styles.menuItem}>
            <label className={styles.checkboxLabel} title={`Toggle ${col.label}`}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={visibleKeys.includes(col.key)}
                onChange={() => onToggle(col.key)}
                aria-label={`Toggle column ${col.label}`}
              />
              <span>{col.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
} 

export default ColumnVisibilityMenu;
