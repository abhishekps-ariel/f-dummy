import React from "react";
import { useTranslation } from "react-i18next";
import CustomDropdown from "../../shared/CustomDropdown";
import { formatCurrencyDisplay } from "../../../utils/currencyUtils";

const LoanDetails = ({
    SectionHeader,
  isEditing,
  fieldErrors,
  formData,
  handleInputChange,
  getLoanTypes,
  getLienPositions,
  getLenderTypes,
  commonDataLoading,
}) => {
  const { t } = useTranslation();
  return (
    <>
      {/* Loan Details Section */}
      <div className={`card mb-4 ${isEditing ? "editing" : ""}`}>
            <SectionHeader title={t("petitionTabContent.loanDetails")} />
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">{t("petitionTabContent.isMinApplicable")} *</label>
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
                          {t("petitionTabContent.yes")}
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
                          {t("petitionTabContent.no")}
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
                      <label className="form-label">{t("petitionTabContent.minNumber")} *</label>
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
                    <label className="form-label">{t("petitionTabContent.loanNumber")} *</label>
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
                    <label className="form-label">{t("petitionTabContent.loanType")} *</label>
                    <CustomDropdown
                      name="petitionLoanTypeId"
                      value={formData.petitionLoanTypeId || ""}
                      onChange={handleInputChange}
                      placeholder={t("petitionTabContent.selectLoanType")}
                      disabled={!isEditing || commonDataLoading}
                      error={!!fieldErrors.petitionLoanTypeId}
                      options={[
                        { value: "", label: t("petitionTabContent.selectLoanType") },
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
                    <label className="form-label">{t("petitionTabContent.lienPosition")} *</label>
                    <CustomDropdown
                      name="lienPosition"
                      value={formData.lienPosition ?? ""}
                      onChange={handleInputChange}
                      placeholder={t("petitionTabContent.selectPosition")}
                      disabled={!isEditing || commonDataLoading}
                      error={!!fieldErrors.lienPosition}
                      options={[
                        { value: "", label: t("petitionTabContent.selectPosition") },
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
                    <label className="form-label">{t("petitionTabContent.originationDate")} *</label>
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
                      {t("petitionTabContent.originalPrincipalAmount")} *
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
                      {t("petitionTabContent.currentPrincipalBalance")} *
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
                    <label className="form-label">{t("petitionTabContent.interestRatePercent")} *</label>
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
                      {t("petitionTabContent.monthlyPaymentAmount")} *
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
                      {t("petitionTabContent.delinquencyDaysAtFiling")}
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
                    <label className="form-label">{t("petitionTabContent.mortgageBrokerLicenseNumber")}</label>
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
                    <label className="form-label">{t("petitionTabContent.mortgageLoanOriginatorLicenseNumber")}</label>
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
                    <label className="form-label">{t("petitionTabContent.lenderType")}</label>
                    <CustomDropdown
                      name="lenderId"
                      value={formData.lenderId || ""}
                      onChange={handleInputChange}
                      placeholder={t("petitionTabContent.selectLenderType")}
                      disabled={!isEditing || commonDataLoading}
                      error={!!fieldErrors.lenderId}
                      options={[
                        { value: "", label: t("petitionTabContent.selectLenderType") },
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
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">{t("petitionTabContent.variableRate")}</label>
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
                        {formData.variableRate ? t("petitionTabContent.yes") : t("petitionTabContent.no")}
                      </label>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">{t("petitionTabContent.interestOnly")}</label>
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
                        {formData.interestOnly ? t("petitionTabContent.yes") : t("petitionTabContent.no")}
                      </label>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">{t("petitionTabContent.negativeAmortization")}</label>
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
                        {formData.negativeAmortization ? t("petitionTabContent.yes") : t("petitionTabContent.no")}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Loan Modification Fields - Moved to Bottom */}
                <div className="col-12">
                  <div className="form-group mb-3">
                    <label className="form-label">{t("petitionTabContent.borrowerRequestedLoanModification")}? *</label>
                    {fieldErrors.borrowerRequestedLoanModification && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.borrowerRequestedLoanModification}
                      </div>
                    )}
                    {isEditing ? (
                      <div className="d-flex gap-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="borrowerRequestedLoanModification"
                            id="borrowerRequestedLoanModificationYes"
                            value="yes"
                            checked={formData.borrowerRequestedLoanModification === true}
                            onChange={handleInputChange}
                          />
                          <label className="form-check-label" htmlFor="borrowerRequestedLoanModificationYes">
                            {t("petitionTabContent.yes")}
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
                            onChange={handleInputChange}
                          />
                          <label className="form-check-label" htmlFor="borrowerRequestedLoanModificationNo">
                            {t("petitionTabContent.no")}
                          </label>
                        </div>
                      </div>
                    ) : (
                      <input
                        type="text"
                        className="form-control"
                        value={formData.borrowerRequestedLoanModification === true ? t("petitionTabContent.yes") : formData.borrowerRequestedLoanModification === false ? t("petitionTabContent.no") : ""}
                        readOnly
                      />
                    )}
                  </div>
                </div>

                {formData.borrowerRequestedLoanModification === true && (
                  <div className="col-12">
                    <div className="form-group mb-3">
                      <label className="form-label">{t("petitionTabContent.loanModificationRequestFinalized")}? *</label>
                      {fieldErrors.loanModificationRequestFinalized && (
                        <div className="text-danger small mt-1">
                          {fieldErrors.loanModificationRequestFinalized}
                        </div>
                      )}
                      {isEditing ? (
                        <div className="d-flex gap-3">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="loanModificationRequestFinalized"
                              id="loanModificationRequestFinalizedYes"
                              value="yes"
                              checked={formData.loanModificationRequestFinalized === true}
                              onChange={handleInputChange}
                            />
                            <label className="form-check-label" htmlFor="loanModificationRequestFinalizedYes">
                              {t("petitionTabContent.yes")}
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
                              onChange={handleInputChange}
                            />
                            <label className="form-check-label" htmlFor="loanModificationRequestFinalizedNo">
                              {t("petitionTabContent.no")}
                            </label>
                          </div>
                        </div>
                      ) : (
                        <input
                          type="text"
                          className="form-control"
                          value={formData.loanModificationRequestFinalized === true ? t("petitionTabContent.yes") : formData.loanModificationRequestFinalized === false ? t("petitionTabContent.no") : ""}
                          readOnly
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
    </>
  );
};

export default LoanDetails;
