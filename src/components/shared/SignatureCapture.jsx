import React, { useRef, useState, useEffect, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import SignatureOtpModal from './SignatureOtpModal';

const SignatureCapture = ({ isOpen, onClose, onSave, isUploading = false }) => {
  const signatureRef = useRef();
  const textCanvasRef = useRef();
  const [mode, setMode] = useState('draw'); // 'draw' or 'type'
  const [isCaptured, setIsCaptured] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [typedSignature, setTypedSignature] = useState('');

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode('draw');
      setTypedSignature('');
      setIsCaptured(false);
      if (signatureRef.current) {
        signatureRef.current.clear();
      }
    }
  }, [isOpen]);

  // Render typed signature to canvas when text changes
  const renderTypedSignature = useCallback(() => {
    const canvas = textCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = 500;
    const height = 200;
    
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (typedSignature.trim()) {
      // Set cursive font - try Great Vibes first, fallback to Dancing Script
      // ctx.font = 'bold 42px "Great Vibes", cursive';
      ctx.font = 'bold 42px "Great Vibes", cursive'; 
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Draw the signature text
      ctx.fillText(typedSignature.trim(), width / 2, height / 2);
    }
  }, [typedSignature]);

  useEffect(() => {
    if (mode === 'type' && typedSignature && textCanvasRef.current) {
      renderTypedSignature();
    }
  }, [typedSignature, mode, renderTypedSignature]);

  const handleClear = () => {
    if (mode === 'draw' && signatureRef.current) {
      signatureRef.current.clear();
    } else if (mode === 'type') {
      setTypedSignature('');
    }
    setIsCaptured(false);
  };

  const handleSave = () => {
    let data;

    if (mode === 'draw') {
      if (!signatureRef.current || signatureRef.current.isEmpty()) {
        alert('Please provide a signature first');
        return;
      }
      data = signatureRef.current.toDataURL();
    } else {
      // Type mode
      if (!typedSignature.trim()) {
        alert('Please enter your name first');
        return;
      }
      
      // Ensure canvas is rendered
      if (textCanvasRef.current) {
        renderTypedSignature();
        data = textCanvasRef.current.toDataURL();
      } else {
        alert('Error generating signature. Please try again.');
        return;
      }
    }

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
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      setIsCaptured(true);
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setIsCaptured(false);
    if (newMode === 'draw' && signatureRef.current) {
      signatureRef.current.clear();
    } else if (newMode === 'type') {
      setTypedSignature('');
    }
  };

  const handleTypedSignatureChange = (e) => {
    const value = e.target.value;
    setTypedSignature(value);
    setIsCaptured(value.trim().length > 0);
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
                {/* Mode Toggle */}
                <div className="mb-3">
                  <div className="signature-mode-toggle" role="group" aria-label="Signature mode">
                    <button
                      type="button"
                      className={`signature-toggle-btn ${mode === 'draw' ? 'active' : ''}`}
                      onClick={() => handleModeChange('draw')}
                    >
                      <i className="fas fa-pen me-2"></i>
                      Draw Signature
                    </button>
                    <button
                      type="button"
                      className={`signature-toggle-btn ${mode === 'type' ? 'active' : ''}`}
                      onClick={() => handleModeChange('type')}
                    >
                      <i className="fas fa-keyboard me-2"></i>
                      Type Signature
                    </button>
                  </div>
                </div>

                {mode === 'draw' ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <p className="text-muted small mb-3">
                      Enter your name below. It will be displayed in a cursive font.
                    </p>
                    
                    {/* Text Input */}
                    <div className="mb-3">
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        placeholder="Enter your full name"
                        value={typedSignature}
                        onChange={handleTypedSignatureChange}
                        style={{ fontSize: '18px', textAlign: 'center' }}
                      />
                    </div>
                    
                    {/* Preview Canvas */}
                    <div className="border rounded p-2" style={{ backgroundColor: '#fff', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {typedSignature.trim() ? (
                        <canvas
                          ref={textCanvasRef}
                          style={{ maxWidth: '100%', height: 'auto' }}
                          className="signature-canvas"
                        />
                      ) : (
                        <div className="text-muted" style={{ fontFamily: '"Great Vibes", serif', fontWeight: 'bold', fontSize: '42px' }}>
                          Your signature will appear here
                        </div>
                      )}
                    </div>
                    
                    {/* Instructions */}
                    <div className="mt-2">
                      <small className="text-muted">
                        <i className="fas fa-info-circle me-1"></i>
                        Type your name above to see it rendered in a cursive font.
                      </small>
                    </div>
                  </>
                )}
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
