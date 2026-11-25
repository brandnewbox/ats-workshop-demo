import { env } from 'cloudflare:test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker, { DELETE_CONFIRMATION } from '../src/index.js';

const MANAGEMENT_KEY = env.OPENROUTER_MANAGEMENT_KEY;
const GITHUB_USERS = { 'token-alice': 'alice', 'token-bob': 'BOB', 'token-carol': 'carol', 'token-mallory': 'mallory' };
const CODE = ' prairie owl2026 '; // the secret is 'Prairie Owl 2026': case and spaces do not matter

// A fake GitHub /user and a fake OpenRouter key API, behind a mocked fetch.
let openrouter;
let calls;

function fakeFetch(input, init = {}) {
  const url = new URL(typeof input === 'string' ? input : input.url);
  const method = init.method ?? 'GET';
  const auth = new Headers(init.headers).get('Authorization');
  calls.push({ method, url: url.href, auth, body: init.body ? JSON.parse(init.body) : undefined });

  if (url.href === 'https://api.github.com/user') {
    const login = GITHUB_USERS[auth?.replace('Bearer ', '')];
    return login ? Response.json({ login, id: 1 }) : Response.json({ message: 'Bad credentials' }, { status: 401 });
  }
  if (url.origin === 'https://openrouter.ai' && url.pathname.startsWith('/api/v1/keys')) {
    if (auth !== `Bearer ${MANAGEMENT_KEY}`) return Response.json({ error: 'no' }, { status: 401 });
    if (openrouter.failWith) return Response.json({ error: 'down' }, { status: openrouter.failWith });
    if (method === 'GET') {
      const offset = Number(url.searchParams.get('offset') ?? 0);
      return Response.json({ data: openrouter.keys.slice(offset, offset + 100) });
    }
    if (method === 'POST') {
      const body = JSON.parse(init.body);
      const n = ++openrouter.created;
      const hash = n.toString(16).padStart(64, '0');
      openrouter.keys.push({ hash, name: body.name, limit: body.limit, usage: 0.25 * n, limit_remaining: body.limit - 0.25 * n, disabled: false, expires_at: body.expires_at });
      return Response.json({ key: `sk-or-v1-fake-${n}`, data: { hash, name: body.name } }, { status: 201 });
    }
    if (method === 'DELETE') {
      const hash = url.pathname.split('/').pop();
      openrouter.keys = openrouter.keys.filter((k) => k.hash !== hash);
      return Response.json({ deleted: true });
    }
  }
  throw new Error(`unexpected fetch ${method} ${url}`);
}

function postKey(token, { code = CODE, ip = '203.0.113.1', testEnv = env } = {}) {
  const headers = { 'CF-Connecting-IP': ip, 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const body = code === null ? undefined : JSON.stringify({ code });
  return worker.fetch(new Request('https://keys.example/key', { method: 'POST', headers, body }), testEnv);
}

const admin = (method, query = '', token = env.ADMIN_TOKEN) =>
  worker.fetch(new Request(`https://keys.example/admin/keys${query}`, { method, headers: { Authorization: `Bearer ${token}` } }), env);

const openrouterCalls = (method) => calls.filter((c) => c.url.startsWith('https://openrouter.ai') && c.method === method);

let logs;
beforeEach(async () => {
  // Start each test with an empty KV.
  for (const { name } of (await env.KEYS.list()).keys) await env.KEYS.delete(name);
  openrouter = { keys: [], created: 0, failWith: null };
  calls = [];
  logs = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(fakeFetch);
  for (const level of ['log', 'error', 'warn', 'info']) {
    vi.spyOn(console, level).mockImplementation((...args) => logs.push(args.map(String).join(' ')));
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /key', () => {
  it('needs a GitHub token', async () => {
    const res = await postKey(null);
    expect(res.status).toBe(401);
    expect(calls).toEqual([]);
  });

  it('refuses a token that GitHub does not accept', async () => {
    const res = await postKey('token-wrong');
    expect(res.status).toBe(401);
    expect(openrouterCalls('POST')).toEqual([]);
  });

  it('asks for the event code when there is none, and makes no key', async () => {
    const res = await postKey('token-alice', { code: null });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ needCode: true, login: 'alice' });
    expect(openrouterCalls('POST')).toEqual([]);
  });

  it('refuses a wrong event code with 403, and makes no key', async () => {
    const res = await postKey('token-alice', { code: 'prairie owl 2025' });
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ needCode: true, error: expect.stringMatching(/not correct/) });
    expect(openrouterCalls('POST')).toEqual([]);
  });

  it('makes one key, named after the login, with the credit limit and the expiry', async () => {
    const res = await postKey('token-alice');
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ key: 'sk-or-v1-fake-1', name: 'ats-workshop-alice', limit: 5, login: 'alice', created: true });

    const [create] = openrouterCalls('POST');
    expect(create.url).toBe('https://openrouter.ai/api/v1/keys');
    expect(create.auth).toBe(`Bearer ${MANAGEMENT_KEY}`);
    expect(create.body).toEqual({ name: 'ats-workshop-alice', limit: 5, expires_at: '2026-12-01T06:00:00Z' });
    // The GitHub call gets the GitHub token, not the management key.
    expect(calls.find((c) => c.url === 'https://api.github.com/user').auth).toBe('Bearer token-alice');
  });

  it('accepts the event code with other case and spaces', async () => {
    for (const code of ['PRAIRIE OWL 2026', 'prairieowl2026', ' Prairie  Owl\t2026 ']) {
      await env.KEYS.delete('key:alice');
      expect((await postKey('token-alice', { code })).status).toBe(201);
    }
  });

  it('gives back the same key on a rebuild, with no event code and no second key', async () => {
    await postKey('token-alice');
    const res = await postKey('token-alice', { code: null });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ key: 'sk-or-v1-fake-1', created: false });
    expect(openrouterCalls('POST')).toHaveLength(1);
    expect(openrouter.keys).toHaveLength(1);
  });

  it('uses the lower-case login in the key name', async () => {
    const res = await postKey('token-bob');
    expect((await res.json()).name).toBe('ats-workshop-bob');
  });

  it('uses the limit from KEY_LIMIT_USD', async () => {
    const res = await postKey('token-alice', { testEnv: { ...env, KEY_LIMIT_USD: '7.5' } });
    expect((await res.json()).limit).toBe(7.5);
    expect(openrouterCalls('POST')[0].body.limit).toBe(7.5);
  });

  it('stops at MAX_KEYS and tells the person to ask Will; people with a key still get it', async () => {
    const testEnv = { ...env, MAX_KEYS: '2' };
    expect((await postKey('token-alice', { testEnv })).status).toBe(201);
    expect((await postKey('token-bob', { testEnv })).status).toBe(201);
    const res = await postKey('token-carol', { testEnv });
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/Ask Will/);
    expect(openrouter.keys).toHaveLength(2);
    expect((await postKey('token-alice', { testEnv, code: null })).status).toBe(200);
  });

  it('limits wrong event codes for each login', async () => {
    for (let i = 0; i < 5; i++) {
      expect((await postKey('token-alice', { code: 'guess', ip: `198.51.100.${i}` })).status).toBe(403);
    }
    // Now even the right code is refused for this login, from any address.
    expect((await postKey('token-alice', { ip: '198.51.100.99' })).status).toBe(429);
    expect(openrouterCalls('POST')).toEqual([]);
    // Another login is not affected.
    expect((await postKey('token-bob', { ip: '198.51.100.100' })).status).toBe(201);
  });

  it('limits wrong event codes for each IP address', async () => {
    const ip = '192.0.2.7';
    const tokens = ['token-alice', 'token-bob', 'token-carol', 'token-alice', 'token-bob'];
    for (const token of tokens) expect((await postKey(token, { code: 'guess', ip })).status).toBe(403);
    expect((await postKey('token-carol', { ip })).status).toBe(429);
    expect((await postKey('token-carol', { ip: '192.0.2.8' })).status).toBe(201);
  });

  it('limits all requests of one login in an hour', async () => {
    const testEnv = { ...env, RATE_LIMIT_PER_HOUR: '3' };
    for (let i = 0; i < 3; i++) expect((await postKey('token-alice', { testEnv })).status).toBeLessThan(300);
    expect((await postKey('token-alice', { testEnv })).status).toBe(429);
    expect((await postKey('token-bob', { testEnv })).status).toBe(201);
  });

  it('deletes an old key with the same name that KV does not know, so each login has one key', async () => {
    openrouter.keys.push({ hash: 'f'.repeat(64), name: 'ats-workshop-alice', limit: 5, usage: 1 });
    openrouter.keys.push({ hash: 'e'.repeat(64), name: 'someone-else', limit: 50, usage: 0 });
    await postKey('token-alice');
    expect(openrouter.keys.map((k) => k.name).sort()).toEqual(['ats-workshop-alice', 'someone-else']);
    expect(openrouter.keys.find((k) => k.name === 'ats-workshop-alice').hash).not.toBe('f'.repeat(64));
  });

  it('answers 502 when OpenRouter fails, and does not leak the management key', async () => {
    openrouter.failWith = 500;
    const res = await postKey('token-alice');
    expect(res.status).toBe(502);
    expect(await res.text()).not.toContain(MANAGEMENT_KEY);
  });

  it('answers 503 when a secret is not set', async () => {
    expect((await postKey('token-alice', { testEnv: { ...env, OPENROUTER_MANAGEMENT_KEY: undefined } })).status).toBe(503);
    expect((await postKey('token-alice', { testEnv: { ...env, EVENT_CODE: undefined } })).status).toBe(503);
  });

  it('never logs or returns the management key, the event code or the GitHub token', async () => {
    const bodies = [];
    for (const [token, code] of [['token-alice', CODE], ['token-alice', null], ['token-mallory', 'guess'], ['token-wrong', CODE]]) {
      bodies.push(await (await postKey(token, { code })).text());
    }
    openrouter.failWith = 500;
    bodies.push(await (await postKey('token-bob')).text());
    bodies.push(await (await admin('GET')).text());
    const everything = [...bodies, ...logs].join('\n');
    expect(everything).not.toContain(MANAGEMENT_KEY);
    expect(everything).not.toContain('token-alice');
    expect(everything.toLowerCase()).not.toContain('prairie');
    expect(logs.join('\n')).not.toContain('sk-or-v1');
  });
});

describe('/admin/keys', () => {
  it('needs the admin token', async () => {
    expect((await admin('GET', '', 'wrong')).status).toBe(401);
    expect((await admin('DELETE', `?confirm=${DELETE_CONFIRMATION}`, 'token-alice')).status).toBe(401);
    expect((await admin('GET', '', env.OPENROUTER_MANAGEMENT_KEY)).status).toBe(401);
  });

  it('lists the workshop keys and their usage, without the key values', async () => {
    openrouter.keys.push({ hash: 'e'.repeat(64), name: 'someone-else', limit: 50, usage: 9 });
    await postKey('token-alice');
    await postKey('token-bob');
    const res = await admin('GET');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(2);
    expect(body.total_usage).toBe(0.75);
    expect(body.keys.map((k) => [k.login, k.limit, k.usage])).toEqual([
      ['alice', 5, 0.25],
      ['bob', 5, 0.5],
    ]);
    expect(JSON.stringify(body)).not.toContain('sk-or-v1');
  });

  it('deletes every workshop key only with the confirmation, and keeps other keys', async () => {
    openrouter.keys.push({ hash: 'e'.repeat(64), name: 'someone-else', limit: 50, usage: 9 });
    await postKey('token-alice');
    await postKey('token-bob');

    expect((await admin('DELETE')).status).toBe(400);
    expect(openrouter.keys).toHaveLength(3);

    const res = await admin('DELETE', `?confirm=${DELETE_CONFIRMATION}`);
    expect(await res.json()).toEqual({ deleted: 2, names: ['ats-workshop-alice', 'ats-workshop-bob'] });
    expect(openrouter.keys.map((k) => k.name)).toEqual(['someone-else']);
    expect(await env.KEYS.get('key:alice')).toBeNull();

    // After the delete, a new request makes a new key.
    expect((await postKey('token-alice')).status).toBe(201);
  });
});

it('answers /health', async () => {
  const res = await worker.fetch(new Request('https://keys.example/health'), env);
  expect(await res.json()).toEqual({ ok: true });
});
