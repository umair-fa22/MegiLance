const fs = require('fs');
const filepath = 'frontend/app/components/molecules/DatePicker/DatePicker.tsx';
let content = fs.readFileSync(filepath, 'utf8');

content = content.replace(
  `import { useTheme } from 'next-themes';`,
  `import { useTheme } from 'next-themes';\nimport { useFloating, offset, flip, shift, autoUpdate, FloatingPortal } from '@floating-ui/react';`
);

content = content.replace(
  `const [isOpen, setIsOpen] = useState(false);`,
  `const [isOpen, setIsOpen] = useState(false);\n  const { refs, floatingStyles } = useFloating({\n    open: isOpen,\n    onOpenChange: setIsOpen,\n    middleware: [offset(4), flip(), shift({ padding: 8 })],\n    whileElementsMounted: autoUpdate\n  });`
);

content = content.replace(
  `className={cn(
          commonStyles.inputWrapper,
          themeStyles.inputWrapper,`,
  `ref={refs.setReference}\n        className={cn(\n          commonStyles.inputWrapper,\n          themeStyles.inputWrapper,`
);

content = content.replace(
  `{isOpen && (
          <div
            id={calendarId}
            role="dialog"`,
  `{isOpen && (
          <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{ ...floatingStyles, zIndex: 1000 }}
            id={calendarId}
            role="dialog"`
);

content = content.replace(
  `            {renderCalendarFooter()}
          </div>
        )}`,
  `            {renderCalendarFooter()}
          </div>
          </FloatingPortal>
        )}`
);

fs.writeFileSync(filepath, content);
console.log("DatePicker patched");
