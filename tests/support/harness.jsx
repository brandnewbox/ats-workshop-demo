// Test helpers: a real API (Express + in-memory SQLite, seeded) behind `fetch`, and the app in a MemoryRouter.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import request from 'supertest';
import { expect } from 'vitest';
import App from '../../client/src/App.jsx';
import { makeStore } from '../../client/src/store/index.js';
import { createApp } from '../../server/src/app.js';
import { openDatabase } from '../../server/src/db.js';
import { seed } from '../../server/src/seed.js';

export { PASSWORDS, TESTS } from './fixtures.js';
import { PASSWORDS, TESTS } from './fixtures.js';

// A fresh seeded database and API. `fetch` in the browser code goes to this API.
export function startApi() {
  const db = openDatabase(':memory:');
  seed(db);
  const app = createApp({ db, sessionSecret: 'test-session-secret', adminExportToken: 'test-admin-token' });
  const agent = request.agent(app);

  globalThis.fetch = async (url, init = {}) => {
    const method = (init.method ?? 'GET').toLowerCase();
    let req = agent[method](String(url));
    for (const [name, value] of Object.entries(init.headers ?? {})) req = req.set(name, value);
    if (init.body !== undefined) req = req.send(init.body);
    const res = await req;
    return new Response(res.text ?? '', {
      status: res.status,
      headers: { 'Content-Type': res.headers['content-type'] ?? 'application/json' },
    });
  };

  return { db, app, agent };
}

export async function signIn(agent, username) {
  const res = await agent.post('/api/login').send({ username, password: PASSWORDS[username] });
  if (res.status !== 200) throw new Error(`Sign-in failed for ${username}`);
  return res.body.user;
}

export async function startAttempt(agent, testId) {
  const res = await agent.post(`/api/tests/${testId}/attempts`);
  if (res.status !== 201) throw new Error(`Could not start test ${testId}`);
  return res.body.id;
}

export async function questionIds(agent, attemptId) {
  const res = await agent.get(`/api/attempts/${attemptId}`);
  return res.body.questions.map((q) => q.id);
}

// Saves an answer (and flag) through the API, as the Next button does.
export async function saveAnswer(agent, attemptId, number, choice, flagged = false) {
  const ids = await questionIds(agent, attemptId);
  await agent.put(`/api/attempts/${attemptId}/responses/${ids[number - 1]}`).send({ choice, flagged });
}

// Moves the attempt's start time so that the server reports `seconds` left.
export function setTimeLeft(db, attemptId, seconds) {
  const { minutes } = db.prepare('SELECT minutes FROM attempts WHERE id = ?').get(attemptId);
  const startedAt = new Date(Date.now() - (minutes * 60 - seconds) * 1000).toISOString();
  db.prepare('UPDATE attempts SET started_at = ? WHERE id = ?').run(startedAt, attemptId);
}

// The browser storage that redux-persist writes to, one for each test.
export function memoryStorage() {
  const items = new Map();
  return {
    items,
    getItem: async (key) => items.get(key) ?? null,
    setItem: async (key, value) => void items.set(key, value),
    removeItem: async (key) => void items.delete(key),
  };
}

// Waits for "Question n of total", and for the test screen to finish loading.
export async function findQuestion(n, total) {
  const label = await screen.findByText(`Question ${n} of ${total}`);
  await waitFor(() => expect(label.closest('[aria-busy]')).toHaveAttribute('aria-busy', 'false'));
  return label;
}

// Renders the whole app at `route`. With `as`, that student is signed in first.
// Pass `api` (from startApi) to use an API that the test has already set up.
// `state` adds to the Redux state at the start, for example a `test` slice.
export async function renderApp(route, { as = 'student1', api = startApi(), state = {}, userEventOptions } = {}) {
  const preloadedState = { ...state, ...(as ? { auth: { user: await signIn(api.agent, as) } } : {}) };
  const storage = memoryStorage();
  const { store, persistor } = makeStore(preloadedState, { storage });
  const user = userEvent.setup(userEventOptions);
  const view = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </Provider>,
  );
  return { ...api, ...view, store, persistor, storage, user };
}

// Starts a new attempt of `testId` for `as`, runs `before(api, attemptId)`, then renders `pathFor(attemptId)`.
export async function renderAttempt(pathFor, { as = 'student3', testId = TESTS.math6, before, userEventOptions } = {}) {
  const api = startApi();
  await signIn(api.agent, as);
  const attemptId = await startAttempt(api.agent, testId);
  if (before) await before(api, attemptId);
  const view = await renderApp(pathFor(attemptId), { as, api, userEventOptions });
  return { ...view, attemptId };
}
