import React from "react";

const Step3BorrowerDetails = ({
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
  setSelectedBorrowerPredictionIndex,
}) => {
          return (
          <div>
            <h2 className="theme-color font-med mb-1">3. Borrower Details</h2>

            <p className="text-muted small mb-3">
              Enter the full name for each borrower on the loan. At least one
              borrower is required.
            </p>

            {formData.borrowers.map((borrower, index) => (
              <div
                key={borrower.id}
                className="p-3 border rounded bg-light mb-3 position-relative"
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-semibold text-dark mb-0 font-base">
                    Borrower {index + 1}
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
                      title="Remove this borrower"
                    >
                      <i
                        className="fas fa-times"
                        style={{ fontSize: "12px" }}
                      ></i>
                    </button>
                  )}
                </div>

                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label">First Name *</label>

                    <input
                      type="text"
                      className={`form-control ${
                        fieldErrors[`borrower_${borrower.id}_firstName`]
                          ? "is-invalid"
                          : ""
                      }`}
                      value={borrower.firstName}
                      onChange={(e) => {
                        updateBorrower(
                          borrower.id,
                          "firstName",
                          e.target.value
                        );

                        // Clear field error when user starts typing

                        if (fieldErrors[`borrower_${borrower.id}_firstName`]) {
                          setFieldErrors((prev) => {
                            const newErrors = { ...prev };

                            delete newErrors[
                              `borrower_${borrower.id}_firstName`
                            ];

                            return newErrors;
                          });
                        }
                      }}
                      placeholder="Enter first name"
                    />

                    {fieldErrors[`borrower_${borrower.id}_firstName`] && (
                      <div className="text-danger small mt-1">
                        {fieldErrors[`borrower_${borrower.id}_firstName`]}
                      </div>
                    )}
                  </div>

                  <div className="col-md-2">
                    <label className="form-label">Middle Name</label>

                    <input
                      type="text"
                      className={`form-control ${
                        fieldErrors[`borrower_${borrower.id}_middleName`]
                          ? "is-invalid"
                          : ""
                      }`}
                      value={borrower.middleName}
                      onChange={(e) => {
                        updateBorrower(
                          borrower.id,
                          "middleName",
                          e.target.value
                        );

                        // Clear field error when user starts typing

                        if (fieldErrors[`borrower_${borrower.id}_middleName`]) {
                          setFieldErrors((prev) => {
                            const newErrors = { ...prev };

                            delete newErrors[
                              `borrower_${borrower.id}_middleName`
                            ];

                            return newErrors;
                          });
                        }
                      }}
                      placeholder="Middle"
                    />

                    {fieldErrors[`borrower_${borrower.id}_middleName`] && (
                      <div className="text-danger small mt-1">
                        {fieldErrors[`borrower_${borrower.id}_middleName`]}
                      </div>
                    )}
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Last Name *</label>

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

                            delete newErrors[
                              `borrower_${borrower.id}_lastName`
                            ];

                            return newErrors;
                          });
                        }
                      }}
                      placeholder="Enter last name"
                    />

                    {fieldErrors[`borrower_${borrower.id}_lastName`] && (
                      <div className="text-danger small mt-1">
                        {fieldErrors[`borrower_${borrower.id}_lastName`]}
                      </div>
                    )}
                  </div>

                  <div className="col-md-2">
                    <label className="form-label">Suffix</label>

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
                      placeholder="Jr, Sr, III"
                    />

                    {fieldErrors[`borrower_${borrower.id}_suffix`] && (
                      <div className="text-danger small mt-1">
                        {fieldErrors[`borrower_${borrower.id}_suffix`]}
                      </div>
                    )}
                  </div>

                  <div className="col-md-2">
                    <label className="form-label">Primary Borrower</label>

                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="primaryBorrower"
                        checked={borrower.borrowerIsPrimary}
                        onChange={(e) => {
                          // Set all borrowers to not primary first

                          setFormData((prev) => ({
                            ...prev,

                            borrowers: prev.borrowers.map((b) => ({
                              ...b,

                              borrowerIsPrimary: false,
                            })),
                          }));

                          // Then set the selected one as primary

                          updateBorrower(
                            borrower.id,
                            "borrowerIsPrimary",
                            true
                          );
                        }}
                      />

                      <label className="form-check-label">Primary</label>
                    </div>
                  </div>
                </div>

                <div className="row g-3 mt-2">
                  <div className="col-md-6">
                    <label className="form-label">Mailing Address</label>

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

                          handleBorrowerAddressInput(
                            borrower.id,
                            e.target.value
                          );
                        }}
                        onBlur={() => {
                          setTimeout(
                            () =>
                              setShowBorrowerPredictions((prev) => ({
                                ...prev,
                                [borrower.id]: false,
                              })),
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
                        placeholder="Street address"
                        autoComplete="off"
                      />

                      {/* Loading indicator */}

                      {isLoadingBorrowerPredictions[borrower.id] && (
                        <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                          <div
                            className="spinner-border spinner-border-sm text-primary"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      )}

                      {/* Predictions dropdown */}

                      {showBorrowerPredictions[borrower.id] &&
                        borrowerPredictions[borrower.id] &&
                        borrowerPredictions[borrower.id].length > 0 && (
                          <div
                            className="position-absolute w-100 bg-white border rounded shadow-lg"
                            style={{ zIndex: 1000, top: "100%" }}
                          >
                            {borrowerPredictions[borrower.id].map(
                              (prediction, index) => (
                                <div
                                  key={prediction.place_id}
                                  className="p-2 cursor-pointer hover-bg-light"
                                  style={{
                                    backgroundColor:
                                      selectedBorrowerPredictionIndex[
                                        borrower.id
                                      ] === index
                                        ? "#f8f9fa"
                                        : "transparent",

                                    cursor: "pointer",
                                  }}
                                  onClick={() =>
                                    handleBorrowerPredictionClick(
                                      borrower.id,
                                      prediction
                                    )
                                  }
                                  onMouseEnter={() =>
                                    setSelectedBorrowerPredictionIndex(
                                      (prev) => ({
                                        ...prev,
                                        [borrower.id]: index,
                                      })
                                    )
                                  }
                                >
                                  <div className="d-flex align-items-center">
                                    <i className="fas fa-map-marker-alt text-muted me-2"></i>

                                    <div>
                                      <div className="fw-medium">
                                        {
                                          prediction.structured_formatting
                                            .main_text
                                        }
                                      </div>

                                      <div className="text-muted small">
                                        {
                                          prediction.structured_formatting
                                            .secondary_text
                                        }
                                      </div>
                                    </div>
                                  </div>
                                </div>
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
                    <label className="form-label">City</label>

                    <input
                      type="text"
                      className="form-control"
                      value={borrower.mailingCity}
                      onChange={(e) =>
                        updateBorrower(
                          borrower.id,
                          "mailingCity",
                          e.target.value
                        )
                      }
                      placeholder="City"
                    />
                  </div>

                  <div className="col-md-1">
                    <label className="form-label">State</label>

                    <input
                      type="text"
                      className="form-control"
                      value={borrower.mailingState}
                      onChange={(e) =>
                        updateBorrower(
                          borrower.id,
                          "mailingState",
                          e.target.value
                        )
                      }
                      placeholder="MA"
                    />
                  </div>

                  <div className="col-md-2">
                    <label className="form-label">ZIP</label>

                    <input
                      type="text"
                      className="form-control"
                      value={borrower.mailingZip}
                      onChange={(e) =>
                        updateBorrower(
                          borrower.id,
                          "mailingZip",
                          e.target.value
                        )
                      }
                      placeholder="02101"
                    />
                  </div>
                </div>

                <div className="row g-3 mt-2">
                  <div className="col-md-6">
                    <label className="form-label">Phone Number</label>

                    <input
                      type="tel"
                      className="form-control"
                      value={borrower.phone}
                      onChange={(e) =>
                        updateBorrower(borrower.id, "phone", e.target.value)
                      }
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Email Address</label>

                    <input
                      type="email"
                      className="form-control"
                      value={borrower.email}
                      onChange={(e) =>
                        updateBorrower(borrower.id, "email", e.target.value)
                      }
                      placeholder="borrower@example.com"
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
                Add Another Borrower
              </button>
            </div>
          </div>
        );
};

export default Step3BorrowerDetails;
