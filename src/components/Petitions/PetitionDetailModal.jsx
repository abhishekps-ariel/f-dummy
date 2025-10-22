import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  const getStatusBadgeClass = (status, statusClass) => {
    // Use the statusClass from API if available, otherwise fallback to status text
    if (statusClass) {
      return `status-badge status-${statusClass}`;
    }
    
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'status-badge status-accepted';
      case 'submitted':
        return 'status-badge status-submitted';
      case 'resubmitted':
        return 'status-badge status-submitted';
      case 'returned':
        return 'status-badge status-returned';
      case 'draft':
        return 'status-badge status-draft';
      case 'under review':
        return 'status-badge status-under-review';
      case 'rejected':
        return 'status-badge status-rejected';
      case 'closed':
        return 'status-badge status-closed';
      default:
        return 'status-badge';
    }
  };


  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      let yPosition = 20;

    // Add header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FILIR - Foreclosure Intake & Loan Information Resource', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(14);
      doc.text(`Petition Details - ${petition.petitionNumber}`, 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Property Address: ${petition.propertyAddress}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Status: ${petition.status} | Filed: ${formatDate(petition.filingDate)} | Last Updated: ${petition.lastUpdated}`, 20, yPosition);
    yPosition += 15;

    // Property Details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Property Details', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const propertyData = [
      ['Street Address', petition.details?.property?.propertyStreet1 || 'N/A'],
      ['Address Line 2', petition.details?.property?.propertyStreet2 || 'N/A'],
      ['City', petition.details?.property?.propertyCity || 'N/A'],
      ['State', petition.details?.property?.propertyState || 'N/A'],
      ['ZIP Code', petition.details?.property?.propertyZip || 'N/A'],
      ['County', petition.details?.property?.propertyCounty || 'N/A']
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Field', 'Value']],
      body: propertyData,
      theme: 'grid',
      headStyles: { fillColor: [52, 73, 94] },
      styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Loan Details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Loan Details', 20, yPosition);
    yPosition += 10;

    const loanData = [
      ['MIN Number', petition.details?.loan?.minNumber || 'N/A'],
      ['Loan Number', petition.details?.loan?.loanNumber || 'N/A'],
      ['Loan Type', petition.details?.loan?.petitionLoanTypeName || 'N/A'],
      ['Lien Position', petition.details?.loan?.lienPosition || 'N/A'],
      ['Origination Date', formatDate(petition.details?.loan?.originationDate)],
      ['Original Amount', formatCurrency(petition.details?.loan?.originalPrincipalAmount)],
      ['Current Amount', formatCurrency(petition.details?.loan?.currentPrincipalBalance)],
      ['Interest Rate', petition.details?.loan?.interestRatePercent ? `${petition.details.loan.interestRatePercent}%` : 'N/A'],
      ['Monthly Payment', formatCurrency(petition.details?.loan?.monthlyPaymentAmount)],
      ['Delinquency Days', petition.details?.loan?.delinquencyDaysAtFiling || 'N/A']
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Field', 'Value']],
      body: loanData,
      theme: 'grid',
      headStyles: { fillColor: [52, 73, 94] },
      styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Borrower Details
    if (petition.details?.borrowers && petition.details.borrowers.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Borrower Details', 20, yPosition);
      yPosition += 10;

      petition.details.borrowers.forEach((borrower, index) => {
        const borrowerData = [
          ['First Name', borrower.firstName || 'N/A'],
          ['Middle Name', borrower.middleName || 'N/A'],
          ['Last Name', borrower.lastName || 'N/A'],
          ['Suffix', borrower.suffix || 'N/A'],
          ['Primary Borrower', borrower.borrowerIsPrimary ? 'Yes' : 'No'],
          ['Email', borrower.email || 'N/A'],
          ['Phone', borrower.phone || 'N/A']
        ];

        autoTable(doc, {
          startY: yPosition,
          head: [[`Borrower ${index + 1}`, '']],
          body: borrowerData,
          theme: 'grid',
          headStyles: { fillColor: [70, 130, 180] },
          styles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } }
        });

        yPosition = doc.lastAutoTable.finalY + 10;
      });
    }

    // Filing Entity
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Filing Entity', 20, yPosition);
    yPosition += 10;

    const filingEntityData = [
      ['Filing Entity Legal Name', petition.details?.filingEntity?.filingEntityLegalName || 'N/A'],
      ['Contact Name', petition.details?.filingEntity?.filingContactName || 'N/A'],
      ['Contact Phone', petition.details?.filingEntity?.filingContactPhone || 'N/A'],
      ['Contact Email', petition.details?.filingEntity?.filingContactEmail || 'N/A'],
      ['NMLS License Number', petition.details?.filingEntity?.nmlsLicenseNumber || 'N/A'],
      ['State License Number', petition.details?.filingEntity?.stateLicenseNumber || 'N/A'],
      ['State License State', petition.details?.filingEntity?.stateLicenseState || 'N/A']
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Field', 'Value']],
      body: filingEntityData,
      theme: 'grid',
      headStyles: { fillColor: [52, 73, 94] },
      styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Right-to-Cure
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Right-to-Cure (§35A)', 20, yPosition);
    yPosition += 10;

    const rightToCureData = [
      ['Notice Sent', petition.details?.rightToCure?.noticeSent ? 'Yes' : 'No'],
      ['Notice Date', formatDate(petition.details?.rightToCure?.noticeDate)],
      ['Days Delinquent at Notice', petition.details?.rightToCure?.daysDelinquentAtNotice || 'N/A'],
      ['Amount in Default', formatCurrency(petition.details?.rightToCure?.amountInDefault)],
      ['Cure Expiration Date', formatDate(petition.details?.rightToCure?.cureExpirationDate)],
      ['Manual Override Reason', petition.details?.rightToCure?.manualOverrideReason || 'N/A'],
      ['Notice Address', petition.details?.rightToCure?.noticeAddressStreet1 || 'N/A']
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Field', 'Value']],
      body: rightToCureData,
      theme: 'grid',
      headStyles: { fillColor: [52, 73, 94] },
      styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Form 35B Compliance
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Form 35B Compliance', 20, yPosition);
    yPosition += 10;

    const form35BData = [
      ['Certain Mortgage Loan', petition.details?.affidavit?.certainMortgageLoan ? 'Yes' : 'No'],
      ['Form 35B Compliance Affidavit', petition.details?.affidavit?.form35bComplianceAffidavitPdf ? 'Document uploaded' : 'No document uploaded'],
      ['Form 35B Non-Applicability Affidavit', petition.details?.affidavit?.form35bNonApplicabilityAffidavitPdf ? 'Document uploaded' : 'No document uploaded'],
      ['Affiant Name', petition.details?.affidavit?.affiantName || 'N/A'],
      ['Affiant Title', petition.details?.affidavit?.affiantTitle || 'N/A'],
      ['Affidavit Execution Date', formatDate(petition.details?.affidavit?.affidavitExecutionDate)]
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Field', 'Value']],
      body: form35BData,
      theme: 'grid',
      headStyles: { fillColor: [52, 73, 94] },
      styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Loan Assignees
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Loan Assignees', 20, yPosition);
    yPosition += 10;

    // Loan Assignees
    if (petition.details?.loanAssignees && petition.details.loanAssignees.length > 0) {
      petition.details.loanAssignees.forEach((assignee, index) => {
        const assigneeData = [
          ['Assignee Name', assignee.assigneeName || 'N/A'],
          ['Assignee Type ID', assignee.assigneeTypeId || 'N/A'],
          ['Assignee Role ID', assignee.assigneeRoleId || 'N/A'],
          ['Contact Email', assignee.contactEmail || 'N/A'],
          ['Contact Phone', assignee.contactPhone || 'N/A']
        ];

        autoTable(doc, {
          startY: yPosition,
          head: [[`Assignee ${index + 1}`, '']],
          body: assigneeData,
          theme: 'grid',
          headStyles: { fillColor: [70, 130, 180] },
          styles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } }
        });

        yPosition = doc.lastAutoTable.finalY + 10;
      });
    } else {
      const assigneeData = [
        ['No assignee information available', '']
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Loan Assignees', '']],
        body: assigneeData,
        theme: 'grid',
        headStyles: { fillColor: [52, 73, 94] },
        styles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }


    // Petition Attestation
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Petition Attestation', 20, yPosition);
    yPosition += 10;

    // Signatures
    if (petition.details?.signatures && petition.details.signatures.length > 0) {
      petition.details.signatures.forEach((signature, index) => {
        const signatureData = [
          ['Signer Full Name', signature.signerFullName || 'N/A'],
          ['Signer Title', signature.signerTitle || 'N/A'],
          ['Signer Email', signature.signerEmail || 'N/A'],
          ['E-Sign Consent', signature.esignConsent ? 'Yes' : 'No'],
          ['Signed At', formatDate(signature.signedAt)],
          ['Signer IP', signature.signerIp || 'N/A']
        ];

        autoTable(doc, {
          startY: yPosition,
          head: [[`Signature ${index + 1}`, '']],
          body: signatureData,
          theme: 'grid',
          headStyles: { fillColor: [70, 130, 180] },
          styles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } }
        });

        yPosition = doc.lastAutoTable.finalY + 10;
      });
    } else {
      const signatureData = [
        ['No signature information available', '']
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Signatures', '']],
        body: signatureData,
        theme: 'grid',
        headStyles: { fillColor: [52, 73, 94] },
        styles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }


      // Save the PDF
      doc.save(`petition-${petition.petitionNumber}-details.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };


  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header bg-white border-bottom sticky-top">
            <div className="d-flex justify-content-between align-items-center w-100">
              {/* Left side - Petition Info */}
              <div className="flex-grow-1">
                <h5 className="modal-title mb-1 text-dark">Petition Details - {petition.petitionNumber}</h5>
                <div className="text-muted mb-1">{petition.propertyAddress}</div>
                <div className="d-flex align-items-center gap-3">
                  <span className="small text-muted">Filed: {formatDate(petition.filingDate)}</span>
                  <span className="small text-muted">Last Updated: {petition.lastUpdated}</span>
                   <span className={getStatusBadgeClass(petition.status, petition.statusClass)}>
                     {petition.status}
                   </span>
                </div>
              </div>
              
              {/* Right side - Action Buttons and Close */}
              <div className="d-flex align-items-center gap-2">
                <button 
                  type="button" 
                  className="dashboard-btn-refresh"
                  onClick={handleDownloadPDF}
                  title="Download as PDF"
                >
                  <i className="fas fa-download me-1"></i>
                  PDF
                </button>
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
            <div className="container-fluid" id="petition-detail-content">

              {/* Single Column Layout */}
              <div className="row">
                <div className="col-12">
                  {/* Property Details */}
                  <div className="card mb-4 border-0 shadow-sm">
                    <div className="card-header bg-transparent border-0 pb-0">
                      <h5 className="mb-3 fw-bold text-dark border-bottom pb-2">Property Details</h5>
                    </div>
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Street Address</label>
                          <div className="form-control-plaintext">
                            {petition.details?.property?.propertyStreet1 || 'N/A'}
                            {petition.details?.property?.propertyStreet2 && (
                              <><br />{petition.details.property.propertyStreet2}</>
                            )}
                          </div>
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-semibold">City</label>
                          <div className="form-control-plaintext">{petition.details?.property?.propertyCity || 'N/A'}</div>
                        </div>
                        <div className="col-md-3">
                          <label className="form-label fw-semibold">State</label>
                          <div className="form-control-plaintext">{petition.details?.property?.propertyState || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">ZIP Code</label>
                          <div className="form-control-plaintext">{petition.details?.property?.propertyZip || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">County</label>
                          <div className="form-control-plaintext">{petition.details?.property?.propertyCounty || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Assessor Parcel ID</label>
                          <div className="form-control-plaintext">{petition.details?.property?.assessorParcelId || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Loan Details */}
                  <div className="card mb-4 border-0 shadow-sm">
                    <div className="card-header bg-transparent border-0 pb-0">
                      <h5 className="mb-3 fw-bold text-dark border-bottom pb-2">Loan Details</h5>
                    </div>
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">MIN Number</label>
                          <div className="form-control-plaintext">{petition.details?.loan?.minNumber || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Loan Number</label>
                          <div className="form-control-plaintext">{petition.details?.loan?.loanNumber || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Loan Type</label>
                          <div className="form-control-plaintext">{petition.details?.loan?.petitionLoanTypeName || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Lien Position</label>
                          <div className="form-control-plaintext">{petition.details?.loan?.lienPosition || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Origination Date</label>
                          <div className="form-control-plaintext">{formatDate(petition.details?.loan?.originationDate)}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Original Principal Amount</label>
                          <div className="form-control-plaintext">{formatCurrency(petition.details?.loan?.originalPrincipalAmount)}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Current Principal Balance</label>
                          <div className="form-control-plaintext">{formatCurrency(petition.details?.loan?.currentPrincipalBalance)}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Interest Rate</label>
                          <div className="form-control-plaintext">{petition.details?.loan?.interestRatePercent ? `${petition.details.loan.interestRatePercent}%` : 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Monthly Payment Amount</label>
                          <div className="form-control-plaintext">{formatCurrency(petition.details?.loan?.monthlyPaymentAmount)}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Delinquency Days at Filing</label>
                          <div className="form-control-plaintext">{petition.details?.loan?.delinquencyDaysAtFiling || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Variable Rate</label>
                          <div className="form-control-plaintext">{petition.details?.loan?.variableRate ? 'Yes' : 'No'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Interest Only</label>
                          <div className="form-control-plaintext">{petition.details?.loan?.interestOnly ? 'Yes' : 'No'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Negative Amortization</label>
                          <div className="form-control-plaintext">{petition.details?.loan?.negativeAmortization ? 'Yes' : 'No'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Borrower Details */}
                  <div className="card mb-4 border-0 shadow-sm">
                    <div className="card-header bg-transparent border-0 pb-0">
                      <h5 className="mb-3 fw-bold text-dark border-bottom pb-2">Borrower Details</h5>
                    </div>
                    <div className="card-body">
                      {petition.details?.borrowers && petition.details.borrowers.length > 0 ? (
                        petition.details.borrowers.map((borrower, index) => (
                          <div key={borrower.id || index} className="border rounded p-3 mb-3">
                            <h6 className="mb-3 fw-semibold">Borrower {index + 1}</h6>
                            <div className="row g-3">
                              <div className="col-md-3">
                                <label className="form-label fw-semibold">First Name</label>
                                <div className="form-control-plaintext">{borrower.firstName || 'N/A'}</div>
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-semibold">Middle Name</label>
                                <div className="form-control-plaintext">{borrower.middleName || 'N/A'}</div>
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-semibold">Last Name</label>
                                <div className="form-control-plaintext">{borrower.lastName || 'N/A'}</div>
                              </div>
                              <div className="col-md-3">
                                <label className="form-label fw-semibold">Suffix</label>
                                <div className="form-control-plaintext">{borrower.suffix || 'N/A'}</div>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-semibold">Primary Borrower</label>
                                <div className="form-control-plaintext">{borrower.borrowerIsPrimary ? 'Yes' : 'No'}</div>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-semibold">Email</label>
                                <div className="form-control-plaintext">{borrower.email || 'N/A'}</div>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-semibold">Phone</label>
                                <div className="form-control-plaintext">{borrower.phone || 'N/A'}</div>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-semibold">Mailing Address</label>
                                <div className="form-control-plaintext">{borrower.mailingStreet1 || 'N/A'}</div>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label fw-semibold">Mailing City</label>
                                <div className="form-control-plaintext">{borrower.mailingCity || 'N/A'}</div>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label fw-semibold">Mailing State</label>
                                <div className="form-control-plaintext">{borrower.mailingState || 'N/A'}</div>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label fw-semibold">Mailing ZIP</label>
                                <div className="form-control-plaintext">{borrower.mailingZip || 'N/A'}</div>
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
                  <div className="card mb-4 border-0 shadow-sm">
                    <div className="card-header bg-transparent border-0 pb-0">
                      <h5 className="mb-3 fw-bold text-dark border-bottom pb-2">Filing Entity</h5>
                    </div>
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label fw-semibold">Filing Entity Legal Name</label>
                          <div className="form-control-plaintext">{petition.details?.filingEntity?.filingEntityLegalName || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Contact Name</label>
                          <div className="form-control-plaintext">{petition.details?.filingEntity?.filingContactName || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Contact Email</label>
                          <div className="form-control-plaintext">{petition.details?.filingEntity?.filingContactEmail || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Contact Phone</label>
                          <div className="form-control-plaintext">{petition.details?.filingEntity?.filingContactPhone || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">NMLS License Number</label>
                          <div className="form-control-plaintext">{petition.details?.filingEntity?.nmlsLicenseNumber || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right-to-Cure */}
                  <div className="card mb-4 border-0 shadow-sm">
                    <div className="card-header bg-transparent border-0 pb-0">
                      <h5 className="mb-3 fw-bold text-dark border-bottom pb-2">Right-to-Cure (§35A)</h5>
                    </div>
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Notice Sent</label>
                          <div className="form-control-plaintext">{petition.details?.rightToCure?.noticeSent ? 'Yes' : 'No'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Notice Date</label>
                          <div className="form-control-plaintext">{formatDate(petition.details?.rightToCure?.noticeDate)}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Days Delinquent at Notice</label>
                          <div className="form-control-plaintext">{petition.details?.rightToCure?.daysDelinquentAtNotice || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Amount in Default</label>
                          <div className="form-control-plaintext">{formatCurrency(petition.details?.rightToCure?.amountInDefault)}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Cure Expiration Date</label>
                          <div className="form-control-plaintext">{formatDate(petition.details?.rightToCure?.cureExpirationDate)}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Manual Override Reason</label>
                          <div className="form-control-plaintext">{petition.details?.rightToCure?.manualOverrideReason || 'N/A'}</div>
                        </div>
                        <div className="col-12">
                          <label className="form-label fw-semibold">Notice Address</label>
                          <div className="form-control-plaintext">
                            {petition.details?.rightToCure?.noticeAddressStreet1 && (
                              <div>
                                {petition.details.rightToCure.noticeAddressStreet1}
                                {petition.details.rightToCure.noticeAddressCity && `, ${petition.details.rightToCure.noticeAddressCity}`}
                                {petition.details.rightToCure.noticeAddressState && `, ${petition.details.rightToCure.noticeAddressState}`}
                                {petition.details.rightToCure.noticeAddressZip && ` ${petition.details.rightToCure.noticeAddressZip}`}
                              </div>
                            )}
                            {!petition.details?.rightToCure?.noticeAddressStreet1 && 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form 35B Compliance */}
                  <div className="card mb-4 border-0 shadow-sm">
                    <div className="card-header bg-transparent border-0 pb-0">
                      <h5 className="mb-3 fw-bold text-dark border-bottom pb-2">Form 35B Compliance</h5>
                    </div>
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label fw-semibold">Certain Mortgage Loan</label>
                          <div className="form-control-plaintext">{petition.details?.affidavit?.certainMortgageLoan ? 'Yes' : 'No'}</div>
                        </div>
                        <div className="col-12">
                          <label className="form-label fw-semibold">Form 35B Compliance Affidavit PDF</label>
                          <div className="form-control-plaintext">
                            {petition.details?.affidavit?.form35bComplianceAffidavitPdf ? (
                              <span className="text-success">Document uploaded</span>
                            ) : (
                              <span className="text-muted">No document uploaded</span>
                            )}
                          </div>
                        </div>
                        <div className="col-12">
                          <label className="form-label fw-semibold">Form 35B Non-Applicability Affidavit PDF</label>
                          <div className="form-control-plaintext">
                            {petition.details?.affidavit?.form35bNonApplicabilityAffidavitPdf ? (
                              <span className="text-success">Document uploaded</span>
                            ) : (
                              <span className="text-muted">No document uploaded</span>
                            )}
                          </div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Affiant Name</label>
                          <div className="form-control-plaintext">{petition.details?.affidavit?.affiantName || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Affiant Title</label>
                          <div className="form-control-plaintext">{petition.details?.affidavit?.affiantTitle || 'N/A'}</div>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Affidavit Execution Date</label>
                          <div className="form-control-plaintext">{formatDate(petition.details?.affidavit?.affidavitExecutionDate)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Loan Assignees */}
                  <div className="card mb-4 border-0 shadow-sm">
                    <div className="card-header bg-transparent border-0 pb-0">
                      <h5 className="mb-3 fw-bold text-dark border-bottom pb-2">Loan Assignees</h5>
                    </div>
                    <div className="card-body">
                      {petition.details?.loanAssignees && petition.details.loanAssignees.length > 0 ? (
                        petition.details.loanAssignees.map((assignee, index) => (
                          <div key={index} className="border rounded p-3 mb-3">
                            <h6 className="mb-3 fw-semibold">Assignee {index + 1}</h6>
                            <div className="row g-3">
                              <div className="col-md-6">
                                <label className="form-label fw-semibold">Assignee Name</label>
                                <div className="form-control-plaintext">{assignee.assigneeName || 'N/A'}</div>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-semibold">Contact Email</label>
                                <div className="form-control-plaintext">{assignee.contactEmail || 'N/A'}</div>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-semibold">Contact Phone</label>
                                <div className="form-control-plaintext">{assignee.contactPhone || 'N/A'}</div>
                              </div>
                            </div>
                          </div>
                        ))
                        ) : (
                          <p className="text-muted">No assignee information available</p>
                        )}
                      
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="card mb-4 border-0 shadow-sm">
                    <div className="card-header bg-transparent border-0 pb-0">
                      <h5 className="mb-3 fw-bold text-dark border-bottom pb-2">Signatures</h5>
                    </div>
                    <div className="card-body">
                      {petition.details?.signatures && petition.details.signatures.length > 0 ? (
                        petition.details.signatures.map((signature, index) => (
                          <div key={index} className="border rounded p-3 mb-3">
                            <h6 className="mb-3 fw-semibold">Signature {index + 1}</h6>
                            <div className="row g-3">
                              <div className="col-md-6">
                                <label className="form-label fw-semibold">Signer Full Name</label>
                                <div className="form-control-plaintext">{signature.signerFullName || 'N/A'}</div>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-semibold">Signer Title</label>
                                <div className="form-control-plaintext">{signature.signerTitle || 'N/A'}</div>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-semibold">Signer Email</label>
                                <div className="form-control-plaintext">{signature.signerEmail || 'N/A'}</div>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-semibold">E-Sign Consent</label>
                                <div className="form-control-plaintext">{signature.esignConsent ? 'Yes' : 'No'}</div>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-semibold">Signed At</label>
                                <div className="form-control-plaintext">{formatDate(signature.signedAt)}</div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted">No signature information available</p>
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
  );
};

export default PetitionDetailModal;
