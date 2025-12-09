import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PAGINATION } from "../../constants/appConstants";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PetitionSteps from "./PetitionSteps";
import TabBar from "./TabBar";
import PetitionTabContent from "./PetitionTabContent";
import { useTabs } from "../../context/TabContext";
import { usePetitions } from "../../hooks/usePetitions";
import petitionApiService from "../../services/petitionApiService";
import CustomDropdown from "../shared/CustomDropdown";
import "../shared/CustomDropdown.css";
import "./TabbedWorkspace.css";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../constants/routerConstants";
import { getActiveOrganizationId, getUserRole } from "../../utils/storage";
import { getStatusValue, getStatusBadgeClass, getSortColumn } from "../../helpers/petitions/petitionStatusUtils";
import { getFromDate, getToDate, formatDateForInput } from "../../utils/dateUtils";
import { exportPetitions } from "../../helpers/petitions/pdfExport";
import { validateUserProfileForPetition } from "../../helpers/petitions/profileValidation";

const ViewAllPetitions = ({ onBack }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [sortBy, setSortBy] = useState("lastUpdated");
  const [sortOrder, setSortOrder] = useState("desc");
  const [exporting, setExporting] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1, // API uses 1-based indexing
    totalPages: 1,
    totalCount: 0,
    pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
  });
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPetitionSteps, setShowPetitionSteps] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [petitionToDelete, setPetitionToDelete] = useState(null);
  
  // Profile validation dialog state
  const [showProfileValidationDialog, setShowProfileValidationDialog] = useState(false);
  const [profileValidationErrors, setProfileValidationErrors] = useState({
    missingFilingEntityType: false,
    missingSignature: false
  });
  const [isValidatingProfile, setIsValidatingProfile] = useState(false);
  
  // Use ref to store fetchPetitions so event listener always has latest version
  const fetchPetitionsRef = useRef();
  // Track if this is the initial mount to avoid running dateFilter useEffect on mount
  const isInitialMount = useRef(true);

  // Get user info from auth context
  const {
    user,
    organization: organizationFromAuth,
  } = useAuth();
  const navigate = useNavigate();

  // Validate user profile before opening petition creation modal
  const validateUserProfileBeforeCreate = async () => {
    setIsValidatingProfile(true);
    try {
      const validation = await validateUserProfileForPetition(user, t);
      
      setIsValidatingProfile(false);

      if (!validation.isValid) {
        if (validation.errorMessage) {
          toast.error(validation.errorMessage);
        }
        setProfileValidationErrors(validation.errors);
        setShowProfileValidationDialog(true);
        return false;
      }

      return true;
    } catch (err) {
      toast.error(err?.message || t("viewAllPetitions.failedValidateProfile"));
      setIsValidatingProfile(false);
      return false;
    }
  };

  // Use the petitions hook
  const { organization } = usePetitions();

  // Use the tabs context (moved before handlers that use it)
  const { tabs, setTabs, activeTabId, setActiveTabId, getActiveTab, openTab } =
    useTabs();

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

  // Determine if user is org admin or filer
  const isOrgAdmin = isOrgAdminUser(user);

  // Get organization ID from user object (stored in browser storage) or organization context (for org admins)
  // Priority: storedActiveOrganizationId > user.organizationId > organization.id
  const storedActiveOrganizationId = getActiveOrganizationId();
  const organizationId =
    storedActiveOrganizationId ||
    user?.organizationId ||
    organization?.id ||
    organizationFromAuth?.id ||
    null;
  
  // For filers, use userId; for org admins, use organizationId
  const userId = user?.id || null;

  // Helper functions are now imported from helpers/petitions/petitionStatusUtils and utils/dateUtils

  // Handle date filter change (memoized)
  const handleDateFilterChange = useCallback((value) => {
    setDateFilter(value);
    setShowCustomDateRange(value === "custom");
    if (value !== "custom") {
      setCustomDateFrom("");
      setCustomDateTo("");
    }
    // Don't trigger fetch here - let useEffect handle it after state update
  }, []);

  // Fetch petitions using paged API (memoized)
  const fetchPetitions = useCallback(async (page = 1) => {
    // For filers, check userId; for org admins, check organizationId
    if ((isOrgAdmin && !organizationId) || (!isOrgAdmin && !userId)) {
      return;
    }

    setLoading(true);
    try {
      const paginationParams = {
        pageNumber: page, // Use 1-based pagination as expected by API
        pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
        searchText: searchQuery.trim() || "",
        status: getStatusValue(statusFilter),
        fromDate: getFromDate(dateFilter, customDateFrom),
        toDate: getToDate(dateFilter, customDateTo),
        sortColumn: getSortColumn(sortBy),
        sortDirection: sortOrder,
      };

      // For filers, send userId; for org admins, send organizationId
      if (isOrgAdmin && organizationId) {
        paginationParams.organizationId = organizationId;
      } else if (!isOrgAdmin && userId) {
        paginationParams.userId = userId;
      }

      const response = await petitionApiService.getPetitionsPaged(
        paginationParams
      );

      if (response.success) {
        const transformedPetitions =
          petitionApiService.transformApiResponseToDisplayFormat(response);
        // Update state - this will trigger a re-render and show the updated table
        setPetitions(transformedPetitions);

        // Update pagination info from API response
        // Use totalRecords from API response, which should be the total count across all pages
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
        toast.error(response.message || t("viewAllPetitions.failedFetchPetitions"));
        setPetitions([]);
      }
    } catch (err) {
      toast.error(err?.message || t("viewAllPetitions.failedFetchPetitions"));
      setPetitions([]);
    } finally {
      setLoading(false);
    }
  }, [isOrgAdmin, organizationId, userId, searchQuery, statusFilter, dateFilter, customDateFrom, customDateTo, sortBy, sortOrder, t]);

  // Keep ref updated with latest fetchPetitions function
  useEffect(() => {
    fetchPetitionsRef.current = fetchPetitions;
  }, [fetchPetitions]);

  // Handle create new petition button click (memoized)
  const handleCreateNewPetition = useCallback(async () => {
    const isValid = await validateUserProfileBeforeCreate();
    if (isValid) {
      setShowPetitionSteps(true);
    }
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    try {
      await petitionApiService.deletePetitionById(petitionToDelete);
      setShowDeleteModal(false);
      setPetitionToDelete(null);

      toast.success(t("viewAllPetitions.petitionDeletedSuccess"));
      setTabs((prevTabs) =>
        prevTabs.filter((tab) => tab.id !== `petition-${petitionToDelete}`)
      );
      const activeTab = getActiveTab?.();
      if (
        activeTab?.type === "petition" &&
        activeTab?.data?.id === petitionToDelete
      ) {
        setActiveTabId("all-petitions");
      }

      if (fetchPetitionsRef.current) {
        fetchPetitionsRef.current(1);
      }
    } catch (error) {
      toast.error(t("viewAllPetitions.failedDeletePetition"));
    }
  }, [petitionToDelete, t, setTabs, getActiveTab, setActiveTabId]);

  // Reset all filters and refresh data (memoized)
  const handleRefresh = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateFilter("all");
    setCustomDateFrom("");
    setCustomDateTo("");
    setShowCustomDateRange(false);
    setSortBy("lastUpdated");
    setSortOrder("desc");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    if (fetchPetitionsRef.current) {
      fetchPetitionsRef.current(1);
    }
  }, []);

  // Handle export functionality
  const handleExport = async (format) => {
    setExporting(true);
    try {
      // Fetch all petitions for export (not just current page) - use totalCount
      const paginationParams = {
        pageNumber: 1,
        pageSize: pagination.totalCount || PAGINATION.MAX_PAGE_SIZE, // Get all records by passing totalCount
        searchText: searchQuery.trim() || "",
        status: getStatusValue(statusFilter),
        fromDate: getFromDate(dateFilter, customDateFrom),
        toDate: getToDate(dateFilter, customDateTo),
        sortColumn: getSortColumn(sortBy),
        sortDirection: sortOrder,
      };

      // For filers, send userId; for org admins, send organizationId
      if (isOrgAdmin && organizationId) {
        paginationParams.organizationId = organizationId;
      } else if (!isOrgAdmin && userId) {
        paginationParams.userId = userId;
      }

      const response = await petitionApiService.getPetitionsPaged(
        paginationParams
      );

      let allPetitions = [];
      if (response.success) {
        const transformedPetitions =
          petitionApiService.transformApiResponseToDisplayFormat(response);
        allPetitions = transformedPetitions || petitions;
      } else {
        // Fallback to current petitions if fetch fails
        allPetitions = petitions;
      }

      await exportPetitions(allPetitions, format, t);
      toast.success(
        t("viewAllPetitions.exportSuccess", { format: format.toUpperCase() })
      );
    } catch (err) {
      const errorMessage = err?.message || t("viewAllPetitions.failedExport");
      toast.error(errorMessage);
    } finally {
      setExporting(false);
    }
  };


  // Load initial data when component mounts
  useEffect(() => {
    // For filers, check userId; for org admins, check organizationId
    if ((isOrgAdmin && organizationId) || (!isOrgAdmin && userId)) {
      if (fetchPetitionsRef.current) {
        fetchPetitionsRef.current(1);
      }
    }
  }, [isOrgAdmin, organizationId, userId]);

  // Handle filter changes with debouncing (excluding custom date fields)
  useEffect(() => {
    // Skip if filters are being reset to defaults (empty search and "all" status)
    // This prevents unnecessary fetches when handleRefresh is called
    if (!organizationId) return;
    
    const timeoutId = setTimeout(() => {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      if (fetchPetitionsRef.current) {
        fetchPetitionsRef.current(1);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, statusFilter]);

  // Handle date filter changes (excluding custom range which requires Apply button)
  useEffect(() => {
    // Skip on initial mount - let the mount useEffect handle initial data load
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Only trigger fetch for non-custom date filters
    // Custom range is handled separately via Apply Filter button
    if (dateFilter !== "custom" && ((isOrgAdmin && organizationId) || (!isOrgAdmin && userId))) {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      if (fetchPetitionsRef.current) {
        fetchPetitionsRef.current(1);
      }
    }
  }, [dateFilter]); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: fetchPetitions uses ref pattern and reads latest state values from closure
  // We only want to trigger when dateFilter changes, not on mount

  // Handle sorting changes
  useEffect(() => {
    if (organizationId) {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      if (fetchPetitionsRef.current) {
        fetchPetitionsRef.current(1);
      }
    }
  }, [sortBy, sortOrder]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close export dropdown when clicking outside
      if (showExportDropdown && !event.target.closest('.dropdown')) {
        setShowExportDropdown(false);
      }
      if (
        openDropdownId &&
        !event.target.closest(".petition-action-expansion")
      ) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdownId, showExportDropdown]);

  // getStatusBadgeClass is now imported from helpers/petitions/petitionStatusUtils

  const handleDeletePetition = useCallback(async (e, petitionId) => {
    e.stopPropagation();
    setOpenDropdownId(null);

    try {
      const confirmDelete = window.confirm(
        t("viewAllPetitions.areYouSureDelete")
      );
      if (!confirmDelete) return;

      await petitionApiService.deletePetitionById(petitionId);
      toast.success(t("viewAllPetitions.petitionDeletedSuccess"));

      if (fetchPetitionsRef.current) {
        fetchPetitionsRef.current(1);
      }
    } catch (error) {
      toast.error(t("viewAllPetitions.failedDeletePetition"));
    }
  }, [t]);

  const handlePetitionClick = useCallback((petition) => {
    openTab(petition);
  }, [openTab]);

  const handlePetitionSubmitted = useCallback(() => {
    // For filers, check userId; for org admins, check organizationId
    if ((isOrgAdmin && !organizationId) || (!isOrgAdmin && !userId)) {
      return;
    }
    
    if (!fetchPetitionsRef.current) return;

    // Give the backend a short moment to finish processing, then refresh once
    setTimeout(() => {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      fetchPetitionsRef.current(1);
    }, 800);
  }, [isOrgAdmin, organizationId, userId]);


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


  // Organization access check is now handled at the page level

  return (
    <div className="petitions-workspace">
      {/* Tab Bar */}
      <TabBar />

      {/* Tab Content */}
      <div className="tab-content-area">
        {(() => {
          const activeTab = getActiveTab();
          if (!activeTab) return null;

          if (activeTab.type === "all-petitions") {
            return (
              <div className="shadow-custom bg-white org-search-box">
                {/* Header Section - Responsive Layout */}
                <div className="petitions-header-section mb-4">
                  {/* Desktop Layout */}
                  <div className="d-none d-md-flex align-items-center justify-content-between">
                    <h2 className="font-med mb-0">{t("viewAllPetitions.title")}</h2>

                    <div className="d-flex gap-3 align-items-center">
                      {/* Create New Petition Button */}
                      <button
                        className="dashboard-btn-create"
                        onClick={handleCreateNewPetition}
                      >
                        <i className="fa-solid fa-plus me-1"></i> {t("viewAllPetitions.createNewPetition")}
                      </button>

                      {/* Export Dropdown */}
                      <div className="dropdown" style={{ position: "relative" }}>
                        <button
                          className={`dashboard-btn-refresh ${showExportDropdown ? 'active' : ''}`}
                          type="button"
                          onClick={() => setShowExportDropdown(!showExportDropdown)}
                          title={t("viewAllPetitions.exportPetitions")}
                          disabled={exporting}
                        >
                          {exporting ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              {t("viewAllPetitions.exporting")}
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-download me-2"></i>
                              {t("viewAllPetitions.export")}
                              <i className={`fas fa-chevron-down ms-2 transition-icon ${showExportDropdown ? 'rotate' : ''}`} style={{ fontSize: "0.7rem" }}></i>
                            </>
                          )}
                        </button>
                        {showExportDropdown && (
                          <div className="edit-options-menu" style={{ right: 0, left: 'auto' }}>
                            <button
                              className="edit-option-item"
                              onClick={() => {
                                handleExport("csv");
                                setShowExportDropdown(false);
                              }}
                              disabled={exporting}
                            >
                              <i className="fas fa-file-csv edit-option-icon"></i>
                              <span>{t("viewAllPetitions.exportCSV")}</span>
                            </button>
                            <button
                              className="edit-option-item"
                              onClick={() => {
                                handleExport("pdf");
                                setShowExportDropdown(false);
                              }}
                              disabled={exporting}
                            >
                              <i className="fas fa-file-pdf edit-option-icon"></i>
                              <span>{t("viewAllPetitions.exportPDF")}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Refresh Button */}
                      <button
                        className="dashboard-btn-refresh"
                        onClick={handleRefresh}
                        title={t("viewAllPetitions.refreshPetitions")}
                      >
                        <i className="fa-solid fa-sync-alt me-2"></i>
                        {t("viewAllPetitions.refresh")}
                      </button>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="d-md-none">
                    <div className="mb-3">
                      <h2 className="font-med mb-0">{t("viewAllPetitions.title")}</h2>
                    </div>

                    <div className="row g-2">
                      <div className="col-8">
                        <button
                          className="dashboard-btn-create w-100"
                          onClick={handleCreateNewPetition}
                        >
                          <i className="fa-solid fa-plus me-1"></i> {t("viewAllPetitions.createNewPetition")}
                        </button>
                      </div>
                      <div className="col-2">
                        <div className="dropdown w-100" style={{ position: "relative" }}>
                          <button
                            className={`dashboard-btn-refresh w-100 mobile-square-btn ${showExportDropdown ? 'active' : ''}`}
                            type="button"
                            onClick={() => setShowExportDropdown(!showExportDropdown)}
                            title={t("viewAllPetitions.exportPetitions")}
                            disabled={exporting}
                          >
                            {exporting ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm"
                                  role="status"
                                  aria-hidden="true"
                                ></span>
                              </>
                            ) : (
                              <>
                                <i className="fa-solid fa-download"></i>
                              </>
                            )}
                          </button>
                          {showExportDropdown && (
                            <div className="edit-options-menu" style={{ right: 0, left: 'auto' }}>
                              <button
                                className="edit-option-item"
                                onClick={() => {
                                  handleExport("csv");
                                  setShowExportDropdown(false);
                                }}
                                disabled={exporting}
                              >
                                <i className="fas fa-file-csv edit-option-icon"></i>
                                <span>{t("viewAllPetitions.exportCSV")}</span>
                              </button>
                              <button
                                className="edit-option-item"
                                onClick={() => {
                                  handleExport("pdf");
                                  setShowExportDropdown(false);
                                }}
                                disabled={exporting}
                              >
                                <i className="fas fa-file-pdf edit-option-icon"></i>
                                <span>{t("viewAllPetitions.exportPDF")}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-2">
                        <button
                          className="dashboard-btn-refresh w-100 mobile-square-btn"
                          onClick={handleRefresh}
                          title={t("viewAllPetitions.refreshPetitions")}
                        >
                          <i className="fa-solid fa-sync-alt"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Search and Filter Controls */}
                <div className="row mb-4 g-3 petitions-filters-row">
                  <div className="col-12 col-lg-4 col-xl-5 petitions-search-column">
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0">
                        <i className="fas fa-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0 shadow-none"
                        placeholder={t("viewAllPetitions.searchPlaceholder")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-12 col-sm-6 col-lg-2 col-xl-2">
                    <CustomDropdown
                      name="statusFilter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      placeholder={t("viewAllPetitions.allStatuses")}
                      options={[
                        { value: "all", label: t("viewAllPetitions.allStatuses") },
                        { value: "draft", label: t("viewAllPetitions.draft") },
                        { value: "submitted", label: t("viewAllPetitions.submitted") },
                        { value: "resubmitted", label: t("viewAllPetitions.resubmitted") },
                        { value: "accepted", label: t("viewAllPetitions.accepted") },
                        { value: "returned", label: t("viewAllPetitions.returned") },
                        { value: "closed", label: t("viewAllPetitions.closed") },
                        { value: "judgmentSubmitted", label: t("viewAllPetitions.judgmentSubmitted") },
                        { value: "foreclosureSaleInitiated", label: t("viewAllPetitions.foreclosureSaleInitiated") },
                      ]}
                    />
                  </div>
                  <div className="col-12 col-sm-6 col-lg-2 col-xl-2">
                    <CustomDropdown
                      name="dateFilter"
                      value={dateFilter}
                      onChange={(e) => handleDateFilterChange(e.target.value)}
                      placeholder={t("viewAllPetitions.allDates")}
                      options={[
                        { value: "all", label: t("viewAllPetitions.allDates") },
                        { value: "today", label: t("viewAllPetitions.today") },
                        { value: "week", label: t("viewAllPetitions.last7Days") },
                        { value: "month", label: t("viewAllPetitions.lastMonth") },
                        { value: "quarter", label: t("viewAllPetitions.last3Months") },
                        { value: "year", label: t("viewAllPetitions.lastYear") },
                        { value: "custom", label: t("viewAllPetitions.customRange") },
                      ]}
                    />
                  </div>
                  <div className="col-12 col-lg-4 col-xl-3">
                    <CustomDropdown
                      name="sortBy"
                      value={`${sortBy}-${sortOrder}`}
                      onChange={(e) => {
                        const [field, order] = e.target.value.split("-");
                        setSortBy(field);
                        setSortOrder(order);
                      }}
                      placeholder={t("viewAllPetitions.sortBy")}
                      options={[
                        { value: "filingDate-desc", label: t("viewAllPetitions.filingDateNewestFirst") },
                        { value: "filingDate-asc", label: t("viewAllPetitions.filingDateOldestFirst") },
                        { value: "lastUpdated-desc", label: t("viewAllPetitions.lastUpdatedMostRecent") },
                        { value: "lastUpdated-asc", label: t("viewAllPetitions.lastUpdatedLeastRecent") },
                        { value: "petitionNumber-asc", label: t("viewAllPetitions.petitionNumberAZ") },
                        { value: "petitionNumber-desc", label: t("viewAllPetitions.petitionNumberZA") },
                      ]}
                    />
                  </div>
                </div>

                {/* Custom Date Range */}
                {showCustomDateRange && (
                  <div className="row mb-4">
                    <div className="col-md-3">
                      <label className="form-label">{t("viewAllPetitions.fromDate")}</label>
                      <input
                        type="date"
                        className="form-control"
                        value={customDateFrom}
                        onChange={(e) => setCustomDateFrom(e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">{t("viewAllPetitions.toDate")}</label>
                      <input
                        type="date"
                        className="form-control"
                        value={customDateTo}
                        onChange={(e) => setCustomDateTo(e.target.value)}
                      />
                    </div>
                    <div className="col-md-3 d-flex align-items-end gap-2 mb-1">
                      <button
                        className="dashboard-btn-create"
                        onClick={() => {
                          setPagination((prev) => ({
                            ...prev,
                            currentPage: 1,
                          }));
                          if (fetchPetitionsRef.current) {
                            fetchPetitionsRef.current(1);
                          }
                        }}
                        disabled={!customDateFrom || !customDateTo}
                      >
                        {t("viewAllPetitions.applyFilter")}
                      </button>
                      <button
                        className="dashboard-btn-refresh"
                        onClick={() => {
                          setDateFilter("all");
                          setShowCustomDateRange(false);
                          setCustomDateFrom("");
                          setCustomDateTo("");
                          setPagination((prev) => ({
                            ...prev,
                            currentPage: 1,
                          }));
                          if (fetchPetitionsRef.current) {
                            fetchPetitionsRef.current(1);
                          }
                        }}
                      >
                        {t("viewAllPetitions.clear")}
                      </button>
                    </div>
                  </div>
                )}

                {/* Results Summary */}
                <div className="d-flex justify-content-between align-items-center mb-3 petitions-results-summary">
                  <div>
                    <span className="text-muted small">
                      {(() => {
                        const startIndex =
                          (pagination.currentPage - 1) * pagination.pageSize +
                          1;
                        const endIndex = Math.min(
                          pagination.currentPage * pagination.pageSize,
                          pagination.totalCount
                        );
                        return t("viewAllPetitions.showingResults", { startIndex, endIndex, totalCount: pagination.totalCount });
                      })()}
                      {loading && <span className="ms-2">({t("viewAllPetitions.loading")})</span>}
                    </span>
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="d-none d-lg-block table-responsive petition-table-container">
                  <table className="table table-hover w-100 mb-0">
                    <thead className="table-light">
                      <tr>
                        <th
                          style={{ width: "20%", minWidth: "160px" }}
                          className="sortable-header"
                          onClick={() => handleSort("id")}
                        >
                          {t("viewAllPetitions.petitionNumber")}
                          {sortBy === "id" && (
                            <i
                              className={`fas fa-sort-${
                                sortOrder === "asc" ? "up" : "down"
                              } ms-1`}
                            ></i>
                          )}
                        </th>
                        <th style={{ width: "25%", minWidth: "200px" }}>
                          {t("viewAllPetitions.propertyAddress")}
                        </th>
                        <th
                          style={{ width: "16%", minWidth: "110px" }}
                          className="sortable-header"
                          onClick={() => handleSort("borrower")}
                        >
                          {t("viewAllPetitions.borrower")}
                          {sortBy === "borrower" && (
                            <i
                              className={`fas fa-sort-${
                                sortOrder === "asc" ? "up" : "down"
                              } ms-1`}
                            ></i>
                          )}
                        </th>
                        <th
                          style={{ width: "15%", minWidth: "180px" }}
                          className="sortable-header"
                          onClick={() => handleSort("status")}
                        >
                          {t("viewAllPetitions.status")}
                          {sortBy === "status" && (
                            <i
                              className={`fas fa-sort-${
                                sortOrder === "asc" ? "up" : "down"
                              } ms-1`}
                            ></i>
                          )}
                        </th>
                        <th
                          style={{ width: "13%", minWidth: "110px" }}
                          className="sortable-header"
                          onClick={() => handleSort("filingDate")}
                        >
                          {t("viewAllPetitions.filingDate")}
                          {sortBy === "filingDate" && (
                            <i
                              className={`fas fa-sort-${
                                sortOrder === "asc" ? "up" : "down"
                              } ms-1`}
                            ></i>
                          )}
                        </th>
                        <th
                          style={{ width: "13%", minWidth: "120px" }}
                          className="sortable-header"
                          onClick={() => handleSort("lastUpdated")}
                        >
                          {t("viewAllPetitions.lastUpdated")}
                          {sortBy === "lastUpdated" && (
                            <i
                              className={`fas fa-sort-${
                                sortOrder === "asc" ? "up" : "down"
                              } ms-1`}
                            ></i>
                          )}
                        </th>
                        <th style={{ width: "40px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="text-center py-4">
                            <div
                              className="spinner-border text-primary"
                              role="status"
                            >
                              <span className="visually-hidden">
                                {t("viewAllPetitions.loading")}
                              </span>
                            </div>
                            <p className="mt-2 text-muted">
                              {t("viewAllPetitions.loadingPetitions")}
                            </p>
                          </td>
                        </tr>
                      ) : petitions.length > 0 ? (
                        petitions.map((petition) => (
                          <tr 
                            key={petition.id} 
                            className="petition-row"
                            onClick={() => handlePetitionClick(petition)}
                            style={{ cursor: "pointer" }}
                          >
                            <td>
                              <span className="fw-medium" style={{ color: "#015080" }}>
                                {petition.petitionNumber}
                              </span>
                            </td>
                            <td>{petition.propertyAddress}</td>
                            <td>{petition.borrower}</td>
                            <td>
                              <span
                                className={getStatusBadgeClass(
                                  petition.status,
                                  petition.statusClass
                                )}
                              >
                                {petition.status === "Foreclosure Sale Initiated" 
                                  ? <>Foreclosure Sale<br />Initiated</>
                                  : petition.status === "Judgment Submitted"
                                  ? <>Judgment<br />Submitted</>
                                  : petition.status}
                              </span>
                            </td>
                            <td>{petition.filingDate}</td>
                            <td className="text-muted">
                              {petition.lastUpdated}
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className="petition-action-expansion">
                                <button
                                  className="btn btn-sm border-0"
                                  type="button"
                                  style={{
                                    background: "transparent",
                                    color: "#6c757d",
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdownId(
                                      openDropdownId === petition.id
                                        ? null
                                        : petition.id
                                    );
                                  }}
                                  title="Actions"
                                >
                                  <i className="fas fa-ellipsis-v"></i>
                                </button>
                                {openDropdownId === petition.id && (
                                  <div className="petition-action-buttons">
                                    <button
                                      className="btn btn-view"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId(null);
                                        handlePetitionClick(petition);
                                      }}
                                    >
                                      View
                                    </button>
                                    <button
                                      className="btn btn-delete"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId(null);
                                        setPetitionToDelete(petition.id);
                                        setShowDeleteModal(true);
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center py-4">
                            <i
                              className="fa-solid fa-search text-muted mb-2"
                              style={{ fontSize: "2rem" }}
                            ></i>
                            <p className="text-muted mb-0">
                              {t("viewAllPetitions.noPetitionsFound")}
                            </p>
                            <small className="text-muted">
                              {t("viewAllPetitions.tryAdjustingFilters")}
                            </small>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="d-lg-none">
                  {loading ? (
                    <div className="text-center py-4">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      >
                        <span className="visually-hidden">{t("viewAllPetitions.loading")}</span>
                      </div>
                      <p className="mt-2 text-muted">{t("viewAllPetitions.loadingPetitions")}</p>
                    </div>
                  ) : petitions.length > 0 ? (
                    <div className="row g-3">
                      {petitions.map((petition) => (
                        <div key={petition.id} className="col-12">
                          <div 
                            className="petition-mobile-card"
                            onClick={() => handlePetitionClick(petition)}
                            style={{ cursor: "pointer" }}
                          >
                            <div className="petition-card-header">
                              <span className="fw-semibold petition-number" style={{ color: "#015080", fontSize: "0.95rem" }}>
                                {petition.petitionNumber}
                              </span>
                              <div 
                                className="petition-action-expansion"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="btn btn-sm border-0 p-1"
                                  type="button"
                                  style={{
                                    background: "transparent",
                                    color: "#6c757d",
                                    minWidth: "auto",
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdownId(
                                      openDropdownId === petition.id
                                        ? null
                                        : petition.id
                                    );
                                  }}
                                  title="Actions"
                                >
                                  <i className="fas fa-ellipsis-v"></i>
                                </button>
                                {openDropdownId === petition.id && (
                                  <div className="petition-action-buttons">
                                    <button
                                      className="btn btn-view"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId(null);
                                        handlePetitionClick(petition);
                                      }}
                                    >
                                      View
                                    </button>
                                    <button
                                      className="btn btn-delete"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId(null);
                                        setPetitionToDelete(petition.id);
                                        setShowDeleteModal(true);
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="petition-card-status">
                              <span
                                className={getStatusBadgeClass(
                                  petition.status,
                                  petition.statusClass
                                )}
                              >
                                {petition.status}
                              </span>
                            </div>
                            <div className="petition-card-body">
                              <div className="petition-card-detail">
                                <i className="fas fa-map-marker-alt text-muted me-2" style={{ fontSize: "0.75rem" }}></i>
                                <span className="small text-muted">{petition.propertyAddress}</span>
                              </div>
                              {petition.borrower && (
                                <div className="petition-card-detail">
                                  <i className="fas fa-user text-muted me-2" style={{ fontSize: "0.75rem" }}></i>
                                  <span className="small text-muted">{petition.borrower}</span>
                                </div>
                              )}
                              <div className="petition-card-detail">
                                <i className="fas fa-calendar text-muted me-2" style={{ fontSize: "0.75rem" }}></i>
                                <span className="small text-muted">{petition.filingDate}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <i
                        className="fa-solid fa-search text-muted mb-3"
                        style={{ fontSize: "2rem" }}
                      ></i>
                      <p className="text-muted mb-0">
                        {t("viewAllPetitions.noPetitionsFound")}
                      </p>
                      <small className="text-muted">
                        {t("viewAllPetitions.tryAdjustingFilters")}
                      </small>
                    </div>
                  )}
                </div>

                {showDeleteModal && (
                  <div
                    className="modal fade show d-block"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1070 }}
                    tabIndex="-1"
                  >
                    <div className="modal-dialog modal-dialog-centered">
                      <div className="modal-content">
                        <div className="modal-header">
                          <h5 className="modal-title">{t("viewAllPetitions.deletePetition")}</h5>
                          <button
                            type="button"
                            className="btn-close"
                            onClick={() => setShowDeleteModal(false)}
                            aria-label={t("common.close")}
                          ></button>
                        </div>

                        <div className="modal-body">
                          <p className="mb-4">
                            {t("viewAllPetitions.areYouSureDelete")}
                          </p>
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              type="button"
                              className="dashboard-btn-refresh"
                              onClick={() => setShowDeleteModal(false)}
                            >
                              {t("viewAllPetitions.cancelButton")}
                            </button>

                            <button
                              type="button"
                              className="dashboard-btn-refresh text-danger"
                              onClick={handleConfirmDelete}
                            >
                              {t("viewAllPetitions.deleteButton")}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pagination */}
                {pagination.totalPages >= 1 && (
                  <div className="d-flex justify-content-center mt-4">
                    <div className="pagination-minimal">
                      <button
                        className={`pagination-btn ${
                          pagination.currentPage === 1 ? "disabled" : ""
                        }`}
                        onClick={() => {
                          if (pagination.currentPage > 1) {
                            if (fetchPetitionsRef.current) {
                              fetchPetitionsRef.current(pagination.currentPage - 1);
                            }
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
                          {t("viewAllPetitions.previous")}
                        </span>
                      </button>

                      <div className="pagination-pages">
                        {(() => {
                          const currentPage = pagination.currentPage;
                          const totalPages = pagination.totalPages;
                          const maxVisiblePages = 5; // Maximum 5 page numbers to show
                          
                          if (totalPages <= maxVisiblePages) {
                            // If total pages is 5 or less, show all pages
                            return Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <button
                                key={page}
                                className={`pagination-page ${
                                  page === currentPage ? "active" : ""
                                }`}
                                onClick={() => {
                                  if (fetchPetitionsRef.current) {
                                    fetchPetitionsRef.current(page);
                                  }
                                }}
                              >
                                {page}
                              </button>
                            ));
                          }
                          
                          // For many pages, show exactly 5 page numbers with ellipsis
                          const pages = [];
                          
                          if (currentPage <= 3) {
                            // Near the beginning: show 1, 2, 3, 4, ... last
                            for (let i = 1; i <= 4; i++) {
                              pages.push(i);
                            }
                            pages.push('ellipsis-end');
                            pages.push(totalPages);
                          } else if (currentPage >= totalPages - 2) {
                            // Near the end: show 1, ... , last-3, last-2, last-1, last
                            pages.push(1);
                            pages.push('ellipsis-start');
                            for (let i = totalPages - 3; i <= totalPages; i++) {
                              pages.push(i);
                            }
                          } else {
                            // In the middle: show 1, ... , current-1, current, current+1, ... last
                            pages.push(1);
                            pages.push('ellipsis-start');
                            // Show current page and 1 page on each side (total 3 pages) to keep total at 5
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
                                onClick={() => {
                                  if (fetchPetitionsRef.current) {
                                    fetchPetitionsRef.current(page);
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
                        className={`pagination-btn ${
                          pagination.currentPage >= pagination.totalPages
                            ? "disabled"
                            : ""
                        }`}
                        onClick={() => {
                          if (pagination.currentPage < pagination.totalPages) {
                            if (fetchPetitionsRef.current) {
                              fetchPetitionsRef.current(pagination.currentPage + 1);
                            }
                          }
                        }}
                        disabled={
                          pagination.currentPage >= pagination.totalPages
                        }
                      >
                        <span className="pagination-btn-text d-none d-md-inline">
                          {t("viewAllPetitions.next")}
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
            );
          } else if (activeTab.type === "petition") {
            return (
              <div className="shadow-custom bg-white org-search-box">
                <PetitionTabContent 
                  petition={activeTab.data} 
                  onPetitionUpdated={handlePetitionSubmitted}
                />
              </div>
            );
          }

          return null;
        })()}
      </div>

      {/* Profile Validation Dialog */}
      {showProfileValidationDialog && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1070 }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t("viewAllPetitions.profileInformationRequired")}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowProfileValidationDialog(false)}
                  aria-label={t("common.close")}
                ></button>
              </div>
              <div className="modal-body">
                <div className="p-4">
                  <div className="d-flex align-items-center mb-3">
                    <i
                      className="fas fa-exclamation-triangle text-danger me-3"
                      style={{ fontSize: "24px" }}
                    ></i>
                    <h5 className="fw-bold mb-0">{t("viewAllPetitions.completeYourProfile")}</h5>
                  </div>
                  <p className="mb-4">
                    {t("viewAllPetitions.completeProfileBeforeCreate")}
                  </p>

                  {/* Filing Entity Type Alert */}
                  {profileValidationErrors.missingFilingEntityType && (
                    <div className="p-3 border border-danger bg-danger-subtle rounded mb-3">
                      <div className="d-flex align-items-center">
                        <i className="fas fa-building text-danger me-2"></i>
                        <div className="flex-grow-1">
                          <h6 className="fw-bold text-danger mb-1">
                            {t("viewAllPetitions.missingFilingEntityType")}
                          </h6>
                          <p className="mb-0 small">
                            {t("viewAllPetitions.missingFilingEntityTypeDesc")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Signature Alert */}
                  {profileValidationErrors.missingSignature && (
                    <div className="p-3 border border-danger bg-danger-subtle rounded mb-3">
                      <div className="d-flex align-items-center">
                        <i className="fas fa-signature text-danger me-2"></i>
                        <div className="flex-grow-1">
                          <h6 className="fw-bold text-danger mb-1">
                            {t("viewAllPetitions.missingSignature")}
                          </h6>
                          <p className="mb-0 small">
                            {t("viewAllPetitions.missingSignatureDesc")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="dashboard-btn-refresh"
                  onClick={() => setShowProfileValidationDialog(false)}
                >
                  {t("viewAllPetitions.cancelButton")}
                </button>
                <button
                  type="button"
                  className="dashboard-btn-create"
                  onClick={() => {
                    setShowProfileValidationDialog(false);
                    navigate(ROUTES.PROFILE);
                  }}
                >
                  <i className="fas fa-user me-2"></i>
                  {t("viewAllPetitions.goToProfile")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Petition Steps Modal */}
      <PetitionSteps
        isOpen={showPetitionSteps}
        onClose={() => setShowPetitionSteps(false)}
        organization={organization}
        onPetitionSubmitted={handlePetitionSubmitted}
      />
    </div>
  );
};

export default ViewAllPetitions;
