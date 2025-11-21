import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { checkMfa, sendOtp } from "../../services/authService";
import { getMfaTypesEnum } from "../../services/commonService";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { ROUTES } from "../../constants/routerConstants";
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
  const [mfaTypes, setMfaTypes] = useState([]);
  const [preferredMfaMethod, setPreferredMfaMethod] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Load MFA types enum on mount
  useEffect(() => {
    const loadMfaTypes = async () => {
      try {
        const response = await getMfaTypesEnum();
        if (response.isSuccess && response.data) {
          // Filter out "None" and "AuthenticatorApp" for now, only show SMS and Email
          const availableTypes = response.data.filter(
            (type) => type.name === "SMS" || type.name === "Email"
          );
          setMfaTypes(availableTypes);
        }
      } catch (error) {
        console.error("Error loading MFA types:", error);
        // Fallback to default types
        setMfaTypes([
          { name: "SMS", value: 1 },
          { name: "Email", value: 2 },
        ]);
      }
    };
    loadMfaTypes();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = t("auth.thisFieldEmpty");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("auth.enterValidEmail");
    } else if (formData.email.toLowerCase().endsWith("@gmail.com")) {
      newErrors.email = t("auth.gmailNotAccepted");
    }

    if (!formData.password.trim()) {
      newErrors.password = t("auth.thisFieldEmpty");
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
        setErrors({ ...errors, email: t("auth.enterValidEmail") });
      } else if (value.toLowerCase().endsWith("@gmail.com")) {
        setErrors({ ...errors, email: t("auth.gmailNotAccepted") });
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
          toast.error(t("auth.userNotFound"));
        } else if (
          mfaResponse.msg &&
          mfaResponse.msg.toLowerCase().includes("invalid email or password")
        ) {
          toast.error(t("auth.incorrectPassword"));
        } else {
          toast.error(mfaResponse.msg || t("auth.loginFailed"));
        }
        return;
      }

      // MFA is now required on every login
      const { isMfaEnabled, preferredMfaMethod: preferredMethod, isMfaSetupRequired } = mfaResponse.data || {};
      
      // Set preferred MFA method if available
      if (preferredMethod) {
        setPreferredMfaMethod(preferredMethod);
        // Pre-select the preferred method
        setSelectedMfaMethod(preferredMethod);
      } else {
        // Default to SMS if no preference
        setSelectedMfaMethod("SMS");
      }

      // Always show MFA selection screen
      setShowMfaSelection(true);
    } catch (error) {
      // Handle specific error messages from API response
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message.toLowerCase();
        if (errorMessage.includes("user not found")) {
          toast.error(t("auth.userNotFound"));
        } else if (errorMessage.includes("invalid email or password")) {
          toast.error(t("auth.incorrectPassword"));
        } else {
          toast.error(error.response.data.message);
        }
      } else {
        toast.error(t("auth.loginFailedTryAgain"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  // MFA Setup - send OTP and navigate to TwoFactorAuth page
  const handleMfaProceed = async () => {
    if (!selectedMfaMethod) {
      toast.error(t("auth.selectMfaMethod"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await sendOtp(formData.email, formData.password, selectedMfaMethod);

      if (response.isSuccess) {
        toast.success(response.msg || t("auth.otpSentSuccess"));
        // Navigate to TwoFactorAuth page with email, password, mfaType, and masked values
        navigate(ROUTES.TWO_FACTOR_AUTH, {
          state: {
            email: formData.email,
            password: formData.password,
            mfaType: selectedMfaMethod,
            phoneNumberMasked: response.data?.phoneNumberMasked || null,
            emailMasked: response.data?.emailMasked || null,
            isManager: false, // Will be determined from verifyOtp response
          },
        });
      } else {
        // Handle specific error messages for OTP sending
        if (
          response.msg &&
          response.msg.toLowerCase().includes("user not found")
        ) {
          toast.error(t("auth.userNotFound"));
        } else if (
          response.msg &&
          response.msg.toLowerCase().includes("invalid email or password")
        ) {
          toast.error(t("auth.incorrectPassword"));
        } else {
          toast.error(response.msg || t("auth.failedSendOTP"));
        }
      }
    } catch (error) {
      // Handle specific error messages from API response
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message.toLowerCase();
        if (errorMessage.includes("user not found")) {
          toast.error(t("auth.userNotFound"));
        } else if (errorMessage.includes("invalid email or password")) {
          toast.error(t("auth.incorrectPassword"));
        } else {
          toast.error(error.response.data.message);
        }
      } else {
        toast.error(t("auth.failedSendOTPTryAgain"));
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
                        {t("auth.twoFactorAuthSetup")}
                      </h2>
                      <p className="font-base text-muted">
                        {t("auth.selectPreferredMethod")}
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="font-xl-med fw-bold">{t("auth.login")}</h2>
                      <p className="font-base">
                        {t("auth.dontHaveAccount")}{" "}
                        <Link
                          to="/register"
                          className="text-dark-black fw-semibold"
                        >
                          {t("common.register")}{" "}
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
                        {t("auth.twoFactorRequired")}
                      </p>

                      <div className="mfa-card-area row g-3 justify-content-center">
                        {mfaTypes.map((mfaType) => (
                          <div key={mfaType.name} className="col-md-8 col-lg-6">
                            <div
                              className={`mfa-option-card p-4 text-center ${
                                selectedMfaMethod === mfaType.name ? "selected" : ""
                              }`}
                              onClick={() => setSelectedMfaMethod(mfaType.name)}
                              style={{ cursor: "pointer" }}
                            >
                              <div className="mb-3">
                                {mfaType.name === "SMS" ? (
                                  <i
                                    className="fa-solid fa-message"
                                    style={{ fontSize: "3rem", color: "#34a853" }}
                                  ></i>
                                ) : (
                                  <i
                                    className="fa-solid fa-envelope"
                                    style={{ fontSize: "3rem", color: "#4285f4" }}
                                  ></i>
                                )}
                              </div>
                              <h5 className="fw-bold mb-2">{mfaType.name}</h5>
                              <p className="font-sm text-muted mb-0">
                                {mfaType.name === "SMS"
                                  ? t("auth.receiveCodeSMS")
                                  : t("auth.receiveCodeEmail")}
                              </p>
                            </div>
                          </div>
                        ))}
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
                          {t("auth.sendingOTP")}
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-arrow-right me-2"></i>
                          {t("auth.proceed")}
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="label-text">{t("auth.email")}</label>
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
                          placeholder={t("auth.email")}
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
                      <label className="label-text">{t("auth.password")}</label>
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
                          placeholder={t("auth.password")}
                          value={formData.password}
                          onChange={handleChange}
                        />
                        <span
                          className="password-eye"
                          onClick={togglePasswordVisibility}
                          style={{ cursor: "pointer" }}
                          title={
                            showPassword ? t("auth.hidePassword") : t("auth.showPassword")
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
                        {t("auth.forgotPassword")}
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
                          {t("auth.loggingIn")}
                        </>
                      ) : (
                        t("auth.login")
                      )}
                    </button>

                    <div className="loginwith w-100 text-center position-relative my-4">
                      <p className="orlogin-text mb-0">{t("common.or")}</p>
                    </div>
                    <div className="d-flex flex-column align-items-center gap-2">
                      <a href="#!" className="font-base fw-medium">
                        {t("auth.loginWithMyMassGov")}
                      </a>
                    </div>

                    <div className="text-center mt-4 mb-4">
                      <Link
                        to={ROUTES.PUBLIC_PETITIONS}
                        className="d-inline-flex align-items-center gap-2 text-decoration-none"
                        style={{
                          color: "#357a5b",
                          fontSize: "0.95rem",
                          fontWeight: "600",
                          transition: "all 0.3s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#2d6349";
                          e.currentTarget.style.transform = "translateX(2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "#357a5b";
                          e.currentTarget.style.transform = "translateX(0)";
                        }}
                      >
                        <i 
                          className="fa-solid fa-file-lines"
                          style={{ fontSize: "1rem" }}
                        ></i>
                        <span>{t("auth.viewFiledPetitions")}</span>
                        <i 
                          className="fa-solid fa-arrow-right"
                          style={{ 
                            fontSize: "0.85rem",
                            transition: "transform 0.3s ease"
                          }}
                        ></i>
                      </Link>
                    </div>

                    <div className="d-flex flex-column important-notice mt-5">
                      <strong>{t("auth.importantNotice")}</strong>
                      {t("auth.importantNoticeDesc")}
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
