import { Link } from "react-router-dom";
import logo from "../../assets/logo-index.png";

function HomeHeader({
  featureRef,
  contactRef,
  whoWeServeRef,
  actionsRef,
  newsRef,
  eventsRef,
}) {
  return (
    <>
      {/* Official Banner */}
      <section className="official-banner text-white">
        <div className="container py-1">
          <div className="row align-items-center">
            <div className="col-md-6 order-md-2">
              {/* Language selector */}
              <div className="dropdown font-base text-white text-md-end mb-2 mb-md-0">
                <button
                  className="btn btn-sm dropdown-toggle font-sm fw-medium text-white border-0 text-decoration-none p-0"
                  type="button"
                  id="langDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="fa-solid fa-globe me-1"></i> Select Language
                </button>
                <ul
                  className="dropdown-menu dropdown-menu-end"
                  aria-labelledby="langDropdown"
                >
                  <li>
                    <a className="dropdown-item" href="#" hreflang="en">
                      English
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#" hreflang="es">
                      Español
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#" hreflang="zh">
                      中文
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#" hreflang="pt">
                      Português
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex align-items-center gap-2 font-sm">
                <i className="fa-solid fa-shield"></i>
                <span className="flex-grow-1">
                  An official website of the Commonwealth of Massachusetts{" "}
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
                    Here's how you know{" "}
                    <i className="fa-solid fa-chevron-down small"></i>
                  </button>
                </span>
              </div>
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
                    Official websites use .mass.gov
                  </span>
                  <br />A .mass.gov website belongs to an official government
                  organization in Massachusetts.
                </p>
              </div>
              <div className="col-md-6 d-flex">
                <span>
                  <i className="fa-solid fa-lock fa-lg me-2"></i>
                </span>
                <p className="font-sm">
                  <span className="fw-semibold">
                    Secure websites use HTTPS certificate
                  </span>
                  <br />A lock icon (<i className="fa-solid fa-lock"></i>) or{" "}
                  <code>https://</code> means you've safely connected to the
                  official website. Share sensitive information only on
                  official, secure websites.
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
              <span className="font-med fw-bold">FILIR</span>
              <small className="d-none d-md-block">
                Foreclosure Intake & Loan Information Resource
              </small>
            </div>

            <div className="d-flex gap-2 align-items-center flex-wrap">
              <Link
                className="font-base fw-medium sign-in-btn text-decoration-none"
                to="/register"
                role="button"
                aria-label="Register"
              >
                <i className="fa-solid fa-user me-1"></i> Register
              </Link>
              <div className="dropdown">
                <button
                  className="font-base fw-medium sign-in-btn dropdown-toggle"
                  type="button"
                  id="signInDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="fa-solid fa-user me-1"></i> Sign in
                </button>
                <ul
                  className="dropdown-menu dropdown-menu-end theme-dropdown"
                  aria-labelledby="signInDropdown"
                >
                  <li>
                    <Link className="dropdown-item" to="/login">
                      User
                    </Link>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#">
                      Agency Workbench
                    </a>
                  </li>
                </ul>
              </div>
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
            >
              <img
                src={logo}
                alt="icon"
                width="50"
                height="50"
                className="me-2"
              />
              <span aria-hidden="true">Mass.gov</span>
            </a>
          </div>
          <div className="font-med fw-medium">
            Division of Banks <small>(DOB)</small>
          </div>
        </div>
      </header>

      {/* Sticky Tabs (Featured links) */}
      <div className="tabs-link-featured navbar navbar-expand-lg positive-sticky top-0">
        <div className="container">
          <div className="d-lg-none"></div>
          <div className="d-flex align-items-center me-auto d-lg-none">
            <a className="font-base opacity-75" href="#" id="mobileAppName">
              Table of Contents
            </a>
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
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (featureRef.current) {
                    featureRef.current.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                  // Close mobile menu
                  const nav = document.getElementById("navbarNav");
                  if (nav && window.innerWidth < 991) {
                    const bsCollapse = new window.bootstrap.Collapse(nav, {
                      toggle: false,
                    });
                    bsCollapse.hide();
                  }
                }}
              >
                Featured
              </a>
              <a
                className="nav-link"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (contactRef.current) {
                    contactRef.current.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                  // Close mobile menu
                  const nav = document.getElementById("navbarNav");
                  if (nav && window.innerWidth < 991) {
                    const bsCollapse = new window.bootstrap.Collapse(nav, {
                      toggle: false,
                    });
                    bsCollapse.hide();
                  }
                }}
              >
                Contact Us
              </a>
              <a
                className="nav-link"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (whoWeServeRef.current) {
                    whoWeServeRef.current.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                  // Close mobile menu
                  const nav = document.getElementById("navbarNav");
                  if (nav && window.innerWidth < 991) {
                    const bsCollapse = new window.bootstrap.Collapse(nav, {
                      toggle: false,
                    });
                    bsCollapse.hide();
                  }
                }}
              >
                Who we serve
              </a>
              <a
                className="nav-link"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (actionsRef.current) {
                    actionsRef.current.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                  // Close mobile menu
                  const nav = document.getElementById("navbarNav");
                  if (nav && window.innerWidth < 991) {
                    const bsCollapse = new window.bootstrap.Collapse(nav, {
                      toggle: false,
                    });
                    bsCollapse.hide();
                  }
                }}
              >
                I want to…
              </a>
              <a
                className="nav-link"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (newsRef.current) {
                    newsRef.current.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                  // Close mobile menu
                  const nav = document.getElementById("navbarNav");
                  if (nav && window.innerWidth < 991) {
                    const bsCollapse = new window.bootstrap.Collapse(nav, {
                      toggle: false,
                    });
                    bsCollapse.hide();
                  }
                }}
              >
                News
              </a>
              <a
                className="nav-link"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (eventsRef.current) {
                    eventsRef.current.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                  // Close mobile menu
                  const nav = document.getElementById("navbarNav");
                  if (nav && window.innerWidth < 991) {
                    const bsCollapse = new window.bootstrap.Collapse(nav, {
                      toggle: false,
                    });
                    bsCollapse.hide();
                  }
                }}
              >
                Events
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default HomeHeader;
