import React from "react";

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
  return (
          <div>
            <h2 className="theme-color font-med mb-1">1. Property Details</h2>

            <p className="text-muted small mb-3">
              Enter the full address and location details of the property
              subject to foreclosure.
            </p>

            <div className="row g-3">
              <div className="col-12">
                <label htmlFor="propertyStreet1" className="form-label">
                  Street Address Line 1 *
                  {isAddressVerified && (
                    <span className="text-success ms-2">✓ Verified</span>
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
                      value={formData.propertyStreet1}
                      onChange={handleInputChange}
                      placeholder="Enter address manually (Google Maps unavailable)"
                      autoComplete="off"
                    />

                    {fieldErrors.propertyStreet1 && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.propertyStreet1}
                      </div>
                    )}

                    <div className="text-danger small mt-1">
                      ⚠️ Google Maps API failed to load. Please enter address
                      manually.
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
                      value={formData.propertyStreet1}
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
                      placeholder="Start typing an address..."
                      autoComplete="off"
                    />

                    {/* Loading indicator */}

                    {isLoadingPredictions && (
                      <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                        <div
                          className="spinner-border spinner-border-sm text-muted"
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
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
                        Validating address...
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
                      <span className="visually-hidden">Loading...</span>
                    </div>

                    <span className="text-muted">Loading Google Maps...</span>
                  </div>
                )}
              </div>

              <div className="col-12">
                <label htmlFor="propertyStreet2" className="form-label">
                  Street Address Line 2 (Optional)
                </label>

                <input
                  type="text"
                  id="propertyStreet2"
                  name="propertyStreet2"
                  className="form-control"
                  value={formData.propertyStreet2}
                  onChange={handleInputChange}
                  placeholder="Apartment, suite, unit, building, floor, etc."
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="propertyCity" className="form-label">
                  City *
                </label>

                <input
                  type="text"
                  id="propertyCity"
                  name="propertyCity"
                  className={`form-control ${
                    fieldErrors.propertyCity ? "is-invalid" : ""
                  }`}
                  value={formData.propertyCity}
                  onChange={handleInputChange}
                  placeholder="Enter city name"
                />

                {fieldErrors.propertyCity && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.propertyCity}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="propertyState" className="form-label">
                  State *
                </label>

                <select
                  id="propertyState"
                  name="propertyState"
                  className={`form-select ${
                    fieldErrors.propertyState ? "is-invalid" : ""
                  }`}
                  value={formData.propertyState}
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
                  ZIP Code *
                </label>

                <input
                  type="text"
                  id="propertyZip"
                  name="propertyZip"
                  pattern="\d{5}(?:-\d{4})?"
                  className={`form-control ${
                    fieldErrors.propertyZip ? "is-invalid" : ""
                  }`}
                  value={formData.propertyZip}
                  onChange={handleInputChange}
                  placeholder="12345 or 12345-6789"
                />

                {fieldErrors.propertyZip && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.propertyZip}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="propertyCounty" className="form-label">
                  County (Filing Location) *
                </label>

                <input
                  type="text"
                  id="propertyCounty"
                  name="propertyCounty"
                  className={`form-control ${
                    fieldErrors.propertyCounty ? "is-invalid" : ""
                  }`}
                  value={formData.propertyCounty}
                  onChange={handleInputChange}
                  placeholder="Enter county name"
                />

                {fieldErrors.propertyCounty && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.propertyCounty}
                  </div>
                )}
              </div>

              <div className="col-12">
                <label htmlFor="assessorParcelId" className="form-label">
                  Assessor Parcel ID (Optional)
                </label>

                <input
                  type="text"
                  id="assessorParcelId"
                  name="assessorParcelId"
                  className="form-control"
                  value={formData.assessorParcelId}
                  onChange={handleInputChange}
                  placeholder="Enter assessor parcel ID"
                />
              </div>
            </div>
          </div>
        );
};

export default Step1PropertyDetails;
