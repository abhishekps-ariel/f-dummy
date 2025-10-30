import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTabs } from '../../context/TabContext';
import { usePetitionCommonData } from '../../hooks/usePetitionCommonData';
import { usePetitions } from '../../hooks/usePetitions';
import { toast } from 'react-toastify';
import './PetitionForm.css';

const PetitionTabContent = ({ petition }) => {
  const { loadingTabs, activeTabId } = useTabs();
  const { getLoanTypes, getAssigneeTypes, getAssigneeRoles, getLienPositions, getOptionName, loading: commonDataLoading } = usePetitionCommonData();
  const { submitPetition } = usePetitions();
  
  // Single edit mode state - makes all fields editable at once
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Transform petition.details to formData structure matching PetitionSteps
  const initialFormData = useMemo(() => {
    if (!petition?.details) return null;
    
    const details = petition.details;
    return {
      // Property Details
      propertyStreet1: details.property?.propertyStreet1 || '',
      propertyStreet2: details.property?.propertyStreet2 || '',
      propertyCity: details.property?.propertyCity || '',
      propertyState: details.property?.propertyState || 'MA',
      propertyZip: details.property?.propertyZip || '',
      propertyCounty: details.property?.propertyCounty || '',
      assessorParcelId: details.property?.assessorParcelId || '',
      
      // Loan Details
      minNumber: details.loan?.minNumber || '',
      loanNumber: details.loan?.loanNumber || '',
      petitionLoanTypeId: details.loan?.petitionLoanTypeId || '',
      petitionLoanTypeName: details.loan?.petitionLoanTypeName || '',
      lienPosition: details.loan?.lienPosition || '',
      originationDate: details.loan?.originationDate ? details.loan.originationDate.split('T')[0] : '',
      originalPrincipalAmount: details.loan?.originalPrincipalAmount || 0,
      currentPrincipalBalance: details.loan?.currentPrincipalBalance || 0,
      interestRatePercent: details.loan?.interestRatePercent || 0,
      variableRate: details.loan?.variableRate || false,
      interestOnly: details.loan?.interestOnly || false,
      negativeAmortization: details.loan?.negativeAmortization || false,
      monthlyPaymentAmount: details.loan?.monthlyPaymentAmount || 0,
      delinquencyDaysAtFiling: details.loan?.delinquencyDaysAtFiling || 0,
      
      // Borrowers
      borrowers: details.borrowers?.map((b, idx) => ({
        id: b.id || idx + 1,
        firstName: b.firstName || '',
        middleName: b.middleName || '',
        lastName: b.lastName || '',
        suffix: b.suffix || '',
        borrowerIsPrimary: b.borrowerIsPrimary || (idx === 0),
        mailingStreet1: b.mailingStreet1 || '',
        mailingCity: b.mailingCity || '',
        mailingState: b.mailingState || '',
        mailingZip: b.mailingZip || '',
        phone: b.phone || '',
        email: b.email || ''
      })) || [],
      
      // Filing Entity
      filingEntityLegalName: details.filingEntity?.filingEntityLegalName || '',
      filingEntityTypeId: details.filingEntity?.filingEntityTypeId || '',
      filingEntityStreet1: details.filingEntity?.filingEntityStreet1 || '',
      filingEntityStreet2: details.filingEntity?.filingEntityStreet2 || '',
      filingEntityCity: details.filingEntity?.filingEntityCity || '',
      filingEntityState: details.filingEntity?.filingEntityState || '',
      filingEntityZip: details.filingEntity?.filingEntityZip || '',
      filingContactName: details.filingEntity?.filingContactName || '',
      filingContactEmail: details.filingEntity?.filingContactEmail || '',
      filingContactPhone: details.filingEntity?.filingContactPhone || '',
      nmlsLicenseNumber: details.filingEntity?.nmlsLicenseNumber || '',
      stateLicenseNumber: details.filingEntity?.stateLicenseNumber || '',
      stateLicenseState: details.filingEntity?.stateLicenseState || '',
      
      // Right-to-Cure
      noticeSent: details.rightToCure?.noticeSent || false,
      noticeDate: details.rightToCure?.noticeDate ? details.rightToCure.noticeDate.split('T')[0] : '',
      amountInDefault: details.rightToCure?.amountInDefault || 0,
      daysDelinquentAtNotice: details.rightToCure?.daysDelinquentAtNotice || 0,
      cureExpirationDate: details.rightToCure?.cureExpirationDate ? details.rightToCure.cureExpirationDate.split('T')[0] : '',
      noticeAddressStreet1: details.rightToCure?.noticeAddressStreet1 || '',
      noticeAddressCity: details.rightToCure?.noticeAddressCity || '',
      noticeAddressState: details.rightToCure?.noticeAddressState || '',
      noticeAddressZip: details.rightToCure?.noticeAddressZip || '',
      manualOverrideReason: details.rightToCure?.manualOverrideReason || '',
      
      // Foreclosure Sale
      foreclosureSale: details.foreclosureSale ? {
        saleDate: details.foreclosureSale.saleDate ? details.foreclosureSale.saleDate.split('T')[0] : '',
        soldTo: details.foreclosureSale.soldTo || '',
        vestingEntityName: details.foreclosureSale.vestingEntityName || '',
        reoEntityName: details.foreclosureSale.reoEntityName || '',
        reoContactFirstName: details.foreclosureSale.reoContactFirstName || '',
        reoContactLastName: details.foreclosureSale.reoContactLastName || '',
        reoBusinessPhone: details.foreclosureSale.reoBusinessPhone || '',
        reoEmergencyPhone: details.foreclosureSale.reoEmergencyPhone || ''
      } : (details.rightToCure?.noticeSent === true ? {
        saleDate: '',
        soldTo: '',
        vestingEntityName: '',
        reoEntityName: '',
        reoContactFirstName: '',
        reoContactLastName: '',
        reoBusinessPhone: '',
        reoEmergencyPhone: ''
      } : null),
      
      // Form 35B Compliance
      certainMortgageLoan: details.affidavit?.certainMortgageLoan || false,
      form35bComplianceAffidavitPdf: details.affidavit?.form35bComplianceAffidavitPdf || '',
      form35bNonApplicabilityAffidavitPdf: details.affidavit?.form35bNonApplicabilityAffidavitPdf || '',
      affiantName: details.affidavit?.affiantName || '',
      affiantTitle: details.affidavit?.affiantTitle || '',
      affidavitExecutionDate: details.affidavit?.affidavitExecutionDate ? details.affidavit.affidavitExecutionDate.split('T')[0] : '',
      
      // Loan Assignees
      loanAssignees: details.loanAssignees?.map((a, idx) => ({
        assigneeName: a.assigneeName || '',
        assigneeTypeId: a.assigneeTypeId || '',
        assigneeRoleId: a.assigneeRoleId || '',
        street1: a.street1 || '',
        street2: a.street2 || '',
        city: a.city || '',
        addressState: a.addressState || '',
        zip: a.zip || '',
        licenseNumber: a.licenseNumber || '',
        licenseState: a.licenseState || ''
      })) || [],
      
      // Signatures
      signatures: details.signatures?.map(s => ({ ...s })) || [],
      
      // Additional
      documents: details.documents || [],
      isAllStepsCompleted: true
    };
  }, [petition]);
  
  const [formData, setFormData] = useState(initialFormData);
  
  // Update formData when petition changes
  useEffect(() => {
    if (initialFormData) {
      setFormData(initialFormData);
    }
  }, [initialFormData]);
  
  // Reset edit mode when switching to a different petition or to a non-draft
  useEffect(() => {
    setIsEditing(false);
    setFieldErrors({});
  }, [petition?.id]);
  
  useEffect(() => {
    if (petition?.status && petition.status.toLowerCase() !== 'draft' && isEditing) {
      setIsEditing(false);
      setFieldErrors({});
    }
  }, [petition?.status]);
  
  if (!petition || !formData) return null;

  // Helper functions to get mapped values
  const getLoanTypeName = (loanTypeId) => {
    return getOptionName(getLoanTypes(), loanTypeId) || loanTypeId || 'N/A';
  };

  const getAssigneeTypeName = (assigneeTypeId) => {
    return getOptionName(getAssigneeTypes(), assigneeTypeId) || assigneeTypeId || 'N/A';
  };

  const getAssigneeRoleName = (assigneeRoleId) => {
    return getOptionName(getAssigneeRoles(), assigneeRoleId) || assigneeRoleId || 'N/A';
  };

  const getLienPositionName = (lienPosition) => {
    // Map lien position value to name using the petition enums
    return getOptionName(getLienPositions(), lienPosition) || 'N/A';
  };

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

  // Handle input change - similar to PetitionSteps
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Define integer fields that should not show decimal values
    const integerFields = ['delinquencyDaysAtFiling', 'daysDelinquentAtNotice'];
    
    // Handle numeric inputs for integer fields
    let processedValue = value;
    if (type === 'number' && integerFields.includes(name) && value !== '') {
      const intValue = parseInt(value, 10);
      processedValue = isNaN(intValue) ? '' : intValue.toString();
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Real-time validation for principal amount comparison
    if (name === 'originalPrincipalAmount' || name === 'currentPrincipalBalance') {
      const originalAmount = parseFloat(name === 'originalPrincipalAmount' ? processedValue : formData.originalPrincipalAmount) || 0;
      const currentBalance = parseFloat(name === 'currentPrincipalBalance' ? processedValue : formData.currentPrincipalBalance) || 0;
      
      if (originalAmount > 0 && currentBalance > 0 && currentBalance > originalAmount) {
        setFieldErrors(prev => ({
          ...prev,
          currentPrincipalBalance: 'Current Principal Balance cannot exceed the Original Principal Amount'
        }));
      } else if (fieldErrors.currentPrincipalBalance === 'Current Principal Balance cannot exceed the Original Principal Amount') {
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.currentPrincipalBalance;
          return newErrors;
        });
      }
    }
  };
  
  // Handle borrower field changes
  const updateBorrower = (borrowerId, field, value) => {
    setFormData(prev => ({
      ...prev,
      borrowers: prev.borrowers.map(borrower =>
        borrower.id === borrowerId
          ? { ...borrower, [field]: value }
          : borrower
      )
    }));
  };
  
  // Handle loan assignee field changes
  const updateLoanAssignee = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      loanAssignees: prev.loanAssignees.map((assignee, idx) =>
        idx === index
          ? { ...assignee, [field]: value }
          : assignee
      )
    }));
  };
  
  // Handle foreclosure sale field changes
  const updateForeclosureSale = (field, value) => {
    setFormData(prev => ({
      ...prev,
      foreclosureSale: prev.foreclosureSale ? {
        ...prev.foreclosureSale,
        [field]: value
      } : {
        saleDate: '',
        soldTo: '',
        vestingEntityName: '',
        reoEntityName: '',
        reoContactFirstName: '',
        reoContactLastName: '',
        reoBusinessPhone: '',
        reoEmergencyPhone: '',
        [field]: value
      }
    }));
  };
  
  // Add borrower
  const addBorrower = () => {
    setFormData(prev => ({
      ...prev,
      borrowers: [
        ...prev.borrowers,
        {
          id: Date.now(),
          firstName: '',
          middleName: '',
          lastName: '',
          suffix: '',
          borrowerIsPrimary: false,
          mailingStreet1: '',
          mailingCity: '',
          mailingState: '',
          mailingZip: '',
          phone: '',
          email: ''
        }
      ]
    }));
  };
  
  // Remove borrower
  const removeBorrower = (borrowerId) => {
    if (formData.borrowers.length > 1) {
      const isRemovingPrimary = formData.borrowers.find(b => b.id === borrowerId)?.borrowerIsPrimary;
      
      setFormData(prev => {
        const newBorrowers = prev.borrowers.filter(borrower => borrower.id !== borrowerId);
        
        if (isRemovingPrimary && newBorrowers.length > 0) {
          newBorrowers[0].borrowerIsPrimary = true;
        }
        
        return {
          ...prev,
          borrowers: newBorrowers
        };
      });
    }
  };
  
  // Add loan assignee
  const addLoanAssignee = () => {
    setFormData(prev => ({
      ...prev,
      loanAssignees: [
        ...prev.loanAssignees,
        {
          assigneeName: '',
          assigneeTypeId: '',
          assigneeRoleId: '',
          street1: '',
          street2: '',
          city: '',
          addressState: '',
          zip: '',
          licenseNumber: '',
          licenseState: ''
        }
      ]
    }));
  };
  
  // Remove loan assignee
  const removeLoanAssignee = (index) => {
    setFormData(prev => ({
      ...prev,
      loanAssignees: prev.loanAssignees.filter((_, idx) => idx !== index)
    }));
  };
  
  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel edit - reset form data
      setFormData(initialFormData);
      setFieldErrors({});
    }
    setIsEditing(!isEditing);
  };
  
  // Handle save - submit form data
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Basic validation
      if (!formData.propertyStreet1?.trim()) {
        toast.error('Property Street Address is required');
        setIsSaving(false);
        return;
      }
      
      // Submit petition with petition ID for edit
      await submitPetition(formData, false, petition.id);
      
      toast.success('Petition updated successfully!');
      setIsEditing(false);
      
      // Reload to get updated data
      window.location.reload();
    } catch (error) {
      toast.error('Failed to update petition. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Reusable section header component - no edit buttons, just title
  const SectionHeader = ({ title }) => (
    <div className="card-header">
      <h5 className="mb-0">{title}</h5>
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
        ['Loan Type', getLoanTypeName(petition.details?.loan?.petitionLoanTypeId)],
        ['Lien Position', getLienPositionName(petition.details?.loan?.lienPosition)],
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
        doc.text('Foreclosure Sale', 20, yPosition);
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
            ['Assignee Type', getAssigneeTypeName(assignee.assigneeTypeId)],
            ['Assignee Role', getAssigneeRoleName(assignee.assigneeRoleId)],
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
                  {!isEditing ? (
                    <>
                      {petition.status?.toLowerCase() === 'draft' && (
                        <button 
                          type="button" 
                          className="dashboard-btn-create"
                          onClick={handleEditToggle}
                          title="Edit petition"
                        >
                          <i className="fas fa-edit me-1"></i>
                          Edit
                        </button>
                      )}
                  <button 
                    type="button" 
                    className="dashboard-btn-refresh"
                    onClick={handleDownloadPDF}
                    title="Download as PDF"
                  >
                    <i className="fas fa-download me-1"></i>
                    Download PDF
                  </button>
                    </>
                  ) : (
                    <>
                      <button 
                        type="button" 
                        className="dashboard-btn-create"
                        onClick={handleSave}
                        disabled={isSaving}
                        title="Save changes"
                      >
                        {isSaving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                            Saving...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save me-1"></i>
                            Save
                          </>
                        )}
                      </button>
                      <button 
                        type="button" 
                        className="dashboard-btn-refresh"
                        onClick={handleEditToggle}
                        disabled={isSaving}
                        title="Cancel editing"
                      >
                        <i className="fas fa-times me-1"></i>
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Layout */}
        <form className="petition-form">

          {/* Property Details Section */}
          <div className={`card mb-4 ${isEditing ? 'editing' : ''}`}>
            <SectionHeader title="Property Details" />
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Street Address *</label>
                    <input 
                      type="text" 
                      name="propertyStreet1"
                      className={`form-control ${fieldErrors.propertyStreet1 ? 'is-invalid' : ''}`}
                      value={formData.propertyStreet1 || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.propertyStreet1 && (
                      <div className="text-danger small mt-1">{fieldErrors.propertyStreet1}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Street Address 2</label>
                    <input 
                      type="text" 
                      name="propertyStreet2"
                      className="form-control" 
                      value={formData.propertyStreet2 || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">City *</label>
                    <input 
                      type="text" 
                      name="propertyCity"
                      className={`form-control ${fieldErrors.propertyCity ? 'is-invalid' : ''}`}
                      value={formData.propertyCity || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.propertyCity && (
                      <div className="text-danger small mt-1">{fieldErrors.propertyCity}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">State *</label>
                    <input 
                      type="text" 
                      name="propertyState"
                      className={`form-control ${fieldErrors.propertyState ? 'is-invalid' : ''}`}
                      value={formData.propertyState || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.propertyState && (
                      <div className="text-danger small mt-1">{fieldErrors.propertyState}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">ZIP Code *</label>
                    <input 
                      type="text" 
                      name="propertyZip"
                      className={`form-control ${fieldErrors.propertyZip ? 'is-invalid' : ''}`}
                      value={formData.propertyZip || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.propertyZip && (
                      <div className="text-danger small mt-1">{fieldErrors.propertyZip}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">County</label>
                    <input 
                      type="text" 
                      name="propertyCounty"
                      className="form-control" 
                      value={formData.propertyCounty || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Assessor Parcel ID</label>
                    <input 
                      type="text" 
                      name="assessorParcelId"
                      className="form-control" 
                      value={formData.assessorParcelId || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Loan Details Section */}
          <div className={`card mb-4 ${isEditing ? 'editing' : ''}`}>
            <SectionHeader title="Loan Details" />
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">MIN Number</label>
                    <input 
                      type="text" 
                      name="minNumber"
                      className={`form-control ${fieldErrors.minNumber ? 'is-invalid' : ''}`}
                      value={formData.minNumber || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.minNumber && (
                      <div className="text-danger small mt-1">{fieldErrors.minNumber}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Loan Number *</label>
                    <input 
                      type="text" 
                      name="loanNumber"
                      className={`form-control ${fieldErrors.loanNumber ? 'is-invalid' : ''}`}
                      value={formData.loanNumber || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.loanNumber && (
                      <div className="text-danger small mt-1">{fieldErrors.loanNumber}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Loan Type *</label>
                    <select 
                      name="petitionLoanTypeId"
                      className={`form-select ${fieldErrors.petitionLoanTypeId ? 'is-invalid' : ''}`}
                      value={formData.petitionLoanTypeId || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing || commonDataLoading}
                    >
                      <option value="">Select Loan Type</option>
                      {getLoanTypes().map(loanType => (
                        <option key={loanType.id} value={loanType.id}>
                          {loanType.name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.petitionLoanTypeId && (
                      <div className="text-danger small mt-1">{fieldErrors.petitionLoanTypeId}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Lien Position *</label>
                    <select 
                      name="lienPosition"
                      className={`form-select ${fieldErrors.lienPosition ? 'is-invalid' : ''}`}
                      value={formData.lienPosition || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing || commonDataLoading}
                    >
                      <option value="">Select Position</option>
                      {getLienPositions().map(position => (
                        <option key={position.value} value={position.value}>
                          {position.name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.lienPosition && (
                      <div className="text-danger small mt-1">{fieldErrors.lienPosition}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Origination Date *</label>
                    <input 
                      type="date" 
                      name="originationDate"
                      className={`form-control ${fieldErrors.originationDate ? 'is-invalid' : ''}`}
                      value={formData.originationDate || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.originationDate && (
                      <div className="text-danger small mt-1">{fieldErrors.originationDate}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Original Principal Amount ($) *</label>
                    <input 
                      type="number" 
                      step="0.01"
                      name="originalPrincipalAmount"
                      className={`form-control ${fieldErrors.originalPrincipalAmount ? 'is-invalid' : ''}`}
                      value={formData.originalPrincipalAmount || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.originalPrincipalAmount && (
                      <div className="text-danger small mt-1">{fieldErrors.originalPrincipalAmount}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Current Principal Balance ($) *</label>
                    <input 
                      type="number" 
                      step="0.01"
                      name="currentPrincipalBalance"
                      className={`form-control ${fieldErrors.currentPrincipalBalance ? 'is-invalid' : ''}`}
                      value={formData.currentPrincipalBalance || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.currentPrincipalBalance && (
                      <div className="text-danger small mt-1">{fieldErrors.currentPrincipalBalance}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Interest Rate (%) *</label>
                    <input 
                      type="number" 
                      step="0.001"
                      name="interestRatePercent"
                      className={`form-control ${fieldErrors.interestRatePercent ? 'is-invalid' : ''}`}
                      value={formData.interestRatePercent || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.interestRatePercent && (
                      <div className="text-danger small mt-1">{fieldErrors.interestRatePercent}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Monthly Payment Amount ($) *</label>
                    <input 
                      type="number" 
                      step="0.01"
                      name="monthlyPaymentAmount"
                      className={`form-control ${fieldErrors.monthlyPaymentAmount ? 'is-invalid' : ''}`}
                      value={formData.monthlyPaymentAmount || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.monthlyPaymentAmount && (
                      <div className="text-danger small mt-1">{fieldErrors.monthlyPaymentAmount}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Delinquency Days at Filing</label>
                    <input 
                      type="number" 
                      name="delinquencyDaysAtFiling"
                      className={`form-control ${fieldErrors.delinquencyDaysAtFiling ? 'is-invalid' : ''}`}
                      value={formData.delinquencyDaysAtFiling || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.delinquencyDaysAtFiling && (
                      <div className="text-danger small mt-1">{fieldErrors.delinquencyDaysAtFiling}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Variable Rate</label>
                    <div className="form-check">
                    <input 
                        type="checkbox" 
                        name="variableRate"
                        className="form-check-input"
                        checked={formData.variableRate || false}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                      <label className="form-check-label">
                        {formData.variableRate ? 'Yes' : 'No'}
                      </label>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Interest Only</label>
                    <div className="form-check">
                    <input 
                        type="checkbox" 
                        name="interestOnly"
                        className="form-check-input"
                        checked={formData.interestOnly || false}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                      <label className="form-check-label">
                        {formData.interestOnly ? 'Yes' : 'No'}
                      </label>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Negative Amortization</label>
                    <div className="form-check">
                    <input 
                        type="checkbox" 
                        name="negativeAmortization"
                        className="form-check-input"
                        checked={formData.negativeAmortization || false}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                      <label className="form-check-label">
                        {formData.negativeAmortization ? 'Yes' : 'No'}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Borrower Details Section */}
          <div className={`card mb-4 ${isEditing ? 'editing' : ''}`}>
            <SectionHeader title="Borrower Details" />
            <div className="card-body">
              {formData.borrowers && formData.borrowers.length > 0 ? (
                <>
                  {formData.borrowers.map((borrower, index) => (
                  <div key={borrower.id || index} className="border rounded p-3 mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0 fw-semibold">Borrower {index + 1}</h6>
                        {isEditing && formData.borrowers.length > 1 && (
                          <button 
                            type="button" 
                            className="btn btn-sm btn-danger"
                            onClick={() => removeBorrower(borrower.id)}
                          >
                            <i className="fas fa-trash me-1"></i>
                            Remove
                          </button>
                        )}
                      </div>
                    <div className="row">
                      <div className="col-md-3">
                        <div className="form-group mb-3">
                            <label className="form-label">First Name *</label>
                          <input 
                            type="text" 
                              className={`form-control ${fieldErrors[`borrower_${borrower.id}_firstName`] ? 'is-invalid' : ''}`}
                              value={borrower.firstName || ''} 
                              readOnly={!isEditing}
                              onChange={(e) => updateBorrower(borrower.id, 'firstName', e.target.value)}
                            />
                            {fieldErrors[`borrower_${borrower.id}_firstName`] && (
                              <div className="text-danger small mt-1">{fieldErrors[`borrower_${borrower.id}_firstName`]}</div>
                            )}
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group mb-3">
                          <label className="form-label">Middle Name</label>
                          <input 
                            type="text" 
                              className={`form-control ${fieldErrors[`borrower_${borrower.id}_middleName`] ? 'is-invalid' : ''}`}
                              value={borrower.middleName || ''} 
                              readOnly={!isEditing}
                              onChange={(e) => updateBorrower(borrower.id, 'middleName', e.target.value)}
                            />
                            {fieldErrors[`borrower_${borrower.id}_middleName`] && (
                              <div className="text-danger small mt-1">{fieldErrors[`borrower_${borrower.id}_middleName`]}</div>
                            )}
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group mb-3">
                            <label className="form-label">Last Name *</label>
                          <input 
                            type="text" 
                              className={`form-control ${fieldErrors[`borrower_${borrower.id}_lastName`] ? 'is-invalid' : ''}`}
                              value={borrower.lastName || ''} 
                              readOnly={!isEditing}
                              onChange={(e) => updateBorrower(borrower.id, 'lastName', e.target.value)}
                            />
                            {fieldErrors[`borrower_${borrower.id}_lastName`] && (
                              <div className="text-danger small mt-1">{fieldErrors[`borrower_${borrower.id}_lastName`]}</div>
                            )}
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group mb-3">
                          <label className="form-label">Suffix</label>
                          <input 
                            type="text" 
                              className={`form-control ${fieldErrors[`borrower_${borrower.id}_suffix`] ? 'is-invalid' : ''}`}
                              value={borrower.suffix || ''} 
                              readOnly={!isEditing}
                              onChange={(e) => updateBorrower(borrower.id, 'suffix', e.target.value)}
                            />
                            {fieldErrors[`borrower_${borrower.id}_suffix`] && (
                              <div className="text-danger small mt-1">{fieldErrors[`borrower_${borrower.id}_suffix`]}</div>
                            )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Primary Borrower</label>
                            <div className="form-check">
                          <input 
                                type="checkbox" 
                                className="form-check-input"
                                checked={borrower.borrowerIsPrimary || false}
                                onChange={(e) => {
                                  // Make this borrower primary and uncheck others
                                  setFormData(prev => ({
                                    ...prev,
                                    borrowers: prev.borrowers.map(b =>
                                      b.id === borrower.id 
                                        ? { ...b, borrowerIsPrimary: true }
                                        : { ...b, borrowerIsPrimary: false }
                                    )
                                  }));
                                }}
                                disabled={!isEditing}
                              />
                              <label className="form-check-label">
                                {borrower.borrowerIsPrimary ? 'Yes' : 'No'}
                              </label>
                            </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Email</label>
                          <input 
                              type="email" 
                            className="form-control" 
                              value={borrower.email || ''} 
                              readOnly={!isEditing}
                              onChange={(e) => updateBorrower(borrower.id, 'email', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Phone</label>
                          <input 
                            type="text" 
                            className="form-control" 
                              value={borrower.phone || ''} 
                              readOnly={!isEditing}
                              onChange={(e) => updateBorrower(borrower.id, 'phone', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Mailing Address</label>
                          <input 
                            type="text" 
                            className="form-control" 
                              value={borrower.mailingStreet1 || ''} 
                              readOnly={!isEditing}
                              onChange={(e) => updateBorrower(borrower.id, 'mailingStreet1', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mb-3">
                          <label className="form-label">Mailing City</label>
                          <input 
                            type="text" 
                            className="form-control" 
                              value={borrower.mailingCity || ''} 
                              readOnly={!isEditing}
                              onChange={(e) => updateBorrower(borrower.id, 'mailingCity', e.target.value)}
                          />
                        </div>
                      </div>
                        <div className="col-md-2">
                        <div className="form-group mb-3">
                            <label className="form-label">State</label>
                          <input 
                            type="text" 
                            className="form-control" 
                              value={borrower.mailingState || ''} 
                              readOnly={!isEditing}
                              onChange={(e) => updateBorrower(borrower.id, 'mailingState', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mb-3">
                          <label className="form-label">Mailing ZIP</label>
                          <input 
                            type="text" 
                            className="form-control" 
                              value={borrower.mailingZip || ''} 
                              readOnly={!isEditing}
                              onChange={(e) => updateBorrower(borrower.id, 'mailingZip', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  ))}
                  {isEditing && (
                    <button 
                      type="button" 
                      className="btn btn-sm btn-outline-primary"
                      onClick={addBorrower}
                    >
                      <i className="fas fa-plus me-1"></i>
                      Add Borrower
                    </button>
                  )}
                </>
              ) : (
                <p className="text-muted">No borrower information available</p>
              )}
            </div>
          </div>

          {/* Filing Entity Section */}
          <div className={`card mb-4 ${isEditing ? 'editing' : ''}`}>
            <SectionHeader title="Filing Entity" />
            <div className="card-body">
              <div className="row">
                <div className="col-12">
                  <div className="form-group mb-3">
                    <label className="form-label">Filing Entity Legal Name *</label>
                    <input 
                      type="text" 
                      name="filingEntityLegalName"
                      className={`form-control ${fieldErrors.filingEntityLegalName ? 'is-invalid' : ''}`}
                      value={formData.filingEntityLegalName || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.filingEntityLegalName && (
                      <div className="text-danger small mt-1">{fieldErrors.filingEntityLegalName}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Contact Name *</label>
                    <input 
                      type="text" 
                      name="filingContactName"
                      className={`form-control ${fieldErrors.filingContactName ? 'is-invalid' : ''}`}
                      value={formData.filingContactName || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.filingContactName && (
                      <div className="text-danger small mt-1">{fieldErrors.filingContactName}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Contact Email *</label>
                    <input 
                      type="email" 
                      name="filingContactEmail"
                      className={`form-control ${fieldErrors.filingContactEmail ? 'is-invalid' : ''}`}
                      value={formData.filingContactEmail || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.filingContactEmail && (
                      <div className="text-danger small mt-1">{fieldErrors.filingContactEmail}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Contact Phone *</label>
                    <input 
                      type="text" 
                      name="filingContactPhone"
                      className={`form-control ${fieldErrors.filingContactPhone ? 'is-invalid' : ''}`}
                      value={formData.filingContactPhone || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.filingContactPhone && (
                      <div className="text-danger small mt-1">{fieldErrors.filingContactPhone}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">NMLS License Number</label>
                    <input 
                      type="text" 
                      name="nmlsLicenseNumber"
                      className="form-control" 
                      value={formData.nmlsLicenseNumber || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">State License Number</label>
                    <input 
                      type="text" 
                      name="stateLicenseNumber"
                      className="form-control" 
                      value={formData.stateLicenseNumber || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">State License State</label>
                    <input 
                      type="text" 
                      name="stateLicenseState"
                      className="form-control" 
                      value={formData.stateLicenseState || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Street Address *</label>
                    <input 
                      type="text" 
                      name="filingEntityStreet1"
                      className={`form-control ${fieldErrors.filingEntityStreet1 ? 'is-invalid' : ''}`}
                      value={formData.filingEntityStreet1 || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.filingEntityStreet1 && (
                      <div className="text-danger small mt-1">{fieldErrors.filingEntityStreet1}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Street Address 2</label>
                    <input 
                      type="text" 
                      name="filingEntityStreet2"
                      className="form-control" 
                      value={formData.filingEntityStreet2 || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">City *</label>
                    <input 
                      type="text" 
                      name="filingEntityCity"
                      className={`form-control ${fieldErrors.filingEntityCity ? 'is-invalid' : ''}`}
                      value={formData.filingEntityCity || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.filingEntityCity && (
                      <div className="text-danger small mt-1">{fieldErrors.filingEntityCity}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">State *</label>
                    <input 
                      type="text" 
                      name="filingEntityState"
                      className={`form-control ${fieldErrors.filingEntityState ? 'is-invalid' : ''}`}
                      value={formData.filingEntityState || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.filingEntityState && (
                      <div className="text-danger small mt-1">{fieldErrors.filingEntityState}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">ZIP Code *</label>
                    <input 
                      type="text" 
                      name="filingEntityZip"
                      className={`form-control ${fieldErrors.filingEntityZip ? 'is-invalid' : ''}`}
                      value={formData.filingEntityZip || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.filingEntityZip && (
                      <div className="text-danger small mt-1">{fieldErrors.filingEntityZip}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right-to-Cure Section */}
          <div className={`card mb-4 ${isEditing ? 'editing' : ''}`}>
            <SectionHeader title="Right-to-Cure (§35A)" />
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Notice Sent *</label>
                    <select 
                      name="noticeSent"
                      className={`form-select ${fieldErrors.noticeSent ? 'is-invalid' : ''}`}
                      value={formData.noticeSent === null ? '' : formData.noticeSent ? 'true' : 'false'}
                      onChange={(e) => {
                        const value = e.target.value === 'true' ? true : e.target.value === 'false' ? false : null;
                        setFormData(prev => {
                          const updated = { ...prev, noticeSent: value };
                          // Initialize foreclosureSale if noticeSent is true and it doesn't exist
                          if (value === true && !updated.foreclosureSale) {
                            updated.foreclosureSale = {
                              saleDate: '',
                              soldTo: '',
                              vestingEntityName: '',
                              reoEntityName: '',
                              reoContactFirstName: '',
                              reoContactLastName: '',
                              reoBusinessPhone: '',
                              reoEmergencyPhone: ''
                            };
                          }
                          return updated;
                        });
                      }}
                      disabled={!isEditing}
                    >
                      <option value="">Select...</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                    {fieldErrors.noticeSent && (
                      <div className="text-danger small mt-1">{fieldErrors.noticeSent}</div>
                    )}
                  </div>
                </div>
                {formData.noticeSent === true && (
                  <>
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label className="form-label">Notice Date *</label>
                    <input 
                          type="date" 
                          name="noticeDate"
                          className={`form-control ${fieldErrors.noticeDate ? 'is-invalid' : ''}`}
                          value={formData.noticeDate || ''} 
                          readOnly={!isEditing}
                          onChange={handleInputChange}
                        />
                        {fieldErrors.noticeDate && (
                          <div className="text-danger small mt-1">{fieldErrors.noticeDate}</div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label className="form-label">Days Delinquent at Notice *</label>
                        <input 
                          type="number" 
                          name="daysDelinquentAtNotice"
                          className={`form-control ${fieldErrors.daysDelinquentAtNotice ? 'is-invalid' : ''}`}
                          value={formData.daysDelinquentAtNotice || ''} 
                          readOnly={!isEditing}
                          onChange={handleInputChange}
                        />
                        {fieldErrors.daysDelinquentAtNotice && (
                          <div className="text-danger small mt-1">{fieldErrors.daysDelinquentAtNotice}</div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label className="form-label">Amount in Default ($) *</label>
                        <input 
                          type="number" 
                          step="0.01"
                          name="amountInDefault"
                          className={`form-control ${fieldErrors.amountInDefault ? 'is-invalid' : ''}`}
                          value={formData.amountInDefault || ''} 
                          readOnly={!isEditing}
                          onChange={handleInputChange}
                        />
                        {fieldErrors.amountInDefault && (
                          <div className="text-danger small mt-1">{fieldErrors.amountInDefault}</div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label className="form-label">Cure Expiration Date</label>
                        <input 
                          type="date" 
                          name="cureExpirationDate"
                      className="form-control" 
                          value={formData.cureExpirationDate || ''} 
                          readOnly={!isEditing}
                          onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                        <label className="form-label">Notice Address Street</label>
                    <input 
                      type="text" 
                          name="noticeAddressStreet1"
                      className="form-control" 
                          value={formData.noticeAddressStreet1 || ''} 
                          readOnly={!isEditing}
                          onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                        <label className="form-label">Notice Address City</label>
                    <input 
                      type="text" 
                          name="noticeAddressCity"
                      className="form-control" 
                          value={formData.noticeAddressCity || ''} 
                          readOnly={!isEditing}
                          onChange={handleInputChange}
                    />
                  </div>
                </div>
                    <div className="col-md-4">
                  <div className="form-group mb-3">
                        <label className="form-label">Notice Address State</label>
                    <input 
                      type="text" 
                          name="noticeAddressState"
                      className="form-control" 
                          value={formData.noticeAddressState || ''} 
                          readOnly={!isEditing}
                          onChange={handleInputChange}
                    />
                  </div>
                </div>
                    <div className="col-md-4">
                  <div className="form-group mb-3">
                        <label className="form-label">Notice Address ZIP</label>
                    <input 
                      type="text" 
                          name="noticeAddressZip"
                      className="form-control" 
                          value={formData.noticeAddressZip || ''} 
                          readOnly={!isEditing}
                          onChange={handleInputChange}
                    />
                  </div>
                </div>
                  </>
                )}
                {formData.noticeSent === false && (
                  <div className="col-md-12">
                    <div className="form-group mb-3">
                      <label className="form-label">Acceleration Date</label>
                      <input 
                        type="date" 
                        name="manualOverrideReason"
                        className={`form-control ${fieldErrors.manualOverrideReason ? 'is-invalid' : ''}`}
                        value={formData.manualOverrideReason || ''} 
                        readOnly={!isEditing}
                        onChange={handleInputChange}
                      />
                      {fieldErrors.manualOverrideReason && (
                        <div className="text-danger small mt-1">{fieldErrors.manualOverrideReason}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Foreclosure Sale Section - Only show if Right to Cure is "Yes" */}
          {formData.noticeSent === true && (
            <div className={`card mb-4 ${isEditing ? 'editing' : ''}`}>
              <SectionHeader title="Foreclosure Sale" />
              <div className="card-body">
                <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                      <label className="form-label">Sale Date *</label>
                      <input 
                        type="date" 
                        className={`form-control ${fieldErrors['foreclosureSale.saleDate'] ? 'is-invalid' : ''}`}
                        value={formData.foreclosureSale?.saleDate || ''} 
                        readOnly={!isEditing}
                        onChange={(e) => updateForeclosureSale('saleDate', e.target.value)}
                      />
                      {fieldErrors['foreclosureSale.saleDate'] && (
                        <div className="text-danger small mt-1">{fieldErrors['foreclosureSale.saleDate']}</div>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Sold To?</label>
                    <input 
                      type="text" 
                      className="form-control" 
                        value={formData.foreclosureSale?.soldTo || ''} 
                        readOnly={!isEditing}
                        onChange={(e) => updateForeclosureSale('soldTo', e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                      <label className="form-label">Vesting Entity Name *</label>
                    <input 
                      type="text" 
                        className={`form-control ${fieldErrors['foreclosureSale.vestingEntityName'] ? 'is-invalid' : ''}`}
                        value={formData.foreclosureSale?.vestingEntityName || ''} 
                        readOnly={!isEditing}
                        onChange={(e) => updateForeclosureSale('vestingEntityName', e.target.value)}
                      />
                      {fieldErrors['foreclosureSale.vestingEntityName'] && (
                        <div className="text-danger small mt-1">{fieldErrors['foreclosureSale.vestingEntityName']}</div>
                      )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                      <label className="form-label">REO Entity Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                        value={formData.foreclosureSale?.reoEntityName || ''} 
                        readOnly={!isEditing}
                        onChange={(e) => updateForeclosureSale('reoEntityName', e.target.value)}
                    />
                  </div>
                </div>
                  <div className="col-md-6">
                  <div className="form-group mb-3">
                      <label className="form-label">REO Contact First Name *</label>
                    <input 
                      type="text" 
                        className={`form-control ${fieldErrors['foreclosureSale.reoContactFirstName'] ? 'is-invalid' : ''}`}
                        value={formData.foreclosureSale?.reoContactFirstName || ''} 
                        readOnly={!isEditing}
                        onChange={(e) => updateForeclosureSale('reoContactFirstName', e.target.value)}
                      />
                      {fieldErrors['foreclosureSale.reoContactFirstName'] && (
                        <div className="text-danger small mt-1">{fieldErrors['foreclosureSale.reoContactFirstName']}</div>
                      )}
                  </div>
                </div>
                  <div className="col-md-6">
                  <div className="form-group mb-3">
                      <label className="form-label">REO Contact Last Name *</label>
                      <input 
                        type="text" 
                        className={`form-control ${fieldErrors['foreclosureSale.reoContactLastName'] ? 'is-invalid' : ''}`}
                        value={formData.foreclosureSale?.reoContactLastName || ''} 
                        readOnly={!isEditing}
                        onChange={(e) => updateForeclosureSale('reoContactLastName', e.target.value)}
                      />
                      {fieldErrors['foreclosureSale.reoContactLastName'] && (
                        <div className="text-danger small mt-1">{fieldErrors['foreclosureSale.reoContactLastName']}</div>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">REO Business Phone *</label>
                      <input 
                        type="text" 
                        className={`form-control ${fieldErrors['foreclosureSale.reoBusinessPhone'] ? 'is-invalid' : ''}`}
                        value={formData.foreclosureSale?.reoBusinessPhone || ''} 
                        readOnly={!isEditing}
                        onChange={(e) => updateForeclosureSale('reoBusinessPhone', e.target.value)}
                      />
                      {fieldErrors['foreclosureSale.reoBusinessPhone'] && (
                        <div className="text-danger small mt-1">{fieldErrors['foreclosureSale.reoBusinessPhone']}</div>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">REO Emergency Phone</label>
                    <input 
                      type="text" 
                      className="form-control" 
                        value={formData.foreclosureSale?.reoEmergencyPhone || ''} 
                        readOnly={!isEditing}
                        onChange={(e) => updateForeclosureSale('reoEmergencyPhone', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Form 35B Compliance Section */}
          <div className={`card mb-4 ${isEditing ? 'editing' : ''}`}>
            <SectionHeader title="Form 35B Compliance" />
            <div className="card-body">
              <div className="row">
                <div className="col-12">
                  <div className="form-group mb-3">
                    <label className="form-label">Certain Mortgage Loan *</label>
                    <select 
                      name="certainMortgageLoan"
                      className={`form-select ${fieldErrors.certainMortgageLoan ? 'is-invalid' : ''}`}
                      value={formData.certainMortgageLoan === null ? '' : formData.certainMortgageLoan ? 'true' : 'false'}
                      onChange={(e) => {
                        const value = e.target.value === 'true' ? true : e.target.value === 'false' ? false : null;
                        setFormData(prev => ({ ...prev, certainMortgageLoan: value }));
                      }}
                      disabled={!isEditing}
                    >
                      <option value="">Select...</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                    {fieldErrors.certainMortgageLoan && (
                      <div className="text-danger small mt-1">{fieldErrors.certainMortgageLoan}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Affiant Name</label>
                    <input 
                      type="text" 
                      name="affiantName"
                      className="form-control" 
                      value={formData.affiantName || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Affiant Title</label>
                    <input 
                      type="text" 
                      name="affiantTitle"
                      className="form-control"
                      value={formData.affiantTitle || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Affidavit Execution Date</label>
                    <input 
                      type="date" 
                      name="affidavitExecutionDate"
                      className="form-control"
                      value={formData.affidavitExecutionDate || ''} 
                      readOnly={!isEditing}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Loan Assignees Section */}
          <div className={`card mb-4 ${isEditing ? 'editing' : ''}`}>
            <SectionHeader title="Loan Assignees" />
            <div className="card-body">
              {formData.loanAssignees && formData.loanAssignees.length > 0 ? (
                <>
                  {formData.loanAssignees.map((assignee, index) => (
                  <div key={index} className="border rounded p-3 mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0 fw-semibold">Assignee {index + 1}</h6>
                        {isEditing && (
                          <button 
                            type="button" 
                            className="btn btn-sm btn-danger"
                            onClick={() => removeLoanAssignee(index)}
                          >
                            <i className="fas fa-trash me-1"></i>
                            Remove
                          </button>
                        )}
                      </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                            <label className="form-label">Assignee Name *</label>
                          <input 
                            type="text" 
                              className={`form-control ${fieldErrors[`loanAssignees.${index}.assigneeName`] ? 'is-invalid' : ''}`}
                              value={assignee.assigneeName || ''} 
                              readOnly={!isEditing}
                              onChange={(e) => updateLoanAssignee(index, 'assigneeName', e.target.value)}
                            />
                            {fieldErrors[`loanAssignees.${index}.assigneeName`] && (
                              <div className="text-danger small mt-1">{fieldErrors[`loanAssignees.${index}.assigneeName`]}</div>
                            )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                            <label className="form-label">Assignee Type *</label>
                            <select 
                              className={`form-select ${fieldErrors[`loanAssignees.${index}.assigneeTypeId`] ? 'is-invalid' : ''}`}
                              value={assignee.assigneeTypeId || ''}
                              onChange={(e) => updateLoanAssignee(index, 'assigneeTypeId', e.target.value)}
                              disabled={!isEditing || commonDataLoading}
                            >
                              <option value="">Select Type</option>
                              {getAssigneeTypes().map(type => (
                                <option key={type.id} value={type.id}>
                                  {type.name}
                                </option>
                              ))}
                            </select>
                            {fieldErrors[`loanAssignees.${index}.assigneeTypeId`] && (
                              <div className="text-danger small mt-1">{fieldErrors[`loanAssignees.${index}.assigneeTypeId`]}</div>
                            )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                            <label className="form-label">Assignee Role *</label>
                            <select 
                              className={`form-select ${fieldErrors[`loanAssignees.${index}.assigneeRoleId`] ? 'is-invalid' : ''}`}
                              value={assignee.assigneeRoleId || ''}
                              onChange={(e) => updateLoanAssignee(index, 'assigneeRoleId', e.target.value)}
                              disabled={!isEditing || commonDataLoading}
                            >
                              <option value="">Select Role</option>
                              {getAssigneeRoles().map(role => (
                                <option key={role.id} value={role.id}>
                                  {role.name}
                                </option>
                              ))}
                            </select>
                            {fieldErrors[`loanAssignees.${index}.assigneeRoleId`] && (
                              <div className="text-danger small mt-1">{fieldErrors[`loanAssignees.${index}.assigneeRoleId`]}</div>
                            )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                            <label className="form-label">Street Address *</label>
                          <input 
                            type="text" 
                              className={`form-control ${fieldErrors[`loanAssignees.${index}.street1`] ? 'is-invalid' : ''}`}
                              value={assignee.street1 || ''} 
                              readOnly={!isEditing}
                              onChange={(e) => updateLoanAssignee(index, 'street1', e.target.value)}
                            />
                            {fieldErrors[`loanAssignees.${index}.street1`] && (
                              <div className="text-danger small mt-1">{fieldErrors[`loanAssignees.${index}.street1`]}</div>
                            )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Street Address 2</label>
                          <input 
                            type="text" 
                            className="form-control" 
                              value={assignee.street2 || ''} 
                              readOnly={!isEditing}
                              onChange={(e) => updateLoanAssignee(index, 'street2', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mb-3">
                            <label className="form-label">City *</label>
                          <input 
                            type="text" 
                              className={`form-control ${fieldErrors[`loanAssignees.${index}.city`] ? 'is-invalid' : ''}`}
                              value={assignee.city || ''} 
                              readOnly={!isEditing}
                              onChange={(e) => updateLoanAssignee(index, 'city', e.target.value)}
                            />
                            {fieldErrors[`loanAssignees.${index}.city`] && (
                              <div className="text-danger small mt-1">{fieldErrors[`loanAssignees.${index}.city`]}</div>
                            )}
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mb-3">
                            <label className="form-label">State *</label>
                          <input 
                            type="text" 
                              className={`form-control ${fieldErrors[`loanAssignees.${index}.addressState`] ? 'is-invalid' : ''}`}
                              value={assignee.addressState || ''} 
                              readOnly={!isEditing}
                              onChange={(e) => updateLoanAssignee(index, 'addressState', e.target.value)}
                            />
                            {fieldErrors[`loanAssignees.${index}.addressState`] && (
                              <div className="text-danger small mt-1">{fieldErrors[`loanAssignees.${index}.addressState`]}</div>
                            )}
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mb-3">
                            <label className="form-label">ZIP Code *</label>
                          <input 
                            type="text" 
                              className={`form-control ${fieldErrors[`loanAssignees.${index}.zip`] ? 'is-invalid' : ''}`}
                              value={assignee.zip || ''} 
                              readOnly={!isEditing}
                              onChange={(e) => updateLoanAssignee(index, 'zip', e.target.value)}
                            />
                            {fieldErrors[`loanAssignees.${index}.zip`] && (
                              <div className="text-danger small mt-1">{fieldErrors[`loanAssignees.${index}.zip`]}</div>
                            )}
                        </div>
                      </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">License Number</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              value={assignee.licenseNumber || ''} 
                              readOnly={!isEditing}
                              onChange={(e) => updateLoanAssignee(index, 'licenseNumber', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">License State</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              value={assignee.licenseState || ''} 
                              readOnly={!isEditing}
                              onChange={(e) => updateLoanAssignee(index, 'licenseState', e.target.value)}
                            />
                          </div>
                        </div>
                    </div>
                  </div>
                  ))}
                  {isEditing && (
                    <button 
                      type="button" 
                      className="btn btn-sm btn-outline-primary"
                      onClick={addLoanAssignee}
                    >
                      <i className="fas fa-plus me-1"></i>
                      Add Loan Assignee
                    </button>
                  )}
                </>
              ) : (
                <p className="text-muted">No assignee information available</p>
              )}
            </div>
          </div>

          {/* Signatures Section */}
          <div className={`card mb-4 ${isEditing ? 'editing' : ''}`}>
            <SectionHeader title="Signatures" />
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