# AGENTS.md

Prairie Practice: a practice test app. React 19 + Vite, React Router, Redux Toolkit + redux-persist, Bootstrap 5 (`client/`). Express 5 API with `node:sqlite` (`server/`). All data is invented.

## Run, seed, test

- `npm run dev`: the API on port 3001 and the app on port 5173 (Vite proxies `/api`).
- `npm run seed`: makes the database again from `server/data/seed/*.json`.
- Accounts: `student1` / `practice1` (has results), `student2` / `practice2` (supports on), `student3` / `practice3` (new).
- `npm test`: the app tests in `tests/app` (Vitest, then Playwright). They must pass.
- `npm run lint`: ESLint.

## Rules

- Run `npm test` before you say a change is done. Show the output.
- Do not skip, delete or change a test to make it pass. Change the app.
- If a snapshot in `tests/app` changes because of a fix, show the diff, then update it with `npx vitest run --project=app -u`.
- One bug or feature for each change. Keep the change small.
- Accessibility target: WCAG 2.1 AA.

## Conventions

- All API calls go through `client/src/api.js` (`get`, `post`, `update`, `remove`) to same-origin `/api`.
- State is in Redux Toolkit slices in `client/src/store/`. redux-persist keeps the `auth` and `test` slices in localStorage.
- Pages are in `client/src/pages/`, shared parts in `client/src/components/`. Use Bootstrap classes first; own styles go in `client/src/styles/app.css`.
- API routes are in `server/src/routes/`, one file for each area. Errors are JSON: `{ "error": "..." }`.
- Component tests render the whole app with the real API on an in-memory database: see `tests/support/harness.jsx`.
