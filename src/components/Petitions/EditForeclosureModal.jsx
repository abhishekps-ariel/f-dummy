import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import CustomDropdown from "../shared/CustomDropdown";
import { toast } from "react-toastify";

const EditForeclosureModal = ({
  isOpen,
  onClose,
  petition,
  formData,
  setFormData,
  getBuyerTypes,
  getForeclosureAlternativeOptions,
  findOptionByValue,
  onSave,
}) => {
  const { t } = useTranslation();
  const [foreclosureData, setForeclosureData] = useState({
    saleDate: formData?.foreclosureSale?.saleDate || "",
    soldToId: formData?.foreclosureSale?.soldToId || "",
    vestingEntityName: formData?.foreclosureSale?.vestingEntityName || "",
    reoEntityName: formData?.foreclosureSale?.reoEntityName || "",
    reoContactFirstName: formData?.foreclosureSale?.reoContactFirstName || "",
    reoContactLastName: formData?.foreclosureSale?.reoContactLastName || "",
    reoBusinessPhone: formData?.foreclosureSale?.reoBusinessPhone || "",
    reoEmergencyPhone: formData?.foreclosureSale?.reoEmergencyPhone || "",
    requestedAlternativeToForeclosure: formData?.foreclosureSale?.requestedAlternativeToForeclosure || false,
    foreclosureAlternativeOption: formData?.foreclosureSale?.foreclosureAlternativeOption || null,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && formData?.foreclosureSale) {
      setForeclosureData({
        saleDate: formData.foreclosureSale.saleDate || "",
        soldToId: formData.foreclosureSale.soldToId || "",
        vestingEntityName: formData.foreclosureSale.vestingEntityName || "",
        reoEntityName: formData.foreclosureSale.reoEntityName || "",
        reoContactFirstName: formData.foreclosureSale.reoContactFirstName || "",
        reoContactLastName: formData.foreclosureSale.reoContactLastName || "",
        reoBusinessPhone: formData.foreclosureSale.reoBusinessPhone || "",
        reoEmergencyPhone: formData.foreclosureSale.reoEmergencyPhone || "",
        requestedAlternativeToForeclosure: formData.foreclosureSale.requestedAlternativeToForeclosure || false,
        foreclosureAlternativeOption: formData.foreclosureSale.foreclosureAlternativeOption || null,
      });
      setFieldErrors({});
    }
  }, [isOpen, formData]);

  const buyerTypes = getBuyerTypes();
  const selectedBuyerType = foreclosureData.soldToId
    ? findOptionByValue(buyerTypes, foreclosureData.soldToId)
    : null;
  const isMortgageeInvestor = selectedBuyerType && (
    selectedBuyerType.name?.toLowerCase().includes("mortgagee") ||
    selectedBuyerType.name?.toLowerCase().includes("investor") ||
    selectedBuyerType.value?.toLowerCase().includes("mortgagee") ||
    selectedBuyerType.value?.toLowerCase().includes("investor")
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForeclosureData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleDropdownChange = (e) => {
    const { name, value } = e.target;
    setForeclosureData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const errors = {};
    if (!foreclosureData.saleDate?.trim()) {
      errors.saleDate = t("modals.editForeclosure.validation.saleDateRequired");
    }
    if (!foreclosureData.soldToId?.trim()) {
      errors.soldToId = t("modals.editForeclosure.validation.soldToRequired");
    }
    if (isMortgageeInvestor) {
      if (!foreclosureData.vestingEntityName?.trim()) {
        errors.vestingEntityName = t("modals.editForeclosure.validation.vestingEntityNameRequired");
      }
      if (!foreclosureData.reoContactFirstName?.trim()) {
        errors.reoContactFirstName = t("modals.editForeclosure.validation.reoContactFirstNameRequired");
      }
      if (!foreclosureData.reoContactLastName?.trim()) {
        errors.reoContactLastName = t("modals.editForeclosure.validation.reoContactLastNameRequired");
      }
      if (!foreclosureData.reoBusinessPhone?.trim()) {
        errors.reoBusinessPhone = t("modals.editForeclosure.validation.reoBusinessPhoneRequired");
      }
    }
    // Validate requested alternative to foreclosure (required)
    if (foreclosureData.requestedAlternativeToForeclosure === null || foreclosureData.requestedAlternativeToForeclosure === undefined) {
      errors.requestedAlternativeToForeclosure = t("modals.editForeclosure.validation.requestedAlternativeToForeclosureRequired");
    }
    // Validate foreclosure alternative option (required if alternative was requested)
    if (foreclosureData.requestedAlternativeToForeclosure === true) {
      if (!foreclosureData.foreclosureAlternativeOption || foreclosureData.foreclosureAlternativeOption === "") {
        errors.foreclosureAlternativeOption = t("modals.editForeclosure.validation.foreclosureAlternativeOptionRequired");
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setIsSaving(true);
    try {
      // Get foreclosure ID from petition details (null if new)
      const foreclosureId = petition?.details?.foreclosureSale?.id || null;
      
      // Update formData with foreclosure data
      const updatedFormData = {
        ...formData,
        foreclosureSale: {
          id: foreclosureId,
          ...foreclosureData,
        },
      };
      setFormData(updatedFormData);

      if (onSave) {
        await onSave(updatedFormData);
      }

      onClose();
    } catch (error) {
      console.error("Error saving foreclosure:", error);
      toast.error(t("modals.editForeclosure.failedSave"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original data
    if (formData?.foreclosureSale) {
      setForeclosureData({
        saleDate: formData.foreclosureSale.saleDate || "",
        soldToId: formData.foreclosureSale.soldToId || "",
        vestingEntityName: formData.foreclosureSale.vestingEntityName || "",
        reoEntityName: formData.foreclosureSale.reoEntityName || "",
        reoContactFirstName: formData.foreclosureSale.reoContactFirstName || "",
        reoContactLastName: formData.foreclosureSale.reoContactLastName || "",
        reoBusinessPhone: formData.foreclosureSale.reoBusinessPhone || "",
        reoEmergencyPhone: formData.foreclosureSale.reoEmergencyPhone || "",
      });
    }
    setFieldErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1100 }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{t("modals.editForeclosure.addTitle") || "Add Foreclosure"}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleCancel}
              aria-label={t("common.close")}
            ></button>
          </div>
          <div className="modal-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="saleDate" className="form-label">
                  {t("modals.editForeclosure.saleDate")} *
                </label>
                <input
                  type="date"
                  id="saleDate"
                  name="saleDate"
                  className={`form-control ${
                    fieldErrors.saleDate ? "is-invalid" : ""
                  }`}
                  value={foreclosureData.saleDate}
                  onChange={handleInputChange}
                />
                {fieldErrors.saleDate && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.saleDate}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="soldToId" className="form-label">
                  {t("modals.editForeclosure.soldTo")} *
                </label>
                <CustomDropdown
                  id="soldToId"
                  name="soldToId"
                  value={foreclosureData.soldToId}
                  onChange={handleDropdownChange}
                  placeholder={t("common.select")}
                  error={!!fieldErrors.soldToId}
                  options={[
                    { value: "", label: t("common.select") },
                    ...buyerTypes.map((buyerType) => ({
                      value: buyerType.id || buyerType.value,
                      label: buyerType.name || buyerType.value,
                    })),
                  ]}
                />
                {fieldErrors.soldToId && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.soldToId}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="vestingEntityName" className="form-label">
                  {t("modals.editForeclosure.vestingEntityName")} {isMortgageeInvestor ? "*" : ""}
                  {isMortgageeInvestor && (
                    <span className="text-muted small ms-1">({t("modals.editForeclosure.ifMortgageeInvestor")})</span>
                  )}
                </label>
                <input
                  type="text"
                  id="vestingEntityName"
                  name="vestingEntityName"
                  className={`form-control ${
                    fieldErrors.vestingEntityName ? "is-invalid" : ""
                  }`}
                  value={foreclosureData.vestingEntityName}
                  onChange={handleInputChange}
                  placeholder={t("modals.editForeclosure.placeholder.vestingEntityName")}
                />
                {fieldErrors.vestingEntityName && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.vestingEntityName}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="reoEntityName" className="form-label">
                  {t("modals.editForeclosure.reoEntityName")}
                </label>
                <input
                  type="text"
                  id="reoEntityName"
                  name="reoEntityName"
                  className="form-control"
                  value={foreclosureData.reoEntityName}
                  onChange={handleInputChange}
                  placeholder={t("modals.editForeclosure.placeholder.reoEntityName")}
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="reoContactFirstName" className="form-label">
                  {t("modals.editForeclosure.reoContactFirstName")} {isMortgageeInvestor ? "*" : ""}
                  {isMortgageeInvestor && (
                    <span className="text-muted small ms-1">({t("modals.editForeclosure.ifMortgageeInvestor")})</span>
                  )}
                </label>
                <input
                  type="text"
                  id="reoContactFirstName"
                  name="reoContactFirstName"
                  className={`form-control ${
                    fieldErrors.reoContactFirstName ? "is-invalid" : ""
                  }`}
                  value={foreclosureData.reoContactFirstName}
                  onChange={handleInputChange}
                  placeholder={t("modals.editForeclosure.placeholder.reoContactFirstName")}
                />
                {fieldErrors.reoContactFirstName && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.reoContactFirstName}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="reoContactLastName" className="form-label">
                  {t("modals.editForeclosure.reoContactLastName")} {isMortgageeInvestor ? "*" : ""}
                  {isMortgageeInvestor && (
                    <span className="text-muted small ms-1">({t("modals.editForeclosure.ifMortgageeInvestor")})</span>
                  )}
                </label>
                <input
                  type="text"
                  id="reoContactLastName"
                  name="reoContactLastName"
                  className={`form-control ${
                    fieldErrors.reoContactLastName ? "is-invalid" : ""
                  }`}
                  value={foreclosureData.reoContactLastName}
                  onChange={handleInputChange}
                  placeholder={t("modals.editForeclosure.placeholder.reoContactLastName")}
                />
                {fieldErrors.reoContactLastName && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.reoContactLastName}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="reoBusinessPhone" className="form-label">
                  {t("modals.editForeclosure.reoBusinessPhone")} {isMortgageeInvestor ? "*" : ""}
                  {isMortgageeInvestor && (
                    <span className="text-muted small ms-1">({t("modals.editForeclosure.ifMortgageeInvestor")})</span>
                  )}
                </label>
                <input
                  type="text"
                  id="reoBusinessPhone"
                  name="reoBusinessPhone"
                  className={`form-control ${
                    fieldErrors.reoBusinessPhone ? "is-invalid" : ""
                  }`}
                  value={foreclosureData.reoBusinessPhone}
                  onChange={handleInputChange}
                  placeholder={t("modals.editForeclosure.placeholder.reoBusinessPhone")}
                />
                {fieldErrors.reoBusinessPhone && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.reoBusinessPhone}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="reoEmergencyPhone" className="form-label">
                  {t("modals.editForeclosure.reoEmergencyPhone")}
                </label>
                <input
                  type="text"
                  id="reoEmergencyPhone"
                  name="reoEmergencyPhone"
                  className="form-control"
                  value={foreclosureData.reoEmergencyPhone}
                  onChange={handleInputChange}
                  placeholder={t("modals.editForeclosure.placeholder.reoEmergencyPhone")}
                />
              </div>

              {/* Foreclosure Alternative Fields - Moved to Bottom */}
              <div className="col-12">
                <label className="form-label">
                  {t("petitionTabContent.requestedAlternativeToForeclosure")}{"\u00A0"}
                  <span style={{ whiteSpace: 'nowrap' }}>*</span>
                </label>
                {fieldErrors.requestedAlternativeToForeclosure && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.requestedAlternativeToForeclosure}
                  </div>
                )}
                <div className="d-flex gap-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="requestedAlternativeToForeclosure"
                      id="requestedAlternativeToForeclosureYes"
                      value="yes"
                      checked={foreclosureData.requestedAlternativeToForeclosure === true}
                      onChange={(e) =>
                        setForeclosureData((prev) => ({ ...prev, requestedAlternativeToForeclosure: true }))
                      }
                    />
                    <label className="form-check-label" htmlFor="requestedAlternativeToForeclosureYes">
                      {t("petitionTabContent.yes")}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="requestedAlternativeToForeclosure"
                      id="requestedAlternativeToForeclosureNo"
                      value="no"
                      checked={foreclosureData.requestedAlternativeToForeclosure === false}
                      onChange={(e) =>
                        setForeclosureData((prev) => ({ ...prev, requestedAlternativeToForeclosure: false, foreclosureAlternativeOption: null }))
                      }
                    />
                    <label className="form-check-label" htmlFor="requestedAlternativeToForeclosureNo">
                      {t("petitionTabContent.no")}
                    </label>
                  </div>
                </div>
              </div>

              {foreclosureData.requestedAlternativeToForeclosure === true && (
                <div className="col-12">
                  <label htmlFor="foreclosureAlternativeOption" className="form-label">
                    {t("petitionTabContent.foreclosureAlternativeOption")} *
                  </label>
                  <CustomDropdown
                    id="foreclosureAlternativeOption"
                    name="foreclosureAlternativeOption"
                    value={foreclosureData.foreclosureAlternativeOption || ""}
                    onChange={handleDropdownChange}
                    placeholder={t("petitionTabContent.selectAlternativeOption")}
                    error={!!fieldErrors.foreclosureAlternativeOption}
                    options={[
                      { value: "", label: t("petitionTabContent.selectAlternativeOption") },
                      ...(getForeclosureAlternativeOptions ? getForeclosureAlternativeOptions().map((option) => ({
                        value: option.value || option.id,
                        label: option.description || option.name,
                      })) : []),
                    ]}
                  />
                  {fieldErrors.foreclosureAlternativeOption && (
                    <div className="text-danger small mt-1">
                      {fieldErrors.foreclosureAlternativeOption}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="dashboard-btn-refresh"
              onClick={handleCancel}
              disabled={isSaving}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="dashboard-btn-create"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-1"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  {t("common.saving")}
                </>
              ) : (
                <>
                  <i className="fas fa-save me-1"></i>
                  {t("modals.editForeclosure.saveButton")}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditForeclosureModal;

