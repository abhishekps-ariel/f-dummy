import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import SignatureOtpModal from './SignatureOtpModal';

const SignatureCapture = ({ isOpen, onClose, onSave, isUploading = false }) => {
  const signatureRef = useRef();
  const [isCaptured, setIsCaptured] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [signatureData, setSignatureData] = useState(null);

  const handleClear = () => {
    signatureRef.current.clear();
    setIsCaptured(false);
  };

  const handleSave = () => {
    if (signatureRef.current.isEmpty()) {
      alert('Please provide a signature first');
      return;
    }

    const data = signatureRef.current.toDataURL();
    setSignatureData(data);
    setShowOtpModal(true);
  };

  const handleOtpVerified = (verifiedSignatureData) => {
    // OTP verification successful, proceed with signature upload
    onSave(verifiedSignatureData);
    setShowOtpModal(false);
    setSignatureData(null);
    onClose();
  };

  const handleOtpModalClose = () => {
    setShowOtpModal(false);
    setSignatureData(null);
  };

  const handleBegin = () => {
    setIsCaptured(true);
  };

  const handleEnd = () => {
    if (!signatureRef.current.isEmpty()) {
      setIsCaptured(true);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-signature me-2"></i>
                Capture Digital Signature
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <p className="text-muted small mb-3">
                  Please sign in the box below using your mouse or touch device.
                </p>
                
                {/* Signature Canvas */}
                <div className="border rounded p-2" style={{ backgroundColor: '#fff' }}>
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      width: 500,
                      height: 200,
                      className: 'signature-canvas'
                    }}
                    onBegin={handleBegin}
                    onEnd={handleEnd}
                    backgroundColor="#ffffff"
                    penColor="#000000"
                  />
                </div>
                
                {/* Instructions */}
                <div className="mt-2">
                  <small className="text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    Use your mouse or touch device to sign in the box above.
                  </small>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="dashboard-btn-refresh" 
                onClick={handleClear}
                disabled={!isCaptured || isUploading}
                style={{ minWidth: '80px' }}
              >
                <i className="fas fa-eraser me-1"></i>
                Clear
              </button>
              <button 
                type="button" 
                className="dashboard-btn-refresh" 
                onClick={onClose}
                disabled={isUploading}
                style={{ minWidth: '80px' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="dashboard-btn-create" 
                onClick={handleSave}
                disabled={!isCaptured || isUploading}
                style={{ minWidth: '120px' }}
              >
                {isUploading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="fas fa-upload me-1"></i>
                    Upload Signature
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      <SignatureOtpModal
        show={showOtpModal}
        onHide={handleOtpModalClose}
        onOtpVerified={handleOtpVerified}
        signatureData={signatureData}
      />
    </>
  );
};

export default SignatureCapture;
