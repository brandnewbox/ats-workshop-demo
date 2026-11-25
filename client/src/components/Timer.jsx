import { useEffect, useState } from 'react';
import { formatTime } from '../pages/test/questionOrder.js';

export default function Timer({ attempt }) {
  const [secondsLeft, setSecondsLeft] = useState(() => Math.round(attempt.minutes * 60));

  useEffect(() => {
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="timer">
      <i className="bi bi-clock" aria-hidden="true" /> Time left <strong>{formatTime(secondsLeft)}</strong>
    </div>
  );
}
