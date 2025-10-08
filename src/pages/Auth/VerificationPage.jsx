import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { verifyEmail, resendVerification } from "../../services/auth.service";
import loginImg from "../../assets/logo-sample.png";
import "../../styles/custom.css";

function VerificationPage() {
  // Get token from URL - supports both path param (/verification-page/token) and query param (?token=abc)
  const [searchParams] = useSearchParams();
  const { token: pathToken } = useParams();
  
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Prevent double API calls (React 18 Strict Mode runs useEffect twice in dev)
  const hasVerified = useRef(false);

  // Extract token from URL and verify email on component mount
  useEffect(() => {
    const verifyUserEmail = async () => {
      // Extract token from URL - check path parameter first, then query parameter
      // Supports: /verification-page/abc123 OR /verification-page?token=abc123
      const token = pathToken || searchParams.get("token");

      if (!token) {
        // No token in URL - show error
        setIsLoading(false);
        setIsVerified(false);
        setVerificationMessage("Invalid verification link. Token not found.");
        return;
      }

      // Prevent double API call - only verify once
      if (hasVerified.current) {
        console.log("Already verified, skipping duplicate call");
        return;
      }
      hasVerified.current = true;

      console.log("Calling verify email API with token:", token);

      try {
        // Call verify email API with token
        const response = await verifyEmail(token);

        console.log("Verify email response:", response);

        if (response.isSuccess) {
          // Verification successful
          setIsVerified(true);
          setVerificationMessage(response.msg || "Your account has been verified successfully.");
        } else {
          // Verification failed (expired, invalid, etc.)
          setIsVerified(false);
          setVerificationMessage(response.msg || "Verification link expired or invalid.");
        }
      } catch (error) {
        // Handle unexpected errors
        console.log("Verify email exception:", error);
        setIsVerified(false);
        setVerificationMessage("An error occurred during verification. Please try again.");
        toast.error("Verification failed. Please try again.");
      } finally {
        // Hide loading screen after API call completes
        setIsLoading(false);
      }
    };

    verifyUserEmail();
  }, [searchParams, pathToken]);

  // Handle resend verification email
  const handleResendLink = async () => {
    // Check if user has entered email
    if (!userEmail.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsResending(true);
    try {
      // Call resend verification API with email
      const response = await resendVerification(userEmail);

      if (response.isSuccess) {
        toast.success(response.msg || "Verification link sent to your email!");
        setUserEmail(""); // Clear email input after successful send
      } else {
        toast.error(response.msg || "Failed to send verification link. Please try again.");
      }
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
              <form className="w-100">
                <div className="login-header mb-5 text-center">
                  <div className="login-logo">
                    <Link to="/">
                      <img src={loginImg} alt="logo" className="w-100" />
                    </Link>
                  </div>
                  
                  {/* Loading State - Show while verifying email */}
                  {isLoading ? (
                    <div className="mb-4">
                      <div className="verification-icon d-inline-flex align-items-center justify-content-center mb-3">
                        <div className="spinner-border text-primary" role="status" style={{ width: '4rem', height: '4rem' }}>
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                      <h2 className="font-xl-med fw-bold">Verifying Email...</h2>
                      <p className="font-base text-muted">
                        Please wait while we verify your email address.
                      </p>
                    </div>
                  ) : isVerified ? (
                    /* Success State - Email verified successfully */
                    <>
                      <div className="mb-4">
                        <div className="verification-icon d-inline-flex align-items-center justify-content-center mb-3">
                          <i className="fa-solid fa-check-circle text-success" style={{ fontSize: '4rem' }}></i>
                        </div>
                        <h2 className="font-xl-med fw-bold text-success">Account Verified!</h2>
                        <p className="font-base text-muted">
                          {verificationMessage}
                        </p>
                      </div>
                      
                      <div className="d-flex flex-column gap-3">
                        <Link
                          to="/login"
                          className="btn custom-btn theme-btn text-center w-100"
                        >
                          <i className="fa-solid fa-sign-in-alt me-2"></i>
                          Login to Your Account
                        </Link>
                      </div>
                    </>
                  ) : (
                    /* Error State - Verification failed/expired */
                    <>
                      <div className="mb-4">
                        <div className="verification-icon d-inline-flex align-items-center justify-content-center mb-3">
                          <i className="fa-solid fa-exclamation-triangle text-warning" style={{ fontSize: '4rem' }}></i>
                        </div>
                        <h2 className="font-xl-med fw-bold text-warning">Verification Failed</h2>
                        <p className="font-base text-muted">
                          {verificationMessage}
                        </p>
                      </div>
                      
                      <div className="d-flex flex-column gap-3">
                        {/* Email input for resending verification */}
                        <div className="form-group text-start">
                          <label className="label-text">Enter your email address</label>
                          <div className="input-group">
                            <div className="user-icon">
                              <i className="fa-solid fa-envelope"></i>
                            </div>
                            <input
                              type="email"
                              className="form-control"
                              placeholder="your@email.com"
                              value={userEmail}
                              onChange={(e) => setUserEmail(e.target.value)}
                              disabled={isResending}
                            />
                          </div>
                        </div>
                        
                        <button
                          onClick={handleResendLink}
                          className="btn custom-btn theme-btn text-center w-100"
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
                        
                        <Link
                          to="/login"
                          className="btn btn-link text-dark-black fw-medium"
                        >
                          Back to Login
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerificationPage;
