import React from "react";
import { useTranslation } from "react-i18next";

const Step1PropertyDetails = ({
  isAddressVerified,
  loadError,
  isLoaded,
  autocompleteRef,
  fieldErrors,
  formData,
  handleInputChange,
  handleAddressInput,
  handleKeyDown,
  setShowPredictions,
  showPredictions,
  predictions,
  selectedPredictionIndex,
  selectPrediction,
  addressValidationError,
  isValidatingAddress,
  isLoadingPredictions,
}) => {
  const { t } = useTranslation();
  return (
          <div>
            <h2 className="theme-color font-med mb-1">{t("petitionSteps.step2.title")}</h2>

            <p className="text-muted small mb-3">
              {t("petitionSteps.step2.description")}
            </p>

            <div className="row g-3">
              <div className="col-12">
                <label htmlFor="propertyStreet1" className="form-label">
                  {t("petitionSteps.step2.streetAddress")} *
                  {isAddressVerified && (
                    <span className="text-success ms-2">✓ {t("petitionSteps.step2.verified")}</span>
                  )}
                </label>

                {loadError ? (
                  <div>
                    <input
                      type="text"
                      id="propertyStreet1"
                      name="propertyStreet1"
                      className={`form-control ${
                        fieldErrors.propertyStreet1 ? "is-invalid" : ""
                      }`}
                      value={formData.propertyStreet1 || ""}
                      onChange={handleInputChange}
                      placeholder={t("petitionSteps.step2.placeholderManual")}
                      autoComplete="off"
                    />

                    {fieldErrors.propertyStreet1 && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.propertyStreet1}
                      </div>
                    )}

                    <div className="text-danger small mt-1">
                      ⚠️ {t("petitionSteps.step2.googleMapsFailed")}
                    </div>
                  </div>
                ) : isLoaded ? (
                  <div className="position-relative">
                    <input
                      ref={autocompleteRef}
                      type="text"
                      id="propertyStreet1"
                      name="propertyStreet1"
                      className={`form-control ${
                        fieldErrors.propertyStreet1 ? "is-invalid" : ""
                      }`}
                      value={formData.propertyStreet1 || ""}
                      onChange={(e) => {
                        handleInputChange(e);

                        handleAddressInput(e.target.value);
                      }}
                      onKeyDown={handleKeyDown}
                      onBlur={() => {
                        // Delay hiding suggestions to allow click events

                        setTimeout(() => setShowPredictions(false), 300);
                      }}
                      onFocus={() => {
                        if (predictions.length > 0) {
                          setShowPredictions(true);
                        }
                      }}
                      placeholder={t("petitionSteps.step2.placeholder")}
                      autoComplete="off"
                    />

                    {/* Loading indicator */}

                    {isLoadingPredictions && (
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

                    {showPredictions && predictions.length > 0 && (
                      <div
                        className="position-absolute w-100 bg-white border border-top-0 rounded-bottom shadow-sm"
                        style={{
                          zIndex: 1050,
                          maxHeight: "200px",
                          overflowY: "auto",
                        }}
                      >
                        {predictions.map((prediction, index) => (
                          <div
                            key={prediction.place_id}
                            className={`px-3 py-2 cursor-pointer border-bottom ${
                              index === selectedPredictionIndex
                                ? "bg-primary text-white"
                                : "hover-bg-light"
                            }`}
                            onMouseDown={() =>
                              selectPrediction(prediction.place_id)
                            }
                            style={{ cursor: "pointer" }}
                          >
                            <div className="fw-medium">
                              {prediction.structured_formatting.main_text}
                            </div>

                            <div className="small text-muted">
                              {prediction.structured_formatting.secondary_text}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Field error display */}

                    {fieldErrors.propertyStreet1 && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.propertyStreet1}
                      </div>
                    )}

                    {/* Address validation error */}

                    {addressValidationError && (
                      <div className="text-danger small mt-2">
                        {addressValidationError}
                      </div>
                    )}

                    {/* Address validation loading */}

                    {isValidatingAddress && (
                      <div className="text-muted small mt-2">
                        {t("petitionSteps.step2.validatingAddress")}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="form-control d-flex align-items-center justify-content-center"
                    style={{ height: "38px" }}
                  >
                    <div
                      className="spinner-border spinner-border-sm text-muted me-2"
                      role="status"
                    >
                      <span className="visually-hidden">{t("common.loading")}</span>
                    </div>

                    <span className="text-muted">{t("petitionSteps.step2.loadingGoogleMaps")}</span>
                  </div>
                )}
              </div>

              <div className="col-12">
                <label htmlFor="propertyStreet2" className="form-label">
                  {t("petitionSteps.step2.streetAddressLine2")}
                </label>

                <input
                  type="text"
                  id="propertyStreet2"
                  name="propertyStreet2"
                  className="form-control"
                  value={formData.propertyStreet2 || ""}
                  onChange={handleInputChange}
                  placeholder={t("petitionSteps.step2.placeholderStreet2")}
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="propertyCity" className="form-label">
                  {t("petitionSteps.step2.city")} *
                </label>

                <input
                  type="text"
                  id="propertyCity"
                  name="propertyCity"
                  className={`form-control ${
                    fieldErrors.propertyCity ? "is-invalid" : ""
                  }`}
                  value={formData.propertyCity || ""}
                  onChange={handleInputChange}
                  placeholder={t("petitionSteps.step2.placeholderCity")}
                />

                {fieldErrors.propertyCity && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.propertyCity}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="propertyState" className="form-label">
                  {t("petitionSteps.step2.state")} *
                </label>

                <select
                  id="propertyState"
                  name="propertyState"
                  className={`form-select ${
                    fieldErrors.propertyState ? "is-invalid" : ""
                  }`}
                  value={formData.propertyState || "MA"}
                  onChange={handleInputChange}
                  disabled
                >
                  <option value="MA">Massachusetts (MA)</option>
                </select>

                {fieldErrors.propertyState && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.propertyState}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="propertyZip" className="form-label">
                  {t("petitionSteps.step2.zipCode")} *
                </label>

                <input
                  type="text"
                  id="propertyZip"
                  name="propertyZip"
                  pattern="\d{5}(?:-\d{4})?"
                  className={`form-control ${
                    fieldErrors.propertyZip ? "is-invalid" : ""
                  }`}
                  value={formData.propertyZip || ""}
                  onChange={handleInputChange}
                  placeholder={t("petitionSteps.step2.placeholderZip")}
                />

                {fieldErrors.propertyZip && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.propertyZip}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="propertyCounty" className="form-label">
                  {t("petitionSteps.step2.county")} *
                </label>

                <input
                  type="text"
                  id="propertyCounty"
                  name="propertyCounty"
                  className={`form-control ${
                    fieldErrors.propertyCounty ? "is-invalid" : ""
                  }`}
                  value={formData.propertyCounty || ""}
                  onChange={handleInputChange}
                  placeholder={t("petitionSteps.step2.placeholderCounty")}
                />

                {fieldErrors.propertyCounty && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.propertyCounty}
                  </div>
                )}
              </div>

              <div className="col-12">
                <label htmlFor="assessorParcelId" className="form-label">
                  {t("petitionSteps.step2.assessorParcelId")}
                </label>

                <input
                  type="text"
                  id="assessorParcelId"
                  name="assessorParcelId"
                  className="form-control"
                  value={formData.assessorParcelId || ""}
                  onChange={handleInputChange}
                  placeholder={t("petitionSteps.step2.placeholderAssessorParcelId")}
                />
              </div>
            </div>
          </div>
        );
};

export default Step1PropertyDetails;
