// Helpers for the Playwright tests.
import { expect } from '@playwright/test';

export const PASSWORDS = { student1: 'practice1', student2: 'practice2', student3: 'practice3' };

export async function signIn(page, username = 'student1') {
  await page.goto('/login');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(PASSWORDS[username]);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/home');
}

// Starts a new attempt through the API (the page's session cookie is used) and returns its ID.
export async function startAttempt(page, testId) {
  const res = await page.request.post(`/api/tests/${testId}/attempts`);
  expect(res.status()).toBe(201);
  return (await res.json()).id;
}

export async function openQuestion(page, attemptId, n = 1) {
  await page.goto(`/test/${attemptId}/q/${n}`);
  await expect(page.getByText(/^Question \d+ of \d+$/)).toBeVisible();
  await expect(page.locator('[aria-busy="false"]')).toHaveCount(1);
}

// Presses Tab until the focused element's text or label matches `pattern`.
export async function tabTo(page, pattern, maxTabs = 80) {
  await page.locator('body').click({ position: { x: 1, y: 1 } });
  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press('Tab');
    const label = await page.evaluate(() => {
      const el = document.activeElement;
      return `${el?.getAttribute('aria-label') ?? ''} ${el?.textContent ?? ''}`.trim();
    });
    if (pattern.test(label)) return;
  }
  throw new Error(`Tab did not reach an element that matches ${pattern}`);
}

function parseColour(value) {
  const parts = value.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 1];
  return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
}

function luminance({ r, g, b }) {
  const channel = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(colourA, colourB) {
  const [l1, l2] = [luminance(parseColour(colourA)), luminance(parseColour(colourB))].sort((a, b) => b - a);
  return Math.round(((l1 + 0.05) / (l2 + 0.05)) * 100) / 100;
}

// The focused element's outline, and the background colour around it.
export async function focusRing(page) {
  const ring = await page.evaluate(() => {
    const el = document.activeElement;
    const style = getComputedStyle(el);
    let background = 'rgb(255, 255, 255)';
    for (let node = el.parentElement; node; node = node.parentElement) {
      const bg = getComputedStyle(node).backgroundColor;
      const alpha = bg.startsWith('rgba') ? Number(bg.split(',')[3].replace(')', '')) : 1;
      if (bg !== 'transparent' && alpha > 0) {
        background = bg;
        break;
      }
    }
    return {
      element: el.outerHTML.slice(0, 120),
      style: style.outlineStyle,
      width: parseFloat(style.outlineWidth) || 0,
      colour: style.outlineColor,
      background,
    };
  });
  const visible = ring.style !== 'none' && ring.width > 0;
  return { ...ring, visible, contrast: visible ? contrastRatio(ring.colour, ring.background) : 0 };
}
