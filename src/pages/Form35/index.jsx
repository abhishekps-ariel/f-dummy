import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { logout as logoutApi } from '../../services/authService';
import { clearAuthData, getAuthData } from '../../utils/storage';
import { ROUTES } from '../../constants/routerConstants';
import Sidebar from '../../components/shared/Sidebar';
import Header from '../../components/shared/Header';
import { get35BReportingPeriods, get35BEntityTypes } from '../../services/commonService';
import Form35BAttestationModal from '../../components/Form35B/Form35BAttestationModal';
import { getAllOrganizations, searchOrganizations } from '../../services/organizationService';
import { useDebounce } from '../../hooks/useDebounce';
import form35BService from '../../services/form35BService';
import YearPicker from '../../components/shared/YearPicker';

const Form35 = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('dashboard');
  
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
  const [isCalculatingData, setIsCalculatingData] = useState(false);
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
      } catch (error) {
        console.error('Error fetching reporting periods:', error);
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
      } catch (error) {
        console.error('Error fetching entity types:', error);
      } finally {
        setLoadingEntityTypes(false);
      }
    };

    fetchEntityTypes();
  }, []);

  // Auto-calculate Form 35B data when organization, reporting year, and reporting period are selected
  useEffect(() => {
    const calculateFormData = async () => {
      // Check if all required fields are filled
      if (
        formData.companyOrganizationId &&
        formData.reportingYear &&
        formData.reportingYear.trim() !== '' &&
        formData.reportingPeriod &&
        formData.reportingPeriod.trim() !== ''
      ) {
        // Validate reporting year is a valid number
        const year = parseInt(formData.reportingYear);
        if (isNaN(year)) {
          return; // Don't calculate if year is invalid
        }

        setIsCalculatingData(true);
        try {
          const calculationData = {
            userId: user?.id || null,
            organizationId: formData.companyOrganizationId,
            reportingYear: year,
            reportingPeriodId: formData.reportingPeriod,
          };

          const response = await form35BService.calculateForm35BData(calculationData);

          if (response.isSuccess && response.data) {
            // Map API response to form fields 5-13
            setFormData((prev) => ({
              ...prev,
              borrowersSent35BNotice: response.data.noticeSentCount?.toString() || '0',
              borrowersRespondedWithin30Days: response.data.respondedWithin30Days?.toString() || '0',
              borrowersRequestedModification: response.data.requestedModification?.toString() || '0',
              borrowersRequestedAlternativeToForeclosure: response.data.requestedAlternativeToForeclosure?.toString() || '0',
              borrowersChoseNotToPursueModification: response.data.choseNotToPursueModificationButProceedRTC?.toString() || '0',
              borrowersWaivedRightToCure: response.data.waivedRightToCure?.toString() || '0',
              borrowersDidNotRespondWithin30Days: response.data.didNotRespondWithin30Days?.toString() || '0',
              modificationRequestsFinalized: response.data.loanModFinalized?.toString() || '0',
              modificationRequestsDenied: response.data.loanModDenied?.toString() || '0',
            }));

            // Clear errors for auto-populated fields
            setErrors((prev) => {
              const newErrors = { ...prev };
              delete newErrors.borrowersSent35BNotice;
              delete newErrors.borrowersRespondedWithin30Days;
              delete newErrors.borrowersRequestedModification;
              delete newErrors.borrowersRequestedAlternativeToForeclosure;
              delete newErrors.borrowersChoseNotToPursueModification;
              delete newErrors.borrowersWaivedRightToCure;
              delete newErrors.borrowersDidNotRespondWithin30Days;
              delete newErrors.modificationRequestsFinalized;
              delete newErrors.modificationRequestsDenied;
              return newErrors;
            });
          }
        } catch (error) {
          console.error('Error calculating Form 35B data:', error);
          // Don't show error to user, just log it - user can manually enter values
        } finally {
          setIsCalculatingData(false);
        }
      }
    };

    // Debounce the calculation to avoid too many API calls
    const timeoutId = setTimeout(() => {
      calculateFormData();
    }, 500); // Wait 500ms after user stops changing values

    return () => clearTimeout(timeoutId);
  }, [formData.companyOrganizationId, formData.reportingYear, formData.reportingPeriod]);

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
    } catch (error) {
      console.error('Error loading organizations:', error);
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
        console.error('Error searching organizations:', error);
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
    if (!formData.municipality.trim()) {
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
      } else {
        toast.error(response.msg || t("form35B.failedSubmit"));
      }
    } catch (error) {
      console.error('Error submitting Form 35B:', error);
      const errorMessage = error.response?.data?.message || error.message || t("form35B.errorSubmitting");
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
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

        {/* Main Form 35B Content */}
        <div className="dashboard-content-section">
              <div className="row">
                <div className="col-12">
              {/* Header Card */}
              <div className="card mb-4">
                <div className="card-body">
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
                        minYear={1990}
                      />
                      {errors.reportingYear && (
                        <div className="text-danger small mt-1">{errors.reportingYear}</div>
                      )}
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
                      <input
                        type="text"
                        name="municipality"
                        value={formData.municipality}
                        onChange={handleInputChange}
                        className={`form-control ${errors.municipality ? 'is-invalid' : ''}`}
                      />
                      {errors.municipality && (
                        <div className="invalid-feedback">{errors.municipality}</div>
                      )}
                    </div>

                    {/* Instruction note */}
                    <div className="alert alert-info mb-4" role="alert">
                      <small>
                        {t("form35B.autoPopulatedNote")}
                        {isCalculatingData && (
                          <span className="ms-2">
                            <i className="spinner-border spinner-border-sm me-1"></i>
                            {t("form35B.calculating")}
                          </span>
                        )}
                      </small>
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
      </main>

      {/* Attestation Modal */}
        <Form35BAttestationModal
          isOpen={showAttestationModal}
          onClose={() => !isSubmitting && setShowAttestationModal(false)}
          onConfirm={handleAttestationConfirm}
          user={user}
          isSubmitting={isSubmitting}
        />
    </div>
  );
};

export default Form35;

