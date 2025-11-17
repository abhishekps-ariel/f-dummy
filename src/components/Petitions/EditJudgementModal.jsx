import React, { useState, useEffect } from "react";
import CustomDropdown from "../shared/CustomDropdown";
import { toast } from "react-toastify";

const EditJudgementModal = ({ isOpen, onClose, petition, onSave, formData, setFormData }) => {
  const [judgmentData, setJudgmentData] = useState({
    judgmentDate: formData?.judgment?.judgmentDate || "",
    judgmentAmount: formData?.judgment?.judgmentAmount || "",
    judgmentType: formData?.judgment?.judgmentType || "",
    courtInformation: formData?.judgment?.courtInformation || "",
    docketNumbers: formData?.judgment?.docketNumbers || "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && formData?.judgment) {
      setJudgmentData({
        judgmentDate: formData.judgment.judgmentDate || "",
        judgmentAmount: formData.judgment.judgmentAmount || "",
        judgmentType: formData.judgment.judgmentType || "",
        courtInformation: formData.judgment.courtInformation || "",
        docketNumbers: formData.judgment.docketNumbers || "",
      });
      setFieldErrors({});
    }
  }, [isOpen, formData]);

  const judgmentTypes = [
    { value: "", label: "Select Judgment Type" },
    { value: "Foreclosure Judgment", label: "Foreclosure Judgment" },
    { value: "Default Judgment", label: "Default Judgment" },
    { value: "Summary Judgment", label: "Summary Judgment" },
    { value: "Judgment of Sale", label: "Judgment of Sale" },
    { value: "Judgment Dismissal", label: "Judgment Dismissal" },
    { value: "Judgment Vacated", label: "Judgment Vacated" },
    { value: "Other", label: "Other" },
  ];

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
    if (!judgmentData.judgmentDate?.trim()) {
      errors.judgmentDate = "Judgment date is required";
    }
    if (!judgmentData.judgmentAmount?.trim()) {
      errors.judgmentAmount = "Judgment amount is required";
    }
    if (!judgmentData.judgmentType?.trim()) {
      errors.judgmentType = "Judgment type is required";
    }
    if (!judgmentData.courtInformation?.trim()) {
      errors.courtInformation = "Court information is required";
    }
    if (!judgmentData.docketNumbers?.trim()) {
      errors.docketNumbers = "Docket numbers are required";
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
      // Update formData with judgment data
      const updatedFormData = {
        ...formData,
        judgment: {
          ...judgmentData,
        },
      };
      setFormData(updatedFormData);

      if (onSave) {
        await onSave(updatedFormData);
      }

      onClose();
    } catch (error) {
      console.error("Error saving judgment:", error);
      toast.error("Failed to save judgment. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original data
    if (formData?.judgment) {
      setJudgmentData({
        judgmentDate: formData.judgment.judgmentDate || "",
        judgmentAmount: formData.judgment.judgmentAmount || "",
        judgmentType: formData.judgment.judgmentType || "",
        courtInformation: formData.judgment.courtInformation || "",
        docketNumbers: formData.judgment.docketNumbers || "",
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
            <h5 className="modal-title">Edit Judgment</h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleCancel}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="judgmentDate" className="form-label">
                  Judgment Date *
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
                <label htmlFor="judgmentAmount" className="form-label">
                  Judgment Amount ($) *
                </label>
                <input
                  type="text"
                  id="judgmentAmount"
                  name="judgmentAmount"
                  className={`form-control ${
                    fieldErrors.judgmentAmount ? "is-invalid" : ""
                  }`}
                  value={judgmentData.judgmentAmount}
                  onChange={handleInputChange}
                  placeholder="Enter judgment amount"
                />
                {fieldErrors.judgmentAmount && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.judgmentAmount}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="judgmentType" className="form-label">
                  Judgment Type *
                </label>
                <CustomDropdown
                  id="judgmentType"
                  name="judgmentType"
                  value={judgmentData.judgmentType}
                  onChange={handleDropdownChange}
                  placeholder="Select Judgment Type"
                  error={!!fieldErrors.judgmentType}
                  options={judgmentTypes}
                />
                {fieldErrors.judgmentType && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.judgmentType}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="docketNumbers" className="form-label">
                  Docket Numbers *
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
                  placeholder="Enter docket numbers"
                />
                {fieldErrors.docketNumbers && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.docketNumbers}
                  </div>
                )}
              </div>

              <div className="col-12">
                <label htmlFor="courtInformation" className="form-label">
                  Court Information *
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
                  placeholder="Enter court information"
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
              Cancel
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
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save me-1"></i>
                  Save Judgment
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

