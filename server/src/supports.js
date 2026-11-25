// Testing supports (KITE calls these the PNP).

// A student with "Extra time" gets this many times the test's minutes.
export const EXTRA_TIME_FACTOR = 1.5;

export const READING_COLOURS = ['default', 'cream', 'light-blue', 'light-green'];
export const FONT_SIZES = ['normal', 'large', 'extra-large'];

const TOGGLES = {
  readAloud: 'read_aloud',
  magnifier: 'magnifier',
  extraTime: 'extra_time',
  highContrast: 'high_contrast',
  answerMasking: 'answer_masking',
  lineReader: 'line_reader',
};

export function findSupports(db, studentId) {
  const row = db.prepare('SELECT * FROM supports WHERE student_id = ?').get(studentId);
  return toSupports(row);
}

export function toSupports(row) {
  const supports = {};
  for (const [key, column] of Object.entries(TOGGLES)) supports[key] = Boolean(row?.[column]);
  supports.readingColour = row?.reading_colour ?? 'default';
  supports.fontSize = row?.font_size ?? 'normal';
  supports.parentEmail = row?.parent_email ?? '';
  return supports;
}

export function validateSupports(supports) {
  if (!READING_COLOURS.includes(supports.readingColour)) {
    throw new Error(`Unknown reading colour: ${supports.readingColour}`);
  }
  if (!FONT_SIZES.includes(supports.fontSize)) {
    throw new Error(`Unknown font size: ${supports.fontSize}`);
  }
}

export function saveSupports(db, studentId, changes) {
  const supports = { ...findSupports(db, studentId), ...changes };
  validateSupports(supports);
  db.prepare(
    `INSERT INTO supports (student_id, read_aloud, magnifier, extra_time, high_contrast, answer_masking,
       line_reader, reading_colour, font_size, parent_email)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (student_id) DO UPDATE SET
       read_aloud = excluded.read_aloud, magnifier = excluded.magnifier, extra_time = excluded.extra_time,
       high_contrast = excluded.high_contrast, answer_masking = excluded.answer_masking,
       line_reader = excluded.line_reader, reading_colour = excluded.reading_colour,
       font_size = excluded.font_size, parent_email = excluded.parent_email`,
  ).run(
    studentId,
    ...Object.keys(TOGGLES).map((key) => (supports[key] ? 1 : 0)),
    supports.readingColour,
    supports.fontSize,
    String(supports.parentEmail ?? ''),
  );
  return supports;
}
