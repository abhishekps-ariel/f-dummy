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
  // Get the list of selected checkboxes for the message
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
  return (
    <>
      <div className={`card mb-4 ${isEditing ? "editing" : ""}`}>
            <SectionHeader title={t("petitionTabContent.form35BCompliance")} />
            <div className="card-body">
              <div className="row">
                <div className="col-12">
                  <div className="form-group mb-3">
                    <label className="form-label">
                      Certain Mortgage Loan *
                    </label>
                    <CustomDropdown
                      name="certainMortgageLoan"
                      value={
                        formData.certainMortgageLoan === null
                          ? ""
                          : formData.certainMortgageLoan
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
                        setFormData((prev) => ({
                          ...prev,
                          certainMortgageLoan: value,
                        }));
                      }}
                      placeholder="Select..."
                      disabled={!isEditing || isCertainMortgageLoanReadOnly}
                      error={!!fieldErrors.certainMortgageLoan}
                      options={[
                        { value: "", label: "Select..." },
                        { value: "true", label: "Yes" },
                        { value: "false", label: "No" },
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
            </div>
          </div>
    </>
  );
};

export default StepForm35BCompliance;
