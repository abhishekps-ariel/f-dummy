import React from "react";
import { useTranslation } from "react-i18next";
import CustomDropdown from "../../shared/CustomDropdown";
import { formatCurrencyDisplay } from "../../../utils/currencyUtils"; 

const Step3LoanDetails = ({
  commonDataError,
  commonDataLoading,
  fieldErrors,
  formData,
  handleInputChange,
  getLoanTypes,
  getLienPositions,
  getLenderTypes,
}) => {
  const { t } = useTranslation();
  return (
          <div>
            <h2 className="theme-color font-med mb-1">{t("petitionSteps.step3.title")}</h2>

            <p className="text-muted small mb-3">
              {t("petitionSteps.step3.description")}
            </p>

            {commonDataError && (
              <div className="alert alert-warning" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>

                {commonDataError}
              </div>
            )}

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">
                  {t("petitionSteps.step3.isMinApplicable")} *
                </label>
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
                    />
                    <label className="form-check-label" htmlFor="isMinApplicableYes" style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                      {t("petitionSteps.step3.yes")}
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
                    />
                    <label className="form-check-label" htmlFor="isMinApplicableNo" style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                      {t("petitionSteps.step3.no")}
                    </label>
                  </div>
                </div>
                {fieldErrors.isMinApplicable && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.isMinApplicable}
                  </div>
                )}
              </div>

              {formData.isMinApplicable === "yes" && (
                <div className="col-md-6">
                  <label htmlFor="minNumber" className="form-label">
                    {t("petitionSteps.step3.minNumber")} *
                  </label>

                  <input
                    type="text"
                    id="minNumber"
                    name="minNumber"
                    className={`form-control ${
                      fieldErrors.minNumber ? "is-invalid" : ""
                    }`}
                    value={formData.minNumber || ""}
                    onChange={handleInputChange}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder={t("petitionSteps.step3.placeholderMinNumber")}
                  />

                  {fieldErrors.minNumber && (
                    <div className="text-danger small mt-1">
                      {fieldErrors.minNumber}
                    </div>
                  )}
                </div>
              )}

              <div className="col-md-6">
                <label htmlFor="loanNumber" className="form-label">
                  {t("petitionSteps.step3.loanNumber")} *
                </label>

                <input
                  type="text"
                  id="loanNumber"
                  name="loanNumber"
                  className={`form-control ${
                    fieldErrors.loanNumber ? "is-invalid" : ""
                  }`}
                  value={formData.loanNumber || ""}
                  onChange={handleInputChange}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder={t("petitionSteps.step3.placeholderLoanNumber")}
                />

                {fieldErrors.loanNumber && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.loanNumber}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="petitionLoanTypeId" className="form-label">
                  {t("petitionSteps.step3.loanType")} *
                </label>

                <CustomDropdown
                  id="petitionLoanTypeId"
                  name="petitionLoanTypeId"
                  value={formData.petitionLoanTypeId || ""}
                  onChange={handleInputChange}
                  placeholder={t("petitionSteps.step3.selectLoanType")}
                  disabled={commonDataLoading}
                  error={!!fieldErrors.petitionLoanTypeId}
                  options={[
                    { value: "", label: t("petitionSteps.step3.selectLoanType") },
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

                {commonDataLoading && (
                  <div className="form-text">
                    <i className="fas fa-spinner fa-spin me-1"></i>
                    {t("petitionSteps.step3.loadingLoanTypes")}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="lienPosition" className="form-label">
                  {t("petitionSteps.step3.lienPosition")} *
                </label>

                <CustomDropdown
                  id="lienPosition"
                  name="lienPosition"
                  value={formData.lienPosition ?? ""}
                  onChange={handleInputChange}
                  placeholder={t("petitionSteps.step3.selectPosition")}
                  disabled={commonDataLoading}
                  error={!!fieldErrors.lienPosition}
                  options={[
                    { value: "", label: t("petitionSteps.step3.selectPosition") },
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

                {commonDataLoading && (
                  <div className="form-text">
                    <i className="fas fa-spinner fa-spin me-1"></i>
                    {t("petitionSteps.step3.loadingLienPositions")}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="originationDate" className="form-label">
                  {t("petitionSteps.step3.originationDate")} *
                </label>

                <input
                  type="date"
                  id="originationDate"
                  name="originationDate"
                  className={`form-control ${
                    fieldErrors.originationDate ? "is-invalid" : ""
                  }`}
                  value={formData.originationDate || ""}
                  onChange={handleInputChange}
                />

                {fieldErrors.originationDate && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.originationDate}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="originalPrincipalAmount" className="form-label">
                  {t("petitionSteps.step3.originalPrincipalAmount")} *
                </label>

                <input
                  type="text"
                  id="originalPrincipalAmount"
                  name="originalPrincipalAmount"
                  className={`form-control ${
                    fieldErrors.originalPrincipalAmount ? "is-invalid" : ""
                  }`}
                  value={formatCurrencyDisplay(formData.originalPrincipalAmount)}
                  onChange={handleInputChange}
                />

                {fieldErrors.originalPrincipalAmount && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.originalPrincipalAmount}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="currentPrincipalBalance" className="form-label">
                  {t("petitionSteps.step3.currentPrincipalBalance")} *
                </label>

                <input
                  type="text"
                  id="currentPrincipalBalance"
                  name="currentPrincipalBalance"
                  className={`form-control ${
                    fieldErrors.currentPrincipalBalance ? "is-invalid" : ""
                  }`}
                  value={formatCurrencyDisplay(formData.currentPrincipalBalance)}
                  onChange={handleInputChange}
                />

                {fieldErrors.currentPrincipalBalance && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.currentPrincipalBalance}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="interestRatePercent" className="form-label">
                  {t("petitionSteps.step3.interestRatePercent")} *
                </label>

                <input
                  type="number"
                  step="0.001"
                  id="interestRatePercent"
                  name="interestRatePercent"
                  className={`form-control ${
                    fieldErrors.interestRatePercent ? "is-invalid" : ""
                  }`}
                  value={formData.interestRatePercent ?? ""}
                  onChange={handleInputChange}
                />

                {fieldErrors.interestRatePercent && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.interestRatePercent}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="monthlyPaymentAmount" className="form-label">
                  {t("petitionSteps.step3.monthlyPaymentAmount")} *
                </label>

                <input
                  type="text"
                  id="monthlyPaymentAmount"
                  name="monthlyPaymentAmount"
                  className={`form-control ${
                    fieldErrors.monthlyPaymentAmount ? "is-invalid" : ""
                  }`}
                  value={formatCurrencyDisplay(formData.monthlyPaymentAmount)}
                  onChange={handleInputChange}
                />

                {fieldErrors.monthlyPaymentAmount && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.monthlyPaymentAmount}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="delinquencyDaysAtFiling" className="form-label">
                  {t("petitionSteps.step3.delinquencyDaysAtFiling")} *
                </label>

                <input
                  type="number"
                  id="delinquencyDaysAtFiling"
                  name="delinquencyDaysAtFiling"
                  min="0"
                  className={`form-control ${
                    fieldErrors.delinquencyDaysAtFiling ? "is-invalid" : ""
                  }`}
                  value={
                    formData.delinquencyDaysAtFiling === "" ||
                    formData.delinquencyDaysAtFiling === null ||
                    formData.delinquencyDaysAtFiling === undefined
                      ? ""
                      : String(
                          Math.floor(Number(formData.delinquencyDaysAtFiling))
                        )
                  }
                  onChange={handleInputChange}
                />

                {fieldErrors.delinquencyDaysAtFiling && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.delinquencyDaysAtFiling}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="mortgageBrokerLicenseNumber" className="form-label">
                  {t("petitionSteps.step3.mortgageBrokerLicenseNumber")}
                </label>

                <input
                  type="text"
                  id="mortgageBrokerLicenseNumber"
                  name="mortgageBrokerLicenseNumber"
                  className={`form-control ${
                    fieldErrors.mortgageBrokerLicenseNumber ? "is-invalid" : ""
                  }`}
                  value={formData.mortgageBrokerLicenseNumber || ""}
                  onChange={handleInputChange}
                />

                {fieldErrors.mortgageBrokerLicenseNumber && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.mortgageBrokerLicenseNumber}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="mortgageLoanOriginatorLicenseNumber" className="form-label">
                  {t("petitionSteps.step3.mortgageLoanOriginatorLicenseNumber")}
                </label>

                <input
                  type="text"
                  id="mortgageLoanOriginatorLicenseNumber"
                  name="mortgageLoanOriginatorLicenseNumber"
                  className={`form-control ${
                    fieldErrors.mortgageLoanOriginatorLicenseNumber ? "is-invalid" : ""
                  }`}
                  value={formData.mortgageLoanOriginatorLicenseNumber || ""}
                  onChange={handleInputChange}
                />

                {fieldErrors.mortgageLoanOriginatorLicenseNumber && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.mortgageLoanOriginatorLicenseNumber}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="lenderId" className="form-label">
                  {t("petitionSteps.step3.lenderType")}
                </label>

                <CustomDropdown
                  id="lenderId"
                  name="lenderId"
                  value={formData.lenderId || ""}
                  onChange={handleInputChange}
                  placeholder={t("petitionSteps.step3.selectLenderType")}
                  disabled={commonDataLoading}
                  error={!!fieldErrors.lenderId}
                  options={[
                    { value: "", label: t("petitionSteps.step3.selectLenderType") },
                    ...getLenderTypes().map((lenderType) => ({
                      value: lenderType.id,
                      label: lenderType.name,
                    })),
                  ]}
                />

                {fieldErrors.lenderId && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.lenderId}
                  </div>
                )}

                {commonDataLoading && (
                  <div className="form-text">
                    <i className="fas fa-spinner fa-spin me-1"></i>
                    {t("petitionSteps.step3.loadingLenderTypes")}
                  </div>
                )}
              </div>

              <div className="col-12">
                <div className="row">
                  <div className="col-md-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="variableRate"
                        name="variableRate"
                        checked={formData.variableRate}
                        onChange={handleInputChange}
                      />

                      <label
                        className="form-check-label"
                        htmlFor="variableRate"
                        style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}
                      >
                        {t("petitionSteps.step3.variableRate")}
                      </label>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="interestOnly"
                        name="interestOnly"
                        checked={formData.interestOnly}
                        onChange={handleInputChange}
                      />

                      <label
                        className="form-check-label"
                        htmlFor="interestOnly"
                        style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}
                      >
                        {t("petitionSteps.step3.interestOnly")}
                      </label>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="negativeAmortization"
                        name="negativeAmortization"
                        checked={formData.negativeAmortization}
                        onChange={handleInputChange}
                      />

                      <label
                        className="form-check-label"
                        htmlFor="negativeAmortization"
                        style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}
                      >
                        {t("petitionSteps.step3.negativeAmortization")}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loan Modification Fields - Moved to Bottom */}
              <div className="col-md-6">
                <label className="form-label">
                  {t("petitionSteps.step3.borrowerRequestedLoanModification")} *
                </label>
                {fieldErrors.borrowerRequestedLoanModification && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.borrowerRequestedLoanModification}
                  </div>
                )}
                <div className="d-flex gap-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="borrowerRequestedLoanModification"
                      id="borrowerRequestedLoanModificationYes"
                      value="yes"
                      checked={formData.borrowerRequestedLoanModification === true}
                      onChange={(e) =>
                        handleInputChange({
                          target: {
                            name: "borrowerRequestedLoanModification",
                            value: true,
                          },
                        })
                      }
                    />
                    <label className="form-check-label" htmlFor="borrowerRequestedLoanModificationYes" style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                      {t("petitionSteps.step3.yes")}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="borrowerRequestedLoanModification"
                      id="borrowerRequestedLoanModificationNo"
                      value="no"
                      checked={formData.borrowerRequestedLoanModification === false}
                      onChange={(e) =>
                        handleInputChange({
                          target: {
                            name: "borrowerRequestedLoanModification",
                            value: false,
                          },
                        })
                      }
                    />
                    <label className="form-check-label" htmlFor="borrowerRequestedLoanModificationNo" style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                      {t("petitionSteps.step3.no")}
                    </label>
                  </div>
                </div>
              </div>

              {formData.borrowerRequestedLoanModification === true && (
                <div className="col-md-6">
                  <label className="form-label">
                    {t("petitionSteps.step3.loanModificationRequestFinalized")} *
                  </label>
                  {fieldErrors.loanModificationRequestFinalized && (
                    <div className="text-danger small mt-1">
                      {fieldErrors.loanModificationRequestFinalized}
                    </div>
                  )}
                  <div className="d-flex gap-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="loanModificationRequestFinalized"
                        id="loanModificationRequestFinalizedYes"
                        value="yes"
                        checked={formData.loanModificationRequestFinalized === true}
                        onChange={(e) =>
                          handleInputChange({
                            target: {
                              name: "loanModificationRequestFinalized",
                              value: true,
                            },
                          })
                        }
                      />
                      <label className="form-check-label" htmlFor="loanModificationRequestFinalizedYes" style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                        {t("petitionSteps.step3.yes")}
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="loanModificationRequestFinalized"
                        id="loanModificationRequestFinalizedNo"
                        value="no"
                        checked={formData.loanModificationRequestFinalized === false}
                        onChange={(e) =>
                          handleInputChange({
                            target: {
                              name: "loanModificationRequestFinalized",
                              value: false,
                            },
                          })
                        }
                      />
                      <label className="form-check-label" htmlFor="loanModificationRequestFinalizedNo" style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                        {t("petitionSteps.step3.no")}
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
};

export default Step3LoanDetails;
