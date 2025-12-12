import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { VALIDATION } from '../../constants/appConstants';

const PasswordGuidelines = memo(({ showGuidelines, passwordGuidelines }) => {
  const { t } = useTranslation();
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
        {t("passwordGuidelines.title")}
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
          {t("passwordGuidelines.minLength", { count: VALIDATION.MIN_PASSWORD_LENGTH })}
        </div>
        <div style={{ marginBottom: '6px' }}>
          <span style={{ 
            color: passwordGuidelines.hasUppercase ? '#28a745' : '#dc3545',
            fontWeight: 'bold',
            marginRight: '8px'
          }}>
            {passwordGuidelines.hasUppercase ? '✓' : '✗'}
          </span>
          {t("passwordGuidelines.uppercase")}
        </div>
        <div style={{ marginBottom: '6px' }}>
          <span style={{ 
            color: passwordGuidelines.hasLowercase ? '#28a745' : '#dc3545',
            fontWeight: 'bold',
            marginRight: '8px'
          }}>
            {passwordGuidelines.hasLowercase ? '✓' : '✗'}
          </span>
          {t("passwordGuidelines.lowercase")}
        </div>
        <div style={{ marginBottom: '6px' }}>
          <span style={{ 
            color: passwordGuidelines.hasNumber ? '#28a745' : '#dc3545',
            fontWeight: 'bold',
            marginRight: '8px'
          }}>
            {passwordGuidelines.hasNumber ? '✓' : '✗'}
          </span>
          {t("passwordGuidelines.number")}
        </div>
        <div>
          <span style={{ 
            color: passwordGuidelines.hasSpecialChar ? '#28a745' : '#dc3545',
            fontWeight: 'bold',
            marginRight: '8px'
          }}>
            {passwordGuidelines.hasSpecialChar ? '✓' : '✗'}
          </span>
          {t("passwordGuidelines.specialChar")}
        </div>
      </div>
    </div>
  );
});

PasswordGuidelines.displayName = 'PasswordGuidelines';

export default PasswordGuidelines;
