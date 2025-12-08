import React, { useEffect, useCallback } from 'react';
import { useRouteError, useNavigate } from 'react-router-dom';
import { TIMEOUTS } from '../../constants/appConstants';

const RouteError = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  // Check if this is a chunk/module load error
  const isChunkLoadError = 
    error?.message?.includes('Failed to fetch dynamically imported module') ||
    error?.message?.includes('Loading chunk') ||
    error?.message?.includes('Loading CSS chunk') ||
    error?.name === 'ChunkLoadError' ||
    error?.toString()?.includes('Failed to fetch dynamically imported module');

  const handleReload = useCallback(() => {
    // Clear any cached assets
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    // Force a hard reload to get fresh assets
    window.location.reload(true);
  }, []);

  // Auto-reload for chunk errors after a delay
  useEffect(() => {
    if (isChunkLoadError) {
      const reloadTimer = setTimeout(() => {
        handleReload();
      }, TIMEOUTS.ERROR_RELOAD_DELAY);

      return () => clearTimeout(reloadTimer);
    }
  }, [isChunkLoadError, handleReload]);

  const handleGoHome = () => {
    navigate('/');
  };

  if (isChunkLoadError) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '100vh', padding: '2rem', backgroundColor: 'var(--mass-gray, #f5f7f8)' }}>
        <div className="card shadow-sm" style={{ maxWidth: '600px', width: '100%', border: '1px solid #e9ecef', borderRadius: '12px' }}>
          <div className="card-body text-center p-4 p-md-5">
            <div className="mb-4">
              <i className="fas fa-sync-alt fa-spin" style={{ fontSize: '3.5rem', color: 'var(--theme-color, #0265A3)' }}></i>
            </div>
            <h1 className="h4 fw-semibold mb-3" style={{ color: 'var(--dark-color, #222222)', fontSize: 'var(--text-lg-med, 24px)' }}>
              Updating Application...
            </h1>
            <p className="text-muted mb-4" style={{ fontSize: 'var(--text-base, 16px)', lineHeight: '1.6' }}>
              A new version of the application is available. The page will reload automatically in a moment.
            </p>
            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
              <button
                onClick={handleReload}
                className="dashboard-btn-create"
                style={{ minWidth: '140px' }}
              >
                <i className="fas fa-redo me-2"></i>
                Reload Now
              </button>
              <button
                onClick={handleGoHome}
                className="dashboard-btn-refresh"
                style={{ minWidth: '140px' }}
              >
                <i className="fas fa-home me-2"></i>
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For other errors, show a user-friendly message
  return (
    <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '100vh', padding: '2rem', backgroundColor: 'var(--mass-gray, #f5f7f8)' }}>
      <div className="card shadow-sm" style={{ maxWidth: '600px', width: '100%', border: '1px solid #e9ecef', borderRadius: '12px' }}>
        <div className="card-body text-center p-4 p-md-5">
          <div className="mb-4">
            <i className="fas fa-exclamation-triangle" style={{ fontSize: '3.5rem', color: '#dc3545' }}></i>
          </div>
          <h1 className="h4 fw-semibold mb-3" style={{ color: 'var(--dark-color, #222222)', fontSize: 'var(--text-lg-med, 24px)' }}>
            Something went wrong
          </h1>
          <p className="text-muted mb-4" style={{ fontSize: 'var(--text-base, 16px)', lineHeight: '1.6' }}>
            {error?.statusText || error?.message || 'We encountered an unexpected error. Please try reloading the page.'}
          </p>
          <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
            <button
              onClick={handleReload}
              className="dashboard-btn-create"
              style={{ minWidth: '140px' }}
            >
              <i className="fas fa-redo me-2"></i>
              Reload Page
            </button>
            <button
              onClick={handleGoHome}
              className="dashboard-btn-refresh"
              style={{ minWidth: '140px' }}
            >
              <i className="fas fa-home me-2"></i>
              Go to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteError;

