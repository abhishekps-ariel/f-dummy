import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ROUTES } from "../../constants/routerConstants";
import loginImg from "../../assets/logo-sample.png";

const Sidebar = ({ activeSection, onSectionChange, onLogout }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  // Initialize from localStorage immediately to prevent flash of wrong state
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    return savedState !== null ? savedState === 'true' : false;
  });

  // Save collapsed state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
  }, [isCollapsed]);
  
  const filerNavItems = [
    {
      key: "dashboard",
      label: t("sidebar.dashboard"),
      icon: "fa-box",
      route: ROUTES.DASHBOARD,
    },
    {
      key: "petitions",
      label: t("sidebar.petitions"),
      icon: "fa-file-contract",
      route: ROUTES.PETITIONS,
    },
    {
      key: "messages",
      label: t("sidebar.messages"),
      icon: "fa-envelope",
      route: ROUTES.MESSAGES,
    },
    {
      key: "faq",
      label: t("sidebar.faq"),
      icon: "fa-question-circle",
      route: ROUTES.FAQ,
    },
    {
      key: "training",
      label: t("sidebar.training"),
      icon: "fa-graduation-cap",
      route: ROUTES.TRAINING,
    },
  ];
  
  // Org admin uses the same navigation as regular filers
  const combinedNavItems = filerNavItems;

  const handleNavigation = (item) => {
    if (item.route) {
      navigate(item.route);
    }
    if (onSectionChange) {
      onSectionChange(item.key);
    }
    // Don't expand sidebar when clicking navigation items - keep it collapsed
    // Sidebar state remains unchanged
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

  // Update CSS variable for sidebar width
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '80px' : '260px');
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Sidebar - Desktop Only */}
      <aside className={`dashboard-sidebar d-none d-lg-flex flex-column ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="logo-box" style={{ padding: isCollapsed ? "0.8rem 0.5rem" : "0.8rem 1rem 2rem 1rem", position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>
          {/* Toggle Button - Hamburger when collapsed, arrow when expanded */}
          {isCollapsed ? (
            <button
              className="sidebar-toggle-btn"
              onClick={toggleSidebar}
              title={t("sidebar.expand") || "Expand sidebar"}
              style={{
                background: "transparent",
                border: "none",
                color: "#666",
                cursor: "pointer",
                padding: "0.75rem",
                borderRadius: "4px",
                transition: "all 0.2s",
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
              }}
              onMouseEnter={(e) => e.target.style.background = "#f5f5f5"}
              onMouseLeave={(e) => e.target.style.background = "transparent"}
            >
              <i className="fas fa-bars" style={{ fontSize: "1.2rem" }}></i>
            </button>
          ) : (
            <>
              {/* Toggle Button - Arrow when expanded */}
              <button
                className="sidebar-toggle-btn"
                onClick={toggleSidebar}
                title={t("sidebar.collapse") || "Collapse sidebar"}
                style={{
                  position: "absolute",
                  top: "1rem",
                  right: "0.5rem",
                  background: "transparent",
                  border: "none",
                  color: "#666",
                  cursor: "pointer",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  transition: "all 0.2s",
                  zIndex: 10
                }}
                onMouseEnter={(e) => e.target.style.background = "#f5f5f5"}
                onMouseLeave={(e) => e.target.style.background = "transparent"}
              >
                <i className="fas fa-chevron-left"></i>
              </button>

              {/* Logo - Only show when expanded */}
              <div className="dashboard-logo">
                <img
                  src={loginImg}
                  alt="FILIR Logo"
                  className="dashboard-logo-img"
                  style={{ width: "150px", height: "150px" }}
                />
              </div>
            </>
          )}
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
                    title={isCollapsed ? item.label : undefined}
                  >
                    <i className={`fa-solid ${item.icon} ${isCollapsed ? '' : 'me-2'}`}></i>
                    {!isCollapsed && <span>{item.label}</span>}
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
            title={isCollapsed ? t("sidebar.signOut") : undefined}
          >
            <i className={`fas fa-sign-out-alt ${isCollapsed ? '' : 'me-2'}`}></i>
            {!isCollapsed && <span>{t("sidebar.signOut")}</span>}
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
            aria-label={t("common.close")}
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
              <span>{t("sidebar.signOut")}</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
