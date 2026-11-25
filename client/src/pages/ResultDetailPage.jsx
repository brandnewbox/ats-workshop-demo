import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useParams } from 'react-router';
import * as api from '../api.js';
import { showError } from '../store/uiSlice.js';

const FILTERS = ['All', 'Correct', 'Incorrect'];

export default function ResultDetailPage() {
  const { attemptId } = useParams();
  const dispatch = useDispatch();
  const [result, setResult] = useState(null);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    api
      .get(`/results/${attemptId}`)
      .then(setResult)
      .catch((error) => dispatch(showError(error.message)));
  }, [dispatch, attemptId]);

  if (!result) return <p>Loading the result…</p>;

  const rows = result.questions.filter(
    (q) => filter === 'All' || (filter === 'Correct' ? q.correct : !q.correct),
  );

  return (
    <>
      <p>
        <Link to="/results">My Results</Link>
      </p>
      <h1>{result.title}</h1>
      <p className="result-score">
        Score: {result.correct} of {result.total} ({result.percent}%). Submitted {result.date}.
      </p>
      <img src={`/api/results/${result.id}/chart.png`} alt="chart.png" className="result-chart" width="240" height="150" />

      <h2 className="h4 mt-4">Your answers</h2>
      <div className="result-legend">
        <span>
          <img src="/icons/correct.svg" alt="Media content" width="16" height="16" /> Correct
        </span>
        <span>
          <img src="/icons/incorrect.svg" alt="Media content" width="16" height="16" /> Incorrect
        </span>
        <span>
          <img src="/icons/flagged.svg" alt="Media content" width="16" height="16" /> Flagged
        </span>
      </div>
      <div className="result-filter" role="group" aria-label="Show">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={`btn btn-sm${filter === f ? ' btn-primary' : ' btn-outline-primary'}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <table className="table result-table">
        <thead>
          <tr>
            <th scope="col">Question</th>
            <th scope="col">Your answer</th>
            <th scope="col">Correct answer</th>
            <th scope="col">Result</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((q) => (
            <tr key={q.number}>
              <td>
                {q.number}. {q.stem}
              </td>
              <td>{q.yourAnswer ?? 'No answer'}</td>
              <td>{q.correctAnswer}</td>
              <td>
                <img
                  src={q.correct ? '/icons/correct.svg' : '/icons/incorrect.svg'}
                  alt={q.correct ? 'Correct' : 'Incorrect'}
                  width="16"
                  height="16"
                />
                {q.flagged && <img src="/icons/flagged.svg" alt="Flagged" width="16" height="16" className="ms-1" />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
