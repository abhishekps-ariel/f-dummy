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

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const printContent = document.getElementById('petition-detail-content');
    
    if (printContent) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Petition Details - ${petition.id}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .print-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
              .print-section { margin-bottom: 25px; page-break-inside: avoid; }
              .print-section h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px; }
              .print-row { display: flex; margin-bottom: 8px; }
              .print-label { font-weight: bold; width: 200px; }
              .print-value { flex: 1; }
              .print-borrower { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; }
              @media print {
                body { margin: 0; }
                .print-section { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="print-header">
              <h1>FILIR - Foreclosure Intake & Loan Information Resource</h1>
              <h2>Petition Details - ${petition.id}</h2>
              <p><strong>Property Address:</strong> ${petition.propertyAddress}</p>
              <p><strong>Status:</strong> ${petition.status} | <strong>Filed:</strong> ${formatDate(petition.filingDate)} | <strong>Last Updated:</strong> ${petition.lastUpdated}</p>
            </div>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
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
    doc.text(`Petition Details - ${petition.id}`, 20, yPosition);
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
      ['Street Address', petition.details?.street_address_line_1 || 'N/A'],
      ['Address Line 2', petition.details?.street_address_line_2 || 'N/A'],
      ['City', petition.details?.city || 'N/A'],
      ['State', petition.details?.state || 'N/A'],
      ['ZIP Code', petition.details?.zip_code || 'N/A'],
      ['County', petition.details?.county || 'N/A']
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
      ['Loan Account Number', petition.details?.loan_account_number || 'N/A'],
      ['Lien Position', petition.details?.lien_position || 'N/A'],
      ['Loan Type', petition.details?.loan_type_term || 'N/A'],
      ['Year Originated', petition.details?.year_originated || 'N/A'],
      ['Original Amount', formatCurrency(petition.details?.original_amount)],
      ['Current Amount', formatCurrency(petition.details?.current_amount)],
      ['Original Rate', petition.details?.original_rate ? `${petition.details.original_rate}%` : 'N/A'],
      ['Current Rate', petition.details?.current_rate ? `${petition.details.current_rate}%` : 'N/A']
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
          ['First Name', borrower.first_name || 'N/A'],
          ['Middle Initial', borrower.middle_initial || 'N/A'],
          ['Last Name', borrower.last_name || 'N/A']
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
      ['Organization Name', petition.details?.organization_name || 'N/A'],
      ['Contact First Name', petition.details?.contact_first_name || 'N/A'],
      ['Contact Last Name', petition.details?.contact_last_name || 'N/A'],
      ['Contact Phone', petition.details?.contact_phone || 'N/A'],
      ['Contact Email', petition.details?.contact_email || 'N/A']
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
      ['Notice Date', formatDate(petition.details?.notice_date)],
      ['Days Delinquent', petition.details?.days_delinquent || 'N/A'],
      ['Amount in Default', formatCurrency(petition.details?.amount_default)],
      ['Cure Expiration Date', formatDate(petition.details?.cure_expiration_date)],
      ['Notice Mailing Address', petition.details?.notice_mailing_address || 'N/A'],
      ['Acceleration Date', formatDate(petition.details?.acceleration_date)]
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
      ['Form 35B Upload', petition.details?.form_35b_upload ? 'Document uploaded' : 'No document uploaded'],
      ['Affiant Name', petition.details?.affiant_name || 'N/A'],
      ['Affiant Title', petition.details?.affiant_title || 'N/A'],
      ['Affidavit Date', formatDate(petition.details?.affidavit_date)],
      ['Notary Information', petition.details?.notary_info || 'N/A']
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

    const assigneeData = [
      ['Lender Name', petition.details?.assignee_lender_name_1 || 'N/A'],
      ['Lender Type', petition.details?.assignee_lender_type_1 || 'N/A'],
      ['Originator Name', petition.details?.assignee_originator_name_1 || 'N/A'],
      ['License Number', petition.details?.assignee_license_number_1 || 'N/A'],
      ['License State', petition.details?.assignee_license_state_1 || 'N/A'],
      ['Lender Address', petition.details?.assignee_lender_address_1 || 'N/A']
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Field', 'Value']],
      body: assigneeData,
      theme: 'grid',
      headStyles: { fillColor: [52, 73, 94] },
      styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Petition Attestation
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Petition Attestation', 20, yPosition);
    yPosition += 10;

    const attestationData = [
      ['Attester First Name', petition.details?.attester_first_name || 'N/A'],
      ['Middle Initial', petition.details?.attester_middle_initial || 'N/A'],
      ['Attester Last Name', petition.details?.attester_last_name || 'N/A'],
      ['Certification', petition.details?.certification_check ? 'Certified' : 'Not certified']
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Field', 'Value']],
      body: attestationData,
      theme: 'grid',
      headStyles: { fillColor: [52, 73, 94] },
      styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } }
    });

      // Save the PDF
      doc.save(`petition-${petition.id}-details.pdf`);
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
                <h5 className="modal-title mb-1 text-dark">Petition Details - {petition.id}</h5>
                <div className="text-muted mb-1">{petition.propertyAddress}</div>
                <div className="d-flex align-items-center gap-3">
                  <span className="small text-muted">Filed: {formatDate(petition.filingDate)}</span>
                  <span className="small text-muted">Last Updated: {petition.lastUpdated}</span>
                   <span className={getStatusBadgeClass(petition.status)}>
                    {petition.status}
                  </span>
                </div>
              </div>
              
              {/* Right side - Action Buttons and Close */}
              <div className="d-flex align-items-center gap-2">
                <button 
                  type="button" 
                  className="dashboard-btn-refresh"
                  onClick={handlePrint}
                  title="Print petition details"
                >
                  <i className="fas fa-print me-1"></i>
                  Print
                </button>
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
                  <div className="card mb-4 border-0 shadow-sm">
                    <div className="card-header bg-transparent border-0 pb-0">
                      <h5 className="mb-3 fw-bold text-dark border-bottom pb-2">Loan Details</h5>
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
                  <div className="card mb-4 border-0 shadow-sm">
                    <div className="card-header bg-transparent border-0 pb-0">
                      <h5 className="mb-3 fw-bold text-dark border-bottom pb-2">Filing Entity</h5>
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
                  <div className="card mb-4 border-0 shadow-sm">
                    <div className="card-header bg-transparent border-0 pb-0">
                      <h5 className="mb-3 fw-bold text-dark border-bottom pb-2">Right-to-Cure (§35A)</h5>
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
                  <div className="card mb-4 border-0 shadow-sm">
                    <div className="card-header bg-transparent border-0 pb-0">
                      <h5 className="mb-3 fw-bold text-dark border-bottom pb-2">Form 35B Compliance</h5>
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
                  <div className="card mb-4 border-0 shadow-sm">
                    <div className="card-header bg-transparent border-0 pb-0">
                      <h5 className="mb-3 fw-bold text-dark border-bottom pb-2">Loan Assignees</h5>
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
                  <div className="card mb-4 border-0 shadow-sm">
                    <div className="card-header bg-transparent border-0 pb-0">
                      <h5 className="mb-3 fw-bold text-dark border-bottom pb-2">Petition Attestation</h5>
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
