import React from "react";
import { useTranslation } from "react-i18next";
import CustomDropdown from "../../shared/CustomDropdown";
import { formatDateForInput } from "../../../utils/dateUtils";

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
}) => {
  const { t } = useTranslation();

  const hasStringValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return false;
    }
    return typeof value === 'string' && value.trim() !== '';
  };

  const hasNonStringValue = (value) => {
    if (value === null || value === undefined) {
      return false;
    }
    return typeof value !== 'string';
  };

  const hasNumberValue = (value) => {
    return value !== null && value !== undefined && value !== 0 && value !== '';
  };

  const hasJudgmentData = () => {
    const judgment = formData?.judgment;
    if (!judgment) return false;
    
    const hasDate = hasStringValue(judgment.judgmentDate) || hasNonStringValue(judgment.judgmentDate);
    const hasType = hasNumberValue(judgment.judgmentType);
    const hasCourtInfo = hasStringValue(judgment.courtInformation);
    const hasDocket = hasStringValue(judgment.docketNumbers);
    
    return hasDate || hasType || hasCourtInfo || hasDocket;
  };

  if (!hasJudgmentData()) {
    return null;
  }

  const judgment = formData.judgment || {};

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

  const formatJudgmentDate = () => {
    if (!judgment.judgmentDate) return "N/A";
    if (isEditing && typeof judgment.judgmentDate === 'string' && judgment.judgmentDate.includes('T')) {
      return formatDateForInput(judgment.judgmentDate);
    }
    if (formatDate) {
      return formatDate(judgment.judgmentDate);
    }
    const dateStr = typeof judgment.judgmentDate === 'string' && judgment.judgmentDate.includes("T")
      ? formatDateForInput(judgment.judgmentDate)
      : judgment.judgmentDate;
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const judgmentTypesFromApi = getJudgmentTypes ? getJudgmentTypes() : [];
  const judgmentTypes = judgmentTypesFromApi
    .filter((jt) => (jt.value !== null && jt.value !== undefined) || (jt.id !== null && jt.id !== undefined))
    .map((jt) => ({
      value: String(jt.value ?? jt.id ?? ''),
      label: jt.description || jt.name || '',
    }));

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

  const renderJudgmentDateField = () => {
    const dateValue = formatJudgmentDate();
    const displayValue = dateValue === "N/A" ? "" : dateValue;
    
    return (
      <div className="form-group mb-3">
        <label className="form-label">{t("petitionTabContent.judgmentDate")} {isEditing && "*"}</label>
        {isEditing ? (
          <>
            <input
              type="date"
              className={`form-control ${fieldErrors?.judgmentDate ? "is-invalid" : ""}`}
              value={displayValue}
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
            value={dateValue}
            readOnly
          />
        )}
      </div>
    );
  };

  const renderJudgmentTypeField = () => {
    const typeValue = judgment.judgmentType !== null && judgment.judgmentType !== undefined 
      ? String(judgment.judgmentType) 
      : "";
    
    return (
      <div className="form-group mb-3">
        <label className="form-label">{t("petitionTabContent.judgmentType")} {isEditing && "*"}</label>
        {isEditing ? (
          <>
            <CustomDropdown
              id="judgmentType"
              name="judgmentType"
              value={typeValue}
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
    );
  };

  // Render text field (for docket number and court information)
  const renderTextField = (fieldName, labelKey, isTextarea = false) => {
    const value = judgment[fieldName] || "";
    const error = fieldErrors?.[fieldName];
    
    return (
      <div className="form-group mb-3">
        <label className="form-label">{t(labelKey)} {isEditing && "*"}</label>
        {isEditing ? (
          <>
            {isTextarea ? (
              <textarea
                className={`form-control ${error ? "is-invalid" : ""}`}
                value={value}
                onChange={handleFieldChange(fieldName)}
                rows="3"
              />
            ) : (
              <input
                type="text"
                className={`form-control ${error ? "is-invalid" : ""}`}
                value={value}
                onChange={handleFieldChange(fieldName)}
              />
            )}
            {error && (
              <div className="text-danger small mt-1">
                {error}
              </div>
            )}
          </>
        ) : (
          <input
            type="text"
            className="form-control"
            value={value || "N/A"}
            readOnly
          />
        )}
      </div>
    );
  };

  return (
    <div className={`card mb-4 ${isEditing ? "editing" : ""}`}>
      {SectionHeader && <SectionHeader title={t("petitionTabContent.judgment")} />}
      <div className="card-body">
        <div className="row">
          <div className="col-md-6">
            {renderJudgmentDateField()}
          </div>
          <div className="col-md-6">
            {renderJudgmentTypeField()}
          </div>
          <div className="col-md-6">
            {renderTextField('docketNumbers', 'petitionTabContent.docketNumber')}
          </div>
          <div className="col-12">
            {renderTextField('courtInformation', 'petitionTabContent.courtInformation', true)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JudgmentDisplaySection;
