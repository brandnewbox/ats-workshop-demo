import { createApp } from './app.js';
import { openDatabase } from './db.js';

const port = Number(process.env.API_PORT || 3001);
const db = openDatabase();

const app = createApp({
  db,
  sessionSecret: process.env.SESSION_SECRET,
  adminExportToken: process.env.ADMIN_EXPORT_TOKEN,
  production: process.env.NODE_ENV === 'production',
});

app.listen(port, () => {
  console.log(`API on http://localhost:${port}/api`);
});
