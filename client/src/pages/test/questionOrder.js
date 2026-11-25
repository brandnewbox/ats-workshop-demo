// The question that Next goes to after question `n` (numbers start at 1).
// Flagged questions come back on the review screen.
export function nextQuestionNumber(n, total, flagged) {
  const next = flagged ? n + 2 : n + 1;
  return next > total ? null : next;
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
