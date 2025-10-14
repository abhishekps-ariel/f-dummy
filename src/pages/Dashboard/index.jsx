import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuthData, clearAuthData } from "../../utils/storage";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../constants/routerConstants";
import {
  getAllOrganizations,
  searchOrganizations,
  submitJoinRequest,
  getUserJoinRequests,
  createOrganization,
  getOrganizationById,
} from "../../services/organizationService";
import { logout as logoutApi } from "../../services/authService";
import { useDebounce } from "../../hooks/useDebounce";
import { toast } from "react-toastify";
import { formatDate } from "../../utils/dateUtils";
import NotificationDropdown from "../../components/NotificationDropdown";
import PetitionSteps from "../../components/PetitionSteps";
import ViewAllPetitions from "../../components/ViewAllPetitions";
import "../../styles/custom.css";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [orgFormData, setOrgFormData] = useState({
    orgName: "",
    orgType: "",
    addressStreet: "",
    addressCity: "",
    addressState: "",
    addressZip: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [isSubmittingJoinRequest, setIsSubmittingJoinRequest] = useState(false);

  const [joinRequests, setJoinRequests] = useState([]);
  const [isLoadingJoinRequests, setIsLoadingJoinRequests] = useState(false);
  const [hasLoadedJoinRequests, setHasLoadedJoinRequests] = useState(false);

  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [showPetitionSteps, setShowPetitionSteps] = useState(false);
  const [showViewAllPetitions, setShowViewAllPetitions] = useState(false);

  const searchRef = useRef(null);
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();

  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  useEffect(() => {
    const { user: userData, token } = getAuthData();

    if (!userData || !token) {
      navigate(ROUTES.LOGIN);
      return;
    }

    setUser(userData);
    loadJoinRequests();
  }, [navigate]);

  useEffect(() => {
    const performSearch = async () => {
      if (!hasSearched) return;

      if (debouncedSearchQuery.trim() === "") {
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

  useEffect(() => {
    const modalElement = document.getElementById("createorganizationModal");

    const handleModalHidden = () => {
      setOrgFormData({
        orgName: "",
        orgType: "",
        addressStreet: "",
        addressCity: "",
        addressState: "",
        addressZip: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
      });
    };

    if (modalElement) {
      modalElement.addEventListener("hidden.bs.modal", handleModalHidden);
    }

    return () => {
      if (modalElement) {
        modalElement.removeEventListener("hidden.bs.modal", handleModalHidden);
      }
    };
  }, []);

  const handleLogout = async () => {
    try {
      // Get refresh token from storage
      const { refreshToken } = getAuthData();
      
      if (refreshToken) {
        // Call logout API
        await logoutApi(refreshToken);
      }
    } catch (error) {
      console.error("Logout API error:", error);
      // Continue with logout even if API fails
    } finally {
      // Always clear local data and redirect
      clearAuthData();
      authLogout();
      navigate(ROUTES.LOGIN);
    }
  };

  const loadJoinRequests = async () => {
    setIsLoadingJoinRequests(true);
    try {
      const response = await getUserJoinRequests();
      if (response.isSuccess) {
        const requests = response.data || [];

        const sortedRequests = requests.sort((a, b) => {
          return new Date(b.requestedOn) - new Date(a.requestedOn);
        });

        // Fetch organization details for each request using specific org ID
        // This is much more efficient than fetching all organizations multiple times
        const requestsWithOrgNames = await Promise.all(
          sortedRequests.map(async (request) => {
            try {
              // Use getOrganizationById for efficient lookup
              const orgResponse = await getOrganizationById(
                request.organizationId
              );
              if (orgResponse.isSuccess && orgResponse.data) {
                return {
                  ...request,
                  organizationName: orgResponse.data.name,
                  organizationType: orgResponse.data.type,
                  organizationAddress: orgResponse.data.address,
                };
              }
              return request;
            } catch (error) {
              console.error(
                `Error fetching organization ${request.organizationId}:`,
                error
              );
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
      setHasLoadedJoinRequests(true);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 0:
        return { text: "Pending", class: "status-pending", icon: "fa-clock" };
      case 1:
        return {
          text: "Approved",
          class: "status-approved",
          icon: "fa-check-circle",
        };
      case 2:
        return {
          text: "Rejected",
          class: "status-rejected",
          icon: "fa-times-circle",
        };
      default:
        return {
          text: "Unknown",
          class: "status-unknown",
          icon: "fa-question-circle",
        };
    }
  };

  const handleOrgFormChange = (e) => {
    const { id, value } = e.target;
    setOrgFormData({ ...orgFormData, [id]: value });
  };

  const handleOrgSubmit = async (e) => {
    e.preventDefault();
    setIsCreatingOrg(true);

    try {
      // Map form data to API structure
      const organizationData = {
        name: orgFormData.orgName,
        type: orgFormData.orgType,
        address: `${orgFormData.addressStreet}, ${orgFormData.addressCity}, ${orgFormData.addressState} ${orgFormData.addressZip}`,
        primaryContact: `${orgFormData.contactName} (${orgFormData.contactEmail}, ${orgFormData.contactPhone})`,
      };

      // Create new organization
      const response = await createOrganization(organizationData);

      if (response.isSuccess) {
        toast.success(response.msg || "Organization created successfully");

        // The API automatically creates a join request
        // So we need to reload join requests to show the new request
        loadJoinRequests();

        // Close the modal
        const modalElement = document.getElementById("createorganizationModal");
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
          contactPhone: "",
        });
      } else {
        toast.error(response.msg || "Failed to create organization");
      }
    } catch (error) {
      console.error("Error submitting organization:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsCreatingOrg(false);
    }
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
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
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
        <div className="logo-box">
          <div>
            {" "}
            <h3 className="fw-bold theme-color text-center logo-text-one">FILIR</h3>
            <h4 className="logo-text-two theme-color text-center mb-3">
              Foreclosure Intake & Loan Information Resource
            </h4>
          </div>
          {/* Logo */}
          <div className="dashboard-logo">
            <img
              src="/src/assets/logo-sample.png"
              alt="FILIR Logo"
              className="dashboard-logo-img"
            />
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-grow-1">
          <ul
            className="dashboard-nav list-unstyled"
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <li className="dashboard-nav-item">
              <a
                href="#"
                className={`dashboard-nav-link ${activeSection === "dashboard" ? "dashboard-active-link" : ""
                  }`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection("dashboard");
                }}
              >
                <i className="fa-solid fa-box me-2"></i>
                <span>Dashboard</span>
              </a>
            </li>
            <li className="dashboard-nav-item">
              <a
                href="#"
                className={`dashboard-nav-link ${activeSection === "organizations"
                    ? "dashboard-active-link"
                    : ""
                  }`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection("organizations");
                }}
              >
                <i className="fa-solid fa-building me-2"></i>
                <span>Organizations</span>
              </a>
            </li>
          </ul>
        </nav>

        {/* Sign Out Link */}
        <div className="dashboard-sidebar-footer">
          <a
            href="#"
            className="dashboard-nav-link"
            onClick={(e) => {
              e.preventDefault();
              handleLogout();
            }}
          >
            <i className="fas fa-sign-out-alt me-2"></i>
            <span>Sign Out</span>
          </a>
        </div>
      </aside>

      {/* Mobile Sidebar (Offcanvas) */}
      <div
        className="offcanvas offcanvas-start"
        tabIndex="-1"
        id="mobileSidebar"
        aria-labelledby="mobileSidebarLabel"
      >
        <div className="offcanvas-header">
          <img
            src="/src/assets/logo-sample.png"
            alt="FILIR Logo"
            className="dashboard-logo-img"
          />
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          ></button>
        </div>
        <div className="offcanvas-body">
          <ul
            className="dashboard-nav list-unstyled"
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <li className="dashboard-nav-item">
              <a
                href="#"
                className={`dashboard-nav-link ${activeSection === "dashboard" ? "dashboard-active-link" : ""
                  }`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection("dashboard");
                }}
              >
                <i className="fa-solid fa-box me-2"></i>
                <span>Dashboard</span>
              </a>
            </li>
            <li className="dashboard-nav-item">
              <a
                href="#"
                className={`dashboard-nav-link ${activeSection === "organizations"
                    ? "dashboard-active-link"
                    : ""
                  }`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection("organizations");
                }}
              >
                <i className="fa-solid fa-building me-2"></i>
                <span>Organizations</span>
              </a>
            </li>
          </ul>

          <div className="mt-auto pt-4 border-top">
            <a
              href="#"
              className="dashboard-nav-link"
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
              }}
            >
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
            <h1 className="h4 mb-0">
              {activeSection === "dashboard" ? "Dashboard" : "Organizations"}
            </h1>
          </div>

          <div className="d-flex align-items-center gap-3">
            {/* Language Dropdown (Hidden on small screens) */}
            <div className="dropdown d-none d-lg-block">
              <button
                className="btn btn-sm dropdown-toggle text-secondary border-0 font-xs"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="fa-solid fa-globe me-1"></i>
                <span>Eng (US)</span>
              </button>
              {/* Dropdown Menu */}
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

            {/* Notification Dropdown */}
            <NotificationDropdown />

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
                  <p className="font-base mb-0 fw-medium">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="font-sm mb-0 text-gray-dark">
                    {user.role || "User"}
                  </p>
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
                  <a
                    className="dropdown-item"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLogout();
                    }}
                  >
                    <i className="fas fa-sign-out-alt me-2"></i> Sign out
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="dashboard-content-section">
          {/* View All Petitions Section */}
          {activeSection === "dashboard" && showViewAllPetitions && (
            <ViewAllPetitions 
              onBack={() => setShowViewAllPetitions(false)} 
            />
          )}

          {/* Petition Dashboard Section */}
          {activeSection === "dashboard" && !showViewAllPetitions && (
            <div className="shadow-custom bg-white org-search-box">
              <h2 className="font-med mb-4">My Petition Dashboard</h2>
              <div className="row mb-5">
                <div className="col-md-4 mb-3">
                  <div className="stat-card">
                    <h4 className="stat-count">150</h4>
                    <p className="stat-title">Total Active Petitions</p>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="stat-card">
                    <h4 className="stat-count">5</h4>
                    <p className="stat-title">Returned Petitions</p>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="stat-card">
                    <h4 className="stat-count">75</h4>
                    <p className="stat-title">Accepted Petitions</p>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div className="col-md-4">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <i className="fas fa-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 shadow-none"
                      placeholder="Search Petitions"
                    />
                  </div>
                </div>
                <div className="d-flex gap-3 align-items-center">
                  <button 
                    className="btn btn-link text-decoration-hover p-0"
                    onClick={() => setShowViewAllPetitions(true)}
                  >
                    View all Petition
                  </button>
                  <button
                    className="dashboard-btn-create"
                    onClick={() => setShowPetitionSteps(true)}
                  >
                    <i className="fa-solid fa-plus me-1"></i> Create New Petition
                  </button>
                </div>
              </div>

              <div className="table-responsive petition-table-container">
                <table className="table table-striped table-hover w-100">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '18%' }}>Petition Number</th>
                      <th style={{ width: '32%' }}>Property Address</th>
                      <th style={{ width: '18%' }}>Status</th>
                      <th style={{ width: '16%' }}>Filing Date</th>
                      <th style={{ width: '16%' }}>Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      className="petition-row"
                      onClick={() => (window.location.href = "#details-1001")}
                    >
                      <td>
                        <a href="#details-1001">PN-1001</a>
                      </td>
                      <td>123 Main St, Anytown</td>
                      <td>
                        <span className="status-badge status-Accepted">
                          Accepted
                        </span>
                      </td>
                      <td>2025-09-15</td>
                      <td>2025-10-01 10:30 AM</td>
                    </tr>
                    <tr
                      className="petition-row"
                      onClick={() => (window.location.href = "#details-1002")}
                    >
                      <td>
                        <a href="#details-1002">PN-1002</a>
                      </td>
                      <td>45 Baker Ln, Somewhere</td>
                      <td>
                        <span className="status-badge status-Submitted">
                          Submitted
                        </span>
                      </td>
                      <td>2025-10-05</td>
                      <td>2025-10-09 03:15 PM</td>
                    </tr>
                    <tr
                      className="petition-row"
                      onClick={() => (window.location.href = "#details-1003")}
                    >
                      <td>
                        <a href="#details-1003">PN-1003</a>
                      </td>
                      <td>789 Oak Ave, Cityville</td>
                      <td>
                        <span className="status-badge status-Returned">
                          Returned
                        </span>
                      </td>
                      <td>2025-10-08</td>
                      <td>2025-10-10 11:00 AM</td>
                    </tr>
                    <tr
                      className="petition-row"
                      onClick={() => (window.location.href = "#details-1004")}
                    >
                      <td>
                        <a href="#details-1004">PN-1004</a>
                      </td>
                      <td>32 Pine Ct, Otherplace</td>
                      <td>
                        <span className="status-badge status-Draft">Draft</span>
                      </td>
                      <td>2025-10-06</td>
                      <td>2025-09-28 09:00 AM</td>
                    </tr>
                    <tr
                      className="petition-row"
                      onClick={() => (window.location.href = "#details-1005")}
                    >
                      <td>
                        <a href="#details-1005">PN-1005</a>
                      </td>
                      <td>55 River Rd, Waterton</td>
                      <td>
                        <span className="status-badge status-Closed">
                          Closed
                        </span>
                      </td>
                      <td>2025-08-20</td>
                      <td>2025-09-15 02:45 PM</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Show loading state while fetching initial data */}
          {activeSection === "organizations" && !hasLoadedJoinRequests && (
            <div className="org-search-box">
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading your dashboard...</p>
              </div>
            </div>
          )}

          {/* Show organization search only if user has no join requests and data has loaded */}
          {activeSection === "organizations" &&
            hasLoadedJoinRequests &&
            joinRequests.length === 0 && (
              <div className="org-search-box">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h2 className="h5 mb-0">Organizations</h2>
                  <button
                    className="dashboard-btn-create"
                    data-bs-toggle="modal"
                    data-bs-target="#createorganizationModal"
                  >
                    <i className="fa-solid fa-plus me-1"></i> Create an
                    Organization
                  </button>
                </div>

                <div className="search-form-wrapper" ref={searchRef}>
                  <form
                    className="search-form"
                    role="search"
                    onSubmit={handleJoinRequest}
                  >
                    {/* Selected Organization Display */}
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
                              {selectedOrganization.address && (
                                <span className="selected-org-address">
                                  {" "}
                                  • {selectedOrganization.address}
                                </span>
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
                                <div
                                  className="spinner-border spinner-border-sm text-primary me-2"
                                  role="status"
                                >
                                  <span className="visually-hidden">
                                    Loading...
                                  </span>
                                </div>
                                <span>Loading organizations...</span>
                              </div>
                            ) : organizations.length > 0 ? (
                              <div className="org-search-results">
                                {organizations.map((org) => (
                                  <div
                                    key={org.id}
                                    className="org-search-item"
                                    onClick={() =>
                                      handleOrganizationSelect(org)
                                    }
                                  >
                                    <div className="org-item-name">
                                      {org.name}
                                    </div>
                                    <div className="org-item-details">
                                      <span className="org-item-type">
                                        <i className="fa-solid fa-building me-1"></i>
                                        {org.type || "N/A"}
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
                        disabled={
                          !selectedOrganization || isSubmittingJoinRequest
                        }
                      >
                        {isSubmittingJoinRequest ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
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
            )}

          {/* Show join request status only if user has submitted a request and data has loaded */}
          {activeSection === "organizations" &&
            hasLoadedJoinRequests &&
            joinRequests.length > 0 && (
              <div className="org-search-box">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h2 className="h5 mb-0">Request Status</h2>
                  <button
                    className="dashboard-btn-refresh"
                    onClick={loadJoinRequests}
                    disabled={isLoadingJoinRequests}
                  >
                    <i
                      className={`fa-solid fa-refresh ${isLoadingJoinRequests ? "fa-spin" : ""
                        }`}
                    ></i>
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
                              <span className="org-name">
                                {request.organizationName || "Organization"}
                              </span>
                            </div>
                            <div
                              className={`join-request-status ${statusInfo.class}`}
                            >
                              <i
                                className={`fa-solid ${statusInfo.icon} me-1`}
                              ></i>
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
                                <strong>Admin Comment:</strong>{" "}
                                {request.adminComment}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i
                      className="fa-solid fa-inbox text-muted mb-3"
                      style={{ fontSize: "2rem" }}
                    ></i>
                    <p className="text-muted mb-0">No join requests yet</p>
                    <small className="text-muted">
                      Submit a join request above to see it here
                    </small>
                  </div>
                )}
              </div>
            )}
        </div>

        {/* Petition Steps Modal */}
        <PetitionSteps 
          isOpen={showPetitionSteps} 
          onClose={() => setShowPetitionSteps(false)} 
        />

        {/* Create Organization Modal */}
        <div
          className="modal fade"
          id="createorganizationModal"
          tabIndex="-1"
          aria-labelledby="organizationModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="organizationModalLabel">
                  Create Organization
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body p-4">
                <form id="organizationForm" onSubmit={handleOrgSubmit}>
                  <div className="row g-3">
                    <div className="col-12">
                      <label htmlFor="orgName" className="form-label">
                        Organization Name
                      </label>
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
                      <label htmlFor="orgType" className="form-label">
                        Type
                      </label>
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
                      <label htmlFor="addressStreet" className="form-label">
                        Street Address
                      </label>
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
                      <label htmlFor="addressCity" className="form-label">
                        City
                      </label>
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
                      <label htmlFor="addressState" className="form-label">
                        State
                      </label>
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
                      <label htmlFor="addressZip" className="form-label">
                        Zip Code
                      </label>
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
                      <label htmlFor="contactName" className="form-label">
                        Contact Name
                      </label>
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
                      <label htmlFor="contactEmail" className="form-label">
                        Email
                      </label>
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
                      <label htmlFor="contactPhone" className="form-label">
                        Phone
                      </label>
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
                    <button
                      className="dashboard-btn-submit w-100"
                      type="submit"
                      disabled={isCreatingOrg}
                    >
                      {isCreatingOrg ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Creating...
                        </>
                      ) : (
                        "Create Organization"
                      )}
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
