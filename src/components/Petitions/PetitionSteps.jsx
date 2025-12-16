import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { toast } from "react-toastify";

import googlePlacesService from "../../services/googlePlacesService";
import { STORAGE_KEYS } from "../../constants/appConstants";

import { usePetitionCommonData } from "../../hooks/usePetitionCommonData";

import { usePetitions } from "../../hooks/usePetitions";

import { useAuth } from "../../context/AuthContext";
import { getActiveOrganizationId, setActiveOrganizationId, getUserRole } from "../../utils/storage";

import { usePetitionWizard } from "../../context/PetitionWizardContext";

import { getUserById, getSignatureById } from "../../services/authService";

import { getFilingEntityTypes } from "../../services/commonService";

import { getOrganizationById } from "../../services/organizationService";

import PetitionStepper from "./PetitionStepper";

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
import { parseCurrencyInput } from "../../utils/currencyUtils";
import { defaultFormData, loadFormDataFromStorage, saveFormDataToStorage, clearFormDataFromStorage, transformTakeOverPetitionData } from "../../helpers/petitions/petitionFormData";
import {
  validatePropertyDetails as validatePropertyDetailsHelper,
  validateLoanDetails as validateLoanDetailsHelper,
  validateBorrowerDetails as validateBorrowerDetailsHelper,
  validateRightToCureDetails as validateRightToCureDetailsHelper,
  validateForm35BCompliance as validateForm35BComplianceHelper,
  validateFilingEntity as validateFilingEntityHelper,
  validateLoanAssignees as validateLoanAssigneesHelper,
} from "../../helpers/petitions/formValidation";

const PetitionSteps = ({
  isOpen,
  onClose,
  organization,
  onPetitionSubmitted,
}) => {
  const { t } = useTranslation();
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
  const [visitedSteps, setVisitedSteps] = useState(new Set([1]));
  const lastOrgStateRef = useRef(null);
  const lastStep2StateRef = useRef(null);
  const lastStep3StateRef = useRef(null);
  const lastStep4StateRef = useRef(null);
  const lastStep5StateRef = useRef(null);
  const lastStep6StateRef = useRef(null);
  const lastStep7StateRef = useRef(null);
  const lastStep8StateRef = useRef(null);

  const totalSteps = 10;

  const [isAddressVerified, setIsAddressVerified] = useState(false);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [addressValidationError, setAddressValidationError] = useState("");
  const [showAddressValidationDialog, setShowAddressValidationDialog] = useState(false);
  const [addressValidationMessage, setAddressValidationMessage] = useState("");
  const [addressValidationType, setAddressValidationType] = useState("");
  const [_addressValidationContext, setAddressValidationContext] = useState(null); // NOSONAR: setter is used, value intentionally unused // NOSONAR: setter is used, value intentionally unused 
  const [pendingStepChange, setPendingStepChange] = useState(null);
  const [isFilingEntityAddressVerified, setIsFilingEntityAddressVerified] = useState(false);
  const [isNoticeAddressVerified, setIsNoticeAddressVerified] = useState(false);
  const [borrowerAddressesVerified, setBorrowerAddressesVerified] = useState({});
  const [loanAssigneeAddressesVerified, setLoanAssigneeAddressesVerified] = useState({});

  const modalBodyRef = useRef(null);
  const formContainerRef = useRef(null);

  useEffect(() => {
    setCurrentStep(wizardCurrentStep);
  }, [wizardCurrentStep]);

  useEffect(() => {
    if (isOpen && currentStep) {
      const scrollToTop = () => {
        if (formContainerRef.current) {
          formContainerRef.current.scrollTop = 0;
        }
        if (modalBodyRef.current) {
          modalBodyRef.current.scrollTop = 0;
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      };

      requestAnimationFrame(() => {
        scrollToTop();
      });
      
      const timer1 = setTimeout(scrollToTop, 0);
      const timer2 = setTimeout(scrollToTop, 50);
      const timer3 = setTimeout(scrollToTop, 150);
      const timer4 = setTimeout(scrollToTop, 300);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    }
  }, [currentStep, isOpen]);

  useEffect(() => {
    if (currentStep >= 1 && currentStep <= totalSteps) {
      setVisitedSteps(prev => {
        const newSet = new Set(prev);
        newSet.add(currentStep);
        return newSet;
      });
    }
  }, [currentStep, totalSteps]);

  const previousStepRef = useRef(1);
  const [shouldValidateAddress, setShouldValidateAddress] = useState(false);

  const [userProfile, setUserProfile] = useState(null);
  const [filingEntityTypes, setFilingEntityTypes] = useState([]);
  const [userFilingEntityType, setUserFilingEntityType] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [organizationData, setOrganizationData] = useState(null);
  const [organizationLoading, setOrganizationLoading] = useState(false);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(null);
  
  const [showTakeOverModal, setShowTakeOverModal] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [_shouldTakeOver, setShouldTakeOver] = useState(false); // NOSONAR: setter is used, value intentionally unused
  const [_pendingAction, setPendingAction] = useState(null); // NOSONAR: setter is used, value intentionally unused
  const [isTakenOverPetition, setIsTakenOverPetition] = useState(false);
  const [takenOverPetitionId, setTakenOverPetitionId] = useState(null);
  const [takenOverPetitionNumber, setTakenOverPetitionNumber] = useState(null);
  const [takenOverPetitionStatus, setTakenOverPetitionStatus] = useState(null);

  const {
    getLienPositions,

    getLoanTypes,
    getLenderTypes,

    getAssigneeTypes,

    getAssigneeRoles,

    loading: commonDataLoading,

    error: commonDataError,
  } = usePetitionCommonData();

  const {
    submitPetition,
    organization: organizationFromContext,
    loading: petitionLoading,
  } = usePetitions();

  const {
    user,
    organization: organizationFromAuth,
  } = useAuth();

  const isOrgAdmin = user?.isManager === true || 
    (user?.roles && Array.isArray(user?.roles) && user.roles.includes('Organization Admin')) ||
    getUserRole(user) === 'Organization Admin';

  const storedActiveOrganizationId = getActiveOrganizationId();
  const organizationId =
    selectedOrganizationId ||
    storedActiveOrganizationId ||
    user?.organizationId ||
    organization?.id ||
    organizationFromContext?.id ||
    organizationFromAuth?.id ||
    null;

  const [predictions, setPredictions] = useState([]);

  const [showPredictions, setShowPredictions] = useState(false);

  const [selectedPredictionIndex, setSelectedPredictionIndex] = useState(-1);

  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});

  const [isSaving, setIsSaving] = useState(false);

  const [hasSavedDraft, setHasSavedDraft] = useState(false);

  const [showCloseConfirmDialog, setShowCloseConfirmDialog] = useState(false);

  const [borrowerAddressValidationErrors] = useState({});
  const [noticeAddressValidationErrors] = useState({});
  const [loanAssigneeAddressValidationErrors] = useState({});

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

  const [formData, setFormData] = useState(loadFormDataFromStorage);

  useEffect(() => {
    const loadUserProfileAndTypes = async () => {
      if (!user?.id) return;

      setProfileLoading(true);

      try {
        const profileResponse = await getUserById(user.id);

        if (profileResponse.isSuccess) {
          setUserProfile(profileResponse.data);
          setUserFilingEntityType(profileResponse.data.filingEntityTypeId);

          setFormData((prev) => ({
            ...prev,
            filingEntityTypeId: profileResponse.data.filingEntityTypeId || null,
          }));
        }

        try {
          const signatureResponse = await getSignatureById(user.id);

          if (signatureResponse.isSuccess && signatureResponse.data) {
            const signatureData = signatureResponse.data;
            const signatureUrl = signatureData.signatureBase64 
              ? `data:image/png;base64,${signatureData.signatureBase64}` 
              : signatureData.signatureUrl;

            setUserProfile((prev) => ({
              ...prev,
              signatureImageName: signatureData.signatureImageName,
              signatureBase64: signatureData.signatureBase64,
              signatureUrl: signatureUrl,
            }));
          }
        } catch (error) {
          console.error("Error updating form data:", error);
        }

        const typesResponse = await getFilingEntityTypes();

        if (typesResponse.isSuccess) {
          setFilingEntityTypes(typesResponse.data);
        }
      } catch (error) {
        console.error("Failed to load user profile:", error);
        toast.error(t("errors.failedLoadUserProfile"));
      } finally {
        setProfileLoading(false);
      }
    };

    loadUserProfileAndTypes();
  }, [user?.id, t]);

  const prepareSignerDataForDraft = useCallback((user, userProfile, parsedData) => {
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
      .replaceAll(/\s+/g, " ")
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
          esignConsent: parsedData.certification_check ?? false,
          signatureDrawnOrTyped: userProfile?.signatureImageName || "",
          signedAt: "",
          signerIp: "",
          otpCode: "",
        },
      ],
    };
  }, []);

  const loadAndParseFormData = useCallback(() => {
    const savedData = sessionStorage.getItem(STORAGE_KEYS.PETITION_FORM_DATA);
    if (!savedData) return null;

    try {
      return JSON.parse(savedData);
    } catch (error) {
      console.error("Error loading form data:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (typeof resetWizard === "function") {
      resetWizard();
    }

    const parsedData = loadAndParseFormData();
    if (!parsedData) {
      if (typeof resetWizard === "function") {
        resetWizard();
      }
      return;
    }

    let updatedData = { ...defaultFormData, ...parsedData };
    
    const editingPetitionId = sessionStorage.getItem("editingPetitionId");
    const isEditingDraft = !!editingPetitionId;
    
    if (isEditingDraft && user) {
      const signerData = prepareSignerDataForDraft(user, userProfile, parsedData);
      updatedData = { ...updatedData, ...signerData };
    }
    
    setFormData(updatedData);
    
    if (typeof resetWizard === "function") {
      resetWizard();
    }
  }, [isOpen, resetWizard, user, userProfile, loadAndParseFormData, prepareSignerDataForDraft]);

  useEffect(() => {
    const loadOrganizationData = async () => {
      const shouldLoad = isOrgAdmin 
        ? organizationId 
        : selectedOrganizationId;
      
      if (!shouldLoad) return;

      const orgIdToLoad = isOrgAdmin ? organizationId : selectedOrganizationId;

      setOrganizationLoading(true);

      try {
        const orgResponse = await getOrganizationById(orgIdToLoad);

        if (orgResponse.isSuccess && orgResponse.data) {
          const orgData = orgResponse.data;

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
        console.error("Error loading organization details:", error);
        if (organization) {
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

    if ((isOrgAdmin && organizationId) || (!isOrgAdmin && selectedOrganizationId)) {
      loadOrganizationData();
    }
  }, [organizationId, selectedOrganizationId, isOrgAdmin, organization]);

  useEffect(() => {
    if (isOpen && !formData?.id && !isOrgAdmin) {
      setSelectedOrganizationId(null);
      setOrganizationData(null);
      setFormData((prev) => ({
        ...prev,
        filingEntityLegalName: "",
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
      }));
    }
  }, [isOpen, isOrgAdmin, formData?.id]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedOrganizationId(null);
      setOrganizationData(null);
    }
  }, [isOpen]);

  const handleInputChangeWithMinLogic = (e) => {
    const { name, value } = e.target;
    
    if (name === "isMinApplicable" && value === "no") {
      setFormData((prev) => ({
        ...prev,
        isMinApplicable: value,
          minNumber: "",
        }));
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

  const handleOrganizationSelect = async (orgId, orgData) => {
    setSelectedOrganizationId(orgId);
    
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
    
    setFormData((prev) => ({
      ...prev,
      organizationId: orgId,
    }));

    if (orgData) {
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
        console.error("Error loading organization details:", error);
        toast.error(t("errors.failedLoadOrganizationDetails"));
      } finally {
        setOrganizationLoading(false);
      }
    }
  };

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

  const checkHasExistingFormData = (data) => {
    return Object.values(data).some(
      (value) =>
        value !== "" &&
        value !== 0 &&
        value !== false &&
        !Array.isArray(value) &&
        value !== null
    );
  };

  useEffect(() => {
    const loadSavedDrafts = () => {
      try {
        const savedDrafts = JSON.parse(
          sessionStorage.getItem(STORAGE_KEYS.PETITION_DRAFTS) || "[]"
        );

        if (savedDrafts.length > 0) {
          const currentStepDraft = savedDrafts.find(
            (draft) => draft.step === currentStep
          );

          if (currentStepDraft?.formData) {
            setFormData((prev) => {
              if (checkHasExistingFormData(prev)) {
                setHasSavedDraft(false);
                return prev;
              }
              
              setHasSavedDraft(true);
              return {
                ...prev,
                ...currentStepDraft.formData,
              };
            });
          } else {
            setHasSavedDraft(false);
          }
        } else {
          setHasSavedDraft(false);
        }
      } catch (error) {
        console.error("Error checking saved draft:", error);
        setHasSavedDraft(false);
      }
    };

    if (isOpen) {
      sessionStorage.removeItem("petitionDrafts");

      loadSavedDrafts();
    }
  }, [isOpen, currentStep]);

  const checkStepHasRequiredFields = useCallback((stepNumber) => {
    if (!formData) return false;
    
    switch (stepNumber) {
      case 1:
        if (isOrgAdmin) {
          return !!(organizationId || selectedOrganizationId);
        }
        return !!selectedOrganizationId;
      
      case 2:
        return !!(formData.propertyStreet1?.trim() && 
                  formData.propertyCity?.trim() && 
                  formData.propertyState?.trim() && 
                  formData.propertyZip?.trim() && 
                  formData.propertyCounty?.trim());
      
      case 3: {
        const hasMinApplicable = formData.isMinApplicable === "yes" || formData.isMinApplicable === "no";
        const hasMinNumberIfRequired = formData.isMinApplicable !== "yes" || (formData.isMinApplicable === "yes" && formData.minNumber?.trim());
        const hasLoanModification = formData.borrowerRequestedLoanModification !== null && formData.borrowerRequestedLoanModification !== undefined;
        const hasLoanModificationFinalized = formData.borrowerRequestedLoanModification !== true || (formData.borrowerRequestedLoanModification === true && (formData.loanModificationRequestFinalized !== null && formData.loanModificationRequestFinalized !== undefined));
        const result = !!(hasMinApplicable &&
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
                  formData.delinquencyDaysAtFiling >= 0 &&
                  hasLoanModification &&
                  hasLoanModificationFinalized);
        return result;
      }
      
      case 4:
        if (!formData.borrowers || !Array.isArray(formData.borrowers) || formData.borrowers.length === 0) {
          return false;
        }
        return formData.borrowers.every(b => b.firstName?.trim() && b.lastName?.trim());
      
      case 5:
        return !!userFilingEntityType;
      
      case 6:
        if (formData.rightToCures && Array.isArray(formData.rightToCures) && formData.rightToCures.length > 0) {
          return formData.rightToCures.every(rtc => {
            if (rtc.noticeSent === null || rtc.noticeSent === undefined) {
              return false;
            }
            if (rtc.noticeSent === true) {
              const hasBorrowerResponse = rtc.borrowerRespondedWithin30Days !== null && rtc.borrowerRespondedWithin30Days !== undefined;
              const hasBorrowerResponseDate = rtc.borrowerRespondedWithin30Days !== true || (rtc.borrowerRespondedWithin30Days === true && rtc.borrowerResponseDate?.trim());
              const hasProceededWithCure = rtc.borrowerRespondedWithin30Days !== true || (rtc.borrowerRespondedWithin30Days === true && (rtc.proceededWithRightToCure !== null && rtc.proceededWithRightToCure !== undefined));
              return !!(rtc.noticeDate?.trim() &&
                        rtc.amountInDefault != null &&
                        rtc.amountInDefault >= 0 &&
                        rtc.daysDelinquentAtNotice != null &&
                        rtc.daysDelinquentAtNotice !== "" &&
                        rtc.daysDelinquentAtNotice >= 0 &&
                        rtc.cureExpirationDate?.trim() &&
                        rtc.noticeAddressStreet1?.trim() &&
                        rtc.noticeAddressCity?.trim() &&
                        rtc.noticeAddressState?.trim() &&
                        rtc.noticeAddressZip?.trim() &&
                        hasBorrowerResponse &&
                        hasBorrowerResponseDate &&
                        hasProceededWithCure);
            }
            if (rtc.noticeSent === false) {
              return !!(rtc.manualOverrideReason?.trim());
            }
            return false;
          });
        }
        if (formData.noticeSent === null || formData.noticeSent === undefined) {
          return false;
        }
        if (formData.noticeSent === true) {
          const hasBorrowerResponse = formData.borrowerRespondedWithin30Days !== null && formData.borrowerRespondedWithin30Days !== undefined;
          const hasBorrowerResponseDate = formData.borrowerRespondedWithin30Days !== true || (formData.borrowerRespondedWithin30Days === true && formData.borrowerResponseDate?.trim());
          const hasProceededWithCure = formData.borrowerRespondedWithin30Days !== true || (formData.borrowerRespondedWithin30Days === true && (formData.proceededWithRightToCure !== null && formData.proceededWithRightToCure !== undefined));
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
                    formData.noticeAddressZip?.trim() &&
                    hasBorrowerResponse &&
                    hasBorrowerResponseDate &&
                    hasProceededWithCure);
          
          return hasRequiredFields;
        }
        if (formData.noticeSent === false) {
          return !!(formData.manualOverrideReason?.trim());
        }
        return false;
      
      case 7:
        return formData.certainMortgageLoan !== null && formData.certainMortgageLoan !== undefined;
      
      case 8:
        if (!formData.loanAssignees || !Array.isArray(formData.loanAssignees) || formData.loanAssignees.length === 0) {
          return false;
        }
        return formData.loanAssignees.every(a => 
          a.assigneeName?.trim() && 
          a.assigneeTypeId && 
          a.assigneeRoleId
        );
      
      case 9:
        return !!(userProfile?.signatureImageName && formData?.certification_check);
      
      default:
        return false;
    }
  }, [formData, userFilingEntityType, userProfile, isOrgAdmin, organizationId, selectedOrganizationId]);

  const validateAddressFields = useCallback(() => validatePropertyDetailsHelper(formData), [formData]);
  const validateLoanDetails = useCallback(() => validateLoanDetailsHelper(formData), [formData]);
  const validateBorrowerDetails = useCallback(() => validateBorrowerDetailsHelper(formData), [formData]);
  const validateRightToCureDetails = useCallback(() => validateRightToCureDetailsHelper(formData), [formData]);
  const validateForm35BCompliance = useCallback(() => validateForm35BComplianceHelper(formData), [formData]);
  const validateFilingEntity = useCallback(() => validateFilingEntityHelper(formData), [formData]);
  const validateLoanAssignees = useCallback(() => validateLoanAssigneesHelper(formData), [formData]);

  useEffect(() => {
    if (!isOpen) {
      lastOrgStateRef.current = null;
      lastStep2StateRef.current = null;
      lastStep3StateRef.current = null;
      lastStep4StateRef.current = null;
      lastStep5StateRef.current = null;
      lastStep6StateRef.current = null;
      lastStep7StateRef.current = null;
      lastStep8StateRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      previousStepRef.current = wizardCurrentStep;
      return;
    }
    
    const prev = previousStepRef.current;
    const next = wizardCurrentStep;
    
    if (prev !== next && prev >= 1 && prev <= totalSteps) {
      let isStepComplete = false;
      
      switch (prev) {
        case 1:
          if (isOrgAdmin) {
            isStepComplete = !!(organizationId || selectedOrganizationId);
          } else {
            isStepComplete = !!selectedOrganizationId;
          }
          break;
        case 2: {
          const hasAllAddressFields = !!(formData?.propertyStreet1?.trim() && 
                                        formData?.propertyCity?.trim() && 
                                        formData?.propertyState?.trim() && 
                                        formData?.propertyZip?.trim() && 
                                        formData?.propertyCounty?.trim());
          isStepComplete = hasAllAddressFields;
          break;
        }
        case 3: {
          const loanValidation = validateLoanDetails();
          isStepComplete = !loanValidation.hasErrors;
          break;
        }
        case 4: {
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
        }
        case 5: {
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
        }
        case 6: {
          const rightToCureValidation = validateRightToCureDetails();
          if (!rightToCureValidation.hasErrors) {
            if (formData?.noticeAddressStreet1?.trim()) {
              isStepComplete = isNoticeAddressVerified;
            } else {
              isStepComplete = true;
            }
          }
          break;
        }
        case 7: {
          const form35BValidation = validateForm35BCompliance();
          isStepComplete = !form35BValidation.hasErrors;
          break;
        }
        case 8: {
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
        }
        case 9:
          isStepComplete = !!(userProfile?.signatureUrl && formData?.certification_check);
          break;
        default:
          isStepComplete = checkStepHasRequiredFields(prev);
      }
      
      if (isStepComplete) {
        markStepCompleted(prev);
        if (stepsWithErrors.has(prev)) {
          clearStepError(prev);
        }
      } else {
        const wasCompleted = completedSteps.has(prev);
        if (wasCompleted) {
          const stillHasFields = checkStepHasRequiredFields(prev);
          if (stillHasFields) {
            markStepCompleted(prev);
          } else {
            markStepIncomplete(prev);
          }
        }
      }
    }
    
    if (prev === 2 && next !== 2 && next > prev && formData?.propertyStreet1?.trim() && !isAddressVerified) {
      setPendingStepChange(next);
      wizardGoToStep(2);
      setCurrentStep(2);
      previousStepRef.current = 2;
      setShouldValidateAddress(true);
      return;
    }
    
    if (prev === 5 && next !== 5 && next > prev && formData?.filingEntityStreet1?.trim() && !isFilingEntityAddressVerified) {
      setPendingStepChange(next);
      wizardGoToStep(5);
      setCurrentStep(5);
      previousStepRef.current = 5;
      setShouldValidateAddress(true);
      setAddressValidationType("filingEntity");
      return;
    }
    
    if (prev === 6 && next !== 6 && next > prev && formData?.noticeAddressStreet1?.trim() && !isNoticeAddressVerified) {
      setPendingStepChange(next);
      wizardGoToStep(6);
      setCurrentStep(6);
      previousStepRef.current = 6;
      setShouldValidateAddress(true);
      setAddressValidationType("notice");
      return;
    }
    
    if (prev === 4 && next !== 4 && next > prev) {
      const hasBorrowerAddresses = formData?.borrowers?.some(borrower => borrower.mailingStreet1?.trim());
      if (hasBorrowerAddresses) {
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
    
    if (prev === 8 && next !== 8 && next > prev) {
      const hasAssigneeAddresses = formData?.loanAssignees?.some(assignee => assignee.street1?.trim());
      if (hasAssigneeAddresses) {
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
  }, [wizardCurrentStep, isAddressVerified, isFilingEntityAddressVerified, isNoticeAddressVerified, borrowerAddressesVerified, loanAssigneeAddressesVerified, formData, completedSteps, stepsWithErrors, totalSteps, markStepCompleted, markStepIncomplete, checkStepHasRequiredFields, clearStepError, wizardGoToStep, setCurrentStep, userFilingEntityType, userProfile, isOpen, isOrgAdmin, organizationId, selectedOrganizationId, validateLoanDetails, validateBorrowerDetails, validateFilingEntity, validateRightToCureDetails, validateForm35BCompliance, validateLoanAssignees]);

  useEffect(() => {
    if (!isOpen) return;
    
    let hasOrganization = false;
    if (isOrgAdmin) {
      hasOrganization = !!(organizationId || selectedOrganizationId);
    } else {
      hasOrganization = !!selectedOrganizationId;
    }
    
    if (lastOrgStateRef.current === hasOrganization) {
      return;
    }
    lastOrgStateRef.current = hasOrganization;
    
    if (hasOrganization) {
      markStepCompleted(1);
      if (stepsWithErrors.has(1)) {
        clearStepError(1);
      }
    } else {
      markStepIncomplete(1);
    }
  }, [selectedOrganizationId, organizationId, isOrgAdmin, stepsWithErrors, markStepCompleted, markStepIncomplete, clearStepError, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!formData) return;
    const addressValidation = validateAddressFields();
    let shouldBeComplete = false;
    
    if (!addressValidation.hasErrors) {
      const hasAllAddressFields = !!(formData?.propertyStreet1?.trim() && 
                                    formData?.propertyCity?.trim() && 
                                    formData?.propertyState?.trim() && 
                                    formData?.propertyZip?.trim() && 
                                    formData?.propertyCounty?.trim());
      shouldBeComplete = hasAllAddressFields;
    }
    
    if (lastStep2StateRef.current === shouldBeComplete && wizardCurrentStep === 2) {
      return;
    }
    lastStep2StateRef.current = shouldBeComplete;
    
    if (shouldBeComplete) {
      markStepCompleted(2);
      if (stepsWithErrors.has(2)) {
        clearStepError(2);
      }
    } else {
      markStepIncomplete(2);
    }
  }, [formData, stepsWithErrors, markStepCompleted, markStepIncomplete, clearStepError, isOpen, validateAddressFields, wizardCurrentStep]);

  useEffect(() => {
    if (!isOpen) return;
    if (!formData || !userFilingEntityType) return;
    const filingEntityValidation = validateFilingEntity();
    let shouldBeComplete = false;
    
    if (!filingEntityValidation.hasErrors) {
      shouldBeComplete = true;
    }
    
    if (lastStep5StateRef.current === shouldBeComplete && wizardCurrentStep === 5) {
      return;
    }
    lastStep5StateRef.current = shouldBeComplete;
    
    if (shouldBeComplete) {
      markStepCompleted(5);
      if (stepsWithErrors.has(5)) {
        clearStepError(5);
      }
    } else {
      markStepIncomplete(5);
    }
  }, [formData, userFilingEntityType, stepsWithErrors, markStepCompleted, markStepIncomplete, clearStepError, isOpen, wizardCurrentStep, validateFilingEntity]);

  useEffect(() => {
    if (!isOpen) return;
    if (!formData?.borrowers) return;
    
    const borrowerValidation = validateBorrowerDetails();
    let shouldBeComplete = false;
    
    if (!borrowerValidation.hasErrors) {
      shouldBeComplete = true;
    }
    
    if (lastStep4StateRef.current === shouldBeComplete && wizardCurrentStep === 4) {
      return;
    }
    lastStep4StateRef.current = shouldBeComplete;
    
    if (shouldBeComplete) {
      markStepCompleted(4);
      if (stepsWithErrors.has(4)) {
        clearStepError(4);
      }
    } else {
      markStepIncomplete(4);
    }
  }, [formData, stepsWithErrors, markStepCompleted, markStepIncomplete, clearStepError, isOpen, wizardCurrentStep, validateBorrowerDetails]);

  useEffect(() => {
    if (!isOpen) return;
    if (!formData) return;
    const loanAssigneesValidation = validateLoanAssignees();
    let shouldBeComplete = false;
    
    if (!loanAssigneesValidation.hasErrors) {
      shouldBeComplete = true;
    }
    
    if (lastStep8StateRef.current === shouldBeComplete && wizardCurrentStep === 8) {
      return;
    }
    lastStep8StateRef.current = shouldBeComplete;
    
    if (shouldBeComplete) {
      markStepCompleted(8);
      if (stepsWithErrors.has(8)) {
        clearStepError(8);
      }
    } else {
      markStepIncomplete(8);
    }
  }, [formData, stepsWithErrors, markStepCompleted, markStepIncomplete, clearStepError, isOpen, wizardCurrentStep, validateLoanAssignees]);

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

  useEffect(() => {
    if (formData && Object.keys(formData).length > 0) {
      saveFormDataToStorage(formData);
    }
  }, [formData]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      clearFormDataFromStorage();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const clearFormAndWizardState = () => {
    setIsTakenOverPetition(false);
    setTakenOverPetitionId(null);
    setTakenOverPetitionNumber(null);
    setTakenOverPetitionStatus(null);
    try {
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
          .replaceAll(/\s+/g, " ")
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
      sessionStorage.removeItem("petitionDrafts");
      sessionStorage.removeItem("editingPetitionId");
      setFieldErrors({});
      setHasSavedDraft(false);
      
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
      
      clearAllStepErrors();
      setVisitedSteps(new Set([1]));
      setSelectedOrganizationId(null);
      setOrganizationData(null);

      if (typeof resetWizard === "function") {
        resetWizard();
      } else {
        setCurrentStep(1);
        wizardGoToStep(1);
      }
      
      previousStepRef.current = 1;
    } catch (error) {
      console.error("Error clearing form and wizard state:", error);
    }
  };

  const handleCloseAttempt = () => {
    setShowCloseConfirmDialog(true);
  };

  const handleDiscardAndClose = () => {
    try {
      clearFormAndWizardState();
    } catch (error) {
      console.error("Error discarding and closing:", error);
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
      console.error("Error saving draft and closing:", e);
    }
  };

  const handleAddressInput = async (input) => {
    if (!input.trim()) {
      setPredictions([]);
      setShowPredictions(false);
      setIsLoadingPredictions(false);
      return;
    }

    if (globalThis.autocompleteTimeout) {
      clearTimeout(globalThis.autocompleteTimeout);
    }

    globalThis.autocompleteTimeout = setTimeout(async () => {
      setIsLoadingPredictions(true);

      try {
        const suggestions = await googlePlacesService.autocomplete(input);
        const formattedPredictions = suggestions.map(s => ({
          description: s.description,
          place_id: s.placeId,
        }));
        setPredictions(formattedPredictions);
        setShowPredictions(true);
        setSelectedPredictionIndex(-1);
      } catch (error) {
        console.error("Error getting autocomplete suggestions:", error);
        setPredictions([]);
        setShowPredictions(false);
      } finally {
        setIsLoadingPredictions(false);
      }
    }, 300);
  };

  const selectPrediction = async (placeId) => {
    try {
      const placeDetails = await googlePlacesService.getPlaceDetails(placeId);
      if (placeDetails?.addressComponents) {
        const addressComponents = placeDetails.addressComponents;

        let streetNumber = "";

        let route = "";

        let city = "";

        let zipCode = "";

        let county = "";

        addressComponents.forEach((component) => {
          const types = component.types;

          if (types.includes("street_number")) {
            streetNumber = component.longName;
          } else if (types.includes("route")) {
            route = component.longName;
          } else if (types.includes("locality")) {
            city = component.longName;
          } else if (types.includes("postal_code")) {
            zipCode = component.longName;
          } else if (types.includes("administrative_area_level_2")) {
            county = component.longName;
          }
        });

        const fullAddress = `${streetNumber} ${route}`.trim();

        setFormData((prev) => ({
          ...prev,

          propertyStreet1: fullAddress,

          propertyCity: city,

          propertyState: "MA",
          propertyZip: zipCode,
          propertyCounty: county,
        }));

        setIsAddressVerified(false);
        setAddressValidationError("");
        setShowPredictions(false);
        setPredictions([]);
      }
    } catch (error) {
      console.error("Error getting place details:", error);
    }
  };

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

  const handleBorrowerAddressInput = async (borrowerId, value) => {
    if (!value.trim()) {
      setBorrowerPredictions((prev) => ({ ...prev, [borrowerId]: [] }));
      setShowBorrowerPredictions((prev) => ({ ...prev, [borrowerId]: false }));
      return;
    }

    setIsLoadingBorrowerPredictions((prev) => ({
      ...prev,
      [borrowerId]: true,
    }));

    try {
      const suggestions = await googlePlacesService.autocomplete(value);
      const formattedPredictions = suggestions.map(s => ({
        description: s.description,
        place_id: s.placeId,
      }));
      setBorrowerPredictions((prev) => ({
        ...prev,
        [borrowerId]: formattedPredictions,
      }));
      setShowBorrowerPredictions((prev) => ({
        ...prev,
        [borrowerId]: true,
      }));
      setSelectedBorrowerPredictionIndex((prev) => ({
        ...prev,
        [borrowerId]: -1,
      }));
    } catch (error) {
      console.error("Error getting autocomplete suggestions:", error);
      setBorrowerPredictions((prev) => ({ ...prev, [borrowerId]: [] }));
      setShowBorrowerPredictions((prev) => ({
        ...prev,
        [borrowerId]: false,
      }));
    } finally {
      setIsLoadingBorrowerPredictions((prev) => ({
        ...prev,
        [borrowerId]: false,
      }));
    }
  };

  const handleNoticeAddressInput = async (value) => {
    if (!value.trim()) {
      setNoticePredictions([]);
      setShowNoticePredictions(false);
      return;
    }

    setIsLoadingNoticePredictions(true);

    try {
      const suggestions = await googlePlacesService.autocomplete(value);
      const formattedPredictions = suggestions.map(s => ({
        description: s.description,
        place_id: s.placeId,
      }));
      setNoticePredictions(formattedPredictions);
      setShowNoticePredictions(true);
      setSelectedNoticePredictionIndex(-1);
    } catch (error) {
      console.error("Error getting autocomplete suggestions:", error);
      setNoticePredictions([]);
      setShowNoticePredictions(false);
    } finally {
      setIsLoadingNoticePredictions(false);
    }
  };

  const handleLoanAssigneeAddressInput = async (assigneeIndex, value) => {
    if (!value.trim()) {
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

    try {
      const suggestions = await googlePlacesService.autocomplete(value);
      const formattedPredictions = suggestions.map(s => ({
        description: s.description,
        place_id: s.placeId,
      }));
      setLoanAssigneePredictions((prev) => ({
        ...prev,
        [assigneeIndex]: formattedPredictions,
      }));

      setShowLoanAssigneePredictions((prev) => ({
        ...prev,
        [assigneeIndex]: true,
      }));

      setSelectedLoanAssigneePredictionIndex((prev) => ({
        ...prev,
        [assigneeIndex]: -1,
      }));
    } catch (error) {
      console.error("Error getting autocomplete suggestions:", error);
      setLoanAssigneePredictions((prev) => ({
        ...prev,
        [assigneeIndex]: [],
      }));

      setShowLoanAssigneePredictions((prev) => ({
        ...prev,
        [assigneeIndex]: false,
      }));
    } finally {
      setIsLoadingLoanAssigneePredictions((prev) => ({
        ...prev,
        [assigneeIndex]: false,
      }));
    }
  };

  const handleBorrowerPredictionClick = async (borrowerId, prediction) => {
    const placeId = prediction.place_id || prediction.placeId;
    try {
      const placeDetails = await googlePlacesService.getPlaceDetails(placeId);
      if (placeDetails?.addressComponents) {
        const addressComponents = placeDetails.addressComponents;

        let streetNumber = "";

        let route = "";

        let city = "";

        let state = "";

        let zipCode = "";

        addressComponents.forEach((component) => {
          const types = component.types;

          if (types.includes("street_number")) {
            streetNumber = component.longName;
          } else if (types.includes("route")) {
            route = component.longName;
          } else if (types.includes("locality")) {
            city = component.longName;
          } else if (types.includes("administrative_area_level_1")) {
            state = component.shortName;
          } else if (types.includes("postal_code")) {
            zipCode = component.longName;
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
    } catch (error) {
      console.error("Error getting place details:", error);
    }
  };

  const handleNoticePredictionClick = async (prediction) => {
    const placeId = prediction.place_id || prediction.placeId;
    try {
      const placeDetails = await googlePlacesService.getPlaceDetails(placeId);
      if (placeDetails?.addressComponents) {
        const addressComponents = placeDetails.addressComponents;

        let streetNumber = "";

        let route = "";

        let city = "";

        let state = "";

        let zipCode = "";

        addressComponents.forEach((component) => {
          const types = component.types;

          if (types.includes("street_number")) {
            streetNumber = component.longName;
          } else if (types.includes("route")) {
            route = component.longName;
          } else if (types.includes("locality")) {
            city = component.longName;
          } else if (types.includes("administrative_area_level_1")) {
            state = component.shortName;
          } else if (types.includes("postal_code")) {
            zipCode = component.longName;
          }
        });

        const fullAddress = `${streetNumber} ${route}`.trim();

        setFormData((prev) => {
          const rightToCures = prev.rightToCures || [];
          
          if (rightToCures.length > 0) {
            return {
              ...prev,
              rightToCures: prev.rightToCures.map((rtc, idx) =>
                idx === 0
                  ? {
                      ...rtc,
                      noticeAddressStreet1: fullAddress,
                      noticeAddressCity: city,
                      noticeAddressState: state,
                      noticeAddressZip: zipCode,
                    }
                  : rtc
              ),
              noticeAddressStreet1: fullAddress,
              noticeAddressCity: city,
              noticeAddressState: state,
              noticeAddressZip: zipCode,
            };
          } else {
            const newRTC = {
              id: null,
              noticeSent: prev.noticeSent,
              noticeDate: prev.noticeDate || "",
              amountInDefault: prev.amountInDefault || 0,
              daysDelinquentAtNotice: prev.daysDelinquentAtNotice || 0,
              cureExpirationDate: prev.cureExpirationDate || "",
              noticeAddressStreet1: fullAddress,
              noticeAddressCity: city,
              noticeAddressState: state,
              noticeAddressZip: zipCode,
              manualOverrideReason: prev.manualOverrideReason || "",
              borrowerRespondedWithin30Days: prev.borrowerRespondedWithin30Days,
              borrowerResponseDate: prev.borrowerResponseDate || "",
              proceededWithRightToCure: prev.proceededWithRightToCure,
            };
            return {
              ...prev,
              rightToCures: [newRTC],
              noticeAddressStreet1: fullAddress,
              noticeAddressCity: city,
              noticeAddressState: state,
              noticeAddressZip: zipCode,
            };
          }
        });

        setShowNoticePredictions(false);
        setNoticePredictions([]);
      }
    } catch (error) {
      console.error("Error getting place details:", error);
    }
  };

  const handleLoanAssigneePredictionClick = async (assigneeIndex, prediction) => {
    const placeId = prediction.place_id || prediction.placeId;
    try {
      const placeDetails = await googlePlacesService.getPlaceDetails(placeId);
      if (placeDetails?.addressComponents) {
        const addressComponents = placeDetails.addressComponents;

        let streetNumber = "";

        let route = "";

        let city = "";

        let state = "";

        let zipCode = "";

        addressComponents.forEach((component) => {
          const types = component.types;

          if (types.includes("street_number")) {
            streetNumber = component.longName;
          } else if (types.includes("route")) {
            route = component.longName;
          } else if (types.includes("locality")) {
            city = component.longName;
          } else if (types.includes("administrative_area_level_1")) {
            state = component.shortName;
          } else if (types.includes("postal_code")) {
            zipCode = component.longName;
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
    } catch (error) {
      console.error("Error getting place details:", error);
    }
  };

  const validateAddressWithGeocoding = useCallback(async () => {
    if (!formData.propertyStreet1.trim()) {
      return { isValid: false, error: "Street address is required" };
    }

    setIsValidatingAddress(true);
    setAddressValidationError("");

    const addressLine2 = formData.propertyStreet2
      ? ` ${formData.propertyStreet2}`
      : "";

    const fullAddress =
      `${formData.propertyStreet1}${addressLine2}, ${formData.propertyCity}, ${formData.propertyState} ${formData.propertyZip}`.trim();

    try {
      const geocodeResult = await googlePlacesService.geocode(fullAddress);
      
      setIsValidatingAddress(false);

      if (geocodeResult?.addressComponents) {
        const addressComponents = geocodeResult.addressComponents;

        let foundState = false;
        let county = "";
        let actualState = "";

        addressComponents.forEach((component) => {
          const types = component.types;

          if (types.includes("administrative_area_level_1")) {
            actualState = component.shortName;

            if (component.shortName === "MA") {
              foundState = true;
            }
          }

          if (types.includes("administrative_area_level_2")) {
            county = component.longName;
          }
        });

        if (actualState && actualState !== "MA") {
          setIsAddressVerified(false);
          setAddressValidationError(
            t("errors.addressNotInMassachusetts", { state: actualState })
          );
          return { isValid: false, error: t("errors.addressNotInMassachusettsShort") };
        }

        let cityMatch = false;
        let zipMatch = false;
        let countyMatch = false;

        addressComponents.forEach((component) => {
          const types = component.types;

          if (
            types.includes("locality") ||
            types.includes("administrative_area_level_2")
          ) {
            const componentCity = component.longName.toLowerCase();
            const inputCity = formData.propertyCity.toLowerCase().trim();

            if (inputCity.length >= 3) {
              if (
                componentCity === inputCity ||
                componentCity.startsWith(inputCity) ||
                inputCity.startsWith(componentCity) ||
                (componentCity.includes(inputCity) && inputCity.length >= 4)
              ) {
                cityMatch = true;
              }
            } else if (inputCity.length > 0) {
              if (componentCity === inputCity) {
                cityMatch = true;
              }
            }
          }

          if (types.includes("postal_code")) {
            if (component.longName === formData.propertyZip) {
              zipMatch = true;
            }
          }

          if (types.includes("administrative_area_level_2")) {
            const componentCounty = component.longName.toLowerCase();
            const inputCounty = formData.propertyCounty.toLowerCase().trim();

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

        if (foundState && cityMatch && zipMatch && countyMatch) {
          if (county && !formData.propertyCounty) {
            setFormData((prev) => ({
              ...prev,
              propertyCounty: county,
            }));
          }

          setIsAddressVerified(true);
          return { isValid: true, coordinates: { lat: geocodeResult.latitude, lng: geocodeResult.longitude } };
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
          return { isValid: false, error: "Address verification failed" };
        }
          } else {
            setIsAddressVerified(false);

            setAddressValidationError(
              t("errors.invalidAddressSelectFromSuggestions")
            );

            return { isValid: false, error: t("errors.invalidAddress") };
          }
        } catch (error) {
          console.error("Error validating address:", error);
          setIsValidatingAddress(false);
          setIsAddressVerified(false);
          setAddressValidationError("Error validating address. Please try again.");
          return { isValid: false, error: "Error validating address" };
        }
  }, [formData, setIsValidatingAddress, setAddressValidationError, setIsAddressVerified, setFormData, t]);

  const validatePropertyDetailsStep = useCallback(async () => {
    const validation = validateAddressFields();

    if (validation.hasErrors) {
      return { isValid: false, errors: validation.errors };
    }

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
  }, [validateAddressFields, validateAddressWithGeocoding, addressValidationError, setFieldErrors]);

  const validateAddressWithGeocodingGeneric = useCallback(async (addressData) => {
    const { street1, street2, city, state, zip } = addressData;
    
    if (!street1?.trim()) {
      return { isValid: false, error: "Street address is required" };
    }

    if (!city?.trim()) {
      return { isValid: false, error: "City is required for address validation" };
    }

    if (city.trim().length < 3) {
      return { isValid: false, error: "City name must be at least 3 characters long" };
    }

    if (!zip?.trim()) {
      return { isValid: false, error: "ZIP code is required for address validation" };
    }

    setIsValidatingAddress(true);
    setAddressValidationError("");

    const addressLine2 = street2 ? ` ${street2}` : "";
    const fullAddress = `${street1}${addressLine2}, ${city || ""}, ${state || "MA"} ${zip || ""}`.trim();

    try {
      const geocodeResult = await googlePlacesService.geocode(fullAddress);
      setIsValidatingAddress(false);

      if (geocodeResult?.addressComponents) {
        const addressComponents = geocodeResult.addressComponents;

            let foundState = false;
            let actualState = "";

            addressComponents.forEach((component) => {
              const types = component.types;

              if (types.includes("administrative_area_level_1")) {
                actualState = component.shortName;
                if (component.shortName === "MA") {
                  foundState = true;
                }
              }

            });

            if (actualState && actualState !== "MA") {
              setAddressValidationError(
                `This address is in ${actualState}, but this system only accepts Massachusetts addresses. Please select a Massachusetts address.`
              );
              return { isValid: false, error: t("errors.addressNotInMassachusettsShort") };
            }

            let cityMatch = false;
            let zipMatch = false;

            addressComponents.forEach((component) => {
              const types = component.types;

              if (types.includes("locality") || types.includes("administrative_area_level_2")) {
                if (city && city.trim().length > 0) {
                  const componentCity = component.longName.toLowerCase();
                  const inputCity = city.toLowerCase().trim();
                  
                  if (inputCity.length >= 3) {
                    if (
                      componentCity === inputCity ||
                      componentCity.startsWith(inputCity) ||
                      inputCity.startsWith(componentCity) ||
                      (componentCity.includes(inputCity) && inputCity.length >= 4)
                    ) {
                      cityMatch = true;
                    }
                  } else if (inputCity.length > 0) {
                    if (componentCity === inputCity) {
                      cityMatch = true;
                    }
                  }
                }
              }

              if (types.includes("postal_code")) {
                if (zip?.trim() && component.longName === zip.trim()) {
                  zipMatch = true;
                }
              }
            });

            if (foundState && cityMatch && zipMatch) {
              return { isValid: true, coordinates: { lat: geocodeResult.latitude, lng: geocodeResult.longitude } };
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
              return { isValid: false, error: "Address verification failed" };
            }
          } else {
            setAddressValidationError(
              "Invalid address. Please select from suggestions or enter a valid address."
            );
            return { isValid: false, error: "Invalid address" };
          }
        } catch (error) {
          console.error("Error validating address:", error);
          setIsValidatingAddress(false);
          setAddressValidationError("Error validating address. Please try again.");
          return { isValid: false, error: "Error validating address" };
        }
  }, [setIsValidatingAddress, setAddressValidationError, t]);

  const validateFilingEntityAddressStep = useCallback(async () => {
    if (!formData.filingEntityStreet1?.trim()) {
      return { isValid: true, errors: {} };
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
  }, [formData, validateAddressWithGeocodingGeneric]);

  const validateNoticeAddressStep = useCallback(async () => {
    const rightToCures = formData.rightToCures || [];
    const currentRTC = rightToCures.length > 0 ? rightToCures[0] : null;
    
    const noticeAddressStreet1 = currentRTC ? currentRTC.noticeAddressStreet1 : formData.noticeAddressStreet1;
    const noticeAddressCity = currentRTC ? currentRTC.noticeAddressCity : formData.noticeAddressCity;
    const noticeAddressState = currentRTC ? currentRTC.noticeAddressState : formData.noticeAddressState;
    const noticeAddressZip = currentRTC ? currentRTC.noticeAddressZip : formData.noticeAddressZip;
    
    if (!noticeAddressStreet1?.trim()) {
      return { isValid: true, errors: {} };
    }

    const addressData = {
      street1: noticeAddressStreet1,
      street2: "",
      city: noticeAddressCity || "",
      state: noticeAddressState || "MA",
      zip: noticeAddressZip || "",
    };

    const addressValidation = await validateAddressWithGeocodingGeneric(addressData);
    return addressValidation;
  }, [formData, validateAddressWithGeocodingGeneric]);

  const validateBorrowerAddressesStep = useCallback(async () => {
    if (!formData.borrowers || formData.borrowers.length === 0) {
      return { isValid: true, errors: {} };
    }

    const borrowersWithAddresses = formData.borrowers.filter(
      (borrower) => borrower.mailingStreet1?.trim()
    );

    if (borrowersWithAddresses.length === 0) {
      return { isValid: true, errors: {} };
    }

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
  }, [formData, validateAddressWithGeocodingGeneric]);

  const validateLoanAssigneeAddressesStep = useCallback(async () => {
    if (!formData.loanAssignees || formData.loanAssignees.length === 0) {
      return { isValid: true, errors: {} };
    }

    const assigneesWithAddresses = formData.loanAssignees.filter(
      (assignee) => assignee.street1?.trim()
    );

    if (assigneesWithAddresses.length === 0) {
      return { isValid: true, errors: {} };
    }

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
  }, [formData, validateAddressWithGeocodingGeneric]);

  useEffect(() => {
    if (!shouldValidateAddress || !pendingStepChange) return;

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
            markStepCompleted(2);
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

    if (currentStep === 5 && addressValidationType === "filingEntity" && formData?.filingEntityStreet1?.trim() && !isFilingEntityAddressVerified) {
      setShouldValidateAddress(false);
      validateFilingEntityAddressStep().then((validation) => {
        if (validation.isValid) {
          setIsFilingEntityAddressVerified(true);
          clearStepError(5);
          const filingEntityValidation = validateFilingEntity();
          if (!filingEntityValidation.hasErrors && userFilingEntityType) {
            markStepCompleted(5);
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

    if (currentStep === 6 && addressValidationType === "notice" && formData?.noticeAddressStreet1?.trim() && !isNoticeAddressVerified) {
      setShouldValidateAddress(false);
      validateNoticeAddressStep().then((validation) => {
        if (validation.isValid) {
          setIsNoticeAddressVerified(true);
          clearStepError(6);
          const rightToCureValidation = validateRightToCureDetails();
          if (!rightToCureValidation.hasErrors) {
            markStepCompleted(6);
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
          const borrowerValidation = validateBorrowerDetails();
          if (!borrowerValidation.hasErrors) {
            markStepCompleted(4);
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
          const loanAssigneesValidation = validateLoanAssignees();
          if (!loanAssigneesValidation.hasErrors) {
            markStepCompleted(8);
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
    }
  }, [shouldValidateAddress, currentStep, addressValidationType, formData, isAddressVerified, isFilingEntityAddressVerified, isNoticeAddressVerified, borrowerAddressesVerified, loanAssigneeAddressesVerified, pendingStepChange, stepsWithErrors, completedSteps, markStepCompleted, wizardGoToStep, setCurrentStep, clearStepError, addressValidationError, userFilingEntityType, validateBorrowerAddressesStep, validateBorrowerDetails, validateFilingEntity, validateRightToCureDetails, validateLoanAssignees, validateFilingEntityAddressStep, validateNoticeAddressStep, validateLoanAssigneeAddressesStep, validatePropertyDetailsStep]);

  const autoDetectAddressComponents = async (streetAddress, zipCode) => {
    if (!streetAddress.trim() || !zipCode.trim()) {
      return;
    }

    try {
      const fullAddress = `${streetAddress}, MA ${zipCode}`;

      const geocodeResult = await googlePlacesService.geocode(fullAddress);
      if (geocodeResult?.addressComponents) {
        const addressComponents = geocodeResult.addressComponents;

            let detectedCity = "";

            let detectedCounty = "";

            let isInMA = false;

            addressComponents.forEach((component) => {
              const types = component.types;

              if (types.includes("locality")) {
                detectedCity = component.longName;
              } else if (types.includes("administrative_area_level_2")) {
                detectedCounty = component.longName;
              } else if (types.includes("administrative_area_level_1")) {
                if (component.shortName === "MA") {
                  isInMA = true;
                }
              }
            });

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
        } catch (error) {
          console.error("Error auto-detecting address components:", error);
        }
      };

    const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    const integerFields = ["delinquencyDaysAtFiling", "daysDelinquentAtNotice"];
    const currencyFields = [
      "originalPrincipalAmount",
      "currentPrincipalBalance",
      "monthlyPaymentAmount",
      "amountInDefault",
    ];

    let processedValue = value;

    if (currencyFields.includes(name)) {
      const parsedValue = parseCurrencyInput(value);
      processedValue = parsedValue;
    }

    if (name === "minNumber" || name === "loanNumber") {
      processedValue = (processedValue || "").replaceAll(/\D+/g, "");
    }

    if (type === "number" && integerFields.includes(name) && value !== "") {
      const intValue = Number.parseInt(value, 10);
      processedValue = Number.isNaN(intValue) ? "" : intValue.toString();
    }

    setFormData((prev) => {
      const newFormData = {
      ...prev,
      [name]: (() => {
        if (type === "checkbox") return checked;
        if (type === "file") return files[0];
        return processedValue;
      })(),
      };

      if (name === "variableRate" || name === "interestOnly" || name === "negativeAmortization") {
        const variableRateChecked = name === "variableRate" ? checked : prev.variableRate;
        const interestOnlyChecked = name === "interestOnly" ? checked : prev.interestOnly;
        const negativeAmortizationChecked = name === "negativeAmortization" ? checked : prev.negativeAmortization;
        
        const hasAnyChecked = variableRateChecked || interestOnlyChecked || negativeAmortizationChecked;

        if (hasAnyChecked) {
          newFormData.certainMortgageLoan = true;
        }
      }

      return newFormData;
    });

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (name === "originationDate" && value.trim()) {
      const originationDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (!Number.isNaN(originationDate.getTime())) {
        if (originationDate >= today) {
          setFieldErrors((prev) => ({
            ...prev,
            originationDate: "Origination Date must be in the past",
          }));
        } else if (
          fieldErrors.originationDate === "Origination Date must be in the past"
        ) {
          setFieldErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.originationDate;
            return newErrors;
          });
        }
      }
    }

    if (name === "noticeDate" && value.trim()) {
      const noticeDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (!Number.isNaN(noticeDate.getTime())) {
        if (noticeDate >= today) {
          setFieldErrors((prev) => ({
            ...prev,
            noticeDate: "Notice Date must be in the past",
          }));
        } else if (
          fieldErrors.noticeDate === "Notice Date must be in the past"
        ) {
          setFieldErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.noticeDate;
            return newErrors;
          });
        }
      }
    }

    if (name === "interestRatePercent" && value !== "" && value !== null && value !== undefined) {
      const interestRate = Number.parseFloat(value) || 0;
      
      if (interestRate < 0 || interestRate > 100) {
        setFieldErrors((prev) => ({
          ...prev,
          interestRatePercent: "Interest Rate must be between 0% and 100%",
        }));
      } else if (
        fieldErrors.interestRatePercent === "Interest Rate must be between 0% and 100%"
      ) {
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.interestRatePercent;
          return newErrors;
        });
      }
    }

    const currentNoticeDate = (formData.rightToCures && formData.rightToCures.length > 0) 
      ? formData.rightToCures[0].noticeDate 
      : formData.noticeDate;
    
    if (name === "cureExpirationDate" && value.trim() && currentNoticeDate) {
      const noticeDate = new Date(currentNoticeDate);
      const cureExpirationDate = new Date(value);
      
      if (!Number.isNaN(noticeDate.getTime()) && !Number.isNaN(cureExpirationDate.getTime())) {
        if (cureExpirationDate <= noticeDate) {
          setFieldErrors((prev) => ({
            ...prev,
            cureExpirationDate:
              "Cure Expiration Date must be after Notice Date",
          }));
        } else if (
          fieldErrors.cureExpirationDate ===
          "Cure Expiration Date must be after Notice Date"
        ) {
          setFieldErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.cureExpirationDate;
            return newErrors;
          });
        }
      }
    }

    const currentCureExpirationDate = (formData.rightToCures && formData.rightToCures.length > 0) 
      ? formData.rightToCures[0].cureExpirationDate 
      : formData.cureExpirationDate;
    
    if (name === "noticeDate" && currentCureExpirationDate && value.trim()) {
      const noticeDate = new Date(value);
      const cureExpirationDate = new Date(currentCureExpirationDate);
      
      if (!Number.isNaN(noticeDate.getTime()) && !Number.isNaN(cureExpirationDate.getTime())) {
        if (cureExpirationDate <= noticeDate) {
          setFieldErrors((prev) => ({
            ...prev,
            cureExpirationDate:
              "Cure Expiration Date must be after Notice Date",
          }));
        } else if (
          fieldErrors.cureExpirationDate ===
          "Cure Expiration Date must be after Notice Date"
        ) {
          setFieldErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.cureExpirationDate;
            return newErrors;
          });
        }
      }
    }

    const currentBorrowerResponseDate = (formData.rightToCures && formData.rightToCures.length > 0) 
      ? formData.rightToCures[0].borrowerResponseDate 
      : formData.borrowerResponseDate;
    
    if (name === "borrowerResponseDate" && value.trim() && currentNoticeDate) {
      const noticeDate = new Date(currentNoticeDate);
      const responseDate = new Date(value);
      
      if (!Number.isNaN(noticeDate.getTime()) && !Number.isNaN(responseDate.getTime())) {
        noticeDate.setHours(0, 0, 0, 0);
        responseDate.setHours(0, 0, 0, 0);
        
        if (responseDate < noticeDate) {
          setFieldErrors((prev) => ({
            ...prev,
            borrowerResponseDate: "Borrower Response Date must be on or after Notice Date",
          }));
        } else if (
          fieldErrors.borrowerResponseDate === "Borrower Response Date must be on or after Notice Date"
        ) {
          setFieldErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.borrowerResponseDate;
            return newErrors;
          });
        }
      }
    }

    if (name === "noticeDate" && currentBorrowerResponseDate && value.trim()) {
      const noticeDate = new Date(value);
      const responseDate = new Date(currentBorrowerResponseDate);
      
      if (!Number.isNaN(noticeDate.getTime()) && !Number.isNaN(responseDate.getTime())) {
        noticeDate.setHours(0, 0, 0, 0);
        responseDate.setHours(0, 0, 0, 0);
        
        if (responseDate < noticeDate) {
          setFieldErrors((prev) => ({
            ...prev,
            borrowerResponseDate: "Borrower Response Date must be on or after Notice Date",
          }));
        } else if (
          fieldErrors.borrowerResponseDate === "Borrower Response Date must be on or after Notice Date"
        ) {
          setFieldErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.borrowerResponseDate;
            return newErrors;
          });
        }
      }
    }

    if (name === "manualOverrideReason" && value.trim()) {
      const accelerationDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (!Number.isNaN(accelerationDate.getTime())) {
        if (accelerationDate >= today) {
          setFieldErrors((prev) => ({
            ...prev,
            manualOverrideReason: "Acceleration date must be in the past",
          }));
        } else if (
          fieldErrors.manualOverrideReason === "Acceleration date must be in the past"
        ) {
          setFieldErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.manualOverrideReason;
            return newErrors;
          });
        }
      }
    }

    const currentNoticeSent = (formData.rightToCures && formData.rightToCures.length > 0) 
      ? formData.rightToCures[0].noticeSent 
      : formData.noticeSent;
    
    if (name === "amountInDefault" && currentNoticeSent === true && value !== "" && value !== null && value !== undefined) {
      const amount = Number.parseFloat(value) || 0;
      
      if (amount <= 0) {
        setFieldErrors((prev) => ({
          ...prev,
          amountInDefault: "Amount in Default must be greater than 0",
        }));
      } else if (
        fieldErrors.amountInDefault === "Amount in Default must be greater than 0"
      ) {
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.amountInDefault;
          return newErrors;
        });
      }
    }

    if (hasSavedDraft) {
      setHasSavedDraft(false);
    }

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

    if (name === "propertyStreet1" || name === "propertyZip") {
      const currentFormData = { ...formData, [name]: value };

      const streetAddress =
        name === "propertyStreet1" ? value : currentFormData.propertyStreet1;

      const zipCode =
        name === "propertyZip" ? value : currentFormData.propertyZip;

      if (globalThis.autoDetectTimeout) {
        clearTimeout(globalThis.autoDetectTimeout);
      }

      globalThis.autoDetectTimeout = setTimeout(() => {
        autoDetectAddressComponents(streetAddress, zipCode);
      }, 1000);
    }
  };

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

    if (["mailingStreet1", "mailingStreet2", "mailingCity", "mailingState", "mailingZip"].includes(field)) {
      setBorrowerAddressesVerified((prev) => {
        const newState = { ...prev };
        delete newState[borrowerId];
        return newState;
      });
    }
  };

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

    if (["street1", "street2", "city", "addressState", "zip"].includes(field)) {
      setLoanAssigneeAddressesVerified((prev) => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
      });
    }
  };

  const addRightToCure = () => {
    setFormData((prev) => ({
      ...prev,
      rightToCures: [
        ...prev.rightToCures,
        {
          id: null,
          noticeSent: null,
          noticeDate: "",
          amountInDefault: 0,
          daysDelinquentAtNotice: 0,
          cureExpirationDate: "",
          noticeAddressStreet1: "",
          noticeAddressCity: "",
          noticeAddressState: "",
          noticeAddressZip: "",
          manualOverrideReason: "",
          borrowerRespondedWithin30Days: null,
          borrowerResponseDate: "",
          proceededWithRightToCure: null,
        },
      ],
    }));
  };

  const removeRightToCure = (index) => {
    if (formData.rightToCures.length > 1 && isTakenOverPetition) {
      setFormData((prev) => ({
        ...prev,
        rightToCures: prev.rightToCures.filter((_, i) => i !== index),
      }));
      
      setIsNoticeAddressVerified(false);
    }
  };

  const updateRightToCure = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      rightToCures: prev.rightToCures.map((rtc, i) =>
        i === index ? { ...rtc, [field]: value } : rtc
      ),
    }));

    if (["noticeAddressStreet1", "noticeAddressCity", "noticeAddressState", "noticeAddressZip"].includes(field)) {
      setIsNoticeAddressVerified(false);
    }

    const errorKey = `rightToCures.${index}.${field}`;
    if (fieldErrors[errorKey]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };


  useEffect(() => {
    if (!isOpen) return;
    
    if (!formData) return;
    const loanValidation = validateLoanDetails();
    const shouldBeComplete = !loanValidation.hasErrors;
    
    if (lastStep3StateRef.current === shouldBeComplete && wizardCurrentStep === 3) {
      return;
    }
    lastStep3StateRef.current = shouldBeComplete;
    
    if (shouldBeComplete) {
      markStepCompleted(3);
      if (stepsWithErrors.has(3)) {
        clearStepError(3);
      }
    } else {
      markStepIncomplete(3);
    }
  }, [formData, stepsWithErrors, markStepCompleted, markStepIncomplete, clearStepError, isOpen, validateLoanDetails, wizardCurrentStep]);

  useEffect(() => {
    if (!isOpen) return;
    
    if (!formData) return;
    const rightToCureValidation = validateRightToCureDetails();
    let shouldBeComplete = false;
    
    if (!rightToCureValidation.hasErrors) {
      shouldBeComplete = true;
    }
    
    if (lastStep6StateRef.current === shouldBeComplete && wizardCurrentStep === 6) {
      return;
    }
    lastStep6StateRef.current = shouldBeComplete;
    
    if (shouldBeComplete) {
      markStepCompleted(6);
      if (stepsWithErrors.has(6)) {
        clearStepError(6);
      }
    } else {
      markStepIncomplete(6);
    }
  }, [formData, stepsWithErrors, markStepCompleted, markStepIncomplete, clearStepError, isOpen, wizardCurrentStep, validateRightToCureDetails]);

  useEffect(() => {
    if (!isOpen) return;
    
    if (!formData) return;
    const form35BValidation = validateForm35BCompliance();
    const shouldBeComplete = !form35BValidation.hasErrors;
    
    if (lastStep7StateRef.current === shouldBeComplete && wizardCurrentStep === 7) {
      return;
    }
    lastStep7StateRef.current = shouldBeComplete;
    
    if (shouldBeComplete) {
      markStepCompleted(7);
      if (stepsWithErrors.has(7)) {
        clearStepError(7);
      }
    } else {
      markStepIncomplete(7);
    }
  }, [formData, stepsWithErrors, markStepCompleted, markStepIncomplete, clearStepError, isOpen, wizardCurrentStep, validateForm35BCompliance]);

  const autoSaveCurrentStep = async () => {
    try {
      const saveData = {
        step: currentStep,
        formData: formData,
        timestamp: new Date().toISOString(),
        isDraft: true,
      };

      const existingDrafts = JSON.parse(
        sessionStorage.getItem("petitionDrafts") || "[]"
      );

      const draftIndex = existingDrafts.findIndex(
        (draft) => draft.step === currentStep
      );

      if (draftIndex >= 0) {
        existingDrafts[draftIndex] = saveData;
      } else {
        existingDrafts.push(saveData);
      }

      sessionStorage.setItem(STORAGE_KEYS.PETITION_DRAFTS, JSON.stringify(existingDrafts));

      setHasSavedDraft(true);
    } catch (error) {
      console.error("Error saving draft:", error);
    }
  };

  const saveCurrentStep = async () => {
    setIsSaving(true);

    try {
      if (!isOrgAdmin) {
        const finalOrganizationId = selectedOrganizationId || formData.organizationId || organizationId;
        if (!finalOrganizationId) {
          toast.error(t("errors.pleaseSelectOrganizationBeforeSaving"));
        setIsSaving(false);
        return;
        }
      }

      const editingPetitionId = sessionStorage.getItem("editingPetitionId");
      const isEditingDraft = !!editingPetitionId;

      const signerFirstName = isEditingDraft ? (user?.firstName || "") : (formData.signerFirstName || "");
      const signerMiddleInitial = isEditingDraft 
        ? (user?.middleName?.charAt(0).toUpperCase() || "")
        : (formData.signerMiddleInitial || "");
      const signerLastName = isEditingDraft ? (user?.lastName || "") : (formData.signerLastName || "");
      const signerEmail = isEditingDraft ? (user?.email || "") : (formData.signerEmail || "");
      const signerTitle = isEditingDraft ? (getUserRole(user) || "User") : (formData.signerTitle || getUserRole(user) || "User");
      const signerFullName = [
        signerFirstName,
        signerMiddleInitial,
        signerLastName,
      ]
        .filter(Boolean)
        .join(" ")
        .replaceAll(/\s+/g, " ")
        .trim();

      const existingSignature = formData.signatures && formData.signatures.length > 0 
        ? formData.signatures[0] 
        : null;

      const petitionData = {
        ...formData,

        signatures: [
          {
            signerFullName: signerFullName,
            signerTitle: signerTitle,
            signerEmail: signerEmail,
            esignConsent: formData.certification_check ?? existingSignature?.esignConsent ?? false,
            signatureDrawnOrTyped: isEditingDraft 
              ? (userProfile?.signatureImageName || "") 
              : (existingSignature?.signatureDrawnOrTyped || userProfile?.signatureImageName || ""),
            signedAt: isEditingDraft 
              ? "" 
              : (existingSignature?.signedAt || new Date().toISOString()),
            signerIp: "",
            otpCode: "",
          },
        ],
      };

      const finalOrganizationId = selectedOrganizationId || formData.organizationId || organizationId;
      
      const finalDraftData = {
        ...petitionData,
        organizationId: finalOrganizationId,
        isAllStepsCompleted: false,
      };

      if (isTakenOverPetition && user?.id) {
        finalDraftData.takeOverToUserId = user.id;
        finalDraftData.id = takenOverPetitionId;
      }

      const petitionIdToUse = editingPetitionId || (isTakenOverPetition ? takenOverPetitionId : null);
      const statusToSend = isTakenOverPetition ? takenOverPetitionStatus : null;

      await submitPetition(finalDraftData, true, petitionIdToUse, false, statusToSend);

      if (onPetitionSubmitted) {
        onPetitionSubmitted();
      }

      clearFormAndWizardState();
      onClose();
    } catch (err) {
      if (err?.isDuplicate && err.duplicateInfo?.canTakeOver) {
        setDuplicateInfo(err.duplicateInfo);
        setPendingAction('save');
        setShowTakeOverModal(true);
        setIsSaving(false);
        return;
      }
    } finally {
      setIsSaving(false);
    }
  };

  const nextStep = async (direction) => {
    const newStep = currentStep + direction;

    if (currentStep === 1 && direction === 1) {
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
        toast.error(t("errors.pleaseSelectOrganizationToContinue"));
        return;
      }
    }

    if (currentStep === 2 && direction === 1 && formData?.propertyStreet1?.trim() && !isAddressVerified) {
      setPendingStepChange(newStep);
      const validation = await validatePropertyDetailsStep();
      if (validation.isValid) {
        setIsAddressVerified(true);
        clearStepError(2);
        if (newStep >= 1 && newStep <= totalSteps) {
          const hasAllAddressFields = !!(formData.propertyStreet1?.trim() && 
                                        formData.propertyCity?.trim() && 
                                        formData.propertyState?.trim() && 
                                        formData.propertyZip?.trim() && 
                                        formData.propertyCounty?.trim());
          if (hasAllAddressFields) {
            markStepCompleted(2);
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
        setAddressValidationMessage(
          addressValidationError || "Address validation failed. Please check the address and try again."
        );
        setAddressValidationType("property");
        setShowAddressValidationDialog(true);
      }
        return;
    }

    if (currentStep === 5 && direction === 1 && formData?.filingEntityStreet1?.trim() && !isFilingEntityAddressVerified) {
      setPendingStepChange(newStep);
      const validation = await validateFilingEntityAddressStep();
      if (validation.isValid) {
        setIsFilingEntityAddressVerified(true);
        clearStepError(5);
        const filingEntityValidation = validateFilingEntity();
        if (!filingEntityValidation.hasErrors && userFilingEntityType) {
          markStepCompleted(5);
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

    if (currentStep === 6 && direction === 1 && formData?.noticeAddressStreet1?.trim() && !isNoticeAddressVerified) {
      setPendingStepChange(newStep);
      const validation = await validateNoticeAddressStep();
      if (validation.isValid) {
        setIsNoticeAddressVerified(true);
        clearStepError(6);
        const rightToCureValidation = validateRightToCureDetails();
        if (!rightToCureValidation.hasErrors) {
          markStepCompleted(6);
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
            const borrowerValidation = validateBorrowerDetails();
            if (!borrowerValidation.hasErrors) {
              markStepCompleted(4);
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
            const loanAssigneesValidation = validateLoanAssignees();
            if (!loanAssigneesValidation.hasErrors) {
              markStepCompleted(8);
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
      if (direction === 1) {
        let isStepComplete = false;
        
        switch (currentStep) {
          case 1:
            if (isOrgAdmin) {
              isStepComplete = !!(organizationId || selectedOrganizationId);
            } else {
              isStepComplete = !!selectedOrganizationId;
            }
            break;
          case 2: {
            const addressValidation = validateAddressFields();
            const hasAllAddressFields = !!(formData?.propertyStreet1?.trim() && 
                                          formData?.propertyCity?.trim() && 
                                          formData?.propertyState?.trim() && 
                                          formData?.propertyZip?.trim() && 
                                          formData?.propertyCounty?.trim());
            isStepComplete = !addressValidation.hasErrors && hasAllAddressFields;
            break;
          }
          case 3: {
            const loanValidation = validateLoanDetails();
            isStepComplete = !loanValidation.hasErrors;
            break;
          }
          case 4: {
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
          }
          case 5: {
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
          }
          case 6: {
            const rightToCureValidation = validateRightToCureDetails();
            if (!rightToCureValidation.hasErrors) {
              if (formData?.noticeAddressStreet1?.trim()) {
                isStepComplete = isNoticeAddressVerified;
              } else {
                isStepComplete = true;
              }
            }
            break;
          }
          case 7: {
            const form35BValidation = validateForm35BCompliance();
            isStepComplete = !form35BValidation.hasErrors;
            break;
          }
          case 8: {
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
          }
          case 9:
            isStepComplete = !!(userProfile?.signatureUrl && formData?.certification_check);
            break;
          default:
            isStepComplete = checkStepHasRequiredFields(currentStep);
        }
        
        if (isStepComplete) {
          markStepCompleted(currentStep);
          if (stepsWithErrors.has(currentStep)) {
            clearStepError(currentStep);
          }
        } else {
          markStepIncomplete(currentStep);
        }
      }

      await autoSaveCurrentStep();
      setCurrentStep(newStep);
      wizardGoToStep(newStep);
      previousStepRef.current = newStep;
      window.scrollTo(0, 0);
    }
  };

  const handleAddressValidationEdit = () => {
    setShowAddressValidationDialog(false);
    setAddressValidationMessage("");
    setAddressValidationType("");
    setAddressValidationContext(null);
    setPendingStepChange(null);

    if (addressValidationType === "property" && autocompleteRef.current) {
      autocompleteRef.current.focus();
    }
  };

  const handleEditSection = (stepNumber) => {
    wizardGoToStep(stepNumber);

    setCurrentStep(stepNumber);

    window.scrollTo(0, 0);
  };

  const handlePropertyValidation = () => {
    setIsAddressVerified(true);
    clearStepError(2);
    const addressValidation = validateAddressFields();
    return !addressValidation.hasErrors;
  };

  const handleFilingEntityValidation = () => {
    setIsFilingEntityAddressVerified(true);
    clearStepError(5);
    if (userFilingEntityType) {
      const filingEntityValidation = validateFilingEntity();
      return !filingEntityValidation.hasErrors;
    }
    return false;
  };

  const handleNoticeValidation = () => {
    setIsNoticeAddressVerified(true);
    clearStepError(5);
    const rightToCureValidation = validateRightToCureDetails();
    return !rightToCureValidation.hasErrors;
  };

  const handleBorrowerValidation = () => {
    const verified = {};
    formData.borrowers.forEach((borrower) => {
      if (borrower.mailingStreet1?.trim()) {
        verified[borrower.id] = true;
      }
    });
    setBorrowerAddressesVerified(prev => ({ ...prev, ...verified }));
    clearStepError(4);
    const borrowerValidation = validateBorrowerDetails();
    return !borrowerValidation.hasErrors;
  };

  const handleLoanAssigneeValidation = () => {
    const verified = {};
    formData.loanAssignees.forEach((assignee, index) => {
      if (assignee.street1?.trim()) {
        verified[index] = true;
      }
    });
    setLoanAssigneeAddressesVerified(prev => ({ ...prev, ...verified }));
    clearStepError(8);
    const loanAssigneesValidation = validateLoanAssignees();
    return !loanAssigneesValidation.hasErrors;
  };

  const getStepCompletionStatus = (validationType) => {
    if (validationType === "property" && currentStep === 2) {
      return handlePropertyValidation();
    }
    if (validationType === "filingEntity" && currentStep === 5) {
      return handleFilingEntityValidation();
    }
    if (validationType === "notice" && currentStep === 6) {
      return handleNoticeValidation();
    }
    if (validationType === "borrower" && currentStep === 4) {
      return handleBorrowerValidation();
    }
    if (validationType === "loanAssignee" && currentStep === 8) {
      return handleLoanAssigneeValidation();
    }
    return checkStepHasRequiredFields(currentStep);
  };

  const handleAddressValidationProceed = async () => {
    const validationType = addressValidationType;
    
    setShowAddressValidationDialog(false);
    setAddressValidationMessage("");
    setAddressValidationType("");
    setAddressValidationContext(null);

    const newStep = pendingStepChange || (currentStep + 1);
    setPendingStepChange(null);

    if (newStep >= 1 && newStep <= totalSteps) {
      await autoSaveCurrentStep();

      const isStepComplete = getStepCompletionStatus(validationType);

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
      window.scrollTo(0, 0);
    }
  };

  const validateAllSteps = async () => {
    clearAllStepErrors();
    const stepsWithValidationErrors = new Set();
    const allFieldErrors = {};

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

    const addressValidation = validateAddressFields();
    if (addressValidation.hasErrors) {
      stepsWithValidationErrors.add(2);
      Object.assign(allFieldErrors, addressValidation.errors);
    } else if (formData.propertyStreet1?.trim() && !isAddressVerified) {
      const addressGeocodingValidation = await validatePropertyDetailsStep();
      if (!addressGeocodingValidation.isValid) {
        stepsWithValidationErrors.add(2);
        if (addressGeocodingValidation.errors) {
          Object.assign(allFieldErrors, addressGeocodingValidation.errors);
        }
      }
    }

    const loanValidation = validateLoanDetails();
    if (loanValidation.hasErrors) {
      stepsWithValidationErrors.add(3);
      Object.assign(allFieldErrors, loanValidation.errors);
    }

    const borrowerValidation = validateBorrowerDetails();
    if (borrowerValidation.hasErrors) {
      stepsWithValidationErrors.add(4);
      Object.assign(allFieldErrors, borrowerValidation.errors);
    }

    if (!visitedSteps.has(5)) {
      stepsWithValidationErrors.add(5);
      allFieldErrors.filingEntityStep = "Please visit the Filing Entity step at least once";
    } else if (userFilingEntityType === null || userFilingEntityType === undefined) {
      stepsWithValidationErrors.add(5);
      allFieldErrors.filingEntityType = "Filing Entity Type is required";
    } else {
      const filingEntityValidation = validateFilingEntity();
      if (filingEntityValidation.hasErrors) {
        stepsWithValidationErrors.add(5);
        Object.assign(allFieldErrors, filingEntityValidation.errors);
      }
    }

    const rightToCureValidation = validateRightToCureDetails();
    if (rightToCureValidation.hasErrors) {
      stepsWithValidationErrors.add(6);
      Object.assign(allFieldErrors, rightToCureValidation.errors);
    }

    const form35BValidation = validateForm35BCompliance();
    if (form35BValidation.hasErrors) {
      stepsWithValidationErrors.add(7);
      Object.assign(allFieldErrors, form35BValidation.errors);
    }

    const loanAssigneesValidation = validateLoanAssignees();
    if (loanAssigneesValidation.hasErrors) {
      stepsWithValidationErrors.add(8);
      Object.assign(allFieldErrors, loanAssigneesValidation.errors);
    }

    if (!userProfile?.signatureImageName) {
      stepsWithValidationErrors.add(9);
      allFieldErrors.signature = "Signature is required";
    }
    if (!formData.certification_check) {
      stepsWithValidationErrors.add(9);
      allFieldErrors.certification_check = "Certification checkbox must be checked";
    }

    setFieldErrors(allFieldErrors);
    stepsWithValidationErrors.forEach(step => {
      markStepWithError(step);
    });

    return {
      hasErrors: stepsWithValidationErrors.size > 0,
      stepsWithErrors: Array.from(stepsWithValidationErrors)
    };
  };

  const prepareSignerData = (isEditingDraft) => {
    const signerFirstName = isEditingDraft ? (user?.firstName || "") : (formData.signerFirstName || "");
    const signerMiddleInitial = isEditingDraft 
      ? (user?.middleName?.charAt(0).toUpperCase() || "")
      : (formData.signerMiddleInitial || "");
    const signerLastName = isEditingDraft ? (user?.lastName || "") : (formData.signerLastName || "");
    const signerEmail = isEditingDraft ? (user?.email || "") : (formData.signerEmail || "");
    const signerTitle = isEditingDraft ? (getUserRole(user) || "User") : (formData.signerTitle || getUserRole(user) || "User");
    const signerFullName = [
      signerFirstName,
      signerMiddleInitial,
      signerLastName,
    ]
      .filter(Boolean)
      .join(" ")
      .replaceAll(/\s+/g, " ")
      .trim();

    return { signerFirstName, signerMiddleInitial, signerLastName, signerEmail, signerTitle, signerFullName };
  };

  const preparePetitionData = (isEditingDraft, signerData) => {
    const existingSignature = formData.signatures && formData.signatures.length > 0 
      ? formData.signatures[0] 
      : null;

    return {
      ...formData,
      isAllStepsCompleted: true,
      signatures: [
        {
          signerFullName: signerData.signerFullName,
          signerTitle: signerData.signerTitle,
          signerEmail: signerData.signerEmail,
          esignConsent: formData.certification_check || false,
          signatureDrawnOrTyped: isEditingDraft 
            ? (userProfile?.signatureImageName || "") 
            : (existingSignature?.signatureDrawnOrTyped || userProfile?.signatureImageName || ""),
          signedAt: new Date().toISOString(),
          signerIp: "",
          otpCode: "",
        },
      ],
    };
  };

  const handleSubmit = async (e, isIntentional = false) => {
    e.preventDefault();

    if (currentStep !== totalSteps || !isIntentional) {
      return;
    }

    if (!isOrgAdmin) {
      const finalOrganizationId = selectedOrganizationId || formData.organizationId || organizationId;
      if (!finalOrganizationId) {
        toast.error("Please select an organization before submitting the petition.");
        return;
      }
    }

    const validationResult = await validateAllSteps();
    
    if (validationResult.hasErrors) {
      toast.error(
        "Please complete all required fields before submitting your petition."
      );
      if (validationResult.stepsWithErrors.length > 0) {
        const firstErrorStep = validationResult.stepsWithErrors[0];
        wizardGoToStep(firstErrorStep);
        setCurrentStep(firstErrorStep);
        window.scrollTo(0, 0);
      }
      return;
    }

    try {
      const editingPetitionId = sessionStorage.getItem("editingPetitionId");
      const isEditingDraft = !!editingPetitionId;

      const signerData = prepareSignerData(isEditingDraft);
      const petitionData = preparePetitionData(isEditingDraft, signerData);

      const finalOrganizationId = selectedOrganizationId || formData.organizationId || organizationId;
      
      const finalPetitionData = {
        ...petitionData,
        organizationId: finalOrganizationId,
        isAllStepsCompleted: true,
      };

      if (isTakenOverPetition && user?.id) {
        finalPetitionData.takeOverToUserId = user.id;
        finalPetitionData.id = takenOverPetitionId;
        finalPetitionData.isAllStepsCompleted = true;
      }

      const petitionIdToUse = editingPetitionId || (isTakenOverPetition ? takenOverPetitionId : null);
      const statusToSend = isTakenOverPetition ? takenOverPetitionStatus : null;

      await submitPetition(finalPetitionData, false, petitionIdToUse, false, statusToSend);

      if (onPetitionSubmitted) {
        onPetitionSubmitted();
      }

      clearFormAndWizardState();
      onClose();
    } catch (err) {
      if (err?.isDuplicate && err.duplicateInfo?.canTakeOver) {
        setDuplicateInfo(err.duplicateInfo);
        setPendingAction('submit');
        setShowTakeOverModal(true);
        return;
      }
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: {
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
      }

      case 2:
        return (
          <Step2PropertyDetails
          isAddressVerified={isAddressVerified}
          isLoaded={true}
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
            getLenderTypes={getLenderTypes}
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
              borrowerAddressesVerified={borrowerAddressesVerified}
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
            setFieldErrors={setFieldErrors}
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
            isTakenOverPetition={isTakenOverPetition}
            addRightToCure={addRightToCure}
            removeRightToCure={removeRightToCure}
            updateRightToCure={updateRightToCure}
          />
        );

      case 7:
        return (
          <Step7Form35BCompliance
            formData={formData}
            setFormData={setFormData}
            fieldErrors={fieldErrors}
            isCertainMortgageLoanReadOnly={
              formData.variableRate || formData.interestOnly || formData.negativeAmortization
            }
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

  if (!isOpen) return null;

  const handleTakeOverConfirm = async (petitionData, duplicateInfoData) => {
    if (!petitionData) {
      toast.error("Failed to load petition data for takeover");
      return;
    }

    setShowTakeOverModal(false);
    
    const transformedData = transformTakeOverPetitionData(petitionData);
    
    if (!transformedData) {
      toast.error("Failed to transform petition data. The data structure may be invalid.");
      return;
    }
    
    if (!user) {
      toast.error(t("errors.userInfoRequiredForTakeover"));
      return;
    }
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
        .replaceAll(/\s+/g, " ")
        .trim();

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
      
      setFormData(finalFormData);
      
      if (finalFormData.borrowers && finalFormData.borrowers.length > 0) {
        const verifiedAddresses = {};
        finalFormData.borrowers.forEach((borrower) => {
          if (borrower.mailingStreet1?.trim()) {
            verifiedAddresses[borrower.id] = true;
          }
        });
        if (Object.keys(verifiedAddresses).length > 0) {
          setBorrowerAddressesVerified(verifiedAddresses);
        }
      }
      
      setIsTakenOverPetition(true);
      setTakenOverPetitionId(duplicateInfoData?.petitionId || petitionData.id);
      const petitionNumber = petitionData?.petitionNumber || null;
      setTakenOverPetitionNumber(petitionNumber);
      const originalStatus = petitionData?.status || null;
      setTakenOverPetitionStatus(originalStatus);
      
      setPendingAction(null);
      setShouldTakeOver(false);
      
      if (isOrgAdmin === false) {
        setSelectedOrganizationId(null);
        setOrganizationData(null);
        setActiveOrganizationId(null);
        finalFormData.organizationId = null;
        finalFormData.filingEntityLegalName = "";
        finalFormData.filingEntityStreet1 = "";
        finalFormData.filingEntityStreet2 = "";
        finalFormData.filingEntityCity = "";
        finalFormData.filingEntityState = "";
        finalFormData.filingEntityZip = "";
        finalFormData.filingContactName = "";
        finalFormData.filingContactEmail = "";
        finalFormData.filingContactPhone = "";
      } else if (organizationId) {
        finalFormData.organizationId = organizationId;
      }
      setFormData(finalFormData);
      
      if (isOrgAdmin && organizationId) {
        try {
          setOrganizationLoading(true);
          const orgResponse = await getOrganizationById(organizationId);
          if (orgResponse.isSuccess && orgResponse.data) {
            const orgData = orgResponse.data;
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
            setSelectedOrganizationId(organizationId);
          }
        } catch (err) {
          toast.error(err?.message || "Failed to load organization data. Please try again.");
        } finally {
          setOrganizationLoading(false);
        }
      }
      
      const successMessage = (() => {
        if (isOrgAdmin || selectedOrganizationId) {
          return "Petition data loaded. Please review all steps before submitting.";
        }
        return "Petition data loaded. Please select an organization and review all steps before submitting.";
      })();
      toast.success(successMessage);
      
      wizardGoToStep(1);
  };

  const handleTakeOverCancel = () => {
    setShowTakeOverModal(false);
    setDuplicateInfo(null);
    setShouldTakeOver(false);
    setPendingAction(null);
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
                <i className="fas fa-arrow-right me-2" />{" "}
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
                <h5 className="modal-title">{t("petitionWizard.closeConfirmationTitle")}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCloseConfirmDialog(false)}
                  aria-label={t("petitionWizard.close")}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-4">{t("petitionWizard.closeConfirmationMessage")}</p>
                <div className="d-flex justify-content-between gap-2">
                  <button
                    type="button"
                    className="dashboard-btn-refresh"
                    onClick={() => setShowCloseConfirmDialog(false)}
                  >
                    {t("petitionWizard.cancel")}
                  </button>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="dashboard-btn-refresh"
                      onClick={handleDiscardAndClose}
                    >
                      {t("petitionWizard.discardChanges")}
                    </button>
                    {!isTakenOverPetition && (
                      <button
                        type="button"
                        className="dashboard-btn-create"
                        onClick={handleSaveDraftAndClose}
                        disabled={isSaving}
                      >
                        {isSaving ? t("petitionWizard.saving") : t("petitionWizard.saveAsDraft")}
                      </button>
                    )}
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
              <div className="d-flex flex-column">
                <div className="d-flex align-items-center gap-2">
                  <h5 className="modal-title mb-0">{t("petitionWizard.title")}</h5>
                </div>
                {isTakenOverPetition && (
                  <div className="mt-1" style={{ fontSize: "0.8rem", opacity: "0.9", display: "flex", alignItems: "center", gap: "6px" }}>
                    <i className="fas fa-exchange-alt" style={{ fontSize: "0.75rem" }}></i>
                    <span>{t("petitionWizard.petitionTakenOver")}{takenOverPetitionNumber ? `: ${takenOverPetitionNumber}` : ''}</span>
                  </div>
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

            <div className="modal-body petition-steps-body" ref={modalBodyRef}>
              {/* Desktop Sidebar */}

              <div className="petition-steps-sidebar d-none d-lg-block">
                <PetitionStepper />
              </div>

              {/* Form Content */}

              <div className="petition-steps-form position-relative" ref={formContainerRef}>

                <div className="container-fluid">
                  {/* Mobile Stepper */}

                  <div className="d-lg-none mb-3">
                    <PetitionStepper />
                  </div>

                  <header className="border-bottom mb-3">
                    <p className="font-base text-muted">
                      {t("petitionWizard.description")}
                    </p>
                  </header>

                  <div className="position-relative">
                    <p className="font-base fw-bold">
                      {t("petitionWizard.stepOf")} {currentStep} {t("petitionWizard.of")} {totalSteps}
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
                    {t("petitionWizard.previousStep")}
                  </button>

                  <div className="d-flex gap-2">
                    {/* Save as Draft Button - Hidden in take-over mode */}
                    {!isTakenOverPetition && (
                      <button
                        type="button"
                        className="dashboard-btn-refresh"
                        onClick={saveCurrentStep}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <output
                              className="spinner-border spinner-border-sm me-2"
                              aria-hidden="true"
                            />
                            {t("petitionWizard.saving")}
                          </>
                        ) : (
                          t("petitionWizard.saveAsDraft")
                        )}
                      </button>
                    )}

                    {/* Next Step, Review, or Submit Button */}

                    {(() => {
                      if (currentStep < 9) {
                        return (
                          <button
                            type="button"
                            className="dashboard-btn-create"
                            onClick={() => nextStep(1)}
                          >
                            {t("petitionWizard.nextStep")}
                          </button>
                        );
                      }
                      if (currentStep === 9) {
                        return (
                          <button
                            type="button"
                            className="dashboard-btn-create"
                            onClick={() => nextStep(1)}
                          >
                            {t("petitionWizard.reviewPetition")}
                          </button>
                        );
                      }
                      return (
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
                            <output
                              className="spinner-border spinner-border-sm me-2"
                              aria-hidden="true"
                            />
                            {t("petitionWizard.submitting")}
                          </>
                        ) : (
                          t("petitionWizard.submitPetition")
                        )}
                      </button>
                      );
                    })()}
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
