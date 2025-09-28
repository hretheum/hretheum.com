#!/usr/bin/env node

// Accessibility audit script using axe-core
// Usage: npm run a11y:audit [url]

const puppeteer = require('puppeteer');

async function runAxeAudit(url = 'http://localhost:3000') {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Inject axe-core
    await page.addScriptTag({ url: 'https://unpkg.com/axe-core@4.7.0/axe.min.js' });

    console.log(`🔍 Running accessibility audit on: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle0' });

    // Run axe
    const results = await page.evaluate(async () => {
      return await window.axe.run(document, {
        rules: {
          // Focus on critical rules for AA compliance
          'color-contrast': { enabled: true },
          'keyboard': { enabled: true },
          'focus-visible': { enabled: true },
          'aria-label': { enabled: true },
          'aria-labelledby': { enabled: true },
          'button-name': { enabled: true },
          'image-alt': { enabled: true },
          'link-name': { enabled: true },
          'heading-order': { enabled: true },
          'landmark-one-main': { enabled: true },
          'page-has-heading-one': { enabled: true },
          'region': { enabled: true },
          'skip-link': { enabled: false }, // Not required for SPA
        }
      });
    });

    await browser.close();

    // Analyze results
    const violations = results.violations;
    const criticalIssues = violations.filter(v => v.impact === 'critical');
    const seriousIssues = violations.filter(v => v.impact === 'serious');

    console.log(`\n📊 Accessibility Audit Results for ${url}:`);
    console.log(`Total violations: ${violations.length}`);
    console.log(`Critical: ${criticalIssues.length}`);
    console.log(`Serious: ${seriousIssues.length}`);
    console.log(`Moderate: ${violations.filter(v => v.impact === 'moderate').length}`);
    console.log(`Minor: ${violations.filter(v => v.impact === 'minor').length}`);

    if (criticalIssues.length > 0 || seriousIssues.length > 0) {
      console.log('\n❌ CRITICAL/SERIOUS ISSUES:');
      [...criticalIssues, ...seriousIssues].forEach(violation => {
        console.log(`\n🔴 ${violation.id} (${violation.impact})`);
        console.log(`   ${violation.description}`);
        console.log(`   Elements affected: ${violation.nodes.length}`);
        console.log(`   Help: ${violation.helpUrl}`);
      });
      return false;
    } else {
      console.log('\n✅ No critical or serious accessibility violations found!');
      return true;
    }

  } catch (error) {
    console.error('❌ Audit failed:', error.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const urls = args.length > 0 ? args : [
    'http://localhost:3000',
    'http://localhost:3000/brand/tmobile',
    'http://localhost:3000/brand/codeandpepper',
    'http://localhost:3000/brand/fluxon'
  ];

  let allPassed = true;

  for (const url of urls) {
    const passed = await runAxeAudit(url);
    if (!passed) allPassed = false;
  }

  if (allPassed) {
    console.log('\n🎉 All accessibility audits passed!');
    process.exit(0);
  } else {
    console.log('\n💥 Some accessibility issues found. Please fix before proceeding.');
    process.exit(1);
  }
}

main().catch(console.error);