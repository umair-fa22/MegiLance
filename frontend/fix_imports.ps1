$files = @(
  "E:\MegiLance\frontend\app\components\molecules\Table\Table.tsx",
  "E:\MegiLance\frontend\app\components\organisms\Footer\Footer.tsx",
  "E:\MegiLance\frontend\app\components\organisms\Header\Header.tsx",
  "E:\MegiLance\frontend\app\components\organisms\Sidebar\Sidebar.tsx"
)

foreach ($f in $files) {
  $content = Get-Content $f -Raw
  $content = $content -replace "import React\r?\nimport \{ motion \} from 'framer-motion', \{", "import React, {"
  $content = $content -replace "import React\r?\nimport \{ motion, AnimatePresence \} from 'framer-motion';, \{", "import React, {"
  $content = $content -replace "type: \\'spring\\' as const", "type: 'spring' as const"
  Set-Content -Path $f -Value $content -NoNewline
}
