import React from "react";
import { useTranslation } from "react-i18next";

const Step4BorrowerDetails = ({
  formData,
  fieldErrors,
  setFieldErrors,
  setFormData,
  updateBorrower,
  removeBorrower,
  addBorrower,
  borrowerPredictions,
  showBorrowerPredictions,
  setShowBorrowerPredictions,
  handleBorrowerAddressInput,
  handleBorrowerPredictionClick,
  isLoadingBorrowerPredictions,
  borrowerAddressValidationErrors,
  selectedBorrowerPredictionIndex,
  borrowerAddressesVerified,
}) => {
  const { t } = useTranslation();

  const resetAllBorrowersToNotPrimary = (prev) => ({
    ...prev,
    borrowers: prev.borrowers.map((b) => ({
      ...b,
      borrowerIsPrimary: false,
    })),
  });

  return (
    <div>
      <h2 className="theme-color font-med mb-1">
        {t("petitionSteps.step4.title")}
      </h2>

      <p className="text-muted small mb-3">
        {t("petitionSteps.step4.description")}
      </p>

      {formData.borrowers.map((borrower, index) => (
        <div
          key={borrower.id}
          className="p-3 border rounded bg-light mb-3 position-relative"
        >
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-semibold text-dark mb-0 font-base">
              {t("petitionSteps.step4.borrower")} {index + 1}
            </h5>

            {formData.borrowers.length > 1 && (
              <button
                type="button"
                className="btn btn-sm border-0"
                style={{
                  background: "#dc3545",

                  color: "#ffffff",

                  border: "1px solid #dc3545",

                  borderRadius: "4px",

                  width: "32px",

                  height: "32px",

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "center",
                }}
                onClick={() => removeBorrower(borrower.id)}
                title={t("petitionSteps.step4.removeBorrower")}
              >
                <i className="fas fa-times" style={{ fontSize: "12px" }}></i>
              </button>
            )}
          </div>

          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">
                {t("petitionSteps.step4.firstName")} *
              </label>

              <input
                type="text"
                className={`form-control ${
                  fieldErrors[`borrower_${borrower.id}_firstName`]
                    ? "is-invalid"
                    : ""
                }`}
                value={borrower.firstName}
                onChange={(e) => {
                  updateBorrower(borrower.id, "firstName", e.target.value);

                  // Clear field error when user starts typing

                  if (fieldErrors[`borrower_${borrower.id}_firstName`]) {
                    setFieldErrors((prev) => {
                      const newErrors = { ...prev };

                      delete newErrors[`borrower_${borrower.id}_firstName`];

                      return newErrors;
                    });
                  }
                }}
                placeholder={t("petitionSteps.step4.placeholderFirstName")}
              />

              {fieldErrors[`borrower_${borrower.id}_firstName`] && (
                <div className="text-danger small mt-1">
                  {fieldErrors[`borrower_${borrower.id}_firstName`]}
                </div>
              )}
            </div>

            <div className="col-md-2">
              <label className="form-label">
                {t("petitionSteps.step4.middleName")}
              </label>

              <input
                type="text"
                className={`form-control ${
                  fieldErrors[`borrower_${borrower.id}_middleName`]
                    ? "is-invalid"
                    : ""
                }`}
                value={borrower.middleName}
                onChange={(e) => {
                  updateBorrower(borrower.id, "middleName", e.target.value);

                  // Clear field error when user starts typing

                  if (fieldErrors[`borrower_${borrower.id}_middleName`]) {
                    setFieldErrors((prev) => {
                      const newErrors = { ...prev };

                      delete newErrors[`borrower_${borrower.id}_middleName`];

                      return newErrors;
                    });
                  }
                }}
                placeholder={t("petitionSteps.step4.placeholderMiddleName")}
              />

              {fieldErrors[`borrower_${borrower.id}_middleName`] && (
                <div className="text-danger small mt-1">
                  {fieldErrors[`borrower_${borrower.id}_middleName`]}
                </div>
              )}
            </div>

            <div className="col-md-3">
              <label className="form-label">
                {t("petitionSteps.step4.lastName")} *
              </label>

              <input
                type="text"
                className={`form-control ${
                  fieldErrors[`borrower_${borrower.id}_lastName`]
                    ? "is-invalid"
                    : ""
                }`}
                value={borrower.lastName}
                onChange={(e) => {
                  updateBorrower(borrower.id, "lastName", e.target.value);

                  // Clear field error when user starts typing

                  if (fieldErrors[`borrower_${borrower.id}_lastName`]) {
                    setFieldErrors((prev) => {
                      const newErrors = { ...prev };

                      delete newErrors[`borrower_${borrower.id}_lastName`];

                      return newErrors;
                    });
                  }
                }}
                placeholder={t("petitionSteps.step4.placeholderLastName")}
              />

              {fieldErrors[`borrower_${borrower.id}_lastName`] && (
                <div className="text-danger small mt-1">
                  {fieldErrors[`borrower_${borrower.id}_lastName`]}
                </div>
              )}
            </div>

            <div className="col-md-2">
              <label className="form-label">
                {t("petitionSteps.step4.suffix")}
              </label>

              <input
                type="text"
                className={`form-control ${
                  fieldErrors[`borrower_${borrower.id}_suffix`]
                    ? "is-invalid"
                    : ""
                }`}
                value={borrower.suffix}
                onChange={(e) => {
                  updateBorrower(borrower.id, "suffix", e.target.value);

                  // Clear field error when user starts typing

                  if (fieldErrors[`borrower_${borrower.id}_suffix`]) {
                    setFieldErrors((prev) => {
                      const newErrors = { ...prev };

                      delete newErrors[`borrower_${borrower.id}_suffix`];

                      return newErrors;
                    });
                  }
                }}
                placeholder={t("petitionSteps.step4.placeholderSuffix")}
              />

              {fieldErrors[`borrower_${borrower.id}_suffix`] && (
                <div className="text-danger small mt-1">
                  {fieldErrors[`borrower_${borrower.id}_suffix`]}
                </div>
              )}
            </div>

            <div className="col-md-2">
              <label className="form-label">
                {t("petitionSteps.step4.primaryBorrower")}
              </label>

              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="primaryBorrower"
                  checked={borrower.borrowerIsPrimary}
                  onChange={() => {
                    // Set all borrowers to not primary first
                    setFormData(resetAllBorrowersToNotPrimary);

                    // Then set the selected one as primary
                    updateBorrower(borrower.id, "borrowerIsPrimary", true);
                  }}
                />

                <label className="form-check-label">
                  {t("petitionSteps.step4.primary")}
                </label>
              </div>
            </div>
          </div>

          <div className="row g-3 mt-2">
            <div className="col-md-6">
              <label className="form-label">
                {t("petitionSteps.step4.mailingAddress")}
                {borrowerAddressesVerified?.[borrower.id] &&
                  borrower.mailingStreet1?.trim() && (
                    <span className="text-success ms-2">
                      ✓ {t("petitionSteps.step4.verified")}
                    </span>
                  )}
              </label>

              <div className="position-relative">
                <input
                  type="text"
                  className={`form-control ${
                    borrowerAddressValidationErrors[
                      `borrower_${borrower.id}_mailingAddress`
                    ]
                      ? "is-invalid"
                      : ""
                  }`}
                  value={borrower.mailingStreet1}
                  onChange={(e) => {
                    updateBorrower(
                      borrower.id,
                      "mailingStreet1",
                      e.target.value
                    );

                    handleBorrowerAddressInput(borrower.id, e.target.value);
                  }}
                  onBlur={() => {
                    const hidePredictions = (prev) => ({
                      ...prev,
                      [borrower.id]: false,
                    });
                    setTimeout(
                      () => setShowBorrowerPredictions(hidePredictions),
                      300
                    );
                  }}
                  onFocus={() => {
                    if (
                      borrowerPredictions[borrower.id] &&
                      borrowerPredictions[borrower.id].length > 0
                    ) {
                      setShowBorrowerPredictions((prev) => ({
                        ...prev,
                        [borrower.id]: true,
                      }));
                    }
                  }}
                  placeholder={t(
                    "petitionSteps.step4.placeholderMailingAddress"
                  )}
                  autoComplete="off"
                />

                {/* Loading indicator */}
                {isLoadingBorrowerPredictions[borrower.id] && (
                  <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                    <div
                      className="spinner-border spinner-border-sm text-muted"
                      aria-hidden="true"
                    >
                      <span className="visually-hidden">
                        {t("common.loading")}
                      </span>
                    </div>
                    <output className="visually-hidden">
                      {t("common.loading")}
                    </output>
                  </div>
                )}

                {/* Address suggestions dropdown */}
                {showBorrowerPredictions[borrower.id] &&
                  borrowerPredictions[borrower.id] &&
                  borrowerPredictions[borrower.id].length > 0 && (
                    <div
                      className="position-absolute w-100 bg-white border border-top-0 rounded-bottom shadow-sm"
                      style={{
                        zIndex: 1050,
                        maxHeight: "200px",
                        overflowY: "auto",
                      }}
                    >
                      {borrowerPredictions[borrower.id].map(
                        (prediction, index) => (
                          <button
                            key={prediction.place_id}
                            type="button"
                            className={`px-3 py-2 text-start w-100 ${
                              selectedBorrowerPredictionIndex[borrower.id] ===
                              index
                                ? "bg-primary text-white"
                                : "hover-bg-light"
                            }`}
                            onClick={() =>
                              handleBorrowerPredictionClick(
                                borrower.id,
                                prediction
                              )
                            }
                            style={{
                              border: "none",
                              borderBottom: "1px solid #dee2e6",
                              background:
                                selectedBorrowerPredictionIndex[borrower.id] ===
                                index
                                  ? "var(--bs-primary)"
                                  : "transparent",
                              cursor: "pointer",
                              fontFamily: "inherit",
                              fontSize: "inherit",
                              color:
                                selectedBorrowerPredictionIndex[borrower.id] ===
                                index
                                  ? "white"
                                  : "inherit",
                            }}
                          >
                            <div className="fw-medium">
                              {prediction.description}
                            </div>
                          </button>
                        )
                      )}
                    </div>
                  )}
              </div>

              {borrowerAddressValidationErrors[
                `borrower_${borrower.id}_mailingAddress`
              ] && (
                <div className="text-danger small mt-1">
                  {
                    borrowerAddressValidationErrors[
                      `borrower_${borrower.id}_mailingAddress`
                    ]
                  }
                </div>
              )}
            </div>

            <div className="col-md-3">
              <label className="form-label">
                {t("petitionSteps.step4.city")}
              </label>

              <input
                type="text"
                className="form-control"
                value={borrower.mailingCity}
                onChange={(e) =>
                  updateBorrower(borrower.id, "mailingCity", e.target.value)
                }
                placeholder={t("petitionSteps.step4.placeholderCity")}
              />
            </div>

            <div className="col-md-1">
              <label className="form-label">
                {t("petitionSteps.step4.state")}
              </label>

              <input
                type="text"
                className="form-control"
                value={borrower.mailingState}
                onChange={(e) =>
                  updateBorrower(borrower.id, "mailingState", e.target.value)
                }
                placeholder={t("petitionSteps.step4.placeholderState")}
              />
            </div>

            <div className="col-md-2">
              <label className="form-label">
                {t("petitionSteps.step4.zip")}
              </label>

              <input
                type="text"
                className="form-control"
                value={borrower.mailingZip}
                onChange={(e) =>
                  updateBorrower(borrower.id, "mailingZip", e.target.value)
                }
                placeholder={t("petitionSteps.step4.placeholderZip")}
              />
            </div>
          </div>

          <div className="row g-3 mt-2">
            <div className="col-md-6">
              <label className="form-label">
                {t("petitionSteps.step4.phoneNumber")}
              </label>

              <input
                type="tel"
                className="form-control"
                value={borrower.phone}
                onChange={(e) =>
                  updateBorrower(borrower.id, "phone", e.target.value)
                }
                placeholder={t("petitionSteps.step4.placeholderPhone")}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">
                {t("petitionSteps.step4.emailAddress")}
              </label>

              <input
                type="email"
                className="form-control"
                value={borrower.email}
                onChange={(e) =>
                  updateBorrower(borrower.id, "email", e.target.value)
                }
                placeholder={t("petitionSteps.step4.placeholderEmail")}
              />
            </div>
          </div>
        </div>
      ))}

      <div className="text-center">
        <button
          type="button"
          className="dashboard-btn-create"
          onClick={addBorrower}
        >
          <i className="fas fa-plus me-2"></i>
          {t("petitionSteps.step4.addAnotherBorrower")}
        </button>
      </div>
    </div>
  );
};

export default Step4BorrowerDetails;
