#!/usr/bin/env node
// @AI-HINT: CLI tool to validate that all components follow the 3-file CSS module pattern.
// Scans for .common.module.css files and ensures matching .light.module.css and .dark.module.css exist.
// Also flags any component using a single .module.css file (non-compliant).

const fs = require('fs');
const path = require('path');

const APP_DIR = path.resolve(__dirname, '..', 'app');
const COMPONENTS_DIR = path.resolve(__dirname, '..', 'app', 'components');

let passed = 0;
let warnings = 0;
let errors = 0;

const results = { compliant: [], nonCompliant: [], orphanCommon: [], orphanSingle: [] };

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  const files = entries.filter(e => e.isFile()).map(e => e.name);
  const dirs = entries.filter(e => e.isDirectory());

  // Find all .common.module.css files (these indicate 3-file pattern)
  const commonFiles = files.filter(f => f.endsWith('.common.module.css'));

  for (const common of commonFiles) {
    const base = common.replace('.common.module.css', '');
    const lightFile = `${base}.light.module.css`;
    const darkFile = `${base}.dark.module.css`;

    const hasLight = files.includes(lightFile);
    const hasDark = files.includes(darkFile);

    const relPath = path.relative(APP_DIR, path.join(dir, common));

    if (hasLight && hasDark) {
      results.compliant.push(relPath.replace('.common.module.css', ''));
      passed++;
    } else {
      const missing = [];
      if (!hasLight) missing.push(lightFile);
      if (!hasDark) missing.push(darkFile);
      results.orphanCommon.push({ path: relPath, missing });
      errors++;
    }
  }

  // Find single .module.css files (non-compliant pattern)
  const singleModules = files.filter(f =>
    f.endsWith('.module.css') &&
    !f.endsWith('.common.module.css') &&
    !f.endsWith('.light.module.css') &&
    !f.endsWith('.dark.module.css')
  );

  for (const single of singleModules) {
    const relPath = path.relative(APP_DIR, path.join(dir, single));
    results.orphanSingle.push(relPath);
    warnings++;
  }

  // Recurse into subdirectories
  for (const d of dirs) {
    if (d.name === 'node_modules' || d.name === '.next') continue;
    scanDir(path.join(dir, d.name));
  }
}

// Also check TSX files import the correct .common variant
function checkImports(dir) {
  if (!fs.existsSync(dir)) return [];
  const violations = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      violations.push(...checkImports(path.join(dir, entry.name)));
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      const filePath = path.join(dir, entry.name);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Check for imports of non-compliant single module CSS
        const match = line.match(/import\s+\w+\s+from\s+['"](.+\.module\.css)['"]/);
        if (match) {
          const cssPath = match[1];
          if (!cssPath.includes('.common.') && !cssPath.includes('.light.') && !cssPath.includes('.dark.')) {
            violations.push({
              file: path.relative(APP_DIR, filePath),
              line: i + 1,
              import: cssPath,
            });
          }
        }
      }
    }
  }
  return violations;
}

console.log('\n🔍 MegiLance CSS 3-File Compliance Validator\n');
console.log('━'.repeat(60));

// Scan all directories
scanDir(APP_DIR);

// Report compliant components
if (results.compliant.length > 0) {
  console.log(`\n✅ COMPLIANT (${results.compliant.length} component sets):`);
  results.compliant.forEach(c => console.log(`   ✓ ${c}`));
}

// Report missing light/dark files
if (results.orphanCommon.length > 0) {
  console.log(`\n❌ INCOMPLETE 3-FILE SETS (${results.orphanCommon.length}):`);
  results.orphanCommon.forEach(c => {
    console.log(`   ✗ ${c.path}`);
    console.log(`     Missing: ${c.missing.join(', ')}`);
  });
}

// Report single module CSS files
if (results.orphanSingle.length > 0) {
  console.log(`\n⚠️  NON-COMPLIANT SINGLE CSS MODULES (${results.orphanSingle.length}):`);
  results.orphanSingle.forEach(f => console.log(`   ⚠ ${f}`));
}

// Check for import violations
console.log('\n━'.repeat(60));
console.log('\n🔍 Checking TSX/TS imports for non-compliant CSS references...');
const importViolations = checkImports(APP_DIR);

if (importViolations.length > 0) {
  console.log(`\n⚠️  IMPORT VIOLATIONS (${importViolations.length}):`);
  importViolations.forEach(v => {
    console.log(`   ⚠ ${v.file}:${v.line} → imports "${v.import}"`);
  });
  warnings += importViolations.length;
} else {
  console.log('   ✓ No import violations found.');
}

// Summary
console.log('\n' + '━'.repeat(60));
console.log('\n📊 SUMMARY:');
console.log(`   ✅ Compliant:  ${passed}`);
console.log(`   ⚠️  Warnings:   ${warnings}`);
console.log(`   ❌ Errors:     ${errors}`);
console.log(`   Total sets:   ${passed + errors}`);

if (errors > 0) {
  console.log('\n❌ VALIDATION FAILED - Fix missing CSS theme files.\n');
  process.exit(1);
} else if (warnings > 0) {
  console.log('\n⚠️  PASSED WITH WARNINGS - Consider migrating single CSS modules.\n');
  process.exit(0);
} else {
  console.log('\n✅ ALL COMPLIANT!\n');
  process.exit(0);
}
