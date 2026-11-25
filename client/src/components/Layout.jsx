import { Outlet } from 'react-router';
import Header from './Header.jsx';

export default function Layout() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <Header />
      <main id="main" className="container py-4" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}
