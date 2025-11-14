import React, { useState, useEffect, useRef } from "react";
import { usePetitionWizard } from "../../context/PetitionWizardContext";
import { useAuth } from "../../context/AuthContext";
import "./PetitionStepper.css";

const allStepLabels = [
  "Select Organization", // Step 1 (for filers only)
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
  const { currentStep, completedSteps, stepsWithErrors, goToStep, canAccessStep } =
    usePetitionWizard();
  const { user } = useAuth();
  const stepperNavRef = useRef(null);

  // Check if user is org admin
  const isOrgAdminUser = () => {
    if (!user) return false;
    if (user.isManager === true) return true;

    if (Array.isArray(user.roles)) {
      const normalizedRoles = user.roles.map((role) => role?.toLowerCase?.() ?? role);
      if (
        normalizedRoles.includes("organisation admin") ||
        normalizedRoles.includes("organization admin") ||
        normalizedRoles.includes("orgadmin")
      ) {
        return true;
      }
    }

    const primaryRole =
      user.role ||
      (Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : null);
    return (
      primaryRole === "orgAdmin" ||
      primaryRole === "Organisation Admin" ||
      primaryRole === "Organization Admin"
    );
  };

  const isOrgAdmin = isOrgAdminUser();
  
  // For org admins: skip "Select Organization" (index 0), show steps 1-9
  // For filers: show all steps 1-10 including "Select Organization"
  const stepLabels = isOrgAdmin ? allStepLabels.slice(1) : allStepLabels;
  
  // For org admins: display step 1 = actual step 1 (Property Details)
  // For filers: display step 1 = actual step 1 (Select Organization)
  // No offset needed - display step number matches actual step number

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

  const hasStepError = (stepNumber) => {
    return stepsWithErrors.has(stepNumber);
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
          // For both: display step number = actual step number = index + 1
          // For org admins: shows steps 1-9 (Property Details to Review & Submit)
          // For filers: shows steps 1-10 (Select Organization to Review & Submit)
          const stepNumber = index + 1;
          const status = getStepStatus(stepNumber);
          const isClickable = status !== "locked";

          return (
            <div
              key={stepNumber}
              data-step={stepNumber}
              className={`stepper-item ${status} ${
                isClickable ? "clickable" : ""
              } ${hasStepError(stepNumber) ? "has-error" : ""}`}
              onClick={() => handleStepClick(stepNumber)}
              title={label}
            >
              <div className="stepper-number">
                {hasStepError(stepNumber) ? (
                  <i className="fas fa-exclamation"></i>
                ) : status === "completed" ? (
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
