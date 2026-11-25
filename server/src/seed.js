import { readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase, DEFAULT_DATABASE_PATH } from './db.js';
import { hashPassword } from './passwords.js';

const SEED_DIR = join(dirname(fileURLToPath(import.meta.url)), '../data/seed');

function load(name) {
  return JSON.parse(readFileSync(join(SEED_DIR, name), 'utf8'));
}

// Fills an empty database with the invented data in server/data/seed/.
export function seed(db, { now = new Date() } = {}) {
  const passages = load('passages.json');

  const insertStudent = db.prepare(
    'INSERT INTO students (id, username, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
  );
  for (const s of load('students.json')) {
    insertStudent.run(s.id, s.username, hashPassword(s.password), s.firstName, s.lastName);
  }

  const insertSubject = db.prepare('INSERT INTO subjects (id, name) VALUES (?, ?)');
  for (const s of load('subjects.json')) insertSubject.run(s.id, s.name);

  const insertTest = db.prepare(
    'INSERT INTO tests (id, subject_id, grade, title, minutes, calculator) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const insertQuestion = db.prepare(
    'INSERT INTO questions (test_id, number, passage, stem, options, answer) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const tests = load('tests.json');
  for (const t of tests) {
    insertTest.run(t.id, t.subjectId, t.grade, t.title, t.minutes, t.calculator ? 1 : 0);
    t.questions.forEach((q, i) => {
      const passage = typeof q.passage === 'string' ? q.passage : passages[q.passage.ref];
      insertQuestion.run(t.id, i + 1, passage, q.stem, JSON.stringify(q.options), q.answer);
    });
  }

  const insertAttempt = db.prepare(
    'INSERT INTO attempts (id, student_id, test_id, minutes, started_at, submitted_at, survey) VALUES (?, ?, ?, ?, ?, ?, ?)',
  );
  const insertResponse = db.prepare(
    'INSERT INTO responses (attempt_id, question_id, choice, flagged) VALUES (?, ?, ?, ?)',
  );
  const questionsOf = db.prepare('SELECT id, number, answer FROM questions WHERE test_id = ? ORDER BY number');
  for (const a of load('attempts.json')) {
    const startedAt = a.startedAt ?? new Date(now.getTime() - a.startedMinutesAgo * 60_000).toISOString();
    insertAttempt.run(a.id, a.studentId, a.testId, a.minutes, startedAt, a.submittedAt, a.survey ?? null);
    for (const q of questionsOf.all(a.testId)) {
      const flagged = a.flagged.includes(q.number) ? 1 : 0;
      let choice = null;
      if (a.submittedAt) {
        choice = a.correct.includes(q.number) ? q.answer : (q.answer + 1) % 4;
      } else if (a.answered[q.number] !== undefined) {
        choice = a.answered[q.number];
      }
      if (choice !== null || flagged) insertResponse.run(a.id, q.id, choice, flagged);
    }
  }

  const insertSupports = db.prepare(`
    INSERT INTO supports (student_id, read_aloud, magnifier, extra_time, high_contrast, answer_masking,
      line_reader, reading_colour, font_size, parent_email)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const s of load('supports.json')) {
    insertSupports.run(
      s.studentId,
      s.readAloud ? 1 : 0,
      s.magnifier ? 1 : 0,
      s.extraTime ? 1 : 0,
      s.highContrast ? 1 : 0,
      s.answerMasking ? 1 : 0,
      s.lineReader ? 1 : 0,
      s.readingColour ?? 'default',
      s.fontSize ?? 'normal',
      s.parentEmail ?? '',
    );
  }
}

// `npm run seed`: delete the database file and make it again from the seed files.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const path = process.env.DATABASE_PATH || DEFAULT_DATABASE_PATH;
  rmSync(path, { force: true });
  const db = openDatabase(path);
  seed(db);
  db.close();
  console.log(`Seeded ${path}`);
}
