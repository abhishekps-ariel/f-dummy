import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ImpersonationBanner from "./ImpersonationBanner";
import AccessibilityControls from "./AccessibilityControls";
import LanguageSwitcher from "./LanguageSwitcher";
// import NotificationDropdown from "./NotificationDropdown";
import { getUserRole } from "../../utils/storage";

const Header = ({ user, pageTitle, showMobileMenu = true, onLogout }) => {
  const { t } = useTranslation();
  return (
    <div className="dashboard-header-wrapper">
      <div className="d-flex align-items-center justify-content-between dashboard-header">
      <div className="d-flex align-items-center">
        {/* Mobile Menu Button */}
        {showMobileMenu && (
          <button
            className="btn p-2 d-lg-none me-3"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#mobileSidebar"
            aria-controls="mobileSidebar"
          >
            <i className="fas fa-bars"></i>
          </button>
        )}
        <div>
          <h1 className="h4 mb-0 fw-bold theme-color">{t("home.filir")}</h1>
          <p className="small text-muted mb-0 d-none d-md-block">{t("header.foreclosureIntakeLoanInfo")}</p>
        </div>
      </div>

      <div className="d-flex align-items-center gap-3">
        {/* Accessibility Controls - Hidden on mobile */}
        <div className="d-none d-lg-block">
          <AccessibilityControls />
        </div>

        {/* Notifications Dropdown */}
        {/* <NotificationDropdown /> */}

        {/* Language Dropdown - Show on all screens */}
        <LanguageSwitcher variant="dropdown" className="text-secondary" />

        {/* Profile Dropdown */}
        <div className="dropdown">
          <button
            className="btn p-0 d-flex align-items-center border-0 header-profile-btn"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <div className="header-profile-avatar-wrapper">
              <img
                className="rounded-circle object-fit-cover"
                src="https://static.vecteezy.com/system/resources/thumbnails/003/337/584/small/default-avatar-photo-placeholder-profile-icon-vector.jpg"
                alt="User Avatar"
                style={{ width: "40px", height: "40px", border: '2px solid #e9ecef' }}
              />
            </div>
            <div className="text-start d-none d-lg-block ms-3">
              <p className="mb-0 fw-semibold" style={{ fontSize: '0.9rem', color: '#212529', lineHeight: '1.3' }}>
                {user?.firstName} {user?.lastName}
              </p>
              <p className="mb-0" style={{ fontSize: '0.75rem', color: '#6c757d', lineHeight: '1.3' }}>
                {getUserRole(user) || t("header.nA")}
              </p>
            </div>
            <i className="fas fa-chevron-down ms-2 text-secondary d-none d-lg-block" style={{ fontSize: '0.75rem' }}></i>
          </button>

          {/* Dropdown Menu */}
          <ul className="dropdown-menu dropdown-menu-end">
            <li>
              <Link className="dropdown-item" to="/profile">
                <i className="fas fa-user me-2"></i> {t("common.profile")}
              </Link>
            </li>
            <li>
              <a className="dropdown-item" href="#">
                <i className="fas fa-cog me-2"></i> {t("common.settings")}
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
                  if (onLogout) {
                    onLogout();
                  }
                }}
              >
                <i className="fas fa-sign-out-alt me-2"></i> {t("common.logout")}
              </a>
            </li>
          </ul>
        </div>
      </div>
      </div>
      <div className="mt-2">
        <ImpersonationBanner />
      </div>
    </div>
  );
};

export default Header;
