// @AI-HINT: Lightweight virtualized list for div-based lists (non-table). Renders only visible items inside a scrollable container.
'use client';

import React, { useEffect, useMemo, useState } from 'react';

export interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactElement;
  overscan?: number;
  containerRef: React.RefObject<HTMLElement | null>;
  renderEmpty?: () => React.ReactElement | null;
}

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(n, max)); }

export default function VirtualList<T>(props: VirtualListProps<T>) {
  const { items, itemHeight, renderItem, overscan = 6, containerRef, renderEmpty } = props;

  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => setScrollTop(el.scrollTop);
    const onResize = () => setViewportH(el.clientHeight);
    onResize();
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, [containerRef]);

  const { start, end, padTop, padBottom } = useMemo(() => {
    if (items.length === 0 || itemHeight <= 0 || viewportH <= 0) {
      return { start: 0, end: 0, padTop: 0, padBottom: 0 };
    }
    const maxIndex = items.length - 1;
    const estStart = Math.floor(scrollTop / itemHeight);
    const estVisible = Math.ceil(viewportH / itemHeight);
    const start = clamp(estStart - overscan, 0, maxIndex);
    const end = clamp(estStart + estVisible + overscan, 0, maxIndex);

    const padTop = start * itemHeight;
    const padBottom = (maxIndex - end) * itemHeight;

    return { start, end, padTop, padBottom };
  }, [items.length, itemHeight, viewportH, scrollTop, overscan]);

  if (items.length === 0) {
    return renderEmpty ? renderEmpty() : <></>;
  }

  const windowItems = items.slice(start, end + 1);

  return (
    <div>
      {padTop > 0 && <div aria-hidden="true" style={{ height: padTop }} />}
      {windowItems.map((item, i) => renderItem(item, start + i))}
      {padBottom > 0 && <div aria-hidden="true" style={{ height: padBottom }} />}
    </div>
  );
}
