import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import * as api from '../api.js';
import { showError, showSuccess } from '../store/uiSlice.js';

const TOGGLES = [
  { key: 'readAloud', label: 'Read aloud', icon: '/icons/read-aloud.svg', text: 'The test reads the question and the answers to you.' },
  { key: 'magnifier', label: 'Magnifier', icon: '/icons/magnifier.svg', text: 'Makes a part of the screen bigger.' },
  { key: 'extraTime', label: 'Extra time', icon: '/icons/extra-time.svg', text: 'You get one and a half times the usual time.' },
  { key: 'highContrast', label: 'High contrast', icon: '/icons/high-contrast.svg', text: 'Dark background and light text.' },
  { key: 'answerMasking', label: 'Answer masking', icon: '/icons/answer-masking.svg', text: 'Hides the answers until you show them.' },
  { key: 'lineReader', label: 'Line reader on by default', icon: '/icons/line-reader.svg', text: 'The line reader is on when a test starts.' },
];

const READING_COLOURS = [
  { value: 'default', label: 'Default' },
  { value: 'cream', label: 'Cream' },
  { value: 'light-blue', label: 'Light blue' },
  { value: 'light-green', label: 'Light green' },
];

const FONT_SIZES = [
  { value: 'normal', label: 'Normal' },
  { value: 'large', label: 'Large' },
  { value: 'extra-large', label: 'Extra large' },
];

function RadioRow({ title, name, options, value, onChange }) {
  return (
    <div className="mb-3">
      <div className="form-label fw-semibold">{title}</div>
      <div>
        {options.map((option) => (
          <div key={option.value} className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name={name}
              id={`${name}-${option.value}`}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <label className="form-check-label" htmlFor={`${name}-${option.value}`}>
              {option.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SupportsPage() {
  const dispatch = useDispatch();
  const [supports, setSupports] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get('/supports')
      .then(setSupports)
      .catch((error) => dispatch(showError(error.message)));
  }, [dispatch]);

  if (!supports) return <p>Loading your supports…</p>;

  const change = (key, value) => setSupports({ ...supports, [key]: value });

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    try {
      setSupports(await api.update('/supports', supports));
      dispatch(showSuccess('Your supports are saved.'));
    } catch (error) {
      dispatch(showError(error.message));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h1>My Supports</h1>
      <p>Choose the supports that help you on a test. They are used on every practice test.</p>
      <form className="supports-form" onSubmit={handleSave} noValidate>
        <h2 className="h4">Tools</h2>
        <ul className="support-list">
          {TOGGLES.map((t) => (
            <li key={t.key} className="support-item card">
              <div className="card-body">
                <img src={t.icon} alt="Media content" width="32" height="32" className="support-picture" />
                <div
                  className={`support-toggle${supports[t.key] ? ' support-on' : ''}`}
                  tabIndex={0}
                  onClick={() => change(t.key, !supports[t.key])}
                >
                  <span className="support-switch">{supports[t.key] && <img src="/icons/check.svg" alt="" width="14" height="14" />}</span>
                  {t.label}
                </div>
                <p className="support-text">{t.text}</p>
              </div>
            </li>
          ))}
        </ul>

        <h2 className="h4">Reading</h2>
        <RadioRow
          title="Reading colour"
          name="readingColour"
          options={READING_COLOURS}
          value={supports.readingColour}
          onChange={(v) => change('readingColour', v)}
        />
        <RadioRow
          title="Font size"
          name="fontSize"
          options={FONT_SIZES}
          value={supports.fontSize}
          onChange={(v) => change('fontSize', v)}
        />

        <h2 className="h4">Reports</h2>
        <div className="mb-3 parent-email">
          <label htmlFor="parentEmail" className="form-label">
            Parent email for reports
          </label>
          <input
            id="parentEmail"
            name="parentEmail"
            type="text"
            autoComplete="off"
            className="form-control"
            value={supports.parentEmail}
            onChange={(e) => change('parentEmail', e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          Save
        </button>
      </form>
    </>
  );
}
