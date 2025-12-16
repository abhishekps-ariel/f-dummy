import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';

const YearPicker = memo(({
  value,
  onChange,
  placeholder = 'Select Year',
  disabled = false,
  className = '',
  error = false,
  id,
  name,
  minYear = 1990,
  maxYear = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const [currentRange, setCurrentRange] = useState({ start: minYear, end: minYear + 11 });
  const pickerRef = useRef(null);
  const menuRef = useRef(null);

  const currentYear = new Date().getFullYear();
  const maxAllowedYear = maxYear || currentYear;
  const totalYears = maxAllowedYear - minYear + 1;

  // Initialize current range based on selected year or default
  useEffect(() => {
    if (value) {
      const selectedYear = parseInt(value);
      if (!isNaN(selectedYear)) {
        const rangeStart = Math.floor((selectedYear - minYear) / 12) * 12 + minYear;
        const rangeEnd = Math.min(rangeStart + 11, maxAllowedYear);
        setCurrentRange({ start: rangeStart, end: rangeEnd });
      }
    } else {
      // Default to showing current year range
      const rangeStart = Math.floor((Math.min(maxAllowedYear, currentYear) - minYear) / 12) * 12 + minYear;
      const rangeEnd = Math.min(rangeStart + 11, maxAllowedYear);
      setCurrentRange({ start: rangeStart, end: rangeEnd });
    }
  }, [value, currentYear, minYear, maxAllowedYear]);

  // Generate years for current range (always 12 years)
  const getYearsForRange = () => {
    const years = [];
    const start = currentRange.start;
    const end = start + 11; // Always 12 years total
    
    for (let year = start; year <= end; year++) {
      // Only include years within valid range
      if (year >= minYear && year <= maxAllowedYear) {
        years.push(year);
      } else {
        years.push(null); // Placeholder for out-of-range years
      }
    }
    return years;
  };

  const updatePosition = useCallback(() => {
    if (pickerRef.current) {
      const rect = pickerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target) &&
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

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      window.addEventListener('scroll', handleScroll, true);
      updatePosition();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, updatePosition]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (year) => {
    onChange({
      target: {
        name: name,
        value: year.toString(),
      },
    });
    setIsOpen(false);
  };

  const handlePrevRange = (e) => {
    e.stopPropagation();
    const newStart = Math.max(minYear, currentRange.start - 12);
    const newEnd = newStart + 11;
    setCurrentRange({ start: newStart, end: newEnd });
  };

  const handleNextRange = (e) => {
    e.stopPropagation();
    const newEnd = Math.min(maxAllowedYear, currentRange.end + 12);
    const newStart = newEnd - 11;
    setCurrentRange({ start: newStart, end: newEnd });
  };

  const canGoPrev = currentRange.start > minYear;
  const canGoNext = currentRange.end < maxAllowedYear;

  const years = getYearsForRange();
  const selectedYear = value ? parseInt(value) : null;

  // Organize years into rows of 3
  const yearRows = [];
  for (let i = 0; i < years.length; i += 3) {
    yearRows.push(years.slice(i, i + 3));
  }

  const yearMenu = isOpen && (
    <div
      ref={menuRef}
      className="year-picker-menu"
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
        zIndex: 10000,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header with navigation */}
      <div className="year-picker-header">
        <button
          type="button"
          className="year-picker-nav-btn"
          onClick={handlePrevRange}
          disabled={!canGoPrev}
          aria-label="Previous year range"
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        <div className="year-picker-range">
          {Math.max(minYear, currentRange.start)} - {Math.min(maxAllowedYear, currentRange.start + 11)}
        </div>
        <button
          type="button"
          className="year-picker-nav-btn"
          onClick={handleNextRange}
          disabled={!canGoNext}
          aria-label="Next year range"
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      {/* Year grid */}
      <div className="year-picker-grid">
        {yearRows.map((row, rowIndex) => (
          <div key={rowIndex} className="year-picker-row">
            {row.map((year, cellIndex) => (
              year !== null ? (
                <button
                  key={year}
                  type="button"
                  className={`year-picker-cell ${selectedYear === year ? 'selected' : ''}`}
                  onClick={() => handleSelect(year)}
                >
                  {year}
                </button>
              ) : (
                <div key={`empty-${rowIndex}-${cellIndex}`} className="year-picker-cell empty"></div>
              )
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div
        ref={pickerRef}
        className={`year-picker-wrapper ${className} ${error ? 'is-invalid' : ''} ${
          disabled ? 'disabled' : ''
        }`}
        onClick={handleToggle}
        id={id}
      >
        <input
          type="text"
          readOnly
          value={value || ''}
          placeholder={placeholder}
          disabled={disabled}
          className={`form-control year-picker-input ${error ? 'is-invalid' : ''}`}
        />
        <span className="year-picker-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            width="16"
            height="16"
          >
            <path
              fillRule="evenodd"
              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </div>
      {createPortal(yearMenu, document.body)}
    </>
  );
});

YearPicker.displayName = 'YearPicker';

export default YearPicker;

