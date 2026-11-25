export default function QuestionStrip({ questions, current, responses, flags, onGo }) {
  return (
    <nav className="question-strip" aria-label="Questions">
      <ol>
        {questions.map((q) => {
          const answered = responses[q.id] !== undefined;
          const flagged = Boolean(flags[q.id]);
          return (
            <li key={q.id}>
              <button
                type="button"
                className={`strip-btn${q.number === current ? ' strip-current' : ''}${answered ? ' strip-answered' : ''}`}
                aria-current={q.number === current ? 'step' : undefined}
                onClick={() => onGo(q.number)}
              >
                {q.number}
                {answered && <img src="/icons/answered.svg" alt="Media content" width="12" height="12" />}
                {flagged && <img src="/icons/flagged.svg" alt="Media content" width="12" height="12" />}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
