import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAllOrganizationJoinRequests, reviewJoinRequest } from "../../services/organizationService";
import { getJoinRequestStatusEnum, getFilingEntityTypes } from "../../services/commonService";
import { getUserById } from "../../services/authService";
import { toast } from "react-toastify";
import { ROUTES } from "../../constants/routerConstants";
import { logout as logoutApi } from "../../services/authService";
import { clearAuthData, getAuthData, getUserRole, getImpersonationState } from "../../utils/storage";
import Sidebar from "../../components/shared/Sidebar";
import Header from "../../components/shared/Header";
import "../../styles/custom.css";

// Helper function to check if user is org admin (matches Login.jsx logic)
// When impersonating, we strictly check the impersonated user's role only
const isOrgAdminUser = (userData, isImpersonating = false) => {
  if (!userData) return false;
  
  // When impersonating, we need to be extra strict about role checking
  // Only check actual role fields, not isManager (which might be inherited from admin session)
  if (isImpersonating) {
    // When impersonating, only check roles array or role field
    // Do NOT check isManager during impersonation as it might be from the admin's session
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
    return userRole === "orgAdmin" || userRole === "Organisation Admin" || userRole === "Organization Admin";
  }
  
  // Normal check (not impersonating)
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
  const { isImpersonating } = getImpersonationState();
  
  // Check if user is org admin (pass impersonation state for stricter checking)
  const isOrgAdmin = isOrgAdminUser(user, isImpersonating);
  const [requests, setRequests] = useState([]);
  const [requestsWithUserDetails, setRequestsWithUserDetails] = useState([]);
  const [statusEnum, setStatusEnum] = useState([]);
  const [filingEntityTypes, setFilingEntityTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(false);
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
    
    setIsLoading(true);
    setRequestsWithUserDetails([]); // Clear existing data immediately
    try {
      const response = await getAllOrganizationJoinRequests(organizationId);
      console.log("API Response:", response); // Debug log
      
      if (response.isSuccess) {
        // The service now ensures data is always an array
        const requestsData = Array.isArray(response.data) ? response.data : [];
        
        console.log("Parsed requests data:", requestsData); // Debug log
        
        // Store requests
        setRequests(requestsData);
        
        // If filing entity types are already loaded, fetch user details immediately
        if (filingEntityTypes.length > 0 && requestsData.length > 0) {
          const requestsWithDetails = await fetchUserDetailsForRequests(requestsData);
          setRequestsWithUserDetails(requestsWithDetails);
        } else if (requestsData.length === 0) {
          // No requests, set empty array and stop loading
          setRequestsWithUserDetails([]);
        }
        // If filing entity types not loaded yet, the useEffect will handle fetching details when they load
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

  const getStatusInfo = (status) => {
    const statusItem = statusEnum.find(item => item.value === status);
    if (statusItem) {
      let badgeClass = "status-badge";
      if (status === 1) badgeClass += " status-approved"; // Approved
      else if (status === 2) badgeClass += " status-denied status-rejected"; // Denied
      else badgeClass += " status-pending"; // Pending
      
      return {
        text: statusItem.name || statusItem.label || "Pending",
        class: badgeClass,
      };
    }
    // Fallback
    if (status === 1) return { text: "Approved", class: "status-badge status-approved" };
    if (status === 2) return { text: "Denied", class: "status-badge status-denied status-rejected" };
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

  // Sort requests by most recent respondedOn or requestedOn (latest first)
  const sortedRequests = [...requestsWithUserDetails].sort((a, b) => {
    // Get the date to sort by (respondedOn if exists, otherwise requestedOn)
    const dateA = a.respondedOn ? new Date(a.respondedOn) : new Date(a.requestedOn || 0);
    const dateB = b.respondedOn ? new Date(b.respondedOn) : new Date(b.requestedOn || 0);
    
    // Sort descending (most recent first)
    return dateB - dateA;
  });

  const paginatedRequests = sortedRequests.slice(
    (pagination.currentPage - 1) * pagination.pageSize,
    pagination.currentPage * pagination.pageSize
  );
  const totalPages = Math.ceil(sortedRequests.length / pagination.pageSize);

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
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
          <div className="shadow-custom bg-white org-search-box" style={{ width: "100%" }}>
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
                  {isLoading && <span className="ms-2">(Loading...)</span>}
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
                    <th style={{ width: "20px", minWidth: "20px", maxWidth: "20px", padding: "0.25rem 0.1rem", textAlign: "center" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading || isLoadingUserDetails || (requests.length > 0 && requestsWithUserDetails.length === 0) ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
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
                          <td style={{ width: "20px", minWidth: "20px", maxWidth: "20px", padding: "0.25rem 0.1rem", textAlign: "center" }}>
                            <div className="petition-action-expansion">
                              <button
                                className="btn btn-sm border-0"
                                type="button"
                                style={{
                                  background: "transparent",
                                  color: "#6c757d",
                                  minWidth: "24px",
                                  minHeight: "24px",
                                  padding: "0.15rem",
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
                      <td colSpan="7" className="text-center py-4">
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
              {isLoading || isLoadingUserDetails || (requests.length > 0 && requestsWithUserDetails.length === 0) ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading join requests...</p>
                </div>
              ) : paginatedRequests.length > 0 ? (
                <div className="row g-3">
                  {paginatedRequests.map((request) => {
                    const statusInfo = getStatusInfo(request.status);
                    return (
                      <div key={request.id} className="col-12">
                        <div className="petition-mobile-row">
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
                                        setOpenDropdownId(null);
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
                                        setOpenDropdownId(null);
                                        handleAction(request, "deny");
                                      }}
                                    >
                                      Deny
                                    </button>
                                  )}
                                </div>
                              )}
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
            {!isLoading && !isLoadingUserDetails && requestsWithUserDetails.length > 0 && totalPages >= 1 && (
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
                  className="dashboard-btn-refresh"
                  onClick={() => {
                    setShowActionModal(false);
                    setSelectedRequest(null);
                    setAdminComment("");
                  }}
                  disabled={isSubmitting}
                  style={{ minWidth: '80px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={actionType === "approve" ? "dashboard-btn-create" : "dashboard-btn-refresh text-danger"}
                  onClick={handleSubmitAction}
                  disabled={isSubmitting}
                  style={{ minWidth: '120px' }}
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
                    actionType === "approve" ? "Approve" : "Deny"
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
