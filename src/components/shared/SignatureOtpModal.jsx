import React, { useState } from 'react';
import { sendSignatureOtp, verifySignatureOtp } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

const SignatureOtpModal = ({ show, onHide, onOtpVerified, signatureData }) => {
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
      setError('User information not available');
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
        setSuccess('OTP sent successfully to your registered phone number');
      } else {
        setError(response.msg || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      setError('Please enter the OTP');
      return;
    }

    if (!user?.id) {
      setError('User information not available');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await verifySignatureOtp(user.id, otpCode);
      
      if (response.isSuccess && response.data === true) {
        setSuccess('OTP verified successfully! Uploading signature...');
        // Call the callback to proceed with signature upload
        onOtpVerified(signatureData);
        handleClose();
      } else {
        setError(response.msg || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError('Failed to verify OTP. Please try again.');
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
            <h5 className="modal-title">Verify Your Identity</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={handleClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            {!otpSent ? (
              <div className="text-center">
                <p className="mb-4">
                  To upload your signature, we need to verify your identity with an OTP sent to your registered phone number.
                </p>
                <button 
                  className="dashboard-btn-create px-4" 
                  onClick={handleSendOtp}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Sending OTP...
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </button>
              </div>
            ) : (
              <div>
                <div className="text-center mb-4">
                  <p className="mb-2">
                    OTP has been sent to: <strong>{phoneNumberMasked}</strong>
                  </p>
                  <p className="text-muted small">
                    Please enter the 6-digit OTP to verify your identity.
                  </p>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Enter OTP</label>
                  <input
                    type="text"
                    className="form-control text-center"
                    placeholder="Enter 6-digit OTP"
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
                    Resend OTP
                  </button>
                  <button 
                    className="dashboard-btn-create" 
                    onClick={handleVerifyOtp}
                    disabled={!otpCode.trim() || isVerifying}
                  >
                    {isVerifying ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Verifying...
                      </>
                    ) : (
                      'Verify OTP'
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
