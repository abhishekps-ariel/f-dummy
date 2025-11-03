import React from "react";
import CustomDropdown from "../../shared/CustomDropdown";

const ForeclosureSaleSection = ({
    SectionHeader,
  formData,
  petition,
  isEditing,
  fieldErrors,
  foreclosureSaleSectionRef,
  getBuyerTypes,
  findOptionByValue,
  updateForeclosureSale,
}) => {
  return (
    <>
      {/* Foreclosure Sale Section - Only show if Right to Cure is "Yes" AND petition is not Draft */}
      {formData.noticeSent === true && 
           petition.status?.toLowerCase() !== "draft" && 
           petition.statusClass?.toLowerCase() !== "draft" && (
            <div 
              ref={foreclosureSaleSectionRef}
              className={`card mb-4 ${isEditing ? "editing" : ""} ${
                Object.keys(fieldErrors).some(key => key.startsWith("foreclosureSale.")) 
                  ? "border-danger" 
                  : ""
              }`}
            >
              <SectionHeader title="Foreclosure Sale" />
              <div className="card-body">
                
                {/* Determine if selected buyer is Mortgagee/Investor */}
                {(() => {
                  const buyerTypes = getBuyerTypes();
                  const selectedBuyerType = formData.foreclosureSale?.soldToId
                    ? findOptionByValue(buyerTypes, formData.foreclosureSale.soldToId)
                    : null;
                  const isMortgageeInvestor = selectedBuyerType && (
                    selectedBuyerType.name?.toLowerCase().includes("mortgagee") ||
                    selectedBuyerType.name?.toLowerCase().includes("investor") ||
                    selectedBuyerType.value?.toLowerCase().includes("mortgagee") ||
                    selectedBuyerType.value?.toLowerCase().includes("investor")
                  );
                  
                  return (
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Sale Date *</label>
                          <input
                            type="date"
                            className={`form-control ${
                              fieldErrors["foreclosureSale.saleDate"]
                                ? "is-invalid"
                                : ""
                            }`}
                            value={formData.foreclosureSale?.saleDate || ""}
                            readOnly={!isEditing}
                            onChange={(e) =>
                              updateForeclosureSale("saleDate", e.target.value)
                            }
                          />
                          {fieldErrors["foreclosureSale.saleDate"] && (
                            <div className="text-danger small mt-1">
                              {fieldErrors["foreclosureSale.saleDate"]}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Sold To? *</label>
                          {isEditing ? (
                            <CustomDropdown
                              name="soldToId"
                              value={formData.foreclosureSale?.soldToId || ""}
                              onChange={(e) =>
                                updateForeclosureSale("soldToId", e.target.value)
                              }
                              placeholder="Select..."
                              disabled={!isEditing}
                              error={!!fieldErrors["foreclosureSale.soldToId"]}
                              options={[
                                { value: "", label: "Select..." },
                                ...getBuyerTypes().map((buyerType) => ({
                                  value: buyerType.id || buyerType.value,
                                  label: buyerType.name || buyerType.value,
                                })),
                              ]}
                            />
                          ) : (
                            <input
                              type="text"
                              className="form-control"
                              value={
                                selectedBuyerType
                                  ? selectedBuyerType.name || selectedBuyerType.value || ""
                                  : ""
                              }
                              readOnly
                            />
                          )}
                          {fieldErrors["foreclosureSale.soldToId"] && (
                            <div className="text-danger small mt-1">
                              {fieldErrors["foreclosureSale.soldToId"]}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">
                            Vesting Entity Name {isMortgageeInvestor ? "*" : ""}
                            {isMortgageeInvestor && (
                              <span className="text-muted small ms-1">(If Mortgagee/Investor)</span>
                            )}
                          </label>
                          <input
                            type="text"
                            className={`form-control ${
                              fieldErrors["foreclosureSale.vestingEntityName"]
                                ? "is-invalid"
                                : ""
                            }`}
                            value={
                              formData.foreclosureSale?.vestingEntityName || ""
                            }
                            readOnly={!isEditing}
                            onChange={(e) =>
                              updateForeclosureSale(
                                "vestingEntityName",
                                e.target.value
                              )
                            }
                          />
                          {fieldErrors["foreclosureSale.vestingEntityName"] && (
                            <div className="text-danger small mt-1">
                              {fieldErrors["foreclosureSale.vestingEntityName"]}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">REO Entity Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.foreclosureSale?.reoEntityName || ""}
                            readOnly={!isEditing}
                            onChange={(e) =>
                              updateForeclosureSale("reoEntityName", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">
                            REO Contact First Name {isMortgageeInvestor ? "*" : ""}
                            {isMortgageeInvestor && (
                              <span className="text-muted small ms-1">(If Mortgagee/Investor)</span>
                            )}
                          </label>
                          <input
                            type="text"
                            className={`form-control ${
                              fieldErrors["foreclosureSale.reoContactFirstName"]
                                ? "is-invalid"
                                : ""
                            }`}
                            value={
                              formData.foreclosureSale?.reoContactFirstName || ""
                            }
                            readOnly={!isEditing}
                            onChange={(e) =>
                              updateForeclosureSale(
                                "reoContactFirstName",
                                e.target.value
                              )
                            }
                          />
                          {fieldErrors["foreclosureSale.reoContactFirstName"] && (
                            <div className="text-danger small mt-1">
                              {fieldErrors["foreclosureSale.reoContactFirstName"]}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">
                            REO Contact Last Name {isMortgageeInvestor ? "*" : ""}
                            {isMortgageeInvestor && (
                              <span className="text-muted small ms-1">(If Mortgagee/Investor)</span>
                            )}
                          </label>
                          <input
                            type="text"
                            className={`form-control ${
                              fieldErrors["foreclosureSale.reoContactLastName"]
                                ? "is-invalid"
                                : ""
                            }`}
                            value={
                              formData.foreclosureSale?.reoContactLastName || ""
                            }
                            readOnly={!isEditing}
                            onChange={(e) =>
                              updateForeclosureSale(
                                "reoContactLastName",
                                e.target.value
                              )
                            }
                          />
                          {fieldErrors["foreclosureSale.reoContactLastName"] && (
                            <div className="text-danger small mt-1">
                              {fieldErrors["foreclosureSale.reoContactLastName"]}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">
                            REO Business Phone {isMortgageeInvestor ? "*" : ""}
                            {isMortgageeInvestor && (
                              <span className="text-muted small ms-1">(If Mortgagee/Investor)</span>
                            )}
                          </label>
                          <input
                            type="text"
                            className={`form-control ${
                              fieldErrors["foreclosureSale.reoBusinessPhone"]
                                ? "is-invalid"
                                : ""
                            }`}
                            value={formData.foreclosureSale?.reoBusinessPhone || ""}
                            readOnly={!isEditing}
                            onChange={(e) =>
                              updateForeclosureSale(
                                "reoBusinessPhone",
                                e.target.value
                              )
                            }
                          />
                          {fieldErrors["foreclosureSale.reoBusinessPhone"] && (
                            <div className="text-danger small mt-1">
                              {fieldErrors["foreclosureSale.reoBusinessPhone"]}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">REO Emergency Phone</label>
                          <input
                            type="text"
                            className="form-control"
                            value={
                              formData.foreclosureSale?.reoEmergencyPhone || ""
                            }
                            readOnly={!isEditing}
                            onChange={(e) =>
                              updateForeclosureSale(
                                "reoEmergencyPhone",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
    </>
  );
};

export default ForeclosureSaleSection;
