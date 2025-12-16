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

  const renderTextField = (fieldName, labelKey, type = "text", required = false) => {
    const value = formData[fieldName] || "";
    const error = fieldErrors[fieldName];
    const isCurrency = type === "text" && fieldName.includes("Amount");
    const displayValue = isCurrency ? formatCurrencyDisplay(value) : value;
    
    return (
      <div className="form-group mb-3">
        <label className="form-label">
          {t(labelKey)} {required && "*"}
        </label>
        <input
          type={type}
          name={fieldName}
          className={`form-control ${error ? "is-invalid" : ""}`}
          value={displayValue}
          step={type === "number" ? "0.001" : undefined}
          readOnly={!isEditing}
          onChange={handleInputChange}
        />
        {error && (
          <div className="text-danger small mt-1">
            {error}
          </div>
        )}
      </div>
    );
  };

  const renderStringRadioField = (fieldName, labelKey, required = false) => {
    const value = formData[fieldName];
    const error = fieldErrors[fieldName];
    const isYes = value === "yes";
    const isNo = value === "no";
    
    return (
      <div className="form-group mb-3">
        <label className="form-label">{t(labelKey)} {required && "*"}</label>
        {isEditing ? (
          <div className="d-flex gap-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name={fieldName}
                id={`${fieldName}Yes`}
                value="yes"
                checked={isYes}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              <label className="form-check-label" htmlFor={`${fieldName}Yes`}>
                {t("petitionTabContent.yes")}
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name={fieldName}
                id={`${fieldName}No`}
                value="no"
                checked={isNo}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              <label className="form-check-label" htmlFor={`${fieldName}No`}>
                {t("petitionTabContent.no")}
              </label>
            </div>
          </div>
        ) : (
          <input
            type="text"
            className="form-control"
            value={(() => {
              if (isYes) return t("petitionTabContent.yes");
              if (isNo) return t("petitionTabContent.no");
              return "";
            })()}
            readOnly
          />
        )}
        {error && (
          <div className="text-danger small mt-1">
            {error}
          </div>
        )}
      </div>
    );
  };

  const renderBooleanRadioField = (fieldName, labelKey, required = false) => {
    const value = formData[fieldName];
    const error = fieldErrors[fieldName];
    const isTrue = value === true;
    const isFalse = value === false;
    
    return (
      <div className="form-group mb-3">
        <label className="form-label">{t(labelKey)} {required && "*"}</label>
        {error && (
          <div className="text-danger small mt-1">
            {error}
          </div>
        )}
        {isEditing ? (
          <div className="d-flex gap-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name={fieldName}
                id={`${fieldName}Yes`}
                value="yes"
                checked={isTrue}
                onChange={handleInputChange}
              />
              <label className="form-check-label" htmlFor={`${fieldName}Yes`}>
                {t("petitionTabContent.yes")}
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name={fieldName}
                id={`${fieldName}No`}
                value="no"
                checked={isFalse}
                onChange={handleInputChange}
              />
              <label className="form-check-label" htmlFor={`${fieldName}No`}>
                {t("petitionTabContent.no")}
              </label>
            </div>
          </div>
        ) : (
          <input
            type="text"
            className="form-control"
            value={(() => {
              if (isTrue) return t("petitionTabContent.yes");
              if (isFalse) return t("petitionTabContent.no");
              return "";
            })()}
            readOnly
          />
        )}
      </div>
    );
  };

  const renderCheckboxField = (fieldName, labelKey) => {
    const value = formData[fieldName] || false;
    
    return (
      <div className="form-group mb-3">
        <label className="form-label">{t(labelKey)}</label>
        <div className="form-check">
          <input
            type="checkbox"
            name={fieldName}
            className="form-check-input"
            checked={value}
            onChange={handleInputChange}
            disabled={!isEditing}
          />
          <label className="form-check-label">
            {value ? t("petitionTabContent.yes") : t("petitionTabContent.no")}
          </label>
        </div>
      </div>
    );
  };

  const renderDropdownField = (fieldName, labelKey, placeholderKey, getOptions, required = false, useValueForLien = false) => {
    const rawValue = formData[fieldName];
    const error = fieldErrors[fieldName];
    const options = getOptions ? getOptions() : [];
    
    // For lienPosition, handle 0 as a valid value (not falsy)
    let stringValue = "";
    if (useValueForLien) {
      // lienPosition can be 0, 1, or 2, so we need to check for null/undefined specifically
      if (rawValue === null || rawValue === undefined || rawValue === "") {
        stringValue = "";
      } else {
        stringValue = String(rawValue);
      }
    } else {
      stringValue = String(rawValue || "");
    }
    
    return (
      <div className="form-group mb-3">
        <label className="form-label">{t(labelKey)} {required && "*"}</label>
        <CustomDropdown
          name={fieldName}
          value={stringValue}
          onChange={handleInputChange}
          placeholder={t(placeholderKey)}
          disabled={!isEditing || commonDataLoading}
          error={!!error}
          options={[
            { value: "", label: t(placeholderKey) },
            ...options.map((option) => ({
              value: useValueForLien ? String(option.value ?? option.id ?? "") : String(option.id ?? option.value ?? ""),
              label: option.name || option.description,
            })),
          ]}
        />
        {error && (
          <div className="text-danger small mt-1">
            {error}
          </div>
        )}
      </div>
    );
  };

  return (
      <div className={`card mb-4 ${isEditing ? "editing" : ""}`}>
            {SectionHeader && <SectionHeader title={t("petitionTabContent.loanDetails")} />}
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  {renderStringRadioField('isMinApplicable', 'petitionTabContent.isMinApplicable', true)}
                </div>

                {formData.isMinApplicable === "yes" && (
                  <div className="col-md-6">
                    {renderTextField('minNumber', 'petitionTabContent.minNumber', 'text', true)}
                  </div>
                )}
                <div className="col-md-6">
                  {renderTextField('loanNumber', 'petitionTabContent.loanNumber', 'text', true)}
                </div>
                <div className="col-md-6">
                  {renderDropdownField('petitionLoanTypeId', 'petitionTabContent.loanType', 'petitionTabContent.selectLoanType', getLoanTypes, true)}
                </div>
                <div className="col-md-6">
                  {renderDropdownField('lienPosition', 'petitionTabContent.lienPosition', 'petitionTabContent.selectPosition', getLienPositions, true, true)}
                </div>
                <div className="col-md-6">
                  {renderTextField('originationDate', 'petitionTabContent.originationDate', 'date', true)}
                </div>
                <div className="col-md-6">
                  {renderTextField('originalPrincipalAmount', 'petitionTabContent.originalPrincipalAmount', 'text', true)}
                </div>
                <div className="col-md-6">
                  {renderTextField('currentPrincipalBalance', 'petitionTabContent.currentPrincipalBalance', 'text', true)}
                </div>
                <div className="col-md-6">
                  {renderTextField('interestRatePercent', 'petitionTabContent.interestRatePercent', 'number', true)}
                </div>
                <div className="col-md-6">
                  {renderTextField('monthlyPaymentAmount', 'petitionTabContent.monthlyPaymentAmount', 'text', true)}
                </div>
                <div className="col-md-6">
                  {renderTextField('delinquencyDaysAtFiling', 'petitionTabContent.delinquencyDaysAtFiling', 'number', false)}
                </div>
                <div className="col-md-6">
                  {renderTextField('mortgageBrokerLicenseNumber', 'petitionTabContent.mortgageBrokerLicenseNumber', 'text', false)}
                </div>
                <div className="col-md-6">
                  {renderTextField('mortgageLoanOriginatorLicenseNumber', 'petitionTabContent.mortgageLoanOriginatorLicenseNumber', 'text', false)}
                </div>
                <div className="col-md-6">
                  {renderDropdownField('lenderId', 'petitionTabContent.lenderType', 'petitionTabContent.selectLenderType', getLenderTypes, false)}
                </div>
                <div className="col-md-6">
                  {renderCheckboxField('variableRate', 'petitionTabContent.variableRate')}
                </div>
                <div className="col-md-6">
                  {renderCheckboxField('interestOnly', 'petitionTabContent.interestOnly')}
                </div>
                <div className="col-md-6">
                  {renderCheckboxField('negativeAmortization', 'petitionTabContent.negativeAmortization')}
                </div>

                <div className="col-12">
                  {renderBooleanRadioField('borrowerRequestedLoanModification', 'petitionTabContent.borrowerRequestedLoanModification', true)}
                </div>

                {formData.borrowerRequestedLoanModification === true && (
                  <div className="col-12">
                    {renderBooleanRadioField('loanModificationRequestFinalized', 'petitionTabContent.loanModificationRequestFinalized', true)}
                  </div>
                )}
              </div>
            </div>
          </div>
  );
};

export default LoanDetails;
