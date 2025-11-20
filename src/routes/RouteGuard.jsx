import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthCheck } from '../hooks/useAuthCheck';
import LoadingFallback from '../components/shared/LoadingFallback';
import ScrollToTop from '../components/shared/ScrollToTop';

const RouteGuard = ({ children }) => {
  const { isChecking } = useAuthCheck();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isChecking) {
    return <LoadingFallback />;
  }

  // Render children once authentication check is complete
  return (
    <>
      <ScrollToTop />
      {children}
    </>
  );
};

export default RouteGuard;
