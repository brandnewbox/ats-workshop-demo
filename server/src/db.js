import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export const DEFAULT_DATABASE_PATH = 'server/data/prairie.db';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS tests (
    id INTEGER PRIMARY KEY,
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    grade INTEGER NOT NULL,
    title TEXT NOT NULL,
    minutes INTEGER NOT NULL,
    calculator INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES tests(id),
    number INTEGER NOT NULL,
    passage TEXT NOT NULL,
    stem TEXT NOT NULL,
    options TEXT NOT NULL,
    answer INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id),
    test_id INTEGER NOT NULL REFERENCES tests(id),
    minutes REAL NOT NULL,
    started_at TEXT NOT NULL,
    submitted_at TEXT,
    survey TEXT
  );
  CREATE TABLE IF NOT EXISTS responses (
    attempt_id INTEGER NOT NULL REFERENCES attempts(id),
    question_id INTEGER NOT NULL REFERENCES questions(id),
    choice INTEGER,
    flagged INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (attempt_id, question_id)
  );
  CREATE TABLE IF NOT EXISTS supports (
    student_id INTEGER PRIMARY KEY REFERENCES students(id),
    read_aloud INTEGER NOT NULL DEFAULT 0,
    magnifier INTEGER NOT NULL DEFAULT 0,
    extra_time INTEGER NOT NULL DEFAULT 0,
    high_contrast INTEGER NOT NULL DEFAULT 0,
    answer_masking INTEGER NOT NULL DEFAULT 0,
    line_reader INTEGER NOT NULL DEFAULT 0,
    reading_colour TEXT NOT NULL DEFAULT 'default',
    font_size TEXT NOT NULL DEFAULT 'normal',
    parent_email TEXT NOT NULL DEFAULT ''
  );
`;

// Opens the database and makes the tables. Use ':memory:' in tests.
export function openDatabase(path = process.env.DATABASE_PATH || DEFAULT_DATABASE_PATH) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  return db;
}
