import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const PetitionWizardContext = createContext();

export const usePetitionWizard = () => {
  const context = useContext(PetitionWizardContext);
  if (!context) {
    throw new Error('usePetitionWizard must be used within a PetitionWizardProvider');
  }
  return context;
};

export const PetitionWizardProvider = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [stepsWithErrors, setStepsWithErrors] = useState(new Set());
  const { user } = useAuth();

  // Reset wizard when user logs out
  useEffect(() => {
    if (!user) {
      setCurrentStep(1);
      setCompletedSteps(new Set());
    }
  }, [user]);

  const markStepCompleted = (step) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  };

  const markStepIncomplete = (step) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      newSet.delete(step);
      return newSet;
    });
  };

  const goToStep = (step) => {
    if (step >= 1 && step <= 9) {
      setCurrentStep(step);
    }
  };

  const canAccessStep = (step) => {
    // Allow free navigation between all steps
    return true;
  };

  const markStepWithError = (step) => {
    setStepsWithErrors(prev => new Set([...prev, step]));
  };

  const clearStepError = (step) => {
    setStepsWithErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(step);
      return newSet;
    });
  };

  const clearAllStepErrors = () => {
    setStepsWithErrors(new Set());
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setCompletedSteps(new Set());
    setStepsWithErrors(new Set());
  };

  const value = {
    currentStep,
    completedSteps,
    stepsWithErrors,
    goToStep,
    markStepCompleted,
    markStepIncomplete,
    markStepWithError,
    clearStepError,
    clearAllStepErrors,
    canAccessStep,
    resetWizard,
    isLoading: false
  };

  return (
    <PetitionWizardContext.Provider value={value}>
      {children}
    </PetitionWizardContext.Provider>
  );
};
