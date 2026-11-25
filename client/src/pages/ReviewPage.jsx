import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router';
import * as api from '../api.js';
import { clearTest, loadAttempt, submitAttempt } from '../store/testSlice.js';
import { showError } from '../store/uiSlice.js';

const SURVEY_ANSWERS = [
  { value: 'easy', label: 'Easy' },
  { value: 'just-right', label: 'Just right' },
  { value: 'hard', label: 'Hard' },
  { value: 'very-hard', label: 'Very hard' },
];

function Survey({ attemptId }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState(null);

  function finish() {
    dispatch(clearTest());
    navigate(`/results/${attemptId}`);
  }

  async function handleSend(event) {
    event.preventDefault();
    if (difficulty) {
      try {
        await api.post(`/attempts/${attemptId}/survey`, { difficulty });
      } catch (error) {
        dispatch(showError(error.message));
        return;
      }
    }
    finish();
  }

  return (
    <form className="survey card" onSubmit={handleSend}>
      <div className="card-body">
        <h2 className="h4">Your test is submitted</h2>
        <p className="survey-question">How hard was this test?</p>
        {SURVEY_ANSWERS.map((answer) => (
          <div key={answer.value} className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="difficulty"
              id={`difficulty-${answer.value}`}
              value={answer.value}
              checked={difficulty === answer.value}
              onChange={() => setDifficulty(answer.value)}
            />
            <label className="form-check-label" htmlFor={`difficulty-${answer.value}`}>
              {answer.label}
            </label>
          </div>
        ))}
        <div className="mt-3 d-flex gap-2">
          <button type="submit" className="btn btn-primary">
            Send
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={finish}>
            Skip
          </button>
        </div>
      </div>
    </form>
  );
}

export default function ReviewPage() {
  const { attemptId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { attempt, responses, flags } = useSelector((state) => state.test);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    dispatch(loadAttempt(attemptId));
  }, [dispatch, attemptId]);

  if (submitted) {
    return (
      <main className="container py-4 review">
        <Survey attemptId={attemptId} />
      </main>
    );
  }

  if (!attempt || String(attempt.id) !== attemptId) {
    return <p className="container py-4">Loading the test…</p>;
  }

  const questions = attempt.questions.filter((q) => !flaggedOnly || flags[q.id]);
  const answeredCount = attempt.questions.filter((q) => responses[q.id] !== undefined).length;
  const flaggedCount = attempt.questions.filter((q) => flags[q.id]).length;

  async function handleSubmit() {
    try {
      await dispatch(submitAttempt(attemptId)).unwrap();
      setSubmitted(true);
    } catch (error) {
      dispatch(showError(error.message));
    }
  }

  return (
    <main className="container py-4 review">
      <h1>Review your answers</h1>
      <p>
        {attempt.title}: {answeredCount} of {attempt.questions.length} answered, {flaggedCount} flagged.
      </p>
      <button
        type="button"
        className={`btn btn-sm flagged-only${flaggedOnly ? ' btn-warning' : ' btn-outline-secondary'}`}
        onClick={() => setFlaggedOnly(!flaggedOnly)}
      >
        Show flagged only
      </button>
      <ul className="review-grid">
        {questions.map((q) => {
          const answered = responses[q.id] !== undefined;
          return (
            <li key={q.id}>
              <Link
                to={`/test/${attemptId}/q/${q.number}`}
                className={`review-item${answered ? ' review-answered' : ''}${flags[q.id] ? ' review-flagged' : ''}`}
              >
                <span className="review-number">Question {q.number}</span>
                <span className="review-status">
                  {answered ? 'Answered' : 'Not answered'}
                  {flags[q.id] ? ', flagged' : ''}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {questions.length === 0 && <p>No questions are flagged.</p>}
      <div className="review-actions">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => navigate(`/test/${attemptId}/q/${attempt.questions.length}`)}
        >
          Go Back
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </main>
  );
}
