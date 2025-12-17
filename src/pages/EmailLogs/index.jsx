import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout as logoutApi } from '../../services/authService';
import { clearAuthData, getAuthData } from '../../utils/storage';
import { ROUTES } from '../../constants/routerConstants';
import { PAGINATION } from '../../constants/appConstants';
import Sidebar from '../../components/shared/Sidebar';
import Header from '../../components/shared/Header';
import CustomDropdown from '../../components/shared/CustomDropdown';
import '../../components/shared/CustomDropdown.css';
import { getEmailTypesEnum, getEmailHistoryPaged } from '../../services/emailLogService';
import { useDebounce } from '../../hooks/useDebounce';
import { toast } from 'react-toastify';
import './EmailLogs.css';

const EmailLogs = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('emailLogs');

  // State for email logs
  const [emailLogs, setEmailLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [emailTypes, setEmailTypes] = useState([]);
  const [loadingEmailTypes, setLoadingEmailTypes] = useState(true);
  
  // State for sorting
  const [sortBy, setSortBy] = useState(''); // Default empty means sort by date
  const [sortDescending, setSortDescending] = useState(true);
  
  // State for pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
  });
  
  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Ref to store fetchEmailLogs function
  const fetchEmailLogsRef = useRef();

  // Fetch email types for filter dropdown
  const fetchEmailTypes = useCallback(async () => {
    try {
      setLoadingEmailTypes(true);
      const response = await getEmailTypesEnum();
      if (response.isSuccess && response.data) {
        // Transform API response to dropdown options
        const options = [
          { value: '', label: t('emailLogs.allTypes') }
        ];
        
        response.data.forEach((item) => {
          options.push({
            value: item.name,
            label: item.description || item.name
          });
        });
        
        setEmailTypes(options);
      }
    } catch (err) {
      console.error('Failed to fetch email types:', err);
      toast.error(t('emailLogs.failedFetchEmailTypes'));
    } finally {
      setLoadingEmailTypes(false);
    }
  }, [t]);

  // Handle sort
  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle sort direction if clicking the same column
      setSortDescending(!sortDescending);
    } else {
      // Set new sort column and default to descending
      setSortBy(column);
      setSortDescending(true);
    }
    // Reset to page 1 when sorting changes
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  // Fetch email logs with pagination
  const fetchEmailLogs = useCallback(async (page = 1) => {
    if (!user?.id) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // If sortBy is empty, don't send it (API will sort by date by default)
      const response = await getEmailHistoryPaged({
        pageNumber: page,
        pageSize: pagination.pageSize,
        userId: user.id,
        searchTerm: debouncedSearchTerm.trim() || '',
        type: typeFilter || null,
        sortBy: sortBy || '', // Send empty string if no sortBy (defaults to date)
        sortDescending: sortDescending,
      });

      if (response.isSuccess && response.data) {
        // Handle API response structure
        // The API returns an array of email log objects directly in response.data
        const emailLogsData = Array.isArray(response.data) 
          ? response.data 
          : (response.data?.data || response.data?.items || []);
        
        // Get pagination info from response (might be at root level or nested)
        const totalCount = response.totalCount || response.data?.totalCount || emailLogsData.length;
        const totalPages = response.totalPages || response.data?.totalPages || Math.ceil(totalCount / pagination.pageSize);
        
        setEmailLogs(emailLogsData);
        setPagination((prev) => ({
          ...prev,
          currentPage: page,
          totalPages: totalPages,
          totalCount: totalCount,
        }));
      } else {
        setError(response.message || t('emailLogs.failedFetchEmailLogs'));
        setEmailLogs([]);
      }
    } catch (err) {
      console.error('Failed to fetch email logs:', err);
      setError(err?.message || t('emailLogs.failedFetchEmailLogs'));
      setEmailLogs([]);
      toast.error(t('emailLogs.failedFetchEmailLogs'));
    } finally {
      setLoading(false);
    }
  }, [user?.id, pagination.pageSize, debouncedSearchTerm, typeFilter, sortBy, sortDescending, t]);

  // Store fetchEmailLogs in ref
  useEffect(() => {
    fetchEmailLogsRef.current = fetchEmailLogs;
  }, [fetchEmailLogs]);

  // Initial load: fetch email types
  useEffect(() => {
    fetchEmailTypes();
  }, [fetchEmailTypes]);

  // Fetch email logs when filters or sort change
  useEffect(() => {
    if (user?.id) {
      fetchEmailLogs(1);
    }
  }, [debouncedSearchTerm, typeFilter, sortBy, sortDescending, user?.id]);

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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
    return dateString;
    }
  };

  // Extract and format petition number from subject
  const formatSubjectWithPetitionNumber = (subject) => {
    if (!subject) return '';
    
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

  // Handle page change
  const handlePageChange = (page) => {
    if (fetchEmailLogsRef.current) {
      fetchEmailLogsRef.current(page);
    }
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
          } else if (section === 'emailLogs') {
            navigate(ROUTES.EMAIL_LOGS);
          }
        }}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="dashboard-main-area container-fluid">
        <Header 
          user={user}
          pageTitle={t("emailLogs.pageTitle")}
          onLogout={handleLogout}
        />

        {/* Main Email Logs Content */}
        <div className="dashboard-content-section">
          <div className="shadow-custom bg-white org-search-box">
              <div className="mb-4">
                <h2 className="h4 mb-3 fw-bold theme-color">{t("emailLogs.title")}</h2>
                <p className="text-muted mb-4">{t("emailLogs.subtitle")}</p>
              </div>

              {/* Search and Filter Controls */}
              <div className="mb-4">
                <div className="row g-3">
                  <div className="col-md-6 col-lg-4">
                    <div className="position-relative">
                      <i className="fas fa-search position-absolute" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d', zIndex: 1 }}></i>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={t("emailLogs.searchPlaceholder")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '40px' }}
                      />
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <CustomDropdown
                      name="typeFilter"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      placeholder={t("emailLogs.allTypes")}
                      options={emailTypes}
                      disabled={loadingEmailTypes}
                    />
                  </div>
                  <div className="col-md-12 col-lg-5 d-flex align-items-center">
                    {loading && (
                      <div className="d-flex align-items-center text-muted">
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">{t("emailLogs.loading")}</span>
                        </div>
                        <small>{t("emailLogs.loading")}</small>
                      </div>
                    )}
                    {!loading && pagination.totalCount > 0 && (
                      <small className="text-muted">
                        {t("emailLogs.showingResults", {
                          start: (pagination.currentPage - 1) * pagination.pageSize + 1,
                          end: Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount),
                          total: pagination.totalCount
                        })}
                      </small>
                    )}
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && !loading && (
                <div className="alert alert-danger mb-4" role="alert">
                  <i className="fas fa-exclamation-circle me-2"></i>
                  {error}
                </div>
              )}

              {/* Desktop Table View */}
              <div className="d-none d-lg-block table-responsive petition-table-container">
                <table className="table table-hover w-100 mb-0">
                  <thead className="table-light">
                    <tr>
                      <th
                        style={{ 
                          width: "50%",
                          minWidth: "200px",
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        className="sortable-header"
                        onClick={() => handleSort('subject')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{t("emailLogs.subject")}</span>
                          <span style={{ display: 'flex', flexDirection: 'column', fontSize: '0.7rem', lineHeight: '1' }}>
                            {sortBy === 'subject' ? (
                              <i className={`fas fa-sort-${sortDescending ? 'down' : 'up'}`} style={{ color: '#212529' }}></i>
                            ) : (
                              <>
                                <i className="fas fa-sort-up" style={{ color: '#adb5bd', opacity: 0.5, marginBottom: '-2px' }}></i>
                                <i className="fas fa-sort-down" style={{ color: '#adb5bd', opacity: 0.5 }}></i>
                              </>
                            )}
                          </span>
                        </div>
                      </th>
                      <th
                        style={{ 
                          width: "30%",
                          minWidth: "150px",
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        className="sortable-header"
                        onClick={() => handleSort('email')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{t("emailLogs.emailAddress")}</span>
                          <span style={{ display: 'flex', flexDirection: 'column', fontSize: '0.7rem', lineHeight: '1' }}>
                            {sortBy === 'email' ? (
                              <i className={`fas fa-sort-${sortDescending ? 'down' : 'up'}`} style={{ color: '#212529' }}></i>
                            ) : (
                              <>
                                <i className="fas fa-sort-up" style={{ color: '#adb5bd', opacity: 0.5, marginBottom: '-2px' }}></i>
                                <i className="fas fa-sort-down" style={{ color: '#adb5bd', opacity: 0.5 }}></i>
                              </>
                            )}
                          </span>
                        </div>
                      </th>
                      <th
                        style={{ 
                          width: "20%",
                          minWidth: "120px",
                          cursor: 'pointer',
                          userSelect: 'none',
                          textAlign: 'center'
                        }}
                        className="sortable-header"
                        onClick={() => {
                          // When clicking date, reset to default (empty sortBy = date sort)
                          if (sortBy === '') {
                            setSortDescending(!sortDescending);
                          } else {
                            setSortBy('');
                            setSortDescending(true);
                          }
                          setPagination((prev) => ({ ...prev, currentPage: 1 }));
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          <span>{t("emailLogs.dateSent")}</span>
                          <span style={{ display: 'flex', flexDirection: 'column', fontSize: '0.7rem', lineHeight: '1' }}>
                            {(!sortBy || sortBy === '') ? (
                              <i className={`fas fa-sort-${sortDescending ? 'down' : 'up'}`} style={{ color: '#212529' }}></i>
                            ) : (
                              <>
                                <i className="fas fa-sort-up" style={{ color: '#adb5bd', opacity: 0.5, marginBottom: '-2px' }}></i>
                                <i className="fas fa-sort-down" style={{ color: '#adb5bd', opacity: 0.5 }}></i>
                              </>
                            )}
                          </span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="3" className="text-center py-4">
                          <div
                            className="spinner-border text-primary"
                            role="status"
                          >
                            <span className="visually-hidden">
                              {t("emailLogs.loading")}
                            </span>
                          </div>
                          <p className="mt-2 text-muted">
                            {t("emailLogs.loading")}
                          </p>
                        </td>
                      </tr>
                    ) : emailLogs.length > 0 ? (
                      emailLogs.map((emailLog) => (
                        <tr 
                          key={emailLog.id}
                          className="petition-row"
                          style={{ cursor: 'default' }}
                        >
                          <td>
                            <span className="fw-medium" style={{ color: "#015080" }}>
                              {formatSubjectWithPetitionNumber(emailLog.subject || '')}
                            </span>
                          </td>
                          <td>{emailLog.toEmail || ''}</td>
                          <td className="text-muted" style={{ textAlign: 'center' }}>
                            {formatDate(emailLog.sentTimeUtc)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center py-4">
                          <i
                            className="fa-solid fa-search text-muted mb-2"
                            style={{ fontSize: "2rem" }}
                          ></i>
                          <p className="text-muted mb-0">
                            {t("emailLogs.noEmailLogs")}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="d-lg-none">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">{t("emailLogs.loading")}</span>
                    </div>
                    <p className="mt-2 text-muted">{t("emailLogs.loading")}</p>
                  </div>
                ) : emailLogs.length > 0 ? (
                  emailLogs.map((emailLog) => (
                    <div 
                      key={emailLog.id} 
                      className="card mb-3"
                      style={{ 
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div className="card-body" style={{ padding: '1rem' }}>
                            <h6 
                          className="mb-3 fw-semibold"
                              style={{ 
                            color: '#212529',
                            fontSize: '0.95rem',
                                lineHeight: '1.4'
                              }}
                            >
                          {formatSubjectWithPetitionNumber(emailLog.subject || '')}
                            </h6>
                        <div style={{ marginTop: '0.75rem' }}>
                          <small className="text-muted d-block mb-2" style={{ fontSize: '0.875rem' }}>
                            <i className="fas fa-envelope me-2" style={{ width: '16px', color: '#6c757d' }}></i>
                            {emailLog.toEmail || ''}
                          </small>
                          <small className="text-muted d-block" style={{ fontSize: '0.875rem' }}>
                            <i className="fas fa-clock me-2" style={{ width: '16px', color: '#6c757d' }}></i>
                            {formatDate(emailLog.sentTimeUtc)}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-5">
                    <i className="fa-solid fa-bell-slash fa-3x text-muted mb-3"></i>
                    <p className="text-muted">{t("emailLogs.noEmailLogs")}</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {!loading && pagination.totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <div className="pagination-minimal">
                    <button
                      className={`pagination-btn ${
                        pagination.currentPage === 1 ? "disabled" : ""
                      }`}
                      onClick={() => {
                        if (pagination.currentPage > 1) {
                          handlePageChange(pagination.currentPage - 1);
                        }
                      }}
                      disabled={pagination.currentPage === 1}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M15 18L9 12L15 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="pagination-btn-text d-none d-md-inline">
                        {t("emailLogs.previous")}
                      </span>
                    </button>

                    <div className="pagination-pages">
                      {(() => {
                        const currentPage = pagination.currentPage;
                        const totalPages = pagination.totalPages;
                        const maxVisiblePages = 5;
                        
                        if (totalPages <= maxVisiblePages) {
                          return Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              className={`pagination-page ${
                                page === currentPage ? "active" : ""
                              }`}
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </button>
                          ));
                        }
                        
                        const pages = [];
                        
                        if (currentPage <= 3) {
                          for (let i = 1; i <= 4; i++) {
                            pages.push(i);
                          }
                          pages.push('ellipsis-end');
                          pages.push(totalPages);
                        } else if (currentPage >= totalPages - 2) {
                          pages.push(1);
                          pages.push('ellipsis-start');
                          for (let i = totalPages - 3; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          pages.push(1);
                          pages.push('ellipsis-start');
                          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                            pages.push(i);
                          }
                          pages.push('ellipsis-end');
                          pages.push(totalPages);
                        }
                        
                        return pages.map((page, index) => {
                          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                            return (
                              <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                                ...
                              </span>
                            );
                          }
                          return (
                            <button
                              key={page}
                              className={`pagination-page ${
                                page === currentPage ? "active" : ""
                              }`}
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </button>
                          );
                        });
                      })()}
                    </div>

                    <button
                      className={`pagination-btn ${
                        pagination.currentPage >= pagination.totalPages
                          ? "disabled"
                          : ""
                      }`}
                      onClick={() => {
                        if (pagination.currentPage < pagination.totalPages) {
                          handlePageChange(pagination.currentPage + 1);
                        }
                      }}
                      disabled={
                        pagination.currentPage >= pagination.totalPages
                      }
                    >
                      <span className="pagination-btn-text d-none d-md-inline">
                        {t("emailLogs.next")}
                      </span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M9 18L15 12L9 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
      </main>
    </div>
  );
};

export default EmailLogs;
