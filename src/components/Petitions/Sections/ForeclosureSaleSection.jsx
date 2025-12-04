import React from "react";
import { useTranslation } from "react-i18next";
import CustomDropdown from "../../shared/CustomDropdown";

const ForeclosureSaleSection = ({
    SectionHeader,
  formData,
  petition,
  isEditing,
  fieldErrors,
  foreclosureSaleSectionRef,
  getBuyerTypes,
  getForeclosureAlternativeOptions,
  findOptionByValue,
  updateForeclosureSale,
}) => {
  const { t } = useTranslation();
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
              <SectionHeader title={t("petitionTabContent.foreclosureSale")} />
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
                          <label className="form-label">{t("petitionTabContent.saleDate")} *</label>
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
                          <label className="form-label">{t("petitionTabContent.soldToQuestion")} *</label>
                          {isEditing ? (
                            <CustomDropdown
                              name="soldToId"
                              value={formData.foreclosureSale?.soldToId || ""}
                              onChange={(e) =>
                                updateForeclosureSale("soldToId", e.target.value)
                              }
                              placeholder={t("petitionTabContent.select")}
                              disabled={!isEditing}
                              error={!!fieldErrors["foreclosureSale.soldToId"]}
                              options={[
                                { value: "", label: t("petitionTabContent.select") },
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
                            {t("petitionTabContent.vestingEntityName")} {isMortgageeInvestor ? "*" : ""}
                            {isMortgageeInvestor && (
                              <span className="text-muted small ms-1">{t("petitionTabContent.ifMortgageeInvestor")}</span>
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
                          <label className="form-label">{t("petitionTabContent.reoEntityName")}</label>
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
                            {t("petitionTabContent.reoContactFirstName")} {isMortgageeInvestor ? "*" : ""}
                            {isMortgageeInvestor && (
                              <span className="text-muted small ms-1">{t("petitionTabContent.ifMortgageeInvestor")}</span>
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
                            {t("petitionTabContent.reoContactLastName")} {isMortgageeInvestor ? "*" : ""}
                            {isMortgageeInvestor && (
                              <span className="text-muted small ms-1">{t("petitionTabContent.ifMortgageeInvestor")}</span>
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
                            {t("petitionTabContent.reoBusinessPhone")} {isMortgageeInvestor ? "*" : ""}
                            {isMortgageeInvestor && (
                              <span className="text-muted small ms-1">{t("petitionTabContent.ifMortgageeInvestor")}</span>
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
                          <label className="form-label">{t("petitionTabContent.reoEmergencyPhone")}</label>
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

                      {/* Foreclosure Alternative Fields */}
                      <div className="col-12">
                        <div className="form-group mb-3">
                          <label className="form-label">{t("petitionTabContent.requestedAlternativeToForeclosure")} *</label>
                          {fieldErrors["foreclosureSale.requestedAlternativeToForeclosure"] && (
                            <div className="text-danger small mt-1">
                              {fieldErrors["foreclosureSale.requestedAlternativeToForeclosure"]}
                            </div>
                          )}
                          {isEditing ? (
                            <CustomDropdown
                              name="requestedAlternativeToForeclosure"
                              value={
                                formData.foreclosureSale?.requestedAlternativeToForeclosure === null
                                  ? ""
                                  : formData.foreclosureSale?.requestedAlternativeToForeclosure
                                  ? "true"
                                  : "false"
                              }
                              onChange={(e) => {
                                const value =
                                  e.target.value === "true"
                                    ? true
                                    : e.target.value === "false"
                                    ? false
                                    : null;
                                updateForeclosureSale("requestedAlternativeToForeclosure", value);
                                if (value === false) {
                                  updateForeclosureSale("foreclosureAlternativeOption", null);
                                }
                              }}
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
                              value={formData.foreclosureSale?.requestedAlternativeToForeclosure === true ? t("petitionTabContent.yes") : formData.foreclosureSale?.requestedAlternativeToForeclosure === false ? t("petitionTabContent.no") : ""}
                              readOnly
                            />
                          )}
                        </div>
                      </div>

                      {formData.foreclosureSale?.requestedAlternativeToForeclosure === true && (
                        <div className="col-12">
                          <div className="form-group mb-3">
                            <label className="form-label">{t("petitionTabContent.foreclosureAlternativeOption")} *</label>
                            {isEditing ? (
                              <CustomDropdown
                                name="foreclosureAlternativeOption"
                                value={formData.foreclosureSale?.foreclosureAlternativeOption || ""}
                                onChange={(e) =>
                                  updateForeclosureSale("foreclosureAlternativeOption", e.target.value)
                                }
                                placeholder={t("petitionTabContent.selectAlternativeOption")}
                                disabled={!isEditing}
                                error={!!fieldErrors["foreclosureSale.foreclosureAlternativeOption"]}
                                options={[
                                  { value: "", label: t("petitionTabContent.selectAlternativeOption") },
                                  ...(getForeclosureAlternativeOptions ? getForeclosureAlternativeOptions().map((option) => ({
                                    value: option.value || option.id,
                                    label: option.description || option.name,
                                  })) : []),
                                ]}
                              />
                            ) : (
                              <input
                                type="text"
                                className="form-control"
                                value={
                                  (() => {
                                    const options = getForeclosureAlternativeOptions ? getForeclosureAlternativeOptions() : [];
                                    const selected = options.find(opt => (opt.value || opt.id) === formData.foreclosureSale?.foreclosureAlternativeOption);
                                    return selected ? (selected.description || selected.name) : "";
                                  })()
                                }
                                readOnly
                              />
                            )}
                            {fieldErrors["foreclosureSale.foreclosureAlternativeOption"] && (
                              <div className="text-danger small mt-1">
                                {fieldErrors["foreclosureSale.foreclosureAlternativeOption"]}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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
