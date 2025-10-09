import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthData, clearAuthData } from "../../services/auth.service";
import logo from "../../assets/logo-sample.png";

function Dashboard() {
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
        <div className="mb-4 dashboard-logo mx-auto">
          <img src={logo} className="w-100" alt="logo" />
        </div>

        {/* Navigation Links */}
        <div className="flex-grow-1">
          <ul className="dashboard-nav d-flex flex-column gap-2 list-unstyled">
            <li className="dashboard-nav-item">
              <a href="#" className="dashboard-nav-link dashboard-active-link">
                <i className="fas fa-chart-line me-3 fs-5"></i>
                <span className="fw-medium">Dashboard</span>
              </a>
            </li>
            <li className="dashboard-nav-item">
              <a href="#" className="dashboard-nav-link">
                <i className="fas fa-trophy me-3 fs-5"></i>
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
            <img src={logo} className="w-100" alt="logo" style={{ maxWidth: '150px' }} />
          </div>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div className="offcanvas-body">
          <ul className="dashboard-nav d-flex flex-column gap-2 list-unstyled">
            <li className="dashboard-nav-item">
              <a href="#" className="dashboard-nav-link dashboard-active-link">
                <i className="fas fa-chart-line me-3 fs-5"></i>
                <span className="fw-medium">Dashboard</span>
              </a>
            </li>
            <li className="dashboard-nav-item">
              <a href="#" className="dashboard-nav-link">
                <i className="fas fa-trophy me-3 fs-5"></i>
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
                    <a className="dropdown-item d-flex align-items-center" href="#">
                      <i className="fas fa-user me-2"></i> Profile
                    </a>
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
          {/* Add your dashboard content here */}
          <div className="container-fluid py-4">
            <h2 className="font-xl-med fw-bold mb-4">Welcome, {user.firstName}!</h2>
            <p className="font-base text-muted">Your dashboard is ready.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;

