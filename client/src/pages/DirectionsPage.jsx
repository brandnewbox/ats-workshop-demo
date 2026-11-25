import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router';
import { loadAttempt } from '../store/testSlice.js';

const CONTROLS = [
  { icon: '/icons/next.svg', name: 'Next', text: 'goes to the next question.' },
  { icon: '/icons/back.svg', name: 'Back', text: 'goes to the question before.' },
  { icon: '/icons/flag.svg', name: 'Flag for review', text: 'marks a question, so you can find it again on the review screen.' },
  { icon: '/icons/highlighter.svg', name: 'Highlighter', text: 'marks words in the passage.' },
  { icon: '/icons/line-reader.svg', name: 'Line reader', text: 'shows one line of the passage at a time.' },
  { icon: '/icons/calculator.svg', name: 'Calculator', text: 'opens a calculator, on tests that allow one.' },
  { icon: '/icons/help.svg', name: 'Help', text: 'shows these directions again.' },
];

export default function DirectionsPage() {
  const { attemptId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const attempt = useSelector((state) => state.test.attempt);

  useEffect(() => {
    dispatch(loadAttempt(attemptId));
  }, [dispatch, attemptId]);

  return (
    <main className="container py-4 directions">
      <h1>Directions</h1>
      {attempt && String(attempt.id) === attemptId && (
        <p className="lead">
          {attempt.title}: {attempt.questions.length} questions.
        </p>
      )}
      <p>Read each question and choose the best answer. You can use these buttons on the test screens:</p>
      <ul className="directions-list">
        {CONTROLS.map((control) => (
          <li key={control.name}>
            <img src={control.icon} alt="Media content" width="24" height="24" />
            <span>
              <strong>{control.name}</strong> {control.text}
            </span>
          </li>
        ))}
      </ul>
      <p>When you finish, the review screen shows the questions that you did not answer or that you flagged.</p>
      <div className="directions-actions">
        <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/practice')}>
          <img src="/icons/back.svg" alt="Go Back" width="18" height="18" /> Go Back
        </button>
        <button type="button" className="btn btn-primary" onClick={() => navigate(`/test/${attemptId}/q/1`)}>
          <img src="/icons/begin.svg" alt="Begin" width="18" height="18" /> Begin
        </button>
      </div>
    </main>
  );
}
