import React, { useState, useEffect } from "react";
import CustomDropdown from "../shared/CustomDropdown";
import { toast } from "react-toastify";

const EditForeclosureModal = ({
  isOpen,
  onClose,
  petition,
  formData,
  setFormData,
  getBuyerTypes,
  findOptionByValue,
  onSave,
}) => {
  const [foreclosureData, setForeclosureData] = useState({
    saleDate: formData?.foreclosureSale?.saleDate || "",
    soldToId: formData?.foreclosureSale?.soldToId || "",
    vestingEntityName: formData?.foreclosureSale?.vestingEntityName || "",
    reoEntityName: formData?.foreclosureSale?.reoEntityName || "",
    reoContactFirstName: formData?.foreclosureSale?.reoContactFirstName || "",
    reoContactLastName: formData?.foreclosureSale?.reoContactLastName || "",
    reoBusinessPhone: formData?.foreclosureSale?.reoBusinessPhone || "",
    reoEmergencyPhone: formData?.foreclosureSale?.reoEmergencyPhone || "",
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
      errors.saleDate = "Sale date is required";
    }
    if (!foreclosureData.soldToId?.trim()) {
      errors.soldToId = "Sold To is required";
    }
    if (isMortgageeInvestor) {
      if (!foreclosureData.vestingEntityName?.trim()) {
        errors.vestingEntityName = "Vesting Entity Name is required when Sold To is Mortgagee/Investor";
      }
      if (!foreclosureData.reoContactFirstName?.trim()) {
        errors.reoContactFirstName = "REO Contact First Name is required when Sold To is Mortgagee/Investor";
      }
      if (!foreclosureData.reoContactLastName?.trim()) {
        errors.reoContactLastName = "REO Contact Last Name is required when Sold To is Mortgagee/Investor";
      }
      if (!foreclosureData.reoBusinessPhone?.trim()) {
        errors.reoBusinessPhone = "REO Business Phone is required when Sold To is Mortgagee/Investor";
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
      // Update formData with foreclosure data
      const updatedFormData = {
        ...formData,
        foreclosureSale: {
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
      toast.error("Failed to save foreclosure. Please try again.");
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
            <h5 className="modal-title">Edit Foreclosure</h5>
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
                <label htmlFor="saleDate" className="form-label">
                  Sale Date *
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
                  Sold To? *
                </label>
                <CustomDropdown
                  id="soldToId"
                  name="soldToId"
                  value={foreclosureData.soldToId}
                  onChange={handleDropdownChange}
                  placeholder="Select..."
                  error={!!fieldErrors.soldToId}
                  options={[
                    { value: "", label: "Select..." },
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
                  Vesting Entity Name {isMortgageeInvestor ? "*" : ""}
                  {isMortgageeInvestor && (
                    <span className="text-muted small ms-1">(If Mortgagee/Investor)</span>
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
                  placeholder="Enter vesting entity name"
                />
                {fieldErrors.vestingEntityName && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.vestingEntityName}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="reoEntityName" className="form-label">
                  REO Entity Name
                </label>
                <input
                  type="text"
                  id="reoEntityName"
                  name="reoEntityName"
                  className="form-control"
                  value={foreclosureData.reoEntityName}
                  onChange={handleInputChange}
                  placeholder="Enter REO entity name"
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="reoContactFirstName" className="form-label">
                  REO Contact First Name {isMortgageeInvestor ? "*" : ""}
                  {isMortgageeInvestor && (
                    <span className="text-muted small ms-1">(If Mortgagee/Investor)</span>
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
                  placeholder="Enter REO contact first name"
                />
                {fieldErrors.reoContactFirstName && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.reoContactFirstName}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="reoContactLastName" className="form-label">
                  REO Contact Last Name {isMortgageeInvestor ? "*" : ""}
                  {isMortgageeInvestor && (
                    <span className="text-muted small ms-1">(If Mortgagee/Investor)</span>
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
                  placeholder="Enter REO contact last name"
                />
                {fieldErrors.reoContactLastName && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.reoContactLastName}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="reoBusinessPhone" className="form-label">
                  REO Business Phone {isMortgageeInvestor ? "*" : ""}
                  {isMortgageeInvestor && (
                    <span className="text-muted small ms-1">(If Mortgagee/Investor)</span>
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
                  placeholder="Enter REO business phone"
                />
                {fieldErrors.reoBusinessPhone && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.reoBusinessPhone}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="reoEmergencyPhone" className="form-label">
                  REO Emergency Phone
                </label>
                <input
                  type="text"
                  id="reoEmergencyPhone"
                  name="reoEmergencyPhone"
                  className="form-control"
                  value={foreclosureData.reoEmergencyPhone}
                  onChange={handleInputChange}
                  placeholder="Enter REO emergency phone"
                />
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
                  Save Foreclosure
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

