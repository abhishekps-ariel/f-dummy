import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import loginImg from "../../assets/logo-sample.png";
import "../../styles/custom.css";

function TwoFactorAuth() {
  const [codes, setCodes] = useState(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  // Timer countdown effect
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(timer => timer - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleCodeChange = (index, value) => {
    // Only allow single digit
    if (value.length > 1) return;
    
    const newCodes = [...codes];
    newCodes[index] = value;
    setCodes(newCodes);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !codes[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const pastedCodes = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (pastedCodes.length === 6) {
      setCodes(pastedCodes.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const fullCode = codes.join('');
    if (fullCode.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success("Login successful!");
      
      // Wait a moment for toast to show, then navigate
      setTimeout(() => {
        navigate("/");
        setIsSubmitting(false);
      }, 800);
    } catch (error) {
      toast.error("Invalid authentication code. Please try again.");
      console.error("2FA error:", error);
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0 || isResending) return;
    
    setIsResending(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.info("New code sent to your authentication app");
      setResendTimer(30); // Start 30-second timer
    } catch {
      toast.error("Failed to send new code. Please try again.");
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
              <form className="w-100" onSubmit={handleSubmit}>
                <div className="login-header mb-5 text-center">
                  <div className="login-logo">
                    <Link to="/">
                      <img src={loginImg} alt="logo" className="w-100" />
                    </Link>
                  </div>
                  <h2 className="font-xl-med fw-bold">Two Factor Authentication</h2>
                  <p className="font-base">Enter the six-digit code from your authentication app</p>
                </div>

                <div className="auth-columns d-flex gap-3 justify-content-center mb-5">
                  {codes.map((code, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      maxLength="1"
                      value={code}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className="text-center"
                      autoComplete="off"
                    />
                  ))}
                </div>

                <button 
                  className="btn custom-btn theme-btn text-center w-100" 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Verifying...
                    </>
                  ) : (
                    'Verify'
                  )}
                </button>

                <div className="text-center mt-3">
                  Haven't received it?{" "}
                  <button 
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendTimer > 0 || isResending}
                    className={`btn btn-link font-base fw-medium text-decoration-none p-0 ${
                      resendTimer > 0 || isResending ? 'text-muted' : ''
                    }`}
                  >
                    {isResending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Sending...
                      </>
                    ) : resendTimer > 0 ? (
                      `Resend in ${resendTimer}s`
                    ) : (
                      'Resend a new Code'
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

export default TwoFactorAuth;
