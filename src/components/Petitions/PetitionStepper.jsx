import React, { useState, useEffect, useRef } from 'react';
import { usePetitionWizard } from '../../context/PetitionWizardContext';
import './PetitionStepper.css';

const stepLabels = [
  'Property Details',
  'Loan Details',
  'Borrower Details',
  'Filing Entity',
  'Right-to-Cure',
  'Form 35B Compliance',
  'Loan Assignees',
  'Attestation & Signatures',
  'Review & Submit'
];

const PetitionStepper = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { currentStep, completedSteps, goToStep, canAccessStep } = usePetitionWizard();
  const stepperNavRef = useRef(null);

  // Auto-scroll to current step
  useEffect(() => {
    if (stepperNavRef.current) {
      const currentStepElement = stepperNavRef.current.querySelector(`[data-step="${currentStep}"]`);
      if (currentStepElement) {
        currentStepElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    }
  }, [currentStep]);

  const getStepStatus = (stepNumber) => {
    if (completedSteps.has(stepNumber)) {
      return 'completed';
    } else if (currentStep === stepNumber) {
      return 'current';
    } else if (canAccessStep(stepNumber)) {
      return 'accessible';
    } else {
      return 'locked';
    }
  };

  const handleStepClick = (stepNumber) => {
    if (canAccessStep(stepNumber)) {
      goToStep(stepNumber);
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        className="btn btn-outline-primary w-100 d-lg-none mb-3"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <i className={`fas fa-chevron-${isMobileOpen ? 'up' : 'down'} me-2`}></i>
        {isMobileOpen ? 'Hide' : 'Show'} Progress ({currentStep}/9)
      </button>

      <div className={`petition-stepper-container ${!isMobileOpen ? 'd-none d-lg-block' : ''}`}>
        <h5 className="stepper-title">Petition Form Progress</h5>
      <div className="stepper-nav" ref={stepperNavRef}>
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const status = getStepStatus(stepNumber);
          const isClickable = status !== 'locked';

          return (
            <div
              key={stepNumber}
              data-step={stepNumber}
              className={`stepper-item ${status} ${isClickable ? 'clickable' : ''}`}
              onClick={() => handleStepClick(stepNumber)}
              title={!isClickable ? 'Complete previous steps first' : label}
            >
              <div className="stepper-number">
                {status === 'completed' ? (
                  <i className="fas fa-check"></i>
                ) : (
                  stepNumber
                )}
              </div>
              <div className="stepper-label">{label}</div>
              {status === 'current' && <div className="stepper-indicator"></div>}
            </div>
          );
        })}
      </div>
      </div>
    </>
  );
};

export default PetitionStepper;
