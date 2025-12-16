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
    if (attestationData.submitterEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(attestationData.submitterEmail.trim())) {
        newErrors.submitterEmail = t("form35B.attestation.validation.emailInvalid");
      }
    } else {
      newErrors.submitterEmail = t("form35B.attestation.validation.emailRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (validateAttestation()) {
      onConfirm(attestationData);
    }
  };

  useEffect(() => {
    const dialog = document.getElementById('form35b-attestation-dialog');
    if (dialog) {
      if (isOpen) {
        dialog.showModal();
      } else {
        dialog.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = document.getElementById('form35b-attestation-dialog');
    if (!dialog) return;

    const handleClose = () => {
      if (!isSubmitting) {
        onClose();
      }
    };

    dialog.addEventListener('close', handleClose);
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      if (isSubmitting) {
        return;
      }
      onClose();
    });

    return () => {
      dialog.removeEventListener('close', handleClose);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <dialog
      id="form35b-attestation-dialog"
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100, border: 'none', padding: 0 }}
      aria-labelledby="form35b-attestation-title"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 id="form35b-attestation-title" className="modal-title fw-bold theme-color">
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
                <h5 className="fw-bold font-base mb-3 text-dark">
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
                    {t("form35B.attestation.submitterTitle")} <span className="text-danger">*</span>
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
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                  <output>{t("form35B.attestation.submitting")}</output>
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
    </dialog>
  );
};

export default Form35BAttestationModal;

