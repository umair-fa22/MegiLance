import sys
path = 'frontend/app/components/molecules/DatePicker/DatePicker.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import { useTheme } from 'next-themes';", "import { useTheme } from 'next-themes';\nimport { useFloating, offset, flip, shift, autoUpdate, FloatingPortal } from '@floating-ui/react';")
content = content.replace("const [isOpen, setIsOpen] = useState(false);", "const [isOpen, setIsOpen] = useState(false);\n  const { refs, floatingStyles } = useFloating({ open: isOpen, onOpenChange: setIsOpen, middleware: [offset(8), flip(), shift({ padding: 8 })], whileElementsMounted: autoUpdate });")
content = content.replace("ref={containerRef}", "ref={(node) => { containerRef.current = node; refs.setReference(node); }}")
content = content.replace("<div className={cn(commonStyles.calendarContainer, themeStyles.calendarContainer)}>", "<FloatingPortal>{isOpen && (<div ref={refs.setFloating} style={{ ...floatingStyles, zIndex: 1000 }} className={cn(commonStyles.calendarContainer, themeStyles.calendarContainer)}>")
content = content.replace("      )}", "      </div>)}</FloatingPortal>")
content = content.replace("  return (\n    <div\n      className={cn(", "  return (\n    <div\n      className={cn(") 

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
