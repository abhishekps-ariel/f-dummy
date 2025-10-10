import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuthData, clearAuthData } from "../../services/auth.service";
import { getAllOrganizations, searchOrganizations, submitJoinRequest, getUserJoinRequests } from "../../services/organization.service";
import { useDebounce } from "../../hooks/useDebounce";
import { toast } from "react-toastify";
import "../../styles/custom.css";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [orgFormData, setOrgFormData] = useState({
    orgName: "",
    orgType: "",
    addressStreet: "",
    addressCity: "",
    addressState: "",
    addressZip: "",
    contactName: "",
    contactEmail: "",
    contactPhone: ""
  });
  
  // Search functionality state
  const [searchQuery, setSearchQuery] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [isSubmittingJoinRequest, setIsSubmittingJoinRequest] = useState(false);
  
  // Join requests state
  const [joinRequests, setJoinRequests] = useState([]);
  const [isLoadingJoinRequests, setIsLoadingJoinRequests] = useState(false);
  
  const searchRef = useRef(null);
  const navigate = useNavigate();
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  useEffect(() => {
    const { user: userData, token } = getAuthData();
    
    if (!userData || !token) {
      navigate("/login");
      return;
    }

    setUser(userData);
    // Load user's join requests when component mounts
    loadJoinRequests();
  }, [navigate]);

  // Effect to handle search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!hasSearched) return;
      
      if (debouncedSearchQuery.trim() === "") {
        // If search is empty, fetch all organizations
        setIsLoadingOrgs(true);
        try {
          const response = await getAllOrganizations();
          if (response.isSuccess) {
            setOrganizations(response.data || []);
          } else {
            setOrganizations([]);
          }
        } catch (error) {
          console.error("Error fetching organizations:", error);
          setOrganizations([]);
        } finally {
          setIsLoadingOrgs(false);
        }
      } else {
        // Search with query
        setIsLoadingOrgs(true);
        try {
          const response = await searchOrganizations(debouncedSearchQuery);
          if (response.isSuccess) {
            setOrganizations(response.data || []);
          } else {
            setOrganizations([]);
          }
        } catch (error) {
          console.error("Error searching organizations:", error);
          setOrganizations([]);
        } finally {
          setIsLoadingOrgs(false);
        }
      }
    };

    performSearch();
  }, [debouncedSearchQuery, hasSearched]);

  // Click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    clearAuthData();
    navigate("/login");
  };

  // Load user's join requests
  const loadJoinRequests = async () => {
    setIsLoadingJoinRequests(true);
    try {
      const response = await getUserJoinRequests();
      if (response.isSuccess) {
        const requests = response.data || [];
        
        // Sort requests by date (latest first)
        const sortedRequests = requests.sort((a, b) => {
          return new Date(b.requestedOn) - new Date(a.requestedOn);
        });
        
        // Fetch organization names for each request
        const requestsWithOrgNames = await Promise.all(
          sortedRequests.map(async (request) => {
            try {
              // Get organization details to fetch the name
              const orgResponse = await getAllOrganizations();
              if (orgResponse.isSuccess && orgResponse.data) {
                const organization = orgResponse.data.find(org => org.id === request.organizationId);
                if (organization) {
                  return {
                    ...request,
                    organizationName: organization.name,
                    organizationType: organization.type,
                    organizationAddress: organization.address
                  };
                }
              }
              return request;
            } catch (error) {
              console.error(`Error fetching organization ${request.organizationId}:`, error);
              return request;
            }
          })
        );
        
        setJoinRequests(requestsWithOrgNames);
      } else {
        console.error("Failed to load join requests:", response.msg);
        toast.error(response.msg || "Failed to load join requests");
        setJoinRequests([]);
      }
    } catch (error) {
      console.error("Error loading join requests:", error);
      toast.error("Failed to load join requests. Please try again.");
      setJoinRequests([]);
    } finally {
      setIsLoadingJoinRequests(false);
    }
  };

  // Get status text and styling
  const getStatusInfo = (status) => {
    switch (status) {
      case 0:
        return { text: "Pending", class: "status-pending", icon: "fa-clock" };
      case 1:
        return { text: "Approved", class: "status-approved", icon: "fa-check-circle" };
      case 2:
        return { text: "Rejected", class: "status-rejected", icon: "fa-times-circle" };
      default:
        return { text: "Unknown", class: "status-unknown", icon: "fa-question-circle" };
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleOrgFormChange = (e) => {
    const { id, value } = e.target;
    setOrgFormData({ ...orgFormData, [id]: value });
  };

  const handleOrgSubmit = (e) => {
    e.preventDefault();
    // TODO: Add organization creation logic here
    console.log("Organization form data:", orgFormData);
    
    // Close the modal using Bootstrap's modal instance
    const modalElement = document.getElementById('createorganizationModal');
    const modal = window.bootstrap.Modal.getInstance(modalElement);
    if (modal) {
      modal.hide();
    }
    
    // Reset form
    setOrgFormData({
      orgName: "",
      orgType: "",
      addressStreet: "",
      addressCity: "",
      addressState: "",
      addressZip: "",
      contactName: "",
      contactEmail: "",
      contactPhone: ""
    });
  };

  // Fetch all organizations when search input is focused
  const handleSearchFocus = async () => {
    setHasSearched(true);
    if (searchQuery.trim() === "") {
      setIsLoadingOrgs(true);
      try {
        const response = await getAllOrganizations();
        if (response.isSuccess) {
          setOrganizations(response.data || []);
          setShowDropdown(true);
        } else {
          toast.error(response.msg || "Failed to fetch organizations");
          setOrganizations([]);
        }
      } catch (error) {
        console.error("Error fetching organizations:", error);
        toast.error("Failed to fetch organizations");
        setOrganizations([]);
      } finally {
        setIsLoadingOrgs(false);
      }
    } else {
      setShowDropdown(true);
    }
  };

  // Handle search input change
  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
    setShowDropdown(true);
  };

  // Handle organization selection
  const handleOrganizationSelect = (org) => {
    console.log("Selected organization:", org);
    setSelectedOrganization(org);
    setSearchQuery("");
    setShowDropdown(false);
  };

  // Handle removing selected organization
  const handleRemoveOrganization = () => {
    setSelectedOrganization(null);
    setSearchQuery("");
  };

  // Handle join request submission
  const handleJoinRequest = async (e) => {
    e.preventDefault();
    
    if (!selectedOrganization) {
      toast.error("Please select an organization first");
      return;
    }

    setIsSubmittingJoinRequest(true);
    try {
      const response = await submitJoinRequest(selectedOrganization.id);
      
      if (response.isSuccess) {
        toast.success(response.msg || "Join request submitted successfully!");
        console.log("Join request response:", response.data);
        
        // Reload join requests from API to get the complete data
        loadJoinRequests();
        
        // Clear the selection after successful submission
        setSelectedOrganization(null);
      } else {
        toast.error(response.msg || "Failed to submit join request");
      }
    } catch (error) {
      console.error("Error submitting join request:", error);
      toast.error("Failed to submit join request. Please try again.");
    } finally {
      setIsSubmittingJoinRequest(false);
    }
  };

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      {/* Sidebar - Desktop Only */}
      <aside className="dashboard-sidebar d-none d-lg-flex flex-column">
        {/* Logo */}
        <div className="dashboard-logo">
          <img src="/src/assets/logo-sample.png" alt="FILIR Logo" className="dashboard-logo-img" />
        </div>

        {/* Navigation Links */}
        <nav className="flex-grow-1">
          <ul className="dashboard-nav list-unstyled">
            <li className="dashboard-nav-item">
              <a href="#" className="dashboard-nav-link dashboard-active-link">
                <i className="fa-solid fa-building me-2"></i>
                <span>Organizations</span>
              </a>
            </li>
          </ul>
        </nav>

        {/* Sign Out Link */}
        <div className="dashboard-sidebar-footer">
          <a href="#" className="dashboard-nav-link" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
            <i className="fas fa-sign-out-alt me-2"></i>
            <span>Sign Out</span>
          </a>
        </div>
      </aside>

      {/* Mobile Sidebar (Offcanvas) */}
      <div className="offcanvas offcanvas-start" tabIndex="-1" id="mobileSidebar" aria-labelledby="mobileSidebarLabel">
        <div className="offcanvas-header">
          <img src="/src/assets/logo-sample.png" alt="FILIR Logo" className="dashboard-logo-img" />
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div className="offcanvas-body">
          <ul className="dashboard-nav list-unstyled">
            <li className="dashboard-nav-item">
              <a href="#" className="dashboard-nav-link dashboard-active-link">
                <i className="fa-solid fa-building me-2"></i>
                <span>Organizations</span>
              </a>
            </li>
          </ul>
          
          <div className="mt-auto pt-4 border-top">
            <a href="#" className="dashboard-nav-link" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
              <i className="fas fa-sign-out-alt me-2"></i>
              <span>Sign Out</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="dashboard-main-area container-fluid">
        {/* Header / Navbar */}
        <div className="d-flex align-items-center justify-content-between dashboard-header">
          <div className="d-flex align-items-center">
            {/* Mobile Menu Button */}
            <button
              className="btn p-2 d-lg-none me-3"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#mobileSidebar"
              aria-controls="mobileSidebar"
            >
              <i className="fas fa-bars"></i>
            </button>
            <h1 className="h4 mb-0">Dashboard</h1>
          </div>

          <div className="d-flex align-items-center gap-3">
            {/* Notification Bell */}
            <button
              type="button"
              className="dashboard-btn-icon dashboard-notification-btn"
            >
              <i className="fa-solid fa-bell"></i>
            </button>

            {/* Profile Dropdown */}
            <div className="dropdown">
              <button
                className="btn p-0 d-flex align-items-center border-0"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <img
                  className="rounded-circle object-fit-cover me-3"
                  src="https://static.vecteezy.com/system/resources/thumbnails/003/337/584/small/default-avatar-photo-placeholder-profile-icon-vector.jpg"
                  alt="User Avatar"
                  style={{ width: "36px", height: "36px" }}
                />
                <div className="text-start d-none d-lg-block">
                  <p className="font-base mb-0 fw-medium">{user.firstName} {user.lastName}</p>
                  <p className="font-sm mb-0 text-gray-dark">{user.role || 'User'}</p>
                </div>
                <i className="fas fa-chevron-down small ms-2 text-secondary d-none d-lg-block"></i>
              </button>

              {/* Dropdown Menu */}
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <Link className="dropdown-item" to="/profile">
                    <i className="fas fa-user me-2"></i> Profile
                  </Link>
                </li>
                <li>
                  <a className="dropdown-item" href="#">
                    <i className="fas fa-cog me-2"></i> Settings
                  </a>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                    <i className="fas fa-sign-out-alt me-2"></i> Sign out
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="dashboard-content-section">
          <div className="org-search-box">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h2 className="h5 mb-0">Organizations</h2>
              <button 
                className="dashboard-btn-create" 
                data-bs-toggle="modal" 
                data-bs-target="#createorganizationModal"
              >
                <i className="fa-solid fa-plus me-1"></i> Create an Organization
              </button>
            </div>

            <div className="search-form-wrapper" ref={searchRef}>
              <form className="search-form" role="search" onSubmit={handleJoinRequest}>
                
                {/* Selected Organization Display */}
                {selectedOrganization ? (
                  <div className="selected-org-container">
                    <div className="selected-org-badge">
                      <div className="selected-org-icon">
                        <i className="fa-solid fa-building"></i>
                      </div>
                      <div className="selected-org-info">
                        <div className="selected-org-name">{selectedOrganization.name}</div>
                        <div className="selected-org-details">
                          {selectedOrganization.type && (
                            <span className="selected-org-type">{selectedOrganization.type}</span>
                          )}
                          {selectedOrganization.address && (
                            <span className="selected-org-address"> • {selectedOrganization.address}</span>
                          )}
                        </div>
                      </div>
                      <button 
                        type="button" 
                        className="selected-org-remove"
                        onClick={handleRemoveOrganization}
                        title="Remove selection"
                      >
                        <i className="fa-solid fa-times"></i>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="search-input-container">
                    <input 
                      className="form-control" 
                      type="search" 
                      placeholder="Search by organization name or EIN" 
                      aria-label="Search"
                      value={searchQuery}
                      onChange={handleSearchInputChange}
                      onFocus={handleSearchFocus}
                    />
                  
                    {/* Search Dropdown */}
                    {showDropdown && (
                      <div className="org-search-dropdown">
                        {isLoadingOrgs ? (
                          <div className="org-search-loading">
                            <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <span>Loading organizations...</span>
                          </div>
                        ) : organizations.length > 0 ? (
                          <div className="org-search-results">
                            {organizations.map((org) => (
                              <div
                                key={org.id}
                                className="org-search-item"
                                onClick={() => handleOrganizationSelect(org)}
                              >
                                <div className="org-item-name">{org.name}</div>
                                <div className="org-item-details">
                                  <span className="org-item-type">
                                    <i className="fa-solid fa-building me-1"></i>
                                    {org.type || 'N/A'}
                                  </span>
                                  {org.address && (
                                    <span className="org-item-address ms-3">
                                      <i className="fa-solid fa-location-dot me-1"></i>
                                      {org.address}
                                    </span>
                                  )}
                                </div>
                                {org.primaryContact && (
                                  <div className="org-item-contact">
                                    <i className="fa-solid fa-user me-1"></i>
                                    {org.primaryContact}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="org-search-no-results">
                            <i className="fa-solid fa-search me-2"></i>
                            No organizations found.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <div>
                  <button 
                    className="dashboard-btn-submit" 
                    type="submit"
                    disabled={!selectedOrganization || isSubmittingJoinRequest}
                  >
                    {isSubmittingJoinRequest ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Submitting...
                      </>
                    ) : (
                      "Submit Join Request"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* My Join Requests Section */}
        <div className="join-requests-section">
          <div className="org-search-box">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h2 className="h5 mb-0">My Join Requests</h2>
              <button 
                className="dashboard-btn-refresh" 
                onClick={loadJoinRequests}
                disabled={isLoadingJoinRequests}
              >
                <i className={`fa-solid fa-refresh ${isLoadingJoinRequests ? 'fa-spin' : ''}`}></i>
              </button>
            </div>

            {isLoadingJoinRequests ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading join requests...</p>
              </div>
            ) : joinRequests.length > 0 ? (
              <div className="join-requests-list">
                {joinRequests.map((request) => {
                  const statusInfo = getStatusInfo(request.status);
                  return (
                    <div key={request.id} className="join-request-item">
                      <div className="join-request-header">
                        <div className="join-request-org">
                          <i className="fa-solid fa-building me-2"></i>
                          <span className="org-name">{request.organizationName || 'Organization'}</span>
                        </div>
                        <div className={`join-request-status ${statusInfo.class}`}>
                          <i className={`fa-solid ${statusInfo.icon} me-1`}></i>
                          {statusInfo.text}
                        </div>
                      </div>
                      <div className="join-request-details">
                        {request.organizationType && (
                          <div className="join-request-org-details">
                            <i className="fa-solid fa-tag me-1"></i>
                            Type: {request.organizationType}
                          </div>
                        )}
                        {request.organizationAddress && (
                          <div className="join-request-org-details">
                            <i className="fa-solid fa-location-dot me-1"></i>
                            {request.organizationAddress}
                          </div>
                        )}
                        <div className="join-request-date">
                          <i className="fa-solid fa-calendar me-1"></i>
                          Requested: {formatDate(request.requestedOn)}
                        </div>
                        {request.respondedOn && (
                          <div className="join-request-response-date">
                            <i className="fa-solid fa-check me-1"></i>
                            Responded: {formatDate(request.respondedOn)}
                          </div>
                        )}
                        {request.adminComment && (
                          <div className="join-request-comment">
                            <i className="fa-solid fa-comment me-1"></i>
                            <strong>Admin Comment:</strong> {request.adminComment}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <i className="fa-solid fa-inbox text-muted mb-3" style={{ fontSize: '2rem' }}></i>
                <p className="text-muted mb-0">No join requests yet</p>
                <small className="text-muted">Submit a join request above to see it here</small>
              </div>
            )}
          </div>
        </div>

        {/* Create Organization Modal */}
        <div className="modal fade" id="createorganizationModal" tabIndex="-1" aria-labelledby="organizationModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="organizationModalLabel">Create Organization</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body p-4">
                <form id="organizationForm" onSubmit={handleOrgSubmit}>
                  <div className="row g-3">
                    <div className="col-12">
                      <label htmlFor="orgName" className="form-label">Organization Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="orgName" 
                        required 
                        value={orgFormData.orgName}
                        onChange={handleOrgFormChange}
                      />
                    </div>
                    <div className="col-12">
                      <label htmlFor="orgType" className="form-label">Type</label>
                      <select 
                        className="form-select" 
                        id="orgType" 
                        required
                        value={orgFormData.orgType}
                        onChange={handleOrgFormChange}
                      >
                        <option value="">Select type</option>
                        <option value="corporate">Corporate</option>
                        <option value="nonprofit">Non-Profit</option>
                        <option value="government">Government</option>
                        <option value="educational">Educational</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label htmlFor="addressStreet" className="form-label">Street Address</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="addressStreet" 
                        required 
                        value={orgFormData.addressStreet}
                        onChange={handleOrgFormChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="addressCity" className="form-label">City</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="addressCity" 
                        required
                        value={orgFormData.addressCity}
                        onChange={handleOrgFormChange}
                      />
                    </div>
                    <div className="col-md-3">
                      <label htmlFor="addressState" className="form-label">State</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="addressState" 
                        required
                        value={orgFormData.addressState}
                        onChange={handleOrgFormChange}
                      />
                    </div>
                    <div className="col-md-3">
                      <label htmlFor="addressZip" className="form-label">Zip Code</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="addressZip" 
                        required
                        value={orgFormData.addressZip}
                        onChange={handleOrgFormChange}
                      />
                    </div>
                    <div className="col-12">
                      <label htmlFor="contactName" className="form-label">Contact Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="contactName" 
                        required 
                        value={orgFormData.contactName}
                        onChange={handleOrgFormChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="contactEmail" className="form-label">Email</label>
                      <input 
                        type="email" 
                        className="form-control" 
                        id="contactEmail" 
                        required 
                        value={orgFormData.contactEmail}
                        onChange={handleOrgFormChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="contactPhone" className="form-label">Phone</label>
                      <input 
                        type="tel" 
                        className="form-control" 
                        id="contactPhone" 
                        required 
                        value={orgFormData.contactPhone}
                        onChange={handleOrgFormChange}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <button className="dashboard-btn-submit w-100" type="submit">
                      Submit Request
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;

