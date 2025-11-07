import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PetitionSteps from "./PetitionSteps";
import TabBar from "./TabBar";
import PetitionTabContent from "./PetitionTabContent";
import { useTabs } from "../../context/TabContext";
import { usePetitions } from "../../hooks/usePetitions";
import petitionApiService from "../../services/petitionApiService";
import CustomDropdown from "../shared/CustomDropdown";
import "../shared/CustomDropdown.css";
import "./TabbedWorkspace.css";
import { getUserById, getSignatureById } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../constants/routerConstants";

const ViewAllPetitions = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [sortBy, setSortBy] = useState("lastUpdated");
  const [sortOrder, setSortOrder] = useState("desc");
  const [exporting, setExporting] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1, // API uses 1-based indexing
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
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
  const { user } = useAuth();
  const navigate = useNavigate();

  // Validate user profile before opening petition creation modal
  const validateUserProfileBeforeCreate = async () => {
    if (!user?.id) {
      toast.error("User information not found. Please log in again.");
      return false;
    }

    setIsValidatingProfile(true);
    try {
      // Load user profile
      const profileResponse = await getUserById(user.id);

      if (!profileResponse.isSuccess) {
        toast.error("Failed to load user profile. Please try again.");
        setIsValidatingProfile(false);
        return false;
      }

      const userProfile = profileResponse.data;
      let hasErrors = false;
      const errors = {
        missingFilingEntityType: false,
        missingSignature: false
      };

      // Check if filing entity type is set
      if (!userProfile.filingEntityTypeId) {
        errors.missingFilingEntityType = true;
        hasErrors = true;
      }

      // Check if signature is uploaded
      try {
        const signatureResponse = await getSignatureById(user.id);
        if (!signatureResponse.isSuccess || !signatureResponse.data || !signatureResponse.data.signatureUrl) {
          errors.missingSignature = true;
          hasErrors = true;
        }
      } catch (error) {
        errors.missingSignature = true;
        hasErrors = true;
      }

      setIsValidatingProfile(false);

      if (hasErrors) {
        setProfileValidationErrors(errors);
        setShowProfileValidationDialog(true);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error validating user profile:", error);
      toast.error("Failed to validate user profile. Please try again.");
      setIsValidatingProfile(false);
      return false;
    }
  };

  // Handle create new petition button click
  const handleCreateNewPetition = async () => {
    const isValid = await validateUserProfileBeforeCreate();
    if (isValid) {
      setShowPetitionSteps(true);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await petitionApiService.deletePetitionById(petitionToDelete);
      setShowDeleteModal(false);
      setPetitionToDelete(null);

      toast.success("Petition deleted successfully!");
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

      if (typeof fetchPetitions === "function") {
        fetchPetitions();
      }
    } catch (error) {
      console.error("Error deleting petition:", error);
      toast.error("Failed to delete petition. Please try again.");
    }
  };

  // Use the petitions hook for organization access
  const { hasOrganizationAccess, organization, organizationCheckComplete } =
    usePetitions();

  // Use the tabs context
  const { tabs, setTabs, activeTabId, setActiveTabId, getActiveTab, openTab } =
    useTabs();

  // Get organization ID from user object (stored in browser storage) or organization context
  // Priority: user.organizationId > organization.id
  const organizationId = user?.organizationId || organization?.id || null;

  // Handle date filter change
  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    setShowCustomDateRange(value === "custom");
    if (value !== "custom") {
      setCustomDateFrom("");
      setCustomDateTo("");
    }
    // Don't trigger fetch here - let useEffect handle it after state update
  };

  // Fetch petitions using paged API
  const fetchPetitions = async (page = 1) => {
    if (!organizationId) {
      return;
    }

    setLoading(true);
    try {
      const paginationParams = {
        organizationId: organizationId,
        pageNumber: page, // Use 1-based pagination as expected by API
        pageSize: 10, // 10 petitions per page
        searchText: searchQuery.trim() || "",
        status: getStatusValue(statusFilter),
        fromDate: getFromDate(),
        toDate: getToDate(),
        sortColumn: getSortColumn(sortBy),
        sortDirection: sortOrder,
      };

      const response = await petitionApiService.getPetitionsPaged(
        paginationParams
      );

      if (response.success) {
        const transformedPetitions =
          petitionApiService.transformApiResponseToDisplayFormat(response);
        // Update state - this will trigger a re-render and show the updated table
        setPetitions(transformedPetitions);

        // Update pagination info from API response
        setPagination((prev) => ({
          ...prev,
          currentPage: page,
          totalPages: Math.ceil(
            (response.totalRecords || response.data?.length || 0) / 10
          ),
          totalCount: response.totalRecords || response.data?.length || 0,
        }));
      } else {
        toast.error(response.message || "Failed to fetch petitions");
        setPetitions([]);
      }
    } catch (error) {
      toast.error("Failed to fetch petitions. Please try again.");
      setPetitions([]);
    } finally {
      setLoading(false);
    }
  };

  // Keep ref updated with latest fetchPetitions function
  // The ref will be used in the event listener to access the current function
  useEffect(() => {
    fetchPetitionsRef.current = fetchPetitions;
  }, [organizationId, searchQuery, statusFilter, dateFilter, customDateFrom, customDateTo, sortBy, sortOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper function to get status value for API
  const getStatusValue = (status) => {
    const statusMap = {
      all: null,
      draft: 0,
      submitted: 1,
      resubmitted: 3,
      accepted: 4,
      returned: 2,
      closed: 5,
    };
    return statusMap[status] !== undefined ? statusMap[status] : null;
  };

  // Helper function to map frontend sort fields to API sort columns
  const getSortColumn = (sortBy) => {
    const sortColumnMap = {
      filingDate: "CreatedDate", // filingDate maps to CreatedDate
      lastUpdated: "ModifiedDate", // lastUpdated maps to ModifiedDate
      petitionNumber: "PetitionNumber", // petitionNumber maps to PetitionNumber
    };
    return sortColumnMap[sortBy] || "ModifiedDate"; // Default to ModifiedDate (lastUpdated)
  };

  // Helper function to get from date
  const getFromDate = () => {
    if (dateFilter === "custom" && customDateFrom) {
      return new Date(customDateFrom).toISOString();
    }
    if (dateFilter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today.toISOString();
    }
    if (dateFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return weekAgo.toISOString();
    }
    if (dateFilter === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return monthAgo.toISOString();
    }
    return new Date("2020-01-01").toISOString(); // Default to a very old date
  };

  // Helper function to get to date
  const getToDate = () => {
    if (dateFilter === "custom" && customDateTo) {
      const toDate = new Date(customDateTo);
      toDate.setHours(23, 59, 59, 999);
      return toDate.toISOString();
    }
    return new Date().toISOString();
  };

  // Reset all filters and refresh data
  const handleRefresh = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateFilter("all");
    setCustomDateFrom("");
    setCustomDateTo("");
    setShowCustomDateRange(false);
    setSortBy("lastUpdated");
    setSortOrder("desc");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchPetitions(1);
  };

  // Handle export functionality
  const handleExport = async (format) => {
    setExporting(true);
    try {
      if (format === "csv") {
        await exportToCSV();
      } else if (format === "pdf") {
        await exportToPDF();
      }
      toast.success(
        `Petitions exported as ${format.toUpperCase()} successfully!`
      );
    } catch (error) {
      toast.error("Failed to export petitions. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // Export to CSV
  const exportToCSV = async () => {
    try {
      // Use current petitions from server
      const allPetitions = petitions;
      const headers = [
        "Petition Number",
        "Property Address",
        "Borrower",
        "Status",
        "Filing Date",
        "Last Updated",
      ];
      const csvContent = [
        headers.join(","),
        ...allPetitions.map((petition) =>
          [
            petition.id,
            `"${petition.propertyAddress}"`,
            `"${petition.borrower}"`,
            petition.status,
            petition.filingDate,
            petition.lastUpdated,
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `petitions_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error("Failed to export CSV. Please try again.");
    }
  };

  // Export to PDF
  const exportToPDF = async () => {
    try {
      // Use current petitions from server
      const allPetitions = petitions;
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(18);
      doc.text("Petitions Report", 14, 22);

      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);

      // Prepare table data
      const headers = [
        "Petition Number",
        "Property Address",
        "Borrower",
        "Status",
        "Filing Date",
        "Last Updated",
      ];
      const tableData = allPetitions.map((petition) => [
        petition.id,
        petition.propertyAddress,
        petition.borrower,
        petition.status,
        petition.filingDate,
        petition.lastUpdated,
      ]);

      // Add table using autoTable plugin
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 40,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [52, 73, 94], // Dark blue-gray color
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245], // Light gray for alternating rows
        },
        margin: { top: 40 },
        columnStyles: {
          0: { cellWidth: 25 }, // Petition Number
          1: { cellWidth: 60 }, // Property Address
          2: { cellWidth: 30 }, // Borrower
          3: { cellWidth: 20 }, // Status
          4: { cellWidth: 25 }, // Filing Date
          5: { cellWidth: 25 }, // Last Updated
        },
      });

      // Add summary at the bottom
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.text(`Total Petitions: ${allPetitions.length}`, 14, finalY);

      // Save the PDF
      doc.save(`petitions_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      toast.error("Failed to export PDF. Please try again.");
    }
  };

  // Load initial data when component mounts
  useEffect(() => {
    if (organizationId && organizationCheckComplete) {
      fetchPetitions(1);
    }
  }, [organizationId, organizationCheckComplete]);

  // Handle filter changes with debouncing (excluding custom date fields)
  useEffect(() => {
    // Skip if filters are being reset to defaults (empty search and "all" status)
    // This prevents unnecessary fetches when handleRefresh is called
    if (!organizationId) return;
    
    const timeoutId = setTimeout(() => {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      fetchPetitions(1);
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
    
    // Only trigger fetch for non-custom date filters and after organization check is complete
    // Custom range is handled separately via Apply Filter button
    if (dateFilter !== "custom" && organizationId && organizationCheckComplete) {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      fetchPetitions(1);
    }
  }, [dateFilter]); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: fetchPetitions uses ref pattern and reads latest state values from closure
  // We only want to trigger when dateFilter changes, not on mount

  // Handle sorting changes
  useEffect(() => {
    if (organizationId) {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      fetchPetitions(1);
    }
  }, [sortBy, sortOrder]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
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
  }, [openDropdownId]);

  const getStatusBadgeClass = (status, statusClass) => {
    // Use the statusClass from API if available, otherwise fallback to status text
    if (statusClass) {
      return `status-badge status-${statusClass}`;
    }

    switch (status.toLowerCase()) {
      case "accepted":
        return "status-badge status-accepted";
      case "submitted":
        return "status-badge status-submitted";
      case "resubmitted":
        return "status-badge status-submitted";
      case "returned":
        return "status-badge status-returned";
      case "draft":
        return "status-badge status-draft";
      case "under review":
        return "status-badge status-under-review";
      case "rejected":
        return "status-badge status-rejected";
      case "closed":
        return "status-badge status-closed";
      default:
        return "status-badge";
    }
  };

  const handleDeletePetition = async (e, petitionId) => {
    e.stopPropagation();
    setOpenDropdownId(null);

    try {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this petition?"
      );
      if (!confirmDelete) return;

      await petitionApiService.deletePetitionById(petitionId);
      toast.success("Petition deleted successfully!");

      if (typeof fetchPetitions === "function") {
        fetchPetitions();
      }
    } catch (error) {
      console.error("Error deleting petition:", error);
      toast.error("Failed to delete petition. Please try again.");
    }
  };

  const handlePetitionClick = (petition) => {
    openTab(petition);
  };

  const handlePetitionSubmitted = () => {
    if (!organizationId || !fetchPetitionsRef.current) return;

    // Give the backend a short moment to finish processing, then refresh once
    setTimeout(() => {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      fetchPetitionsRef.current(1);
    }, 800);
  };


  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to ascending
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Show loading state while checking organization access or fetching data
  if (!organizationCheckComplete) {
    return (
      <div className="shadow-custom bg-white org-search-box">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading petitions...</p>
        </div>
      </div>
    );
  }

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
                    <h2 className="font-med mb-0">  Petitions</h2>

                    <div className="d-flex gap-3 align-items-center">
                      {/* Create New Petition Button */}
                      <button
                        className="dashboard-btn-create"
                        onClick={handleCreateNewPetition}
                      >
                        <i className="fa-solid fa-plus me-1"></i> Create New
                        Petition
                      </button>

                      {/* Export Dropdown */}
                      <div className="dropdown">
                        <button
                          className="dashboard-btn-refresh"
                          type="button"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                          title="Export petitions"
                          disabled={exporting}
                        >
                          {exporting ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              Exporting...
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-download me-2"></i>
                              Export
                            </>
                          )}
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => handleExport("csv")}
                              disabled={exporting}
                            >
                              <i className="fa-solid fa-file-csv me-2"></i>
                              Export as CSV
                            </button>
                          </li>
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => handleExport("pdf")}
                              disabled={exporting}
                            >
                              <i className="fa-solid fa-file-pdf me-2"></i>
                              Export as PDF
                            </button>
                          </li>
                        </ul>
                      </div>

                      {/* Refresh Button */}
                      <button
                        className="dashboard-btn-refresh"
                        onClick={handleRefresh}
                        title="Refresh petitions"
                      >
                        <i className="fa-solid fa-sync-alt me-2"></i>
                        Refresh
                      </button>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="d-md-none">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h2 className="font-med mb-0">Petitions</h2>
                      <button
                        className="dashboard-btn-refresh"
                        onClick={handleRefresh}
                        title="Refresh petitions"
                      >
                        <i className="fa-solid fa-sync-alt"></i>
                      </button>
                    </div>

                    <div className="row g-2">
                      <div className="col-7">
                        <button
                          className="dashboard-btn-create w-100"
                          onClick={handleCreateNewPetition}
                        >
                          <i className="fa-solid fa-plus me-1"></i> Create New
                          Petition
                        </button>
                      </div>
                      <div className="col-4">
                        <div className="dropdown w-100">
                          <button
                            className="dashboard-btn-refresh w-100"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            title="Export petitions"
                            disabled={exporting}
                          >
                            {exporting ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm me-1"
                                  role="status"
                                  aria-hidden="true"
                                ></span>
                                <span className="d-none d-sm-inline">
                                  Exporting...
                                </span>
                              </>
                            ) : (
                              <>
                                <i className="fa-solid fa-download me-1"></i>
                                <span className="d-none d-sm-inline">
                                  Export
                                </span>
                              </>
                            )}
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end">
                            <li>
                              <button
                                className="dropdown-item"
                                onClick={() => handleExport("csv")}
                                disabled={exporting}
                              >
                                <i className="fa-solid fa-file-csv me-2"></i>
                                Export as CSV
                              </button>
                            </li>
                            <li>
                              <button
                                className="dropdown-item"
                                onClick={() => handleExport("pdf")}
                                disabled={exporting}
                              >
                                <i className="fa-solid fa-file-pdf me-2"></i>
                                Export as PDF
                              </button>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Search and Filter Controls */}
                <div className="row mb-4 g-3">
                  <div className="col-12 col-md petitions-search-column">
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0">
                        <i className="fas fa-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0 shadow-none"
                        placeholder="Search petitions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-6 col-md-2">
                    <CustomDropdown
                      name="statusFilter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      placeholder="All Statuses"
                      options={[
                        { value: "all", label: "All Statuses" },
                        { value: "draft", label: "Draft" },
                        { value: "submitted", label: "Submitted" },
                        { value: "resubmitted", label: "Resubmitted" },
                        { value: "accepted", label: "Accepted" },
                        { value: "returned", label: "Returned" },
                        { value: "closed", label: "Closed" },
                      ]}
                    />
                  </div>
                  <div className="col-6 col-md-2">
                    <CustomDropdown
                      name="dateFilter"
                      value={dateFilter}
                      onChange={(e) => handleDateFilterChange(e.target.value)}
                      placeholder="All Dates"
                      options={[
                        { value: "all", label: "All Dates" },
                        { value: "today", label: "Today" },
                        { value: "week", label: "Last 7 Days" },
                        { value: "month", label: "Last Month" },
                        { value: "quarter", label: "Last 3 Months" },
                        { value: "year", label: "Last Year" },
                        { value: "custom", label: "Custom Range" },
                      ]}
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <CustomDropdown
                      name="sortBy"
                      value={`${sortBy}-${sortOrder}`}
                      onChange={(e) => {
                        const [field, order] = e.target.value.split("-");
                        setSortBy(field);
                        setSortOrder(order);
                      }}
                      placeholder="Sort By"
                      options={[
                        { value: "filingDate-desc", label: "Filing Date (Newest First)" },
                        { value: "filingDate-asc", label: "Filing Date (Oldest First)" },
                        { value: "lastUpdated-desc", label: "Last Updated (Most Recent)" },
                        { value: "lastUpdated-asc", label: "Last Updated (Least Recent)" },
                        { value: "petitionNumber-asc", label: "Petition Number (A-Z)" },
                        { value: "petitionNumber-desc", label: "Petition Number (Z-A)" },
                      ]}
                    />
                  </div>
                </div>

                {/* Custom Date Range */}
                {showCustomDateRange && (
                  <div className="row mb-4">
                    <div className="col-md-3">
                      <label className="form-label">From Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={customDateFrom}
                        onChange={(e) => setCustomDateFrom(e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">To Date</label>
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
                          fetchPetitions(1);
                        }}
                        disabled={!customDateFrom || !customDateTo}
                      >
                        Apply Filter
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
                          fetchPetitions(1);
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* Results Summary */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <span className="text-muted">
                      {(() => {
                        const startIndex =
                          (pagination.currentPage - 1) * pagination.pageSize +
                          1;
                        const endIndex = Math.min(
                          pagination.currentPage * pagination.pageSize,
                          pagination.totalCount
                        );
                        return `Showing ${startIndex}-${endIndex} of ${pagination.totalCount} petitions`;
                      })()}
                      {loading && <span className="ms-2">(Loading...)</span>}
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
                          Petition Number
                          {sortBy === "id" && (
                            <i
                              className={`fas fa-sort-${
                                sortOrder === "asc" ? "up" : "down"
                              } ms-1`}
                            ></i>
                          )}
                        </th>
                        <th style={{ width: "25%", minWidth: "200px" }}>
                          Property Address
                        </th>
                        <th
                          style={{ width: "16%", minWidth: "110px" }}
                          className="sortable-header"
                          onClick={() => handleSort("borrower")}
                        >
                          Borrower
                          {sortBy === "borrower" && (
                            <i
                              className={`fas fa-sort-${
                                sortOrder === "asc" ? "up" : "down"
                              } ms-1`}
                            ></i>
                          )}
                        </th>
                        <th
                          style={{ width: "11%", minWidth: "90px" }}
                          className="sortable-header"
                          onClick={() => handleSort("status")}
                        >
                          Status
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
                          Filing Date
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
                          Last Updated
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
                                Loading...
                              </span>
                            </div>
                            <p className="mt-2 text-muted">
                              Loading petitions...
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
                                {petition.status}
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
                              No petitions found matching your criteria
                            </p>
                            <small className="text-muted">
                              Try adjusting your search or filter settings
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
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2 text-muted">Loading petitions...</p>
                    </div>
                  ) : petitions.length > 0 ? (
                    <div className="row g-3">
                      {petitions.map((petition) => (
                        <div key={petition.id} className="col-12">
                          <div 
                            className="petition-mobile-row"
                            onClick={() => handlePetitionClick(petition)}
                            style={{ cursor: "pointer" }}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="petition-main-info">
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <span className="fw-medium petition-number" style={{ color: "#015080" }}>
                                    {petition.petitionNumber}
                                  </span>
                                  <span
                                    className={getStatusBadgeClass(
                                      petition.status,
                                      petition.statusClass
                                    )}
                                  >
                                    {petition.status}
                                  </span>
                                </div>
                                <div className="petition-details-row">
                                  <span className="small text-muted">
                                    {petition.propertyAddress}
                                  </span>
                                  <span className="small text-muted">
                                    • {petition.borrower}
                                  </span>
                                  <span className="small text-muted">
                                    • {petition.filingDate}
                                  </span>
                                </div>
                              </div>
                              <div 
                                className="petition-action-expansion"
                                onClick={(e) => e.stopPropagation()}
                              >
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
                        No petitions found matching your criteria
                      </p>
                      <small className="text-muted">
                        Try adjusting your search or filter settings
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
                          <h5 className="modal-title">Delete Petition</h5>
                          <button
                            type="button"
                            className="btn-close"
                            onClick={() => setShowDeleteModal(false)}
                            aria-label="Close"
                          ></button>
                        </div>

                        <div className="modal-body">
                          <p className="mb-4">
                            Are you sure you want to delete this petition?
                          </p>
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              type="button"
                              className="dashboard-btn-refresh"
                              onClick={() => setShowDeleteModal(false)}
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              className="dashboard-btn-refresh text-danger"
                              onClick={handleConfirmDelete}
                            >
                              Delete
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
                            fetchPetitions(pagination.currentPage - 1);
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
                        Previous
                      </button>

                      <div className="pagination-pages">
                        {Array.from(
                          { length: Math.min(pagination.totalPages, 5) },
                          (_, i) => {
                            const page = i + 1;
                            return (
                              <button
                                key={page}
                                className={`pagination-page ${
                                  page === pagination.currentPage
                                    ? "active"
                                    : ""
                                }`}
                                onClick={() => fetchPetitions(page)}
                              >
                                {page}
                              </button>
                            );
                          }
                        )}
                      </div>

                      <button
                        className={`pagination-btn ${
                          pagination.currentPage >= pagination.totalPages
                            ? "disabled"
                            : ""
                        }`}
                        onClick={() => {
                          if (pagination.currentPage < pagination.totalPages) {
                            fetchPetitions(pagination.currentPage + 1);
                          }
                        }}
                        disabled={
                          pagination.currentPage >= pagination.totalPages
                        }
                      >
                        Next
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
                <h5 className="modal-title">Profile Information Required</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowProfileValidationDialog(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div className="p-4">
                  <div className="d-flex align-items-center mb-3">
                    <i
                      className="fas fa-exclamation-triangle text-danger me-3"
                      style={{ fontSize: "24px" }}
                    ></i>
                    <h5 className="fw-bold mb-0">Complete Your Profile</h5>
                  </div>
                  <p className="mb-4">
                    You need to complete your profile information before creating a petition:
                  </p>

                  {/* Filing Entity Type Alert */}
                  {profileValidationErrors.missingFilingEntityType && (
                    <div className="p-3 border border-danger bg-danger-subtle rounded mb-3">
                      <div className="d-flex align-items-center">
                        <i className="fas fa-building text-danger me-2"></i>
                        <div className="flex-grow-1">
                          <h6 className="fw-bold text-danger mb-1">
                            Filing Entity Type Required
                          </h6>
                          <p className="mb-0 small">
                            You must set your filing entity type in your profile.
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
                            Digital Signature Required
                          </h6>
                          <p className="mb-0 small">
                            You must upload a digital signature in your profile.
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
                  Cancel
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
                  Go to Profile
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
