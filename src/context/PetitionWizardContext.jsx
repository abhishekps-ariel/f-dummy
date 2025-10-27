import React, { createContext, useContext, useState, useEffect } from 'react';

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
  const [isLoading, setIsLoading] = useState(true);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('petitionWizardState');
      if (saved) {
        const { currentStep: savedStep, completedSteps: savedCompleted } = JSON.parse(saved);
        setCurrentStep(savedStep || 1);
        setCompletedSteps(new Set(savedCompleted || []));
      }
    } catch (error) {
      console.error('Error loading petition wizard state:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('petitionWizardState', JSON.stringify({
          currentStep,
          completedSteps: Array.from(completedSteps)
        }));
      } catch (error) {
        console.error('Error saving petition wizard state:', error);
      }
    }
  }, [currentStep, completedSteps, isLoading]);

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
    if (step === 1) return true; // First step is always accessible
    // All previous steps must be completed
    for (let i = 1; i < step; i++) {
      if (!completedSteps.has(i)) {
        return false;
      }
    }
    return true;
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setCompletedSteps(new Set());
    localStorage.removeItem('petitionWizardState');
  };

  const value = {
    currentStep,
    completedSteps,
    goToStep,
    markStepCompleted,
    markStepIncomplete,
    canAccessStep,
    resetWizard,
    isLoading
  };

  return (
    <PetitionWizardContext.Provider value={value}>
      {children}
    </PetitionWizardContext.Provider>
  );
};
