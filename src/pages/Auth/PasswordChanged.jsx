import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import loginImg from "../../assets/logo-sample.png";
import "../../styles/custom.css";

function PasswordChanged() {
  const { t } = useTranslation();
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
                  <h2 className="font-xl-med fw-bold">{t("passwordChanged.title")}</h2>
                  <p className="font-base">
                    {t("passwordChanged.description")}
                  </p>
                </div>

                <Link
                  to="/login"
                  className="btn custom-btn theme-btn text-center w-100"
                >
                  {t("passwordChanged.loginNow")}
                </Link>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PasswordChanged;
