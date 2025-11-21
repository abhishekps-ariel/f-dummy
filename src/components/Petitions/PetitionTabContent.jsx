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
import { useAuth } from "../../context/AuthContext";
import { getUserRole } from "../../utils/storage";

const PetitionTabContent = ({ petition, onPetitionUpdated, isPublic = false }) => {
  const { t } = useTranslation();
  const { loadingTabs, activeTabId, refreshTab, tabs } = useTabs();
  const {
    getLoanTypes,
    getAssigneeTypes,
    getAssigneeRoles,
    getLienPositions,
    getBuyerTypes,
    getJudgmentTypes,
    getPetitionStatuses,
    getOptionName,
    findOptionByValue,
    loading: commonDataLoading,
  } = usePetitionCommonData();
  const { submitPetition, fetchPetitions } = usePetitions();

  // Single edit mode state - makes all fields editable at once
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Modal states
  const [showJudgementModal, setShowJudgementModal] = useState(false);
  const [showForeclosureModal, setShowForeclosureModal] = useState(false);
  const [showEditDropdown, setShowEditDropdown] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showNotesDropdown, setShowNotesDropdown] = useState(false);
  const [showNotesSection, setShowNotesSection] = useState(false);
  const [showForeclosureWarningModal, setShowForeclosureWarningModal] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState(null);
  
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

  const handleNoticeAddressSelect = (prediction) => {
    setNoticePredictions([]);
    const street = prediction.description?.split(",")[0] || "";
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
          }
        : details.rightToCure?.noticeSent === true
        ? {
            saleDate: "",
            soldToId: "",
            vestingEntityName: "",
            reoEntityName: "",
            reoContactFirstName: "",
            reoContactLastName: "",
            reoBusinessPhone: "",
            reoEmergencyPhone: "",
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
    setIsEditing(false);
    setFieldErrors({});
    setShowEditDropdown(false);
    setShowJudgementModal(false);
    setShowForeclosureModal(false);
    setShowNotesDropdown(false);
    setShowNotesSection(false);
    setNoteToEdit(null);
  }, [petition?.id]);

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
      // Log validation errors for debugging
      console.log("Validation errors found:", errors);
      console.log("Form data state:", {
        propertyStreet1: formData.propertyStreet1,
        propertyCity: formData.propertyCity,
        propertyState: formData.propertyState,
        propertyZip: formData.propertyZip,
        loanNumber: formData.loanNumber,
        petitionLoanTypeId: formData.petitionLoanTypeId,
        lienPosition: formData.lienPosition,
        filingEntityLegalName: formData.filingEntityLegalName,
        filingEntityStreet1: formData.filingEntityStreet1,
        filingEntityCity: formData.filingEntityCity,
        filingEntityState: formData.filingEntityState,
        filingEntityZip: formData.filingEntityZip,
        filingContactName: formData.filingContactName,
        filingContactEmail: formData.filingContactEmail,
        borrowers: formData.borrowers,
        loanAssignees: formData.loanAssignees,
        signatures: formData.signatures,
      });
      
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

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel edit - reset form data
      setFormData(initialFormData);
      setFieldErrors({});
    }
    setIsEditing(!isEditing);
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
    // Right to cure must be yes
    if (formData.noticeSent !== true) {
      return false;
    }
    // Judgment must be submitted
    if (!hasJudgmentBeenSubmitted()) {
      return false;
    }
    return true;
  };

  // Handle edit dropdown selection
  const handleEditOptionSelect = (option) => {
    setShowEditDropdown(false);
    if (option === "filing") {
      handleEditToggle();
    } else if (option === "judgement") {
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
      // Ensure organizationId is set from petition if not in formData
      const dataToSave = {
        ...updatedFormData,
        organizationId: updatedFormData.organizationId || petition.organizationId || formData.organizationId,
      };
      
      // Get status string "JudgmentSubmitted" (value 3) from petition enums
      const petitionStatuses = getPetitionStatuses();
      const judgmentSubmittedStatus = petitionStatuses.find(status => status.value === 3);
      const statusString = judgmentSubmittedStatus ? judgmentSubmittedStatus.name : null;
      
      // Suppress the default toast and show custom message, pass status string
      await submitPetition(dataToSave, true, petition.id, true, statusString); // true = suppressToast, true = isDraft, statusString
      
      toast.success("Judgment saved successfully.");
      
      // Update local formData state
      setFormData(updatedFormData);
      
      if (onPetitionUpdated) {
        setTimeout(() => {
          onPetitionUpdated();
        }, 200);
      }
      if (activeTabId && refreshTab) {
        await refreshTab(activeTabId);
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
      // Ensure organizationId is set from petition if not in formData
      const dataToSave = {
        ...updatedFormData,
        organizationId: updatedFormData.organizationId || petition.organizationId || formData.organizationId,
      };
      
      // Get status string "ForeclosureSaleInitiated" (value 2) from petition enums
      const petitionStatuses = getPetitionStatuses();
      const foreclosureSaleInitiatedStatus = petitionStatuses.find(status => status.value === 2);
      const statusString = foreclosureSaleInitiatedStatus ? foreclosureSaleInitiatedStatus.name : null;
      
      // Suppress the default toast and show custom message, pass status string
      await submitPetition(dataToSave, true, petition.id, true, statusString); // true = suppressToast, true = isDraft, statusString
      toast.success("Foreclosure saved successfully.");
      if (onPetitionUpdated) {
        setTimeout(() => {
          onPetitionUpdated();
        }, 200);
      }
      if (activeTabId && refreshTab) {
        await refreshTab(activeTabId);
      }
    } catch (error) {
      console.error("Error saving foreclosure:", error);
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
      setIsEditing(false);
      
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
      setIsEditing(false);
      
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

  // Reusable section header component - no edit buttons, just title
  const SectionHeader = ({ title }) => (
    <div className="card-header">
      <h5 className="mb-0">{title}</h5>
    </div>
  );

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

      // Right-to-Cure
      if (petition.details?.rightToCure) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(t("petitionTabContent.rightToCure"), 20, yPosition);
        yPosition += 10;

        const rightToCureData = [
          [
            t("petitionTabContent.noticeSent"),
            petition.details.rightToCure.noticeSent ? t("common.yes") : t("common.no"),
          ],
          [t("petitionTabContent.noticeDate"), formatDate(petition.details.rightToCure.noticeDate)],
          [
            t("petitionTabContent.daysDelinquent"),
            petition.details.rightToCure.daysDelinquentAtNotice || t("common.nA"),
          ],
          [
            t("petitionTabContent.amountInDefault"),
            formatCurrency(petition.details.rightToCure.amountInDefault),
          ],
          [
            t("petitionTabContent.cureExpiration"),
            formatDate(petition.details.rightToCure.cureExpirationDate),
          ],
          [
            t("petitionTabContent.overrideReason"),
            petition.details.rightToCure.manualOverrideReason || t("common.nA"),
          ],
          [
            t("petitionTabContent.noticeAddress"),
            petition.details.rightToCure.noticeAddressStreet1 || t("common.nA"),
          ],
          [
            t("petitionTabContent.noticeCity"),
            petition.details.rightToCure.noticeAddressCity || t("common.nA"),
          ],
          [
            t("petitionTabContent.noticeState"),
            petition.details.rightToCure.noticeAddressState || t("common.nA"),
          ],
          [
            t("petitionTabContent.noticeZip"),
            petition.details.rightToCure.noticeAddressZip || t("common.nA"),
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
                      <div className="dropdown edit-options-dropdown" style={{ position: "relative" }}>
                        <button
                          type="button"
                          className={`dashboard-btn-create ${showEditDropdown ? 'active' : ''}`}
                        onClick={() => setShowEditDropdown(!showEditDropdown)}
                        title={t("petitionTabContent.editOptions")}
                      >
                        <i className="fas fa-edit me-1"></i>
                        {t("petitionTabContent.edit")}
                        <i className={`fas fa-chevron-down ms-1 transition-icon ${showEditDropdown ? 'rotate' : ''}`} style={{ fontSize: "0.7rem" }}></i>
                      </button>
                      {showEditDropdown && (
                        <div className="edit-options-menu">
                          <button
                            className="edit-option-item"
                            onClick={() => handleEditOptionSelect("filing")}
                          >
                            <i className="fas fa-edit edit-option-icon"></i>
                            <span>{t("petitionTabContent.editFiling")}</span>
                          </button>
                          <button
                            className="edit-option-item"
                            onClick={() => handleEditOptionSelect("judgement")}
                          >
                            <i className="fas fa-edit edit-option-icon"></i>
                            <span>{t("petitionTabContent.editJudgement")}</span>
                          </button>
                          <button
                            className="edit-option-item"
                            onClick={() => handleEditOptionSelect("foreclosure")}
                          >
                            <i className="fas fa-edit edit-option-icon"></i>
                            <span>{t("petitionTabContent.editForeclosure")}</span>
                          </button>
                        </div>
                      )}
                    </div>
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
                      {/* Only show Save as Draft for non-submitted petitions */}
                      {(petition.status !== "Submitted" && 
                        petition.status !== "Resubmitted" && 
                        petition.status !== "Accepted" && 
                        petition.status !== "Closed" &&
                        petition.statusClass !== "Submitted" &&
                        petition.statusClass !== "Resubmitted" &&
                        petition.statusClass !== "Accepted" &&
                        petition.statusClass !== "Closed") && (
                        <button
                          type="button"
                          className="dashboard-btn-create"
                          onClick={handleSaveDraft}
                          disabled={isSavingDraft || isSubmitting}
                          title={t("petitionTabContent.saveDraftTitle")}
                        >
                          {isSavingDraft ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-1"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              {t("petitionTabContent.saving")}
                            </>
                          ) : (
                            <>
                              <i className="fas fa-save me-1"></i>
                              {t("petitionTabContent.saveAsDraft")}
                            </>
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        className="dashboard-btn-create"
                        onClick={handleFinalSubmit}
                        disabled={isSavingDraft || isSubmitting}
                        title={t("petitionTabContent.submitPetitionTitle")}
                      >
                        {isSubmitting ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-1"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            {t("petitionTabContent.submitting")}
                          </>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane me-1"></i>
                            {t("petitionTabContent.submitPetition")}
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="dashboard-btn-refresh"
                        onClick={handleEditToggle}
                        disabled={isSavingDraft || isSubmitting}
                        title={t("petitionTabContent.cancelEditing")}
                      >
                        <i className="fas fa-times me-1"></i>
                        {t("common.cancel")}
                      </button>
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

        {/* Form Layout */}
        <form className="petition-form">
          {/* Notes Display Section - Shows above Property Details when toggled (only for non-public pages) */}
          {!isPublic && showNotesSection && (
            <NotesDisplaySection
              formData={formData}
              onClose={() => setShowNotesSection(false)}
              onEditNote={null}
            />
          )}
          {/* onEditNote={handleEditNote} - COMMENTED OUT: only allowing adding notes for now */}

          {/* Property Details Section */}
          <PropertyDetailsCard
            SectionHeader={SectionHeader}
            isEditing={isEditing}
            isLoaded={isLoaded}
            propertyAddressInputRef={propertyAddressInputRef}
            predictions={predictions}
            fieldErrors={fieldErrors}
            formData={formData}
            handleInputChange={handleInputChange}
            handlePropertyAddressInput={handlePropertyAddressInput}
            handlePropertyAddressSelect={handlePropertyAddressSelect}
          />

          {/* Loan Details Section */}
          <LoanDetails
            SectionHeader={SectionHeader}
            isEditing={isEditing}
            fieldErrors={fieldErrors}
            formData={formData}
            handleInputChange={handleInputChange}
            getLoanTypes={getLoanTypes}
            getLienPositions={getLienPositions}
            commonDataLoading={commonDataLoading}
          />

          {/* Borrower Details Section */}
          <BorrowerDetails
            SectionHeader={SectionHeader}
            isEditing={isEditing}
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

          {/* Filing Entity Section */}
          <StepFilingEntity
            SectionHeader={SectionHeader}
            isEditing={isEditing}
            formData={formData}
            fieldErrors={fieldErrors}
            handleInputChange={handleInputChange}
          />

          {/* Right-to-Cure Section */}
          <StepRightToCure
            SectionHeader={SectionHeader}
            isEditing={isEditing}
            formData={formData}
            fieldErrors={fieldErrors}
            setFormData={setFormData}
            handleInputChange={handleInputChange}
            handleNoticeAddressInput={handleNoticeAddressInput}
            isLoaded={isLoaded}
            noticePredictions={noticePredictions}
            handleNoticeAddressSelect={handleNoticeAddressSelect}
          />

          {/* Form 35B Compliance Section */}
          <StepForm35BCompliance
            SectionHeader={SectionHeader}
            isEditing={isEditing}
            formData={formData}
            setFormData={setFormData}
            fieldErrors={fieldErrors}
            isCertainMortgageLoanReadOnly={
              formData.variableRate || formData.interestOnly || formData.negativeAmortization
            }
          />


          {/* Loan Assignees Section */}
          <StepLoanAssignees
            SectionHeader={SectionHeader}
            isEditing={isEditing}
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

          {/* Signatures Section */}
          <StepSignaturesSection
            SectionHeader={SectionHeader}
            signatureSectionRef={signatureSectionRef}
            isEditing={isEditing}
            fieldErrors={fieldErrors}
            formData={formData}
            setFormData={setFormData}
            setFieldErrors={setFieldErrors}
            petition={petition}
            formatDate={formatDate}
          />

          {/* Judgment Display Section - Read-only, only shows if data exists */}
          <JudgmentDisplaySection
            SectionHeader={SectionHeader}
            formData={formData}
            getJudgmentTypes={getJudgmentTypes}
            findOptionByValue={findOptionByValue}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
          />

          {/* Foreclosure Sale Display Section - Read-only, only shows if data exists */}
          <ForeclosureSaleDisplaySection
            SectionHeader={SectionHeader}
            formData={formData}
            getBuyerTypes={getBuyerTypes}
            findOptionByValue={findOptionByValue}
            formatDate={formatDate}
          />
        </form>
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

      {/* Foreclosure Edit Warning Modal */}
      {showForeclosureWarningModal && (() => {
        const rightToCureMet = formData.noticeSent === true;
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
                  <p>{t("petitionTabContent.cannotEditForeclosureDesc", { s: missingConditions.length > 1 ? 's' : '' })}</p>
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
