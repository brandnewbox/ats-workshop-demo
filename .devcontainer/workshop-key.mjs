// `npm run workshop-key`: gets this Codespace's OpenRouter key from the workshop key service (provisioner/).
//
// It asks for the event code (not needed if this GitHub account has a key already, for example after a
// rebuild), saves the key in ~/.config/ats-workshop/openrouter.env, and adds one line to ~/.bashrc and
// ~/.zshrc so that new terminals have OPENROUTER_API_KEY. opencode reads that variable.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

const DIR = join(homedir(), '.config', 'ats-workshop');
const KEY_FILE = join(DIR, 'openrouter.env');
const NEW_TERMINAL = 'Open a new terminal (the + in the terminal panel), then type:  opencode';
const AGAIN = 'To try again, type:  npm run workshop-key';

const say = (...lines) => console.log(['', ...lines.map((l) => `  ${l}`), ''].join('\n'));

function saveKey(key) {
  mkdirSync(DIR, { recursive: true, mode: 0o700 });
  writeFileSync(KEY_FILE, `export OPENROUTER_API_KEY='${key.replaceAll("'", '')}'\n`, { mode: 0o600 });
  const line = `[ -z "$OPENROUTER_API_KEY" ] && [ -f "${KEY_FILE}" ] && . "${KEY_FILE}"`;
  for (const rc of ['.bashrc', '.zshrc']) {
    const path = join(homedir(), rc);
    const text = existsSync(path) ? readFileSync(path, 'utf8') : '';
    if (!text.includes(KEY_FILE)) appendFileSync(path, `\n# ATS workshop: the OpenRouter key from npm run workshop-key\n${line}\n`);
  }
}

async function requestKey(code) {
  const url = process.env.WORKSHOP_KEY_URL;
  if (!url) return { error: 'the key service address (WORKSHOP_KEY_URL) is not set. Rebuild the Codespace, or ask Will.' };
  if (!process.env.GITHUB_TOKEN) return { error: 'this Codespace has no GITHUB_TOKEN. Ask Will.' };
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(new URL('/key', url), {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(code ? { code } : {}),
        signal: AbortSignal.timeout(20_000),
      });
      const body = await response.json().catch(() => ({}));
      if (response.status < 500 || attempt === 3) return { status: response.status, ...body };
    } catch (error) {
      if (attempt === 3) return { error: `cannot reach the key service (${error.name}).` };
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
  }
}

function done(result) {
  saveKey(result.key);
  say(`✓ Workshop key ready (${result.name}, $${result.limit} limit).`, NEW_TERMINAL);
  process.exit(0);
}

if (process.env.OPENROUTER_API_KEY) {
  say('✓ This terminal has a key already (OPENROUTER_API_KEY). Type:  opencode');
  process.exit(0);
}

// A GitHub account that has a key already (for example after a rebuild) gets it with no event code.
const first = await requestKey(null);
if (first.key) done(first);
if (!first.needCode) {
  say(`✗ No key: ${first.error ?? `the key service answered ${first.status}.`}`, AGAIN, 'If it still fails, ask Will.');
  process.exit(1);
}

const lines = createInterface({ input: process.stdin, terminal: false })[Symbol.asyncIterator]();
say('Type the event code that Will gives you, then press Enter.');
for (let tries = 1; tries <= 3; tries++) {
  process.stdout.write('  Event code: ');
  const next = await lines.next();
  const code = next.done ? '' : next.value.trim();
  if (!code) break;
  const result = await requestKey(code);
  if (result.key) done(result);
  say(`✗ ${result.error ?? 'No key.'}`);
  if (result.status !== 403) break;
}
say(AGAIN, 'If it still fails, ask Will.');
process.exit(1);
