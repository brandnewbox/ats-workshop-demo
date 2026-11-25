import { useDispatch } from 'react-redux';
import { Link, NavLink, useNavigate } from 'react-router';
import { logout } from '../store/authSlice.js';

const LINKS = [
  { to: '/home', label: 'Home', icon: '/icons/home.svg' },
  { to: '/practice', label: 'Practice', icon: '/icons/practice.svg' },
  { to: '/results', label: 'My Results', icon: '/icons/results.svg' },
  { to: '/supports', label: 'My Supports', icon: '/icons/supports.svg' },
];

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function handleSignOut() {
    await dispatch(logout());
    navigate('/login');
  }

  return (
    <header className="app-header">
      <div className="container app-header-inner">
        <Link to="/home" className="brand">
          <img src="/icons/logo.svg" alt="" width="28" height="28" />
          Prairie Practice
        </Link>
        <nav className="app-nav" aria-label="Main">
          <ul>
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to}>
                  <img src={link.icon} alt={`${link.label} icon`} width="18" height="18" /> {link.label}
                </NavLink>
              </li>
            ))}
            <li>
              <button type="button" className="nav-sign-out" onClick={handleSignOut}>
                <img src="/icons/sign-out.svg" alt="Sign Out icon" width="18" height="18" /> Sign Out
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
