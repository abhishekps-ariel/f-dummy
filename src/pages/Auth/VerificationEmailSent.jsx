import React from "react";
import { Link } from "react-router-dom";
import loginImg from "../../assets/logo-sample.png";
import "../../styles/custom.css";

function VerificationEmailSent() {
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
                  
                  <div className="mb-4">
                    <div className="verification-icon d-inline-flex align-items-center justify-content-center mb-3">
                      <i className="fa-solid fa-envelope-circle-check text-success" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h2 className="font-xl-med fw-bold">Check your email!</h2>
                    <p className="font-base text-muted">
                      We've sent a verification link to your email address. 
                      Please check your inbox and click the link to verify your account.
                    </p>
                    <p className="font-sm text-muted mt-3">
                      <i className="fa-solid fa-info-circle me-1"></i>
                      Don't forget to check your spam folder if you don't see the email.
                    </p>
                  </div>
                </div>

                <Link to="/login" className="btn custom-btn theme-btn text-center w-100">
                  Back to Login
                </Link>
                
                <div className="text-center mt-4">
                  <p className="font-sm text-muted mb-0">
                    Didn't receive the email? Check your spam folder or contact support.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerificationEmailSent;

