import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const TextSizeController = () => {
  // Font size options: Small, Normal, Large
  const fontSizeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'normal', label: 'Normal' },
    { value: 'large', label: 'Large' },
  ];

  // Font size mappings - more significant differences
  const fontSizeMap = {
    small: 12,
    normal: 16,
    large: 22,
  };

  // Initialize with saved text size preference or default to 'normal'
  const getInitialTextSize = () => {
    const savedTextSize = localStorage.getItem('accessibilityTextSize');
    if (savedTextSize && ['small', 'normal', 'large'].includes(savedTextSize)) {
      return savedTextSize;
    }
    return 'normal'; // Default to normal
  };

  const [textSize, setTextSize] = useState(getInitialTextSize());
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  const updatePosition = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  // Update CSS variables based on selected text size
  const updateCSSVariables = (baseSize) => {
    const root = document.documentElement;
    const multiplier = baseSize / 16; // 16px is the default base size
    
    // Update all CSS custom properties for text sizes
    root.style.setProperty('--text-xl', `${36 * multiplier}px`);
    root.style.setProperty('--text-xl-med', `${32 * multiplier}px`);
    root.style.setProperty('--text-lg', `${28 * multiplier}px`);
    root.style.setProperty('--text-lg-med', `${24 * multiplier}px`);
    root.style.setProperty('--text-med', `${20 * multiplier}px`);
    root.style.setProperty('--text-base-med', `${18 * multiplier}px`);
    root.style.setProperty('--text-base', `${16 * multiplier}px`);
    root.style.setProperty('--text-sm', `${14 * multiplier}px`);
    root.style.setProperty('--text-xs', `${12 * multiplier}px`);
  };

  useEffect(() => {
    // Apply saved text size on mount
    const savedTextSize = localStorage.getItem('accessibilityTextSize');
    if (savedTextSize && ['small', 'normal', 'large'].includes(savedTextSize)) {
      const size = fontSizeMap[savedTextSize];
      document.documentElement.style.fontSize = `${size}px`;
      updateCSSVariables(size);
    } else {
      // Set default to normal if nothing is saved
      const defaultSize = fontSizeMap.normal;
      document.documentElement.style.fontSize = `${defaultSize}px`;
      updateCSSVariables(defaultSize);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      updatePosition();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (option) => {
    setTextSize(option.value);
    
    // Apply the selected font size
    const size = fontSizeMap[option.value];
    document.documentElement.style.fontSize = `${size}px`;
    updateCSSVariables(size);
    
    // Save to localStorage
    localStorage.setItem('accessibilityTextSize', option.value);
    // Also update the old key for backward compatibility
    localStorage.setItem('accessibilityFontSize', size.toString());
    
    setIsOpen(false);
  };

  const selectedOption = fontSizeOptions.find(opt => opt.value === textSize);

  const dropdownMenu = isOpen && (
    <div
      ref={menuRef}
      className="text-size-dropdown-menu"
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
        zIndex: 10000,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {fontSizeOptions.map((option) => (
        <div
          key={option.value}
          className={`text-size-dropdown-item ${
            option.value === textSize ? 'selected' : ''
          }`}
          onClick={() => handleSelect(option)}
        >
          {option.label}
        </div>
      ))}
    </div>
  );

  return (
    <div className="text-size-controller" ref={dropdownRef}>
      <button
        className="btn btn-sm border d-flex align-items-center justify-content-center text-size-toggle-btn"
        onClick={handleToggle}
        aria-label={`Text size: ${selectedOption?.label || 'Normal'}`}
        title={`Text size: ${selectedOption?.label || 'Normal'}`}
        style={{
          minWidth: '36px',
          height: '36px',
          padding: '6px 10px',
          fontSize: '14px',
        }}
      >
        <i className="fa-solid fa-text-height"></i>
      </button>
      {createPortal(dropdownMenu, document.body)}
    </div>
  );
};

export default TextSizeController;

