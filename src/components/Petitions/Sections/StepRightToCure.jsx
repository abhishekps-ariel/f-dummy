import React from "react";
import { useTranslation } from "react-i18next";
import CustomDropdown from "../../shared/CustomDropdown";
import { formatCurrencyDisplay } from "../../../utils/currencyUtils";

const StepRightToCure = ({
  SectionHeader,
  isEditing,
  formData,
  fieldErrors,
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
  const getDisplayRightToCures = () => {
    if (rightToCures.length > 0) return rightToCures;
    if (formData.noticeSent !== undefined || formData.noticeDate) {
      return [{
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
    }];
    }
    return [];
  };
  
  const displayRightToCures = getDisplayRightToCures();

  // Helper function to convert boolean/null to string value
  const getBooleanValue = (value) => {
    if (value === null) return "";
    if (value === true) return "true";
    return "false";
  };
  
  // Helper function to convert string value to boolean/null
  const parseBooleanValue = (stringValue) => {
    if (stringValue === "true") return true;
    if (stringValue === "false") return false;
    return null;
  };
  
  // Helper function to get display value for boolean fields
  const getBooleanDisplayValue = (value) => {
    if (value === true) return t("petitionTabContent.yes");
    if (value === false) return t("petitionTabContent.no");
    return "";
  };
  
  // Render notice details section (when noticeSent === true)
  const renderNoticeDetails = (rtc, index) => {
    if (rtc.noticeSent !== true) return null;
    
    return (
      <>
        <div className="col-md-6">
          <div className="form-group mb-3">
            <label className="form-label">{t("petitionTabContent.noticeDate")} *</label>
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
              {t("petitionTabContent.daysDelinquentAtNotice")} *
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
              {t("petitionTabContent.amountInDefault")} ($) *
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
                const value = e.target.value.replaceAll(",", "");
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
              {t("petitionTabContent.cureExpirationDate")}
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
          <div className="form-group mb-3 position-relative">
            <label className="form-label">
              {t("petitionTabContent.noticeAddressStreet")}
            </label>
            <input
              type="text"
              name={`rightToCures.${index}.noticeAddressStreet1`}
              className="form-control"
              value={rtc.noticeAddressStreet1 || ""}
              readOnly={!isEditing}
              autoComplete="off"
              onChange={(e) => {
                const value = e.target.value;
                updateRightToCure(index, "noticeAddressStreet1", value);
                if (isEditing && handleNoticeAddressInput) {
                  handleNoticeAddressInput(index, value);
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  if (handleNoticeAddressInput) {
                    handleNoticeAddressInput(index, "");
                  }
                }, 300);
              }}
              onFocus={() => {
                const currentValue = rtc.noticeAddressStreet1 || "";
                if (isEditing && handleNoticeAddressInput && currentValue) {
                  handleNoticeAddressInput(index, currentValue);
                }
              }}
            />
            {isEditing && isLoaded && noticePredictions?.[index]?.length > 0 && (
              <div
                className="address-suggestions-dropdown-tab"
                style={{
                  zIndex: 50,
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                {noticePredictions[index].map((prediction) => (
                  <button
                    key={prediction.place_id}
                    type="button"
                    className="address-suggestion-item-tab w-100 text-start"
                    onClick={() => {
                      if (handleNoticeAddressSelect) {
                        handleNoticeAddressSelect(prediction, index);
                      }
                    }}
                    style={{
                      border: "none",
                      background: "transparent",
                      fontFamily: "inherit",
                      fontSize: "inherit",
                      color: "inherit",
                    }}
                  >
                    <div className="fw-medium">
                      {prediction.description}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <div className="form-group mb-3">
            <label className="form-label">{t("petitionTabContent.formFields.noticeAddressCity")}</label>
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
            <label className="form-label">{t("petitionTabContent.formFields.noticeAddressState")}</label>
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
            <label className="form-label">{t("petitionTabContent.formFields.noticeAddressZip")}</label>
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
    );
  };
  
  // Render borrower response section
  const renderBorrowerResponse = (rtc, index) => {
    if (rtc.noticeSent !== true) return null;
    
    return (
      <>
        <div className="col-12">
          <div className="form-group mb-3">
            <label className="form-label">{t("petitionTabContent.borrowerRespondedWithin30Days")}? *</label>
            {(fieldErrors[`rightToCures.${index}.borrowerRespondedWithin30Days`] || fieldErrors.borrowerRespondedWithin30Days) && (
              <div className="text-danger small mt-1">
                {fieldErrors[`rightToCures.${index}.borrowerRespondedWithin30Days`] || fieldErrors.borrowerRespondedWithin30Days}
              </div>
            )}
            {isEditing ? (
              <CustomDropdown
                name={`rightToCures.${index}.borrowerRespondedWithin30Days`}
                value={getBooleanValue(rtc.borrowerRespondedWithin30Days)}
                onChange={(e) => {
                  const value = parseBooleanValue(e.target.value);
                  updateRightToCure(index, "borrowerRespondedWithin30Days", value);
                  if (value === false) {
                    updateRightToCure(index, "borrowerResponseDate", "");
                  }
                }}
                placeholder={t("petitionTabContent.select")}
                disabled={!isEditing}
                options={[
                  { value: "", label: t("petitionTabContent.select") },
                  { value: "true", label: t("petitionTabContent.yes") },
                  { value: "false", label: t("petitionTabContent.no") },
                ]}
              />
            ) : (
              <input
                type="text"
                className="form-control"
                value={getBooleanDisplayValue(rtc.borrowerRespondedWithin30Days)}
                readOnly
              />
            )}
          </div>
        </div>

        {rtc.borrowerRespondedWithin30Days === true && (
          <>
            <div className="col-md-6">
              <div className="form-group mb-3">
                <label className="form-label">{t("petitionTabContent.borrowerResponseDate")} *</label>
                <input
                  type="date"
                  className="form-control"
                  value={rtc.borrowerResponseDate || ""}
                  readOnly={!isEditing}
                  onChange={(e) =>
                    updateRightToCure(index, "borrowerResponseDate", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="col-12">
              <div className="form-group mb-3">
                <label className="form-label">{t("petitionTabContent.proceededWithRightToCure")} *</label>
                {(fieldErrors[`rightToCures.${index}.proceededWithRightToCure`] || fieldErrors.proceededWithRightToCure) && (
                  <div className="text-danger small mt-1">
                    {fieldErrors[`rightToCures.${index}.proceededWithRightToCure`] || fieldErrors.proceededWithRightToCure}
                  </div>
                )}
                {isEditing ? (
                  <CustomDropdown
                    name={`rightToCures.${index}.proceededWithRightToCure`}
                    value={getBooleanValue(rtc.proceededWithRightToCure)}
                    onChange={(e) => {
                      const value = parseBooleanValue(e.target.value);
                      updateRightToCure(index, "proceededWithRightToCure", value);
                    }}
                    placeholder={t("petitionTabContent.select")}
                    disabled={!isEditing}
                    options={[
                      { value: "", label: t("petitionTabContent.select") },
                      { value: "true", label: t("petitionTabContent.yes") },
                      { value: "false", label: t("petitionTabContent.no") },
                    ]}
                  />
                ) : (
                  <input
                    type="text"
                    className="form-control"
                    value={getBooleanDisplayValue(rtc.proceededWithRightToCure)}
                    readOnly
                  />
                )}
              </div>
            </div>
          </>
        )}
      </>
    );
  };
  
  return (
      <div className={`card mb-4 ${isEditing ? "editing" : ""}`}>
        {SectionHeader && <SectionHeader title={t("petitionTabContent.rightToCure")} />}
        <div className="card-body">
          {displayRightToCures.length === 0 && !isEditing ? (
            <p className="text-muted">No right to cure information available</p>
          ) : (
            <>
              {displayRightToCures.map((rtc, index) => (
                <div key={rtc.id || `rtc_${index}_${rtc.noticeDate || 'new'}`} className="right-to-cure-entry mb-4 p-3 border rounded">
                  {displayRightToCures.length > 1 && (
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0">{t("petitionTabContent.rightToCureEntry")} #{index + 1}</h6>
                      {isEditing && (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => removeRightToCure(index)}
                        >
                          <i className="fas fa-trash me-1"></i>{t("petitionTabContent.remove")}
                        </button>
                      )}
                    </div>
                  )}
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label className="form-label">{t("petitionTabContent.noticeSent")} *</label>
                        <CustomDropdown
                          name={`rightToCures.${index}.noticeSent`}
                          value={getBooleanValue(rtc.noticeSent)}
                          onChange={(e) => {
                            const value = parseBooleanValue(e.target.value);
                            updateRightToCure(index, "noticeSent", value);
                          }}
                          placeholder={t("petitionTabContent.select")}
                          disabled={!isEditing}
                          error={!!(fieldErrors[`rightToCures.${index}.noticeSent`] || fieldErrors.noticeSent)}
                          options={[
                            { value: "", label: t("petitionTabContent.select") },
                            { value: "true", label: t("petitionTabContent.yes") },
                            { value: "false", label: t("petitionTabContent.no") },
                          ]}
                        />
                        {(fieldErrors[`rightToCures.${index}.noticeSent`] || fieldErrors.noticeSent) && (
                          <div className="text-danger small mt-1">
                            {fieldErrors[`rightToCures.${index}.noticeSent`] || fieldErrors.noticeSent}
                          </div>
                        )}
                      </div>
                    </div>

                    {renderNoticeDetails(rtc, index)}

                    {/* If Notice Sent === false */}
                    {rtc.noticeSent === false && (
                      <div className="col-md-12">
                        <div className="form-group mb-3">
                          <label className="form-label">{t("petitionTabContent.accelerationDate")}</label>
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

                    {renderBorrowerResponse(rtc, index)}
                  </div>
                </div>
              ))}
              
              {isEditing && (
                <div className="mt-3">
                  <button
                    type="button"
                    className="dashboard-btn-create"
                    onClick={addRightToCure}
                  >
                    <i className="fas fa-plus me-1"></i>{t("petitionTabContent.addRightToCure")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
  );
};

export default StepRightToCure;
