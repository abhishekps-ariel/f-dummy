import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';

const CustomDropdown = memo(({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  disabled = false,
  className = '',
  error = false,
  id,
  name,
  maxMenuHeight,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  const updatePosition = useCallback(() => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
      });
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

    const handleScroll = () => {
      setIsOpen(false);
    };

    const handleResize = () => {
      if (isOpen) {
        updatePosition();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      updatePosition();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, updatePosition]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (option) => {
    onChange({
      target: {
        name: name,
        value: option.value,
      },
    });
    setIsOpen(false);
  };

  const dropdownMenu = isOpen && (
    <div
      ref={menuRef}
      className="custom-dropdown-menu"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
        zIndex: 10000,
        ...(maxMenuHeight && { maxHeight: `${maxMenuHeight}px` }),
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {options.length === 0 ? (
        <div className="custom-dropdown-item no-options">No options available</div>
      ) : (
        options.map((option) => (
          <div
            key={option.value}
            className={`custom-dropdown-item ${
              option.value === value ? 'selected' : ''
            } ${option.disabled ? 'disabled' : ''}`}
            onClick={() => !option.disabled && handleSelect(option)}
          >
            {option.label}
          </div>
        ))
      )}
    </div>
  );

  return (
    <>
      <div
        ref={dropdownRef}
        className={`custom-dropdown ${className} ${error ? 'error' : ''} ${
          disabled ? 'disabled' : ''
        } ${isOpen ? 'open' : ''}`}
        onClick={handleToggle}
        id={id}
      >
        <div className={`custom-dropdown-selected ${selectedOption ? 'has-value' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </div>
        <div className="custom-dropdown-arrow">
          <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
        </div>
      </div>
      {createPortal(dropdownMenu, document.body)}
    </>
  );
});

CustomDropdown.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      disabled: PropTypes.bool,
    })
  ),
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  error: PropTypes.bool,
  id: PropTypes.string,
  name: PropTypes.string,
  maxMenuHeight: PropTypes.number,
};

CustomDropdown.displayName = 'CustomDropdown';

export default CustomDropdown;

