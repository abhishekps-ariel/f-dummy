import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import petitionApiService from "../../services/petitionApiService";
import { formatDate } from "../../utils/dateUtils";
import { logger } from "../../utils/logger";

const TakeOverPetitionModal = ({ isOpen, duplicateInfo, onConfirm, onCancel }) => {
  const { t } = useTranslation();
  const [petitionDetails, setPetitionDetails] = useState(null);
  const [petitionRawData, setPetitionRawData] = useState(null); // Store raw API response
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPetitionDetails = async () => {
      if (!isOpen || !duplicateInfo?.petitionId) {
        setPetitionDetails(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await petitionApiService.getPetitionById(duplicateInfo.petitionId);
        // getPetitionById returns axios response.data which is { success: true, data: {...} }
        // We need to extract the actual petition object from response.data
        if (response && response.success && response.data) {
          const petitionData = response.data; // This is the actual petition object
          
          // Store raw data for pre-filling (the actual petition object)
          setPetitionRawData(petitionData);
          
          // Transform the response to get readable status for display
          // transformSinglePetitionResponse expects { data: petitionObject }
          const wrappedResponse = { data: petitionData };
          const transformed = petitionApiService.transformSinglePetitionResponse(wrappedResponse);
          if (transformed) {
            setPetitionDetails({
              ...transformed,
              property: transformed.details?.property || petitionData.property,
              filingEntity: transformed.details?.filingEntity || petitionData.filingEntity,
            });
          } else {
            // Fallback: use raw data with basic transformation
            // Map status manually for fallback
            const getStatusDisplay = (status) => {
              switch (String(status)) {
                case "0": return { text: "Draft", class: "Draft" };
                case "1": return { text: "Submitted", class: "Submitted" };
                case "2": return { text: "Foreclosure Sale Initiated", class: "ForeclosureSaleInitiated" };
                case "3": return { text: "Judgment Submitted", class: "JudgmentSubmitted" };
                case "4": return { text: "Returned", class: "Returned" };
                case "5": return { text: "Resubmitted", class: "Resubmitted" };
                case "6": return { text: "Accepted", class: "Accepted" };
                case "7": return { text: "Closed", class: "Closed" };
                default: return { text: "Unknown", class: "Unknown" };
              }
            };
            const statusDisplay = getStatusDisplay(petitionData.status);
            setPetitionDetails({
              id: petitionData.id,
              petitionNumber: petitionData.petitionNumber,
              status: statusDisplay.text,
              statusClass: statusDisplay.class,
              createdDate: petitionData.createdDate,
              property: petitionData.property,
              filingEntity: petitionData.filingEntity,
            });
          }
        } else {
          setError(t("modals.takeOver.failedLoadDetails"));
        }
      } catch (err) {
        logger.error('Failed to load petition details for take-over:', err);
        setError(t("modals.takeOver.failedLoadDetails"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPetitionDetails();
  }, [isOpen, duplicateInfo?.petitionId]);

  if (!isOpen) return null;

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1100 }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "700px" }}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{t("modals.takeOver.title")}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onCancel}
              aria-label={t("common.close")}
            ></button>
          </div>
          <div className="modal-body">
            <p className="mb-2 small">
              {t("modals.takeOver.description")}
            </p>
            
            {isLoading && (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">{t("common.loading")}</span>
                </div>
                <p className="text-muted small mt-2">{t("modals.takeOver.loadingDetails")}</p>
              </div>
            )}

            {error && (
              <div className="alert alert-warning mb-3">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            {petitionDetails && !isLoading && (
              <div className="mb-3 p-2 border rounded bg-light">
                <h6 className="mb-2">
                  <i className="fas fa-file-alt me-2"></i>
                  {t("modals.takeOver.existingDetails")}
                </h6>
                
                <div className="row g-2 mb-1">
                  {petitionDetails.petitionNumber && (
                    <div className="col-12">
                      <span className="text-muted small">{t("modals.takeOver.petitionNumber")}</span>
                      <p className="mb-0 fw-medium">{petitionDetails.petitionNumber}</p>
                    </div>
                  )}
                  
                  {petitionDetails.status && (
                    <div className="col-6">
                      <span className="text-muted small">{t("common.status")}</span>
                      <p className="mb-0 fw-medium">
                        <span className={`status-badge status-${petitionDetails.statusClass || petitionDetails.status}`}>
                          {petitionDetails.status}
                        </span>
                      </p>
                    </div>
                  )}
                  
                  {petitionDetails.createdDate && (
                    <div className="col-6">
                      <span className="text-muted small">{t("common.created")}</span>
                      <p className="mb-0 fw-medium">{formatDate(petitionDetails.createdDate)}</p>
                    </div>
                  )}
                </div>

                <div className="row g-2 mt-2 pt-2 border-top">
                  {petitionDetails.property && (
                    <div className="col-md-6">
                      <span className="text-muted small">{t("modals.takeOver.propertyAddress")}</span>
                      <p className="mb-0 fw-medium small">
                        {[
                          petitionDetails.property.propertyStreet1,
                          petitionDetails.property.propertyStreet2,
                          petitionDetails.property.propertyCity,
                          petitionDetails.property.propertyState,
                          petitionDetails.property.propertyZip
                        ].filter(Boolean).join(", ") || "N/A"}
                      </p>
                    </div>
                  )}

                  {petitionDetails.filingEntity && (
                    <div className="col-md-6">
                      <span className="text-muted small">{t("modals.takeOver.filingEntity")}</span>
                      <p className="mb-0 fw-medium small">{petitionDetails.filingEntity.filingEntityLegalName || "N/A"}</p>
                    </div>
                  )}
                </div>

                <div className="row g-2 mt-2">
                  {duplicateInfo?.userName && (
                    <div className="col-md-6">
                      <span className="text-muted small">{t("modals.takeOver.currentOwner")}</span>
                      <p className="mb-0 fw-medium small">{duplicateInfo.userName}</p>
                    </div>
                  )}

                  {duplicateInfo?.userEmail && (
                    <div className="col-md-6">
                      <span className="text-muted small">{t("modals.takeOver.currentOwnerEmail")}</span>
                      <p className="mb-0 fw-medium small">{duplicateInfo.userEmail}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!isLoading && !error && (
              <div className="alert alert-info mb-0 py-2">
                <i className="fas fa-info-circle me-2"></i>
                <span className="small">
                  {t("modals.takeOver.confirmationMessage")}
                </span>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="dashboard-btn-refresh"
              onClick={onCancel}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="dashboard-btn-create"
              onClick={() => onConfirm(petitionRawData, duplicateInfo)}
              disabled={isLoading || !petitionRawData}
            >
              {t("modals.takeOver.confirmButton")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeOverPetitionModal;

