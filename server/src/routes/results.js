import { Router } from 'express';
import { requireStudent } from '../session.js';
import { resultChartPng } from '../chart.js';
import { countCorrect, scorePercent } from '../score.js';

// "10/14/2026", the date format that the results screens show.
export function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
}

function summary(db, attempt) {
  const total = db.prepare('SELECT COUNT(*) AS n FROM questions WHERE test_id = ?').get(attempt.test_id).n;
  const correct = countCorrect(db, attempt.id);
  return {
    id: attempt.id,
    title: attempt.title,
    date: formatDate(attempt.submitted_at),
    correct,
    total,
    percent: scorePercent(correct, total),
  };
}

function findSubmitted(req, res) {
  const attempt = req.app.locals.db
    .prepare(
      `SELECT a.*, t.title FROM attempts a JOIN tests t ON t.id = a.test_id
        WHERE a.id = ? AND a.student_id = ? AND a.submitted_at IS NOT NULL`,
    )
    .get(Number(req.params.attemptId), req.student.id);
  if (!attempt) res.status(404).json({ error: 'This result was not found.' });
  return attempt;
}

export function resultRoutes() {
  const router = Router();

  router.get('/results', requireStudent, (req, res) => {
    const db = req.app.locals.db;
    const attempts = db
      .prepare(
        `SELECT a.*, t.title FROM attempts a JOIN tests t ON t.id = a.test_id
          WHERE a.student_id = ? AND a.submitted_at IS NOT NULL`,
      )
      .all(req.student.id);
    const results = attempts.map((a) => summary(db, a));
    results.sort((a, b) => b.date.localeCompare(a.date));
    res.json(results);
  });

  router.get('/results/:attemptId', requireStudent, (req, res) => {
    const attempt = findSubmitted(req, res);
    if (!attempt) return;
    const db = req.app.locals.db;
    const questions = db
      .prepare(
        `SELECT q.number, q.stem, q.options, q.answer, r.choice, r.flagged
           FROM questions q LEFT JOIN responses r ON r.question_id = q.id AND r.attempt_id = ?
          WHERE q.test_id = ? ORDER BY q.number`,
      )
      .all(attempt.id, attempt.test_id)
      .map((q) => {
        const options = JSON.parse(q.options);
        return {
          number: q.number,
          stem: q.stem,
          yourAnswer: q.choice === null ? null : options[q.choice],
          correctAnswer: options[q.answer],
          correct: q.choice === q.answer,
          flagged: Boolean(q.flagged),
        };
      });
    res.json({ ...summary(db, attempt), questions });
  });

  router.get('/results/:attemptId/chart.png', requireStudent, (req, res) => {
    const attempt = findSubmitted(req, res);
    if (!attempt) return;
    const { correct, total } = summary(req.app.locals.db, attempt);
    res.type('png').send(resultChartPng(correct, total));
  });

  return router;
}
