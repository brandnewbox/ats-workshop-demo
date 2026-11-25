import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router';
import * as api from '../api.js';
import { showError } from '../store/uiSlice.js';

export default function ResultsPage() {
  const dispatch = useDispatch();
  const [results, setResults] = useState(null);

  useEffect(() => {
    api
      .get('/results')
      .then(setResults)
      .catch((error) => dispatch(showError(error.message)));
  }, [dispatch]);

  return (
    <>
      <h1>My Results</h1>
      {results === null && <p>Loading your results…</p>}
      {results?.length === 0 && (
        <p>
          You have no results yet. <Link to="/practice">Take a practice test</Link>.
        </p>
      )}
      {results?.length > 0 && (
        <table className="table results-table">
          <caption>Your practice tests, newest first</caption>
          <thead>
            <tr>
              <th scope="col">Test</th>
              <th scope="col">Date</th>
              <th scope="col">Score</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link to={`/results/${r.id}`}>{r.title}</Link>
                </td>
                <td>{r.date}</td>
                <td>
                  {r.correct} of {r.total} ({r.percent}%)
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
