// @AI-HINT: Lightweight virtualized tbody that renders only visible rows inside a scrollable table container with sticky headers.
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import commonStyles from './VirtualTableBody.common.module.css';

export interface VirtualTableBodyProps<T> {
  // Items to render
  items: T[];
  // Approx/fixed row height in px
  rowHeight: number;
  // Render a row (must return a <tr> element)
  renderRow: (item: T, index: number) => React.ReactElement;
  // Optional overscan rows above and below the viewport
  overscan?: number;
  // The scrollable container that wraps the table (with sticky header)
  containerRef: React.RefObject<HTMLElement | null>;
  // Optional empty state row when there are no items
  renderEmpty?: () => React.ReactElement | null;
}

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(n, max)); }

export default function VirtualTableBody<T>(props: VirtualTableBodyProps<T>) {
  const { items, rowHeight, renderRow, overscan = 4, containerRef, renderEmpty } = props;

  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(0);

  // Attach scroll and resize listeners on the provided container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => setScrollTop(el.scrollTop);
    const onResize = () => setViewportH(el.clientHeight);

    // Initialize
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
    if (items.length === 0 || rowHeight <= 0 || viewportH <= 0) {
      return { start: 0, end: 0, padTop: 0, padBottom: 0 };
    }
    const maxIndex = items.length - 1;
    const estStart = Math.floor(scrollTop / rowHeight);
    const estVisible = Math.ceil(viewportH / rowHeight);
    const start = clamp(estStart - overscan, 0, maxIndex);
    const end = clamp(estStart + estVisible + overscan, 0, maxIndex);

    const padTop = start * rowHeight;
    const padBottom = (maxIndex - end) * rowHeight;

    return { start, end, padTop, padBottom };
  }, [items.length, rowHeight, viewportH, scrollTop, overscan]);

  if (items.length === 0) {
    return (
      <tbody>
        {renderEmpty ? (
          renderEmpty()
        ) : (
          <tr>
            <td colSpan={999}>
              <div role="status" aria-live="polite" className={commonStyles.emptyRow}>No results</div>
            </td>
          </tr>
        )}
      </tbody>
    );
  }

  // Render only the visible window with spacer rows to maintain scroll height
  const windowItems = items.slice(start, end + 1);

  return (
    <tbody>
      {padTop > 0 && (
        <tr aria-hidden="true" style={{ height: padTop }}>
          <td colSpan={999} />
        </tr>
      )}
      {windowItems.map((item, i) => renderRow(item, start + i))}
      {padBottom > 0 && (
        <tr aria-hidden="true" style={{ height: padBottom }}>
          <td colSpan={999} />
        </tr>
      )}
    </tbody>
  );
}
