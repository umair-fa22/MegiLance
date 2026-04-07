// @AI-HINT: Generic selection hook for tables/lists supporting toggle, select all on current page, and clear.
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export function useSelection<T extends string | number>(allIds: T[], opts?: { storageKey?: string }) {
  const storageKey = opts?.storageKey;

  // Initialize from storage if provided
  const [selected, setSelected] = useState<Set<T>>(() => {
    if (typeof window === 'undefined' || !storageKey) return new Set();
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return new Set();
      const arr = JSON.parse(raw) as T[];
      return new Set(arr.filter(id => allIds.includes(id)));
    } catch {
      return new Set();
    }
  });

  const isSelected = useCallback((id: T) => selected.has(id), [selected]);
  const toggle = useCallback((id: T) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const selectMany = useCallback((ids: T[]) => {
    setSelected(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
  }, []);

  const deselectMany = useCallback((ids: T[]) => {
    setSelected(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
  }, []);

  const allSelected = useMemo(() => selected.size > 0 && allIds.every(id => selected.has(id)), [selected, allIds]);
  const count = selected.size;

  // Persist selection when it changes
  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    try {
      const arr = Array.from(selected);
      window.localStorage.setItem(storageKey, JSON.stringify(arr));
    } catch { /* localStorage unavailable */ }
  }, [selected, storageKey]);

  // Prune selection when the available IDs change (e.g., filters)
  useEffect(() => {
    setSelected(prev => {
      const next = new Set(Array.from(prev).filter(id => allIds.includes(id)) as T[]);
      return next.size === prev.size ? prev : next;
    });
  }, [allIds]);

  return { selected, isSelected, toggle, clear, selectMany, deselectMany, allSelected, count } as const;
}
