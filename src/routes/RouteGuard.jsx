import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthCheck } from '../hooks/useAuthCheck';
import LoadingFallback from '../components/shared/LoadingFallback';

const RouteGuard = ({ children }) => {
  const { isChecking } = useAuthCheck();

  // Show loading spinner while checking authentication
  if (isChecking) {
    return <LoadingFallback />;
  }

  // Render children once authentication check is complete
  return <>{children}</>;
};

export default RouteGuard;
