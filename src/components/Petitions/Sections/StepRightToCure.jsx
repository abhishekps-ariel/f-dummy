import React from "react";
import CustomDropdown from "../../shared/CustomDropdown";

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

const StepRightToCure = ({
    SectionHeader,
  isEditing,
  formData,
  fieldErrors,
  setFormData,
  handleInputChange,
  handleNoticeAddressInput,
  isLoaded,
  noticePredictions,
  handleNoticeAddressSelect,
}) => {
  return (
    <>
      {/* Right-to-Cure Section */}
      <div className={`card mb-4 ${isEditing ? "editing" : ""}`}>
        <SectionHeader title="Right-to-Cure (§35A)" />
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <div className="form-group mb-3">
                <label className="form-label">Notice Sent *</label>
                <CustomDropdown
                  name="noticeSent"
                  value={
                    formData.noticeSent === null
                      ? ""
                      : formData.noticeSent
                      ? "true"
                      : "false"
                  }
                  onChange={(e) => {
                    const value =
                      e.target.value === "true"
                        ? true
                        : e.target.value === "false"
                        ? false
                        : null;
                    setFormData((prev) => {
                      const updated = { ...prev, noticeSent: value };
                      // Initialize foreclosureSale if noticeSent is true and it doesn't exist
                      if (value === true && !updated.foreclosureSale) {
                        updated.foreclosureSale = {
                          saleDate: "",
                          soldToId: "",
                          vestingEntityName: "",
                          reoEntityName: "",
                          reoContactFirstName: "",
                          reoContactLastName: "",
                          reoBusinessPhone: "",
                          reoEmergencyPhone: "",
                        };
                      }
                      return updated;
                    });
                  }}
                  placeholder="Select..."
                  disabled={!isEditing}
                  error={!!fieldErrors.noticeSent}
                  options={[
                    { value: "", label: "Select..." },
                    { value: "true", label: "Yes" },
                    { value: "false", label: "No" },
                  ]}
                />
                {fieldErrors.noticeSent && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.noticeSent}
                  </div>
                )}
              </div>
            </div>

            {/* If Notice Sent === true */}
            {formData.noticeSent === true && (
              <>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Notice Date *</label>
                    <input
                      type="date"
                      name="noticeDate"
                      className={`form-control ${
                        fieldErrors.noticeDate ? "is-invalid" : ""
                      }`}
                      value={formData.noticeDate || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.noticeDate && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.noticeDate}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">
                      Days Delinquent at Notice *
                    </label>
                    <input
                      type="number"
                      name="daysDelinquentAtNotice"
                      className={`form-control ${
                        fieldErrors.daysDelinquentAtNotice
                          ? "is-invalid"
                          : ""
                      }`}
                      value={formData.daysDelinquentAtNotice || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.daysDelinquentAtNotice && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.daysDelinquentAtNotice}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">
                      Amount in Default ($) *
                    </label>
                    <input
                      type="text"
                      name="amountInDefault"
                      className={`form-control ${
                        fieldErrors.amountInDefault ? "is-invalid" : ""
                      }`}
                      value={formatCurrencyDisplay(formData.amountInDefault)}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.amountInDefault && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.amountInDefault}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">
                      Cure Expiration Date
                    </label>
                    <input
                      type="date"
                      name="cureExpirationDate"
                      className={`form-control ${
                        fieldErrors.cureExpirationDate ? "is-invalid" : ""
                      }`}
                      value={formData.cureExpirationDate || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.cureExpirationDate && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.cureExpirationDate}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">
                      Notice Address Street
                    </label>
                    <input
                      type="text"
                      name="noticeAddressStreet1"
                      className="form-control"
                      value={formData.noticeAddressStreet1 || ""}
                      readOnly={!isEditing}
                      autoComplete="off"
                      onChange={(e) => {
                        handleInputChange(e);
                        handleNoticeAddressInput(e.target.value);
                      }}
                    />
                    {isEditing && isLoaded && noticePredictions.length > 0 && (
                      <div className="list-group mt-1">
                        {noticePredictions.map((p) => (
                          <button
                            type="button"
                            key={p.place_id}
                            className="list-group-item list-group-item-action"
                            onClick={() => handleNoticeAddressSelect(p)}
                          >
                            {p.description}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Notice Address City</label>
                    <input
                      type="text"
                      name="noticeAddressCity"
                      className="form-control"
                      value={formData.noticeAddressCity || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">Notice Address State</label>
                    <input
                      type="text"
                      name="noticeAddressState"
                      className="form-control"
                      value={formData.noticeAddressState || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">Notice Address ZIP</label>
                    <input
                      type="text"
                      name="noticeAddressZip"
                      className="form-control"
                      value={formData.noticeAddressZip || ""}
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </>
            )}

            {/* If Notice Sent === false */}
            {formData.noticeSent === false && (
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label className="form-label">Acceleration Date</label>
                  <input
                    type="date"
                    name="manualOverrideReason"
                    className={`form-control ${
                      fieldErrors.manualOverrideReason ? "is-invalid" : ""
                    }`}
                    value={formData.manualOverrideReason || ""}
                    readOnly={!isEditing}
                    onChange={handleInputChange}
                  />
                  {fieldErrors.manualOverrideReason && (
                    <div className="text-danger small mt-1">
                      {fieldErrors.manualOverrideReason}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default StepRightToCure;
