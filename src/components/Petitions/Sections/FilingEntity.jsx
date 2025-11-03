import React from "react";


const StepFilingEntity = ({
    SectionHeader,
  isEditing,
  formData,
  fieldErrors,
  handleInputChange,
}) => {
  return (
    <>
      <div className={`card mb-4 ${isEditing ? "editing" : ""}`}>
            <SectionHeader title="Filing Entity" />
            <div className="card-body">
              <div className="row">
                <div className="col-12">
                  <div className="form-group mb-3">
                    <label className="form-label">
                      Filing Entity Legal Name *
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
                    <label className="form-label">Contact Name *</label>
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
                    <label className="form-label">Contact Email *</label>
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
                    <label className="form-label">Contact Phone *</label>
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
                    <label className="form-label">NMLS License Number</label>
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
                    <label className="form-label">State License Number</label>
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
                    <label className="form-label">State License State</label>
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
                    <label className="form-label">Street Address *</label>
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
                    <label className="form-label">Street Address 2</label>
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
                    <label className="form-label">City *</label>
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
                    <label className="form-label">State *</label>
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
                    <label className="form-label">ZIP Code *</label>
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
    </>
  );
};

export default StepFilingEntity;
