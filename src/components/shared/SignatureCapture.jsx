import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SignatureCanvas from 'react-signature-canvas';
import SignatureOtpModal from './SignatureOtpModal';

const SignatureCapture = ({ isOpen, onClose, onSave, isUploading = false }) => {
  const { t } = useTranslation();
  const signatureRef = useRef();
  const textCanvasRef = useRef();
  const canvasWrapperRef = useRef();
  const [mode, setMode] = useState('draw'); // 'draw' or 'type'
  const [isCaptured, setIsCaptured] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [typedSignature, setTypedSignature] = useState('');
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 500, height: 200 });

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

  // Calculate canvas dimensions based on container size
  useEffect(() => {
    if (!isOpen || mode !== 'draw') return;

    const updateCanvasDimensions = () => {
      if (!canvasWrapperRef.current) return;

      const container = canvasWrapperRef.current;
      const containerRect = container.getBoundingClientRect();
      
      if (window.innerWidth <= 768) {
        // Mobile: use container dimensions
        const headerHeight = 60;
        const footerHeight = 80;
        const modeToggleHeight = 60;
        const padding = 40;
        const availableHeight = window.innerHeight - headerHeight - footerHeight - modeToggleHeight - padding;
        setCanvasDimensions({
          width: window.innerWidth - 40,
          height: Math.max(300, availableHeight)
        });
      } else {
        // Desktop: use fixed dimensions that match the wrapper size
        // Get the wrapper's computed style or use defaults
        const wrapperWidth = containerRect.width > 0 ? Math.floor(containerRect.width) : 600;
        const wrapperHeight = containerRect.height > 0 ? Math.floor(containerRect.height) : 200;
        
        // Set dimensions to match wrapper exactly - prevents coordinate offset
        setCanvasDimensions({ 
          width: wrapperWidth,
          height: wrapperHeight
        });
      }
    };

    // Initial update with multiple attempts to ensure DOM is ready
    const timeout1 = setTimeout(updateCanvasDimensions, 50);
    const timeout2 = setTimeout(updateCanvasDimensions, 200);
    
    // Use ResizeObserver for better size tracking
    let resizeObserver;
    if (canvasWrapperRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        updateCanvasDimensions();
      });
      resizeObserver.observe(canvasWrapperRef.current);
    }

    window.addEventListener('resize', updateCanvasDimensions);
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      window.removeEventListener('resize', updateCanvasDimensions);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [isOpen, mode]);

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
        alert(t("signature.provideSignatureFirst"));
        return;
      }
      data = signatureRef.current.toDataURL();
    } else {
      // Type mode
      if (!typedSignature.trim()) {
        alert(t("signature.enterNameFirst"));
        return;
      }
      
      // Ensure canvas is rendered
      if (textCanvasRef.current) {
        renderTypedSignature();
        data = textCanvasRef.current.toDataURL();
      } else {
        alert(t("signature.errorGeneratingSignature"));
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
      <div className="modal fade show d-block signature-modal" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg modal-dialog-centered signature-modal-dialog">
          <div className="modal-content signature-modal-content">
            <div className="modal-header signature-modal-header">
              <h5 className="modal-title">
                <i className="fas fa-signature me-2"></i>
                {t("signature.captureDigitalSignature")}
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={onClose}
                aria-label={t("common.close")}
              ></button>
            </div>
            <div className="modal-body signature-modal-body">
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
                      {t("signature.drawSignature")}
                    </button>
                    <button
                      type="button"
                      className={`signature-toggle-btn ${mode === 'type' ? 'active' : ''}`}
                      onClick={() => handleModeChange('type')}
                    >
                      <i className="fas fa-keyboard me-2"></i>
                      {t("signature.typeSignature")}
                    </button>
                  </div>
                </div>

                {mode === 'draw' ? (
                  <>
                    <p className="text-muted small mb-3 d-none d-md-block">
                      {t("signature.drawSignatureDesc")}
                    </p>
                    
                    {/* Signature Canvas */}
                    <div className="signature-canvas-wrapper" ref={canvasWrapperRef}>
                      <SignatureCanvas
                        ref={signatureRef}
                        canvasProps={{
                          width: canvasDimensions.width,
                          height: canvasDimensions.height,
                          className: 'signature-canvas'
                        }}
                        onBegin={handleBegin}
                        onEnd={handleEnd}
                        backgroundColor="#ffffff"
                        penColor="#000000"
                      />
                    </div>
                    
                    {/* Instructions */}
                    <div className="mt-2 d-none d-md-block">
                      <small className="text-muted">
                        <i className="fas fa-info-circle me-1"></i>
                        {t("signature.useMouseToSign")}
                      </small>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-muted small mb-3">
                      {t("signature.typeSignatureDesc")}
                    </p>
                    
                    {/* Text Input */}
                    <div className="mb-3">
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        placeholder={t("signature.enterFullName")}
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
                          {t("signature.signatureWillAppear")}
                        </div>
                      )}
                    </div>
                    
                    {/* Instructions */}
                    <div className="mt-2">
                      <small className="text-muted">
                        <i className="fas fa-info-circle me-1"></i>
                        {t("signature.typeNameToSeePreview")}
                      </small>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="modal-footer signature-modal-footer">
              <button 
                type="button" 
                className="dashboard-btn-refresh" 
                onClick={handleClear}
                disabled={!isCaptured || isUploading}
                style={{ minWidth: '80px' }}
              >
                <i className="fas fa-eraser me-1"></i>
                {t("signature.clear")}
              </button>
              <button 
                type="button" 
                className="dashboard-btn-refresh" 
                onClick={onClose}
                disabled={isUploading}
                style={{ minWidth: '80px' }}
              >
                {t("common.cancel")}
              </button>
              <button 
                type="button" 
                className="dashboard-btn-create signature-upload-btn" 
                onClick={handleSave}
                disabled={!isCaptured || isUploading}
                style={{ minWidth: '120px' }}
              >
                {isUploading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    <span className="d-none d-md-inline">{t("signature.uploading")}</span>
                    <span className="d-md-none">{t("signature.uploading")}</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-upload me-1"></i>
                    <span className="d-none d-md-inline">{t("signature.uploadSignature")}</span>
                    <span className="d-md-none">{t("signature.upload")}</span>
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
