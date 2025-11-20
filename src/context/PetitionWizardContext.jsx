import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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

  const markStepCompleted = useCallback((step) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  }, []);

  const markStepIncomplete = useCallback((step) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      newSet.delete(step);
      return newSet;
    });
  }, []);

  const goToStep = useCallback((step) => {
    if (step >= 1 && step <= 10) {
      setCurrentStep(step);
    }
  }, []);

  const canAccessStep = useCallback((step) => {
    // Allow free navigation between all steps
    return true;
  }, []);

  const markStepWithError = useCallback((step) => {
    setStepsWithErrors(prev => new Set([...prev, step]));
  }, []);

  const clearStepError = useCallback((step) => {
    setStepsWithErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(step);
      return newSet;
    });
  }, []);

  const clearAllStepErrors = useCallback(() => {
    setStepsWithErrors(new Set());
  }, []);

  const resetWizard = useCallback(() => {
    setCurrentStep(1);
    setCompletedSteps(new Set());
    setStepsWithErrors(new Set());
  }, []);

  // Memoize the value object to prevent infinite re-renders
  const value = useMemo(() => ({
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
  }), [
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
    resetWizard
  ]);

  return (
    <PetitionWizardContext.Provider value={value}>
      {children}
    </PetitionWizardContext.Provider>
  );
};
