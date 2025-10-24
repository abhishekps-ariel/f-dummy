import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants/routerConstants";
import loginImg from "../../assets/logo-sample.png";

const Sidebar = ({ activeSection, onSectionChange, onLogout }) => {
  const navigate = useNavigate();

  const handleNavigation = (section) => {
    if (section === 'dashboard') {
      navigate(ROUTES.DASHBOARD);
    } else if (section === 'petitions') {
      navigate(ROUTES.PETITIONS);
    } else if (section === 'messages') {
      navigate(ROUTES.MESSAGES);
    } else if (section === 'faq') {
      navigate(ROUTES.FAQ);
    } else if (section === 'training') {
      navigate(ROUTES.TRAINING);
    }
    onSectionChange(section);
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
            <li className="dashboard-nav-item">
              <a
                href="#"
                className={`dashboard-nav-link ${activeSection === "dashboard" ? "dashboard-active-link" : ""
                  }`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation("dashboard");
                }}
              >
                <i className="fa-solid fa-box me-2"></i>
                <span>Dashboard</span>
              </a>
            </li>
            <li className="dashboard-nav-item">
              <a
                href="#"
                className={`dashboard-nav-link ${activeSection === "petitions" ? "dashboard-active-link" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation("petitions");
                }}
              >
                <i className="fa-solid fa-file-contract me-2"></i>
                <span>Petitions</span>
              </a>
            </li>
            <li className="dashboard-nav-item">
              <a
                href="#"
                className={`dashboard-nav-link ${activeSection === "messages" ? "dashboard-active-link" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation("messages");
                }}
              >
                <i className="fa-solid fa-envelope me-2"></i>
                <span>Messages</span>
              </a>
            </li>
            <li className="dashboard-nav-item">
              <a
                href="#"
                className={`dashboard-nav-link ${activeSection === "faq" ? "dashboard-active-link" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation("faq");
                }}
              >
                <i className="fa-solid fa-question-circle me-2"></i>
                <span>FAQ</span>
              </a>
            </li>
            <li className="dashboard-nav-item">
              <a
                href="#"
                className={`dashboard-nav-link ${activeSection === "training" ? "dashboard-active-link" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation("training");
                }}
              >
                <i className="fa-solid fa-graduation-cap me-2"></i>
                <span>Training</span>
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
            <li className="dashboard-nav-item">
              <a
                href="#"
                className={`dashboard-nav-link ${activeSection === "dashboard" ? "dashboard-active-link" : ""
                  }`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation("dashboard");
                  // Close mobile sidebar if open
                  const mobileSidebar = document.getElementById("mobileSidebar");
                  if (mobileSidebar) {
                    const bsOffcanvas = window.bootstrap.Offcanvas.getInstance(mobileSidebar);
                    if (bsOffcanvas) {
                      bsOffcanvas.hide();
                    }
                  }
                }}
              >
                <i className="fa-solid fa-box me-2"></i>
                <span>Dashboard</span>
              </a>
            </li>
            <li className="dashboard-nav-item">
              <a
                href="#"
                className={`dashboard-nav-link ${activeSection === "petitions" ? "dashboard-active-link" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation("petitions");
                  // Close mobile sidebar if open
                  const mobileSidebar = document.getElementById("mobileSidebar");
                  if (mobileSidebar) {
                    const bsOffcanvas = window.bootstrap.Offcanvas.getInstance(mobileSidebar);
                    if (bsOffcanvas) {
                      bsOffcanvas.hide();
                    }
                  }
                }}
              >
                <i className="fa-solid fa-file-contract me-2"></i>
                <span>Petitions</span>
              </a>
            </li>
            <li className="dashboard-nav-item">
              <a
                href="#"
                className={`dashboard-nav-link ${activeSection === "messages" ? "dashboard-active-link" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation("messages");
                  // Close mobile sidebar if open
                  const mobileSidebar = document.getElementById("mobileSidebar");
                  if (mobileSidebar) {
                    const bsOffcanvas = window.bootstrap.Offcanvas.getInstance(mobileSidebar);
                    if (bsOffcanvas) {
                      bsOffcanvas.hide();
                    }
                  }
                }}
              >
                <i className="fa-solid fa-envelope me-2"></i>
                <span>Messages</span>
              </a>
            </li>
            <li className="dashboard-nav-item">
              <a
                href="#"
                className={`dashboard-nav-link ${activeSection === "faq" ? "dashboard-active-link" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation("faq");
                  // Close mobile sidebar if open
                  const mobileSidebar = document.getElementById("mobileSidebar");
                  if (mobileSidebar) {
                    const bsOffcanvas = window.bootstrap.Offcanvas.getInstance(mobileSidebar);
                    if (bsOffcanvas) {
                      bsOffcanvas.hide();
                    }
                  }
                }}
              >
                <i className="fa-solid fa-question-circle me-2"></i>
                <span>FAQ</span>
              </a>
            </li>
            <li className="dashboard-nav-item">
              <a
                href="#"
                className={`dashboard-nav-link ${activeSection === "training" ? "dashboard-active-link" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation("training");
                  // Close mobile sidebar if open
                  const mobileSidebar = document.getElementById("mobileSidebar");
                  if (mobileSidebar) {
                    const bsOffcanvas = window.bootstrap.Offcanvas.getInstance(mobileSidebar);
                    if (bsOffcanvas) {
                      bsOffcanvas.hide();
                    }
                  }
                }}
              >
                <i className="fa-solid fa-graduation-cap me-2"></i>
                <span>Training</span>
              </a>
            </li>
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
