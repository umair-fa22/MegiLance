const fs = require('fs');
const content = fs.readFileSync('E:/MegiLance/frontend/app/components/molecules/DatePicker/DatePicker.tsx', 'utf8');
const searchString = "const { resolvedTheme } = useTheme();";
const replaceString = "const { resolvedTheme } = useTheme();\n  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;";
const newContent = content.replace(searchString, replaceString);
fs.writeFileSync('E:/MegiLance/frontend/app/components/molecules/DatePicker/DatePicker.tsx', newContent);
console.log("Patched");
