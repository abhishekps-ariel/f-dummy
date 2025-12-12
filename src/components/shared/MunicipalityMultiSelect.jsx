import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { getAllMunicipalities } from '../../services/commonService';

const MunicipalityMultiSelect = ({
  value = '',
  onChange,
  name,
  placeholder = 'Select municipalities...',
  disabled = false,
  error = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [municipalities, setMunicipalities] = useState([]);
  const [isLoadingMunicipalities, setIsLoadingMunicipalities] = useState(true);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  // Fetch municipalities from API on component mount
  useEffect(() => {
    const fetchMunicipalities = async () => {
      try {
        setIsLoadingMunicipalities(true);
        const response = await getAllMunicipalities();
        if (response.isSuccess && response.data) {
          // Extract municipality names from API response
          const municipalityNames = response.data
            .map(item => item.name)
            .filter(name => name) // Filter out any null/undefined names
            .sort(); // Sort alphabetically
          setMunicipalities(municipalityNames);
        }
      } catch (error) {
        console.error('Error fetching municipalities:', error);
        setMunicipalities([]);
      } finally {
        setIsLoadingMunicipalities(false);
      }
    };

    fetchMunicipalities();
  }, []);

  // Parse selected municipalities from comma-separated string
  const selectedMunicipalities = value ? value.split(',').map(m => m.trim()).filter(m => m) : [];

  // Filter municipalities based on search term
  const filteredMunicipalities = municipalities.filter(municipality =>
    municipality.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedMunicipalities.includes(municipality)
  );

  // Position is now handled by CSS (relative positioning)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleRemove = (municipality, e) => {
    e.stopPropagation();
    const updated = selectedMunicipalities.filter(m => m !== municipality);
    const newValue = updated.join(',');
    onChange({
      target: {
        name: name,
        value: newValue,
      },
    });
  };

  const handleSelect = (municipality) => {
    const updated = [...selectedMunicipalities, municipality];
    const newValue = updated.join(',');
    onChange({
      target: {
        name: name,
        value: newValue,
      },
    });
    setSearchTerm('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      // Prevent form submission when Enter is pressed in the input
      e.preventDefault();
      e.stopPropagation();
      
      // If there are filtered results and search term exists, select the first one
      if (filteredMunicipalities.length > 0 && searchTerm.trim()) {
        handleSelect(filteredMunicipalities[0]);
      }
      return;
    }
    
    if (e.key === 'Backspace' && searchTerm === '' && selectedMunicipalities.length > 0) {
      // Remove last selected municipality on backspace when input is empty
      e.preventDefault();
      const updated = selectedMunicipalities.slice(0, -1);
      const newValue = updated.join(',');
      onChange({
        target: {
          name: name,
          value: newValue,
        },
      });
    }
  };

  return (
    <div className="municipality-multiselect-wrapper" ref={containerRef}>
      <div
        className={`municipality-multiselect form-control ${className} ${error ? 'is-invalid' : ''} ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''}`}
        onClick={() => !disabled && !isOpen && setIsOpen(true)}
      >
        <div className="municipality-multiselect-container">
          {selectedMunicipalities.map((municipality) => (
            <span key={municipality} className="municipality-tag">
              {municipality}
              {!disabled && (
                <button
                  type="button"
                  className="municipality-tag-remove"
                  onClick={(e) => handleRemove(municipality, e)}
                  aria-label={`Remove ${municipality}`}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            className="municipality-multiselect-input"
            placeholder={selectedMunicipalities.length === 0 ? placeholder : ''}
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            disabled={disabled}
          />
        </div>
      </div>
      {isOpen && (
        <div
          ref={menuRef}
          className="municipality-multiselect-menu"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: '100%',
            zIndex: 1000,
            maxHeight: '300px',
            marginTop: '2px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {isLoadingMunicipalities ? (
            <div className="municipality-multiselect-item no-options">
              Loading municipalities...
            </div>
          ) : filteredMunicipalities.length === 0 ? (
            <div className="municipality-multiselect-item no-options">
              {searchTerm ? 'No municipalities found' : 'No more municipalities available'}
            </div>
          ) : (
            filteredMunicipalities.map((municipality) => (
              <div
                key={municipality}
                className="municipality-multiselect-item"
                onClick={() => handleSelect(municipality)}
              >
                {municipality}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

MunicipalityMultiSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  name: PropTypes.string,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  className: PropTypes.string,
};

export default MunicipalityMultiSelect;
