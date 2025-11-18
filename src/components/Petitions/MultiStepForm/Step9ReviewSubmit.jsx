import React from "react";

const Step9ReviewSubmit = ({
  formData,
  handleEditSection,
  getLoanTypes,
  getLienPositions,
  filingEntityTypes,
  getAssigneeTypes,
  getAssigneeRoles,
  userProfile,
}) => {
    return (
          <div>
            <h2 className="theme-color font-med mb-1">
              9. Review & Submit Petition
            </h2>

            <p className="text-muted small mb-3">
              Please review all entered petition details before final
              submission.
            </p>

            {/* Read-only Summary */}

            <div className="petition-review-summary">
              {/* Property Information */}

              <div className="review-section mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="review-section-title mb-0">
                    Property Information
                  </h5>

                  <button
                    type="button"
                    className="dashboard-btn-create"
                    onClick={() => handleEditSection(1)}
                    style={{ padding: "6px 12px", fontSize: "13px" }}
                  >
                    <i className="fas fa-edit me-1"></i>Edit
                  </button>
                </div>

                <div className="review-content">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <strong>Street Address:</strong>{" "}
                      {formData.propertyStreet1}
                      {formData.propertyStreet2 && (
                        <>
                          <br />
                          <span className="text-muted">
                            {formData.propertyStreet2}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="col-md-3">
                      <strong>City:</strong> {formData.propertyCity}
                    </div>

                    <div className="col-md-3">
                      <strong>State:</strong> {formData.propertyState}
                    </div>

                    <div className="col-md-3">
                      <strong>ZIP Code:</strong> {formData.propertyZip}
                    </div>

                    <div className="col-md-3">
                      <strong>County:</strong> {formData.propertyCounty}
                    </div>
                  </div>
                </div>
              </div>

              {/* Loan Information */}

              <div className="review-section mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="review-section-title mb-0">
                    Loan Information
                  </h5>

                  <button
                    type="button"
                    className="dashboard-btn-create"
                    onClick={() => handleEditSection(2)}
                    style={{ padding: "6px 12px", fontSize: "13px" }}
                  >
                    <i className="fas fa-edit me-1"></i>Edit
                  </button>
                </div>

                <div className="review-content">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <strong>Loan Type:</strong>{" "}
                      {getLoanTypes().find(
                        (type) => type.id === formData.petitionLoanTypeId
                      )?.name ||
                        formData.petitionLoanTypeName ||
                        "N/A"}
                    </div>

                    <div className="col-md-6">
                      <strong>Original Loan Amount:</strong> $
                      {formData.originalPrincipalAmount}
                    </div>

                    <div className="col-md-6">
                      <strong>Current Balance:</strong> $
                      {formData.currentPrincipalBalance}
                    </div>

                    <div className="col-md-6">
                      <strong>Interest Rate:</strong>{" "}
                      {formData.interestRatePercent}%
                    </div>

                    <div className="col-md-6">
                      <strong>Loan Number:</strong> {formData.loanNumber}
                    </div>

                    <div className="col-md-6">
                      <strong>Lien Position:</strong>{" "}
                      {getLienPositions().find(
                        (position) => position.value === formData.lienPosition
                      )?.name || formData.lienPosition}
                    </div>
                  </div>
                </div>
              </div>

              {/* Borrower Information */}

              <div className="review-section mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="review-section-title mb-0">
                    Borrower Information
                  </h5>

                  <button
                    type="button"
                    className="dashboard-btn-create"
                    onClick={() => handleEditSection(3)}
                    style={{ padding: "6px 12px", fontSize: "13px" }}
                  >
                    <i className="fas fa-edit me-1"></i>Edit
                  </button>
                </div>

                <div className="review-content">
                  {formData.borrowers && formData.borrowers.length > 0 ? (
                    formData.borrowers.map((borrower, index) => (
                      <div key={borrower.id} className="row g-3 mb-3">
                        <div className="col-12">
                          <strong>Borrower {index + 1}:</strong>
                        </div>

                        <div className="col-md-6">
                          <strong>Name:</strong> {borrower.firstName}{" "}
                          {borrower.middleName} {borrower.lastName}{" "}
                          {borrower.suffix}
                        </div>

                        <div className="col-md-6">
                          <strong>Phone:</strong> {borrower.phone}
                        </div>

                        <div className="col-md-6">
                          <strong>Email:</strong> {borrower.email}
                        </div>

                        <div className="col-md-6">
                          <strong>Primary:</strong>{" "}
                          {borrower.borrowerIsPrimary ? "Yes" : "No"}
                        </div>

                        {borrower.mailingStreet1 && (
                          <div className="col-12">
                            <strong>Mailing Address:</strong>{" "}
                            {borrower.mailingStreet1}, {borrower.mailingCity},{" "}
                            {borrower.mailingState} {borrower.mailingZip}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-muted">
                      No borrower information available
                    </div>
                  )}
                </div>
              </div>

              {/* Filing Entity Information */}

              <div className="review-section mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="review-section-title mb-0">
                    Filing Entity Information
                  </h5>

                  <button
                    type="button"
                    className="dashboard-btn-create"
                    onClick={() => handleEditSection(4)}
                    style={{ padding: "6px 12px", fontSize: "13px" }}
                  >
                    <i className="fas fa-edit me-1"></i>Edit
                  </button>
                </div>

                <div className="review-content">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <strong>Entity Name:</strong>{" "}
                      {formData.filingEntityLegalName}
                    </div>

                    <div className="col-md-6">
                      <strong>Entity Type:</strong>{" "}
                      {filingEntityTypes.find(
                        (type) => type.id === formData.filingEntityTypeId
                      )?.name || "N/A"}
                    </div>

                    <div className="col-md-6">
                      <strong>Address:</strong> {formData.filingEntityStreet1}
                      {formData.filingEntityStreet2 && (
                        <>
                          <br />
                          <span className="text-muted">
                            {formData.filingEntityStreet2}
                          </span>
                        </>
                      )}
                      <br />
                      {formData.filingEntityCity}, {formData.filingEntityState}{" "}
                      {formData.filingEntityZip}
                    </div>

                    <div className="col-md-6">
                      <strong>Contact Name:</strong>{" "}
                      {formData.filingContactName}
                    </div>

                    <div className="col-md-6">
                      <strong>Contact Email:</strong>{" "}
                      {formData.filingContactEmail}
                    </div>

                    <div className="col-md-6">
                      <strong>Contact Phone:</strong>{" "}
                      {formData.filingContactPhone}
                    </div>

                    {formData.nmlsLicenseNumber && (
                      <div className="col-md-6">
                        <strong>NMLS License:</strong>{" "}
                        {formData.nmlsLicenseNumber}
                      </div>
                    )}

                    {formData.stateLicenseNumber && (
                      <div className="col-md-6">
                        <strong>State License:</strong>{" "}
                        {formData.stateLicenseNumber} (
                        {formData.stateLicenseState})
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right-to-Cure (35A) Proofs */}

              <div className="review-section mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="review-section-title mb-0">
                    Right-to-Cure (35A) Proofs
                  </h5>

                  <button
                    type="button"
                    className="dashboard-btn-create"
                    onClick={() => handleEditSection(5)}
                    style={{ padding: "6px 12px", fontSize: "13px" }}
                  >
                    <i className="fas fa-edit me-1"></i>Edit
                  </button>
                </div>

                <div className="review-content">
                  <div className="row g-3">
                    <div className="col-12">
                      <strong>35A Notice Sent:</strong>{" "}
                      {formData.noticeSent ? "Yes" : "No"}
                    </div>

                    {formData.noticeSent && (
                      <>
                        <div className="col-md-6">
                          <strong>Notice Date:</strong> {formData.noticeDate}
                        </div>

                        <div className="col-md-6">
                          <strong>Amount in Default:</strong> $
                          {formData.amountInDefault}
                        </div>

                        <div className="col-md-6">
                          <strong>Days Delinquent:</strong>{" "}
                          {formData.daysDelinquentAtNotice}
                        </div>

                        <div className="col-md-6">
                          <strong>Cure Expiration:</strong>{" "}
                          {formData.cureExpirationDate}
                        </div>

                        <div className="col-12">
                          <strong>Notice Address:</strong>{" "}
                          {formData.noticeAddressStreet1},{" "}
                          {formData.noticeAddressCity},{" "}
                          {formData.noticeAddressState}{" "}
                          {formData.noticeAddressZip}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Form 35B Information */}

              <div className="review-section mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="review-section-title mb-0">
                    Form 35B Information
                  </h5>

                  <button
                    type="button"
                    className="dashboard-btn-create"
                    onClick={() => handleEditSection(6)}
                    style={{ padding: "6px 12px", fontSize: "13px" }}
                  >
                    <i className="fas fa-edit me-1"></i>Edit
                  </button>
                </div>

                <div className="review-content">
                  <div className="row g-3">
                    <div className="col-12">
                      <strong>35B Filed:</strong>{" "}
                      {formData.certainMortgageLoan ? "Yes" : "No"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Loan Assignees */}

              <div className="review-section mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="review-section-title mb-0">Loan Assignees</h5>

                  <button
                    type="button"
                    className="dashboard-btn-create"
                    onClick={() => handleEditSection(7)}
                    style={{ padding: "6px 12px", fontSize: "13px" }}
                  >
                    <i className="fas fa-edit me-1"></i>Edit
                  </button>
                </div>

                <div className="review-content">
                  {formData.loanAssignees &&
                  formData.loanAssignees.length > 0 ? (
                    formData.loanAssignees.map((assignee, index) => (
                      <div key={index} className="row g-3 mb-3">
                        <div className="col-12">
                          <strong>Assignee {index + 1}:</strong>
                        </div>

                        <div className="col-md-6">
                          <strong>Name:</strong> {assignee.assigneeName}
                        </div>

                        <div className="col-md-6">
                          <strong>Type:</strong>{" "}
                          {getAssigneeTypes().find(
                            (type) => type.id === assignee.assigneeTypeId
                          )?.name || assignee.assigneeTypeId}
                        </div>

                        <div className="col-md-6">
                          <strong>Role:</strong>{" "}
                          {getAssigneeRoles().find(
                            (role) => role.id === assignee.assigneeRoleId
                          )?.name || assignee.assigneeRoleId}
                        </div>

                        <div className="col-12">
                          <strong>Address:</strong> {assignee.street1}
                          {assignee.street2 && (
                            <>
                              <br />
                              <span className="text-muted">
                                {assignee.street2}
                              </span>
                            </>
                          )}
                          <br />
                          {assignee.city}, {assignee.addressState}{" "}
                          {assignee.zip}
                        </div>

                        {assignee.licenseNumber && (
                          <div className="col-md-6">
                            <strong>License Number:</strong>{" "}
                            {assignee.licenseNumber}
                          </div>
                        )}

                        {assignee.licenseState && (
                          <div className="col-md-6">
                            <strong>License State:</strong>{" "}
                            {assignee.licenseState}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-muted">
                      No assignee information available
                    </div>
                  )}
                </div>
              </div>

              {/* Attestation Data */}

              <div className="review-section mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="review-section-title mb-0">
                    Attestation Data
                  </h5>

                  <button
                    type="button"
                    className="dashboard-btn-create"
                    onClick={() => handleEditSection(8)}
                    style={{ padding: "6px 12px", fontSize: "13px" }}
                  >
                    <i className="fas fa-edit me-1"></i>Edit
                  </button>
                </div>

                <div className="review-content">
                  {/* Signature Preview - Moved to bottom */}

                  {userProfile?.signatureUrl && (
                    <div className="row g-3 mt-3">
                      <div className="col-12">
                        <strong>Signature Preview:</strong>

                        <div
                          className="signature-preview-container p-3 border rounded bg-light mt-2"
                          style={{ maxWidth: "400px" }}
                        >
                          <img
                            src={userProfile.signatureUrl}
                            alt="Digital Signature"
                            className="signature-preview-img"
                            style={{
                              maxWidth: "100%",

                              maxHeight: "120px",

                              objectFit: "contain",

                              border: "1px solid #dee2e6",

                              borderRadius: "4px",

                              backgroundColor: "white",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Signer Information */}

                  <div className="row g-3 mt-3">
                    <div className="col-md-6">
                      <strong>Signer Name:</strong> {formData.signerFirstName}{" "}
                      {formData.signerMiddleInitial} {formData.signerLastName}
                    </div>

                    <div className="col-md-6">
                      <strong>Signer Title:</strong> {formData.signerTitle}
                    </div>

                    <div className="col-md-6">
                      <strong>Signer Email:</strong> {formData.signerEmail}
                    </div>

                    <div className="col-md-6">
                      <strong>Certification:</strong>{" "}
                      {formData.certification_check
                        ? "Certified"
                        : "Not Certified"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
};

export default Step9ReviewSubmit;
