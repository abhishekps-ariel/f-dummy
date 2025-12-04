import React from "react";
import { useTranslation } from "react-i18next";
import CustomDropdown from "../../shared/CustomDropdown";

const StepLoanAssignees = ({
    SectionHeader,
  isEditing,
  formData,
  fieldErrors,
  removeLoanAssignee,
  updateLoanAssignee,
  addLoanAssignee,
  getAssigneeTypes,
  getAssigneeRoles,
  commonDataLoading,
  isLoaded,
  assigneePredictions,
  handleAssigneeAddressInput,
  handleAssigneeAddressSelect,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <div className={`card mb-4 ${isEditing ? "editing" : ""}`}>
            <SectionHeader title={t("petitionTabContent.loanAssignees")} />
            <div className="card-body">
              {formData.loanAssignees && formData.loanAssignees.length > 0 ? (
                <>
                  {formData.loanAssignees.map((assignee, index) => (
                    <div key={index} className="border rounded p-3 mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0 fw-semibold">
                          {t("petitionTabContent.assignee")} {index + 1}
                        </h6>
                        {isEditing && formData.loanAssignees.length > 1 && (
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
                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">
                              {t("petitionTabContent.assigneeName")} *
                            </label>
                            <input
                              type="text"
                              className={`form-control ${
                                fieldErrors[
                                  `loanAssignees.${index}.assigneeName`
                                ]
                                  ? "is-invalid"
                                  : ""
                              }`}
                              data-error-key={`loanAssignees.${index}.assigneeName`}
                              value={assignee.assigneeName || ""}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                updateLoanAssignee(
                                  index,
                                  "assigneeName",
                                  e.target.value
                                )
                              }
                            />
                            {fieldErrors[
                              `loanAssignees.${index}.assigneeName`
                            ] && (
                              <div className="text-danger small mt-1">
                                {
                                  fieldErrors[
                                    `loanAssignees.${index}.assigneeName`
                                  ]
                                }
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">
                              {t("petitionTabContent.assigneeType")} *
                            </label>
                            <CustomDropdown
                              name={`loanAssignees.${index}.assigneeTypeId`}
                              value={assignee.assigneeTypeId || ""}
                              onChange={(e) =>
                                updateLoanAssignee(
                                  index,
                                  "assigneeTypeId",
                                  e.target.value
                                )
                              }
                              placeholder={t("petitionTabContent.selectType")}
                              disabled={!isEditing || commonDataLoading}
                              error={
                                !!fieldErrors[
                                  `loanAssignees.${index}.assigneeTypeId`
                                ]
                              }
                              options={[
                                { value: "", label: t("petitionTabContent.selectType") },
                                ...getAssigneeTypes().map((type) => ({
                                  value: type.id,
                                  label: type.name,
                                })),
                              ]}
                            />
                            {fieldErrors[
                              `loanAssignees.${index}.assigneeTypeId`
                            ] && (
                              <div className="text-danger small mt-1">
                                {
                                  fieldErrors[
                                    `loanAssignees.${index}.assigneeTypeId`
                                  ]
                                }
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">
                              {t("petitionTabContent.assigneeRole")} *
                            </label>
                            <CustomDropdown
                              name={`loanAssignees.${index}.assigneeRoleId`}
                              value={assignee.assigneeRoleId || ""}
                              onChange={(e) =>
                                updateLoanAssignee(
                                  index,
                                  "assigneeRoleId",
                                  e.target.value
                                )
                              }
                              placeholder={t("petitionTabContent.selectRole")}
                              disabled={!isEditing || commonDataLoading}
                              error={
                                !!fieldErrors[
                                  `loanAssignees.${index}.assigneeRoleId`
                                ]
                              }
                              options={[
                                { value: "", label: t("petitionTabContent.selectRole") },
                                ...getAssigneeRoles().map((role) => ({
                                  value: role.id,
                                  label: role.name,
                                })),
                              ]}
                            />
                            {fieldErrors[
                              `loanAssignees.${index}.assigneeRoleId`
                            ] && (
                              <div className="text-danger small mt-1">
                                {
                                  fieldErrors[
                                    `loanAssignees.${index}.assigneeRoleId`
                                  ]
                                }
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">
                              {t("petitionTabContent.formFields.streetAddress")} *
                            </label>
                            <input
                              type="text"
                              className={`form-control ${
                                fieldErrors[`loanAssignees.${index}.street1`]
                                  ? "is-invalid"
                                  : ""
                              }`}
                              data-error-key={`loanAssignees.${index}.street1`}
                              value={assignee.street1 || ""}
                              readOnly={!isEditing}
                              autoComplete="off"
                              onChange={(e) => {
                                updateLoanAssignee(
                                  index,
                                  "street1",
                                  e.target.value
                                );
                                handleAssigneeAddressInput(
                                  index,
                                  e.target.value
                                );
                              }}
                            />
                            {isEditing &&
                              isLoaded &&
                              (assigneePredictions[index] || []).length > 0 && (
                                <div className="list-group mt-1">
                                  {(assigneePredictions[index] || []).map(
                                    (p) => (
                                      <button
                                        type="button"
                                        key={p.place_id}
                                        className="list-group-item list-group-item-action"
                                        onClick={() =>
                                          handleAssigneeAddressSelect(index, p)
                                        }
                                      >
                                        {p.description}
                                      </button>
                                    )
                                  )}
                                </div>
                              )}
                            {fieldErrors[`loanAssignees.${index}.street1`] && (
                              <div className="text-danger small mt-1">
                                {fieldErrors[`loanAssignees.${index}.street1`]}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">
                              {t("petitionTabContent.formFields.streetAddress2")}
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={assignee.street2 || ""}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                updateLoanAssignee(
                                  index,
                                  "street2",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group mb-3">
                            <label className="form-label">{t("petitionTabContent.formFields.city")} *</label>
                            <input
                              type="text"
                              className={`form-control ${
                                fieldErrors[`loanAssignees.${index}.city`]
                                  ? "is-invalid"
                                  : ""
                              }`}
                              data-error-key={`loanAssignees.${index}.city`}
                              value={assignee.city || ""}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                updateLoanAssignee(
                                  index,
                                  "city",
                                  e.target.value
                                )
                              }
                            />
                            {fieldErrors[`loanAssignees.${index}.city`] && (
                              <div className="text-danger small mt-1">
                                {fieldErrors[`loanAssignees.${index}.city`]}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group mb-3">
                            <label className="form-label">{t("petitionTabContent.formFields.state")} *</label>
                            <input
                              type="text"
                              className={`form-control ${
                                fieldErrors[
                                  `loanAssignees.${index}.addressState`
                                ]
                                  ? "is-invalid"
                                  : ""
                              }`}
                              data-error-key={`loanAssignees.${index}.addressState`}
                              value={assignee.addressState || ""}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                updateLoanAssignee(
                                  index,
                                  "addressState",
                                  e.target.value
                                )
                              }
                            />
                            {fieldErrors[
                              `loanAssignees.${index}.addressState`
                            ] && (
                              <div className="text-danger small mt-1">
                                {
                                  fieldErrors[
                                    `loanAssignees.${index}.addressState`
                                  ]
                                }
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group mb-3">
                            <label className="form-label">{t("petitionTabContent.formFields.zipCode")} *</label>
                            <input
                              type="text"
                              className={`form-control ${
                                fieldErrors[`loanAssignees.${index}.zip`]
                                  ? "is-invalid"
                                  : ""
                              }`}
                              data-error-key={`loanAssignees.${index}.zip`}
                              value={assignee.zip || ""}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                updateLoanAssignee(index, "zip", e.target.value)
                              }
                            />
                            {fieldErrors[`loanAssignees.${index}.zip`] && (
                              <div className="text-danger small mt-1">
                                {fieldErrors[`loanAssignees.${index}.zip`]}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">{t("petitionTabContent.licenseNumber")}</label>
                            <input
                              type="text"
                              className="form-control"
                              value={assignee.licenseNumber || ""}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                updateLoanAssignee(
                                  index,
                                  "licenseNumber",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">{t("petitionTabContent.licenseState")}</label>
                            <input
                              type="text"
                              className="form-control"
                              value={assignee.licenseState || ""}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                updateLoanAssignee(
                                  index,
                                  "licenseState",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isEditing && (
                    <button
                      type="button"
                      className="dashboard-btn-create"
                      onClick={addLoanAssignee}
                      title={t("petitionTabContent.addLoanAssignee")}
                    >
                      <i className="fas fa-plus me-1"></i>
                      {t("petitionTabContent.addLoanAssignee")}
                    </button>
                  )}
                </>
              ) : (
                <p className="text-muted">No assignee information available</p>
              )}
            </div>
          </div>
    </>
  );
};

export default StepLoanAssignees;
