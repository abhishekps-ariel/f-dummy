import React from "react";
import { useTranslation } from "react-i18next";
import logo from "../../assets/logo-index.png";

export default function HomeFooter() {
  const { t } = useTranslation();
  return (
    <div>
      <footer className="app-footer py-4">
        <div className="container">
          <div className="row align-items-center">
            {/* Left Column: Seal/Logo */}
            <div className="col-12 col-md-2 text-start mb-3 mb-md-0">
              <div className="footer-logo">
                <img src={logo} alt="logo" className="w-100" />
              </div>
            </div>

            <div className="col-12 col-md-10 ">
              <ul className="footer-links d-flex flex-column flex-md-row justify-content-start font-base-med fw-medium mb-4 list-unstyled gap-2 gap-md-4">
                <li>
                  <a href="#" className="text-dark text-decoration-none">
                    {t("homeFooter.allTopics")}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-dark text-decoration-none">
                    {t("homeFooter.sitePolicies")}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-dark text-decoration-none">
                    {t("homeFooter.publicRecordsRequests")}
                  </a>
                </li>
              </ul>

              {/* Copyright Information */}
              <p className="mb-1 font-sm text-gray-dark fw-medium">
                {t("homeFooter.copyright")}
              </p>
              <p className="mb-0 font-sm text-gray-dark">
                {t("homeFooter.serviceMark")}
                <br></br>
                <a href="#" className="text-decoration-underline">
                  {t("homeFooter.massGov")}
                </a>
                <a href="#" className="text-decoration-underline  ms-2">
                  {t("homeFooter.privacyPolicy")}
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
