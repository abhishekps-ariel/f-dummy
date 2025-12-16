import React from "react";
import { useTranslation } from "react-i18next";

const Step10ReviewSubmit = ({
  formData,
  handleEditSection,
  getLoanTypes,
  getLienPositions,
  filingEntityTypes,
  getAssigneeTypes,
  getAssigneeRoles,
  userProfile,
}) => {
  const { t } = useTranslation();
    return (
          <div>
            <h2 className="theme-color font-med mb-1">
              {t("petitionSteps.step10.title")}
            </h2>

            <p className="text-muted small mb-3">
              {t("petitionSteps.step10.description")}
            </p>

            {/* Read-only Summary */}

            <div className="petition-review-summary">
              {/* Property Information */}

              <div className="review-section mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="review-section-title mb-0">
                    {t("petitionSteps.step10.propertyInformation")}
                  </h5>

                  <button
                    type="button"
                    className="dashboard-btn-create"
                    onClick={() => handleEditSection(9)}
                    style={{ padding: "6px 12px", fontSize: "13px" }}
                  >
                    <i className="fas fa-edit me-1"></i>{t("petitionSteps.step10.edit")}
                  </button>
                </div>

                <div className="review-content">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <strong>{t("petitionSteps.step10.streetAddress")}</strong>{" "}
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
                      <strong>{t("petitionSteps.step10.city")}</strong> {formData.propertyCity}
                    </div>

                    <div className="col-md-3">
                      <strong>{t("petitionSteps.step10.state")}</strong> {formData.propertyState}
                    </div>

                    <div className="col-md-3">
                      <strong>{t("petitionSteps.step10.zipCode")}</strong> {formData.propertyZip}
                    </div>

                    <div className="col-md-3">
                      <strong>{t("petitionSteps.step10.county")}</strong> {formData.propertyCounty}
                    </div>
                  </div>
                </div>
              </div>

              {/* Loan Information */}

              <div className="review-section mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="review-section-title mb-0">
                    {t("petitionSteps.step10.loanInformation")}
                  </h5>

                  <button
                    type="button"
                    className="dashboard-btn-create"
                    onClick={() => handleEditSection(9)}
                    style={{ padding: "6px 12px", fontSize: "13px" }}
                  >
                    <i className="fas fa-edit me-1"></i>{t("petitionSteps.step10.edit")}
                  </button>
                </div>

                <div className="review-content">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <strong>{t("petitionSteps.step10.loanType")}</strong>{" "}
                      {getLoanTypes().find(
                        (type) => type.id === formData.petitionLoanTypeId
                      )?.name ||
                        formData.petitionLoanTypeName ||
                        t("petitionSteps.step10.na")}
                    </div>

                    <div className="col-md-6">
                      <strong>{t("petitionSteps.step10.originalLoanAmount")}</strong> $
                      {formData.originalPrincipalAmount}
                    </div>

                    <div className="col-md-6">
                      <strong>{t("petitionSteps.step10.currentBalance")}</strong> $
                      {formData.currentPrincipalBalance}
                    </div>

                    <div className="col-md-6">
                      <strong>{t("petitionSteps.step10.interestRate")}</strong>{" "}
                      {formData.interestRatePercent}%
                    </div>

                    <div className="col-md-6">
                      <strong>{t("petitionSteps.step3.loanNumber")}:</strong> {formData.loanNumber}
                    </div>

                    <div className="col-md-6">
                      <strong>{t("petitionSteps.step10.lienPosition")}</strong>{" "}
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
                    {t("petitionSteps.step10.borrowerInformation")}
                  </h5>

                  <button
                    type="button"
                    className="dashboard-btn-create"
                    onClick={() => handleEditSection(9)}
                    style={{ padding: "6px 12px", fontSize: "13px" }}
                  >
                    <i className="fas fa-edit me-1"></i>{t("petitionSteps.step10.edit")}
                  </button>
                </div>

                <div className="review-content">
                  {formData.borrowers && formData.borrowers.length > 0 ? (
                    formData.borrowers.map((borrower, index) => (
                      <div key={borrower.id} className="row g-3 mb-3">
                        <div className="col-12">
                          <strong>{t("petitionSteps.step4.borrower")} {index + 1}:</strong>
                        </div>

                        <div className="col-md-6">
                          <strong>{t("petitionSteps.step10.name")}</strong> {borrower.firstName}{" "}
                          {borrower.middleName} {borrower.lastName}{" "}
                          {borrower.suffix}
                        </div>

                        <div className="col-md-6">
                          <strong>{t("petitionSteps.step10.phone")}</strong> {borrower.phone}
                        </div>

                        <div className="col-md-6">
                          <strong>{t("petitionSteps.step10.email")}</strong> {borrower.email}
                        </div>

                        <div className="col-md-6">
                          <strong>{t("petitionSteps.step10.primary")}</strong>{" "}
                          {borrower.borrowerIsPrimary ? t("petitionSteps.step3.yes") : t("petitionSteps.step3.no")}
                        </div>

                        {borrower.mailingStreet1 && (
                          <div className="col-12">
                            <strong>{t("petitionSteps.step10.mailingAddress")}</strong>{" "}
                            {borrower.mailingStreet1}, {borrower.mailingCity},{" "}
                            {borrower.mailingState} {borrower.mailingZip}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-muted">
                      {t("petitionSteps.step10.noBorrowerInformation")}
                    </div>
                  )}
                </div>
              </div>

              {/* Filing Entity Information */}

              <div className="review-section mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="review-section-title mb-0">
                    {t("petitionSteps.step10.filingEntityInformation")}
                  </h5>

                  <button
                    type="button"
                    className="dashboard-btn-create"
                    onClick={() => handleEditSection(9)}
                    style={{ padding: "6px 12px", fontSize: "13px" }}
                  >
                    <i className="fas fa-edit me-1"></i>{t("petitionSteps.step10.edit")}
                  </button>
                </div>

                <div className="review-content">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <strong>{t("petitionSteps.step10.entityName")}</strong>{" "}
                      {formData.filingEntityLegalName}
                    </div>

                    <div className="col-md-6">
                      <strong>{t("petitionSteps.step10.entityType")}</strong>{" "}
                      {filingEntityTypes.find(
                        (type) => type.id === formData.filingEntityTypeId
                      )?.name || t("petitionSteps.step10.na")}
                    </div>

                    <div className="col-md-6">
                      <strong>{t("petitionSteps.step10.address")}</strong> {formData.filingEntityStreet1}
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
                      <strong>{t("petitionSteps.step10.contactName")}</strong>{" "}
                      {formData.filingContactName}
                    </div>

                    <div className="col-md-6">
                      <strong>{t("petitionSteps.step10.contactEmail")}</strong>{" "}
                      {formData.filingContactEmail}
                    </div>

                    <div className="col-md-6">
                      <strong>{t("petitionSteps.step10.contactPhone")}</strong>{" "}
                      {formData.filingContactPhone}
                    </div>

                    {formData.nmlsLicenseNumber && (
                      <div className="col-md-6">
                        <strong>{t("petitionSteps.step10.nmlsLicense")}</strong>{" "}
                        {formData.nmlsLicenseNumber}
                      </div>
                    )}

                    {formData.stateLicenseNumber && (
                      <div className="col-md-6">
                        <strong>{t("petitionSteps.step10.stateLicense")}</strong>{" "}
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
                    {t("petitionSteps.step10.rightToCureProofs")}
                  </h5>

                  <button
                    type="button"
                    className="dashboard-btn-create"
                    onClick={() => handleEditSection(9)}
                    style={{ padding: "6px 12px", fontSize: "13px" }}
                  >
                    <i className="fas fa-edit me-1"></i>{t("petitionSteps.step10.edit")}
                  </button>
                </div>

                <div className="review-content">
                  <div className="row g-3">
                    <div className="col-12">
                      <strong>{t("petitionSteps.step10.noticeSent")}</strong>{" "}
                      {formData.noticeSent ? t("petitionSteps.step3.yes") : t("petitionSteps.step3.no")}
                    </div>

                    {formData.noticeSent && (
                      <>
                        <div className="col-md-6">
                          <strong>{t("petitionSteps.step6.noticeDate")}</strong> {formData.noticeDate}
                        </div>

                        <div className="col-md-6">
                          <strong>{t("petitionSteps.step10.amountInDefault")}</strong> $
                          {formData.amountInDefault}
                        </div>

                        <div className="col-md-6">
                          <strong>{t("petitionSteps.step10.daysDelinquent")}</strong>{" "}
                          {formData.daysDelinquentAtNotice}
                        </div>

                        <div className="col-md-6">
                          <strong>{t("petitionSteps.step10.cureExpiration")}</strong>{" "}
                          {formData.cureExpirationDate}
                        </div>

                        <div className="col-12">
                          <strong>{t("petitionSteps.step10.noticeAddress")}</strong>{" "}
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
                    {t("petitionSteps.step10.form35BInformation")}
                  </h5>

                  <button
                    type="button"
                    className="dashboard-btn-create"
                    onClick={() => handleEditSection(9)}
                    style={{ padding: "6px 12px", fontSize: "13px" }}
                  >
                    <i className="fas fa-edit me-1"></i>{t("petitionSteps.step10.edit")}
                  </button>
                </div>

                <div className="review-content">
                  <div className="row g-3">
                    <div className="col-12">
                      <strong>{t("petitionSteps.step10.filed")}</strong>{" "}
                      {formData.certainMortgageLoan ? t("petitionSteps.step3.yes") : t("petitionSteps.step3.no")}
                    </div>
                    {formData.certainMortgageLoan === true && (
                      <div className="col-12">
                        <strong>{t("petitionTabContent.wasForm35BProvided")}</strong>{" "}
                        {(() => {
                          if (formData.wasForm35BProvided === null || formData.wasForm35BProvided === undefined) {
                            return t("common.nA");
                          }
                          return formData.wasForm35BProvided ? t("petitionSteps.step3.yes") : t("petitionSteps.step3.no");
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Loan Assignees */}

              <div className="review-section mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="review-section-title mb-0">{t("petitionSteps.step10.loanAssignees")}</h5>

                  <button
                    type="button"
                    className="dashboard-btn-create"
                    onClick={() => handleEditSection(9)}
                    style={{ padding: "6px 12px", fontSize: "13px" }}
                  >
                    <i className="fas fa-edit me-1"></i>{t("petitionSteps.step10.edit")}
                  </button>
                </div>

                <div className="review-content">
                  {formData.loanAssignees &&
                  formData.loanAssignees.length > 0 ? (
                    formData.loanAssignees.map((assignee, index) => (
                      <div key={assignee.id || `assignee_${index}_${assignee.assigneeName || 'new'}`} className="row g-3 mb-3">
                        <div className="col-12">
                          <strong>{t("petitionSteps.step8.assignee")} {index + 1}:</strong>
                        </div>

                        <div className="col-md-6">
                          <strong>{t("petitionSteps.step10.name")}</strong> {assignee.assigneeName}
                        </div>

                        <div className="col-md-6">
                          <strong>{t("petitionSteps.step10.type")}</strong>{" "}
                          {getAssigneeTypes().find(
                            (type) => type.id === assignee.assigneeTypeId
                          )?.name || assignee.assigneeTypeId}
                        </div>

                        <div className="col-md-6">
                          <strong>{t("petitionSteps.step10.role")}</strong>{" "}
                          {getAssigneeRoles().find(
                            (role) => role.id === assignee.assigneeRoleId
                          )?.name || assignee.assigneeRoleId}
                        </div>

                        <div className="col-12">
                          <strong>{t("petitionSteps.step10.address")}</strong> {assignee.street1}
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
                            <strong>{t("petitionSteps.step8.licenseNumber")}</strong>{" "}
                            {assignee.licenseNumber}
                          </div>
                        )}

                        {assignee.licenseState && (
                          <div className="col-md-6">
                            <strong>{t("petitionSteps.step8.licenseState")}</strong>{" "}
                            {assignee.licenseState}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-muted">
                      {t("petitionSteps.step10.noAssigneeInformation")}
                    </div>
                  )}
                </div>
              </div>

              {/* Attestation Data */}

              <div className="review-section mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="review-section-title mb-0">
                    {t("petitionSteps.step10.attestationData")}
                  </h5>

                  <button
                    type="button"
                    className="dashboard-btn-create"
                    onClick={() => handleEditSection(9)}
                    style={{ padding: "6px 12px", fontSize: "13px" }}
                  >
                    <i className="fas fa-edit me-1"></i>{t("petitionSteps.step10.edit")}
                  </button>
                </div>

                <div className="review-content">
                  {/* Signature Preview - Moved to bottom */}

                  {(userProfile?.signatureImageName || userProfile?.signatureUrl || userProfile?.signatureBase64) && (
                    <div className="row g-3 mt-3">
                      <div className="col-12">
                        <strong>{t("petitionSteps.step10.signaturePreview")}</strong>

                        <div
                          className="signature-preview-container p-3 border rounded bg-light mt-2"
                          style={{ maxWidth: "400px" }}
                        >
                          <img
                            src={
                              userProfile?.signatureUrl || 
                              (userProfile?.signatureBase64 ? `data:image/png;base64,${userProfile.signatureBase64}` : '')
                            }
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
                      <strong>{t("petitionSteps.step10.signerName")}</strong> {formData.signerFirstName}{" "}
                      {formData.signerMiddleInitial} {formData.signerLastName}
                    </div>

                    <div className="col-md-6">
                      <strong>{t("petitionSteps.step10.signerTitle")}</strong> {formData.signerTitle}
                    </div>

                    <div className="col-md-6">
                      <strong>{t("petitionSteps.step10.signerEmail")}</strong> {formData.signerEmail}
                    </div>

                    <div className="col-md-6">
                      <strong>{t("petitionSteps.step10.certification")}</strong>{" "}
                      {formData.certification_check
                        ? t("petitionSteps.step10.certified")
                        : t("petitionSteps.step10.notCertified")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
};

export default Step10ReviewSubmit;
