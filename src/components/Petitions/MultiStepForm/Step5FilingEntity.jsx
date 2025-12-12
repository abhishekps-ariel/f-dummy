import React from "react";
import { useTranslation } from "react-i18next";

const Step5FilingEntity = ({
  organizationLoading,
  organizationData,
  fieldErrors,
  formData,
  handleInputChange,
  profileLoading,
  userFilingEntityType,
  filingEntityTypes,
}) => {
  const { t } = useTranslation();
   return (
          <div>
            <h2 className="theme-color font-med mb-1">{t("petitionSteps.step5.title")}</h2>

            <p className="text-muted small mb-3">
              {t("petitionSteps.step5.description")}
            </p>

            {/* Organization Data Loading Indicator */}

            {organizationLoading && (
              <div className="alert alert-info d-flex align-items-center mb-3">
                <div
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                >
                  <span className="visually-hidden">{t("common.loading")}</span>
                </div>

                <span>{t("petitionSteps.step5.loadingOrganization")}</span>
              </div>
            )}

            <div className="row g-3">
              <div className="col-12">
                <label htmlFor="filingEntityLegalName" className="form-label">
                  {t("petitionSteps.step5.filingEntityLegalName")} *
                  {organizationData && (
                    <span className="text-success small ms-2">
                      <i className="fas fa-check-circle me-1"></i>{t("petitionSteps.step5.prefilledFromOrganization")}
                    </span>
                  )}
                </label>

                <input
                  type="text"
                  id="filingEntityLegalName"
                  name="filingEntityLegalName"
                  className={`form-control form-control-lg ${
                    fieldErrors.filingEntityLegalName ? "is-invalid" : ""
                  }`}
                  value={formData.filingEntityLegalName}
                  onChange={handleInputChange}
                />

                {fieldErrors.filingEntityLegalName && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.filingEntityLegalName}
                  </div>
                )}
              </div>

              {/* Filing Entity Role - Read Only from Profile */}

              <div className="col-12">
                <label htmlFor="filingEntityRole" className="form-label">
                  {t("petitionSteps.step5.filingEntityRole")}
                </label>

                {profileLoading ? (
                  <div className="form-control form-control-lg bg-light">
                    <span className="text-muted">{t("common.loading")}</span>
                  </div>
                ) : userFilingEntityType ? (
                  <div className="form-control form-control-lg bg-light">
                    <span className="text-success">
                      {filingEntityTypes.find(
                        (type) => type.id === userFilingEntityType
                      )?.name || t("petitionSteps.step5.unknownType")}
                    </span>
                  </div>
                ) : (
                  <div className="form-control form-control-lg bg-light">
                    <span className="text-muted">
                      <i className="fa fa-exclamation-triangle me-2"></i>
                      {t("petitionSteps.step5.setFilingEntityType")}
                    </span>
                  </div>
                )}
              </div>

              {/* Address Fields */}

              <div className="col-12">
                <label htmlFor="filingEntityStreet1" className="form-label">
                  {t("petitionSteps.step5.streetAddress")} *
                  {organizationData && (
                    <span className="text-success small ms-2">
                      <i className="fas fa-check-circle me-1"></i>{t("petitionSteps.step5.prefilledFromOrganization")}
                    </span>
                  )}
                </label>

                <input
                  type="text"
                  id="filingEntityStreet1"
                  name="filingEntityStreet1"
                  className={`form-control ${
                    fieldErrors.filingEntityStreet1 ? "is-invalid" : ""
                  }`}
                  value={formData.filingEntityStreet1}
                  onChange={handleInputChange}
                />

                {fieldErrors.filingEntityStreet1 && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.filingEntityStreet1}
                  </div>
                )}
              </div>

              <div className="col-12">
                <label htmlFor="filingEntityStreet2" className="form-label">
                  {t("petitionSteps.step5.streetAddressLine2")}
                </label>

                <input
                  type="text"
                  id="filingEntityStreet2"
                  name="filingEntityStreet2"
                  className="form-control"
                  value={formData.filingEntityStreet2}
                  onChange={handleInputChange}
                  placeholder={t("petitionSteps.step5.placeholderStreet2")}
                />
              </div>

              <div className="col-md-4">
                <label htmlFor="filingEntityCity" className="form-label">
                  {t("petitionSteps.step5.city")} *
                </label>

                <input
                  type="text"
                  id="filingEntityCity"
                  name="filingEntityCity"
                  className={`form-control ${
                    fieldErrors.filingEntityCity ? "is-invalid" : ""
                  }`}
                  value={formData.filingEntityCity}
                  onChange={handleInputChange}
                />

                {fieldErrors.filingEntityCity && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.filingEntityCity}
                  </div>
                )}
              </div>

              <div className="col-md-4">
                <label htmlFor="filingEntityState" className="form-label">
                  {t("petitionSteps.step5.state")} *
                </label>

                <input
                  type="text"
                  id="filingEntityState"
                  name="filingEntityState"
                  className={`form-control ${
                    fieldErrors.filingEntityState ? "is-invalid" : ""
                  }`}
                  value={formData.filingEntityState}
                  onChange={handleInputChange}
                />

                {fieldErrors.filingEntityState && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.filingEntityState}
                  </div>
                )}
              </div>

              <div className="col-md-4">
                <label htmlFor="filingEntityZip" className="form-label">
                  {t("petitionSteps.step5.zipCode")} *
                </label>

                <input
                  type="text"
                  id="filingEntityZip"
                  name="filingEntityZip"
                  className={`form-control ${
                    fieldErrors.filingEntityZip ? "is-invalid" : ""
                  }`}
                  value={formData.filingEntityZip}
                  onChange={handleInputChange}
                />

                {fieldErrors.filingEntityZip && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.filingEntityZip}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="filingContactName" className="form-label">
                  {t("petitionSteps.step5.filingContactName")} *
                  {organizationData && (
                    <span className="text-success small ms-2">
                      <i className="fas fa-check-circle me-1"></i>{t("petitionSteps.step5.prefilledFromOrganization")}
                    </span>
                  )}
                </label>

                <input
                  type="text"
                  id="filingContactName"
                  name="filingContactName"
                  className={`form-control ${
                    fieldErrors.filingContactName ? "is-invalid" : ""
                  }`}
                  value={formData.filingContactName}
                  onChange={handleInputChange}
                />

                {fieldErrors.filingContactName && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.filingContactName}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="filingContactPhone" className="form-label">
                  {t("petitionSteps.step5.filingContactPhone")} *
                  {organizationData && (
                    <span className="text-success small ms-2">
                      <i className="fas fa-check-circle me-1"></i>{t("petitionSteps.step5.prefilledFromOrganization")}
                    </span>
                  )}
                </label>

                <input
                  type="tel"
                  id="filingContactPhone"
                  name="filingContactPhone"
                  className={`form-control ${
                    fieldErrors.filingContactPhone ? "is-invalid" : ""
                  }`}
                  value={formData.filingContactPhone}
                  onChange={handleInputChange}
                />

                {fieldErrors.filingContactPhone && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.filingContactPhone}
                  </div>
                )}
              </div>

              <div className="col-12">
                <label htmlFor="filingContactEmail" className="form-label">
                  {t("petitionSteps.step5.filingContactEmail")} *
                  {organizationData && (
                    <span className="text-success small ms-2">
                      <i className="fas fa-check-circle me-1"></i>{t("petitionSteps.step5.prefilledFromOrganization")}
                    </span>
                  )}
                </label>

                <input
                  type="email"
                  id="filingContactEmail"
                  name="filingContactEmail"
                  className={`form-control ${
                    fieldErrors.filingContactEmail ? "is-invalid" : ""
                  }`}
                  value={formData.filingContactEmail}
                  onChange={handleInputChange}
                />

                {fieldErrors.filingContactEmail && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.filingContactEmail}
                  </div>
                )}
              </div>

              <div className="col-md-4">
                <label htmlFor="nmlsLicenseNumber" className="form-label">
                  {t("petitionSteps.step5.nmlsLicenseNumber")}
                </label>

                <input
                  type="text"
                  id="nmlsLicenseNumber"
                  name="nmlsLicenseNumber"
                  className="form-control"
                  value={formData.nmlsLicenseNumber}
                  onChange={handleInputChange}
                />
              </div>

              <div className="col-md-4">
                <label htmlFor="stateLicenseNumber" className="form-label">
                  {t("petitionSteps.step5.stateLicenseNumber")}
                </label>

                <input
                  type="text"
                  id="stateLicenseNumber"
                  name="stateLicenseNumber"
                  className="form-control"
                  value={formData.stateLicenseNumber}
                  onChange={handleInputChange}
                />
              </div>

              <div className="col-md-4">
                <label htmlFor="stateLicenseState" className="form-label">
                  {t("petitionSteps.step5.licenseState")}
                </label>

                <input
                  type="text"
                  id="stateLicenseState"
                  name="stateLicenseState"
                  className="form-control"
                  value={formData.stateLicenseState}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        );
};

export default Step5FilingEntity;
