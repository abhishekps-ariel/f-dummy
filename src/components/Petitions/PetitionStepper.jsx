import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { usePetitionWizard } from "../../context/PetitionWizardContext";
import "./PetitionStepper.css";

const PetitionStepper = () => {
  const { t } = useTranslation();
  
  const stepLabels = [
    t("petitions.selectOrganization"),
    t("petitions.propertyDetails"),
    t("petitions.loanDetails"),
    t("petitions.borrowerDetails"),
    t("petitions.filingEntity"),
    t("petitions.rightToCure"),
    t("petitions.form35BCompliance"),
    t("petitions.loanAssignees"),
    t("petitions.attestationSignatures"),
    t("petitions.reviewSubmit"),
  ];

  const { currentStep, completedSteps, stepsWithErrors, goToStep, canAccessStep } =
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
      <h5 className="stepper-title">{t("petitions.petitionFormProgress")}</h5>
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
