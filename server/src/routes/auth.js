import { Router } from 'express';
import { SESSION_COOKIE, requireStudent } from '../session.js';
import { checkPassword } from '../passwords.js';

export function toUser(row) {
  return { id: row.id, username: row.username, firstName: row.first_name, lastName: row.last_name };
}

export function authRoutes() {
  const router = Router();

  router.post('/login', (req, res) => {
    const { username = '', password = '' } = req.body ?? {};
    if (!username.trim() || !password) {
      return res.status(400).json({ error: 'Username and Password are required' });
    }
    const row = req.app.locals.db.prepare('SELECT * FROM students WHERE username = ?').get(username.trim());
    if (!row || !checkPassword(password, row.password_hash)) {
      return res.status(401).json({ error: 'The username or password is not correct.' });
    }
    res.cookie(SESSION_COOKIE, String(row.id), {
      httpOnly: true,
      signed: true,
      sameSite: 'lax',
      secure: req.app.locals.production,
    });
    res.json({ user: toUser(row) });
  });

  router.post('/logout', (req, res) => {
    res.clearCookie(SESSION_COOKIE);
    res.json({ ok: true });
  });

  router.get('/me', requireStudent, (req, res) => {
    res.json({ user: toUser(req.student) });
  });

  return router;
}
