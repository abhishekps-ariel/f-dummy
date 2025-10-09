import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuthData, clearAuthData } from "../../services/auth.service";
import { getAllOrganizations, searchOrganizations, submitJoinRequest } from "../../services/organization.service";
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
        // Optionally clear the selection after successful submission
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
      <aside className="dashboard-sidebar bg-white d-none d-lg-flex flex-column p-4 dashboard-shadow">
        {/* Logo */}
        <div className="mb-4 dashboard-logo mx-auto text-center">
          <span className="filir-logo-badge">FILIR</span>
        </div>

        {/* Navigation Links */}
        <div className="flex-grow-1">
          <ul className="dashboard-nav d-flex flex-column gap-2 list-unstyled">
            <li className="dashboard-nav-item">
              <a href="#" className="dashboard-nav-link dashboard-active-link">
                <i className="fa-solid fa-building fs-5 me-3"></i>
                <span className="fw-medium">Organization</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Sign Out Link */}
        <div className="mt-auto pt-4 border-top border-gray-100">
          <a href="#" className="dashboard-nav-link" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
            <i className="fas fa-sign-out-alt me-3 fs-5"></i>
            <span className="fw-medium">Sign Out</span>
          </a>
        </div>
      </aside>

      {/* Mobile Sidebar (Offcanvas) */}
      <div className="offcanvas offcanvas-start" tabIndex="-1" id="mobileSidebar" aria-labelledby="mobileSidebarLabel">
        <div className="offcanvas-header">
          <div className="dashboard-logo mx-auto">
            <span className="filir-logo-badge">FILIR</span>
          </div>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div className="offcanvas-body">
          <ul className="dashboard-nav d-flex flex-column gap-2 list-unstyled">
            <li className="dashboard-nav-item">
              <a href="#" className="dashboard-nav-link dashboard-active-link">
                <i className="fa-solid fa-building fs-5 me-3"></i>
                <span className="fw-medium">Organization</span>
              </a>
            </li>
          </ul>
          
          <div className="mt-auto pt-4 border-top">
            <a href="#" className="dashboard-nav-link" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
              <i className="fas fa-sign-out-alt me-3 fs-5"></i>
              <span className="fw-medium">Sign Out</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="dashboard-main-area container-fluid">
        {/* Header / Navbar */}
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between dashboard-header">
          <div className="d-flex align-items-center mb-3 mb-lg-0">
            {/* Mobile Menu Button */}
            <button
              className="btn p-2 d-lg-none me-3 shadow-sm bg-white rounded-circle"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#mobileSidebar"
              aria-controls="mobileSidebar"
            >
              <i className="fas fa-bars text-secondary"></i>
            </button>
            <h1 className="h3 fw-bold text-dark mb-0">Dashboard</h1>
          </div>

          <div className="d-flex align-items-center w-100 w-md-auto justify-content-md-end">
            <div className="d-flex gap-3 align-items-center">
              {/* Language Dropdown (Hidden on small screens) */}
              <div className="dropdown d-none d-lg-block me-3">
                <button
                  className="btn btn-sm dropdown-toggle text-secondary fw-medium border-0"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="fa-solid fa-globe me-1"></i>
                  <span>Eng (US)</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end theme-dropdown">
                  <li>
                    <a className="dropdown-item" href="#">
                      English (US)
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#">
                      Español (ES)
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#">
                      Français (FR)
                    </a>
                  </li>
                </ul>
              </div>

              {/* Notification Bell */}
              <button
                type="button"
                className="btn bg-none border-0 shadow-none dashboard-notification-btn dashboard-new-alert"
              >
                <i className="fa-solid fa-bell"></i>
                <span className="dashboard-notif-circle"></span>
              </button>

              {/* Profile Dropdown */}
              <div className="dropdown">
                <button
                  className="btn p-0 d-flex align-items-center border-0 me-2"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <img
                    className="rounded-circle object-fit-cover me-3"
                    src="https://static.vecteezy.com/system/resources/thumbnails/003/337/584/small/default-avatar-photo-placeholder-profile-icon-vector.jpg"
                    alt="User Avatar"
                    style={{ width: "40px", height: "40px" }}
                  />
                  <div className="text-start d-none d-lg-block">
                    <p className="font-base mb-0 fw-medium">{user.firstName} {user.lastName}</p>
                    <p className="font-sm mb-0 text-gray-dark">{user.role || 'User'}</p>
                  </div>
                  <i className="fas fa-chevron-down small ms-2 text-secondary d-none d-lg-block"></i>
                </button>

                {/* Dropdown Menu */}
                <ul className="dropdown-menu dropdown-menu-end theme-dropdown">
                  <li>
                    <Link className="dropdown-item d-flex align-items-center" to="/profile">
                      <i className="fas fa-user me-2"></i> Profile
                    </Link>
                  </li>
                  <li>
                    <a className="dropdown-item d-flex align-items-center" href="#">
                      <i className="fas fa-cog me-2"></i> Settings
                    </a>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <a className="dropdown-item d-flex align-items-center" href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                      <i className="fas fa-sign-out-alt me-2"></i> Sign out
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="dashboard-content-section">
          <div className="shadow-custom bg-white org-search-box">
            <div className="d-flex flex-wrap align-items-center mb-4 gap-2 gap-md-4 justify-content-between">
              <h2 className="font-xl-med mb-0">Organizations Association</h2>
              <button 
                className="btn create-org-btn" 
                data-bs-toggle="modal" 
                data-bs-target="#createorganizationModal"
              >
                <i className="fa-solid fa-plus me-2"></i> Create New Organization
              </button>
            </div>

            <div className="search-form-wrapper" ref={searchRef}>
              <form className="search-form form-group" role="search" onSubmit={handleJoinRequest}>
                <label>Search with organization name or EIN.</label>
                
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
                      placeholder="Search for organizations..." 
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
                
                <div className="mt-3">
                  <button 
                    className="btn custom-btn theme-btn px-4" 
                    type="submit"
                    disabled={!selectedOrganization || isSubmittingJoinRequest}
                  >
                    {isSubmittingJoinRequest ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-paper-plane me-2"></i>
                        Submit a Join Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Create Organization Modal */}
        <div className="modal fade" id="createorganizationModal" tabIndex="-1" aria-labelledby="organizationModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header text-white theme-bg">
                <h5 className="modal-title" id="organizationModalLabel">Organization Registration</h5>
                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body p-4">
                <form id="organizationForm" onSubmit={handleOrgSubmit}>
                  <p className="font-xs mb-3 text-danger">All fields are required unless otherwise noted.</p>
                  <div className="row">
                    <div className="col-12">
                      <div className="form-group mb-3">
                        <label htmlFor="orgName" className="form-label">Organization Name <span className="text-danger">*</span></label>
                        <input 
                          type="text" 
                          className="form-control" 
                          id="orgName" 
                          required 
                          placeholder="e.g., Acme Corporation"
                          value={orgFormData.orgName}
                          onChange={handleOrgFormChange}
                        />
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-group mb-3">
                        <label htmlFor="orgType" className="form-label">Type <span className="text-danger">*</span></label>
                        <select 
                          className="form-select" 
                          id="orgType" 
                          required
                          value={orgFormData.orgType}
                          onChange={handleOrgFormChange}
                        >
                          <option value="">Select Organization Type</option>
                          <option value="corporate">Corporate</option>
                          <option value="nonprofit">Non-Profit</option>
                          <option value="government">Government</option>
                          <option value="educational">Educational</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-group mb-3">
                        <label htmlFor="addressStreet" className="form-label">Street Address <span className="text-danger">*</span></label>
                        <input 
                          type="text" 
                          className="form-control" 
                          id="addressStreet" 
                          required 
                          placeholder="e.g., 123 Main St"
                          value={orgFormData.addressStreet}
                          onChange={handleOrgFormChange}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="addressCity" className="form-label">City <span className="text-danger">*</span></label>
                        <input 
                          type="text" 
                          className="form-control" 
                          id="addressCity" 
                          required
                          value={orgFormData.addressCity}
                          onChange={handleOrgFormChange}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group mb-4">
                        <label htmlFor="addressState" className="form-label">State/Province <span className="text-danger">*</span></label>
                        <input 
                          type="text" 
                          className="form-control" 
                          id="addressState" 
                          required
                          value={orgFormData.addressState}
                          onChange={handleOrgFormChange}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group mb-4">
                        <label htmlFor="addressZip" className="form-label">Zip/Postal Code <span className="text-danger">*</span></label>
                        <input 
                          type="text" 
                          className="form-control" 
                          id="addressZip" 
                          required
                          value={orgFormData.addressZip}
                          onChange={handleOrgFormChange}
                        />
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-group mb-4">
                        <label htmlFor="contactName" className="form-label">Primary Contact Name <span className="text-danger">*</span></label>
                        <input 
                          type="text" 
                          className="form-control" 
                          id="contactName" 
                          required 
                          placeholder="Full Name of Primary Contact"
                          value={orgFormData.contactName}
                          onChange={handleOrgFormChange}
                        />
                      </div>
                    </div>
                    <div className="col-md-6 mb-4">
                      <div className="form-group mb-3">
                        <label htmlFor="contactEmail" className="form-label">Email Address <span className="text-danger">*</span></label>
                        <input 
                          type="email" 
                          className="form-control" 
                          id="contactEmail" 
                          required 
                          placeholder="contact@example.com"
                          value={orgFormData.contactEmail}
                          onChange={handleOrgFormChange}
                        />
                      </div>
                    </div>
                    <div className="col-md-6 mb-4">
                      <div className="form-group mb-3">
                        <label htmlFor="contactPhone" className="form-label">Phone Number <span className="text-danger">*</span></label>
                        <input 
                          type="tel" 
                          className="form-control" 
                          id="contactPhone" 
                          required 
                          placeholder="(123) 456-7890"
                          value={orgFormData.contactPhone}
                          onChange={handleOrgFormChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="d-grid gap-2 pt-3">
                    <button className="btn custom-btn theme-btn mt-3 px-4 fw-medium" type="submit">
                      Save and Submit join request
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

