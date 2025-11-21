import React, { useState, useEffect } from "react";
import CustomDropdown from "../shared/CustomDropdown";
import { toast } from "react-toastify";

// Helper function to format currency with commas for display
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

// Helper function to parse currency input (remove commas and non-digits except decimal)
const parseCurrencyInput = (value) => {
  if (!value) return "";
  // Remove all non-digit characters except decimal point
  const numericValue = String(value).replace(/[^\d.]/g, "");
  return numericValue;
};

const EditJudgementModal = ({ isOpen, onClose, petition, onSave, formData, setFormData, getJudgmentTypes, findOptionByValue }) => {
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
    if (isOpen) {
      if (formData?.judgment) {
        // Convert judgmentType number to string for dropdown
        const judgmentTypeValue = formData.judgment.judgmentType !== null && formData.judgment.judgmentType !== undefined
          ? String(formData.judgment.judgmentType)
          : "";
        
        // Format judgment amount for display - handle both number and string
        const judgmentAmountValue = formData.judgment.judgmentAmount !== null && formData.judgment.judgmentAmount !== undefined
          ? (typeof formData.judgment.judgmentAmount === 'number' 
              ? formatCurrencyDisplay(formData.judgment.judgmentAmount)
              : formatCurrencyDisplay(formData.judgment.judgmentAmount))
          : "";
        
        setJudgmentData({
          judgmentDate: formData.judgment.judgmentDate 
            ? (formData.judgment.judgmentDate.includes("T") 
                ? formData.judgment.judgmentDate.split("T")[0] 
                : formData.judgment.judgmentDate)
            : "",
          judgmentAmount: judgmentAmountValue,
          judgmentType: judgmentTypeValue,
          courtInformation: formData.judgment.courtInformation || "",
          docketNumbers: formData.judgment.docketNumbers || "",
        });
      } else {
        // Reset if no judgment data
        setJudgmentData({
          judgmentDate: "",
          judgmentAmount: "",
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
    
    // Handle currency formatting for judgmentAmount
    if (name === "judgmentAmount") {
      // Parse the input to remove commas and non-digit characters (except decimal)
      const parsedValue = parseCurrencyInput(value);
      // Format for display with commas
      const formattedValue = formatCurrencyDisplay(parsedValue);
      setJudgmentData((prev) => ({
        ...prev,
        [name]: formattedValue,
      }));
    } else {
      setJudgmentData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    
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
      errors.judgmentDate = "Judgment date is required";
    }
    // Parse judgment amount to check if it's valid (handle formatted currency with commas)
    const parsedAmount = parseCurrencyInput(judgmentData.judgmentAmount);
    if (!parsedAmount || !parsedAmount.trim()) {
      errors.judgmentAmount = "Judgment amount is required";
    } else if (isNaN(parseFloat(parsedAmount)) || parseFloat(parsedAmount) <= 0) {
      errors.judgmentAmount = "Judgment amount must be a valid positive number";
    }
    // judgmentType can be a number (0 is valid) or string, so check for empty string or null/undefined
    if (judgmentData.judgmentType === "" || judgmentData.judgmentType === null || judgmentData.judgmentType === undefined) {
      errors.judgmentType = "Judgment type is required";
    }
    if (!judgmentData.courtInformation || (typeof judgmentData.courtInformation === 'string' && !judgmentData.courtInformation.trim())) {
      errors.courtInformation = "Court information is required";
    }
    if (!judgmentData.docketNumbers || (typeof judgmentData.docketNumbers === 'string' && !judgmentData.docketNumbers.trim())) {
      errors.docketNumbers = "Docket numbers are required";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    console.log("Save Judgment button clicked");
    
    if (!validate()) {
      toast.error("Please fill all required fields.");
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
        toast.error("Please select a judgment type.");
        setIsSaving(false);
        return;
      }
      
      // Parse judgment amount (remove commas) before saving
      const parsedAmount = parseCurrencyInput(judgmentData.judgmentAmount);
      const judgmentAmountNumber = parsedAmount ? parseFloat(parsedAmount) : 0;
      
      // Update formData with judgment data
      const updatedFormData = {
        ...formData,
        judgment: {
          id: formData?.judgment?.id || null,
          petitionId: petition?.id || null,
          judgmentDate: judgmentData.judgmentDate,
          judgmentAmount: judgmentAmountNumber,
          judgmentType: judgmentTypeNumber,
          courtInformation: judgmentData.courtInformation,
          docketNumbers: judgmentData.docketNumbers,
        },
      };
      
      console.log("Updated formData with judgment:", updatedFormData.judgment);
      
      // Update local state first
      setFormData(updatedFormData);

      // Then save to backend
      if (onSave) {
        console.log("Calling onSave function");
        await onSave(updatedFormData);
        console.log("onSave completed successfully");
      } else {
        console.error("onSave function is not provided!");
        toast.error("Save function not available. Please try again.");
        setIsSaving(false);
        return;
      }

      // Close modal after successful save
      onClose();
    } catch (error) {
      console.error("Error saving judgment:", error);
      toast.error(error?.message || "Failed to save judgment. Please try again.");
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
        judgmentAmount: formData.judgment.judgmentAmount !== null && formData.judgment.judgmentAmount !== undefined
          ? formatCurrencyDisplay(formData.judgment.judgmentAmount)
          : "",
        judgmentType: judgmentTypeValue,
        courtInformation: formData.judgment.courtInformation || "",
        docketNumbers: formData.judgment.docketNumbers || "",
      });
    } else {
      // Reset to empty if no judgment data
      setJudgmentData({
        judgmentDate: "",
        judgmentAmount: "",
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

