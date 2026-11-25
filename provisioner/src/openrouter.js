// The OpenRouter management API (https://openrouter.ai/docs/guides/overview/auth/management-api-keys).
// The management key goes only in the Authorization header of these calls. It is never logged or returned.
import { UpstreamError } from './github.js';

const API = 'https://openrouter.ai/api/v1';

async function call(managementKey, method, path, body) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${managementKey}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new UpstreamError(`OpenRouter ${method} /keys`, response.status);
  return response.status === 204 ? null : response.json();
}

// POST /api/v1/keys. Returns { key, hash }. The plaintext key is in this response only.
export async function createKey(managementKey, { name, limit, expiresAt }) {
  const body = { name, limit };
  if (expiresAt) body.expires_at = expiresAt;
  const result = await call(managementKey, 'POST', '/keys', body);
  if (!result?.key || !result?.data?.hash) throw new UpstreamError('OpenRouter POST /keys (no key in the answer)', 502);
  return { key: result.key, hash: result.data.hash };
}

// GET /api/v1/keys, all pages (100 keys a page).
export async function listKeys(managementKey) {
  const keys = [];
  for (let offset = 0; ; offset += 100) {
    const page = (await call(managementKey, 'GET', `/keys?offset=${offset}`)).data ?? [];
    keys.push(...page);
    if (page.length < 100) return keys;
  }
}

// DELETE /api/v1/keys/{hash}
export async function deleteKey(managementKey, hash) {
  await call(managementKey, 'DELETE', `/keys/${hash}`);
}
