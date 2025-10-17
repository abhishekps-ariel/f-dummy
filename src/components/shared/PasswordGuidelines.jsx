import React from 'react';

const PasswordGuidelines = ({ showGuidelines, passwordGuidelines }) => {
  if (!showGuidelines) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '100%',
      left: 0,
      zIndex: 1000,
      marginTop: '8px',
      background: 'white',
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      minWidth: '280px',
      maxWidth: '360px',
      width: '100%'
    }} className="password-guidelines">
      <div style={{ 
        fontWeight: 'bold', 
        marginBottom: '12px',
        color: '#28a745',
        fontSize: '14px'
      }}>
        Password Guidelines
      </div>
      <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
        <div style={{ marginBottom: '6px' }}>
          <span style={{ 
            color: passwordGuidelines.minLength ? '#28a745' : '#dc3545',
            fontWeight: 'bold',
            marginRight: '8px'
          }}>
            {passwordGuidelines.minLength ? '✓' : '✗'}
          </span>
          At least 8 Characters
        </div>
        <div style={{ marginBottom: '6px' }}>
          <span style={{ 
            color: passwordGuidelines.hasUppercase ? '#28a745' : '#dc3545',
            fontWeight: 'bold',
            marginRight: '8px'
          }}>
            {passwordGuidelines.hasUppercase ? '✓' : '✗'}
          </span>
          One uppercase letter
        </div>
        <div style={{ marginBottom: '6px' }}>
          <span style={{ 
            color: passwordGuidelines.hasLowercase ? '#28a745' : '#dc3545',
            fontWeight: 'bold',
            marginRight: '8px'
          }}>
            {passwordGuidelines.hasLowercase ? '✓' : '✗'}
          </span>
          One lowercase letter
        </div>
        <div style={{ marginBottom: '6px' }}>
          <span style={{ 
            color: passwordGuidelines.hasNumber ? '#28a745' : '#dc3545',
            fontWeight: 'bold',
            marginRight: '8px'
          }}>
            {passwordGuidelines.hasNumber ? '✓' : '✗'}
          </span>
          One Numeric value
        </div>
        <div>
          <span style={{ 
            color: passwordGuidelines.hasSpecialChar ? '#28a745' : '#dc3545',
            fontWeight: 'bold',
            marginRight: '8px'
          }}>
            {passwordGuidelines.hasSpecialChar ? '✓' : '✗'}
          </span>
          One Special Character (@#$%^&*)
        </div>
      </div>
    </div>
  );
};

export default PasswordGuidelines;
