import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from '../stores/authStore';

function LogoutAndRedirect() {
  const silentLogout = useAuthStore(state => state.silentLogout);
  useEffect(() => {
    silentLogout();
  }, [silentLogout]);
  return <Navigate to="/login" replace />;
}

export default function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated } = useAuthStore();

  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ returnTo: location.pathname }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <LogoutAndRedirect />;
  }

  return <Outlet />;
}
