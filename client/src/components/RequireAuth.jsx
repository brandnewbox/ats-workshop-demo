import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router';

export default function RequireAuth() {
  const user = useSelector((state) => state.auth.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
