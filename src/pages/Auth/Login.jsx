import { useState } from "react";
import { checkMfa, login, sendOtp, storeAuthData } from "../../services/auth.service";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import loginImg from "../../assets/logo-sample.png";
import "../../styles/custom.css";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMfaSelection, setShowMfaSelection] = useState(false);
  const [selectedMfaMethod, setSelectedMfaMethod] = useState("");

  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "This field can't be empty";
    }

    if (!formData.password.trim()) {
      newErrors.password = "This field can't be empty";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleForgetPassword = () => {
    navigate("/forgot-password");
  };

  // Initial login - check MFA requirement
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setErrors({});

    if (!validateForm()) {
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Check MFA requirement
      const mfaResponse = await checkMfa(formData.email, formData.password);
      
      if (!mfaResponse.isSuccess) {
        toast.error(mfaResponse.msg || "Login failed");
        return;
      }

      const { isMfaSetupRequired } = mfaResponse.data;

      if (!isMfaSetupRequired) {
        // No MFA required - directly login
        await handleDirectLogin();
      } else {
        // MFA required - show setup screen
        setShowMfaSelection(true);
      }
    } catch (error) {
      toast.error("Login failed. Please try again.");
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct login when MFA not required
  const handleDirectLogin = async () => {
    try {
      const response = await login(formData.email, formData.password);
      
      if (response.isSuccess) {
        storeAuthData(response.data);
        toast.success("Login successful!");
        navigate("/dashboard");
      } else {
        toast.error(response.msg || "Login failed");
      }
    } catch (error) {
      toast.error("Login failed. Please try again.");
      console.error("Direct login error:", error);
    }
  };

  // MFA Setup - send OTP and navigate to TwoFactorAuth page
  const handleMfaProceed = async () => {
    if (!selectedMfaMethod) {
      toast.error("Please select an MFA method to proceed");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await sendOtp(formData.email, formData.password);
      
      if (response.isSuccess) {
        toast.success(response.msg || "OTP sent successfully!");
        // Navigate to TwoFactorAuth page with email and password
        navigate("/two-factor-auth", { 
          state: { 
            email: formData.email,
            password: formData.password,
            phoneNumberMasked: response.data.phoneNumberMasked 
          } 
        });
      } else {
        toast.error(response.msg || "Failed to send OTP");
      }
    } catch (error) {
      toast.error("Failed to send OTP. Please try again.");
      console.error("Send OTP error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
            <form className="w-100" onSubmit={handleSubmit}>
              <div className="login-header mb-5 text-center">
                <div className="login-logo">
                  <Link to="/">
                    <img src={loginImg} alt="logo" className="w-100" />
                  </Link>
                </div>
                
                {showMfaSelection ? (
                  <>
                    <h2 className="font-xl-med fw-bold">Two-Factor Authentication Setup</h2>
                    <p className="font-base text-muted">
                      Please select your preferred authentication method
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="font-xl-med fw-bold">Login</h2>
                    <p className="font-base">
                      Don't have an account?{" "}
                      <Link to="/register" className="text-dark-black fw-semibold">
                        Sign up{" "}
                      </Link>
                    </p>
                  </>
                )}
              </div>

              {showMfaSelection ? (
                <>
                  <div className="mb-4">
                    <p className="font-base text-center mb-4">
                      <i className="fa-solid fa-shield-halved me-2 text-primary"></i>
                      Two-Factor Authentication is required for your account
                    </p>
                    
                    <div className="mfa-card-area row g-3 justify-content-center">
                      <div className="col-md-8 col-lg-6">
                        <div 
                          className={`mfa-option-card p-4 text-center ${selectedMfaMethod === 'sms' ? 'selected' : ''}`}
                          onClick={() => setSelectedMfaMethod('sms')}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="mb-3">
                            <i className="fa-solid fa-message" style={{ fontSize: '3rem', color: '#34a853' }}></i>
                          </div>
                          <h5 className="fw-bold mb-2">SMS</h5>
                          <p className="font-sm text-muted  mb-0">
                            Receive verification codes via text message
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn custom-btn theme-btn text-center w-100"
                    onClick={handleMfaProceed}
                    disabled={isSubmitting || !selectedMfaMethod}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-arrow-right me-2"></i>
                        Proceed
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="label-text">Email</label>
                    <div className="input-group">
                      <div className="user-icon">
                        <i className="fa-solid fa-envelope"></i>
                      </div>
                      <input
                        name="email"
                        type="text"
                        className={`form-control ${errors.email ? "is-invalid" : ""}`}
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.email && (
                      <div className="invalid-feedback d-block">
                        <small className="text-danger">{errors.email}</small>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="label-text">Password</label>
                    <div className="input-group position-relative">
                      <div className="user-icon">
                        <i className="fa-solid fa-lock"></i>
                      </div>
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        className={`form-control ${errors.password ? "is-invalid" : ""}`}
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                      />
                      <span
                        className="password-eye"
                        onClick={togglePasswordVisibility}
                        style={{ cursor: "pointer" }}
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        <i
                          className={`fa-solid ${showPassword ? "fa-eye" : "fa-eye-slash"}`}
                        ></i>
                      </span>
                    </div>
                    {errors.password && (
                      <div className="invalid-feedback d-block">
                        <small className="text-danger">{errors.password}</small>
                      </div>
                    )}
                  </div>
                  <div className="form-group text-end">
                    <button
                      type="button"
                      onClick={handleForgetPassword}
                      className="btn btn-link font-base text-dark-black fw-medium p-0"
                    >
                      Forgot Password ?
                    </button>
                  </div>

                  <button
                    className="btn custom-btn theme-btn text-center w-100"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </button>

                  <div className="loginwith w-100 text-center position-relative my-4">
                    <p className="orlogin-text mb-0">Or</p>
                  </div>
                  <div className="d-flex flex-column align-items-center gap-2">
                    <a href="#!" className="font-base fw-medium">Login with MyMass.Gov</a>
                  </div>

                  <div className="d-flex flex-column important-notice mt-5">
                    <strong>Important Notice:</strong>
                    The filer/mortgagee/loan holder can only initiate the Division's
                    online registration filing process after a foreclosure petition
                    (or action) has been brought by the mortgagee under the
                    Soldiers' and Sailors' Civil Relief Act. Foreclosure petition
                    information must be entered in this Online Foreclosure Database
                    within five business days after being filed with the Land Court.
                  </div>
                </>
              )}
            </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;