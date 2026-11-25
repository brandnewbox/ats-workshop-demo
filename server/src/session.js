export const SESSION_COOKIE = 'pp_session';

// Sends 401 when there is no signed session cookie.
export function requireStudent(req, res, next) {
  const id = Number(req.signedCookies[SESSION_COOKIE]);
  if (!id) return res.status(401).json({ error: 'Please sign in.' });
  const student = req.app.locals.db
    .prepare('SELECT id, username, first_name, last_name FROM students WHERE id = ?')
    .get(id);
  if (!student) return res.status(401).json({ error: 'Please sign in.' });
  req.student = student;
  next();
}
