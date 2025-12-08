import React from 'react';
import PropTypes from 'prop-types';
import { TIMEOUTS } from '../../constants/appConstants';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
    this.reloadTimeout = null;
  }

  static getDerivedStateFromError(error) {
    // Check if this is a chunk load error (deployment cache issue)
    const isChunkLoadError = 
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Loading CSS chunk') ||
      error?.name === 'ChunkLoadError';

    return { 
      hasError: true, 
      isChunkLoadError,
      error 
    };
  }

  componentDidCatch(error, errorInfo) {
    // Error caught by ErrorBoundary
    
    this.setState({
      error,
      errorInfo
    });

    // If it's a chunk load error, auto-reload after a short delay
    const isChunkLoadError = 
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Loading CSS chunk') ||
      error?.name === 'ChunkLoadError';

    if (isChunkLoadError) {
      // Clear cache and reload
      this.reloadTimeout = setTimeout(() => {
        // Force a hard reload to get fresh assets
        window.location.reload(true);
      }, TIMEOUTS.CHUNK_ERROR_RELOAD);
    }
  }

  componentWillUnmount() {
    if (this.reloadTimeout) {
      clearTimeout(this.reloadTimeout);
    }
  }

  handleReload = () => {
    // Clear any cached assets and reload
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    window.location.reload(true);
  };

  render() {
    if (this.state.hasError) {
      const isChunkLoadError = this.state.isChunkLoadError;

      if (isChunkLoadError) {
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            textAlign: 'center'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '40px',
              maxWidth: '600px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔄</div>
              <h1 style={{ color: '#495057', marginBottom: '16px', fontSize: '24px' }}>
                Updating Application...
              </h1>
              <p style={{ color: '#6c757d', marginBottom: '24px', fontSize: '16px' }}>
                A new version of the application is available. The page will reload automatically in a moment.
              </p>
              <button
                onClick={this.handleReload}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
              >
                Reload Now
              </button>
            </div>
          </div>
        );
      }

      // For other errors, show a user-friendly message
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '40px',
            maxWidth: '600px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
            <h1 style={{ color: '#495057', marginBottom: '16px', fontSize: '24px' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#6c757d', marginBottom: '24px', fontSize: '16px' }}>
              We encountered an unexpected error. Please try reloading the page.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;

