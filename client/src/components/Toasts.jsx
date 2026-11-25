import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hideToast } from '../store/uiSlice.js';

export const TOAST_MS = 5000;

function Toast({ toast }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const timer = setTimeout(() => dispatch(hideToast(toast.id)), TOAST_MS);
    return () => clearTimeout(timer);
  }, [dispatch, toast.id]);

  return (
    <div className={`app-toast app-toast-${toast.kind}`}>
      <span className="app-toast-message">{toast.message}</span>
      <button type="button" className="app-toast-close" aria-label="Close" onClick={() => dispatch(hideToast(toast.id))}>
        <i className="bi bi-x-lg" aria-hidden="true" />
      </button>
    </div>
  );
}

// Messages in the bottom-right corner. They close after 5 seconds.
export default function Toasts() {
  const toasts = useSelector((state) => state.ui.toasts);
  return (
    <div className="app-toasts">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
