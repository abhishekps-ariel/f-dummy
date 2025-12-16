import React from "react";
import { useTranslation } from "react-i18next";
import CustomDropdown from "../../shared/CustomDropdown";

const StepForm35BCompliance = ({
  SectionHeader,
  isEditing,
  formData,
  setFormData,
  fieldErrors,
  isCertainMortgageLoanReadOnly = false,
}) => {
  const getSelectedCheckboxesMessage = () => {
    const selected = [];
    if (formData.variableRate) selected.push("Variable Rate");
    if (formData.interestOnly) selected.push("Interest Only");
    if (formData.negativeAmortization) selected.push("Negative Amortization");
    if (selected.length === 0) return "";
    if (selected.length === 1) return `${selected[0]} is selected on loan detail step.`;
    if (selected.length === 2) return `${selected[0]} and ${selected[1]} are selected on loan detail step.`;
    return `${selected[0]}, ${selected[1]}, and ${selected[2]} are selected on loan detail step.`;
  };
  const { t } = useTranslation();
  
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
  
  return (
      <div className={`card mb-4 ${isEditing ? "editing" : ""}`}>
            {SectionHeader && <SectionHeader title={t("petitionTabContent.form35BCompliance")} />}
            <div className="card-body">
              <div className="row">
                <div className="col-12">
                  <div className="form-group mb-3">
                    <label className="form-label">
                      {t("petitionTabContent.certainMortgageLoan")} *
                    </label>
                    <CustomDropdown
                      name="certainMortgageLoan"
                      value={getBooleanValue(formData.certainMortgageLoan)}
                      onChange={(e) => {
                        const value = parseBooleanValue(e.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          certainMortgageLoan: value,
                          // Reset wasForm35BProvided if certainMortgageLoan is set to false
                          wasForm35BProvided: value === true ? prev.wasForm35BProvided : null,
                        }));
                      }}
                      placeholder={t("petitionTabContent.select")}
                      disabled={!isEditing || isCertainMortgageLoanReadOnly}
                      error={!!fieldErrors.certainMortgageLoan}
                      options={[
                        { value: "", label: t("petitionTabContent.select") },
                        { value: "true", label: t("petitionTabContent.yes") },
                        { value: "false", label: t("petitionTabContent.no") },
                      ]}
                    />
                    {isCertainMortgageLoanReadOnly && (
                      <div className="text-muted small mt-1">
                        <i className="fas fa-info-circle me-1"></i>
                        This field is set to "Yes" because {getSelectedCheckboxesMessage()}
                      </div>
                    )}
                    {fieldErrors.certainMortgageLoan && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.certainMortgageLoan}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {formData.certainMortgageLoan === true && (
                <div className="row">
                  <div className="col-12">
                    <div className="form-group mb-3">
                      <label className="form-label">
                        {t("petitionTabContent.wasForm35BProvided")} *
                      </label>
                      <CustomDropdown
                        name="wasForm35BProvided"
                        value={getBooleanValue(formData.wasForm35BProvided)}
                        onChange={(e) => {
                          const value = parseBooleanValue(e.target.value);
                          setFormData((prev) => ({
                            ...prev,
                            wasForm35BProvided: value,
                          }));
                        }}
                        placeholder={t("petitionTabContent.select")}
                        disabled={!isEditing}
                        error={!!fieldErrors.wasForm35BProvided}
                        options={[
                          { value: "", label: t("petitionTabContent.select") },
                          { value: "true", label: t("petitionTabContent.yes") },
                          { value: "false", label: t("petitionTabContent.no") },
                        ]}
                      />
                      {fieldErrors.wasForm35BProvided && (
                        <div className="text-danger small mt-1">
                          {fieldErrors.wasForm35BProvided}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
  );
};

export default StepForm35BCompliance;
