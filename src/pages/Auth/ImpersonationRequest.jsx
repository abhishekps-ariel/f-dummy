import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ROUTES } from "../../constants/routerConstants";
import { storeAuthData, setImpersonationState } from "../../utils/storage";
import {
  impersonateByUserId,
  managerImpersonate,
} from "../../services/authService";

function ImpersonationRequest() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const hasStarted = useRef(false);

  useEffect(() => {
    const startImpersonation = async () => {
      if (hasStarted.current) return;
      hasStarted.current = true;

      const requestedBy = (searchParams.get("requestedBy") || "").trim();
      const userId = (searchParams.get("userId") || "").trim();
      // organizationId provided in URL but not required by the current API surface

      if (!userId) {
        setLoading(false);
        setMessage(t("impersonation.missingParameter"));
        toast.error(t("impersonation.invalidLink"));
        return;
      }

      try {
        let response;
        if (requestedBy) {
          response = await managerImpersonate(requestedBy, userId);
        } else {
          response = await impersonateByUserId(userId);
        }

        if (response.isSuccess && response.data) {
          const { token, refreshToken, user } = response.data;
          storeAuthData({ token, refreshToken, user });
          setImpersonationState(true, user?.fullName || user?.email || "User");
          setMessage(t("impersonation.impersonationSuccessful"));
          toast.success(t("impersonation.impersonationSuccessfulToast"));
          // Hard reload to avoid any stale pre-auth redirects on first load
          window.location.replace(ROUTES.DASHBOARD);
        } else {
          const backendMessage =
            response.msg || t("impersonation.failedStartImpersonation");
          setMessage(backendMessage);
          toast.error(backendMessage);
        }
      } catch (err) {
        const errMsg =
          err?.response?.data?.message || err?.message || t("impersonation.impersonationFailed");
        setMessage(errMsg);
        toast.error(errMsg);
      } finally {
        setLoading(false);
      }
    };

    startImpersonation();
  }, [searchParams, navigate]);

  return (
    <div className="login">
      <div className="container container-md-auto">
        <div className="row m-0">
          <div className="col-lg-7 col-md-8 mx-auto">
            <div className="login-inner d-flex flex-column align-items-center justify-content-center py-5">
              <h2 className="font-xl-med fw-bold mb-3">
                {t("impersonation.processing")}
              </h2>
              {loading ? (
                <p className="text-muted">{t("impersonation.pleaseWait")}</p>
              ) : (
                <p className="text-muted">{message || t("impersonation.done")}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImpersonationRequest;
