const fs = require('fs');
const filepath = 'frontend/app/components/AdvancedFeatures/RealTimeNotifications/RealTimeNotifications.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// Add import
content = content.replace(
  `import { cn } from '@/lib/utils';`,
  `import { cn } from '@/lib/utils';\nimport { useFloating, offset, flip, shift, autoUpdate, FloatingPortal, useClick, useDismiss, useInteractions } from '@floating-ui/react';`
);

// Add hooks
content = content.replace(
  `  const [isOpen, setIsOpen] = useState(false);`,
  `  const [isOpen, setIsOpen] = useState(false);\n  const { refs, floatingStyles, context } = useFloating({\n    open: isOpen,\n    onOpenChange: setIsOpen,\n    placement: 'bottom-end',\n    middleware: [offset(8), flip(), shift({ padding: 8 })],\n    whileElementsMounted: autoUpdate\n  });\n  const click = useClick(context);\n  const dismiss = useDismiss(context);\n  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);`
);


// Replace button ref and props
content = content.replace(
  `      <button\n        className={styles.bellButton}\n        onClick={() => setIsOpen(!isOpen)}`,
  `      <button\n        ref={refs.setReference}\n        {...getReferenceProps()}\n        className={styles.bellButton}`
);

// Replace dropdown div
content = content.replace(
  `{isOpen && (\n        <div className={styles.dropdown}>`,
  `{isOpen && (\n        <FloatingPortal>\n        <div \n          ref={refs.setFloating}\n          style={{ ...floatingStyles, zIndex: 1000 }}\n          {...getFloatingProps()}\n          className={styles.dropdown}>`
);

content = content.replace(
  `            )}\n\n          </div>\n        </div>\n      )}`,
  `            )}\n\n          </div>\n        </div>\n        </FloatingPortal>\n      )}`
);

fs.writeFileSync(filepath, content);
console.log("RealTimeNotifications patched!");
