import { Router } from 'express';

// CSV of all submitted attempts, for the school office. Needs the ADMIN_EXPORT_TOKEN.
export function adminRoutes({ token }) {
  const router = Router();

  router.get('/admin/export', (req, res) => {
    if (!token || req.get('x-admin-token') !== token) {
      return res.status(403).json({ error: 'Not allowed.' });
    }
    const rows = req.app.locals.db
      .prepare(
        `SELECT s.username, t.title, a.submitted_at FROM attempts a
           JOIN students s ON s.id = a.student_id JOIN tests t ON t.id = a.test_id
          WHERE a.submitted_at IS NOT NULL ORDER BY a.submitted_at`,
      )
      .all();
    const lines = ['username,test,submitted_at', ...rows.map((r) => `${r.username},"${r.title}",${r.submitted_at}`)];
    res.type('text/csv').send(lines.join('\n') + '\n');
  });

  return router;
}
