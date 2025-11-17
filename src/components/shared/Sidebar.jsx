import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getUserRole, getImpersonationState } from "../../utils/storage";
import { ROUTES } from "../../constants/routerConstants";
import loginImg from "../../assets/logo-sample.png";

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

const Sidebar = ({ activeSection, onSectionChange, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isImpersonating } = getImpersonationState();
  
  // Check if user is org admin (pass impersonation state for stricter checking)
  const isOrgAdmin = isOrgAdminUser(user, isImpersonating);
  
  const filerNavItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: "fa-box",
      route: ROUTES.DASHBOARD,
    },
    {
      key: "petitions",
      label: "Petitions",
      icon: "fa-file-contract",
      route: ROUTES.PETITIONS,
    },
    {
      key: "messages",
      label: "Messages",
      icon: "fa-envelope",
      route: ROUTES.MESSAGES,
    },
    {
      key: "faq",
      label: "FAQ",
      icon: "fa-question-circle",
      route: ROUTES.FAQ,
    },
    {
      key: "training",
      label: "Training",
      icon: "fa-graduation-cap",
      route: ROUTES.TRAINING,
    },
  ];

  const adminNavItems = [
    {
      key: "organization-join-requests",
      label: "Join Requests",
      icon: "fa-user-plus",
      route: ROUTES.ORGANIZATION_JOIN_REQUESTS,
    },
    {
      key: "organisationUsers",
      label: "Organisation Users",
      icon: "fa-users",
      route: ROUTES.ORGANISATION_USERS,
    },
  ];
  
  let combinedNavItems;
  if (isOrgAdmin) {
    const dashboardItem = filerNavItems.find((item) => item.key === "dashboard");
    const petitionsItem = filerNavItems.find((item) => item.key === "petitions");
    const remainingItems = filerNavItems.filter(
      (item) => item.key !== "dashboard" && item.key !== "petitions"
    );

    combinedNavItems = [
      dashboardItem,
      petitionsItem,
      ...adminNavItems,
      ...remainingItems,
    ].filter(Boolean);
  } else {
    combinedNavItems = filerNavItems;
  }

  const handleNavigation = (item) => {
    if (item.route) {
      navigate(item.route);
    }
    if (onSectionChange) {
      onSectionChange(item.key);
    }
  };

  const isItemActive = (item) => {
    if (activeSection) {
      return activeSection === item.key;
    }
    if (item.route) {
      return location.pathname.startsWith(item.route);
    }
    return false;
  };

  return (
    <>
      {/* Sidebar - Desktop Only */}
      <aside className="dashboard-sidebar d-none d-lg-flex flex-column">
        <div className="logo-box" style={{ padding: "0.8rem 1rem 2rem 1rem" }}>
          {/* Logo */}
          <div className="dashboard-logo">
            <img
              src={loginImg}
              alt="FILIR Logo"
              className="dashboard-logo-img"
              style={{ width: "150px", height: "150px" }}
            />
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-grow-1">
          <ul
            className="dashboard-nav list-unstyled"
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {combinedNavItems.map(
              (item) => (
                <li className="dashboard-nav-item" key={item.key}>
                  <a
                    href="#"
                    className={`dashboard-nav-link ${
                      isItemActive(item) ? "dashboard-active-link" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigation(item);
                    }}
                  >
                    <i className={`fa-solid ${item.icon} me-2`}></i>
                    <span>{item.label}</span>
                  </a>
                </li>
              )
            )}
          </ul>
        </nav>

        {/* Sign Out Link */}
        <div className="dashboard-sidebar-footer">
          <a
            href="#"
            className="dashboard-nav-link"
            onClick={(e) => {
              e.preventDefault();
              onLogout();
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
        <div className="offcanvas-header d-flex justify-content-between align-items-center" style={{ padding: "0.5rem 1rem" }}>
          <img
            src={loginImg}
            alt="FILIR Logo"
            className="dashboard-logo-img"
            style={{ width: "180px", height: "100px" }}
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
            {combinedNavItems.map(
              (item) => (
                <li className="dashboard-nav-item" key={item.key}>
                  <a
                    href="#"
                    className={`dashboard-nav-link ${
                      isItemActive(item) ? "dashboard-active-link" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigation(item);
                      const mobileSidebar = document.getElementById("mobileSidebar");
                      if (mobileSidebar) {
                        const bsOffcanvas = window.bootstrap.Offcanvas.getInstance(mobileSidebar);
                        if (bsOffcanvas) {
                          bsOffcanvas.hide();
                        }
                      }
                    }}
                  >
                    <i className={`fa-solid ${item.icon} me-2`}></i>
                    <span>{item.label}</span>
                  </a>
                </li>
              )
            )}
          </ul>

          <div className="mt-auto pt-4 border-top">
            <a
              href="#"
              className="dashboard-nav-link"
              onClick={(e) => {
                e.preventDefault();
                onLogout();
              }}
            >
              <i className="fas fa-sign-out-alt me-2"></i>
              <span>Sign Out</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
