import React from "react";

const Step7Form35BCompliance = ({
  formData,
  setFormData,
  fieldErrors,
}) => {
  return (
          <div>
            <h2 className="theme-color font-med mb-1">
              7. Form 35B Compliance
            </h2>

            <p className="text-muted small mb-3">
              Determine if this loan qualifies as a "certain mortgage loan" and
              upload the appropriate affidavit.
            </p>

            <div className="alert alert-info small" role="alert">
              <strong>Examples of "Certain Mortgage Loans"</strong> include
              Interest-Only Mortgages, Payment-Option or Negative Amortization
              Loans, High Loan-to-Value Mortgages (e.g., 90%+ with limited
              documentation), Low-Doc / No-Doc Mortgages, and Subprime Loans.
            </div>

            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-bold">
                  Does this loan qualify as a "certain mortgage loan"? *
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
                    />

                    <label
                      className="form-check-label fw-medium"
                      htmlFor="certainMortgageLoanYes"
                    >
                      Yes
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
                    />

                    <label
                      className="form-check-label fw-medium"
                      htmlFor="certainMortgageLoanNo"
                    >
                      No
                    </label>
                  </div>
                </div>

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
