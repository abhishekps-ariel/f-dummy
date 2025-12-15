import React from "react";
import { useTranslation } from "react-i18next";
import { formatCurrencyDisplay } from "../../../utils/currencyUtils";

const SingleRightToCureForm = ({
  rtc,
  index,
  fieldErrors,
  updateRTCField,
  handleNoticeAddressInput,
  handleNoticePredictionClick,
  noticePredictions,
  noticeAddressValidationErrors,
  isLoadingNoticePredictions,
  showNoticePredictions,
  setShowNoticePredictions,
  selectedNoticePredictionIndex,
  setSelectedNoticePredictionIndex,
  isMultipleMode = false,
  onRemove,
  canRemove = false,
}) => {
  const { t } = useTranslation();
  const noticeSent = rtc.noticeSent;
  const noticeDate = rtc.noticeDate || "";
  const amountInDefault = rtc.amountInDefault || 0;
  const daysDelinquentAtNotice = rtc.daysDelinquentAtNotice || 0;
  const cureExpirationDate = rtc.cureExpirationDate || "";
  const noticeAddressStreet1 = rtc.noticeAddressStreet1 || "";
  const noticeAddressCity = rtc.noticeAddressCity || "";
  const noticeAddressState = rtc.noticeAddressState || "";
  const noticeAddressZip = rtc.noticeAddressZip || "";
  const manualOverrideReason = rtc.manualOverrideReason || "";
  const borrowerRespondedWithin30Days = rtc.borrowerRespondedWithin30Days;
  const borrowerResponseDate = rtc.borrowerResponseDate || "";
  const proceededWithRightToCure = rtc.proceededWithRightToCure;

  const getFieldError = (fieldName) => {
    if (isMultipleMode) {
      return fieldErrors[`rightToCures.${index}.${fieldName}`] || fieldErrors[fieldName];
    }
    return fieldErrors[fieldName];
  };

  return (
    <div className={isMultipleMode ? "p-3 border rounded bg-light mb-3" : ""}>
      {isMultipleMode && (
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-semibold text-dark mb-0">
            {t("petitionSteps.step6.rightToCure")} {index + 1}
          </h5>
          {canRemove && (
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={() => onRemove(index)}
              title={t("petitionSteps.step6.removeRightToCure")}
            >
              <i className="fas fa-trash"></i>
            </button>
          )}
        </div>
      )}

      <div className="row g-3">
        <div className="col-12">
          <label className="form-label fw-bold">
            {t("petitionSteps.step6.noticeSent")} *
          </label>

          <div className="d-flex gap-4">
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                id={isMultipleMode ? `noticeSentYes_${index}` : "noticeSentYes"}
                name={isMultipleMode ? `noticeSent_${index}` : "noticeSent"}
                value="yes"
                checked={noticeSent === true}
                onChange={(e) => updateRTCField(index, "noticeSent", true)}
              />

              <label
                className="form-check-label fw-medium"
                htmlFor={isMultipleMode ? `noticeSentYes_${index}` : "noticeSentYes"}
                style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}
              >
                {t("petitionSteps.step3.yes")}
              </label>
            </div>

            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                id={isMultipleMode ? `noticeSentNo_${index}` : "noticeSentNo"}
                name={isMultipleMode ? `noticeSent_${index}` : "noticeSent"}
                value="no"
                checked={noticeSent === false}
                onChange={(e) => updateRTCField(index, "noticeSent", false)}
              />

              <label
                className="form-check-label fw-medium"
                htmlFor={isMultipleMode ? `noticeSentNo_${index}` : "noticeSentNo"}
                style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}
              >
                {t("petitionSteps.step3.no")}
              </label>
            </div>
          </div>

          {getFieldError("noticeSent") && (
            <div className="text-danger small mt-1">
              {getFieldError("noticeSent")}
            </div>
          )}
        </div>

        {noticeSent === true && (
          <>
            <div className="col-md-6">
              <label htmlFor={isMultipleMode ? `noticeDate_${index}` : "noticeDate"} className="form-label">
                {t("petitionSteps.step6.noticeDate")} *
              </label>

              <input
                type="date"
                id={isMultipleMode ? `noticeDate_${index}` : "noticeDate"}
                name={isMultipleMode ? `noticeDate_${index}` : "noticeDate"}
                className={`form-control ${
                  getFieldError("noticeDate") ? "is-invalid" : ""
                }`}
                value={noticeDate}
                onChange={(e) => updateRTCField(index, "noticeDate", e.target.value)}
              />

              {getFieldError("noticeDate") && (
                <div className="text-danger small mt-1">
                  {getFieldError("noticeDate")}
                </div>
              )}
            </div>

            <div className="col-md-6">
              <label
                htmlFor={isMultipleMode ? `daysDelinquentAtNotice_${index}` : "daysDelinquentAtNotice"}
                className="form-label"
              >
                {t("petitionSteps.step6.daysDelinquentAtNotice")} *
              </label>

              <input
                type="number"
                id={isMultipleMode ? `daysDelinquentAtNotice_${index}` : "daysDelinquentAtNotice"}
                name={isMultipleMode ? `daysDelinquentAtNotice_${index}` : "daysDelinquentAtNotice"}
                min="0"
                className={`form-control ${
                  getFieldError("daysDelinquentAtNotice") ? "is-invalid" : ""
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
                onChange={(e) => updateRTCField(index, "daysDelinquentAtNotice", e.target.value === "" ? "" : Number(e.target.value))}
              />

              {getFieldError("daysDelinquentAtNotice") && (
                <div className="text-danger small mt-1">
                  {getFieldError("daysDelinquentAtNotice")}
                </div>
              )}
            </div>

            <div className="col-md-6">
              <label htmlFor={isMultipleMode ? `amountInDefault_${index}` : "amountInDefault"} className="form-label">
                {t("petitionSteps.step6.amountInDefault")} *
              </label>

              <input
                type="text"
                id={isMultipleMode ? `amountInDefault_${index}` : "amountInDefault"}
                name={isMultipleMode ? `amountInDefault_${index}` : "amountInDefault"}
                className={`form-control ${
                  getFieldError("amountInDefault") ? "is-invalid" : ""
                }`}
                value={formatCurrencyDisplay(amountInDefault)}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d.]/g, "");
                  updateRTCField(index, "amountInDefault", value === "" ? 0 : parseFloat(value) || 0);
                }}
              />

              {getFieldError("amountInDefault") && (
                <div className="text-danger small mt-1">
                  {getFieldError("amountInDefault")}
                </div>
              )}
            </div>

            <div className="col-md-6">
              <label htmlFor={isMultipleMode ? `cureExpirationDate_${index}` : "cureExpirationDate"} className="form-label">
                {t("petitionSteps.step6.cureExpirationDate")} *
              </label>

              <input
                type="date"
                id={isMultipleMode ? `cureExpirationDate_${index}` : "cureExpirationDate"}
                name={isMultipleMode ? `cureExpirationDate_${index}` : "cureExpirationDate"}
                className={`form-control ${
                  getFieldError("cureExpirationDate") ? "is-invalid" : ""
                }`}
                value={cureExpirationDate}
                onChange={(e) => updateRTCField(index, "cureExpirationDate", e.target.value)}
              />

              {getFieldError("cureExpirationDate") && (
                <div className="text-danger small mt-1">
                  {getFieldError("cureExpirationDate")}
                </div>
              )}
            </div>

            <div className="col-12">
              <label
                htmlFor={isMultipleMode ? `noticeAddressStreet1_${index}` : "noticeAddressStreet1"}
                className="form-label"
              >
                {t("petitionSteps.step6.noticeMailingAddress")} *
              </label>

              <div className="position-relative">
                <input
                  type="text"
                  id={isMultipleMode ? `noticeAddressStreet1_${index}` : "noticeAddressStreet1"}
                  name={isMultipleMode ? `noticeAddressStreet1_${index}` : "noticeAddressStreet1"}
                  className={`form-control ${
                    getFieldError("noticeAddressStreet1") ||
                    noticeAddressValidationErrors.noticeAddress
                      ? "is-invalid"
                      : ""
                  }`}
                  value={noticeAddressStreet1}
                  onChange={(e) => {
                    updateRTCField(index, "noticeAddressStreet1", e.target.value);
                    if (!isMultipleMode) {
                      handleNoticeAddressInput(e.target.value);
                    }
                  }}
                  onBlur={() => {
                    if (!isMultipleMode) {
                      setTimeout(
                        () => setShowNoticePredictions(false),
                        300
                      );
                    }
                  }}
                  onFocus={() => {
                    if (!isMultipleMode && noticePredictions && noticePredictions.length > 0) {
                      setShowNoticePredictions(true);
                    }
                  }}
                  placeholder={t("petitionSteps.step6.placeholderNoticeAddress")}
                  autoComplete="off"
                />

                {!isMultipleMode && isLoadingNoticePredictions && (
                  <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                    <div
                      className="spinner-border spinner-border-sm text-muted"
                      role="status"
                    >
                      <span className="visually-hidden">{t("common.loading")}</span>
                    </div>
                  </div>
                )}

                {/* Address suggestions dropdown */}
                {!isMultipleMode && showNoticePredictions &&
                  noticePredictions &&
                  noticePredictions.length > 0 && (
                    <div
                      className="position-absolute w-100 bg-white border border-top-0 rounded-bottom shadow-sm"
                      style={{
                        zIndex: 1050,
                        maxHeight: "200px",
                        overflowY: "auto",
                      }}
                    >
                      {noticePredictions.map((prediction, predIndex) => (
                        <div
                          key={prediction.place_id}
                          className={`px-3 py-2 cursor-pointer border-bottom ${
                            selectedNoticePredictionIndex === predIndex
                              ? "bg-primary text-white"
                              : "hover-bg-light"
                          }`}
                          onMouseDown={() =>
                            handleNoticePredictionClick(prediction)
                          }
                          style={{ cursor: "pointer" }}
                        >
                          <div className="fw-medium">
                            {prediction.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {getFieldError("noticeAddressStreet1") && (
                <div className="text-danger small mt-1">
                  {getFieldError("noticeAddressStreet1")}
                </div>
              )}

              {!isMultipleMode && noticeAddressValidationErrors.noticeAddress && (
                <div className="text-danger small mt-1">
                  {noticeAddressValidationErrors.noticeAddress}
                </div>
              )}
            </div>

            <div className="col-md-4">
              <label htmlFor={isMultipleMode ? `noticeAddressCity_${index}` : "noticeAddressCity"} className="form-label">
                {t("petitionSteps.step6.city")} *
              </label>

              <input
                type="text"
                id={isMultipleMode ? `noticeAddressCity_${index}` : "noticeAddressCity"}
                name={isMultipleMode ? `noticeAddressCity_${index}` : "noticeAddressCity"}
                className={`form-control ${
                  getFieldError("noticeAddressCity") ? "is-invalid" : ""
                }`}
                value={noticeAddressCity}
                onChange={(e) => updateRTCField(index, "noticeAddressCity", e.target.value)}
              />

              {getFieldError("noticeAddressCity") && (
                <div className="text-danger small mt-1">
                  {getFieldError("noticeAddressCity")}
                </div>
              )}
            </div>

            <div className="col-md-4">
              <label htmlFor={isMultipleMode ? `noticeAddressState_${index}` : "noticeAddressState"} className="form-label">
                {t("petitionSteps.step6.state")} *
              </label>

              <input
                type="text"
                id={isMultipleMode ? `noticeAddressState_${index}` : "noticeAddressState"}
                name={isMultipleMode ? `noticeAddressState_${index}` : "noticeAddressState"}
                className={`form-control ${
                  getFieldError("noticeAddressState") ? "is-invalid" : ""
                }`}
                value={noticeAddressState}
                onChange={(e) => updateRTCField(index, "noticeAddressState", e.target.value)}
              />

              {getFieldError("noticeAddressState") && (
                <div className="text-danger small mt-1">
                  {getFieldError("noticeAddressState")}
                </div>
              )}
            </div>

            <div className="col-md-4">
              <label htmlFor={isMultipleMode ? `noticeAddressZip_${index}` : "noticeAddressZip"} className="form-label">
                {t("petitionSteps.step6.zipCode")} *
              </label>

              <input
                type="text"
                id={isMultipleMode ? `noticeAddressZip_${index}` : "noticeAddressZip"}
                name={isMultipleMode ? `noticeAddressZip_${index}` : "noticeAddressZip"}
                className={`form-control ${
                  getFieldError("noticeAddressZip") ? "is-invalid" : ""
                }`}
                value={noticeAddressZip}
                onChange={(e) => updateRTCField(index, "noticeAddressZip", e.target.value)}
              />

              {getFieldError("noticeAddressZip") && (
                <div className="text-danger small mt-1">
                  {getFieldError("noticeAddressZip")}
                </div>
              )}
            </div>
          </>
        )}

        {noticeSent === false && (
          <div className="col-12">
            <label htmlFor={isMultipleMode ? `manualOverrideReason_${index}` : "manualOverrideReason"} className="form-label">
              {t("petitionSteps.step6.accelerationDate")} *
            </label>

            <input
              type="date"
              id={isMultipleMode ? `manualOverrideReason_${index}` : "manualOverrideReason"}
              name={isMultipleMode ? `manualOverrideReason_${index}` : "manualOverrideReason"}
              className={`form-control ${
                getFieldError("manualOverrideReason") ? "is-invalid" : ""
              }`}
              value={manualOverrideReason}
              onChange={(e) => updateRTCField(index, "manualOverrideReason", e.target.value)}
            />

            {getFieldError("manualOverrideReason") && (
              <div className="text-danger small mt-1">
                {getFieldError("manualOverrideReason")}
              </div>
            )}
          </div>
        )}

        {/* Borrower Response Fields */}
        {noticeSent === true && (
          <>
            <div className="col-md-6">
              <label className="form-label">
                {t("petitionSteps.step6.borrowerRespondedWithin30Days")} *
              </label>
              {getFieldError("borrowerRespondedWithin30Days") && (
                <div className="text-danger small mt-1">
                  {getFieldError("borrowerRespondedWithin30Days")}
                </div>
              )}
              <div className="d-flex gap-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name={isMultipleMode ? `borrowerRespondedWithin30Days_${index}` : "borrowerRespondedWithin30Days"}
                    id={isMultipleMode ? `borrowerRespondedWithin30DaysYes_${index}` : "borrowerRespondedWithin30DaysYes"}
                    value="yes"
                    checked={borrowerRespondedWithin30Days === true}
                    onChange={(e) => {
                      updateRTCField(index, "borrowerRespondedWithin30Days", true);
                    }}
                  />
                  <label className="form-check-label" htmlFor={isMultipleMode ? `borrowerRespondedWithin30DaysYes_${index}` : "borrowerRespondedWithin30DaysYes"} style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                    {t("petitionSteps.step3.yes")}
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name={isMultipleMode ? `borrowerRespondedWithin30Days_${index}` : "borrowerRespondedWithin30Days"}
                    id={isMultipleMode ? `borrowerRespondedWithin30DaysNo_${index}` : "borrowerRespondedWithin30DaysNo"}
                    value="no"
                    checked={borrowerRespondedWithin30Days === false}
                    onChange={(e) => {
                      updateRTCField(index, "borrowerRespondedWithin30Days", false);
                      updateRTCField(index, "borrowerResponseDate", "");
                    }}
                  />
                  <label className="form-check-label" htmlFor={isMultipleMode ? `borrowerRespondedWithin30DaysNo_${index}` : "borrowerRespondedWithin30DaysNo"} style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                    {t("petitionSteps.step3.no")}
                  </label>
                </div>
              </div>
            </div>

            {borrowerRespondedWithin30Days === true && (
              <>
                <div className="col-md-6">
                  <label htmlFor={isMultipleMode ? `borrowerResponseDate_${index}` : "borrowerResponseDate"} className="form-label">
                    {t("petitionSteps.step6.borrowerResponseDate")} *
                  </label>
                  <input
                    type="date"
                    id={isMultipleMode ? `borrowerResponseDate_${index}` : "borrowerResponseDate"}
                    name={isMultipleMode ? `borrowerResponseDate_${index}` : "borrowerResponseDate"}
                    className={`form-control ${
                      getFieldError("borrowerResponseDate") ? "is-invalid" : ""
                    }`}
                    value={borrowerResponseDate}
                    onChange={(e) => updateRTCField(index, "borrowerResponseDate", e.target.value)}
                  />
                  {getFieldError("borrowerResponseDate") && (
                    <div className="text-danger small mt-1">
                      {getFieldError("borrowerResponseDate")}
                    </div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    {t("petitionSteps.step6.proceededWithRightToCure")} *
                  </label>
                  {getFieldError("proceededWithRightToCure") && (
                    <div className="text-danger small mt-1">
                      {getFieldError("proceededWithRightToCure")}
                    </div>
                  )}
                  <div className="d-flex gap-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name={isMultipleMode ? `proceededWithRightToCure_${index}` : "proceededWithRightToCure"}
                        id={isMultipleMode ? `proceededWithRightToCureYes_${index}` : "proceededWithRightToCureYes"}
                        value="yes"
                        checked={proceededWithRightToCure === true}
                        onChange={(e) => updateRTCField(index, "proceededWithRightToCure", true)}
                      />
                      <label className="form-check-label" htmlFor={isMultipleMode ? `proceededWithRightToCureYes_${index}` : "proceededWithRightToCureYes"} style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                        {t("petitionSteps.step3.yes")}
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name={isMultipleMode ? `proceededWithRightToCure_${index}` : "proceededWithRightToCure"}
                        id={isMultipleMode ? `proceededWithRightToCureNo_${index}` : "proceededWithRightToCureNo"}
                        value="no"
                        checked={proceededWithRightToCure === false}
                        onChange={(e) => updateRTCField(index, "proceededWithRightToCure", false)}
                      />
                      <label className="form-check-label" htmlFor={isMultipleMode ? `proceededWithRightToCureNo_${index}` : "proceededWithRightToCureNo"} style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                        {t("petitionSteps.step3.no")}
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
  isTakenOverPetition = false,
  addRightToCure,
  removeRightToCure,
  updateRightToCure,
}) => {
  const rightToCures = formData.rightToCures || [];
  const showMultiple = isTakenOverPetition && rightToCures.length > 1;
  
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

  const { t } = useTranslation();
  
  const updateRTCField = (index, field, value) => {
    const validateField = (fieldName, fieldValue, currentRTCData) => {
      const errors = {};
      
      if (fieldName === "noticeDate" && fieldValue && fieldValue.trim()) {
        const noticeDate = new Date(fieldValue);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (!isNaN(noticeDate.getTime())) {
          if (noticeDate >= today) {
            errors.noticeDate = t("petitionSteps.step6.validation.noticeDateMustBeInPast");
          }
        }
      }
      
      if (fieldName === "cureExpirationDate" && fieldValue && fieldValue.trim()) {
        const noticeDate = currentRTCData.noticeDate || formData.noticeDate;
        if (noticeDate && noticeDate.trim()) {
          const noticeDateObj = new Date(noticeDate);
          const cureExpirationDate = new Date(fieldValue);
          
          if (!isNaN(noticeDateObj.getTime()) && !isNaN(cureExpirationDate.getTime())) {
            if (cureExpirationDate <= noticeDateObj) {
              errors.cureExpirationDate = t("petitionSteps.step6.validation.cureExpirationDateMustBeAfterNoticeDate");
            }
          }
        }
      }
      
      if (fieldName === "manualOverrideReason" && fieldValue && fieldValue.trim()) {
        const accelerationDate = new Date(fieldValue);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (!isNaN(accelerationDate.getTime())) {
          if (accelerationDate >= today) {
            errors.manualOverrideReason = t("petitionSteps.step6.validation.accelerationDateMustBeInPast");
          }
        }
      }
      
      if (fieldName === "amountInDefault") {
        const amount = parseFloat(fieldValue) || 0;
        if (amount <= 0) {
          errors.amountInDefault = t("petitionSteps.step6.validation.amountInDefaultMustBeGreaterThanZero");
        }
      }
      
      if (fieldName === "daysDelinquentAtNotice") {
        const days = fieldValue === "" || fieldValue === null || fieldValue === undefined 
          ? null 
          : parseInt(fieldValue, 10);
        if (days !== null && (isNaN(days) || days < 0)) {
          errors.daysDelinquentAtNotice = t("petitionSteps.step6.validation.daysDelinquentMustBeZeroOrGreater");
        }
      }
      
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
              errors.borrowerResponseDate = t("petitionSteps.step6.validation.borrowerResponseDateMustBeOnOrAfterNoticeDate");
            }
          }
        }
      }
      
      return errors;
    };
    
    // Get current RTC data for validation
    const currentRTCData = showMultiple && rightToCures[index] 
      ? rightToCures[index] 
      : rightToCures.length > 0 
        ? rightToCures[0] 
        : {
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
      const errorKey = showMultiple ? `rightToCures.${index}.${errorField}` : errorField;
      setFieldErrors((prev) => ({
        ...prev,
        [errorKey]: validationErrors[errorField],
      }));
    });
    
    // Clear error if validation passes
    if (Object.keys(validationErrors).length === 0) {
      const errorKey = showMultiple ? `rightToCures.${index}.${field}` : field;
      if (fieldErrors[errorKey]) {
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[errorKey];
          return newErrors;
        });
      }
    }
    
    // Also re-validate cure expiration date when notice date changes
    if (field === "noticeDate" && currentRTCData.cureExpirationDate) {
      const noticeDateObj = new Date(value);
      const cureExpirationDateObj = new Date(currentRTCData.cureExpirationDate);
      if (!isNaN(noticeDateObj.getTime()) && !isNaN(cureExpirationDateObj.getTime())) {
        if (cureExpirationDateObj <= noticeDateObj) {
          const errorKey = showMultiple ? `rightToCures.${index}.cureExpirationDate` : "cureExpirationDate";
          setFieldErrors((prev) => ({
            ...prev,
            [errorKey]: t("petitionSteps.step6.validation.cureExpirationDateMustBeAfterNoticeDate"),
          }));
        } else {
          const errorKey = showMultiple ? `rightToCures.${index}.cureExpirationDate` : "cureExpirationDate";
          if (fieldErrors[errorKey] === t("petitionSteps.step6.validation.cureExpirationDateMustBeAfterNoticeDate")) {
            setFieldErrors((prev) => {
              const newErrors = { ...prev };
              delete newErrors[errorKey];
              return newErrors;
            });
          }
        }
      }
    }
    
    // Use the updateRightToCure function if in multiple mode, otherwise use the old logic
    if (showMultiple && updateRightToCure) {
      updateRightToCure(index, field, value);
    } else if (rightToCures.length > 0) {
      // Update array format (single mode, but array exists)
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

  return (
    <div>
      <h2 className="theme-color font-med mb-1">
        {t("petitionSteps.step6.title")}
      </h2>

      <p className="text-muted small mb-3">
        {t("petitionSteps.step6.description")}
      </p>

      {showMultiple ? (
        // Multiple right-to-cures mode (when taking over with more than one)
        <>
          {rightToCures.map((rtc, index) => (
            <SingleRightToCureForm
              key={rtc.id || index}
              rtc={rtc}
              index={index}
              fieldErrors={fieldErrors}
              updateRTCField={updateRTCField}
              handleNoticeAddressInput={handleNoticeAddressInput}
              handleNoticePredictionClick={handleNoticePredictionClick}
              noticePredictions={noticePredictions}
              noticeAddressValidationErrors={noticeAddressValidationErrors}
              isLoadingNoticePredictions={isLoadingNoticePredictions}
              showNoticePredictions={showNoticePredictions}
              setShowNoticePredictions={setShowNoticePredictions}
              selectedNoticePredictionIndex={selectedNoticePredictionIndex}
              setSelectedNoticePredictionIndex={setSelectedNoticePredictionIndex}
              isMultipleMode={true}
              onRemove={removeRightToCure}
              canRemove={rightToCures.length > 1}
            />
          ))}

          {addRightToCure && (
            <div className="text-center">
              <button
                type="button"
                className="dashboard-btn-create"
                onClick={addRightToCure}
              >
                <i className="fas fa-plus me-2"></i>
                {t("petitionSteps.step6.addAnotherRightToCure")}
              </button>
            </div>
          )}
        </>
      ) : (
        // Single right-to-cure mode (normal behavior)
        <SingleRightToCureForm
          rtc={currentRTC}
          index={0}
          fieldErrors={fieldErrors}
          updateRTCField={updateRTCField}
          handleNoticeAddressInput={handleNoticeAddressInput}
          handleNoticePredictionClick={handleNoticePredictionClick}
          noticePredictions={noticePredictions}
          noticeAddressValidationErrors={noticeAddressValidationErrors}
          isLoadingNoticePredictions={isLoadingNoticePredictions}
          showNoticePredictions={showNoticePredictions}
          setShowNoticePredictions={setShowNoticePredictions}
              selectedNoticePredictionIndex={selectedNoticePredictionIndex}
              setSelectedNoticePredictionIndex={setSelectedNoticePredictionIndex}
          isMultipleMode={false}
        />
      )}
    </div>
  );
};

export default Step6RightToCure;
