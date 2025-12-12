import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { checkResetToken, resetPassword } from "../../services/authService";
import { VALIDATION } from "../../constants/appConstants";
import PasswordGuidelines from "../../components/shared/PasswordGuidelines";
import loginImg from "../../assets/logo-sample.png";
import "../../styles/custom.css";

function SetNewPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { token: pathToken } = useParams();

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordChanged, setIsPasswordChanged] = useState(false);
  const [showPasswordGuidelines, setShowPasswordGuidelines] = useState(false);
  const [passwordGuidelines, setPasswordGuidelines] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [userId, setUserId] = useState(null);

  // Get token and userId from URL
  const token = pathToken || searchParams.get("token");
  const userIdParam = searchParams.get("userId");

  // Check token validity when component mounts
  useEffect(() => {
    const validateToken = async () => {
      if (!token || !userIdParam) {
        setIsCheckingToken(false);
        setIsTokenValid(false);
        return;
      }

      try {
        const response = await checkResetToken(userIdParam);

        if (response.isSuccess) {
          setUserId(userIdParam);
          setIsTokenValid(true);
        } else {
          toast.error(response.msg || t("errors.invalidExpiredResetLink"));
          setIsTokenValid(false);
        }
      } catch (err) {
        toast.error(err?.message || t("errors.invalidExpiredResetLink"));
        setIsTokenValid(false);
      } finally {
        setIsCheckingToken(false);
      }
    };

    validateToken();
  }, [token, userIdParam]);

  // Check password guidelines
  const checkPasswordGuidelines = (password) => {
    const guidelines = {
      minLength: password.length >= VALIDATION.MIN_PASSWORD_LENGTH,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[@#$%^&*]/.test(password),
    };
    setPasswordGuidelines(guidelines);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // New Password validation
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = t("setNewPassword.newPasswordRequired");
    } else {
      if (formData.newPassword.length < VALIDATION.MIN_PASSWORD_LENGTH) {
        newErrors.newPassword = t("setNewPassword.newPasswordMinLength");
      } else if (!/[A-Z]/.test(formData.newPassword)) {
        newErrors.newPassword = t("setNewPassword.newPasswordUppercase");
      } else if (!/[a-z]/.test(formData.newPassword)) {
        newErrors.newPassword = t("setNewPassword.newPasswordLowercase");
      } else if (!/\d/.test(formData.newPassword)) {
        newErrors.newPassword = t("setNewPassword.newPasswordNumber");
      } else if (!/[@#$%^&*]/.test(formData.newPassword)) {
        newErrors.newPassword = t("setNewPassword.newPasswordSpecialChar");
      }
    }

    // Confirm Password validation
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = t("setNewPassword.confirmPasswordRequired");
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t("setNewPassword.passwordsDoNotMatch");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error when user typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }

    // Check password guidelines when password changes
    if (name === "newPassword") {
      if (value.length > 0) {
        setShowPasswordGuidelines(true);
      }
      checkPasswordGuidelines(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t("errors.pleaseFixErrorsBelow"));
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await resetPassword(userId, formData.newPassword, token);

      if (response.isSuccess) {
        toast.success(response.msg || t("errors.passwordResetSuccessfully"));
        setIsPasswordChanged(true);
      } else {
        toast.error(
          response.msg || t("errors.failedResetPassword")
        );
      }
    } catch (err) {
      toast.error(err?.message || t("errors.failedResetPassword"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPasswords(!showPasswords);
  };

  // Show loading while checking token
  if (isCheckingToken) {
    return (
      <div className="login">
        <div className="container container-md-auto">
          <div className="row m-0">
            <div className="col-lg-5 col-md-4 px-0">
              <div className="login-right-image"></div>
            </div>
            <div className="col-lg-7 col-md-8">
              <div className="login-inner d-flex flex-column align-items-center justify-content-center">
                <div className="text-center">
                  <div
                    className="spinner-border text-primary mb-3"
                    role="status"
                    style={{ width: "3rem", height: "3rem" }}
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="font-base text-muted">
                    {t("setNewPassword.validatingResetLink")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show invalid link if token is missing or invalid
  if (!token || !isTokenValid) {
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
                    <div className="mb-4">
                      <div className="verification-icon d-inline-flex align-items-center justify-content-center mb-3">
                        <i
                          className="fa-solid fa-exclamation-circle text-warning"
                          style={{ fontSize: "4rem" }}
                        ></i>
                      </div>
                      <h2 className="font-xl-med fw-bold text-warning">
                        {t("setNewPassword.invalidExpiredLink")}
                      </h2>
                      <p className="font-base text-muted">
                        {t("setNewPassword.invalidExpiredLinkDesc")}
                      </p>
                    </div>

                    <Link
                      to="/forgot-password"
                      className="btn custom-btn theme-btn text-center w-100"
                    >
                      <i className="fa-solid fa-envelope me-2"></i>
                      {t("setNewPassword.requestPasswordReset")}
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

                  {!isPasswordChanged ? (
                    <>
                      <h2 className="font-xl-med fw-bold">{t("setNewPassword.title")}</h2>
                      <p className="font-base">
                        {t("setNewPassword.description")}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="mb-4">
                        <div className="verification-icon d-inline-flex align-items-center justify-content-center mb-3">
                          <i
                            className="fa-solid fa-check-circle text-success"
                            style={{ fontSize: "4rem" }}
                          ></i>
                        </div>
                        <h2 className="font-xl-med fw-bold text-success">
                          {t("setNewPassword.passwordChanged")}
                        </h2>
                        <p className="font-base text-muted">
                          {t("setNewPassword.passwordChangedDesc")}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {!isPasswordChanged ? (
                  <>
                    <div className="form-group">
                      <label className="label-text">{t("setNewPassword.newPassword")}</label>
                      <div className="input-group position-relative">
                        <div className="user-icon">
                          <i className="fa-solid fa-lock"></i>
                        </div>
                        <input
                          name="newPassword"
                          type={showPasswords ? "text" : "password"}
                          className={`form-control ${
                            errors.newPassword ? "is-invalid" : ""
                          }`}
                          placeholder={t("setNewPassword.placeholderNewPassword")}
                          value={formData.newPassword}
                          onChange={handleChange}
                          onFocus={() => setShowPasswordGuidelines(true)}
                          onBlur={() => setShowPasswordGuidelines(false)}
                          required
                        />
                        <span
                          className="password-eye"
                          onClick={togglePasswordVisibility}
                          style={{ cursor: "pointer" }}
                          title={
                            showPasswords ? t("setNewPassword.hidePasswords") : t("setNewPassword.showPasswords")
                          }
                        >
                          <i
                            className={`fa-solid ${
                              showPasswords ? "fa-eye" : "fa-eye-slash"
                            }`}
                          ></i>
                        </span>
                        {/* Password Guidelines Tooltip */}
                        <PasswordGuidelines
                          showGuidelines={showPasswordGuidelines}
                          passwordGuidelines={passwordGuidelines}
                        />
                      </div>
                      {errors.newPassword && (
                        <div className="invalid-feedback d-block">
                          <small className="text-danger">
                            {errors.newPassword}
                          </small>
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="label-text">{t("setNewPassword.confirmNewPassword")}</label>
                      <div className="input-group position-relative">
                        <div className="user-icon">
                          <i className="fa-solid fa-lock"></i>
                        </div>
                        <input
                          name="confirmPassword"
                          type={showPasswords ? "text" : "password"}
                          className={`form-control ${
                            errors.confirmPassword ? "is-invalid" : ""
                          }`}
                          placeholder={t("setNewPassword.placeholderConfirmPassword")}
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                        />
                        <span
                          className="password-eye"
                          onClick={togglePasswordVisibility}
                          style={{ cursor: "pointer" }}
                          title={
                            showPasswords ? t("setNewPassword.hidePasswords") : t("setNewPassword.showPasswords")
                          }
                        >
                          <i
                            className={`fa-solid ${
                              showPasswords ? "fa-eye" : "fa-eye-slash"
                            }`}
                          ></i>
                        </span>
                      </div>
                      {errors.confirmPassword && (
                        <div className="invalid-feedback d-block">
                          <small className="text-danger">
                            {errors.confirmPassword}
                          </small>
                        </div>
                      )}
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
                          {t("setNewPassword.updatingPassword")}
                        </>
                      ) : (
                        t("setNewPassword.resetPassword")
                      )}
                    </button>

                    <div className="text-center mt-4">
                      <Link
                        to="/login"
                        className="font-base fw-medium text-decoration-none"
                      >
                        <i className="fa-solid fa-chevron-left me-1"></i> {t("setNewPassword.backToLogin")}
                      </Link>
                    </div>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="btn custom-btn theme-btn text-center w-100"
                  >
                    <i className="fa-solid fa-sign-in-alt me-2"></i>
                    {t("setNewPassword.goToLogin")}
                  </Link>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SetNewPassword;
