import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@ctx/AuthContext.js';
import FullScreenSpinner from './FullScreenSpinner';

type Props = {
  children: ReactNode;
};

export default function RequireAuth({ children }: Props) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullScreenSpinner message="Loading session..." />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
