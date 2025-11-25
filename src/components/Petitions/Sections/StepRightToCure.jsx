import React from "react";
import { useTranslation } from "react-i18next";
import CustomDropdown from "../../shared/CustomDropdown";

// Helper function to format currency with commas
const formatCurrencyDisplay = (value) => {
  if (!value && value !== 0) return "";
  const str = String(value);
  // Split by decimal point if it exists
  const parts = str.split(".");
  // Format the integer part with commas
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  // Join back with decimal if it exists
  return parts.length > 1 ? parts.join(".") : parts[0];
};

const StepRightToCure = ({
    SectionHeader,
  isEditing,
  formData,
  fieldErrors,
  setFormData,
  handleInputChange,
  handleNoticeAddressInput,
  isLoaded,
  noticePredictions,
  handleNoticeAddressSelect,
  addRightToCure,
  removeRightToCure,
  updateRightToCure,
}) => {
  const { t } = useTranslation();
  // Ensure rightToCures is an array
  const rightToCures = formData.rightToCures || [];
  
  // For backward compatibility, if rightToCures is empty but old single-object format exists
  const displayRightToCures = rightToCures.length > 0 ? rightToCures : 
    (formData.noticeSent !== undefined || formData.noticeDate) ? [{
      id: null,
      noticeSent: formData.noticeSent,
      noticeDate: formData.noticeDate || "",
      amountInDefault: formData.amountInDefault || 0,
      daysDelinquentAtNotice: formData.daysDelinquentAtNotice || 0,
      cureExpirationDate: formData.cureExpirationDate || "",
      noticeAddressStreet1: formData.noticeAddressStreet1 || "",
      noticeAddressCity: formData.noticeAddressCity || "",
      noticeAddressState: formData.noticeAddressState || "",
      noticeAddressZip: formData.noticeAddressZip || "",
      manualOverrideReason: formData.manualOverrideReason || "",
    }] : [];

  return (
    <>
      {/* Right-to-Cure Section */}
      <div className={`card mb-4 ${isEditing ? "editing" : ""}`}>
        <SectionHeader title={t("petitionTabContent.rightToCure")} />
        <div className="card-body">
          {displayRightToCures.length === 0 && !isEditing ? (
            <p className="text-muted">No right to cure information available</p>
          ) : (
            <>
              {displayRightToCures.map((rtc, index) => (
                <div key={index} className="right-to-cure-entry mb-4 p-3 border rounded">
                  {displayRightToCures.length > 1 && (
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0">Right to Cure Entry #{index + 1}</h6>
                      {isEditing && (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => removeRightToCure(index)}
                        >
                          <i className="fas fa-trash me-1"></i>Remove
                        </button>
                      )}
                    </div>
                  )}
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label className="form-label">Notice Sent *</label>
                        <CustomDropdown
                          name={`rightToCures.${index}.noticeSent`}
                          value={
                            rtc.noticeSent === null
                              ? ""
                              : rtc.noticeSent
                              ? "true"
                              : "false"
                          }
                          onChange={(e) => {
                            const value =
                              e.target.value === "true"
                                ? true
                                : e.target.value === "false"
                                ? false
                                : null;
                            updateRightToCure(index, "noticeSent", value);
                          }}
                          placeholder="Select..."
                          disabled={!isEditing}
                          error={!!(fieldErrors[`rightToCures.${index}.noticeSent`] || fieldErrors.noticeSent)}
                          options={[
                            { value: "", label: "Select..." },
                            { value: "true", label: "Yes" },
                            { value: "false", label: "No" },
                          ]}
                        />
                        {(fieldErrors[`rightToCures.${index}.noticeSent`] || fieldErrors.noticeSent) && (
                          <div className="text-danger small mt-1">
                            {fieldErrors[`rightToCures.${index}.noticeSent`] || fieldErrors.noticeSent}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* If Notice Sent === true */}
                    {rtc.noticeSent === true && (
                      <>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">Notice Date *</label>
                            <input
                              type="date"
                              name={`rightToCures.${index}.noticeDate`}
                              className={`form-control ${
                                fieldErrors[`rightToCures.${index}.noticeDate`] || fieldErrors.noticeDate ? "is-invalid" : ""
                              }`}
                              value={rtc.noticeDate || ""}
                              readOnly={!isEditing}
                              onChange={(e) => updateRightToCure(index, "noticeDate", e.target.value)}
                            />
                            {(fieldErrors[`rightToCures.${index}.noticeDate`] || fieldErrors.noticeDate) && (
                              <div className="text-danger small mt-1">
                                {fieldErrors[`rightToCures.${index}.noticeDate`] || fieldErrors.noticeDate}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">
                              Days Delinquent at Notice *
                            </label>
                            <input
                              type="number"
                              name={`rightToCures.${index}.daysDelinquentAtNotice`}
                              className={`form-control ${
                                fieldErrors[`rightToCures.${index}.daysDelinquentAtNotice`] || fieldErrors.daysDelinquentAtNotice
                                  ? "is-invalid"
                                  : ""
                              }`}
                              value={rtc.daysDelinquentAtNotice || ""}
                              readOnly={!isEditing}
                              onChange={(e) => updateRightToCure(index, "daysDelinquentAtNotice", e.target.value)}
                            />
                            {(fieldErrors[`rightToCures.${index}.daysDelinquentAtNotice`] || fieldErrors.daysDelinquentAtNotice) && (
                              <div className="text-danger small mt-1">
                                {fieldErrors[`rightToCures.${index}.daysDelinquentAtNotice`] || fieldErrors.daysDelinquentAtNotice}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">
                              Amount in Default ($) *
                            </label>
                            <input
                              type="text"
                              name={`rightToCures.${index}.amountInDefault`}
                              className={`form-control ${
                                fieldErrors[`rightToCures.${index}.amountInDefault`] || fieldErrors.amountInDefault ? "is-invalid" : ""
                              }`}
                              value={formatCurrencyDisplay(rtc.amountInDefault)}
                              readOnly={!isEditing}
                              onChange={(e) => {
                                const value = e.target.value.replace(/,/g, "");
                                updateRightToCure(index, "amountInDefault", value);
                              }}
                            />
                            {(fieldErrors[`rightToCures.${index}.amountInDefault`] || fieldErrors.amountInDefault) && (
                              <div className="text-danger small mt-1">
                                {fieldErrors[`rightToCures.${index}.amountInDefault`] || fieldErrors.amountInDefault}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">
                              Cure Expiration Date
                            </label>
                            <input
                              type="date"
                              name={`rightToCures.${index}.cureExpirationDate`}
                              className={`form-control ${
                                fieldErrors[`rightToCures.${index}.cureExpirationDate`] || fieldErrors.cureExpirationDate ? "is-invalid" : ""
                              }`}
                              value={rtc.cureExpirationDate || ""}
                              readOnly={!isEditing}
                              onChange={(e) => updateRightToCure(index, "cureExpirationDate", e.target.value)}
                            />
                            {(fieldErrors[`rightToCures.${index}.cureExpirationDate`] || fieldErrors.cureExpirationDate) && (
                              <div className="text-danger small mt-1">
                                {fieldErrors[`rightToCures.${index}.cureExpirationDate`] || fieldErrors.cureExpirationDate}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">
                              Notice Address Street
                            </label>
                            <input
                              type="text"
                              name={`rightToCures.${index}.noticeAddressStreet1`}
                              className="form-control"
                              value={rtc.noticeAddressStreet1 || ""}
                              readOnly={!isEditing}
                              autoComplete="off"
                              onChange={(e) => {
                                updateRightToCure(index, "noticeAddressStreet1", e.target.value);
                                if (isEditing && handleNoticeAddressInput) {
                                  handleNoticeAddressInput(e);
                                }
                              }}
                            />
                            {isEditing && isLoaded && noticePredictions && noticePredictions.length > 0 && (
                              <div className="list-group mt-1">
                                {noticePredictions.map((p) => (
                                  <button
                                    type="button"
                                    key={p.place_id}
                                    className="list-group-item list-group-item-action"
                                    onClick={() => {
                                      if (handleNoticeAddressSelect) {
                                        handleNoticeAddressSelect(p, index);
                                      }
                                    }}
                                  >
                                    {p.description}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">Notice Address City</label>
                            <input
                              type="text"
                              name={`rightToCures.${index}.noticeAddressCity`}
                              className="form-control"
                              value={rtc.noticeAddressCity || ""}
                              readOnly={!isEditing}
                              onChange={(e) => updateRightToCure(index, "noticeAddressCity", e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="form-group mb-3">
                            <label className="form-label">Notice Address State</label>
                            <input
                              type="text"
                              name={`rightToCures.${index}.noticeAddressState`}
                              className="form-control"
                              value={rtc.noticeAddressState || ""}
                              readOnly={!isEditing}
                              onChange={(e) => updateRightToCure(index, "noticeAddressState", e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="form-group mb-3">
                            <label className="form-label">Notice Address ZIP</label>
                            <input
                              type="text"
                              name={`rightToCures.${index}.noticeAddressZip`}
                              className="form-control"
                              value={rtc.noticeAddressZip || ""}
                              readOnly={!isEditing}
                              onChange={(e) => updateRightToCure(index, "noticeAddressZip", e.target.value)}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* If Notice Sent === false */}
                    {rtc.noticeSent === false && (
                      <div className="col-md-12">
                        <div className="form-group mb-3">
                          <label className="form-label">Acceleration Date</label>
                          <input
                            type="date"
                            name={`rightToCures.${index}.manualOverrideReason`}
                            className={`form-control ${
                              fieldErrors[`rightToCures.${index}.manualOverrideReason`] || fieldErrors.manualOverrideReason ? "is-invalid" : ""
                            }`}
                            value={rtc.manualOverrideReason || ""}
                            readOnly={!isEditing}
                            onChange={(e) => updateRightToCure(index, "manualOverrideReason", e.target.value)}
                          />
                          {(fieldErrors[`rightToCures.${index}.manualOverrideReason`] || fieldErrors.manualOverrideReason) && (
                            <div className="text-danger small mt-1">
                              {fieldErrors[`rightToCures.${index}.manualOverrideReason`] || fieldErrors.manualOverrideReason}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isEditing && (
                <div className="mt-3">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={addRightToCure}
                  >
                    <i className="fas fa-plus me-1"></i>Add Right to Cure
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default StepRightToCure;
