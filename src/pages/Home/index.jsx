import logo from "../../assets/logo-index.png";
import img1 from "../../assets/loan.jpg";
import img2 from "../../assets/moneytab.jpg";
import img3 from "../../assets/flag.jpg"

function Home() {
  return (
    <div>
      {/* Official Banner */}
      <section className="official-banner text-white">
        <div className="container py-1">
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
                  <br />
                  A .mass.gov website belongs to an official government
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
                  <br />
                  A lock icon (<i className="fa-solid fa-lock"></i>) or{" "}
                  <code>https://</code> means you’ve safely connected to the
                  official website.
                  Share sensitive information only on official, secure websites.
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
            <div className="font-med fw-bold">FILIR</div>
            <small className="d-none d-sm-inline-block">
              Financial Institution Licensing & Information Registry
            </small>
          </div>

          <div className="portal-actions d-flex align-items-center gap-2">
            {/* Language selector */}
            <div className="dropdown font-base text-white">
              <button
                className="btn btn-sm dropdown-toggle font-base fw-medium text-white border-0"
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
            <div>
              <a
                className="btn btn-sm btn-outline-light me-1"
                href="/register"
                role="button"
              >
                <i className="fa-solid fa-user"></i> Register
              </a>
              <a
                className="btn btn-sm btn-outline-light"
                href="/login"
                role="button"
              >
                <i className="fa-solid fa-user"></i> Sign in
              </a>
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
              className="gov-logo font-lg fw-medium text-decoration-none sp"
            >
              <img
                src={logo}
                alt="icon"
                width="50"
                height="50"
                className="me-3"
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
          <div className="d-flex align-items-center gap-3">
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

      {/* Sections from HTML */}
      <section className="featured-items py-5" id="feature-tab">
        <div className="container">
          <h2 className="font-xl-med mb-4 fw-medium">Featured Items</h2>
          <div className="row">
            <div className="col-md-6 col-lg-4">
              <div className="item">
                <img
                  src={img1}
                  alt="Student Loan Info"
                  className="w-100"
                />
                <p>Student Loan Information for Consumers</p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="item">
                <img
                  src={img1}
                  alt="Student Loan Info"
                  className="w-100"
                />
                <p>Student Loan Information for Consumers</p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="item">
                <img
                  src={img2}
                  alt="Enforcement"
                  className="w-100"
                />
                <p>Enforcement actions</p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="item">
                <img
                  src={img3}
                  alt="Cybersecurity"
                  className="w-100"
                />
                <p>Cybersecurity for the financial services industry</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-info py-5 bg-mesgray" id="contact-info-tab">
        <div className="container">
          <h2 className="font-xl-med mb-4 fw-medium">Contact Us</h2>
          <div className="contact-details">
            <p>
              <strong>Phone:</strong> 1-800-123-4567
            </p>
            <p>
              <strong>Email:</strong> info@mass.gov
            </p>
            <p>
              <strong>Address:</strong> 1 State Street, Boston, MA 02101
            </p>
          </div>
        </div>
      </section>

      <section className="who-we-serve py-5" id="who-we-serve-tab">
        <div className="container">
          <h2 className="font-xl-med mb-4 fw-medium">Who We Serve</h2>
          <p>
            The Division of Banks serves nearly 140 state-chartered banks and
            credit unions...
          </p>
        </div>
      </section>

      <section className="actions py-5 bg-mesgray" id="i-like-info-tab">
        <div className="container">
          <h2 className="font-xl-med mb-4 fw-medium">
            What would you like to do?
          </h2>
          <ul>
            <li>
              <a href="#">Submit a complaint to the DOB</a>
            </li>
            <li>
              <a href="#">Public Records Request</a>
            </li>
            <li>
              <a href="#">Find state-chartered banks and credit unions</a>
            </li>
          </ul>
        </div>
      </section>

      <section className="news-announcements py-5" id="news-tab">
        <div className="container">
          <h2 className="font-xl-med mb-4 fw-medium">
            Recent News & Announcements
          </h2>
          <ul>
            <li>
              <a href="#">2025 Cybersecurity Month</a>
            </li>
            <li>
              <a href="#">209 CMR 20.00, 209 CMR 32.00...</a>
            </li>
            <li>
              <a href="#">Public hearing relative to 801 CMR...</a>
            </li>
          </ul>
        </div>
      </section>

      <section className="upcoming-events py-5 bg-mesgray" id="events-tab">
        <div className="container">
          <h2 className="font-xl-med mb-4 fw-medium">Upcoming Events</h2>
          <ul>
            <li>
              Oct 07: Public hearing relative to proposed amendments
            </li>
            <li>Oct 07: Public hearing relative to 209 CMR...</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

export default Home;
