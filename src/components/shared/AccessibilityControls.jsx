import React from 'react';
import HighContrastToggle from './HighContrastToggle';
import TextSizeController from './TextSizeController';

const AccessibilityControls = () => {
  return (
    <div className="accessibility-controls">
      <TextSizeController />
      <HighContrastToggle />
    </div>
  );
};

export default AccessibilityControls;

