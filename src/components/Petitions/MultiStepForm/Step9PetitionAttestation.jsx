import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../constants/routerConstants";

const Step9PetitionAttestation = ({
  formData,
  handleInputChange,
  userProfile,
  onClose,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
   return (
          <div>
            <h2 className="theme-color font-med mb-1">
              {t("petitionSteps.step9.heading")}
            </h2>

            <p className="text-muted small mb-3">
              {t("petitionSteps.step9.description")}
            </p>

            {/* Attester Details & Digital Signature - Combined */}

            <div className="p-4 border border-info bg-info-subtle rounded mb-4">
              <h5 className="fw-bold font-base mb-3">
                <i className="fas fa-signature me-2"></i>
                {t("petitionSteps.step9.attesterDetails")}
              </h5>

              <div className="row g-3">
                <div className="col-md-4">
                  <label htmlFor="signerFirstName" className="form-label">
                    {t("petitionSteps.step9.firstName")} *
                  </label>

                  <input
                    type="text"
                    id="signerFirstName"
                    name="signerFirstName"
                    className="form-control"
                    value={formData.signerFirstName}
                    onChange={handleInputChange}
                    readOnly
                  />

                  <small className="text-muted">
                    {t("petitionSteps.step9.prefilledFromProfile")}
                  </small>
                </div>

                <div className="col-md-4">
                  <label htmlFor="signerMiddleInitial" className="form-label">
                    {t("petitionSteps.step9.middleInitial")}
                  </label>

                  <input
                    type="text"
                    id="signerMiddleInitial"
                    name="signerMiddleInitial"
                    maxLength="1"
                    className="form-control"
                    value={formData.signerMiddleInitial}
                    onChange={handleInputChange}
                    readOnly
                  />

                  <small className="text-muted">
                    {t("petitionSteps.step9.prefilledFromProfile")}
                  </small>
                </div>

                <div className="col-md-4">
                  <label htmlFor="signerLastName" className="form-label">
                    {t("petitionSteps.step9.lastName")} *
                  </label>

                  <input
                    type="text"
                    id="signerLastName"
                    name="signerLastName"
                    className="form-control"
                    value={formData.signerLastName}
                    onChange={handleInputChange}
                    readOnly
                  />

                  <small className="text-muted">
                    {t("petitionSteps.step9.prefilledFromProfile")}
                  </small>
                </div>

                <div className="col-md-6">
                  <label htmlFor="signerEmail" className="form-label">
                    {t("petitionSteps.step9.emailAddress")} *
                  </label>

                  <input
                    type="email"
                    id="signerEmail"
                    name="signerEmail"
                    className="form-control"
                    value={formData.signerEmail}
                    onChange={handleInputChange}
                    readOnly
                  />

                  <small className="text-muted">
                    {t("petitionSteps.step9.prefilledFromProfile")}
                  </small>
                </div>

                <div className="col-md-6">
                  <label htmlFor="signerTitle" className="form-label">
                    {t("petitionSteps.step9.title")} *
                  </label>

                  <input
                    type="text"
                    id="signerTitle"
                    name="signerTitle"
                    className="form-control"
                    value={formData.signerTitle}
                    onChange={handleInputChange}
                    readOnly
                  />

                  <small className="text-muted">
                    {t("petitionSteps.step9.prefilledFromProfile")}
                  </small>
                </div>

                <div className="col-md-6">
                  <label className="form-label">{t("petitionSteps.step9.digitalSignatureStatus")}</label>

                  <div className="d-flex align-items-center">
                    {userProfile?.signatureUrl ? (
                      <span className="badge bg-success fs-6 me-2">
                        <i className="fa-solid fa-check-circle me-1"></i>
                        {t("petitionSteps.step9.available")}
                      </span>
                    ) : (
                      <span className="badge bg-danger fs-6 me-2">
                        <i className="fa-solid fa-exclamation-circle me-1"></i>
                        {t("petitionSteps.step9.required")}
                      </span>
                    )}
                  </div>
                </div>

                {userProfile?.signatureUrl && (
                  <div className="col-12">
                    <label className="form-label">{t("petitionSteps.step9.signaturePreview")}</label>

                    <div
                      className="signature-preview-container p-3 border rounded bg-light"
                      style={{ maxWidth: "400px" }}
                    >
                      <img
                        src={userProfile.signatureUrl}
                        alt={t("petitionSteps.step9.digitalSignature")}
                        className="signature-preview-img"
                        style={{
                          maxWidth: "100%",

                          maxHeight: "120px",

                          objectFit: "contain",

                          border: "1px solid #dee2e6",

                          borderRadius: "4px",

                          backgroundColor: "white",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Digital Signature Requirement */}

            {!userProfile?.signatureUrl ? (
              <div className="p-4 border border-danger bg-danger-subtle rounded mb-4">
                <div className="d-flex align-items-center">
                  <i
                    className="fas fa-exclamation-triangle text-danger me-3"
                    style={{ fontSize: "24px" }}
                  ></i>

                  <div className="flex-grow-1">
                    <h5 className="fw-bold text-danger mb-2">
                      {t("petitionSteps.step9.digitalSignatureRequired")}
                    </h5>

                    <p className="mb-3">
                      {t("petitionSteps.step9.digitalSignatureRequiredDesc")}
                    </p>

                    <button
                      type="button"
                      className="dashboard-btn-create"
                      onClick={() => {
                        // Close petition modal and navigate to profile
                        onClose();
                        navigate(ROUTES.PROFILE);
                      }}
                    >
                      <i className="fas fa-user me-2"></i>
                      {t("petitionSteps.step9.goToProfileToUpload")}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 border border-success bg-success-subtle rounded mb-4">
                <div className="d-flex align-items-center">
                  <i
                    className="fas fa-check-circle text-success me-3"
                    style={{ fontSize: "24px" }}
                  ></i>

                  <div className="flex-grow-1">
                    <h5 className="fw-bold text-success mb-2">
                      {t("petitionSteps.step9.digitalSignatureAvailable")}
                    </h5>

                    <p className="mb-0">
                      {t("petitionSteps.step9.digitalSignatureReady")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="form-check mb-5">
              <input
                className="form-check-input"
                type="checkbox"
                id="certification_check"
                name="certification_check"
                checked={formData.certification_check}
                onChange={handleInputChange}
                disabled={!userProfile?.signatureUrl}
              />

              <label
                className="form-check-label font-sm fw-medium"
                htmlFor="certification_check"
              >
                {t("petitionSteps.step9.electronicCertification")}
                {!userProfile?.signatureUrl && (
                  <span className="text-danger ms-2">({t("petitionSteps.step9.signatureRequired")})</span>
                )}
              </label>
            </div>

            <div className="border-top pt-3 text-muted small">
              <p>
                {t("petitionSteps.step9.submissionTimestamp")}{" "}
                <span className="text-dark">
                  {t("petitionSteps.step9.willBeCaptured")}
                </span>
              </p>
            </div>
          </div>
        );
};

export default Step9PetitionAttestation;
