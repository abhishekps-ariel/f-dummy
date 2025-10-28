import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PetitionTabContent = ({ petition }) => {
  if (!petition) return null;

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
            ['SSN', borrower.ssn || 'N/A'],
            ['Date of Birth', formatDate(borrower.dateOfBirth)],
            ['Phone', borrower.phone || 'N/A'],
            ['Email', borrower.email || 'N/A']
          ];

          autoTable(doc, {
            startY: yPosition,
            head: [['Field', 'Value']],
            body: borrowerData,
            theme: 'grid',
            headStyles: { fillColor: [52, 73, 94] },
            styles: { fontSize: 9 },
            columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } }
          });

          yPosition = doc.lastAutoTable.finalY + 15;
        });
      }

      // Save the PDF
      doc.save(`petition-${petition.petitionNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="petition-tab-content">
      <div className="container-fluid">
        {/* Header Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h2 className="h4 mb-2">{petition.petitionNumber}</h2>
                <p className="text-muted mb-0">{petition.propertyAddress}</p>
              </div>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={handleDownloadPDF}
                >
                  <i className="fas fa-download me-2"></i>
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Status and Basic Info */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <div className="row">
                  <div className="col-md-3">
                    <strong>Status:</strong>
                    <div className="mt-1">
                      <span className={getStatusBadgeClass(petition.status, petition.statusClass)}>
                        {petition.status}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <strong>Filing Date:</strong>
                    <div className="mt-1">{formatDate(petition.filingDate)}</div>
                  </div>
                  <div className="col-md-3">
                    <strong>Last Updated:</strong>
                    <div className="mt-1">{petition.lastUpdated}</div>
                  </div>
                  <div className="col-md-3">
                    <strong>Borrower:</strong>
                    <div className="mt-1">{petition.borrower}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Property Details */}
        {petition.details?.property && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Property Details</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <strong>Street Address:</strong>
                        <div>{petition.details.property.propertyStreet1 || 'N/A'}</div>
                      </div>
                      <div className="mb-3">
                        <strong>Address Line 2:</strong>
                        <div>{petition.details.property.propertyStreet2 || 'N/A'}</div>
                      </div>
                      <div className="mb-3">
                        <strong>City:</strong>
                        <div>{petition.details.property.propertyCity || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <strong>State:</strong>
                        <div>{petition.details.property.propertyState || 'N/A'}</div>
                      </div>
                      <div className="mb-3">
                        <strong>ZIP Code:</strong>
                        <div>{petition.details.property.propertyZip || 'N/A'}</div>
                      </div>
                      <div className="mb-3">
                        <strong>County:</strong>
                        <div>{petition.details.property.propertyCounty || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loan Details */}
        {petition.details?.loan && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Loan Details</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <strong>MIN Number:</strong>
                        <div>{petition.details.loan.minNumber || 'N/A'}</div>
                      </div>
                      <div className="mb-3">
                        <strong>Loan Number:</strong>
                        <div>{petition.details.loan.loanNumber || 'N/A'}</div>
                      </div>
                      <div className="mb-3">
                        <strong>Loan Type:</strong>
                        <div>{petition.details.loan.petitionLoanTypeName || 'N/A'}</div>
                      </div>
                      <div className="mb-3">
                        <strong>Lien Position:</strong>
                        <div>{petition.details.loan.lienPosition || 'N/A'}</div>
                      </div>
                      <div className="mb-3">
                        <strong>Origination Date:</strong>
                        <div>{formatDate(petition.details.loan.originationDate)}</div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <strong>Original Amount:</strong>
                        <div>{formatCurrency(petition.details.loan.originalPrincipalAmount)}</div>
                      </div>
                      <div className="mb-3">
                        <strong>Current Amount:</strong>
                        <div>{formatCurrency(petition.details.loan.currentPrincipalBalance)}</div>
                      </div>
                      <div className="mb-3">
                        <strong>Interest Rate:</strong>
                        <div>{petition.details.loan.interestRatePercent ? `${petition.details.loan.interestRatePercent}%` : 'N/A'}</div>
                      </div>
                      <div className="mb-3">
                        <strong>Monthly Payment:</strong>
                        <div>{formatCurrency(petition.details.loan.monthlyPaymentAmount)}</div>
                      </div>
                      <div className="mb-3">
                        <strong>Delinquency Days:</strong>
                        <div>{petition.details.loan.delinquencyDaysAtFiling || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Borrower Details */}
        {petition.details?.borrowers && petition.details.borrowers.length > 0 && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Borrower Details</h5>
                </div>
                <div className="card-body">
                  {petition.details.borrowers.map((borrower, index) => (
                    <div key={index} className={index > 0 ? 'mt-4 pt-4 border-top' : ''}>
                      <h6 className="mb-3">Borrower {index + 1}</h6>
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <strong>First Name:</strong>
                            <div>{borrower.firstName || 'N/A'}</div>
                          </div>
                          <div className="mb-3">
                            <strong>Middle Name:</strong>
                            <div>{borrower.middleName || 'N/A'}</div>
                          </div>
                          <div className="mb-3">
                            <strong>Last Name:</strong>
                            <div>{borrower.lastName || 'N/A'}</div>
                          </div>
                          <div className="mb-3">
                            <strong>SSN:</strong>
                            <div>{borrower.ssn || 'N/A'}</div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <strong>Date of Birth:</strong>
                            <div>{formatDate(borrower.dateOfBirth)}</div>
                          </div>
                          <div className="mb-3">
                            <strong>Phone:</strong>
                            <div>{borrower.phone || 'N/A'}</div>
                          </div>
                          <div className="mb-3">
                            <strong>Email:</strong>
                            <div>{borrower.email || 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Details */}
        {petition.details && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">Additional Information</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <strong>Organization:</strong>
                        <div>{petition.details.organizationName || 'N/A'}</div>
                      </div>
                      <div className="mb-3">
                        <strong>Created By:</strong>
                        <div>{petition.details.createdBy || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <strong>Created Date:</strong>
                        <div>{formatDate(petition.details.createdDate)}</div>
                      </div>
                      <div className="mb-3">
                        <strong>Modified Date:</strong>
                        <div>{formatDate(petition.details.modifiedDate)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PetitionTabContent;
