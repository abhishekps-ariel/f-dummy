import React, { useState, useEffect } from 'react';

const TextSizeController = () => {
  // Initialize with saved font size or default
  const getInitialFontSize = () => {
    const savedFontSize = localStorage.getItem('accessibilityFontSize');
    if (savedFontSize) {
      const size = parseInt(savedFontSize, 10);
      if (size >= 12 && size <= 24) {
        return size;
      }
    }
    return 16; // Default 16px
  };

  const [fontSize, setFontSize] = useState(getInitialFontSize());

  useEffect(() => {
    // Apply saved font size on mount
    const savedFontSize = localStorage.getItem('accessibilityFontSize');
    if (savedFontSize) {
      const size = parseInt(savedFontSize, 10);
      if (size >= 12 && size <= 24) {
        document.documentElement.style.fontSize = `${size}px`;
      }
    } else {
      // Set default if nothing is saved
      document.documentElement.style.fontSize = '16px';
    }
  }, []);

  const increaseFontSize = () => {
    const newSize = Math.min(fontSize + 2, 24);
    setFontSize(newSize);
    document.documentElement.style.fontSize = `${newSize}px`;
    localStorage.setItem('accessibilityFontSize', newSize.toString());
  };

  const decreaseFontSize = () => {
    const newSize = Math.max(fontSize - 2, 12);
    setFontSize(newSize);
    document.documentElement.style.fontSize = `${newSize}px`;
    localStorage.setItem('accessibilityFontSize', newSize.toString());
  };

  const isIncreaseDisabled = fontSize >= 24;
  const isDecreaseDisabled = fontSize <= 12;

  return (
    <div className="d-flex align-items-center gap-1">
      <button
        className="btn btn-sm border d-flex align-items-center"
        onClick={decreaseFontSize}
        disabled={isDecreaseDisabled}
        aria-label="Decrease text size"
        title="Decrease text size"
        style={{
          minWidth: '36px',
          height: '36px',
          padding: '6px 10px',
          fontSize: '14px',
        }}
      >
        <span style={{ fontWeight: 'bold' }}>A−</span>
      </button>
      <button
        className="btn btn-sm border d-flex align-items-center"
        onClick={increaseFontSize}
        disabled={isIncreaseDisabled}
        aria-label="Increase text size"
        title="Increase text size"
        style={{
          minWidth: '36px',
          height: '36px',
          padding: '6px 10px',
          fontSize: '14px',
        }}
      >
        <span style={{ fontWeight: 'bold' }}>A+</span>
      </button>
    </div>
  );
};

export default TextSizeController;

