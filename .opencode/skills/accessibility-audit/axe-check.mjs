// Runs axe-core (WCAG 2.0/2.1 A and AA rules) on one page of the running app and prints the violations.
// Usage: node .opencode/skills/accessibility-audit/axe-check.mjs /practice --as student1 --width 1280
// The app must be running (npm run dev). Set BASE_URL to use another address.
import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';

const PASSWORDS = { student1: 'practice1', student2: 'practice2', student3: 'practice3' };
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const path = args.find((arg, i) => !arg.startsWith('--') && !args[i - 1]?.startsWith('--')) ?? '/login';
const as = option('as', path === '/login' ? null : 'student1');
const width = Number(option('width', 1280));
const baseUrl = process.env.BASE_URL ?? 'http://localhost:5173';

const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  if (as) {
    await page.goto(`${baseUrl}/login`);
    await page.getByLabel('Username').fill(as);
    await page.getByLabel('Password').fill(PASSWORDS[as]);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/home');
  }
  await page.goto(`${baseUrl}${path}`);
  await page.waitForLoadState('networkidle');

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  console.log(`axe ${results.testEngine.version} on ${path} (${as ?? 'signed out'}, ${width} px wide)`);
  console.log(`${results.violations.length} violations, ${results.passes.length} rules passed\n`);
  for (const v of results.violations) {
    console.log(`- ${v.id} (${v.impact}): ${v.help}`);
    console.log(`  WCAG tags: ${v.tags.filter((t) => t.startsWith('wcag')).join(', ')}`);
    for (const node of v.nodes.slice(0, 3)) console.log(`  at ${node.target.join(' ')}`);
    if (v.nodes.length > 3) console.log(`  … and ${v.nodes.length - 3} more`);
  }
} finally {
  await browser.close();
}
