import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getAllOrganizationJoinRequests } from "../../services/organizationService";
import { getJoinRequestStatusEnum, getFilingEntityTypes } from "../../services/commonService";
import { getUserById } from "../../services/authService";
import { useJoinRequestTabs } from "../../context/JoinRequestTabContext";
import JoinRequestTabBar from "./JoinRequestTabBar";
import JoinRequestTabContent from "./JoinRequestTabContent";
import CustomDropdown from "../shared/CustomDropdown";
import "../shared/CustomDropdown.css";
import "../../components/Petitions/TabbedWorkspace.css";


const ViewAllJoinRequests = ({ organizationId, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("respondedOn");
  const [sortOrder, setSortOrder] = useState("desc");
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestsWithUserDetails, setRequestsWithUserDetails] = useState([]);
  const [statusEnum, setStatusEnum] = useState([]);
  const [filingEntityTypes, setFilingEntityTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(false);
   const [showCustomDateRange, setShowCustomDateRange] = useState(false);
   const [dateFilter, setDateFilter] = useState("all");
   const [customDateFrom, setCustomDateFrom] = useState("");
    const [customDateTo, setCustomDateTo] = useState("");

  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
  });

  const { openTab, getActiveTab } = useJoinRequestTabs();

  const handleDateFilterChange = (value) => {
  setDateFilter(value);

  if (value === "custom") {
    setShowCustomDateRange(true);
  } else {
    setShowCustomDateRange(false);
    setCustomDateFrom("");
    setCustomDateTo("");
    // Optionally reload data automatically when not custom
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    loadRequests();
  }
};


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
  // Fetch user details for each request
  const fetchUserDetailsForRequests = async (requestsList) => {
    setIsLoadingUserDetails(true);
    try {
      const requestsWithDetails = await Promise.all(
        requestsList.map(async (request) => {
          try {
            if (request.userId) {
              const userResponse = await getUserById(request.userId);
              if (userResponse.isSuccess && userResponse.data) {
                // Find filing entity type name
                const filingEntityTypeName = userResponse.data.filingEntityTypeId
                  ? filingEntityTypes.find(et => et.id === userResponse.data.filingEntityTypeId)?.name || 'Not Set'
                  : 'Not Set';
                
                return {
                  ...request,
                  userEmail: userResponse.data.email || request.email,
                  userFullName: `${userResponse.data.firstName || ''} ${userResponse.data.lastName || ''}`.trim() || 'N/A',
                  filingEntityTypeName: filingEntityTypeName,
                };
              }
            }
            return {
              ...request,
              userEmail: request.email || 'N/A',
              userFullName: 'N/A',
              filingEntityTypeName: 'Not Set',
            };
          } catch (error) {
            console.error(`Error fetching user details for ${request.userId}:`, error);
            return {
              ...request,
              userEmail: request.email || 'N/A',
              userFullName: 'N/A',
              filingEntityTypeName: 'Not Set',
            };
          }
        })
      );
      return requestsWithDetails;
    } catch (error) {
      console.error("Error fetching user details:", error);
      return requestsList;
    } finally {
      setIsLoadingUserDetails(false);
    }
  };

 const loadRequests = async () => {
  if (!organizationId) return;

  setLoading(true);
  setRequestsWithUserDetails([]);
  try {
    const payload = {
      organizationId: organizationId,
      status:
  statusFilter === "" || statusFilter === "all" || statusFilter === null
    ? null
    : Number(statusFilter),

      startDate:
        dateFilter === "custom" && customDateFrom
          ? new Date(customDateFrom).toISOString()
          : getFromDate(),
      endDate:
        dateFilter === "custom" && customDateTo
          ? new Date(customDateTo).toISOString()
          : new Date().toISOString(),
      pageNumber: pagination.currentPage,
      pageSize: pagination.pageSize, // Always 10 as you wanted
      searchTerm: searchQuery || "",
    };

    const response = await getAllOrganizationJoinRequests(payload);

    if (response.isSuccess) {
      const requestsData = Array.isArray(response.data) ? response.data : [];
      setRequests(requestsData);

      if (filingEntityTypes.length > 0 && requestsData.length > 0) {
        const requestsWithDetails = await fetchUserDetailsForRequests(requestsData);
        setRequestsWithUserDetails(requestsWithDetails);
      } else if (requestsData.length === 0) {
        setRequestsWithUserDetails([]);
      }
    } else {
      toast.error(response.msg || "Failed to load join requests");
      setRequests([]);
      setRequestsWithUserDetails([]);
    }
  } catch (error) {
    console.error("Error loading join requests:", error);
    toast.error("Failed to load join requests");
    setRequests([]);
    setRequestsWithUserDetails([]);
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
      loadRequests();
      loadStatusEnum();
      loadFilingEntityTypes();
    }
  }, [organizationId]);

  // Reload user details when filing entity types are loaded
  useEffect(() => {
    if (filingEntityTypes.length > 0 && requests.length > 0 && requestsWithUserDetails.length === 0 && !isLoadingUserDetails) {
      fetchUserDetailsForRequests(requests).then(requestsWithDetails => {
        setRequestsWithUserDetails(requestsWithDetails);
      });
    }
  }, [filingEntityTypes, requests.length]);

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

  // Filter and sort requests
  const filteredRequests = requestsWithUserDetails.filter(request => {
    // Status filter
    if (statusFilter !== "all" && request.status !== parseInt(statusFilter)) {
      return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const email = (request.userEmail || "").toLowerCase();
      const name = (request.userFullName || "").toLowerCase();
      if (!email.includes(query) && !name.includes(query)) {
        return false;
      }
    }
    
    return true;
  });

  // Sort requests by most recent respondedOn or requestedOn (latest first)
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const dateA = a.respondedOn ? new Date(a.respondedOn) : new Date(a.requestedOn || 0);
    const dateB = b.respondedOn ? new Date(b.respondedOn) : new Date(b.requestedOn || 0);
    
    if (sortBy === "respondedOn") {
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    }
    
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  const paginatedRequests = sortedRequests.slice(
    (pagination.currentPage - 1) * pagination.pageSize,
    pagination.currentPage * pagination.pageSize
  );
  const totalPages = Math.ceil(sortedRequests.length / pagination.pageSize);

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleRequestClick = (request) => {
    openTab(request, organizationId);
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    loadRequests();
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
  if (loading || (requests.length > 0 && requestsWithUserDetails.length === 0 && isLoadingUserDetails)) {
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
                        { value: "", label: "All Statuses" },
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
                          loadRequests();
                         
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
                          loadRequests();
                         
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
                </div>

                {/* Results Summary */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <span className="text-muted">
                      {(() => {
                        const startIndex = (pagination.currentPage - 1) * pagination.pageSize + 1;
                        const endIndex = Math.min(
                          pagination.currentPage * pagination.pageSize,
                          sortedRequests.length
                        );
                        return `Showing ${startIndex}-${endIndex} of ${sortedRequests.length} requests`;
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
                                  {request.userEmail || "N/A"}
                                </div>
                              </td>
                              <td>
                                <div style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                                  {request.userFullName || "N/A"}
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
                                {request.filingEntityTypeName || "Not Set"}
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
                                      {request.userEmail || "N/A"}
                                    </div>
                                    <span className={statusInfo.class}>
                                      {statusInfo.text}
                                    </span>
                                  </div>
                                  <div className="petition-details-row">
                                    <span className="small text-muted">
                                      {request.userFullName || "N/A"}
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
                                      {request.filingEntityTypeName || "Not Set"}
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
                {totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-4">
                    <nav>
                      <ul className="pagination mb-0">
                        <li className={`page-item ${pagination.currentPage === 1 ? "disabled" : ""}`}>
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                          >
                            Previous
                          </button>
                        </li>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <li
                            key={page}
                            className={`page-item ${pagination.currentPage === page ? "active" : ""}`}
                          >
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </button>
                          </li>
                        ))}
                        <li className={`page-item ${pagination.currentPage === totalPages ? "disabled" : ""}`}>
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === totalPages}
                          >
                            Next
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </div>
            );
          }

          // Join Request Detail Tab
          if (activeTab.type === "join-request" && activeTab.data) {
            return (
              <JoinRequestTabContent
                request={activeTab.data.request}
                userDetails={activeTab.data.userDetails}
                organizationId={organizationId}
                onRefresh={handleRefresh}
              />
            );
          }

          return null;
        })()}
      </div>
    </div>
  );
};

export default ViewAllJoinRequests;

