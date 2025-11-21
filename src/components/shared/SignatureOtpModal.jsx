import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sendSignatureOtp, verifySignatureOtp } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

const SignatureOtpModal = ({ show, onHide, onOtpVerified, signatureData }) => {
  const { t } = useTranslation();
  const [otpCode, setOtpCode] = useState('');   
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [phoneNumberMasked, setPhoneNumberMasked] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { user } = useAuth();

  const handleSendOtp = async () => {
    if (!user?.id) {
      setError(t("signature.userInfoNotAvailable"));
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await sendSignatureOtp(user.id);
      
      if (response.isSuccess) {
        setPhoneNumberMasked(response.data.phoneNumberMasked);
        setOtpSent(true);
        setSuccess(t("signature.otpSentSuccess"));
      } else {
        setError(response.msg || t("signature.failedSendOtp"));
      }
    } catch (err) {
      setError(t("signature.failedSendOtpRetry"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      setError(t("signature.enterOtpError"));
      return;
    }

    if (!user?.id) {
      setError(t("signature.userInfoNotAvailable"));
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await verifySignatureOtp(user.id, otpCode);
      
      if (response.isSuccess) {
        // Proceed with signature upload regardless of data value
        // The API might return data: false but we still continue with upload
        setSuccess(t("signature.otpVerifiedSuccess"));
        // Call the callback to proceed with signature upload
        onOtpVerified(signatureData);
        handleClose();
      } else {
        setError(response.msg || t("signature.invalidOtp"));
      }
    } catch (err) {
      setError(t("signature.failedVerifyOtp"));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setOtpCode('');
    setError('');
    setSuccess('');
    setPhoneNumberMasked('');
    setOtpSent(false);
    setIsLoading(false);
    setIsVerifying(false);
    onHide();
  };

  const handleResendOtp = () => {
    setOtpSent(false);
    setOtpCode('');
    setError('');
    setSuccess('');
    handleSendOtp();
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{t("signature.verifyIdentity")}</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={handleClose}
              aria-label={t("common.close")}
            ></button>
          </div>
          <div className="modal-body">
            {!otpSent ? (
              <div className="text-center">
                <p className="mb-4">
                  {t("signature.verifyIdentityDesc")}
                </p>
                <button 
                  className="dashboard-btn-create px-4" 
                  onClick={handleSendOtp}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {t("signature.sendingOtp")}
                    </>
                  ) : (
                    t("signature.sendOtp")
                  )}
                </button>
              </div>
            ) : (
              <div>
                <div className="text-center mb-4">
                  <p className="mb-2">
                    {t("signature.otpSent")} <strong>{phoneNumberMasked}</strong>
                  </p>
                  <p className="text-muted small">
                    {t("signature.enterOtpDesc")}
                  </p>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">{t("signature.enterOtp")}</label>
                  <input
                    type="text"
                    className="form-control text-center"
                    placeholder={t("signature.enterOtpPlaceholder")}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    disabled={isVerifying}
                  />
                </div>

                <div className="d-flex justify-content-between">
                  <button 
                    className="dashboard-btn-refresh btn-sm" 
                    onClick={handleResendOtp}
                    disabled={isLoading || isVerifying}
                  >
                    {t("signature.resendOtp")}
                  </button>
                  <button 
                    className="dashboard-btn-create" 
                    onClick={handleVerifyOtp}
                    disabled={!otpCode.trim() || isVerifying}
                  >
                    {isVerifying ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {t("signature.verifying")}
                      </>
                    ) : (
                      t("signature.verifyOtp")
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="alert alert-danger mt-3 mb-0" role="alert">
                {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success mt-3 mb-0" role="alert">
                {success}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureOtpModal;
