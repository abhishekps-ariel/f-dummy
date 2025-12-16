import React from "react";
import { useTranslation } from "react-i18next";
import CustomDropdown from "../../shared/CustomDropdown";
import { formatDateForInput } from "../../../utils/dateUtils";

const ForeclosureSaleDisplaySection = ({
  SectionHeader,
  isEditing,
  formData,
  fieldErrors,
  handleInputChange,
  handleDropdownChange,
  getBuyerTypes,
  getForeclosureAlternativeOptions,
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
    if (value === null || value === undefined || value === '') {
      return false;
    }
    return typeof value !== 'string';
  };

  const hasForeclosureSaleData = () => {
    const foreclosureSale = formData?.foreclosureSale;
    if (!foreclosureSale) return false;

    const hasSaleDate = hasStringValue(foreclosureSale.saleDate);
    const hasSoldToId = hasStringValue(foreclosureSale.soldToId) || hasNonStringValue(foreclosureSale.soldToId);
    const hasVestingEntity = hasStringValue(foreclosureSale.vestingEntityName);
    const hasReoEntity = hasStringValue(foreclosureSale.reoEntityName);
    const hasReoContactFirst = hasStringValue(foreclosureSale.reoContactFirstName);
    const hasReoContactLast = hasStringValue(foreclosureSale.reoContactLastName);
    const hasReoBusinessPhone = hasStringValue(foreclosureSale.reoBusinessPhone);
    const hasReoEmergencyPhone = hasStringValue(foreclosureSale.reoEmergencyPhone);
    
    return hasSaleDate || hasSoldToId || hasVestingEntity || hasReoEntity || 
           hasReoContactFirst || hasReoContactLast || hasReoBusinessPhone || hasReoEmergencyPhone;
  };

  if (!hasForeclosureSaleData()) {
    return null;
  }

  const foreclosureSale = formData.foreclosureSale || {};

  const getBuyerTypeName = () => {
    if (!foreclosureSale.soldToId) {
      return "N/A";
    }
    const buyerTypes = getBuyerTypes ? getBuyerTypes() : [];
    const selectedBuyerType = findOptionByValue
      ? findOptionByValue(buyerTypes, foreclosureSale.soldToId)
      : null;
    return selectedBuyerType
      ? selectedBuyerType.name || selectedBuyerType.value || "N/A"
      : "N/A";
  };

  const formatSaleDate = () => {
    if (!foreclosureSale.saleDate) return isEditing ? "" : "N/A";
    if (isEditing && typeof foreclosureSale.saleDate === 'string' && foreclosureSale.saleDate.includes('T')) {
      return formatDateForInput(foreclosureSale.saleDate);
    }
    if (formatDate) {
      return formatDate(foreclosureSale.saleDate);
    }
    const dateStr = typeof foreclosureSale.saleDate === 'string' && foreclosureSale.saleDate.includes("T")
      ? formatDateForInput(foreclosureSale.saleDate)
      : foreclosureSale.saleDate;
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

  const buyerTypes = getBuyerTypes ? getBuyerTypes() : [];
  const selectedBuyerType = (() => {
    if (!foreclosureSale.soldToId) {
      return null;
    }
    if (!findOptionByValue) {
      return null;
    }
    return findOptionByValue(buyerTypes, foreclosureSale.soldToId);
  })();
  const isMortgageeInvestor = selectedBuyerType && (
    selectedBuyerType.name?.toLowerCase().includes("mortgagee") ||
    selectedBuyerType.name?.toLowerCase().includes("investor") ||
    selectedBuyerType.value?.toLowerCase().includes("mortgagee") ||
    selectedBuyerType.value?.toLowerCase().includes("investor")
  );

  const handleFieldChange = (fieldName) => (e) => {
    const value = e.target?.value === undefined ? e.target : e.target.value;
    handleInputChange({
      target: {
        name: 'foreclosureSale',
        value: {
          ...formData.foreclosureSale,
          [fieldName]: value
        }
      }
    });
  };

  const handleSoldToChange = (e) => {
    handleDropdownChange({
      target: {
        name: 'foreclosureSale',
        value: {
          ...formData.foreclosureSale,
          soldToId: e.target.value
        }
      }
    });
  };

  const renderTextField = (fieldName, labelKey, placeholderKey, required = false, showMortgageeNote = false) => {
    const value = foreclosureSale[fieldName] || "";
    const error = fieldErrors?.[fieldName];
    
    return (
      <div className="form-group mb-3">
        <label className="form-label">
          {t(labelKey)} {isEditing && required && "*"}
          {isEditing && showMortgageeNote && isMortgageeInvestor && (
            <span className="text-muted small ms-1">{t("petitionTabContent.ifMortgageeInvestor")}</span>
          )}
        </label>
        {isEditing ? (
          <>
            <input
              type="text"
              className={`form-control ${error ? "is-invalid" : ""}`}
              value={value}
              onChange={handleFieldChange(fieldName)}
              placeholder={placeholderKey ? t(placeholderKey) : ""}
            />
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

  // Render sale date field
  const renderSaleDateField = () => {
    const saleDateValue = formatSaleDate();
    const displayValue = saleDateValue === "N/A" ? "" : saleDateValue;
    
    return (
      <div className="form-group mb-3">
        <label className="form-label">{t("petitionTabContent.saleDate")} {isEditing && "*"}</label>
        {isEditing ? (
          <>
            <input
              type="date"
              className={`form-control ${fieldErrors?.saleDate ? "is-invalid" : ""}`}
              value={displayValue}
              onChange={handleFieldChange('saleDate')}
            />
            {fieldErrors?.saleDate && (
              <div className="text-danger small mt-1">
                {fieldErrors.saleDate}
              </div>
            )}
          </>
        ) : (
          <input
            type="text"
            className="form-control"
            value={saleDateValue}
            readOnly
          />
        )}
      </div>
    );
  };

  // Render sold to dropdown field
  const renderSoldToField = () => {
    return (
      <div className="form-group mb-3">
        <label className="form-label">{t("petitionTabContent.soldToQuestion")} {isEditing && "*"}</label>
        {isEditing ? (
          <>
            <CustomDropdown
              id="soldToId"
              name="soldToId"
              value={foreclosureSale.soldToId || ""}
              onChange={handleSoldToChange}
              placeholder={t("common.select")}
              error={!!fieldErrors?.soldToId}
              options={[
                { value: "", label: t("common.select") },
                ...buyerTypes.map((buyerType) => ({
                  value: buyerType.id || buyerType.value,
                  label: buyerType.name || buyerType.value,
                })),
              ]}
            />
            {fieldErrors?.soldToId && (
              <div className="text-danger small mt-1">
                {fieldErrors.soldToId}
              </div>
            )}
          </>
        ) : (
          <input
            type="text"
            className="form-control"
            value={getBuyerTypeName()}
            readOnly
          />
        )}
      </div>
    );
  };

  const renderRequestedAlternativeField = () => {
    const getValue = () => {
      if (foreclosureSale.requestedAlternativeToForeclosure === null) {
        return "";
      }
      if (foreclosureSale.requestedAlternativeToForeclosure === true) {
        return "true";
      }
      return "false";
    };

    const getDisplayValue = () => {
      if (foreclosureSale.requestedAlternativeToForeclosure === true) {
        return t("petitionTabContent.yes");
      }
      if (foreclosureSale.requestedAlternativeToForeclosure === false) {
        return t("petitionTabContent.no");
      }
      return "N/A";
    };

    const handleAlternativeChange = (e) => {
      const value = (() => {
        if (e.target.value === "true") {
          return true;
        }
        if (e.target.value === "false") {
          return false;
        }
        return null;
      })();
      handleFieldChange('requestedAlternativeToForeclosure')({
        target: { value: value }
      });
      if (value === false) {
        handleFieldChange('foreclosureAlternativeOption')({
          target: { value: null }
        });
      }
    };

    return (
      <div className="form-group mb-3">
        <label className="form-label">{t("petitionTabContent.requestedAlternativeToForeclosure")} *</label>
        {fieldErrors?.requestedAlternativeToForeclosure && (
          <div className="text-danger small mt-1">
            {fieldErrors.requestedAlternativeToForeclosure}
          </div>
        )}
        {isEditing ? (
          <CustomDropdown
            name="requestedAlternativeToForeclosure"
            value={getValue()}
            onChange={handleAlternativeChange}
            placeholder={t("petitionTabContent.select")}
            disabled={!isEditing}
            options={[
              { value: "", label: t("petitionTabContent.select") },
              { value: "true", label: t("petitionTabContent.yes") },
              { value: "false", label: t("petitionTabContent.no") },
            ]}
          />
        ) : (
          <input
            type="text"
            className="form-control"
            value={getDisplayValue()}
            readOnly
          />
        )}
      </div>
    );
  };

  const renderForeclosureAlternativeOptionField = () => {
    if (foreclosureSale.requestedAlternativeToForeclosure !== true) {
      return null;
    }

    const getDisplayValue = () => {
      const options = getForeclosureAlternativeOptions ? getForeclosureAlternativeOptions() : [];
      const selected = options.find(opt => (opt.value || opt.id) === foreclosureSale.foreclosureAlternativeOption);
      return selected ? (selected.description || selected.name) : "N/A";
    };

    return (
      <div className="form-group mb-3">
        <label className="form-label">{t("petitionTabContent.foreclosureAlternativeOption")} *</label>
        {isEditing ? (
          <>
            <CustomDropdown
              name="foreclosureAlternativeOption"
              value={foreclosureSale.foreclosureAlternativeOption || ""}
              onChange={handleFieldChange('foreclosureAlternativeOption')}
              placeholder={t("petitionTabContent.selectAlternativeOption")}
              disabled={!isEditing}
              error={!!fieldErrors?.foreclosureAlternativeOption}
              options={[
                { value: "", label: t("petitionTabContent.selectAlternativeOption") },
                ...(getForeclosureAlternativeOptions ? getForeclosureAlternativeOptions().map((option) => ({
                  value: option.value || option.id,
                  label: option.description || option.name,
                })) : []),
              ]}
            />
            {fieldErrors?.foreclosureAlternativeOption && (
              <div className="text-danger small mt-1">
                {fieldErrors.foreclosureAlternativeOption}
              </div>
            )}
          </>
        ) : (
          <input
            type="text"
            className="form-control"
            value={getDisplayValue()}
            readOnly
          />
        )}
      </div>
    );
  };

  return (
    <div className={`card mb-4 ${isEditing ? "editing" : ""}`}>
      {SectionHeader && <SectionHeader title={t("petitionTabContent.foreclosureSale")} />}
      <div className="card-body">
        <div className="row">
          <div className="col-md-6">
            {renderSaleDateField()}
          </div>
          <div className="col-md-6">
            {renderSoldToField()}
          </div>
          <div className="col-md-6">
            {renderTextField('vestingEntityName', 'petitionTabContent.vestingEntityName', 'modals.editForeclosure.placeholder.vestingEntityName', isMortgageeInvestor && isEditing, true)}
          </div>
          <div className="col-md-6">
            {renderTextField('reoEntityName', 'petitionTabContent.reoEntityName', 'modals.editForeclosure.placeholder.reoEntityName', false, false)}
          </div>
          <div className="col-md-6">
            {renderTextField('reoContactFirstName', 'petitionTabContent.reoContactFirstName', 'modals.editForeclosure.placeholder.reoContactFirstName', isMortgageeInvestor && isEditing, true)}
          </div>
          <div className="col-md-6">
            {renderTextField('reoContactLastName', 'petitionTabContent.reoContactLastName', 'modals.editForeclosure.placeholder.reoContactLastName', isMortgageeInvestor && isEditing, true)}
          </div>
          <div className="col-md-6">
            {renderTextField('reoBusinessPhone', 'petitionTabContent.reoBusinessPhone', 'modals.editForeclosure.placeholder.reoBusinessPhone', isMortgageeInvestor && isEditing, true)}
          </div>
          <div className="col-md-6">
            {renderTextField('reoEmergencyPhone', 'petitionTabContent.reoEmergencyPhone', 'modals.editForeclosure.placeholder.reoEmergencyPhone')}
          </div>
          <div className="col-12">
            {renderRequestedAlternativeField()}
          </div>
          {foreclosureSale.requestedAlternativeToForeclosure === true && (
            <div className="col-12">
              {renderForeclosureAlternativeOptionField()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForeclosureSaleDisplaySection;
