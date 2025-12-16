import React from "react";
import { useTranslation } from "react-i18next";


const StepFilingEntity = ({
  SectionHeader,
  isEditing,
  formData,
  fieldErrors,
  handleInputChange,
}) => {
  const { t } = useTranslation();
  return (
      <div className={`card mb-4 ${isEditing ? "editing" : ""}`}>
            {SectionHeader && <SectionHeader title={t("petitionTabContent.filingEntity")} />}
            <div className="card-body">
              <div className="row">
                <div className="col-12">
                  <div className="form-group mb-3">
                    <label className="form-label">
                      {t("petitionTabContent.filingEntityLegalName")} *
                    </label>
                    <input
                      type="text"
                      name="filingEntityLegalName"
                      className={`form-control ${
                        fieldErrors.filingEntityLegalName ? "is-invalid" : ""
                      }`}
                      value={formData.filingEntityLegalName || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.filingEntityLegalName && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.filingEntityLegalName}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">{t("petitionTabContent.contactName")} *</label>
                    <input
                      type="text"
                      name="filingContactName"
                      className={`form-control ${
                        fieldErrors.filingContactName ? "is-invalid" : ""
                      }`}
                      value={formData.filingContactName || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.filingContactName && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.filingContactName}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">{t("petitionTabContent.contactEmail")} *</label>
                    <input
                      type="email"
                      name="filingContactEmail"
                      className={`form-control ${
                        fieldErrors.filingContactEmail ? "is-invalid" : ""
                      }`}
                      value={formData.filingContactEmail || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.filingContactEmail && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.filingContactEmail}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">{t("petitionTabContent.contactPhone")} *</label>
                    <input
                      type="text"
                      name="filingContactPhone"
                      className={`form-control ${
                        fieldErrors.filingContactPhone ? "is-invalid" : ""
                      }`}
                      value={formData.filingContactPhone || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.filingContactPhone && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.filingContactPhone}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">{t("petitionTabContent.nmlsLicenseNumber")}</label>
                    <input
                      type="text"
                      name="nmlsLicenseNumber"
                      className="form-control"
                      value={formData.nmlsLicenseNumber || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">{t("petitionTabContent.stateLicenseNumber")}</label>
                    <input
                      type="text"
                      name="stateLicenseNumber"
                      className="form-control"
                      value={formData.stateLicenseNumber || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">{t("petitionTabContent.stateLicenseState")}</label>
                    <input
                      type="text"
                      name="stateLicenseState"
                      className="form-control"
                      value={formData.stateLicenseState || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">{t("petitionTabContent.formFields.streetAddress")} *</label>
                    <input
                      type="text"
                      name="filingEntityStreet1"
                      className={`form-control ${
                        fieldErrors.filingEntityStreet1 ? "is-invalid" : ""
                      }`}
                      value={formData.filingEntityStreet1 || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.filingEntityStreet1 && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.filingEntityStreet1}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">{t("petitionTabContent.formFields.streetAddress2")}</label>
                    <input
                      type="text"
                      name="filingEntityStreet2"
                      className="form-control"
                      value={formData.filingEntityStreet2 || ""}
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
                      name="filingEntityCity"
                      className={`form-control ${
                        fieldErrors.filingEntityCity ? "is-invalid" : ""
                      }`}
                      value={formData.filingEntityCity || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.filingEntityCity && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.filingEntityCity}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">{t("petitionTabContent.formFields.state")} *</label>
                    <input
                      type="text"
                      name="filingEntityState"
                      className={`form-control ${
                        fieldErrors.filingEntityState ? "is-invalid" : ""
                      }`}
                      value={formData.filingEntityState || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.filingEntityState && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.filingEntityState}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">{t("petitionTabContent.formFields.zipCode")} *</label>
                    <input
                      type="text"
                      name="filingEntityZip"
                      className={`form-control ${
                        fieldErrors.filingEntityZip ? "is-invalid" : ""
                      }`}
                      value={formData.filingEntityZip || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.filingEntityZip && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.filingEntityZip}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
  );
};

export default StepFilingEntity;
