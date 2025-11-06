import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout as logoutApi } from '../../services/authService';
import { clearAuthData, getAuthData, getUserRole, getImpersonationState } from '../../utils/storage';
import { ROUTES } from '../../constants/routerConstants';
import Sidebar from '../../components/shared/Sidebar';
import Header from '../../components/shared/Header';
import { getorganisationUsersList } from "../../services/authService";
import UserDetails from "./UserDetails";

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

const Users = () => {
  const [users, setUsers] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [displayPageSize] = useState(10); // Number of users to display per page
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  const { user, logout, organization } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('organisationUsers');
  const { isImpersonating } = getImpersonationState();
  
  // Check if user is org admin (pass impersonation state for stricter checking)
  const isOrgAdmin = isOrgAdminUser(user, isImpersonating);
  const organizationId = user?.organizationId || organization?.id;

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

  const handleUserClick = (id) => {
    setSelectedUser(id);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const orgId = localStorage.getItem("organizationId");

        // Request more users per page to account for client-side filtering of org admins
        // We request 15 users per page but only display 10, to ensure we have enough after filtering
        const payload = {
          pageNumber,
          pageSize: 15, // Request more to account for filtered org admins
          organizationId: orgId,
          searchTerm,
          sortBy: "",
          sortDescending: true,
        };

        const response = await getorganisationUsersList(payload);

        if (response.isSuccess && Array.isArray(response.data)) {
          setUsers(response.data);
          setTotalUsers(response.totalRecords || response.data.length || 0);
        } else {
          setUsers([]);
          setTotalUsers(0);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        setUsers([]);
        setTotalUsers(0);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [pageNumber, pageSize, searchTerm]);

  if (!organizationId || !isOrgAdmin) {
    return (
      <div className="dashboard-wrapper">
        <Sidebar 
          activeSection={activeSection}
          onSectionChange={(section) => {
            if (section === 'dashboard') {
              navigate(ROUTES.DASHBOARD);
            } else if (section === 'organizations') {
              navigate(ROUTES.DASHBOARD, { state: { activeSection: 'organizations' } });
            } else if (section === 'petitions') {
              navigate(ROUTES.PETITIONS);
            } else if (section === 'messages') {
              navigate(ROUTES.MESSAGES);
            } else if (section === 'faq') {
              navigate(ROUTES.FAQ);
            }
          }}
          onLogout={handleLogout}
        />
        <main className="dashboard-main-area container-fluid">
          <Header 
            user={user}
            pageTitle="Organisation Users"
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
        onSectionChange={(section) => {
          if (section === 'dashboard') {
            navigate(ROUTES.DASHBOARD);
          } else if (section === 'organizations') {
            navigate(ROUTES.DASHBOARD, { state: { activeSection: 'organizations' } });
          } else if (section === 'petitions') {
            navigate(ROUTES.PETITIONS);
          } else if (section === 'messages') {
            navigate(ROUTES.MESSAGES);
          } else if (section === 'faq') {
            navigate(ROUTES.FAQ);
          }
        }}
        onLogout={handleLogout}
      />
      <main className="dashboard-main-area container-fluid">
        <Header 
          user={user}
          pageTitle="Organisation Users"
          onLogout={handleLogout}
        />
        <div className="dashboard-content-section">
          <div className="shadow-custom bg-white org-search-box" style={{ width: "100%" }}>
            {/* Header Section */}
            <div className="petitions-header-section mb-4">
              <div className="d-none d-md-flex align-items-center justify-content-between">
                <h2 className="font-med mb-0">Organisation Users</h2>
              </div>
              <div className="d-md-none">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h2 className="font-med mb-0">Organisation Users</h2>
                </div>
              </div>
            </div>

            {/* Search Section */}
            <div className="row mb-4 g-3">
              <div className="col-12 col-md-4">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="fas fa-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 shadow-none"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => {
                      setPageNumber(1);
                      setSearchTerm(e.target.value);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Results Summary */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <span className="text-muted">
                  {(() => {
                    const filteredUsers = users.filter(user => {
                      const roles = Array.isArray(user.roles) ? user.roles : [];
                      return !roles.some(role => 
                        role === "Organization Admin" || 
                        role === "Organisation Admin" || 
                        role === "orgAdmin"
                      );
                    });
                    const filteredCount = filteredUsers.length;
                    // Only show up to displayPageSize users per page
                    const displayUsers = filteredUsers.slice(0, displayPageSize);
                    const displayCount = displayUsers.length;
                    const startIndex = displayCount > 0 ? (pageNumber - 1) * displayPageSize + 1 : 0;
                    const endIndex = displayCount > 0 ? (pageNumber - 1) * displayPageSize + displayCount : 0;
                    // Subtract 1 from totalUsers to account for the org admin that's always filtered out
                    const displayTotalUsers = totalUsers > 0 ? totalUsers - 1 : 0;
                    return displayCount > 0 
                      ? `Showing ${startIndex}-${endIndex} of ${displayTotalUsers} users`
                      : "No users found";
                  })()}
                  {loading && <span className="ms-2">(Loading...)</span>}
                </span>
              </div>
            </div>



            {/* Desktop Table View */}
            <div className="d-none d-lg-block table-responsive petition-table-container" style={{ width: "100%" }}>
              <table className="table table-hover w-100 mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "28%", minWidth: "220px" }}>Full Name</th>
                    <th style={{ width: "28%", minWidth: "220px" }}>Email</th>
                    <th style={{ width: "18%", minWidth: "150px" }}>Filing Entity Type</th>
                    <th style={{ width: "18%", minWidth: "120px" }}>Roles</th>
                    <th style={{ width: "8%", minWidth: "80px", textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2 text-muted">Loading users...</p>
                      </td>
                    </tr>
                  ) : users.filter(user => {
                    // Filter out Organization Admin users
                    const roles = Array.isArray(user.roles) ? user.roles : [];
                    return !roles.some(role => 
                      role === "Organization Admin" || 
                      role === "Organisation Admin" || 
                      role === "orgAdmin"
                    );
                  }).length > 0 ? (
                    users
                      .filter(user => {
                        // Filter out Organization Admin users
                        const roles = Array.isArray(user.roles) ? user.roles : [];
                        return !roles.some(role => 
                          role === "Organization Admin" || 
                          role === "Organisation Admin" || 
                          role === "orgAdmin"
                        );
                      })
                      .slice(0, displayPageSize) // Only show displayPageSize users per page
                      .map((user) => (
                        <tr key={user.id} className="petition-row" onClick={() => handleUserClick(user.id)} style={{ cursor: "pointer" }}>
                          <td>
                            <div style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                              {user.fullName || "N/A"}
                            </div>
                          </td>
                          <td>
                            <div className="text-truncate">
                              {user.email || "N/A"}
                            </div>
                          </td>
                          <td>{user.filingEntityTypeName || "Not Set"}</td>
                          <td>
                            <div style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                              {Array.isArray(user.roles) && user.roles.length > 0
                                ? user.roles[0]
                                : user.roles || "N/A"}
                            </div>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              className="btn btn-sm btn-link text-primary p-0"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUserClick(user.id);
                              }}
                              style={{
                                textDecoration: "none",
                                border: "none",
                                background: "transparent",
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4">
                        <i
                          className="fa-solid fa-user text-muted mb-2"
                          style={{ fontSize: "2rem" }}
                        ></i>
                        <p className="text-muted mb-0">No users found</p>
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
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading users...</p>
                </div>
              ) : users.filter(user => {
                // Filter out Organization Admin users
                const roles = Array.isArray(user.roles) ? user.roles : [];
                return !roles.some(role => 
                  role === "Organization Admin" || 
                  role === "Organisation Admin" || 
                  role === "orgAdmin"
                );
              }).length > 0 ? (
                <div className="row g-3">
                  {users
                    .filter(user => {
                      // Filter out Organization Admin users
                      const roles = Array.isArray(user.roles) ? user.roles : [];
                      return !roles.some(role => 
                        role === "Organization Admin" || 
                        role === "Organisation Admin" || 
                        role === "orgAdmin"
                      );
                    })
                    .slice(0, displayPageSize) // Only show displayPageSize users per page
                    .map((user) => (
                      <div key={user.id} className="col-12">
                        <div className="petition-mobile-row" onClick={() => handleUserClick(user.id)} style={{ cursor: "pointer" }}>
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="petition-main-info">
                              <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                                <div className="fw-medium text-dark" style={{ fontSize: "0.9rem" }}>
                                  {user.fullName || "N/A"}
                                </div>
                                <span
                                  className="badge bg-light text-secondary border"
                                  style={{ fontSize: "0.65rem" }}
                                >
                                  {user.filingEntityTypeName || "Not Set"}
                                </span>
                              </div>
                              <div className="petition-details-row">
                                <span className="small text-muted">
                                  {user.email || "N/A"}
                                </span>
                                <span className="small text-muted">
                                  {Array.isArray(user.roles) && user.roles.length > 0
                                    ? user.roles[0]
                                    : user.roles || "N/A"}
                                </span>
                              </div>
                            </div>
                            <div className="petition-action-expansion">
                              <button
                                className="btn btn-sm btn-link text-primary p-0"
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUserClick(user.id);
                                }}
                                style={{
                                  textDecoration: "none",
                                  border: "none",
                                  background: "transparent",
                                }}
                              >
                                View
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <i
                    className="fa-solid fa-user text-muted mb-2"
                    style={{ fontSize: "2rem" }}
                  ></i>
                  <p className="text-muted mb-0">No users found</p>
                </div>
              )}
            </div>


            {/* Pagination */}
            {(() => {
              // Filter out org admins to get accurate count for pagination
              const filteredUsers = users.filter(user => {
                const roles = Array.isArray(user.roles) ? user.roles : [];
                return !roles.some(role => 
                  role === "Organization Admin" || 
                  role === "Organisation Admin" || 
                  role === "orgAdmin"
                );
              });
              const filteredCount = filteredUsers.length;
              
              // Calculate total pages based on displayPageSize (not the API pageSize)
              // Only show pagination if we have more filtered users than displayPageSize
              const totalPages = Math.ceil(totalUsers / displayPageSize);
              const shouldShowPagination = filteredCount > displayPageSize || (pageNumber > 1 && filteredCount > 0);
              
              return !loading && users.length > 0 && shouldShowPagination && (
                <div className="d-flex justify-content-center mt-4">
                  <div className="pagination-minimal">
                    <button
                      className={`pagination-btn ${pageNumber === 1 ? "disabled" : ""}`}
                      onClick={() => {
                        if (pageNumber > 1) {
                          setPageNumber((prev) => prev - 1);
                        }
                      }}
                      disabled={pageNumber === 1}
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
                              className={`pagination-page ${page === pageNumber ? "active" : ""}`}
                              onClick={() => setPageNumber(page)}
                            >
                              {page}
                            </button>
                          );
                        }
                      )}
                    </div>

                    <button
                      className={`pagination-btn ${
                        pageNumber >= totalPages || filteredCount <= displayPageSize ? "disabled" : ""
                      }`}
                      onClick={() => {
                        if (pageNumber < totalPages && filteredCount > displayPageSize) {
                          setPageNumber((prev) => prev + 1);
                        }
                      }}
                      disabled={pageNumber >= totalPages || filteredCount <= displayPageSize}
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
              );
            })()}
          </div>
        </div>
      </main>

      {selectedUser && (
        <UserDetails userId={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
};

export default Users;
