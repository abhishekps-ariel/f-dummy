import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../utils/dateUtils';

const Form35BViewerModal = ({ isOpen, onClose, formData, reportingPeriods = [] }) => {
  const { t } = useTranslation();

  // Helper function to get reporting period name by ID
  const getReportingPeriodName = (reportingPeriodId) => {
    if (!reportingPeriodId || !reportingPeriods.length) {
      return null;
    }
    const period = reportingPeriods.find(p => p.id === reportingPeriodId);
    return period ? period.name : null;
  };

  if (!isOpen || !formData) return null;

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1070 }}
      tabIndex="-1"
      onClick={onClose}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{t("form35B.viewer.title")}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label={t("common.close")}
            ></button>
          </div>
          <div className="modal-body form35b-viewer-modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <div className="row g-3">
              {/* Basic Information */}
              <div className="col-12">
                <h6 className="fw-bold mb-3">{t("form35B.viewer.basicInformation")}</h6>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-medium text-muted small">{t("form35B.viewer.submissionDate")}</label>
                <div className="form-control-plaintext">
                  {formData.createdDate ? formatDate(formData.createdDate) : t("common.nA")}
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-medium text-muted small">{t("form35B.viewer.lastModified")}</label>
                <div className="form-control-plaintext">
                  {formData.modifiedDate ? formatDate(formData.modifiedDate) : t("common.nA")}
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-medium text-muted small">{t("form35B.viewer.reportingYear")}</label>
                <div className="form-control-plaintext">
                  {formData.reportingYear || t("common.nA")}
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-medium text-muted small">{t("form35B.viewer.reportingPeriod")}</label>
                <div className="form-control-plaintext">
                  {getReportingPeriodName(formData.reportingPeriodId) || formData.reportingPeriodName || t("common.nA")}
                </div>
              </div>

              <div className="col-12">
                <label className="form-label fw-medium text-muted small">{t("form35B.viewer.municipality")}</label>
                <div className="form-control-plaintext">
                  {formData.municipality || t("common.nA")}
                </div>
              </div>

              {/* Submitter Information */}
              <div className="col-12 mt-4">
                <h6 className="fw-bold mb-3">{t("form35B.viewer.submitterInformation")}</h6>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-medium text-muted small">{t("form35B.viewer.submitterName")}</label>
                <div className="form-control-plaintext">
                  {formData.submitterFirstName && formData.submitterLastName
                    ? `${formData.submitterFirstName} ${formData.submitterLastName}`
                    : t("common.nA")}
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-medium text-muted small">{t("form35B.viewer.submitterTitle")}</label>
                <div className="form-control-plaintext">
                  {formData.submitterTitle || t("common.nA")}
                </div>
              </div>

              <div className="col-12">
                <label className="form-label fw-medium text-muted small">{t("form35B.viewer.submitterEmail")}</label>
                <div className="form-control-plaintext">
                  {formData.submitterEmail || t("common.nA")}
                </div>
              </div>

              {/* Form Data */}
              <div className="col-12 mt-4">
                <h6 className="fw-bold mb-3">{t("form35B.viewer.formData")}</h6>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-medium text-muted small">{t("form35B.question5")}</label>
                <div className="form-control-plaintext">
                  {formData.noticeSentCount ?? 0}
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-medium text-muted small">{t("form35B.question6")}</label>
                <div className="form-control-plaintext">
                  {formData.respondedWithin30Days ?? 0}
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-medium text-muted small">{t("form35B.question7")}</label>
                <div className="form-control-plaintext">
                  {formData.requestedModification ?? 0}
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-medium text-muted small">{t("form35B.question8")}</label>
                <div className="form-control-plaintext">
                  {formData.requestedAlternativeToForeclosure ?? 0}
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-medium text-muted small">{t("form35B.question9")}</label>
                <div className="form-control-plaintext">
                  {formData.choseNotToPursueModButProceedRTC ?? 0}
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-medium text-muted small">{t("form35B.question10")}</label>
                <div className="form-control-plaintext">
                  {formData.waivedRightToCure ?? 0}
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-medium text-muted small">{t("form35B.question11")}</label>
                <div className="form-control-plaintext">
                  {formData.didNotRespondWithin30Days ?? 0}
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-medium text-muted small">{t("form35B.question12")}</label>
                <div className="form-control-plaintext">
                  {formData.loanModFinalized ?? 0}
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-medium text-muted small">{t("form35B.question13")}</label>
                <div className="form-control-plaintext">
                  {formData.loanModDenied ?? 0}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="dashboard-btn-refresh"
              onClick={onClose}
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Form35BViewerModal;

