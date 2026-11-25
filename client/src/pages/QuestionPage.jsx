import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router';
import QuestionStrip from '../components/QuestionStrip.jsx';
import Timer from '../components/Timer.jsx';
import Toolbar from '../components/Toolbar.jsx';
import { loadAttempt, saveResponse, selectAnswer } from '../store/testSlice.js';
import { showError } from '../store/uiSlice.js';
import { nextQuestionNumber } from './test/questionOrder.js';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function QuestionPage() {
  const { attemptId, n: nParam } = useParams();
  const n = Number(nParam);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { attempt, responses, flags, tool, status } = useSelector((state) => state.test);
  const [crossedOut, setCrossedOut] = useState({});

  // Load the attempt (questions, saved answers and flags) for each question.
  useEffect(() => {
    dispatch(loadAttempt(attemptId));
  }, [dispatch, attemptId, n]);

  if (!attempt || String(attempt.id) !== attemptId) {
    return <p className="container py-4">Loading the test…</p>;
  }

  const total = attempt.questions.length;
  const question = attempt.questions[n - 1];
  if (!question) return <p className="container py-4">This question was not found.</p>;
  const choice = responses[question.id];

  async function save() {
    try {
      await dispatch(
        saveResponse({
          attemptId,
          questionId: question.id,
          choice: choice ?? null,
          flagged: Boolean(flags[question.id]),
        }),
      ).unwrap();
      return true;
    } catch (error) {
      dispatch(showError(error.message));
      return false;
    }
  }

  function goTo(number) {
    navigate(number === null ? `/test/${attemptId}/review` : `/test/${attemptId}/q/${number}`);
  }

  async function handleNext() {
    if (await save()) goTo(nextQuestionNumber(n, total, Boolean(flags[question.id])));
  }

  function handleBack() {
    if (n > 1) goTo(n - 1);
  }

  async function handleStrip(number) {
    if (await save()) goTo(number);
  }

  return (
    <div className="test-screen" aria-busy={status === 'loading'}>
      <div className="test-topbar">
        <span className="test-title">{attempt.title}</span>
        <span className="question-count">
          Question {n} of {total}
        </span>
        <Timer key={attempt.id} attempt={attempt} />
      </div>

      <Toolbar attempt={attempt} question={question} />

      <main className="test-body">
        <section className={`passage tool-${tool}`} aria-label="Passage">
          {question.passage.split('\n\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </section>

        <section className="question-panel" aria-label="Question">
          <p className="stem">{question.stem}</p>
          <div className="options">
            {question.options.map((text, i) => {
              const crossKey = `${question.id}-${i}`;
              return (
                <div
                  key={i}
                  className={`option${choice === i ? ' option-selected' : ''}${crossedOut[crossKey] ? ' option-crossed' : ''}`}
                >
                  <input
                    type="radio"
                    className="form-check-input"
                    name={`question-${question.id}`}
                    aria-label={`Option ${LETTERS[i]}`}
                    checked={choice === i}
                    onChange={() => dispatch(selectAnswer({ questionId: question.id, choice: i }))}
                  />
                  <span className="option-letter">{LETTERS[i]}.</span>
                  <span className="option-text">{text}</span>
                  {tool === 'eliminator' && (
                    <button
                      type="button"
                      className="btn btn-sm btn-link option-cross"
                      onClick={() => setCrossedOut({ ...crossedOut, [crossKey]: !crossedOut[crossKey] })}
                    >
                      {crossedOut[crossKey] ? `Undo cross out ${LETTERS[i]}` : `Cross out ${LETTERS[i]}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <div className="test-footer">
        <button type="button" className="btn btn-outline-secondary" onClick={handleBack} disabled={n === 1}>
          Back
        </button>
        <QuestionStrip questions={attempt.questions} current={n} responses={responses} flags={flags} onGo={handleStrip} />
        <button type="button" className="btn btn-primary" onClick={handleNext}>
          Next
        </button>
      </div>
    </div>
  );
}
