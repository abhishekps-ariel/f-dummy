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

  const getFieldIdentifier = (fieldName) => {
    if (isMultipleMode) {
      return `${fieldName}_${index}`;
    }
    return fieldName;
  };

  const getFieldId = (fieldName) => getFieldIdentifier(fieldName);

  const getFieldName = (fieldName) => getFieldIdentifier(fieldName);

  // Render notice details section 
  const renderNoticeDetails = () => {
    if (noticeSent !== true) return null;

    return (
      <>
        <div className="col-md-6">
          <label htmlFor={getFieldId("noticeDate")} className="form-label">
            {t("petitionSteps.step6.noticeDate")} *
          </label>
          <input
            type="date"
            id={getFieldId("noticeDate")}
            name={getFieldName("noticeDate")}
            className={`form-control ${getFieldError("noticeDate") ? "is-invalid" : ""}`}
            value={noticeDate}
            onChange={(e) => updateRTCField(index, "noticeDate", e.target.value)}
          />
          {getFieldError("noticeDate") && (
            <div className="text-danger small mt-1">{getFieldError("noticeDate")}</div>
          )}
        </div>

        <div className="col-md-6">
          <label htmlFor={getFieldId("daysDelinquentAtNotice")} className="form-label">
            {t("petitionSteps.step6.daysDelinquentAtNotice")} *
          </label>
          <input
            type="number"
            id={getFieldId("daysDelinquentAtNotice")}
            name={getFieldName("daysDelinquentAtNotice")}
            min="0"
            className={`form-control ${getFieldError("daysDelinquentAtNotice") ? "is-invalid" : ""}`}
            value={
              daysDelinquentAtNotice === "" || daysDelinquentAtNotice === null || daysDelinquentAtNotice === undefined
                ? ""
                : String(Math.floor(Number(daysDelinquentAtNotice)))
            }
            onChange={(e) => updateRTCField(index, "daysDelinquentAtNotice", e.target.value === "" ? "" : Number(e.target.value))}
          />
          {getFieldError("daysDelinquentAtNotice") && (
            <div className="text-danger small mt-1">{getFieldError("daysDelinquentAtNotice")}</div>
          )}
        </div>

        <div className="col-md-6">
          <label htmlFor={getFieldId("amountInDefault")} className="form-label">
            {t("petitionSteps.step6.amountInDefault")} *
          </label>
          <input
            type="text"
            id={getFieldId("amountInDefault")}
            name={getFieldName("amountInDefault")}
            className={`form-control ${getFieldError("amountInDefault") ? "is-invalid" : ""}`}
            value={formatCurrencyDisplay(amountInDefault)}
            onChange={(e) => {
              const cleanedValue = e.target.value.replace(/[^\d.]/g, "");
              const parsedValue = cleanedValue === "" ? 0 : Number.parseFloat(cleanedValue) || 0;
              updateRTCField(index, "amountInDefault", parsedValue);
            }}
          />
          {getFieldError("amountInDefault") && (
            <div className="text-danger small mt-1">{getFieldError("amountInDefault")}</div>
          )}
        </div>

        <div className="col-md-6">
          <label htmlFor={getFieldId("cureExpirationDate")} className="form-label">
            {t("petitionSteps.step6.cureExpirationDate")} *
          </label>
          <input
            type="date"
            id={getFieldId("cureExpirationDate")}
            name={getFieldName("cureExpirationDate")}
            className={`form-control ${getFieldError("cureExpirationDate") ? "is-invalid" : ""}`}
            value={cureExpirationDate}
            onChange={(e) => updateRTCField(index, "cureExpirationDate", e.target.value)}
          />
          {getFieldError("cureExpirationDate") && (
            <div className="text-danger small mt-1">{getFieldError("cureExpirationDate")}</div>
          )}
        </div>

        <div className="col-12">
          <label htmlFor={getFieldId("noticeAddressStreet1")} className="form-label">
            {t("petitionSteps.step6.noticeMailingAddress")} *
          </label>
          <div className="position-relative">
            <input
              type="text"
              id={getFieldId("noticeAddressStreet1")}
              name={getFieldName("noticeAddressStreet1")}
              className={`form-control ${
                getFieldError("noticeAddressStreet1") || noticeAddressValidationErrors.noticeAddress
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
                  setTimeout(() => setShowNoticePredictions(false), 300);
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
                <div className="spinner-border spinner-border-sm text-muted" aria-hidden="true">
                  <span className="visually-hidden">{t("common.loading")}</span>
                </div>
                <output className="visually-hidden">{t("common.loading")}</output>
              </div>
            )}
            {!isMultipleMode && showNoticePredictions && noticePredictions && noticePredictions.length > 0 && (
              <div
                className="position-absolute w-100 bg-white border border-top-0 rounded-bottom shadow-sm"
                style={{ zIndex: 1050, maxHeight: "200px", overflowY: "auto" }}
              >
                {noticePredictions.map((prediction, predIndex) => (
                  <button
                    key={prediction.place_id}
                    type="button"
                    className={`px-3 py-2 text-start w-100 ${
                      selectedNoticePredictionIndex === predIndex ? "bg-primary text-white" : "hover-bg-light"
                    }`}
                    onClick={() => handleNoticePredictionClick(prediction)}
                    style={{
                      border: "none",
                      borderBottom: "1px solid #dee2e6",
                      background: selectedNoticePredictionIndex === predIndex ? "var(--bs-primary)" : "transparent",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: "inherit",
                      color: selectedNoticePredictionIndex === predIndex ? "white" : "inherit",
                    }}
                  >
                    <div className="fw-medium">{prediction.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {getFieldError("noticeAddressStreet1") && (
            <div className="text-danger small mt-1">{getFieldError("noticeAddressStreet1")}</div>
          )}
          {!isMultipleMode && noticeAddressValidationErrors.noticeAddress && (
            <div className="text-danger small mt-1">{noticeAddressValidationErrors.noticeAddress}</div>
          )}
        </div>

        <div className="col-md-4">
          <label htmlFor={getFieldId("noticeAddressCity")} className="form-label">
            {t("petitionSteps.step6.city")} *
          </label>
          <input
            type="text"
            id={getFieldId("noticeAddressCity")}
            name={getFieldName("noticeAddressCity")}
            className={`form-control ${getFieldError("noticeAddressCity") ? "is-invalid" : ""}`}
            value={noticeAddressCity}
            onChange={(e) => updateRTCField(index, "noticeAddressCity", e.target.value)}
          />
          {getFieldError("noticeAddressCity") && (
            <div className="text-danger small mt-1">{getFieldError("noticeAddressCity")}</div>
          )}
        </div>

        <div className="col-md-4">
          <label htmlFor={getFieldId("noticeAddressState")} className="form-label">
            {t("petitionSteps.step6.state")} *
          </label>
          <input
            type="text"
            id={getFieldId("noticeAddressState")}
            name={getFieldName("noticeAddressState")}
            className={`form-control ${getFieldError("noticeAddressState") ? "is-invalid" : ""}`}
            value={noticeAddressState}
            onChange={(e) => updateRTCField(index, "noticeAddressState", e.target.value)}
          />
          {getFieldError("noticeAddressState") && (
            <div className="text-danger small mt-1">{getFieldError("noticeAddressState")}</div>
          )}
        </div>

        <div className="col-md-4">
          <label htmlFor={getFieldId("noticeAddressZip")} className="form-label">
            {t("petitionSteps.step6.zipCode")} *
          </label>
          <input
            type="text"
            id={getFieldId("noticeAddressZip")}
            name={getFieldName("noticeAddressZip")}
            className={`form-control ${getFieldError("noticeAddressZip") ? "is-invalid" : ""}`}
            value={noticeAddressZip}
            onChange={(e) => updateRTCField(index, "noticeAddressZip", e.target.value)}
          />
          {getFieldError("noticeAddressZip") && (
            <div className="text-danger small mt-1">{getFieldError("noticeAddressZip")}</div>
          )}
        </div>
      </>
    );
  };

  const renderBorrowerResponse = () => {
    if (noticeSent !== true) return null;

    return (
      <>
        <div className="col-md-6">
          <label className="form-label">{t("petitionSteps.step6.borrowerRespondedWithin30Days")} *</label>
          {getFieldError("borrowerRespondedWithin30Days") && (
            <div className="text-danger small mt-1">{getFieldError("borrowerRespondedWithin30Days")}</div>
          )}
          <div className="d-flex gap-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name={getFieldName("borrowerRespondedWithin30Days")}
                id={getFieldId("borrowerRespondedWithin30DaysYes")}
                value="yes"
                checked={borrowerRespondedWithin30Days === true}
                onChange={() => updateRTCField(index, "borrowerRespondedWithin30Days", true)}
              />
              <label className="form-check-label" htmlFor={getFieldId("borrowerRespondedWithin30DaysYes")} style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                {t("petitionSteps.step3.yes")}
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name={getFieldName("borrowerRespondedWithin30Days")}
                id={getFieldId("borrowerRespondedWithin30DaysNo")}
                value="no"
                checked={borrowerRespondedWithin30Days === false}
                onChange={() => {
                  updateRTCField(index, "borrowerRespondedWithin30Days", false);
                  updateRTCField(index, "borrowerResponseDate", "");
                }}
              />
              <label className="form-check-label" htmlFor={getFieldId("borrowerRespondedWithin30DaysNo")} style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                {t("petitionSteps.step3.no")}
              </label>
            </div>
          </div>
        </div>

        {borrowerRespondedWithin30Days === true && (
          <>
            <div className="col-md-6">
              <label htmlFor={getFieldId("borrowerResponseDate")} className="form-label">
                {t("petitionSteps.step6.borrowerResponseDate")} *
              </label>
              <input
                type="date"
                id={getFieldId("borrowerResponseDate")}
                name={getFieldName("borrowerResponseDate")}
                className={`form-control ${getFieldError("borrowerResponseDate") ? "is-invalid" : ""}`}
                value={borrowerResponseDate}
                onChange={(e) => updateRTCField(index, "borrowerResponseDate", e.target.value)}
              />
              {getFieldError("borrowerResponseDate") && (
                <div className="text-danger small mt-1">{getFieldError("borrowerResponseDate")}</div>
              )}
            </div>

            <div className="col-md-6">
              <label className="form-label">{t("petitionSteps.step6.proceededWithRightToCure")} *</label>
              {getFieldError("proceededWithRightToCure") && (
                <div className="text-danger small mt-1">{getFieldError("proceededWithRightToCure")}</div>
              )}
              <div className="d-flex gap-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name={getFieldName("proceededWithRightToCure")}
                    id={getFieldId("proceededWithRightToCureYes")}
                    value="yes"
                    checked={proceededWithRightToCure === true}
                    onChange={() => updateRTCField(index, "proceededWithRightToCure", true)}
                  />
                  <label className="form-check-label" htmlFor={getFieldId("proceededWithRightToCureYes")} style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                    {t("petitionSteps.step3.yes")}
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name={getFieldName("proceededWithRightToCure")}
                    id={getFieldId("proceededWithRightToCureNo")}
                    value="no"
                    checked={proceededWithRightToCure === false}
                    onChange={() => updateRTCField(index, "proceededWithRightToCure", false)}
                  />
                  <label className="form-check-label" htmlFor={getFieldId("proceededWithRightToCureNo")} style={{ fontSize: '13px', fontWeight: '500', color: '#333' }}>
                    {t("petitionSteps.step3.no")}
                  </label>
                </div>
              </div>
            </div>
          </>
        )}
      </>
    );
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
                onChange={() => updateRTCField(index, "noticeSent", true)}
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
                onChange={() => updateRTCField(index, "noticeSent", false)}
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

        {renderNoticeDetails()}

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

        {renderBorrowerResponse()}
      </div>
    </div>
  );
};

const Step6RightToCure = ({
  formData,
  fieldErrors,
  setFormData,
  setFieldErrors,
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
  
  // Validation helper functions
  const validateNoticeDate = (fieldValue) => {
    if (!fieldValue?.trim()) return null;
    const noticeDate = new Date(fieldValue);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!Number.isNaN(noticeDate.getTime()) && noticeDate >= today) {
      return t("petitionSteps.step6.validation.noticeDateMustBeInPast");
    }
    return null;
  };
  
  const validateCureExpirationDate = (fieldValue, currentRTCData) => {
    if (!fieldValue?.trim()) return null;
    const noticeDate = currentRTCData?.noticeDate ?? formData?.noticeDate;
    if (!noticeDate?.trim()) return null;
    
    const noticeDateObj = new Date(noticeDate);
    const cureExpirationDate = new Date(fieldValue);
    
    if (!Number.isNaN(noticeDateObj.getTime()) && !Number.isNaN(cureExpirationDate.getTime())) {
      if (cureExpirationDate <= noticeDateObj) {
        return t("petitionSteps.step6.validation.cureExpirationDateMustBeAfterNoticeDate");
      }
    }
    return null;
  };
  
  const validateAccelerationDate = (fieldValue) => {
    if (!fieldValue?.trim()) return null;
    const accelerationDate = new Date(fieldValue);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!Number.isNaN(accelerationDate.getTime()) && accelerationDate >= today) {
      return t("petitionSteps.step6.validation.accelerationDateMustBeInPast");
    }
    return null;
  };
  
  const validateAmountInDefault = (fieldValue) => {
    const amount = Number.parseFloat(fieldValue) || 0;
    if (amount <= 0) {
      return t("petitionSteps.step6.validation.amountInDefaultMustBeGreaterThanZero");
    }
    return null;
  };
  
  const validateDaysDelinquent = (fieldValue) => {
    const days = fieldValue === "" || fieldValue === null || fieldValue === undefined 
      ? null 
      : Number.parseInt(fieldValue, 10);
    if (days !== null && (Number.isNaN(days) || days < 0)) {
      return t("petitionSteps.step6.validation.daysDelinquentMustBeZeroOrGreater");
    }
    return null;
  };
  
  const validateBorrowerResponseDate = (fieldValue, currentRTCData) => {
    if (!fieldValue?.trim()) return null;
    const noticeDate = currentRTCData?.noticeDate ?? formData?.noticeDate;
    if (!noticeDate?.trim()) return null;
    
    const noticeDateObj = new Date(noticeDate);
    const responseDate = new Date(fieldValue);
    
    if (!Number.isNaN(noticeDateObj.getTime()) && !Number.isNaN(responseDate.getTime())) {
      noticeDateObj.setHours(0, 0, 0, 0);
      responseDate.setHours(0, 0, 0, 0);
      
      if (responseDate < noticeDateObj) {
        return t("petitionSteps.step6.validation.borrowerResponseDateMustBeOnOrAfterNoticeDate");
      }
    }
    return null;
  };
  
  const validateField = (fieldName, fieldValue, currentRTCData) => {
    const validationMap = {
      noticeDate: () => validateNoticeDate(fieldValue),
      cureExpirationDate: () => validateCureExpirationDate(fieldValue, currentRTCData),
      manualOverrideReason: () => validateAccelerationDate(fieldValue),
      amountInDefault: () => validateAmountInDefault(fieldValue),
      daysDelinquentAtNotice: () => validateDaysDelinquent(fieldValue),
      borrowerResponseDate: () => validateBorrowerResponseDate(fieldValue, currentRTCData),
    };
    
    const validator = validationMap[fieldName];
    if (!validator) return {};
    
    const error = validator();
    return error ? { [fieldName]: error } : {};
  };
  
  const createDefaultRTC = (prevFormData, field, value) => ({
    id: null,
    noticeSent: prevFormData.noticeSent,
    noticeDate: prevFormData.noticeDate || "",
    amountInDefault: prevFormData.amountInDefault || 0,
    daysDelinquentAtNotice: prevFormData.daysDelinquentAtNotice || 0,
    cureExpirationDate: prevFormData.cureExpirationDate || "",
    noticeAddressStreet1: prevFormData.noticeAddressStreet1 || "",
    noticeAddressCity: prevFormData.noticeAddressCity || "",
    noticeAddressState: prevFormData.noticeAddressState || "",
    noticeAddressZip: prevFormData.noticeAddressZip || "",
    manualOverrideReason: prevFormData.manualOverrideReason || "",
    borrowerRespondedWithin30Days: prevFormData.borrowerRespondedWithin30Days,
    borrowerResponseDate: prevFormData.borrowerResponseDate || "",
    proceededWithRightToCure: prevFormData.proceededWithRightToCure,
    [field]: value,
  });

  // Helper function to get current RTC data
  const getCurrentRTCData = (index, field, value) => {
    if (showMultiple && rightToCures[index]) {
      return rightToCures[index];
    }
    if (rightToCures.length > 0) {
      return rightToCures[0];
    }
    return createDefaultRTC(formData, field, value);
  };

  const getErrorKey = (index, fieldName) => {
    return showMultiple ? `rightToCures.${index}.${fieldName}` : fieldName;
  };

  const setSingleFieldError = (index, errorField, errorMessage) => {
    const errorKey = getErrorKey(index, errorField);
    setFieldErrors((prev) => ({
      ...prev,
      [errorKey]: errorMessage,
    }));
  };

  const updateFieldErrors = (index, errors) => {
    Object.keys(errors).forEach(errorField => {
      setSingleFieldError(index, errorField, errors[errorField]);
    });
  };

  const clearFieldError = (index, fieldName) => {
    const errorKey = getErrorKey(index, fieldName);
    if (fieldErrors[errorKey]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const revalidateCureExpirationDate = (index, field, value, currentRTCData) => {
    if (field !== "noticeDate" || !currentRTCData.cureExpirationDate) {
      return;
    }
    
    const noticeDateObj = new Date(value);
    const cureExpirationDateObj = new Date(currentRTCData.cureExpirationDate);
    
    if (Number.isNaN(noticeDateObj.getTime()) || Number.isNaN(cureExpirationDateObj.getTime())) {
      return;
    }
    
    const errorKey = getErrorKey(index, "cureExpirationDate");
    const errorMessage = t("petitionSteps.step6.validation.cureExpirationDateMustBeAfterNoticeDate");
    
    if (cureExpirationDateObj <= noticeDateObj) {
      setFieldErrors((prev) => ({
        ...prev,
        [errorKey]: errorMessage,
      }));
    } else if (fieldErrors[errorKey] === errorMessage) {
      clearFieldError(index, "cureExpirationDate");
    }
  };

  const updateFormData = (index, field, value) => {
    if (showMultiple && updateRightToCure) {
      updateRightToCure(index, field, value);
      return;
    }
    
    if (rightToCures.length > 0) {
      const updateFirstRTC = (rtc, idx) => idx === 0 ? { ...rtc, [field]: value } : rtc;
      setFormData((prev) => ({
        ...prev,
        rightToCures: prev.rightToCures.map(updateFirstRTC),
      }));
    } else {
      // Initialize rightToCures array with first entry if it doesn't exist
      setFormData((prev) => {
        const newRTC = createDefaultRTC(prev, field, value);
        return {
          ...prev,
          rightToCures: [newRTC],
          [field]: value,
        };
      });
    }
  };

  const updateRTCField = (index, field, value) => {
    const currentRTCData = getCurrentRTCData(index, field, value);
    
    // Perform real-time validation
    const validationErrors = validateField(field, value, currentRTCData);
    
    // Update field errors
    if (Object.keys(validationErrors).length > 0) {
      updateFieldErrors(index, validationErrors);
    } else {
      clearFieldError(index, field);
    }
    
    revalidateCureExpirationDate(index, field, value, currentRTCData);
    
    updateFormData(index, field, value);
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
