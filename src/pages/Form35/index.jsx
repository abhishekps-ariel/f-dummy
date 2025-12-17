import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { logout as logoutApi } from '../../services/authService';
import { clearAuthData, getAuthData, getActiveOrganizationId, getUserRole, getImpersonationState } from '../../utils/storage';
import { ROUTES } from '../../constants/routerConstants';
import { PAGINATION } from '../../constants/appConstants';
import Sidebar from '../../components/shared/Sidebar';
import Header from '../../components/shared/Header';
import { get35BReportingPeriods, get35BEntityTypes } from '../../services/commonService';
import Form35BAttestationModal from '../../components/Form35B/Form35BAttestationModal';
import Form35BViewerModal from '../../components/Form35B/Form35BViewerModal';
import { getAllOrganizations, searchOrganizations } from '../../services/organizationService';
import { useDebounce } from '../../hooks/useDebounce';
import { usePetitions } from '../../hooks/usePetitions';
import form35BService from '../../services/form35BService';
import YearPicker from '../../components/shared/YearPicker';
import MunicipalityMultiSelect from '../../components/shared/MunicipalityMultiSelect';
import CustomDropdown from '../../components/shared/CustomDropdown';
import '../../components/shared/CustomDropdown.css';
import { formatDate } from '../../utils/dateUtils';
import '../../components/shared/MunicipalityMultiSelect.css';

const Form35 = () => {
  const { user, logout, organization: organizationFromAuth } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('form35');
  const { organization } = usePetitions();

  // Helper function to check if user is org admin
  const isOrgAdminUser = (userData) => {
    if (!userData) return false;
    if (userData.isManager === true) return true;
    if (userData.roles && Array.isArray(userData.roles)) {
      return userData.roles.some(
        (role) => role === 'Organization Admin'
      );
    }
    const userRole = getUserRole(userData);
    return userRole === 'Organization Admin';
  };

  // Check if impersonating - when impersonating, always use userId (treat as filer)
  const impersonationState = getImpersonationState();
  const isImpersonating = impersonationState.isImpersonating;
  
  // Determine if user is org admin or filer
  // When impersonating, always treat as filer (use userId) regardless of role
  const isOrgAdmin = isImpersonating ? false : isOrgAdminUser(user);

  // Get organization ID from user object (stored in browser storage) or organization context (for org admins)
  const storedActiveOrganizationId = getActiveOrganizationId();
  const organizationId =
    storedActiveOrganizationId ||
    user?.organizationId ||
    organization?.id ||
    organizationFromAuth?.id ||
    null;

  // Table view state (for org admins)
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("SubmissionDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterReportingYear, setFilterReportingYear] = useState(null); // null by default
  const [filterReportingPeriodId, setFilterReportingPeriodId] = useState(null); // null by default
  const [tableReportingPeriods, setTableReportingPeriods] = useState([]); // For filter dropdown
  const [loadingTableReportingPeriods, setLoadingTableReportingPeriods] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
  });
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [showFormView, setShowFormView] = useState(false); // For org admins to switch to form view
  const fetchSubmissionsRef = useRef();
  
  const [formData, setFormData] = useState({
    companyName: '',
    companyOrganizationId: '',
    entityType: '',
    reportingYear: '',
    reportingPeriod: '',
    municipality: '',
    borrowersSent35BNotice: '',
    borrowersRespondedWithin30Days: '',
    borrowersRequestedModification: '',
    borrowersRequestedAlternativeToForeclosure: '',
    borrowersChoseNotToPursueModification: '',
    borrowersWaivedRightToCure: '',
    borrowersDidNotRespondWithin30Days: '',
    modificationRequestsFinalized: '',
    modificationRequestsDenied: ''
  });

  const [errors, setErrors] = useState({});
  const [reportingPeriods, setReportingPeriods] = useState([]);
  const [loadingReportingPeriods, setLoadingReportingPeriods] = useState(true);
  const [entityTypes, setEntityTypes] = useState([]);
  const [loadingEntityTypes, setLoadingEntityTypes] = useState(true);
  const [showAttestationModal, setShowAttestationModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Organization selection state
  const [organizations, setOrganizations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const orgSearchRef = useRef(null);
  const debouncedSearchQuery = useDebounce(searchTerm, 300);

  // Fetch reporting periods on component mount
  useEffect(() => {
    const fetchReportingPeriods = async () => {
      try {
        setLoadingReportingPeriods(true);
        const response = await get35BReportingPeriods();
        if (response.isSuccess && response.data) {
          setReportingPeriods(response.data);
        }
      } catch {
        // Error fetching reporting periods - non-critical
      } finally {
        setLoadingReportingPeriods(false);
      }
    };

    fetchReportingPeriods();
  }, []);

  // Fetch entity types on component mount
  useEffect(() => {
    const fetchEntityTypes = async () => {
      try {
        setLoadingEntityTypes(true);
        const response = await get35BEntityTypes();
        if (response.isSuccess && response.data) {
          setEntityTypes(response.data);
        }
      } catch {
        // Error fetching entity types - non-critical
      } finally {
        setLoadingEntityTypes(false);
      }
    };

    fetchEntityTypes();
  }, []);


  // Organization selection functions
  const loadAllOrganizations = async () => {
    setIsLoadingOrganizations(true);
    try {
      const response = await getAllOrganizations();
      if (response.isSuccess && Array.isArray(response.data)) {
        setOrganizations(response.data);
      } else {
        setOrganizations([]);
      }
    } catch {
      setOrganizations([]);
    } finally {
      setIsLoadingOrganizations(false);
    }
  };

  // Handle organization search
  useEffect(() => {
    const query = debouncedSearchQuery.trim();
    if (!query) {
      if (showOrgDropdown) {
        loadAllOrganizations();
      }
      return;
    }

    const fetchBySearch = async () => {
      setIsLoadingOrganizations(true);
      try {
        const response = await searchOrganizations(query);
        if (response.isSuccess && Array.isArray(response.data)) {
          setOrganizations(response.data);
        } else {
          setOrganizations([]);
        }
      } catch (error) {
        setOrganizations([]);
      } finally {
        setIsLoadingOrganizations(false);
      }
    };

    fetchBySearch();
  }, [debouncedSearchQuery]);

  // Handle click outside organization dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (orgSearchRef.current && !orgSearchRef.current.contains(event.target)) {
        setShowOrgDropdown(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOrgSearchFocus = () => {
    setShowOrgDropdown(true);
    if (!searchTerm.trim()) {
      loadAllOrganizations();
    }
  };

  const handleOrganizationSelect = (org) => {
    const orgId = org.id || org.organizationId;
    const orgName = org.name || "";
    
    setSelectedOrganization(org);
    setFormData(prev => ({
      ...prev,
      companyName: orgName,
      companyOrganizationId: orgId
    }));
    setShowOrgDropdown(false);
    setSearchTerm("");
    
    // Clear error if exists
    if (errors.companyName) {
      setErrors(prev => ({
        ...prev,
        companyName: ''
      }));
    }
  };

  const handleRemoveOrganization = () => {
    setSelectedOrganization(null);
    setFormData(prev => ({
      ...prev,
      companyName: '',
      companyOrganizationId: ''
    }));
    setShowOrgDropdown(false);
    setSearchTerm("");
  };

  const handleLogout = async () => {
    try {
      // Get refresh token from storage
      const { refreshToken } = getAuthData();
      
      if (refreshToken) {
        // Call logout API
        await logoutApi(refreshToken);
      }
    } catch (error) {
      // Continue with logout even if API fails
    } finally {
      // Always clear local data and redirect
      clearAuthData();
      logout();
      navigate(ROUTES.LOGIN);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.companyName.trim() || !formData.companyOrganizationId) {
      newErrors.companyName = t("form35B.validation.companyNameRequired");
    }
    if (!formData.entityType) {
      newErrors.entityType = t("form35B.validation.entityTypeRequired");
    }
    if (!formData.reportingYear || formData.reportingYear.trim() === '') {
      newErrors.reportingYear = t("form35B.validation.reportingYearRequired");
    }
    if (!formData.reportingPeriod) {
      newErrors.reportingPeriod = t("form35B.validation.reportingPeriodRequired");
    }
    if (!formData.municipality || !formData.municipality.trim()) {
      newErrors.municipality = t("form35B.validation.municipalityRequired");
    }
    
    // Validate numeric fields - they should be numbers or 0
    const numericFields = [
      'borrowersSent35BNotice',
      'borrowersRespondedWithin30Days',
      'borrowersRequestedModification',
      'borrowersRequestedAlternativeToForeclosure',
      'borrowersChoseNotToPursueModification',
      'borrowersWaivedRightToCure',
      'borrowersDidNotRespondWithin30Days',
      'modificationRequestsFinalized',
      'modificationRequestsDenied'
    ];

    numericFields.forEach(field => {
      const value = formData[field];
      if (!value || value.trim() === '') {
        newErrors[field] = t("form35B.validation.fieldRequired");
      } else {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) {
          newErrors[field] = t("form35B.validation.validNumber");
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Show attestation modal before submitting
      setShowAttestationModal(true);
    }
  };

  const handleAttestationConfirm = (attestation) => {
    setShowAttestationModal(false);
    
    // Now submit the form with attestation data
    submitFormWithAttestation(attestation);
  };

  const submitFormWithAttestation = async (attestation) => {
    setIsSubmitting(true);
    try {
      // Map form data to API request format
      const submissionData = {
        // id is optional - only include if updating existing form
        // id: formData.id || undefined,
        organizationId: formData.companyOrganizationId,
        userId: user?.id || null,
        entityTypeId: formData.entityType,
        reportingYear: parseInt(formData.reportingYear) || 0,
        reportingPeriodId: formData.reportingPeriod,
        municipality: formData.municipality || '',
        noticeSentCount: parseInt(formData.borrowersSent35BNotice) || 0,
        respondedWithin30Days: parseInt(formData.borrowersRespondedWithin30Days) || 0,
        requestedModification: parseInt(formData.borrowersRequestedModification) || 0,
        requestedAlternativeToForeclosure: parseInt(formData.borrowersRequestedAlternativeToForeclosure) || 0,
        choseNotToPursueModButProceedRTC: parseInt(formData.borrowersChoseNotToPursueModification) || 0,
        waivedRightToCure: parseInt(formData.borrowersWaivedRightToCure) || 0,
        didNotRespondWithin30Days: parseInt(formData.borrowersDidNotRespondWithin30Days) || 0,
        loanModFinalized: parseInt(formData.modificationRequestsFinalized) || 0,
        loanModDenied: parseInt(formData.modificationRequestsDenied) || 0,
        submitterFirstName: attestation.submitterFirstName,
        submitterLastName: attestation.submitterLastName,
        submitterTitle: attestation.submitterTitle,
        submitterEmail: attestation.submitterEmail,
      };

      const response = await form35BService.submitForm35B(submissionData);

      if (response.isSuccess) {
        toast.success(t("form35B.submitted"));
        
        // Reset form after successful submission
        setFormData({
          companyName: '',
          companyOrganizationId: '',
          entityType: '',
          reportingYear: '',
          reportingPeriod: '',
          municipality: '',
          borrowersSent35BNotice: '',
          borrowersRespondedWithin30Days: '',
          borrowersRequestedModification: '',
          borrowersRequestedAlternativeToForeclosure: '',
          borrowersChoseNotToPursueModification: '',
          borrowersWaivedRightToCure: '',
          borrowersDidNotRespondWithin30Days: '',
          modificationRequestsFinalized: '',
          modificationRequestsDenied: ''
        });
        setErrors({});
        setSelectedOrganization(null);
        
        // If org admin, refresh the table and switch back to table view
        if (isOrgAdmin) {
          setShowFormView(false);
          if (fetchSubmissionsRef.current) {
            setTimeout(() => {
              fetchSubmissionsRef.current(1);
            }, 500);
          }
        }
      } else {
        toast.error(response.msg || t("form35B.failedSubmit"));
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || t("form35B.errorSubmitting");
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch reporting periods for table filters (for org admins)
  useEffect(() => {
    if (isOrgAdmin) {
      const fetchTableReportingPeriods = async () => {
        try {
          setLoadingTableReportingPeriods(true);
          const response = await get35BReportingPeriods();
          if (response.isSuccess && response.data) {
            setTableReportingPeriods(response.data);
          }
        } catch {
          // Error fetching reporting periods - non-critical
        } finally {
          setLoadingTableReportingPeriods(false);
        }
      };

      fetchTableReportingPeriods();
    }
  }, [isOrgAdmin]);

  // Fetch Form 35B submissions (for org admins)
  const fetchSubmissions = useCallback(async (page = 1) => {
    if (isOrgAdmin && !organizationId) {
      return;
    }

    setLoading(true);
    try {
      const paginationParams = {
        organizationId: organizationId,
        reportingYear: filterReportingYear ? parseInt(filterReportingYear) : null, // null by default, not 0
        reportingPeriodId: filterReportingPeriodId || null, // null by default
        pageNumber: page, // Send 1-based page number (default is 1)
        pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
        searchText: searchQuery.trim() || "",
        sortColumn: sortBy,
        sortDirection: sortOrder,
      };

      const response = await form35BService.getForm35BPaged(paginationParams);

      if (response.success) {
        setSubmissions(response.data || []);
        const totalRecords = response.totalRecords ?? 0;
        const pageSize = PAGINATION.DEFAULT_PAGE_SIZE;
        const calculatedTotalPages = totalRecords > 0 ? Math.ceil(totalRecords / pageSize) : 1;
        
        setPagination((prev) => ({
          ...prev,
          currentPage: page,
          totalPages: calculatedTotalPages,
          totalCount: totalRecords,
        }));
      } else {
        toast.error(response.message || t("form35B.table.failedFetch"));
        setSubmissions([]);
      }
    } catch (err) {
      toast.error(err?.message || t("form35B.table.failedFetch"));
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [isOrgAdmin, organizationId, searchQuery, sortBy, sortOrder, filterReportingYear, filterReportingPeriodId, t]);

  // Keep ref updated with latest fetchSubmissions function
  useEffect(() => {
    fetchSubmissionsRef.current = fetchSubmissions;
  }, [fetchSubmissions]);

  // Load initial data when component mounts (for org admins)
  useEffect(() => {
    if (isOrgAdmin && organizationId) {
      if (fetchSubmissionsRef.current) {
        fetchSubmissionsRef.current(1);
      }
    }
  }, [isOrgAdmin, organizationId]);

  // Handle filter changes with debouncing (search query only)
  useEffect(() => {
    if (isOrgAdmin && organizationId) {
      const timeoutId = setTimeout(() => {
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
        if (fetchSubmissionsRef.current) {
          fetchSubmissionsRef.current(1);
        }
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, isOrgAdmin, organizationId]);

  // Handle year and reporting period filter changes (immediate)
  useEffect(() => {
    if (isOrgAdmin && organizationId) {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      if (fetchSubmissionsRef.current) {
        fetchSubmissionsRef.current(1);
      }
    }
  }, [filterReportingYear, filterReportingPeriodId, isOrgAdmin, organizationId]);

  // Handle sorting changes
  useEffect(() => {
    if (isOrgAdmin && organizationId) {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      if (fetchSubmissionsRef.current) {
        fetchSubmissionsRef.current(1);
      }
    }
  }, [sortBy, sortOrder, isOrgAdmin, organizationId]);


  const handleSort = useCallback((field) => {
    if (sortBy === field) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to ascending
      setSortBy(field);
      setSortOrder("asc");
    }
  }, [sortBy, sortOrder]);

  const handleViewSubmission = useCallback((submission) => {
    setSelectedSubmission(submission);
    setShowViewerModal(true);
  }, []);

  // Helper function to get reporting period name by ID
  const getReportingPeriodName = useCallback((reportingPeriodId) => {
    if (!reportingPeriodId || !tableReportingPeriods.length) {
      return null;
    }
    const period = tableReportingPeriods.find(p => p.id === reportingPeriodId);
    return period ? period.name : null;
  }, [tableReportingPeriods]);

  const handleRefresh = useCallback(() => {
    setSearchQuery("");
    setFilterReportingYear(null);
    setFilterReportingPeriodId(null);
    setSortBy("SubmissionDate");
    setSortOrder("desc");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    if (fetchSubmissionsRef.current) {
      fetchSubmissionsRef.current(1);
    }
  }, []);


  // Render table view for org admins, form view for regular users
  const renderTableView = () => (
    <div className="dashboard-content-section">
      <div className="row">
        <div className="col-12">
          <div className="card shadow-custom bg-white">
            {/* Header Section */}
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="font-med mb-0">{t("form35B.table.title")}</h2>
                <div className="d-flex gap-3">
                  <button
                    className="dashboard-btn-create"
                    onClick={() => {
                      setShowFormView(true);
                    }}
                  >
                    <i className="fa-solid fa-plus me-1"></i> {t("form35B.table.newSubmission")}
                  </button>
                  <button
                    className="dashboard-btn-refresh"
                    onClick={handleRefresh}
                    title={t("form35B.table.refresh")}
                  >
                    <i className="fa-solid fa-sync-alt"></i>
                  </button>
                </div>
              </div>

              {/* Search and Filter Controls */}
              <div className="row mb-4 g-3">
                <div className="col-12 col-lg-4">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <i className="fas fa-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 shadow-none"
                      placeholder={t("form35B.table.searchPlaceholder")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-12 col-lg-4">
                  <YearPicker
                    name="filterReportingYear"
                    value={filterReportingYear || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilterReportingYear(value && value.trim() !== "" ? value : null);
                    }}
                    placeholder={t("form35B.table.filterYear")}
                    minYear={2020}
                  />
                </div>
                <div className="col-12 col-lg-4">
                  <CustomDropdown
                    name="filterReportingPeriod"
                    value={filterReportingPeriodId || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilterReportingPeriodId(value && value !== "" ? value : null);
                    }}
                    placeholder={t("form35B.table.filterReportingPeriod")}
                    disabled={loadingTableReportingPeriods}
                    options={[
                      { value: "", label: t("form35B.table.allReportingPeriods") },
                      ...tableReportingPeriods.map((period) => ({
                        value: period.id,
                        label: period.name,
                      })),
                    ]}
                  />
                </div>
              </div>

              {/* Results Summary */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <span className="text-muted small">
                    {(() => {
                      const startIndex =
                        (pagination.currentPage - 1) * pagination.pageSize + 1;
                      const endIndex = Math.min(
                        pagination.currentPage * pagination.pageSize,
                        pagination.totalCount
                      );
                      return t("form35B.table.showingResults", { startIndex, endIndex, totalCount: pagination.totalCount });
                    })()}
                    {loading && <span className="ms-2">({t("form35B.table.loading")})</span>}
                  </span>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="d-none d-lg-block table-responsive">
                <table 
                  className="table w-100 mb-0" 
                  style={{ 
                    borderCollapse: 'separate', 
                    borderSpacing: 0,
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                >
                  <thead>
                    <tr>
                      <th 
                        style={{ 
                          width: '32%', 
                          padding: '1rem 1.25rem', 
                          fontWeight: '600', 
                          color: '#212529',
                          borderBottom: '2px solid #dee2e6',
                          backgroundColor: '#f8f9fa',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        className="sortable-header"
                        onClick={() => handleSort("FullName")}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>{t("form35B.table.submitterName")}</span>
                          <span style={{ marginLeft: '0.5rem', display: 'flex', flexDirection: 'column', fontSize: '0.7rem', lineHeight: '1' }}>
                            {sortBy === "FullName" ? (
                              <i className={`fas fa-sort-${sortOrder === "asc" ? "up" : "down"}`} style={{ color: '#212529' }}></i>
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
                          width: '16%', 
                          padding: '1rem 1.25rem', 
                          fontWeight: '600', 
                          color: '#212529',
                          borderBottom: '2px solid #dee2e6',
                          backgroundColor: '#f8f9fa',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        className="sortable-header"
                        onClick={() => handleSort("ReportingYear")}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>{t("form35B.table.reportingYear")}</span>
                          <span style={{ marginLeft: '0.5rem', display: 'flex', flexDirection: 'column', fontSize: '0.7rem', lineHeight: '1' }}>
                            {sortBy === "ReportingYear" ? (
                              <i className={`fas fa-sort-${sortOrder === "asc" ? "up" : "down"}`} style={{ color: '#212529' }}></i>
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
                          width: '24%', 
                          padding: '1rem 1.25rem', 
                          fontWeight: '600', 
                          color: '#212529',
                          borderBottom: '2px solid #dee2e6',
                          backgroundColor: '#f8f9fa',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        className="sortable-header"
                        onClick={() => handleSort("ReportingPeriod")}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>{t("form35B.table.reportingPeriod")}</span>
                          <span style={{ marginLeft: '0.5rem', display: 'flex', flexDirection: 'column', fontSize: '0.7rem', lineHeight: '1' }}>
                            {sortBy === "ReportingPeriod" ? (
                              <i className={`fas fa-sort-${sortOrder === "asc" ? "up" : "down"}`} style={{ color: '#212529' }}></i>
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
                          width: '24%', 
                          padding: '1rem 1rem 1rem 0.75rem', 
                          fontWeight: '600', 
                          color: '#212529',
                          borderBottom: '2px solid #dee2e6',
                          backgroundColor: '#f8f9fa',
                          textAlign: 'center',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        className="sortable-header"
                        onClick={() => handleSort("SubmissionDate")}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          <span>{t("form35B.table.submissionDate")}</span>
                          <span style={{ display: 'flex', flexDirection: 'column', fontSize: '0.7rem', lineHeight: '1' }}>
                            {sortBy === "SubmissionDate" ? (
                              <i className={`fas fa-sort-${sortOrder === "asc" ? "up" : "down"}`} style={{ color: '#212529' }}></i>
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
                          width: '60px', 
                          padding: '1rem 1rem 1rem 0.25rem', 
                          borderBottom: '2px solid #dee2e6',
                          backgroundColor: '#f8f9fa',
                          textAlign: 'center',
                          fontWeight: '600',
                          color: '#212529'
                        }}
                      >
                        {t("form35B.table.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="text-center py-5">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">{t("form35B.table.loading")}</span>
                          </div>
                          <p className="mt-2 text-muted">{t("form35B.table.loadingSubmissions")}</p>
                        </td>
                      </tr>
                    ) : submissions.length > 0 ? (
                      submissions.map((submission) => {
                        const fullName = submission.submitterFirstName && submission.submitterLastName
                          ? `${submission.submitterFirstName} ${submission.submitterLastName}`
                          : t("common.nA");
                        return (
                          <tr 
                            key={submission.id}
                            className="petition-row"
                            style={{ cursor: 'default' }}
                          >
                            <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle', borderBottom: '1px solid #dee2e6' }}>
                              <span style={{ color: '#212529', fontSize: '0.95rem' }}>
                                {fullName}
                              </span>
                            </td>
                            <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle', borderBottom: '1px solid #dee2e6', color: '#495057' }}>
                              {submission.reportingYear || t("common.nA")}
                            </td>
                            <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle', borderBottom: '1px solid #dee2e6', color: '#495057' }}>
                              {getReportingPeriodName(submission.reportingPeriodId) || submission.reportingPeriodName || t("common.nA")}
                            </td>
                            <td style={{ padding: '1rem 1rem 1rem 0.75rem', verticalAlign: 'middle', borderBottom: '1px solid #dee2e6', color: '#495057', textAlign: 'center' }}>
                              {submission.createdDate ? formatDate(submission.createdDate) : t("common.nA")}
                            </td>
                            <td style={{ padding: '1rem 1rem 1rem 0.25rem', verticalAlign: 'middle', borderBottom: '1px solid #dee2e6', textAlign: 'center', width: '60px' }} onClick={(e) => e.stopPropagation()}>
                              <button
                                className="btn btn-sm border-0"
                                type="button"
                                style={{
                                  background: "transparent",
                                  color: "#6c757d",
                                  padding: '0.25rem 0.5rem',
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewSubmission(submission);
                                }}
                                title={t("form35B.table.view")}
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-5">
                          <i className="fa-solid fa-search fa-3x text-muted mb-3"></i>
                          <p className="text-muted mb-0">{t("form35B.table.noSubmissionsFound")}</p>
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
                      <span className="visually-hidden">{t("form35B.table.loading")}</span>
                    </div>
                    <p className="mt-2 text-muted">{t("form35B.table.loadingSubmissions")}</p>
                  </div>
                ) : submissions.length > 0 ? (
                  submissions.map((submission) => {
                    const fullName = submission.submitterFirstName && submission.submitterLastName
                      ? `${submission.submitterFirstName} ${submission.submitterLastName}`
                      : t("common.nA");
                    return (
                      <div 
                        key={submission.id} 
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
                            {fullName}
                          </h6>
                          <div style={{ marginTop: '0.75rem' }}>
                            <small className="text-muted d-block mb-2" style={{ fontSize: '0.875rem' }}>
                              <i className="fas fa-calendar me-2" style={{ width: '16px', color: '#6c757d' }}></i>
                              {t("form35B.table.reportingYear")}: {submission.reportingYear || t("common.nA")}
                            </small>
                            <small className="text-muted d-block mb-2" style={{ fontSize: '0.875rem' }}>
                              <i className="fas fa-calendar-alt me-2" style={{ width: '16px', color: '#6c757d' }}></i>
                              {t("form35B.table.reportingPeriod")}: {getReportingPeriodName(submission.reportingPeriodId) || submission.reportingPeriodName || t("common.nA")}
                            </small>
                            <small className="text-muted d-block mb-2" style={{ fontSize: '0.875rem' }}>
                              <i className="fas fa-clock me-2" style={{ width: '16px', color: '#6c757d' }}></i>
                              {submission.createdDate ? formatDate(submission.createdDate) : t("common.nA")}
                            </small>
                            <div className="mt-3">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleViewSubmission(submission)}
                              >
                                {t("form35B.table.view")}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-5">
                    <i className="fa-solid fa-search fa-3x text-muted mb-3"></i>
                    <p className="text-muted">{t("form35B.table.noSubmissionsFound")}</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {!loading && pagination.totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <div className="pagination-minimal">
                    <button
                      className={`pagination-btn ${pagination.currentPage === 1 ? "disabled" : ""}`}
                      onClick={() => {
                        if (pagination.currentPage > 1) {
                          if (fetchSubmissionsRef.current) {
                            fetchSubmissionsRef.current(pagination.currentPage - 1);
                          }
                        }
                      }}
                      disabled={pagination.currentPage === 1}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="pagination-btn-text d-none d-md-inline">{t("form35B.table.previous")}</span>
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
                              className={`pagination-page ${page === currentPage ? "active" : ""}`}
                              onClick={() => {
                                if (fetchSubmissionsRef.current) {
                                  fetchSubmissionsRef.current(page);
                                }
                              }}
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
                              <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                            );
                          }
                          return (
                            <button
                              key={page}
                              className={`pagination-page ${page === currentPage ? "active" : ""}`}
                              onClick={() => {
                                if (fetchSubmissionsRef.current) {
                                  fetchSubmissionsRef.current(page);
                                }
                              }}
                            >
                              {page}
                            </button>
                          );
                        });
                      })()}
                    </div>

                    <button
                      className={`pagination-btn ${pagination.currentPage >= pagination.totalPages ? "disabled" : ""}`}
                      onClick={() => {
                        if (pagination.currentPage < pagination.totalPages) {
                          if (fetchSubmissionsRef.current) {
                            fetchSubmissionsRef.current(pagination.currentPage + 1);
                          }
                        }
                      }}
                      disabled={pagination.currentPage >= pagination.totalPages}
                    >
                      <span className="pagination-btn-text d-none d-md-inline">{t("form35B.table.next")}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
          } else if (section === 'emailLogs') {
            navigate(ROUTES.EMAIL_LOGS);
          } else if (section === 'messages') {
            navigate(ROUTES.MESSAGES);
          } else if (section === 'faq') {
            navigate(ROUTES.FAQ);
          } else if (section === 'training') {
            navigate(ROUTES.TRAINING);
          }
        }}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="dashboard-main-area container-fluid">
        <Header 
          user={user}
          pageTitle={t("form35B.title")}
          onLogout={handleLogout}
        />

        {/* Conditionally render table view for org admins or form view for regular users */}
        {isOrgAdmin && !showFormView ? renderTableView() : (
          /* Main Form 35B Content */
          <div className="dashboard-content-section">
              <div className="row">
                <div className="col-12">
              {/* Header Card */}
              <div className="card mb-4">
                <div className="card-body">
                  {isOrgAdmin && showFormView && (
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <button
                        className="btn btn-sm"
                        onClick={() => setShowFormView(false)}
                        style={{
                          background: '#f8f9fa',
                          color: '#495057',
                          border: '1px solid #dee2e6',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#e9ecef';
                          e.currentTarget.style.borderColor = '#adb5bd';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#f8f9fa';
                          e.currentTarget.style.borderColor = '#dee2e6';
                        }}
                      >
                        <i className="fas fa-arrow-left"></i>
                        {t("form35B.table.backToList")}
                      </button>
                    </div>
                  )}
                  <h1 className="h4 mb-2 fw-bold theme-color">{t("form35B.pageTitle")}</h1>
                  <h2 className="h6 text-muted mb-3">
                    {t("form35B.subtitle")}
                  </h2>
                  <hr className="my-3" />
                  
                  <div className="mb-0">
                    <p className="mb-2">
                      {t("form35B.intro1")} <strong>January-June 2022</strong>.
                    </p>
                    <p className="mb-2">
                      {t("form35B.intro2")} <strong>{t("form35B.intro3")}</strong>. {t("form35B.intro4")} <strong>{t("form35B.intro5")}</strong> {t("form35B.intro6")} <strong>{t("form35B.intro7")}</strong> {t("form35B.intro8")}
                    </p>
                    <p className="mb-0">
                      {t("form35B.intro9")} <a href="mailto:35Breporting@mass.gov" className="theme-color"><strong>35Breporting@mass.gov</strong></a>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Card */}
              <div className="card shadow-custom">
                <div className="card-body p-4">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <p className="text-muted small mb-2">
                        {t("form35B.requiredFieldNote")} <span className="text-danger">*</span> {t("form35B.requiredFieldNote2")}
                      </p>
                      <p className="text-muted small mb-3">
                        {t("form35B.numericValueNote")}
                      </p>
                    </div>

                    {/* Company Name - Organization Selection */}
                    <div className="form-group mb-3">
                      <label className="form-label fw-medium">
                        {t("form35B.companyName")} <span className="text-danger">*</span>
                      </label>
                      
                      {selectedOrganization ? (
                        <div className="selected-org-container">
                          <div className="selected-org-badge">
                            <div className="selected-org-icon">
                              <i className="fa-solid fa-building"></i>
                            </div>
                            <div className="selected-org-info">
                              <div className="selected-org-name">
                                {selectedOrganization.name}
                              </div>
                              <div className="selected-org-details">
                                {selectedOrganization.type && (
                                  <span className="selected-org-type">
                                    {selectedOrganization.type}
                                  </span>
                                )}
                                {(selectedOrganization.addressStreet1 ||
                                  selectedOrganization.addressCity ||
                                  selectedOrganization.addressState ||
                                  selectedOrganization.addressZip) && (
                                  <span className="selected-org-address">
                                    {" "}
                                    •{" "}
                                    {`${selectedOrganization.addressStreet1 || ""}${
                                      selectedOrganization.addressStreet2
                                        ? ", " + selectedOrganization.addressStreet2
                                        : ""
                                    }, ${selectedOrganization.addressCity || ""}, ${
                                      selectedOrganization.addressState || ""
                                    } ${selectedOrganization.addressZip || ""}`
                                      .replace(/^,\s*/, "")
                                      .replace(/,\s*$/, "")}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="selected-org-remove"
                              onClick={handleRemoveOrganization}
                              title={t("form35B.removeSelection")}
                            >
                              <i className="fa-solid fa-times"></i>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="search-form-wrapper" ref={orgSearchRef}>
                          <div className="search-input-container">
                            <input
                              className={`form-control ${errors.companyName ? "is-invalid" : ""}`}
                              type="search"
                              placeholder={t("form35B.searchOrganization")}
                              aria-label="Search"
                              value={searchTerm}
                              onChange={(e) => {
                                setSearchTerm(e.target.value);
                                // Keep dropdown open when typing
                                if (!showOrgDropdown) {
                                  setShowOrgDropdown(true);
                                }
                              }}
                              onFocus={handleOrgSearchFocus}
                            />
                            {errors.companyName && (
                              <div className="text-danger small mt-1">
                                {errors.companyName}
                              </div>
                            )}
                          </div>

                          {/* Organization Dropdown */}
                          {showOrgDropdown && (
                            <div className="org-search-dropdown">
                              {isLoadingOrganizations ? (
                                <div className="org-search-loading">
                                  <div
                                    className="spinner-border spinner-border-sm text-primary me-2"
                                    role="status"
                                  >
                                    <span className="visually-hidden">{t("common.loading")}</span>
                                  </div>
                                  <span>{t("form35B.loadingOrganizations")}</span>
                                </div>
                              ) : organizations.length > 0 ? (
                                <div className="org-search-results">
                                  {organizations.map((org) => {
                                    const orgId = org.id || org.organizationId;
                                    const isSelected = orgId === formData.companyOrganizationId;
                                    return (
                                      <div
                                        key={orgId}
                                        className={`org-search-item ${isSelected ? "bg-light" : ""}`}
                                        onClick={() => handleOrganizationSelect(org)}
                                      >
                                        <div className="org-item-name">{org.name}</div>
                                        <div className="org-item-details">
                                          <span className="org-item-type">
                                            <i className="fa-solid fa-building me-1"></i>
                                            {org.type || "N/A"}
                                          </span>
                                          {(org.addressStreet1 ||
                                            org.addressCity ||
                                            org.addressState ||
                                            org.addressZip) && (
                                            <span className="org-item-address ms-3">
                                              <i className="fa-solid fa-location-dot me-1"></i>
                                              {`${org.addressStreet1 || ""}${
                                                org.addressStreet2
                                                  ? ", " + org.addressStreet2
                                                  : ""
                                              }, ${org.addressCity || ""}, ${
                                                org.addressState || ""
                                              } ${org.addressZip || ""}`
                                                .replace(/^,\s*/, "")
                                                .replace(/,\s*$/, "")}
                                            </span>
                                          )}
                                        </div>
                                        {(org.primaryContactName ||
                                          org.primaryContactEmail ||
                                          org.primaryContactPhone) && (
                                          <div className="org-item-contact">
                                            <i className="fa-solid fa-user me-1"></i>
                                            {org.primaryContactName && (
                                              <span>{org.primaryContactName}</span>
                                            )}
                                            {org.primaryContactEmail && (
                                              <span className="ms-2">
                                                {org.primaryContactEmail}
                                              </span>
                                            )}
                                            {org.primaryContactPhone && (
                                              <span className="ms-2">
                                                {org.primaryContactPhone}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="org-search-no-results">
                                  <i className="fa-solid fa-search me-2"></i>
                                  {t("form35B.noOrganizationsFound")}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Entity Type */}
                    <div className="form-group mb-3">
                      <label className="form-label fw-medium">
                        1. {t("form35B.entityType")} <span className="text-danger">*</span>
                      </label>
                      {loadingEntityTypes ? (
                        <div className="text-muted small">{t("form35B.loadingEntityTypes")}</div>
                      ) : (
                        <div className="d-flex flex-column gap-2">
                          {entityTypes.map((entityType) => (
                            <div key={entityType.id} className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                id={`entityType-${entityType.id}`}
                                name="entityType"
                                value={entityType.id}
                                checked={formData.entityType === entityType.id}
                                onChange={handleInputChange}
                              />
                              <label className="form-check-label" htmlFor={`entityType-${entityType.id}`}>
                                {entityType.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                      {errors.entityType && (
                        <div className="text-danger small mt-1">{errors.entityType}</div>
                      )}
                    </div>

                    {/* Reporting Year */}
                    <div className="row">
                      <div className="col-md-6 col-lg-6">
                        <div className="form-group mb-3">
                          <label className="form-label fw-medium">
                            2. {t("form35B.reportingYear")} <span className="text-danger">*</span>
                          </label>
                          <YearPicker
                            name="reportingYear"
                            value={formData.reportingYear}
                            onChange={handleInputChange}
                            placeholder={t("form35B.selectYear")}
                            error={!!errors.reportingYear}
                            minYear={2020}
                          />
                          {errors.reportingYear && (
                            <div className="text-danger small mt-1">{errors.reportingYear}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Reporting Period */}
                    <div className="form-group mb-3">
                      <label className="form-label fw-medium">
                        3. {t("form35B.reportingPeriod")} <span className="text-danger">*</span>
                      </label>
                      {loadingReportingPeriods ? (
                        <div className="text-muted small">{t("form35B.loadingReportingPeriods")}</div>
                      ) : (
                        <div className="d-flex gap-4">
                          {reportingPeriods.map((period) => (
                            <div key={period.id} className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                id={`reportingPeriod-${period.id}`}
                                name="reportingPeriod"
                                value={period.id}
                                checked={formData.reportingPeriod === period.id}
                                onChange={handleInputChange}
                              />
                              <label className="form-check-label" htmlFor={`reportingPeriod-${period.id}`}>
                                {period.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                      {errors.reportingPeriod && (
                        <div className="text-danger small mt-1">{errors.reportingPeriod}</div>
                      )}
                    </div>

                    {/* Municipality */}
                    <div className="form-group mb-4">
                      <label className="form-label fw-medium">
                        {t("form35B.municipality")} <span className="text-danger">*</span>
                      </label>
                      <MunicipalityMultiSelect
                        name="municipality"
                        value={formData.municipality}
                        onChange={handleInputChange}
                        placeholder={t("form35B.municipalityPlaceholder") || "Select municipalities..."}
                        error={!!errors.municipality}
                      />
                      {errors.municipality && (
                        <div className="invalid-feedback d-block">{errors.municipality}</div>
                      )}
                    </div>

                    {/* Question 5 */}
                    <div className="form-group mb-3">
                      <label className="form-label fw-medium">
                        5. {t("form35B.question5")} <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="borrowersSent35BNotice"
                        value={formData.borrowersSent35BNotice}
                        onChange={handleInputChange}
                        className={`form-control ${errors.borrowersSent35BNotice ? 'is-invalid' : ''}`}
                      />
                      {errors.borrowersSent35BNotice && (
                        <div className="invalid-feedback">{errors.borrowersSent35BNotice}</div>
                      )}
                    </div>

                    {/* Question 6 */}
                    <div className="form-group mb-3">
                      <label className="form-label fw-medium">
                        6. {t("form35B.question6")} <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="borrowersRespondedWithin30Days"
                        value={formData.borrowersRespondedWithin30Days}
                        onChange={handleInputChange}
                        className={`form-control ${errors.borrowersRespondedWithin30Days ? 'is-invalid' : ''}`}
                      />
                      {errors.borrowersRespondedWithin30Days && (
                        <div className="invalid-feedback">{errors.borrowersRespondedWithin30Days}</div>
                      )}
                    </div>

                    {/* Question 7 */}
                    <div className="form-group mb-3">
                      <label className="form-label fw-medium">
                        7. {t("form35B.question7")} <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="borrowersRequestedModification"
                        value={formData.borrowersRequestedModification}
                        onChange={handleInputChange}
                        className={`form-control ${errors.borrowersRequestedModification ? 'is-invalid' : ''}`}
                      />
                      {errors.borrowersRequestedModification && (
                        <div className="invalid-feedback">{errors.borrowersRequestedModification}</div>
                      )}
                    </div>

                    {/* Question 8 */}
                    <div className="form-group mb-3">
                      <label className="form-label fw-medium">
                        8. {t("form35B.question8")} <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="borrowersRequestedAlternativeToForeclosure"
                        value={formData.borrowersRequestedAlternativeToForeclosure}
                        onChange={handleInputChange}
                        className={`form-control ${errors.borrowersRequestedAlternativeToForeclosure ? 'is-invalid' : ''}`}
                      />
                      {errors.borrowersRequestedAlternativeToForeclosure && (
                        <div className="invalid-feedback">{errors.borrowersRequestedAlternativeToForeclosure}</div>
                      )}
                    </div>

                    {/* Question 9 */}
                    <div className="form-group mb-3">
                      <label className="form-label fw-medium">
                        9. {t("form35B.question9")} <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="borrowersChoseNotToPursueModification"
                        value={formData.borrowersChoseNotToPursueModification}
                        onChange={handleInputChange}
                        className={`form-control ${errors.borrowersChoseNotToPursueModification ? 'is-invalid' : ''}`}
                      />
                      {errors.borrowersChoseNotToPursueModification && (
                        <div className="invalid-feedback">{errors.borrowersChoseNotToPursueModification}</div>
                      )}
                    </div>

                    {/* Question 10 */}
                    <div className="form-group mb-3">
                      <label className="form-label fw-medium">
                        10. {t("form35B.question10")} <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="borrowersWaivedRightToCure"
                        value={formData.borrowersWaivedRightToCure}
                        onChange={handleInputChange}
                        className={`form-control ${errors.borrowersWaivedRightToCure ? 'is-invalid' : ''}`}
                      />
                      {errors.borrowersWaivedRightToCure && (
                        <div className="invalid-feedback">{errors.borrowersWaivedRightToCure}</div>
                      )}
                    </div>

                    {/* Question 11 */}
                    <div className="form-group mb-3">
                      <label className="form-label fw-medium">
                        11. {t("form35B.question11")} <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="borrowersDidNotRespondWithin30Days"
                        value={formData.borrowersDidNotRespondWithin30Days}
                        onChange={handleInputChange}
                        className={`form-control ${errors.borrowersDidNotRespondWithin30Days ? 'is-invalid' : ''}`}
                      />
                      {errors.borrowersDidNotRespondWithin30Days && (
                        <div className="invalid-feedback">{errors.borrowersDidNotRespondWithin30Days}</div>
                      )}
                    </div>

                    {/* Question 12 */}
                    <div className="form-group mb-3">
                      <label className="form-label fw-medium">
                        12. {t("form35B.question12")} <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="modificationRequestsFinalized"
                        value={formData.modificationRequestsFinalized}
                        onChange={handleInputChange}
                        className={`form-control ${errors.modificationRequestsFinalized ? 'is-invalid' : ''}`}
                      />
                      {errors.modificationRequestsFinalized && (
                        <div className="invalid-feedback">{errors.modificationRequestsFinalized}</div>
                      )}
                    </div>

                    {/* Question 13 */}
                    <div className="form-group mb-4">
                      <label className="form-label fw-medium">
                        13. {t("form35B.question13")} <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="modificationRequestsDenied"
                        value={formData.modificationRequestsDenied}
                        onChange={handleInputChange}
                        className={`form-control ${errors.modificationRequestsDenied ? 'is-invalid' : ''}`}
                      />
                      {errors.modificationRequestsDenied && (
                        <div className="invalid-feedback">{errors.modificationRequestsDenied}</div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="d-flex justify-content-end mt-4">
                      <button type="submit" className="dashboard-btn-create">
                        {t("form35B.submit")}
                      </button>
                  </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </main>

      {/* Attestation Modal */}
      {(!isOrgAdmin || showFormView) && (
        <Form35BAttestationModal
          isOpen={showAttestationModal}
          onClose={() => !isSubmitting && setShowAttestationModal(false)}
          onConfirm={handleAttestationConfirm}
          user={user}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Form 35B Viewer Modal */}
      {isOrgAdmin && (
        <Form35BViewerModal
          isOpen={showViewerModal}
          onClose={() => {
            setShowViewerModal(false);
            setSelectedSubmission(null);
          }}
          formData={selectedSubmission}
          reportingPeriods={tableReportingPeriods}
        />
      )}
    </div>
  );
};

export default Form35;

