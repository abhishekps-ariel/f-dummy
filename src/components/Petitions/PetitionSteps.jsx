import React, { useState, useEffect, useRef } from "react";

import { toast } from "react-toastify";

import { useJsApiLoader } from "@react-google-maps/api";

import Config from "../../config/index";

import { usePetitionCommonData } from "../../hooks/usePetitionCommonData";

import { usePetitions } from "../../hooks/usePetitions";

import { useAuth } from "../../context/AuthContext";

import { usePetitionWizard } from "../../context/PetitionWizardContext";

import { getUserById, getSignatureById } from "../../services/authService";

import { getFilingEntityTypes } from "../../services/commonService";

import { getOrganizationById } from "../../services/organizationService";

import PetitionStepper from "./PetitionStepper";

import CustomDropdown from "../shared/CustomDropdown";

import "../shared/CustomDropdown.css";
import Step1PropertyDetails from "./MultiStepForm/Step1PropertyDetails";
import Step2LoanDetails from "./MultiStepForm/Step2LoanDetails";
import Step3BorrowerDetails from "./MultiStepForm/Step3BorrowerDetails";
import Step4FilingEntity from "./MultiStepForm/Step4FilingEntity";
import Step5RightToCure from "./MultiStepForm/Step5RightToCure";
import Step6Form35BCompliance from "./MultiStepForm/Step6Form35BCompliance";
import Step7LoanAssignees from "./MultiStepForm/Step7LoanAssignees";
import Step8PetitionAttestation from "./MultiStepForm/Step8PetitionAttestation";
import Step9ReviewSubmit from "./MultiStepForm/Step9ReviewSubmit";

// Static libraries array to prevent LoadScript reload

const LIBRARIES = ["places"];

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
    completedSteps,
    resetWizard,
  } = usePetitionWizard();

  const [currentStep, setCurrentStep] = useState(1);

  const totalSteps = 9;

  // Sync wizard state with component state

  useEffect(() => {
    setCurrentStep(wizardCurrentStep);
  }, [wizardCurrentStep]);
  // Validate the step being left when navigating forward via the stepper
  const previousStepRef = useRef(1);
  useEffect(() => {
    const prev = previousStepRef.current;
    const next = wizardCurrentStep;
    // Only validate when moving forward
    if (next > prev) {
      let validationResult = { hasErrors: false };
      if (prev === 1) {
        validationResult = validateAddressFields();
      } else if (prev === 2) {
        validationResult = validateLoanDetails();
      } else if (prev === 3) {
        validationResult = validateBorrowerDetails();
      } else if (prev === 4) {
        // Require filing entity type set before leaving Filing Entity step
        if (!userFilingEntityType) {
          toast.error(
            "Please set your filing entity type in your profile before proceeding."
          );
          validationResult = { hasErrors: true };
        }
      }
      if (validationResult?.hasErrors) {
        // Revert navigation if validation fails
        wizardGoToStep(prev);
        setCurrentStep(prev);
        window.scrollTo(0, 0);
        return;
      }
    }
    previousStepRef.current = wizardCurrentStep;
  }, [wizardCurrentStep]);

  // User profile and filing entity type state

  const [userProfile, setUserProfile] = useState(null);

  const [filingEntityTypes, setFilingEntityTypes] = useState([]);

  const [userFilingEntityType, setUserFilingEntityType] = useState(null);

  const [profileLoading, setProfileLoading] = useState(true);

  // Organization data state

  const [organizationData, setOrganizationData] = useState(null);

  const [organizationLoading, setOrganizationLoading] = useState(false);

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
    hasOrganizationAccess,
    loading: petitionLoading,
  } = usePetitions();

  // Get user info from auth context

  const { user } = useAuth();

  // Google Places API state

  // eslint-disable-next-line no-unused-vars

  const [autocomplete, setAutocomplete] = useState(null);

  const [predictions, setPredictions] = useState([]);

  const [showPredictions, setShowPredictions] = useState(false);

  const [selectedPredictionIndex, setSelectedPredictionIndex] = useState(-1);

  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);

  const [isValidatingAddress, setIsValidatingAddress] = useState(false);

  const [addressValidationError, setAddressValidationError] = useState("");

  const [isAddressVerified, setIsAddressVerified] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});

  const [isSaving, setIsSaving] = useState(false);

  const [hasSavedDraft, setHasSavedDraft] = useState(false);

  const [showAddressValidationDialog, setShowAddressValidationDialog] =
    useState(false);

  const [addressValidationMessage, setAddressValidationMessage] = useState("");
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

  const [addressValidationType, setAddressValidationType] = useState(""); // 'property', 'borrower', 'notice', 'loanAssignee'

  const [addressValidationContext, setAddressValidationContext] =
    useState(null); // Additional context like borrowerId or assigneeIndex

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
      if (!organization?.id) return;

      setOrganizationLoading(true);

      try {
        // Fetch full organization details using the new API structure

        const orgResponse = await getOrganizationById(organization.id);

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

    loadOrganizationData();
  }, [organization?.id]);

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

        signerTitle: user.role || "Filer User",
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

  // Default form data structure

  const defaultFormData = {
    // Step 1: Property Details

    propertyStreet1: "",

    propertyStreet2: "",

    propertyCity: "",

    propertyState: "MA",

    propertyZip: "",

    propertyCounty: "",

    assessorParcelId: "",

    // Step 2: Loan Details

    minNumber: "",

    loanNumber: "",

    petitionLoanTypeId: "",

    petitionLoanTypeName: "",

    lienPosition: "",

    originationDate: "",

    originalPrincipalAmount: 0,

    currentPrincipalBalance: 0,

    interestRatePercent: 0,

    variableRate: false,

    interestOnly: false,

    negativeAmortization: false,

    monthlyPaymentAmount: 0,

    delinquencyDaysAtFiling: 0,

    // Step 3: Borrower Details

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

    // Step 4: Filing Entity

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

    // Step 5: Right-to-Cure

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

    // Step 6: Form 35B Compliance

    certainMortgageLoan: false,

    form35bComplianceAffidavitPdf: "",

    form35bNonApplicabilityAffidavitPdf: "",

    affiantName: "",

    affiantTitle: "",

    affidavitExecutionDate: "",

    // Step 7: Loan Assignees

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

    // Step 8: Petition Attestation & Signatures

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

  const [formData, setFormData] = useState(loadFormDataFromStorage);

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
        const signerTitle = user.role || "Filer User";
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

      if (typeof resetWizard === "function") {
        resetWizard();
      } else {
        setCurrentStep(1);
        wizardGoToStep(1);
      }
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

            // Check city match (more flexible matching)

            addressComponents.forEach((component) => {
              const types = component.types;

              if (
                types.includes("locality") ||
                types.includes("administrative_area_level_2")
              ) {
                const componentCity = component.long_name.toLowerCase();

                const inputCity = formData.propertyCity.toLowerCase();

                if (
                  componentCity.includes(inputCity) ||
                  inputCity.includes(componentCity)
                ) {
                  cityMatch = true;
                }
              }

              if (types.includes("postal_code")) {
                if (component.long_name === formData.propertyZip) {
                  zipMatch = true;
                }
              }

              if (types.includes("administrative_area_level_2")) {
                const componentCounty = component.long_name.toLowerCase();

                const inputCounty = formData.propertyCounty.toLowerCase();

                if (
                  componentCounty.includes(inputCounty) ||
                  inputCounty.includes(componentCounty)
                ) {
                  countyMatch = true;
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

    setFieldErrors(errors);

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

    // NOTE: Removed precision handling for decimal fields (interestRatePercent, etc.)

    // Previously had complex logic that was converting 70 to 69.999

    // Now all decimal fields store exactly what user types

    // Handle numeric inputs for integer fields

    let processedValue = value;

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

    // MIN Number is required if Loan Number is not provided

    if (!formData.minNumber.trim() && !formData.loanNumber.trim()) {
      errors.minNumber = "Either MIN Number or Loan Number is required";

      hasErrors = true;
    }

    // Loan Number is required if MIN Number is not provided

    if (!formData.loanNumber.trim() && !formData.minNumber.trim()) {
      errors.loanNumber = "Either Loan Number or MIN Number is required";

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
      formData.delinquencyDaysAtFiling < 0
    ) {
      errors.delinquencyDaysAtFiling =
        "Delinquency Days at Filing is required and must be 0 or greater";

      hasErrors = true;
    }

    setFieldErrors(errors);

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

    setFieldErrors(errors);

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

    setFieldErrors(errors);

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

    setFieldErrors(errors);

    return { hasErrors, errors };
  };

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

    setFieldErrors(errors);

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

    setFieldErrors(errors);

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
      // Check organization access

      if (!hasOrganizationAccess) {
        toast.error(
          "You must be part of an organization to save petition drafts."
        );

        setIsSaving(false);

        return;
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

            signerTitle: formData.signerTitle || user?.role || "Filer",

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

      // Submit petition as draft using API

      await submitPetition(petitionData, true); // Pass isDraft: true

      // Notify parent component that petition was saved as draft

      if (onPetitionSubmitted) {
        onPetitionSubmitted();
      }

      // Clear form data and wizard state (like "Don't save")
      clearFormAndWizardState();

      // Close the form modal
      onClose();
    } catch (error) {
      toast.error("Failed to save step. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const nextStep = async (direction) => {
    const newStep = currentStep + direction;

    // Check if user has set filing entity type when trying to proceed from step 4

    if (currentStep === 4 && direction === 1 && !userFilingEntityType) {
      toast.error(
        "Please set your filing entity type in your profile before proceeding."
      );

      return;
    }

    // Full validation for Next Step (including address validation for step 1)

    if (currentStep === 1 && direction === 1) {
      // First validate basic fields

      const basicValidation = validateAddressFields();

      if (basicValidation.hasErrors) {
        // Field errors are already set in the validation function

        return;
      }

      // Then validate address with Geocoding API

      const addressValidation = await validatePropertyDetailsStep();

      if (!addressValidation.isValid) {
        // Show dialog instead of blocking

        setAddressValidationMessage(
          addressValidationError || "Address validation failed"
        );

        setShowAddressValidationDialog(true);

        return;
      }
    }

    // Validate Loan Details step before proceeding

    if (currentStep === 2 && direction === 1) {
      const validation = validateLoanDetails();

      if (validation.hasErrors) {
        return;
      }
    }

    // Validate Borrower Details step before proceeding

    if (currentStep === 3 && direction === 1) {
      const validation = validateBorrowerDetails();

      if (validation.hasErrors) {
        return;
      }

      // Validate borrower addresses

      let hasAddressErrors = false;

      for (const borrower of formData.borrowers) {
        if (
          borrower.mailingStreet1 &&
          borrower.mailingCity &&
          borrower.mailingState &&
          borrower.mailingZip
        ) {
          const addressValidation = await validateBorrowerAddressWithGeocoding(
            borrower.id
          );

          if (!addressValidation.isValid) {
            hasAddressErrors = true;
          }
        }
      }

      if (hasAddressErrors) {
        setAddressValidationType("borrower");

        setAddressValidationContext({ hasAddressErrors: true });

        setAddressValidationMessage(
          "One or more borrower addresses could not be validated. Please check the addresses and try again."
        );

        setShowAddressValidationDialog(true);

        return;
      }
    }

    // Validate Filing Entity step before proceeding

    if (currentStep === 4 && direction === 1) {
      const validation = validateFilingEntity();

      if (validation.hasErrors) {
        return;
      }
    }

    // Validate Right-to-Cure Details step before proceeding

    if (currentStep === 5 && direction === 1) {
      const validation = validateRightToCureDetails();

      if (validation.hasErrors) {
        return;
      }

      // Validate notice address if notice was sent

      if (
        formData.noticeSent === true &&
        formData.noticeAddressStreet1 &&
        formData.noticeAddressCity &&
        formData.noticeAddressState &&
        formData.noticeAddressZip
      ) {
        const addressValidation = await validateNoticeAddressWithGeocoding();

        if (!addressValidation.isValid) {
          setAddressValidationType("notice");

          setAddressValidationContext({ addressValidation });

          setAddressValidationMessage(
            addressValidation.error ||
              "Notice address validation failed. Please check the address and try again."
          );

          setShowAddressValidationDialog(true);

          return;
        }
      }
    }

    // Validate Form 35B Compliance step before proceeding

    if (currentStep === 6 && direction === 1) {
      const validation = validateForm35BCompliance();

      if (validation.hasErrors) {
        return;
      }
    }

    // Validate Loan Assignees step before proceeding

    if (currentStep === 7 && direction === 1) {
      const validation = validateLoanAssignees();

      if (validation.hasErrors) {
        return;
      }

      // Validate loan assignee addresses

      let hasAddressErrors = false;

      for (let i = 0; i < formData.loanAssignees.length; i++) {
        const assignee = formData.loanAssignees[i];

        if (
          assignee.street1 &&
          assignee.city &&
          assignee.addressState &&
          assignee.zip
        ) {
          const addressValidation =
            await validateLoanAssigneeAddressWithGeocoding(i);

          if (!addressValidation.isValid) {
            hasAddressErrors = true;
          }
        }
      }

      if (hasAddressErrors) {
        setAddressValidationType("loanAssignee");

        setAddressValidationContext({ hasAddressErrors: true });

        setAddressValidationMessage(
          "One or more loan assignee addresses could not be validated. Please check the addresses and try again."
        );

        setShowAddressValidationDialog(true);

        return;
      }
    }

    // Validate Attestation step before proceeding to Review & Submit

    if (currentStep === 8 && direction === 1) {
      // Check if user has signature

      if (!userProfile?.signatureUrl) {
        toast.error(
          "You must upload a digital signature to your profile before proceeding to review."
        );

        return;
      }

      // Check if certification checkbox is checked

      if (!formData.certification_check) {
        toast.error(
          "Please check the Electronic Certification checkbox before proceeding to review."
        );

        return;
      }
    }

    if (newStep >= 1 && newStep <= totalSteps) {
      // Mark current step as completed when moving forward

      if (direction === 1) {
        markStepCompleted(currentStep);
      }

      // Auto-save current step before moving to next step

      await autoSaveCurrentStep();

      // Update both local and wizard state

      setCurrentStep(newStep);

      wizardGoToStep(newStep);

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
    setShowAddressValidationDialog(false);

    setAddressValidationMessage("");

    setAddressValidationType("");

    setAddressValidationContext(null);

    // Proceed to next step without validation

    const newStep = currentStep + 1;

    if (newStep >= 1 && newStep <= totalSteps) {
      // Auto-save current step before proceeding

      await autoSaveCurrentStep();

      // Mark current step as completed and sync wizard before moving on
      try {
        markStepCompleted(currentStep);
        wizardGoToStep(newStep);
      } catch (e) {}

      setCurrentStep(newStep);

      // Scroll to top on step change for better mobile UX

      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async (e, isIntentional = false) => {
    e.preventDefault();

    // Only validate certification if we're actually on the last step and trying to submit

    if (currentStep !== totalSteps || !isIntentional) {
      return;
    }

    if (!formData.certification_check) {
      toast.error(
        "Please certify the petition by checking the certification checkbox."
      );

      return;
    }

    // Validate address fields

    const addressValidation = validateAddressFields();

    if (addressValidation.hasErrors) {
      return;
    }

    // Check organization access

    if (!hasOrganizationAccess) {
      toast.error("You must be part of an organization to submit petitions.");

      return;
    }

    try {
      // Prepare petition data with signature information
      // For final submit, use certification_check to set esignConsent

      const existingSignature = formData.signatures && formData.signatures.length > 0 
        ? formData.signatures[0] 
        : null;

      const petitionData = {
        isAllStepsCompleted: true,

        ...formData,

        signatures: [
          {
            signerFullName: `${formData.signerFirstName || ""} ${
              formData.signerMiddleInitial || ""
            } ${formData.signerLastName || ""}`.trim(),

            signerTitle: formData.signerTitle || user?.role || "Filer",

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

      // Submit petition using API

      await submitPetition(petitionData);

      // Notify parent component that petition was submitted successfully

      if (onPetitionSubmitted) {
        onPetitionSubmitted();
      }

      // Clear form data and wizard state (like "Don't save")
      clearFormAndWizardState();

      onClose();
    } catch (error) {
      // Error is already handled in the submitPetition function with toast
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1PropertyDetails
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

      case 2:
        return (
          <Step2LoanDetails
            commonDataError={commonDataError}
            commonDataLoading={commonDataLoading}
            fieldErrors={fieldErrors}
            formData={formData}
            handleInputChange={handleInputChange}
            getLoanTypes={getLoanTypes}
            getLienPositions={getLienPositions}
          />
        );

      case 3:
        return (
          <Step3BorrowerDetails
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

      case 4:
        return (
          <Step4FilingEntity
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

      case 5:
        return (
          <Step5RightToCure
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

      case 6:
        return (
          <Step6Form35BCompliance
            formData={formData}
            setFormData={setFormData}
            fieldErrors={fieldErrors}
          />
        );

      case 7:
        return (
          <Step7LoanAssignees
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

      case 8:
        return (
          <Step8PetitionAttestation
            formData={formData}
            handleInputChange={handleInputChange}
            userProfile={userProfile}
            onClose={onClose}
          />
        );

      case 9:
        return (
          <Step9ReviewSubmit
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

  if (!isOpen) return null;

  return (
    <React.Fragment>
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
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        tabIndex="-1"
      >
        <div className="modal-dialog petition-steps-modal-dialog modal-dialog-centered">
          <div className="modal-content petition-steps-modal-content">
            <div className="modal-header text-white theme-bg petition-steps-header">
              <h5 className="modal-title">Foreclosure Petition Filing</h5>

              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={handleCloseAttempt}
                aria-label="Close"
              ></button>
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

                    {currentStep < 8 ? (
                      <button
                        type="button"
                        className="dashboard-btn-create"
                        onClick={() => nextStep(1)}
                      >
                        Next Step
                      </button>
                    ) : currentStep === 8 ? (
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
