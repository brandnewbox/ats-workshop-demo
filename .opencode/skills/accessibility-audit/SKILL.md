---
name: accessibility-audit
description: Audit pages of a web app for accessibility against WCAG 2.1 AA, with automated checks (axe-core) and checks by hand, and write a short report. Use when asked to audit, check or review a page or app for accessibility.
---

# Accessibility audit

## Goal

Find the accessibility problems that a real user meets on the pages in scope, and write them down so that a developer can fix them. Measure against **WCAG 2.1 AA**.

## Scope

- Audit only the pages that the request names. If it names none, take the login page and 2–3 main pages after login. Keep it small.
- For this repo: start the app with `npm run dev` (if it is not running) and use `http://localhost:5173`. The accounts are in `AGENTS.md`.

## Method

Do both parts. **Automated checks are not enough**: in an earlier audit, axe found only 2 of 25 issues. Toasts, focus, reflow, names and states need checks by hand.

1. **Automated:** run axe-core on each page with a real browser. In this repo:
   `node .opencode/skills/accessibility-audit/axe-check.mjs <path> [--as student1] [--width 1280]`
   It signs in, opens the page, and prints the axe violations (WCAG 2.0/2.1 A and AA rules).
2. **By hand**, with a real browser (Playwright), for each page:
   - **Keyboard only:** Tab through the page. Is the order logical? Is focus always visible, with a contrast of at least 3 : 1? Can you use every control with Enter and Space? Are there keyboard traps?
   - **Headings and landmarks:** one `h1` that is the visible title; no skipped levels; `main`, `nav` and `header` are there.
   - **Forms:** each field has a label that is connected to it; groups of radios have a group name; errors are next to the field, linked to it, and stay on the page (not only in a toast that closes); `autocomplete` is correct on personal fields.
   - **Names and states:** each button and link has a short name with no repeated words; toggle buttons, tabs and tools give their state (`aria-pressed`, `aria-checked`, `aria-selected`, `aria-expanded`).
   - **Images:** each informative image has alt text that says what it shows; decorative images have `alt=""`. Look out for placeholder alt text ("Media content", file names).
   - **Contrast:** text at least 4.5 : 1 (3 : 1 for large text); controls and focus rings at least 3 : 1.
   - **Zoom and reflow:** at 320 CSS px wide (or 400 % zoom) there is no sideways scroll, no content is lost, and the navigation can still be reached. Also check 200 % zoom.

## Rules (be gentle)

- Do not change the app's code during an audit. Report only.
- On a live app: no load and no scanning beyond the pages in scope. Do not submit answers, start or finish tests, or change data or settings. If a page would do that, stop and note it.
- Screenshots only if they show no personal data.
- Say what you checked and how. Do not guess: if you did not check something, write "not checked".

## Report

Write the report to `reports/accessibility-audit.md` (make the folder if it is not there). Use this format:

1. **Pages checked**, the browser and the window sizes.
2. **Findings**, one for each problem, most serious first:
   - Page
   - WCAG criterion (number and name, for example "1.4.10 Reflow")
   - Severity: high (blocks a task), medium (makes a task hard), low
   - What a user meets (one or two sentences, from the user's side)
   - How found: automated (axe rule ID) or by hand
3. **What automation missed:** the findings that only the checks by hand found.
4. **Not checked**, and open questions.

Then reply with a short summary: what you checked, the top 3 findings, and what is still open.
