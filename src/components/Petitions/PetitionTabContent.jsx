import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useTabs } from "../../context/TabContext";
import { usePetitionCommonData } from "../../hooks/usePetitionCommonData";
import { usePetitions } from "../../hooks/usePetitions";
import { toast } from "react-toastify";
import CustomDropdown from "../shared/CustomDropdown";
import "../shared/CustomDropdown.css";
import "./PetitionForm.css";
import { useJsApiLoader } from "@react-google-maps/api";
import Config from "../../config/index";
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
import { getUserRole } from "../../utils/storage";
import PetitionSteps from "./PetitionSteps";
import petitionApiService from "../../services/petitionApiService";

const PetitionTabContent = ({ petition, onPetitionUpdated, isPublic = false }) => {
  const { t } = useTranslation();
  const { loadingTabs, activeTabId, refreshTab, tabs } = useTabs();
  const {
    getLoanTypes,
    getAssigneeTypes,
    getAssigneeRoles,
    getLienPositions,
    getBuyerTypes,
    getLenderTypes,
    getJudgmentTypes,
    getForeclosureAlternativeOptions,
    getPetitionStatuses,
    getOptionName,
    findOptionByValue,
    loading: commonDataLoading,
  } = usePetitionCommonData();
  const { submitPetition, fetchPetitions } = usePetitions();

  // Section-level editing state - each section can be edited independently
  const [editingSections, setEditingSections] = useState({});
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Google Places/Geocoder (property address)
  const LIBRARIES = ["places"];
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: Config.GOOGLE_PLACES_API_KEY,
    libraries: LIBRARIES,
    preventGoogleFontsLoading: true,
  });
  const geocoderRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const [predictions, setPredictions] = useState([]);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
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
  // Notice address autocomplete
  const [noticePredictions, setNoticePredictions] = useState([]);
  const [isLoadingNoticePredictions, setIsLoadingNoticePredictions] =
    useState(false);

  useEffect(() => {
    if (!isLoaded || loadError) return;
    try {
      autocompleteServiceRef.current =
        new window.google.maps.places.AutocompleteService();
      geocoderRef.current = new window.google.maps.Geocoder();
    } catch (err) {
      // ignore
    }
  }, [isLoaded, loadError]);

  const handlePropertyAddressInput = (value) => {
    if (!autocompleteServiceRef.current || !value.trim()) {
      setPredictions([]);
      return;
    }
    const request = {
      input: value,
      componentRestrictions: { country: ["us"] },
      types: ["address"],
    };
    if (window.autocompleteTimeout) clearTimeout(window.autocompleteTimeout);
    window.autocompleteTimeout = setTimeout(() => {
      setIsLoadingPredictions(true);
      try {
        autocompleteServiceRef.current.getPlacePredictions(
          request,
          (result, status) => {
            setIsLoadingPredictions(false);
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              result
            ) {
              setPredictions(result.slice(0, 5));
            } else {
              setPredictions([]);
            }
          }
        );
      } catch (e) {
        setIsLoadingPredictions(false);
        setPredictions([]);
      }
    }, 250);
  };

  const handlePropertyAddressSelect = (prediction) => {
    setPredictions([]);
    // Fill street immediately for snappy UX
    const street = prediction.description?.split(",")[0] || "";
    setFormData((prev) => ({ ...prev, propertyStreet1: street }));
    // Geocode to populate city/state/zip/county
    geocodePlaceAndFill(
      prediction.place_id,
      ({ street1, city, state, zip }) => {
        // Attempt county extraction via a secondary geocode of placeId (already done in geocodePlaceAndFill)
        try {
          if (geocoderRef.current) {
            geocoderRef.current.geocode(
              { placeId: prediction.place_id },
              (results, status) => {
                let countyName = "";
                if (
                  status === window.google.maps.GeocoderStatus.OK &&
                  results &&
                  results[0]
                ) {
                  const comp = results[0].address_components || [];
                  const countyComp = comp.find((c) =>
                    c.types.includes("administrative_area_level_2")
                  );
                  countyName = countyComp?.long_name || "";
                }
                setFormData((prev) => ({
                  ...prev,
                  propertyStreet1: street1 || prev.propertyStreet1,
                  propertyCity: city || prev.propertyCity,
                  propertyState: state || prev.propertyState,
                  propertyZip: zip || prev.propertyZip,
                  propertyCounty: countyName || prev.propertyCounty,
                }));
              }
            );
          } else {
            setFormData((prev) => ({
              ...prev,
              propertyStreet1: street1 || prev.propertyStreet1,
              propertyCity: city || prev.propertyCity,
              propertyState: state || prev.propertyState,
              propertyZip: zip || prev.propertyZip,
            }));
          }
        } catch {}
      }
    );
    if (propertyAddressInputRef.current) propertyAddressInputRef.current.blur();
  };

  // Generic helper: geocode by placeId and update fields via setter
  const geocodePlaceAndFill = (placeId, apply) => {
    if (!geocoderRef.current || !placeId) return;
    try {
      geocoderRef.current.geocode({ placeId }, (results, status) => {
        if (
          status === window.google.maps.GeocoderStatus.OK &&
          results &&
          results[0]
        ) {
          const comp = results[0].address_components || [];
          const get = (type) => comp.find((c) => c.types.includes(type));
          const streetNumber = get("street_number")?.long_name || "";
          const route = get("route")?.long_name || "";
          const city =
            get("locality")?.long_name || get("sublocality")?.long_name || "";
          const state = get("administrative_area_level_1")?.short_name || "";
          const zip = get("postal_code")?.long_name || "";
          const street1 = [streetNumber, route].filter(Boolean).join(" ");
          apply({ street1, city, state, zip });
        }
      });
    } catch (e) {
      // ignore
    }
  };

  // Borrower mailing address handlers
  const handleBorrowerAddressInput = (borrowerId, value) => {
    if (!autocompleteServiceRef.current || !value.trim()) {
      setBorrowerPredictions((prev) => ({ ...prev, [borrowerId]: [] }));
      return;
    }
    const request = {
      input: value,
      componentRestrictions: { country: ["us"] },
      types: ["address"],
    };
    if (window.autocompleteTimeout) clearTimeout(window.autocompleteTimeout);
    setIsLoadingBorrowerPredictions((prev) => ({
      ...prev,
      [borrowerId]: true,
    }));
    window.autocompleteTimeout = setTimeout(() => {
      try {
        autocompleteServiceRef.current.getPlacePredictions(
          request,
          (result, status) => {
            setIsLoadingBorrowerPredictions((prev) => ({
              ...prev,
              [borrowerId]: false,
            }));
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              result
            ) {
              setBorrowerPredictions((prev) => ({
                ...prev,
                [borrowerId]: result.slice(0, 5),
              }));
            } else {
              setBorrowerPredictions((prev) => ({ ...prev, [borrowerId]: [] }));
            }
          }
        );
      } catch (e) {
        setIsLoadingBorrowerPredictions((prev) => ({
          ...prev,
          [borrowerId]: false,
        }));
        setBorrowerPredictions((prev) => ({ ...prev, [borrowerId]: [] }));
      }
    }, 250);
  };

  const handleBorrowerAddressSelect = (borrowerId, prediction) => {
    setBorrowerPredictions((prev) => ({ ...prev, [borrowerId]: [] }));
    const street = prediction.description?.split(",")[0] || "";
    setFormData((prev) => ({
      ...prev,
      borrowers: prev.borrowers.map((b) =>
        b.id === borrowerId ? { ...b, mailingStreet1: street } : b
      ),
    }));
    geocodePlaceAndFill(
      prediction.place_id,
      ({ street1, city, state, zip }) => {
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
      }
    );
  };

  // Loan assignee address handlers
  const handleAssigneeAddressInput = (index, value) => {
    if (!autocompleteServiceRef.current || !value.trim()) {
      setAssigneePredictions((prev) => ({ ...prev, [index]: [] }));
      return;
    }
    const request = {
      input: value,
      componentRestrictions: { country: ["us"] },
      types: ["address"],
    };
    if (window.autocompleteTimeout) clearTimeout(window.autocompleteTimeout);
    setIsLoadingAssigneePredictions((prev) => ({ ...prev, [index]: true }));
    window.autocompleteTimeout = setTimeout(() => {
      try {
        autocompleteServiceRef.current.getPlacePredictions(
          request,
          (result, status) => {
            setIsLoadingAssigneePredictions((prev) => ({
              ...prev,
              [index]: false,
            }));
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              result
            ) {
              setAssigneePredictions((prev) => ({
                ...prev,
                [index]: result.slice(0, 5),
              }));
            } else {
              setAssigneePredictions((prev) => ({ ...prev, [index]: [] }));
            }
          }
        );
      } catch (e) {
        setIsLoadingAssigneePredictions((prev) => ({
          ...prev,
          [index]: false,
        }));
        setAssigneePredictions((prev) => ({ ...prev, [index]: [] }));
      }
    }, 250);
  };

  const handleAssigneeAddressSelect = (index, prediction) => {
    setAssigneePredictions((prev) => ({ ...prev, [index]: [] }));
    const street = prediction.description?.split(",")[0] || "";
    setFormData((prev) => ({
      ...prev,
      loanAssignees: prev.loanAssignees.map((a, i) =>
        i === index ? { ...a, street1: street } : a
      ),
    }));
    geocodePlaceAndFill(
      prediction.place_id,
      ({ street1, city, state, zip }) => {
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
      }
    );
  };

  // Notice address handlers
  const handleNoticeAddressInput = (value) => {
    if (!autocompleteServiceRef.current || !value.trim()) {
      setNoticePredictions([]);
      return;
    }
    const request = {
      input: value,
      componentRestrictions: { country: ["us"] },
      types: ["address"],
    };
    if (window.autocompleteTimeout) clearTimeout(window.autocompleteTimeout);
    setIsLoadingNoticePredictions(true);
    window.autocompleteTimeout = setTimeout(() => {
      try {
        autocompleteServiceRef.current.getPlacePredictions(
          request,
          (result, status) => {
            setIsLoadingNoticePredictions(false);
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              result
            ) {
              setNoticePredictions(result.slice(0, 5));
            } else {
              setNoticePredictions([]);
            }
          }
        );
      } catch (e) {
        setIsLoadingNoticePredictions(false);
        setNoticePredictions([]);
      }
    }, 250);
  };

  const handleNoticeAddressSelect = (prediction, index = null) => {
    setNoticePredictions([]);
    const street = prediction.description?.split(",")[0] || "";
    
    if (index !== null && index !== undefined) {
      // Update specific rightToCure entry
      geocodePlaceAndFill(
        prediction.place_id,
        ({ street1, city, state, zip }) => {
          updateRightToCure(index, "noticeAddressStreet1", street1 || street);
          if (city) updateRightToCure(index, "noticeAddressCity", city);
          if (state) updateRightToCure(index, "noticeAddressState", state);
          if (zip) updateRightToCure(index, "noticeAddressZip", zip);
        }
      );
    } else {
      // Legacy single-object format
      setFormData((prev) => ({ ...prev, noticeAddressStreet1: street }));
      geocodePlaceAndFill(
        prediction.place_id,
        ({ street1, city, state, zip }) => {
          setFormData((prev) => ({
            ...prev,
            noticeAddressStreet1: street1 || prev.noticeAddressStreet1,
            noticeAddressCity: city || prev.noticeAddressCity,
            noticeAddressState: state || prev.noticeAddressState,
            noticeAddressZip: zip || prev.noticeAddressZip,
          }));
        }
      );
    }
  };

  const validatePropertyAddressWithGeocoding = async () => {
    return new Promise((resolve) => {
      if (!geocoderRef.current || !formData.propertyStreet1?.trim()) {
        resolve({ isValid: false, error: "Street address is required" });
        return;
      }
      const address = `${formData.propertyStreet1}, ${
        formData.propertyCity || ""
      }, ${formData.propertyState || "MA"} ${
        formData.propertyZip || ""
      }`.trim();
      try {
        geocoderRef.current.geocode({ address }, (results, status) => {
          if (
            status === window.google.maps.GeocoderStatus.OK &&
            results &&
            results.length > 0
          ) {
            const result = results[0];
            let foundState = false;
            let cityMatch = false;
            let zipMatch = false;
            let countyMatch = false;
            let county = "";
            result.address_components.forEach((component) => {
              const types = component.types;
              if (types.includes("administrative_area_level_1")) {
                foundState =
                  component.short_name === (formData.propertyState || "MA");
              }
              if (types.includes("locality")) {
                const componentCity = component.long_name.toLowerCase();
                const inputCity = (formData.propertyCity || "").toLowerCase();
                if (
                  componentCity.includes(inputCity) ||
                  inputCity.includes(componentCity)
                ) {
                  cityMatch = true;
                }
              }
              if (types.includes("postal_code")) {
                if (component.long_name === (formData.propertyZip || "")) {
                  zipMatch = true;
                }
              }
              if (types.includes("administrative_area_level_2")) {
                const componentCounty = component.long_name.toLowerCase();
                const inputCounty = (
                  formData.propertyCounty || ""
                ).toLowerCase();
                county = component.long_name;
                if (
                  componentCounty.includes(inputCounty) ||
                  inputCounty.includes(componentCounty)
                ) {
                  countyMatch = true;
                }
              }
            });
            if (foundState && cityMatch && zipMatch && countyMatch) {
              if (county && !formData.propertyCounty) {
                setFormData((prev) => ({ ...prev, propertyCounty: county }));
              }
              resolve({ isValid: true });
            } else {
              resolve({ isValid: false, error: "Address verification failed" });
            }
          } else {
            resolve({ isValid: false, error: "Invalid address" });
          }
        });
      } catch (e) {
        resolve({ isValid: false, error: "Address validation failed" });
      }
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
        ? details.loan.originationDate.split("T")[0]
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
            noticeDate: rtc.noticeDate ? rtc.noticeDate.split("T")[0] : "",
            amountInDefault: rtc.amountInDefault || 0,
            daysDelinquentAtNotice: rtc.daysDelinquentAtNotice || 0,
            cureExpirationDate: rtc.cureExpirationDate ? rtc.cureExpirationDate.split("T")[0] : "",
            noticeAddressStreet1: rtc.noticeAddressStreet1 || "",
            noticeAddressCity: rtc.noticeAddressCity || "",
            noticeAddressState: rtc.noticeAddressState || "",
            noticeAddressZip: rtc.noticeAddressZip || "",
            manualOverrideReason: rtc.manualOverrideReason || "",
            borrowerRespondedWithin30Days: rtc.borrowerRespondedWithin30Days !== undefined ? rtc.borrowerRespondedWithin30Days : null,
            borrowerResponseDate: rtc.borrowerResponseDate ? rtc.borrowerResponseDate.split("T")[0] : "",
            proceededWithRightToCure: rtc.proceededWithRightToCure !== undefined ? rtc.proceededWithRightToCure : null,
          }));
        }
        // Fallback to single rightToCure object (old format)
        if (details.rightToCure) {
          return [{
            id: details.rightToCure.id || null,
            noticeSent: details.rightToCure.noticeSent !== undefined ? details.rightToCure.noticeSent : null,
            noticeDate: details.rightToCure.noticeDate ? details.rightToCure.noticeDate.split("T")[0] : "",
            amountInDefault: details.rightToCure.amountInDefault || 0,
            daysDelinquentAtNotice: details.rightToCure.daysDelinquentAtNotice || 0,
            cureExpirationDate: details.rightToCure.cureExpirationDate ? details.rightToCure.cureExpirationDate.split("T")[0] : "",
            noticeAddressStreet1: details.rightToCure.noticeAddressStreet1 || "",
            noticeAddressCity: details.rightToCure.noticeAddressCity || "",
            noticeAddressState: details.rightToCure.noticeAddressState || "",
            noticeAddressZip: details.rightToCure.noticeAddressZip || "",
            manualOverrideReason: details.rightToCure.manualOverrideReason || "",
            borrowerRespondedWithin30Days: details.rightToCure.borrowerRespondedWithin30Days !== undefined ? details.rightToCure.borrowerRespondedWithin30Days : null,
            borrowerResponseDate: details.rightToCure.borrowerResponseDate ? details.rightToCure.borrowerResponseDate.split("T")[0] : "",
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
              ? details.foreclosureSale.saleDate.split("T")[0]
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
        ? details.affidavit.affidavitExecutionDate.split("T")[0]
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
    
    const hasAmount = judgment.judgmentAmount !== null && 
                      judgment.judgmentAmount !== undefined && 
                      judgment.judgmentAmount !== 0;
    
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
    
    return hasDate || hasAmount || hasType || hasCourtInfo || hasDocket;
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
  }, [formData, showNotesSection, isPublic, t, hasJudgmentData, hasForeclosureSaleData]);
  
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
  }, [formData, showNotesSection]);
  
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
    if (isSectionEditing(sectionId)) {
      // Cancel edit - reset form data for this section
      if (initialFormData) {
        setFormData(initialFormData);
      }
      setFieldErrors({});
    }
    toggleSectionEditing(sectionId);
  };

  // Handle saving individual sections using their specific APIs
  const handleSectionSave = async (sectionId) => {
    if (!petition?.id) {
      throw new Error("Petition ID is required");
    }

    switch (sectionId) {
      case "property":
        // Validate property fields
        if (!formData.propertyStreet1?.trim()) {
          setFieldErrors(prev => ({ ...prev, propertyStreet1: "Required" }));
          throw new Error("Street address is required");
        }
        if (!formData.propertyCity?.trim()) {
          setFieldErrors(prev => ({ ...prev, propertyCity: "Required" }));
          throw new Error("City is required");
        }
        if (!formData.propertyState?.trim()) {
          setFieldErrors(prev => ({ ...prev, propertyState: "Required" }));
          throw new Error("State is required");
        }
        if (!formData.propertyZip?.trim()) {
          setFieldErrors(prev => ({ ...prev, propertyZip: "Required" }));
          throw new Error("Zip code is required");
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
            const errorMessage = response.message || "A petition with the same property address already exists.";
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
            const errorMessage = response.message || "Failed to update property details.";
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
        } catch (error) {
          // Handle axios errors (when API returns non-2xx status)
          if (error.response && error.response.data) {
            const errorData = error.response.data;
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
              // Other API errors
              const errorMessage = errorData.message || error.message || "Failed to update property details.";
              setFieldErrors(prev => ({ 
                ...prev, 
                propertyStreet1: errorMessage 
              }));
              // Create error with a flag to indicate toast was already shown
              const apiError = new Error(errorMessage);
              apiError.toastShown = true;
              throw apiError;
            }
          } else if (error.message) {
            // Re-throw validation errors or other errors that already have messages
            // Don't set toastShown flag - let outer catch handle it
            throw error;
          } else {
            // Unknown error
            const errorMessage = "Failed to update property details. Please try again.";
            setFieldErrors(prev => ({ 
              ...prev, 
              propertyStreet1: errorMessage 
            }));
            // Create error (toast will be shown in outer catch)
            throw new Error(errorMessage);
          }
        }
        break;

      case "loan":
        // Validate loan fields
        if (!formData.isMinApplicable || (formData.isMinApplicable !== "yes" && formData.isMinApplicable !== "no")) {
          setFieldErrors(prev => ({ ...prev, isMinApplicable: "Please select if MIN is applicable" }));
          throw new Error("Please select if MIN is applicable");
        }
        if (formData.isMinApplicable === "yes" && (!formData.minNumber || !formData.minNumber.trim())) {
          setFieldErrors(prev => ({ ...prev, minNumber: "MIN Number is required when MIN is applicable" }));
          throw new Error("MIN Number is required when MIN is applicable");
        }
        if (!formData.loanNumber || formData.loanNumber.trim() === "") {
          setFieldErrors(prev => ({ ...prev, loanNumber: "Required" }));
          throw new Error("Loan number is required");
        }
        if (!formData.petitionLoanTypeId || formData.petitionLoanTypeId === "") {
          setFieldErrors(prev => ({ ...prev, petitionLoanTypeId: "Required" }));
          throw new Error("Loan type is required");
        }
        if (formData.lienPosition == null || formData.lienPosition === "") {
          setFieldErrors(prev => ({ ...prev, lienPosition: "Required" }));
          throw new Error("Lien position is required");
        }

        // Validate loan modification fields (required)
        if (formData.borrowerRequestedLoanModification === null || formData.borrowerRequestedLoanModification === undefined) {
          setFieldErrors(prev => ({ ...prev, borrowerRequestedLoanModification: "Please select if the borrower requested a loan modification" }));
          throw new Error("Please select if the borrower requested a loan modification");
        }
        if (formData.borrowerRequestedLoanModification === true) {
          if (formData.loanModificationRequestFinalized === null || formData.loanModificationRequestFinalized === undefined) {
            setFieldErrors(prev => ({ ...prev, loanModificationRequestFinalized: "Please select if the loan modification request was finalized" }));
            throw new Error("Please select if the loan modification request was finalized");
          }
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

      case "filing-entity":
        // Validate filing entity fields
        if (!formData.filingEntityLegalName || formData.filingEntityLegalName.trim() === "") {
          setFieldErrors(prev => ({ ...prev, filingEntityLegalName: "Required" }));
          throw new Error("Filing entity legal name is required");
        }
        if (!formData.filingEntityStreet1 || formData.filingEntityStreet1.trim() === "") {
          setFieldErrors(prev => ({ ...prev, filingEntityStreet1: "Required" }));
          throw new Error("Filing entity street address is required");
        }
        if (!formData.filingEntityCity || formData.filingEntityCity.trim() === "") {
          setFieldErrors(prev => ({ ...prev, filingEntityCity: "Required" }));
          throw new Error("Filing entity city is required");
        }
        if (!formData.filingEntityState || formData.filingEntityState.trim() === "") {
          setFieldErrors(prev => ({ ...prev, filingEntityState: "Required" }));
          throw new Error("Filing entity state is required");
        }
        if (!formData.filingEntityZip || formData.filingEntityZip.trim() === "") {
          setFieldErrors(prev => ({ ...prev, filingEntityZip: "Required" }));
          throw new Error("Filing entity zip code is required");
        }
        if (!formData.filingContactName || formData.filingContactName.trim() === "") {
          setFieldErrors(prev => ({ ...prev, filingContactName: "Required" }));
          throw new Error("Filing contact name is required");
        }
        if (!formData.filingContactEmail || formData.filingContactEmail.trim() === "") {
          setFieldErrors(prev => ({ ...prev, filingContactEmail: "Required" }));
          throw new Error("Filing contact email is required");
        } else {
          // Validate email format
          const emailRegex = /.+@.+\..+/;
          if (!emailRegex.test(formData.filingContactEmail.trim())) {
            setFieldErrors(prev => ({ ...prev, filingContactEmail: "Invalid email format" }));
            throw new Error("Invalid email format");
          }
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

      case "borrower":
        // Validate borrower fields
        if (!formData.borrowers || !Array.isArray(formData.borrowers) || formData.borrowers.length === 0) {
          setFieldErrors(prev => ({ ...prev, borrowers: "At least one borrower is required" }));
          throw new Error("At least one borrower is required");
        }

        // Check for primary borrower
        const primaryBorrower = formData.borrowers.find(b => b.borrowerIsPrimary === true);
        if (!primaryBorrower) {
          setFieldErrors(prev => ({ ...prev, borrowers: "Primary borrower is required" }));
          throw new Error("Primary borrower is required");
        }

        // Validate primary borrower required fields
        const pbKey = primaryBorrower.id || "primary";
        if (!primaryBorrower.firstName || primaryBorrower.firstName.trim() === "") {
          setFieldErrors(prev => ({ ...prev, [`borrower_${pbKey}_firstName`]: "Required" }));
          throw new Error("Primary borrower first name is required");
        }
        if (!primaryBorrower.lastName || primaryBorrower.lastName.trim() === "") {
          setFieldErrors(prev => ({ ...prev, [`borrower_${pbKey}_lastName`]: "Required" }));
          throw new Error("Primary borrower last name is required");
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

      case "form35b":
        // Validate Form 35B Compliance fields
        if (formData.certainMortgageLoan === null || formData.certainMortgageLoan === undefined) {
          setFieldErrors(prev => ({ ...prev, certainMortgageLoan: "Please select if this is a certain mortgage loan" }));
          throw new Error("Please select if this is a certain mortgage loan");
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

      case "right-to-cure":
        // Validate right to cure fields
        if (!formData.rightToCures || !Array.isArray(formData.rightToCures) || formData.rightToCures.length === 0) {
          setFieldErrors(prev => ({ ...prev, rightToCures: "At least one right to cure entry is required" }));
          throw new Error("At least one right to cure entry is required");
        }

        // Validate each right to cure entry
        formData.rightToCures.forEach((rtc, index) => {
          if (rtc.noticeSent === null || rtc.noticeSent === undefined) {
            setFieldErrors(prev => ({ ...prev, [`rightToCure_${index}_noticeSent`]: "Please select whether the notice was sent" }));
            throw new Error(`Right to cure entry ${index + 1}: Please select whether the notice was sent`);
          }
          
          // Validate borrower response fields (required if notice was sent)
          if (rtc.noticeSent === true) {
            if (rtc.borrowerRespondedWithin30Days === null || rtc.borrowerRespondedWithin30Days === undefined) {
              setFieldErrors(prev => ({ ...prev, [`rightToCures.${index}.borrowerRespondedWithin30Days`]: "Please select if the borrower responded to the notice within 30 days" }));
              throw new Error(`Right to cure entry ${index + 1}: Please select if the borrower responded to the notice within 30 days`);
            }
            
            if (rtc.borrowerRespondedWithin30Days === true) {
              if (!rtc.borrowerResponseDate || !rtc.borrowerResponseDate.trim()) {
                setFieldErrors(prev => ({ ...prev, [`rightToCures.${index}.borrowerResponseDate`]: "Date on which the borrower responded is required" }));
                throw new Error(`Right to cure entry ${index + 1}: Date on which the borrower responded is required`);
              }
              
              if (rtc.proceededWithRightToCure === null || rtc.proceededWithRightToCure === undefined) {
                setFieldErrors(prev => ({ ...prev, [`rightToCures.${index}.proceededWithRightToCure`]: "Please select if the borrower proceeded with the right to cure" }));
                throw new Error(`Right to cure entry ${index + 1}: Please select if the borrower proceeded with the right to cure`);
              }
            }
          }
        });

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

      case "loan-assignees":
        // Validate loan assignee fields
        if (!formData.loanAssignees || !Array.isArray(formData.loanAssignees)) {
          setFieldErrors(prev => ({ ...prev, loanAssignees: "Loan assignees data is invalid" }));
          throw new Error("Loan assignees data is invalid");
        }

        // Validate each loan assignee entry (only if it has any data)
        formData.loanAssignees.forEach((assignee, index) => {
          // Check if this assignee has any data - if it's completely empty, skip validation
          const hasAnyData = assignee.assigneeName || assignee.assigneeTypeId || assignee.assigneeRoleId || 
                            assignee.street1 || assignee.city || assignee.addressState || assignee.zip;
          
          if (hasAnyData) {
            // If assignee has any data, validate all required fields
            if (!assignee.assigneeName || assignee.assigneeName.trim() === "") {
              setFieldErrors(prev => ({ ...prev, [`loanAssignees.${index}.assigneeName`]: "Required" }));
              throw new Error(`Loan assignee ${index + 1}: Assignee name is required`);
            }
            if (!assignee.assigneeTypeId || assignee.assigneeTypeId === "") {
              setFieldErrors(prev => ({ ...prev, [`loanAssignees.${index}.assigneeTypeId`]: "Required" }));
              throw new Error(`Loan assignee ${index + 1}: Assignee type is required`);
            }
            if (!assignee.assigneeRoleId || assignee.assigneeRoleId === "") {
              setFieldErrors(prev => ({ ...prev, [`loanAssignees.${index}.assigneeRoleId`]: "Required" }));
              throw new Error(`Loan assignee ${index + 1}: Assignee role is required`);
            }
            if (!assignee.street1 || assignee.street1.trim() === "") {
              setFieldErrors(prev => ({ ...prev, [`loanAssignees.${index}.street1`]: "Required" }));
              throw new Error(`Loan assignee ${index + 1}: Street address is required`);
            }
            if (!assignee.city || assignee.city.trim() === "") {
              setFieldErrors(prev => ({ ...prev, [`loanAssignees.${index}.city`]: "Required" }));
              throw new Error(`Loan assignee ${index + 1}: City is required`);
            }
            if (!assignee.addressState || assignee.addressState.trim() === "") {
              setFieldErrors(prev => ({ ...prev, [`loanAssignees.${index}.addressState`]: "Required" }));
              throw new Error(`Loan assignee ${index + 1}: State is required`);
            }
            if (!assignee.zip || assignee.zip.trim() === "") {
              setFieldErrors(prev => ({ ...prev, [`loanAssignees.${index}.zip`]: "Required" }));
              throw new Error(`Loan assignee ${index + 1}: Zip code is required`);
            }
          }
        });

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

      case "signatures":
        // Validate signature fields
        if (!formData.signatures || !Array.isArray(formData.signatures) || formData.signatures.length === 0) {
          setFieldErrors(prev => ({ ...prev, signatures: "At least one signature is required" }));
          throw new Error("At least one signature is required");
        }

        // Validate that at least one signature has e-consent checked
        const hasEconsent = formData.signatures.some((sig) => sig.esignConsent === true);
        if (!hasEconsent) {
          setFieldErrors(prev => ({ ...prev, esignConsent: "E-sign consent is required for at least one signature" }));
          throw new Error("E-sign consent is required for at least one signature");
        }

        // Validate each signature entry
        formData.signatures.forEach((signature, index) => {
          if (!signature.signerFullName || signature.signerFullName.trim() === "") {
            setFieldErrors(prev => ({ ...prev, [`signatures.${index}.signerFullName`]: "Required" }));
            throw new Error(`Signature ${index + 1}: Signer full name is required`);
          }
          if (!signature.signerTitle || signature.signerTitle.trim() === "") {
            setFieldErrors(prev => ({ ...prev, [`signatures.${index}.signerTitle`]: "Required" }));
            throw new Error(`Signature ${index + 1}: Signer title is required`);
          }
          if (!signature.signerEmail || signature.signerEmail.trim() === "") {
            setFieldErrors(prev => ({ ...prev, [`signatures.${index}.signerEmail`]: "Required" }));
            throw new Error(`Signature ${index + 1}: Signer email is required`);
          } else {
            // Validate email format
            const emailRegex = /.+@.+\..+/;
            if (!emailRegex.test(signature.signerEmail.trim())) {
              setFieldErrors(prev => ({ ...prev, [`signatures.${index}.signerEmail`]: "Invalid email format" }));
              throw new Error(`Signature ${index + 1}: Invalid email format`);
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

      case "judgment":
        // Validate judgment fields
        if (!formData.judgment) {
          setFieldErrors(prev => ({ ...prev, judgment: "Judgment data is required" }));
          throw new Error("Judgment data is required");
        }

        const judgment = formData.judgment;
        if (!judgment.judgmentDate || (typeof judgment.judgmentDate === 'string' && !judgment.judgmentDate.trim())) {
          setFieldErrors(prev => ({ ...prev, judgmentDate: "Judgment date is required" }));
          throw new Error("Judgment date is required");
        }
        
        // Parse judgment amount (handle formatted currency with commas)
        const parseCurrencyInput = (value) => {
          if (!value) return "";
          return String(value).replace(/[^\d.]/g, "");
        };
        const parsedAmount = parseCurrencyInput(judgment.judgmentAmount);
        if (!parsedAmount || !parsedAmount.trim()) {
          setFieldErrors(prev => ({ ...prev, judgmentAmount: "Judgment amount is required" }));
          throw new Error("Judgment amount is required");
        } else if (isNaN(parseFloat(parsedAmount)) || parseFloat(parsedAmount) <= 0) {
          setFieldErrors(prev => ({ ...prev, judgmentAmount: "Judgment amount must be greater than 0" }));
          throw new Error("Judgment amount must be greater than 0");
        }
        
        if (judgment.judgmentType === "" || judgment.judgmentType === null || judgment.judgmentType === undefined) {
          setFieldErrors(prev => ({ ...prev, judgmentType: "Judgment type is required" }));
          throw new Error("Judgment type is required");
        }
        if (!judgment.courtInformation || (typeof judgment.courtInformation === 'string' && !judgment.courtInformation.trim())) {
          setFieldErrors(prev => ({ ...prev, courtInformation: "Court information is required" }));
          throw new Error("Court information is required");
        }
        if (!judgment.docketNumbers || (typeof judgment.docketNumbers === 'string' && !judgment.docketNumbers.trim())) {
          setFieldErrors(prev => ({ ...prev, docketNumbers: "Docket numbers is required" }));
          throw new Error("Docket numbers is required");
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
          judgmentAmount: parseFloat(parsedAmount) || 0,
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
          delete newErrors.judgmentAmount;
          delete newErrors.judgmentType;
          delete newErrors.courtInformation;
          delete newErrors.docketNumbers;
          return newErrors;
        });
        break;

      case "foreclosure":
        // Validate foreclosure fields
        if (!formData.foreclosureSale) {
          setFieldErrors(prev => ({ ...prev, foreclosureSale: "Foreclosure sale data is required" }));
          throw new Error("Foreclosure sale data is required");
        }

        const foreclosureSale = formData.foreclosureSale;
        if (!foreclosureSale.saleDate || !foreclosureSale.saleDate.trim()) {
          setFieldErrors(prev => ({ ...prev, saleDate: "Sale date is required" }));
          throw new Error("Sale date is required");
        }
        if (!foreclosureSale.soldToId || !foreclosureSale.soldToId.trim()) {
          setFieldErrors(prev => ({ ...prev, soldToId: "Sold to is required" }));
          throw new Error("Sold to is required");
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
            setFieldErrors(prev => ({ ...prev, vestingEntityName: "Vesting entity name is required" }));
            throw new Error("Vesting entity name is required");
          }
          if (!foreclosureSale.reoContactFirstName || !foreclosureSale.reoContactFirstName.trim()) {
            setFieldErrors(prev => ({ ...prev, reoContactFirstName: "REO contact first name is required" }));
            throw new Error("REO contact first name is required");
          }
          if (!foreclosureSale.reoContactLastName || !foreclosureSale.reoContactLastName.trim()) {
            setFieldErrors(prev => ({ ...prev, reoContactLastName: "REO contact last name is required" }));
            throw new Error("REO contact last name is required");
          }
          if (!foreclosureSale.reoBusinessPhone || !foreclosureSale.reoBusinessPhone.trim()) {
            setFieldErrors(prev => ({ ...prev, reoBusinessPhone: "REO business phone is required" }));
            throw new Error("REO business phone is required");
          }
        }

        // Validate requested alternative to foreclosure (required)
        if (foreclosureSale.requestedAlternativeToForeclosure === null || foreclosureSale.requestedAlternativeToForeclosure === undefined) {
          setFieldErrors(prev => ({ ...prev, "foreclosureSale.requestedAlternativeToForeclosure": "Please select if the borrower requested an alternative to foreclosure" }));
          throw new Error("Please select if the borrower requested an alternative to foreclosure");
        }

        // Validate foreclosure alternative option (required if alternative was requested)
        if (foreclosureSale.requestedAlternativeToForeclosure === true) {
          if (!foreclosureSale.foreclosureAlternativeOption || foreclosureSale.foreclosureAlternativeOption === "") {
            setFieldErrors(prev => ({ ...prev, "foreclosureSale.foreclosureAlternativeOption": "Alternative option is required" }));
            throw new Error("Alternative option is required");
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
      
      default:
        throw new Error(`Save handler not implemented for section: ${sectionId}`);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEditDropdown && !event.target.closest('.edit-options-dropdown')) {
        setShowEditDropdown(false);
      }
      if (showNotesDropdown && !event.target.closest('.notes-options-dropdown')) {
        setShowNotesDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEditDropdown, showNotesDropdown]);

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

  // Validate required fields across sections for final submit
  const validateFormForSubmit = () => {
    const errors = {};

    // Property
    if (!formData.propertyStreet1 || formData.propertyStreet1.trim() === "") errors.propertyStreet1 = "Required";
    if (!formData.propertyCity || formData.propertyCity.trim() === "") errors.propertyCity = "Required";
    if (!formData.propertyState || formData.propertyState.trim() === "") errors.propertyState = "Required";
    if (!formData.propertyZip || formData.propertyZip.trim() === "") errors.propertyZip = "Required";

    // Loan basics
    if (!formData.isMinApplicable || (formData.isMinApplicable !== "yes" && formData.isMinApplicable !== "no")) {
      errors.isMinApplicable = "Please select if MIN is applicable";
    }
    if (formData.isMinApplicable === "yes" && (!formData.minNumber || !formData.minNumber.trim())) {
      errors.minNumber = "MIN Number is required when MIN is applicable";
    }
    if (!formData.loanNumber || formData.loanNumber.trim() === "") errors.loanNumber = "Required";
    if (!formData.petitionLoanTypeId || formData.petitionLoanTypeId === "") errors.petitionLoanTypeId = "Required";
    // Note: lienPosition can be 0 (for "First"), so we check for null/undefined/empty string specifically
    if (formData.lienPosition == null || formData.lienPosition === "")
      errors.lienPosition = "Required";
    
    // Loan Modification fields (required)
    if (formData.borrowerRequestedLoanModification === null || formData.borrowerRequestedLoanModification === undefined) {
      errors.borrowerRequestedLoanModification = "Please select if the borrower requested a loan modification";
    }
    if (formData.borrowerRequestedLoanModification === true) {
      if (formData.loanModificationRequestFinalized === null || formData.loanModificationRequestFinalized === undefined) {
        errors.loanModificationRequestFinalized = "Please select if the loan modification request was finalized";
      }
    }

    // Borrowers: require at least one primary with name
    const primaryBorrower = (formData.borrowers || []).find(
      (b) => b.borrowerIsPrimary
    );
    if (!primaryBorrower) {
      errors.borrowers = "Primary borrower is required";
    } else {
      const pbKey = primaryBorrower.id || "primary";
      if (!primaryBorrower.firstName || primaryBorrower.firstName.trim() === "")
        errors[`borrower_${pbKey}_firstName`] = "Required";
      if (!primaryBorrower.lastName || primaryBorrower.lastName.trim() === "")
        errors[`borrower_${pbKey}_lastName`] = "Required";
      // Borrower mailing address is optional in wizard; do not require here.
    }

    // Loan Assignees: if present, validate required fields for each
    // Only validate if the assignee has at least one field filled (to avoid validating empty/partial entries)
    (formData.loanAssignees || []).forEach((a, idx) => {
      // Check if this assignee has any data - if it's completely empty, skip validation
      const hasAnyData = a.assigneeName || a.assigneeTypeId || a.assigneeRoleId || a.street1 || a.city || a.addressState || a.zip;
      
      if (hasAnyData) {
        // If assignee has any data, validate all required fields
        if (!a.assigneeName || a.assigneeName.trim() === "")
          errors[`loanAssignees.${idx}.assigneeName`] = "Required";
        if (!a.assigneeTypeId || a.assigneeTypeId === "")
          errors[`loanAssignees.${idx}.assigneeTypeId`] = "Required";
        if (!a.assigneeRoleId || a.assigneeRoleId === "")
          errors[`loanAssignees.${idx}.assigneeRoleId`] = "Required";
        if (!a.street1 || a.street1.trim() === "") errors[`loanAssignees.${idx}.street1`] = "Required";
        if (!a.city || a.city.trim() === "") errors[`loanAssignees.${idx}.city`] = "Required";
        if (!a.addressState || a.addressState.trim() === "")
          errors[`loanAssignees.${idx}.addressState`] = "Required";
        if (!a.zip || a.zip.trim() === "") errors[`loanAssignees.${idx}.zip`] = "Required";
      }
    });

    // Filing entity core fields
    if (!formData.filingEntityLegalName || formData.filingEntityLegalName.trim() === "")
      errors.filingEntityLegalName = "Required";
    if (!formData.filingEntityStreet1 || formData.filingEntityStreet1.trim() === "") errors.filingEntityStreet1 = "Required";
    if (!formData.filingEntityCity || formData.filingEntityCity.trim() === "") errors.filingEntityCity = "Required";
    if (!formData.filingEntityState || formData.filingEntityState.trim() === "") errors.filingEntityState = "Required";
    if (!formData.filingEntityZip || formData.filingEntityZip.trim() === "") errors.filingEntityZip = "Required";
    if (!formData.filingContactName || formData.filingContactName.trim() === "") errors.filingContactName = "Required";
    if (!formData.filingContactEmail || formData.filingContactEmail.trim() === "") {
      errors.filingContactEmail = "Required";
    } else {
      const emailOk = /.+@.+\..+/.test(formData.filingContactEmail.trim());
      if (!emailOk) errors.filingContactEmail = "Invalid email";
    }

    // E-consent validation - check if at least one signature has e-consent checked
    const signatures = formData.signatures || [];
    if (signatures.length > 0) {
      const hasEconsent = signatures.some((sig) => sig.esignConsent === true);
      if (!hasEconsent) {
        errors.esignConsent = "E-sign consent is required before submission";
      }
    } else {
      // If no signatures exist, that's also an error
      errors.signatures = "At least one signature is required";
    }

    // Foreclosure Sale validation removed - it's now handled separately in the Foreclosure Sale modal
    // Users can edit foreclosure sale independently without blocking main form submission

    if (Object.keys(errors).length) {
      setFieldErrors((prev) => ({ ...prev, ...errors }));
      
      // Special handling for e-consent error - scroll to signature section if it's present
      if (errors.esignConsent && signatureSectionRef.current) {
        setTimeout(() => {
          signatureSectionRef.current?.scrollIntoView({ 
            behavior: "smooth", 
            block: "center" 
          });
        }, 100);
      } else {
        // Attempt to focus first invalid field
        const firstKey = Object.keys(errors)[0];
        const el =
          document.querySelector(`[name="${firstKey}"]`) ||
          document.querySelector(`[data-error-key="${firstKey}"]`);
        if (el && typeof el.scrollIntoView === "function") {
          setTimeout(() => {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            if (typeof el.focus === "function") el.focus();
          }, 100);
        }
      }
      return false;
    }
    return true;
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
    if (isEditing && isLoaded && name === "propertyStreet1") {
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

    // Real-time validation for interest rate - must be 0-100%
    if (name === "interestRatePercent" && processedValue !== "" && processedValue !== null && processedValue !== undefined) {
      const interestRate = parseFloat(processedValue) || 0;
      
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

  // Handle foreclosure sale field changes
  const updateForeclosureSale = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      foreclosureSale: prev.foreclosureSale
        ? {
            ...prev.foreclosureSale,
            [field]: value,
            // Clear Mortgagee/Investor required fields if soldToId changes to Third Party
            ...(field === "soldToId" && value !== prev.foreclosureSale.soldToId
              ? {
                  vestingEntityName: "",
                  reoContactFirstName: "",
                  reoContactLastName: "",
                  reoBusinessPhone: "",
                }
              : {}),
          }
        : {
            saleDate: "",
            soldToId: "",
            vestingEntityName: "",
            reoEntityName: "",
            reoContactFirstName: "",
            reoContactLastName: "",
            reoBusinessPhone: "",
            reoEmergencyPhone: "",
            [field]: value,
          },
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

  // Handle edit mode toggle (legacy - for backward compatibility)
  const handleEditToggle = () => {
    const allSectionIds = sections.map(s => s.id);
    const allEditing = allSectionIds.every(id => isSectionEditing(id));
    
    if (allEditing) {
      setEditingSections({});
      if (initialFormData) {
        setFormData(initialFormData);
      }
      setFieldErrors({});
    } else {
      const newEditingState = {};
      allSectionIds.forEach(id => {
        newEditingState[id] = true;
      });
      setEditingSections(newEditingState);
    }
    setShowEditDropdown(false);
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
    
    const hasAmount = judgment.judgmentAmount !== null && 
                      judgment.judgmentAmount !== undefined && 
                      judgment.judgmentAmount !== 0;
    
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
    
    return hasDate || hasAmount || hasType || hasCourtInfo || hasDocket;
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
      localStorage.setItem("petitionFormData", JSON.stringify(initialFormData));
      // Also store the petition ID so we can update it when saving
      localStorage.setItem("editingPetitionId", petition.id);
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
        throw new Error("Judgment data is required");
      }

      // Get judgment ID from petition details (null if new)
      const judgmentId = petition.details?.judgment?.id || null;
      const isFirstTime = judgmentId === null; // Check if this is the first time adding judgment

      // Prepare judgment data for API
      const judgmentData = {
        id: judgmentId,
        petitionId: petition.id,
        judgmentDate: judgment.judgmentDate || "",
        judgmentAmount: judgment.judgmentAmount || 0,
        judgmentType: judgment.judgmentType !== null && judgment.judgmentType !== undefined 
          ? (typeof judgment.judgmentType === 'number' 
              ? judgment.judgmentType 
              : parseInt(judgment.judgmentType, 10))
          : 0,
        courtInformation: judgment.courtInformation || "",
        docketNumbers: judgment.docketNumbers || ""
      };

      // If first time adding judgment, call both APIs simultaneously
      if (isFirstTime) {
        await Promise.all([
          petitionApiService.updateJudgment(petition.id, judgmentData),
          petitionApiService.updateStatus(petition.id, "3") // Status value 3 (JudgmentSubmitted)
        ]);
      } else {
        // Call update judgment API only
        await petitionApiService.updateJudgment(petition.id, judgmentData);
      }
      
      toast.success("Judgment saved successfully.");
      
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
    } catch (error) {
      console.error("Error saving judgment:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to save judgment. Please try again.";
      toast.error(errorMessage);
      throw error;
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
    } catch (error) {
      console.error("Error refreshing petition after note save:", error);
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
        throw new Error("Foreclosure sale data is required");
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

      // If first time adding foreclosure, call both APIs simultaneously
      if (isFirstTime) {
        await Promise.all([
          petitionApiService.updateForeclosure(petition.id, foreclosureData),
          petitionApiService.updateStatus(petition.id, "2") // Status value 2 (ForeclosureSaleInitiated)
        ]);
      } else {
        // Call update foreclosure API only
        await petitionApiService.updateForeclosure(petition.id, foreclosureData);
      }
      
      toast.success("Foreclosure saved successfully.");
      
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
    } catch (error) {
      console.error("Error saving foreclosure:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to save foreclosure. Please try again.";
      toast.error(errorMessage);
      throw error;
    }
  };

  // Save as Draft (does not mark submitted) - no validation required for drafts
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      // No address validation required for drafts - user can save incomplete data
      // Ensure organizationId is set from petition if not in formData
      const petitionData = { 
        ...formData, 
        isAllStepsCompleted: false,
        organizationId: formData.organizationId || petition.organizationId,
      };
      await submitPetition(petitionData, true, petition.id);
      // Toast message is shown by submitPetition function
      setEditingSections({});
      
      // Call the callback to refresh the petitions list (just like delete does)
      // Small delay to ensure backend has processed the update
      setTimeout(() => {
        if (onPetitionUpdated) {
          onPetitionUpdated();
        }
      }, 200);
      // Then refresh the tab data
      if (activeTabId && refreshTab) {
        await refreshTab(activeTabId);
      }
    } catch (error) {
      toast.error(t("petitionTabContent.failedSaveDraft"));
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Submit Petition (requires full info)
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Validate all sections
      if (!validateFormForSubmit()) {
        toast.error(t("petitionTabContent.fillAllRequiredFields"));
        return;
      }
      const addressValidation = await validatePropertyAddressWithGeocoding();
      if (!addressValidation.isValid) {
        toast.error(t("petitionTabContent.propertyAddressNotValidated"));
        return;
      }
      // Ensure organizationId is set from petition if not in formData
      const petitionData = { 
        ...formData, 
        isAllStepsCompleted: true,
        organizationId: formData.organizationId || petition.organizationId,
      };
      await submitPetition(petitionData, false, petition.id);
      // Toast message is shown by submitPetition function
      setEditingSections({});
      
      // Call the callback to refresh the petitions list (just like delete does)
      // Small delay to ensure backend has processed the update
      setTimeout(() => {
        if (onPetitionUpdated) {
          onPetitionUpdated();
        }
      }, 200);
      // Then refresh the tab data
      if (activeTabId && refreshTab) {
        await refreshTab(activeTabId);
      }
    } catch (error) {
      // Error toast is already shown by submitPetition function, so we don't show another one here
      // Only log the error for debugging
      console.error("Error submitting petition:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reusable section header component with section-level edit button
  const SectionHeader = ({ title, sectionId }) => {
    // For draft petitions, don't show section-level edit buttons (they should use the wizard)
    const canEdit = !isPublic && petition?.status?.toLowerCase() !== "closed" && !isDraftPetition();
    const sectionEditing = sectionId ? isSectionEditing(sectionId) : false;
    
    return (
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{title}</h5>
          {canEdit && sectionId && (
            <div className="section-header-actions">
              {!sectionEditing ? (
                <button
                  type="button"
                  className="btn btn-sm btn-light section-edit-btn"
                  onClick={() => handleSectionEditToggle(sectionId)}
                  title={t("common.edit") || "Edit this section"}
                >
                  <i className="fas fa-edit me-1"></i>
                  {t("common.edit")}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-sm btn-success section-save-btn me-2"
                    onClick={async () => {
                      try {
                        setIsSavingDraft(true);
                        await handleSectionSave(sectionId);
                        toggleSectionEditing(sectionId);
                        toast.success(t("petitionTabContent.sectionSaved") || "Section saved successfully");
                      } catch (error) {
                        console.error("Error saving section:", error);
                        // Check if it's a duplicate error - show the specific message
                        if (error.isDuplicate || (error.message && (error.message.toLowerCase().includes("duplicate") || error.message.toLowerCase().includes("same property")))) {
                          toast.error(error.message || "A petition with the same property address already exists.");
                        } else {
                          // Show generic error for other errors
                          toast.error(t("petitionTabContent.saveError") || "Error saving section");
                        }
                      } finally {
                        setIsSavingDraft(false);
                      }
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
                    onClick={() => handleSectionEditToggle(sectionId)}
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
              rtc.noticeSent ? t("common.yes") : t("common.no"),
            ],
            [t("petitionTabContent.noticeDate"), formatDate(rtc.noticeDate)],
            [
              t("petitionTabContent.daysDelinquent"),
              rtc.daysDelinquentAtNotice || t("common.nA"),
            ],
            [
              t("petitionTabContent.amountInDefault"),
              formatCurrency(rtc.amountInDefault),
            ],
            [
              t("petitionTabContent.cureExpiration"),
              formatDate(rtc.cureExpirationDate),
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
          ];

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
          (judgment.judgmentAmount !== null && judgment.judgmentAmount !== undefined && judgment.judgmentAmount !== 0) ||
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
            [t("petitionTabContent.judgmentAmount"), formatCurrency(judgment.judgmentAmount) || t("common.nA")],
            [t("petitionTabContent.judgmentType"), judgmentTypeName],
            [t("petitionTabContent.courtInformation"), judgment.courtInformation || t("common.nA")],
            [t("petitionTabContent.docketNumbers"), judgment.docketNumbers || t("common.nA")],
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

          const foreclosureSaleData = [
            [t("petitionTabContent.saleDate"), formatDate(foreclosureSale.saleDate) || t("common.nA")],
            [t("petitionTabContent.soldTo"), soldToName],
            [t("petitionTabContent.vestingEntityName"), foreclosureSale.vestingEntityName || t("common.nA")],
            [t("petitionTabContent.reoEntityName"), foreclosureSale.reoEntityName || t("common.nA")],
            [t("petitionTabContent.reoContactFirstName"), foreclosureSale.reoContactFirstName || t("common.nA")],
            [t("petitionTabContent.reoContactLastName"), foreclosureSale.reoContactLastName || t("common.nA")],
            [t("petitionTabContent.reoBusinessPhone"), foreclosureSale.reoBusinessPhone || t("common.nA")],
            [t("petitionTabContent.reoEmergencyPhone"), foreclosureSale.reoEmergencyPhone || t("common.nA")],
          ];

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
            petition.details.affidavit.certainMortgageLoan ? t("common.yes") : t("common.no"),
          ],
        ];

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
    } catch (error) {
      toast.error(t("common.errorGeneratingPDF") || "Error generating PDF. Please try again.");
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
                  isLoaded={isLoaded}
                  propertyAddressInputRef={propertyAddressInputRef}
                  predictions={predictions}
                  fieldErrors={fieldErrors}
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handlePropertyAddressInput={handlePropertyAddressInput}
                  handlePropertyAddressSelect={handlePropertyAddressSelect}
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
                  isLoaded={isLoaded}
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
                  isLoaded={isLoaded}
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
                  isLoaded={isLoaded}
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
            localStorage.removeItem("petitionFormData");
            localStorage.removeItem("editingPetitionId");
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
            localStorage.removeItem("petitionFormData");
            localStorage.removeItem("editingPetitionId");
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
