const fs = require('fs');
const filepath = 'frontend/app/components/molecules/LanguageSwitcher/LanguageSwitcher.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// Add import
content = content.replace(
  `import { cn } from '@/lib/utils';`,
  `import { cn } from '@/lib/utils';\nimport { useFloating, offset, flip, shift, autoUpdate, FloatingPortal, useClick, useDismiss, useInteractions } from '@floating-ui/react';`
);

// Add hooks
content = content.replace(
  `const [isOpen, setIsOpen] = useState(false);\n  const [isMounted, setIsMounted] = useState(false);\n  const dropdownRef = useRef<HTMLDivElement>(null);`,
  `const [isOpen, setIsOpen] = useState(false);\n  const [isMounted, setIsMounted] = useState(false);\n  const { refs, floatingStyles, context } = useFloating({\n    open: isOpen,\n    onOpenChange: setIsOpen,\n    middleware: [offset(4), flip(), shift({ padding: 8 })],\n    whileElementsMounted: autoUpdate\n  });\n  const click = useClick(context);\n  const dismiss = useDismiss(context);\n  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);`
);

// Replace button ref and props
content = content.replace(
  `ref={dropdownRef}`,
  ``
);

content = content.replace(
  `      <button\n        type="button"\n        className={cn(commonStyles.button, themeStyles.button)}\n        onClick={() => setIsOpen(!isOpen)}\n        aria-label="Change language"\n      >`,
  `      <button\n        ref={refs.setReference}\n        {...getReferenceProps()}\n        type="button"\n        className={cn(commonStyles.button, themeStyles.button)}\n        aria-label="Change language"\n      >`
);

// Replace dropdown div
content = content.replace(
  `{isOpen && (\n        <div className={cn(commonStyles.dropdown, themeStyles.dropdown)}>`,
  `{isOpen && (\n        <FloatingPortal>\n        <div \n          ref={refs.setFloating}\n          style={{ ...floatingStyles, zIndex: 1000 }}\n          {...getFloatingProps()}\n          className={cn(commonStyles.dropdown, themeStyles.dropdown)}>`
);

content = content.replace(
  `            </button>\n          ))}\n        </div>\n      )}`,
  `            </button>\n          ))}\n        </div>\n        </FloatingPortal>\n      )}`
);

fs.writeFileSync(filepath, content);
console.log("LanguageSwitcher patched!");
