import React from 'react';
import './CustomInput.css';

const CustomInput = ({
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
};

export default CustomInput;

