// Finds the GitHub login of the person who owns a token (the Codespace's GITHUB_TOKEN).
// The token is used for this one call only. It is not stored or logged.

export async function githubLogin(token) {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'ats-workshop-keys',
    },
  });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new UpstreamError('GitHub', response.status);
  const user = await response.json();
  return typeof user.login === 'string' ? user.login.toLowerCase() : null;
}

export class UpstreamError extends Error {
  constructor(service, status) {
    super(`${service} answered ${status}`);
    this.service = service;
    this.status = status;
  }
}
