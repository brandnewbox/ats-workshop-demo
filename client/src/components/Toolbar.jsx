import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import { selectTool, toggleFlag } from '../store/testSlice.js';
import Calculator from './Calculator.jsx';

const TOOLS = [
  { id: 'pointer', label: 'Pointer', icon: '/icons/pointer.svg' },
  { id: 'highlighter', label: 'Highlighter', icon: '/icons/highlighter.svg' },
  { id: 'line-reader', label: 'Line reader', icon: '/icons/line-reader.svg' },
  { id: 'eliminator', label: 'Answer eliminator', icon: '/icons/eliminator.svg' },
];

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

function stopSpeaking() {
  window.speechSynthesis?.cancel();
}

export default function Toolbar({ attempt, question }) {
  const dispatch = useDispatch();
  const tool = useSelector((state) => state.test.tool);
  const flagged = useSelector((state) => Boolean(state.test.flags[question.id]));
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  // The ID of the question that is read aloud now, or null.
  const [readingId, setReadingId] = useState(null);
  const reading = readingId === question.id;

  // Stop reading when the student goes to another question.
  useEffect(() => stopSpeaking, [question.id]);

  function handleReadAloud() {
    if (reading) stopSpeaking();
    else speak(`${question.stem} ${question.options.join('. ')}`);
    setReadingId(reading ? null : question.id);
  }

  return (
    <div className="test-toolbar-wrap">
      <div className="test-toolbar" role="group" aria-label="Tools">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tool-btn${tool === t.id ? ' tool-active' : ''}`}
            onClick={() => dispatch(selectTool(t.id))}
          >
            <img src={t.icon} alt="" width="18" height="18" /> {t.label}
          </button>
        ))}
        {attempt.calculator && (
          <button type="button" className="tool-btn" onClick={() => setCalculatorOpen(!calculatorOpen)}>
            <img src="/icons/calculator.svg" alt="" width="18" height="18" /> Calculator
          </button>
        )}
        <button type="button" className="tool-btn" onClick={handleReadAloud}>
          <img src={reading ? '/icons/pause.svg' : '/icons/play.svg'} alt="" width="18" height="18" /> Read aloud
        </button>
        <Link className="tool-btn" to={`/test/${attempt.id}/directions`}>
          <img src="/icons/help.svg" alt="" width="18" height="18" /> Help
        </Link>
        <button
          type="button"
          className={`tool-btn flag-btn${flagged ? ' flag-on' : ''}`}
          onClick={() => dispatch(toggleFlag(question.id))}
        >
          <img src={flagged ? '/icons/flagged.svg' : '/icons/flag.svg'} alt="" width="18" height="18" /> Flag for review
        </button>
      </div>
      {calculatorOpen && <Calculator id="calculator-panel" />}
    </div>
  );
}
