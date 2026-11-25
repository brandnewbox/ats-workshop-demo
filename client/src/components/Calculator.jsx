import { useState } from 'react';

const KEYS = ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '0', '.', '=', '+'];

function evaluate(expression) {
  const js = expression.replaceAll('×', '*').replaceAll('÷', '/').replaceAll('−', '-');
  if (!/^[\d.+\-*/ ]+$/.test(js)) return 'Error';
  try {
    const value = Function(`"use strict"; return (${js});`)();
    return Number.isFinite(value) ? String(Math.round(value * 1e8) / 1e8) : 'Error';
  } catch {
    return 'Error';
  }
}

export default function Calculator({ id }) {
  const [display, setDisplay] = useState('');

  function press(key) {
    if (key === '=') setDisplay((d) => evaluate(d));
    else setDisplay((d) => (d === 'Error' ? key : d + key));
  }

  return (
    <div id={id} className="calculator card">
      <div className="card-body">
        <h2 className="h6">Calculator</h2>
        <output className="calculator-display" aria-live="polite">
          {display || '0'}
        </output>
        <div className="calculator-keys">
          {KEYS.map((key) => (
            <button key={key} type="button" className="btn btn-light" onClick={() => press(key)}>
              {key}
            </button>
          ))}
          <button type="button" className="btn btn-outline-secondary calculator-clear" onClick={() => setDisplay('')}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
