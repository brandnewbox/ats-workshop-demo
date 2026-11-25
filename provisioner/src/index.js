// ats-workshop-keys: a Cloudflare Worker that gives each workshop Codespace its own OpenRouter key.
//
//   POST   /key          Authorization: Bearer <the Codespace's GITHUB_TOKEN>, body { "code": "<event code>" }
//                        -> { key, name, limit, created }. A login that has a key gets it again with no code.
//   GET    /admin/keys   Authorization: Bearer <ADMIN_TOKEN>  -> the workshop keys and their usage (no key values)
//   DELETE /admin/keys?confirm=delete-all-workshop-keys        -> deletes every workshop key (after the workshop)
//   GET    /health
//
// Secrets (wrangler secret put): OPENROUTER_MANAGEMENT_KEY, ADMIN_TOKEN, EVENT_CODE.
// Vars (wrangler.toml): KEY_LIMIT_USD, KEY_EXPIRES_AT, KEY_NAME_PREFIX, MAX_KEYS, RATE_LIMIT_PER_HOUR,
//   WRONG_CODE_LIMIT_PER_HOUR.
// KV (binding KEYS): key:<login> -> { key, hash, name, limit, createdAt };
//   rate:<login>:<hour>, wrong:login:<login>:<hour>, wrong:ip:<ip>:<hour> -> counts.
import { githubLogin, UpstreamError } from './github.js';
import { createKey, deleteKey, listKeys } from './openrouter.js';

export const DELETE_CONFIRMATION = 'delete-all-workshop-keys';

const json = (status, body) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

function bearer(request) {
  const match = /^Bearer\s+(\S+)$/i.exec(request.headers.get('Authorization') ?? '');
  return match ? match[1] : null;
}

// Case and spaces do not matter: "Prairie 2026" = "prairie2026".
const normalizeCode = (code) => String(code ?? '').toLowerCase().replace(/\s+/g, '');

function settings(env) {
  return {
    prefix: env.KEY_NAME_PREFIX || 'ats-workshop-',
    limit: Number(env.KEY_LIMIT_USD || 5),
    expiresAt: env.KEY_EXPIRES_AT || null,
    maxKeys: Number(env.MAX_KEYS || 45),
    ratePerHour: Number(env.RATE_LIMIT_PER_HOUR || 10),
    wrongCodesPerHour: Number(env.WRONG_CODE_LIMIT_PER_HOUR || 5),
  };
}

// KV counters for the current hour. KV is not atomic, so these are soft limits.
const hourName = (prefix) => `${prefix}:${Math.floor(Date.now() / 3_600_000)}`;
const readCount = async (env, name) => Number((await env.KEYS.get(hourName(name))) ?? 0);
async function addCount(env, name) {
  const count = (await readCount(env, name)) + 1;
  await env.KEYS.put(hourName(name), String(count), { expirationTtl: 7200 });
  return count;
}

async function countKeys(env) {
  let count = 0;
  let cursor;
  do {
    const page = await env.KEYS.list({ prefix: 'key:', cursor });
    count += page.keys.length;
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return count;
}

async function handleKey(request, env) {
  if (!env.OPENROUTER_MANAGEMENT_KEY || !env.EVENT_CODE) {
    return json(503, { error: 'The key service is not set up yet. Ask Will.' });
  }
  const token = bearer(request);
  if (!token) return json(401, { error: 'Send your GitHub token: Authorization: Bearer $GITHUB_TOKEN' });

  const login = await githubLogin(token);
  if (!login || !/^[a-z0-9-]{1,39}$/.test(login)) return json(401, { error: 'GitHub did not accept this token.' });

  const config = settings(env);
  if ((await addCount(env, `rate:${login}`)) > config.ratePerHour) {
    return json(429, { error: 'Too many requests. Wait an hour, or ask Will.', login });
  }

  // A rebuild: this login has a key already. No event code is needed.
  const stored = await env.KEYS.get(`key:${login}`, 'json');
  if (stored) {
    return json(200, { key: stored.key, name: stored.name, limit: stored.limit, login, created: false });
  }

  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const wrongByLogin = `wrong:login:${login}`;
  const wrongByIp = `wrong:ip:${ip}`;
  const tooManyWrong = async () =>
    (await readCount(env, wrongByLogin)) >= config.wrongCodesPerHour ||
    (await readCount(env, wrongByIp)) >= config.wrongCodesPerHour;

  const body = await request.json().catch(() => ({}));
  const code = normalizeCode(body?.code);
  if (!code) return json(400, { error: 'Type the event code that Will gives you.', needCode: true, login });
  if (await tooManyWrong()) {
    return json(429, { error: 'Too many wrong event codes. Wait an hour, or ask Will.', login });
  }
  if (code !== normalizeCode(env.EVENT_CODE)) {
    await addCount(env, wrongByLogin);
    await addCount(env, wrongByIp);
    return json(403, { error: 'That event code is not correct. Check it, and try again.', needCode: true, login });
  }

  if ((await countKeys(env)) >= config.maxKeys) {
    return json(409, { error: 'All workshop keys are given out. Ask Will for a key.', login });
  }

  const name = `${config.prefix}${login}`;
  // A key with this name but not in KV has no value that we can give back: delete it, so each login has one key.
  for (const orphan of (await listKeys(env.OPENROUTER_MANAGEMENT_KEY)).filter((k) => k.name === name)) {
    await deleteKey(env.OPENROUTER_MANAGEMENT_KEY, orphan.hash);
  }
  const { key, hash } = await createKey(env.OPENROUTER_MANAGEMENT_KEY, {
    name,
    limit: config.limit,
    expiresAt: config.expiresAt,
  });
  const record = { key, hash, name, limit: config.limit, createdAt: new Date().toISOString() };
  await env.KEYS.put(`key:${login}`, JSON.stringify(record));
  console.log(`created ${name}`);
  return json(201, { key, name, limit: config.limit, login, created: true });
}

// Constant-time comparison of the admin token.
async function isAdmin(request, env) {
  const token = bearer(request);
  if (!env.ADMIN_TOKEN || !token) return false;
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(token)),
    crypto.subtle.digest('SHA-256', encoder.encode(env.ADMIN_TOKEN)),
  ]);
  return crypto.subtle.timingSafeEqual(a, b);
}

async function workshopKeys(env) {
  const { prefix } = settings(env);
  return (await listKeys(env.OPENROUTER_MANAGEMENT_KEY)).filter((k) => k.name?.startsWith(prefix));
}

async function handleAdminList(env) {
  const { prefix } = settings(env);
  const keys = (await workshopKeys(env)).map((k) => ({
    name: k.name,
    login: k.name.slice(prefix.length),
    hash: k.hash,
    limit: k.limit,
    usage: k.usage,
    limit_remaining: k.limit_remaining,
    disabled: k.disabled,
    expires_at: k.expires_at,
    created_at: k.created_at,
  }));
  const usage = keys.reduce((sum, k) => sum + Number(k.usage ?? 0), 0);
  return json(200, { count: keys.length, total_usage: Math.round(usage * 10000) / 10000, keys });
}

async function handleAdminDelete(request, env) {
  if (new URL(request.url).searchParams.get('confirm') !== DELETE_CONFIRMATION) {
    return json(400, { error: `Add ?confirm=${DELETE_CONFIRMATION} to delete every workshop key.` });
  }
  const deleted = [];
  for (const k of await workshopKeys(env)) {
    await deleteKey(env.OPENROUTER_MANAGEMENT_KEY, k.hash);
    deleted.push(k.name);
  }
  let cursor;
  do {
    const page = await env.KEYS.list({ prefix: 'key:', cursor });
    await Promise.all(page.keys.map(({ name }) => env.KEYS.delete(name)));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  console.log(`deleted ${deleted.length} workshop keys`);
  return json(200, { deleted: deleted.length, names: deleted });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    try {
      if (pathname === '/health' && request.method === 'GET') return json(200, { ok: true });
      if (pathname === '/key' && request.method === 'POST') return await handleKey(request, env);
      if (pathname === '/admin/keys') {
        if (!(await isAdmin(request, env))) return json(401, { error: 'Admin token needed.' });
        if (request.method === 'GET') return await handleAdminList(env);
        if (request.method === 'DELETE') return await handleAdminDelete(request, env);
      }
      return json(404, { error: 'Not found' });
    } catch (error) {
      if (error instanceof UpstreamError) {
        console.error(error.message); // service and status only, never a key or a token
        return json(502, { error: `${error.service} is not available now. Try again in a minute, or ask Will.` });
      }
      console.error('unexpected error', error?.name);
      return json(500, { error: 'Something went wrong in the key service. Ask Will.' });
    }
  },
};
