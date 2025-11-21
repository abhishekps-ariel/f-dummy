import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ROUTES } from "../../constants/routerConstants";
import loginImg from "../../assets/logo-sample.png";

const Sidebar = ({ activeSection, onSectionChange, onLogout }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
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
            <span>{t("sidebar.signOut")}</span>
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
