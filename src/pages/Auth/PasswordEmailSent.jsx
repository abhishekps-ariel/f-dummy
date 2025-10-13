import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { forgotPassword } from "../../services/authService";
import loginImg from "../../assets/logo-sample.png";
import "../../styles/custom.css";

function PasswordEmailSent() {
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem('resetEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error("Email not found. Please try again.");
      return;
    }

    if (isResending) return;
    
    setIsResending(true);
    
    try {
      const response = await forgotPassword(email);
      
      if (response.isSuccess) {
        toast.success(response.msg || "Reset email sent again! Please check your inbox.");
      } else {
        toast.error(response.msg || "Failed to resend email. Please try again.");
      }
    } catch (error) {
      toast.error("Failed to resend email. Please try again.");
      console.error("Resend email error:", error);
    } finally {
      setIsResending(false);
    }
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
                    disabled={isResending}
                  >
                    {isResending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Resending...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-chevron-left me-1"></i> Resend Email
                      </>
                    )}
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
