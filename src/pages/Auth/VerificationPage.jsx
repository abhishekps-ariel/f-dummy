import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { verifyEmail, resendVerification } from "../../services/authService";
import loginImg from "../../assets/logo-sample.png";
import "../../styles/custom.css";

function VerificationPage() {
  const { t } = useTranslation();
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
        setVerificationMessage(t("verification.invalidLink"));
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
          setVerificationMessage(
            response.msg || t("verification.verificationSuccess")
          );

          sessionStorage.setItem(
            `verify_${token}`,
            JSON.stringify({
              isVerified: true,
              message:
                response.msg || t("verification.verificationSuccess"),
            })
          );
        } else {
          const backendMessage =
            response.msg || "Verification link expired or invalid.";
          const isExpired =
            backendMessage ===
            "Verification token has expired. Please request a new one.";

          let userMessage;
          let showAsVerified = false;

          if (isExpired) {
            userMessage = t("verification.linkExpiredDesc");
          } else if (
            backendMessage.includes("Invalid or unknown verification token")
          ) {
            userMessage = t("verification.alreadyVerified");
            showAsVerified = true;
          } else {
            userMessage = t("verification.verificationFailed");
          }

          setIsVerified(showAsVerified);
          setVerificationMessage(userMessage);
          setShowResendForm(isExpired);

          sessionStorage.setItem(
            `verify_${token}`,
            JSON.stringify({
              isVerified: showAsVerified,
              message: userMessage,
              showResend: isExpired,
            })
          );
        }
      } catch {
        setIsVerified(false);
        setVerificationMessage(t("verification.errorOccurred"));
        toast.error(t("verification.verificationFailed"));
      } finally {
        setIsLoading(false);
      }
    };

    verifyUserEmail();
  }, [searchParams, pathToken]);

  const handleResendLink = async () => {
    if (!userEmail.trim()) {
      toast.error(t("verification.pleaseEnterEmail"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      toast.error(t("verification.pleaseEnterValidEmail"));
      return;
    }

    setIsResending(true);
    try {
      const response = await resendVerification(userEmail);

      if (response.isSuccess) {
        toast.success(response.msg || t("verification.verificationLinkSent"));
        setUserEmail("");
      } else {
        toast.error(
          response.msg || t("verification.failedSendLink")
        );
      }
    } catch {
      toast.error(t("verification.failedSendLink"));
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
                        <div
                          className="spinner-border text-primary"
                          role="status"
                          style={{ width: "4rem", height: "4rem" }}
                        >
                          <span className="visually-hidden">{t("common.loading")}</span>
                        </div>
                      </div>
                      <h2 className="font-xl-med fw-bold">
                        {t("verification.verifyingEmail")}
                      </h2>
                      <p className="font-base text-muted">
                        {t("verification.verifyingEmailDesc")}
                      </p>
                    </div>
                  ) : isVerified ? (
                    <>
                      <div className="mb-4">
                        <div className="verification-icon d-inline-flex align-items-center justify-content-center mb-3">
                          <i
                            className="fa-solid fa-check-circle text-success"
                            style={{ fontSize: "4rem" }}
                          ></i>
                        </div>
                        <h2 className="font-xl-med fw-bold text-success">
                          {t("verification.accountVerified")}
                        </h2>
                        <p className="font-base text-muted">
                          {verificationMessage}
                        </p>
                      </div>

                      <Link
                        to="/login"
                        className="btn custom-btn theme-btn text-center w-100"
                      >
                        <i className="fa-solid fa-sign-in-alt me-2"></i>
                        {t("verification.loginToAccount")}
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className="mb-4">
                        <div className="verification-icon d-inline-flex align-items-center justify-content-center mb-3">
                          <i
                            className={`fa-solid ${
                              showResendForm
                                ? "fa-clock"
                                : "fa-exclamation-circle"
                            } text-warning`}
                            style={{ fontSize: "4rem" }}
                          ></i>
                        </div>
                        <h2 className="font-xl-med fw-bold text-warning">
                          {showResendForm
                            ? t("verification.linkExpired")
                            : t("verification.verificationError")}
                        </h2>
                        <p className="font-base text-muted">
                          {verificationMessage}
                        </p>
                      </div>

                      <div className="d-flex flex-column gap-3">
                        {showResendForm ? (
                          <>
                            <div className="form-group text-start">
                              <label className="label-text">
                                {t("verification.enterEmailAddress")}
                              </label>
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
                                  <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                    aria-hidden="true"
                                  ></span>
                                  {t("verification.sending")}
                                </>
                              ) : (
                                <>
                                  <i className="fa-solid fa-paper-plane me-2"></i>
                                  {t("verification.resendVerificationLink")}
                                </>
                              )}
                            </button>

                            <Link
                              to="/login"
                              className="btn btn-link text-dark-black fw-medium"
                            >
                              {t("verification.backToLogin")}
                            </Link>
                          </>
                        ) : (
                          /* Show login button if token is already used/invalid (not expired) */
                          <Link
                            to="/login"
                            className="btn custom-btn theme-btn text-center w-100"
                          >
                            <i className="fa-solid fa-sign-in-alt me-2"></i>
                            {t("verification.goToLogin")}
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
