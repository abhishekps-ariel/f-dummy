import { Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import logo from "../../assets/logo-index.png";
import { ROUTES } from "../../constants/routerConstants";
import LanguageSwitcher from "../shared/LanguageSwitcher";

function HomeHeader({
  featureRef,
  contactRef,
  whoWeServeRef,
  actionsRef,
  newsRef,
  eventsRef,
  hideNavigation = false,
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const handleNavBarClick = (e) => {
    if (globalThis.innerWidth >= 992) return;
    const nav = document.getElementById("navbarNav");
    if (!nav) return;
    const isNavLink = e.target.closest(".nav-link");
    const isToggler = e.target.closest(".navbar-toggler");
    if (isNavLink || isToggler) return;
    if (!nav.classList.contains("show")) {
      const bsCollapse = new globalThis.bootstrap.Collapse(nav, { toggle: false });
      bsCollapse.show();
    }
  };

  const handleNavBarKeyDown = (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    handleNavBarClick(e);
  };
  
  return (
    <>
      {/* Official Banner */}
      <section className="official-banner text-white">
        <div className="container py-1">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2 font-sm">
              <i className="fa-solid fa-shield"></i>
              <span>
                {t("home.officialBanner")}{" "}
                <button
                  className="btn btn-link text-white p-0 font-sm fw-semibold text-nowrap ms-1 align-baseline"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#officialInfo"
                  aria-expanded="false"
                  aria-controls="officialInfo"
                  style={{
                    display: "inline",
                    verticalAlign: "baseline",
                    lineHeight: "1.2",
                  }}
                >
                  {t("home.howYouKnow")}{" "}
                  <i className="fa-solid fa-chevron-down small"></i>
                </button>
              </span>
            </div>
            {/* Language selector */}
            <div>
              <LanguageSwitcher 
                className="font-base"
                variant="dropdown"
                textColor="white"
              />
            </div>
          </div>

          <div className="collapse mt-2" id="officialInfo">
            <div className="row g-3 pt-2">
              <div className="col-md-6 d-flex">
                <span>
                  <i className="fa-solid fa-landmark fa-lg me-2"></i>
                </span>
                <p className="font-sm">
                  <span className="fw-semibold">
                    {t("home.officialWebsites")}
                  </span>
                  <br />{t("home.officialWebsitesDesc")}
                </p>
              </div>
              <div className="col-md-6 d-flex">
                <span>
                  <i className="fa-solid fa-lock fa-lg me-2"></i>
                </span>
                <p className="font-sm">
                  <span className="fw-semibold">
                    {t("home.secureWebsites")}
                  </span>
                  <br />{t("home.secureWebsitesDesc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blue Portal Banner */}
      <div className="portal-banner">
        <div className="container">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div className="d-flex flex-wrap align-items-center gap-2 gap-md-3">
              <span className="font-med fw-bold">{t("home.filir")}</span>
              <small className="d-none d-md-block">
                {t("home.filirSubtitle")}
              </small>
            </div>

            <div className="d-flex gap-2 align-items-center flex-wrap">
              <div className="dropdown">
                <button
                  className="font-base fw-medium sign-in-btn dropdown-toggle"
                  type="button"
                  id="registerDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="fa-solid fa-user me-1"></i> {t("common.register")}
                </button>
                <ul
                  className="dropdown-menu dropdown-menu-end theme-dropdown"
                  aria-labelledby="registerDropdown"
                >
                  <li>
                    <Link className="dropdown-item" to="/register?role=filer">
                      {t("home.filer")}
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/register?role=orgAdmin">
                      {t("home.organisationAdmin")}
                    </Link>
                  </li>
                </ul>
              </div>
              <Link
                className="font-base fw-medium sign-in-btn text-decoration-none"
                to="/login"
                role="button"
                aria-label="Sign in"
              >
                <i className="fa-solid fa-user me-1"></i> {t("common.signIn")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mass.gov Banner */}
      <header className="massgov-banner">
        <div className="container d-flex flex-wrap gap-2 align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <a
              href="#!"
              className="gov-logo font-lg fw-medium text-decoration-none"
              onClick={(e) => {
                e.preventDefault();
                navigate(ROUTES.HOME);
              }}
              style={{ cursor: "pointer" }}
            >
              <img
                src={logo}
                alt="icon"
                width="50"
                height="50"
                className="me-2"
              />
              <span aria-hidden="true">{t("home.massgov")}</span>
            </a>
          </div>
          <div className="font-med fw-medium">
            {t("home.divisionOfBanks")} <small>{t("home.dob")}</small>
          </div>
        </div>
      </header>

      {/* Sticky Tabs (Featured links) - Hidden on public petition page */}
      {!hideNavigation && (
        <div
          className="tabs-link-featured navbar navbar-expand-lg positive-sticky top-0"
          role="button"
          tabIndex={0}
          onClick={handleNavBarClick}
          onKeyDown={handleNavBarKeyDown}
        >
        <div className="container">
          <div className="d-lg-none"></div>
          <div className="d-flex align-items-center me-auto d-lg-none">
            <span className="font-base opacity-75 fw-semibold" id="mobileAppName">
              {t("home.tableOfContents")}
            </span>
            <span className="active-text d-none" id="activeLinkText">
              Featured
            </span>
          </div>

          {/* Hamburger Toggler (Visible ONLY on mobile/small screens) */}
          <button
            className="navbar-toggler shadow-none font-lg ms-primary-green featured-collapse-icon border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            +
          </button>

          {/* Collapsible Menu Content */}
          <div className="collapse navbar-collapse" id="navbarNav">
            <div className="navbar-nav d-flex flex-column flex-lg-row">
              {/* Links */}
              <a
                className="nav-link"
                href="#featured"
                onClick={(e) => {
                  e.preventDefault();
                  if (featureRef.current) {
                    featureRef.current.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                  const nav = document.getElementById("navbarNav");
                  if (nav && globalThis.innerWidth < 991) {
                    const bsCollapse = new globalThis.bootstrap.Collapse(nav, {
                      toggle: false,
                    });
                    bsCollapse.hide();
                  }
                }}
              >
                {t("home.featured")}
              </a>
              <a
                className="nav-link"
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  if (contactRef.current) {
                    contactRef.current.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                  const nav = document.getElementById("navbarNav");
                  if (nav && globalThis.innerWidth < 991) {
                    const bsCollapse = new globalThis.bootstrap.Collapse(nav, {
                      toggle: false,
                    });
                    bsCollapse.hide();
                  }
                }}
              >
                {t("home.contactUs")}
              </a>
              <a
                className="nav-link"
                href="#whoWeServe"
                onClick={(e) => {
                  e.preventDefault();
                  if (whoWeServeRef.current) {
                    whoWeServeRef.current.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                  const nav = document.getElementById("navbarNav");
                  if (nav && globalThis.innerWidth < 991) {
                    const bsCollapse = new globalThis.bootstrap.Collapse(nav, {
                      toggle: false,
                    });
                    bsCollapse.hide();
                  }
                }}
              >
                {t("home.whoWeServe")}
              </a>
              <a
                className="nav-link"
                href="#actions"
                onClick={(e) => {
                  e.preventDefault();
                  if (actionsRef.current) {
                    actionsRef.current.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                  const nav = document.getElementById("navbarNav");
                  if (nav && globalThis.innerWidth < 991) {
                    const bsCollapse = new globalThis.bootstrap.Collapse(nav, {
                      toggle: false,
                    });
                    bsCollapse.hide();
                  }
                }}
              >
                {t("home.iWantTo")}
              </a>
              <a
                className="nav-link"
                href="#news"
                onClick={(e) => {
                  e.preventDefault();
                  if (newsRef.current) {
                    newsRef.current.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                  const nav = document.getElementById("navbarNav");
                  if (nav && globalThis.innerWidth < 991) {
                    const bsCollapse = new globalThis.bootstrap.Collapse(nav, {
                      toggle: false,
                    });
                    bsCollapse.hide();
                  }
                }}
              >
                {t("home.news")}
              </a>
              <a
                className="nav-link"
                href="#events"
                onClick={(e) => {
                  e.preventDefault();
                  if (eventsRef.current) {
                    eventsRef.current.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                  const nav = document.getElementById("navbarNav");
                  if (nav && globalThis.innerWidth < 991) {
                    const bsCollapse = new globalThis.bootstrap.Collapse(nav, {
                      toggle: false,
                    });
                    bsCollapse.hide();
                  }
                }}
              >
                {t("home.events")}
              </a>
            </div>
          </div>
        </div>
      </div>
      )}
    </>
  );
}

HomeHeader.propTypes = {
  featureRef: PropTypes.shape({
    current: PropTypes.instanceOf(Element),
  }),
  contactRef: PropTypes.shape({
    current: PropTypes.instanceOf(Element),
  }),
  whoWeServeRef: PropTypes.shape({
    current: PropTypes.instanceOf(Element),
  }),
  actionsRef: PropTypes.shape({
    current: PropTypes.instanceOf(Element),
  }),
  newsRef: PropTypes.shape({
    current: PropTypes.instanceOf(Element),
  }),
  eventsRef: PropTypes.shape({
    current: PropTypes.instanceOf(Element),
  }),
  hideNavigation: PropTypes.bool,
};

export default HomeHeader;
