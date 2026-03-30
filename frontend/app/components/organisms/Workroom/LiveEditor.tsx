import { useEffect, useState } from 'react';
import commonStyles from './LiveEditor.common.module.css';
import lightStyles from './LiveEditor.light.module.css';
import darkStyles from './LiveEditor.dark.module.css';
import { useTheme } from 'next-themes';
import Editor from '@monaco-editor/react';
import { cn } from '@/lib/utils';

interface LiveEditorProps {
  contractId: string;
}

export default function LiveEditor({ contractId }: LiveEditorProps) {
  const { resolvedTheme } = useTheme();
  const [code, setCode] = useState<string>('// Start coding here...');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // In a real implementation we would connect WebSocket to sync `code` based on contractId
  }, []);

  if (!mounted || !resolvedTheme) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
  const editorTheme = resolvedTheme === 'dark' ? 'vs-dark' : 'vs-light';

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <h3>Live Source Editor</h3>
        <span className={themeStyles.badge}>Connected</span>
      </div>
      <div className={commonStyles.editorWrapper}>
        <Editor
          height="100%"
          defaultLanguage="typescript"
          theme={editorTheme}
          value={code}
          onChange={(value) => setCode(value || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            padding: { top: 16 }
          }}
        />
      </div>
    </div>
  );
}
