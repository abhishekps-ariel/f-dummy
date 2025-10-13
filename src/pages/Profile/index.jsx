import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuthData, clearAuthData } from "../../utils/storage";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../constants/routerConstants";
import { logout as logoutApi, updateUser } from "../../services/authService";
import { getFilingEntityTypes } from "../../services/commonService";
import { toast } from "react-toastify";
import NotificationDropdown from "../../components/NotificationDropdown";
import "../../styles/custom.css";

function Profile() {
  const [user, setUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [filingEntityTypes, setFilingEntityTypes] = useState([]);
  const [selectedFilingEntityType, setSelectedFilingEntityType] = useState("");
  const [isLoadingEntityTypes, setIsLoadingEntityTypes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
  });
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();

  useEffect(() => {
    const { user: userData, token } = getAuthData();
    
    if (!userData || !token) {
      navigate(ROUTES.LOGIN);
      return;
    }

    setUser(userData);
    
    // Initialize edit form data
    if (userData) {
      setEditFormData({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
      });
      setSelectedFilingEntityType(userData.filingEntityTypeId || "");
    }
  }, [navigate]);

  // Fetch filing entity types when entering edit mode
  useEffect(() => {
    const fetchFilingEntityTypes = async () => {
      if (!isEditMode) return;

      setIsLoadingEntityTypes(true);
      try {
        const response = await getFilingEntityTypes();
        
        if (response.isSuccess) {
          setFilingEntityTypes(response.data || []);
        } else {
          toast.error(response.msg || "Failed to load filing entity types");
          setFilingEntityTypes([]);
        }
      } catch (error) {
        console.error("Error fetching filing entity types:", error);
        toast.error("Failed to load filing entity types");
        setFilingEntityTypes([]);
      } finally {
        setIsLoadingEntityTypes(false);
      }
    };

    fetchFilingEntityTypes();
  }, [isEditMode]);

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

  const handleEditProfile = () => {
    setIsEditMode(true);
  };

  const handleFilingEntityTypeChange = (e) => {
    setSelectedFilingEntityType(e.target.value);
  };

  const handleFormInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("User information not found");
      return;
    }

    setIsSaving(true);
    try {
      const response = await updateUser(
        user.id,
        selectedFilingEntityType,
        editFormData.firstName,
        editFormData.lastName
      );

      if (response.isSuccess) {
        toast.success(response.msg || "Profile updated successfully");
        
        // Update local user data
        const updatedUser = {
          ...user,
          firstName: editFormData.firstName,
          lastName: editFormData.lastName,
          filingEntityTypeId: selectedFilingEntityType,
          fullName: `${editFormData.firstName} ${editFormData.lastName}`.trim(),
        };
        
        setUser(updatedUser);
        
        // Update auth context with new user data
        const { token } = getAuthData();
        clearAuthData();
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setIsEditMode(false);
      } else {
        toast.error(response.msg || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (user) {
      setEditFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
      });
      setSelectedFilingEntityType(user.filingEntityTypeId || "");
    }
    setIsEditMode(false);
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
        <div className="logo-box">
          <div>
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
                className="dashboard-nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(ROUTES.DASHBOARD);
                }}
              >
                <i className="fa-solid fa-box me-2"></i>
                <span>Dashboard</span>
              </a>
            </li>
            <li className="dashboard-nav-item">
              <a
                href="#"
                className="dashboard-nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(ROUTES.DASHBOARD);
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
                className="dashboard-nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(ROUTES.DASHBOARD);
                }}
              >
                <i className="fa-solid fa-box me-2"></i>
                <span>Dashboard</span>
              </a>
            </li>
            <li className="dashboard-nav-item">
              <a
                href="#"
                className="dashboard-nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(ROUTES.DASHBOARD);
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
            <h1 className="h4 mb-0">Profile</h1>
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

        {/* Main Profile Content */}
        <div className="dashboard-content-section">
          {/* Profile Dashboard Section */}
          <div className="shadow-custom bg-white org-search-box">
            <h2 className="font-med mb-4">My Profile</h2>
            

            {/* Profile Header Card */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="stat-card p-4">
                  <div className="d-flex flex-column flex-md-row align-items-center gap-4">
                    <div className="profile-avatar-large">
                      <img
                        className="rounded-circle object-fit-cover"
                        src="https://static.vecteezy.com/system/resources/thumbnails/003/337/584/small/default-avatar-photo-placeholder-profile-icon-vector.jpg"
                        alt="User Avatar"
                        style={{ width: "120px", height: "120px" }}
                      />
                    </div>
                    <div className="text-center text-md-start flex-grow-1">
                      <h3 className="fw-bold mb-2">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-muted mb-2">
                        <i className="fas fa-envelope me-2"></i>
                        {user.email}
                      </p>
                      <p className="text-muted mb-0">
                        <i className="fas fa-user-tag me-2"></i>
                        {user.role || "User"}
                      </p>
                    </div>
                    <div className="d-flex gap-2">
                      {isEditMode ? (
                        <>
                          <button 
                            className="dashboard-btn-create" 
                            onClick={handleSave}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Saving...
                              </>
                            ) : (
                              <>
                                <i className="fa-solid fa-save me-1"></i> Save
                              </>
                            )}
                          </button>
                          <button className="btn btn-outline-secondary" onClick={handleCancel}>
                            <i className="fa-solid fa-times me-1"></i> Cancel
                          </button>
                        </>
                      ) : (
                        <button className="dashboard-btn-create" onClick={handleEditProfile}>
                          <i className="fa-solid fa-edit me-1"></i> Edit Profile
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Information Cards */}
            <div className="row mb-4">
              {/* Filing Entity Type Card */}
              <div className="col-12 mb-3">
                <div className="stat-card p-4">
                  <h4 className="fw-bold mb-4">
                    <i className="fas fa-building me-2 text-primary"></i>
                    Filing Entity Type
                  </h4>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label text-muted small">Entity Type</label>
                      {isEditMode ? (
                        isLoadingEntityTypes ? (
                          <div className="d-flex align-items-center">
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            <span className="text-muted">Loading entity types...</span>
                          </div>
                        ) : (
                          <select
                            className="form-select"
                            value={selectedFilingEntityType}
                            onChange={handleFilingEntityTypeChange}
                          >
                            <option value="">Select Filing Entity Type</option>
                            {filingEntityTypes.map((entityType) => (
                              <option key={entityType.id} value={entityType.id}>
                                {entityType.name}
                              </option>
                            ))}
                          </select>
                        )
                      ) : (
                        <p className="fw-medium mb-0">
                          {selectedFilingEntityType 
                            ? filingEntityTypes.find(et => et.id === selectedFilingEntityType)?.name || "Not Set"
                            : "Not Set"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-6 mb-3">
                <div className="stat-card p-4">
                  <h4 className="fw-bold mb-4">
                    <i className="fas fa-user me-2 text-primary"></i>
                    Personal Information
                  </h4>
                  <div className="row g-3">
                    <div className="col-sm-6">
                      <label className="form-label text-muted small">First Name</label>
                      {isEditMode ? (
                        <input
                          type="text"
                          name="firstName"
                          className="form-control"
                          value={editFormData.firstName}
                          onChange={handleFormInputChange}
                          placeholder="Enter first name"
                        />
                      ) : (
                        <p className="fw-medium mb-0">{user.firstName}</p>
                      )}
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label text-muted small">Last Name</label>
                      {isEditMode ? (
                        <input
                          type="text"
                          name="lastName"
                          className="form-control"
                          value={editFormData.lastName}
                          onChange={handleFormInputChange}
                          placeholder="Enter last name"
                        />
                      ) : (
                        <p className="fw-medium mb-0">{user.lastName}</p>
                      )}
                    </div>
                    <div className="col-12">
                      <label className="form-label text-muted small">Email Address</label>
                      <p className="fw-medium mb-0">{user.email}</p>
                    </div>
                    {user.phone && (
                      <div className="col-12">
                        <label className="form-label text-muted small">Phone Number</label>
                        <p className="fw-medium mb-0">{user.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-lg-6 mb-3">
                <div className="stat-card p-4">
                  <h4 className="fw-bold mb-4">
                    <i className="fas fa-id-card me-2 text-primary"></i>
                    Account Details
                  </h4>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label text-muted small">Role</label>
                      <p className="fw-medium mb-0">
                        <span className="badge bg-primary fs-6">{user.role || "Normal User"}</span>
                      </p>
                    </div>
                    <div className="col-12">
                      <label className="form-label text-muted small">Account Status</label>
                      <p className="fw-medium mb-0">
                        <span className="badge bg-success fs-6">Active</span>
                      </p>
                    </div>
                    <div className="col-12">
                      <label className="form-label text-muted small">Member Since</label>
                      <p className="fw-medium mb-0">January 2024</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;

