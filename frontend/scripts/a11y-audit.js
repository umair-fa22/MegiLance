// @AI-HINT: CLI accessibility audit tool using Playwright + axe-core. Scans multiple pages and generates a report.
const { chromium } = require('@playwright/test');

const PAGES = [
  { name: 'Homepage', path: '/' },
  { name: 'Features', path: '/features' },
  { name: 'Login', path: '/login' },
  { name: 'Signup', path: '/signup' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
  { name: 'Pricing', path: '/pricing' },
  { name: 'Blog', path: '/blog' },
  { name: 'How It Works', path: '/how-it-works' },
];

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function runAudit() {
  console.log('\n♿ MegiLance Accessibility Audit (axe-core)\n');
  console.log('━'.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Pages to audit: ${PAGES.length}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  const allResults = [];
  let totalViolations = 0;
  let totalPasses = 0;

  for (const page of PAGES) {
    const tab = await context.newPage();
    const url = `${BASE_URL}${page.path}`;
    
    process.stdout.write(`  Auditing ${page.name} (${page.path})... `);
    
    try {
      await tab.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      
      // Inject and run axe-core
      await tab.addScriptTag({ path: require.resolve('axe-core') });
      
      const results = await tab.evaluate(async () => {
        // @ts-ignore
        return await axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
          },
        });
      });

      const violations = results.violations || [];
      const passes = results.passes || [];
      totalViolations += violations.length;
      totalPasses += passes.length;

      const critical = violations.filter(v => v.impact === 'critical').length;
      const serious = violations.filter(v => v.impact === 'serious').length;
      const moderate = violations.filter(v => v.impact === 'moderate').length;
      const minor = violations.filter(v => v.impact === 'minor').length;

      if (violations.length === 0) {
        console.log(`✅ ${passes.length} rules passed, 0 violations`);
      } else {
        console.log(`⚠️  ${violations.length} violations (${critical} critical, ${serious} serious, ${moderate} moderate, ${minor} minor)`);
      }

      allResults.push({
        page: page.name,
        path: page.path,
        violations,
        passCount: passes.length,
        violationCount: violations.length,
        critical,
        serious,
      });
    } catch (err) {
      console.log(`❌ Failed to load: ${err.message}`);
      allResults.push({
        page: page.name,
        path: page.path,
        violations: [],
        passCount: 0,
        violationCount: -1,
        error: err.message,
      });
    }
    
    await tab.close();
  }

  await browser.close();

  // Detailed violation report
  console.log('\n' + '━'.repeat(60));
  console.log('\n📋 DETAILED VIOLATIONS:\n');

  for (const result of allResults) {
    if (result.violations && result.violations.length > 0) {
      console.log(`\n  📄 ${result.page} (${result.path}):`);
      for (const v of result.violations) {
        const icon = v.impact === 'critical' ? '🔴' : v.impact === 'serious' ? '🟠' : v.impact === 'moderate' ? '🟡' : '🔵';
        console.log(`    ${icon} [${v.impact}] ${v.id}: ${v.description}`);
        console.log(`       Help: ${v.helpUrl}`);
        console.log(`       Affected: ${v.nodes.length} element(s)`);
      }
    }
  }

  // Summary
  console.log('\n' + '━'.repeat(60));
  console.log('\n📊 AUDIT SUMMARY:');
  console.log(`   Pages audited:    ${allResults.filter(r => r.violationCount >= 0).length}/${PAGES.length}`);
  console.log(`   Total rules passed: ${totalPasses}`);
  console.log(`   Total violations:   ${totalViolations}`);
  
  const criticalTotal = allResults.reduce((s, r) => s + (r.critical || 0), 0);
  const seriousTotal = allResults.reduce((s, r) => s + (r.serious || 0), 0);
  
  if (criticalTotal > 0) {
    console.log(`   🔴 Critical: ${criticalTotal}`);
  }
  if (seriousTotal > 0) {
    console.log(`   🟠 Serious:  ${seriousTotal}`);
  }

  if (criticalTotal > 0) {
    console.log('\n❌ CRITICAL ACCESSIBILITY ISSUES FOUND\n');
    process.exit(1);
  } else if (totalViolations > 0) {
    console.log(`\n⚠️  ${totalViolations} non-critical issues found. Review and fix when possible.\n`);
    process.exit(0);
  } else {
    console.log('\n✅ ALL PAGES PASS ACCESSIBILITY AUDIT!\n');
    process.exit(0);
  }
}

runAudit().catch(err => {
  console.error('Audit failed:', err.message);
  process.exit(1);
});
