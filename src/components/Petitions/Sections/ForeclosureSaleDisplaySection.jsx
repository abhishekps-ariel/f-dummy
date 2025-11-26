import React from "react";
import { useTranslation } from "react-i18next";
import CustomDropdown from "../../shared/CustomDropdown";

const ForeclosureSaleDisplaySection = ({
  SectionHeader,
  isEditing,
  formData,
  fieldErrors,
  handleInputChange,
  handleDropdownChange,
  getBuyerTypes,
  findOptionByValue,
  formatDate,
}) => {
  const { t } = useTranslation();
  
  // Check if foreclosure sale data exists and has meaningful content
  const hasForeclosureSaleData = () => {
    const foreclosureSale = formData?.foreclosureSale;
    if (!foreclosureSale) return false;
    
    // Check if at least one field has a meaningful value
    const hasSaleDate = foreclosureSale.saleDate !== null &&
                        foreclosureSale.saleDate !== undefined &&
                        foreclosureSale.saleDate !== '' &&
                        typeof foreclosureSale.saleDate === 'string' && 
                        foreclosureSale.saleDate.trim() !== '';
    
    const hasSoldToId = foreclosureSale.soldToId !== null &&
                         foreclosureSale.soldToId !== undefined &&
                         foreclosureSale.soldToId !== '' &&
                         ((typeof foreclosureSale.soldToId === 'string' && foreclosureSale.soldToId.trim() !== '') ||
                          (typeof foreclosureSale.soldToId !== 'string'));
    
    const hasVestingEntity = foreclosureSale.vestingEntityName !== null &&
                              foreclosureSale.vestingEntityName !== undefined &&
                              foreclosureSale.vestingEntityName !== '' &&
                              typeof foreclosureSale.vestingEntityName === 'string' && 
                              foreclosureSale.vestingEntityName.trim() !== '';
    
    const hasReoEntity = foreclosureSale.reoEntityName !== null &&
                         foreclosureSale.reoEntityName !== undefined &&
                         foreclosureSale.reoEntityName !== '' &&
                         typeof foreclosureSale.reoEntityName === 'string' && 
                         foreclosureSale.reoEntityName.trim() !== '';
    
    const hasReoContactFirst = foreclosureSale.reoContactFirstName !== null &&
                                foreclosureSale.reoContactFirstName !== undefined &&
                                foreclosureSale.reoContactFirstName !== '' &&
                                typeof foreclosureSale.reoContactFirstName === 'string' && 
                                foreclosureSale.reoContactFirstName.trim() !== '';
    
    const hasReoContactLast = foreclosureSale.reoContactLastName !== null &&
                               foreclosureSale.reoContactLastName !== undefined &&
                               foreclosureSale.reoContactLastName !== '' &&
                               typeof foreclosureSale.reoContactLastName === 'string' && 
                               foreclosureSale.reoContactLastName.trim() !== '';
    
    const hasReoBusinessPhone = foreclosureSale.reoBusinessPhone !== null &&
                                 foreclosureSale.reoBusinessPhone !== undefined &&
                                 foreclosureSale.reoBusinessPhone !== '' &&
                                 typeof foreclosureSale.reoBusinessPhone === 'string' && 
                                 foreclosureSale.reoBusinessPhone.trim() !== '';
    
    const hasReoEmergencyPhone = foreclosureSale.reoEmergencyPhone !== null &&
                                  foreclosureSale.reoEmergencyPhone !== undefined &&
                                  foreclosureSale.reoEmergencyPhone !== '' &&
                                  typeof foreclosureSale.reoEmergencyPhone === 'string' && 
                                  foreclosureSale.reoEmergencyPhone.trim() !== '';
    
    return hasSaleDate || hasSoldToId || hasVestingEntity || hasReoEntity || 
           hasReoContactFirst || hasReoContactLast || hasReoBusinessPhone || hasReoEmergencyPhone;
  };

  if (!hasForeclosureSaleData()) {
    return null;
  }

  const foreclosureSale = formData.foreclosureSale || {};

  // Get buyer type name
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

  // Format sale date for display
  const formatSaleDate = () => {
    if (!foreclosureSale.saleDate) return isEditing ? "" : "N/A";
    if (isEditing && typeof foreclosureSale.saleDate === 'string' && foreclosureSale.saleDate.includes('T')) {
      return foreclosureSale.saleDate.split('T')[0];
    }
    if (formatDate) {
      return formatDate(foreclosureSale.saleDate);
    }
    const dateStr = typeof foreclosureSale.saleDate === 'string' && foreclosureSale.saleDate.includes("T")
      ? foreclosureSale.saleDate.split("T")[0]
      : foreclosureSale.saleDate;
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

  const buyerTypes = getBuyerTypes ? getBuyerTypes() : [];
  const selectedBuyerType = foreclosureSale.soldToId
    ? findOptionByValue ? findOptionByValue(buyerTypes, foreclosureSale.soldToId) : null
    : null;
  const isMortgageeInvestor = selectedBuyerType && (
    selectedBuyerType.name?.toLowerCase().includes("mortgagee") ||
    selectedBuyerType.name?.toLowerCase().includes("investor") ||
    selectedBuyerType.value?.toLowerCase().includes("mortgagee") ||
    selectedBuyerType.value?.toLowerCase().includes("investor")
  );

  // Handle field changes
  const handleFieldChange = (fieldName) => (e) => {
    handleInputChange({
      target: {
        name: 'foreclosureSale',
        value: {
          ...formData.foreclosureSale,
          [fieldName]: e.target.value
        }
      }
    });
  };

  // Handle dropdown change
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

  return (
    <div className={`card mb-4 ${isEditing ? "editing" : ""}`}>
      <SectionHeader title={t("petitionTabContent.foreclosureSale")} />
      <div className="card-body">
        <div className="row">
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">Sale Date {isEditing && "*"}</label>
              {isEditing ? (
                <>
                  <input
                    type="date"
                    className={`form-control ${fieldErrors?.saleDate ? "is-invalid" : ""}`}
                    value={formatSaleDate() === "N/A" ? "" : formatSaleDate()}
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
                  value={formatSaleDate()}
                  readOnly
                />
              )}
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">Sold To {isEditing && "*"}</label>
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
          </div>
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">
                Vesting Entity Name {isEditing && isMortgageeInvestor && "*"}
                {isEditing && isMortgageeInvestor && (
                  <span className="text-muted small ms-1">({t("modals.editForeclosure.ifMortgageeInvestor")})</span>
                )}
              </label>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    className={`form-control ${fieldErrors?.vestingEntityName ? "is-invalid" : ""}`}
                    value={foreclosureSale.vestingEntityName || ""}
                    onChange={handleFieldChange('vestingEntityName')}
                    placeholder={t("modals.editForeclosure.placeholder.vestingEntityName")}
                  />
                  {fieldErrors?.vestingEntityName && (
                    <div className="text-danger small mt-1">
                      {fieldErrors.vestingEntityName}
                    </div>
                  )}
                </>
              ) : (
                <input
                  type="text"
                  className="form-control"
                  value={foreclosureSale.vestingEntityName || "N/A"}
                  readOnly
                />
              )}
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">REO Entity Name</label>
              {isEditing ? (
                <input
                  type="text"
                  className="form-control"
                  value={foreclosureSale.reoEntityName || ""}
                  onChange={handleFieldChange('reoEntityName')}
                  placeholder={t("modals.editForeclosure.placeholder.reoEntityName")}
                />
              ) : (
                <input
                  type="text"
                  className="form-control"
                  value={foreclosureSale.reoEntityName || "N/A"}
                  readOnly
                />
              )}
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">
                REO Contact First Name {isEditing && isMortgageeInvestor && "*"}
                {isEditing && isMortgageeInvestor && (
                  <span className="text-muted small ms-1">({t("modals.editForeclosure.ifMortgageeInvestor")})</span>
                )}
              </label>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    className={`form-control ${fieldErrors?.reoContactFirstName ? "is-invalid" : ""}`}
                    value={foreclosureSale.reoContactFirstName || ""}
                    onChange={handleFieldChange('reoContactFirstName')}
                    placeholder={t("modals.editForeclosure.placeholder.reoContactFirstName")}
                  />
                  {fieldErrors?.reoContactFirstName && (
                    <div className="text-danger small mt-1">
                      {fieldErrors.reoContactFirstName}
                    </div>
                  )}
                </>
              ) : (
                <input
                  type="text"
                  className="form-control"
                  value={foreclosureSale.reoContactFirstName || "N/A"}
                  readOnly
                />
              )}
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">
                REO Contact Last Name {isEditing && isMortgageeInvestor && "*"}
                {isEditing && isMortgageeInvestor && (
                  <span className="text-muted small ms-1">({t("modals.editForeclosure.ifMortgageeInvestor")})</span>
                )}
              </label>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    className={`form-control ${fieldErrors?.reoContactLastName ? "is-invalid" : ""}`}
                    value={foreclosureSale.reoContactLastName || ""}
                    onChange={handleFieldChange('reoContactLastName')}
                    placeholder={t("modals.editForeclosure.placeholder.reoContactLastName")}
                  />
                  {fieldErrors?.reoContactLastName && (
                    <div className="text-danger small mt-1">
                      {fieldErrors.reoContactLastName}
                    </div>
                  )}
                </>
              ) : (
                <input
                  type="text"
                  className="form-control"
                  value={foreclosureSale.reoContactLastName || "N/A"}
                  readOnly
                />
              )}
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">
                REO Business Phone {isEditing && isMortgageeInvestor && "*"}
                {isEditing && isMortgageeInvestor && (
                  <span className="text-muted small ms-1">({t("modals.editForeclosure.ifMortgageeInvestor")})</span>
                )}
              </label>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    className={`form-control ${fieldErrors?.reoBusinessPhone ? "is-invalid" : ""}`}
                    value={foreclosureSale.reoBusinessPhone || ""}
                    onChange={handleFieldChange('reoBusinessPhone')}
                    placeholder={t("modals.editForeclosure.placeholder.reoBusinessPhone")}
                  />
                  {fieldErrors?.reoBusinessPhone && (
                    <div className="text-danger small mt-1">
                      {fieldErrors.reoBusinessPhone}
                    </div>
                  )}
                </>
              ) : (
                <input
                  type="text"
                  className="form-control"
                  value={foreclosureSale.reoBusinessPhone || "N/A"}
                  readOnly
                />
              )}
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">REO Emergency Phone</label>
              {isEditing ? (
                <input
                  type="text"
                  className="form-control"
                  value={foreclosureSale.reoEmergencyPhone || ""}
                  onChange={handleFieldChange('reoEmergencyPhone')}
                  placeholder={t("modals.editForeclosure.placeholder.reoEmergencyPhone")}
                />
              ) : (
                <input
                  type="text"
                  className="form-control"
                  value={foreclosureSale.reoEmergencyPhone || "N/A"}
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

export default ForeclosureSaleDisplaySection;
