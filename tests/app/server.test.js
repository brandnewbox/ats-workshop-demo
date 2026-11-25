// @vitest-environment node
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../server/src/app.js';
import { openDatabase } from '../../server/src/db.js';
import { scorePercent } from '../../server/src/score.js';
import { seed } from '../../server/src/seed.js';
import { PASSWORDS, TESTS } from '../support/fixtures.js';

let db;
let app;

beforeEach(() => {
  db = openDatabase(':memory:');
  seed(db);
  app = createApp({ db, sessionSecret: 'test-session-secret', adminExportToken: 'test-admin-token' });
});

async function agentFor(username) {
  const agent = request.agent(app);
  await agent.post('/api/login').send({ username, password: PASSWORDS[username] }).expect(200);
  return agent;
}

describe('sign-in', () => {
  it('needs a username and a password', async () => {
    const res = await request(app).post('/api/login').send({ username: '', password: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Username and Password are required');
  });

  it('refuses a wrong password', async () => {
    const res = await request(app).post('/api/login').send({ username: 'student1', password: 'nope' });
    expect(res.status).toBe(401);
  });

  it('signs in with an httpOnly session cookie, and signs out', async () => {
    const agent = request.agent(app);
    const res = await agent.post('/api/login').send({ username: 'student1', password: 'practice1' });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ username: 'student1', firstName: 'Sam' });
    expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/);
    await agent.get('/api/me').expect(200);
    await agent.post('/api/logout').expect(200);
    await agent.get('/api/me').expect(401);
  });

  it('refuses API calls with no session', async () => {
    await request(app).get('/api/tests').expect(401);
  });
});

describe('practice tests', () => {
  it('lists the 8 seeded tests with their question counts', async () => {
    const agent = await agentFor('student1');
    const res = await agent.get('/api/tests').expect(200);
    expect(res.body).toHaveLength(8);
    const math8 = res.body.find((t) => t.id === TESTS.math8);
    expect(math8).toMatchObject({ title: 'Grade 8 Math Practice', questionCount: 8, calculator: true });
  });

  it('runs an attempt: start, answer, submit', async () => {
    const agent = await agentFor('student3');
    const start = await agent.post(`/api/tests/${TESTS.math6}/attempts`).expect(201);
    const attempt = (await agent.get(`/api/attempts/${start.body.id}`).expect(200)).body;
    expect(attempt.questions).toHaveLength(8);
    expect(attempt.questions[0]).not.toHaveProperty('answer');
    expect(attempt.timeLeft).toBeGreaterThan(0);

    // Question 1: "$7.50" (index 2) is correct. Question 2: index 0 is wrong.
    await agent.put(`/api/attempts/${attempt.id}/responses/${attempt.questions[0].id}`).send({ choice: 2 }).expect(200);
    await agent
      .put(`/api/attempts/${attempt.id}/responses/${attempt.questions[1].id}`)
      .send({ choice: 0, flagged: true })
      .expect(200);
    const saved = (await agent.get(`/api/attempts/${attempt.id}`)).body;
    expect(saved.responses).toEqual({ [attempt.questions[0].id]: 2, [attempt.questions[1].id]: 0 });
    expect(saved.flags).toEqual({ [attempt.questions[1].id]: true });

    const submit = await agent.post(`/api/attempts/${attempt.id}/submit`).expect(200);
    expect(submit.body).toMatchObject({ correct: 1, total: 8 });
    await agent.post(`/api/attempts/${attempt.id}/submit`).expect(409);
    await agent.post(`/api/attempts/${attempt.id}/survey`).send({ difficulty: 'easy' }).expect(200);
  });

  it("does not show one student's attempt to another", async () => {
    const agent = await agentFor('student3');
    await agent.get('/api/attempts/4').expect(404);
  });
});

describe('results', () => {
  it("lists student1's three submitted attempts", async () => {
    const agent = await agentFor('student1');
    const res = await agent.get('/api/results').expect(200);
    expect(res.body.map((r) => r.title).sort()).toEqual([
      'Grade 10 ELA Practice',
      'Grade 10 Social Studies Practice',
      'Grade 4 Science Practice',
    ]);
    expect(res.body.find((r) => r.id === 2)).toMatchObject({ correct: 7, total: 10, percent: 70, date: '10/2/2026' });
  });

  it('gives each question of one attempt, and a chart', async () => {
    const agent = await agentFor('student1');
    const res = await agent.get('/api/results/1').expect(200);
    expect(res.body.questions).toHaveLength(6);
    expect(res.body.questions.filter((q) => q.correct)).toHaveLength(4);
    expect(res.body.questions[3]).toMatchObject({ number: 4, flagged: true, correct: false });
    const chart = await agent.get('/api/results/1/chart.png').expect(200);
    expect(chart.headers['content-type']).toBe('image/png');
    expect(chart.body.subarray(1, 4).toString()).toBe('PNG');
  });

  it('has no results for student3', async () => {
    const agent = await agentFor('student3');
    expect((await agent.get('/api/results')).body).toEqual([]);
  });

  it('scores whole percents', () => {
    expect(scorePercent(7, 10)).toBe(70);
    expect(scorePercent(1, 2)).toBe(50);
    expect(scorePercent(0, 0)).toBe(0);
  });
});

describe('supports', () => {
  it("gives and saves student1's supports", async () => {
    const agent = await agentFor('student1');
    const before = (await agent.get('/api/supports')).body;
    expect(before).toMatchObject({ readAloud: false, readingColour: 'default', fontSize: 'normal' });
    const res = await agent.put('/api/supports').send({ ...before, magnifier: true, fontSize: 'large' }).expect(200);
    expect(res.body).toMatchObject({ magnifier: true, fontSize: 'large' });
  });

  it("has student2's supports on", async () => {
    const agent = await agentFor('student2');
    expect((await agent.get('/api/supports')).body).toMatchObject({
      readAloud: true,
      extraTime: true,
      highContrast: true,
    });
  });
});

describe('admin export', () => {
  it('needs the admin token', async () => {
    await request(app).get('/api/admin/export').expect(403);
    const res = await request(app).get('/api/admin/export').set('x-admin-token', 'test-admin-token').expect(200);
    expect(res.text.split('\n')[0]).toBe('username,test,submitted_at');
  });
});
