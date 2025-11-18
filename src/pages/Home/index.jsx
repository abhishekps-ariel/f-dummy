import { useRef } from "react";
import img1 from "../../assets/loan.jpg";
import img2 from "../../assets/moneytab.jpg";
import img3 from "../../assets/flag.jpg";
import coinsImg from "../../assets/coins.png";
import HomeHeader from "../../components/Home/HomeHeader";
import HomeFooter from "../../components/Home/HomeFooter";

function Home() {
  // Create refs for each section
  const featureRef = useRef(null);
  const contactRef = useRef(null);
  const whoWeServeRef = useRef(null);
  const actionsRef = useRef(null);
  const newsRef = useRef(null);
  const eventsRef = useRef(null);
  
  return (
    <div>
      <HomeHeader
        featureRef={featureRef}
        contactRef={contactRef}
        whoWeServeRef={whoWeServeRef}
        actionsRef={actionsRef}
        newsRef={newsRef}
        eventsRef={eventsRef}
      />

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
      <section
        className="featured-items py-4 py-lg-5"
        id="feature-tab"
        ref={featureRef}
      >
        <div className="container">
          <h2 className="font-xl-med mb-4 fw-medium heading-divider">
            Featured Items
          </h2>
          <div className="row">
            <div className="col-md-6 col-lg-4">
              <div className="item">
                <img src={coinsImg} alt="Student Loan Info" className="w-100" />
                <p>Financial and Climate-Related Risk Resources</p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="item">
                <img src={img1} alt="Student Loan Info" className="w-100" />
                <p>Student Loan Information for Consumers</p>
              </div>
              <div className="item">
                <img src={img3} alt="Student Loan Info" className="w-100" />
                <p>Enforcement actions</p>
              </div>
            </div>
            <div className="col-md-12 col-lg-4">
              <div className="row">
                <div className="col-md-6 col-lg-12">
                  <div className="item">
                    <img src={img2} alt="Student Loan Info" className="w-100" />
                    <p>New Money Transmission Law</p>
                  </div>
                </div>
                <div className="col-md-6 col-lg-12">
                  <div className="item">
                    <img
                      src={img2}
                      alt="New Transmission Law"
                      className="w-100"
                    />
                    <p>Cybersecurity for the financial services industry</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="contact-info py-4 py-lg-5"
        id="contact-info-tab"
        ref={contactRef}
      >
        <div className="container">
          <h2 className="font-xl-med mb-4 fw-medium heading-divider">
            Contact Us
          </h2>
          <div className="row g-5">
            {/* Left Column: Online and Phone */}
            <div className="col-12 col-md-6 col-lg-4 vr-border-right position-relative">
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
            <div className="col-12 col-md-6 col-lg-4">
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
      <section
        className="who-we-serve pt-5"
        id="who-we-serve-tab"
        ref={whoWeServeRef}
      >
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

      <section
        className="actions py-4 py-lg-5 bg-mesgray"
        id="i-like-info-tab"
        ref={actionsRef}
      >
        <div className="container">
          <div className="green-title-box position-relative">
            <h2 className="font-xl-med mb-4 fw-medium">
              What would you like to do?
            </h2>
          </div>

          <div className="row mb-5 g-2 g-md-4">
            <div className="col-md-6 col-lg-4">
              <div className="link-box-theme">
                <a href="#" className="text-decoration-hover">
                  Submit a complaint to the DOB &rarr;
                </a>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="link-box-theme">
                <a href="#" className="text-decoration-hover">
                  Public Records Request &rarr;
                </a>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
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

            <div className="accordion " id="moreActionsAccordion">
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
                        Division of Banks Licenses{" "}
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

      <section
        className="news-announcements py-4 py-lg-5"
        id="news-tab"
        ref={newsRef}
      >
        <div className="container">
          <h2 className="font-xl-med mb-4 fw-medium heading-divider">
            Recent News & Announcements
          </h2>
          <div className="row g-5">
            <div className="col-lg-4">
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
            <div className="col-lg-4">
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
            <div className="col-lg-4">
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
            <div className="col-lg-4">
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
            <div className="col-lg-4">
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
            <div className="col-lg-4">
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
      <section
        className="upcoming-events py-4 py-lg-5"
        id="events-tab"
        ref={eventsRef}
      >
        <div className="container">
          <h2 className="font-xl-med mb-4 fw-medium heading-divider">
            Upcoming Events
          </h2>
          <div className="row g-4 g-md-5">
            {/* Event Card 1 */}
            <div className="col-12 col-lg-6">
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
            <div className="col-12 col-lg-6">
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

      <section className="related-organisation py-4 py-lg-5">
        <div className="container">
          <h2 className="font-xl-med mb-4 fw-medium heading-divider">
            Related organizations
          </h2>

          {/* Organization List (ul.grid md:grid-cols-2 gap-4) */}
          <ul className="row related-organizations-list g-2 mt-2">
            <li className="col-12 col-lg-6">
              <a
                href="#"
                className="font-base-med fw-medium text-decoration-hover"
              >
                Office of Consumer Affairs and Business Regulation
              </a>
            </li>
            <li className="col-12 col-lg-6">
              <a
                href="#"
                className="font-base-med fw-medium text-decoration-hover"
              >
                Executive Office of Economic Development
              </a>
            </li>
            <li className="col-12 col-lg-6">
              <a
                href="#"
                className="font-base-med fw-medium text-decoration-hover"
              >
                Office of the Attorney General
              </a>
            </li>
            <li className="col-12 col-lg-6">
              <a
                href="#"
                className="font-base-med fw-medium text-decoration-hover"
              >
                Office of State Treasurer and Receiver General Deborah B.
                Goldberg{" "}
              </a>
            </li>
          </ul>
        </div>
      </section>

      <section className="related-organisation py-4 py-lg-5">
        <div className="container">
          <h2 className="font-xl-med mb-4 fw-medium heading-divider">
            Division of Banks information
          </h2>

          {/* Organization List (ul.grid md:grid-cols-2 gap-4) */}
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
                Staff directory by unit{" "}
              </a>
            </li>
            <li className="col-12">
              <a
                href="#"
                className="font-base-med fw-medium text-decoration-hover"
              >
                Employment{" "}
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
      <HomeFooter/>
    </div>
  );
}

export default Home;
