import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import img1 from "../../assets/loan.jpg";
import img2 from "../../assets/moneytab.jpg";
import img3 from "../../assets/flag.jpg";
import coinsImg from "../../assets/coins.png";
import HomeHeader from "../../components/Home/HomeHeader";
import HomeFooter from "../../components/Home/HomeFooter";
import { ROUTES } from "../../constants/routerConstants";

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Scroll to top when component mounts or location changes
  useEffect(() => {
    // Scroll immediately and after a delay to ensure it works
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Also try after a small delay in case content loads asynchronously
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 100);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);
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
          {t("home.intro")}
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
            {t("home.featuredItems")}
          </h2>
          <div className="row">
            <div className="col-md-6 col-lg-4">
              <div className="item">
                <img src={coinsImg} alt="Student Loan Info" className="w-100" />
                <p>{t("home.financialClimateRisk")}</p>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="item">
                <img src={img1} alt="Student Loan Info" className="w-100" />
                <p>{t("home.studentLoanInfo")}</p>
              </div>
              <div className="item">
                <img src={img3} alt="Student Loan Info" className="w-100" />
                <p>{t("home.enforcementActions")}</p>
              </div>
            </div>
            <div className="col-md-12 col-lg-4">
              <div className="row">
                <div className="col-md-6 col-lg-12">
                  <div className="item">
                    <img src={img2} alt="Student Loan Info" className="w-100" />
                    <p>{t("home.newMoneyTransmissionLaw")}</p>
                  </div>
                </div>
                <div className="col-md-6 col-lg-12">
                  <div className="item">
                    <img
                      src={img2}
                      alt="New Transmission Law"
                      className="w-100"
                    />
                    <p>{t("home.cybersecurityIndustry")}</p>
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
            {t("home.contactUs")}
          </h2>
          <div className="row g-5">
            {/* Left Column: Online and Phone */}
            <div className="col-12 col-md-6 col-lg-4 vr-border-right position-relative">
              {/* Online Section */}
              <div className="mb-5">
                <h3 className="fs-5 fw-semibold icon-header mb-3">
                  <i className="fa-solid fa-desktop me-2 ms-primary-green"></i>{" "}
                  {t("home.online")}
                </h3>
                <p className="mb-1 fw-medium">{t("home.contactUs")}</p>
                <a href="#" className="text-decoration-hover fw-medium">
                  {t("home.contactDetailByUnit")}
                </a>
              </div>
              {/* Phone Section */}
              <div>
                <h3 className="fs-5 fw-semibold icon-header mb-3">
                  <i className="fa-solid fa-phone me-2 ms-primary-green"></i>{" "}
                  {t("home.phone")}
                </h3>
                <p className="mb-1 fw-medium">
                  {t("home.main")}{" "}
                  <a
                    href="tel:+16179561500"
                    className="fw-medium text-decoration-hover"
                  >
                    (617) 956-1500
                  </a>
                </p>
                <p className="font-sm mb-3">
                  {t("home.openHours")}
                </p>

                <p className="mb-1 fw-medium">
                  {t("home.tollFree")}{" "}
                  <a
                    href="tel:+18004952265"
                    className="fw-medium text-decoration-hover"
                  >
                    (800) 495-BANK (2265)
                  </a>
                </p>
                <p className="font-sm mb-3">
                  {t("home.openHours")}
                </p>

                <p className="mb-1 fw-medium">
                  {t("home.tdd")}{" "}
                  <a
                    href="tel:+16179561577"
                    className="fw-medium text-decoration-hover"
                  >
                    (617) 956-1577
                  </a>
                </p>
                <p className="font-sm mb-0">
                  {t("home.tddDesc")}
                </p>
              </div>
            </div>

            {/* Right Column: Address */}
            <div className="col-12 col-md-6 col-lg-4">
              <div className="ps-md-3">
                <h3 className="fs-5 fw-semibold icon-header mb-3">
                  <i className="fa-solid fa-map-marker-alt me-2 ms-primary-green"></i>{" "}
                  {t("home.address")}
                </h3>
                <p className="mb-1 fw-medium">{t("home.mainOffice")}</p>
                <p className="mb-1">{t("home.addressLine1")}</p>
                <p className="mb-1">{t("home.addressLine2")}</p>
                <p className="mb-3">{t("home.addressLine3")}</p>
                <a href="#" className="text-decoration-hover fw-medium">
                  {t("home.directions")}
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
            {t("home.whoWeServe")}
          </h2>
          <p className="font-base-med">
            {t("home.whoWeServeDesc")}
          </p>
          <p className="font-base-med">
            {t("home.nonDepositoryInstitutions")}
          </p>
          <ul className="font-base-med d-flex flex-column gap-2">
            <li>{t("home.mortgageLenders")}</li>
            <li>{t("home.mortgageBrokers")}</li>
            <li>{t("home.mortgageLoanOriginators")}</li>
            <li>{t("home.consumerFinanceCompanies")}</li>
            <li>{t("home.moneyServiceBusinesses")}</li>
            <li>{t("home.debtCollectors")}</li>
            <li>{t("home.loanServicers")}</li>
            <li>{t("home.studentLoanServicers")}</li>
          </ul>
          <div className="d-flex flex-column gap-4">
            <a href="#!" className="font-base-med fw-medium">
              {t("home.learnMoreDOB")}
            </a>
            <h4>
              <i className="font-lg-med fa-brands fa-linkedin-in me-2 ms-primary-green"></i>{" "}
              <a href="#!" className="font-base-med fw-medium">
                {t("home.dobLinkedIn")}{" "}
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
              {t("home.whatWouldYouLikeToDo")}
            </h2>
          </div>

          <div className="row mb-5 g-2 g-md-4">
            <div className="col-md-6 col-lg-4">
              <div className="link-box-theme">
                <a href="#" className="text-decoration-hover">
                  {t("home.submitComplaint")}
                </a>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="link-box-theme">
                <a href="#" className="text-decoration-hover">
                  {t("home.publicRecordsRequest")}
                </a>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="link-box-theme">
                <a href="#" className="text-decoration-hover">
                  {t("home.findBanksCreditUnions")}
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
              <h5 className="mb-0">{t("home.moreActionsServices")}</h5>
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
                        {t("home.cybersecurityConsumers")}
                      </a>
                    </li>
                    <li className="col-12">
                      <a
                        href="#"
                        className="font-base-med fw-medium text-decoration-hover"
                      >
                        {t("home.protectingOlderAdults")}
                      </a>
                    </li>
                    <li className="col-12">
                      <a
                        href="#"
                        className="font-base-med fw-medium text-decoration-hover"
                      >
                        {t("home.divisionOfBanksLicenses")}{" "}
                      </a>
                    </li>
                    <li className="col-12">
                      <a
                        href="#"
                        className="font-base-med fw-medium text-decoration-hover"
                      >
                        {t("home.dobConnects")}
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
            {t("home.recentNewsAnnouncements")}
          </h2>
          <div className="row g-5">
            <div className="col-lg-4">
              <div className="news-item">
                <span className="news-tag font-xs text-uppercase fw-medium">
                  {t("home.news")}
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
                  {t("home.pressRelease")}
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
                  {t("home.news")}
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
                  {t("home.news")}
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
                  {t("home.news")}
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
                  {t("home.news")}
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
              {t("home.seeAllNews")}
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
            {t("home.upcomingEvents")}
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
              {t("home.seeAllEvents")}
            </a>
          </div>
        </div>
      </section>

      <section className="related-organisation py-4 py-lg-5">
        <div className="container">
          <h2 className="font-xl-med mb-4 fw-medium heading-divider">
            {t("home.relatedOrganizations")}
          </h2>

          {/* Organization List (ul.grid md:grid-cols-2 gap-4) */}
          <ul className="row related-organizations-list g-2 mt-2">
            <li className="col-12 col-lg-6">
              <a
                href="#"
                className="font-base-med fw-medium text-decoration-hover"
              >
                {t("home.officeOfConsumerAffairs")}
              </a>
            </li>
            <li className="col-12 col-lg-6">
              <a
                href="#"
                className="font-base-med fw-medium text-decoration-hover"
              >
                {t("home.executiveOfficeEconomic")}
              </a>
            </li>
            <li className="col-12 col-lg-6">
              <a
                href="#"
                className="font-base-med fw-medium text-decoration-hover"
              >
                {t("home.officeOfAttorneyGeneral")}
              </a>
            </li>
            <li className="col-12 col-lg-6">
              <a
                href="#"
                className="font-base-med fw-medium text-decoration-hover"
              >
                {t("home.officeOfStateTreasurer")}{" "}
              </a>
            </li>
          </ul>
        </div>
      </section>

      <section className="related-organisation py-4 py-lg-5">
        <div className="container">
          <h2 className="font-xl-med mb-4 fw-medium heading-divider">
            {t("home.divisionOfBanksInfo")}
          </h2>

          {/* Organization List (ul.grid md:grid-cols-2 gap-4) */}
          <ul className="row related-organizations-list g-2 mt-2">
            <li className="col-12">
              <a
                href="#"
                className="font-base-med fw-medium text-decoration-hover"
              >
                {t("home.agencyOverview")}
              </a>
            </li>
            <li className="col-12">
              <a
                href="#"
                className="font-base-med fw-medium text-decoration-hover"
              >
                {t("home.staffDirectory")}{" "}
              </a>
            </li>
            <li className="col-12">
              <a
                href="#"
                className="font-base-med fw-medium text-decoration-hover"
              >
                {t("home.employment")}{" "}
              </a>
            </li>
            <li className="col-12">
              <a
                href="#"
                className="font-base-med fw-medium text-decoration-hover"
              >
                {t("home.registerListserv")}
              </a>
            </li>
            <li className="col-12">
              <a
                href="#"
                className="font-base-med fw-medium text-decoration-hover"
              >
                {t("home.dobPublicRecords")}
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
