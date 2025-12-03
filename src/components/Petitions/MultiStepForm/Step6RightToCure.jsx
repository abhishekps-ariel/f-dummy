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
  setFieldErrors,
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
  // Handle rightToCures array format (new) or single-object format (old) for backward compatibility
  const rightToCures = formData.rightToCures || [];
  const currentRTC = rightToCures.length > 0 ? rightToCures[0] : {
    noticeSent: formData.noticeSent,
    noticeDate: formData.noticeDate || "",
    amountInDefault: formData.amountInDefault || 0,
    daysDelinquentAtNotice: formData.daysDelinquentAtNotice || 0,
    cureExpirationDate: formData.cureExpirationDate || "",
    noticeAddressStreet1: formData.noticeAddressStreet1 || "",
    noticeAddressCity: formData.noticeAddressCity || "",
    noticeAddressState: formData.noticeAddressState || "",
    noticeAddressZip: formData.noticeAddressZip || "",
    manualOverrideReason: formData.manualOverrideReason || "",
    borrowerRespondedWithin30Days: formData.borrowerRespondedWithin30Days,
    borrowerResponseDate: formData.borrowerResponseDate || "",
    proceededWithRightToCure: formData.proceededWithRightToCure,
  };

  // Helper to update rightToCures array or fallback to single-object format with real-time validation
  const updateRTCField = (field, value) => {
    // Real-time validation
    const validateField = (fieldName, fieldValue, currentRTCData) => {
      const errors = {};
      
      // Validate notice date - must be in the past
      if (fieldName === "noticeDate" && fieldValue && fieldValue.trim()) {
        const noticeDate = new Date(fieldValue);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (!isNaN(noticeDate.getTime())) {
          if (noticeDate >= today) {
            errors.noticeDate = "Notice Date must be in the past";
          }
        }
      }
      
      // Validate cure expiration date - must be after notice date
      if (fieldName === "cureExpirationDate" && fieldValue && fieldValue.trim()) {
        const noticeDate = currentRTCData.noticeDate || formData.noticeDate;
        if (noticeDate && noticeDate.trim()) {
          const noticeDateObj = new Date(noticeDate);
          const cureExpirationDate = new Date(fieldValue);
          
          if (!isNaN(noticeDateObj.getTime()) && !isNaN(cureExpirationDate.getTime())) {
            if (cureExpirationDate <= noticeDateObj) {
              errors.cureExpirationDate = "Cure Expiration Date must be after Notice Date";
            }
          }
        }
      }
      
      // Validate acceleration date (manualOverrideReason) - must be in the past
      if (fieldName === "manualOverrideReason" && fieldValue && fieldValue.trim()) {
        const accelerationDate = new Date(fieldValue);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (!isNaN(accelerationDate.getTime())) {
          if (accelerationDate >= today) {
            errors.manualOverrideReason = "Acceleration Date must be in the past";
          }
        }
      }
      
      // Validate amount in default - must be greater than 0
      if (fieldName === "amountInDefault") {
        const amount = parseFloat(fieldValue) || 0;
        if (amount <= 0) {
          errors.amountInDefault = "Amount in default must be greater than 0";
        }
      }
      
      // Validate days delinquent - must be 0 or greater
      if (fieldName === "daysDelinquentAtNotice") {
        const days = fieldValue === "" || fieldValue === null || fieldValue === undefined 
          ? null 
          : parseInt(fieldValue, 10);
        if (days !== null && (isNaN(days) || days < 0)) {
          errors.daysDelinquentAtNotice = "Days delinquent must be 0 or greater";
        }
      }
      
      // Validate borrower response date - must be on or after notice date
      if (fieldName === "borrowerResponseDate" && fieldValue && fieldValue.trim()) {
        const noticeDate = currentRTCData.noticeDate || formData.noticeDate;
        if (noticeDate && noticeDate.trim()) {
          const noticeDateObj = new Date(noticeDate);
          const responseDate = new Date(fieldValue);
          
          if (!isNaN(noticeDateObj.getTime()) && !isNaN(responseDate.getTime())) {
            // Set time to midnight for accurate date comparison
            noticeDateObj.setHours(0, 0, 0, 0);
            responseDate.setHours(0, 0, 0, 0);
            
            if (responseDate < noticeDateObj) {
              errors.borrowerResponseDate = "Borrower Response Date must be on or after Notice Date";
            }
          }
        }
      }
      
      return errors;
    };
    
    // Get current RTC data for validation
    const currentRTCData = rightToCures.length > 0 ? rightToCures[0] : {
      noticeSent: formData.noticeSent,
      noticeDate: formData.noticeDate || "",
      amountInDefault: formData.amountInDefault || 0,
      daysDelinquentAtNotice: formData.daysDelinquentAtNotice || 0,
      cureExpirationDate: formData.cureExpirationDate || "",
      noticeAddressStreet1: formData.noticeAddressStreet1 || "",
      noticeAddressCity: formData.noticeAddressCity || "",
      noticeAddressState: formData.noticeAddressState || "",
      noticeAddressZip: formData.noticeAddressZip || "",
      manualOverrideReason: formData.manualOverrideReason || "",
      borrowerRespondedWithin30Days: formData.borrowerRespondedWithin30Days,
      borrowerResponseDate: formData.borrowerResponseDate || "",
      proceededWithRightToCure: formData.proceededWithRightToCure,
      [field]: value,
    };
    
    // Perform real-time validation
    const validationErrors = validateField(field, value, currentRTCData);
    
    // Update field errors
    Object.keys(validationErrors).forEach(errorField => {
      setFieldErrors((prev) => ({
        ...prev,
        [errorField]: validationErrors[errorField],
      }));
    });
    
    // Clear error if validation passes
    if (Object.keys(validationErrors).length === 0 && fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Also re-validate cure expiration date when notice date changes
    if (field === "noticeDate" && currentRTCData.cureExpirationDate) {
      const noticeDateObj = new Date(value);
      const cureExpirationDateObj = new Date(currentRTCData.cureExpirationDate);
      if (!isNaN(noticeDateObj.getTime()) && !isNaN(cureExpirationDateObj.getTime())) {
        if (cureExpirationDateObj <= noticeDateObj) {
          setFieldErrors((prev) => ({
            ...prev,
            cureExpirationDate: "Cure Expiration Date must be after Notice Date",
          }));
        } else if (fieldErrors.cureExpirationDate === "Cure Expiration Date must be after Notice Date") {
          setFieldErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.cureExpirationDate;
            return newErrors;
          });
        }
      }
    }
    
    if (rightToCures.length > 0) {
      // Update array format
      setFormData((prev) => ({
        ...prev,
        rightToCures: prev.rightToCures.map((rtc, idx) =>
          idx === 0 ? { ...rtc, [field]: value } : rtc
        ),
      }));
    } else {
      // Initialize rightToCures array with first entry if it doesn't exist
      setFormData((prev) => {
        const newRTC = {
          id: null,
          noticeSent: prev.noticeSent,
          noticeDate: prev.noticeDate || "",
          amountInDefault: prev.amountInDefault || 0,
          daysDelinquentAtNotice: prev.daysDelinquentAtNotice || 0,
          cureExpirationDate: prev.cureExpirationDate || "",
          noticeAddressStreet1: prev.noticeAddressStreet1 || "",
          noticeAddressCity: prev.noticeAddressCity || "",
          noticeAddressState: prev.noticeAddressState || "",
          noticeAddressZip: prev.noticeAddressZip || "",
          manualOverrideReason: prev.manualOverrideReason || "",
          borrowerRespondedWithin30Days: prev.borrowerRespondedWithin30Days,
          borrowerResponseDate: prev.borrowerResponseDate || "",
          proceededWithRightToCure: prev.proceededWithRightToCure,
          [field]: value,
        };
        return {
          ...prev,
          rightToCures: [newRTC],
          [field]: value, // Keep for backward compatibility
        };
      });
    }
  };

  const noticeSent = currentRTC.noticeSent;
  const noticeDate = currentRTC.noticeDate || "";
  const amountInDefault = currentRTC.amountInDefault || 0;
  const daysDelinquentAtNotice = currentRTC.daysDelinquentAtNotice || 0;
  const cureExpirationDate = currentRTC.cureExpirationDate || "";
  const noticeAddressStreet1 = currentRTC.noticeAddressStreet1 || "";
  const noticeAddressCity = currentRTC.noticeAddressCity || "";
  const noticeAddressState = currentRTC.noticeAddressState || "";
  const noticeAddressZip = currentRTC.noticeAddressZip || "";
  const manualOverrideReason = currentRTC.manualOverrideReason || "";
  const borrowerRespondedWithin30Days = currentRTC.borrowerRespondedWithin30Days;
  const borrowerResponseDate = currentRTC.borrowerResponseDate || "";
  const proceededWithRightToCure = currentRTC.proceededWithRightToCure;

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
                      checked={noticeSent === true}
                      onChange={(e) => updateRTCField("noticeSent", true)}
                    />

                    <label
                      className="form-check-label fw-medium"
                      htmlFor="noticeSentYes"
                      style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}
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
                      checked={noticeSent === false}
                      onChange={(e) => updateRTCField("noticeSent", false)}
                    />

                    <label
                      className="form-check-label fw-medium"
                      htmlFor="noticeSentNo"
                      style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}
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

              {noticeSent === true && (
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
                      value={noticeDate}
                      onChange={(e) => updateRTCField("noticeDate", e.target.value)}
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
                        daysDelinquentAtNotice === "" ||
                        daysDelinquentAtNotice === null ||
                        daysDelinquentAtNotice === undefined
                          ? ""
                          : String(
                              Math.floor(
                                Number(daysDelinquentAtNotice)
                              )
                            )
                      }
                      onChange={(e) => updateRTCField("daysDelinquentAtNotice", e.target.value === "" ? "" : Number(e.target.value))}
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
                      value={formatCurrencyDisplay(amountInDefault)}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d.]/g, "");
                        updateRTCField("amountInDefault", value === "" ? 0 : parseFloat(value) || 0);
                      }}
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
                      value={cureExpirationDate}
                      onChange={(e) => updateRTCField("cureExpirationDate", e.target.value)}
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
                        value={noticeAddressStreet1}
                        onChange={(e) => {
                          updateRTCField("noticeAddressStreet1", e.target.value);
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
                      value={noticeAddressCity}
                      onChange={(e) => updateRTCField("noticeAddressCity", e.target.value)}
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
                      value={noticeAddressState}
                      onChange={(e) => updateRTCField("noticeAddressState", e.target.value)}
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
                      value={noticeAddressZip}
                      onChange={(e) => updateRTCField("noticeAddressZip", e.target.value)}
                    />

                    {fieldErrors.noticeAddressZip && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.noticeAddressZip}
                      </div>
                    )}
                  </div>
                </>
              )}

              {noticeSent === false && (
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
                    value={manualOverrideReason}
                    onChange={(e) => updateRTCField("manualOverrideReason", e.target.value)}
                  />

                  {fieldErrors.manualOverrideReason && (
                    <div className="text-danger small mt-1">
                      {fieldErrors.manualOverrideReason}
                    </div>
                  )}
                </div>
              )}

              {/* Borrower Response Fields - Moved to Bottom */}
              {noticeSent === true && (
                <>
                  <div className="col-md-6">
                    <label className="form-label">
                      Did the borrower respond to the notice within 30 days? *
                    </label>
                    {fieldErrors.borrowerRespondedWithin30Days && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.borrowerRespondedWithin30Days}
                      </div>
                    )}
                    <div className="d-flex gap-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="borrowerRespondedWithin30Days"
                          id="borrowerRespondedWithin30DaysYes"
                          value="yes"
                          checked={borrowerRespondedWithin30Days === true}
                          onChange={(e) => {
                            updateRTCField("borrowerRespondedWithin30Days", true);
                          }}
                        />
                        <label className="form-check-label" htmlFor="borrowerRespondedWithin30DaysYes" style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                          Yes
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="borrowerRespondedWithin30Days"
                          id="borrowerRespondedWithin30DaysNo"
                          value="no"
                          checked={borrowerRespondedWithin30Days === false}
                          onChange={(e) => {
                            updateRTCField("borrowerRespondedWithin30Days", false);
                            updateRTCField("borrowerResponseDate", "");
                          }}
                        />
                        <label className="form-check-label" htmlFor="borrowerRespondedWithin30DaysNo" style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                          No
                        </label>
                      </div>
                    </div>
                  </div>

                  {borrowerRespondedWithin30Days === true && (
                    <>
                      <div className="col-md-6">
                        <label htmlFor="borrowerResponseDate" className="form-label">
                          Date on which the borrower responded *
                        </label>
                        <input
                          type="date"
                          id="borrowerResponseDate"
                          name="borrowerResponseDate"
                          className={`form-control ${
                            fieldErrors.borrowerResponseDate ? "is-invalid" : ""
                          }`}
                          value={borrowerResponseDate}
                          onChange={(e) => updateRTCField("borrowerResponseDate", e.target.value)}
                        />
                        {fieldErrors.borrowerResponseDate && (
                          <div className="text-danger small mt-1">
                            {fieldErrors.borrowerResponseDate}
                          </div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">
                          Did the borrower proceed with the right to cure? *
                        </label>
                        {fieldErrors.proceededWithRightToCure && (
                          <div className="text-danger small mt-1">
                            {fieldErrors.proceededWithRightToCure}
                          </div>
                        )}
                        <div className="d-flex gap-3">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="proceededWithRightToCure"
                              id="proceededWithRightToCureYes"
                              value="yes"
                              checked={proceededWithRightToCure === true}
                              onChange={(e) => updateRTCField("proceededWithRightToCure", true)}
                            />
                            <label className="form-check-label" htmlFor="proceededWithRightToCureYes" style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                              Yes
                            </label>
                          </div>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="proceededWithRightToCure"
                              id="proceededWithRightToCureNo"
                              value="no"
                              checked={proceededWithRightToCure === false}
                              onChange={(e) => updateRTCField("proceededWithRightToCure", false)}
                            />
                            <label className="form-check-label" htmlFor="proceededWithRightToCureNo" style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                              No
                            </label>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        );
};

export default Step6RightToCure;
