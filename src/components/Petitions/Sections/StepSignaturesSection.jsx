import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { getBase64ByS3Key } from "../../../services/authService";


const StepSignaturesSection = ({
    SectionHeader,
  signatureSectionRef,
  isEditing,
  fieldErrors,
  formData,
  setFormData,
  setFieldErrors,
  petition,
  formatDate,
}) => {
  const { t } = useTranslation();
  const [signatureImages, setSignatureImages] = useState({});
  const [loadingSignatures, setLoadingSignatures] = useState({});

  // Fetch signature base64 when displaying (not editing)
  useEffect(() => {
    if (!isEditing) {
      const signatures = petition.details?.signatures || [];
      signatures.forEach((signature, index) => {
        const signatureValue = signature.signatureDrawnOrTyped;
        if (signatureValue && signatureValue.trim() !== "") {
          // Check if it's already a data URL (base64 image)
          if (signatureValue.startsWith('data:image/')) {
            setSignatureImages(prev => ({
              ...prev,
              [index]: signatureValue
            }));
          } else {
            // It's an S3 key, fetch the base64
            setLoadingSignatures(prev => ({ ...prev, [index]: true }));
            getBase64ByS3Key(signatureValue)
              .then(response => {
                if (response.isSuccess && response.data?.signatureBase64) {
                  const dataUrl = `data:image/png;base64,${response.data.signatureBase64}`;
                  setSignatureImages(prev => ({
                    ...prev,
                    [index]: dataUrl
                  }));
                }
              })
              .catch(error => {
                toast.error(t("petitionTabContent.errorFetchingSignature") || "Failed to load signature image");
              })
              .finally(() => {
                setLoadingSignatures(prev => ({ ...prev, [index]: false }));
              });
          }
        }
      });
    }
  }, [isEditing, petition.details?.signatures]);

  return (
    <>
      <div 
            ref={signatureSectionRef}
            className={`card mb-4 ${isEditing ? "editing" : ""} ${
              fieldErrors.esignConsent ? "border-danger" : ""
            }`}
          >
            <SectionHeader title={t("petitionTabContent.signatures")} />
            <div className="card-body">
              {(() => {
                // Use formData.signatures when editing, otherwise use petition.details.signatures
                const signatures = isEditing 
                  ? (formData?.signatures || [])
                  : (petition.details?.signatures || []);
                
                return signatures.length > 0 ? (
                  signatures.map((signature, index) => (
                  <div key={index} className="border rounded p-3 mb-3">
                    <h6 className="mb-3 fw-semibold">{t("petitionTabContent.signature")}</h6>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">{t("petitionTabContent.signerFullName")}</label>
                          <input
                            type="text"
                            className="form-control"
                            value={signature.signerFullName || "N/A"}
                            readOnly={!isEditing}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">{t("petitionTabContent.signerTitle")}</label>
                          <input
                            type="text"
                            className="form-control"
                            value={signature.signerTitle || "N/A"}
                            readOnly={!isEditing}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">{t("petitionTabContent.signerEmail")}</label>
                          <input
                            type="text"
                            className="form-control"
                            value={signature.signerEmail || "N/A"}
                            readOnly={!isEditing}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">
                            {t("petitionTabContent.esignConsent")} {isEditing && "*"}
                          </label>
                          {isEditing ? (
                            <>
                              <div className="form-check">
                                <input
                                  className={`form-check-input ${
                                    fieldErrors.esignConsent ? "is-invalid" : ""
                                  }`}
                                  type="checkbox"
                                  id={`esignConsent_${index}`}
                                  checked={signature.esignConsent || false}
                                  onChange={(e) => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      signatures: prev.signatures.map((sig, idx) =>
                                        idx === index
                                          ? { ...sig, esignConsent: e.target.checked }
                                          : sig
                                      ),
                                    }));
                                    // Clear error when user checks the box
                                    if (e.target.checked && fieldErrors.esignConsent) {
                                      setFieldErrors((prev) => {
                                        const newErrors = { ...prev };
                                        delete newErrors.esignConsent;
                                        return newErrors;
                                      });
                                    }
                                  }}
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor={`esignConsent_${index}`}
                                >
                                  {t("petitionTabContent.esignConsentText")}
                                </label>
                              </div>
                              {fieldErrors.esignConsent && (
                                <div className="text-danger small mt-1">
                                  {fieldErrors.esignConsent}
                                </div>
                              )}
                            </>
                          ) : (
                            <input
                              type="text"
                              className="form-control"
                              value={signature.esignConsent ? t("petitionTabContent.yes") : t("petitionTabContent.no")}
                              readOnly
                            />
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">{t("petitionTabContent.signedAt")}</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formatDate(signature.signedAt)}
                            readOnly
                          />
                        </div>
                      </div>
                      {(signature.signatureDrawnOrTyped || signatureImages[index]) && (
                        <div className="col-12">
                          <div className="form-group mb-3">
                            <label className="form-label">
                              {t("petitionTabContent.signaturePreview")}
                            </label>
                            <div className="signature-preview-container p-3 border rounded bg-light">
                              {loadingSignatures[index] ? (
                                <div className="text-center py-2">
                                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                                    <span className="visually-hidden">Loading signature...</span>
                                  </div>
                                  <p className="mt-1 text-muted small">{t("petitionTabContent.loadingSignature")}</p>
                                </div>
                              ) : (
                                <img
                                  src={signatureImages[index] || signature.signatureDrawnOrTyped}
                                  alt="Digital Signature"
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
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
                ) : (
                  <p className="text-muted">{t("petitionTabContent.noSignatureInformation")}</p>
                );
              })()}
            </div>
          </div>
    </>
  );
};

export default StepSignaturesSection;
