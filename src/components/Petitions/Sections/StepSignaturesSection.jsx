import React from "react";


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
  return (
    <>
      <div 
            ref={signatureSectionRef}
            className={`card mb-4 ${isEditing ? "editing" : ""} ${
              fieldErrors.esignConsent ? "border-danger" : ""
            }`}
          >
            <SectionHeader title="Signatures" />
            <div className="card-body">
              {(() => {
                // Use formData.signatures when editing, otherwise use petition.details.signatures
                const signatures = isEditing 
                  ? (formData?.signatures || [])
                  : (petition.details?.signatures || []);
                
                return signatures.length > 0 ? (
                  signatures.map((signature, index) => (
                  <div key={index} className="border rounded p-3 mb-3">
                    <h6 className="mb-3 fw-semibold">Signature {index + 1}</h6>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Signer Full Name</label>
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
                          <label className="form-label">Signer Title</label>
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
                          <label className="form-label">Signer Email</label>
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
                            E-Sign Consent {isEditing && "*"}
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
                                  I consent to electronic signature
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
                              value={signature.esignConsent ? "Yes" : "No"}
                              readOnly
                            />
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Signed At</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formatDate(signature.signedAt)}
                            readOnly
                          />
                        </div>
                      </div>
                      {signature.signatureDrawnOrTyped && (
                        <div className="col-12">
                          <div className="form-group mb-3">
                            <label className="form-label">
                              Signature Preview
                            </label>
                            <div className="signature-preview-container p-3 border rounded bg-light">
                              <img
                                src={signature.signatureDrawnOrTyped}
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
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
                ) : (
                  <p className="text-muted">No signature information available</p>
                );
              })()}
            </div>
          </div>
    </>
  );
};

export default StepSignaturesSection;
