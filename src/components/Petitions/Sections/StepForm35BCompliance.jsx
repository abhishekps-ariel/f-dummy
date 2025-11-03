import React from "react";
import CustomDropdown from "../../shared/CustomDropdown";

const StepForm35BCompliance = ({
    SectionHeader,
  isEditing,
  formData,
  setFormData,
  fieldErrors,
}) => {
  return (
    <>
      <div className={`card mb-4 ${isEditing ? "editing" : ""}`}>
            <SectionHeader title="Form 35B Compliance" />
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
                      disabled={!isEditing}
                      error={!!fieldErrors.certainMortgageLoan}
                      options={[
                        { value: "", label: "Select..." },
                        { value: "true", label: "Yes" },
                        { value: "false", label: "No" },
                      ]}
                    />
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
