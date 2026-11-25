# Workshop key service (`ats-workshop-keys`)

A Cloudflare Worker that gives each workshop Codespace its own OpenRouter key. All data in the sample app is invented; this service handles only OpenRouter keys and GitHub logins.

## How it works

1. In the Codespace, the person types `npm run workshop-key` (`.devcontainer/workshop-key.mjs`). Nothing runs it automatically.
2. It first asks the service with no code (a person who has a key gets it again). If a code is needed, it asks: "Event code:".
3. The script sends `POST /key` with `Authorization: Bearer $GITHUB_TOKEN` (the token that Codespaces gives each Codespace) and `{ "code": "<event code>" }`.
4. The Worker asks `https://api.github.com/user` for the login of that token. It does not keep or log the token.
5. If KV has a key for that login, the Worker gives back the same key, **with no event code** (a rebuild does not need the code and does not make a second key).
6. If not, the code must match the `EVENT_CODE` secret (case and spaces do not matter). A wrong code gets 403. After `WRONG_CODE_LIMIT_PER_HOUR` (default 5) wrong codes in an hour for one login, or from one IP address, the Worker answers 429.
7. When KV has `MAX_KEYS` keys (default 45), the Worker makes no more and answers 409: "All workshop keys are given out. Ask Will for a key."
8. Else it makes a key with OpenRouter `POST https://openrouter.ai/api/v1/keys`, body `{ "name": "ats-workshop-<login>", "limit": KEY_LIMIT_USD, "expires_at": KEY_EXPIRES_AT }`, and keeps `{ key, hash }` in KV.
9. The script saves the key in `~/.config/ats-workshop/openrouter.env` (mode 600) and adds one line to `~/.bashrc` and `~/.zshrc` that loads it, so new terminals have `OPENROUTER_API_KEY`; `opencode.json` reads `{env:OPENROUTER_API_KEY}`. A Codespaces secret `OPENROUTER_API_KEY`, if a person has one, wins.

Each login can call `/key` `RATE_LIMIT_PER_HOUR` times an hour (default 10). All limits are soft (KV is not atomic).

The OpenRouter management key and the event code are Worker secrets. The Worker never returns them and never logs them (the tests check this).

## Admin

Use the `ADMIN_TOKEN` secret:

```sh
URL=https://ats-workshop-keys.<your-subdomain>.workers.dev
# The workshop keys (names starting with KEY_NAME_PREFIX), their limits and usage. No key values.
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" $URL/admin/keys
# After the workshop: delete every key whose name starts with "ats-workshop-", and empty KV.
curl -s -X DELETE -H "Authorization: Bearer $ADMIN_TOKEN" "$URL/admin/keys?confirm=delete-all-workshop-keys"
```

The delete also removes keys made by `scripts/openrouter-keys` in ats-consult (they start with `ats-workshop-` too).

## Deploy (GitHub Actions)

`.github/workflows/deploy-key-service.yml` runs on each push to `main` that changes `provisioner/**` or the workflow, and from **Actions → Deploy key service → Run workflow**. It runs the tests, then deploys with `cloudflare/wrangler-action` from `provisioner/`. On each deploy, it sets the Worker secrets from the repo secrets. The job summary shows the `workers.dev` URL and the `/health` answer.

**KV:** there is no `kv namespace create` step. `wrangler.toml` has the `KEYS` binding with no id. On the first deploy, wrangler 4 creates the namespace `ats-workshop-keys-keys` (automatic resource provisioning; it does not ask in CI). Later deploys reuse the namespace of the deployed Worker.

Set up once:

1. **Cloudflare API token** (dash.cloudflare.com → My Profile → API Tokens → Create Custom Token), for the one account only:
   - Account · **Workers Scripts** · Edit (upload the Worker, its secrets, and turn on its workers.dev URL)
   - Account · **Workers KV Storage** · Edit (create and find the KV namespace)
   - Account · **Account Settings** · Read (read the account's workers.dev subdomain)
2. **Repo secrets** (GitHub → Settings → Secrets and variables → Actions):
   - `CLOUDFLARE_API_TOKEN`: the token from step 1.
   - `CLOUDFLARE_ACCOUNT_ID`: the account ID (Cloudflare dashboard, Workers overview). With it, the token needs no User permissions.
   - `OPENROUTER_MANAGEMENT_KEY`: the OpenRouter management key.
   - `EVENT_CODE`: the code for the room, for example `prairie owl 2026`.
   - `ADMIN_TOKEN`: a long random string, for example from `openssl rand -hex 32`.
3. Run the workflow (or push to `main`). Copy the URL from the job summary into `.devcontainer/devcontainer.json` (`containerEnv.WORKSHOP_KEY_URL`) and push.

To change the event code, change the repo secret and run the workflow again (people who have a key keep it). To change the limit, the expiry or `MAX_KEYS`, edit `[vars]` in `wrangler.toml` and push.

If the account has no workers.dev subdomain yet, open Workers & Pages in the Cloudflare dashboard once to choose one.

### Deploy by hand (if needed)

From `provisioner/`: `npm ci`, `npx wrangler login`, then `npx wrangler secret put` for `OPENROUTER_MANAGEMENT_KEY`, `EVENT_CODE` and `ADMIN_TOKEN`, then `npx wrangler deploy`. The KV namespace is made in the same way.

## If the service is down

`npm run workshop-key` says that there is no key, and what to do:

1. Try again: `npm run workshop-key`, then open a new terminal.
2. Will gives the person a key by hand (from `scripts/openrouter-keys create`, or the spare key). The person adds it as the Codespaces secret `OPENROUTER_API_KEY` for this repo and reloads the Codespace, or types `export OPENROUTER_API_KEY=<key>` in one terminal.

## Tests

```sh
npm test
```

The tests run in the Workers runtime (Miniflare, through `@cloudflare/vitest-plugin`) with a local KV. GitHub and OpenRouter are mocked.
