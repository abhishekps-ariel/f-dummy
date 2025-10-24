import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignatureCapture = ({ isOpen, onClose, onSave }) => {
  const signatureRef = useRef();
  const [isCaptured, setIsCaptured] = useState(false);

  const handleClear = () => {
    signatureRef.current.clear();
    setIsCaptured(false);
  };

  const handleSave = () => {
    if (signatureRef.current.isEmpty()) {
      alert('Please provide a signature first');
      return;
    }

    const signatureData = signatureRef.current.toDataURL();
    onSave(signatureData);
    onClose();
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
              disabled={!isCaptured}
              style={{ minWidth: '80px' }}
            >
              <i className="fas fa-eraser me-1"></i>
              Clear
            </button>
            <button 
              type="button" 
              className="dashboard-btn-refresh" 
              onClick={onClose}
              style={{ minWidth: '80px' }}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="dashboard-btn-create" 
              onClick={handleSave}
              disabled={!isCaptured}
              style={{ minWidth: '120px' }}
            >
              <i className="fas fa-save me-1"></i>
              Save Signature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureCapture;
