import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getUserRole } from '../../utils/storage';

const Form35BAttestationModal = ({
  isOpen,
  onClose,
  onConfirm,
  user,
  isSubmitting = false,
}) => {
  const { t } = useTranslation();
  const [attestationData, setAttestationData] = useState({
    submitterFirstName: '',
    submitterLastName: '',
    submitterTitle: '',
    submitterEmail: '',
  });
  const [errors, setErrors] = useState({});

  // Prefill data from user profile when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setAttestationData({
        submitterFirstName: user.firstName || '',
        submitterLastName: user.lastName || '',
        submitterTitle: getUserRole(user) || '',
        submitterEmail: user.email || '',
      });
      setErrors({});
    }
  }, [isOpen, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAttestationData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateAttestation = () => {
    const newErrors = {};
    
    if (!attestationData.submitterFirstName.trim()) {
      newErrors.submitterFirstName = 'First Name is required';
    }
    if (!attestationData.submitterLastName.trim()) {
      newErrors.submitterLastName = 'Last Name is required';
    }
    if (!attestationData.submitterTitle.trim()) {
      newErrors.submitterTitle = 'Title is required';
    }
    if (!attestationData.submitterEmail.trim()) {
      newErrors.submitterEmail = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(attestationData.submitterEmail.trim())) {
        newErrors.submitterEmail = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (validateAttestation()) {
      onConfirm(attestationData);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}
      tabIndex="-1"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          // Don't close on backdrop click for attestation, and don't close during submission
        }
      }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold theme-color">
              <i className="fas fa-signature me-2"></i>
              Form 35B Submission Attestation
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <p className="text-muted mb-4">
              Please review and confirm your attestation details before submitting Form 35B.
            </p>

            <div className="p-4 border border-info bg-info-subtle rounded mb-4">
              <h5 className="fw-bold font-base mb-3">
                <i className="fas fa-user me-2"></i>
                Submitter Information
              </h5>

              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="submitterFirstName" className="form-label fw-medium">
                    First Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="submitterFirstName"
                    name="submitterFirstName"
                    className={`form-control ${errors.submitterFirstName ? 'is-invalid' : ''}`}
                    value={attestationData.submitterFirstName}
                    onChange={handleInputChange}
                  />
                  {errors.submitterFirstName && (
                    <div className="invalid-feedback">{errors.submitterFirstName}</div>
                  )}
                  <small className="text-muted">
                    Prefilled from your profile
                  </small>
                </div>

                <div className="col-md-6">
                  <label htmlFor="submitterLastName" className="form-label fw-medium">
                    Last Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="submitterLastName"
                    name="submitterLastName"
                    className={`form-control ${errors.submitterLastName ? 'is-invalid' : ''}`}
                    value={attestationData.submitterLastName}
                    onChange={handleInputChange}
                  />
                  {errors.submitterLastName && (
                    <div className="invalid-feedback">{errors.submitterLastName}</div>
                  )}
                  <small className="text-muted">
                    Prefilled from your profile
                  </small>
                </div>

                <div className="col-md-6">
                  <label htmlFor="submitterTitle" className="form-label fw-medium">
                    Title <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="submitterTitle"
                    name="submitterTitle"
                    className={`form-control ${errors.submitterTitle ? 'is-invalid' : ''}`}
                    value={attestationData.submitterTitle}
                    onChange={handleInputChange}
                  />
                  {errors.submitterTitle && (
                    <div className="invalid-feedback">{errors.submitterTitle}</div>
                  )}
                  <small className="text-muted">
                    Prefilled from your profile
                  </small>
                </div>

                <div className="col-md-6">
                  <label htmlFor="submitterEmail" className="form-label fw-medium">
                    Email Address <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    id="submitterEmail"
                    name="submitterEmail"
                    className={`form-control ${errors.submitterEmail ? 'is-invalid' : ''}`}
                    value={attestationData.submitterEmail}
                    onChange={handleInputChange}
                  />
                  {errors.submitterEmail && (
                    <div className="invalid-feedback">{errors.submitterEmail}</div>
                  )}
                  <small className="text-muted">
                    Prefilled from your profile
                  </small>
                </div>
              </div>
            </div>

            <div className="border-top pt-3 text-muted small">
              <p className="mb-0">
                By confirming, you attest that the information provided in this form is accurate and complete.
              </p>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="dashboard-btn-refresh"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ minWidth: '80px' }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="dashboard-btn-create"
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Submitting...
                </>
              ) : (
                <>
                  <i className="fas fa-check me-2"></i>
                  Confirm & Submit
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Form35BAttestationModal;

