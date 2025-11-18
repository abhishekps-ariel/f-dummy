import React from "react";

// Helper function to format currency with commas
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

const Step6RightToCure = ({
  formData,
  fieldErrors,
  setFormData,
  handleInputChange,
  handleNoticeAddressInput,
  handleNoticePredictionClick,
  noticePredictions,
  noticeAddressValidationErrors,
  isLoadingNoticePredictions,
  showNoticePredictions,
  setShowNoticePredictions,
  selectedNoticePredictionIndex,
  setSelectedNoticePredictionIndex,
}) => {
   return (
          <div>
            <h2 className="theme-color font-med mb-1">
              6. Right-to-Cure (§35A)
            </h2>

            <p className="text-muted small mb-3">
              Enter details proving the §35A notice was properly issued to the
              borrower.
            </p>

            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-bold">
                  Was the Right-to-Cure notice sent? *
                </label>

                <div className="d-flex gap-4">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      id="noticeSentYes"
                      name="noticeSent"
                      value="yes"
                      checked={formData.noticeSent === true}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, noticeSent: true }))
                      }
                    />

                    <label
                      className="form-check-label fw-medium"
                      htmlFor="noticeSentYes"
                    >
                      Yes
                    </label>
                  </div>

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      id="noticeSentNo"
                      name="noticeSent"
                      value="no"
                      checked={formData.noticeSent === false}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, noticeSent: false }))
                      }
                    />

                    <label
                      className="form-check-label fw-medium"
                      htmlFor="noticeSentNo"
                    >
                      No
                    </label>
                  </div>
                </div>

                {fieldErrors.noticeSent && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.noticeSent}
                  </div>
                )}
              </div>

              {formData.noticeSent && (
                <>
                  <div className="col-md-6">
                    <label htmlFor="noticeDate" className="form-label">
                      Notice Date *
                    </label>

                    <input
                      type="date"
                      id="noticeDate"
                      name="noticeDate"
                      className={`form-control ${
                        fieldErrors.noticeDate ? "is-invalid" : ""
                      }`}
                      value={formData.noticeDate}
                      onChange={handleInputChange}
                    />

                    {fieldErrors.noticeDate && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.noticeDate}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label
                      htmlFor="daysDelinquentAtNotice"
                      className="form-label"
                    >
                      Days Delinquent on Notice Date *
                    </label>

                    <input
                      type="number"
                      id="daysDelinquentAtNotice"
                      name="daysDelinquentAtNotice"
                      min="0"
                      className={`form-control ${
                        fieldErrors.daysDelinquentAtNotice ? "is-invalid" : ""
                      }`}
                      value={
                        formData.daysDelinquentAtNotice === "" ||
                        formData.daysDelinquentAtNotice === null ||
                        formData.daysDelinquentAtNotice === undefined
                          ? ""
                          : String(
                              Math.floor(
                                Number(formData.daysDelinquentAtNotice)
                              )
                            )
                      }
                      onChange={handleInputChange}
                    />

                    {fieldErrors.daysDelinquentAtNotice && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.daysDelinquentAtNotice}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="amountInDefault" className="form-label">
                      Amount in Default ($) *
                    </label>

                    <input
                      type="text"
                      id="amountInDefault"
                      name="amountInDefault"
                      className={`form-control ${
                        fieldErrors.amountInDefault ? "is-invalid" : ""
                      }`}
                      value={formatCurrencyDisplay(formData.amountInDefault)}
                      onChange={handleInputChange}
                    />

                    {fieldErrors.amountInDefault && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.amountInDefault}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="cureExpirationDate" className="form-label">
                      Cure Expiration Date *
                    </label>

                    <input
                      type="date"
                      id="cureExpirationDate"
                      name="cureExpirationDate"
                      className={`form-control ${
                        fieldErrors.cureExpirationDate ? "is-invalid" : ""
                      }`}
                      value={formData.cureExpirationDate}
                      onChange={handleInputChange}
                    />

                    {fieldErrors.cureExpirationDate && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.cureExpirationDate}
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <label
                      htmlFor="noticeAddressStreet1"
                      className="form-label"
                    >
                      Notice Mailing Address *
                    </label>

                    <div className="position-relative">
                      <input
                        type="text"
                        id="noticeAddressStreet1"
                        name="noticeAddressStreet1"
                        className={`form-control ${
                          fieldErrors.noticeAddressStreet1 ||
                          noticeAddressValidationErrors.noticeAddress
                            ? "is-invalid"
                            : ""
                        }`}
                        value={formData.noticeAddressStreet1}
                        onChange={(e) => {
                          handleInputChange(e);

                          handleNoticeAddressInput(e.target.value);
                        }}
                        onBlur={() => {
                          setTimeout(
                            () => setShowNoticePredictions(false),
                            300
                          );
                        }}
                        onFocus={() => {
                          if (
                            noticePredictions &&
                            noticePredictions.length > 0
                          ) {
                            setShowNoticePredictions(true);
                          }
                        }}
                        placeholder="Street address"
                        autoComplete="off"
                      />

                      {/* Loading indicator */}

                      {isLoadingNoticePredictions && (
                        <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                          <div
                            className="spinner-border spinner-border-sm text-primary"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      )}

                      {/* Predictions dropdown */}

                      {showNoticePredictions &&
                        noticePredictions &&
                        noticePredictions.length > 0 && (
                          <div
                            className="position-absolute w-100 bg-white border rounded shadow-lg"
                            style={{ zIndex: 1000, top: "100%" }}
                          >
                            {noticePredictions.map((prediction, index) => (
                              <div
                                key={prediction.place_id}
                                className="p-2 cursor-pointer hover-bg-light"
                                style={{
                                  backgroundColor:
                                    selectedNoticePredictionIndex === index
                                      ? "#f8f9fa"
                                      : "transparent",

                                  cursor: "pointer",
                                }}
                                onClick={() =>
                                  handleNoticePredictionClick(prediction)
                                }
                                onMouseEnter={() =>
                                  setSelectedNoticePredictionIndex(index)
                                }
                              >
                                <div className="d-flex align-items-center">
                                  <i className="fas fa-map-marker-alt text-muted me-2"></i>

                                  <div>
                                    <div className="fw-medium">
                                      {
                                        prediction.structured_formatting
                                          .main_text
                                      }
                                    </div>

                                    <div className="text-muted small">
                                      {
                                        prediction.structured_formatting
                                          .secondary_text
                                      }
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>

                    {fieldErrors.noticeAddressStreet1 && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.noticeAddressStreet1}
                      </div>
                    )}

                    {noticeAddressValidationErrors.noticeAddress && (
                      <div className="text-danger small mt-1">
                        {noticeAddressValidationErrors.noticeAddress}
                      </div>
                    )}
                  </div>

                  <div className="col-md-4">
                    <label htmlFor="noticeAddressCity" className="form-label">
                      City *
                    </label>

                    <input
                      type="text"
                      id="noticeAddressCity"
                      name="noticeAddressCity"
                      className={`form-control ${
                        fieldErrors.noticeAddressCity ? "is-invalid" : ""
                      }`}
                      value={formData.noticeAddressCity}
                      onChange={handleInputChange}
                    />

                    {fieldErrors.noticeAddressCity && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.noticeAddressCity}
                      </div>
                    )}
                  </div>

                  <div className="col-md-4">
                    <label htmlFor="noticeAddressState" className="form-label">
                      State *
                    </label>

                    <input
                      type="text"
                      id="noticeAddressState"
                      name="noticeAddressState"
                      className={`form-control ${
                        fieldErrors.noticeAddressState ? "is-invalid" : ""
                      }`}
                      value={formData.noticeAddressState}
                      onChange={handleInputChange}
                    />

                    {fieldErrors.noticeAddressState && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.noticeAddressState}
                      </div>
                    )}
                  </div>

                  <div className="col-md-4">
                    <label htmlFor="noticeAddressZip" className="form-label">
                      ZIP Code *
                    </label>

                    <input
                      type="text"
                      id="noticeAddressZip"
                      name="noticeAddressZip"
                      className={`form-control ${
                        fieldErrors.noticeAddressZip ? "is-invalid" : ""
                      }`}
                      value={formData.noticeAddressZip}
                      onChange={handleInputChange}
                    />

                    {fieldErrors.noticeAddressZip && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.noticeAddressZip}
                      </div>
                    )}
                  </div>
                </>
              )}

              {formData.noticeSent === false && (
                <div className="col-12">
                  <label htmlFor="manualOverrideReason" className="form-label">
                    Acceleration Date *
                  </label>

                  <input
                    type="date"
                    id="manualOverrideReason"
                    name="manualOverrideReason"
                    className={`form-control ${
                      fieldErrors.manualOverrideReason ? "is-invalid" : ""
                    }`}
                    value={formData.manualOverrideReason}
                    onChange={handleInputChange}
                  />

                  {fieldErrors.manualOverrideReason && (
                    <div className="text-danger small mt-1">
                      {fieldErrors.manualOverrideReason}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
};

export default Step6RightToCure;
