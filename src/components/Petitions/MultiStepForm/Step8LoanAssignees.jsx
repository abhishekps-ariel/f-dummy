import React from "react";
import { useTranslation } from "react-i18next";
import CustomDropdown from "../../shared/CustomDropdown"; 

const Step8LoanAssignees = ({
  commonDataError,
  commonDataLoading,
  formData,
  fieldErrors,
  updateLoanAssignee,
  removeLoanAssignee,
  addLoanAssignee,
  getAssigneeTypes,
  getAssigneeRoles,
  handleLoanAssigneeAddressInput,
  handleLoanAssigneePredictionClick,
  isLoadingLoanAssigneePredictions,
  showLoanAssigneePredictions,
  loanAssigneePredictions,
  setShowLoanAssigneePredictions,
  selectedLoanAssigneePredictionIndex,
  setSelectedLoanAssigneePredictionIndex,
  loanAssigneeAddressValidationErrors,
}) => {
  const { t } = useTranslation();
   return (
          <div>
            <h2 className="theme-color font-med mb-1">{t("petitionSteps.step8.title")}</h2>

            <p className="text-muted small mb-3">
              {t("petitionSteps.step8.description")}
            </p>

            {commonDataError && (
              <div className="alert alert-warning" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>

                {commonDataError}
              </div>
            )}

            {formData.loanAssignees.map((assignee, index) => (
              <div key={index} className="p-3 border rounded bg-light mb-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-semibold text-dark mb-0">
                    {t("petitionSteps.step8.assignee")} {index + 1}
                  </h5>

                  {formData.loanAssignees.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => removeLoanAssignee(index)}
                      title={t("petitionSteps.step8.removeAssignee")}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>

                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">{t("petitionSteps.step8.assigneeName")} *</label>

                    <input
                      type="text"
                      className={`form-control ${
                        fieldErrors[`loanAssignees.${index}.assigneeName`]
                          ? "is-invalid"
                          : ""
                      }`}
                      value={assignee.assigneeName}
                      onChange={(e) =>
                        updateLoanAssignee(
                          index,
                          "assigneeName",
                          e.target.value
                        )
                      }
                      placeholder={t("petitionSteps.step8.placeholderAssigneeName")}
                    />

                    {fieldErrors[`loanAssignees.${index}.assigneeName`] && (
                      <div className="text-danger small mt-1">
                        {fieldErrors[`loanAssignees.${index}.assigneeName`]}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">{t("petitionSteps.step8.assigneeType")} *</label>

                    <CustomDropdown
                      name={`loanAssignees.${index}.assigneeTypeId`}
                      value={assignee.assigneeTypeId}
                      onChange={(e) =>
                        updateLoanAssignee(
                          index,
                          "assigneeTypeId",
                          e.target.value
                        )
                      }
                      placeholder={t("petitionSteps.step8.selectType")}
                      disabled={commonDataLoading}
                      error={
                        !!fieldErrors[`loanAssignees.${index}.assigneeTypeId`]
                      }
                      options={[
                        { value: "", label: t("petitionSteps.step8.selectType") },
                        ...getAssigneeTypes().map((type) => ({
                          value: type.id,
                          label: type.name,
                        })),
                      ]}
                    />

                    {fieldErrors[`loanAssignees.${index}.assigneeTypeId`] && (
                      <div className="text-danger small mt-1">
                        {fieldErrors[`loanAssignees.${index}.assigneeTypeId`]}
                      </div>
                    )}

                    {commonDataLoading && (
                      <div className="form-text">
                        <i className="fas fa-spinner fa-spin me-1"></i>
                        {t("petitionSteps.step8.loadingAssigneeTypes")}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">{t("petitionSteps.step8.assigneeRole")} *</label>

                    <CustomDropdown
                      name={`loanAssignees.${index}.assigneeRoleId`}
                      value={assignee.assigneeRoleId}
                      onChange={(e) =>
                        updateLoanAssignee(
                          index,
                          "assigneeRoleId",
                          e.target.value
                        )
                      }
                      placeholder={t("petitionSteps.step8.selectRole")}
                      disabled={commonDataLoading}
                      error={
                        !!fieldErrors[`loanAssignees.${index}.assigneeRoleId`]
                      }
                      options={[
                        { value: "", label: t("petitionSteps.step8.selectRole") },
                        ...getAssigneeRoles().map((role) => ({
                          value: role.id,
                          label: role.name,
                        })),
                      ]}
                    />

                    {fieldErrors[`loanAssignees.${index}.assigneeRoleId`] && (
                      <div className="text-danger small mt-1">
                        {fieldErrors[`loanAssignees.${index}.assigneeRoleId`]}
                      </div>
                    )}

                    {commonDataLoading && (
                      <div className="form-text">
                        <i className="fas fa-spinner fa-spin me-1"></i>
                        {t("petitionSteps.step8.loadingAssigneeRoles")}
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <label className="form-label">
                      {t("petitionSteps.step8.streetAddressLine1")} *
                    </label>

                    <div className="position-relative">
                      <input
                        type="text"
                        className={`form-control ${
                          fieldErrors[`loanAssignees.${index}.street1`] ||
                          loanAssigneeAddressValidationErrors[
                            `assignee_${index}_address`
                          ]
                            ? "is-invalid"
                            : ""
                        }`}
                        value={assignee.street1}
                        onChange={(e) => {
                          updateLoanAssignee(index, "street1", e.target.value);

                          handleLoanAssigneeAddressInput(index, e.target.value);
                        }}
                        onBlur={() => {
                          setTimeout(
                            () =>
                              setShowLoanAssigneePredictions((prev) => ({
                                ...prev,
                                [index]: false,
                              })),
                            300
                          );
                        }}
                        onFocus={() => {
                          if (
                            loanAssigneePredictions[index] &&
                            loanAssigneePredictions[index].length > 0
                          ) {
                            setShowLoanAssigneePredictions((prev) => ({
                              ...prev,
                              [index]: true,
                            }));
                          }
                        }}
                        placeholder={t("petitionSteps.step8.placeholderStreetAddress")}
                        autoComplete="off"
                      />

                      {/* Loading indicator */}
                      {isLoadingLoanAssigneePredictions[index] && (
                        <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                          <div
                            className="spinner-border spinner-border-sm text-muted"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      )}

                      {/* Address suggestions dropdown */}
                      {showLoanAssigneePredictions[index] &&
                        loanAssigneePredictions[index] &&
                        loanAssigneePredictions[index].length > 0 && (
                          <div
                            className="position-absolute w-100 bg-white border border-top-0 rounded-bottom shadow-sm"
                            style={{
                              zIndex: 1050,
                              maxHeight: "200px",
                              overflowY: "auto",
                            }}
                          >
                            {loanAssigneePredictions[index].map(
                              (prediction, predIndex) => (
                                <div
                                  key={prediction.place_id}
                                  className={`px-3 py-2 cursor-pointer border-bottom ${
                                    selectedLoanAssigneePredictionIndex[
                                      index
                                    ] === predIndex
                                      ? "bg-primary text-white"
                                      : "hover-bg-light"
                                  }`}
                                  onMouseDown={() =>
                                    handleLoanAssigneePredictionClick(
                                      index,
                                      prediction
                                    )
                                  }
                                  style={{ cursor: "pointer" }}
                                >
                                  <div className="fw-medium">
                                    {prediction.description}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}
                    </div>

                    {fieldErrors[`loanAssignees.${index}.street1`] && (
                      <div className="text-danger small mt-1">
                        {fieldErrors[`loanAssignees.${index}.street1`]}
                      </div>
                    )}

                    {loanAssigneeAddressValidationErrors[
                      `assignee_${index}_address`
                    ] && (
                      <div className="text-danger small mt-1">
                        {
                          loanAssigneeAddressValidationErrors[
                            `assignee_${index}_address`
                          ]
                        }
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <label className="form-label">
                      Street Address Line 2 (Optional)
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      value={assignee.street2}
                      onChange={(e) =>
                        updateLoanAssignee(index, "street2", e.target.value)
                      }
                      placeholder="Apartment, suite, unit, building, floor, etc."
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">City *</label>

                    <input
                      type="text"
                      className={`form-control ${
                        fieldErrors[`loanAssignees.${index}.city`]
                          ? "is-invalid"
                          : ""
                      }`}
                      value={assignee.city}
                      onChange={(e) =>
                        updateLoanAssignee(index, "city", e.target.value)
                      }
                      placeholder="Enter city"
                    />

                    {fieldErrors[`loanAssignees.${index}.city`] && (
                      <div className="text-danger small mt-1">
                        {fieldErrors[`loanAssignees.${index}.city`]}
                      </div>
                    )}
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">State *</label>

                    <input
                      type="text"
                      className={`form-control ${
                        fieldErrors[`loanAssignees.${index}.addressState`]
                          ? "is-invalid"
                          : ""
                      }`}
                      value={assignee.addressState}
                      onChange={(e) =>
                        updateLoanAssignee(
                          index,
                          "addressState",
                          e.target.value
                        )
                      }
                      placeholder="Enter state"
                    />

                    {fieldErrors[`loanAssignees.${index}.addressState`] && (
                      <div className="text-danger small mt-1">
                        {fieldErrors[`loanAssignees.${index}.addressState`]}
                      </div>
                    )}
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">ZIP Code *</label>

                    <input
                      type="text"
                      className={`form-control ${
                        fieldErrors[`loanAssignees.${index}.zip`]
                          ? "is-invalid"
                          : ""
                      }`}
                      value={assignee.zip}
                      onChange={(e) =>
                        updateLoanAssignee(index, "zip", e.target.value)
                      }
                      placeholder="Enter ZIP code"
                    />

                    {fieldErrors[`loanAssignees.${index}.zip`] && (
                      <div className="text-danger small mt-1">
                        {fieldErrors[`loanAssignees.${index}.zip`]}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      License Number (Optional)
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      value={assignee.licenseNumber}
                      onChange={(e) =>
                        updateLoanAssignee(
                          index,
                          "licenseNumber",
                          e.target.value
                        )
                      }
                      placeholder="Enter license number"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      License State (Optional)
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      value={assignee.licenseState}
                      onChange={(e) =>
                        updateLoanAssignee(
                          index,
                          "licenseState",
                          e.target.value
                        )
                      }
                      placeholder="Enter license state"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="text-center">
              <button
                type="button"
                className="dashboard-btn-create"
                onClick={addLoanAssignee}
              >
                <i className="fas fa-plus me-2"></i>
                Add Another Assignee
              </button>
            </div>
          </div>
        );
};

export default Step8LoanAssignees;
