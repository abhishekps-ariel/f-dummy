import React, { useState, useEffect, useRef, useCallback } from "react";

import { toast } from "react-toastify";

import { useJsApiLoader } from "@react-google-maps/api";

import Config from "../../config/index";

import { usePetitionCommonData } from "../../hooks/usePetitionCommonData";

import { usePetitions } from "../../hooks/usePetitions";

import { useAuth } from "../../context/AuthContext";
import { getActiveOrganizationId } from "../../utils/storage";

import { usePetitionWizard } from "../../context/PetitionWizardContext";

import { getUserRole } from "../../utils/storage";

import { getUserById, getSignatureById } from "../../services/authService";

import { getFilingEntityTypes } from "../../services/commonService";

import { getOrganizationById } from "../../services/organizationService";

import PetitionStepper from "./PetitionStepper";

import CustomDropdown from "../shared/CustomDropdown";

import "../shared/CustomDropdown.css";
import Step1OrganizationSelection from "./MultiStepForm/Step1OrganizationSelection";
import Step2PropertyDetails from "./MultiStepForm/Step2PropertyDetails";
import Step3LoanDetails from "./MultiStepForm/Step3LoanDetails";
import Step4BorrowerDetails from "./MultiStepForm/Step4BorrowerDetails";
import Step5FilingEntity from "./MultiStepForm/Step5FilingEntity";
import Step6RightToCure from "./MultiStepForm/Step6RightToCure";
import Step7Form35BCompliance from "./MultiStepForm/Step7Form35BCompliance";
import Step8LoanAssignees from "./MultiStepForm/Step8LoanAssignees";
import Step9PetitionAttestation from "./MultiStepForm/Step9PetitionAttestation";
import Step10ReviewSubmit from "./MultiStepForm/Step10ReviewSubmit";
import TakeOverPetitionModal from "./TakeOverPetitionModal";

// Static libraries array to prevent LoadScript reload

const LIBRARIES = ["places"];

// Currency formatting utility functions
const formatCurrencyInput = (value) => {
  if (!value && value !== 0) return "";
  // Remove all non-digit characters except decimal point
  const numericValue = String(value).replace(/[^\d.]/g, "");
  // Split by decimal point
  const parts = numericValue.split(".");
  // Format the integer part with commas
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  // Join back with decimal if it exists
  return parts.length > 1 ? parts.join(".") : parts[0];
};

const parseCurrencyInput = (value) => {
  if (!value) return "";
  // Remove all non-digit characters except decimal point
  const numericValue = String(value).replace(/[^\d.]/g, "");
  // Return empty string if nothing remains
  if (!numericValue) return "";
  // Return the numeric value (without commas)
  return numericValue;
};

const PetitionSteps = ({
  isOpen,
  onClose,
  organization,
  onPetitionSubmitted,
}) => {
  const {
    currentStep: wizardCurrentStep,
    goToStep: wizardGoToStep,
    markStepCompleted,
    markStepIncomplete,
    completedSteps,
    stepsWithErrors,
    resetWizard,
    markStepWithError,
    clearStepError,
    clearAllStepErrors,
  } = usePetitionWizard();

  const [currentStep, setCurrentStep] = useState(1);
  const [visitedSteps, setVisitedSteps] = useState(new Set([1])); // Track visited steps, start with step 1

  const totalSteps = 10;

  // Address validation state (declared early to avoid initialization errors)
  const [isAddressVerified, setIsAddressVerified] = useState(false);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [addressValidationError, setAddressValidationError] = useState("");
  const [showAddressValidationDialog, setShowAddressValidationDialog] = useState(false);
  const [addressValidationMessage, setAddressValidationMessage] = useState("");
  const [addressValidationType, setAddressValidationType] = useState("");
  const [addressValidationContext, setAddressValidationContext] = useState(null);
  const [pendingStepChange, setPendingStepChange] = useState(null);
  
  // Address verification state for other steps
  const [isFilingEntityAddressVerified, setIsFilingEntityAddressVerified] = useState(false);
  const [isNoticeAddressVerified, setIsNoticeAddressVerified] = useState(false);
  const [borrowerAddressesVerified, setBorrowerAddressesVerified] = useState({}); // { borrowerId: true/false }
  const [loanAssigneeAddressesVerified, setLoanAssigneeAddressesVerified] = useState({}); // { assigneeIndex: true/false }

  // Sync wizard state with component state
  useEffect(() => {
    setCurrentStep(wizardCurrentStep);
  }, [wizardCurrentStep]);

  // Track visited steps
  useEffect(() => {
    if (currentStep >= 1 && currentStep <= totalSteps) {
      setVisitedSteps(prev => {
        const newSet = new Set(prev);
        newSet.add(currentStep);
        return newSet;
      });
    }
  }, [currentStep, totalSteps]);

  // Track previous step for address validation prompt
  const previousStepRef = useRef(1);
  const [shouldValidateAddress, setShouldValidateAddress] = useState(false);

  // User profile and filing entity type state

  const [userProfile, setUserProfile] = useState(null);

  const [filingEntityTypes, setFilingEntityTypes] = useState([]);

  const [userFilingEntityType, setUserFilingEntityType] = useState(null);

  const [profileLoading, setProfileLoading] = useState(true);

  // Organization data state

  const [organizationData, setOrganizationData] = useState(null);

  const [organizationLoading, setOrganizationLoading] = useState(false);
  
  // Organization selection state (for filers)
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(null);
  
  // Take over petition state
  const [showTakeOverModal, setShowTakeOverModal] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [shouldTakeOver, setShouldTakeOver] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'save' or 'submit'
  const [isTakenOverPetition, setIsTakenOverPetition] = useState(false);
  const [takenOverPetitionId, setTakenOverPetitionId] = useState(null);

  // Load petition common data

  const {
    getLienPositions,

    getLoanTypes,

    getAssigneeTypes,

    getAssigneeRoles,

    loading: commonDataLoading,

    error: commonDataError,
  } = usePetitionCommonData();

  // Load petition API functions

  const {
    submitPetition,
    organization: organizationFromContext,
    loading: petitionLoading,
  } = usePetitions();

  // Get user info from auth context

  const {
    user,
    organization: organizationFromAuth,
  } = useAuth();

  // Check if user is org admin (filer if not org admin)
  const isOrgAdmin = user?.isManager === true || 
    (user?.roles && Array.isArray(user?.roles) && user.roles.some(
      (role) => role === 'Organisation Admin' || role === 'Organization Admin' || role === 'orgAdmin'
    )) ||
    getUserRole(user) === 'orgAdmin' || 
    getUserRole(user) === 'Organisation Admin' || 
    getUserRole(user) === 'Organization Admin';

  // Get organization ID from user object (stored in browser storage) or organization prop/context
  // Priority: selectedOrganizationId (from modal) > user.organizationId > organization.id (from prop) > organizationFromContext.id
  const storedActiveOrganizationId = getActiveOrganizationId();
  const organizationId =
    selectedOrganizationId ||
    storedActiveOrganizationId ||
    user?.organizationId ||
    organization?.id ||
    organizationFromContext?.id ||
    organizationFromAuth?.id ||
    null;

  // Google Places API state

  // eslint-disable-next-line no-unused-vars

  const [autocomplete, setAutocomplete] = useState(null);

  const [predictions, setPredictions] = useState([]);

  const [showPredictions, setShowPredictions] = useState(false);

  const [selectedPredictionIndex, setSelectedPredictionIndex] = useState(-1);

  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);

  // Note: Address validation state is declared earlier to avoid initialization errors
  // const [isValidatingAddress, setIsValidatingAddress] - already declared above
  // const [addressValidationError, setAddressValidationError] - already declared above
  // const [isAddressVerified, setIsAddressVerified] - already declared above
  // const [showAddressValidationDialog, setShowAddressValidationDialog] - already declared above
  // const [addressValidationMessage, setAddressValidationMessage] - already declared above

  const [fieldErrors, setFieldErrors] = useState({});

  const [isSaving, setIsSaving] = useState(false);

  const [hasSavedDraft, setHasSavedDraft] = useState(false);

  const [showCloseConfirmDialog, setShowCloseConfirmDialog] = useState(false);

  // Additional address fields state

  const [borrowerAddressValidationErrors, setBorrowerAddressValidationErrors] =
    useState({});

  const [noticeAddressValidationErrors, setNoticeAddressValidationErrors] =
    useState({});

  const [
    loanAssigneeAddressValidationErrors,
    setLoanAssigneeAddressValidationErrors,
  ] = useState({});

  // Single address validation modal state
  // Note: addressValidationType and addressValidationContext are declared earlier to avoid initialization errors

  // Autocomplete state for different address fields

  const [borrowerPredictions, setBorrowerPredictions] = useState({});

  const [showBorrowerPredictions, setShowBorrowerPredictions] = useState({});

  const [selectedBorrowerPredictionIndex, setSelectedBorrowerPredictionIndex] =
    useState({});

  const [isLoadingBorrowerPredictions, setIsLoadingBorrowerPredictions] =
    useState({});

  const [noticePredictions, setNoticePredictions] = useState([]);

  const [showNoticePredictions, setShowNoticePredictions] = useState(false);

  const [selectedNoticePredictionIndex, setSelectedNoticePredictionIndex] =
    useState(-1);

  const [isLoadingNoticePredictions, setIsLoadingNoticePredictions] =
    useState(false);

  const [loanAssigneePredictions, setLoanAssigneePredictions] = useState({});

  const [showLoanAssigneePredictions, setShowLoanAssigneePredictions] =
    useState({});

  const [
    selectedLoanAssigneePredictionIndex,
    setSelectedLoanAssigneePredictionIndex,
  ] = useState({});

  const [
    isLoadingLoanAssigneePredictions,
    setIsLoadingLoanAssigneePredictions,
  ] = useState({});

  const autocompleteRef = useRef(null);

  const placesServiceRef = useRef(null);

  const autocompleteServiceRef = useRef(null);

  const geocoderRef = useRef(null);

  // Default form data structure (defined early for use in formData initialization)
  const defaultFormData = {
    // Step 2: Property Details
    propertyStreet1: "",
    propertyStreet2: "",
    propertyCity: "",
    propertyState: "MA",
    propertyZip: "",
    propertyCounty: "",
    assessorParcelId: "",
    // Step 3: Loan Details
    isMinApplicable: "",
    minNumber: "",
    loanNumber: "",
    petitionLoanTypeId: "",
    petitionLoanTypeName: "",
    lienPosition: "",
    originationDate: "",
    originalPrincipalAmount: 0,
    currentPrincipalBalance: 0,
    interestRatePercent: null,
    variableRate: false,
    interestOnly: false,
    negativeAmortization: false,
    monthlyPaymentAmount: 0,
    delinquencyDaysAtFiling: null,
    mortgageBrokerLicenseNumber: "",
    mortgageLoanOriginatorLicenseNumber: "",
    // Step 4: Borrower Details
    borrowers: [
      {
        id: 1,
        firstName: "",
        middleName: "",
        lastName: "",
        suffix: "",
        borrowerIsPrimary: true,
        mailingStreet1: "",
        mailingCity: "",
        mailingState: "",
        mailingZip: "",
        phone: "",
        email: "",
      },
    ],
    // Step 5: Filing Entity
    filingEntityLegalName: "",
    filingEntityRole: "",
    filingEntityStreet1: "",
    filingEntityStreet2: "",
    filingEntityCity: "",
    filingEntityState: "",
    filingEntityZip: "",
    filingContactName: "",
    filingContactEmail: "",
    filingContactPhone: "",
    nmlsLicenseNumber: "",
    stateLicenseNumber: "",
    stateLicenseState: "",
    // Step 6: Right-to-Cure
    noticeSent: false,
    noticeDate: "",
    amountInDefault: 0,
    daysDelinquentAtNotice: 0,
    cureExpirationDate: "",
    noticeAddressStreet1: "",
    noticeAddressCity: "",
    noticeAddressState: "",
    noticeAddressZip: "",
    manualOverrideReason: "",
    // Step 7: Form 35B Compliance
    certainMortgageLoan: null,
    form35bComplianceAffidavitPdf: "",
    form35bNonApplicabilityAffidavitPdf: "",
    affiantName: "",
    affiantTitle: "",
    affidavitExecutionDate: "",
    // Step 8: Loan Assignees
    loanAssignees: [
      {
        assigneeName: "",
        assigneeTypeId: "",
        assigneeRoleId: "",
        street1: "",
        street2: "",
        city: "",
        addressState: "",
        zip: "",
        licenseNumber: "",
        licenseState: "",
      },
    ],
    // Step 9: Petition Attestation & Signatures
    signatures: [
      {
        signerFullName: "",
        signerTitle: "",
        signerEmail: "",
        esignConsent: false,
        signatureDrawnOrTyped: "",
        signedAt: "",
        signerIp: "",
        otpCode: "",
      },
    ],
    // Additional fields
    documents: [],
    certification_check: false,
    // Signer fields (prefilled from user data)
    signerFirstName: "",
    signerMiddleInitial: "",
    signerLastName: "",
    signerEmail: "",
    signerTitle: "",
  };

  // Load form data from localStorage on component mount
  const loadFormDataFromStorage = () => {
    try {
      const savedData = localStorage.getItem("petitionFormData");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        return { ...defaultFormData, ...parsedData };
      }
    } catch (error) {
      console.error("Error loading form data from localStorage:", error);
    }
    return defaultFormData;
  };

  // Initialize formData state early so it can be used in useEffects
  const [formData, setFormData] = useState(loadFormDataFromStorage);

  // Load user profile and filing entity types

  useEffect(() => {
    const loadUserProfileAndTypes = async () => {
      if (!user?.id) return;

      setProfileLoading(true);

      try {
        // Load user profile

        const profileResponse = await getUserById(user.id);

        if (profileResponse.isSuccess) {
          setUserProfile(profileResponse.data);

          setUserFilingEntityType(profileResponse.data.filingEntityTypeId);

          // Set the filing entity type in form data

          setFormData((prev) => ({
            ...prev,

            filingEntityTypeId: profileResponse.data.filingEntityTypeId || null,
          }));
        }

        // Load user signature

        try {
          const signatureResponse = await getSignatureById(user.id);

          if (signatureResponse.isSuccess && signatureResponse.data) {
            // Update user profile with signature data

            setUserProfile((prev) => ({
              ...prev,

              signatureImageName: signatureResponse.data.signatureImageName,

              signatureUrl: signatureResponse.data.signatureUrl,
            }));
          } else {
          }
        } catch (error) {}

        // Load filing entity types

        const typesResponse = await getFilingEntityTypes();

        if (typesResponse.isSuccess) {
          setFilingEntityTypes(typesResponse.data);
        }
      } catch (error) {
        toast.error("Failed to load user profile");
      } finally {
        setProfileLoading(false);
      }
    };

    loadUserProfileAndTypes();
  }, [user?.id]);

  // Load organization details and prefill filing entity fields

  useEffect(() => {
    const loadOrganizationData = async () => {
      if (!organizationId) return;

      setOrganizationLoading(true);

      try {
        // Fetch full organization details using the new API structure

        const orgResponse = await getOrganizationById(organizationId);

        if (orgResponse.isSuccess && orgResponse.data) {
          const orgData = orgResponse.data;

          // Prefill filing entity fields with organization data

          setFormData((prev) => ({
            ...prev,

            filingEntityLegalName: orgData.name || "",

            filingEntityStreet1: orgData.addressStreet1 || "",

            filingEntityStreet2: orgData.addressStreet2 || "",

            filingEntityCity: orgData.addressCity || "",

            filingEntityState: orgData.addressState || "",

            filingEntityZip: orgData.addressZip || "",

            filingContactName: orgData.primaryContactName || "",

            filingContactEmail: orgData.primaryContactEmail || "",

            filingContactPhone: orgData.primaryContactPhone || "",
          }));

          setOrganizationData(orgData);
        }
      } catch (error) {
        // Fallback to existing organization prop if available

        if (organization) {
          // Parse the old format as fallback

          const addressParts = organization.address
            ? organization.address.split(", ")
            : [];

          let street1 = "";

          let city = "";

          let state = "";

          let zip = "";

          if (addressParts.length >= 3) {
            street1 = addressParts[0] || "";

            city = addressParts[1] || "";

            const stateZip = addressParts[2] || "";

            const stateZipParts = stateZip.split(" ");

            if (stateZipParts.length >= 2) {
              state = stateZipParts[0] || "";

              zip = stateZipParts[1] || "";
            }
          }

          setFormData((prev) => ({
            ...prev,

            filingEntityLegalName: organization.name || "",

            filingEntityStreet1: street1,

            filingEntityCity: city,

            filingEntityState: state,

            filingEntityZip: zip,
          }));
        }
      } finally {
        setOrganizationLoading(false);
      }
    };

    // Load organization data when organizationId is available
    // For org admins, this should load immediately when modal opens
    if (organizationId) {
      loadOrganizationData();
    }
  }, [organizationId, selectedOrganizationId]);

  // Reset selected organization when opening a new petition (not when editing existing)
  // Only reset for filers, not for org admins (they have pre-selected org)
  useEffect(() => {
    if (isOpen && !formData?.id && !isOrgAdmin) {
      // Reset selected organization when opening a new petition (for filers only)
      // Org admins keep their pre-selected organization
      setSelectedOrganizationId(null);
      setOrganizationData(null);
    }
  }, [isOpen, isOrgAdmin, formData?.id]);

  // Clear organization selection when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Clear organization selection when modal is closed
      setSelectedOrganizationId(null);
      setOrganizationData(null);
    }
  }, [isOpen]);

  // Handler for input change - handle isMinApplicable to clear minNumber when set to "no"
  const handleInputChangeWithMinLogic = (e) => {
    const { name, value } = e.target;
    
    // If isMinApplicable is set to "no", clear minNumber
    if (name === "isMinApplicable" && value === "no") {
      setFormData((prev) => ({
        ...prev,
        isMinApplicable: value,
        minNumber: "",
      }));
      // Clear minNumber error if it exists
      if (fieldErrors.minNumber) {
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.minNumber;
          return newErrors;
        });
      }
    } else {
      handleInputChange(e);
    }
  };

  // Handler for organization selection (from embedded selector or modal)
  const handleOrganizationSelect = async (orgId, orgData) => {
    setSelectedOrganizationId(orgId);
    
    // If removing selection (null), clear organization data for filers
    if (!orgId && !isOrgAdmin) {
      setOrganizationData(null);
      setFormData((prev) => ({
        ...prev,
        organizationId: null,
        filingEntityLegalName: "",
        filingEntityStreet1: "",
        filingEntityStreet2: "",
        filingEntityCity: "",
        filingEntityState: "",
        filingEntityZip: "",
        filingContactName: "",
        filingContactEmail: "",
        filingContactPhone: "",
      }));
      return;
    }
    
    // Update form data with organization ID
    setFormData((prev) => ({
      ...prev,
      organizationId: orgId,
    }));

    if (orgData) {
      // Prefill filing entity fields with organization data
      setOrganizationLoading(true);
      try {
        setFormData((prev) => ({
          ...prev,
          organizationId: orgId,
          filingEntityLegalName: orgData.name || "",
          filingEntityStreet1: orgData.addressStreet1 || "",
          filingEntityStreet2: orgData.addressStreet2 || "",
          filingEntityCity: orgData.addressCity || "",
          filingEntityState: orgData.addressState || "",
          filingEntityZip: orgData.addressZip || "",
          filingContactName: orgData.primaryContactName || "",
          filingContactEmail: orgData.primaryContactEmail || "",
          filingContactPhone: orgData.primaryContactPhone || "",
        }));
        setOrganizationData(orgData);
      } finally {
        setOrganizationLoading(false);
      }
    } else if (orgId) {
      // If only orgId is provided, fetch full organization details
      setOrganizationLoading(true);
      try {
        const orgResponse = await getOrganizationById(orgId);
        if (orgResponse.isSuccess && orgResponse.data) {
          const org = orgResponse.data;
          setFormData((prev) => ({
            ...prev,
            organizationId: orgId,
            filingEntityLegalName: org.name || "",
            filingEntityStreet1: org.addressStreet1 || "",
            filingEntityStreet2: org.addressStreet2 || "",
            filingEntityCity: org.addressCity || "",
            filingEntityState: org.addressState || "",
            filingEntityZip: org.addressZip || "",
            filingContactName: org.primaryContactName || "",
            filingContactEmail: org.primaryContactEmail || "",
            filingContactPhone: org.primaryContactPhone || "",
          }));
          setOrganizationData(org);
        }
      } catch (error) {
        toast.error("Failed to load organization details");
      } finally {
        setOrganizationLoading(false);
      }
    }
  };


  // Prefill signer fields from user data

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,

        signerFirstName: user.firstName || "",

        signerMiddleInitial: user.middleName
          ? user.middleName.charAt(0).toUpperCase()
          : "",

        signerLastName: user.lastName || "",

        signerEmail: user.email || "",

        signerTitle: getUserRole(user) || "User",
      }));
    }
  }, [user]);

  // Initialize Google Maps API with React library

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",

    googleMapsApiKey: Config.GOOGLE_PLACES_API_KEY,

    libraries: LIBRARIES,

    preventGoogleFontsLoading: true,
  });

  // Error logging

  useEffect(() => {
    if (loadError) {
    }

    // Check if API key is properly configured

    if (Config.GOOGLE_PLACES_API_KEY === "YOUR_GOOGLE_PLACES_API_KEY_HERE") {
    }
  }, [isLoaded, loadError]);

  // Initialize Google Places services when API is loaded

  useEffect(() => {
    if (isLoaded && window.google && window.google.maps) {
      try {
        // Initialize AutocompleteService

        autocompleteServiceRef.current =
          new window.google.maps.places.AutocompleteService();

        // Initialize PlacesService

        const map = new window.google.maps.Map(document.createElement("div"));

        placesServiceRef.current = new window.google.maps.places.PlacesService(
          map
        );

        // Initialize Geocoder

        geocoderRef.current = new window.google.maps.Geocoder();
      } catch (error) {}
    }
  }, [isLoaded]);

  // Load saved drafts on component mount

  useEffect(() => {
    const loadSavedDrafts = () => {
      try {
        const savedDrafts = JSON.parse(
          localStorage.getItem("petitionDrafts") || "[]"
        );

        if (savedDrafts.length > 0) {
          // Find the most recent draft for the current step

          const currentStepDraft = savedDrafts.find(
            (draft) => draft.step === currentStep
          );

          if (currentStepDraft && currentStepDraft.formData) {
            // Only load draft if current form data is empty (first time opening)

            setFormData((prev) => {
              // Check if current form data is mostly empty

              const hasData = Object.values(prev).some(
                (value) =>
                  value !== "" &&
                  value !== 0 &&
                  value !== false &&
                  !Array.isArray(value) &&
                  value !== null
              );

              if (!hasData) {
                setHasSavedDraft(true);

                return {
                  ...prev,

                  ...currentStepDraft.formData,
                };
              } else {
                setHasSavedDraft(false);

                return prev;
              }
            });
          } else {
            setHasSavedDraft(false);
          }
        } else {
          setHasSavedDraft(false);
        }
      } catch (error) {
        setHasSavedDraft(false);
      }
    };

    if (isOpen) {
      // Clear any existing drafts to prevent interference

      localStorage.removeItem("petitionDrafts");

      loadSavedDrafts();
    }
  }, [isOpen, currentStep]);

  // Save form data to localStorage

  const saveFormDataToStorage = (data) => {
    try {
      localStorage.setItem("petitionFormData", JSON.stringify(data));
    } catch (error) {
      console.error("Error saving form data to localStorage:", error);
    }
  };

  // Clear form data from localStorage

  const clearFormDataFromStorage = () => {
    try {
      localStorage.removeItem("petitionFormData");
    } catch (error) {
      console.error("Error clearing form data from localStorage:", error);
    }
  };

  // Helper function to check if a step has required fields filled
  // Checks fields directly to match validation logic
  const checkStepHasRequiredFields = useCallback((stepNumber) => {
    if (!formData) return false;
    
    switch (stepNumber) {
      case 1: // Organization Selection - check if organization is selected
        // For org admins, organization is pre-selected, so check organizationId
        // For filers, require explicit selection via selectedOrganizationId
        if (isOrgAdmin) {
          return !!(organizationId || selectedOrganizationId);
        }
        // For filers, only return true if they've explicitly selected an organization
        return !!selectedOrganizationId;
      
      case 2: // Property Details - check if address fields are filled
        // Address verification will be handled when user navigates away from the step
        // For pre-filled data, mark complete if all required fields are present
        return !!(formData.propertyStreet1?.trim() && 
                  formData.propertyCity?.trim() && 
                  formData.propertyState?.trim() && 
                  formData.propertyZip?.trim() && 
                  formData.propertyCounty?.trim());
      
      case 3: // Loan Details - check all required fields (matching validateLoanDetails)
        const hasMinApplicable = formData.isMinApplicable === "yes" || formData.isMinApplicable === "no";
        const hasMinNumberIfRequired = formData.isMinApplicable !== "yes" || (formData.isMinApplicable === "yes" && formData.minNumber?.trim());
        return !!(hasMinApplicable &&
                  hasMinNumberIfRequired &&
                  formData.loanNumber?.trim() && 
                  formData.petitionLoanTypeId && 
                  (formData.lienPosition != null && formData.lienPosition !== "") &&
                  formData.originationDate?.trim() &&
                  formData.originalPrincipalAmount && 
                  formData.originalPrincipalAmount > 0 &&
                  formData.currentPrincipalBalance &&
                  formData.currentPrincipalBalance > 0 &&
                  formData.interestRatePercent != null &&
                  formData.interestRatePercent !== "" &&
                  formData.interestRatePercent > 0 &&
                  formData.interestRatePercent <= 100 &&
                  formData.monthlyPaymentAmount &&
                  formData.monthlyPaymentAmount > 0 &&
                  formData.delinquencyDaysAtFiling != null &&
                  formData.delinquencyDaysAtFiling !== "" &&
                  formData.delinquencyDaysAtFiling >= 0);
      
      case 4: // Borrower Details - check if at least one borrower with required fields
        if (!formData.borrowers || !Array.isArray(formData.borrowers) || formData.borrowers.length === 0) {
          return false;
        }
        // Check if all borrowers have required fields (firstName and lastName)
        return formData.borrowers.every(b => b.firstName?.trim() && b.lastName?.trim());
      
      case 5: // Filing Entity - check if filing entity type is set
        return !!userFilingEntityType;
      
      case 6: // Right-to-Cure - check if noticeSent is set (required field)
        if (formData.noticeSent === null || formData.noticeSent === undefined) {
          return false;
        }
        // If notice was sent, check required fields
        if (formData.noticeSent === true) {
          const hasRequiredFields = !!(formData.noticeDate?.trim() &&
                    formData.amountInDefault &&
                    formData.amountInDefault > 0 &&
                    formData.daysDelinquentAtNotice != null &&
                    formData.daysDelinquentAtNotice !== "" &&
                    formData.daysDelinquentAtNotice >= 0 &&
                    formData.cureExpirationDate?.trim() &&
                    formData.noticeAddressStreet1?.trim() &&
                    formData.noticeAddressCity?.trim() &&
                    formData.noticeAddressState?.trim() &&
                    formData.noticeAddressZip?.trim());
          
          // If all required fields are present, check address verification
          // If address exists but not verified, still return true if fields are filled (for pre-filled data)
          // Address verification will be handled when user navigates away from the step
          return hasRequiredFields;
        }
        // If notice was not sent, check for acceleration date (manualOverrideReason)
        if (formData.noticeSent === false) {
          return !!(formData.manualOverrideReason?.trim());
        }
        return false;
      
      case 7: // Form 35B Compliance - check if certainMortgageLoan is selected
        return formData.certainMortgageLoan !== null && formData.certainMortgageLoan !== undefined;
      
      case 8: // Loan Assignees - check if at least one assignee exists with required fields
        if (!formData.loanAssignees || !Array.isArray(formData.loanAssignees) || formData.loanAssignees.length === 0) {
          return false;
        }
        // Check if all assignees have required fields (assigneeName, assigneeTypeId, and assigneeRoleId)
        // Address verification will be handled when user navigates away from the step
        return formData.loanAssignees.every(a => 
          a.assigneeName?.trim() && 
          a.assigneeTypeId && 
          a.assigneeRoleId
        );
      
      case 9: // Attestation & Signatures
        return !!(userProfile?.signatureUrl && formData?.certification_check);
      
      default:
        return false;
    }
  }, [formData, userFilingEntityType, userProfile, isOrgAdmin, organizationId, selectedOrganizationId]);

  // Track previous step for address validation prompt (moved here to access formData)
  useEffect(() => {
    const prev = previousStepRef.current;
    const next = wizardCurrentStep;
    
    // When navigating away from a step, mark it as completed only if all required fields are filled
    if (prev !== next && prev >= 1 && prev <= totalSteps) {
      // Use validation functions to check if step is complete
      let isStepComplete = false;
      
      switch (prev) {
        case 1:
          // Organization Selection - for org admins, check organizationId; for filers, require explicit selection
          if (isOrgAdmin) {
            isStepComplete = !!(organizationId || selectedOrganizationId);
          } else {
            // For filers, only mark complete if they've explicitly selected an organization
            isStepComplete = !!selectedOrganizationId;
          }
          break;
        case 2:
          const addressValidation = validateAddressFields();
          // Mark complete if validation passes and all required fields are filled
          // Address verification will be handled when navigating away
          const hasAllAddressFields = !!(formData?.propertyStreet1?.trim() && 
                                        formData?.propertyCity?.trim() && 
                                        formData?.propertyState?.trim() && 
                                        formData?.propertyZip?.trim() && 
                                        formData?.propertyCounty?.trim());
          isStepComplete = !addressValidation.hasErrors && hasAllAddressFields;
          break;
        case 3:
          const loanValidation = validateLoanDetails();
          isStepComplete = !loanValidation.hasErrors;
          break;
        case 4:
          const borrowerValidation = validateBorrowerDetails();
          if (!borrowerValidation.hasErrors) {
            const hasBorrowerAddresses = formData?.borrowers?.some(borrower => borrower.mailingStreet1?.trim());
            if (hasBorrowerAddresses) {
              const allBorrowerAddressesVerified = formData.borrowers
                .filter(borrower => borrower.mailingStreet1?.trim())
                .every(borrower => borrowerAddressesVerified[borrower.id] === true);
              isStepComplete = allBorrowerAddressesVerified;
            } else {
              isStepComplete = true;
            }
          }
          break;
        case 5:
          if (userFilingEntityType) {
            const filingEntityValidation = validateFilingEntity();
            if (!filingEntityValidation.hasErrors) {
              if (formData?.filingEntityStreet1?.trim()) {
                isStepComplete = isFilingEntityAddressVerified;
              } else {
                isStepComplete = true;
              }
            }
          }
          break;
        case 6:
          const rightToCureValidation = validateRightToCureDetails();
          if (!rightToCureValidation.hasErrors) {
            if (formData?.noticeAddressStreet1?.trim()) {
              isStepComplete = isNoticeAddressVerified;
            } else {
              isStepComplete = true;
            }
          }
          break;
        case 7:
          const form35BValidation = validateForm35BCompliance();
          isStepComplete = !form35BValidation.hasErrors;
          break;
        case 8:
          const loanAssigneesValidation = validateLoanAssignees();
          if (!loanAssigneesValidation.hasErrors) {
            const hasLoanAssigneeAddresses = formData?.loanAssignees?.some(assignee => assignee.street1?.trim());
            if (hasLoanAssigneeAddresses) {
              const allLoanAssigneeAddressesVerified = formData.loanAssignees
                .filter(assignee => assignee.street1?.trim())
                .every((assignee, index) => loanAssigneeAddressesVerified[index] === true);
              isStepComplete = allLoanAssigneeAddressesVerified;
            } else {
              isStepComplete = true;
            }
          }
          break;
        case 9:
          isStepComplete = !!(userProfile?.signatureUrl && formData?.certification_check);
          break;
        default:
          isStepComplete = checkStepHasRequiredFields(prev);
      }
      
      if (isStepComplete) {
        // Step is complete - mark as completed and clear any errors
        if (!completedSteps.has(prev)) {
          markStepCompleted(prev);
        }
        if (stepsWithErrors.has(prev)) {
          clearStepError(prev);
        }
      } else {
        // Step is not complete - unmark if it was previously completed
        if (completedSteps.has(prev)) {
          markStepIncomplete(prev);
        }
      }
    }
    
    // When navigating away from Property Address step (step 2), trigger address validation
    if (prev === 2 && next !== 2 && next > prev && formData?.propertyStreet1?.trim() && !isAddressVerified) {
      // Store the intended step change
      setPendingStepChange(next);
      // Revert to step 2 until validation completes
      wizardGoToStep(2);
      setCurrentStep(2);
      previousStepRef.current = 2;
      // Trigger validation
      setShouldValidateAddress(true);
      return;
    }
    
    // When navigating away from Filing Entity step (step 5), trigger address validation
    if (prev === 5 && next !== 5 && next > prev && formData?.filingEntityStreet1?.trim() && !isFilingEntityAddressVerified) {
      setPendingStepChange(next);
      wizardGoToStep(5);
      setCurrentStep(5);
      previousStepRef.current = 5;
      setShouldValidateAddress(true);
      setAddressValidationType("filingEntity");
      return;
    }
    
    // When navigating away from Right-to-Cure step (step 6), trigger notice address validation
    if (prev === 6 && next !== 6 && next > prev && formData?.noticeAddressStreet1?.trim() && !isNoticeAddressVerified) {
      setPendingStepChange(next);
      wizardGoToStep(6);
      setCurrentStep(6);
      previousStepRef.current = 6;
      setShouldValidateAddress(true);
      setAddressValidationType("notice");
      return;
    }
    
    // When navigating away from Borrower Details step (step 4), trigger borrower address validation
    if (prev === 4 && next !== 4 && next > prev) {
      const hasBorrowerAddresses = formData?.borrowers?.some(borrower => borrower.mailingStreet1?.trim());
      if (hasBorrowerAddresses) {
        // Check if all borrower addresses are verified
        const allVerified = formData.borrowers
          .filter(borrower => borrower.mailingStreet1?.trim())
          .every(borrower => borrowerAddressesVerified[borrower.id] === true);
        
        if (!allVerified) {
          setPendingStepChange(next);
          wizardGoToStep(3);
          setCurrentStep(3);
          previousStepRef.current = 3;
          setShouldValidateAddress(true);
          setAddressValidationType("borrower");
          return;
        }
      }
    }
    
    // When navigating away from Loan Assignees step (step 8), trigger assignee address validation
    if (prev === 8 && next !== 8 && next > prev) {
      const hasAssigneeAddresses = formData?.loanAssignees?.some(assignee => assignee.street1?.trim());
      if (hasAssigneeAddresses) {
        // Check if all assignee addresses are verified
        const allVerified = formData.loanAssignees
          .filter(assignee => assignee.street1?.trim())
          .every((assignee, index) => loanAssigneeAddressesVerified[index] === true);
        
        if (!allVerified) {
          setPendingStepChange(next);
          wizardGoToStep(7);
          setCurrentStep(7);
          previousStepRef.current = 7;
          setShouldValidateAddress(true);
          setAddressValidationType("loanAssignee");
          return;
        }
      }
    }
    
    previousStepRef.current = wizardCurrentStep;
  }, [wizardCurrentStep, isAddressVerified, isFilingEntityAddressVerified, isNoticeAddressVerified, borrowerAddressesVerified, loanAssigneeAddressesVerified, formData, completedSteps, stepsWithErrors, totalSteps, markStepCompleted, markStepIncomplete, checkStepHasRequiredFields, clearStepError, wizardGoToStep, setCurrentStep, userFilingEntityType, userProfile]);

  // When organization is selected, mark step 1 as completed
  useEffect(() => {
    // For org admins, organization is pre-selected, so check organizationId
    // For filers, require explicit selection via selectedOrganizationId
    let hasOrganization = false;
    if (isOrgAdmin) {
      hasOrganization = !!(organizationId || selectedOrganizationId);
    } else {
      // For filers, only mark complete if they've explicitly selected an organization
      hasOrganization = !!selectedOrganizationId;
    }
    
    if (hasOrganization) {
      if (!completedSteps.has(1)) {
        markStepCompleted(1);
      }
      if (stepsWithErrors.has(1)) {
        clearStepError(1);
      }
    } else {
      // If organization is removed or not selected, unmark step 1
      if (completedSteps.has(1)) {
        markStepIncomplete(1);
      }
    }
  }, [selectedOrganizationId, organizationId, isOrgAdmin, completedSteps, stepsWithErrors, markStepCompleted, markStepIncomplete, clearStepError]);

  // Track step 2 (Property Details) completion when formData changes
  useEffect(() => {
    if (!formData) return;
    const addressValidation = validateAddressFields();
    if (!addressValidation.hasErrors) {
      // Check if all required address fields are filled
      const hasAllAddressFields = !!(formData?.propertyStreet1?.trim() && 
                                    formData?.propertyCity?.trim() && 
                                    formData?.propertyState?.trim() && 
                                    formData?.propertyZip?.trim() && 
                                    formData?.propertyCounty?.trim());
      if (hasAllAddressFields) {
        // Mark complete if all fields are filled, even if address isn't verified yet
        // Address verification will be handled when user navigates away from the step
        if (!completedSteps.has(2)) {
          markStepCompleted(2);
        }
        if (stepsWithErrors.has(2)) {
          clearStepError(2);
        }
      } else {
        if (completedSteps.has(2)) {
          markStepIncomplete(2);
        }
      }
    } else {
      // Validation has errors - mark incomplete
      if (completedSteps.has(2)) {
        markStepIncomplete(2);
      }
    }
  }, [formData, stepsWithErrors, completedSteps, markStepCompleted, markStepIncomplete, clearStepError]);

  // When filing entity address is verified, mark step 5 as completed if all fields are filled
  useEffect(() => {
    if (isFilingEntityAddressVerified && formData?.filingEntityStreet1?.trim()) {
      clearStepError(5);
      const filingEntityValidation = validateFilingEntity();
      if (!filingEntityValidation.hasErrors && userFilingEntityType) {
        if (!completedSteps.has(5)) {
          markStepCompleted(5);
        }
        if (stepsWithErrors.has(5)) {
          clearStepError(5);
        }
      }
    }
  }, [isFilingEntityAddressVerified, formData, stepsWithErrors, completedSteps, markStepCompleted, clearStepError, userFilingEntityType]);

  // When all borrower addresses are verified, mark step 4 as completed if all fields are filled
  useEffect(() => {
    const hasBorrowerAddresses = formData?.borrowers?.some(borrower => borrower.mailingStreet1?.trim());
    if (hasBorrowerAddresses && formData?.borrowers) {
      const allBorrowerAddressesVerified = formData.borrowers
        .filter(borrower => borrower.mailingStreet1?.trim())
        .every(borrower => borrowerAddressesVerified[borrower.id] === true);
      
      if (allBorrowerAddressesVerified) {
        clearStepError(4);
        const borrowerValidation = validateBorrowerDetails();
        if (!borrowerValidation.hasErrors) {
          if (!completedSteps.has(4)) {
            markStepCompleted(4);
          }
          if (stepsWithErrors.has(4)) {
            clearStepError(4);
          }
        }
      }
    } else if (!hasBorrowerAddresses) {
      // No addresses to verify, just check if validation passes
      const borrowerValidation = validateBorrowerDetails();
      if (!borrowerValidation.hasErrors) {
        if (!completedSteps.has(4)) {
          markStepCompleted(4);
        }
        if (stepsWithErrors.has(4)) {
          clearStepError(4);
        }
      }
    }
  }, [borrowerAddressesVerified, formData, stepsWithErrors, completedSteps, markStepCompleted, markStepIncomplete, clearStepError]);

  // Track step 8 (Loan Assignees) completion when formData changes
  useEffect(() => {
    if (!formData) return;
    const loanAssigneesValidation = validateLoanAssignees();
    if (!loanAssigneesValidation.hasErrors) {
      const hasLoanAssigneeAddresses = formData?.loanAssignees?.some(assignee => assignee.street1?.trim());
      if (hasLoanAssigneeAddresses && formData?.loanAssignees) {
        const allLoanAssigneeAddressesVerified = formData.loanAssignees
          .filter(assignee => assignee.street1?.trim())
          .every((assignee, index) => loanAssigneeAddressesVerified[index] === true);
        
        if (allLoanAssigneeAddressesVerified) {
          if (!completedSteps.has(8)) {
            markStepCompleted(8);
          }
          if (stepsWithErrors.has(8)) {
            clearStepError(8);
          }
        } else {
          // Addresses exist but not verified - still mark complete if all required fields are filled
          // Address verification will be handled when user navigates away from the step
          const hasAllRequiredFields = checkStepHasRequiredFields(8);
          if (hasAllRequiredFields) {
            if (!completedSteps.has(8)) {
              markStepCompleted(8);
            }
            if (stepsWithErrors.has(8)) {
              clearStepError(8);
            }
          } else {
            if (completedSteps.has(8)) {
              markStepIncomplete(8);
            }
          }
        }
      } else if (!hasLoanAssigneeAddresses) {
        // No addresses to verify, just check if validation passes
        const hasAllRequiredFields = checkStepHasRequiredFields(8);
        if (hasAllRequiredFields) {
          if (!completedSteps.has(8)) {
            markStepCompleted(8);
          }
          if (stepsWithErrors.has(8)) {
            clearStepError(8);
          }
        } else {
          if (completedSteps.has(8)) {
            markStepIncomplete(8);
          }
        }
      }
    } else {
      // Validation has errors - mark incomplete
      if (completedSteps.has(8)) {
        markStepIncomplete(8);
      }
    }
  }, [loanAssigneeAddressesVerified, formData, stepsWithErrors, completedSteps, markStepCompleted, markStepIncomplete, clearStepError, checkStepHasRequiredFields]);

  // When address is verified and there's a pending step change, allow navigation
  useEffect(() => {
    if (isAddressVerified && pendingStepChange && currentStep === 2) {
      const targetStep = pendingStepChange;
      setPendingStepChange(null);
      wizardGoToStep(targetStep);
      setCurrentStep(targetStep);
      previousStepRef.current = targetStep;
      window.scrollTo(0, 0);
    }
  }, [isAddressVerified, pendingStepChange, currentStep, wizardGoToStep, setCurrentStep]);

  // Save form data to localStorage whenever it changes

  useEffect(() => {
    if (formData && Object.keys(formData).length > 0) {
      saveFormDataToStorage(formData);
    }
  }, [formData]);

  // Clear form data from localStorage on page reload

  useEffect(() => {
    const handleBeforeUnload = () => {
      clearFormDataFromStorage();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Helper function to clear form data and wizard state (reusable for submit/save/close)
  const clearFormAndWizardState = () => {
    // Reset takeover flags
    setIsTakenOverPetition(false);
    setTakenOverPetitionId(null);
    try {
      // Reapply organization prefilled info while clearing user-entered values
      const orgPrefill = (() => {
        if (organizationData) {
          return {
            filingEntityLegalName: organizationData.name || "",
            filingEntityStreet1: organizationData.addressStreet1 || "",
            filingEntityStreet2: organizationData.addressStreet2 || "",
            filingEntityCity: organizationData.addressCity || "",
            filingEntityState: organizationData.addressState || "",
            filingEntityZip: organizationData.addressZip || "",
            filingContactName: organizationData.primaryContactName || "",
            filingContactEmail: organizationData.primaryContactEmail || "",
            filingContactPhone: organizationData.primaryContactPhone || "",
          };
        }
        if (organization) {
          // Fallback to existing organization prop if available (older format)
          const addressParts = organization.address
            ? organization.address.split(", ")
            : [];
          let street1 = "";
          let city = "";
          let state = "";
          let zip = "";

          if (addressParts.length >= 3) {
            street1 = addressParts[0] || "";
            city = addressParts[1] || "";
            const stateZipParts = addressParts[2].split(" ");
            state = stateZipParts[0] || "";
            zip = stateZipParts[1] || "";
          }

          return {
            filingEntityLegalName: organization.name || "",
            filingEntityStreet1: street1,
            filingEntityCity: city,
            filingEntityState: state,
            filingEntityZip: zip,
          };
        }
        return {};
      })();

      // User attester/signer prefill from auth user
      const userPrefill = (() => {
        if (!user) return {};
        const signerFirstName = user.firstName || "";
        const signerMiddleInitial = user.middleName
          ? user.middleName.charAt(0).toUpperCase()
          : "";
        const signerLastName = user.lastName || "";
        const signerEmail = user.email || "";
        const signerTitle = getUserRole(user) || "User";
        const signerFullName = [
          signerFirstName,
          signerMiddleInitial,
          signerLastName,
        ]
          .filter(Boolean)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        return {
          signerFirstName,
          signerMiddleInitial,
          signerLastName,
          signerEmail,
          signerTitle,
          signatures: [
            {
              signerFullName,
              signerTitle,
              signerEmail,
              esignConsent: false,
              signatureDrawnOrTyped: "",
              signedAt: "",
              signerIp: "",
              otpCode: "",
            },
          ],
        };
      })();

      setFormData({ ...defaultFormData, ...orgPrefill, ...userPrefill });
      clearFormDataFromStorage();
      localStorage.removeItem("petitionDrafts");
      setFieldErrors({});
      setHasSavedDraft(false);
      
      // Clear address verification state
      setIsAddressVerified(false);
      setIsFilingEntityAddressVerified(false);
      setIsNoticeAddressVerified(false);
      setBorrowerAddressesVerified({});
      setLoanAssigneeAddressesVerified({});
      setAddressValidationError("");
      setShowAddressValidationDialog(false);
      setAddressValidationMessage("");
      setAddressValidationType("");
      setAddressValidationContext(null);
      setPendingStepChange(null);
      setShouldValidateAddress(false);
      
      // Clear all step errors
      clearAllStepErrors();

      // Reset visited steps (start with step 1)
      setVisitedSteps(new Set([1]));

      // Reset selected organization (for filers)
      setSelectedOrganizationId(null);
      setOrganizationData(null);

      if (typeof resetWizard === "function") {
        resetWizard();
      } else {
        setCurrentStep(1);
        wizardGoToStep(1);
      }
      
      // Reset previous step ref
      previousStepRef.current = 1;
    } catch (e) {
      // ignore
    }
  };

  // Close confirmation handlers
  const handleCloseAttempt = () => {
    setShowCloseConfirmDialog(true);
  };

  const handleDiscardAndClose = () => {
    try {
      clearFormAndWizardState();
    } catch (e) {
      // ignore
    } finally {
      setShowCloseConfirmDialog(false);
      onClose();
    }
  };

  const handleSaveDraftAndClose = async () => {
    try {
      if (typeof saveCurrentStep === "function") {
        await saveCurrentStep();
      }
      setShowCloseConfirmDialog(false);
      onClose();
    } catch (e) {
      // keep dialog open on failure
    }
  };

  // Handle address input and get predictions

  const handleAddressInput = (input) => {
    if (!input.trim() || !autocompleteServiceRef.current) {
      setPredictions([]);

      setShowPredictions(false);

      setIsLoadingPredictions(false);

      return;
    }

    // Clear previous timeout

    if (window.autocompleteTimeout) {
      clearTimeout(window.autocompleteTimeout);
    }

    // Debounce the API call

    window.autocompleteTimeout = setTimeout(() => {
      setIsLoadingPredictions(true);

      const request = {
        input: input,

        types: ["address"],

        componentRestrictions: { country: "us" },
      };

      try {
        autocompleteServiceRef.current.getPlacePredictions(
          request,
          (predictions, status) => {
            setIsLoadingPredictions(false);

            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              predictions
            ) {
              setPredictions(predictions);

              setShowPredictions(true);

              setSelectedPredictionIndex(-1);
            } else {
              setPredictions([]);

              setShowPredictions(false);

              // Show specific error messages for debugging

              if (
                status ===
                window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED
              ) {
              } else if (
                status ===
                window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT
              ) {
              } else if (
                status ===
                window.google.maps.places.PlacesServiceStatus.INVALID_REQUEST
              ) {
              }
            }
          }
        );
      } catch (error) {
        setIsLoadingPredictions(false);

        setPredictions([]);

        setShowPredictions(false);
      }
    }, 300); // 300ms debounce
  };

  // Handle prediction selection

  const selectPrediction = (placeId) => {
    if (!placesServiceRef.current) return;

    const request = {
      placeId: placeId,

      fields: ["address_components", "formatted_address", "geometry"],
    };

    placesServiceRef.current.getDetails(request, (place, status) => {
      if (
        status === window.google.maps.places.PlacesServiceStatus.OK &&
        place
      ) {
        const addressComponents = place.address_components;

        let streetNumber = "";

        let route = "";

        let city = "";

        let state = "";

        let zipCode = "";

        let county = "";

        // Debug: Log address components to console

        console.log("Address components:", addressComponents);

        addressComponents.forEach((component) => {
          const types = component.types;

          console.log(
            "Component types:",
            types,
            "Long name:",
            component.long_name
          );

          if (types.includes("street_number")) {
            streetNumber = component.long_name;
          } else if (types.includes("route")) {
            route = component.long_name;
          } else if (types.includes("locality")) {
            city = component.long_name;
          } else if (types.includes("administrative_area_level_1")) {
            state = component.short_name;
          } else if (types.includes("postal_code")) {
            zipCode = component.long_name;

            console.log("Found postal code:", zipCode);
          } else if (types.includes("administrative_area_level_2")) {
            // County information is typically found in administrative_area_level_2

            county = component.long_name;
          }
        });

        const fullAddress = `${streetNumber} ${route}`.trim();

        // Debug: Log extracted values

        console.log("Extracted values:", {
          fullAddress,

          city,

          state,

          zipCode,

          county,
        });

        setFormData((prev) => ({
          ...prev,

          propertyStreet1: fullAddress,

          propertyCity: city,

          propertyState: "MA", // Always keep as MA since it's locked

          propertyZip: zipCode,

          propertyCounty: county,
        }));

        // Don't mark as verified automatically - validation will happen on Save

        setIsAddressVerified(false);

        setAddressValidationError("");

        setShowPredictions(false);

        setPredictions([]);
      }
    });
  };

  // Handle keyboard navigation

  const handleKeyDown = (e) => {
    if (!showPredictions || predictions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();

        setSelectedPredictionIndex((prev) =>
          prev < predictions.length - 1 ? prev + 1 : prev
        );

        break;

      case "ArrowUp":
        e.preventDefault();

        setSelectedPredictionIndex((prev) => (prev > 0 ? prev - 1 : prev));

        break;

      case "Enter":
        e.preventDefault();

        if (selectedPredictionIndex >= 0) {
          selectPrediction(predictions[selectedPredictionIndex].place_id);
        }

        break;

      case "Escape":
        setShowPredictions(false);

        setPredictions([]);

        setSelectedPredictionIndex(-1);

        break;
    }
  };

  // Handle borrower address input for autocomplete

  const handleBorrowerAddressInput = (borrowerId, value) => {
    if (!autocompleteServiceRef.current || !value.trim()) {
      setBorrowerPredictions((prev) => ({ ...prev, [borrowerId]: [] }));

      setShowBorrowerPredictions((prev) => ({ ...prev, [borrowerId]: false }));

      return;
    }

    setIsLoadingBorrowerPredictions((prev) => ({
      ...prev,
      [borrowerId]: true,
    }));

    const request = {
      input: value,

      types: ["address"],

      componentRestrictions: { country: "us" },
    };

    try {
      autocompleteServiceRef.current.getPlacePredictions(
        request,
        (predictions, status) => {
          setIsLoadingBorrowerPredictions((prev) => ({
            ...prev,
            [borrowerId]: false,
          }));

          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            setBorrowerPredictions((prev) => ({
              ...prev,
              [borrowerId]: predictions,
            }));

            setShowBorrowerPredictions((prev) => ({
              ...prev,
              [borrowerId]: true,
            }));

            setSelectedBorrowerPredictionIndex((prev) => ({
              ...prev,
              [borrowerId]: -1,
            }));
          } else {
            setBorrowerPredictions((prev) => ({ ...prev, [borrowerId]: [] }));

            setShowBorrowerPredictions((prev) => ({
              ...prev,
              [borrowerId]: false,
            }));
          }
        }
      );
    } catch (error) {
      setIsLoadingBorrowerPredictions((prev) => ({
        ...prev,
        [borrowerId]: false,
      }));
    }
  };

  // Handle notice address input for autocomplete

  const handleNoticeAddressInput = (value) => {
    if (!autocompleteServiceRef.current || !value.trim()) {
      setNoticePredictions([]);

      setShowNoticePredictions(false);

      return;
    }

    setIsLoadingNoticePredictions(true);

    const request = {
      input: value,

      types: ["address"],

      componentRestrictions: { country: "us" },
    };

    try {
      autocompleteServiceRef.current.getPlacePredictions(
        request,
        (predictions, status) => {
          setIsLoadingNoticePredictions(false);

          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            setNoticePredictions(predictions);

            setShowNoticePredictions(true);

            setSelectedNoticePredictionIndex(-1);
          } else {
            setNoticePredictions([]);

            setShowNoticePredictions(false);
          }
        }
      );
    } catch (error) {
      setIsLoadingNoticePredictions(false);
    }
  };

  // Handle loan assignee address input for autocomplete

  const handleLoanAssigneeAddressInput = (assigneeIndex, value) => {
    if (!autocompleteServiceRef.current || !value.trim()) {
      setLoanAssigneePredictions((prev) => ({ ...prev, [assigneeIndex]: [] }));

      setShowLoanAssigneePredictions((prev) => ({
        ...prev,
        [assigneeIndex]: false,
      }));

      return;
    }

    setIsLoadingLoanAssigneePredictions((prev) => ({
      ...prev,
      [assigneeIndex]: true,
    }));

    const request = {
      input: value,

      types: ["address"],

      componentRestrictions: { country: "us" },
    };

    try {
      autocompleteServiceRef.current.getPlacePredictions(
        request,
        (predictions, status) => {
          setIsLoadingLoanAssigneePredictions((prev) => ({
            ...prev,
            [assigneeIndex]: false,
          }));

          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            setLoanAssigneePredictions((prev) => ({
              ...prev,
              [assigneeIndex]: predictions,
            }));

            setShowLoanAssigneePredictions((prev) => ({
              ...prev,
              [assigneeIndex]: true,
            }));

            setSelectedLoanAssigneePredictionIndex((prev) => ({
              ...prev,
              [assigneeIndex]: -1,
            }));
          } else {
            setLoanAssigneePredictions((prev) => ({
              ...prev,
              [assigneeIndex]: [],
            }));

            setShowLoanAssigneePredictions((prev) => ({
              ...prev,
              [assigneeIndex]: false,
            }));
          }
        }
      );
    } catch (error) {
      setIsLoadingLoanAssigneePredictions((prev) => ({
        ...prev,
        [assigneeIndex]: false,
      }));
    }
  };

  // Handle borrower address prediction click

  const handleBorrowerPredictionClick = (borrowerId, prediction) => {
    if (!placesServiceRef.current) return;

    const request = {
      placeId: prediction.place_id,

      fields: ["address_components", "formatted_address"],
    };

    placesServiceRef.current.getDetails(request, (place, status) => {
      if (
        status === window.google.maps.places.PlacesServiceStatus.OK &&
        place
      ) {
        const addressComponents = place.address_components;

        let streetNumber = "";

        let route = "";

        let city = "";

        let state = "";

        let zipCode = "";

        addressComponents.forEach((component) => {
          const types = component.types;

          if (types.includes("street_number")) {
            streetNumber = component.long_name;
          } else if (types.includes("route")) {
            route = component.long_name;
          } else if (types.includes("locality")) {
            city = component.long_name;
          } else if (types.includes("administrative_area_level_1")) {
            state = component.short_name;
          } else if (types.includes("postal_code")) {
            zipCode = component.long_name;
          }
        });

        const fullAddress = `${streetNumber} ${route}`.trim();

        updateBorrower(borrowerId, "mailingStreet1", fullAddress);

        updateBorrower(borrowerId, "mailingCity", city);

        updateBorrower(borrowerId, "mailingState", state);

        updateBorrower(borrowerId, "mailingZip", zipCode);

        setShowBorrowerPredictions((prev) => ({
          ...prev,
          [borrowerId]: false,
        }));

        setBorrowerPredictions((prev) => ({ ...prev, [borrowerId]: [] }));
      }
    });
  };

  // Handle notice address prediction click

  const handleNoticePredictionClick = (prediction) => {
    if (!placesServiceRef.current) return;

    const request = {
      placeId: prediction.place_id,

      fields: ["address_components", "formatted_address"],
    };

    placesServiceRef.current.getDetails(request, (place, status) => {
      if (
        status === window.google.maps.places.PlacesServiceStatus.OK &&
        place
      ) {
        const addressComponents = place.address_components;

        let streetNumber = "";

        let route = "";

        let city = "";

        let state = "";

        let zipCode = "";

        addressComponents.forEach((component) => {
          const types = component.types;

          if (types.includes("street_number")) {
            streetNumber = component.long_name;
          } else if (types.includes("route")) {
            route = component.long_name;
          } else if (types.includes("locality")) {
            city = component.long_name;
          } else if (types.includes("administrative_area_level_1")) {
            state = component.short_name;
          } else if (types.includes("postal_code")) {
            zipCode = component.long_name;
          }
        });

        const fullAddress = `${streetNumber} ${route}`.trim();

        setFormData((prev) => ({
          ...prev,

          noticeAddressStreet1: fullAddress,

          noticeAddressCity: city,

          noticeAddressState: state,

          noticeAddressZip: zipCode,
        }));

        setShowNoticePredictions(false);

        setNoticePredictions([]);
      }
    });
  };

  // Handle loan assignee address prediction click

  const handleLoanAssigneePredictionClick = (assigneeIndex, prediction) => {
    if (!placesServiceRef.current) return;

    const request = {
      placeId: prediction.place_id,

      fields: ["address_components", "formatted_address"],
    };

    placesServiceRef.current.getDetails(request, (place, status) => {
      if (
        status === window.google.maps.places.PlacesServiceStatus.OK &&
        place
      ) {
        const addressComponents = place.address_components;

        let streetNumber = "";

        let route = "";

        let city = "";

        let state = "";

        let zipCode = "";

        addressComponents.forEach((component) => {
          const types = component.types;

          if (types.includes("street_number")) {
            streetNumber = component.long_name;
          } else if (types.includes("route")) {
            route = component.long_name;
          } else if (types.includes("locality")) {
            city = component.long_name;
          } else if (types.includes("administrative_area_level_1")) {
            state = component.short_name;
          } else if (types.includes("postal_code")) {
            zipCode = component.long_name;
          }
        });

        const fullAddress = `${streetNumber} ${route}`.trim();

        updateLoanAssignee(assigneeIndex, "street1", fullAddress);

        updateLoanAssignee(assigneeIndex, "city", city);

        updateLoanAssignee(assigneeIndex, "addressState", state);

        updateLoanAssignee(assigneeIndex, "zip", zipCode);

        setShowLoanAssigneePredictions((prev) => ({
          ...prev,
          [assigneeIndex]: false,
        }));

        setLoanAssigneePredictions((prev) => ({
          ...prev,
          [assigneeIndex]: [],
        }));
      }
    });
  };

  // Validate address using Geocoding API

  const validateAddressWithGeocoding = () => {
    return new Promise((resolve) => {
      if (!geocoderRef.current || !formData.propertyStreet1.trim()) {
        resolve({ isValid: false, error: "Street address is required" });

        return;
      }

      setIsValidatingAddress(true);

      setAddressValidationError("");

      const addressLine2 = formData.propertyStreet2
        ? ` ${formData.propertyStreet2}`
        : "";

      const fullAddress =
        `${formData.propertyStreet1}${addressLine2}, ${formData.propertyCity}, ${formData.propertyState} ${formData.propertyZip}`.trim();

      geocoderRef.current.geocode(
        { address: fullAddress },
        (results, status) => {
          setIsValidatingAddress(false);

          if (status === "OK" && results && results.length > 0) {
            const result = results[0];

            const addressComponents = result.address_components;

            // Check if the geocoded result matches our input

            let foundCity = false;

            let foundState = false;

            let foundZip = false;

            let county = "";

            let actualState = "";

            addressComponents.forEach((component) => {
              const types = component.types;

              if (
                types.includes("locality") ||
                types.includes("administrative_area_level_2")
              ) {
                if (
                  component.long_name
                    .toLowerCase()
                    .includes(formData.propertyCity.toLowerCase())
                ) {
                  foundCity = true;
                }
              }

              if (types.includes("administrative_area_level_1")) {
                actualState = component.short_name;

                if (component.short_name === "MA") {
                  foundState = true;
                }
              }

              if (types.includes("postal_code")) {
                if (component.long_name === formData.propertyZip) {
                  foundZip = true;
                }
              }

              if (types.includes("administrative_area_level_2")) {
                // Extract county information for auto-filling

                county = component.long_name;
              }
            });

            // Check if the address is actually in Massachusetts

            if (actualState && actualState !== "MA") {
              setIsAddressVerified(false);

              setAddressValidationError(
                `This address is in ${actualState}, but this system only accepts Massachusetts addresses. Please select a Massachusetts address.`
              );

              resolve({
                isValid: false,
                error: "Address is not in Massachusetts",
              });

              return;
            }

            // More strict validation - check if all components match

            let cityMatch = false;

            let zipMatch = false;

            let countyMatch = false;

            let geocodedCity = "";

            // Check city match (stricter matching - require meaningful match)

            addressComponents.forEach((component) => {
              const types = component.types;

              if (types.includes("locality")) {
                geocodedCity = component.long_name.toLowerCase();
              }

              if (
                types.includes("locality") ||
                types.includes("administrative_area_level_2")
              ) {
                const componentCity = component.long_name.toLowerCase();

                const inputCity = formData.propertyCity.toLowerCase().trim();

                // Stricter city matching: require at least 3 characters and meaningful match
                if (inputCity.length >= 3) {
                  // Check if input city matches the beginning of geocoded city (for autocomplete)
                  // OR if geocoded city matches the beginning of input city
                  // OR exact match
                  if (
                    componentCity === inputCity ||
                    componentCity.startsWith(inputCity) ||
                    inputCity.startsWith(componentCity) ||
                    (componentCity.includes(inputCity) && inputCity.length >= 4)
                  ) {
                    cityMatch = true;
                  }
                } else if (inputCity.length > 0) {
                  // For very short inputs (1-2 chars), require exact match only
                  if (componentCity === inputCity) {
                    cityMatch = true;
                  }
                }
              }

              if (types.includes("postal_code")) {
                if (component.long_name === formData.propertyZip) {
                  zipMatch = true;
                }
              }

              if (types.includes("administrative_area_level_2")) {
                const componentCounty = component.long_name.toLowerCase();

                const inputCounty = formData.propertyCounty.toLowerCase().trim();

                // Stricter county matching: require meaningful match
                if (inputCounty.length >= 3) {
                  if (
                    componentCounty === inputCounty ||
                    componentCounty.startsWith(inputCounty) ||
                    inputCounty.startsWith(componentCounty) ||
                    (componentCounty.includes(inputCounty) && inputCounty.length >= 4)
                  ) {
                    countyMatch = true;
                  }
                } else if (inputCounty.length > 0) {
                  if (componentCounty === inputCounty) {
                    countyMatch = true;
                  }
                }
              }
            });

            // Require all components to match for verification

            if (foundState && cityMatch && zipMatch && countyMatch) {
              // Auto-fill county if it was found and not already set

              if (county && !formData.propertyCounty) {
                setFormData((prev) => ({
                  ...prev,

                  propertyCounty: county,
                }));
              }

              setIsAddressVerified(true);

              resolve({ isValid: true, coordinates: result.geometry.location });
            } else {
              setIsAddressVerified(false);

              let errorMessage = "Address verification failed. Please check:";

              if (!cityMatch)
                errorMessage += " City does not match the address";

              if (!zipMatch)
                errorMessage += " ZIP code does not match the address";

              if (!countyMatch)
                errorMessage += " County does not match the address";

              setAddressValidationError(errorMessage);

              resolve({ isValid: false, error: "Address verification failed" });
            }
          } else {
            setIsAddressVerified(false);

            setAddressValidationError(
              "Invalid address. Please select from suggestions or enter a valid address."
            );

            resolve({ isValid: false, error: "Invalid address" });
          }
        }
      );
    });
  };

  // Validation functions

  const validateAddressFields = () => {
    const errors = {};

    let hasErrors = false;

    if (!formData.propertyStreet1.trim()) {
      errors.propertyStreet1 = "Street address is required";

      hasErrors = true;
    }

    if (!formData.propertyCity.trim()) {
      errors.propertyCity = "City is required";

      hasErrors = true;
    }

    if (!formData.propertyState.trim()) {
      errors.propertyState = "State is required";

      hasErrors = true;
    }

    const zipPattern = /^\d{5}(-\d{4})?$/;

    if (!formData.propertyZip.trim()) {
      errors.propertyZip = "ZIP code is required";

      hasErrors = true;
    } else if (!zipPattern.test(formData.propertyZip)) {
      errors.propertyZip =
        "ZIP code must be in valid format (12345 or 12345-6789)";

      hasErrors = true;
    }

    if (!formData.propertyCounty.trim()) {
      errors.propertyCounty = "County is required";

      hasErrors = true;
    }

    return { hasErrors, errors };
  };

  // Validate Property Details step

  const validatePropertyDetailsStep = async () => {
    const validation = validateAddressFields();

    if (validation.hasErrors) {
      return { isValid: false, errors: validation.errors };
    }

    // Always validate address with Geocoding API when saving

    const addressValidation = await validateAddressWithGeocoding();

    if (!addressValidation.isValid) {
      setFieldErrors((prev) => ({
        ...prev,
        address: addressValidationError || "Address validation failed",
      }));

      return {
        isValid: false,
        errors: {
          address: addressValidationError || "Address validation failed",
        },
      };
    }

    return { isValid: true, errors: {} };
  };

  // Generic address validation function for any address type
  const validateAddressWithGeocodingGeneric = (addressData) => {
    return new Promise((resolve) => {
      const { street1, street2, city, state, zip } = addressData;
      
      if (!geocoderRef.current || !street1?.trim()) {
        resolve({ isValid: false, error: "Street address is required" });
        return;
      }

      // Require city and zip for validation
      if (!city || !city.trim()) {
        resolve({ isValid: false, error: "City is required for address validation" });
        return;
      }

      if (city.trim().length < 3) {
        resolve({ isValid: false, error: "City name must be at least 3 characters long" });
        return;
      }

      if (!zip || !zip.trim()) {
        resolve({ isValid: false, error: "ZIP code is required for address validation" });
        return;
      }

      setIsValidatingAddress(true);
      setAddressValidationError("");

      const addressLine2 = street2 ? ` ${street2}` : "";
      const fullAddress = `${street1}${addressLine2}, ${city || ""}, ${state || "MA"} ${zip || ""}`.trim();

      geocoderRef.current.geocode(
        { address: fullAddress },
        (results, status) => {
          setIsValidatingAddress(false);

          if (status === "OK" && results && results.length > 0) {
            const result = results[0];
            const addressComponents = result.address_components;

            let foundCity = false;
            let foundState = false;
            let foundZip = false;
            let actualState = "";

            addressComponents.forEach((component) => {
              const types = component.types;

              if (types.includes("locality") || types.includes("administrative_area_level_2")) {
                if (city && component.long_name.toLowerCase().includes(city.toLowerCase())) {
                  foundCity = true;
                }
              }

              if (types.includes("administrative_area_level_1")) {
                actualState = component.short_name;
                if (component.short_name === "MA") {
                  foundState = true;
                }
              }

              if (types.includes("postal_code")) {
                if (zip && component.long_name === zip) {
                  foundZip = true;
                }
              }
            });

            // Check if the address is actually in Massachusetts
            if (actualState && actualState !== "MA") {
              setAddressValidationError(
                `This address is in ${actualState}, but this system only accepts Massachusetts addresses. Please select a Massachusetts address.`
              );
              resolve({
                isValid: false,
                error: "Address is not in Massachusetts",
              });
              return;
            }

            // More strict validation - check if all components match
            let cityMatch = false;
            let zipMatch = false;

            addressComponents.forEach((component) => {
              const types = component.types;

              if (types.includes("locality") || types.includes("administrative_area_level_2")) {
                if (city && city.trim().length > 0) {
                  const componentCity = component.long_name.toLowerCase();
                  const inputCity = city.toLowerCase().trim();
                  
                  // Stricter city matching: require meaningful match
                  if (inputCity.length >= 3) {
                    // Check if input city matches the beginning of geocoded city (for autocomplete)
                    // OR if geocoded city matches the beginning of input city
                    // OR exact match
                    // OR if input is 4+ chars and is contained in geocoded city
                    if (
                      componentCity === inputCity ||
                      componentCity.startsWith(inputCity) ||
                      inputCity.startsWith(componentCity) ||
                      (componentCity.includes(inputCity) && inputCity.length >= 4)
                    ) {
                      cityMatch = true;
                    }
                  } else if (inputCity.length > 0) {
                    // For very short inputs (1-2 chars), require exact match only
                    if (componentCity === inputCity) {
                      cityMatch = true;
                    }
                  }
                }
              }

              if (types.includes("postal_code")) {
                if (zip && zip.trim() && component.long_name === zip.trim()) {
                  zipMatch = true;
                }
              }
            });

            // Require state and both city AND zip to match (stricter validation)
            if (foundState && cityMatch && zipMatch) {
              resolve({ isValid: true, coordinates: result.geometry.location });
            } else {
              let errorMessage = "Address verification failed. Please check:";
              if (!cityMatch && city && city.trim().length > 0) {
                errorMessage += " City does not match the address";
              }
              if (!zipMatch && zip && zip.trim().length > 0) {
                errorMessage += " ZIP code does not match the address";
              }
              if (!cityMatch && city && city.trim().length > 0 && city.trim().length < 3) {
                errorMessage += " (City name is too short - please enter at least 3 characters)";
              }

              setAddressValidationError(errorMessage);
              resolve({ isValid: false, error: "Address verification failed" });
            }
          } else {
            setAddressValidationError(
              "Invalid address. Please select from suggestions or enter a valid address."
            );
            resolve({ isValid: false, error: "Invalid address" });
          }
        }
      );
    });
  };

  // Validate Filing Entity address step
  const validateFilingEntityAddressStep = async () => {
    if (!formData.filingEntityStreet1?.trim()) {
      return { isValid: true, errors: {} }; // No address to validate
    }

    const addressData = {
      street1: formData.filingEntityStreet1,
      street2: formData.filingEntityStreet2 || "",
      city: formData.filingEntityCity || "",
      state: formData.filingEntityState || "MA",
      zip: formData.filingEntityZip || "",
    };

    const addressValidation = await validateAddressWithGeocodingGeneric(addressData);
    return addressValidation;
  };

  // Validate Notice Address step
  const validateNoticeAddressStep = async () => {
    if (!formData.noticeAddressStreet1?.trim()) {
      return { isValid: true, errors: {} }; // No address to validate
    }

    const addressData = {
      street1: formData.noticeAddressStreet1,
      street2: "",
      city: formData.noticeAddressCity || "",
      state: formData.noticeAddressState || "MA",
      zip: formData.noticeAddressZip || "",
    };

    const addressValidation = await validateAddressWithGeocodingGeneric(addressData);
    return addressValidation;
  };

  // Validate Borrower addresses step
  const validateBorrowerAddressesStep = async () => {
    if (!formData.borrowers || formData.borrowers.length === 0) {
      return { isValid: true, errors: {} };
    }

    const borrowersWithAddresses = formData.borrowers.filter(
      (borrower) => borrower.mailingStreet1?.trim()
    );

    if (borrowersWithAddresses.length === 0) {
      return { isValid: true, errors: {} }; // No addresses to validate
    }

    // Validate each borrower address
    for (const borrower of borrowersWithAddresses) {
      const addressData = {
        street1: borrower.mailingStreet1,
        street2: borrower.mailingStreet2 || "",
        city: borrower.mailingCity || "",
        state: borrower.mailingState || "MA",
        zip: borrower.mailingZip || "",
      };

      const addressValidation = await validateAddressWithGeocodingGeneric(addressData);
      if (!addressValidation.isValid) {
        return { isValid: false, error: addressValidation.error, borrowerId: borrower.id };
      }
    }

    return { isValid: true, errors: {} };
  };

  // Validate Loan Assignee addresses step
  const validateLoanAssigneeAddressesStep = async () => {
    if (!formData.loanAssignees || formData.loanAssignees.length === 0) {
      return { isValid: true, errors: {} };
    }

    const assigneesWithAddresses = formData.loanAssignees.filter(
      (assignee) => assignee.street1?.trim()
    );

    if (assigneesWithAddresses.length === 0) {
      return { isValid: true, errors: {} }; // No addresses to validate
    }

    // Validate each assignee address
    for (let i = 0; i < formData.loanAssignees.length; i++) {
      const assignee = formData.loanAssignees[i];
      if (!assignee.street1?.trim()) continue;

      const addressData = {
        street1: assignee.street1,
        street2: assignee.street2 || "",
        city: assignee.city || "",
        state: assignee.addressState || "MA",
        zip: assignee.zip || "",
      };

      const addressValidation = await validateAddressWithGeocodingGeneric(addressData);
      if (!addressValidation.isValid) {
        return { isValid: false, error: addressValidation.error, assigneeIndex: i };
      }
    }

    return { isValid: true, errors: {} };
  };

  // Handle automatic address validation when triggered (for stepper clicks)
  useEffect(() => {
    if (!shouldValidateAddress || !pendingStepChange) return;

    // Property Details (Step 2)
    if (currentStep === 2 && addressValidationType !== "filingEntity" && addressValidationType !== "notice" && addressValidationType !== "borrower" && addressValidationType !== "loanAssignee" && formData?.propertyStreet1?.trim() && !isAddressVerified) {
      setShouldValidateAddress(false);
      validatePropertyDetailsStep().then((validation) => {
        if (validation.isValid) {
          setIsAddressVerified(true);
          clearStepError(2);
          const targetStep = pendingStepChange;
          setPendingStepChange(null);
          setAddressValidationType("");
          const hasAllAddressFields = !!(formData?.propertyStreet1?.trim() && 
                                        formData?.propertyCity?.trim() && 
                                        formData?.propertyState?.trim() && 
                                        formData?.propertyZip?.trim() && 
                                        formData?.propertyCounty?.trim());
          if (hasAllAddressFields) {
            if (!completedSteps.has(2)) {
              markStepCompleted(2);
            }
            if (stepsWithErrors.has(2)) {
              clearStepError(2);
            }
          }
          wizardGoToStep(targetStep);
          setCurrentStep(targetStep);
          previousStepRef.current = targetStep;
          window.scrollTo(0, 0);
        } else {
          setAddressValidationMessage(
            addressValidationError || "Address validation failed. Please check the address and try again."
          );
          setAddressValidationType("property");
          setShowAddressValidationDialog(true);
        }
      });
      return;
    }

    // Filing Entity (Step 5)
    if (currentStep === 5 && addressValidationType === "filingEntity" && formData?.filingEntityStreet1?.trim() && !isFilingEntityAddressVerified) {
      setShouldValidateAddress(false);
      validateFilingEntityAddressStep().then((validation) => {
        if (validation.isValid) {
          setIsFilingEntityAddressVerified(true);
          clearStepError(5);
          // Mark step as completed if all fields are valid
          const filingEntityValidation = validateFilingEntity();
          if (!filingEntityValidation.hasErrors && userFilingEntityType) {
            if (!completedSteps.has(5)) {
              markStepCompleted(5);
            }
          }
          const targetStep = pendingStepChange;
          setPendingStepChange(null);
          setAddressValidationType("");
          wizardGoToStep(targetStep);
          setCurrentStep(targetStep);
          previousStepRef.current = targetStep;
          window.scrollTo(0, 0);
        } else {
          setAddressValidationMessage(
            addressValidationError || "Filing Entity address validation failed. Please check the address and try again."
          );
          setShowAddressValidationDialog(true);
        }
      });
      return;
    }

    // Notice Address (Step 6)
    if (currentStep === 6 && addressValidationType === "notice" && formData?.noticeAddressStreet1?.trim() && !isNoticeAddressVerified) {
      setShouldValidateAddress(false);
      validateNoticeAddressStep().then((validation) => {
        if (validation.isValid) {
          setIsNoticeAddressVerified(true);
          clearStepError(6);
          // Mark step as completed if all fields are valid
          const rightToCureValidation = validateRightToCureDetails();
          if (!rightToCureValidation.hasErrors) {
            if (!completedSteps.has(6)) {
              markStepCompleted(6);
            }
          }
          const targetStep = pendingStepChange;
          setPendingStepChange(null);
          setAddressValidationType("");
          wizardGoToStep(targetStep);
          setCurrentStep(targetStep);
          previousStepRef.current = targetStep;
          window.scrollTo(0, 0);
        } else {
          setAddressValidationMessage(
            addressValidationError || "Notice address validation failed. Please check the address and try again."
          );
          setShowAddressValidationDialog(true);
        }
      });
      return;
    }

    // Borrower Addresses (Step 4)
    if (currentStep === 4 && addressValidationType === "borrower") {
      setShouldValidateAddress(false);
      validateBorrowerAddressesStep().then((validation) => {
        if (validation.isValid) {
          const verified = {};
          formData.borrowers
            .filter(borrower => borrower.mailingStreet1?.trim())
            .forEach(borrower => {
              verified[borrower.id] = true;
            });
          setBorrowerAddressesVerified(prev => ({ ...prev, ...verified }));
          clearStepError(4);
          // Mark step as completed if all fields are valid
          const borrowerValidation = validateBorrowerDetails();
          if (!borrowerValidation.hasErrors) {
            if (!completedSteps.has(4)) {
              markStepCompleted(4);
            }
          }
          const targetStep = pendingStepChange;
          setPendingStepChange(null);
          setAddressValidationType("");
          wizardGoToStep(targetStep);
          setCurrentStep(targetStep);
          previousStepRef.current = targetStep;
          window.scrollTo(0, 0);
        } else {
          setAddressValidationMessage(
            addressValidationError || "Borrower address validation failed. Please check the addresses and try again."
          );
          setAddressValidationContext({ borrowerId: validation.borrowerId });
          setShowAddressValidationDialog(true);
        }
      });
      return;
    }

    // Loan Assignee Addresses (Step 8)
    if (currentStep === 8 && addressValidationType === "loanAssignee") {
      setShouldValidateAddress(false);
      validateLoanAssigneeAddressesStep().then((validation) => {
        if (validation.isValid) {
          const verified = {};
          formData.loanAssignees
            .filter(assignee => assignee.street1?.trim())
            .forEach((assignee, index) => {
              verified[index] = true;
            });
          setLoanAssigneeAddressesVerified(prev => ({ ...prev, ...verified }));
          clearStepError(8);
          // Mark step as completed if all fields are valid
          const loanAssigneesValidation = validateLoanAssignees();
          if (!loanAssigneesValidation.hasErrors) {
            if (!completedSteps.has(8)) {
              markStepCompleted(8);
            }
          }
          const targetStep = pendingStepChange;
          setPendingStepChange(null);
          setAddressValidationType("");
          wizardGoToStep(targetStep);
          setCurrentStep(targetStep);
          previousStepRef.current = targetStep;
          window.scrollTo(0, 0);
        } else {
          setAddressValidationMessage(
            addressValidationError || "Loan assignee address validation failed. Please check the addresses and try again."
          );
          setAddressValidationContext({ assigneeIndex: validation.assigneeIndex });
          setShowAddressValidationDialog(true);
        }
      });
      return;
    }
  }, [shouldValidateAddress, currentStep, addressValidationType, formData, isAddressVerified, isFilingEntityAddressVerified, isNoticeAddressVerified, borrowerAddressesVerified, loanAssigneeAddressesVerified, pendingStepChange, stepsWithErrors, completedSteps, markStepCompleted, wizardGoToStep, setCurrentStep, clearStepError]);

  // Auto-detect city and county when street address and ZIP are entered

  const autoDetectAddressComponents = async (streetAddress, zipCode) => {
    if (!streetAddress.trim() || !zipCode.trim() || !geocoderRef.current) {
      return;
    }

    try {
      const fullAddress = `${streetAddress}, MA ${zipCode}`;

      geocoderRef.current.geocode(
        { address: fullAddress },
        (results, status) => {
          if (status === "OK" && results && results.length > 0) {
            const result = results[0];

            const addressComponents = result.address_components;

            let detectedCity = "";

            let detectedCounty = "";

            let isInMA = false;

            addressComponents.forEach((component) => {
              const types = component.types;

              if (types.includes("locality")) {
                detectedCity = component.long_name;
              } else if (types.includes("administrative_area_level_2")) {
                detectedCounty = component.long_name;
              } else if (types.includes("administrative_area_level_1")) {
                if (component.short_name === "MA") {
                  isInMA = true;
                }
              }
            });

            // Only auto-fill if the address is in Massachusetts

            if (isInMA && (detectedCity || detectedCounty)) {
              setFormData((prev) => ({
                ...prev,

                ...(detectedCity && !prev.propertyCity
                  ? { propertyCity: detectedCity }
                  : {}),

                ...(detectedCounty && !prev.propertyCounty
                  ? { propertyCounty: detectedCounty }
                  : {}),
              }));
            }
          }
        }
      );
    } catch (error) {}
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    // Define integer fields that should not show decimal values

    const integerFields = ["delinquencyDaysAtFiling", "daysDelinquentAtNotice"];

    // Define currency fields that should be formatted with commas
    const currencyFields = [
      "originalPrincipalAmount",
      "currentPrincipalBalance",
      "monthlyPaymentAmount",
      "amountInDefault",
    ];

    // NOTE: Removed precision handling for decimal fields (interestRatePercent, etc.)

    // Previously had complex logic that was converting 70 to 69.999

    // Now all decimal fields store exactly what user types

    // Handle numeric inputs for integer fields

    let processedValue = value;

    // Handle currency fields - parse to remove commas for storage, but format for display
    if (currencyFields.includes(name)) {
      // Parse the input to get numeric value (remove commas)
      const parsedValue = parseCurrencyInput(value);
      processedValue = parsedValue;
    }

    // Enforce digits-only for MIN and Loan Number fields
    if (name === "minNumber" || name === "loanNumber") {
      processedValue = (processedValue || "").replace(/\D+/g, "");
    }

    if (type === "number" && integerFields.includes(name) && value !== "") {
      // For integer fields, remove any decimal part

      const intValue = parseInt(value, 10);

      processedValue = isNaN(intValue) ? "" : intValue.toString();
    }

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "file"
          ? files[0]
          : processedValue,
    }));

    // Clear field error when user starts typing

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };

        delete newErrors[name];

        return newErrors;
      });
    }

    // Real-time validation for principal amount comparison

    if (
      name === "originalPrincipalAmount" ||
      name === "currentPrincipalBalance"
    ) {
      const originalAmount =
        parseFloat(
          name === "originalPrincipalAmount"
            ? value
            : formData.originalPrincipalAmount
        ) || 0;

      const currentBalance =
        parseFloat(
          name === "currentPrincipalBalance"
            ? value
            : formData.currentPrincipalBalance
        ) || 0;

      if (
        originalAmount > 0 &&
        currentBalance > 0 &&
        currentBalance > originalAmount
      ) {
        setFieldErrors((prev) => ({
          ...prev,

          currentPrincipalBalance:
            "Current Principal Balance cannot exceed the Original Principal Amount",
        }));
      } else if (
        fieldErrors.currentPrincipalBalance ===
        "Current Principal Balance cannot exceed the Original Principal Amount"
      ) {
        setFieldErrors((prev) => {
          const newErrors = { ...prev };

          delete newErrors.currentPrincipalBalance;

          return newErrors;
        });
      }
    }

    // Reset saved draft indicator when user makes changes

    if (hasSavedDraft) {
      setHasSavedDraft(false);
    }

    // Reset address verification when manually editing address fields

    if (
      [
        "propertyStreet1",
        "propertyStreet2",
        "propertyCity",
        "propertyState",
        "propertyZip",
        "propertyCounty",
      ].includes(name)
    ) {
      setIsAddressVerified(false);
      setAddressValidationError("");
    }

    // Reset Filing Entity address verification when editing
    if (
      [
        "filingEntityStreet1",
        "filingEntityStreet2",
        "filingEntityCity",
        "filingEntityState",
        "filingEntityZip",
      ].includes(name)
    ) {
      setIsFilingEntityAddressVerified(false);
    }

    // Reset Notice Address verification when editing
    if (
      [
        "noticeAddressStreet1",
        "noticeAddressCity",
        "noticeAddressState",
        "noticeAddressZip",
      ].includes(name)
    ) {
      setIsNoticeAddressVerified(false);
    }

    // Auto-detect city and county when street address and ZIP are both entered

    if (name === "propertyStreet1" || name === "propertyZip") {
      const currentFormData = { ...formData, [name]: value };

      const streetAddress =
        name === "propertyStreet1" ? value : currentFormData.propertyStreet1;

      const zipCode =
        name === "propertyZip" ? value : currentFormData.propertyZip;

      // Debounce the auto-detection

      if (window.autoDetectTimeout) {
        clearTimeout(window.autoDetectTimeout);
      }

      window.autoDetectTimeout = setTimeout(() => {
        autoDetectAddressComponents(streetAddress, zipCode);
      }, 1000); // 1 second delay
    }
  };

  const handleRemoveFile = (fileFieldName) => {
    setFormData((prev) => ({
      ...prev,

      [fileFieldName]: null,
    }));

    // Clear any field errors for this file

    if (fieldErrors[fileFieldName]) {
      setFieldErrors((prev) => ({
        ...prev,

        [fileFieldName]: "",
      }));
    }
  };

  // Borrower management functions

  const addBorrower = () => {
    const newBorrowerId = Math.max(...formData.borrowers.map((b) => b.id)) + 1;

    setFormData((prev) => ({
      ...prev,

      borrowers: [
        ...prev.borrowers,

        {
          id: newBorrowerId,

          firstName: "",

          middleName: "",

          lastName: "",

          suffix: "",

          borrowerIsPrimary: false,

          mailingStreet1: "",

          mailingCity: "",

          mailingState: "",

          mailingZip: "",

          phone: "",

          email: "",
        },
      ],
    }));
  };

  const removeBorrower = (borrowerId) => {
    if (formData.borrowers.length > 1) {
      const isRemovingPrimary = formData.borrowers.find(
        (b) => b.id === borrowerId
      )?.borrowerIsPrimary;

      setFormData((prev) => {
        const newBorrowers = prev.borrowers.filter(
          (borrower) => borrower.id !== borrowerId
        );

        // If we're removing the primary borrower, make the first remaining borrower primary

        if (isRemovingPrimary && newBorrowers.length > 0) {
          newBorrowers[0].borrowerIsPrimary = true;
        }

        return {
          ...prev,

          borrowers: newBorrowers,
        };
      });
    }
  };

  const updateBorrower = (borrowerId, field, value) => {
    setFormData((prev) => ({
      ...prev,

      borrowers: prev.borrowers.map((borrower) =>
        borrower.id === borrowerId ? { ...borrower, [field]: value } : borrower
      ),
    }));

    // Reset borrower address verification when address fields are edited
    if (["mailingStreet1", "mailingStreet2", "mailingCity", "mailingState", "mailingZip"].includes(field)) {
      setBorrowerAddressesVerified((prev) => {
        const newState = { ...prev };
        delete newState[borrowerId];
        return newState;
      });
    }
  };

  // Loan assignee management functions

  const addLoanAssignee = () => {
    setFormData((prev) => ({
      ...prev,

      loanAssignees: [
        ...prev.loanAssignees,

        {
          assigneeName: "",

          assigneeTypeId: "",

          assigneeRoleId: "",

          street1: "",

          street2: "",

          city: "",

          addressState: "",

          zip: "",

          licenseNumber: "",

          licenseState: "",
        },
      ],
    }));
  };

  const removeLoanAssignee = (index) => {
    if (formData.loanAssignees.length > 1) {
      setFormData((prev) => ({
        ...prev,

        loanAssignees: prev.loanAssignees.filter((_, i) => i !== index),
      }));
    }
  };

  const updateLoanAssignee = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,

      loanAssignees: prev.loanAssignees.map((assignee, i) =>
        i === index ? { ...assignee, [field]: value } : assignee
      ),
    }));

    // Reset loan assignee address verification when address fields are edited
    if (["street1", "street2", "city", "addressState", "zip"].includes(field)) {
      setLoanAssigneeAddressesVerified((prev) => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
      });
    }

    // Clear field error when user starts typing

    const errorKey = `loanAssignees.${index}.${field}`;

    if (fieldErrors[errorKey]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };

        delete newErrors[errorKey];

        return newErrors;
      });
    }
  };

  // Validate loan details

  const validateLoanDetails = () => {
    const errors = {};

    let hasErrors = false;

    // Is MIN Applicable is required
    if (!formData.isMinApplicable || (formData.isMinApplicable !== "yes" && formData.isMinApplicable !== "no")) {
      errors.isMinApplicable = "Please select if MIN is applicable";
      hasErrors = true;
    }

    // MIN Number is required if MIN is applicable
    if (formData.isMinApplicable === "yes" && !formData.minNumber?.trim()) {
      errors.minNumber = "MIN Number is required when MIN is applicable";
      hasErrors = true;
    }

    // Loan Number is required

    if (!formData.loanNumber.trim()) {
      errors.loanNumber = "Loan Number is required";

      hasErrors = true;
    }

    // Loan Type is required (from lookup)

    if (!formData.petitionLoanTypeId) {
      errors.petitionLoanTypeId = "Loan Type is required";

      hasErrors = true;
    }

    // Lien Position is required
    // Note: lienPosition can be 0 (for "First"), so we need to check for null/undefined/empty string specifically

    if (
      formData.lienPosition == null ||
      formData.lienPosition === ""
    ) {
      errors.lienPosition = "Lien Position is required";

      hasErrors = true;
    }

    // Origination Date is required and must be in the past

    if (!formData.originationDate.trim()) {
      errors.originationDate = "Origination Date is required";

      hasErrors = true;
    } else {
      const originationDate = new Date(formData.originationDate);

      const today = new Date();

      today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

      if (originationDate >= today) {
        errors.originationDate = "Origination Date must be in the past";

        hasErrors = true;
      }
    }

    // Original Principal Amount is required and must be positive

    if (
      !formData.originalPrincipalAmount ||
      formData.originalPrincipalAmount <= 0
    ) {
      errors.originalPrincipalAmount =
        "Original Principal Amount is required and must be greater than 0";

      hasErrors = true;
    }

    // Current Principal Balance is required and must be positive

    if (
      !formData.currentPrincipalBalance ||
      formData.currentPrincipalBalance <= 0
    ) {
      errors.currentPrincipalBalance =
        "Current Principal Balance is required and must be greater than 0";

      hasErrors = true;
    }

    // Current Principal Balance cannot exceed Original Principal Amount

    const originalAmount = parseFloat(formData.originalPrincipalAmount) || 0;

    const currentBalance = parseFloat(formData.currentPrincipalBalance) || 0;

    if (
      originalAmount > 0 &&
      currentBalance > 0 &&
      currentBalance > originalAmount
    ) {
      errors.currentPrincipalBalance =
        "Current Principal Balance cannot exceed the Original Principal Amount";

      hasErrors = true;
    }

    // Interest Rate is required and must be between 0-100%

    if (
      formData.interestRatePercent === "" ||
      formData.interestRatePercent === null ||
      formData.interestRatePercent === undefined
    ) {
      errors.interestRatePercent = "Interest Rate is required";

      hasErrors = true;
    } else if (
      formData.interestRatePercent < 0 ||
      formData.interestRatePercent > 100
    ) {
      errors.interestRatePercent = "Interest Rate must be between 0% and 100%";

      hasErrors = true;
    } else if (formData.interestRatePercent === 0) {
      // 0% interest rate is not valid for a loan
      errors.interestRatePercent = "Interest Rate must be greater than 0%";

      hasErrors = true;
    }

    // Monthly Payment Amount is required and must be positive

    if (!formData.monthlyPaymentAmount || formData.monthlyPaymentAmount <= 0) {
      errors.monthlyPaymentAmount =
        "Monthly Payment Amount is required and must be greater than 0";

      hasErrors = true;
    }

    // Delinquency Days at Filing is required and must be non-negative
    if (
      formData.delinquencyDaysAtFiling === "" ||
      formData.delinquencyDaysAtFiling === null ||
      formData.delinquencyDaysAtFiling === undefined ||
      (typeof formData.delinquencyDaysAtFiling === 'number' && formData.delinquencyDaysAtFiling < 0) ||
      (typeof formData.delinquencyDaysAtFiling === 'string' && (formData.delinquencyDaysAtFiling.trim() === "" || parseFloat(formData.delinquencyDaysAtFiling) < 0))
    ) {
      errors.delinquencyDaysAtFiling =
        "Delinquency Days at Filing is required and must be 0 or greater";

      hasErrors = true;
    }

    return { hasErrors, errors };
  };

  // Validate borrower details

  const validateBorrowerDetails = () => {
    const errors = {};

    let hasErrors = false;

    // Valid name pattern: letters, spaces, hyphens, apostrophes only

    const validNamePattern = /^[a-zA-Z\s\-']+$/;

    if (!formData.borrowers || formData.borrowers.length === 0) {
      errors.borrowers = "At least one borrower must be entered";

      hasErrors = true;
    } else {
      formData.borrowers.forEach((borrower, index) => {
        if (!borrower.firstName.trim()) {
          errors[`borrower_${borrower.id}_firstName`] =
            "First name is required";

          hasErrors = true;
        } else if (!validNamePattern.test(borrower.firstName.trim())) {
          errors[`borrower_${borrower.id}_firstName`] =
            "First name must contain only valid characters (no numbers or invalid symbols)";

          hasErrors = true;
        }

        if (!borrower.lastName.trim()) {
          errors[`borrower_${borrower.id}_lastName`] = "Last name is required";

          hasErrors = true;
        } else if (!validNamePattern.test(borrower.lastName.trim())) {
          errors[`borrower_${borrower.id}_lastName`] =
            "Last name must contain only valid characters (no numbers or invalid symbols)";

          hasErrors = true;
        }

        // Validate middle name if provided

        if (
          borrower.middleName.trim() &&
          !validNamePattern.test(borrower.middleName.trim())
        ) {
          errors[`borrower_${borrower.id}_middleName`] =
            "Middle name must contain only valid characters (no numbers or invalid symbols)";

          hasErrors = true;
        }

        // Validate suffix if provided

        if (
          borrower.suffix.trim() &&
          !validNamePattern.test(borrower.suffix.trim())
        ) {
          errors[`borrower_${borrower.id}_suffix`] =
            "Suffix must contain only valid characters (no numbers or invalid symbols)";

          hasErrors = true;
        }
      });
    }

    return { hasErrors, errors };
  };

  // Validate Right-to-Cure details

  const validateRightToCureDetails = () => {
    const errors = {};

    let hasErrors = false;

    // Validate notice sent selection

    if (formData.noticeSent === null || formData.noticeSent === undefined) {
      errors.noticeSent =
        "Please select whether the Right-to-Cure notice was sent";

      hasErrors = true;
    }

    if (formData.noticeSent === true) {
      // Validate notice date

      if (!formData.noticeDate.trim()) {
        errors.noticeDate = "Notice date is required";

        hasErrors = true;
      }

      // Validate amount in default

      if (!formData.amountInDefault || formData.amountInDefault <= 0) {
        errors.amountInDefault =
          "Amount in default is required and must be greater than 0";

        hasErrors = true;
      }

      // Validate days delinquent

      if (
        formData.daysDelinquentAtNotice === "" ||
        formData.daysDelinquentAtNotice < 0
      ) {
        errors.daysDelinquentAtNotice =
          "Days delinquent is required and must be 0 or greater";

        hasErrors = true;
      }

      // Validate cure expiration date

      if (!formData.cureExpirationDate.trim()) {
        errors.cureExpirationDate = "Cure expiration date is required";

        hasErrors = true;
      } else if (
        formData.noticeDate &&
        formData.cureExpirationDate &&
        new Date(formData.cureExpirationDate) <= new Date(formData.noticeDate)
      ) {
        errors.cureExpirationDate =
          "Cure expiration date must be after notice date";

        hasErrors = true;
      }

      // Validate notice address

      if (!formData.noticeAddressStreet1.trim()) {
        errors.noticeAddressStreet1 = "Notice mailing address is required";

        hasErrors = true;
      }

      if (!formData.noticeAddressCity.trim()) {
        errors.noticeAddressCity = "City is required";

        hasErrors = true;
      }

      if (!formData.noticeAddressState.trim()) {
        errors.noticeAddressState = "State is required";

        hasErrors = true;
      }

      if (!formData.noticeAddressZip.trim()) {
        errors.noticeAddressZip = "ZIP code is required";

        hasErrors = true;
      }
    } else if (formData.noticeSent === false) {
      // Validate acceleration date for non-notice path

      if (!formData.manualOverrideReason.trim()) {
        errors.manualOverrideReason = "Acceleration date is required";

        hasErrors = true;
      } else {
        const accelerationDate = new Date(formData.manualOverrideReason);

        const today = new Date();

        today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

        if (accelerationDate >= today) {
          errors.manualOverrideReason = "Acceleration date must be in the past";

          hasErrors = true;
        }
      }
    }

    return { hasErrors, errors };
  };

  // Validate Form 35B Compliance details

  const validateForm35BCompliance = () => {
    const errors = {};

    let hasErrors = false;

    // Validate certain mortgage loan selection

    if (
      formData.certainMortgageLoan === null ||
      formData.certainMortgageLoan === undefined
    ) {
      errors.certainMortgageLoan =
        "Please select whether this loan qualifies as a certain mortgage loan";

      hasErrors = true;
    }

    // No file validation needed - just yes/no question

    // API will receive empty strings for file fields

    return { hasErrors, errors };
  };

  // Track step 3 (Loan Details) completion when formData changes
  useEffect(() => {
    if (!formData) return;
    const loanValidation = validateLoanDetails();
    if (!loanValidation.hasErrors) {
      if (!completedSteps.has(3)) {
        markStepCompleted(3);
      }
      if (stepsWithErrors.has(3)) {
        clearStepError(3);
      }
    } else {
      if (completedSteps.has(3)) {
        markStepIncomplete(3);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, completedSteps, stepsWithErrors, markStepCompleted, markStepIncomplete, clearStepError]);

  // Track step 6 (Right-to-Cure) completion when formData changes
  useEffect(() => {
    if (!formData) return;
    const rightToCureValidation = validateRightToCureDetails();
    if (!rightToCureValidation.hasErrors) {
      // If there's a notice address, check if it's verified
      if (formData?.noticeAddressStreet1?.trim()) {
        if (isNoticeAddressVerified) {
          if (!completedSteps.has(6)) {
            markStepCompleted(6);
          }
          if (stepsWithErrors.has(6)) {
            clearStepError(6);
          }
        } else {
          // Address exists but not verified - still mark complete if all required fields are filled
          // Address verification will be handled when user navigates away from the step
          const hasAllRequiredFields = checkStepHasRequiredFields(6);
          if (hasAllRequiredFields) {
            if (!completedSteps.has(6)) {
              markStepCompleted(6);
            }
            if (stepsWithErrors.has(6)) {
              clearStepError(6);
            }
          } else {
            if (completedSteps.has(6)) {
              markStepIncomplete(6);
            }
          }
        }
      } else {
        // No notice address required - mark complete if validation passes
        if (!completedSteps.has(6)) {
          markStepCompleted(6);
        }
        if (stepsWithErrors.has(6)) {
          clearStepError(6);
        }
      }
    } else {
      if (completedSteps.has(6)) {
        markStepIncomplete(6);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNoticeAddressVerified, formData, stepsWithErrors, completedSteps, markStepCompleted, markStepIncomplete, clearStepError, checkStepHasRequiredFields]);

  // Track step 7 (Form 35B Compliance) completion when formData changes
  useEffect(() => {
    if (!formData) return;
    const form35BValidation = validateForm35BCompliance();
    if (!form35BValidation.hasErrors) {
      if (!completedSteps.has(7)) {
        markStepCompleted(7);
      }
      if (stepsWithErrors.has(7)) {
        clearStepError(7);
      }
    } else {
      if (completedSteps.has(7)) {
        markStepIncomplete(7);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, completedSteps, stepsWithErrors, markStepCompleted, markStepIncomplete, clearStepError]);

  // Validate Filing Entity details

  const validateFilingEntity = () => {
    const errors = {};

    let hasErrors = false;

    // Validate required fields

    if (
      !formData.filingEntityLegalName ||
      formData.filingEntityLegalName.trim() === ""
    ) {
      errors.filingEntityLegalName = "Filing Entity Legal Name is required";

      hasErrors = true;
    }

    // Filing Entity Role is read-only from profile, no validation needed

    if (
      !formData.filingEntityStreet1 ||
      formData.filingEntityStreet1.trim() === ""
    ) {
      errors.filingEntityStreet1 = "Street Address Line 1 is required";

      hasErrors = true;
    }

    if (!formData.filingEntityCity || formData.filingEntityCity.trim() === "") {
      errors.filingEntityCity = "City is required";

      hasErrors = true;
    }

    if (
      !formData.filingEntityState ||
      formData.filingEntityState.trim() === ""
    ) {
      errors.filingEntityState = "State is required";

      hasErrors = true;
    }

    if (!formData.filingEntityZip || formData.filingEntityZip.trim() === "") {
      errors.filingEntityZip = "ZIP Code is required";

      hasErrors = true;
    }

    if (
      !formData.filingContactName ||
      formData.filingContactName.trim() === ""
    ) {
      errors.filingContactName = "Filing Contact Name is required";

      hasErrors = true;
    }

    if (
      !formData.filingContactEmail ||
      formData.filingContactEmail.trim() === ""
    ) {
      errors.filingContactEmail = "Filing Contact Email is required";

      hasErrors = true;
    } else {
      // Validate email format

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(formData.filingContactEmail)) {
        errors.filingContactEmail = "Please enter a valid email address";

        hasErrors = true;
      }
    }

    if (
      !formData.filingContactPhone ||
      formData.filingContactPhone.trim() === ""
    ) {
      errors.filingContactPhone = "Filing Contact Phone is required";

      hasErrors = true;
    }

    return { hasErrors, errors };
  };

  // Validate Loan Assignees details

  const validateLoanAssignees = () => {
    const errors = {};

    let hasErrors = false;

    // Validate each assignee

    formData.loanAssignees.forEach((assignee, index) => {
      if (!assignee.assigneeName || assignee.assigneeName.trim() === "") {
        errors[`loanAssignees.${index}.assigneeName`] =
          "Assignee Name is required";

        hasErrors = true;
      }

      if (!assignee.assigneeTypeId || assignee.assigneeTypeId.trim() === "") {
        errors[`loanAssignees.${index}.assigneeTypeId`] =
          "Assignee Type is required";

        hasErrors = true;
      }

      if (!assignee.assigneeRoleId || assignee.assigneeRoleId.trim() === "") {
        errors[`loanAssignees.${index}.assigneeRoleId`] =
          "Assignee Role is required";

        hasErrors = true;
      }

      if (!assignee.street1 || assignee.street1.trim() === "") {
        errors[`loanAssignees.${index}.street1`] = "Street Address is required";

        hasErrors = true;
      }

      if (!assignee.city || assignee.city.trim() === "") {
        errors[`loanAssignees.${index}.city`] = "City is required";

        hasErrors = true;
      }

      if (!assignee.addressState || assignee.addressState.trim() === "") {
        errors[`loanAssignees.${index}.addressState`] = "State is required";

        hasErrors = true;
      }

      if (!assignee.zip || assignee.zip.trim() === "") {
        errors[`loanAssignees.${index}.zip`] = "ZIP Code is required";

        hasErrors = true;
      }
    });

    return { hasErrors, errors };
  };

  // Validate borrower address with Google Geocoding API

  const validateBorrowerAddressWithGeocoding = async (borrowerId) => {
    const borrower = formData.borrowers.find((b) => b.id === borrowerId);

    if (
      !borrower ||
      !borrower.mailingStreet1 ||
      !borrower.mailingCity ||
      !borrower.mailingState ||
      !borrower.mailingZip
    ) {
      return { isValid: false, error: "Incomplete address information" };
    }

    if (!geocoderRef.current) {
      return { isValid: false, error: "Geocoding service not available" };
    }

    return new Promise((resolve) => {
      const address = `${borrower.mailingStreet1}, ${borrower.mailingCity}, ${borrower.mailingState} ${borrower.mailingZip}`;

      geocoderRef.current.geocode({ address }, (results, status) => {
        if (
          status === window.google.maps.GeocoderStatus.OK &&
          results &&
          results.length > 0
        ) {
          const result = results[0];

          const addressComponents = result.address_components;

          let foundCity = false;

          let foundState = false;

          let foundZip = false;

          let actualState = "";

          addressComponents.forEach((component) => {
            const types = component.types;

            if (
              types.includes("locality") ||
              types.includes("administrative_area_level_2")
            ) {
              if (
                component.long_name
                  .toLowerCase()
                  .includes(borrower.mailingCity.toLowerCase())
              ) {
                foundCity = true;
              }
            }

            if (types.includes("administrative_area_level_1")) {
              actualState = component.short_name;

              if (component.short_name === "MA") {
                foundState = true;
              }
            }

            if (types.includes("postal_code")) {
              if (component.long_name === borrower.mailingZip) {
                foundZip = true;
              }
            }
          });

          if (actualState && actualState !== "MA") {
            setBorrowerAddressValidationErrors((prev) => ({
              ...prev,

              [`borrower_${borrowerId}_mailingAddress`]: `This address is in ${actualState}, but this system only accepts Massachusetts addresses.`,
            }));

            resolve({
              isValid: false,
              error: "Address is not in Massachusetts",
            });

            return;
          }

          if (!foundCity || !foundState || !foundZip) {
            const errorMessage =
              "Address validation failed. Please ensure the address is complete and accurate.";

            setBorrowerAddressValidationErrors((prev) => ({
              ...prev,

              [`borrower_${borrowerId}_mailingAddress`]: errorMessage,
            }));

            resolve({ isValid: false, error: errorMessage });

            return;
          }

          setBorrowerAddressValidationErrors((prev) => {
            const newErrors = { ...prev };

            delete newErrors[`borrower_${borrowerId}_mailingAddress`];

            return newErrors;
          });

          resolve({ isValid: true });
        } else {
          const errorMessage = "Invalid address. Please enter a valid address.";

          setBorrowerAddressValidationErrors((prev) => ({
            ...prev,

            [`borrower_${borrowerId}_mailingAddress`]: errorMessage,
          }));

          resolve({ isValid: false, error: errorMessage });
        }
      });
    });
  };

  // Validate notice address with Google Geocoding API

  const validateNoticeAddressWithGeocoding = async () => {
    if (
      !formData.noticeAddressStreet1 ||
      !formData.noticeAddressCity ||
      !formData.noticeAddressState ||
      !formData.noticeAddressZip
    ) {
      return { isValid: false, error: "Incomplete address information" };
    }

    if (!geocoderRef.current) {
      return { isValid: false, error: "Geocoding service not available" };
    }

    return new Promise((resolve) => {
      const address = `${formData.noticeAddressStreet1}, ${formData.noticeAddressCity}, ${formData.noticeAddressState} ${formData.noticeAddressZip}`;

      geocoderRef.current.geocode({ address }, (results, status) => {
        if (
          status === window.google.maps.GeocoderStatus.OK &&
          results &&
          results.length > 0
        ) {
          const result = results[0];

          const addressComponents = result.address_components;

          let foundCity = false;

          let foundState = false;

          let foundZip = false;

          let actualState = "";

          addressComponents.forEach((component) => {
            const types = component.types;

            if (
              types.includes("locality") ||
              types.includes("administrative_area_level_2")
            ) {
              if (
                component.long_name
                  .toLowerCase()
                  .includes(formData.noticeAddressCity.toLowerCase())
              ) {
                foundCity = true;
              }
            }

            if (types.includes("administrative_area_level_1")) {
              actualState = component.short_name;

              if (component.short_name === "MA") {
                foundState = true;
              }
            }

            if (types.includes("postal_code")) {
              if (component.long_name === formData.noticeAddressZip) {
                foundZip = true;
              }
            }
          });

          if (actualState && actualState !== "MA") {
            setNoticeAddressValidationErrors((prev) => ({
              ...prev,

              noticeAddress: `This address is in ${actualState}, but this system only accepts Massachusetts addresses.`,
            }));

            resolve({
              isValid: false,
              error: "Address is not in Massachusetts",
            });

            return;
          }

          if (!foundCity || !foundState || !foundZip) {
            const errorMessage =
              "Address validation failed. Please ensure the address is complete and accurate.";

            setNoticeAddressValidationErrors((prev) => ({
              ...prev,

              noticeAddress: errorMessage,
            }));

            resolve({ isValid: false, error: errorMessage });

            return;
          }

          setNoticeAddressValidationErrors((prev) => {
            const newErrors = { ...prev };

            delete newErrors.noticeAddress;

            return newErrors;
          });

          resolve({ isValid: true });
        } else {
          const errorMessage = "Invalid address. Please enter a valid address.";

          setNoticeAddressValidationErrors((prev) => ({
            ...prev,

            noticeAddress: errorMessage,
          }));

          resolve({ isValid: false, error: errorMessage });
        }
      });
    });
  };

  // Validate loan assignee address with Google Geocoding API

  const validateLoanAssigneeAddressWithGeocoding = async (assigneeIndex) => {
    const assignee = formData.loanAssignees[assigneeIndex];

    if (
      !assignee ||
      !assignee.street1 ||
      !assignee.city ||
      !assignee.addressState ||
      !assignee.zip
    ) {
      return { isValid: false, error: "Incomplete address information" };
    }

    if (!geocoderRef.current) {
      return { isValid: false, error: "Geocoding service not available" };
    }

    return new Promise((resolve) => {
      const address = `${assignee.street1}, ${assignee.city}, ${assignee.addressState} ${assignee.zip}`;

      geocoderRef.current.geocode({ address }, (results, status) => {
        if (
          status === window.google.maps.GeocoderStatus.OK &&
          results &&
          results.length > 0
        ) {
          const result = results[0];

          const addressComponents = result.address_components;

          let foundCity = false;

          let foundState = false;

          let foundZip = false;

          let actualState = "";

          addressComponents.forEach((component) => {
            const types = component.types;

            if (
              types.includes("locality") ||
              types.includes("administrative_area_level_2")
            ) {
              if (
                component.long_name
                  .toLowerCase()
                  .includes(assignee.city.toLowerCase())
              ) {
                foundCity = true;
              }
            }

            if (types.includes("administrative_area_level_1")) {
              actualState = component.short_name;

              if (component.short_name === "MA") {
                foundState = true;
              }
            }

            if (types.includes("postal_code")) {
              if (component.long_name === assignee.zip) {
                foundZip = true;
              }
            }
          });

          if (actualState && actualState !== "MA") {
            setLoanAssigneeAddressValidationErrors((prev) => ({
              ...prev,

              [`assignee_${assigneeIndex}_address`]: `This address is in ${actualState}, but this system only accepts Massachusetts addresses.`,
            }));

            resolve({
              isValid: false,
              error: "Address is not in Massachusetts",
            });

            return;
          }

          if (!foundCity || !foundState || !foundZip) {
            const errorMessage =
              "Address validation failed. Please ensure the address is complete and accurate.";

            setLoanAssigneeAddressValidationErrors((prev) => ({
              ...prev,

              [`assignee_${assigneeIndex}_address`]: errorMessage,
            }));

            resolve({ isValid: false, error: errorMessage });

            return;
          }

          setLoanAssigneeAddressValidationErrors((prev) => {
            const newErrors = { ...prev };

            delete newErrors[`assignee_${assigneeIndex}_address`];

            return newErrors;
          });

          resolve({ isValid: true });
        } else {
          const errorMessage = "Invalid address. Please enter a valid address.";

          setLoanAssigneeAddressValidationErrors((prev) => ({
            ...prev,

            [`assignee_${assigneeIndex}_address`]: errorMessage,
          }));

          resolve({ isValid: false, error: errorMessage });
        }
      });
    });
  };

  // Auto-save current step data (no validation, no modal close)

  const autoSaveCurrentStep = async () => {
    try {
      // Create save data object

      const saveData = {
        step: currentStep,

        formData: formData,

        timestamp: new Date().toISOString(),

        isDraft: true,
      };

      // In a real application, you would send this to your backend

      // Store in localStorage for now (in real app, this would be API call)

      const existingDrafts = JSON.parse(
        localStorage.getItem("petitionDrafts") || "[]"
      );

      const draftIndex = existingDrafts.findIndex(
        (draft) => draft.step === currentStep
      );

      if (draftIndex >= 0) {
        existingDrafts[draftIndex] = saveData;
      } else {
        existingDrafts.push(saveData);
      }

      localStorage.setItem("petitionDrafts", JSON.stringify(existingDrafts));

      setHasSavedDraft(true);
    } catch (error) {
      // Don't show error toast for auto-save failures to avoid interrupting user flow
    }
  };

  // Save current step data (draft - no validation required)

  const saveCurrentStep = async () => {
    setIsSaving(true);

    try {
      // Validate organization selection for filers (mandatory)
      if (!isOrgAdmin) {
        const finalOrganizationId = selectedOrganizationId || formData.organizationId || organizationId;
        if (!finalOrganizationId) {
          toast.error("Please select an organization before saving.");
        setIsSaving(false);
        return;
        }
      }

      // Prepare petition data with isAllStepsCompleted: false for draft
      // For drafts, preserve existing signature data if available, otherwise create new

      const existingSignature = formData.signatures && formData.signatures.length > 0 
        ? formData.signatures[0] 
        : null;

      const petitionData = {
        isAllStepsCompleted: false,

        ...formData,

        signatures: [
          {
            signerFullName: `${formData.signerFirstName || ""} ${
              formData.signerMiddleInitial || ""
            } ${formData.signerLastName || ""}`.trim(),

            signerTitle: formData.signerTitle || getUserRole(user) || "User",

            signerEmail: formData.signerEmail || "",

            // For drafts, use certification_check if available, otherwise preserve existing esignConsent value
            // This way if user checks the box and saves draft, it's preserved
            esignConsent: formData.certification_check ?? existingSignature?.esignConsent ?? false,

            signatureDrawnOrTyped: existingSignature?.signatureDrawnOrTyped || userProfile?.signatureUrl || "",

            signedAt: existingSignature?.signedAt || (existingSignature ? "" : new Date().toISOString()),

            signerIp: existingSignature?.signerIp || "", // Will be filled by backend

            otpCode: existingSignature?.otpCode || "", // Will be filled by backend
          },
        ],
      };

      // Use selected organization ID if available (for filers), otherwise fall back to formData.organizationId or organizationId
      const finalOrganizationId = selectedOrganizationId || formData.organizationId || organizationId;
      
      // Ensure organizationId is included in petition data for draft
      const finalDraftData = {
        ...petitionData,
        organizationId: finalOrganizationId,
      };

      // Add takeOverToUserId if this is a taken over petition
      if (isTakenOverPetition && user?.id) {
        finalDraftData.takeOverToUserId = user.id;
        finalDraftData.id = takenOverPetitionId; // Include the original petition ID
      }

      // Submit petition as draft using API
      await submitPetition(finalDraftData, true, isTakenOverPetition ? takenOverPetitionId : null); // Pass isDraft: true

      // Notify parent component that petition was saved as draft

      if (onPetitionSubmitted) {
        onPetitionSubmitted();
      }

      // Clear form data and wizard state (like "Don't save")
      clearFormAndWizardState();

      // Close the form modal
      onClose();
    } catch (error) {
      // Check if this is a duplicate with take-over option
      if (error.isDuplicate && error.duplicateInfo?.canTakeOver) {
        // Show take-over modal instead of error toast
        setDuplicateInfo(error.duplicateInfo);
        setPendingAction('save');
        setShowTakeOverModal(true);
        setIsSaving(false);
        return;
      }
      
      // Error toast is already shown by submitPetition function, so we don't show another one here
      // Only log the error for debugging
      console.error("Error saving draft:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const nextStep = async (direction) => {
    const newStep = currentStep + direction;

    // When navigating away from Organization Selection step (step 1), validate organization is selected
    if (currentStep === 1 && direction === 1) {
      // For org admins, check organizationId; for filers, require explicit selection
      let hasOrganization = false;
      if (isOrgAdmin) {
        hasOrganization = !!(organizationId || selectedOrganizationId);
      } else {
        hasOrganization = !!selectedOrganizationId;
      }
      if (!hasOrganization) {
        setFieldErrors((prev) => ({
          ...prev,
          organizationId: "Please select an organization to continue",
        }));
        markStepWithError(1);
        toast.error("Please select an organization to continue");
        return;
      }
    }

    // When navigating away from Property Address step (step 2), automatically validate address
    if (currentStep === 2 && direction === 1 && formData?.propertyStreet1?.trim() && !isAddressVerified) {
      // Store the intended step change
      setPendingStepChange(newStep);
      // Automatically run address validation
      const validation = await validatePropertyDetailsStep();
      if (validation.isValid) {
        // Address validated successfully, proceed with navigation
        setIsAddressVerified(true);
        clearStepError(2);
        if (newStep >= 1 && newStep <= totalSteps) {
          // Mark step 2 as completed since validation passed and all required fields are filled
          // Check if all address fields are filled (validation already confirmed this)
          const hasAllAddressFields = !!(formData.propertyStreet1?.trim() && 
                                        formData.propertyCity?.trim() && 
                                        formData.propertyState?.trim() && 
                                        formData.propertyZip?.trim() && 
                                        formData.propertyCounty?.trim());
          if (hasAllAddressFields) {
            if (!completedSteps.has(2)) {
              markStepCompleted(2);
            }
            if (stepsWithErrors.has(2)) {
              clearStepError(2);
            }
          }
          await autoSaveCurrentStep();
          setCurrentStep(newStep);
          wizardGoToStep(newStep);
          previousStepRef.current = newStep;
          setPendingStepChange(null);
          window.scrollTo(0, 0);
        }
      } else {
        // Address validation failed, show dialog
        setAddressValidationMessage(
          addressValidationError || "Address validation failed. Please check the address and try again."
        );
        setAddressValidationType("property");
        setShowAddressValidationDialog(true);
      }
        return;
    }

    // When navigating away from Filing Entity step (step 5), automatically validate address
    if (currentStep === 5 && direction === 1 && formData?.filingEntityStreet1?.trim() && !isFilingEntityAddressVerified) {
      setPendingStepChange(newStep);
      const validation = await validateFilingEntityAddressStep();
      if (validation.isValid) {
        setIsFilingEntityAddressVerified(true);
        clearStepError(5);
        // Mark step as completed if all fields are valid
        const filingEntityValidation = validateFilingEntity();
        if (!filingEntityValidation.hasErrors && userFilingEntityType) {
          if (!completedSteps.has(5)) {
            markStepCompleted(5);
          }
        }
        if (newStep >= 1 && newStep <= totalSteps) {
          await autoSaveCurrentStep();
          setCurrentStep(newStep);
          wizardGoToStep(newStep);
          previousStepRef.current = newStep;
          setPendingStepChange(null);
          window.scrollTo(0, 0);
        }
      } else {
        setAddressValidationMessage(
          addressValidationError || "Filing Entity address validation failed. Please check the address and try again."
        );
        setAddressValidationType("filingEntity");
        setShowAddressValidationDialog(true);
      }
      return;
    }

    // When navigating away from Right-to-Cure step (step 6), automatically validate notice address
    if (currentStep === 6 && direction === 1 && formData?.noticeAddressStreet1?.trim() && !isNoticeAddressVerified) {
      setPendingStepChange(newStep);
      const validation = await validateNoticeAddressStep();
      if (validation.isValid) {
        setIsNoticeAddressVerified(true);
        clearStepError(6);
        // Mark step as completed if all fields are valid
        const rightToCureValidation = validateRightToCureDetails();
        if (!rightToCureValidation.hasErrors) {
          if (!completedSteps.has(6)) {
            markStepCompleted(6);
          }
        }
        if (newStep >= 1 && newStep <= totalSteps) {
          await autoSaveCurrentStep();
          setCurrentStep(newStep);
          wizardGoToStep(newStep);
          previousStepRef.current = newStep;
          setPendingStepChange(null);
          window.scrollTo(0, 0);
        }
      } else {
        setAddressValidationMessage(
          addressValidationError || "Notice address validation failed. Please check the address and try again."
        );
        setAddressValidationType("notice");
        setShowAddressValidationDialog(true);
      }
      return;
    }

    // When navigating away from Borrower Details step (step 4), automatically validate borrower addresses
    if (currentStep === 4 && direction === 1) {
      const hasBorrowerAddresses = formData?.borrowers?.some(borrower => borrower.mailingStreet1?.trim());
      if (hasBorrowerAddresses) {
        const allVerified = formData.borrowers
          .filter(borrower => borrower.mailingStreet1?.trim())
          .every(borrower => borrowerAddressesVerified[borrower.id] === true);
        
        if (!allVerified) {
          setPendingStepChange(newStep);
          const validation = await validateBorrowerAddressesStep();
          if (validation.isValid) {
            const verified = {};
            formData.borrowers
              .filter(borrower => borrower.mailingStreet1?.trim())
              .forEach(borrower => {
                verified[borrower.id] = true;
              });
            setBorrowerAddressesVerified(prev => ({ ...prev, ...verified }));
            clearStepError(4);
            // Mark step as completed if all fields are valid
            const borrowerValidation = validateBorrowerDetails();
            if (!borrowerValidation.hasErrors) {
              if (!completedSteps.has(4)) {
                markStepCompleted(4);
              }
            }
            if (newStep >= 1 && newStep <= totalSteps) {
              await autoSaveCurrentStep();
              setCurrentStep(newStep);
              wizardGoToStep(newStep);
              previousStepRef.current = newStep;
              setPendingStepChange(null);
              window.scrollTo(0, 0);
            }
          } else {
            setAddressValidationMessage(
              addressValidationError || "Borrower address validation failed. Please check the addresses and try again."
            );
            setAddressValidationType("borrower");
            setAddressValidationContext({ borrowerId: validation.borrowerId });
            setShowAddressValidationDialog(true);
          }
          return;
        }
      }
    }

    // When navigating away from Loan Assignees step (step 8), automatically validate assignee addresses
    if (currentStep === 8 && direction === 1) {
      const hasAssigneeAddresses = formData?.loanAssignees?.some(assignee => assignee.street1?.trim());
      if (hasAssigneeAddresses) {
        const allVerified = formData.loanAssignees
          .filter(assignee => assignee.street1?.trim())
          .every((assignee, index) => loanAssigneeAddressesVerified[index] === true);
        
        if (!allVerified) {
          setPendingStepChange(newStep);
          const validation = await validateLoanAssigneeAddressesStep();
          if (validation.isValid) {
            const verified = {};
            formData.loanAssignees
              .filter(assignee => assignee.street1?.trim())
              .forEach((assignee, index) => {
                verified[index] = true;
              });
            setLoanAssigneeAddressesVerified(prev => ({ ...prev, ...verified }));
            clearStepError(8);
            // Mark step as completed if all fields are valid
            const loanAssigneesValidation = validateLoanAssignees();
            if (!loanAssigneesValidation.hasErrors) {
              if (!completedSteps.has(8)) {
                markStepCompleted(8);
              }
            }
            if (newStep >= 1 && newStep <= totalSteps) {
              await autoSaveCurrentStep();
              setCurrentStep(newStep);
              wizardGoToStep(newStep);
              previousStepRef.current = newStep;
              setPendingStepChange(null);
              window.scrollTo(0, 0);
            }
          } else {
            setAddressValidationMessage(
              addressValidationError || "Loan assignee address validation failed. Please check the addresses and try again."
            );
            setAddressValidationType("loanAssignee");
            setAddressValidationContext({ assigneeIndex: validation.assigneeIndex });
            setShowAddressValidationDialog(true);
          }
          return;
        }
      }
    }

    if (newStep >= 1 && newStep <= totalSteps) {
      // Mark current step as completed when moving forward only if all required fields are filled
      if (direction === 1) {
        let isStepComplete = false;
        
        // Use validation functions to check if step is complete
        switch (currentStep) {
          case 1:
            const addressValidation = validateAddressFields();
            isStepComplete = !addressValidation.hasErrors && isAddressVerified;
            break;
          case 2:
            const loanValidation = validateLoanDetails();
            isStepComplete = !loanValidation.hasErrors;
            break;
          case 3:
            const borrowerValidation = validateBorrowerDetails();
            if (!borrowerValidation.hasErrors) {
              const hasBorrowerAddresses = formData?.borrowers?.some(borrower => borrower.mailingStreet1?.trim());
              if (hasBorrowerAddresses) {
                const allBorrowerAddressesVerified = formData.borrowers
                  .filter(borrower => borrower.mailingStreet1?.trim())
                  .every(borrower => borrowerAddressesVerified[borrower.id] === true);
                isStepComplete = allBorrowerAddressesVerified;
              } else {
                isStepComplete = true;
              }
            }
            break;
          case 4:
            if (userFilingEntityType) {
              const filingEntityValidation = validateFilingEntity();
              if (!filingEntityValidation.hasErrors) {
                if (formData?.filingEntityStreet1?.trim()) {
                  isStepComplete = isFilingEntityAddressVerified;
                } else {
                  isStepComplete = true;
                }
              }
            }
            break;
          case 5:
            const rightToCureValidation = validateRightToCureDetails();
            if (!rightToCureValidation.hasErrors) {
              if (formData?.noticeAddressStreet1?.trim()) {
                isStepComplete = isNoticeAddressVerified;
              } else {
                isStepComplete = true;
              }
            }
            break;
          case 6:
            const form35BValidation = validateForm35BCompliance();
            isStepComplete = !form35BValidation.hasErrors;
            break;
          case 7:
            const loanAssigneesValidation = validateLoanAssignees();
            if (!loanAssigneesValidation.hasErrors) {
              const hasLoanAssigneeAddresses = formData?.loanAssignees?.some(assignee => assignee.street1?.trim());
              if (hasLoanAssigneeAddresses) {
                const allLoanAssigneeAddressesVerified = formData.loanAssignees
                  .filter(assignee => assignee.street1?.trim())
                  .every((assignee, index) => loanAssigneeAddressesVerified[index] === true);
                isStepComplete = allLoanAssigneeAddressesVerified;
              } else {
                isStepComplete = true;
              }
            }
            break;
          case 8:
            isStepComplete = !!(userProfile?.signatureUrl && formData?.certification_check);
            break;
          default:
            isStepComplete = checkStepHasRequiredFields(currentStep);
        }
        
        if (isStepComplete) {
          // Step is complete - mark as completed and clear any errors
          if (!completedSteps.has(currentStep)) {
            markStepCompleted(currentStep);
          }
          if (stepsWithErrors.has(currentStep)) {
            clearStepError(currentStep);
          }
        } else {
          // Step is not complete - unmark if it was previously completed
          if (completedSteps.has(currentStep)) {
            markStepIncomplete(currentStep);
          }
        }
      }

      // Auto-save current step before moving to next step
      await autoSaveCurrentStep();

      // Update both local and wizard state
      setCurrentStep(newStep);
      wizardGoToStep(newStep);
      previousStepRef.current = newStep;

      // Scroll to top on step change for better mobile UX
      window.scrollTo(0, 0);
    }
  };

  // Handle address validation dialog actions

  const handleAddressValidationEdit = () => {
    setShowAddressValidationDialog(false);

    setAddressValidationMessage("");

    setAddressValidationType("");

    setAddressValidationContext(null);

    // Clear pending step change
    setPendingStepChange(null);

    // Focus on the appropriate address input field based on type

    if (addressValidationType === "property" && autocompleteRef.current) {
      autocompleteRef.current.focus();
    }

    // For other address types, the user will need to manually navigate to the fields
  };

  const handleEditSection = (stepNumber) => {
    wizardGoToStep(stepNumber);

    setCurrentStep(stepNumber);

    window.scrollTo(0, 0);
  };

  const handleAddressValidationProceed = async () => {
    // Capture the validation type before clearing it
    const validationType = addressValidationType;
    
    setShowAddressValidationDialog(false);

    setAddressValidationMessage("");

    setAddressValidationType("");

    setAddressValidationContext(null);

    // Use pending step change if available, otherwise proceed to next step
    const newStep = pendingStepChange || (currentStep + 1);
    setPendingStepChange(null);

    if (newStep >= 1 && newStep <= totalSteps) {
      // Auto-save current step before proceeding
      await autoSaveCurrentStep();

      // Handle step completion based on validation type
      let isStepComplete = false;
      
      // For property address validation, mark as verified when proceeding anyway
      if (validationType === "property" && currentStep === 2) {
        setIsAddressVerified(true);
        clearStepError(2);
        // Check if all address fields are filled
        const addressValidation = validateAddressFields();
        isStepComplete = !addressValidation.hasErrors;
      } else if (validationType === "filingEntity" && currentStep === 5) {
        setIsFilingEntityAddressVerified(true);
        clearStepError(5);
        if (userFilingEntityType) {
          const filingEntityValidation = validateFilingEntity();
          if (!filingEntityValidation.hasErrors) {
            isStepComplete = true;
          }
        }
      } else if (validationType === "notice" && currentStep === 6) {
        setIsNoticeAddressVerified(true);
        clearStepError(5);
        const rightToCureValidation = validateRightToCureDetails();
        isStepComplete = !rightToCureValidation.hasErrors;
      } else if (validationType === "borrower" && currentStep === 4) {
        // Mark all borrower addresses as verified when proceeding anyway
        const verified = {};
        formData.borrowers.forEach((borrower) => {
          if (borrower.mailingStreet1?.trim()) {
            verified[borrower.id] = true;
          }
        });
        setBorrowerAddressesVerified(prev => ({ ...prev, ...verified }));
        clearStepError(4);
        const borrowerValidation = validateBorrowerDetails();
        isStepComplete = !borrowerValidation.hasErrors;
      } else if (validationType === "loanAssignee" && currentStep === 8) {
        // Mark all loan assignee addresses as verified when proceeding anyway
        const verified = {};
        formData.loanAssignees.forEach((assignee, index) => {
          if (assignee.street1?.trim()) {
            verified[index] = true;
          }
        });
        setLoanAssigneeAddressesVerified(prev => ({ ...prev, ...verified }));
        clearStepError(8);
        const loanAssigneesValidation = validateLoanAssignees();
        isStepComplete = !loanAssigneesValidation.hasErrors;
      } else {
        // For other cases, use the standard check
        isStepComplete = checkStepHasRequiredFields(currentStep);
      }

      // Mark step as completed and clear errors if step is complete
      if (isStepComplete) {
        if (!completedSteps.has(currentStep)) {
          markStepCompleted(currentStep);
        }
        if (stepsWithErrors.has(currentStep)) {
          clearStepError(currentStep);
        }
      }

      wizardGoToStep(newStep);
      setCurrentStep(newStep);
      previousStepRef.current = newStep;

      // Scroll to top on step change for better mobile UX
      window.scrollTo(0, 0);
    }
  };

  // Helper function to check if a step has all required fields filled
  const isStepComplete = (stepNumber) => {
    switch (stepNumber) {
      case 1: // Organization Selection
        // For org admins, organization is pre-selected, so check organizationId
        // For filers, require explicit selection via selectedOrganizationId
        if (isOrgAdmin) {
          return !!(organizationId || selectedOrganizationId);
        }
        // For filers, only return true if they've explicitly selected an organization
        return !!selectedOrganizationId;
      
      case 2: // Property Details
        const addressValidation = validateAddressFields();
        return !addressValidation.hasErrors && isAddressVerified;
      
      case 3: // Loan Details
        const loanValidation = validateLoanDetails();
        return !loanValidation.hasErrors;
      
      case 4: // Borrower Details
        const borrowerValidation = validateBorrowerDetails();
        if (borrowerValidation.hasErrors) return false;
        // Check if all borrower addresses are verified (if any addresses exist)
        const hasBorrowerAddresses = formData?.borrowers?.some(borrower => borrower.mailingStreet1?.trim());
        if (hasBorrowerAddresses) {
          const allBorrowerAddressesVerified = formData.borrowers
            .filter(borrower => borrower.mailingStreet1?.trim())
            .every(borrower => borrowerAddressesVerified[borrower.id] === true);
          return allBorrowerAddressesVerified;
        }
        return true; // No addresses to verify, step is complete if validation passes
      
      case 5: // Filing Entity
        if (!userFilingEntityType) return false;
        const filingEntityValidation = validateFilingEntity();
        if (filingEntityValidation.hasErrors) return false;
        // Check if filing entity address is verified (if address exists)
        if (formData?.filingEntityStreet1?.trim()) {
          return isFilingEntityAddressVerified;
        }
        return true; // No address to verify, step is complete if validation passes
      
      case 6: // Right-to-Cure
        const rightToCureValidation = validateRightToCureDetails();
        if (rightToCureValidation.hasErrors) return false;
        // Check if notice address is verified (if address exists)
        if (formData?.noticeAddressStreet1?.trim()) {
          return isNoticeAddressVerified;
        }
        return true; // No address to verify, step is complete if validation passes
      
      case 7: // Form 35B Compliance
        const form35BValidation = validateForm35BCompliance();
        return !form35BValidation.hasErrors;
      
      case 8: // Loan Assignees
        const loanAssigneesValidation = validateLoanAssignees();
        if (loanAssigneesValidation.hasErrors) return false;
        // Check if all loan assignee addresses are verified (if any addresses exist)
        const hasLoanAssigneeAddresses = formData?.loanAssignees?.some(assignee => assignee.street1?.trim());
        if (hasLoanAssigneeAddresses) {
          const allLoanAssigneeAddressesVerified = formData.loanAssignees
            .filter(assignee => assignee.street1?.trim())
            .every(assignee => loanAssigneeAddressesVerified[assignee.id] === true);
          return allLoanAssigneeAddressesVerified;
        }
        return true; // No addresses to verify, step is complete if validation passes
      
      case 9: // Attestation & Signatures
        return userProfile?.signatureUrl && formData?.certification_check;
      
      default:
        return false;
    }
  };

  // Comprehensive validation function that runs all validations on submit
  const validateAllSteps = async () => {
    clearAllStepErrors();
    const stepsWithValidationErrors = new Set();
    const allFieldErrors = {}; // Accumulate all field errors from all steps

    // Step 1: Organization Selection - Required for all users
    // For org admins, check organizationId; for filers, require explicit selection
    let hasOrganization = false;
    if (isOrgAdmin) {
      hasOrganization = !!(organizationId || selectedOrganizationId);
    } else {
      hasOrganization = !!selectedOrganizationId;
    }
    if (!hasOrganization) {
      stepsWithValidationErrors.add(1);
      allFieldErrors.organizationId = "Please select an organization";
    }

    // Step 2: Property Details
    const addressValidation = validateAddressFields();
    if (addressValidation.hasErrors) {
      stepsWithValidationErrors.add(2);
      Object.assign(allFieldErrors, addressValidation.errors);
    } else if (formData.propertyStreet1?.trim() && !isAddressVerified) {
      // Address validation required if address is entered
      const addressGeocodingValidation = await validatePropertyDetailsStep();
      if (!addressGeocodingValidation.isValid) {
        stepsWithValidationErrors.add(2);
        if (addressGeocodingValidation.errors) {
          Object.assign(allFieldErrors, addressGeocodingValidation.errors);
        }
      }
    }

    // Step 3: Loan Details
    const loanValidation = validateLoanDetails();
    if (loanValidation.hasErrors) {
      stepsWithValidationErrors.add(3);
      Object.assign(allFieldErrors, loanValidation.errors);
    }

    // Step 4: Borrower Details
    const borrowerValidation = validateBorrowerDetails();
    if (borrowerValidation.hasErrors) {
      stepsWithValidationErrors.add(4);
      Object.assign(allFieldErrors, borrowerValidation.errors);
    }

    // Step 5: Filing Entity
    // Check if user has visited this step at least once
    if (!visitedSteps.has(5)) {
      stepsWithValidationErrors.add(5);
      allFieldErrors.filingEntityStep = "Please visit the Filing Entity step at least once";
    } else if (!userFilingEntityType) {
      stepsWithValidationErrors.add(5);
      allFieldErrors.filingEntityType = "Filing Entity Type is required";
    } else {
      const filingEntityValidation = validateFilingEntity();
      if (filingEntityValidation.hasErrors) {
        stepsWithValidationErrors.add(5);
        Object.assign(allFieldErrors, filingEntityValidation.errors);
      }
    }

    // Step 6: Right-to-Cure Details
    const rightToCureValidation = validateRightToCureDetails();
    if (rightToCureValidation.hasErrors) {
      stepsWithValidationErrors.add(6);
      Object.assign(allFieldErrors, rightToCureValidation.errors);
    }

    // Step 7: Form 35B Compliance
    const form35BValidation = validateForm35BCompliance();
    if (form35BValidation.hasErrors) {
      stepsWithValidationErrors.add(7);
      Object.assign(allFieldErrors, form35BValidation.errors);
    }

    // Step 8: Loan Assignees
    const loanAssigneesValidation = validateLoanAssignees();
    if (loanAssigneesValidation.hasErrors) {
      stepsWithValidationErrors.add(8);
      Object.assign(allFieldErrors, loanAssigneesValidation.errors);
    }

    // Step 9: Attestation & Signatures
    if (!userProfile?.signatureUrl) {
      stepsWithValidationErrors.add(9);
      allFieldErrors.signature = "Signature is required";
    }
    if (!formData.certification_check) {
      stepsWithValidationErrors.add(9);
      allFieldErrors.certification_check = "Certification checkbox must be checked";
    }

    // Set all accumulated field errors at once (this will show inline errors in all steps)
    setFieldErrors(allFieldErrors);

    // Mark steps with errors
    stepsWithValidationErrors.forEach(step => {
      markStepWithError(step);
    });

    return {
      hasErrors: stepsWithValidationErrors.size > 0,
      stepsWithErrors: Array.from(stepsWithValidationErrors)
    };
  };

  const handleSubmit = async (e, isIntentional = false) => {
    e.preventDefault();

    // Only validate if we're actually on the last step and trying to submit
    if (currentStep !== totalSteps || !isIntentional) {
      return;
    }

    // Validate organization selection for filers (mandatory)
    if (!isOrgAdmin) {
      const finalOrganizationId = selectedOrganizationId || formData.organizationId || organizationId;
      if (!finalOrganizationId) {
        toast.error("Please select an organization before submitting the petition.");
      return;
      }
    }

    // Run comprehensive validation
    const validationResult = await validateAllSteps();
    
    if (validationResult.hasErrors) {
      toast.error(
        "Please complete all required fields before submitting your petition."
      );
      // Navigate to first step with error
      if (validationResult.stepsWithErrors.length > 0) {
        const firstErrorStep = validationResult.stepsWithErrors[0];
        wizardGoToStep(firstErrorStep);
        setCurrentStep(firstErrorStep);
        window.scrollTo(0, 0);
      }
      return;
    }

    try {
      // Prepare petition data with signature information
      // For final submit, use certification_check to set esignConsent

      const existingSignature = formData.signatures && formData.signatures.length > 0 
        ? formData.signatures[0] 
        : null;

      // Prepare petition data for FINAL SUBMISSION (not draft)
      // Note: isAllStepsCompleted must be set to true AFTER spreading formData to ensure it overrides any false value
      const petitionData = {
        ...formData,
        isAllStepsCompleted: true, // Explicitly set to true for final submission

        signatures: [
          {
            signerFullName: `${formData.signerFirstName || ""} ${
              formData.signerMiddleInitial || ""
            } ${formData.signerLastName || ""}`.trim(),

            signerTitle: formData.signerTitle || getUserRole(user) || "User",

            signerEmail: formData.signerEmail || "",

            // Use certification_check value for esignConsent (user must have checked it to get here)
            esignConsent: formData.certification_check || false,

            signatureDrawnOrTyped: existingSignature?.signatureDrawnOrTyped || userProfile?.signatureUrl || "",

            signedAt: new Date().toISOString(),

            signerIp: "", // Will be filled by backend

            otpCode: "", // Will be filled by backend
          },
        ],
      };

      // Use selected organization ID if available (for filers), otherwise fall back to formData.organizationId or organizationId
      const finalOrganizationId = selectedOrganizationId || formData.organizationId || organizationId;
      
      // Ensure organizationId is included in petition data
      const finalPetitionData = {
        ...petitionData,
        organizationId: finalOrganizationId,
        isAllStepsCompleted: true, // Ensure it's still true after adding organizationId
      };

      // Add takeOverToUserId if this is a taken over petition
      if (isTakenOverPetition && user?.id) {
        finalPetitionData.takeOverToUserId = user.id;
        finalPetitionData.id = takenOverPetitionId; // Include the original petition ID
        finalPetitionData.isAllStepsCompleted = true; // Ensure it's still true for taken over petitions
      }

      // Submit petition using API - false means NOT a draft (final submission)
      await submitPetition(finalPetitionData, false, isTakenOverPetition ? takenOverPetitionId : null);

      // Notify parent component that petition was submitted successfully

      if (onPetitionSubmitted) {
        onPetitionSubmitted();
      }

      // Clear form data and wizard state (like "Don't save")
      clearFormAndWizardState();

      onClose();
    } catch (error) {
      // Check if this is a duplicate with take-over option
      if (error.isDuplicate && error.duplicateInfo?.canTakeOver) {
        // Show take-over modal instead of error toast
        setDuplicateInfo(error.duplicateInfo);
        setPendingAction('submit');
        setShowTakeOverModal(true);
        return;
      }
      
      // Error is already handled in the submitPetition function with toast
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        // For org admins, use organizationData if available, otherwise fallback to organizationFromAuth or organizationFromContext
        const orgAdminOrgData = isOrgAdmin && !organizationData 
          ? (organizationFromAuth || organizationFromContext)
          : organizationData;
        return (
          <Step1OrganizationSelection
            selectedOrganizationId={selectedOrganizationId || organizationId}
            selectedOrganizationData={organizationData || (isOrgAdmin ? (organizationFromAuth || organizationFromContext) : null)}
            onSelect={handleOrganizationSelect}
            isOrgAdmin={isOrgAdmin}
            organizationId={organizationId}
            organizationData={organizationData || (isOrgAdmin ? (organizationFromAuth || organizationFromContext) : null)}
            organizationLoading={organizationLoading}
            fieldErrors={fieldErrors}
          />
        );

      case 2:
        return (
          <Step2PropertyDetails
          isAddressVerified={isAddressVerified}
          loadError={loadError}
          isLoaded={isLoaded}
          autocompleteRef={autocompleteRef}
          fieldErrors={fieldErrors}
          formData={formData}
          handleInputChange={handleInputChange}
          handleAddressInput={handleAddressInput}
          handleKeyDown={handleKeyDown}
          setShowPredictions={setShowPredictions}
          showPredictions={showPredictions}
          predictions={predictions}
          selectedPredictionIndex={selectedPredictionIndex}
          selectPrediction={selectPrediction}
          addressValidationError={addressValidationError}
          isValidatingAddress={isValidatingAddress}
          isLoadingPredictions={isLoadingPredictions}
        />
        );

      case 3:
        return (
          <Step3LoanDetails
            commonDataError={commonDataError}
            commonDataLoading={commonDataLoading}
            fieldErrors={fieldErrors}
            formData={formData}
            handleInputChange={handleInputChangeWithMinLogic}
            getLoanTypes={getLoanTypes}
            getLienPositions={getLienPositions}
          />
        );

      case 4:
        return (
          <Step4BorrowerDetails
              formData={formData}
              fieldErrors={fieldErrors}
              setFieldErrors={setFieldErrors}
              setFormData={setFormData}
              updateBorrower={updateBorrower}
              removeBorrower={removeBorrower}
              addBorrower={addBorrower}
              borrowerPredictions={borrowerPredictions}
              showBorrowerPredictions={showBorrowerPredictions}
              setShowBorrowerPredictions={setShowBorrowerPredictions}
              handleBorrowerAddressInput={handleBorrowerAddressInput}
              handleBorrowerPredictionClick={handleBorrowerPredictionClick}
              isLoadingBorrowerPredictions={isLoadingBorrowerPredictions}
              borrowerAddressValidationErrors={borrowerAddressValidationErrors}
              selectedBorrowerPredictionIndex={selectedBorrowerPredictionIndex}
              setSelectedBorrowerPredictionIndex={setSelectedBorrowerPredictionIndex}
            />
        );

      case 5:
        return (
          <Step5FilingEntity
            organizationLoading={organizationLoading}
            organizationData={organizationData}
            fieldErrors={fieldErrors}
            formData={formData}
            handleInputChange={handleInputChange}
            profileLoading={profileLoading}
            userFilingEntityType={userFilingEntityType}
            filingEntityTypes={filingEntityTypes}
          />
        );

      case 6:
        return (
          <Step6RightToCure
            formData={formData}
            fieldErrors={fieldErrors}
            setFormData={setFormData}
            handleInputChange={handleInputChange}
            handleNoticeAddressInput={handleNoticeAddressInput}
            handleNoticePredictionClick={handleNoticePredictionClick}
            noticePredictions={noticePredictions}
            noticeAddressValidationErrors={noticeAddressValidationErrors}
            isLoadingNoticePredictions={isLoadingNoticePredictions}
            showNoticePredictions={showNoticePredictions}
            setShowNoticePredictions={setShowNoticePredictions}
            selectedNoticePredictionIndex={selectedNoticePredictionIndex}
            setSelectedNoticePredictionIndex={setSelectedNoticePredictionIndex}
          />
        );

      case 7:
        return (
          <Step7Form35BCompliance
            formData={formData}
            setFormData={setFormData}
            fieldErrors={fieldErrors}
          />
        );

      case 8:
        return (
          <Step8LoanAssignees
            commonDataError={commonDataError}
            commonDataLoading={commonDataLoading}
            formData={formData}
            fieldErrors={fieldErrors}
            updateLoanAssignee={updateLoanAssignee}
            removeLoanAssignee={removeLoanAssignee}
            addLoanAssignee={addLoanAssignee}
            getAssigneeTypes={getAssigneeTypes}
            getAssigneeRoles={getAssigneeRoles}
            handleLoanAssigneeAddressInput={handleLoanAssigneeAddressInput}
            handleLoanAssigneePredictionClick={handleLoanAssigneePredictionClick}
            isLoadingLoanAssigneePredictions={isLoadingLoanAssigneePredictions}
            showLoanAssigneePredictions={showLoanAssigneePredictions}
            loanAssigneePredictions={loanAssigneePredictions}
            setShowLoanAssigneePredictions={setShowLoanAssigneePredictions}
            selectedLoanAssigneePredictionIndex={selectedLoanAssigneePredictionIndex}
            setSelectedLoanAssigneePredictionIndex={
              setSelectedLoanAssigneePredictionIndex
            }
            loanAssigneeAddressValidationErrors={loanAssigneeAddressValidationErrors}
          />
        );

      case 9:
        return (
          <Step9PetitionAttestation
            formData={formData}
            handleInputChange={handleInputChange}
            userProfile={userProfile}
            onClose={onClose}
          />
        );

      case 10:
        return (
          <Step10ReviewSubmit
            formData={formData}
            handleEditSection={handleEditSection}
            getLoanTypes={getLoanTypes}
            getLienPositions={getLienPositions}
            filingEntityTypes={filingEntityTypes}
            getAssigneeTypes={getAssigneeTypes}
            getAssigneeRoles={getAssigneeRoles}
            userProfile={userProfile}
          />
        );

      default:
        return null;
    }
  };

  // Transform takeover petition API response to formData format
  const transformTakeOverPetitionData = (apiData) => {
    if (!apiData) return null;

    const details = apiData;
    const mappedBorrowers = [];

    (details.borrowers || []).forEach((b, idx) => {
      const isPrimary = b.borrowerIsPrimary === true;
      mappedBorrowers.push({
        id: b.id || idx + 1,
        firstName: b.firstName || "",
        middleName: b.middleName || "",
        lastName: b.lastName || "",
        suffix: b.suffix || "",
        borrowerIsPrimary: isPrimary,
        mailingStreet1: b.mailingStreet1 || "",
        mailingCity: b.mailingCity || "",
        mailingState: b.mailingState || "",
        mailingZip: b.mailingZip || "",
        phone: b.phone || "",
        email: b.email || "",
      });
    });

    // Ensure at least one primary borrower
    if (mappedBorrowers.length > 0 && !mappedBorrowers.some(b => b.borrowerIsPrimary)) {
      mappedBorrowers[0].borrowerIsPrimary = true;
    }

    return {
      // Property Details
      propertyStreet1: details.property?.propertyStreet1 || "",
      propertyStreet2: details.property?.propertyStreet2 || "",
      propertyCity: details.property?.propertyCity || "",
      propertyState: details.property?.propertyState || "MA",
      propertyZip: details.property?.propertyZip || "",
      propertyCounty: details.property?.propertyCounty || "",
      assessorParcelId: details.property?.assessorParcelId || "",

      // Loan Details
      isMinApplicable: details.loan?.minNumber ? "yes" : "no",
      minNumber: details.loan?.minNumber || "",
      loanNumber: details.loan?.loanNumber || "",
      petitionLoanTypeId: details.loan?.petitionLoanTypeId || "",
      petitionLoanTypeName: details.loan?.petitionLoanTypeName || "",
      lienPosition: details.loan?.lienPosition ?? "",
      originationDate: details.loan?.originationDate
        ? details.loan.originationDate.split("T")[0]
        : "",
      originalPrincipalAmount: details.loan?.originalPrincipalAmount || 0,
      currentPrincipalBalance: details.loan?.currentPrincipalBalance || 0,
      interestRatePercent: details.loan?.interestRatePercent || null,
      variableRate: details.loan?.variableRate || false,
      interestOnly: details.loan?.interestOnly || false,
      negativeAmortization: details.loan?.negativeAmortization || false,
      monthlyPaymentAmount: details.loan?.monthlyPaymentAmount || 0,
      delinquencyDaysAtFiling: details.loan?.delinquencyDaysAtFiling || null,
      mortgageBrokerLicenseNumber: details.loan?.mortgageBrokerLicenseNumber || "",
      mortgageLoanOriginatorLicenseNumber: details.loan?.mortgageLoanOriginatorLicenseNumber || "",

      // Borrowers
      borrowers: mappedBorrowers.length > 0 ? mappedBorrowers : defaultFormData.borrowers,

      // Filing Entity - DO NOT pre-fill, user must select organization and fill this themselves
      filingEntityLegalName: "",
      filingEntityTypeId: null,
      filingEntityStreet1: "",
      filingEntityStreet2: "",
      filingEntityCity: "",
      filingEntityState: "",
      filingEntityZip: "",
      filingContactName: "",
      filingContactEmail: "",
      filingContactPhone: "",
      nmlsLicenseNumber: "",
      stateLicenseNumber: "",
      stateLicenseState: "",

      // Right-to-Cure
      noticeSent: details.rightToCure?.noticeSent || false,
      noticeDate: details.rightToCure?.noticeDate
        ? details.rightToCure.noticeDate.split("T")[0]
        : "",
      amountInDefault: details.rightToCure?.amountInDefault || 0,
      daysDelinquentAtNotice: details.rightToCure?.daysDelinquentAtNotice || 0,
      cureExpirationDate: details.rightToCure?.cureExpirationDate
        ? details.rightToCure.cureExpirationDate.split("T")[0]
        : "",
      noticeAddressStreet1: details.rightToCure?.noticeAddressStreet1 || "",
      noticeAddressCity: details.rightToCure?.noticeAddressCity || "",
      noticeAddressState: details.rightToCure?.noticeAddressState || "",
      noticeAddressZip: details.rightToCure?.noticeAddressZip || "",
      manualOverrideReason: details.rightToCure?.manualOverrideReason || "",

      // Form 35B Compliance
      certainMortgageLoan: details.affidavit?.certainMortgageLoan ?? null,
      form35bComplianceAffidavitPdf: details.affidavit?.form35bComplianceAffidavitPdf || "",
      form35bNonApplicabilityAffidavitPdf: details.affidavit?.form35bNonApplicabilityAffidavitPdf || "",
      affiantName: details.affidavit?.affiantName || "",
      affiantTitle: details.affidavit?.affiantTitle || "",
      affidavitExecutionDate: details.affidavit?.affidavitExecutionDate
        ? details.affidavit.affidavitExecutionDate.split("T")[0]
        : "",

      // Loan Assignees
      loanAssignees: details.loanAssignees?.map((a, idx) => ({
        assigneeName: a.assigneeName || "",
        assigneeTypeId: a.assigneeTypeId || "",
        assigneeRoleId: a.assigneeRoleId || "",
        street1: a.street1 || "",
        street2: a.street2 || "",
        city: a.city || "",
        addressState: a.addressState || "",
        zip: a.zip || "",
        licenseNumber: a.licenseNumber || "",
        licenseState: a.licenseState || "",
      })) || [],

      // Additional
      documents: details.documents || [],
      isAllStepsCompleted: false,
      organizationId: null, // DO NOT pre-fill, user must select organization on step 1
      
      // Signer fields - will be filled with current user's details in handleTakeOverConfirm
      signerFirstName: "",
      signerMiddleInitial: "",
      signerLastName: "",
      signerEmail: "",
      signerTitle: "",
      certification_check: false,
      
      // Signatures - will be pre-filled with current user's details in handleTakeOverConfirm
      signatures: defaultFormData.signatures,
    };
  };

  if (!isOpen) return null;

  // Handle take-over confirmation - pre-fill form instead of submitting
  const handleTakeOverConfirm = async (petitionData, duplicateInfoData) => {
    if (!petitionData) {
      toast.error("Failed to load petition data for takeover");
      return;
    }

    setShowTakeOverModal(false);
    
    // Transform the API data to formData format
    const transformedData = transformTakeOverPetitionData(petitionData);
    
    if (transformedData && user) {
      // Pre-fill signature section with current user's details (person taking over)
      const signerFirstName = user.firstName || "";
      const signerMiddleInitial = user.middleName
        ? user.middleName.charAt(0).toUpperCase()
        : "";
      const signerLastName = user.lastName || "";
      const signerEmail = user.email || "";
      const signerTitle = getUserRole(user) || "User";
      const signerFullName = [
        signerFirstName,
        signerMiddleInitial,
        signerLastName,
      ]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      // Merge user signature data with transformed data
      const finalFormData = {
        ...transformedData,
        signerFirstName,
        signerMiddleInitial,
        signerLastName,
        signerEmail,
        signerTitle,
        signatures: [
          {
            signerFullName,
            signerTitle,
            signerEmail,
            esignConsent: false,
            signatureDrawnOrTyped: userProfile?.signatureUrl || "",
            signedAt: "",
            signerIp: "",
            otpCode: "",
          },
        ],
      };
      
      // Set the form data with the transformed petition data and user signature
      setFormData(finalFormData);
      
      // Mark as taken over petition
      setIsTakenOverPetition(true);
      setTakenOverPetitionId(duplicateInfoData?.petitionId || petitionData.id);
      
      // Clear any pending actions since we're not submitting
      setPendingAction(null);
      setShouldTakeOver(false);
      
      // Reset selected organization so user must select on step 1
      setSelectedOrganizationId(null);
      
      // Show success message
      toast.success("Petition data loaded. Please select an organization and review all steps before submitting.");
      
      // Navigate to step 1 to start reviewing (user must select organization)
      wizardGoToStep(1);
    } else {
      toast.error("Failed to process petition data");
    }
  };

  const handleTakeOverCancel = () => {
    setShowTakeOverModal(false);
    setDuplicateInfo(null);
    setShouldTakeOver(false);
    setPendingAction(null);
  };

  // Retry save draft with take-over
  const handleRetrySaveDraft = async () => {
    setIsSaving(true);
    try {
      const existingSignature = formData.signatures && formData.signatures.length > 0 
        ? formData.signatures[0] 
        : null;

      const petitionData = {
        isAllStepsCompleted: false,
        ...formData,
        id: duplicateInfo?.petitionId || null, // Set the duplicate petition ID to update it
        signatures: [
          {
            signerFullName: `${formData.signerFirstName || ""} ${
              formData.signerMiddleInitial || ""
            } ${formData.signerLastName || ""}`.trim(),
            signerTitle: formData.signerTitle || getUserRole(user) || "User",
            signerEmail: formData.signerEmail || "",
            esignConsent: formData.certification_check ?? existingSignature?.esignConsent ?? false,
            signatureDrawnOrTyped: existingSignature?.signatureDrawnOrTyped || userProfile?.signatureUrl || "",
            signedAt: existingSignature?.signedAt || (existingSignature ? "" : new Date().toISOString()),
            signerIp: existingSignature?.signerIp || "",
            otpCode: existingSignature?.otpCode || "",
          },
        ],
        takeOverToUserId: user?.id || null,
      };

      const finalOrganizationId = selectedOrganizationId || formData.organizationId || organizationId;
      
      const finalDraftData = {
        ...petitionData,
        organizationId: finalOrganizationId,
      };

      // Pass the duplicate petition ID to update the existing petition (like editing)
      await submitPetition(finalDraftData, true, duplicateInfo?.petitionId || null);

      if (onPetitionSubmitted) {
        onPetitionSubmitted();
      }

      clearFormAndWizardState();
      onClose();
    } catch (error) {
      // Check if this is still a duplicate error (shouldn't happen with takeOverToUserId, but handle it)
      if (error.isDuplicate && error.duplicateInfo?.canTakeOver) {
        // Show error - this shouldn't happen if takeOverToUserId is set correctly
        toast.error("Unable to take over petition. Please try again.");
        setShowTakeOverModal(true);
        setDuplicateInfo(error.duplicateInfo);
      } else {
        // Other errors are already handled by submitPetition
        console.error("Error saving draft with take-over:", error);
      }
    } finally {
      setIsSaving(false);
      setShouldTakeOver(false);
    }
  };

  // Retry final submit with take-over
  const handleRetrySubmit = async () => {
    try {
      const existingSignature = formData.signatures && formData.signatures.length > 0 
        ? formData.signatures[0] 
        : null;

      const petitionData = {
        isAllStepsCompleted: true,
        ...formData,
        id: duplicateInfo?.petitionId || null, // Set the duplicate petition ID to update it
        signatures: [
          {
            signerFullName: `${formData.signerFirstName || ""} ${
              formData.signerMiddleInitial || ""
            } ${formData.signerLastName || ""}`.trim(),
            signerTitle: formData.signerTitle || getUserRole(user) || "User",
            signerEmail: formData.signerEmail || "",
            esignConsent: formData.certification_check || false,
            signatureDrawnOrTyped: existingSignature?.signatureDrawnOrTyped || userProfile?.signatureUrl || "",
            signedAt: new Date().toISOString(),
            signerIp: "",
            otpCode: "",
          },
        ],
        takeOverToUserId: user?.id || null,
      };

      const finalOrganizationId = selectedOrganizationId || formData.organizationId || organizationId;
      
      const finalPetitionData = {
        ...petitionData,
        organizationId: finalOrganizationId,
      };

      // Pass the duplicate petition ID to update the existing petition (like editing)
      await submitPetition(finalPetitionData, false, duplicateInfo?.petitionId || null);

      if (onPetitionSubmitted) {
        onPetitionSubmitted();
      }

      clearFormAndWizardState();
      onClose();
    } catch (error) {
      // Check if this is still a duplicate error (shouldn't happen with takeOverToUserId, but handle it)
      if (error.isDuplicate && error.duplicateInfo?.canTakeOver) {
        // Show error - this shouldn't happen if takeOverToUserId is set correctly
        toast.error("Unable to take over petition. Please try again.");
        setShowTakeOverModal(true);
        setDuplicateInfo(error.duplicateInfo);
      } else {
        // Other errors are already handled by submitPetition
        console.error("Error submitting with take-over:", error);
      }
    } finally {
      setShouldTakeOver(false);
    }
  };

  return (
    <React.Fragment>
      {/* Take Over Petition Modal */}
      <TakeOverPetitionModal
        isOpen={showTakeOverModal}
        duplicateInfo={duplicateInfo}
        onConfirm={handleTakeOverConfirm}
        onCancel={handleTakeOverCancel}
      />

      {/* Address Validation Dialog */}

      {showAddressValidationDialog && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {addressValidationType === "property" &&
                    "Property Address Validation"}

                  {addressValidationType === "filingEntity" &&
                    "Filing Entity Address Validation"}

                  {addressValidationType === "borrower" &&
                    "Borrower Address Validation"}

                  {addressValidationType === "notice" &&
                    "Notice Address Validation"}

                  {addressValidationType === "loanAssignee" &&
                    "Loan Assignee Address Validation"}

                  {!addressValidationType && "Address Validation"}
                </h5>

                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddressValidationDialog(false)}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body">
                <div className="text-center mb-3">
                  <i
                    className="fas fa-exclamation-triangle text-warning"
                    style={{ fontSize: "3rem" }}
                  ></i>
                </div>

                <p className="text-center mb-3">
                  {addressValidationMessage ||
                    "We couldn't verify the address you entered. Would you like to correct it, or continue to the next step with the current address?"}
                </p>
              </div>

              <div className="modal-footer justify-content-center">
                <button
                  type="button"
                  className="dashboard-btn-refresh me-2"
                  onClick={handleAddressValidationEdit}
                >
                  <i className="fas fa-edit me-2"></i>

                  {addressValidationType === "borrower" ||
                  addressValidationType === "loanAssignee"
                    ? "Edit Addresses"
                    : "Edit Address"}
                </button>

                <button
                  type="button"
                  className="dashboard-btn-create"
                  onClick={handleAddressValidationProceed}
                >
                  <i className="fas fa-arrow-right me-2"></i>
                  Proceed Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Confirmation Dialog */}
      {showCloseConfirmDialog && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1070 }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Unsaved changes</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCloseConfirmDialog(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-4">Your petition changes are not saved.</p>
                <div className="d-flex justify-content-between gap-2">
                  <button
                    type="button"
                    className="dashboard-btn-refresh"
                    onClick={() => setShowCloseConfirmDialog(false)}
                  >
                    Cancel
                  </button>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="dashboard-btn-refresh"
                      onClick={handleDiscardAndClose}
                    >
                      Don't save
                    </button>
                    <button
                      type="button"
                      className="dashboard-btn-create"
                      onClick={handleSaveDraftAndClose}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving…" : "Save as draft"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Modal */}
      <div
        className="modal fade show d-block petition-steps-modal"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
        tabIndex="-1"
      >
        <div className="modal-dialog petition-steps-modal-dialog modal-dialog-centered">
          <div className="modal-content petition-steps-modal-content">
            <div className="modal-header text-white theme-bg petition-steps-header d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <h5 className="modal-title mb-0">Foreclosure Petition Filing</h5>
                {isTakenOverPetition && (
                  <span className="badge bg-warning text-dark ms-2" title="This petition was taken over from another user">
                    <i className="fas fa-exchange-alt me-1"></i>
                    Taken Over
                  </span>
                )}
              </div>
              
              <div className="d-flex align-items-center gap-3">
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={handleCloseAttempt}
                aria-label="Close"
              ></button>
              </div>
            </div>

            <div className="modal-body petition-steps-body">
              {/* Desktop Sidebar */}

              <div className="petition-steps-sidebar d-none d-lg-block">
                <PetitionStepper />
              </div>

              {/* Form Content */}

              <div className="petition-steps-form">
                <div className="container-fluid">
                  {/* Mobile Stepper */}

                  <div className="d-lg-none mb-3">
                    <PetitionStepper />
                  </div>

                  <header className="border-bottom mb-3">
                    <p className="font-base text-muted">
                      Complete the 9 steps below to submit your foreclosure
                      petition details.
                    </p>
                  </header>

                  <div className="position-relative">
                    <p className="font-base fw-bold">
                      Step {currentStep} of {totalSteps}
                    </p>

                    <form onSubmit={handleSubmit}>{renderStep()}</form>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer petition-steps-footer">
              {/* Navigation Buttons */}

              <div className="container-fluid">
                <div className="d-flex justify-content-between align-items-center">
                  <button
                    type="button"
                    className={`btn create-org-btn ${
                      currentStep === 1 ? "d-none" : ""
                    }`}
                    onClick={() => nextStep(-1)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="bi bi-arrow-left me-2"
                      viewBox="0 0 16 16"
                    >
                      <path
                        fillRule="evenodd"
                        d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"
                      />
                    </svg>
                    Previous Step
                  </button>

                  <div className="d-flex gap-2">
                    {/* Save as Draft Button */}

                    <button
                      type="button"
                      className="dashboard-btn-refresh"
                      onClick={saveCurrentStep}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Saving...
                        </>
                      ) : (
                        "Save as Draft"
                      )}
                    </button>

                    {/* Next Step, Review, or Submit Button */}

                    {currentStep < 9 ? (
                      <button
                        type="button"
                        className="dashboard-btn-create"
                        onClick={() => nextStep(1)}
                      >
                        Next Step
                      </button>
                    ) : currentStep === 9 ? (
                      <button
                        type="button"
                        className="dashboard-btn-create"
                        onClick={() => nextStep(1)}
                      >
                        Review Petition
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="dashboard-btn-create"
                        onClick={async () => {
                          await handleSubmit(
                            { preventDefault: () => {} },
                            true
                          );
                        }}
                        disabled={petitionLoading}
                      >
                        {petitionLoading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Submitting...
                          </>
                        ) : (
                          "Submit Petition"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default PetitionSteps;
