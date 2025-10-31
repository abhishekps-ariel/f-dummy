import React from "react";
import logo from "../../assets/logo-index.png";

export default function HomeFooter() {
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
                <br></br>
                <a href="#" className="text-decoration-underline">
                  Mass.gov
                </a>
                <a href="#" className="text-decoration-underline  ms-2">
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
