import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import { login } from '../store/authSlice.js';
import { showError } from '../store/uiSlice.js';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!username.trim() || !password) {
      dispatch(showError('Username and Password are required'));
      return;
    }
    setBusy(true);
    try {
      await dispatch(login({ username, password })).unwrap();
      navigate('/home');
    } catch (error) {
      dispatch(showError(error.message));
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <main className="login-card">
        <img src="/icons/logo.svg" alt="" width="48" height="48" />
        <h1>Prairie Practice</h1>
        <p className="login-intro">Sign in to practice for your tests.</p>
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              id="username"
              name="username"
              className="form-control"
              autoComplete="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={busy}>
            Sign In
          </button>
        </form>
        <p className="login-help">Practice accounts: student1 / practice1, student2 / practice2, student3 / practice3.</p>
      </main>
    </div>
  );
}
