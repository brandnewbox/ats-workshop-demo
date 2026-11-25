import { Router } from 'express';
import { requireStudent } from '../session.js';

export function testRoutes() {
  const router = Router();

  router.get('/subjects', requireStudent, (req, res) => {
    res.json(req.app.locals.db.prepare('SELECT id, name FROM subjects ORDER BY id').all());
  });

  router.get('/tests', requireStudent, (req, res) => {
    const rows = req.app.locals.db
      .prepare(
        `SELECT t.id, t.title, t.grade, t.minutes, t.calculator, t.subject_id, s.name AS subject,
                (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) AS question_count
           FROM tests t JOIN subjects s ON s.id = t.subject_id
          ORDER BY t.grade, t.title`,
      )
      .all();
    res.json(
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        grade: r.grade,
        minutes: r.minutes,
        calculator: Boolean(r.calculator),
        subjectId: r.subject_id,
        subject: r.subject,
        questionCount: r.question_count,
      })),
    );
  });

  return router;
}
