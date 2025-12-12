import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useTabs } from "../../context/TabContext";
import { STORAGE_KEYS } from "../../constants/appConstants";
import { usePetitionCommonData } from "../../hooks/usePetitionCommonData";
import { usePetitions } from "../../hooks/usePetitions";
import { toast } from "react-toastify";
import "./PetitionForm.css";
import googlePlacesService from "../../services/googlePlacesService";
import PropertyDetailsCard from "./Sections/PropertyDetailsCard";
import LoanDetails from "./Sections/LoanDetails";
import BorrowerDetails from "./Sections/BorrowerDetails";
import StepFilingEntity from "./Sections/FilingEntity";
import StepRightToCure from "./Sections/StepRightToCure";
import ForeclosureSaleSection from "./Sections/ForeclosureSaleSection";
import StepForm35BCompliance from "./Sections/StepForm35BCompliance";
import StepLoanAssignees from "./Sections/StepLoanAssignees";
import StepSignaturesSection from "./Sections/StepSignaturesSection";
import JudgmentDisplaySection from "./Sections/JudgmentDisplaySection";
import ForeclosureSaleDisplaySection from "./Sections/ForeclosureSaleDisplaySection";
import NotesDisplaySection from "./Sections/NotesDisplaySection";
import EditJudgementModal from "./EditJudgementModal";
import EditForeclosureModal from "./EditForeclosureModal";
import NotesModal from "./NotesModal";
import PetitionContentSidebar from "./PetitionContentSidebar";
import "./PetitionContentSidebar.css";
import { useAuth } from "../../context/AuthContext";
import PetitionSteps from "./PetitionSteps";
import petitionApiService from "../../services/petitionApiService";
import { formatDateForInput } from "../../utils/dateUtils";
import {
  validatePropertyDetails as validatePropertyDetailsHelper,
  validateLoanDetails as validateLoanDetailsHelper,
  validateBorrowerDetails as validateBorrowerDetailsHelper,
  validateRightToCureDetails as validateRightToCureDetailsHelper,
  validateForm35BCompliance as validateForm35BComplianceHelper,
  validateFilingEntity as validateFilingEntityHelper,
  validateLoanAssignees as validateLoanAssigneesHelper,
} from "../../helpers/petitions/formValidation";

const PetitionTabContent = ({ petition, onPetitionUpdated, isPublic = false }) => {
  const { t } = useTranslation();
  const { loadingTabs, activeTabId, refreshTab } = useTabs();
  const {
    getLoanTypes,
    getAssigneeTypes,
    getAssigneeRoles,
    getLienPositions,
    getBuyerTypes,
    getLenderTypes,
    getJudgmentTypes,
    getForeclosureAlternativeOptions,
    getOptionName,
    findOptionByValue,
    loading: commonDataLoading,
  } = usePetitionCommonData();
  const { submitPetition } = usePetitions();

  // Section-level editing state - each section can be edited independently
  const [editingSections, setEditingSections] = useState({});
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Sidebar state for section navigation
  const [activeSection, setActiveSection] = useState(null);
  
  // Legacy isEditing for backward compatibility
  const isEditing = Object.values(editingSections).some(editing => editing === true);
  
  // Modal states
  const [showJudgementModal, setShowJudgementModal] = useState(false);
  const [showForeclosureModal, setShowForeclosureModal] = useState(false);
  const [showEditDropdown, setShowEditDropdown] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showNotesDropdown, setShowNotesDropdown] = useState(false);
  const [showNotesSection, setShowNotesSection] = useState(false);
  const [showForeclosureWarningModal, setShowForeclosureWarningModal] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState(null);
  const [showPetitionWizard, setShowPetitionWizard] = useState(false);
  
  const { user } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const [selectedPredictionIndex, setSelectedPredictionIndex] = useState(-1);
  const propertyAddressInputRef = useRef(null);
  const signatureSectionRef = useRef(null);
  const foreclosureSaleSectionRef = useRef(null);
  
  // Section refs for scrolling
  const propertyDetailsRef = useRef(null);
  const loanDetailsRef = useRef(null);
  const borrowerDetailsRef = useRef(null);
  const filingEntityRef = useRef(null);
  const rightToCureRef = useRef(null);
  const form35BRef = useRef(null);
  const loanAssigneesRef = useRef(null);
  const signaturesRef = useRef(null);
  const judgmentRef = useRef(null);
  const foreclosureSaleRef = useRef(null);
  const notesRef = useRef(null);
  // Borrower address autocomplete
  const [borrowerPredictions, setBorrowerPredictions] = useState({}); // { [borrowerId]: Prediction[] }
  const [isLoadingBorrowerPredictions, setIsLoadingBorrowerPredictions] =
    useState({}); // { [borrowerId]: boolean }
  // Loan assignee address autocomplete
  const [assigneePredictions, setAssigneePredictions] = useState({}); // { [index]: Prediction[] }
  const [isLoadingAssigneePredictions, setIsLoadingAssigneePredictions] =
    useState({}); // { [index]: boolean }
  // Notice address autocomplete - per entry
  const [noticePredictions, setNoticePredictions] = useState({}); // { [index]: Prediction[] }
  const [isLoadingNoticePredictions, setIsLoadingNoticePredictions] =
    useState({}); // { [index]: boolean }


  const handlePropertyAddressInput = async (value) => {
    if (!value.trim()) {
      setPredictions([]);
      setShowPredictions(false);
      setIsLoadingPredictions(false);
      return;
    }
    if (window.autocompleteTimeout) clearTimeout(window.autocompleteTimeout);
    window.autocompleteTimeout = setTimeout(async () => {
      setIsLoadingPredictions(true);
      try {
        const suggestions = await googlePlacesService.autocomplete(value);
        // Convert to format expected by UI (description, place_id)
        const formattedPredictions = suggestions.slice(0, 5).map(s => ({
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
    }, 250);
  };

  const handlePropertyAddressSelect = async (prediction) => {
    setPredictions([]);
    setShowPredictions(false);
    setSelectedPredictionIndex(-1);
    // Fill street immediately for snappy UX
    const street = prediction.description?.split(",")[0] || "";
    setFormData((prev) => ({ ...prev, propertyStreet1: street }));
    // Geocode to populate city/state/zip/county
    const placeId = prediction.place_id || prediction.placeId;
    try {
      const placeDetails = await googlePlacesService.getPlaceDetails(placeId);
      if (placeDetails && placeDetails.addressComponents) {
        const comp = placeDetails.addressComponents;
        const get = (type) => comp.find((c) => c.types.includes(type));
        const streetNumber = get("street_number")?.longName || "";
        const route = get("route")?.longName || "";
        const city =
          get("locality")?.longName || get("sublocality")?.longName || "";
        const state = get("administrative_area_level_1")?.shortName || "";
        const zip = get("postal_code")?.longName || "";
        const countyComp = get("administrative_area_level_2");
        const countyName = countyComp?.longName || "";
        const street1 = [streetNumber, route].filter(Boolean).join(" ");
        
        setFormData((prev) => ({
          ...prev,
          propertyStreet1: street1 || prev.propertyStreet1,
          propertyCity: city || prev.propertyCity,
          propertyState: state || prev.propertyState,
          propertyZip: zip || prev.propertyZip,
          propertyCounty: countyName || prev.propertyCounty,
        }));
      }
    } catch (error) {
      // Error geocoding address - non-critical, continue with form data
      console.error("Failed to geocode address:", error);
    }
    if (propertyAddressInputRef.current) propertyAddressInputRef.current.blur();
  };

  // Handle keyboard navigation for property address suggestions
  const handlePropertyAddressKeyDown = (e) => {
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
          handlePropertyAddressSelect(predictions[selectedPredictionIndex]);
        }
        break;
      case "Escape":
        setShowPredictions(false);
        setPredictions([]);
        setSelectedPredictionIndex(-1);
        break;
    }
  };

  // Generic helper: geocode by placeId and update fields via setter
  const geocodePlaceAndFill = async (placeId, apply) => {
    if (!placeId) return;
    try {
      const placeDetails = await googlePlacesService.getPlaceDetails(placeId);
      if (placeDetails && placeDetails.addressComponents) {
        const comp = placeDetails.addressComponents;
        const get = (type) => comp.find((c) => c.types.includes(type));
        const streetNumber = get("street_number")?.longName || "";
        const route = get("route")?.longName || "";
        const city =
          get("locality")?.longName || get("sublocality")?.longName || "";
        const state = get("administrative_area_level_1")?.shortName || "";
        const zip = get("postal_code")?.longName || "";
        const street1 = [streetNumber, route].filter(Boolean).join(" ");
        apply({ street1, city, state, zip });
      }
    } catch (e) {
      // ignore
    }
  };

  // Borrower mailing address handlers
  const handleBorrowerAddressInput = async (borrowerId, value) => {
    if (!value.trim()) {
      setBorrowerPredictions((prev) => ({ ...prev, [borrowerId]: [] }));
      return;
    }
    if (window.autocompleteTimeout) clearTimeout(window.autocompleteTimeout);
    setIsLoadingBorrowerPredictions((prev) => ({
      ...prev,
      [borrowerId]: true,
    }));
    window.autocompleteTimeout = setTimeout(async () => {
      try {
        const suggestions = await googlePlacesService.autocomplete(value);
        const formattedPredictions = suggestions.slice(0, 5).map(s => ({
          description: s.description,
          place_id: s.placeId,
        }));
        setBorrowerPredictions((prev) => ({
          ...prev,
          [borrowerId]: formattedPredictions,
        }));
      } catch (error) {
        console.error("Error getting autocomplete suggestions:", error);
        setBorrowerPredictions((prev) => ({ ...prev, [borrowerId]: [] }));
      } finally {
        setIsLoadingBorrowerPredictions((prev) => ({
          ...prev,
          [borrowerId]: false,
        }));
      }
    }, 250);
  };

  const handleBorrowerAddressSelect = async (borrowerId, prediction) => {
    setBorrowerPredictions((prev) => ({ ...prev, [borrowerId]: [] }));
    const street = prediction.description?.split(",")[0] || "";
    setFormData((prev) => ({
      ...prev,
      borrowers: prev.borrowers.map((b) =>
        b.id === borrowerId ? { ...b, mailingStreet1: street } : b
      ),
    }));
    const placeId = prediction.place_id || prediction.placeId;
    await geocodePlaceAndFill(placeId, ({ street1, city, state, zip }) => {
      setFormData((prev) => ({
        ...prev,
        borrowers: prev.borrowers.map((b) =>
          b.id === borrowerId
            ? {
                ...b,
                mailingStreet1: street1 || b.mailingStreet1,
                mailingCity: city || b.mailingCity,
                mailingState: state || b.mailingState,
                mailingZip: zip || b.mailingZip,
              }
            : b
        ),
      }));
    });
  };

  // Loan assignee address handlers
  const handleAssigneeAddressInput = async (index, value) => {
    if (!value.trim()) {
      setAssigneePredictions((prev) => ({ ...prev, [index]: [] }));
      return;
    }
    if (window.autocompleteTimeout) clearTimeout(window.autocompleteTimeout);
    setIsLoadingAssigneePredictions((prev) => ({ ...prev, [index]: true }));
    window.autocompleteTimeout = setTimeout(async () => {
      try {
        const suggestions = await googlePlacesService.autocomplete(value);
        const formattedPredictions = suggestions.slice(0, 5).map(s => ({
          description: s.description,
          place_id: s.placeId,
        }));
        setAssigneePredictions((prev) => ({
          ...prev,
          [index]: formattedPredictions,
        }));
      } catch (error) {
        console.error("Error getting autocomplete suggestions:", error);
        setAssigneePredictions((prev) => ({ ...prev, [index]: [] }));
      } finally {
        setIsLoadingAssigneePredictions((prev) => ({
          ...prev,
          [index]: false,
        }));
      }
    }, 250);
  };

  const handleAssigneeAddressSelect = async (index, prediction) => {
    setAssigneePredictions((prev) => ({ ...prev, [index]: [] }));
    const street = prediction.description?.split(",")[0] || "";
    setFormData((prev) => ({
      ...prev,
      loanAssignees: prev.loanAssignees.map((a, i) =>
        i === index ? { ...a, street1: street } : a
      ),
    }));
    const placeId = prediction.place_id || prediction.placeId;
    await geocodePlaceAndFill(placeId, ({ street1, city, state, zip }) => {
      setFormData((prev) => ({
        ...prev,
        loanAssignees: prev.loanAssignees.map((a, i) =>
          i === index
            ? {
                ...a,
                street1: street1 || a.street1,
                city: city || a.city,
                addressState: state || a.addressState,
                zip: zip || a.zip,
              }
            : a
        ),
      }));
    });
  };

  // Notice address handlers
  const handleNoticeAddressInput = async (index, value) => {
    if (!value.trim()) {
      setNoticePredictions((prev) => ({ ...prev, [index]: [] }));
      return;
    }
    if (window.autocompleteTimeout) clearTimeout(window.autocompleteTimeout);
    setIsLoadingNoticePredictions((prev) => ({ ...prev, [index]: true }));
    window.autocompleteTimeout = setTimeout(async () => {
      try {
        const suggestions = await googlePlacesService.autocomplete(value);
        const formattedPredictions = suggestions.slice(0, 5).map(s => ({
          description: s.description,
          place_id: s.placeId,
        }));
        setNoticePredictions((prev) => ({
          ...prev,
          [index]: formattedPredictions,
        }));
      } catch (error) {
        console.error("Error getting autocomplete suggestions:", error);
        setNoticePredictions((prev) => ({ ...prev, [index]: [] }));
      } finally {
        setIsLoadingNoticePredictions((prev) => ({
          ...prev,
          [index]: false,
        }));
      }
    }, 250);
  };

  const handleNoticeAddressSelect = async (prediction, index) => {
    if (index === null || index === undefined) return;
    
    setNoticePredictions((prev) => ({ ...prev, [index]: [] }));
    const street = prediction.description?.split(",")[0] || "";
    
    // Update specific rightToCure entry
    const placeId = prediction.place_id || prediction.placeId;
    await geocodePlaceAndFill(placeId, ({ street1, city, state, zip }) => {
      updateRightToCure(index, "noticeAddressStreet1", street1 || street);
      if (city) updateRightToCure(index, "noticeAddressCity", city);
      if (state) updateRightToCure(index, "noticeAddressState", state);
      if (zip) updateRightToCure(index, "noticeAddressZip", zip);
    });
  };

  // Transform petition.details to formData structure matching PetitionSteps
  const initialFormData = useMemo(() => {
    if (!petition?.details) return null;

    const details = petition.details;
    const mappedBorrowers = [];
    let hasPrimaryBorrower = false;

    (details.borrowers || []).forEach((b, idx) => {
      const isPrimary = b.borrowerIsPrimary === true;
      if (isPrimary) hasPrimaryBorrower = true;
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

    if (!hasPrimaryBorrower && mappedBorrowers.length > 0) {
      mappedBorrowers[0] = {
        ...mappedBorrowers[0],
        borrowerIsPrimary: true,
      };
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
      
      // Judgment
      judgment: details.judgment || null,
      petitionLoanTypeId: details.loan?.petitionLoanTypeId || "",
      petitionLoanTypeName: details.loan?.petitionLoanTypeName || "",
      lienPosition: details.loan?.lienPosition ?? "",
      originationDate: details.loan?.originationDate
        ? formatDateForInput(details.loan.originationDate)
        : "",
      originalPrincipalAmount: details.loan?.originalPrincipalAmount || 0,
      currentPrincipalBalance: details.loan?.currentPrincipalBalance || 0,
      interestRatePercent: details.loan?.interestRatePercent || 0,
      variableRate: details.loan?.variableRate || false,
      interestOnly: details.loan?.interestOnly || false,
      negativeAmortization: details.loan?.negativeAmortization || false,
      monthlyPaymentAmount: details.loan?.monthlyPaymentAmount || 0,
      delinquencyDaysAtFiling: details.loan?.delinquencyDaysAtFiling || 0,
      mortgageBrokerLicenseNumber: details.loan?.mortgageBrokerLicenseNumber || "",
      mortgageLoanOriginatorLicenseNumber: details.loan?.mortgageLoanOriginatorLicenseNumber || "",
      lenderId: details.loan?.lenderId || "",
      borrowerRequestedLoanModification: details.loan?.borrowerRequestedLoanModification !== undefined ? details.loan.borrowerRequestedLoanModification : null,
      loanModificationRequestFinalized: details.loan?.loanModificationRequestFinalized !== undefined ? details.loan.loanModificationRequestFinalized : null,

      // Borrowers
      borrowers: mappedBorrowers,

      // Filing Entity
      filingEntityLegalName: details.filingEntity?.filingEntityLegalName || "",
      filingEntityTypeId: details.filingEntity?.filingEntityTypeId ?? null,
      filingEntityStreet1: details.filingEntity?.filingEntityStreet1 || "",
      filingEntityStreet2: details.filingEntity?.filingEntityStreet2 || "",
      filingEntityCity: details.filingEntity?.filingEntityCity || "",
      filingEntityState: details.filingEntity?.filingEntityState || "",
      filingEntityZip: details.filingEntity?.filingEntityZip || "",
      filingContactName: details.filingEntity?.filingContactName || "",
      filingContactEmail: details.filingEntity?.filingContactEmail || "",
      filingContactPhone: details.filingEntity?.filingContactPhone || "",
      nmlsLicenseNumber: details.filingEntity?.nmlsLicenseNumber || "",
      stateLicenseNumber: details.filingEntity?.stateLicenseNumber || "",
      stateLicenseState: details.filingEntity?.stateLicenseState || "",

      // Right-to-Cure - now an array for multiple entries
      rightToCures: (() => {
        // Check if rightToCures array exists (new format)
        if (details.rightToCures && Array.isArray(details.rightToCures) && details.rightToCures.length > 0) {
          return details.rightToCures.map((rtc) => ({
            id: rtc.id || null,
            noticeSent: rtc.noticeSent !== undefined ? rtc.noticeSent : null,
            noticeDate: rtc.noticeDate ? formatDateForInput(rtc.noticeDate) : "",
            amountInDefault: rtc.amountInDefault || 0,
            daysDelinquentAtNotice: rtc.daysDelinquentAtNotice || 0,
            cureExpirationDate: rtc.cureExpirationDate ? formatDateForInput(rtc.cureExpirationDate) : "",
            noticeAddressStreet1: rtc.noticeAddressStreet1 || "",
            noticeAddressCity: rtc.noticeAddressCity || "",
            noticeAddressState: rtc.noticeAddressState || "",
            noticeAddressZip: rtc.noticeAddressZip || "",
            manualOverrideReason: rtc.manualOverrideReason || "",
            borrowerRespondedWithin30Days: rtc.borrowerRespondedWithin30Days !== undefined ? rtc.borrowerRespondedWithin30Days : null,
            borrowerResponseDate: rtc.borrowerResponseDate ? formatDateForInput(rtc.borrowerResponseDate) : "",
            proceededWithRightToCure: rtc.proceededWithRightToCure !== undefined ? rtc.proceededWithRightToCure : null,
          }));
        }
        // Fallback to single rightToCure object (old format)
        if (details.rightToCure) {
          return [{
            id: details.rightToCure.id || null,
            noticeSent: details.rightToCure.noticeSent !== undefined ? details.rightToCure.noticeSent : null,
            noticeDate: details.rightToCure.noticeDate ? formatDateForInput(details.rightToCure.noticeDate) : "",
            amountInDefault: details.rightToCure.amountInDefault || 0,
            daysDelinquentAtNotice: details.rightToCure.daysDelinquentAtNotice || 0,
            cureExpirationDate: details.rightToCure.cureExpirationDate ? formatDateForInput(details.rightToCure.cureExpirationDate) : "",
            noticeAddressStreet1: details.rightToCure.noticeAddressStreet1 || "",
            noticeAddressCity: details.rightToCure.noticeAddressCity || "",
            noticeAddressState: details.rightToCure.noticeAddressState || "",
            noticeAddressZip: details.rightToCure.noticeAddressZip || "",
            manualOverrideReason: details.rightToCure.manualOverrideReason || "",
            borrowerRespondedWithin30Days: details.rightToCure.borrowerRespondedWithin30Days !== undefined ? details.rightToCure.borrowerRespondedWithin30Days : null,
            borrowerResponseDate: details.rightToCure.borrowerResponseDate ? formatDateForInput(details.rightToCure.borrowerResponseDate) : "",
            proceededWithRightToCure: details.rightToCure.proceededWithRightToCure !== undefined ? details.rightToCure.proceededWithRightToCure : null,
          }];
        }
        // Return empty array if no data
        return [];
      })(),

      // Foreclosure Sale
      foreclosureSale: details.foreclosureSale
        ? {
            saleDate: details.foreclosureSale.saleDate
              ? formatDateForInput(details.foreclosureSale.saleDate)
              : "",
            soldToId: details.foreclosureSale.soldToId || "",
            vestingEntityName: details.foreclosureSale.vestingEntityName || "",
            reoEntityName: details.foreclosureSale.reoEntityName || "",
            reoContactFirstName:
              details.foreclosureSale.reoContactFirstName || "",
            reoContactLastName:
              details.foreclosureSale.reoContactLastName || "",
            reoBusinessPhone: details.foreclosureSale.reoBusinessPhone || "",
            reoEmergencyPhone: details.foreclosureSale.reoEmergencyPhone || "",
            requestedAlternativeToForeclosure: details.foreclosureSale.requestedAlternativeToForeclosure !== undefined ? details.foreclosureSale.requestedAlternativeToForeclosure : null,
            foreclosureAlternativeOption: details.foreclosureSale.foreclosureAlternativeOption !== undefined ? details.foreclosureSale.foreclosureAlternativeOption : null,
          }
        : (details.rightToCures && details.rightToCures.length > 0 && details.rightToCures.some(rtc => rtc.noticeSent === true)) ||
          (details.rightToCure?.noticeSent === true)
        ? {
            saleDate: "",
            soldToId: "",
            vestingEntityName: "",
            reoEntityName: "",
            reoContactFirstName: "",
            reoContactLastName: "",
            reoBusinessPhone: "",
            reoEmergencyPhone: "",
            requestedAlternativeToForeclosure: null,
            foreclosureAlternativeOption: null,
          }
        : null,

      // Form 35B Compliance
      certainMortgageLoan: details.affidavit?.certainMortgageLoan || false,
      form35bComplianceAffidavitPdf:
        details.affidavit?.form35bComplianceAffidavitPdf || "",
      form35bNonApplicabilityAffidavitPdf:
        details.affidavit?.form35bNonApplicabilityAffidavitPdf || "",
      affiantName: details.affidavit?.affiantName || "",
      affiantTitle: details.affidavit?.affiantTitle || "",
      affidavitExecutionDate: details.affidavit?.affidavitExecutionDate
        ? formatDateForInput(details.affidavit.affidavitExecutionDate)
        : "",

      // Loan Assignees
      loanAssignees:
        details.loanAssignees?.map((a, idx) => ({
          id: a.id || null,
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

      // Signatures
      signatures: details.signatures?.map((s) => ({ ...s })) || [],

      // Additional
      documents: details.documents || [],
      isAllStepsCompleted: true,
      organizationId: petition.organizationId || null,
      
      // Notes
      notes: petition.notes || details.notes || [],
    };
  }, [petition]);

  const [formData, setFormData] = useState(initialFormData);

  // Update formData when petition changes
  useEffect(() => {
    if (initialFormData) {
      setFormData(initialFormData);
    }
  }, [initialFormData]);

  // Reset edit mode when switching to a different petition
  useEffect(() => {
    setEditingSections({});
    setFieldErrors({});
    setShowEditDropdown(false);
    setShowJudgementModal(false);
    setShowForeclosureModal(false);
    setShowNotesDropdown(false);
    setShowNotesSection(false);
    setNoteToEdit(null);
    setActiveSection(null);
  }, [petition?.id]);
  
  // Helper function to check if judgment has meaningful data
  const hasJudgmentData = () => {
    const judgment = formData?.judgment;
    if (!judgment) return false;
    
    // Check if at least one field has a meaningful value
    const hasDate = judgment.judgmentDate !== null && 
                    judgment.judgmentDate !== undefined &&
                    ((typeof judgment.judgmentDate === 'string' && judgment.judgmentDate.trim() !== '') ||
                     (typeof judgment.judgmentDate !== 'string'));
    
    const hasType = judgment.judgmentType !== null && 
                    judgment.judgmentType !== undefined && 
                    judgment.judgmentType !== 0 &&
                    judgment.judgmentType !== '';
    
    const hasCourtInfo = judgment.courtInformation !== null &&
                         judgment.courtInformation !== undefined &&
                         typeof judgment.courtInformation === 'string' && 
                         judgment.courtInformation.trim() !== '';
    
    const hasDocket = judgment.docketNumbers !== null &&
                      judgment.docketNumbers !== undefined &&
                      typeof judgment.docketNumbers === 'string' && 
                      judgment.docketNumbers.trim() !== '';
    
    return hasDate || hasType || hasCourtInfo || hasDocket;
  };

  // Helper function to check if foreclosure sale has meaningful data
  const hasForeclosureSaleData = () => {
    const foreclosureSale = formData?.foreclosureSale;
    if (!foreclosureSale) return false;
    
    // Check if at least one field has a meaningful value
    const hasSaleDate = foreclosureSale.saleDate !== null && 
                        foreclosureSale.saleDate !== undefined && 
                        foreclosureSale.saleDate !== '' && 
                        typeof foreclosureSale.saleDate === 'string' && 
                        foreclosureSale.saleDate.trim() !== '';
    
    const hasSoldTo = foreclosureSale.soldToId !== null && 
                      foreclosureSale.soldToId !== undefined && 
                      foreclosureSale.soldToId !== '' && 
                      ((typeof foreclosureSale.soldToId === 'string' && foreclosureSale.soldToId.trim() !== '') || 
                       (typeof foreclosureSale.soldToId !== 'string'));
    
    const hasVesting = foreclosureSale.vestingEntityName !== null && 
                       foreclosureSale.vestingEntityName !== undefined && 
                       foreclosureSale.vestingEntityName !== '' && 
                       typeof foreclosureSale.vestingEntityName === 'string' && 
                       foreclosureSale.vestingEntityName.trim() !== '';
    
    const hasReoEntity = foreclosureSale.reoEntityName !== null && 
                         foreclosureSale.reoEntityName !== undefined && 
                         foreclosureSale.reoEntityName !== '' && 
                         typeof foreclosureSale.reoEntityName === 'string' && 
                         foreclosureSale.reoEntityName.trim() !== '';
    
    const hasReoContact = (foreclosureSale.reoContactFirstName !== null &&
                           foreclosureSale.reoContactFirstName !== undefined &&
                           foreclosureSale.reoContactFirstName !== '' &&
                           typeof foreclosureSale.reoContactFirstName === 'string' &&
                           foreclosureSale.reoContactFirstName.trim() !== '') ||
                          (foreclosureSale.reoContactLastName !== null &&
                           foreclosureSale.reoContactLastName !== undefined &&
                           foreclosureSale.reoContactLastName !== '' &&
                           typeof foreclosureSale.reoContactLastName === 'string' &&
                           foreclosureSale.reoContactLastName.trim() !== '');
    
    const hasReoPhone = (foreclosureSale.reoBusinessPhone !== null &&
                         foreclosureSale.reoBusinessPhone !== undefined &&
                         foreclosureSale.reoBusinessPhone !== '' &&
                         typeof foreclosureSale.reoBusinessPhone === 'string' &&
                         foreclosureSale.reoBusinessPhone.trim() !== '') ||
                        (foreclosureSale.reoEmergencyPhone !== null &&
                         foreclosureSale.reoEmergencyPhone !== undefined &&
                         foreclosureSale.reoEmergencyPhone !== '' &&
                         typeof foreclosureSale.reoEmergencyPhone === 'string' &&
                         foreclosureSale.reoEmergencyPhone.trim() !== '');
    
    return hasSaleDate || hasSoldTo || hasVesting || hasReoEntity || hasReoContact || hasReoPhone;
  };

  // Section definitions for sidebar - only show sections that are actually displayed
  const sections = useMemo(() => {
    const baseSections = [
      { id: "property", title: t("petitionTabContent.propertyDetails"), icon: "fa-home" },
      { id: "loan", title: t("petitionTabContent.loanDetails"), icon: "fa-file-invoice-dollar" },
      { id: "borrower", title: t("petitionTabContent.borrowerDetails"), icon: "fa-user" },
      { id: "filing-entity", title: t("petitionTabContent.filingEntity"), icon: "fa-building" },
      { id: "right-to-cure", title: t("petitionTabContent.rightToCure"), icon: "fa-gavel" },
      { id: "form35b", title: t("petitionTabContent.form35BCompliance"), icon: "fa-file-contract" },
      { id: "loan-assignees", title: t("petitionTabContent.loanAssignees"), icon: "fa-users" },
      { id: "signatures", title: t("petitionTabContent.signatures"), icon: "fa-signature" },
    ];
    
    // Add conditional sections only if they have meaningful data
    if (hasJudgmentData()) {
      baseSections.push({ id: "judgment", title: t("petitionTabContent.judgment"), icon: "fa-balance-scale" });
    }
    if (hasForeclosureSaleData()) {
      baseSections.push({ id: "foreclosure", title: t("petitionTabContent.foreclosureSale"), icon: "fa-handshake" });
    }
    if (!isPublic && showNotesSection) {
      baseSections.push({ id: "notes", title: t("petitionTabContent.notes"), icon: "fa-sticky-note" });
    }
    
    return baseSections;
  }, [formData, showNotesSection, isPublic, t]);
  
  // Handle section click - scroll to section (don't change sidebar collapsed state)
  const handleSectionClick = (sectionId, e) => {
    // Prevent any default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setActiveSection(sectionId);
    
    const refMap = {
      property: propertyDetailsRef,
      loan: loanDetailsRef,
      borrower: borrowerDetailsRef,
      "filing-entity": filingEntityRef,
      "right-to-cure": rightToCureRef,
      form35b: form35BRef,
      "loan-assignees": loanAssigneesRef,
      signatures: signaturesRef,
      judgment: judgmentRef,
      foreclosure: foreclosureSaleRef,
      notes: notesRef,
    };
    
    const ref = refMap[sectionId];
    if (ref?.current) {
      // Use the same simple approach as home page - CSS scroll-margin-top handles the offset
      ref.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };
  
  // Track active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const refs = [
        { id: "property", ref: propertyDetailsRef },
        { id: "loan", ref: loanDetailsRef },
        { id: "borrower", ref: borrowerDetailsRef },
        { id: "filing-entity", ref: filingEntityRef },
        { id: "right-to-cure", ref: rightToCureRef },
        { id: "form35b", ref: form35BRef },
        { id: "loan-assignees", ref: loanAssigneesRef },
        { id: "signatures", ref: signaturesRef },
        { id: "judgment", ref: judgmentRef },
        { id: "foreclosure", ref: foreclosureSaleRef },
        { id: "notes", ref: notesRef },
      ];
      
      const scrollPosition = window.scrollY + 150;
      
      for (let i = refs.length - 1; i >= 0; i--) {
        const { id, ref } = refs[i];
        if (ref?.current) {
          const elementTop = ref.current.offsetTop;
          if (scrollPosition >= elementTop) {
            setActiveSection(id);
            break;
          }
        }
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showNotesSection]);
  
  // Toggle section editing
  const toggleSectionEditing = (sectionId) => {
    setEditingSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };
  
  // Check if a section is being edited
  const isSectionEditing = (sectionId) => {
    return editingSections[sectionId] === true;
  };
  
  // Handle section edit toggle
  const handleSectionEditToggle = (sectionId) => {
    console.log("handleSectionEditToggle called with sectionId:", sectionId);
    console.log("Current editingSections state:", editingSections);
    
    if (!sectionId) {
      console.warn("No sectionId provided to handleSectionEditToggle");
      return;
    }
    
    const currentlyEditing = isSectionEditing(sectionId);
    console.log("Section is currently editing:", currentlyEditing);
    
    if (currentlyEditing) {
      // Cancel edit - reset form data for this section
      console.log("Cancelling edit mode for section:", sectionId);
      if (initialFormData) {
        setFormData(initialFormData);
      }
      setFieldErrors({});
    } else {
      console.log("Entering edit mode for section:", sectionId);
    }
    
    toggleSectionEditing(sectionId);
    console.log("After toggle, new editingSections state:", { ...editingSections, [sectionId]: !currentlyEditing });
  };

  // Handle saving individual sections using their specific APIs
  const handleSectionSave = async (sectionId) => {
    if (!petition?.id) {
      throw new Error(t("errors.petitionIdRequired"));
    }

    switch (sectionId) {
      case "property": {
        const propertyValidation = validatePropertyDetailsHelper(formData);
        if (propertyValidation.hasErrors) {
          setFieldErrors(prev => ({ ...prev, ...propertyValidation.errors }));
          const firstError = Object.values(propertyValidation.errors)[0];
          throw new Error(firstError || t("errors.pleaseCorrectPropertyDetailsErrors"));
        }

        // Get property ID from petition details
        const propertyId = petition.details?.property?.id || null;
        
        // Prepare property data
        const propertyData = {
          id: propertyId,
          propertyStreet1: formData.propertyStreet1 || "",
          propertyStreet2: formData.propertyStreet2 || "",
          propertyCity: formData.propertyCity || "",
          propertyState: formData.propertyState || "MA",
          propertyZip: formData.propertyZip || "",
          propertyCounty: formData.propertyCounty || "",
          assessorParcelId: formData.assessorParcelId || ""
        };

        // Call update property API
        try {
          const response = await petitionApiService.updateProperty(petition.id, propertyData);
          
          // Check if response indicates a duplicate petition (API may return success: false with isDuplicate)
          if (response && !response.success && response.isDuplicate) {
            const errorMessage = response.message || t("errors.petitionSamePropertyExists");
            // Set field error for property address
            setFieldErrors(prev => ({ 
              ...prev, 
              propertyStreet1: errorMessage,
              propertyCity: "",
              propertyState: "",
              propertyZip: ""
            }));
            // Create error with a flag to indicate toast was already shown
            const duplicateError = new Error(errorMessage);
            duplicateError.toastShown = true;
            throw duplicateError;
          }
          
          // Check if response is successful
          if (response && !response.success) {
            const errorMessage = response.message || t("errors.failedUpdatePropertyDetails");
            setFieldErrors(prev => ({ 
              ...prev, 
              propertyStreet1: errorMessage 
            }));
            // Create error with a flag to indicate toast was already shown
            const apiError = new Error(errorMessage);
            apiError.toastShown = true;
            throw apiError;
          }
          
          // Refresh the tab data to get updated petition
          if (activeTabId && refreshTab) {
            await refreshTab(activeTabId);
          }
          
          // Call the callback to refresh the petitions list
          if (onPetitionUpdated) {
            setTimeout(() => {
              onPetitionUpdated();
            }, 200);
          }
          
          // Clear field errors on success
          setFieldErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.propertyStreet1;
            delete newErrors.propertyCity;
            delete newErrors.propertyState;
            delete newErrors.propertyZip;
            return newErrors;
          });
        } catch (err) {
          // Handle axios errors (when API returns non-2xx status)
          if (err?.response && err.response.data) {
            const errorData = err.response.data;
            // Check if it's a duplicate error
            if (errorData.isDuplicate) {
              const errorMessage = errorData.message || "A petition with the same property address already exists.";
              setFieldErrors(prev => ({ 
                ...prev, 
                propertyStreet1: errorMessage,
                propertyCity: "",
                propertyState: "",
                propertyZip: ""
              }));
              // Create error with a flag to indicate toast was already shown
              const duplicateError = new Error(errorMessage);
              duplicateError.toastShown = true;
              throw duplicateError;
            } else {
              const errorMessage = errorData.message || err.message || t("errors.failedUpdatePropertyDetails");
              setFieldErrors(prev => ({ 
                ...prev, 
                propertyStreet1: errorMessage 
              }));
              // Create error with a flag to indicate toast was already shown
              const apiError = new Error(errorMessage);
              apiError.toastShown = true;
              throw apiError;
            }
          } else if (err.message) {
            throw err;
          } else {
            // Unknown error
            const errorMessage = t("errors.failedUpdatePropertyDetailsTryAgain");
            setFieldErrors(prev => ({ 
              ...prev, 
              propertyStreet1: errorMessage 
            }));
            // Create error (toast will be shown in outer catch)
            throw new Error(errorMessage);
          }
        }
        break;
      }

      case "loan": {
        const loanValidation = validateLoanDetailsHelper(formData);
        if (loanValidation.hasErrors) {
          setFieldErrors(prev => ({ ...prev, ...loanValidation.errors }));
          const firstError = Object.values(loanValidation.errors)[0];
          throw new Error(firstError || t("errors.pleaseCorrectLoanDetailsErrors"));
        }

        // Get loan ID from petition details
        const loanId = petition.details?.loan?.id || null;
        
        // Prepare loan data
        const loanData = {
          id: loanId,
          minNumber: formData.isMinApplicable === "yes" ? (formData.minNumber || "") : "",
          loanNumber: formData.loanNumber || "",
          petitionLoanTypeId: formData.petitionLoanTypeId && formData.petitionLoanTypeId.trim() !== '' ? formData.petitionLoanTypeId : null,
          petitionLoanTypeName: formData.petitionLoanTypeName || "",
          lienPosition: (formData.lienPosition === null || formData.lienPosition === undefined || formData.lienPosition === "") 
            ? null 
            : (typeof formData.lienPosition === 'number' ? formData.lienPosition : parseInt(formData.lienPosition)),
          originationDate: formData.originationDate && formData.originationDate.trim() 
            ? (formData.originationDate.includes('T') 
                ? formData.originationDate 
                : new Date(formData.originationDate + 'T00:00:00').toISOString())
            : null,
          originalPrincipalAmount: parseFloat(formData.originalPrincipalAmount) || 0,
          currentPrincipalBalance: parseFloat(formData.currentPrincipalBalance) || 0,
          interestRatePercent: parseFloat(formData.interestRatePercent) || 0,
          variableRate: formData.variableRate || false,
          interestOnly: formData.interestOnly || false,
          negativeAmortization: formData.negativeAmortization || false,
          monthlyPaymentAmount: parseFloat(formData.monthlyPaymentAmount) || 0,
          delinquencyDaysAtFiling: parseInt(formData.delinquencyDaysAtFiling) || 0,
          mortgageBrokerLicenseNumber: formData.mortgageBrokerLicenseNumber || "",
          mortgageLoanOriginatorLicenseNumber: formData.mortgageLoanOriginatorLicenseNumber || "",
          lenderId: formData.lenderId && formData.lenderId.trim() !== '' ? formData.lenderId : null,
          borrowerRequestedLoanModification: formData.borrowerRequestedLoanModification !== null && formData.borrowerRequestedLoanModification !== undefined ? formData.borrowerRequestedLoanModification : false,
          loanModificationRequestFinalized: formData.loanModificationRequestFinalized !== null && formData.loanModificationRequestFinalized !== undefined ? formData.loanModificationRequestFinalized : false
        };

        // Call update loan API
        await petitionApiService.updateLoan(petition.id, loanData);
        
        // Refresh the tab data to get updated petition
        if (activeTabId && refreshTab) {
          await refreshTab(activeTabId);
        }
        
        // Call the callback to refresh the petitions list
        if (onPetitionUpdated) {
          setTimeout(() => {
            onPetitionUpdated();
          }, 200);
        }
        
        // Clear field errors on success
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.isMinApplicable;
          delete newErrors.minNumber;
          delete newErrors.loanNumber;
          delete newErrors.petitionLoanTypeId;
          delete newErrors.lienPosition;
          return newErrors;
        });
        break;
      }

      case "filing-entity": {
        const filingEntityValidation = validateFilingEntityHelper(formData);
        if (filingEntityValidation.hasErrors) {
          setFieldErrors(prev => ({ ...prev, ...filingEntityValidation.errors }));
          const firstError = Object.values(filingEntityValidation.errors)[0];
          throw new Error(firstError || t("errors.pleaseCorrectFilingEntityErrors"));
        }

        // Get filing entity ID from petition details
        const filingEntityId = petition.details?.filingEntity?.id || null;
        
        // Prepare filing entity data
        const filingEntityData = {
          id: filingEntityId,
          filingEntityLegalName: formData.filingEntityLegalName || "",
          filingEntityTypeId: formData.filingEntityTypeId && formData.filingEntityTypeId.trim() !== '' ? formData.filingEntityTypeId : null,
          filingEntityStreet1: formData.filingEntityStreet1 || "",
          filingEntityStreet2: formData.filingEntityStreet2 || "",
          filingEntityCity: formData.filingEntityCity || "",
          filingEntityState: formData.filingEntityState || "",
          filingEntityZip: formData.filingEntityZip || "",
          filingContactName: formData.filingContactName || "",
          filingContactEmail: formData.filingContactEmail || "",
          filingContactPhone: formData.filingContactPhone || "",
          nmlsLicenseNumber: formData.nmlsLicenseNumber || "",
          stateLicenseNumber: formData.stateLicenseNumber || "",
          stateLicenseState: formData.stateLicenseState || ""
        };

        // Call update filing entity API
        await petitionApiService.updateFilingEntity(petition.id, filingEntityData);
        
        // Refresh the tab data to get updated petition
        if (activeTabId && refreshTab) {
          await refreshTab(activeTabId);
        }
        
        // Call the callback to refresh the petitions list
        if (onPetitionUpdated) {
          setTimeout(() => {
            onPetitionUpdated();
          }, 200);
        }
        
        // Clear field errors on success
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.filingEntityLegalName;
          delete newErrors.filingEntityStreet1;
          delete newErrors.filingEntityCity;
          delete newErrors.filingEntityState;
          delete newErrors.filingEntityZip;
          delete newErrors.filingContactName;
          delete newErrors.filingContactEmail;
          return newErrors;
        });
        break;
      }

      case "borrower": {
        const borrowerValidation = validateBorrowerDetailsHelper(formData);
        if (borrowerValidation.hasErrors) {
          setFieldErrors(prev => ({ ...prev, ...borrowerValidation.errors }));
          const firstError = Object.values(borrowerValidation.errors)[0];
          throw new Error(firstError || t("errors.pleaseCorrectBorrowerDetailsErrors"));
        }

        // Additional check for primary borrower (helper doesn't check this)
        const primaryBorrower = formData.borrowers?.find(b => b.borrowerIsPrimary === true);
        if (!primaryBorrower) {
          setFieldErrors(prev => ({ ...prev, borrowers: t("errors.primaryBorrowerRequired") }));
          throw new Error(t("errors.primaryBorrowerRequired"));
        }

        // Get borrower IDs from petition details (map by matching order or id)
        const existingBorrowers = petition.details?.borrowers || [];
        const borrowersData = formData.borrowers.map((borrower, index) => {
          // Try to find matching borrower by id first, then by index
          const existingBorrower = existingBorrowers.find(eb => eb.id === borrower.id) || existingBorrowers[index];
          
          // Determine borrower ID:
          // - If existing borrower found, use its ID
          // - If borrower.id is a number (temporary ID from Date.now()), it's a new borrower, set id to null
          // - If borrower.id is a UUID string but not found in existing, it's also new, set id to null
          let borrowerId = null;
          if (existingBorrower?.id) {
            borrowerId = existingBorrower.id;
          } else if (borrower.id && typeof borrower.id === 'string' && borrower.id.includes('-')) {
            // It's a UUID string but not found in existing borrowers, treat as new
            borrowerId = null;
          } else if (borrower.id && typeof borrower.id === 'number') {
            // It's a temporary ID (number from Date.now()), treat as new borrower
            borrowerId = null;
          }
          
          return {
            id: borrowerId,
            firstName: borrower.firstName || "",
            middleName: borrower.middleName || "",
            lastName: borrower.lastName || "",
            suffix: borrower.suffix || "",
            borrowerIsPrimary: borrower.borrowerIsPrimary || false,
            mailingStreet1: borrower.mailingStreet1 || "",
            mailingCity: borrower.mailingCity || "",
            mailingState: borrower.mailingState || "",
            mailingZip: borrower.mailingZip || "",
            phone: borrower.phone || "",
            email: borrower.email || ""
          };
        });

        // Call update borrowers API
        await petitionApiService.updateBorrowers(petition.id, borrowersData);
        
        // Refresh the tab data to get updated petition
        if (activeTabId && refreshTab) {
          await refreshTab(activeTabId);
        }
        
        // Call the callback to refresh the petitions list
        if (onPetitionUpdated) {
          setTimeout(() => {
            onPetitionUpdated();
          }, 200);
        }
        
        // Clear field errors on success
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.borrowers;
          // Clear borrower-specific errors
          Object.keys(newErrors).forEach(key => {
            if (key.startsWith('borrower_')) {
              delete newErrors[key];
            }
          });
          return newErrors;
        });
        break;
      }

      case "form35b": {
        const form35BValidation = validateForm35BComplianceHelper(formData);
        if (form35BValidation.hasErrors) {
          setFieldErrors(prev => ({ ...prev, ...form35BValidation.errors }));
          const firstError = Object.values(form35BValidation.errors)[0];
          throw new Error(firstError || t("errors.pleaseCorrectForm35BErrors"));
        }

        // Get affidavit ID from petition details
        const affidavitId = petition.details?.affidavit?.id || null;
        
        // Prepare affidavit data
        const affidavitData = {
          id: affidavitId,
          certainMortgageLoan: formData.certainMortgageLoan !== null && formData.certainMortgageLoan !== undefined ? formData.certainMortgageLoan : false,
          form35bComplianceAffidavitPdf: formData.form35bComplianceAffidavitPdf || "",
          form35bNonApplicabilityAffidavitPdf: formData.form35bNonApplicabilityAffidavitPdf || "",
          affiantName: formData.affiantName || "",
          affiantTitle: formData.affiantTitle || "",
          affidavitExecutionDate: formData.affidavitExecutionDate && formData.affidavitExecutionDate.trim()
            ? (formData.affidavitExecutionDate.includes('T') 
                ? formData.affidavitExecutionDate 
                : new Date(formData.affidavitExecutionDate + 'T00:00:00').toISOString())
            : null
        };

        // Call update affidavit API
        await petitionApiService.updateAffidavit(petition.id, affidavitData);
        
        // Refresh the tab data to get updated petition
        if (activeTabId && refreshTab) {
          await refreshTab(activeTabId);
        }
        
        // Call the callback to refresh the petitions list
        if (onPetitionUpdated) {
          setTimeout(() => {
            onPetitionUpdated();
          }, 200);
        }
        
        // Clear field errors on success
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.certainMortgageLoan;
          return newErrors;
        });
        break;
      }

      case "right-to-cure": {
        const rightToCureValidation = validateRightToCureDetailsHelper(formData);
        if (rightToCureValidation.hasErrors) {
          setFieldErrors(prev => ({ ...prev, ...rightToCureValidation.errors }));
          const firstError = Object.values(rightToCureValidation.errors)[0];
          throw new Error(firstError || t("errors.pleaseCorrectRightToCureErrors"));
        }

        // Get existing right to cures from petition details
        const existingRightToCures = petition.details?.rightToCures || [];
        
        // Map right to cures data, ensuring new entries have id: null
        const rightToCuresData = formData.rightToCures.map((rtc, index) => {
          // Try to find matching right to cure by id first, then by index
          const existingRtc = existingRightToCures.find(ertc => ertc.id === rtc.id) || existingRightToCures[index];
          
          // Determine right to cure ID:
          // - If existing right to cure found, use its ID
          // - If rtc.id is a number (temporary ID), it's a new entry, set id to null
          // - If rtc.id is a UUID string but not found in existing, it's also new, set id to null
          let rtcId = null;
          if (existingRtc?.id) {
            rtcId = existingRtc.id;
          } else if (rtc.id && typeof rtc.id === 'string' && rtc.id.includes('-')) {
            // It's a UUID string but not found in existing, treat as new
            rtcId = null;
          } else if (rtc.id && typeof rtc.id === 'number') {
            // It's a temporary ID (number), treat as new entry
            rtcId = null;
          }
          
          return {
            id: rtcId,
            noticeSent: rtc.noticeSent !== null && rtc.noticeSent !== undefined ? rtc.noticeSent : false,
            noticeDate: rtc.noticeDate && rtc.noticeDate.trim()
              ? (rtc.noticeDate.includes('T') 
                  ? rtc.noticeDate 
                  : new Date(rtc.noticeDate + 'T00:00:00').toISOString())
              : null,
            amountInDefault: parseFloat(rtc.amountInDefault) || 0,
            daysDelinquentAtNotice: parseInt(rtc.daysDelinquentAtNotice) || 0,
            cureExpirationDate: rtc.cureExpirationDate && rtc.cureExpirationDate.trim()
              ? (rtc.cureExpirationDate.includes('T') 
                  ? rtc.cureExpirationDate 
                  : new Date(rtc.cureExpirationDate + 'T00:00:00').toISOString())
              : null,
            noticeAddressStreet1: rtc.noticeAddressStreet1 || "",
            noticeAddressCity: rtc.noticeAddressCity || "",
            noticeAddressState: rtc.noticeAddressState || "",
            noticeAddressZip: rtc.noticeAddressZip || "",
            manualOverrideReason: rtc.manualOverrideReason || "",
            borrowerRespondedWithin30Days: rtc.borrowerRespondedWithin30Days !== null && rtc.borrowerRespondedWithin30Days !== undefined ? rtc.borrowerRespondedWithin30Days : false,
            borrowerResponseDate: rtc.borrowerResponseDate && rtc.borrowerResponseDate.trim()
              ? (rtc.borrowerResponseDate.includes('T') 
                  ? rtc.borrowerResponseDate 
                  : new Date(rtc.borrowerResponseDate + 'T00:00:00').toISOString())
              : null,
            proceededWithRightToCure: rtc.proceededWithRightToCure !== null && rtc.proceededWithRightToCure !== undefined ? rtc.proceededWithRightToCure : false
          };
        });

        // Call update right to cures API
        await petitionApiService.updateRightToCures(petition.id, rightToCuresData);
        
        // Refresh the tab data to get updated petition
        if (activeTabId && refreshTab) {
          await refreshTab(activeTabId);
        }
        
        // Call the callback to refresh the petitions list
        if (onPetitionUpdated) {
          setTimeout(() => {
            onPetitionUpdated();
          }, 200);
        }
        
        // Clear field errors on success
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.rightToCures;
          // Clear right to cure-specific errors
          Object.keys(newErrors).forEach(key => {
            if (key.startsWith('rightToCure_')) {
              delete newErrors[key];
            }
          });
          return newErrors;
        });
        break;
      }

      case "loan-assignees": {
        const loanAssigneesValidation = validateLoanAssigneesHelper(formData);
        if (loanAssigneesValidation.hasErrors) {
          setFieldErrors(prev => ({ ...prev, ...loanAssigneesValidation.errors }));
          const firstError = Object.values(loanAssigneesValidation.errors)[0];
          throw new Error(firstError || t("errors.pleaseCorrectLoanAssigneesErrors"));
        }

        // Filter out completely empty assignees before sending
        const validAssignees = formData.loanAssignees.filter(assignee => {
          const hasAnyData = assignee.assigneeName || assignee.assigneeTypeId || assignee.assigneeRoleId || 
                            assignee.street1 || assignee.city || assignee.addressState || assignee.zip;
          return hasAnyData;
        });

        // Get existing loan assignees from petition details
        const existingLoanAssignees = petition.details?.loanAssignees || [];
        
        // Map loan assignees data, ensuring new entries have id: null
        const loanAssigneesData = validAssignees.map((assignee, index) => {
          // Try to find matching assignee by id first, then by index
          const existingAssignee = existingLoanAssignees.find(ea => ea.id === assignee.id) || existingLoanAssignees[index];
          
          // Determine assignee ID:
          // - If existing assignee found, use its ID
          // - If assignee.id is a number (temporary ID), it's a new entry, set id to null
          // - If assignee.id is a UUID string but not found in existing, it's also new, set id to null
          let assigneeId = null;
          if (existingAssignee?.id) {
            assigneeId = existingAssignee.id;
          } else if (assignee.id && typeof assignee.id === 'string' && assignee.id.includes('-')) {
            // It's a UUID string but not found in existing, treat as new
            assigneeId = null;
          } else if (assignee.id && typeof assignee.id === 'number') {
            // It's a temporary ID (number), treat as new entry
            assigneeId = null;
          }
          
          return {
            id: assigneeId,
            assigneeName: assignee.assigneeName || "",
            assigneeTypeId: assignee.assigneeTypeId && assignee.assigneeTypeId.trim() !== '' ? assignee.assigneeTypeId : null,
            assigneeRoleId: assignee.assigneeRoleId && assignee.assigneeRoleId.trim() !== '' ? assignee.assigneeRoleId : null,
            street1: assignee.street1 || "",
            street2: assignee.street2 || "",
            city: assignee.city || "",
            addressState: assignee.addressState || "",
            zip: assignee.zip || "",
            licenseNumber: assignee.licenseNumber || "",
            licenseState: assignee.licenseState || ""
          };
        });

        // Call update loan assignees API
        await petitionApiService.updateLoanAssignees(petition.id, loanAssigneesData);
        
        // Refresh the tab data to get updated petition
        if (activeTabId && refreshTab) {
          await refreshTab(activeTabId);
        }
        
        // Call the callback to refresh the petitions list
        if (onPetitionUpdated) {
          setTimeout(() => {
            onPetitionUpdated();
          }, 200);
        }
        
        // Clear field errors on success
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.loanAssignees;
          // Clear loan assignee-specific errors
          Object.keys(newErrors).forEach(key => {
            if (key.startsWith('loanAssignees.')) {
              delete newErrors[key];
            }
          });
          return newErrors;
        });
        break;
      }

      case "signatures": {
        if (!formData.signatures || !Array.isArray(formData.signatures) || formData.signatures.length === 0) {
          setFieldErrors(prev => ({ ...prev, signatures: t("errors.atLeastOneSignatureRequired") }));
          throw new Error(t("errors.atLeastOneSignatureRequired"));
        }

        // Validate that at least one signature has e-consent checked
        const hasEconsent = formData.signatures.some((sig) => sig.esignConsent === true);
        if (!hasEconsent) {
          setFieldErrors(prev => ({ ...prev, esignConsent: "E-sign consent is required for at least one signature" }));
          throw new Error(t("errors.esignConsentRequired"));
        }

        // Validate each signature entry
        formData.signatures.forEach((signature, index) => {
          if (!signature.signerFullName || signature.signerFullName.trim() === "") {
            setFieldErrors(prev => ({ ...prev, [`signatures.${index}.signerFullName`]: t("errors.required") }));
            throw new Error(t("errors.signerFullNameRequired", { index: index + 1 }));
          }
          if (!signature.signerTitle || signature.signerTitle.trim() === "") {
            setFieldErrors(prev => ({ ...prev, [`signatures.${index}.signerTitle`]: t("errors.required") }));
            throw new Error(t("errors.signerTitleRequired", { index: index + 1 }));
          }
          if (!signature.signerEmail || signature.signerEmail.trim() === "") {
            setFieldErrors(prev => ({ ...prev, [`signatures.${index}.signerEmail`]: t("errors.required") }));
            throw new Error(t("errors.signerEmailRequired", { index: index + 1 }));
          } else {
            // Validate email format
            const emailRegex = /.+@.+\..+/;
            if (!emailRegex.test(signature.signerEmail.trim())) {
              setFieldErrors(prev => ({ ...prev, [`signatures.${index}.signerEmail`]: t("errors.invalidEmailFormat") }));
              throw new Error(t("errors.signerEmailRequired", { index: index + 1 }) + ": " + t("errors.invalidEmailFormat"));
            }
          }
        });

        // Get existing signatures from petition details
        const existingSignatures = petition.details?.signatures || [];
        
        // Map signatures data, ensuring new entries have id: null
        const signaturesData = formData.signatures.map((signature, index) => {
          // Try to find matching signature by id first, then by index
          const existingSignature = existingSignatures.find(es => es.id === signature.id) || existingSignatures[index];
          
          // Determine signature ID:
          // - If existing signature found, use its ID
          // - If signature.id is a number (temporary ID), it's a new entry, set id to null
          // - If signature.id is a UUID string but not found in existing, it's also new, set id to null
          let signatureId = null;
          if (existingSignature?.id) {
            signatureId = existingSignature.id;
          } else if (signature.id && typeof signature.id === 'string' && signature.id.includes('-')) {
            // It's a UUID string but not found in existing, treat as new
            signatureId = null;
          } else if (signature.id && typeof signature.id === 'number') {
            // It's a temporary ID (number), treat as new entry
            signatureId = null;
          }
          
          return {
            id: signatureId,
            signerFullName: signature.signerFullName || "",
            signerTitle: signature.signerTitle || "",
            signerEmail: signature.signerEmail || "",
            esignConsent: signature.esignConsent !== null && signature.esignConsent !== undefined ? signature.esignConsent : false,
            signatureDrawnOrTyped: signature.signatureDrawnOrTyped || "",
            signedAt: signature.signedAt && signature.signedAt.trim()
              ? (signature.signedAt.includes('T') 
                  ? signature.signedAt 
                  : new Date(signature.signedAt + 'T00:00:00').toISOString())
              : null,
            signerIp: signature.signerIp || "",
            otpCode: signature.otpCode || ""
          };
        });

        // Call update signatures API
        await petitionApiService.updateSignatures(petition.id, signaturesData);
        
        // Refresh the tab data to get updated petition
        if (activeTabId && refreshTab) {
          await refreshTab(activeTabId);
        }
        
        // Call the callback to refresh the petitions list
        if (onPetitionUpdated) {
          setTimeout(() => {
            onPetitionUpdated();
          }, 200);
        }
        
        // Clear field errors on success
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.signatures;
          delete newErrors.esignConsent;
          // Clear signature-specific errors
          Object.keys(newErrors).forEach(key => {
            if (key.startsWith('signatures.')) {
              delete newErrors[key];
            }
          });
          return newErrors;
        });
        break;
      }

      case "judgment": {
        if (!formData.judgment) {
          setFieldErrors(prev => ({ ...prev, judgment: t("errors.judgmentDataRequired") }));
          throw new Error(t("errors.judgmentDataRequired"));
        }

        const judgment = formData.judgment;
        if (!judgment.judgmentDate || (typeof judgment.judgmentDate === 'string' && !judgment.judgmentDate.trim())) {
          setFieldErrors(prev => ({ ...prev, judgmentDate: t("errors.judgmentDateRequired") }));
          throw new Error(t("errors.judgmentDateRequired"));
        }
        
        if (judgment.judgmentType === "" || judgment.judgmentType === null || judgment.judgmentType === undefined) {
          setFieldErrors(prev => ({ ...prev, judgmentType: t("errors.judgmentTypeRequired") }));
          throw new Error(t("errors.judgmentTypeRequired"));
        }
        if (!judgment.courtInformation || (typeof judgment.courtInformation === 'string' && !judgment.courtInformation.trim())) {
          setFieldErrors(prev => ({ ...prev, courtInformation: t("errors.courtInformationRequired") }));
          throw new Error(t("errors.courtInformationRequired"));
        }
        if (!judgment.docketNumbers || (typeof judgment.docketNumbers === 'string' && !judgment.docketNumbers.trim())) {
          setFieldErrors(prev => ({ ...prev, docketNumbers: t("errors.docketNumberRequired") }));
          throw new Error(t("errors.docketNumberRequired"));
        }

        // Get judgment ID from petition details
        const judgmentId = petition.details?.judgment?.id || null;
        
        // Prepare judgment data
        const judgmentData = {
          id: judgmentId,
          petitionId: petition.id,
          judgmentDate: judgment.judgmentDate && judgment.judgmentDate.trim()
            ? (judgment.judgmentDate.includes('T') 
                ? judgment.judgmentDate 
                : new Date(judgment.judgmentDate + 'T00:00:00').toISOString())
            : null,
          judgmentType: judgment.judgmentType !== null && judgment.judgmentType !== undefined 
            ? (typeof judgment.judgmentType === 'number' 
                ? judgment.judgmentType 
                : parseInt(judgment.judgmentType, 10))
            : 0,
          courtInformation: judgment.courtInformation || "",
          docketNumbers: judgment.docketNumbers || ""
        };

        // Call update judgment API
        await petitionApiService.updateJudgment(petition.id, judgmentData);
        
        // Refresh the tab data to get updated petition
        if (activeTabId && refreshTab) {
          await refreshTab(activeTabId);
        }
        
        // Call the callback to refresh the petitions list
        if (onPetitionUpdated) {
          setTimeout(() => {
            onPetitionUpdated();
          }, 200);
        }
        
        // Clear field errors on success
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.judgment;
          delete newErrors.judgmentDate;
          delete newErrors.judgmentType;
          delete newErrors.courtInformation;
          delete newErrors.docketNumbers;
          return newErrors;
        });
        break;
      }

      case "foreclosure": {
        if (!formData.foreclosureSale) {
          setFieldErrors(prev => ({ ...prev, foreclosureSale: t("errors.foreclosureSaleDataRequired") }));
          throw new Error(t("errors.foreclosureSaleDataRequired"));
        }

        const foreclosureSale = formData.foreclosureSale;
        if (!foreclosureSale.saleDate || !foreclosureSale.saleDate.trim()) {
          setFieldErrors(prev => ({ ...prev, saleDate: t("errors.saleDateRequired") }));
          throw new Error(t("errors.saleDateRequired"));
        }
        if (!foreclosureSale.soldToId || !foreclosureSale.soldToId.trim()) {
          setFieldErrors(prev => ({ ...prev, soldToId: t("errors.soldToRequired") }));
          throw new Error(t("errors.soldToRequired"));
        }

        // Check if soldToId is Mortgagee/Investor and validate required fields
        const buyerTypes = getBuyerTypes();
        const selectedBuyerType = findOptionByValue ? findOptionByValue(buyerTypes, foreclosureSale.soldToId) : null;
        const isMortgageeInvestor = selectedBuyerType && (
          selectedBuyerType.name?.toLowerCase().includes("mortgagee") ||
          selectedBuyerType.name?.toLowerCase().includes("investor") ||
          selectedBuyerType.value?.toLowerCase().includes("mortgagee") ||
          selectedBuyerType.value?.toLowerCase().includes("investor")
        );

        if (isMortgageeInvestor) {
          if (!foreclosureSale.vestingEntityName || !foreclosureSale.vestingEntityName.trim()) {
            setFieldErrors(prev => ({ ...prev, vestingEntityName: t("errors.vestingEntityNameRequired") }));
            throw new Error(t("errors.vestingEntityNameRequired"));
          }
          if (!foreclosureSale.reoContactFirstName || !foreclosureSale.reoContactFirstName.trim()) {
            setFieldErrors(prev => ({ ...prev, reoContactFirstName: t("errors.reoContactFirstNameRequired") }));
            throw new Error(t("errors.reoContactFirstNameRequired"));
          }
          if (!foreclosureSale.reoContactLastName || !foreclosureSale.reoContactLastName.trim()) {
            setFieldErrors(prev => ({ ...prev, reoContactLastName: t("errors.reoContactLastNameRequired") }));
            throw new Error(t("errors.reoContactLastNameRequired"));
          }
          if (!foreclosureSale.reoBusinessPhone || !foreclosureSale.reoBusinessPhone.trim()) {
            setFieldErrors(prev => ({ ...prev, reoBusinessPhone: t("errors.reoBusinessPhoneRequired") }));
            throw new Error(t("errors.reoBusinessPhoneRequired"));
          }
        }

        // Validate requested alternative to foreclosure (required)
        if (foreclosureSale.requestedAlternativeToForeclosure === null || foreclosureSale.requestedAlternativeToForeclosure === undefined) {
          setFieldErrors(prev => ({ ...prev, "foreclosureSale.requestedAlternativeToForeclosure": t("errors.pleaseSelectBorrowerRequestedAlternative") }));
          throw new Error(t("errors.pleaseSelectBorrowerRequestedAlternative"));
        }

        // Validate foreclosure alternative option (required if alternative was requested)
        if (foreclosureSale.requestedAlternativeToForeclosure === true) {
          if (!foreclosureSale.foreclosureAlternativeOption || foreclosureSale.foreclosureAlternativeOption === "") {
            setFieldErrors(prev => ({ ...prev, "foreclosureSale.foreclosureAlternativeOption": t("errors.alternativeOptionRequired") }));
            throw new Error(t("errors.alternativeOptionRequired"));
          }
        }

        // Get foreclosure ID from petition details
        const foreclosureId = petition.details?.foreclosureSale?.id || null;
        
        // Prepare foreclosure data
        const foreclosureData = {
          id: foreclosureId,
          saleDate: foreclosureSale.saleDate && foreclosureSale.saleDate.trim()
            ? (foreclosureSale.saleDate.includes('T') 
                ? foreclosureSale.saleDate 
                : new Date(foreclosureSale.saleDate + 'T00:00:00').toISOString())
            : null,
          soldToId: foreclosureSale.soldToId && foreclosureSale.soldToId.trim() !== '' ? foreclosureSale.soldToId : null,
          vestingEntityName: foreclosureSale.vestingEntityName || "",
          reoEntityName: foreclosureSale.reoEntityName || "",
          reoContactFirstName: foreclosureSale.reoContactFirstName || "",
          reoContactLastName: foreclosureSale.reoContactLastName || "",
          reoBusinessPhone: foreclosureSale.reoBusinessPhone || "",
          reoEmergencyPhone: foreclosureSale.reoEmergencyPhone || "",
          requestedAlternativeToForeclosure: foreclosureSale.requestedAlternativeToForeclosure !== null && foreclosureSale.requestedAlternativeToForeclosure !== undefined ? foreclosureSale.requestedAlternativeToForeclosure : false,
          foreclosureAlternativeOption: foreclosureSale.foreclosureAlternativeOption !== null && foreclosureSale.foreclosureAlternativeOption !== undefined 
            ? (typeof foreclosureSale.foreclosureAlternativeOption === 'number' 
                ? foreclosureSale.foreclosureAlternativeOption 
                : parseInt(foreclosureSale.foreclosureAlternativeOption, 10))
            : null
        };

        // Call update foreclosure API
        await petitionApiService.updateForeclosure(petition.id, foreclosureData);
        
        // Refresh the tab data to get updated petition
        if (activeTabId && refreshTab) {
          await refreshTab(activeTabId);
        }
        
        // Call the callback to refresh the petitions list
        if (onPetitionUpdated) {
          setTimeout(() => {
            onPetitionUpdated();
          }, 200);
        }
        
        // Clear field errors on success
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.foreclosureSale;
          delete newErrors.saleDate;
          delete newErrors.soldToId;
          delete newErrors.vestingEntityName;
          delete newErrors.reoContactFirstName;
          delete newErrors.reoContactLastName;
          delete newErrors.reoBusinessPhone;
          return newErrors;
        });
        break;
      }
      
      default:
        throw new Error(`Save handler not implemented for section: ${sectionId}`);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close edit and notes dropdowns
      if (showEditDropdown && !event.target.closest('.edit-options-dropdown')) {
        setShowEditDropdown(false);
      }
      if (showNotesDropdown && !event.target.closest('.notes-options-dropdown')) {
        setShowNotesDropdown(false);
      }
      
      // Close address suggestion dropdowns when clicking outside
      // Check if click is on any address input field or dropdown
      const isPropertyAddressInput = propertyAddressInputRef.current && propertyAddressInputRef.current.contains(event.target);
      const isAddressDropdown = event.target.closest('.address-suggestions-dropdown-tab');
      const isAnyAddressInput = event.target.closest('input[name*="Street1"], input[name*="street1"], input[name*="mailingStreet1"], input[name*="noticeAddressStreet1"]');
      
      // If click is not on any address-related element, close all dropdowns
      if (!isPropertyAddressInput && !isAddressDropdown && !isAnyAddressInput) {
        // Close property address dropdown
        setShowPredictions(false);
        // Clear all address predictions to close dropdowns
        setBorrowerPredictions({});
        setAssigneePredictions({});
        setNoticePredictions({});
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEditDropdown, showNotesDropdown, showPredictions]);

  // Removed status check - now all petitions (draft and submitted) can be edited

  if (!petition || !formData) return null;

  // Helper functions to get mapped values
  const getLoanTypeName = (loanTypeId) => {
    return getOptionName(getLoanTypes(), loanTypeId) || loanTypeId || "N/A";
  };

  const getAssigneeTypeName = (assigneeTypeId) => {
    return (
      getOptionName(getAssigneeTypes(), assigneeTypeId) ||
      assigneeTypeId ||
      "N/A"
    );
  };

  const getAssigneeRoleName = (assigneeRoleId) => {
    return (
      getOptionName(getAssigneeRoles(), assigneeRoleId) ||
      assigneeRoleId ||
      "N/A"
    );
  };

  const getLienPositionName = (lienPosition) => {
    // Map lien position value to name using the petition enums
    return getOptionName(getLienPositions(), lienPosition) || "N/A";
  };

  // Check if this tab is currently loading
  const isTabLoading = loadingTabs.has(activeTabId);

  // Show loading state
  if (isTabLoading) {
    return (
      <div className="petition-tab-content">
        <div
          className="loading-container"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading petition details...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusBadgeClass = (status, statusClass) => {
    // Use the statusClass from API if available, otherwise fallback to status text
    if (statusClass) {
      return `status-badge status-${statusClass}`;
    }

    switch (status?.toLowerCase()) {
      case "accepted":
        return "status-badge status-accepted";
      case "submitted":
        return "status-badge status-submitted";
      case "resubmitted":
        return "status-badge status-submitted";
      case "returned":
        return "status-badge status-returned";
      case "draft":
        return "status-badge status-draft";
      case "under review":
        return "status-badge status-under-review";
      case "rejected":
        return "status-badge status-rejected";
      case "closed":
        return "status-badge status-closed";
      default:
        return "status-badge";
    }
  };

  // Handle input change - similar to PetitionSteps
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

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
      return;
    }

    // Define integer fields that should not show decimal values
    const integerFields = ["delinquencyDaysAtFiling", "daysDelinquentAtNotice"];

    // Define currency fields that should be formatted with commas
    const currencyFields = [
      "originalPrincipalAmount",
      "currentPrincipalBalance",
      "monthlyPaymentAmount",
      "amountInDefault",
    ];

    // Handle numeric inputs for integer fields
    let processedValue = value;
    
    // Handle currency fields - parse to remove commas for storage, but format for display
    if (currencyFields.includes(name)) {
      // Parse the input to get numeric value (remove commas)
      const parsedValue = value.replace(/[^\d.]/g, "");
      processedValue = parsedValue;
    }
    
    if (type === "number" && integerFields.includes(name) && value !== "") {
      const intValue = parseInt(value, 10);
      processedValue = isNaN(intValue) ? "" : intValue.toString();
    }

    setFormData((prev) => {
      // Handle nested objects (judgment, foreclosureSale)
      if (name === "judgment" && typeof processedValue === 'object') {
        return {
          ...prev,
          judgment: processedValue,
        };
      }
      if (name === "foreclosureSale" && typeof processedValue === 'object') {
        return {
          ...prev,
          foreclosureSale: processedValue,
        };
      }

      const newFormData = {
        ...prev,
        [name]: type === "checkbox" ? checked : processedValue,
      };

      // Check if any of the three checkboxes (variableRate, interestOnly, negativeAmortization) are checked
      // If so, automatically set certainMortgageLoan to true and make it read-only
      if (name === "variableRate" || name === "interestOnly" || name === "negativeAmortization") {
        const variableRateChecked = name === "variableRate" ? checked : prev.variableRate;
        const interestOnlyChecked = name === "interestOnly" ? checked : prev.interestOnly;
        const negativeAmortizationChecked = name === "negativeAmortization" ? checked : prev.negativeAmortization;
        
        const hasAnyChecked = variableRateChecked || interestOnlyChecked || negativeAmortizationChecked;

        if (hasAnyChecked) {
          // Automatically set to Yes when any checkbox is checked
          newFormData.certainMortgageLoan = true;
        } else {
          // When all checkboxes are unchecked, allow user to change it again
          // Don't reset the value, just allow editing
        }
      }

      return newFormData;
    });

    // Trigger Google predictions for property address while editing
    if (isEditing && name === "propertyStreet1") {
      handlePropertyAddressInput(processedValue || "");
    }

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }


    // Real-time validation for origination date - must be in the past
    if (name === "originationDate" && processedValue.trim()) {
      const originationDate = new Date(processedValue);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (!isNaN(originationDate.getTime())) {
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

    // Real-time validation for notice date - must be in the past
    if (name === "noticeDate" && processedValue.trim()) {
      const noticeDate = new Date(processedValue);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (!isNaN(noticeDate.getTime())) {
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

    // Real-time validation for interest rate - must be 0-100% and > 0%
    if (name === "interestRatePercent" && processedValue !== "" && processedValue !== null && processedValue !== undefined) {
      const interestRate = parseFloat(processedValue) || 0;
      
      if (interestRate < 0 || interestRate > 100) {
        setFieldErrors((prev) => ({
          ...prev,
          interestRatePercent: "Interest Rate must be between 0% and 100%",
        }));
      } else if (interestRate === 0) {
        setFieldErrors((prev) => ({
          ...prev,
          interestRatePercent: "Interest Rate must be greater than 0%",
        }));
      } else if (
        fieldErrors.interestRatePercent === "Interest Rate must be between 0% and 100%" ||
        fieldErrors.interestRatePercent === "Interest Rate must be greater than 0%"
      ) {
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.interestRatePercent;
          return newErrors;
        });
      }
    }

    // Real-time validation for amount fields - must be > 0
    const amountFields = ["originalPrincipalAmount", "currentPrincipalBalance", "monthlyPaymentAmount", "amountInDefault"];
    if (amountFields.includes(name) && processedValue !== "" && processedValue !== null && processedValue !== undefined) {
      const amount = parseFloat(processedValue) || 0;
      
      if (amount <= 0) {
        const fieldLabels = {
          originalPrincipalAmount: "Original Principal Amount must be greater than 0",
          currentPrincipalBalance: "Current Principal Balance must be greater than 0",
          monthlyPaymentAmount: "Monthly Payment Amount must be greater than 0",
          amountInDefault: "Amount in default must be greater than 0",
        };
        setFieldErrors((prev) => ({
          ...prev,
          [name]: fieldLabels[name] || "Amount must be greater than 0",
        }));
      } else if (fieldErrors[name] && fieldErrors[name].includes("must be greater than 0")) {
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }

    // Real-time validation for delinquency days - must be >= 0
    if ((name === "delinquencyDaysAtFiling" || name === "daysDelinquentAtNotice") && processedValue !== "" && processedValue !== null && processedValue !== undefined) {
      const days = parseInt(processedValue, 10);
      
      if (isNaN(days) || days < 0) {
        const fieldLabels = {
          delinquencyDaysAtFiling: "Delinquency Days at Filing must be 0 or greater",
          daysDelinquentAtNotice: "Days delinquent must be 0 or greater",
        };
        setFieldErrors((prev) => ({
          ...prev,
          [name]: fieldLabels[name] || "Days must be 0 or greater",
        }));
      } else if (fieldErrors[name] && fieldErrors[name].includes("must be 0 or greater")) {
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }

    // Real-time validation for ZIP code format
    if ((name === "propertyZip" || name === "filingEntityZip" || name === "noticeAddressZip") && processedValue.trim()) {
      const zipPattern = /^\d{5}(-\d{4})?$/;
      if (!zipPattern.test(processedValue.trim())) {
        setFieldErrors((prev) => ({
          ...prev,
          [name]: "ZIP code must be in valid format (12345 or 12345-6789)",
        }));
      } else if (fieldErrors[name] === "ZIP code must be in valid format (12345 or 12345-6789)") {
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }

    // Real-time validation for cure expiration date - must be after notice date
    if (name === "cureExpirationDate" && processedValue.trim() && formData.noticeDate) {
      const noticeDate = new Date(formData.noticeDate);
      const cureExpirationDate = new Date(processedValue);
      
      if (!isNaN(noticeDate.getTime()) && !isNaN(cureExpirationDate.getTime())) {
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

    // Re-validate cure expiration date when notice date changes
    if (name === "noticeDate" && formData.cureExpirationDate && processedValue.trim()) {
      const noticeDate = new Date(processedValue);
      const cureExpirationDate = new Date(formData.cureExpirationDate);
      
      if (!isNaN(noticeDate.getTime()) && !isNaN(cureExpirationDate.getTime())) {
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

    // Real-time validation for acceleration date (manualOverrideReason) - must be in the past
    if (name === "manualOverrideReason" && processedValue.trim()) {
      const accelerationDate = new Date(processedValue);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (!isNaN(accelerationDate.getTime())) {
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

    // Real-time validation for amount in default - must be positive if notice sent
    if (name === "amountInDefault" && formData.noticeSent === true && processedValue !== "" && processedValue !== null && processedValue !== undefined) {
      const amount = parseFloat(processedValue) || 0;
      
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
  };

  // Handle borrower field changes
  const updateBorrower = (borrowerId, field, value) => {
    // Real-time validation for borrower name fields
    const validNamePattern = /^[a-zA-Z\s\-']*$/;
    const nameFields = ["firstName", "lastName", "middleName", "suffix"];
    
    if (nameFields.includes(field) && value && value.trim()) {
      if (!validNamePattern.test(value.trim())) {
        const fieldLabel = field === "firstName" ? "First name" : 
                          field === "lastName" ? "Last name" :
                          field === "middleName" ? "Middle name" : "Suffix";
        setFieldErrors(prev => ({
          ...prev,
          [`borrower_${borrowerId}_${field}`]: `${fieldLabel} must contain only valid characters (no numbers or invalid symbols)`,
        }));
      } else {
        // Clear error if pattern is valid
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`borrower_${borrowerId}_${field}`];
          return newErrors;
        });
      }
    } else if (nameFields.includes(field) && fieldErrors[`borrower_${borrowerId}_${field}`]) {
      // Clear error if field is empty
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`borrower_${borrowerId}_${field}`];
        return newErrors;
      });
    }

    setFormData((prev) => ({
      ...prev,
      borrowers: prev.borrowers.map((borrower) =>
        borrower.id === borrowerId ? { ...borrower, [field]: value } : borrower
      ),
    }));
  };

  // Handle loan assignee field changes
  const updateLoanAssignee = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      loanAssignees: prev.loanAssignees.map((assignee, idx) =>
        idx === index ? { ...assignee, [field]: value } : assignee
      ),
    }));
  };


  // Add borrower
  const addBorrower = () => {
    setFormData((prev) => {
      const hasPrimary = (prev.borrowers || []).some(
        (b) => b.borrowerIsPrimary
      );

      const newBorrower = {
        id: Date.now(),
        firstName: "",
        middleName: "",
        lastName: "",
        suffix: "",
        borrowerIsPrimary: hasPrimary ? false : true,
        mailingStreet1: "",
        mailingCity: "",
        mailingState: "",
        mailingZip: "",
        phone: "",
        email: "",
      };

      return {
        ...prev,
        borrowers: [...prev.borrowers, newBorrower],
      };
    });
  };

  // Remove borrower
  const removeBorrower = (borrowerId) => {
    if (formData.borrowers.length > 1) {
      const isRemovingPrimary = formData.borrowers.find(
        (b) => b.id === borrowerId
      )?.borrowerIsPrimary;

      setFormData((prev) => {
        const newBorrowers = prev.borrowers
          .filter((borrower) => borrower.id !== borrowerId)
          .map((borrower) => ({ ...borrower }));

        const hasPrimary = newBorrowers.some((b) => b.borrowerIsPrimary);

        if ((!hasPrimary || isRemovingPrimary) && newBorrowers.length > 0) {
          newBorrowers[0] = {
            ...newBorrowers[0],
            borrowerIsPrimary: true,
          };
          for (let i = 1; i < newBorrowers.length; i++) {
            newBorrowers[i] = {
              ...newBorrowers[i],
              borrowerIsPrimary: false,
            };
          }
        }

        return {
          ...prev,
          borrowers: newBorrowers,
        };
      });
    }
  };

  const setPrimaryBorrower = (borrowerId) => {
    setFormData((prev) => ({
      ...prev,
      borrowers: prev.borrowers.map((borrower) => ({
        ...borrower,
        borrowerIsPrimary: borrower.id === borrowerId,
      })),
    }));
  };

  // Add loan assignee
  const addLoanAssignee = () => {
    setFormData((prev) => ({
      ...prev,
      loanAssignees: [
        ...prev.loanAssignees,
        {
          id: null,
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

  // Remove loan assignee
  const removeLoanAssignee = (index) => {
    setFormData((prev) => ({
      ...prev,
      loanAssignees: prev.loanAssignees.filter((_, idx) => idx !== index),
    }));
  };

  // Add right to cure entry
  const addRightToCure = () => {
    setFormData((prev) => ({
      ...prev,
      rightToCures: [
        ...(prev.rightToCures || []),
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
        },
      ],
    }));
  };

  // Remove right to cure entry
  const removeRightToCure = (index) => {
    setFormData((prev) => ({
      ...prev,
      rightToCures: (prev.rightToCures || []).filter((_, idx) => idx !== index),
    }));
  };

  // Update right to cure entry
  const updateRightToCure = (index, field, value) => {
    setFormData((prev) => {
      const updatedRightToCures = (prev.rightToCures || []).map((rtc, idx) =>
        idx === index ? { ...rtc, [field]: value } : rtc
      );
      
      // If noticeSent is set to true, initialize foreclosureSale if it doesn't exist
      if (field === "noticeSent" && value === true && !prev.foreclosureSale) {
        return {
          ...prev,
          rightToCures: updatedRightToCures,
          foreclosureSale: {
            saleDate: "",
            soldToId: "",
            vestingEntityName: "",
            reoEntityName: "",
            reoContactFirstName: "",
            reoContactLastName: "",
            reoBusinessPhone: "",
            reoEmergencyPhone: "",
          },
        };
      }
      
      return {
        ...prev,
        rightToCures: updatedRightToCures,
      };
    });
  };

  // Helper function to check if judgment has been submitted (has meaningful data)
  const hasJudgmentBeenSubmitted = () => {
    const judgment = formData?.judgment;
    if (!judgment) return false;
    
    // Check if at least one field has a meaningful value
    const hasDate = judgment.judgmentDate !== null && 
                    judgment.judgmentDate !== undefined &&
                    ((typeof judgment.judgmentDate === 'string' && judgment.judgmentDate.trim() !== '') ||
                     (typeof judgment.judgmentDate !== 'string'));
    
    const hasType = judgment.judgmentType !== null && 
                    judgment.judgmentType !== undefined && 
                    judgment.judgmentType !== 0 &&
                    judgment.judgmentType !== '';
    
    const hasCourtInfo = judgment.courtInformation !== null &&
                         judgment.courtInformation !== undefined &&
                         typeof judgment.courtInformation === 'string' && 
                         judgment.courtInformation.trim() !== '';
    
    const hasDocket = judgment.docketNumbers !== null &&
                      judgment.docketNumbers !== undefined &&
                      typeof judgment.docketNumbers === 'string' && 
                      judgment.docketNumbers.trim() !== '';
    
    return hasDate || hasType || hasCourtInfo || hasDocket;
  };

  // Helper function to check if foreclosure editing is allowed
  const canEditForeclosure = () => {
    // Check if any right to cure has noticeSent === true
    const hasNoticeSent = (formData.rightToCures && formData.rightToCures.length > 0 && 
      formData.rightToCures.some(rtc => rtc.noticeSent === true)) ||
      (formData.noticeSent === true); // Fallback for old single-object format
    
    if (!hasNoticeSent) {
      return false;
    }
    // Judgment must be submitted
    if (!hasJudgmentBeenSubmitted()) {
      return false;
    }
    return true;
  };

  // Check if petition is draft
  const isDraftPetition = () => {
    const status = petition?.status?.toLowerCase();
    const statusClass = petition?.statusClass?.toLowerCase();
    return status === "draft" || statusClass === "draft";
  };

  // Handle opening petition wizard for draft petitions
  const handleOpenDraftWizard = () => {
    // Store the pre-filled form data in localStorage so PetitionSteps can load it
    if (initialFormData) {
      sessionStorage.setItem(STORAGE_KEYS.PETITION_FORM_DATA, JSON.stringify(initialFormData));
      // Also store the petition ID so we can update it when saving
      sessionStorage.setItem("editingPetitionId", petition.id);
    }
    setShowPetitionWizard(true);
  };

  // Handle edit dropdown selection
  const handleEditOptionSelect = (option) => {
    setShowEditDropdown(false);
    if (option === "judgement") {
      setShowJudgementModal(true);
    } else if (option === "foreclosure") {
      // Check if conditions are met before allowing foreclosure editing
      if (canEditForeclosure()) {
        setShowForeclosureModal(true);
      } else {
        // Show warning dialog
        setShowForeclosureWarningModal(true);
      }
    }
  };

  // Handle saving judgment data
  const handleSaveJudgment = async (updatedFormData) => {
    try {
      const judgment = updatedFormData?.judgment;
      if (!judgment) {
        throw new Error(t("errors.judgmentDataRequired"));
      }

      // Get judgment ID from petition details (null if new)
      const judgmentId = petition.details?.judgment?.id || null;
      const isFirstTime = judgmentId === null; // Check if this is the first time adding judgment

      // Prepare judgment data for API
      const judgmentData = {
        id: judgmentId,
        petitionId: petition.id,
        judgmentDate: judgment.judgmentDate || "",
        judgmentType: judgment.judgmentType !== null && judgment.judgmentType !== undefined 
          ? (typeof judgment.judgmentType === 'number' 
              ? judgment.judgmentType 
              : parseInt(judgment.judgmentType, 10))
          : 0,
        courtInformation: judgment.courtInformation || "",
        docketNumbers: judgment.docketNumbers || ""
      };

      await petitionApiService.updateJudgment(petition.id, judgmentData);
      
      // Only update status if judgment was saved successfully and it's the first time
      if (isFirstTime) {
        await petitionApiService.updateStatus(petition.id, "3"); // Status value 3 (JudgmentSubmitted)
      }
      
      toast.success(t("errors.judgmentSavedSuccessfully"));
      
      // Refresh the tab data to get updated petition
      if (activeTabId && refreshTab) {
        await refreshTab(activeTabId);
      }
      
      // Call the callback to refresh the petitions list
      if (onPetitionUpdated) {
        setTimeout(() => {
          onPetitionUpdated();
        }, 200);
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || t("errors.failedSaveJudgment");
      toast.error(errorMessage);
      throw err;
    }
  };

  // Handle note saved - refetch petition to get updated notes
  const handleNoteSaved = async () => {
    try {
      // Refetch petition to get updated notes
      if (onPetitionUpdated) {
        setTimeout(() => {
          onPetitionUpdated();
        }, 200);
      }
      if (activeTabId && refreshTab) {
        await refreshTab(activeTabId);
      }
    } catch {
      // Error refreshing petition after note save - non-critical
    }
  };

  // Handle editing a note - COMMENTED OUT: only allowing adding notes for now
  // const handleEditNote = (note) => {
  //   setNoteToEdit(note);
  //   setShowNotesModal(true);
  //   setShowNotesDropdown(false);
  // };

  // Handle opening add note modal
  const handleAddNote = () => {
    setNoteToEdit(null);
    setShowNotesModal(true);
    setShowNotesDropdown(false);
  };

  // Handle saving foreclosure data
  const handleSaveForeclosure = async (updatedFormData) => {
    try {
      const foreclosureSale = updatedFormData?.foreclosureSale;
      if (!foreclosureSale) {
        throw new Error(t("errors.foreclosureSaleDataRequired"));
      }

      // Get foreclosure ID from petition details (null if new)
      const foreclosureId = petition.details?.foreclosureSale?.id || null;
      const isFirstTime = foreclosureId === null; // Check if this is the first time adding foreclosure

      // Prepare foreclosure data for API
      const foreclosureData = {
        id: foreclosureId,
        saleDate: foreclosureSale.saleDate || "",
        soldToId: foreclosureSale.soldToId || "",
        vestingEntityName: foreclosureSale.vestingEntityName || "",
        reoEntityName: foreclosureSale.reoEntityName || "",
        reoContactFirstName: foreclosureSale.reoContactFirstName || "",
        reoContactLastName: foreclosureSale.reoContactLastName || "",
        reoBusinessPhone: foreclosureSale.reoBusinessPhone || "",
        reoEmergencyPhone: foreclosureSale.reoEmergencyPhone || "",
        requestedAlternativeToForeclosure: foreclosureSale.requestedAlternativeToForeclosure !== null && foreclosureSale.requestedAlternativeToForeclosure !== undefined ? foreclosureSale.requestedAlternativeToForeclosure : false,
        foreclosureAlternativeOption: foreclosureSale.foreclosureAlternativeOption !== null && foreclosureSale.foreclosureAlternativeOption !== undefined 
          ? (typeof foreclosureSale.foreclosureAlternativeOption === 'number' 
              ? foreclosureSale.foreclosureAlternativeOption 
              : parseInt(foreclosureSale.foreclosureAlternativeOption, 10))
          : null
      };

      // First, save/update foreclosure
        await petitionApiService.updateForeclosure(petition.id, foreclosureData);
      
      // Only update status if foreclosure was saved successfully and it's the first time
      if (isFirstTime) {
        await petitionApiService.updateStatus(petition.id, "2"); // Status value 2 (ForeclosureSaleInitiated)
      }
      
      toast.success(t("errors.foreclosureSavedSuccessfully"));
      
      // Refresh the tab data to get updated petition
      if (activeTabId && refreshTab) {
        await refreshTab(activeTabId);
      }
      
      // Call the callback to refresh the petitions list
      if (onPetitionUpdated) {
        setTimeout(() => {
          onPetitionUpdated();
        }, 200);
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || t("errors.failedSaveForeclosure");
      toast.error(errorMessage);
      throw err;
    }
  };


  // Reusable section header component with section-level edit button
  const SectionHeader = ({ title, sectionId }) => {
    // For draft petitions, don't show section-level edit buttons (they should use the wizard)
    const canEdit = !isPublic && petition?.status?.toLowerCase() !== "closed" && !isDraftPetition();
    // Don't allow editing signatures section
    const showEditButton = canEdit && sectionId && sectionId !== "signatures";
    const sectionEditing = sectionId ? isSectionEditing(sectionId) : false;
    
    console.log("SectionHeader render:", { title, sectionId, canEdit, showEditButton, sectionEditing, isPublic, status: petition?.status, isDraft: isDraftPetition() });
    
    return (
      <div className="card-header" style={{ position: "relative", zIndex: 1 }}>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{title}</h5>
          {showEditButton && (
            <div className="section-header-actions" style={{ position: "relative", zIndex: 10 }}>
              {!sectionEditing ? (
                <button
                  type="button"
                  className="btn btn-sm btn-light section-edit-btn"
                  style={{ position: "relative", zIndex: 11, pointerEvents: "auto", cursor: "pointer" }}
                  onClick={(e) => {
                    console.log("Edit button clicked for section:", sectionId);
                    e.preventDefault();
                    e.stopPropagation();
                    handleSectionEditToggle(sectionId);
                  }}
                  onMouseDown={(e) => {
                    console.log("Edit button mousedown for section:", sectionId);
                    e.stopPropagation();
                  }}
                  title={t("common.edit") || "Edit this section"}
                >
                  <i className="fas fa-edit me-1"></i>
                  {t("common.edit")}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-sm btn-success section-save-btn"
                    style={{ position: "relative", zIndex: 11, pointerEvents: "auto", cursor: "pointer" }}
                    onClick={async (e) => {
                      console.log("Save button clicked for section:", sectionId);
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        setIsSavingDraft(true);
                        await handleSectionSave(sectionId);
                        toggleSectionEditing(sectionId);
                        toast.success(t("petitionTabContent.sectionSaved") || "Section saved successfully");
                      } catch (err) {
                        // Check if it's a duplicate error - show the specific message
                        if (err?.isDuplicate || (err?.message && (err.message.toLowerCase().includes("duplicate") || err.message.toLowerCase().includes("same property")))) {
                          toast.error(err.message || t("errors.petitionSamePropertyExists"));
                        } else {
                          // Show generic error for other errors
                          toast.error(t("petitionTabContent.saveError") || "Error saving section");
                        }
                      } finally {
                        setIsSavingDraft(false);
                      }
                    }}
                    onMouseDown={(e) => {
                      console.log("Save button mousedown for section:", sectionId);
                      e.stopPropagation();
                    }}
                    title={t("common.save") || "Save changes"}
                    disabled={isSavingDraft}
                  >
                    <i className="fas fa-save me-1"></i>
                    {t("common.save")}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary section-cancel-btn"
                    style={{ position: "relative", zIndex: 11, pointerEvents: "auto", cursor: "pointer" }}
                    onClick={(e) => {
                      console.log("Cancel button clicked for section:", sectionId);
                      e.preventDefault();
                      e.stopPropagation();
                      handleSectionEditToggle(sectionId);
                    }}
                    onMouseDown={(e) => {
                      console.log("Cancel button mousedown for section:", sectionId);
                      e.stopPropagation();
                    }}
                    title={t("common.cancel") || "Cancel editing"}
                  >
                    <i className="fas fa-times me-1"></i>
                    {t("common.cancel")}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      let yPosition = 20;

      // Add header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(
        t("petitionTabContent.filirTitle"),
        20,
        yPosition
      );
      yPosition += 10;

      doc.setFontSize(14);
      doc.text(`${t("petitionTabContent.petition")}: ${petition.petitionNumber}`, 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `${t("common.status")}: ${petition.status} | ${t("common.created")}: ${formatDate(
          petition.createdDate
        )} | ${t("common.lastUpdated")}: ${formatDate(petition.modifiedDate)}`,
        20,
        yPosition
      );
      yPosition += 15;

      // Property Details
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(t("petitionTabContent.propertyDetails"), 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const propertyData = [
        [
          t("petitionTabContent.streetAddress"),
          petition.details?.property?.propertyStreet1 || t("common.nA"),
        ],
        [
          t("petitionTabContent.addressLine2"),
          petition.details?.property?.propertyStreet2 || t("common.nA"),
        ],
        [t("petitionTabContent.city"), petition.details?.property?.propertyCity || t("common.nA")],
        [t("petitionTabContent.state"), petition.details?.property?.propertyState || t("common.nA")],
        [t("petitionTabContent.zipCode"), petition.details?.property?.propertyZip || t("common.nA")],
        [t("petitionTabContent.county"), petition.details?.property?.propertyCounty || t("common.nA")],
        [
          t("petitionTabContent.assessorParcelId"),
          petition.details?.property?.assessorParcelId || t("common.nA"),
        ],
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [[t("common.field"), t("common.value")]],
        body: propertyData,
        theme: "grid",
        headStyles: { fillColor: [52, 73, 94] },
        styles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } },
      });

      yPosition = doc.lastAutoTable.finalY + 15;

      // Loan Details
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(t("petitionTabContent.loanDetails"), 20, yPosition);
      yPosition += 10;

      const loanData = [
        [t("petitionTabContent.minNumber"), petition.details?.loan?.minNumber || t("common.nA")],
        [t("petitionTabContent.loanNumber"), petition.details?.loan?.loanNumber || t("common.nA")],
        [
          t("petitionTabContent.loanType"),
          getLoanTypeName(petition.details?.loan?.petitionLoanTypeId),
        ],
        [
          t("petitionTabContent.lienPosition"),
          getLienPositionName(petition.details?.loan?.lienPosition),
        ],
        [
          t("petitionTabContent.originationDate"),
          formatDate(petition.details?.loan?.originationDate),
        ],
        [
          t("petitionTabContent.originalAmount"),
          formatCurrency(petition.details?.loan?.originalPrincipalAmount),
        ],
        [
          t("petitionTabContent.currentAmount"),
          formatCurrency(petition.details?.loan?.currentPrincipalBalance),
        ],
        [
          t("petitionTabContent.interestRate"),
          petition.details?.loan?.interestRatePercent
            ? `${petition.details.loan.interestRatePercent}%`
            : t("common.nA"),
        ],
        [
          t("petitionTabContent.monthlyPayment"),
          formatCurrency(petition.details?.loan?.monthlyPaymentAmount),
        ],
        [
          t("petitionTabContent.delinquencyDays"),
          petition.details?.loan?.delinquencyDaysAtFiling || t("common.nA"),
        ],
        [t("petitionTabContent.variableRate"), petition.details?.loan?.variableRate ? t("common.yes") : t("common.no")],
        [t("petitionTabContent.interestOnly"), petition.details?.loan?.interestOnly ? t("common.yes") : t("common.no")],
        [
          t("petitionTabContent.negativeAmortization"),
          petition.details?.loan?.negativeAmortization ? t("common.yes") : t("common.no"),
        ],
        [
          t("petitionTabContent.lenderType"),
          getOptionName(getLenderTypes(), petition.details?.loan?.lenderId) || t("common.nA"),
        ],
        [
          t("petitionTabContent.mortgageBrokerLicenseNumber"),
          petition.details?.loan?.mortgageBrokerLicenseNumber || t("common.nA"),
        ],
        [
          t("petitionTabContent.mortgageLoanOriginatorLicenseNumber"),
          petition.details?.loan?.mortgageLoanOriginatorLicenseNumber || t("common.nA"),
        ],
        [
          t("petitionTabContent.borrowerRequestedLoanModification"),
          petition.details?.loan?.borrowerRequestedLoanModification !== null && petition.details?.loan?.borrowerRequestedLoanModification !== undefined
            ? (petition.details.loan.borrowerRequestedLoanModification ? t("common.yes") : t("common.no"))
            : t("common.nA"),
        ],
        [
          t("petitionTabContent.loanModificationRequestFinalized"),
          petition.details?.loan?.loanModificationRequestFinalized !== null && petition.details?.loan?.loanModificationRequestFinalized !== undefined
            ? (petition.details.loan.loanModificationRequestFinalized ? t("common.yes") : t("common.no"))
            : t("common.nA"),
        ],
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [[t("common.field"), t("common.value")]],
        body: loanData,
        theme: "grid",
        headStyles: { fillColor: [52, 73, 94] },
        styles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } },
      });

      yPosition = doc.lastAutoTable.finalY + 15;

      // Borrower Details
      if (
        petition.details?.borrowers &&
        petition.details.borrowers.length > 0
      ) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(t("petitionTabContent.borrowerDetails"), 20, yPosition);
        yPosition += 10;

        petition.details.borrowers.forEach((borrower, index) => {
          const borrowerData = [
            [t("petitionTabContent.firstName"), borrower.firstName || t("common.nA")],
            [t("petitionTabContent.middleName"), borrower.middleName || t("common.nA")],
            [t("petitionTabContent.lastName"), borrower.lastName || t("common.nA")],
            [t("petitionTabContent.suffix"), borrower.suffix || t("common.nA")],
            [t("petitionTabContent.primaryBorrower"), borrower.borrowerIsPrimary ? t("common.yes") : t("common.no")],
            [t("petitionTabContent.email"), borrower.email || t("common.nA")],
            [t("petitionTabContent.phone"), borrower.phone || t("common.nA")],
            [t("petitionTabContent.mailingAddress"), borrower.mailingStreet1 || t("common.nA")],
            [t("petitionTabContent.mailingCity"), borrower.mailingCity || t("common.nA")],
            [t("petitionTabContent.mailingState"), borrower.mailingState || t("common.nA")],
            [t("petitionTabContent.mailingZip"), borrower.mailingZip || t("common.nA")],
          ];

          autoTable(doc, {
            startY: yPosition,
            head: [[t("common.field"), t("common.value")]],
            body: borrowerData,
            theme: "grid",
            headStyles: { fillColor: [52, 73, 94] },
            styles: { fontSize: 9 },
            columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } },
          });

          yPosition = doc.lastAutoTable.finalY + 10;
        });
      }

      // Filing Entity
      if (petition.details?.filingEntity) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(t("petitionTabContent.filingEntity"), 20, yPosition);
        yPosition += 10;

        const filingEntityData = [
          [
            t("petitionTabContent.legalName"),
            petition.details.filingEntity.filingEntityLegalName || t("common.nA"),
          ],
          [
            t("petitionTabContent.contactName"),
            petition.details.filingEntity.filingContactName || t("common.nA"),
          ],
          [
            t("petitionTabContent.contactEmail"),
            petition.details.filingEntity.filingContactEmail || t("common.nA"),
          ],
          [
            t("petitionTabContent.contactPhone"),
            petition.details.filingEntity.filingContactPhone || t("common.nA"),
          ],
          [
            t("petitionTabContent.nmlsLicense"),
            petition.details.filingEntity.nmlsLicenseNumber || t("common.nA"),
          ],
          [
            t("petitionTabContent.stateLicense"),
            petition.details.filingEntity.stateLicenseNumber || t("common.nA"),
          ],
          [
            t("petitionTabContent.licenseState"),
            petition.details.filingEntity.stateLicenseState || t("common.nA"),
          ],
          [
            t("petitionTabContent.streetAddress"),
            petition.details.filingEntity.filingEntityStreet1 || t("common.nA"),
          ],
          [
            t("petitionTabContent.addressLine2"),
            petition.details.filingEntity.filingEntityStreet2 || t("common.nA"),
          ],
          [t("petitionTabContent.city"), petition.details.filingEntity.filingEntityCity || t("common.nA")],
          [t("petitionTabContent.state"), petition.details.filingEntity.filingEntityState || t("common.nA")],
          [t("petitionTabContent.zipCode"), petition.details.filingEntity.filingEntityZip || t("common.nA")],
        ];

        autoTable(doc, {
          startY: yPosition,
          head: [[t("common.field"), t("common.value")]],
          body: filingEntityData,
          theme: "grid",
          headStyles: { fillColor: [52, 73, 94] },
          styles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } },
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Right-to-Cure - handle both array and single object formats
      const rightToCuresArray = petition.details?.rightToCures || 
        (petition.details?.rightToCure ? [petition.details.rightToCure] : []);
      
      if (rightToCuresArray.length > 0) {
        rightToCuresArray.forEach((rtc, index) => {
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text(
            rightToCuresArray.length > 1 
              ? `${t("petitionTabContent.rightToCure")} #${index + 1}`
              : t("petitionTabContent.rightToCure"),
            20,
            yPosition
          );
          yPosition += 10;

          const rightToCureData = [
            [
              t("petitionTabContent.noticeSent"),
              rtc.noticeSent !== null && rtc.noticeSent !== undefined 
                ? (rtc.noticeSent ? t("common.yes") : t("common.no"))
                : t("common.nA"),
            ],
            [t("petitionTabContent.noticeDate"), formatDate(rtc.noticeDate) || t("common.nA")],
            [
              t("petitionTabContent.daysDelinquent"),
              rtc.daysDelinquentAtNotice || t("common.nA"),
            ],
            [
              t("petitionTabContent.amountInDefault"),
              formatCurrency(rtc.amountInDefault) || t("common.nA"),
            ],
            [
              t("petitionTabContent.cureExpiration"),
              formatDate(rtc.cureExpirationDate) || t("common.nA"),
            ],
            [
              t("petitionTabContent.overrideReason"),
              rtc.manualOverrideReason || t("common.nA"),
            ],
            [
              t("petitionTabContent.noticeAddress"),
              rtc.noticeAddressStreet1 || t("common.nA"),
            ],
            [
              t("petitionTabContent.noticeCity"),
              rtc.noticeAddressCity || t("common.nA"),
            ],
            [
              t("petitionTabContent.noticeState"),
              rtc.noticeAddressState || t("common.nA"),
            ],
            [
              t("petitionTabContent.noticeZip"),
              rtc.noticeAddressZip || t("common.nA"),
            ],
            [
              t("petitionTabContent.borrowerRespondedWithin30Days"),
              rtc.borrowerRespondedWithin30Days !== null && rtc.borrowerRespondedWithin30Days !== undefined
                ? (rtc.borrowerRespondedWithin30Days ? t("common.yes") : t("common.no"))
                : t("common.nA"),
            ],
          ];

          // Add borrower response date if borrower responded
          if (rtc.borrowerRespondedWithin30Days === true) {
            rightToCureData.push([
              t("petitionTabContent.borrowerResponseDate"),
              formatDate(rtc.borrowerResponseDate) || t("common.nA"),
            ]);
            rightToCureData.push([
              t("petitionTabContent.proceededWithRightToCure"),
              rtc.proceededWithRightToCure !== null && rtc.proceededWithRightToCure !== undefined
                ? (rtc.proceededWithRightToCure ? t("common.yes") : t("common.no"))
                : t("common.nA"),
            ]);
          }

          autoTable(doc, {
            startY: yPosition,
            head: [[t("common.field"), t("common.value")]],
            body: rightToCureData,
            theme: "grid",
            headStyles: { fillColor: [52, 73, 94] },
            styles: { fontSize: 9 },
            columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } },
          });

          yPosition = doc.lastAutoTable.finalY + 15;
        });
      }

      // Judgment
      if (petition.details?.judgment) {
        const judgment = petition.details.judgment;
        
        // Check if judgment has meaningful data
        const hasJudgmentData = 
          (judgment.judgmentDate !== null && judgment.judgmentDate !== undefined && 
           ((typeof judgment.judgmentDate === 'string' && judgment.judgmentDate.trim() !== '') ||
            (typeof judgment.judgmentDate !== 'string'))) ||
          (judgment.judgmentType !== null && judgment.judgmentType !== undefined && judgment.judgmentType !== 0 && judgment.judgmentType !== '') ||
          (judgment.courtInformation !== null && judgment.courtInformation !== undefined && 
           typeof judgment.courtInformation === 'string' && judgment.courtInformation.trim() !== '') ||
          (judgment.docketNumbers !== null && judgment.docketNumbers !== undefined && 
           typeof judgment.docketNumbers === 'string' && judgment.docketNumbers.trim() !== '');

        if (hasJudgmentData) {
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text(t("petitionTabContent.judgment"), 20, yPosition);
          yPosition += 10;

          // Get judgment type name
          let judgmentTypeName = t("common.nA");
          if (judgment.judgmentType !== null && judgment.judgmentType !== undefined && judgment.judgmentType !== 0 && judgment.judgmentType !== '') {
            const judgmentTypes = getJudgmentTypes ? getJudgmentTypes() : [];
            const selectedType = findOptionByValue ? findOptionByValue(judgmentTypes, judgment.judgmentType) : null;
            judgmentTypeName = selectedType ? (selectedType.description || selectedType.name || t("common.nA")) : t("common.nA");
          }

          const judgmentData = [
            [t("petitionTabContent.judgmentDate"), formatDate(judgment.judgmentDate) || t("common.nA")],
            [t("petitionTabContent.judgmentType"), judgmentTypeName],
            [t("petitionTabContent.courtInformation"), judgment.courtInformation || t("common.nA")],
            [t("petitionTabContent.docketNumber"), judgment.docketNumbers || t("common.nA")],
          ];

          autoTable(doc, {
            startY: yPosition,
            head: [[t("common.field"), t("common.value")]],
            body: judgmentData,
            theme: "grid",
            headStyles: { fillColor: [52, 73, 94] },
            styles: { fontSize: 9 },
            columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } },
          });

          yPosition = doc.lastAutoTable.finalY + 15;
        }
      }

      // Foreclosure Sale - Show if data exists
      if (petition.details?.foreclosureSale) {
        const foreclosureSale = petition.details.foreclosureSale;
        
        // Check if foreclosure sale has meaningful data
        const hasForeclosureSaleData = 
          (foreclosureSale.saleDate !== null && foreclosureSale.saleDate !== undefined && 
           foreclosureSale.saleDate !== '' && typeof foreclosureSale.saleDate === 'string' && foreclosureSale.saleDate.trim() !== '') ||
          (foreclosureSale.soldToId !== null && foreclosureSale.soldToId !== undefined && 
           foreclosureSale.soldToId !== '' && ((typeof foreclosureSale.soldToId === 'string' && foreclosureSale.soldToId.trim() !== '') || (typeof foreclosureSale.soldToId !== 'string'))) ||
          (foreclosureSale.requestedAlternativeToForeclosure !== null && foreclosureSale.requestedAlternativeToForeclosure !== undefined) ||
          (foreclosureSale.foreclosureAlternativeOption !== null && foreclosureSale.foreclosureAlternativeOption !== undefined && 
           foreclosureSale.foreclosureAlternativeOption !== '' && foreclosureSale.foreclosureAlternativeOption !== 0) ||
          (foreclosureSale.vestingEntityName !== null && foreclosureSale.vestingEntityName !== undefined && 
           foreclosureSale.vestingEntityName !== '' && typeof foreclosureSale.vestingEntityName === 'string' && foreclosureSale.vestingEntityName.trim() !== '') ||
          (foreclosureSale.reoEntityName !== null && foreclosureSale.reoEntityName !== undefined && 
           foreclosureSale.reoEntityName !== '' && typeof foreclosureSale.reoEntityName === 'string' && foreclosureSale.reoEntityName.trim() !== '') ||
          (foreclosureSale.reoContactFirstName !== null && foreclosureSale.reoContactFirstName !== undefined && 
           foreclosureSale.reoContactFirstName !== '' && typeof foreclosureSale.reoContactFirstName === 'string' && foreclosureSale.reoContactFirstName.trim() !== '') ||
          (foreclosureSale.reoContactLastName !== null && foreclosureSale.reoContactLastName !== undefined && 
           foreclosureSale.reoContactLastName !== '' && typeof foreclosureSale.reoContactLastName === 'string' && foreclosureSale.reoContactLastName.trim() !== '') ||
          (foreclosureSale.reoBusinessPhone !== null && foreclosureSale.reoBusinessPhone !== undefined && 
           foreclosureSale.reoBusinessPhone !== '' && typeof foreclosureSale.reoBusinessPhone === 'string' && foreclosureSale.reoBusinessPhone.trim() !== '') ||
          (foreclosureSale.reoEmergencyPhone !== null && foreclosureSale.reoEmergencyPhone !== undefined && 
           foreclosureSale.reoEmergencyPhone !== '' && typeof foreclosureSale.reoEmergencyPhone === 'string' && foreclosureSale.reoEmergencyPhone.trim() !== '');

        if (hasForeclosureSaleData) {
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text(t("petitionTabContent.foreclosureSale"), 20, yPosition);
          yPosition += 10;

          // Get buyer type name
          let soldToName = t("common.nA");
          if (foreclosureSale.soldToId !== null && foreclosureSale.soldToId !== undefined && foreclosureSale.soldToId !== '') {
            const buyerTypes = getBuyerTypes ? getBuyerTypes() : [];
            const selectedBuyerType = findOptionByValue ? findOptionByValue(buyerTypes, foreclosureSale.soldToId) : null;
            soldToName = selectedBuyerType ? (selectedBuyerType.name || selectedBuyerType.value || t("common.nA")) : t("common.nA");
          }

          // Get foreclosure alternative option name
          let alternativeOptionName = t("common.nA");
          if (foreclosureSale.foreclosureAlternativeOption !== null && foreclosureSale.foreclosureAlternativeOption !== undefined && foreclosureSale.foreclosureAlternativeOption !== '') {
            const alternativeOptions = getForeclosureAlternativeOptions ? getForeclosureAlternativeOptions() : [];
            const selectedOption = findOptionByValue ? findOptionByValue(alternativeOptions, foreclosureSale.foreclosureAlternativeOption) : null;
            alternativeOptionName = selectedOption ? (selectedOption.name || selectedOption.description || selectedOption.value || t("common.nA")) : t("common.nA");
          }

          const foreclosureSaleData = [
            [t("petitionTabContent.saleDate"), formatDate(foreclosureSale.saleDate) || t("common.nA")],
            [t("petitionTabContent.soldTo"), soldToName],
            [
              t("petitionTabContent.requestedAlternativeToForeclosure"),
              foreclosureSale.requestedAlternativeToForeclosure !== null && foreclosureSale.requestedAlternativeToForeclosure !== undefined
                ? (foreclosureSale.requestedAlternativeToForeclosure ? t("common.yes") : t("common.no"))
                : t("common.nA"),
            ],
          ];

          // Add alternative option only if borrower requested an alternative
          if (foreclosureSale.requestedAlternativeToForeclosure === true) {
            foreclosureSaleData.push([
              t("petitionTabContent.foreclosureAlternativeOption"),
              alternativeOptionName,
            ]);
          }

          // Add remaining fields
          foreclosureSaleData.push(
            [t("petitionTabContent.vestingEntityName"), foreclosureSale.vestingEntityName || t("common.nA")],
            [t("petitionTabContent.reoEntityName"), foreclosureSale.reoEntityName || t("common.nA")],
            [t("petitionTabContent.reoContactFirstName"), foreclosureSale.reoContactFirstName || t("common.nA")],
            [t("petitionTabContent.reoContactLastName"), foreclosureSale.reoContactLastName || t("common.nA")],
            [t("petitionTabContent.reoBusinessPhone"), foreclosureSale.reoBusinessPhone || t("common.nA")],
            [t("petitionTabContent.reoEmergencyPhone"), foreclosureSale.reoEmergencyPhone || t("common.nA")]
          );

          autoTable(doc, {
            startY: yPosition,
            head: [[t("common.field"), t("common.value")]],
            body: foreclosureSaleData,
            theme: "grid",
            headStyles: { fillColor: [52, 73, 94] },
            styles: { fontSize: 9 },
            columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } },
          });

          yPosition = doc.lastAutoTable.finalY + 15;
        }
      }

      // Form 35B Compliance
      if (petition.details?.affidavit) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(t("petitionTabContent.form35BCompliance"), 20, yPosition);
        yPosition += 10;

        const affidavitData = [
          [
            t("petitionTabContent.certainMortgageLoan"),
            petition.details.affidavit.certainMortgageLoan !== null && petition.details.affidavit.certainMortgageLoan !== undefined
              ? (petition.details.affidavit.certainMortgageLoan ? t("common.yes") : t("common.no"))
              : t("common.nA"),
          ],
        ];

        // Add additional affidavit fields if they exist
        if (petition.details.affidavit.affiantName) {
          affidavitData.push([
            t("petitionTabContent.affiantName"),
            petition.details.affidavit.affiantName || t("common.nA"),
          ]);
        }
        if (petition.details.affidavit.affiantTitle) {
          affidavitData.push([
            t("petitionTabContent.affiantTitle"),
            petition.details.affidavit.affiantTitle || t("common.nA"),
          ]);
        }
        if (petition.details.affidavit.affidavitExecutionDate) {
          affidavitData.push([
            t("petitionTabContent.affidavitExecutionDate"),
            formatDate(petition.details.affidavit.affidavitExecutionDate) || t("common.nA"),
          ]);
        }

        autoTable(doc, {
          startY: yPosition,
          head: [[t("common.field"), t("common.value")]],
          body: affidavitData,
          theme: "grid",
          headStyles: { fillColor: [52, 73, 94] },
          styles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } },
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Loan Assignees
      if (
        petition.details?.loanAssignees &&
        petition.details.loanAssignees.length > 0
      ) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(t("petitionTabContent.loanAssignees"), 20, yPosition);
        yPosition += 10;

        petition.details.loanAssignees.forEach((assignee, index) => {
          const assigneeData = [
            [t("petitionTabContent.assigneeName"), assignee.assigneeName || t("common.nA")],
            [t("petitionTabContent.assigneeType"), getAssigneeTypeName(assignee.assigneeTypeId)],
            [t("petitionTabContent.assigneeRole"), getAssigneeRoleName(assignee.assigneeRoleId)],
            [t("petitionTabContent.streetAddress"), assignee.street1 || t("common.nA")],
            [t("petitionTabContent.addressLine2"), assignee.street2 || t("common.nA")],
            [t("petitionTabContent.city"), assignee.city || t("common.nA")],
            [t("petitionTabContent.state"), assignee.addressState || t("common.nA")],
            [t("petitionTabContent.zipCode"), assignee.zip || t("common.nA")],
            [t("petitionTabContent.licenseNumber"), assignee.licenseNumber || t("common.nA")],
            [t("petitionTabContent.licenseState"), assignee.licenseState || t("common.nA")],
          ];

          autoTable(doc, {
            startY: yPosition,
            head: [[t("common.field"), t("common.value")]],
            body: assigneeData,
            theme: "grid",
            headStyles: { fillColor: [52, 73, 94] },
            styles: { fontSize: 9 },
            columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } },
          });

          yPosition = doc.lastAutoTable.finalY + 10;
        });
      }

      // Signatures
      if (
        petition.details?.signatures &&
        petition.details.signatures.length > 0
      ) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(t("petitionTabContent.signatures"), 20, yPosition);
        yPosition += 10;

        petition.details.signatures.forEach((signature, index) => {
          const signatureData = [
            [t("petitionTabContent.signerName"), signature.signerFullName || t("common.nA")],
            [t("petitionTabContent.signerTitle"), signature.signerTitle || t("common.nA")],
            [t("petitionTabContent.signerEmail"), signature.signerEmail || t("common.nA")],
            [t("petitionTabContent.esignConsent"), signature.esignConsent ? t("common.yes") : t("common.no")],
            [t("petitionTabContent.signedAt"), formatDate(signature.signedAt)],
            [t("petitionTabContent.signerIp"), signature.signerIp || t("common.nA")],
            [t("petitionTabContent.otpCode"), signature.otpCode || t("common.nA")],
          ];

          autoTable(doc, {
            startY: yPosition,
            head: [[t("common.field"), t("common.value")]],
            body: signatureData,
            theme: "grid",
            headStyles: { fillColor: [52, 73, 94] },
            styles: { fontSize: 9 },
            columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } },
          });

          yPosition = doc.lastAutoTable.finalY + 10;
        });
      }

      // Save the PDF
      doc.save(`petition-${petition.petitionNumber}-details.pdf`);
    } catch (err) {
      toast.error(err?.message || t("common.errorGeneratingPDF") || "Error generating PDF. Please try again.");
    }
  };

  return (
    <div className="petition-tab-content">
      <div className="container-fluid petition-content-scrollable" id="petition-detail-content">
        {/* Header Section - Sticky */}
        <div className="row mb-3 petition-header-sticky">
          <div className="col-12">
            <div className="petition-header-card">
              <div className="petition-header-layout">
                <div className="petition-header-left">
                  <div className="d-flex align-items-center gap-3 flex-wrap">
                    <h4 className="petition-number-badge mb-0">
                      {petition.petitionNumber}
                    </h4>
                    <span
                      className={getStatusBadgeClass(
                        petition.status,
                        petition.statusClass
                      )}
                    >
                      {petition.status}
                    </span>
                  </div>
                  <div className="petition-header-meta">
                    <div className="petition-meta-line">
                      <i className="fas fa-calendar-alt me-2 text-muted"></i>
                      <span className="text-muted">
                        {t("common.created")}: {formatDate(petition.createdDate)}
                      </span>
                    </div>
                    <div className="petition-meta-line">
                      <i className="fas fa-clock me-2 text-muted"></i>
                      <span className="text-muted">
                        {t("common.lastUpdated")}: {formatDateTime(petition.modifiedDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side - Action Buttons */}
                <div className="d-flex align-items-center gap-2 petition-header-actions">
                  {!isEditing ? (
                    <>
                      {/* For draft petitions, show simple edit button that opens wizard */}
                      {isDraftPetition() ? (
                        <button
                          type="button"
                          className="dashboard-btn-create"
                          onClick={handleOpenDraftWizard}
                          title={t("petitionTabContent.edit")}
                        >
                          <i className="fas fa-edit me-1"></i>
                          {t("petitionTabContent.edit")}
                        </button>
                      ) : (
                        /* For non-draft petitions, show actions dropdown only if judgment or foreclosure doesn't exist */
                        (!hasJudgmentData() || !hasForeclosureSaleData()) && (
                          <div className="dropdown edit-options-dropdown" style={{ position: "relative" }}>
                            <button
                              type="button"
                              className={`dashboard-btn-create ${showEditDropdown ? 'active' : ''}`}
                              onClick={() => setShowEditDropdown(!showEditDropdown)}
                              title={t("petitionTabContent.actions")}
                            >
                              <i className="fas fa-edit me-1"></i>
                              {t("petitionTabContent.actions")}
                              <i className={`fas fa-chevron-down ms-1 transition-icon ${showEditDropdown ? 'rotate' : ''}`} style={{ fontSize: "0.7rem" }}></i>
                            </button>
                            {showEditDropdown && (
                              <div className="edit-options-menu">
                                {!hasJudgmentData() && (
                                  <button
                                    className="edit-option-item"
                                    onClick={() => handleEditOptionSelect("judgement")}
                                  >
                                    <i className="fas fa-plus edit-option-icon"></i>
                                    <span>{t("petitionTabContent.addJudgement")}</span>
                                  </button>
                                )}
                                {!hasForeclosureSaleData() && (
                                  <button
                                    className="edit-option-item"
                                    onClick={() => handleEditOptionSelect("foreclosure")}
                                  >
                                    <i className="fas fa-plus edit-option-icon"></i>
                                    <span>{t("petitionTabContent.addForeclosure")}</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    {!isPublic && (
                      <div className="dropdown notes-options-dropdown" style={{ position: "relative" }}>
                        <button
                          type="button"
                          className={`dashboard-btn-refresh ${showNotesDropdown ? 'active' : ''}`}
                          onClick={() => setShowNotesDropdown(!showNotesDropdown)}
                          title={t("petitionTabContent.notesOptions")}
                        >
                          <i className="fas fa-sticky-note me-1"></i>
                          {t("petitionTabContent.notes")}
                          <i className={`fas fa-chevron-down ms-1 transition-icon ${showNotesDropdown ? 'rotate' : ''}`} style={{ fontSize: "0.7rem" }}></i>
                        </button>
                        {showNotesDropdown && (
                          <div className="edit-options-menu">
                            <button
                              className="edit-option-item"
                              onClick={handleAddNote}
                            >
                              <i className="fas fa-plus edit-option-icon"></i>
                              <span>{t("petitionTabContent.addNote")}</span>
                            </button>
                            <button
                              className="edit-option-item"
                              onClick={() => {
                                setShowNotesSection(true);
                                setShowNotesDropdown(false);
                              }}
                            >
                              <i className="fas fa-eye edit-option-icon"></i>
                              <span>{t("petitionTabContent.viewNotes")}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                      <button
                        type="button"
                        className="dashboard-btn-refresh"
                        onClick={handleDownloadPDF}
                        title={t("petitionTabContent.downloadAsPDF")}
                      >
                        <i className="fas fa-download me-1"></i>
                        {t("petitionTabContent.downloadPDF")}
                      </button>
                    </>
                  ) : (
                    <>
                      {/* When editing sections, no header buttons - each section has its own Save/Cancel */}
                      {/* This section is intentionally left empty as section-level editing handles its own buttons */}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Warning message for foreclosure sale info - show at top when noticeSent is true, judgment is submitted, and info is missing, but not for Draft petitions */}
        {formData.noticeSent === true && 
         hasJudgmentBeenSubmitted() &&
         petition.status?.toLowerCase() !== "draft" && 
         petition.statusClass?.toLowerCase() !== "draft" &&
         (!formData.foreclosureSale?.saleDate || !formData.foreclosureSale?.soldToId) && (
          <div className="alert alert-warning mb-4">
            <strong>{t("petitionTabContent.pleaseFillForeclosureSaleInfo")}</strong> - {t("petitionTabContent.pleaseFillForeclosureSaleDesc")}
          </div>
        )}

        {/* Form Layout with Sidebar */}
        <div className="petition-form-layout">
          {/* Sidebar Navigation */}
          <PetitionContentSidebar
            sections={sections}
            activeSection={activeSection}
            onSectionClick={handleSectionClick}
          />

          {/* Main Content Area */}
          <div className="petition-form-content">
            <form className="petition-form">
              {/* Notes Display Section - Shows above Property Details when toggled (only for non-public pages) */}
              {!isPublic && showNotesSection && (
                <div ref={notesRef}>
                  <NotesDisplaySection
                    formData={formData}
                    onClose={() => setShowNotesSection(false)}
                    onEditNote={null}
                  />
                </div>
              )}
              {/* onEditNote={handleEditNote} - COMMENTED OUT: only allowing adding notes for now */}

              {/* Property Details Section */}
              <div ref={propertyDetailsRef}>
                <PropertyDetailsCard
                  SectionHeader={(props) => <SectionHeader {...props} sectionId="property" />}
                  isEditing={isSectionEditing("property")}
                  isLoaded={true}
                  propertyAddressInputRef={propertyAddressInputRef}
                  predictions={predictions}
                  showPredictions={showPredictions}
                  selectedPredictionIndex={selectedPredictionIndex}
                  isLoadingPredictions={isLoadingPredictions}
                  fieldErrors={fieldErrors}
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handlePropertyAddressInput={handlePropertyAddressInput}
                  handlePropertyAddressSelect={handlePropertyAddressSelect}
                  handleKeyDown={handlePropertyAddressKeyDown}
                  setShowPredictions={setShowPredictions}
                />
              </div>

              {/* Loan Details Section */}
              <div ref={loanDetailsRef}>
                <LoanDetails
                  SectionHeader={(props) => <SectionHeader {...props} sectionId="loan" />}
                  isEditing={isSectionEditing("loan")}
                  fieldErrors={fieldErrors}
                  formData={formData}
                  handleInputChange={handleInputChange}
                  getLoanTypes={getLoanTypes}
                  getLienPositions={getLienPositions}
                  getLenderTypes={getLenderTypes}
                  commonDataLoading={commonDataLoading}
                />
              </div>

              {/* Borrower Details Section */}
              <div ref={borrowerDetailsRef}>
                <BorrowerDetails
                  SectionHeader={(props) => <SectionHeader {...props} sectionId="borrower" />}
                  isEditing={isSectionEditing("borrower")}
                  formData={formData}
                  fieldErrors={fieldErrors}
                  removeBorrower={removeBorrower}
                  updateBorrower={updateBorrower}
                  setPrimaryBorrower={setPrimaryBorrower}
                  handleBorrowerAddressInput={handleBorrowerAddressInput}
                  handleBorrowerAddressSelect={handleBorrowerAddressSelect}
                  borrowerPredictions={borrowerPredictions}
                  isLoadingBorrowerPredictions={isLoadingBorrowerPredictions}
                  isLoaded={true}
                  addBorrower={addBorrower}
                />
              </div>

              {/* Filing Entity Section */}
              <div ref={filingEntityRef}>
                <StepFilingEntity
                  SectionHeader={(props) => <SectionHeader {...props} sectionId="filing-entity" />}
                  isEditing={isSectionEditing("filing-entity")}
                  formData={formData}
                  fieldErrors={fieldErrors}
                  handleInputChange={handleInputChange}
                />
              </div>

              {/* Right-to-Cure Section */}
              <div ref={rightToCureRef}>
                <StepRightToCure
                  SectionHeader={(props) => <SectionHeader {...props} sectionId="right-to-cure" />}
                  isEditing={isSectionEditing("right-to-cure")}
                  formData={formData}
                  fieldErrors={fieldErrors}
                  setFormData={setFormData}
                  handleInputChange={handleInputChange}
                  handleNoticeAddressInput={handleNoticeAddressInput}
                  isLoaded={true}
                  noticePredictions={noticePredictions}
                  handleNoticeAddressSelect={handleNoticeAddressSelect}
                  addRightToCure={addRightToCure}
                  removeRightToCure={removeRightToCure}
                  updateRightToCure={updateRightToCure}
                />
              </div>

              {/* Form 35B Compliance Section */}
              <div ref={form35BRef}>
                <StepForm35BCompliance
                  SectionHeader={(props) => <SectionHeader {...props} sectionId="form35b" />}
                  isEditing={isSectionEditing("form35b")}
                  formData={formData}
                  setFormData={setFormData}
                  fieldErrors={fieldErrors}
                  isCertainMortgageLoanReadOnly={
                    formData.variableRate || formData.interestOnly || formData.negativeAmortization
                  }
                />
              </div>

              {/* Loan Assignees Section */}
              <div ref={loanAssigneesRef}>
                <StepLoanAssignees
                  SectionHeader={(props) => <SectionHeader {...props} sectionId="loan-assignees" />}
                  isEditing={isSectionEditing("loan-assignees")}
                  formData={formData}
                  fieldErrors={fieldErrors}
                  removeLoanAssignee={removeLoanAssignee}
                  updateLoanAssignee={updateLoanAssignee}
                  addLoanAssignee={addLoanAssignee}
                  getAssigneeTypes={getAssigneeTypes}
                  getAssigneeRoles={getAssigneeRoles}
                  commonDataLoading={commonDataLoading}
                  isLoaded={true}
                  assigneePredictions={assigneePredictions}
                  handleAssigneeAddressInput={handleAssigneeAddressInput}
                  handleAssigneeAddressSelect={handleAssigneeAddressSelect}
                />
              </div>

              {/* Signatures Section */}
              <div ref={signaturesRef}>
                <StepSignaturesSection
                  SectionHeader={(props) => <SectionHeader {...props} sectionId="signatures" />}
                  signatureSectionRef={signatureSectionRef}
                  isEditing={isSectionEditing("signatures")}
                  fieldErrors={fieldErrors}
                  formData={formData}
                  setFormData={setFormData}
                  setFieldErrors={setFieldErrors}
                  petition={petition}
                  formatDate={formatDate}
                />
              </div>

              {/* Judgment Display Section - Editable if data exists */}
              {hasJudgmentData() && (
                <div ref={judgmentRef}>
                  <JudgmentDisplaySection
                    SectionHeader={(props) => <SectionHeader {...props} sectionId="judgment" />}
                    isEditing={isSectionEditing("judgment")}
                    formData={formData}
                    fieldErrors={fieldErrors}
                    handleInputChange={handleInputChange}
                    handleDropdownChange={handleInputChange}
                    getJudgmentTypes={getJudgmentTypes}
                    findOptionByValue={findOptionByValue}
                    formatDate={formatDate}
                    formatCurrency={formatCurrency}
                    onSave={() => handleSectionSave("judgment")}
                    onCancel={() => toggleSectionEditing("judgment")}
                  />
                </div>
              )}

              {/* Foreclosure Sale Display Section - Editable if data exists */}
              {hasForeclosureSaleData() && (
                <div ref={foreclosureSaleRef}>
                  <ForeclosureSaleDisplaySection
                    SectionHeader={(props) => <SectionHeader {...props} sectionId="foreclosure" />}
                    isEditing={isSectionEditing("foreclosure")}
                    formData={formData}
                    fieldErrors={fieldErrors}
                    handleInputChange={handleInputChange}
                    handleDropdownChange={handleInputChange}
                    getBuyerTypes={getBuyerTypes}
                    getForeclosureAlternativeOptions={getForeclosureAlternativeOptions}
                    findOptionByValue={findOptionByValue}
                    formatDate={formatDate}
                    onSave={() => handleSectionSave("foreclosure")}
                    onCancel={() => toggleSectionEditing("foreclosure")}
                  />
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Edit Judgement Modal */}
      <EditJudgementModal
        isOpen={showJudgementModal}
        onClose={() => setShowJudgementModal(false)}
        petition={petition}
        formData={formData}
        setFormData={setFormData}
        getJudgmentTypes={getJudgmentTypes}
        findOptionByValue={findOptionByValue}
        onSave={handleSaveJudgment}
      />

      {/* Edit Foreclosure Modal */}
      <EditForeclosureModal
        isOpen={showForeclosureModal}
        onClose={() => setShowForeclosureModal(false)}
        petition={petition}
        formData={formData}
        setFormData={setFormData}
        getBuyerTypes={getBuyerTypes}
        getForeclosureAlternativeOptions={getForeclosureAlternativeOptions}
        findOptionByValue={findOptionByValue}
        onSave={handleSaveForeclosure}
      />

      {/* Notes Modal */}
      <NotesModal
        isOpen={showNotesModal}
        onClose={() => {
          setShowNotesModal(false);
          setNoteToEdit(null);
        }}
        petition={petition}
        noteToEdit={null}
        onNoteSaved={handleNoteSaved}
      />

      {/* Petition Wizard Modal for Draft Petitions */}
      {showPetitionWizard && (
        <PetitionSteps
          isOpen={showPetitionWizard}
          onClose={() => {
            setShowPetitionWizard(false);
            // Clear localStorage when closing
            sessionStorage.removeItem("petitionFormData");
            sessionStorage.removeItem("editingPetitionId");
            // Refresh the petition data
            if (onPetitionUpdated) {
              setTimeout(() => {
                onPetitionUpdated();
              }, 200);
            }
            if (activeTabId && refreshTab) {
              refreshTab(activeTabId);
            }
          }}
          organization={null}
          onPetitionSubmitted={() => {
            setShowPetitionWizard(false);
            // Clear localStorage
            sessionStorage.removeItem("petitionFormData");
            sessionStorage.removeItem("editingPetitionId");
            // Refresh the petition data
            if (onPetitionUpdated) {
              setTimeout(() => {
                onPetitionUpdated();
              }, 200);
            }
            if (activeTabId && refreshTab) {
              refreshTab(activeTabId);
            }
          }}
        />
      )}

      {/* Foreclosure Edit Warning Modal */}
      {showForeclosureWarningModal && (() => {
        const rightToCureMet = (formData.rightToCures && formData.rightToCures.length > 0 && 
          formData.rightToCures.some(rtc => rtc.noticeSent === true)) ||
          (formData.noticeSent === true); // Fallback for old single-object format
        const judgmentSubmitted = hasJudgmentBeenSubmitted();
        
        // Determine which conditions are not met
        const missingConditions = [];
        if (!rightToCureMet) {
          missingConditions.push(t("petitionTabContent.rightToCureMustBeSent"));
        }
        if (!judgmentSubmitted) {
          missingConditions.push(t("petitionTabContent.judgmentMustBeSubmitted"));
        }
        
        return (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{t("petitionTabContent.cannotEditForeclosureSale")}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowForeclosureWarningModal(false)}
                    aria-label={t("common.close")}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>{t("petitionTabContent.cannotEditForeclosureDesc", { count: missingConditions.length })}</p>
                  <ul>
                    {missingConditions.map((condition, index) => (
                      <li key={index}>{condition}</li>
                    ))}
                  </ul>
                  <p className="mb-0">{t("petitionTabContent.pleaseEnsureConditions", { count: missingConditions.length })}</p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="dashboard-btn-refresh"
                    onClick={() => setShowForeclosureWarningModal(false)}
                  >
                    {t("common.close")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default PetitionTabContent;
