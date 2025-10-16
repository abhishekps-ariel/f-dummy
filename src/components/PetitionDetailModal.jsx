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


  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header bg-white border-bottom sticky-top">
            <div className="d-flex justify-content-between align-items-start w-100">
              {/* Left side - Petition Info */}
              <div className="flex-grow-1">
                <div className="d-flex align-items-center mb-2">
                  <h5 className="modal-title mb-0 me-3 text-dark">Petition Details - {petition.id}</h5>
                </div>
                
                {/* Address and Status Row */}
                <div className="d-flex justify-content-between align-items-center">
                  <div className="flex-grow-1">
                    <div className="text-muted mb-1">
                      {petition.propertyAddress}
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="ms-3">
                    <span className={getStatusBadgeClass(petition.status)}>
                      {petition.status}
                    </span>
                  </div>
                </div>
                
                {/* Dates Row */}
                <div className="d-flex justify-content-between align-items-center mt-1">
                  <div className="small text-muted">
                    Filed: {formatDate(petition.filingDate)}
                  </div>
                  <div className="small text-muted">
                    Last Updated: {petition.lastUpdated}
                  </div>
                </div>
              </div>
              
              {/* Right side - Close Button */}
              <div className="ms-3">
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={onClose}
                  aria-label="Close"
                ></button>
              </div>
            </div>
          </div>
          <div className="modal-body">
            <div className="container-fluid">

              {/* Single Column Layout */}
              <div className="row">
                <div className="col-12">
                  {/* Property Details */}
                  <div className="card mb-4">
                    <div className="card-header bg-light">
                      <h5 className="mb-0 fw-bolder">Property Details</h5>
                    </div>
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Street Address</label>
                          <div className="form-control-plaintext">
                            {petition.details?.street_address_line_1 || 'N/A'}
                            {petition.details?.street_address_line_2 && (
                              <><br />{petition.details.street_address_line_2}</>
                            )}
                          </div>
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-semibold">City</label>
                          <div className="form-control-plaintext">{petition.details?.city || 'N/A'}</div>
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-semibold">State</label>
                          <div className="form-control-plaintext">{petition.details?.state || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">ZIP Code</label>
                          <div className="form-control-plaintext">{petition.details?.zip_code || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">County</label>
                          <div className="form-control-plaintext">{petition.details?.county || 'N/A'}</div>
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
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Loan Account Number</label>
                          <div className="form-control-plaintext">{petition.details?.loan_account_number || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Lien Position</label>
                          <div className="form-control-plaintext">{petition.details?.lien_position || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Loan Type</label>
                          <div className="form-control-plaintext">{petition.details?.loan_type_term || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Year Originated</label>
                          <div className="form-control-plaintext">{petition.details?.year_originated || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Original Amount</label>
                          <div className="form-control-plaintext">{formatCurrency(petition.details?.original_amount)}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Current Amount</label>
                          <div className="form-control-plaintext">{formatCurrency(petition.details?.current_amount)}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Original Rate</label>
                          <div className="form-control-plaintext">{petition.details?.original_rate ? `${petition.details.original_rate}%` : 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Current Rate</label>
                          <div className="form-control-plaintext">{petition.details?.current_rate ? `${petition.details.current_rate}%` : 'N/A'}</div>
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
                            <h6 className="mb-3 fw-semibold">Borrower {index + 1}</h6>
                            <div className="row g-3">
                              <div className="col-md-4">
                                <label className="form-label fw-semibold">First Name</label>
                                <div className="form-control-plaintext">{borrower.first_name || 'N/A'}</div>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label fw-semibold">Middle Initial</label>
                                <div className="form-control-plaintext">{borrower.middle_initial || 'N/A'}</div>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label fw-semibold">Last Name</label>
                                <div className="form-control-plaintext">{borrower.last_name || 'N/A'}</div>
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
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label fw-semibold">Organization Name</label>
                          <div className="form-control-plaintext">{petition.details?.organization_name || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Contact First Name</label>
                          <div className="form-control-plaintext">{petition.details?.contact_first_name || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Contact Last Name</label>
                          <div className="form-control-plaintext">{petition.details?.contact_last_name || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Contact Phone</label>
                          <div className="form-control-plaintext">{petition.details?.contact_phone || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Contact Email</label>
                          <div className="form-control-plaintext">{petition.details?.contact_email || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right-to-Cure */}
                  <div className="card mb-4">
                    <div className="card-header bg-light">
                      <h5 className="mb-0 fw-bolder">Right-to-Cure (§35A)</h5>
                    </div>
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Notice Date</label>
                          <div className="form-control-plaintext">{formatDate(petition.details?.notice_date)}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Days Delinquent</label>
                          <div className="form-control-plaintext">{petition.details?.days_delinquent || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Amount in Default</label>
                          <div className="form-control-plaintext">{formatCurrency(petition.details?.amount_default)}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Cure Expiration Date</label>
                          <div className="form-control-plaintext">{formatDate(petition.details?.cure_expiration_date)}</div>
                        </div>
                        <div className="col-12">
                          <label className="form-label fw-semibold">Notice Mailing Address</label>
                          <div className="form-control-plaintext">{petition.details?.notice_mailing_address || 'N/A'}</div>
                        </div>
                        <div className="col-12">
                          <label className="form-label fw-semibold">Acceleration Date</label>
                          <div className="form-control-plaintext">{formatDate(petition.details?.acceleration_date)}</div>
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
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label fw-semibold">Form 35B Upload</label>
                          <div className="form-control-plaintext">
                            {petition.details?.form_35b_upload ? (
                              <span className="text-success">
                                Document uploaded
                              </span>
                            ) : (
                              <span className="text-muted">No document uploaded</span>
                            )}
                          </div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Affiant Name</label>
                          <div className="form-control-plaintext">{petition.details?.affiant_name || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Affiant Title</label>
                          <div className="form-control-plaintext">{petition.details?.affiant_title || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Affidavit Date</label>
                          <div className="form-control-plaintext">{formatDate(petition.details?.affidavit_date)}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Notary Information</label>
                          <div className="form-control-plaintext">{petition.details?.notary_info || 'N/A'}</div>
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
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label fw-semibold">Lender Name</label>
                          <div className="form-control-plaintext">{petition.details?.assignee_lender_name_1 || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Lender Type</label>
                          <div className="form-control-plaintext">{petition.details?.assignee_lender_type_1 || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Originator Name</label>
                          <div className="form-control-plaintext">{petition.details?.assignee_originator_name_1 || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">License Number</label>
                          <div className="form-control-plaintext">{petition.details?.assignee_license_number_1 || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">License State</label>
                          <div className="form-control-plaintext">{petition.details?.assignee_license_state_1 || 'N/A'}</div>
                        </div>
                        <div className="col-12">
                          <label className="form-label fw-semibold">Lender Address</label>
                          <div className="form-control-plaintext">{petition.details?.assignee_lender_address_1 || 'N/A'}</div>
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
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Attester First Name</label>
                          <div className="form-control-plaintext">{petition.details?.attester_first_name || 'N/A'}</div>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Middle Initial</label>
                          <div className="form-control-plaintext">{petition.details?.attester_middle_initial || 'N/A'}</div>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-semibold">Attester Last Name</label>
                          <div className="form-control-plaintext">{petition.details?.attester_last_name || 'N/A'}</div>
                        </div>
                        <div className="col-12">
                          <label className="form-label fw-semibold">Certification</label>
                          <div className="form-control-plaintext">
                            {petition.details?.certification_check ? (
                              <span className="text-success">
                                Certified
                              </span>
                            ) : (
                              <span className="text-muted">Not certified</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
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
