import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated } = useAuthStore();

  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ returnTo: location.pathname }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
