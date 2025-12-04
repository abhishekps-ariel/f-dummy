import React from "react";
import { useTranslation } from "react-i18next";


const PropertyDetailsCard = ({
    SectionHeader,
  isEditing,
  isLoaded,
  propertyAddressInputRef,
  predictions,
  fieldErrors,
  formData,
  handleInputChange,
  handlePropertyAddressInput,
  handlePropertyAddressSelect,
}) => {
  const { t } = useTranslation();
  return (
    <div className={`card mb-4 ${isEditing ? "editing" : ""}`}>
            <SectionHeader title={t("petitionTabContent.propertyDetails")} />
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">{t("petitionTabContent.formFields.streetAddress")} *</label>
                    <input
                      ref={propertyAddressInputRef}
                      type="text"
                      name="propertyStreet1"
                      className={`form-control ${
                        fieldErrors.propertyStreet1 ? "is-invalid" : ""
                      }`}
                      value={formData.propertyStreet1 || ""}
                      readOnly={!isEditing}
                      onChange={(e) => {
                        handleInputChange(e);
                        handlePropertyAddressInput(e.target.value);
                      }}
                      autoComplete="off"
                    />
                    {isEditing && isLoaded && predictions.length > 0 && (
                      <div className="list-group mt-1">
                        {predictions.map((p) => (
                          <button
                            type="button"
                            key={p.place_id}
                            className="list-group-item list-group-item-action"
                            onClick={() => handlePropertyAddressSelect(p)}
                          >
                            {p.description}
                          </button>
                        ))}
                      </div>
                    )}
                    {fieldErrors.propertyStreet1 && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.propertyStreet1}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">{t("petitionTabContent.formFields.streetAddress2")}</label>
                    <input
                      type="text"
                      name="propertyStreet2"
                      className="form-control"
                      value={formData.propertyStreet2 || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">{t("petitionTabContent.formFields.city")} *</label>
                    <input
                      type="text"
                      name="propertyCity"
                      className={`form-control ${
                        fieldErrors.propertyCity ? "is-invalid" : ""
                      }`}
                      value={formData.propertyCity || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.propertyCity && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.propertyCity}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">{t("petitionTabContent.formFields.state")} *</label>
                    <input
                      type="text"
                      name="propertyState"
                      className={`form-control ${
                        fieldErrors.propertyState ? "is-invalid" : ""
                      }`}
                      value={formData.propertyState || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.propertyState && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.propertyState}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">{t("petitionTabContent.formFields.zipCode")} *</label>
                    <input
                      type="text"
                      name="propertyZip"
                      className={`form-control ${
                        fieldErrors.propertyZip ? "is-invalid" : ""
                      }`}
                      value={formData.propertyZip || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.propertyZip && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.propertyZip}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">{t("petitionTabContent.formFields.county")}</label>
                    <input
                      type="text"
                      name="propertyCounty"
                      className="form-control"
                      value={formData.propertyCounty || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">{t("petitionTabContent.formFields.assessorParcelId")}</label>
                    <input
                      type="text"
                      name="assessorParcelId"
                      className="form-control"
                      value={formData.assessorParcelId || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
  );
};

export default PropertyDetailsCard;
