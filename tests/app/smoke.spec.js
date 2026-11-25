import { expect, test } from '@playwright/test';
import { openQuestion, signIn, startAttempt } from '../support/e2e.js';

test('a student signs in, opens a practice test and answers a question', async ({ page }) => {
  await signIn(page, 'student3');
  await expect(page.getByText('Welcome back, Alex')).toBeVisible();

  await page.goto('/practice');
  await expect(page.getByText('Grade 8 Math Practice')).toBeVisible();

  const attemptId = await startAttempt(page, 4);
  await page.goto(`/test/${attemptId}/directions`);
  await page.getByRole('button', { name: /Begin/ }).click();
  await openQuestion(page, attemptId, 1);
  await expect(page.getByText('Question 1 of 8')).toBeVisible();
  await page.getByRole('radio').nth(1).check();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Question 2 of 8')).toBeVisible();
});

test('the results page shows the history and the chart', async ({ page }) => {
  await signIn(page, 'student1');
  await page.goto('/results/2');
  await expect(page.getByText(/Score: 7 of 10/)).toBeVisible();
  const chart = page.locator('img[src$="chart.png"]');
  await expect(chart).toBeVisible();
  expect(await chart.evaluate((img) => img.naturalWidth)).toBe(240);
});
