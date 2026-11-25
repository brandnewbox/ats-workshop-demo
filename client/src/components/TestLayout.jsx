import { Outlet } from 'react-router';

// The test screens (directions, questions, review) have no site header, as in KITE.
export default function TestLayout() {
  return (
    <div className="test-layout">
      <Outlet />
    </div>
  );
}
