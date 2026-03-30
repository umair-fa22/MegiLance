import { useEffect, useRef, useState } from 'react';
import commonStyles from './Whiteboard.common.module.css';
import lightStyles from './Whiteboard.light.module.css';
import darkStyles from './Whiteboard.dark.module.css';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
const CanvasDraw = dynamic(() => import('react-canvas-draw'), { ssr: false });
import { cn } from '@/lib/utils';

interface WhiteboardProps {
  contractId: string;
}

export default function Whiteboard({ contractId }: WhiteboardProps) {
  const { resolvedTheme } = useTheme();
  const canvasRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !resolvedTheme) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <h3>Interactive Whiteboard</h3>
        <div className={commonStyles.actions}>
          <button onClick={() => canvasRef.current?.clear()} className={themeStyles.button}>Clear</button>
          <button onClick={() => canvasRef.current?.undo()} className={themeStyles.button}>Undo</button>
        </div>
      </div>
      <div className={commonStyles.canvasWrapper}>
        <CanvasDraw
          ref={canvasRef}
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
