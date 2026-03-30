const fs = require('fs');
const filepath = 'frontend/app/components/molecules/DatePicker/DatePicker.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// 1. Add `ref={refs.setReference}` right before `className={cn(\n          commonStyles.inputContainer`
content = content.replace(
  /className=\{cn\(\s*commonStyles\.inputContainer,\s*themeStyles\.inputContainer,/m,
  "ref={refs.setReference}\n        className={cn(\n          commonStyles.inputContainer,\n          themeStyles.inputContainer,"
);

// 2. Wrap the calendar div in <FloatingPortal>
// We'll replace `{isOpen && (\s*<div\s*id=\{calendarId\}\s*role="dialog"` 
// with `{isOpen && (\n        <FloatingPortal>\n          <div\n            ref={refs.setFloating}\n            style={{ ...floatingStyles, zIndex: 100 }}\n            id={calendarId}\n            role="dialog"`
content = content.replace(
  /\{isOpen && \(\s*<div\s*id=\{calendarId\}\s*role="dialog"/m,
  `{isOpen && (\n          <FloatingPortal>\n          <div\n            ref={refs.setFloating}\n            style={{ ...floatingStyles, zIndex: 1000 }}\n            id={calendarId}\n            role="dialog"`
);

// 3. Close the FloatingPortal
// Replace `{renderCalendarFooter()}\s*<\/div>\s*\)\}/m`
content = content.replace(
  /\{renderCalendarFooter\(\)\}\s*<\/div>\s*\)\}/m,
  `{renderCalendarFooter()}\n          </div>\n          </FloatingPortal>\n        )}`
);

fs.writeFileSync(filepath, content);
console.log("DatePicker regex patched");
