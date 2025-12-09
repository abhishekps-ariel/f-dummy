import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout as logoutApi } from '../../services/authService';
import { clearAuthData, getAuthData } from '../../utils/storage';
import { ROUTES } from '../../constants/routerConstants';
import Sidebar from '../../components/shared/Sidebar';
import Header from '../../components/shared/Header';
import './Notifications.css';

const Notifications = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('notifications');
  const [expandedRow, setExpandedRow] = useState(null);

  // Static notification data - will be replaced with API call later
  const [notifications] = useState([
    {
      id: 1,
      subject: 'Petition Submission Confirmation - FP-20251208-022',
      emailAddress: 'john.doe@example.com',
      dateSent: '2024-01-15 10:30 AM',
      propertyAddress: '123 Main Street, Boston, MA 02110',
      loanType: 'Residential Mortgage',
      borrowerNames: 'John Smith, Jane Smith',
      organizationName: 'ABC Mortgage Company',
      link: '/petitions/1234',
      unread: true
    },
    {
      id: 2,
      subject: 'Petition Status Update - FP-20251208-023',
      emailAddress: 'sarah.johnson@example.com',
      dateSent: '2024-01-14 02:15 PM',
      propertyAddress: '456 Oak Avenue, Springfield, MA 01103',
      loanType: 'Commercial Loan',
      borrowerNames: 'Robert Johnson',
      organizationName: 'XYZ Financial Services',
      link: '/petitions/1235',
      unread: true
    },
    {
      id: 3,
      subject: 'Action Required - Additional Documentation Needed - FP-20251208-024',
      emailAddress: 'michael.brown@example.com',
      dateSent: '2024-01-13 09:45 AM',
      propertyAddress: '789 Elm Street, Worcester, MA 01608',
      loanType: 'Residential Mortgage',
      borrowerNames: 'Michael Brown, Lisa Brown',
      organizationName: 'DEF Lending Group',
      link: '/petitions/1236',
      unread: false
    },
    {
      id: 4,
      subject: 'Petition Accepted - FP-20251208-025',
      emailAddress: 'emily.davis@example.com',
      dateSent: '2024-01-12 04:20 PM',
      propertyAddress: '321 Pine Road, Cambridge, MA 02139',
      loanType: 'Residential Mortgage',
      borrowerNames: 'Emily Davis',
      organizationName: 'GHI Mortgage Corp',
      link: '/petitions/1237',
      unread: false
    },
    {
      id: 5,
      subject: 'Petition Submission Confirmation - FP-20251208-026',
      emailAddress: 'david.wilson@example.com',
      dateSent: '2024-01-11 11:00 AM',
      propertyAddress: '654 Maple Drive, Lowell, MA 01852',
      loanType: 'Commercial Loan',
      borrowerNames: 'David Wilson, Susan Wilson',
      organizationName: 'JKL Financial Solutions',
      link: '/petitions/1238',
      unread: false
    },
    {
      id: 6,
      subject: 'Reminder - Petition Review Deadline Approaching - FP-20251208-027',
      emailAddress: 'jennifer.martinez@example.com',
      dateSent: '2024-01-10 03:30 PM',
      propertyAddress: '987 Cedar Lane, Quincy, MA 02169',
      loanType: 'Residential Mortgage',
      borrowerNames: 'Jennifer Martinez',
      organizationName: 'MNO Lending Services',
      link: '/petitions/1239',
      unread: false
    }
  ]);

  const handleLogout = async () => {
    try {
      const { refreshToken } = getAuthData();
      if (refreshToken) {
        await logoutApi(refreshToken);
      }
    } catch (error) {
      // Continue with logout even if API fails
    } finally {
      clearAuthData();
      logout();
      navigate(ROUTES.LOGIN);
    }
  };

  const toggleRowExpansion = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const formatDate = (dateString) => {
    return dateString;
  };

  // Extract and format petition number from subject
  const formatSubjectWithPetitionNumber = (subject) => {
    // Match patterns like FILIR-2024-001234 or FP-20251208-022
    const petitionNumberRegex = /([A-Z]+-\d{4}-\d+|[A-Z]+-\d{8}-\d+)/g;
    const matches = [];
    let lastIndex = 0;
    let match;
    
    // Find all matches and their positions
    while ((match = petitionNumberRegex.exec(subject)) !== null) {
      matches.push({
        text: match[0],
        index: match.index
      });
    }
    
    if (matches.length === 0) {
      return subject;
    }
    
    // Build the formatted subject with styled petition numbers
    const parts = [];
    matches.forEach((match, idx) => {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(subject.substring(lastIndex, match.index));
      }
      
      // Add styled petition number
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
            fontSize: '0.9em',
            letterSpacing: '0.5px',
            display: 'inline-block'
          }}
        >
          {match.text}
        </span>
      );
      
      lastIndex = match.index + match.text.length;
    });
    
    // Add remaining text after last match
    if (lastIndex < subject.length) {
      parts.push(subject.substring(lastIndex));
    }
    
    return parts;
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar 
        activeSection={activeSection}
        onSectionChange={(section) => {
          if (section === 'dashboard') {
            navigate(ROUTES.DASHBOARD);
          } else if (section === 'petitions') {
            navigate(ROUTES.PETITIONS);
          } else if (section === 'form35') {
            navigate(ROUTES.FORM35);
          } else if (section === 'messages') {
            navigate(ROUTES.MESSAGES);
          } else if (section === 'faq') {
            navigate(ROUTES.FAQ);
          } else if (section === 'training') {
            navigate(ROUTES.TRAINING);
          } else if (section === 'notifications') {
            navigate(ROUTES.NOTIFICATIONS);
          }
        }}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="dashboard-main-area container-fluid">
        <Header 
          user={user}
          pageTitle={t("notifications.pageTitle")}
          onLogout={handleLogout}
        />

        {/* Main Notifications Content */}
        <div className="dashboard-content-section">
          <div className="card shadow-custom" style={{ border: 'none', borderRadius: '8px' }}>
            <div className="card-body" style={{ padding: '2rem' }}>
              <div className="mb-4">
                <h2 className="h4 mb-2 fw-bold theme-color">{t("notifications.title")}</h2>
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>{t("notifications.subtitle")}</p>
              </div>

              {/* Desktop Table View */}
              <div className="d-none d-lg-block table-responsive">
                <table className="table table-hover w-100" style={{ borderCollapse: 'separate', borderSpacing: '0' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e9ecef' }}>
                      <th style={{ 
                        width: '50%', 
                        padding: '1rem 1.25rem', 
                        fontWeight: '600', 
                        color: '#495057', 
                        borderBottom: 'none',
                        backgroundColor: '#f8f9fa'
                      }}>
                        {t("notifications.subject")}
                      </th>
                      <th style={{ 
                        width: '30%', 
                        padding: '1rem 1.25rem', 
                        fontWeight: '600', 
                        color: '#495057', 
                        borderBottom: 'none',
                        backgroundColor: '#f8f9fa'
                      }}>
                        {t("notifications.emailAddress")}
                      </th>
                      <th style={{ 
                        width: '20%', 
                        padding: '1rem 1.25rem', 
                        fontWeight: '600', 
                        color: '#495057', 
                        borderBottom: 'none',
                        backgroundColor: '#f8f9fa',
                        textAlign: 'center'
                      }}>
                        {t("notifications.dateSent")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <React.Fragment key={notification.id}>
                          <tr 
                            style={{ 
                              cursor: 'pointer',
                              transition: 'background-color 0.2s ease',
                              borderBottom: '1px solid #f0f0f0',
                              backgroundColor: notification.unread ? '#d1ecf1' : '#ffffff'
                            }}
                            onClick={() => toggleRowExpansion(notification.id)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = notification.unread ? '#bee5eb' : '#f8f9fa';
                            }}
                            onMouseLeave={(e) => {
                              if (expandedRow !== notification.id) {
                                e.currentTarget.style.backgroundColor = notification.unread ? '#d1ecf1' : '#ffffff';
                              }
                            }}
                          >
                            <td style={{ padding: '1rem 1.25rem', borderBottom: 'none' }}>
                              <div className="d-flex align-items-center gap-2">
                                <span 
                                  className={notification.unread ? 'fw-semibold' : ''}
                                  style={{ color: notification.unread ? '#212529' : '#6c757d' }}
                                >
                                  {formatSubjectWithPetitionNumber(notification.subject)}
                                </span>
                                <i 
                                  className={`fas fa-chevron-${expandedRow === notification.id ? 'up' : 'down'} text-muted ms-auto`}
                                  style={{ fontSize: '0.75rem', opacity: 0.6 }}
                                ></i>
                              </div>
                            </td>
                            <td style={{ padding: '1rem 1.25rem', borderBottom: 'none', color: '#6c757d' }}>
                              {notification.emailAddress}
                            </td>
                            <td style={{ padding: '1rem 1.25rem', borderBottom: 'none', color: '#6c757d', textAlign: 'center' }}>
                              {formatDate(notification.dateSent)}
                            </td>
                          </tr>
                          {expandedRow === notification.id && (
                            <tr className="notification-details-row">
                              <td colSpan="3" style={{ padding: '0', borderBottom: '1px solid #e9ecef' }}>
                                <div className="notification-details-content">
                                  <div className="row g-3">
                                    <div className="col-md-6">
                                      <div style={{ marginBottom: '1rem' }}>
                                        <strong style={{ fontSize: '0.875rem', color: '#495057', display: 'block', marginBottom: '0.25rem' }}>
                                          {t("notifications.propertyAddress")}
                                        </strong>
                                        <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                                          {notification.propertyAddress}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="col-md-6">
                                      <div style={{ marginBottom: '1rem' }}>
                                        <strong style={{ fontSize: '0.875rem', color: '#495057', display: 'block', marginBottom: '0.25rem' }}>
                                          {t("notifications.loanType")}
                                        </strong>
                                        <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                                          {notification.loanType}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="col-md-6">
                                      <div style={{ marginBottom: '1rem' }}>
                                        <strong style={{ fontSize: '0.875rem', color: '#495057', display: 'block', marginBottom: '0.25rem' }}>
                                          {t("notifications.borrowerNames")}
                                        </strong>
                                        <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                                          {notification.borrowerNames}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="col-md-6">
                                      <div style={{ marginBottom: '1rem' }}>
                                        <strong style={{ fontSize: '0.875rem', color: '#495057', display: 'block', marginBottom: '0.25rem' }}>
                                          {t("notifications.organizationName")}
                                        </strong>
                                        <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                                          {notification.organizationName}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center py-5">
                          <i className="fa-solid fa-bell-slash fa-3x text-muted mb-3"></i>
                          <p className="text-muted">{t("notifications.noNotifications")}</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="d-lg-none">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className="card mb-3"
                      style={{ 
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'box-shadow 0.2s ease',
                        backgroundColor: notification.unread ? '#d1ecf1' : 'transparent'
                      }}
                      onClick={() => toggleRowExpansion(notification.id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                        e.currentTarget.style.backgroundColor = notification.unread ? '#bee5eb' : '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.backgroundColor = notification.unread ? '#d1ecf1' : 'transparent';
                      }}
                    >
                      <div className="card-body" style={{ padding: '1rem' }}>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="flex-grow-1">
                            <h6 
                              className="mb-2"
                              style={{ 
                                fontWeight: notification.unread ? '600' : '400',
                                color: notification.unread ? '#212529' : '#6c757d',
                                fontSize: '0.9rem',
                                lineHeight: '1.4'
                              }}
                            >
                              {formatSubjectWithPetitionNumber(notification.subject)}
                            </h6>
                          </div>
                          <i 
                            className={`fas fa-chevron-${expandedRow === notification.id ? 'up' : 'down'} text-muted`}
                            style={{ fontSize: '0.75rem', opacity: 0.6, marginLeft: '0.5rem' }}
                          ></i>
                        </div>
                        <div style={{ marginTop: '0.75rem' }}>
                          <small className="text-muted d-block mb-1" style={{ fontSize: '0.8rem' }}>
                            <i className="fas fa-envelope me-1" style={{ width: '14px' }}></i>
                            {notification.emailAddress}
                          </small>
                          <small className="text-muted d-block" style={{ fontSize: '0.8rem' }}>
                            <i className="fas fa-clock me-1" style={{ width: '14px' }}></i>
                            {formatDate(notification.dateSent)}
                          </small>
                        </div>
                        {expandedRow === notification.id && (
                          <div 
                            className="notification-card-details"
                            style={{ 
                              marginTop: '1rem', 
                              paddingTop: '1rem', 
                              borderTop: '1px solid #e9ecef' 
                            }}
                          >
                            <div style={{ marginBottom: '0.75rem' }}>
                              <strong style={{ fontSize: '0.8rem', color: '#495057', display: 'block', marginBottom: '0.25rem' }}>
                                {t("notifications.propertyAddress")}
                              </strong>
                              <span style={{ color: '#6c757d', fontSize: '0.8rem' }}>
                                {notification.propertyAddress}
                              </span>
                            </div>
                            <div style={{ marginBottom: '0.75rem' }}>
                              <strong style={{ fontSize: '0.8rem', color: '#495057', display: 'block', marginBottom: '0.25rem' }}>
                                {t("notifications.loanType")}
                              </strong>
                              <span style={{ color: '#6c757d', fontSize: '0.8rem' }}>
                                {notification.loanType}
                              </span>
                            </div>
                            <div style={{ marginBottom: '0.75rem' }}>
                              <strong style={{ fontSize: '0.8rem', color: '#495057', display: 'block', marginBottom: '0.25rem' }}>
                                {t("notifications.borrowerNames")}
                              </strong>
                              <span style={{ color: '#6c757d', fontSize: '0.8rem' }}>
                                {notification.borrowerNames}
                              </span>
                            </div>
                            <div style={{ marginBottom: '0.75rem' }}>
                              <strong style={{ fontSize: '0.8rem', color: '#495057', display: 'block', marginBottom: '0.25rem' }}>
                                {t("notifications.organizationName")}
                              </strong>
                              <span style={{ color: '#6c757d', fontSize: '0.8rem' }}>
                                {notification.organizationName}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-5">
                    <i className="fa-solid fa-bell-slash fa-3x text-muted mb-3"></i>
                    <p className="text-muted">{t("notifications.noNotifications")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Notifications;

