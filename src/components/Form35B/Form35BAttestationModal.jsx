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
      newErrors.submitterFirstName = t("form35B.attestation.validation.firstNameRequired");
    }
    if (!attestationData.submitterLastName.trim()) {
      newErrors.submitterLastName = t("form35B.attestation.validation.lastNameRequired");
    }
    if (!attestationData.submitterTitle.trim()) {
      newErrors.submitterTitle = t("form35B.attestation.validation.titleRequired");
    }
    if (!attestationData.submitterEmail.trim()) {
      newErrors.submitterEmail = t("form35B.attestation.validation.emailRequired");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(attestationData.submitterEmail.trim())) {
        newErrors.submitterEmail = t("form35B.attestation.validation.emailInvalid");
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
              {t("form35B.attestation.title")}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label={t("common.close")}
            ></button>
          </div>
          <div className="modal-body">
            <p className="text-muted mb-4">
              {t("form35B.attestation.description")}
            </p>

            <div className="p-4 border border-info bg-info-subtle rounded mb-4">
              <h5 className="fw-bold font-base mb-3">
                <i className="fas fa-user me-2"></i>
                {t("form35B.attestation.submitterInformation")}
              </h5>

              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="submitterFirstName" className="form-label fw-medium">
                    {t("form35B.attestation.firstName")} <span className="text-danger">*</span>
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
                    {t("form35B.attestation.prefilledFromProfile")}
                  </small>
                </div>

                <div className="col-md-6">
                  <label htmlFor="submitterLastName" className="form-label fw-medium">
                    {t("form35B.attestation.lastName")} <span className="text-danger">*</span>
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
                    {t("form35B.attestation.prefilledFromProfile")}
                  </small>
                </div>

                <div className="col-md-6">
                  <label htmlFor="submitterTitle" className="form-label fw-medium">
                    {t("form35B.attestation.title")} <span className="text-danger">*</span>
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
                    {t("form35B.attestation.prefilledFromProfile")}
                  </small>
                </div>

                <div className="col-md-6">
                  <label htmlFor="submitterEmail" className="form-label fw-medium">
                    {t("form35B.attestation.emailAddress")} <span className="text-danger">*</span>
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
                    {t("form35B.attestation.prefilledFromProfile")}
                  </small>
                </div>
              </div>
            </div>

            <div className="border-top pt-3 text-muted small">
              <p className="mb-0">
                {t("form35B.attestation.attestationText")}
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
              {t("form35B.attestation.cancel")}
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
                  {t("form35B.attestation.submitting")}
                </>
              ) : (
                <>
                  <i className="fas fa-check me-2"></i>
                  {t("form35B.attestation.confirmSubmit")}
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

