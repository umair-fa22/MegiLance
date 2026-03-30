'use client';

import { useEffect, useRef, useState, useCallback, ComponentType } from 'react';
import commonStyles from './Whiteboard.common.module.css';
import lightStyles from './Whiteboard.light.module.css';
import darkStyles from './Whiteboard.dark.module.css';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

// Type for the CanvasDraw component instance
interface CanvasDrawInstance {
  clear: () => void;
  undo: () => void;
  getSaveData: () => string;
  loadSaveData: (data: string) => void;
}

// Props type for the CanvasDraw component
interface CanvasDrawProps {
  brushColor?: string;
  canvasWidth?: string | number;
  canvasHeight?: number;
  hideGrid?: boolean;
  hideInterface?: boolean;
  onChange?: (canvas: CanvasDrawInstance) => void;
  lazyRadius?: number;
  brushRadius?: number;
  catenaryColor?: string;
  gridColor?: string;
  backgroundColor?: string;
  disabled?: boolean;
  imgSrc?: string;
  saveData?: string;
  immediateLoading?: boolean;
  gridSizeX?: number;
  gridSizeY?: number;
  gridLineWidth?: number;
  enablePanAndZoom?: boolean;
  clampLinesToDocument?: boolean;
}

// Dynamic import with proper typing
const CanvasDraw = dynamic(
  () => import('react-canvas-draw').then((mod) => mod.default as ComponentType<CanvasDrawProps>),
  { ssr: false }
) as ComponentType<CanvasDrawProps>;

interface WhiteboardProps {
  contractId: string;
}

export default function Whiteboard({ contractId }: WhiteboardProps) {
  const { resolvedTheme } = useTheme();
  const canvasInstanceRef = useRef<CanvasDrawInstance | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClear = useCallback(() => {
    canvasInstanceRef.current?.clear();
  }, []);

  const handleUndo = useCallback(() => {
    canvasInstanceRef.current?.undo();
  }, []);

  // Capture canvas instance via onChange
  const handleCanvasChange = useCallback((canvas: CanvasDrawInstance) => {
    canvasInstanceRef.current = canvas;
  }, []);

  if (!mounted || !resolvedTheme) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <h3>Interactive Whiteboard</h3>
        <div className={commonStyles.actions}>
          <button onClick={handleClear} className={themeStyles.button}>Clear</button>
          <button onClick={handleUndo} className={themeStyles.button}>Undo</button>
        </div>
      </div>
      <div className={commonStyles.canvasWrapper}>
        <CanvasDraw
          onChange={handleCanvasChange}
          brushColor={resolvedTheme === 'dark' ? '#fff' : '#000'}
          canvasWidth="100%"
          canvasHeight={400}
          hideGrid={false}
          hideInterface={true}
        />
      </div>
    </div>
  );
}
