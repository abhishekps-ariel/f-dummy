import React from "react";

const ForeclosureSaleDisplaySection = ({
  SectionHeader,
  formData,
  getBuyerTypes,
  findOptionByValue,
  formatDate,
}) => {
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

  const foreclosureSale = formData.foreclosureSale;

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

  // Format sale date
  const formatSaleDate = () => {
    if (!foreclosureSale.saleDate) return "N/A";
    // If formatDate function is provided, use it (it expects a date string)
    if (formatDate) {
      return formatDate(foreclosureSale.saleDate);
    }
    // Otherwise, format manually
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

  return (
    <div className="card mb-4">
      <SectionHeader title="Foreclosure Sale" />
      <div className="card-body">
        <div className="row">
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">Sale Date</label>
              <input
                type="text"
                className="form-control"
                value={formatSaleDate()}
                readOnly
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">Sold To</label>
              <input
                type="text"
                className="form-control"
                value={getBuyerTypeName()}
                readOnly
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">Vesting Entity Name</label>
              <input
                type="text"
                className="form-control"
                value={foreclosureSale.vestingEntityName || "N/A"}
                readOnly
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">REO Entity Name</label>
              <input
                type="text"
                className="form-control"
                value={foreclosureSale.reoEntityName || "N/A"}
                readOnly
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">REO Contact First Name</label>
              <input
                type="text"
                className="form-control"
                value={foreclosureSale.reoContactFirstName || "N/A"}
                readOnly
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">REO Contact Last Name</label>
              <input
                type="text"
                className="form-control"
                value={foreclosureSale.reoContactLastName || "N/A"}
                readOnly
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">REO Business Phone</label>
              <input
                type="text"
                className="form-control"
                value={foreclosureSale.reoBusinessPhone || "N/A"}
                readOnly
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">REO Emergency Phone</label>
              <input
                type="text"
                className="form-control"
                value={foreclosureSale.reoEmergencyPhone || "N/A"}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForeclosureSaleDisplaySection;

