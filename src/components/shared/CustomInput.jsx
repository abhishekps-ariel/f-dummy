import React, { memo } from 'react';
import PropTypes from 'prop-types';
import './CustomInput.css';

const CustomInput = memo(({
  type = 'text',
  value,
  onChange,
  placeholder,
  className = '',
  disabled = false,
  onKeyDown,
  onFocus,
  onBlur,
  autoComplete = 'off',
  ...props
}) => {
  return (
    <div className={`custom-input-wrapper ${className}`}>
      <input
        type={type}
        className="custom-input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        autoComplete={autoComplete}
        {...props}
      />
    </div>
  );
});

CustomInput.propTypes = {
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  onKeyDown: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  autoComplete: PropTypes.string,
};

CustomInput.displayName = 'CustomInput';

export default CustomInput;

