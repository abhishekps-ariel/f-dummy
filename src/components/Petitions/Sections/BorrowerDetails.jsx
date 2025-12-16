import React from "react";
import { useTranslation } from "react-i18next";

const BorrowerDetails = ({
  SectionHeader,
  isEditing,
  formData,
  fieldErrors,
  removeBorrower,
  updateBorrower,
  setPrimaryBorrower,
  handleBorrowerAddressInput,
  handleBorrowerAddressSelect,
  borrowerPredictions,
  isLoaded,
  addBorrower,
}) => {
  const { t } = useTranslation();
  return (
      <div className={`card mb-4 ${isEditing ? "editing" : ""}`}>
            {SectionHeader && <SectionHeader title={t("petitionTabContent.borrowerDetails")} />}
            <div className="card-body">
              {formData.borrowers && formData.borrowers.length > 0 ? (
                <>
                  {formData.borrowers.map((borrower, index) => (
                    <div
                      key={borrower.id || index}
                      className="border rounded p-3 mb-3"
                    >
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0 fw-semibold">
                          {t("petitionTabContent.borrower")} {index + 1}
                        </h6>
                        {isEditing && formData.borrowers.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
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
                      <div className="row">
                        <div className="col-md-3">
                          <div className="form-group mb-3">
                            <label className="form-label">{t("petitionTabContent.firstName")} *</label>
                            <input
                              type="text"
                              className={`form-control ${
                                fieldErrors[`borrower_${borrower.id}_firstName`]
                                  ? "is-invalid"
                                  : ""
                              }`}
                              data-error-key={`borrower_${borrower.id}_firstName`}
                              value={borrower.firstName || ""}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                updateBorrower(
                                  borrower.id,
                                  "firstName",
                                  e.target.value
                                )
                              }
                            />
                            {fieldErrors[
                              `borrower_${borrower.id}_firstName`
                            ] && (
                              <div className="text-danger small mt-1">
                                {
                                  fieldErrors[
                                    `borrower_${borrower.id}_firstName`
                                  ]
                                }
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group mb-3">
                            <label className="form-label">{t("petitionTabContent.middleName")}</label>
                            <input
                              type="text"
                              className={`form-control ${
                                fieldErrors[
                                  `borrower_${borrower.id}_middleName`
                                ]
                                  ? "is-invalid"
                                  : ""
                              }`}
                              data-error-key={`borrower_${borrower.id}_middleName`}
                              value={borrower.middleName || ""}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                updateBorrower(
                                  borrower.id,
                                  "middleName",
                                  e.target.value
                                )
                              }
                            />
                            {fieldErrors[
                              `borrower_${borrower.id}_middleName`
                            ] && (
                              <div className="text-danger small mt-1">
                                {
                                  fieldErrors[
                                    `borrower_${borrower.id}_middleName`
                                  ]
                                }
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group mb-3">
                            <label className="form-label">{t("petitionTabContent.lastName")} *</label>
                            <input
                              type="text"
                              className={`form-control ${
                                fieldErrors[`borrower_${borrower.id}_lastName`]
                                  ? "is-invalid"
                                  : ""
                              }`}
                              data-error-key={`borrower_${borrower.id}_lastName`}
                              value={borrower.lastName || ""}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                updateBorrower(
                                  borrower.id,
                                  "lastName",
                                  e.target.value
                                )
                              }
                            />
                            {fieldErrors[
                              `borrower_${borrower.id}_lastName`
                            ] && (
                              <div className="text-danger small mt-1">
                                {
                                  fieldErrors[
                                    `borrower_${borrower.id}_lastName`
                                  ]
                                }
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group mb-3">
                            <label className="form-label">{t("petitionTabContent.suffix")}</label>
                            <input
                              type="text"
                              className={`form-control ${
                                fieldErrors[`borrower_${borrower.id}_suffix`]
                                  ? "is-invalid"
                                  : ""
                              }`}
                              data-error-key={`borrower_${borrower.id}_suffix`}
                              value={borrower.suffix || ""}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                updateBorrower(
                                  borrower.id,
                                  "suffix",
                                  e.target.value
                                )
                              }
                            />
                            {fieldErrors[`borrower_${borrower.id}_suffix`] && (
                              <div className="text-danger small mt-1">
                                {fieldErrors[`borrower_${borrower.id}_suffix`]}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">
                              {t("petitionTabContent.primaryBorrower")}
                            </label>
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={borrower.borrowerIsPrimary || false}
                                onChange={() => {
                                  if (isEditing) {
                                    setPrimaryBorrower(borrower.id);
                                  }
                                }}
                                disabled={!isEditing}
                              />
                              <label className="form-check-label">
                                {borrower.borrowerIsPrimary ? t("petitionTabContent.yes") : t("petitionTabContent.no")}
                              </label>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">{t("petitionTabContent.email")}</label>
                            <input
                              type="email"
                              className="form-control"
                              value={borrower.email || ""}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                updateBorrower(
                                  borrower.id,
                                  "email",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">{t("petitionTabContent.phone")}</label>
                            <input
                              type="text"
                              className="form-control"
                              value={borrower.phone || ""}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                updateBorrower(
                                  borrower.id,
                                  "phone",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3 position-relative">
                            <label className="form-label">
                              {t("petitionTabContent.mailingAddress")}
                            </label>
                            <input
                              type="text"
                              className={`form-control ${
                                fieldErrors[
                                  `borrower_${borrower.id}_mailingStreet1`
                                ]
                                  ? "is-invalid"
                                  : ""
                              }`}
                              data-error-key={`borrower_${borrower.id}_mailingStreet1`}
                              value={borrower.mailingStreet1 || ""}
                              readOnly={!isEditing}
                              autoComplete="off"
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
                            />
                            {/* Address suggestions dropdown */}
                            {isEditing &&
                              isLoaded &&
                              (borrowerPredictions[borrower.id] || []).length >
                                0 && (
                                <div
                                  className="address-suggestions-dropdown-tab"
                                  style={{
                                    zIndex: 50,
                                    maxHeight: "200px",
                                    overflowY: "auto",
                                  }}
                                >
                                  {(borrowerPredictions[borrower.id] || []).map(
                                    (prediction) => (
                                      <button
                                        key={prediction.place_id}
                                        type="button"
                                        className="address-suggestion-item-tab w-100 text-start"
                                        onClick={() =>
                                          handleBorrowerAddressSelect(
                                            borrower.id,
                                            prediction
                                          )
                                        }
                                        style={{
                                          border: "none",
                                          background: "transparent",
                                          fontFamily: "inherit",
                                          fontSize: "inherit",
                                          color: "inherit",
                                          padding: "inherit",
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
                            {fieldErrors[
                              `borrower_${borrower.id}_mailingStreet1`
                            ] && (
                              <div className="text-danger small mt-1">
                                {
                                  fieldErrors[
                                    `borrower_${borrower.id}_mailingStreet1`
                                  ]
                                }
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group mb-3">
                            <label className="form-label">{t("petitionTabContent.formFields.mailingCity")}</label>
                            <input
                              type="text"
                              className={`form-control ${
                                fieldErrors[
                                  `borrower_${borrower.id}_mailingCity`
                                ]
                                  ? "is-invalid"
                                  : ""
                              }`}
                              data-error-key={`borrower_${borrower.id}_mailingCity`}
                              value={borrower.mailingCity || ""}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                updateBorrower(
                                  borrower.id,
                                  "mailingCity",
                                  e.target.value
                                )
                              }
                            />
                            {fieldErrors[
                              `borrower_${borrower.id}_mailingCity`
                            ] && (
                              <div className="text-danger small mt-1">
                                {
                                  fieldErrors[
                                    `borrower_${borrower.id}_mailingCity`
                                  ]
                                }
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-2">
                          <div className="form-group mb-3">
                            <label className="form-label">{t("petitionTabContent.formFields.mailingState")}</label>
                            <input
                              type="text"
                              className={`form-control ${
                                fieldErrors[
                                  `borrower_${borrower.id}_mailingState`
                                ]
                                  ? "is-invalid"
                                  : ""
                              }`}
                              data-error-key={`borrower_${borrower.id}_mailingState`}
                              value={borrower.mailingState || ""}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                updateBorrower(
                                  borrower.id,
                                  "mailingState",
                                  e.target.value
                                )
                              }
                            />
                            {fieldErrors[
                              `borrower_${borrower.id}_mailingState`
                            ] && (
                              <div className="text-danger small mt-1">
                                {
                                  fieldErrors[
                                    `borrower_${borrower.id}_mailingState`
                                  ]
                                }
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group mb-3">
                            <label className="form-label">{t("petitionTabContent.formFields.mailingZip")}</label>
                            <input
                              type="text"
                              className={`form-control ${
                                fieldErrors[
                                  `borrower_${borrower.id}_mailingZip`
                                ]
                                  ? "is-invalid"
                                  : ""
                              }`}
                              data-error-key={`borrower_${borrower.id}_mailingZip`}
                              value={borrower.mailingZip || ""}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                updateBorrower(
                                  borrower.id,
                                  "mailingZip",
                                  e.target.value
                                )
                              }
                            />
                            {fieldErrors[
                              `borrower_${borrower.id}_mailingZip`
                            ] && (
                              <div className="text-danger small mt-1">
                                {
                                  fieldErrors[
                                    `borrower_${borrower.id}_mailingZip`
                                  ]
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isEditing && (
                    <button
                      type="button"
                      className="dashboard-btn-create"
                      onClick={addBorrower}
                    >
                      <i className="fas fa-plus me-1"></i>
                      {t("petitionTabContent.addBorrower")}
                    </button>
                  )}
                </>
              ) : (
                <p className="text-muted">No borrower information available</p>
              )}
            </div>
          </div>
  );
};

export default BorrowerDetails;
