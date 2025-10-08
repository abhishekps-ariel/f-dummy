import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "../../assets/logo-index.png";
import img1 from "../../assets/loan.jpg";
import img2 from "../../assets/moneytab.jpg";
import img3 from "../../assets/flag.jpg";
import coinsImg from "../../assets/coins.png";

function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show loading for a brief moment when page loads
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Official Banner */}
      <section className="official-banner text-white">
        <div className="container py-1">
          <div className="d-flex justify-content-between flex-wrap">
          <div className="d-flex flex-wrap align-items-center">
            <div className="d-flex align-items-center gap-2 font-sm">
              <i className="fa-solid fa-shield"></i>
              An official website of the Commonwealth of Massachusetts
            </div>
            <button
              className="btn btn-link text-white p-0 ms-1 font-sm fw-semibold"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#officialInfo"
              aria-expanded="false"
              aria-controls="officialInfo"
            >
              Here's how you know{" "}
              <i className="fa-solid fa-chevron-down small"></i>
            </button>
          </div>

            {/* Language selector */}
            <div className="dropdown font-base text-white">
              <button
                className="btn btn-sm dropdown-toggle font-sm fw-medium text-white border-0 text-decoration-none"
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
        <div className="container d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <span className="font-med fw-bold">FILIR</span>
            <small>Foreclosure Intake & Loan Information Resource</small>
          </div>

          <div className="d-flex gap-2 align-items-center">
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
                  <Link className="dropdown-item" to="/login">
                    Agency Workbench
            </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Mass.gov Banner */}
      <header className="massgov-banner">
        <div className="container d-flex align-items-center justify-content-between">
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
      <div className="tabs-link-featured positive-sticky top-0">
        <div className="container">
          <div className="d-flex align-items-center">
            <a href="#feature-tab">Featured</a>
            <a href="#contact-info-tab">Contact Us</a>
            <a href="#who-we-serve-tab">Who we serve</a>
            <a href="#i-like-info-tab">I want to…</a>
            <a href="#news-tab">News</a>
            <a href="#events-tab">Events</a>
          </div>
        </div>
      </div>

      {/* Intro Text */}
      <div className="container pt-4">
        <p className="text-dark-black font-med fw-semibold">
          The Division of Banks (DOB) is the chartering authority and primary
          regulator for financial service providers in Massachusetts. DOB's
          primary mission is to ensure a sound, competitive, and accessible
          financial services environment throughout the Commonwealth.
        </p>
      </div>

      {/* Featured Items Section */}
      <section className="featured-items py-5" id="feature-tab">
        <div className="container">
          <h2 className="font-xl-med mb-4 fw-medium heading-divider">
            Featured Items
          </h2>
          <div className="row">
            <div className="col-md-6 col-lg-4">
              <div className="item">
                <img
                  src={coinsImg}
                  alt="Financial and Climate-Related Risk Resources"
                  className="w-100"
                />
                <p>Financial and Climate-Related Risk Resources</p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="item">
                <img src={img1} alt="Student Loan Info" className="w-100" />
                <p>Student Loan Information for Consumers</p>
              </div>
              <div className="item">
                <img src={img2} alt="Enforcement" className="w-100" />
                <p>Enforcement actions</p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="item">
                <img
                  src={img3}
                  alt="New Money Transmission Law"
                  className="w-100"
                />
                <p>New Money Transmission Law</p>
              </div>
              <div className="item">
                <img src={img3} alt="Cybersecurity" className="w-100" />
                <p>Cybersecurity for the financial services industry</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-info py-5" id="contact-info-tab">
        <div className="container">
          <h2 className="font-xl-med mb-4 fw-medium heading-divider">
            Contact Us
          </h2>
          <div className="row g-5">
            {/* Left Column: Online and Phone */}
            <div className="col-12 col-md-4 vr-border-right position-relative">
              {/* Online Section */}
              <div className="mb-5">
                <h3 className="fs-5 fw-semibold icon-header mb-3">
                  <i className="fa-solid fa-desktop me-2 ms-primary-green"></i>{" "}
                  Online
                </h3>
                <p className="mb-1 fw-medium">Contact us</p>
                <a href="#" className="text-decoration-hover fw-medium">
                  Contact detail by unit or inquiry
                </a>
              </div>
              {/* Phone Section */}
              <div>
                <h3 className="fs-5 fw-semibold icon-header mb-3">
                  <i className="fa-solid fa-phone me-2 ms-primary-green"></i>{" "}
                  Phone
                </h3>
                <p className="mb-1 fw-medium">
                  Main{" "}
                  <a
                    href="tel:+16179561500"
                    className="fw-medium text-decoration-hover"
                  >
                    (617) 956-1500
                  </a>
                </p>
                <p className="font-sm mb-3">
                  Open Monday through Friday 9:00 am - 4:00 pm.
                </p>

                <p className="mb-1 fw-medium">
                  Toll-Free{" "}
                  <a
                    href="tel:+18004952265"
                    className="fw-medium text-decoration-hover"
                  >
                    (800) 495-BANK (2265)
                  </a>
                </p>
                <p className="font-sm mb-3">
                  Open Monday through Friday 9:00 am - 4:00 pm.
                </p>

                <p className="mb-1 fw-medium">
                  TDD{" "}
                  <a
                    href="tel:+16179561577"
                    className="fw-medium text-decoration-hover"
                  >
                    (617) 956-1577
                  </a>
                </p>
                <p className="font-sm mb-0">
                  Open Monday through Friday 9:00 am - 4:00 pm. Use this number
                  if you are hearing impaired.
                </p>
              </div>
            </div>

            {/* Right Column: Address */}
            <div className="col-12 col-md-4">
              <div className="ps-md-3">
                <h3 className="fs-5 fw-semibold icon-header mb-3">
                  <i className="fa-solid fa-map-marker-alt me-2 ms-primary-green"></i>{" "}
                  Address
                </h3>
                <p className="mb-1 fw-medium">Main Office</p>
                <p className="mb-1">One Federal Street</p>
                <p className="mb-1">Suite 710</p>
                <p className="mb-3">Boston, MA 02110-2012</p>
                <a href="#" className="text-decoration-hover fw-medium">
                  Directions
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Serve Section */}
      <section className="who-we-serve py-5" id="who-we-serve-tab">
        <div className="container">
          <h2 className="font-xl-med mb-4 fw-medium heading-divider">
            Who We Serve
          </h2>
          <p className="font-base-med">
            The DOB supervises nearly 140 state-chartered banks and credit
            unions and over 14,500 non-depository licensees doing business in
            Massachusetts. The supervision of these entities allow us to
            implement and enforce consumer protection laws while providing
            consumers the information needed to make informed financial
            decisions.
          </p>
          <p className="font-base-med">
            Non-depository institutions doing business in Massachusetts
            supervised by the DOB include:
          </p>
          <ul className="font-base-med d-flex flex-column gap-2">
            <li>Mortgage lenders</li>
            <li>Mortgage brokers</li>
            <li>Mortgage loan originators</li>
            <li>Consumer finance companies</li>
            <li>Money service businesses</li>
            <li>Debt collectors</li>
            <li>Loan servicers</li>
            <li>Student Loan servicers</li>
          </ul>
          <div className="d-flex flex-column gap-4">
            <a href="#!" className="font-base-med fw-medium">
              Learn more about the DOB, the departmental units, and the
              Commissioner of Banks.
            </a>
            <h4>
              <i className="font-lg-med fa-brands fa-linkedin-in me-2 ms-primary-green"></i>{" "}
              <a href="#!" className="font-base-med fw-medium">
                DOB LinkedIn{" "}
              </a>
            </h4>
          </div>
        </div>
      </section>

      <section className="actions py-5 bg-mesgray" id="i-like-info-tab">
        <div className="container">
          <h2 className="font-xl-med mb-4 fw-medium heading-divider">
            What would you like to do?
          </h2>

          <div className="row justify-content-center mb-5">
            <div className="col-md-4">
              <div className="link-box-theme">
                <a href="#" className="text-decoration-hover">
                  Submit a complaint to the DOB &rarr;
                </a>
              </div>
            </div>
            <div className="col-md-4">
              <div className="link-box-theme">
                <a href="#" className="text-decoration-hover">
                  Public Records Request &rarr;
                </a>
              </div>
            </div>
            <div className="col-md-4">
              <div className="link-box-theme">
                <a href="#" className="text-decoration-hover">
                  Find state-chartered banks and credit unions &rarr;
                </a>
              </div>
            </div>
          </div>

          <div className="more-actions-card">
            <div
              className="d-flex justify-content-between align-items-center mb-0"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target=".more-actions-collapse"
            >
              <h5 className="mb-0">More actions & services</h5>
              <span className="badge bg-success rounded-pill">4</span>
            </div>

            <div className="accordion" id="moreActionsAccordion">
              <div className="accordion-item rounded-0 border-0 pt-3">
                <div
                  id="moreActionsList"
                  className="collapse show more-actions-collapse border-0"
                  data-bs-parent="#moreActionsAccordion"
                >
                  <ul className="row related-organizations-list g-2 mt-2">
                    <li className="col-12">
                      <a
                        href="#"
                        className="font-base-med fw-medium text-decoration-hover"
                      >
                        Cybersecurity for Consumers and the Financial Industry
                      </a>
                    </li>
                    <li className="col-12">
                      <a
                        href="#"
                        className="font-base-med fw-medium text-decoration-hover"
                      >
                        Protecting Older Adults from Abuse
                      </a>
            </li>
                    <li className="col-12">
                      <a
                        href="#"
                        className="font-base-med fw-medium text-decoration-hover"
                      >
                        Division of Banks Licenses
                      </a>
            </li>
                    <li className="col-12">
                      <a
                        href="#"
                        className="font-base-med fw-medium text-decoration-hover"
                      >
                        DOB Connects
                      </a>
            </li>
          </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="news-announcements py-5" id="news-tab">
        <div className="container">
          <h2 className="font-xl-med mb-4 fw-medium heading-divider">
            Recent News & Announcements
          </h2>
          <div className="row g-5">
            <div className="col-md-6 col-lg-4">
              <div className="news-item">
                <span className="news-tag font-xs text-uppercase fw-medium">
                  News
                </span>
                <h4 className="mt-2">
                  <a
                    href="#!"
                    className="font-med theme-color text-decoration-hover"
                  >
                    2025 Cybersecurity Awareness Month: Update Software
                  </a>
                </h4>
                <p className="timestamp font-sm fw-semibold text-dark-black">
                  <i>10/06/2025</i> <span>|</span> <i>Division of Banks</i>
                </p>
                <p className="font-base">
                  Cybersecurity Awareness Month 2025: Update Software to enhance
                  protection.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="news-item">
                <span className="news-tag font-xs text-uppercase fw-medium">
                  Press Release
                </span>
                <h4 className="mt-2">
                  <a
                    href="#!"
                    className="font-med theme-color text-decoration-hover"
                  >
                    Treasurer's Office of Economic Empowerment, Division of
                    Banks Announce 2026 Funding for High School Financial
                    Education Fairs
                  </a>
                </h4>
                <p className="timestamp font-sm fw-semibold text-dark-black">
                  <i>10/06/2025</i> <span>|</span>{" "}
                  <i>
                    Office of State Treasurer and Receiver General Deborah B.
                    Goldberg
                  </i>
                </p>
                <p className="font-base">
                  Massachusetts high schools can apply to receive a grant to
                  host a financial education fair for their students.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="news-item">
                <span className="news-tag font-xs text-uppercase fw-medium">
                  News
                </span>
                <h4 className="mt-2">
                  <a
                    href="#!"
                    className="font-med theme-color text-decoration-hover"
                  >
                    Juma Financial Services, LLC d/b/a Juma Grocery and Check
                    Services, Marlborough - Permission to operate as a check
                    casher
                  </a>
                </h4>
                <p className="timestamp font-sm fw-semibold text-dark-black">
                  <i>10/06/2025</i> <span>|</span> <i>Division of Banks</i>
                </p>
                <p className="font-base">
                  Comment period from October 17, 2025, through October 31,
                  2025.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="news-item">
                <span className="news-tag font-xs text-uppercase fw-medium">
                  News
                </span>
                <h4 className="mt-2">
                  <a
                    href="#!"
                    className="font-med theme-color text-decoration-hover"
                  >
                    2025 Cybersecurity Month
                  </a>
                </h4>
                <p className="timestamp font-sm fw-semibold text-dark-black">
                  <i>10/01/2025</i> <span>|</span> <i>Division of Banks</i>
                </p>
                <p className="font-base">
                  October is Cybersecurity Awareness Month.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="news-item font-sm">
                <span className="news-tag font-xs text-uppercase fw-medium">
                  News
                </span>
                <h4 className="mt-2">
                  <a
                    href="#!"
                    className="font-med theme-color text-decoration-hover"
                  >
                    209 CMR 20.00, 209 CMR 32.00, and 209 CMR 42.00: Final
                    Amendments
                  </a>
                </h4>
                <p className="timestamp font-sm fw-semibold text-dark-black">
                  <i>9/23/2025</i> <span>|</span> <i>Division of Banks</i>
                </p>
                <p className="font-base">Effective October 10, 2025.</p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="news-item">
                <span className="news-tag font-xs text-uppercase fw-medium">
                  News
                </span>
                <h4 className="mt-2">
                  <a
                    href="#!"
                    className="font-med theme-color text-decoration-hover"
                  >
                    Public Hearing Relative to 801 CMR 4.02: Rates
                  </a>
                </h4>
                <p className="timestamp font-sm fw-semibold text-dark-black">
                  <i>9/12/2025</i> <span>|</span> <i>Division of Banks</i>
                </p>
                <p className="font-base">
                  Hybrid public hearing to be held on October 7, 2025, at 10:00
                  am at One Federal Street, Boston, MA 02110.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 mt-md-5">
            <a href="#" className="font-base-med fw-medium">
              See all news and announcements
            </a>
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="upcoming-events py-5" id="events-tab">
        <div className="container">
          <h2 className="font-xl-med mb-4 fw-medium heading-divider">
            Upcoming Events
          </h2>
          <div className="row g-4 g-md-5">
            {/* Event Card 1 */}
            <div className="col-12 col-md-6">
              <div className="d-flex align-items-start">
                {/* Date Block */}
                <div className="date-block-container me-3 me-md-4">
                  <div className="font-base-med fw-medium">Oct</div>
                  <div className="font-xl fw-bold ms-green">07</div>
                </div>

                {/* Event Details */}
                <div className="flex-grow-1">
                  <a
                    href="#"
                    className="font-med theme-color text-decoration-hover"
                  >
                    Public hearing relative to proposed amendments to{" "}
                    <span className="fw-bold">801 CMR 4.02: Rates</span>
                  </a>
                  <p className="font-sm fw-semibold text-dark-black fst-italic">
                    One Federal Street, Gold Room (Room 6017), Boston, MA 02110
                  </p>
                  <p className="font-sm fw-semibold text-dark-black fst-italic">
                    10 a.m. - 10:15 a.m.
                  </p>
                  <p className="font-base mt-3 mb-0">
                    Public hearing relative to proposed amendments to 801 CMR
                    4.02: Rates
                  </p>
                </div>
              </div>
            </div>

            {/* Event Card 2 */}
            <div className="col-12 col-md-6">
              <div className="d-flex align-items-start">
                {/* Date Block */}
                <div className="date-block-container me-3 me-md-4">
                  <div className="font-base-med fw-medium">Oct</div>
                  <div className="font-xl fw-bold ms-green">07</div>
                </div>

                {/* Event Details */}
                <div className="flex-grow-1">
                  <a
                    href="#"
                    className="font-med theme-color text-decoration-hover"
                  >
                    Public hearing relative to{" "}
                    <span className="fw-bold">
                      209 CMR 44.00, 45.00, and 48.00
                    </span>
                  </a>
                  <p className="font-sm fw-semibold text-dark-black fst-italic">
                    One Federal Street, Gold Room (Room 6017), Boston, MA 02110
                  </p>
                  <p className="font-sm fw-semibold text-dark-black fst-italic">
                    10:30 a.m. - 11:30 a.m.
                  </p>
                  <p className="font-base mt-3 mb-0">
                    Public hearing relative to 209 CMR 44.00, 45.00, and 48.00
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* See all events link */}
          <div className="mt-4 mt-md-5">
            <a href="#" className="font-base-med fw-medium">
              See all events
            </a>
          </div>
        </div>
      </section>

      <section className="related-organisation py-5">
        <div className="container">
          <h2 className="font-xl-med mb-4 fw-medium heading-divider">
            Related organizations
          </h2>

          {/* Organization List */}
          <ul className="row related-organizations-list g-2 mt-2">
            <li className="col-12 col-md-6">
              <a
                href="#"
                className="font-base-med fw-medium text-decoration-hover"
              >
                Office of Consumer Affairs and Business Regulation
              </a>
            </li>
            <li className="col-12 col-md-6">
              <a
                href="#"
                className="font-base-med fw-medium text-decoration-hover"
              >
                Executive Office of Economic Development
              </a>
            </li>
            <li className="col-12 col-md-6">
              <a
                href="#"
                className="font-base-med fw-medium text-decoration-hover"
              >
                Office of the Attorney General
              </a>
            </li>
            <li className="col-12 col-md-6">
              <a
                href="#"
                className="font-base-med fw-medium text-decoration-hover"
              >
                Office of State Treasurer and Receiver General Deborah B.
                Goldberg
              </a>
            </li>
          </ul>
        </div>
      </section>

      <section className="related-organisation py-5">
        <div className="container">
          <h2 className="font-xl-med mb-4 fw-medium heading-divider">
            Division of Banks information
          </h2>

          {/* Organization List */}
          <ul className="row related-organizations-list g-2 mt-2">
            <li className="col-12">
              <a
                href="#"
                className="font-base-med fw-medium text-decoration-hover"
              >
                Agency overview
              </a>
            </li>
            <li className="col-12">
              <a
                href="#"
                className="font-base-med fw-medium text-decoration-hover"
              >
                Staff directory by unit
              </a>
            </li>
            <li className="col-12">
              <a
                href="#"
                className="font-base-med fw-medium text-decoration-hover"
              >
                Employment
              </a>
            </li>
            <li className="col-12">
              <a
                href="#"
                className="font-base-med fw-medium text-decoration-hover"
              >
                Register for the DOB listserv e-mail delivery
              </a>
            </li>
            <li className="col-12">
              <a
                href="#"
                className="font-base-med fw-medium text-decoration-hover"
              >
                DOB Public Records Request
              </a>
            </li>
          </ul>
        </div>
      </section>

      <footer className="app-footer py-4">
        <div className="container">
          <div className="row align-items-center">
            {/* Left Column: Seal/Logo */}
            <div className="col-12 col-md-2 text-center text-md-start mb-3 mb-md-0">
              <div className="footer-logo">
                <img src={logo} alt="logo" className="w-100" />
              </div>
            </div>

            <div className="col-12 col-md-10 text-center text-md-start">
              <ul className="footer-links d-flex justify-content-center justify-content-md-start font-base-med fw-medium mb-4 list-unstyled gap-4">
                <li>
                  <a href="#" className="text-dark text-decoration-none">
                    All Topics
                  </a>
                </li>
                <li>
                  <a href="#" className="text-dark text-decoration-none">
                    Site Policies
                  </a>
                </li>
                <li>
                  <a href="#" className="text-dark text-decoration-none">
                    Public Records Requests
                  </a>
                </li>
              </ul>

              {/* Copyright Information */}
              <p className="mb-1 font-sm text-gray-dark fw-medium">
                &copy; 2025 Commonwealth of Massachusetts.
              </p>
              <p className="mb-0 font-sm text-gray-dark">
                Mass.gov® is a registered service mark of the Commonwealth of
                Massachusetts.
                <a href="#" className="text-decoration-underline  mx-2">
                  Mass.gov
                </a>
                <a href="#" className="text-decoration-underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
