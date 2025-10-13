import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { verifyEmail, resendVerification } from "../../services/authService";
import loginImg from "../../assets/logo-sample.png";
import "../../styles/custom.css";

function VerificationPage() {
  const [searchParams] = useSearchParams();
  const { token: pathToken } = useParams();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [showResendForm, setShowResendForm] = useState(false);

  const hasVerified = useRef(false);

  useEffect(() => {
    const verifyUserEmail = async () => {
      const token = pathToken || searchParams.get("token");

      if (!token) {
        setIsLoading(false);
        setIsVerified(false);
        setVerificationMessage("Invalid verification link. Token not found.");
        return;
      }

      // Check cache to avoid re-calling API on page reload
      const cachedResult = sessionStorage.getItem(`verify_${token}`);
      if (cachedResult) {
        const cached = JSON.parse(cachedResult);
        setIsVerified(cached.isVerified);
        setVerificationMessage(cached.message);
        setShowResendForm(cached.showResend || false);
        setIsLoading(false);
        return;
      }

      // Prevent double API call
      if (hasVerified.current) return;
      hasVerified.current = true;

      try {
        const response = await verifyEmail(token);

        if (response.isSuccess) {
          setIsVerified(true);
          setVerificationMessage(response.msg || "Your account has been verified successfully.");
          
          sessionStorage.setItem(`verify_${token}`, JSON.stringify({
            isVerified: true,
            message: response.msg || "Your account has been verified successfully."
          }));
        } else {
          const backendMessage = response.msg || "Verification link expired or invalid.";
          const isExpired = backendMessage === "Verification token has expired. Please request a new one.";
          
          let userMessage;
          let showAsVerified = false;
          
          if (isExpired) {
            userMessage = "Your verification link has expired. Please request a new one to complete verification.";
          } else if (backendMessage.includes("Invalid or unknown verification token")) {
            userMessage = "Your account has already been verified. You can now log in!";
            showAsVerified = true;
          } else {
            userMessage = "Unable to verify your account. Please try again or contact support.";
          }
          
          setIsVerified(showAsVerified);
          setVerificationMessage(userMessage);
          setShowResendForm(isExpired);
          
          sessionStorage.setItem(`verify_${token}`, JSON.stringify({
            isVerified: showAsVerified,
            message: userMessage,
            showResend: isExpired
          }));
        }
      } catch {
        setIsVerified(false);
        setVerificationMessage("An error occurred during verification. Please try again.");
        toast.error("Verification failed. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    verifyUserEmail();
  }, [searchParams, pathToken]);

  const handleResendLink = async () => {
    if (!userEmail.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsResending(true);
    try {
      const response = await resendVerification(userEmail);

      if (response.isSuccess) {
        toast.success(response.msg || "Verification link sent to your email!");
        setUserEmail("");
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
                      
                      <Link
                        to="/login"
                        className="btn custom-btn theme-btn text-center w-100"
                      >
                        <i className="fa-solid fa-sign-in-alt me-2"></i>
                        Login to Your Account
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className="mb-4">
                        <div className="verification-icon d-inline-flex align-items-center justify-content-center mb-3">
                          <i className={`fa-solid ${showResendForm ? 'fa-clock' : 'fa-exclamation-circle'} text-warning`} style={{ fontSize: '4rem' }}></i>
                        </div>
                        <h2 className="font-xl-med fw-bold text-warning">
                          {showResendForm ? 'Link Expired' : 'Verification Error'}
                        </h2>
                        <p className="font-base text-muted">
                          {verificationMessage}
                        </p>
                      </div>
                      
                      <div className="d-flex flex-column gap-3">
                        {showResendForm ? (
                          <>
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
                          </>
                        ) : (
                          /* Show login button if token is already used/invalid (not expired) */
                          <Link
                            to="/login"
                            className="btn custom-btn theme-btn text-center w-100"
                          >
                            <i className="fa-solid fa-sign-in-alt me-2"></i>
                            Go to Login
                          </Link>
                        )}
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
