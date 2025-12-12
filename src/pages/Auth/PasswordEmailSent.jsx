import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { forgotPassword } from "../../services/authService";
import loginImg from "../../assets/logo-sample.png";
import "../../styles/custom.css";

function PasswordEmailSent() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("resetEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error(t("passwordEmailSent.emailNotFound"));
      return;
    }
    if (isResending) return;

    setIsResending(true);

    try {
      const response = await forgotPassword(email);

      if (response.isSuccess) {
        toast.success(
          response.msg || t("passwordEmailSent.resetEmailSentAgain")
        );
      } else {
        toast.error(
          response.msg || t("passwordEmailSent.failedResendEmail")
        );
      }
    } catch (err) {
      toast.error(err?.message || t("passwordEmailSent.failedResendEmail"));
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
                  <h2 className="font-xl-med fw-bold">{t("passwordEmailSent.title")}</h2>
                  <p className="font-base">
                    {t("passwordEmailSent.description")}
                  </p>
                </div>

                <Link
                  to="/login"
                  className="btn custom-btn theme-btn text-center w-100"
                >
                  {t("passwordEmailSent.backToLogin")}
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
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        {t("passwordEmailSent.resending")}
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-chevron-left me-1"></i> {t("passwordEmailSent.resendEmail")}
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
