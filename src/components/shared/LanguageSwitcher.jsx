import { useTranslation } from 'react-i18next';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

const LanguageSwitcher = ({ className = '', variant = 'dropdown', textColor = '' }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  const currentLanguage = i18n.language || 'en';

  // Ensure language is set to either 'en' or 'es'
  useEffect(() => {
    if (currentLanguage !== 'en' && currentLanguage !== 'es') {
      i18n.changeLanguage('en');
    }
  }, [currentLanguage, i18n]);

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

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  const languageOptions = [
    { value: 'en', label: 'English (US)' },
    { value: 'es', label: 'Español (ES)' },
  ];

  const selectedLanguage = languageOptions.find(opt => opt.value === currentLanguage);

  if (variant === 'simple') {
    return (
      <div className={className}>
        <button
          className={`btn btn-sm ${currentLanguage === 'en' ? 'active' : ''}`}
          onClick={() => changeLanguage('en')}
          style={{
            marginRight: '5px',
            fontWeight: currentLanguage === 'en' ? 'bold' : 'normal'
          }}
        >
          EN
        </button>
        <button
          className={`btn btn-sm ${currentLanguage === 'es' ? 'active' : ''}`}
          onClick={() => changeLanguage('es')}
          style={{
            fontWeight: currentLanguage === 'es' ? 'bold' : 'normal'
          }}
        >
          ES
        </button>
      </div>
    );
  }

  // Dropdown variant - match accessibility controls style
  const dropdownMenu = isOpen && (
    <div
      ref={menuRef}
      className="text-size-dropdown-menu language-dropdown-menu"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${Math.max(position.width, 140)}px`,
        zIndex: 10000,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {languageOptions.map((option) => (
        <div
          key={option.value}
          className={`text-size-dropdown-item ${
            option.value === currentLanguage ? 'selected' : ''
          }`}
          onClick={() => changeLanguage(option.value)}
        >
          {option.label}
        </div>
      ))}
    </div>
  );

  // For white text variant (used in home header)
  if (textColor === 'white') {
    return (
      <div className={`language-switcher ${className}`} ref={dropdownRef}>
        <button
          className="btn btn-sm dropdown-toggle font-sm fw-medium text-white border-0 text-decoration-none p-0"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={`Language: ${selectedLanguage?.label || 'English (US)'}`}
          title={`Language: ${selectedLanguage?.label || 'English (US)'}`}
        >
          <i className="fa-solid fa-globe me-1"></i>
          <span>{selectedLanguage?.label || 'English (US)'}</span>
        </button>
        {createPortal(dropdownMenu, document.body)}
      </div>
    );
  }

  // Default variant - match accessibility controls button style
  return (
    <div className={`language-switcher ${className}`} ref={dropdownRef}>
      <button
        className="btn btn-sm border d-flex align-items-center justify-content-center gap-1"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Language: ${selectedLanguage?.label || 'English (US)'}`}
        title={`Language: ${selectedLanguage?.label || 'English (US)'}`}
        style={{
          minWidth: '36px',
          height: '36px',
          padding: '6px 10px',
          fontSize: '14px',
        }}
      >
        <i className="fa-solid fa-globe" style={{ fontSize: '12px' }}></i>
        <span style={{ fontSize: '12px', fontWeight: '500' }}>
          {currentLanguage === 'es' ? 'ES' : 'EN'}
        </span>
      </button>
      {createPortal(dropdownMenu, document.body)}
    </div>
  );
};

export default LanguageSwitcher;

