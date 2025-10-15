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
                          <p className="mb-1">
                            {petition.details?.street_address_line_1 || 'N/A'}
                            {petition.details?.street_address_line_2 && (
                              <><br />{petition.details.street_address_line_2}</>
                            )}
                          </p>
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

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetitionDetailModal;
