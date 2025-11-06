import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { getAllOrganizationJoinRequests } from "../../services/organizationService";
import { getJoinRequestStatusEnum } from "../../services/commonService";
import { useJoinRequestTabs } from "../../context/JoinRequestTabContext";
import { useDebounce } from "../../hooks/useDebounce";
import JoinRequestTabBar from "./JoinRequestTabBar";
import JoinRequestTabContent from "./JoinRequestTabContent";
import CustomDropdown from "../shared/CustomDropdown";
import "../shared/CustomDropdown.css";
import "../../components/Petitions/TabbedWorkspace.css";

const ViewAllJoinRequests = ({ organizationId, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [requests, setRequests] = useState([]);
  const [statusEnum, setStatusEnum] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  });

  const { openTab, getActiveTab } = useJoinRequestTabs();
  const prevDateFilterRef = useRef(dateFilter);

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
    if (dateFilter === "quarter") {
      const quarterAgo = new Date();
      quarterAgo.setMonth(quarterAgo.getMonth() - 3);
      return quarterAgo.toISOString();
    }
    if (dateFilter === "year") {
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      return yearAgo.toISOString();
    }
    return null; // "all" - no date filter
  };

  // Helper function to get to date
  const getToDate = () => {
    if (dateFilter === "custom" && customDateTo) {
      const toDate = new Date(customDateTo);
      toDate.setHours(23, 59, 59, 999);
      return toDate.toISOString();
    }
    if (dateFilter !== "all") {
      return new Date().toISOString();
    }
    return null; // "all" - no date filter
  };

  const loadRequests = async () => {
    if (!organizationId) {
      console.warn("No organizationId provided to loadRequests");
      return;
    }
    
    setLoading(true);
    try {
      // Prepare filters for server-side filtering, searching, and pagination
      // Note: API uses 1-based pageNumber, so we pass currentPage (which is already 1-based)
      const filters = {
        status: statusFilter,
        searchTerm: debouncedSearchQuery,
        pageNumber: pagination.currentPage - 1, // Convert to 0-based for service, which will convert back to 1-based
        pageSize: pagination.pageSize,
        startDate: getFromDate(),
        endDate: getToDate(),
      };

      console.log("Loading join requests with filters:", { organizationId, filters });
      const response = await getAllOrganizationJoinRequests(organizationId, filters);
      console.log("Join requests response:", response);
      
      if (response.isSuccess) {
        const requestsData = Array.isArray(response.data) ? response.data : [];
        
        // Update pagination from server response
        if (response.pagination) {
          setPagination(prev => ({
            ...prev,
            totalCount: response.pagination.totalCount || 0,
            totalPages: response.pagination.totalPages || 0,
          }));
        }
        
        // API now includes userDetail in each request, so no need for additional getUserById calls
        setRequests(requestsData);
      } else {
        toast.error(response.msg || "Failed to load join requests");
        setRequests([]);
      }
    } catch (error) {
      console.error("Error loading join requests:", error);
      console.error("Error details:", error.response?.data || error.message);
      
      // Show more detailed error message
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.exceptionMessage ||
                          error.message || 
                          "Failed to load join requests";
      toast.error(errorMessage);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStatusEnum = async () => {
    try {
      const response = await getJoinRequestStatusEnum();
      if (response.isSuccess && response.data) {
        const enumData = Array.isArray(response.data) ? response.data : [];
        setStatusEnum(enumData);
      }
    } catch (error) {
      console.error("Error loading status enum:", error);
    }
  };


  // Handle date filter change
  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    setShowCustomDateRange(value === "custom");
    
    if (value !== "custom") {
      setCustomDateFrom("");
      setCustomDateTo("");
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      // loadRequests will be triggered by useEffect when dateFilter changes
      // (but useEffect will skip reload if switching TO "custom")
    }
    // For "custom", don't trigger fetch - wait for Apply button click
  };

  // Update organizationId in tabs when it becomes available
  // This will trigger the context's useEffect to fetch data for tabs that need it
  const { setTabs: setContextTabs } = useJoinRequestTabs();
  useEffect(() => {
    if (organizationId) {
      // Update all tabs that don't have organizationId set
      // The context's useEffect will automatically fetch data when tabs are updated
      setContextTabs(prevTabs => {
        const hasUpdates = prevTabs.some(tab => !tab.organizationId);
        if (!hasUpdates) return prevTabs; // No need to update if all tabs already have organizationId
        
        return prevTabs.map(tab => 
          tab.organizationId ? tab : { ...tab, organizationId }
        );
      });
    }
  }, [organizationId, setContextTabs]);

  const loadFilingEntityTypes = async () => {
    try {
      const response = await getFilingEntityTypes();
      if (response.isSuccess && response.data) {
        setFilingEntityTypes(response.data || []);
      }
    } catch (error) {
      console.error("Error loading filing entity types:", error);
    }
  };

  // Load initial data
  useEffect(() => {
    if (organizationId) {
      loadStatusEnum();
      loadFilingEntityTypes();
    }
  }, [organizationId]);

  // Reload requests when filters, search, or pagination changes
  // Note: customDateFrom and customDateTo are excluded - they only trigger reload on "Apply Filter" button click
  // Also skip reload when dateFilter changes to "custom" (only reload when switching from custom to another option)
  useEffect(() => {
    if (organizationId) {
      // Don't reload if we're switching TO "custom" - wait for Apply button
      if (dateFilter === "custom" && prevDateFilterRef.current !== "custom") {
        prevDateFilterRef.current = dateFilter;
        return; // Skip reload when switching to custom
      }
      prevDateFilterRef.current = dateFilter;
      loadRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, debouncedSearchQuery, statusFilter, dateFilter, pagination.currentPage, pagination.pageSize]);

  const getStatusInfo = (status) => {
    const statusItem = statusEnum.find(item => item.value === status);
    if (statusItem) {
      let badgeClass = "status-badge";
      if (status === 1) badgeClass += " status-approved";
      else if (status === 2) badgeClass += " status-denied status-rejected";
      else badgeClass += " status-pending";
      
      return {
        text: statusItem.name || statusItem.label || "Pending",
        class: badgeClass,
      };
    }
    if (status === 1) return { text: "Approved", class: "status-badge status-approved" };
    if (status === 2) return { text: "Denied", class: "status-badge status-denied status-rejected" };
    return { text: "Pending", class: "status-badge status-pending" };
  };

  // Server-side filtering and sorting is now handled by the API
  // API response now includes userDetail in each request
  const paginatedRequests = requests;

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    // loadRequests will be triggered by useEffect when currentPage changes
  };

  const handleRequestClick = (request) => {
    openTab(request, organizationId);
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateFilter("all");
    setCustomDateFrom("");
    setCustomDateTo("");
    setShowCustomDateRange(false);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    // loadRequests will be triggered by useEffect when state changes
    if (onRefresh) {
      onRefresh();
    }
  };

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

  // Show loading state
  if (loading) {
    return (
      <div className="shadow-custom bg-white org-search-box">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading join requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="petitions-workspace">
      {/* Tab Bar */}
      <JoinRequestTabBar />

      {/* Tab Content */}
      <div className="tab-content-area">
        {(() => {
          const activeTab = getActiveTab();
          if (!activeTab) return null;

          if (activeTab.type === "all-join-requests") {
            return (
              <div className="shadow-custom bg-white org-search-box">
                {/* Header Section */}
                <div className="petitions-header-section mb-4">
                  <div className="d-none d-md-flex align-items-center justify-content-between">
                    <h2 className="font-med mb-0">Organization Join Requests</h2>
                    <button
                      className="dashboard-btn-refresh"
                      onClick={handleRefresh}
                      title="Refresh join requests"
                    >
                      <i className="fa-solid fa-sync-alt me-2"></i>
                      Refresh
                    </button>
                  </div>
                  <div className="d-md-none">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h2 className="font-med mb-0">Organization Join Requests</h2>
                      <button
                        className="dashboard-btn-refresh"
                        onClick={handleRefresh}
                        title="Refresh join requests"
                      >
                        <i className="fa-solid fa-sync-alt"></i>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Search and Filter Controls */}
                <div className="row mb-4 g-3">
                  <div className="col-12 col-md-4">
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0">
                        <i className="fas fa-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0 shadow-none"
                        placeholder="Search by email or name..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setPagination(prev => ({ ...prev, currentPage: 1 }));
                        }}
                      />
                    </div>
                  </div>
                  <div className="col-6 col-md-2">
                    <CustomDropdown
                      name="statusFilter"
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPagination(prev => ({ ...prev, currentPage: 1 }));
                      }}
                      placeholder="All Statuses"
                      options={[
                        { value: "all", label: "All Statuses" },
                        { value: "0", label: "Pending" },
                        { value: "1", label: "Approved" },
                        { value: "2", label: "Denied" },
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
                        min={customDateFrom}
                      />
                    </div>
                    <div className="col-md-3 d-flex align-items-end gap-2 mb-1">
                      <button
                        className="dashboard-btn-create"
                        onClick={() => {
                          if (customDateFrom && customDateTo) {
                            setPagination((prev) => ({ ...prev, currentPage: 1 }));
                            // Manually trigger loadRequests since custom dates are not in useEffect dependencies
                            loadRequests();
                          } else {
                            toast.error("Please select both from and to dates");
                          }
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
                          setPagination((prev) => ({ ...prev, currentPage: 1 }));
                          // Manually trigger loadRequests to clear the date filter
                          loadRequests();
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
                        const startIndex = pagination.totalCount > 0 ? (pagination.currentPage - 1) * pagination.pageSize + 1 : 0;
                        const endIndex = Math.min(
                          pagination.currentPage * pagination.pageSize,
                          pagination.totalCount
                        );
                        return `Showing ${startIndex}-${endIndex} of ${pagination.totalCount} requests`;
                      })()}
                    </span>
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="d-none d-lg-block table-responsive petition-table-container" style={{ width: "100%" }}>
                  <table className="table table-hover w-100 mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "22%", minWidth: "200px" }}>Email</th>
                        <th style={{ width: "22%", minWidth: "200px" }}>Full Name</th>
                        <th style={{ width: "12%", minWidth: "110px" }} className="text-center">Requested On</th>
                        <th style={{ width: "13%", minWidth: "110px" }} className="text-center">Responded On</th>
                        <th style={{ width: "16%", minWidth: "150px" }} className="text-center">Filing Entity Type</th>
                        <th style={{ width: "12%", minWidth: "120px" }} className="text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRequests.length > 0 ? (
                        paginatedRequests.map((request) => {
                          const statusInfo = getStatusInfo(request.status);
                          return (
                            <tr 
                              key={request.id} 
                              className="petition-row"
                              onClick={() => handleRequestClick(request)}
                              style={{ cursor: "pointer" }}
                            >
                              <td>
                                <div className="text-truncate">
                                  {request.userDetail?.email || request.email || "N/A"}
                                </div>
                              </td>
                              <td>
                                <div style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                                  {request.userDetail?.fullName || "N/A"}
                                </div>
                              </td>
                              <td className="text-center">
                                {request.requestedOn
                                  ? new Date(request.requestedOn).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "2-digit",
                                      day: "2-digit",
                                    })
                                  : "N/A"}
                              </td>
                              <td className="text-center">
                                {request.respondedOn
                                  ? new Date(request.respondedOn).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "2-digit",
                                      day: "2-digit",
                                    })
                                  : "N/A"}
                              </td>
                              <td className="text-center">
                                {request.userDetail?.filingEntityTypeName || "Not Set"}
                              </td>
                              <td className="text-center">
                                <span className={statusInfo.class}>
                                  {statusInfo.text}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-4">
                            <i
                              className="fa-solid fa-search text-muted mb-2"
                              style={{ fontSize: "2rem" }}
                            ></i>
                            <p className="text-muted mb-0">No join requests found</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="d-lg-none">
                  {paginatedRequests.length > 0 ? (
                    <div className="row g-3">
                      {paginatedRequests.map((request) => {
                        const statusInfo = getStatusInfo(request.status);
                        return (
                          <div key={request.id} className="col-12">
                            <div 
                              className="petition-mobile-row"
                              onClick={() => handleRequestClick(request)}
                              style={{ cursor: "pointer" }}
                            >
                              <div className="d-flex justify-content-between align-items-start">
                                <div className="petition-main-info">
                                  <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                                    <div className="fw-medium text-dark" style={{ fontSize: "0.9rem" }}>
                                      {request.userDetail?.email || request.email || "N/A"}
                                    </div>
                                    <span className={statusInfo.class}>
                                      {statusInfo.text}
                                    </span>
                                  </div>
                                  <div className="petition-details-row">
                                    <span className="small text-muted">
                                      {request.userDetail?.fullName || "N/A"}
                                    </span>
                                    <span className="small text-muted">
                                      Requested: {request.requestedOn
                                        ? new Date(request.requestedOn).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "2-digit",
                                            day: "2-digit",
                                          })
                                        : "N/A"}
                                    </span>
                                    <span className="small text-muted">
                                      Responded: {request.respondedOn
                                        ? new Date(request.respondedOn).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "2-digit",
                                            day: "2-digit",
                                          })
                                        : "N/A"}
                                    </span>
                                    <span className="small text-muted">
                                      {request.userDetail?.filingEntityTypeName || "Not Set"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <i
                        className="fa-solid fa-search text-muted mb-2"
                        style={{ fontSize: "2rem" }}
                      ></i>
                      <p className="text-muted mb-0">No join requests found</p>
                    </div>
                  )}
                </div>

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
                                onClick={() => handlePageChange(page)}
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
                            handlePageChange(pagination.currentPage + 1);
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
          }

          // Join Request Detail Tab
          if (activeTab.type === "join-request") {
            // Show loading state if data is being fetched
            if (activeTab.isLoading) {
              return (
                <div className="shadow-custom bg-white org-search-box">
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">Loading join request details...</p>
                  </div>
                </div>
              );
            }
            
            // Show error state if there was an error
            if (activeTab.hasError) {
              return (
                <div className="shadow-custom bg-white org-search-box">
                  <div className="text-center py-5">
                    <i className="fa-solid fa-exclamation-triangle text-warning mb-3" style={{ fontSize: "2rem" }}></i>
                    <p className="text-muted mb-0">Failed to load join request details. Please try again.</p>
                  </div>
                </div>
              );
            }
            
            // Show content if data is available
            // activeTab.data now contains the full request with userDetail
            if (activeTab.data) {
              return (
                <JoinRequestTabContent
                  requestData={activeTab.data}
                  organizationId={organizationId}
                  onRefresh={handleRefresh}
                />
              );
            }
            
            // If no data and not loading, show a message
            return (
              <div className="shadow-custom bg-white org-search-box">
                <div className="text-center py-5">
                  <p className="text-muted mb-0">No data available for this join request.</p>
                </div>
              </div>
            );
          }

          return null;
        })()}
      </div>
    </div>
  );
};

export default ViewAllJoinRequests;

