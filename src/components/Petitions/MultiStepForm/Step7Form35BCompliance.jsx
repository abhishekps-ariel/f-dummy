import React from "react";
import { useTranslation } from "react-i18next";

const Step7Form35BCompliance = ({
  formData,
  setFormData,
  fieldErrors,
  isCertainMortgageLoanReadOnly = false,
}) => {
  const { t } = useTranslation();
  // Get the list of selected checkboxes for the message
  const getSelectedCheckboxesMessage = () => {
    const selected = [];
    if (formData.variableRate) selected.push(t("petitionSteps.step3.variableRate"));
    if (formData.interestOnly) selected.push(t("petitionSteps.step3.interestOnly"));
    if (formData.negativeAmortization) selected.push(t("petitionSteps.step3.negativeAmortization"));
    
    if (selected.length === 0) return "";
    if (selected.length === 1) return `${selected[0]} ${t("petitionSteps.step7.isSelectedOnLoanDetailStep")}`;
    if (selected.length === 2) return `${selected[0]} and ${selected[1]} ${t("petitionSteps.step7.areSelectedOnLoanDetailStep")}`;
    return `${selected[0]}, ${selected[1]}, and ${selected[2]} ${t("petitionSteps.step7.areSelectedOnLoanDetailStep")}`;
  };
  return (
          <div>
            <h2 className="theme-color font-med mb-1">
              {t("petitionSteps.step7.title")}
            </h2>

            <p className="text-muted small mb-3">
              {t("petitionSteps.step7.description")}
            </p>

            <div className="alert alert-info small" role="alert">
              <strong>{t("petitionSteps.step7.examplesTitle")}</strong> {t("petitionSteps.step7.examplesText")}
            </div>

            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-bold">
                  {t("petitionSteps.step7.certainMortgageLoan")} *
                </label>

                <div className="d-flex gap-4">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      id="certainMortgageLoanYes"
                      name="certainMortgageLoan"
                      value="yes"
                      checked={formData.certainMortgageLoan === true}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          certainMortgageLoan: true,
                        }))
                      }
                      disabled={isCertainMortgageLoanReadOnly}
                    />

                    <label
                      className="form-check-label fw-medium"
                      htmlFor="certainMortgageLoanYes"
                      style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}
                    >
                      {t("petitionSteps.step3.yes")}
                    </label>
                  </div>

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      id="certainMortgageLoanNo"
                      name="certainMortgageLoan"
                      value="no"
                      checked={formData.certainMortgageLoan === false}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          certainMortgageLoan: false,
                        }))
                      }
                      disabled={isCertainMortgageLoanReadOnly}
                    />

                    <label
                      className="form-check-label fw-medium"
                      htmlFor="certainMortgageLoanNo"
                      style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}
                    >
                      {t("petitionSteps.step3.no")}
                    </label>
                  </div>
                </div>
                {isCertainMortgageLoanReadOnly && (
                  <div className="text-muted small mt-2">
                    <i className="fas fa-info-circle me-1"></i>
                    {t("petitionSteps.step7.fieldSetToYes")} {getSelectedCheckboxesMessage()}
                  </div>
                )}

                {fieldErrors.certainMortgageLoan && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.certainMortgageLoan}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
};

export default Step7Form35BCompliance;
