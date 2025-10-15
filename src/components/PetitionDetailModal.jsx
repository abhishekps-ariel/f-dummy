import React from 'react';

const PetitionDetailModal = ({ petition, isOpen, onClose }) => {
  if (!isOpen || !petition) return null;

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'status-badge status-Accepted';
      case 'submitted':
        return 'status-badge status-Submitted';
      case 'resubmitted':
        return 'status-badge status-Resubmitted';
      case 'returned':
        return 'status-badge status-Returned';
      case 'draft':
        return 'status-badge status-Draft';
      case 'closed':
        return 'status-badge status-Closed';
      default:
        return 'status-badge';
    }
  };

  const downloadPetitionDetails = () => {
    const details = petition.details || {};
    
    let content = `PETITION DETAILS - ${petition.id}\n`;
    content += `=====================================\n\n`;
    
    content += `PETITION OVERVIEW\n`;
    content += `-----------------\n`;
    content += `Petition ID: ${petition.id}\n`;
    content += `Status: ${petition.status}\n`;
    content += `Filing Date: ${formatDate(petition.filingDate)}\n`;
    content += `Last Updated: ${petition.lastUpdated}\n`;
    content += `Property Address: ${petition.propertyAddress}\n`;
    content += `Borrower: ${petition.borrower}\n`;
    content += `Loan Amount: ${petition.loanAmount}\n\n`;
    
    content += `PROPERTY DETAILS\n`;
    content += `----------------\n`;
    content += `Street Address: ${details.street_address || 'N/A'}\n`;
    content += `City: ${details.city || 'N/A'}\n`;
    content += `State: ${details.state || 'N/A'}\n`;
    content += `ZIP Code: ${details.zip_code || 'N/A'}\n`;
    content += `County: ${details.county || 'N/A'}\n\n`;
    
    content += `LOAN DETAILS\n`;
    content += `------------\n`;
    content += `Loan Account #: ${details.loan_account_number || 'N/A'}\n`;
    content += `Lien Position: ${details.lien_position || 'N/A'}\n`;
    content += `Loan Type: ${details.loan_type_term || 'N/A'}\n`;
    content += `Year Originated: ${details.year_originated || 'N/A'}\n`;
    content += `Original Amount: ${formatCurrency(details.original_amount)}\n`;
    content += `Current Amount: ${formatCurrency(details.current_amount)}\n`;
    content += `Original Rate: ${details.original_rate ? `${details.original_rate}%` : 'N/A'}\n`;
    content += `Current Rate: ${details.current_rate ? `${details.current_rate}%` : 'N/A'}\n\n`;
    
    if (details.borrowers && details.borrowers.length > 0) {
      content += `BORROWER DETAILS\n`;
      content += `----------------\n`;
      details.borrowers.forEach((borrower, index) => {
        content += `Borrower ${index + 1}:\n`;
        content += `  First Name: ${borrower.first_name || 'N/A'}\n`;
        content += `  Middle Initial: ${borrower.middle_initial || 'N/A'}\n`;
        content += `  Last Name: ${borrower.last_name || 'N/A'}\n\n`;
      });
    }
    
    content += `FILING ENTITY\n`;
    content += `-------------\n`;
    content += `Organization Name: ${details.organization_name || 'N/A'}\n`;
    content += `Contact First Name: ${details.contact_first_name || 'N/A'}\n`;
    content += `Contact Last Name: ${details.contact_last_name || 'N/A'}\n`;
    content += `Contact Phone: ${details.contact_phone || 'N/A'}\n`;
    content += `Contact Email: ${details.contact_email || 'N/A'}\n\n`;
    
    content += `RIGHT-TO-CURE (§35A)\n`;
    content += `--------------------\n`;
    content += `Notice Date: ${formatDate(details.notice_date)}\n`;
    content += `Days Delinquent: ${details.days_delinquent || 'N/A'}\n`;
    content += `Amount in Default: ${formatCurrency(details.amount_default)}\n`;
    content += `Cure Expiration: ${formatDate(details.cure_expiration_date)}\n`;
    content += `Notice Mailing Address: ${details.notice_mailing_address || 'N/A'}\n`;
    if (details.acceleration_date) {
      content += `Acceleration Date: ${formatDate(details.acceleration_date)}\n`;
    }
    content += `\n`;
    
    content += `FORM 35B COMPLIANCE\n`;
    content += `-------------------\n`;
    content += `Form 35B Upload: ${details.form_35b_upload ? 'Document uploaded' : 'No document uploaded'}\n`;
    content += `Affiant Name: ${details.affiant_name || 'N/A'}\n`;
    content += `Affiant Title: ${details.affiant_title || 'N/A'}\n`;
    content += `Affidavit Date: ${formatDate(details.affidavit_date)}\n`;
    content += `Notary Information: ${details.notary_info || 'N/A'}\n\n`;
    
    content += `LOAN ASSIGNEES\n`;
    content += `--------------\n`;
    content += `Lender Name: ${details.assignee_lender_name_1 || 'N/A'}\n`;
    content += `Lender Type: ${details.assignee_lender_type_1 || 'N/A'}\n`;
    content += `Originator Name: ${details.assignee_originator_name_1 || 'N/A'}\n`;
    content += `License Number: ${details.assignee_license_number_1 || 'N/A'}\n`;
    content += `License State: ${details.assignee_license_state_1 || 'N/A'}\n`;
    content += `Lender Address: ${details.assignee_lender_address_1 || 'N/A'}\n\n`;
    
    content += `PETITION ATTESTATION\n`;
    content += `--------------------\n`;
    content += `Attester First Name: ${details.attester_first_name || 'N/A'}\n`;
    content += `Middle Initial: ${details.attester_middle_initial || 'N/A'}\n`;
    content += `Attester Last Name: ${details.attester_last_name || 'N/A'}\n`;
    content += `Certification: ${details.certification_check ? 'Certified' : 'Not certified'}\n\n`;
    
    content += `Generated on: ${new Date().toLocaleString()}\n`;
    
    // Create and download the file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `petition-${petition.id}-details.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header text-white theme-bg">
            <h5 className="modal-title">
              Petition Details - {petition.id}
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <div className="container-fluid">
              {/* Header Section */}
              <div className="row mb-4">
                <div className="col-md-8">
                  <h4 className="theme-color mb-2">{petition.id}</h4>
                  <p className="text-muted mb-0">{petition.propertyAddress}</p>
                </div>
                <div className="col-md-4 text-end">
                  <span className={getStatusBadgeClass(petition.status)}>
                    {petition.status}
                  </span>
                  <div className="mt-2">
                    <small className="text-muted">
                      Filed: {formatDate(petition.filingDate)}
                    </small>
                  </div>
                  <div>
                    <small className="text-muted">
                      Last Updated: {petition.lastUpdated}
                    </small>
                  </div>
                </div>
              </div>

              <div className="row">
                {/* Left Column */}
                <div className="col-lg-6">
                  {/* Property Details */}
                  <div className="card mb-4">
                    <div className="card-header bg-light">
                      <h5 className="mb-0 fw-bolder">Property Details</h5>
                    </div>
                    <div className="card-body">
                      <div className="row g-2">
                        <div className="col-12">
                          <span className="fw-semibold">Street Address:</span>
                          <p className="mb-1">{petition.details?.street_address || 'N/A'}</p>
                        </div>
                        <div className="col-md-6">
                          <span className="fw-semibold">City:</span>
                          <p className="mb-1">{petition.details?.city || 'N/A'}</p>
                        </div>
                        <div className="col-md-6">
                          <span className="fw-semibold">State:</span>
                          <p className="mb-1">{petition.details?.state || 'N/A'}</p>
                        </div>
                        <div className="col-md-6">
                          <span className="fw-semibold">ZIP Code:</span>
                          <p className="mb-1">{petition.details?.zip_code || 'N/A'}</p>
                        </div>
                        <div className="col-md-6">
                          <span className="fw-semibold">County:</span>
                          <p className="mb-1">{petition.details?.county || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Loan Details */}
                  <div className="card mb-4">
                    <div className="card-header bg-light">
                      <h5 className="mb-0 fw-bolder">Loan Details</h5>
                    </div>
                    <div className="card-body">
                      <div className="row g-2">
                        <div className="col-md-6">
                          <span className="fw-semibold">Loan Account #:</span>
                          <p className="mb-1">{petition.details?.loan_account_number || 'N/A'}</p>
                        </div>
                        <div className="col-md-6">
                          <span className="fw-semibold">Lien Position:</span>
                          <p className="mb-1">{petition.details?.lien_position || 'N/A'}</p>
                        </div>
                        <div className="col-md-6">
                          <span className="fw-semibold">Loan Type:</span>
                          <p className="mb-1">{petition.details?.loan_type_term || 'N/A'}</p>
                        </div>
                        <div className="col-md-6">
                          <span className="fw-semibold">Year Originated:</span>
                          <p className="mb-1">{petition.details?.year_originated || 'N/A'}</p>
                        </div>
                        <div className="col-md-6">
                          <span className="fw-semibold">Original Amount:</span>
                          <p className="mb-1">{formatCurrency(petition.details?.original_amount)}</p>
                        </div>
                        <div className="col-md-6">
                          <span className="fw-semibold">Current Amount:</span>
                          <p className="mb-1">{formatCurrency(petition.details?.current_amount)}</p>
                        </div>
                        <div className="col-md-6">
                          <span className="fw-semibold">Original Rate:</span>
                          <p className="mb-1">{petition.details?.original_rate ? `${petition.details.original_rate}%` : 'N/A'}</p>
                        </div>
                        <div className="col-md-6">
                          <span className="fw-semibold">Current Rate:</span>
                          <p className="mb-1">{petition.details?.current_rate ? `${petition.details.current_rate}%` : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Borrower Details */}
                  <div className="card mb-4">
                    <div className="card-header bg-light">
                      <h5 className="mb-0 fw-bolder">Borrower Details</h5>
                    </div>
                    <div className="card-body">
                      {petition.details?.borrowers && petition.details.borrowers.length > 0 ? (
                        petition.details.borrowers.map((borrower, index) => (
                          <div key={borrower.id || index} className="border rounded p-3 mb-3">
                            <h6 className="mb-2">Borrower {index + 1}</h6>
                            <div className="row g-2">
                              <div className="col-md-4">
                                <span className="fw-semibold">First Name:</span>
                                <p className="mb-1">{borrower.first_name || 'N/A'}</p>
                              </div>
                              <div className="col-md-4">
                                <span className="fw-semibold">Middle Initial:</span>
                                <p className="mb-1">{borrower.middle_initial || 'N/A'}</p>
                              </div>
                              <div className="col-md-4">
                                <span className="fw-semibold">Last Name:</span>
                                <p className="mb-1">{borrower.last_name || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted">No borrower information available</p>
                      )}
                    </div>
                  </div>

                  {/* Filing Entity */}
                  <div className="card mb-4">
                    <div className="card-header bg-light">
                      <h5 className="mb-0 fw-bolder">Filing Entity</h5>
                    </div>
                    <div className="card-body">
                      <div className="row g-2">
                        <div className="col-12">
                          <span className="fw-semibold">Organization Name:</span>
                          <p className="mb-1">{petition.details?.organization_name || 'N/A'}</p>
                        </div>
                        <div className="col-md-6">
                          <span className="fw-semibold">Contact First Name:</span>
                          <p className="mb-1">{petition.details?.contact_first_name || 'N/A'}</p>
                        </div>
                        <div className="col-md-6">
                          <span className="fw-semibold">Contact Last Name:</span>
                          <p className="mb-1">{petition.details?.contact_last_name || 'N/A'}</p>
                        </div>
                        <div className="col-md-6">
                          <span className="fw-semibold">Contact Phone:</span>
                          <p className="mb-1">{petition.details?.contact_phone || 'N/A'}</p>
                        </div>
                        <div className="col-md-6">
                          <span className="fw-semibold">Contact Email:</span>
                          <p className="mb-1">{petition.details?.contact_email || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="col-lg-6">
                  {/* Right-to-Cure */}
                  <div className="card mb-4">
                    <div className="card-header bg-light">
                      <h5 className="mb-0 fw-bolder">Right-to-Cure (§35A)</h5>
                    </div>
                    <div className="card-body">
                      <div className="row g-2">
                        <div className="col-md-6">
                          <span className="fw-semibold">Notice Date:</span>
                          <p className="mb-1">{formatDate(petition.details?.notice_date)}</p>
                        </div>
                        <div className="col-md-6">
                          <span className="fw-semibold">Days Delinquent:</span>
                          <p className="mb-1">{petition.details?.days_delinquent || 'N/A'}</p>
                        </div>
                        <div className="col-md-6">
                          <span className="fw-semibold">Amount in Default:</span>
                          <p className="mb-1">{formatCurrency(petition.details?.amount_default)}</p>
                        </div>
                        <div className="col-md-6">
                          <span className="fw-semibold">Cure Expiration:</span>
                          <p className="mb-1">{formatDate(petition.details?.cure_expiration_date)}</p>
                        </div>
                        <div className="col-12">
                          <span className="fw-semibold">Notice Mailing Address:</span>
                          <p className="mb-1">{petition.details?.notice_mailing_address || 'N/A'}</p>
                        </div>
                        <div className="col-12">
                          <span className="fw-semibold">Acceleration Date:</span>
                          <p className="mb-1">{formatDate(petition.details?.acceleration_date)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form 35B Compliance */}
                  <div className="card mb-4">
                    <div className="card-header bg-light">
                      <h5 className="mb-0 fw-bolder">Form 35B Compliance</h5>
                    </div>
                    <div className="card-body">
                      <div className="row g-2">
                        <div className="col-12">
                          <span className="fw-semibold">Form 35B Upload:</span>
                          <p className="mb-1">
                            {petition.details?.form_35b_upload ? (
                              <span className="text-success">
                                Document uploaded
                              </span>
                            ) : (
                              <span className="text-muted">No document uploaded</span>
                            )}
                          </p>
                        </div>
                        <div className="col-md-6">
                          <span className="fw-semibold">Affiant Name:</span>
                          <p className="mb-1">{petition.details?.affiant_name || 'N/A'}</p>
                        </div>
                        <div className="col-md-6">
                          <span className="fw-semibold">Affiant Title:</span>
                          <p className="mb-1">{petition.details?.affiant_title || 'N/A'}</p>
                        </div>
                        <div className="col-md-6">
                          <span className="fw-semibold">Affidavit Date:</span>
                          <p className="mb-1">{formatDate(petition.details?.affidavit_date)}</p>
                        </div>
                        <div className="col-md-6">
                          <span className="fw-semibold">Notary Information:</span>
                          <p className="mb-1">{petition.details?.notary_info || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Loan Assignees */}
                  <div className="card mb-4">
                    <div className="card-header bg-light">
                      <h5 className="mb-0 fw-bolder">Loan Assignees</h5>
                    </div>
                    <div className="card-body">
                      <div className="row g-2">
                        <div className="col-12">
                          <span className="fw-semibold">Lender Name:</span>
                          <p className="mb-1">{petition.details?.assignee_lender_name_1 || 'N/A'}</p>
                        </div>
                        <div className="col-md-6">
                          <span className="fw-semibold">Lender Type:</span>
                          <p className="mb-1">{petition.details?.assignee_lender_type_1 || 'N/A'}</p>
                        </div>
                        <div className="col-md-6">
                          <span className="fw-semibold">Originator Name:</span>
                          <p className="mb-1">{petition.details?.assignee_originator_name_1 || 'N/A'}</p>
                        </div>
                        <div className="col-md-6">
                          <span className="fw-semibold">License Number:</span>
                          <p className="mb-1">{petition.details?.assignee_license_number_1 || 'N/A'}</p>
                        </div>
                        <div className="col-md-6">
                          <span className="fw-semibold">License State:</span>
                          <p className="mb-1">{petition.details?.assignee_license_state_1 || 'N/A'}</p>
                        </div>
                        <div className="col-12">
                          <span className="fw-semibold">Lender Address:</span>
                          <p className="mb-1">{petition.details?.assignee_lender_address_1 || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Petition Attestation */}
                  <div className="card mb-4">
                    <div className="card-header bg-light">
                      <h5 className="mb-0 fw-bolder">Petition Attestation</h5>
                    </div>
                    <div className="card-body">
                      <div className="row g-2">
                        <div className="col-md-4">
                          <span className="fw-semibold">Attester First Name:</span>
                          <p className="mb-1">{petition.details?.attester_first_name || 'N/A'}</p>
                        </div>
                        <div className="col-md-4">
                          <span className="fw-semibold">Middle Initial:</span>
                          <p className="mb-1">{petition.details?.attester_middle_initial || 'N/A'}</p>
                        </div>
                        <div className="col-md-4">
                          <span className="fw-semibold">Attester Last Name:</span>
                          <p className="mb-1">{petition.details?.attester_last_name || 'N/A'}</p>
                        </div>
                        <div className="col-12">
                          <span className="fw-semibold">Certification:</span>
                          <p className="mb-1">
                            {petition.details?.certification_check ? (
                              <span className="text-success">
                                Certified
                              </span>
                            ) : (
                              <span className="text-muted">Not certified</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="row mt-4">
                <div className="col-12">
                  <div className="d-flex justify-content-end">
                    <button
                      className="dashboard-btn-refresh"
                      type="button"
                      onClick={downloadPetitionDetails}
                      title="Download petition details"
                    >
                      <i className="fa-solid fa-download me-2"></i>
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetitionDetailModal;
