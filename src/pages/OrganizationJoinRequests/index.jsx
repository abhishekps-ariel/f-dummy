import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAllOrganizationJoinRequests, reviewJoinRequest } from "../../services/organizationService";
import { getJoinRequestStatusEnum } from "../../services/commonService";
import { getUserById } from "../../services/authService";
import { toast } from "react-toastify";
import { ROUTES } from "../../constants/routerConstants";
import { logout as logoutApi } from "../../services/authService";
import { clearAuthData, getAuthData, getUserRole } from "../../utils/storage";
import Sidebar from "../../components/shared/Sidebar";
import Header from "../../components/shared/Header";
import CustomDropdown from "../../components/shared/CustomDropdown";
import "../../styles/custom.css";

// Helper function to check if user is org admin (matches Login.jsx logic)
const isOrgAdminUser = (userData) => {
  if (!userData) return false;
  
  // Check if isManager is true
  if (userData.isManager === true) {
    return true;
  }
  
  // Check roles array for "Organisation Admin"
  if (userData.roles && Array.isArray(userData.roles)) {
    return userData.roles.some(
      (role) =>
        role === "Organisation Admin" ||
        role === "Organization Admin" ||
        role === "orgAdmin"
    );
  }
  
  // Check single role field
  const userRole = getUserRole(userData);
  if (userRole === "orgAdmin" || userRole === "Organisation Admin" || userRole === "Organization Admin") {
    return true;
  }
  
  return false;
};

const OrganizationJoinRequests = () => {
  const navigate = useNavigate();
  const { user, organization, logout: authLogout } = useAuth();
  const [activeSection, setActiveSection] = useState("organization-join-requests");
  
  // Check if user is org admin
  const isOrgAdmin = isOrgAdminUser(user);
  const [requests, setRequests] = useState([]);
  const [requestsWithUserDetails, setRequestsWithUserDetails] = useState([]);
  const [statusEnum, setStatusEnum] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10, // Fixed page size, no selector
  });
  
  // Modal state
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(""); // "approve" or "deny"
  const [adminComment, setAdminComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const organizationId = user?.organizationId || organization?.id;

  useEffect(() => {
    if (organizationId) {
      loadRequests();
      loadStatusEnum();
    }
  }, [organizationId]);

  // Fetch user details for each request
  const fetchUserDetailsForRequests = async (requestsList) => {
    try {
      const requestsWithDetails = await Promise.all(
        requestsList.map(async (request) => {
          try {
            if (request.userId) {
              const userResponse = await getUserById(request.userId);
              if (userResponse.isSuccess && userResponse.data) {
                return {
                  ...request,
                  userEmail: userResponse.data.email || request.email,
                  userFullName: `${userResponse.data.firstName || ''} ${userResponse.data.lastName || ''}`.trim() || 'N/A',
                };
              }
            }
            return {
              ...request,
              userEmail: request.email || 'N/A',
              userFullName: 'N/A',
            };
          } catch (error) {
            console.error(`Error fetching user details for ${request.userId}:`, error);
            return {
              ...request,
              userEmail: request.email || 'N/A',
              userFullName: 'N/A',
            };
          }
        })
      );
      return requestsWithDetails;
    } catch (error) {
      console.error("Error fetching user details:", error);
      return requestsList;
    }
  };

  const loadRequests = async () => {
    if (!organizationId) return;
    
    setIsLoading(true);
    try {
      const response = await getAllOrganizationJoinRequests(organizationId);
      console.log("API Response:", response); // Debug log
      
      if (response.isSuccess) {
        // The service now ensures data is always an array
        const requestsData = Array.isArray(response.data) ? response.data : [];
        
        console.log("Parsed requests data:", requestsData); // Debug log
        
        // Fetch user details for each request
        const requestsWithDetails = await fetchUserDetailsForRequests(requestsData);
        setRequests(requestsData);
        setRequestsWithUserDetails(requestsWithDetails);
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
      setIsLoading(false);
    }
  };

  const loadStatusEnum = async () => {
    try {
      const response = await getJoinRequestStatusEnum();
      console.log("Status Enum Response:", response); // Debug log
      
      if (response.isSuccess && response.data) {
        // The service now handles the nested structure
        const enumData = Array.isArray(response.data) ? response.data : [];
        console.log("Parsed status enum:", enumData); // Debug log
        setStatusEnum(enumData);
      }
    } catch (error) {
      console.error("Error loading status enum:", error);
    }
  };

  const getStatusInfo = (status) => {
    const statusItem = statusEnum.find(item => item.value === status);
    if (statusItem) {
      let badgeClass = "status-badge";
      if (status === 1) badgeClass += " status-approved"; // Approved
      else if (status === 2) badgeClass += " status-denied"; // Denied
      else badgeClass += " status-pending"; // Pending
      
      return {
        text: statusItem.name || statusItem.label || "Pending",
        class: badgeClass,
      };
    }
    // Fallback
    if (status === 1) return { text: "Approved", class: "status-badge status-approved" };
    if (status === 2) return { text: "Denied", class: "status-badge status-denied" };
    return { text: "Pending", class: "status-badge status-pending" };
  };

  const handleAction = (request, type) => {
    setSelectedRequest(request);
    setActionType(type);
    setAdminComment("");
    setShowActionModal(true);
    setOpenDropdownId(null);
  };

  const handleSubmitAction = async () => {
    if (!selectedRequest) return;

    const status = actionType === "approve" ? 1 : 2; // 1 = Approved, 2 = Denied

    setIsSubmitting(true);
    try {
      const response = await reviewJoinRequest(
        selectedRequest.id,
        status,
        adminComment
      );

      if (response.isSuccess) {
        toast.success(response.msg || `Request ${actionType}d successfully`);
        setShowActionModal(false);
        setSelectedRequest(null);
        setAdminComment("");
        loadRequests();
      } else {
        toast.error(response.msg || `Failed to ${actionType} request`);
      }
    } catch (error) {
      console.error(`Error ${actionType}ing request:`, error);
      toast.error(`Failed to ${actionType} request`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRequests = requestsWithUserDetails.filter(request => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        request.userEmail?.toLowerCase().includes(query) ||
        request.userFullName?.toLowerCase().includes(query) ||
        request.id?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (statusFilter !== "all") {
      const statusValue = statusFilter === "pending" ? 0 : statusFilter === "approved" ? 1 : 2;
      if (request.status !== statusValue) return false;
    }
    
    return true;
  });

  const paginatedRequests = filteredRequests.slice(
    (pagination.currentPage - 1) * pagination.pageSize,
    pagination.currentPage * pagination.pageSize
  );
  const totalPages = Math.ceil(filteredRequests.length / pagination.pageSize);

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    loadRequests();
  };

  const handleLogout = async () => {
    try {
      const { refreshToken } = getAuthData();
      if (refreshToken) {
        await logoutApi(refreshToken);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuthData();
      authLogout();
      navigate(ROUTES.LOGIN);
    }
  };

  if (!organizationId || !isOrgAdmin) {
    return (
      <div className="dashboard-wrapper">
        <Sidebar 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onLogout={handleLogout}
        />
        <main className="dashboard-main-area container-fluid">
          <Header 
            user={user}
            pageTitle="Organization Join Requests"
            onLogout={handleLogout}
          />
          <div className="dashboard-content-section">
            <div className="alert alert-warning">
              <i className="fa-solid fa-exclamation-triangle me-2"></i>
              Access Denied. This page is only accessible to organization administrators.
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <Sidebar 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={handleLogout}
      />
      <main className="dashboard-main-area container-fluid">
        <Header 
          user={user}
          pageTitle="Organization Join Requests"
          onLogout={handleLogout}
        />
        <div className="dashboard-content-section">
          <div className="shadow-custom bg-white org-search-box">
            {/* Header Section */}
            <div className="petitions-header-section mb-4">
              <div className="d-none d-md-flex align-items-center justify-content-between">
                <h2 className="font-med mb-0">Organization Join Requests</h2>
              </div>
              <div className="d-md-none">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h2 className="font-med mb-0">Organization Join Requests</h2>
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
                    { value: "pending", label: "Pending" },
                    { value: "approved", label: "Approved" },
                    { value: "denied", label: "Denied" },
                  ]}
                />
              </div>
              <div className="col-4 col-md-1">
                <button
                  className="dashboard-btn-refresh w-100"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  title="Reset all filters and refresh"
                >
                  <i
                    className={`fa-solid fa-refresh ${
                      isLoading ? "fa-spin" : ""
                    }`}
                  ></i>
                </button>
              </div>
            </div>

            {/* Results Summary */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <span className="text-muted">
                  {(() => {
                    const startIndex = (pagination.currentPage - 1) * pagination.pageSize + 1;
                    const endIndex = Math.min(
                      pagination.currentPage * pagination.pageSize,
                      filteredRequests.length
                    );
                    return `Showing ${startIndex}-${endIndex} of ${filteredRequests.length} requests`;
                  })()}
                  {isLoading && <span className="ms-2">(Loading...)</span>}
                </span>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="d-none d-lg-block table-responsive petition-table-container">
              <table className="table table-hover w-100 mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "20%", minWidth: "200px" }}>Email</th>
                    <th style={{ width: "25%", minWidth: "200px" }}>Full Name</th>
                    <th style={{ width: "15%", minWidth: "120px" }}>Requested On</th>
                    <th style={{ width: "12%", minWidth: "100px" }}>Admin Invite</th>
                    <th style={{ width: "12%", minWidth: "100px" }}>Status</th>
                    <th style={{ width: "30px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2 text-muted">Loading join requests...</p>
                      </td>
                    </tr>
                  ) : paginatedRequests.length > 0 ? (
                    paginatedRequests.map((request) => {
                      const statusInfo = getStatusInfo(request.status);
                      return (
                        <tr key={request.id} className="petition-row">
                          <td>
                            <div className="text-truncate" style={{ maxWidth: "200px" }}>
                              {request.userEmail || "N/A"}
                            </div>
                          </td>
                          <td>
                            <div style={{ maxWidth: "200px", whiteSpace: "normal", wordBreak: "break-word" }}>
                              {request.userFullName || "N/A"}
                            </div>
                          </td>
                          <td>
                            {request.requestedOn
                              ? new Date(request.requestedOn).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                })
                              : "N/A"}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                request.isAdminInvite ? "bg-success" : "bg-danger"
                              }`}
                            >
                              {request.isAdminInvite ? "YES" : "NO"}
                            </span>
                          </td>
                          <td>
                            <span className={statusInfo.class}>
                              {statusInfo.text}
                            </span>
                          </td>
                          <td>
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
                                    openDropdownId === request.id ? null : request.id
                                  );
                                }}
                                title="Actions"
                              >
                                <i className="fas fa-ellipsis-v"></i>
                              </button>
                              {openDropdownId === request.id && (
                                <div className="petition-action-buttons">
                                  {request.status !== 1 && (
                                    <button
                                      className="btn btn-view"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAction(request, "approve");
                                      }}
                                    >
                                      Approve
                                    </button>
                                  )}
                                  {request.status !== 2 && (
                                    <button
                                      className="btn btn-delete"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAction(request, "deny");
                                      }}
                                    >
                                      Deny
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
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

            {/* Pagination */}
            {!isLoading && filteredRequests.length > 0 && totalPages >= 1 && (
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
                      { length: Math.min(totalPages, 5) },
                      (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            className={`pagination-page ${
                              page === pagination.currentPage ? "active" : ""
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
                      pagination.currentPage === totalPages ? "disabled" : ""
                    }`}
                    onClick={() => {
                      if (pagination.currentPage < totalPages) {
                        handlePageChange(pagination.currentPage + 1);
                      }
                    }}
                    disabled={pagination.currentPage === totalPages}
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
        </div>
      </main>

      {/* Action Modal */}
      {showActionModal && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {actionType === "approve" ? "Approve" : "Deny"} Join Request
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowActionModal(false);
                    setSelectedRequest(null);
                    setAdminComment("");
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">User Email</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selectedRequest?.userEmail || selectedRequest?.email || ""}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    Admin Comment <span className="text-muted">(Optional)</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    placeholder="Enter a comment for this action..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowActionModal(false);
                    setSelectedRequest(null);
                    setAdminComment("");
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn ${actionType === "approve" ? "btn-success" : "btn-danger"}`}
                  onClick={handleSubmitAction}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className={`fa-solid ${actionType === "approve" ? "fa-check" : "fa-times"} me-2`}></i>
                      {actionType === "approve" ? "Approve" : "Deny"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationJoinRequests;
