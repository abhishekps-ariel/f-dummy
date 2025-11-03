import React from "react";

const Step8PetitionAttestation = ({
  formData,
  handleInputChange,
  userProfile,
  onClose,
}) => {
   return (
          <div>
            <h2 className="theme-color font-med mb-1">
              8. Petition Attestation & Certification
            </h2>

            <p className="text-muted small mb-3">
              By completing this section, you formally certify the accuracy and
              completeness of the entire petition.
            </p>

            {/* Attester Details & Digital Signature - Combined */}

            <div className="p-4 border border-info bg-info-subtle rounded mb-4">
              <h5 className="fw-bold font-base mb-3">
                <i className="fas fa-signature me-2"></i>
                Attester Details & Digital Signature
              </h5>

              <div className="row g-3">
                <div className="col-md-4">
                  <label htmlFor="signerFirstName" className="form-label">
                    First Name *
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
                    Prefilled from your profile
                  </small>
                </div>

                <div className="col-md-4">
                  <label htmlFor="signerMiddleInitial" className="form-label">
                    Middle Initial
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
                    Prefilled from your profile
                  </small>
                </div>

                <div className="col-md-4">
                  <label htmlFor="signerLastName" className="form-label">
                    Last Name *
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
                    Prefilled from your profile
                  </small>
                </div>

                <div className="col-md-6">
                  <label htmlFor="signerEmail" className="form-label">
                    Email Address *
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
                    Prefilled from your profile
                  </small>
                </div>

                <div className="col-md-6">
                  <label htmlFor="signerTitle" className="form-label">
                    Title *
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
                    Prefilled from your profile
                  </small>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Digital Signature Status</label>

                  <div className="d-flex align-items-center">
                    {userProfile?.signatureUrl ? (
                      <span className="badge bg-success fs-6 me-2">
                        <i className="fa-solid fa-check-circle me-1"></i>
                        Available
                      </span>
                    ) : (
                      <span className="badge bg-danger fs-6 me-2">
                        <i className="fa-solid fa-exclamation-circle me-1"></i>
                        Required
                      </span>
                    )}
                  </div>
                </div>

                {userProfile?.signatureUrl && (
                  <div className="col-12">
                    <label className="form-label">Signature Preview</label>

                    <div
                      className="signature-preview-container p-3 border rounded bg-light"
                      style={{ maxWidth: "400px" }}
                    >
                      <img
                        src={userProfile.signatureUrl}
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
                      Digital Signature Required
                    </h5>

                    <p className="mb-3">
                      You must upload a digital signature to your profile before
                      you can proceed to review and submit the petition.
                    </p>

                    <button
                      type="button"
                      className="dashboard-btn-create"
                      onClick={() => {
                        // Close petition modal and navigate to profile

                        onClose();

                        window.location.href = "/profile";
                      }}
                    >
                      <i className="fas fa-user me-2"></i>
                      Go to Profile to Upload Signature
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
                      Digital Signature Available
                    </h5>

                    <p className="mb-0">
                      Your digital signature is ready for petition submission.
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
                Electronic Certification: I solemnly certify under the pains and
                penalties of perjury that the information contained in this
                petition is true and correct to the best of my knowledge and
                belief.
                {!userProfile?.signatureUrl && (
                  <span className="text-danger ms-2">(Signature required)</span>
                )}
              </label>
            </div>

            <div className="border-top pt-3 text-muted small">
              <p>
                Submission Timestamp:{" "}
                <span className="text-dark">
                  Will be captured upon submission
                </span>
              </p>
            </div>
          </div>
        );
};

export default Step8PetitionAttestation;
