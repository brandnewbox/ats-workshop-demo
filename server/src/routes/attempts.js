import { Router } from 'express';
import { requireStudent } from '../session.js';
import { countCorrect, scorePercent } from '../score.js';

export const SURVEY_ANSWERS = ['easy', 'just-right', 'hard', 'very-hard'];

// Seconds left on an attempt's timer.
export function timeLeft(attempt, now = Date.now()) {
  const elapsed = Math.floor((now - Date.parse(attempt.started_at)) / 1000);
  return Math.max(0, Math.round(attempt.minutes * 60) - elapsed);
}

function findAttempt(req, res) {
  const attempt = req.app.locals.db
    .prepare('SELECT * FROM attempts WHERE id = ? AND student_id = ?')
    .get(Number(req.params.attemptId), req.student.id);
  if (!attempt) res.status(404).json({ error: 'This test attempt was not found.' });
  return attempt;
}

export function attemptRoutes() {
  const router = Router();

  router.post('/tests/:testId/attempts', requireStudent, (req, res) => {
    const db = req.app.locals.db;
    const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(Number(req.params.testId));
    if (!test) return res.status(404).json({ error: 'This test was not found.' });

    const { lastInsertRowid } = db
      .prepare('INSERT INTO attempts (student_id, test_id, minutes, started_at) VALUES (?, ?, ?, ?)')
      .run(req.student.id, test.id, test.minutes, new Date().toISOString());
    res.status(201).json({ id: Number(lastInsertRowid), minutes: test.minutes });
  });

  router.get('/attempts/:attemptId', requireStudent, (req, res) => {
    const attempt = findAttempt(req, res);
    if (!attempt) return;
    const db = req.app.locals.db;
    const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(attempt.test_id);
    const questions = db
      .prepare('SELECT id, number, passage, stem, options FROM questions WHERE test_id = ? ORDER BY number')
      .all(attempt.test_id)
      .map((q) => ({ ...q, options: JSON.parse(q.options) }));
    const responses = {};
    const flags = {};
    for (const r of db.prepare('SELECT * FROM responses WHERE attempt_id = ?').all(attempt.id)) {
      if (r.choice !== null) responses[r.question_id] = r.choice;
      if (r.flagged) flags[r.question_id] = true;
    }
    res.json({
      id: attempt.id,
      testId: test.id,
      title: test.title,
      calculator: Boolean(test.calculator),
      minutes: attempt.minutes,
      timeLeft: timeLeft(attempt),
      submitted: Boolean(attempt.submitted_at),
      questions,
      responses,
      flags,
    });
  });

  router.put('/attempts/:attemptId/responses/:questionId', requireStudent, (req, res) => {
    const attempt = findAttempt(req, res);
    if (!attempt) return;
    if (attempt.submitted_at) return res.status(409).json({ error: 'This test is already submitted.' });
    const db = req.app.locals.db;
    const question = db
      .prepare('SELECT id FROM questions WHERE id = ? AND test_id = ?')
      .get(Number(req.params.questionId), attempt.test_id);
    if (!question) return res.status(404).json({ error: 'This question was not found.' });

    const { choice = null, flagged = false } = req.body ?? {};
    db.prepare(
      `INSERT INTO responses (attempt_id, question_id, choice, flagged) VALUES (?, ?, ?, ?)
       ON CONFLICT (attempt_id, question_id) DO UPDATE SET choice = excluded.choice, flagged = excluded.flagged`,
    ).run(attempt.id, question.id, choice, flagged ? 1 : 0);
    res.json({ questionId: question.id, choice, flagged: Boolean(flagged) });
  });

  router.post('/attempts/:attemptId/submit', requireStudent, (req, res) => {
    const attempt = findAttempt(req, res);
    if (!attempt) return;
    if (attempt.submitted_at) return res.status(409).json({ error: 'This test is already submitted.' });
    if (timeLeft(attempt) <= 0) {
      return res.status(409).json({ error: 'Time is over. Ask your teacher to reopen this test.' });
    }
    const db = req.app.locals.db;
    db.prepare('UPDATE attempts SET submitted_at = ? WHERE id = ?').run(new Date().toISOString(), attempt.id);
    const correct = countCorrect(db, attempt.id);
    const total = db.prepare('SELECT COUNT(*) AS n FROM questions WHERE test_id = ?').get(attempt.test_id).n;
    res.json({ id: attempt.id, correct, total, percent: scorePercent(correct, total) });
  });

  router.post('/attempts/:attemptId/survey', requireStudent, (req, res) => {
    const attempt = findAttempt(req, res);
    if (!attempt) return;
    const { difficulty } = req.body ?? {};
    if (!SURVEY_ANSWERS.includes(difficulty)) return res.status(400).json({ error: 'Choose an answer.' });
    req.app.locals.db.prepare('UPDATE attempts SET survey = ? WHERE id = ?').run(difficulty, attempt.id);
    res.json({ ok: true });
  });

  return router;
}
