import React, { memo } from 'react';
import PropTypes from 'prop-types';

const LoadingFallback = memo(({ message = 'Loading page...' }) => {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="text-center">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="mt-3">
          <p className="text-muted">{message}</p>
        </div>
      </div>
    </div>
  );
});

LoadingFallback.propTypes = {
  message: PropTypes.string,
};

LoadingFallback.displayName = 'LoadingFallback';

export default LoadingFallback;
