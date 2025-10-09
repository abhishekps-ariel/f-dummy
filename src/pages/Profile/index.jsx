import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuthData, clearAuthData } from "../../services/auth.service";
import "../../styles/custom.css";

function Profile() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { user: userData, token } = getAuthData();
    
    if (!userData || !token) {
      navigate("/login");
      return;
    }

    setUser(userData);
  }, [navigate]);

  const handleLogout = () => {
    clearAuthData();
    navigate("/login");
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
              <Link to="/dashboard" className="dashboard-nav-link">
                <i className="fa-solid fa-building fs-5 me-3"></i>
                <span className="fw-medium">Organization</span>
              </Link>
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
              <Link to="/dashboard" className="dashboard-nav-link">
                <i className="fa-solid fa-building fs-5 me-3"></i>
                <span className="fw-medium">Organization</span>
              </Link>
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
            <h1 className="h3 fw-bold text-dark mb-0">Profile</h1>
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

        {/* Main Profile Content */}
        <div className="dashboard-content-section">
          <div className="container-fluid">
            <div className="row">
              {/* Profile Header Card */}
              <div className="col-12 mb-4">
                <div className="profile-header-card shadow-custom bg-white p-4">
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
                      <h2 className="h3 fw-bold mb-2">{user.firstName} {user.lastName}</h2>
                      <p className="text-muted mb-2">
                        <i className="fas fa-envelope me-2"></i>
                        {user.email}
                      </p>
                      <p className="text-muted mb-0">
                        <i className="fas fa-user-tag me-2"></i>
                        {user.role || 'User'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Information Card */}
              <div className="col-lg-6 mb-4">
                <div className="profile-info-card shadow-custom bg-white p-4">
                  <h4 className="fw-bold mb-4">
                    <i className="fas fa-user me-2 text-primary"></i>
                    Personal Information
                  </h4>
                  <div className="profile-info-grid">
                    <div className="profile-info-item mb-3">
                      <label className="text-muted small mb-1">First Name</label>
                      <p className="fw-medium mb-0">{user.firstName}</p>
                    </div>
                    <div className="profile-info-item mb-3">
                      <label className="text-muted small mb-1">Last Name</label>
                      <p className="fw-medium mb-0">{user.lastName}</p>
                    </div>
                    <div className="profile-info-item mb-3">
                      <label className="text-muted small mb-1">Email Address</label>
                      <p className="fw-medium mb-0">{user.email}</p>
                    </div>
                    {user.phone && (
                      <div className="profile-info-item mb-3">
                        <label className="text-muted small mb-1">Phone Number</label>
                        <p className="fw-medium mb-0">{user.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Details Card */}
              <div className="col-lg-6 mb-4">
                <div className="profile-info-card shadow-custom bg-white p-4">
                  <h4 className="fw-bold mb-4">
                    <i className="fas fa-id-card me-2 text-primary"></i>
                    Account Details
                  </h4>
                  <div className="profile-info-grid">
                    <div className="profile-info-item mb-3">
                      <label className="text-muted small mb-1">Role</label>
                      <p className="fw-medium mb-0">
                        <span className="badge bg-primary">{user.role || 'Normal User'}</span>
                      </p>
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

