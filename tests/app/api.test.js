import { describe, expect, it } from 'vitest';
import { ApiError, get, post } from '../../client/src/api.js';
import { startApi } from '../support/harness.jsx';

describe('api.js', () => {
  it('returns the JSON body', async () => {
    startApi();
    const { user } = await post('/login', { username: 'student2', password: 'practice2' });
    expect(user.firstName).toBe('Jordan');
    expect(await get('/me')).toEqual({ user });
  });

  it('throws an ApiError with the status and the message', async () => {
    startApi();
    const error = await get('/tests').catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(error.message).toBe('Please sign in.');
  });
});
