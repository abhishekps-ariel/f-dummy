import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import CustomDropdown from "../shared/CustomDropdown";
import { toast } from "react-toastify";

const EditJudgementModal = ({ isOpen, onClose, petition, onSave, formData, setFormData, getJudgmentTypes, findOptionByValue }) => {
  const { t } = useTranslation();
  const [judgmentData, setJudgmentData] = useState({
    judgmentDate: formData?.judgment?.judgmentDate || "",
    judgmentType: formData?.judgment?.judgmentType || "",
    courtInformation: formData?.judgment?.courtInformation || "",
    docketNumbers: formData?.judgment?.docketNumbers || "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (formData?.judgment) {
        // Convert judgmentType number to string for dropdown
        const judgmentTypeValue = formData.judgment.judgmentType !== null && formData.judgment.judgmentType !== undefined
          ? String(formData.judgment.judgmentType)
          : "";
        
        setJudgmentData({
          judgmentDate: formData.judgment.judgmentDate 
            ? (formData.judgment.judgmentDate.includes("T") 
                ? formData.judgment.judgmentDate.split("T")[0] 
                : formData.judgment.judgmentDate)
            : "",
          judgmentType: judgmentTypeValue,
          courtInformation: formData.judgment.courtInformation || "",
          docketNumbers: formData.judgment.docketNumbers || "",
        });
      } else {
        // Reset if no judgment data
        setJudgmentData({
          judgmentDate: "",
          judgmentType: "",
          courtInformation: "",
          docketNumbers: "",
        });
      }
      setFieldErrors({});
    }
  }, [isOpen, formData]);

  // Get judgment types from API - remove placeholder option
  const judgmentTypesFromApi = getJudgmentTypes ? getJudgmentTypes() : [];
  const judgmentTypes = judgmentTypesFromApi
    .filter((jt) => (jt.value !== null && jt.value !== undefined) || (jt.id !== null && jt.id !== undefined))
    .map((jt) => ({
      value: String(jt.value ?? jt.id ?? ''), // Convert to string to match judgmentTypeValue format
      label: jt.description || jt.name || '',
    }));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setJudgmentData((prev) => ({
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
    setJudgmentData((prev) => ({
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
    if (!judgmentData.judgmentDate || (typeof judgmentData.judgmentDate === 'string' && !judgmentData.judgmentDate.trim())) {
      errors.judgmentDate = t("modals.editJudgment.validation.judgmentDateRequired");
    }
    // Judgment amount validation removed - field is hidden from UI
    // judgmentType can be a number (0 is valid) or string, so check for empty string or null/undefined
    if (judgmentData.judgmentType === "" || judgmentData.judgmentType === null || judgmentData.judgmentType === undefined) {
      errors.judgmentType = t("modals.editJudgment.validation.judgmentTypeRequired");
    }
    if (!judgmentData.courtInformation || (typeof judgmentData.courtInformation === 'string' && !judgmentData.courtInformation.trim())) {
      errors.courtInformation = t("modals.editJudgment.validation.courtInformationRequired");
    }
    if (!judgmentData.docketNumbers || (typeof judgmentData.docketNumbers === 'string' && !judgmentData.docketNumbers.trim())) {
      errors.docketNumbers = t("modals.editJudgment.validation.docketNumbersRequired");
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error(t("modals.editJudgment.validation.fillAllRequired"));
      return;
    }

    setIsSaving(true);
    try {
      // Convert judgmentType string to number for API
      // Note: judgmentType can be 0, so we need to check for empty string, not falsy
      const judgmentTypeNumber = judgmentData.judgmentType !== "" && judgmentData.judgmentType !== null && judgmentData.judgmentType !== undefined
        ? parseInt(judgmentData.judgmentType, 10) 
        : null;
      
      if (judgmentTypeNumber === null || isNaN(judgmentTypeNumber)) {
        toast.error(t("modals.editJudgment.validation.selectJudgmentType"));
        setIsSaving(false);
        return;
      }
      
      // Get judgment ID from petition details (null if new)
      const judgmentId = petition?.details?.judgment?.id || null;
      
      // Update formData with judgment data
      const updatedFormData = {
        ...formData,
        judgment: {
          id: judgmentId,
          petitionId: petition?.id || null,
          judgmentDate: judgmentData.judgmentDate,
          judgmentType: judgmentTypeNumber,
          courtInformation: judgmentData.courtInformation,
          docketNumbers: judgmentData.docketNumbers,
        },
      };
      
      // Update local state first
      setFormData(updatedFormData);

      // Then save to backend
      if (onSave) {
        await onSave(updatedFormData);
      } else {
        toast.error(t("modals.editJudgment.saveFunctionNotAvailable"));
        setIsSaving(false);
        return;
      }

      // Close modal after successful save
      onClose();
    } catch (err) {
      toast.error(err?.message || t("modals.editJudgment.failedSave"));
      // Don't close the modal if there's an error
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original data
    if (formData?.judgment) {
      // Convert judgmentType number to string for dropdown
      const judgmentTypeValue = formData.judgment.judgmentType !== null && formData.judgment.judgmentType !== undefined
        ? String(formData.judgment.judgmentType)
        : "";
      
      setJudgmentData({
        judgmentDate: formData.judgment.judgmentDate 
          ? (formData.judgment.judgmentDate.includes("T") 
              ? formData.judgment.judgmentDate.split("T")[0] 
              : formData.judgment.judgmentDate)
          : "",
        judgmentType: judgmentTypeValue,
        courtInformation: formData.judgment.courtInformation || "",
        docketNumbers: formData.judgment.docketNumbers || "",
      });
    } else {
      // Reset to empty if no judgment data
      setJudgmentData({
        judgmentDate: "",
        judgmentType: "",
        courtInformation: "",
        docketNumbers: "",
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
            <h5 className="modal-title">{t("modals.editJudgment.addTitle") || "Add Judgment"}</h5>
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
                <label htmlFor="judgmentDate" className="form-label">
                  {t("modals.editJudgment.judgmentDate")} *
                </label>
                <input
                  type="date"
                  id="judgmentDate"
                  name="judgmentDate"
                  className={`form-control ${
                    fieldErrors.judgmentDate ? "is-invalid" : ""
                  }`}
                  value={judgmentData.judgmentDate}
                  onChange={handleInputChange}
                />
                {fieldErrors.judgmentDate && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.judgmentDate}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="judgmentType" className="form-label">
                  {t("modals.editJudgment.judgmentType")} *
                </label>
                <CustomDropdown
                  id="judgmentType"
                  name="judgmentType"
                  value={judgmentData.judgmentType}
                  onChange={handleDropdownChange}
                  placeholder={t("modals.editJudgment.placeholder.judgmentType")}
                  error={!!fieldErrors.judgmentType}
                  options={judgmentTypes}
                  maxMenuHeight={180}
                />
                {fieldErrors.judgmentType && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.judgmentType}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="docketNumbers" className="form-label">
                  {t("modals.editJudgment.docketNumber")} *
                </label>
                <input
                  type="text"
                  id="docketNumbers"
                  name="docketNumbers"
                  className={`form-control ${
                    fieldErrors.docketNumbers ? "is-invalid" : ""
                  }`}
                  value={judgmentData.docketNumbers}
                  onChange={handleInputChange}
                  placeholder={t("modals.editJudgment.placeholder.docketNumber")}
                />
                {fieldErrors.docketNumbers && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.docketNumbers}
                  </div>
                )}
              </div>

              <div className="col-12">
                <label htmlFor="courtInformation" className="form-label">
                  {t("modals.editJudgment.courtInformation")} *
                </label>
                <textarea
                  id="courtInformation"
                  name="courtInformation"
                  className={`form-control ${
                    fieldErrors.courtInformation ? "is-invalid" : ""
                  }`}
                  value={judgmentData.courtInformation}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder={t("modals.editJudgment.placeholder.courtInformation")}
                />
                {fieldErrors.courtInformation && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.courtInformation}
                  </div>
                )}
              </div>
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
                  {t("modals.editJudgment.saveButton")}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditJudgementModal;

