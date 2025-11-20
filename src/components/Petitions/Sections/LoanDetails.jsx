import React from "react";
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

const LoanDetails = ({
    SectionHeader,
  isEditing,
  fieldErrors,
  formData,
  handleInputChange,
  getLoanTypes,
  getLienPositions,
  commonDataLoading,
}) => {
  return (
    <>
      {/* Loan Details Section */}
      <div className={`card mb-4 ${isEditing ? "editing" : ""}`}>
            <SectionHeader title="Loan Details" />
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Is MIN Applicable? *</label>
                    <div className="d-flex gap-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="isMinApplicable"
                          id="isMinApplicableYes"
                          value="yes"
                          checked={formData.isMinApplicable === "yes"}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                        <label className="form-check-label" htmlFor="isMinApplicableYes">
                          Yes
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="isMinApplicable"
                          id="isMinApplicableNo"
                          value="no"
                          checked={formData.isMinApplicable === "no"}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                        <label className="form-check-label" htmlFor="isMinApplicableNo">
                          No
                        </label>
                      </div>
                    </div>
                    {fieldErrors.isMinApplicable && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.isMinApplicable}
                      </div>
                    )}
                  </div>
                </div>

                {formData.isMinApplicable === "yes" && (
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">MIN Number *</label>
                      <input
                        type="text"
                        name="minNumber"
                        className={`form-control ${
                          fieldErrors.minNumber ? "is-invalid" : ""
                        }`}
                        value={formData.minNumber || ""}
                        readOnly={!isEditing}
                        onChange={handleInputChange}
                      />
                      {fieldErrors.minNumber && (
                        <div className="text-danger small mt-1">
                          {fieldErrors.minNumber}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Loan Number *</label>
                    <input
                      type="text"
                      name="loanNumber"
                      className={`form-control ${
                        fieldErrors.loanNumber ? "is-invalid" : ""
                      }`}
                      value={formData.loanNumber || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.loanNumber && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.loanNumber}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Loan Type *</label>
                    <CustomDropdown
                      name="petitionLoanTypeId"
                      value={formData.petitionLoanTypeId || ""}
                      onChange={handleInputChange}
                      placeholder="Select Loan Type"
                      disabled={!isEditing || commonDataLoading}
                      error={!!fieldErrors.petitionLoanTypeId}
                      options={[
                        { value: "", label: "Select Loan Type" },
                        ...getLoanTypes().map((loanType) => ({
                          value: loanType.id,
                          label: loanType.name,
                        })),
                      ]}
                    />
                    {fieldErrors.petitionLoanTypeId && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.petitionLoanTypeId}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Lien Position *</label>
                    <CustomDropdown
                      name="lienPosition"
                      value={formData.lienPosition ?? ""}
                      onChange={handleInputChange}
                      placeholder="Select Position"
                      disabled={!isEditing || commonDataLoading}
                      error={!!fieldErrors.lienPosition}
                      options={[
                        { value: "", label: "Select Position" },
                        ...getLienPositions().map((position) => ({
                          value: position.value,
                          label: position.name,
                        })),
                      ]}
                    />
                    {fieldErrors.lienPosition && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.lienPosition}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Origination Date *</label>
                    <input
                      type="date"
                      name="originationDate"
                      className={`form-control ${
                        fieldErrors.originationDate ? "is-invalid" : ""
                      }`}
                      value={formData.originationDate || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.originationDate && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.originationDate}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">
                      Original Principal Amount ($) *
                    </label>
                    <input
                      type="text"
                      name="originalPrincipalAmount"
                      className={`form-control ${
                        fieldErrors.originalPrincipalAmount ? "is-invalid" : ""
                      }`}
                      value={formatCurrencyDisplay(formData.originalPrincipalAmount)}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.originalPrincipalAmount && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.originalPrincipalAmount}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">
                      Current Principal Balance ($) *
                    </label>
                    <input
                      type="text"
                      name="currentPrincipalBalance"
                      className={`form-control ${
                        fieldErrors.currentPrincipalBalance ? "is-invalid" : ""
                      }`}
                      value={formatCurrencyDisplay(formData.currentPrincipalBalance)}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.currentPrincipalBalance && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.currentPrincipalBalance}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Interest Rate (%) *</label>
                    <input
                      type="number"
                      step="0.001"
                      name="interestRatePercent"
                      className={`form-control ${
                        fieldErrors.interestRatePercent ? "is-invalid" : ""
                      }`}
                      value={formData.interestRatePercent || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.interestRatePercent && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.interestRatePercent}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">
                      Monthly Payment Amount ($) *
                    </label>
                    <input
                      type="text"
                      name="monthlyPaymentAmount"
                      className={`form-control ${
                        fieldErrors.monthlyPaymentAmount ? "is-invalid" : ""
                      }`}
                      value={formatCurrencyDisplay(formData.monthlyPaymentAmount)}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.monthlyPaymentAmount && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.monthlyPaymentAmount}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">
                      Delinquency Days at Filing
                    </label>
                    <input
                      type="number"
                      name="delinquencyDaysAtFiling"
                      className={`form-control ${
                        fieldErrors.delinquencyDaysAtFiling ? "is-invalid" : ""
                      }`}
                      value={formData.delinquencyDaysAtFiling || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.delinquencyDaysAtFiling && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.delinquencyDaysAtFiling}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Mortgage Broker License Number</label>
                    <input
                      type="text"
                      name="mortgageBrokerLicenseNumber"
                      className={`form-control ${
                        fieldErrors.mortgageBrokerLicenseNumber ? "is-invalid" : ""
                      }`}
                      value={formData.mortgageBrokerLicenseNumber || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.mortgageBrokerLicenseNumber && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.mortgageBrokerLicenseNumber}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Mortgage Loan Originator License Number</label>
                    <input
                      type="text"
                      name="mortgageLoanOriginatorLicenseNumber"
                      className={`form-control ${
                        fieldErrors.mortgageLoanOriginatorLicenseNumber ? "is-invalid" : ""
                      }`}
                      value={formData.mortgageLoanOriginatorLicenseNumber || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.mortgageLoanOriginatorLicenseNumber && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.mortgageLoanOriginatorLicenseNumber}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Variable Rate</label>
                    <div className="form-check">
                      <input
                        type="checkbox"
                        name="variableRate"
                        className="form-check-input"
                        checked={formData.variableRate || false}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                      <label className="form-check-label">
                        {formData.variableRate ? "Yes" : "No"}
                      </label>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Interest Only</label>
                    <div className="form-check">
                      <input
                        type="checkbox"
                        name="interestOnly"
                        className="form-check-input"
                        checked={formData.interestOnly || false}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                      <label className="form-check-label">
                        {formData.interestOnly ? "Yes" : "No"}
                      </label>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Negative Amortization</label>
                    <div className="form-check">
                      <input
                        type="checkbox"
                        name="negativeAmortization"
                        className="form-check-input"
                        checked={formData.negativeAmortization || false}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                      <label className="form-check-label">
                        {formData.negativeAmortization ? "Yes" : "No"}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
    </>
  );
};

export default LoanDetails;
