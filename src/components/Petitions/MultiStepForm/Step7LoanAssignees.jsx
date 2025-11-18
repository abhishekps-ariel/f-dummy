import React from "react";
import CustomDropdown from "../../shared/CustomDropdown"; 

const Step7LoanAssignees = ({
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
   return (
          <div>
            <h2 className="theme-color font-med mb-1">7. Loan Assignees</h2>

            <p className="text-muted small mb-3">
              List any prior holders or assignees of the loan.
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
                    Assignee {index + 1}
                  </h5>

                  {formData.loanAssignees.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => removeLoanAssignee(index)}
                      title="Remove this assignee"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>

                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Assignee Name *</label>

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
                      placeholder="Enter assignee name"
                    />

                    {fieldErrors[`loanAssignees.${index}.assigneeName`] && (
                      <div className="text-danger small mt-1">
                        {fieldErrors[`loanAssignees.${index}.assigneeName`]}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Assignee Type *</label>

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
                      placeholder="Select Type"
                      disabled={commonDataLoading}
                      error={
                        !!fieldErrors[`loanAssignees.${index}.assigneeTypeId`]
                      }
                      options={[
                        { value: "", label: "Select Type" },
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
                        Loading assignee types...
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Assignee Role *</label>

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
                      placeholder="Select Role"
                      disabled={commonDataLoading}
                      error={
                        !!fieldErrors[`loanAssignees.${index}.assigneeRoleId`]
                      }
                      options={[
                        { value: "", label: "Select Role" },
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
                        Loading assignee roles...
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <label className="form-label">
                      Street Address Line 1 *
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
                        placeholder="Enter street address"
                        autoComplete="off"
                      />

                      {/* Loading indicator */}

                      {isLoadingLoanAssigneePredictions[index] && (
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

                      {showLoanAssigneePredictions[index] &&
                        loanAssigneePredictions[index] &&
                        loanAssigneePredictions[index].length > 0 && (
                          <div
                            className="position-absolute w-100 bg-white border rounded shadow-lg"
                            style={{ zIndex: 1000, top: "100%" }}
                          >
                            {loanAssigneePredictions[index].map(
                              (prediction, predIndex) => (
                                <div
                                  key={prediction.place_id}
                                  className="p-2 cursor-pointer hover-bg-light"
                                  style={{
                                    backgroundColor:
                                      selectedLoanAssigneePredictionIndex[
                                        index
                                      ] === predIndex
                                        ? "#f8f9fa"
                                        : "transparent",

                                    cursor: "pointer",
                                  }}
                                  onClick={() =>
                                    handleLoanAssigneePredictionClick(
                                      index,
                                      prediction
                                    )
                                  }
                                  onMouseEnter={() =>
                                    setSelectedLoanAssigneePredictionIndex(
                                      (prev) => ({
                                        ...prev,
                                        [index]: predIndex,
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

export default Step7LoanAssignees;
