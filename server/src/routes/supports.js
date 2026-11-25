import { Router } from 'express';
import { requireStudent } from '../session.js';
import { findSupports, saveSupports } from '../supports.js';

export function supportRoutes() {
  const router = Router();

  router.get('/supports', requireStudent, (req, res) => {
    res.json(findSupports(req.app.locals.db, req.student.id));
  });

  router.put('/supports', requireStudent, (req, res) => {
    res.json(saveSupports(req.app.locals.db, req.student.id, req.body ?? {}));
  });

  return router;
}
