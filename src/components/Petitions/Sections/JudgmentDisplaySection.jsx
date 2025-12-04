import React from "react";
import { useTranslation } from "react-i18next";
import CustomDropdown from "../../shared/CustomDropdown";

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

const JudgmentDisplaySection = ({
  SectionHeader,
  isEditing,
  formData,
  fieldErrors,
  handleInputChange,
  handleDropdownChange,
  getJudgmentTypes,
  findOptionByValue,
  formatDate,
  formatCurrency,
}) => {
  const { t } = useTranslation();
  
  // Check if judgment data exists and has meaningful content
  const hasJudgmentData = () => {
    const judgment = formData?.judgment;
    if (!judgment) return false;
    
    // Check if at least one field has a meaningful value
    const hasDate = judgment.judgmentDate !== null && 
                    judgment.judgmentDate !== undefined &&
                    ((typeof judgment.judgmentDate === 'string' && judgment.judgmentDate.trim() !== '') ||
                     (typeof judgment.judgmentDate !== 'string'));
    
    const hasType = judgment.judgmentType !== null && 
                    judgment.judgmentType !== undefined && 
                    judgment.judgmentType !== 0 &&
                    judgment.judgmentType !== '';
    
    const hasCourtInfo = judgment.courtInformation !== null &&
                         judgment.courtInformation !== undefined &&
                         typeof judgment.courtInformation === 'string' && 
                         judgment.courtInformation.trim() !== '';
    
    const hasDocket = judgment.docketNumbers !== null &&
                      judgment.docketNumbers !== undefined &&
                      typeof judgment.docketNumbers === 'string' && 
                      judgment.docketNumbers.trim() !== '';
    
    return hasDate || hasType || hasCourtInfo || hasDocket;
  };

  if (!hasJudgmentData()) {
    return null;
  }

  const judgment = formData.judgment || {};
  
  // Get judgment type name
  const getJudgmentTypeName = () => {
    if (judgment.judgmentType === null || judgment.judgmentType === undefined) {
      return "N/A";
    }
    const judgmentTypes = getJudgmentTypes ? getJudgmentTypes() : [];
    const selectedType = findOptionByValue
      ? findOptionByValue(judgmentTypes, judgment.judgmentType)
      : null;
    return selectedType
      ? selectedType.description || selectedType.name || "N/A"
      : "N/A";
  };

  // Format judgment date for display
  const formatJudgmentDate = () => {
    if (!judgment.judgmentDate) return "N/A";
    if (isEditing && typeof judgment.judgmentDate === 'string' && judgment.judgmentDate.includes('T')) {
      return judgment.judgmentDate.split('T')[0];
    }
    if (formatDate) {
      return formatDate(judgment.judgmentDate);
    }
    const dateStr = typeof judgment.judgmentDate === 'string' && judgment.judgmentDate.includes("T")
      ? judgment.judgmentDate.split("T")[0]
      : judgment.judgmentDate;
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Format judgment amount for display
  const formatJudgmentAmount = () => {
    if (
      judgment.judgmentAmount === null ||
      judgment.judgmentAmount === undefined ||
      judgment.judgmentAmount === 0
    ) {
      return isEditing ? "" : "N/A";
    }
    if (isEditing) {
      // When editing, show formatted value for display
      return formatCurrencyDisplay(String(judgment.judgmentAmount));
    }
    return formatCurrency
      ? formatCurrency(judgment.judgmentAmount)
      : `$${judgment.judgmentAmount.toLocaleString()}`;
  };

  // Get judgment types from API
  const judgmentTypesFromApi = getJudgmentTypes ? getJudgmentTypes() : [];
  const judgmentTypes = judgmentTypesFromApi
    .filter((jt) => (jt.value !== null && jt.value !== undefined) || (jt.id !== null && jt.id !== undefined))
    .map((jt) => ({
      value: String(jt.value ?? jt.id ?? ''),
      label: jt.description || jt.name || '',
    }));

  // Handle currency input change
  const handleAmountChange = (e) => {
    const parsedValue = parseCurrencyInput(e.target.value);
    // Convert to number for storage
    const numericValue = parsedValue ? parseFloat(parsedValue) : 0;
    // Update formData.judgment.judgmentAmount
    handleInputChange({
      target: {
        name: 'judgment',
        value: {
          ...formData.judgment,
          judgmentAmount: isNaN(numericValue) ? 0 : numericValue
        }
      }
    });
  };

  // Handle judgment date change
  const handleDateChange = (e) => {
    handleInputChange({
      target: {
        name: 'judgment',
        value: {
          ...formData.judgment,
          judgmentDate: e.target.value
        }
      }
    });
  };

  // Handle judgment type change
  const handleTypeChange = (e) => {
    handleDropdownChange({
      target: {
        name: 'judgment',
        value: {
          ...formData.judgment,
          judgmentType: e.target.value
        }
      }
    });
  };

  // Handle other field changes
  const handleFieldChange = (fieldName) => (e) => {
    handleInputChange({
      target: {
        name: 'judgment',
        value: {
          ...formData.judgment,
          [fieldName]: e.target.value
        }
      }
    });
  };

  return (
    <div className={`card mb-4 ${isEditing ? "editing" : ""}`}>
      <SectionHeader title={t("petitionTabContent.judgment")} />
      <div className="card-body">
        <div className="row">
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">{t("petitionTabContent.judgmentDate")} {isEditing && "*"}</label>
              {isEditing ? (
                <>
                  <input
                    type="date"
                    className={`form-control ${fieldErrors?.judgmentDate ? "is-invalid" : ""}`}
                    value={formatJudgmentDate() === "N/A" ? "" : formatJudgmentDate()}
                    onChange={handleDateChange}
                  />
                  {fieldErrors?.judgmentDate && (
                    <div className="text-danger small mt-1">
                      {fieldErrors.judgmentDate}
                    </div>
                  )}
                </>
              ) : (
                <input
                  type="text"
                  className="form-control"
                  value={formatJudgmentDate()}
                  readOnly
                />
              )}
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">{t("petitionTabContent.judgmentType")} {isEditing && "*"}</label>
              {isEditing ? (
                <>
                  <CustomDropdown
                    id="judgmentType"
                    name="judgmentType"
                    value={judgment.judgmentType !== null && judgment.judgmentType !== undefined 
                      ? String(judgment.judgmentType) 
                      : ""}
                    onChange={handleTypeChange}
                    placeholder={t("common.select")}
                    error={!!fieldErrors?.judgmentType}
                    options={judgmentTypes}
                    maxMenuHeight={180}
                  />
                  {fieldErrors?.judgmentType && (
                    <div className="text-danger small mt-1">
                      {fieldErrors.judgmentType}
                    </div>
                  )}
                </>
              ) : (
                <input
                  type="text"
                  className="form-control"
                  value={getJudgmentTypeName()}
                  readOnly
                />
              )}
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">{t("petitionTabContent.docketNumber")} {isEditing && "*"}</label>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    className={`form-control ${fieldErrors?.docketNumbers ? "is-invalid" : ""}`}
                    value={judgment.docketNumbers || ""}
                    onChange={handleFieldChange('docketNumbers')}
                  />
                  {fieldErrors?.docketNumbers && (
                    <div className="text-danger small mt-1">
                      {fieldErrors.docketNumbers}
                    </div>
                  )}
                </>
              ) : (
                <input
                  type="text"
                  className="form-control"
                  value={judgment.docketNumbers || "N/A"}
                  readOnly
                />
              )}
            </div>
          </div>
          <div className="col-12">
            <div className="form-group mb-3">
              <label className="form-label">{t("petitionTabContent.courtInformation")} {isEditing && "*"}</label>
              {isEditing ? (
                <>
                  <textarea
                    className={`form-control ${fieldErrors?.courtInformation ? "is-invalid" : ""}`}
                    value={judgment.courtInformation || ""}
                    onChange={handleFieldChange('courtInformation')}
                    rows="3"
                  />
                  {fieldErrors?.courtInformation && (
                    <div className="text-danger small mt-1">
                      {fieldErrors.courtInformation}
                    </div>
                  )}
                </>
              ) : (
                <input
                  type="text"
                  className="form-control"
                  value={judgment.courtInformation || "N/A"}
                  readOnly
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JudgmentDisplaySection;
