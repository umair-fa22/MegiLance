const fs = require('fs');
const filepath = 'frontend/app/components/atoms/Tooltip/Tooltip.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// Add import
content = content.replace(
  `import { useTheme } from 'next-themes';`,
  `import { useTheme } from 'next-themes';\nimport { useFloating, offset, flip, shift, autoUpdate, FloatingPortal, useHover, useFocus, useDismiss, useInteractions } from '@floating-ui/react';`
);

// Add hooks
content = content.replace(
  `  const timeoutRef = useRef<NodeJS.Timeout | null>(null);\n  const tooltipId = useId();`,
  `  const timeoutRef = useRef<NodeJS.Timeout | null>(null);\n  const tooltipId = useId();\n\n  const { refs, floatingStyles, context } = useFloating({\n    open: visible,\n    onOpenChange: setVisible,\n    placement: position,\n    middleware: [offset(8), flip(), shift({ padding: 8 })],\n    whileElementsMounted: autoUpdate\n  });\n  const hover = useHover(context, { delay });\n  const focus = useFocus(context);\n  const dismiss = useDismiss(context);\n  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss]);`
);

// We drop the manual showTooltip/hideTooltip and triggerProps because floating-ui `getFloatingProps`/`getReferenceProps` manages visibility state directly if we hook it to the visible state.
// Wait, no. `Hover` takes care of timeouts. Let's just remove the manual showTooltip and use `{...getReferenceProps()}` instead... 
// That might be a larger rewrite. Since Floating UI provides `{...getReferenceProps()}`, we can just cloneElement with that!

content = content.replace(
  /const showTooltip[\s\S]*?'aria-describedby': visible \? tooltipId : undefined,\n  };/m,
  "const triggerProps = getReferenceProps({ 'aria-describedby': visible ? tooltipId : undefined, ref: refs.setReference });"
);

// Modify wrapper rendering to not use commonStyles.tooltipWrapper if it's not needed? Or keep the wrapper?
// Actually in floating UI, we don't need a wrapper at all!
// We can just cloneElement to the children, and then have <FloatingPortal>.
content = content.replace(
  /<div className=\{cn\(commonStyles\.tooltipWrapper, className\)\}>\n\s*\{cloneElement\(children, triggerProps\)\}\n\s*\{visible && \(\n\s*<div\n\s*id=\{tooltipId\}/m,
  `{cloneElement(children, triggerProps)}\n      {visible && (\n        <FloatingPortal>\n        <div\n          ref={refs.setFloating}\n          style={{ ...floatingStyles, zIndex: 10000 }}\n          {...getFloatingProps()}\n          id={tooltipId}`
);

content = content.replace(
  /          <div className=\{commonStyles\.tooltipArrow\} data-popper-arrow \/>\n\s*<\/div>\n\s*\)\}\n\s*<\/div>/m,
  `          <div className={commonStyles.tooltipArrow} />\n        </div>\n        </FloatingPortal>\n      )}`
);

fs.writeFileSync(filepath, content);
console.log("Tooltip patched!");
