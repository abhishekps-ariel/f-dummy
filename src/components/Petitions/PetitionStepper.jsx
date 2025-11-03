import React, { useState, useEffect, useRef } from "react";
import { usePetitionWizard } from "../../context/PetitionWizardContext";
import "./PetitionStepper.css";

const stepLabels = [
  "Property Details",
  "Loan Details",
  "Borrower Details",
  "Filing Entity",
  "Right-to-Cure",
  "Form 35B Compliance",
  "Loan Assignees",
  "Attestation & Signatures",
  "Review & Submit",
];

const PetitionStepper = () => {
  const { currentStep, completedSteps, goToStep, canAccessStep } =
    usePetitionWizard();
  const stepperNavRef = useRef(null);

  // Auto-scroll to current step (works for both horizontal and vertical)
  useEffect(() => {
    if (stepperNavRef.current) {
      const currentStepElement = stepperNavRef.current.querySelector(
        `[data-step="${currentStep}"]`
      );
      if (currentStepElement) {
        currentStepElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [currentStep]);

  const getStepStatus = (stepNumber) => {
    // Always highlight the current step even if it is also completed
    if (currentStep === stepNumber) {
      return "current";
    } else if (completedSteps.has(stepNumber)) {
      return "completed";
    } else if (canAccessStep(stepNumber)) {
      return "accessible";
    } else {
      return "locked";
    }
  };

  const handleStepClick = (stepNumber) => {
    if (canAccessStep(stepNumber)) {
      goToStep(stepNumber);
    }
  };

  return (
    <div className="petition-stepper-container">
      <h5 className="stepper-title">Petition Form Progress</h5>
      <div className="stepper-nav" ref={stepperNavRef}>
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const status = getStepStatus(stepNumber);
          const isClickable = status !== "locked";

          return (
            <div
              key={stepNumber}
              data-step={stepNumber}
              className={`stepper-item ${status} ${
                isClickable ? "clickable" : ""
              }`}
              onClick={() => handleStepClick(stepNumber)}
              title={!isClickable ? "Complete previous steps first" : label}
            >
              <div className="stepper-number">
                {status === "completed" ? (
                  <i className="fas fa-check"></i>
                ) : (
                  stepNumber
                )}
              </div>
              <div className="stepper-label">{label}</div>
              {status === "current" && (
                <div className="stepper-indicator"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PetitionStepper;
