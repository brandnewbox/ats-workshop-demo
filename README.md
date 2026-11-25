# Prairie Practice

A practice test app for the ATS AI workshop. A student signs in, sets their testing supports, picks a practice test, takes it, reviews it, and sees the score.

All the data is invented. The ELA passages are public domain (Aesop's fables, retold, and the Gettysburg Address).

## Start

In the Codespace everything is installed. In the terminal:

```
npm run dev
```

Then open the "Prairie Practice" port (5173). Sign in with one of these:

| Username | Password | What it has |
|---|---|---|
| `student1` | `practice1` | Three past results |
| `student2` | `practice2` | Supports on (read aloud, extra time, high contrast) and a test in progress |
| `student3` | `practice3` | No results yet |

To run it on your own computer: Node 24, then `npm ci`, `cp .env.example .env`, `npm run seed`, `npx playwright install chromium`, `npm run dev`.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | The API (port 3001) and the app (port 5173). Vite sends `/api` to the API. |
| `npm run seed` | Makes the database again from `server/data/seed/`. |
| `npm test` | The app tests (`tests/app`). They pass. |
| `npm run lint` | ESLint. |

## Get your key

Do this once in your Codespace. In the terminal, type:

```
npm run workshop-key
```

It asks for the **event code**. Type the code that Will gives you and press Enter. When it works, you see:

```
✓ Workshop key ready (ats-workshop-<your GitHub username>, $5 limit).
```

Then type `opencode` (in the same terminal). If you rebuild the Codespace, run `npm run workshop-key` again: you get the same key, with no code. If you see `✗`, read the message, try again, or ask Will.

## The agent

Type `opencode` in the terminal. It uses your workshop key (see "Get your key"). The default model is **DeepSeek V4.1 Flash** (`deepseek/deepseek-v4.1-flash-1017`). To change the model, type `/models` in opencode: **GLM 5.3**, **Claude Sonnet 5.5** (stronger, costs more), **Claude Haiku 5.5** (cheap), or the **Free Models Router** (costs nothing, but it is slow and changes the model at random). All models except the free router use money from your key. The project instructions for the agent are in [AGENTS.md](AGENTS.md). The accessibility audit skill is in `.opencode/skills/accessibility-audit/`.

## Stack

- **Front end** (`client/`): React 19, Vite, React Router, Redux Toolkit with redux-persist, Bootstrap 5 and Bootstrap Icons.
- **API** (`server/`): Node 24, Express 5, `node:sqlite`. Sign-in is a signed, httpOnly session cookie.
- **Tests** (`tests/`): Vitest and Testing Library (jsdom), with the real API on an in-memory database; Playwright with axe-core for layout, focus and contrast.
