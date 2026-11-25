import express from 'express';
import cookieParser from 'cookie-parser';
import { authRoutes } from './routes/auth.js';
import { testRoutes } from './routes/tests.js';
import { attemptRoutes } from './routes/attempts.js';
import { resultRoutes } from './routes/results.js';
import { supportRoutes } from './routes/supports.js';
import { adminRoutes } from './routes/admin.js';


// Builds the Express app. Tests call this with an in-memory database.
export function createApp({ db, sessionSecret, adminExportToken, production = false }) {
  if (!sessionSecret) throw new Error('SESSION_SECRET is not set. Copy .env.example to .env.');

  const app = express();
  app.locals.db = db;
  app.locals.production = production;

  app.use(express.json());
  app.use(cookieParser(sessionSecret));

  const api = express.Router();
  api.use(authRoutes());
  api.use(testRoutes());
  api.use(attemptRoutes());
  api.use(resultRoutes());
  api.use(supportRoutes());
  api.use(adminRoutes({ token: adminExportToken }));
  api.use((req, res) => res.status(404).json({ error: 'Not found' }));
  app.use('/api', api);

  // Express 5 sends errors from async handlers here.
  app.use((err, req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  });

  return app;
}
