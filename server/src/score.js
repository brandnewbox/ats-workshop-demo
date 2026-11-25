// Score as a whole percent, for the results screens.
export function scorePercent(correct, total) {
  if (total === 0) return 0;
  return Math.floor((correct / total) * 100);
}

// Counts the correct answers of one attempt.
export function countCorrect(db, attemptId) {
  return db
    .prepare(
      `SELECT COUNT(*) AS n FROM responses r JOIN questions q ON q.id = r.question_id
        WHERE r.attempt_id = ? AND r.choice = q.answer`,
    )
    .get(attemptId).n;
}
