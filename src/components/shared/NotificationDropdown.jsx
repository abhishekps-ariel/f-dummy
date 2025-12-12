import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../constants/routerConstants';
import './NotificationDropdown.css';

const NotificationDropdown = () => {
  const { t } = useTranslation();
  
  // Static notification data - will be replaced with API call later
  const [notifications] = useState([
    {
      id: 1,
      subject: 'Petition Submission Confirmation - FP-20251208-022',
      time: '2 hours ago',
      unread: true,
      type: 'petition_submitted'
    },
    {
      id: 2,
      subject: 'Petition Status Update - FP-20251208-023',
      time: '5 hours ago',
      unread: true,
      type: 'status_update'
    },
    {
      id: 3,
      subject: 'Action Required - Additional Documentation Needed - FP-20251208-024',
      time: '1 day ago',
      unread: false,
      type: 'action_required'
    },
    {
      id: 4,
      subject: 'Petition Accepted - FP-20251208-025',
      time: '2 days ago',
      unread: false,
      type: 'petition_accepted'
    },
    {
      id: 5,
      subject: 'Reminder - Petition Review Deadline Approaching - FP-20251208-026',
      time: '3 days ago',
      unread: false,
      type: 'reminder'
    }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'petition_submitted':
        return 'fa-file-contract';
      case 'status_update':
        return 'fa-info-circle';
      case 'action_required':
        return 'fa-exclamation-triangle';
      case 'petition_accepted':
        return 'fa-check-circle';
      case 'reminder':
        return 'fa-clock';
      default:
        return 'fa-bell';
    }
  };

  // Extract and format petition number from subject
  const formatSubjectWithPetitionNumber = (subject) => {
    const petitionNumberRegex = /([A-Z]+-\d{4}-\d+|[A-Z]+-\d{8}-\d+)/g;
    const matches = [];
    let lastIndex = 0;
    let match;
    
    while ((match = petitionNumberRegex.exec(subject)) !== null) {
      matches.push({
        text: match[0],
        index: match.index
      });
    }
    
    if (matches.length === 0) {
      return <span>{subject}</span>;
    }
    
    const parts = [];
    matches.forEach((match, idx) => {
      if (match.index > lastIndex) {
        parts.push(subject.substring(lastIndex, match.index));
      }
      
      parts.push(
        <span
          key={`petition-${idx}`}
          style={{
            fontFamily: 'monospace',
            fontWeight: '600',
            color: '#0265A3',
            backgroundColor: '#e7f3f8',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.85em',
            letterSpacing: '0.5px',
            display: 'inline-block'
          }}
        >
          {match.text}
        </span>
      );
      
      lastIndex = match.index + match.text.length;
    });
    
    if (lastIndex < subject.length) {
      parts.push(subject.substring(lastIndex));
    }
    
    return parts;
  };

  return (
    <div className="btn-group">
      <button 
        type="button" 
        className="btn bg-none border-0 shadow-none dashboard-notification new-alert position-relative" 
        data-bs-toggle="dropdown" 
        aria-expanded="false"
        style={{ padding: '0.5rem' }}
      >
        <i className="fa-solid fa-bell" style={{ fontSize: '1.2rem', color: '#6c757d' }}></i>
        {unreadCount > 0 && (
          <span 
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '0.65rem', padding: '0.25em 0.4em' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      <ul 
        className="dropdown-menu dropdown-menu-end theme-dropdown notification-dropdown" 
        style={{ 
          width: '380px',
          maxWidth: '420px',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          padding: 0,
          overflow: 'hidden'
        }}
      >
        <li style={{ padding: 0, margin: 0 }}>
          <div 
            className="d-flex justify-content-between align-items-center"
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: '#0265A3',
              color: '#ffffff',
              borderBottom: '2px solid #015080'
            }}
          >
            <div className="d-flex align-items-center">
              <i className="fa-solid fa-bell me-2" style={{ fontSize: '1rem' }}></i>
              <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                {t("emailLogs.title")}
              </span>
            </div>
            {unreadCount > 0 && (
              <span 
                className="badge"
                style={{ 
                  backgroundColor: '#ffffff',
                  color: '#0265A3',
                  fontSize: '0.75rem',
                  padding: '0.35em 0.65em',
                  fontWeight: '600'
                }}
              >
                {unreadCount} {t("emailLogs.unread")}
              </span>
            )}
          </div>
        </li>
        {notifications.length > 0 ? (
          <>
            <div className="notification-dropdown-scrollable" style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'hidden' }}>
              {notifications.slice(0, 5).map((notification) => (
                <li key={notification.id} style={{ margin: 0, padding: 0 }}>
                  <Link 
                    className="dropdown-item"
                    to={ROUTES.EMAIL_LOGS}
                    style={{ 
                      padding: '1rem 1.25rem',
                      backgroundColor: notification.unread ? '#f0f7ff' : '#ffffff',
                      borderBottom: '1px solid #f0f0f0',
                      transition: 'background-color 0.2s ease',
                      textDecoration: 'none',
                      display: 'block',
                      width: '100%',
                      boxSizing: 'border-box',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = notification.unread ? '#e0f0ff' : '#f8f9fa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = notification.unread ? '#f0f7ff' : '#ffffff';
                    }}
                  >
                    <div className="d-flex align-items-start" style={{ gap: '0.75rem', width: '100%' }}>
                      <div 
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          backgroundColor: notification.unread ? '#d1ecf1' : '#f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <i 
                          className={`fa-solid ${getNotificationIcon(notification.type)}`}
                          style={{ 
                            color: notification.unread ? '#0265A3' : '#6c757d',
                            fontSize: '0.9rem'
                          }}
                        ></i>
                      </div>
                      <div 
                        style={{ 
                          flex: 1,
                          minWidth: 0,
                          overflow: 'hidden',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word'
                        }}
                      >
                        <div 
                          className={notification.unread ? 'fw-semibold' : ''}
                          style={{ 
                            lineHeight: '1.4',
                            fontSize: '0.875rem',
                            color: notification.unread ? '#212529' : '#6c757d',
                            marginBottom: '0.25rem',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'normal'
                          }}
                        >
                          {formatSubjectWithPetitionNumber(notification.subject)}
                        </div>
                        <small 
                          className="text-muted d-block"
                          style={{ 
                            fontSize: '0.75rem',
                            color: '#6c757d',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {notification.time}
                        </small>
                      </div>
              </div>
                  </Link>
          </li>
        ))}
            </div>
            <li style={{ margin: 0, padding: 0 }}>
              <hr className="dropdown-divider my-0" style={{ margin: 0 }} />
            </li>
            <li style={{ margin: 0, padding: 0 }}>
              <Link 
                className="dropdown-item d-flex justify-content-center align-items-center fw-semibold" 
                to={ROUTES.EMAIL_LOGS}
                style={{ 
                  padding: '0.875rem 1.25rem',
                  backgroundColor: '#f8f9fa',
                  color: '#0265A3',
                  textDecoration: 'none',
                  transition: 'background-color 0.2s ease',
                  fontSize: '0.875rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e9ecef';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }}
              >
                <span>{t("emailLogs.viewAll")}</span>
                <i className="fa-solid fa-arrow-right ms-2" style={{ fontSize: '0.75rem' }}></i>
              </Link>
            </li>
          </>
        ) : (
          <li style={{ margin: 0, padding: 0 }}>
            <div 
              className="text-center text-muted" 
              style={{ 
                padding: '2.5rem 1.5rem',
                backgroundColor: '#ffffff'
              }}
            >
              <i className="fa-solid fa-bell-slash mb-3" style={{ fontSize: '2rem', opacity: 0.5 }}></i>
              <p className="mb-0 small" style={{ color: '#6c757d' }}>
                {t("emailLogs.noEmailLogs")}
              </p>
            </div>
        </li>
        )}
      </ul>
    </div>
  );
};

export default NotificationDropdown;
