import React, { useState, useEffect } from 'react';

const HighContrastToggle = () => {
  // Initialize with saved preference
  const getInitialState = () => {
    const savedPreference = sessionStorage.getItem('highContrastMode');
    return savedPreference === 'true';
  };

  const [isHighContrast, setIsHighContrast] = useState(getInitialState());

  useEffect(() => {
    // Apply saved preference on mount
    const savedPreference = sessionStorage.getItem('highContrastMode');
    if (savedPreference === 'true') {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, []);

  const toggleHighContrast = () => {
    const newState = !isHighContrast;
    setIsHighContrast(newState);
    
    if (newState) {
      document.body.classList.add('high-contrast');
      sessionStorage.setItem('highContrastMode', 'true');
    } else {
      document.body.classList.remove('high-contrast');
      sessionStorage.setItem('highContrastMode', 'false');
    }
  };

  return (
    <button
      className="btn btn-sm border d-flex align-items-center"
      onClick={toggleHighContrast}
      aria-label={isHighContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
      title={isHighContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
      style={{
        minWidth: '36px',
        height: '36px',
        padding: '6px 10px',
        fontSize: '14px',
      }}
    >
      <i className={`fa-solid ${isHighContrast ? 'fa-circle-half-stroke' : 'fa-adjust'}`}></i>
    </button>
  );
};

export default HighContrastToggle;

