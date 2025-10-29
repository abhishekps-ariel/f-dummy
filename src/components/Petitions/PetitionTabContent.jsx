import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTabs } from '../../context/TabContext';
import './PetitionForm.css';

const PetitionTabContent = ({ petition }) => {
  const { loadingTabs, activeTabId } = useTabs();
  
  // Edit state management
  const [editingSections, setEditingSections] = useState({});
  const [editedData, setEditedData] = useState({});
  
  if (!petition) return null;

  // Check if this tab is currently loading
  const isTabLoading = loadingTabs.has(activeTabId);

  // Show loading state
  if (isTabLoading) {
    return (
      <div className="petition-tab-content">
        <div className="loading-container" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading petition details...</p>
        </div>
      </div>
    );
  }

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

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadgeClass = (status, statusClass) => {
    // Use the statusClass from API if available, otherwise fallback to status text
    if (statusClass) {
      return `status-badge status-${statusClass}`;
    }
    
    switch (status?.toLowerCase()) {
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

  // Edit functionality
  const handleEdit = (sectionName) => {
    setEditingSections(prev => ({ ...prev, [sectionName]: true }));
    // Initialize edited data with current petition data
    setEditedData(prev => ({ ...prev, [sectionName]: { ...petition.details } }));
  };

  const handleCancel = (sectionName) => {
    setEditingSections(prev => ({ ...prev, [sectionName]: false }));
    setEditedData(prev => {
      const newData = { ...prev };
      delete newData[sectionName];
      return newData;
    });
  };

  const handleSave = (sectionName) => {
    setEditingSections(prev => ({ ...prev, [sectionName]: false }));
    // In a real implementation, this would save to the API
    // For now, just show a success message
    alert(`${sectionName} saved successfully! (This is a static implementation)`);
  };

  const handleFieldChange = (sectionName, fieldPath, value) => {
    setEditedData(prev => {
      const newData = { ...prev };
      if (!newData[sectionName]) {
        newData[sectionName] = { ...petition.details };
      }
      
      // Update nested field
      const keys = fieldPath.split('.');
      let current = newData[sectionName];
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      
      return newData;
    });
  };

  const getFieldValue = (sectionName, fieldPath) => {
    if (editingSections[sectionName] && editedData[sectionName]) {
      const keys = fieldPath.split('.');
      let value = editedData[sectionName];
      for (const key of keys) {
        value = value?.[key];
      }
      return value || '';
    }
    
    const keys = fieldPath.split('.');
    let value = petition.details;
    for (const key of keys) {
      value = value?.[key];
    }
    return value || '';
  };

  // Reusable section header component
  const SectionHeader = ({ title, sectionName }) => (
    <div className="card-header d-flex justify-content-between align-items-center">
      <h5 className="mb-0">{title}</h5>
      <div className="d-flex gap-2">
        {editingSections[sectionName] ? (
          <>
            <button 
              type="button" 
              className="btn btn-sm"
              onClick={() => handleSave(sectionName)}
              title="Save changes"
            >
              <i className="fas fa-save me-1"></i>
              Save
            </button>
            <button 
              type="button" 
              className="btn btn-sm"
              onClick={() => handleCancel(sectionName)}
              title="Cancel editing"
            >
              <i className="fas fa-times me-1"></i>
              Cancel
            </button>
          </>
        ) : (
          <button 
            type="button" 
            className="btn btn-sm"
            onClick={() => handleEdit(sectionName)}
            title="Edit section"
          >
            <i className="fas fa-edit me-1"></i>
            Edit
          </button>
        )}
      </div>
    </div>
  );

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
      doc.text(`Petition: ${petition.petitionNumber}`, 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Status: ${petition.status} | Created: ${formatDate(petition.createdDate)} | Modified: ${formatDate(petition.modifiedDate)}`, 20, yPosition);
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
        ['County', petition.details?.property?.propertyCounty || 'N/A'],
        ['Assessor Parcel ID', petition.details?.property?.assessorParcelId || 'N/A']
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
        ['Delinquency Days', petition.details?.loan?.delinquencyDaysAtFiling || 'N/A'],
        ['Variable Rate', petition.details?.loan?.variableRate ? 'Yes' : 'No'],
        ['Interest Only', petition.details?.loan?.interestOnly ? 'Yes' : 'No'],
        ['Negative Amortization', petition.details?.loan?.negativeAmortization ? 'Yes' : 'No']
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
            ['Phone', borrower.phone || 'N/A'],
            ['Mailing Address', borrower.mailingStreet1 || 'N/A'],
            ['Mailing City', borrower.mailingCity || 'N/A'],
            ['Mailing State', borrower.mailingState || 'N/A'],
            ['Mailing ZIP', borrower.mailingZip || 'N/A']
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

          yPosition = doc.lastAutoTable.finalY + 10;
        });
      }

      // Filing Entity
      if (petition.details?.filingEntity) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Filing Entity', 20, yPosition);
        yPosition += 10;

        const filingEntityData = [
          ['Legal Name', petition.details.filingEntity.filingEntityLegalName || 'N/A'],
          ['Contact Name', petition.details.filingEntity.filingContactName || 'N/A'],
          ['Contact Email', petition.details.filingEntity.filingContactEmail || 'N/A'],
          ['Contact Phone', petition.details.filingEntity.filingContactPhone || 'N/A'],
          ['NMLS License', petition.details.filingEntity.nmlsLicenseNumber || 'N/A'],
          ['State License', petition.details.filingEntity.stateLicenseNumber || 'N/A'],
          ['License State', petition.details.filingEntity.stateLicenseState || 'N/A'],
          ['Street Address', petition.details.filingEntity.filingEntityStreet1 || 'N/A'],
          ['Address Line 2', petition.details.filingEntity.filingEntityStreet2 || 'N/A'],
          ['City', petition.details.filingEntity.filingEntityCity || 'N/A'],
          ['State', petition.details.filingEntity.filingEntityState || 'N/A'],
          ['ZIP Code', petition.details.filingEntity.filingEntityZip || 'N/A']
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
      }

      // Right-to-Cure
      if (petition.details?.rightToCure) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Right-to-Cure (§35A)', 20, yPosition);
        yPosition += 10;

        const rightToCureData = [
          ['Notice Sent', petition.details.rightToCure.noticeSent ? 'Yes' : 'No'],
          ['Notice Date', formatDate(petition.details.rightToCure.noticeDate)],
          ['Days Delinquent', petition.details.rightToCure.daysDelinquentAtNotice || 'N/A'],
          ['Amount in Default', formatCurrency(petition.details.rightToCure.amountInDefault)],
          ['Cure Expiration', formatDate(petition.details.rightToCure.cureExpirationDate)],
          ['Override Reason', petition.details.rightToCure.manualOverrideReason || 'N/A'],
          ['Notice Address', petition.details.rightToCure.noticeAddressStreet1 || 'N/A'],
          ['Notice City', petition.details.rightToCure.noticeAddressCity || 'N/A'],
          ['Notice State', petition.details.rightToCure.noticeAddressState || 'N/A'],
          ['Notice ZIP', petition.details.rightToCure.noticeAddressZip || 'N/A']
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
      }

      // Foreclosure Sale - Only show if Right to Cure is "Yes"
      if (petition.details?.rightToCure?.noticeSent && petition.details?.foreclosureSale) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Foreclosure Sale (After Petition Filed)', 20, yPosition);
        yPosition += 10;

        const foreclosureSaleData = [
          ['Sale Date', formatDate(petition.details.foreclosureSale.saleDate) || 'N/A'],
          ['Sold To', petition.details.foreclosureSale.soldTo || 'N/A'],
          ['Vesting Entity Name', petition.details.foreclosureSale.vestingEntityName || 'N/A'],
          ['REO Entity Name', petition.details.foreclosureSale.reoEntityName || 'N/A'],
          ['REO Contact First Name', petition.details.foreclosureSale.reoContactFirstName || 'N/A'],
          ['REO Contact Last Name', petition.details.foreclosureSale.reoContactLastName || 'N/A'],
          ['REO Business Phone', petition.details.foreclosureSale.reoBusinessPhone || 'N/A'],
          ['REO Emergency Phone', petition.details.foreclosureSale.reoEmergencyPhone || 'N/A']
        ];

        autoTable(doc, {
          startY: yPosition,
          head: [['Field', 'Value']],
          body: foreclosureSaleData,
          theme: 'grid',
          headStyles: { fillColor: [52, 73, 94] },
          styles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } }
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Form 35B Compliance
      if (petition.details?.affidavit) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Form 35B Compliance', 20, yPosition);
        yPosition += 10;

        const affidavitData = [
          ['Certain Mortgage Loan', petition.details.affidavit.certainMortgageLoan ? 'Yes' : 'No'],
          ['Affiant Name', petition.details.affidavit.affiantName || 'N/A'],
          ['Affiant Title', petition.details.affidavit.affiantTitle || 'N/A'],
          ['Execution Date', formatDate(petition.details.affidavit.affidavitExecutionDate)]
        ];

        autoTable(doc, {
          startY: yPosition,
          head: [['Field', 'Value']],
          body: affidavitData,
          theme: 'grid',
          headStyles: { fillColor: [52, 73, 94] },
          styles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } }
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Loan Assignees
      if (petition.details?.loanAssignees && petition.details.loanAssignees.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Loan Assignees', 20, yPosition);
        yPosition += 10;

        petition.details.loanAssignees.forEach((assignee, index) => {
          const assigneeData = [
            ['Assignee Name', assignee.assigneeName || 'N/A'],
            ['Assignee Type ID', assignee.assigneeTypeId || 'N/A'],
            ['Assignee Role ID', assignee.assigneeRoleId || 'N/A'],
            ['Street Address', assignee.street1 || 'N/A'],
            ['Address Line 2', assignee.street2 || 'N/A'],
            ['City', assignee.city || 'N/A'],
            ['State', assignee.addressState || 'N/A'],
            ['ZIP Code', assignee.zip || 'N/A'],
            ['License Number', assignee.licenseNumber || 'N/A'],
            ['License State', assignee.licenseState || 'N/A']
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

          yPosition = doc.lastAutoTable.finalY + 10;
        });
      }

      // Signatures
      if (petition.details?.signatures && petition.details.signatures.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Signatures', 20, yPosition);
        yPosition += 10;

        petition.details.signatures.forEach((signature, index) => {
          const signatureData = [
            ['Signer Name', signature.signerFullName || 'N/A'],
            ['Signer Title', signature.signerTitle || 'N/A'],
            ['Signer Email', signature.signerEmail || 'N/A'],
            ['E-Sign Consent', signature.esignConsent ? 'Yes' : 'No'],
            ['Signed At', formatDate(signature.signedAt)],
            ['Signer IP', signature.signerIp || 'N/A'],
            ['OTP Code', signature.otpCode || 'N/A']
          ];

          autoTable(doc, {
            startY: yPosition,
            head: [['Field', 'Value']],
            body: signatureData,
            theme: 'grid',
            headStyles: { fillColor: [52, 73, 94] },
            styles: { fontSize: 9 },
            columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } }
          });

          yPosition = doc.lastAutoTable.finalY + 10;
        });
      }

      // Save the PDF
      doc.save(`petition-${petition.petitionNumber}-details.pdf`);
    } catch (error) {
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
    <div className="petition-tab-content">
      <div className="container-fluid" id="petition-detail-content">
        {/* Header Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="petition-header-card">
              <div className="d-flex justify-content-between align-items-start w-100">
                {/* Left side - Petition Info */}
                <div className="flex-grow-1">
                  <div className="mb-2">
                    <h4 className="petition-number-badge mb-0">{petition.petitionNumber}</h4>
                  </div>
                  <div className="petition-meta-info">
                    <div className="petition-meta-line mb-1">
                      <i className="fas fa-calendar-alt me-2 text-muted"></i>
                      <span className="text-muted">Created: {formatDate(petition.createdDate)}</span>
                    </div>
                    <div className="petition-meta-line mb-1">
                      <i className="fas fa-clock me-2 text-muted"></i>
                      <span className="text-muted">Last Updated: {formatDateTime(petition.modifiedDate)}</span>
                    </div>
                    <div className="petition-meta-line">
                      <span className={getStatusBadgeClass(petition.status, petition.statusClass)}>
                        {petition.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Right side - Action Buttons */}
                <div className="d-flex align-items-center gap-2">
                  <button 
                    type="button" 
                    className="dashboard-btn-refresh"
                    onClick={handleDownloadPDF}
                    title="Download as PDF"
                  >
                    <i className="fas fa-download me-1"></i>
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Layout */}
        <form className="petition-form">

          {/* Property Details Section */}
          <div className={`card mb-4 ${editingSections.property ? 'editing' : ''}`}>
            <SectionHeader title="Property Details" sectionName="property" />
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Street Address</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={getFieldValue('property', 'property.propertyStreet1') || 'N/A'} 
                      readOnly={!editingSections.property}
                      onChange={(e) => handleFieldChange('property', 'property.propertyStreet1', e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Street Address 2</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={getFieldValue('property', 'property.propertyStreet2') || 'N/A'} 
                      readOnly={!editingSections.property}
                      onChange={(e) => handleFieldChange('property', 'property.propertyStreet2', e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">City</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={getFieldValue('property', 'property.propertyCity') || 'N/A'} 
                      readOnly={!editingSections.property}
                      onChange={(e) => handleFieldChange('property', 'property.propertyCity', e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">State</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={getFieldValue('property', 'property.propertyState') || 'N/A'} 
                      readOnly={!editingSections.property}
                      onChange={(e) => handleFieldChange('property', 'property.propertyState', e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">ZIP Code</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={getFieldValue('property', 'property.propertyZip') || 'N/A'} 
                      readOnly={!editingSections.property}
                      onChange={(e) => handleFieldChange('property', 'property.propertyZip', e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">County</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={getFieldValue('property', 'property.propertyCounty') || 'N/A'} 
                      readOnly={!editingSections.property}
                      onChange={(e) => handleFieldChange('property', 'property.propertyCounty', e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Assessor Parcel ID</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={getFieldValue('property', 'property.assessorParcelId') || 'N/A'} 
                      readOnly={!editingSections.property}
                      onChange={(e) => handleFieldChange('property', 'property.assessorParcelId', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Loan Details Section */}
          <div className={`card mb-4 ${editingSections.loan ? 'editing' : ''}`}>
            <SectionHeader title="Loan Details" sectionName="loan" />
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">MIN Number</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={getFieldValue('loan', 'loan.minNumber') || 'N/A'} 
                      readOnly={!editingSections.loan}
                      onChange={(e) => handleFieldChange('loan', 'loan.minNumber', e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Loan Number</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={getFieldValue('loan', 'loan.loanNumber') || 'N/A'} 
                      readOnly={!editingSections.loan}
                      onChange={(e) => handleFieldChange('loan', 'loan.loanNumber', e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Loan Type</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={petition.details?.loan?.petitionLoanTypeName || 'N/A'} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Lien Position</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={petition.details?.loan?.lienPosition || 'N/A'} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Origination Date</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formatDate(petition.details?.loan?.originationDate)} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Original Principal Amount</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formatCurrency(petition.details?.loan?.originalPrincipalAmount)} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Current Principal Balance</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formatCurrency(petition.details?.loan?.currentPrincipalBalance)} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Interest Rate</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={petition.details?.loan?.interestRatePercent ? `${petition.details.loan.interestRatePercent}%` : 'N/A'} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Monthly Payment Amount</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formatCurrency(petition.details?.loan?.monthlyPaymentAmount)} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Delinquency Days at Filing</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={petition.details?.loan?.delinquencyDaysAtFiling || 'N/A'} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Variable Rate</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={petition.details?.loan?.variableRate ? 'Yes' : 'No'} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Interest Only</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={petition.details?.loan?.interestOnly ? 'Yes' : 'No'} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Negative Amortization</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={petition.details?.loan?.negativeAmortization ? 'Yes' : 'No'} 
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Borrower Details Section */}
          <div className={`card mb-4 ${editingSections.borrowers ? 'editing' : ''}`}>
            <SectionHeader title="Borrower Details" sectionName="borrowers" />
            <div className="card-body">
              {petition.details?.borrowers && petition.details.borrowers.length > 0 ? (
                petition.details.borrowers.map((borrower, index) => (
                  <div key={borrower.id || index} className="border rounded p-3 mb-3">
                    <h6 className="mb-3 fw-semibold">Borrower {index + 1}</h6>
                    <div className="row">
                      <div className="col-md-3">
                        <div className="form-group mb-3">
                          <label className="form-label">First Name</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={borrower.firstName || 'N/A'} 
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group mb-3">
                          <label className="form-label">Middle Name</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={borrower.middleName || 'N/A'} 
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group mb-3">
                          <label className="form-label">Last Name</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={borrower.lastName || 'N/A'} 
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group mb-3">
                          <label className="form-label">Suffix</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={borrower.suffix || 'N/A'} 
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Primary Borrower</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={borrower.borrowerIsPrimary ? 'Yes' : 'No'} 
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Email</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={borrower.email || 'N/A'} 
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Phone</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={borrower.phone || 'N/A'} 
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Mailing Address</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={borrower.mailingStreet1 || 'N/A'} 
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mb-3">
                          <label className="form-label">Mailing City</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={borrower.mailingCity || 'N/A'} 
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mb-3">
                          <label className="form-label">Mailing State</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={borrower.mailingState || 'N/A'} 
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mb-3">
                          <label className="form-label">Mailing ZIP</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={borrower.mailingZip || 'N/A'} 
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted">No borrower information available</p>
              )}
            </div>
          </div>

          {/* Filing Entity Section */}
          <div className={`card mb-4 ${editingSections.filingEntity ? 'editing' : ''}`}>
            <SectionHeader title="Filing Entity" sectionName="filingEntity" />
            <div className="card-body">
              <div className="row">
                <div className="col-12">
                  <div className="form-group mb-3">
                    <label className="form-label">Filing Entity Legal Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={petition.details?.filingEntity?.filingEntityLegalName || 'N/A'} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Contact Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={petition.details?.filingEntity?.filingContactName || 'N/A'} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Contact Email</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={petition.details?.filingEntity?.filingContactEmail || 'N/A'} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Contact Phone</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={petition.details?.filingEntity?.filingContactPhone || 'N/A'} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">NMLS License Number</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={petition.details?.filingEntity?.nmlsLicenseNumber || 'N/A'} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">State License Number</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={petition.details?.filingEntity?.stateLicenseNumber || 'N/A'} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">State License State</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={petition.details?.filingEntity?.stateLicenseState || 'N/A'} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Street Address</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={petition.details?.filingEntity?.filingEntityStreet1 || 'N/A'} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Street Address 2</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={petition.details?.filingEntity?.filingEntityStreet2 || 'N/A'} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">City</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={petition.details?.filingEntity?.filingEntityCity || 'N/A'} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">State</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={petition.details?.filingEntity?.filingEntityState || 'N/A'} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">ZIP Code</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={petition.details?.filingEntity?.filingEntityZip || 'N/A'} 
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right-to-Cure Section */}
          <div className={`card mb-4 ${editingSections.rightToCure ? 'editing' : ''}`}>
            <SectionHeader title="Right-to-Cure (§35A)" sectionName="rightToCure" />
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Notice Sent</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={petition.details?.rightToCure?.noticeSent ? 'Yes' : 'No'} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Notice Date</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formatDate(petition.details?.rightToCure?.noticeDate)} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Days Delinquent at Notice</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={petition.details?.rightToCure?.daysDelinquentAtNotice || 'N/A'} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Amount in Default</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formatCurrency(petition.details?.rightToCure?.amountInDefault)} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Cure Expiration Date</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formatDate(petition.details?.rightToCure?.cureExpirationDate)} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Manual Override Reason</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={petition.details?.rightToCure?.manualOverrideReason || 'N/A'} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Notice Address Street</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={petition.details?.rightToCure?.noticeAddressStreet1 || 'N/A'} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Notice Address City</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={petition.details?.rightToCure?.noticeAddressCity || 'N/A'} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">Notice Address State</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={petition.details?.rightToCure?.noticeAddressState || 'N/A'} 
                      readOnly
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">Notice Address ZIP</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={petition.details?.rightToCure?.noticeAddressZip || 'N/A'} 
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Foreclosure Sale Section - Only show if Right to Cure is "Yes" */}
          {petition.details?.rightToCure?.noticeSent && (
            <div className={`card mb-4 ${editingSections.foreclosureSale ? 'editing' : ''}`}>
              <SectionHeader title="Foreclosure Sale (After Petition Filed)" sectionName="foreclosureSale" />
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Sale Date *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={formatDate(petition.details?.foreclosureSale?.saleDate) || 'N/A'} 
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Sold To?</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={petition.details?.foreclosureSale?.soldTo || 'N/A'} 
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Vesting Entity Name *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={petition.details?.foreclosureSale?.vestingEntityName || 'N/A'} 
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">REO Entity Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={petition.details?.foreclosureSale?.reoEntityName || 'N/A'} 
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">REO Contact First Name *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={petition.details?.foreclosureSale?.reoContactFirstName || 'N/A'} 
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">REO Contact Last Name *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={petition.details?.foreclosureSale?.reoContactLastName || 'N/A'} 
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">REO Business Phone *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={petition.details?.foreclosureSale?.reoBusinessPhone || 'N/A'} 
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">REO Emergency Phone</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={petition.details?.foreclosureSale?.reoEmergencyPhone || 'N/A'} 
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form 35B Compliance Section */}
          <div className={`card mb-4 ${editingSections.affidavit ? 'editing' : ''}`}>
            <SectionHeader title="Form 35B Compliance" sectionName="affidavit" />
            <div className="card-body">
              <div className="row">
                <div className="col-12">
                  <div className="form-group mb-3">
                    <label className="form-label">Certain Mortgage Loan</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={petition.details?.affidavit?.certainMortgageLoan ? 'Yes' : 'No'} 
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Loan Assignees Section */}
          <div className={`card mb-4 ${editingSections.loanAssignees ? 'editing' : ''}`}>
            <SectionHeader title="Loan Assignees" sectionName="loanAssignees" />
            <div className="card-body">
              {petition.details?.loanAssignees && petition.details.loanAssignees.length > 0 ? (
                petition.details.loanAssignees.map((assignee, index) => (
                  <div key={index} className="border rounded p-3 mb-3">
                    <h6 className="mb-3 fw-semibold">Assignee {index + 1}</h6>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Assignee Name</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={assignee.assigneeName || 'N/A'} 
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Assignee Type ID</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={assignee.assigneeTypeId || 'N/A'} 
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Assignee Role ID</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={assignee.assigneeRoleId || 'N/A'} 
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Street Address</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={assignee.street1 || 'N/A'} 
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Street Address 2</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={assignee.street2 || 'N/A'} 
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mb-3">
                          <label className="form-label">City</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={assignee.city || 'N/A'} 
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mb-3">
                          <label className="form-label">State</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={assignee.addressState || 'N/A'} 
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mb-3">
                          <label className="form-label">ZIP Code</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={assignee.zip || 'N/A'} 
                            readOnly
                          />
                        </div>
                      </div>
                      {assignee.licenseNumber && (
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">License Number</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              value={assignee.licenseNumber} 
                              readOnly
                            />
                          </div>
                        </div>
                      )}
                      {assignee.licenseState && (
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">License State</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              value={assignee.licenseState} 
                              readOnly
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted">No assignee information available</p>
              )}
            </div>
          </div>

          {/* Signatures Section */}
          <div className={`card mb-4 ${editingSections.signatures ? 'editing' : ''}`}>
            <SectionHeader title="Signatures" sectionName="signatures" />
            <div className="card-body">
              {petition.details?.signatures && petition.details.signatures.length > 0 ? (
                petition.details.signatures.map((signature, index) => (
                  <div key={index} className="border rounded p-3 mb-3">
                    <h6 className="mb-3 fw-semibold">Signature {index + 1}</h6>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Signer Full Name</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={signature.signerFullName || 'N/A'} 
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Signer Title</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={signature.signerTitle || 'N/A'} 
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Signer Email</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={signature.signerEmail || 'N/A'} 
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">E-Sign Consent</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={signature.esignConsent ? 'Yes' : 'No'} 
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Signed At</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={formatDate(signature.signedAt)} 
                            readOnly
                          />
                        </div>
                      </div>
                      {signature.signatureDrawnOrTyped && (
                        <div className="col-12">
                          <div className="form-group mb-3">
                            <label className="form-label">Signature Preview</label>
                            <div className="signature-preview-container p-3 border rounded bg-light">
                              <img 
                                src={signature.signatureDrawnOrTyped} 
                                alt="Digital Signature" 
                                className="signature-preview-img"
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '120px',
                                  objectFit: 'contain',
                                  border: '1px solid #dee2e6',
                                  borderRadius: '4px',
                                  backgroundColor: 'white'
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted">No signature information available</p>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PetitionTabContent;