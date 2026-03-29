// @AI-HINT: SavedViewsMenu lets users save/apply/delete named views for table controls.
'use client';

import React, { useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { useSavedViews, SavedView } from '@/app/lib/hooks/useSavedViews';
import commonStyles from './SavedViewsMenu.common.module.css';
import lightStyles from './SavedViewsMenu.light.module.css';
import darkStyles from './SavedViewsMenu.dark.module.css';

export interface SavedViewsMenuProps<T = any> {
  storageKey: string;
  buildPayload: () => T; // called when saving a new view
  onApply: (payload: T) => void; // apply a saved view
  'aria-label'?: string;
}

const SavedViewsMenu = <T,>({ storageKey, buildPayload, onApply, 'aria-label': ariaLabel = 'Saved Views' }: SavedViewsMenuProps<T>) => {
  const { resolvedTheme } = useTheme();
  const styles = useMemo(() => (resolvedTheme === 'dark' ? { ...commonStyles, ...darkStyles } : { ...commonStyles, ...lightStyles }), [resolvedTheme]);
  const { views, save, remove, clearAll } = useSavedViews<T>(storageKey);
  const [name, setName] = useState('');

  return (
    <div className={styles.wrap} role="group" aria-label={ariaLabel} title={ariaLabel}>
      <div className={styles.actions}>
        <input
          className={styles.input}
          type="text"
          placeholder="View name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Saved view name"
          title="Enter a name for the saved view"
        />
        <button
          type="button"
          className={styles.button}
          onClick={() => { if (name.trim()) { save(name.trim(), buildPayload()); setName(''); } }}
          aria-label="Save current view"
          title="Save current view"
        >Save</button>
        <button type="button" className={styles.button} onClick={() => clearAll()} aria-label="Clear all saved views" title="Clear all saved views">Clear</button>
      </div>
      <span className={styles.srOnly} aria-live="polite">
        {views.length === 0 ? 'No saved views' : `${views.length} saved view${views.length === 1 ? '' : 's'}`}
      </span>
      <ul className={styles.list} role="list">
        {views.length === 0 && (
          <li className={styles.empty} aria-live="polite">No saved views</li>
        )}
        {views.sort((a: SavedView, b: SavedView) => b.createdAt - a.createdAt).map(v => (
          <li key={v.name} className={styles.item}>
            <span className={styles.viewName}>{v.name}</span>
            <div className={styles.itemActions}>
              <button type="button" className={styles.smallButton} onClick={() => onApply(v.payload)} aria-label={`Apply view ${v.name}`} title={`Apply view ${v.name}`}>Apply</button>
              <button type="button" className={styles.smallDanger} onClick={() => remove(v.name)} aria-label={`Delete view ${v.name}`} title={`Delete view ${v.name}`}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SavedViewsMenu;
