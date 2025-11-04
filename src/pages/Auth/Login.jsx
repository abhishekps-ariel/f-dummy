import { useState } from "react";
import { checkMfa, login, sendOtp } from "../../services/authService";
import { storeAuthData } from "../../utils/storage";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../constants/routerConstants";
import { toast } from "react-toastify";
import loginImg from "../../assets/logo-sample.png";
import "../../styles/custom.css";

// Helper function to check if user is org admin
const isOrgAdmin = (userData) => {
  if (!userData) return false;
  
  // Check if isManager is true
  if (userData.isManager === true) {
    return true;
  }
  
  // Check roles array for "Organisation Admin"
  if (userData.roles && Array.isArray(userData.roles)) {
    return userData.roles.some(
      (role) =>
        role === "Organisation Admin" ||
        role === "Organization Admin" ||
        role === "orgAdmin"
    );
  }
  
  return false;
};

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
  const [isOrgAdminUser, setIsOrgAdminUser] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login: authLogin } = useAuth();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "This field can't be empty";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    } else if (formData.email.toLowerCase().endsWith("@gmail.com")) {
      newErrors.email = "Gmail addresses are not accepted. Please use a different email domain.";
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

    // Real-time email validation to block @gmail.com
    if (name === "email" && value.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setErrors({ ...errors, email: "Please enter a valid email address" });
      } else if (value.toLowerCase().endsWith("@gmail.com")) {
        setErrors({ ...errors, email: "Gmail addresses are not accepted. Please use a different email domain." });
      }
    }
  };

  const handleForgetPassword = () => {
    navigate(ROUTES.FORGOT_PASSWORD);
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
        // Handle specific error messages
        if (
          mfaResponse.msg &&
          mfaResponse.msg.toLowerCase().includes("user not found")
        ) {
          toast.error("User not found");
        } else if (
          mfaResponse.msg &&
          mfaResponse.msg.toLowerCase().includes("invalid email or password")
        ) {
          toast.error("Incorrect password");
        } else {
          toast.error(mfaResponse.msg || "Login failed");
        }
        return;
      }

      // Check if user is org admin from checkMfa response
      if (mfaResponse.data?.user) {
        setIsOrgAdminUser(isOrgAdmin(mfaResponse.data.user));
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
      // Handle specific error messages from API response
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message.toLowerCase();
        if (errorMessage.includes("user not found")) {
          toast.error("User not found");
        } else if (errorMessage.includes("invalid email or password")) {
          toast.error("Incorrect password");
        } else {
          toast.error(error.response.data.message);
        }
      } else {
        toast.error("Login failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct login when MFA not required
  const handleDirectLogin = async () => {
    try {
      const response = await login(formData.email, formData.password, true, isOrgAdminUser);

      if (response.isSuccess) {
        const userData = response.data?.user;
        
        // Store auth data and login for all users (including org admins)
        storeAuthData(response.data);
        await authLogin(userData);
        toast.success("Login successful!");
        
        const from = location.state?.from?.pathname || ROUTES.DASHBOARD;
        navigate(from, { replace: true });
      } else {
        // Handle specific error messages for direct login
        if (
          response.msg &&
          response.msg.toLowerCase().includes("user not found")
        ) {
          toast.error("User not found");
        } else if (
          response.msg &&
          response.msg.toLowerCase().includes("invalid email or password")
        ) {
          toast.error("Incorrect password");
        } else {
          toast.error(response.msg || "Login failed");
        }
      }
    } catch (error) {
      // Handle specific error messages from API response
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message.toLowerCase();
        if (errorMessage.includes("user not found")) {
          toast.error("User not found");
        } else if (errorMessage.includes("invalid email or password")) {
          toast.error("Incorrect password");
        } else {
          toast.error(error.response.data.message);
        }
      } else {
        toast.error("Login failed. Please try again.");
      }
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
        // Navigate to TwoFactorAuth page with email, password, and isManager flag
        navigate(ROUTES.TWO_FACTOR_AUTH, {
          state: {
            email: formData.email,
            password: formData.password,
            phoneNumberMasked: response.data.phoneNumberMasked,
            isManager: isOrgAdminUser,
          },
        });
      } else {
        // Handle specific error messages for OTP sending
        if (
          response.msg &&
          response.msg.toLowerCase().includes("user not found")
        ) {
          toast.error("User not found");
        } else if (
          response.msg &&
          response.msg.toLowerCase().includes("invalid email or password")
        ) {
          toast.error("Incorrect password");
        } else {
          toast.error(response.msg || "Failed to send OTP");
        }
      }
    } catch (error) {
      // Handle specific error messages from API response
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message.toLowerCase();
        if (errorMessage.includes("user not found")) {
          toast.error("User not found");
        } else if (errorMessage.includes("invalid email or password")) {
          toast.error("Incorrect password");
        } else {
          toast.error(error.response.data.message);
        }
      } else {
        toast.error("Failed to send OTP. Please try again.");
      }
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
                      <h2 className="font-xl-med fw-bold">
                        Two-Factor Authentication Setup
                      </h2>
                      <p className="font-base text-muted">
                        Please select your preferred authentication method
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="font-xl-med fw-bold">Login</h2>
                      <p className="font-base">
                        Don't have an account?{" "}
                        <Link
                          to="/register"
                          className="text-dark-black fw-semibold"
                        >
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
                            className={`mfa-option-card p-4 text-center ${
                              selectedMfaMethod === "sms" ? "selected" : ""
                            }`}
                            onClick={() => setSelectedMfaMethod("sms")}
                            style={{ cursor: "pointer" }}
                          >
                            <div className="mb-3">
                              <i
                                className="fa-solid fa-message"
                                style={{ fontSize: "3rem", color: "#34a853" }}
                              ></i>
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
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
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
                          className={`form-control ${
                            errors.email ? "is-invalid" : ""
                          }`}
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
                          className={`form-control ${
                            errors.password ? "is-invalid" : ""
                          }`}
                          placeholder="Password"
                          value={formData.password}
                          onChange={handleChange}
                        />
                        <span
                          className="password-eye"
                          onClick={togglePasswordVisibility}
                          style={{ cursor: "pointer" }}
                          title={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          <i
                            className={`fa-solid ${
                              showPassword ? "fa-eye" : "fa-eye-slash"
                            }`}
                          ></i>
                        </span>
                      </div>
                      {errors.password && (
                        <div className="invalid-feedback d-block">
                          <small className="text-danger">
                            {errors.password}
                          </small>
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
                      <a href="#!" className="font-base fw-medium">
                        Login with MyMass.Gov
                      </a>
                    </div>

                    <div className="d-flex flex-column important-notice mt-5">
                      <strong>Important Notice:</strong>
                      The filer/mortgagee/loan holder can only initiate the
                      Division's online registration filing process after a
                      foreclosure petition (or action) has been brought by the
                      mortgagee under the Soldiers' and Sailors' Civil Relief
                      Act. Foreclosure petition information must be entered in
                      this Online Foreclosure Database within five business days
                      after being filed with the Land Court.
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
