import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { forgotPassword } from "../../services/authService";
import loginImg from "../../assets/logo-sample.png";
import "../../styles/custom.css";

function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = t("forgotPassword.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t("forgotPassword.emailInvalid");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { value } = e.target;
    setEmail(value);

    // Clear error when user typing
    if (errors.email) {
      setErrors({ ...errors, email: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t("forgotPassword.fixErrors"));
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await forgotPassword(email);

      if (response.isSuccess) {
        toast.success(
          response.msg || t("forgotPassword.passwordResetEmailSent")
        );
        // Store email in localStorage for resend functionality
        sessionStorage.setItem("resetEmail", email);
        // Navigate to password email sent page
        window.location.href = "/password-email-sent";
      } else {
        toast.error(
          response.msg || t("forgotPassword.failedSendResetEmail")
        );
      }
    } catch (error) {
      // Handle specific error messages from API response
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(t("forgotPassword.failedSendResetEmail"));
      }
    } finally {
      setIsSubmitting(false);
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
              <form className="w-100" onSubmit={handleSubmit}>
                <div className="login-header mb-5 text-center">
                  <div className="login-logo">
                    <Link to="/">
                      <img src={loginImg} alt="logo" className="w-100" />
                    </Link>
                  </div>
                  <h2 className="font-xl-med fw-bold">{t("forgotPassword.title")}</h2>
                  <p className="font-base">
                    {t("forgotPassword.description")}
                  </p>
                </div>

                <div className="form-group">
                  <label className="label-text">{t("forgotPassword.email")}</label>
                  <div className="input-group">
                    <div className="user-icon">
                      <i className="fa-solid fa-envelope"></i>
                    </div>
                    <input
                      type="email"
                      className={`form-control ${
                        errors.email ? "is-invalid" : ""
                      }`}
                      placeholder="hello@example.com"
                      value={email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {errors.email && (
                    <div className="invalid-feedback d-block">
                      <small className="text-danger">{errors.email}</small>
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
                      {t("common.loading")}
                    </>
                  ) : (
                    t("forgotPassword.resetPassword")
                  )}
                </button>
                <div className="text-center mt-4">
                  <Link
                    to="/login"
                    className="font-base fw-medium text-decoration-none"
                  >
                    <i className="fa-solid fa-chevron-left me-1"></i> {t("forgotPassword.backToLogin")}
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

export default ForgotPassword;
