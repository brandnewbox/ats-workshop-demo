import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import * as api from '../api.js';
import { showError } from '../store/uiSlice.js';

// The order of the subject buttons.
const SUBJECTS = ['ELA', 'Math', 'Science', 'Social Studies'];
const GRADES = [4, 6, 8, 10];

export default function PracticePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [tests, setTests] = useState(null);
  const [subject, setSubject] = useState(null);
  const [grade, setGrade] = useState(null);

  useEffect(() => {
    api
      .get('/tests')
      .then(setTests)
      .catch((error) => dispatch(showError(error.message)));
  }, [dispatch]);

  async function startTest(test) {
    try {
      const attempt = await api.post(`/tests/${test.id}/attempts`);
      navigate(`/test/${attempt.id}/directions`);
    } catch (error) {
      dispatch(showError(error.message));
    }
  }

  const shown = (tests ?? []).filter(
    (test) => (subject === null || test.subjectId === subject + 1) && (grade === null || test.grade === grade),
  );

  return (
    <>
      <div className="page-title">Practice</div>
      <p>Choose a subject and a grade, then start a practice test.</p>

      <div className="filter-row">
        <span className="filter-label">Subject</span>
        <div className="subject-filters">
          <button
            type="button"
            className={`btn filter-btn${subject === null ? ' active' : ''}`}
            onClick={() => setSubject(null)}
          >
            All subjects
          </button>
          {SUBJECTS.map((name, index) => (
            <button
              key={name}
              type="button"
              className={`btn filter-btn${subject === index ? ' active' : ''}`}
              onClick={() => setSubject(index)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-row">
        <span className="filter-label">Grade</span>
        <div className="grade-filters">
          <button
            type="button"
            className={`btn filter-btn${grade === null ? ' active' : ''}`}
            onClick={() => setGrade(null)}
          >
            All grades
          </button>
          {GRADES.map((g) => (
            <button
              key={g}
              type="button"
              className={`btn filter-btn${grade === g ? ' active' : ''}`}
              onClick={() => setGrade(g)}
            >
              Grade {g}
            </button>
          ))}
        </div>
      </div>

      {tests === null && <p>Loading tests…</p>}
      {tests !== null && shown.length === 0 && <p>No practice tests match these filters.</p>}
      <ul className="test-list">
        {shown.map((test) => (
          <li key={test.id} className="test-card card">
            <div className="card-body">
              <h4 className="test-card-title">{test.title}</h4>
              <p className="test-card-meta">
                {test.subject} · Grade {test.grade} · {test.questionCount} questions · {test.minutes} minutes
              </p>
              <button type="button" className="btn btn-primary" onClick={() => startTest(test)}>
                Start
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
