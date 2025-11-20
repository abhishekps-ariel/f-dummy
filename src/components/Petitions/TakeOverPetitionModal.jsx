import React, { useState, useEffect } from "react";
import petitionApiService from "../../services/petitionApiService";
import { formatDate } from "../../utils/dateUtils";

const TakeOverPetitionModal = ({ isOpen, duplicateInfo, onConfirm, onCancel }) => {
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
        if (response.success && response.data) {
          // Store raw data for pre-filling
          setPetitionRawData(response.data);
          
          // Transform the response to get readable status
          const transformed = petitionApiService.transformSinglePetitionResponse(response);
          if (transformed) {
            setPetitionDetails({
              ...transformed,
              property: transformed.details?.property,
              filingEntity: transformed.details?.filingEntity,
            });
          } else {
            setPetitionDetails(response.data);
          }
        } else {
          setError("Failed to load petition details");
        }
      } catch (err) {
        console.error("Error fetching petition details:", err);
        setError("Failed to load petition details");
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
            <h5 className="modal-title">Take Over Petition</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onCancel}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <p className="mb-2 small">
              A petition with the same property already exists.
            </p>
            
            {isLoading && (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted small mt-2">Loading petition details...</p>
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
                  Existing Petition Details
                </h6>
                
                <div className="row g-2 mb-1">
                  {petitionDetails.petitionNumber && (
                    <div className="col-12">
                      <span className="text-muted small">Petition Number:</span>
                      <p className="mb-0 fw-medium">{petitionDetails.petitionNumber}</p>
                    </div>
                  )}
                  
                  {petitionDetails.status && (
                    <div className="col-6">
                      <span className="text-muted small">Status:</span>
                      <p className="mb-0 fw-medium">
                        <span className={`status-badge status-${petitionDetails.statusClass || petitionDetails.status}`}>
                          {petitionDetails.status}
                        </span>
                      </p>
                    </div>
                  )}
                  
                  {petitionDetails.createdDate && (
                    <div className="col-6">
                      <span className="text-muted small">Created:</span>
                      <p className="mb-0 fw-medium">{formatDate(petitionDetails.createdDate)}</p>
                    </div>
                  )}
                </div>

                <div className="row g-2 mt-2 pt-2 border-top">
                  {petitionDetails.property && (
                    <div className="col-md-6">
                      <span className="text-muted small">Property Address:</span>
                      <p className="mb-0 fw-medium small">
                        {[
                          petitionDetails.property.propertyStreet1,
                          petitionDetails.property.propertyStreet2,
                          petitionDetails.property.propertyCity,
                          petitionDetails.property.propertyState,
                          petitionDetails.property.propertyZip
                        ].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  )}

                  {petitionDetails.filingEntity && (
                    <div className="col-md-6">
                      <span className="text-muted small">Filing Entity:</span>
                      <p className="mb-0 fw-medium small">{petitionDetails.filingEntity.filingEntityLegalName}</p>
                    </div>
                  )}
                </div>

                <div className="row g-2 mt-2">
                  {duplicateInfo?.userName && (
                    <div className="col-md-6">
                      <span className="text-muted small">Current Owner:</span>
                      <p className="mb-0 fw-medium small">{duplicateInfo.userName}</p>
                    </div>
                  )}

                  {duplicateInfo?.userEmail && (
                    <div className="col-md-6">
                      <span className="text-muted small">Current Owner Email:</span>
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
                  Clicking "Take Over Petition" will make you the new owner of this petition.
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
              Cancel
            </button>
            <button
              type="button"
              className="dashboard-btn-create"
              onClick={() => onConfirm(petitionRawData, duplicateInfo)}
              disabled={isLoading || !petitionRawData}
            >
              Take Over Petition
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeOverPetitionModal;

