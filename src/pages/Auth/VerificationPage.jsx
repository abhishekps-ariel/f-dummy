import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import loginImg from "../../assets/logo-sample.png";
import "../../styles/custom.css";

function VerificationPage() {
  const [linkExpired] = useState(true);
  const [isResending, setIsResending] = useState(false);

  const handleResendLink = async () => {
    setIsResending(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success("Verification link sent to your email!");
    } catch {
      toast.error("Failed to send verification link. Please try again.");
    } finally {
      setIsResending(false);
    }
  };
  
  return (
    <div className="login">
      <div className="container container-md-auto">
        <div className="row m-0">
          <div className="col-lg-5 col-md-4 px-0">
            <div className="login-right-image"></div>
          </div>
          <div className="col-lg-7 col-md-8">
            <div className="login-inner d-flex flex-column align-items-center justify-content-center">
              <div className="w-100">
                <div className="login-header mb-5 text-center">
                  <div className="login-logo">
                    <Link to="/">
                      <img src={loginImg} alt="logo" className="w-100" />
                    </Link>
                  </div>
                  
                  {!linkExpired ? (
                    // Account Verified State
                    <>
                      <div className="mb-4">
                        <div className="verification-icon d-inline-flex align-items-center justify-content-center mb-3">
                          <i className="fa-solid fa-check-circle text-success" style={{ fontSize: '4rem' }}></i>
                        </div>
                        <h2 className="font-xl-med fw-bold text-success">Account Verified</h2>
                        <p className="font-base text-muted">
                          Your email has been successfully verified. You can now log in to your account.
                        </p>
                      </div>
                      
                      <div className="d-flex flex-column gap-3">
                        <Link
                          to="/login"
                          className="btn custom-btn theme-btn text-center"
                        >
                          <i className="fa-solid fa-sign-in-alt me-2"></i>
                          Login to Your Account
                        </Link>
                      </div>
                    </>
                  ) : (
                    // Link Expired State
                    <>
                      <div className="mb-4">
                        <div className="verification-icon d-inline-flex align-items-center justify-content-center mb-3">
                          <i className="fa-solid fa-exclamation-triangle text-warning" style={{ fontSize: '4rem' }}></i>
                        </div>
                        <h2 className="font-xl-med fw-bold text-warning">Verification Link Expired</h2>
                        <p className="font-base text-muted">
                          Your verification link has expired. Please request a new one to complete your account verification.
                        </p>
                      </div>
                      
                      <div className="d-flex flex-column gap-3">
                        <button
                          onClick={handleResendLink}
                          className="btn custom-btn theme-btn text-center"
                          disabled={isResending}
                        >
                          {isResending ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Sending...
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-paper-plane me-2"></i>
                              Resend Verification Link
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerificationPage;
