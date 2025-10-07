import React from "react";
import { Link } from "react-router-dom";
import loginImg from "../../assets/logo-sample.png";
import "../../styles/custom.css";

function PasswordEmailSent() {
  const handleResendEmail = () => {
    // Add resend logic here
    console.log("Resending email...");
  };

  return (
    <div className="login">
      <div className="container container-md-auto">
        <div className="row m-0">
          <div className="col-lg-5 col-md-4 px-0">
            <div className="login-right-image">
            </div>
          </div>
          <div className="col-lg-7 col-md-8">
            <div className="login-inner d-flex flex-column align-items-center justify-content-center">
              <form className="w-100">
                <div className="login-header mb-5 text-center">
                  <div className="login-logo">
                    <Link to="/">
                      <img src={loginImg} alt="logo" className="w-100" />
                    </Link>
                  </div>
                  <h2 className="font-xl-med fw-bold">Check your email!</h2>
                  <p className="font-base">
                    Thanks! An email has been sent with a link to reset your password. 
                    Please check your inbox and follow the instructions to continue.
                  </p>
                </div>

                <Link to="/login" className="btn custom-btn theme-btn text-center w-100">
                  Back to Login
                </Link>
                
                <div className="text-center mt-4">
                  <button 
                    type="button"
                    onClick={handleResendEmail}
                    className="btn btn-link font-base fw-medium text-decoration-none p-0"
                  >
                    <i className="fa-solid fa-chevron-left me-1"></i> Resend Email
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PasswordEmailSent;
