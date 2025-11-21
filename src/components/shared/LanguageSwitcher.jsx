import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

const LanguageSwitcher = ({ className = '', variant = 'dropdown', textColor = '' }) => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    // Close Bootstrap dropdown after selection
    const dropdown = document.querySelector('#languageDropdown');
    if (dropdown) {
      const bsDropdown = window.bootstrap?.Dropdown?.getInstance(dropdown);
      if (bsDropdown) {
        bsDropdown.hide();
      }
    }
  };

  const currentLanguage = i18n.language || 'en';

  // Ensure language is set to either 'en' or 'es'
  useEffect(() => {
    if (currentLanguage !== 'en' && currentLanguage !== 'es') {
      i18n.changeLanguage('en');
    }
  }, [currentLanguage, i18n]);

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

  // Dropdown variant
  const buttonStyle = textColor ? { color: textColor } : {};
  const buttonClass = textColor 
    ? "btn btn-sm dropdown-toggle font-sm fw-medium text-white border-0 text-decoration-none p-0" 
    : "btn btn-sm dropdown-toggle border-0 font-xs";

  return (
    <div className={`dropdown ${className}`}>
      <button
        className={buttonClass}
        type="button"
        id="languageDropdown"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        style={buttonStyle}
      >
        <i className="fa-solid fa-globe me-1"></i>
        <span>{currentLanguage === 'es' ? 'Español (ES)' : 'English (US)'}</span>
      </button>
      <ul className="dropdown-menu dropdown-menu-end theme-dropdown" aria-labelledby="languageDropdown">
        <li>
          <a
            className={`dropdown-item ${currentLanguage === 'en' ? 'active' : ''}`}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              changeLanguage('en');
            }}
          >
            English (US)
          </a>
        </li>
        <li>
          <a
            className={`dropdown-item ${currentLanguage === 'es' ? 'active' : ''}`}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              changeLanguage('es');
            }}
          >
            Español (ES)
          </a>
        </li>
      </ul>
    </div>
  );
};

export default LanguageSwitcher;

