import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useJsApiLoader } from '@react-google-maps/api';
import Config from '../../config/index';
import { usePetitionCommonData } from '../../hooks/usePetitionCommonData';
import { usePetitions } from '../../hooks/usePetitions';
import { useAuth } from '../../context/AuthContext';
import { usePetitionWizard } from '../../context/PetitionWizardContext';
import { getUserById } from '../../services/authService';
import { getFilingEntityTypes } from '../../services/commonService';
import { getOrganizationById } from '../../services/organizationService';
import PetitionStepper from './PetitionStepper';

// Static libraries array to prevent LoadScript reload
const LIBRARIES = ['places'];

const PetitionSteps = ({ isOpen, onClose, organization, onPetitionSubmitted }) => {
  const { currentStep: wizardCurrentStep, goToStep: wizardGoToStep, markStepCompleted, completedSteps } = usePetitionWizard();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 9;

  // Sync wizard state with component state
  useEffect(() => {
    setCurrentStep(wizardCurrentStep);
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
    error: commonDataError
  } = usePetitionCommonData();

  // Load petition API functions
  const { submitPetition, hasOrganizationAccess, loading: petitionLoading } = usePetitions();
  
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
  const [addressValidationError, setAddressValidationError] = useState('');
  const [isAddressVerified, setIsAddressVerified] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [showAddressValidationDialog, setShowAddressValidationDialog] = useState(false);
  const [addressValidationMessage, setAddressValidationMessage] = useState('');
  
  // Additional address fields state
  const [borrowerAddressValidationErrors, setBorrowerAddressValidationErrors] = useState({});
  const [noticeAddressValidationErrors, setNoticeAddressValidationErrors] = useState({});
  const [loanAssigneeAddressValidationErrors, setLoanAssigneeAddressValidationErrors] = useState({});
  
  // Single address validation modal state
  const [addressValidationType, setAddressValidationType] = useState(''); // 'property', 'borrower', 'notice', 'loanAssignee'
  const [addressValidationContext, setAddressValidationContext] = useState(null); // Additional context like borrowerId or assigneeIndex
  
  // Autocomplete state for different address fields
  const [borrowerPredictions, setBorrowerPredictions] = useState({});
  const [showBorrowerPredictions, setShowBorrowerPredictions] = useState({});
  const [selectedBorrowerPredictionIndex, setSelectedBorrowerPredictionIndex] = useState({});
  const [isLoadingBorrowerPredictions, setIsLoadingBorrowerPredictions] = useState({});
  
  const [noticePredictions, setNoticePredictions] = useState([]);
  const [showNoticePredictions, setShowNoticePredictions] = useState(false);
  const [selectedNoticePredictionIndex, setSelectedNoticePredictionIndex] = useState(-1);
  const [isLoadingNoticePredictions, setIsLoadingNoticePredictions] = useState(false);
  
  const [loanAssigneePredictions, setLoanAssigneePredictions] = useState({});
  const [showLoanAssigneePredictions, setShowLoanAssigneePredictions] = useState({});
  const [selectedLoanAssigneePredictionIndex, setSelectedLoanAssigneePredictionIndex] = useState({});
  const [isLoadingLoanAssigneePredictions, setIsLoadingLoanAssigneePredictions] = useState({});
  
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
          setFormData(prev => ({
            ...prev,
            filingEntityTypeId: profileResponse.data.filingEntityTypeId || ''
          }));
        }
        
        // Load filing entity types
        const typesResponse = await getFilingEntityTypes();
        if (typesResponse.isSuccess) {
          setFilingEntityTypes(typesResponse.data);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        toast.error('Failed to load user profile');
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
          setFormData(prev => ({
            ...prev,
            filingEntityLegalName: orgData.name || '',
            filingEntityStreet1: orgData.addressStreet1 || '',
            filingEntityStreet2: orgData.addressStreet2 || '',
            filingEntityCity: orgData.addressCity || '',
            filingEntityState: orgData.addressState || '',
            filingEntityZip: orgData.addressZip || '',
            filingContactName: orgData.primaryContactName || '',
            filingContactEmail: orgData.primaryContactEmail || '',
            filingContactPhone: orgData.primaryContactPhone || ''
          }));
          
          setOrganizationData(orgData);
        }
      } catch (error) {
        console.error('Error loading organization details:', error);
        // Fallback to existing organization prop if available
        if (organization) {
          // Parse the old format as fallback
          const addressParts = organization.address ? organization.address.split(', ') : [];
          let street1 = '';
          let city = '';
          let state = '';
          let zip = '';
          
          if (addressParts.length >= 3) {
            street1 = addressParts[0] || '';
            city = addressParts[1] || '';
            const stateZip = addressParts[2] || '';
            const stateZipParts = stateZip.split(' ');
            if (stateZipParts.length >= 2) {
              state = stateZipParts[0] || '';
              zip = stateZipParts[1] || '';
            }
          }
          
          setFormData(prev => ({
            ...prev,
            filingEntityLegalName: organization.name || '',
            filingEntityStreet1: street1,
            filingEntityCity: city,
            filingEntityState: state,
            filingEntityZip: zip
          }));
        }
      } finally {
        setOrganizationLoading(false);
      }
    };
    
    loadOrganizationData();
  }, [organization?.id]);

  // Initialize Google Maps API with React library
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: Config.GOOGLE_PLACES_API_KEY,
    libraries: LIBRARIES,
    preventGoogleFontsLoading: true
  });

  // Error logging
  useEffect(() => {
    if (loadError) {
      console.error('Google Maps Load Error:', loadError);
    }
    
    // Check if API key is properly configured
    if (Config.GOOGLE_PLACES_API_KEY === 'YOUR_GOOGLE_PLACES_API_KEY_HERE') {
      console.warn('Google Places API key not configured properly');
    }
  }, [isLoaded, loadError]);

  // Initialize Google Places services when API is loaded
  useEffect(() => {
    if (isLoaded && window.google && window.google.maps) {
      try {
        // Initialize AutocompleteService
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        
        // Initialize PlacesService
        const map = new window.google.maps.Map(document.createElement('div'));
        placesServiceRef.current = new window.google.maps.places.PlacesService(map);
        
        // Initialize Geocoder
        geocoderRef.current = new window.google.maps.Geocoder();
      } catch (error) {
        console.error('Error initializing Google Places services:', error);
      }
    }
  }, [isLoaded]);

  // Load saved drafts on component mount
  useEffect(() => {
    const loadSavedDrafts = () => {
      try {
        const savedDrafts = JSON.parse(localStorage.getItem('petitionDrafts') || '[]');
        if (savedDrafts.length > 0) {
          // Find the most recent draft for the current step
          const currentStepDraft = savedDrafts.find(draft => draft.step === currentStep);
          if (currentStepDraft && currentStepDraft.formData) {
            // Only load draft if current form data is empty (first time opening)
            setFormData(prev => {
              // Check if current form data is mostly empty
              const hasData = Object.values(prev).some(value => 
                value !== '' && value !== 0 && value !== false && 
                !Array.isArray(value) && value !== null
              );
              
              if (!hasData) {
                setHasSavedDraft(true);
                return {
                  ...prev,
                  ...currentStepDraft.formData
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
        console.error('Error loading saved drafts:', error);
        setHasSavedDraft(false);
      }
    };

    if (isOpen) {
      // Clear any existing drafts to prevent interference
      localStorage.removeItem('petitionDrafts');
      loadSavedDrafts();
    }
  }, [isOpen, currentStep]);
  
  const [formData, setFormData] = useState({
    // Step 1: Property Details
    propertyStreet1: '',
    propertyStreet2: '',
    propertyCity: '',
    propertyState: 'MA',
    propertyZip: '',
    propertyCounty: '',
    assessorParcelId: '',
    
    // Step 2: Loan Details
    minNumber: '',
    loanNumber: '',
    petitionLoanTypeId: '',
    petitionLoanTypeName: '',
    lienPosition: '',
    originationDate: '',
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
        firstName: '',
        middleName: '',
        lastName: '',
        suffix: '',
        borrowerIsPrimary: true,
        mailingStreet1: '',
        mailingCity: '',
        mailingState: '',
        mailingZip: '',
        phone: '',
        email: ''
      }
    ],
    
    // Step 4: Filing Entity
    filingEntityLegalName: '',
    filingEntityRole: '',
    filingEntityStreet1: '',
    filingEntityStreet2: '',
    filingEntityCity: '',
    filingEntityState: '',
    filingEntityZip: '',
    filingContactName: '',
    filingContactEmail: '',
    filingContactPhone: '',
    nmlsLicenseNumber: '',
    stateLicenseNumber: '',
    stateLicenseState: '',
    
    // Step 5: Right-to-Cure
    noticeSent: false,
    noticeDate: '',
    amountInDefault: 0,
    daysDelinquentAtNotice: 0,
    cureExpirationDate: '',
    noticeAddressStreet1: '',
    noticeAddressCity: '',
    noticeAddressState: '',
    noticeAddressZip: '',
    manualOverrideReason: '',
    
    // Step 6: Form 35B Compliance
    certainMortgageLoan: false,
    form35bComplianceAffidavitPdf: null,
    form35bNonApplicabilityAffidavitPdf: null,
    affiantName: '',
    affiantTitle: '',
    affidavitExecutionDate: '',
    
    // Step 7: Loan Assignees
    loanAssignees: [
      {
        assigneeName: '',
        assigneeTypeId: '',
        assigneeRoleId: '',
        street1: '',
        street2: '',
        city: '',
        addressState: '',
        zip: '',
        licenseNumber: '',
        licenseState: ''
      }
    ],
    
    // Step 8: Petition Attestation & Signatures
    signatures: [
      {
        signerFullName: '',
        signerTitle: '',
        signerEmail: '',
        esignConsent: false,
        signatureDrawnOrTyped: '',
        signedAt: '',
        signerIp: '',
        otpCode: ''
      }
    ],
    
    // Additional fields
    documents: [],
    certification_check: false,
  });

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
        types: ['address'],
        componentRestrictions: { country: 'us' }
      };

      try {
        autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
          setIsLoadingPredictions(false);
          
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setPredictions(predictions);
            setShowPredictions(true);
            setSelectedPredictionIndex(-1);
          } else {
            setPredictions([]);
            setShowPredictions(false);
            
            // Show specific error messages for debugging
            if (status === window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
              console.error('Google Places API request denied - check API key permissions');
            } else if (status === window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
              console.error('Google Places API quota exceeded');
            } else if (status === window.google.maps.places.PlacesServiceStatus.INVALID_REQUEST) {
              console.error('Google Places API invalid request');
            }
          }
        });
      } catch (error) {
        setIsLoadingPredictions(false);
        console.error('Error calling Google Places API:', error);
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
      fields: ['address_components', 'formatted_address', 'geometry']
    };

    placesServiceRef.current.getDetails(request, (place, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
        const addressComponents = place.address_components;
        let streetNumber = '';
        let route = '';
        let city = '';
        let state = '';
        let zipCode = '';
        let county = '';

        addressComponents.forEach(component => {
          const types = component.types;
          if (types.includes('street_number')) {
            streetNumber = component.long_name;
          } else if (types.includes('route')) {
            route = component.long_name;
          } else if (types.includes('locality')) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            state = component.short_name;
          } else if (types.includes('postal_code')) {
            zipCode = component.long_name;
          } else if (types.includes('administrative_area_level_2')) {
            // County information is typically found in administrative_area_level_2
            county = component.long_name;
          }
        });

        const fullAddress = `${streetNumber} ${route}`.trim();
        
        setFormData(prev => ({
          ...prev,
          propertyStreet1: fullAddress,
          propertyCity: city,
          propertyState: 'MA', // Always keep as MA since it's locked
          propertyZip: zipCode,
          propertyCounty: county
        }));

        // Don't mark as verified automatically - validation will happen on Save
        setIsAddressVerified(false);
        setAddressValidationError('');
        setShowPredictions(false);
        setPredictions([]);
      }
    });
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showPredictions || predictions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedPredictionIndex(prev => 
          prev < predictions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedPredictionIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedPredictionIndex >= 0) {
          selectPrediction(predictions[selectedPredictionIndex].place_id);
        }
        break;
      case 'Escape':
        setShowPredictions(false);
        setPredictions([]);
        setSelectedPredictionIndex(-1);
        break;
    }
  };

  // Handle borrower address input for autocomplete
  const handleBorrowerAddressInput = (borrowerId, value) => {
    if (!autocompleteServiceRef.current || !value.trim()) {
      setBorrowerPredictions(prev => ({ ...prev, [borrowerId]: [] }));
      setShowBorrowerPredictions(prev => ({ ...prev, [borrowerId]: false }));
      return;
    }

    setIsLoadingBorrowerPredictions(prev => ({ ...prev, [borrowerId]: true }));

    const request = {
      input: value,
      types: ['address'],
      componentRestrictions: { country: 'us' }
    };

    try {
      autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
        setIsLoadingBorrowerPredictions(prev => ({ ...prev, [borrowerId]: false }));
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setBorrowerPredictions(prev => ({ ...prev, [borrowerId]: predictions }));
          setShowBorrowerPredictions(prev => ({ ...prev, [borrowerId]: true }));
          setSelectedBorrowerPredictionIndex(prev => ({ ...prev, [borrowerId]: -1 }));
        } else {
          setBorrowerPredictions(prev => ({ ...prev, [borrowerId]: [] }));
          setShowBorrowerPredictions(prev => ({ ...prev, [borrowerId]: false }));
        }
      });
    } catch (error) {
      console.error('Error calling Google Places API for borrower address:', error);
      setIsLoadingBorrowerPredictions(prev => ({ ...prev, [borrowerId]: false }));
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
      types: ['address'],
      componentRestrictions: { country: 'us' }
    };

    try {
      autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
        setIsLoadingNoticePredictions(false);
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setNoticePredictions(predictions);
          setShowNoticePredictions(true);
          setSelectedNoticePredictionIndex(-1);
        } else {
          setNoticePredictions([]);
          setShowNoticePredictions(false);
        }
      });
    } catch (error) {
      console.error('Error calling Google Places API for notice address:', error);
      setIsLoadingNoticePredictions(false);
    }
  };

  // Handle loan assignee address input for autocomplete
  const handleLoanAssigneeAddressInput = (assigneeIndex, value) => {
    if (!autocompleteServiceRef.current || !value.trim()) {
      setLoanAssigneePredictions(prev => ({ ...prev, [assigneeIndex]: [] }));
      setShowLoanAssigneePredictions(prev => ({ ...prev, [assigneeIndex]: false }));
      return;
    }

    setIsLoadingLoanAssigneePredictions(prev => ({ ...prev, [assigneeIndex]: true }));

    const request = {
      input: value,
      types: ['address'],
      componentRestrictions: { country: 'us' }
    };

    try {
      autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
        setIsLoadingLoanAssigneePredictions(prev => ({ ...prev, [assigneeIndex]: false }));
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setLoanAssigneePredictions(prev => ({ ...prev, [assigneeIndex]: predictions }));
          setShowLoanAssigneePredictions(prev => ({ ...prev, [assigneeIndex]: true }));
          setSelectedLoanAssigneePredictionIndex(prev => ({ ...prev, [assigneeIndex]: -1 }));
        } else {
          setLoanAssigneePredictions(prev => ({ ...prev, [assigneeIndex]: [] }));
          setShowLoanAssigneePredictions(prev => ({ ...prev, [assigneeIndex]: false }));
        }
      });
    } catch (error) {
      console.error('Error calling Google Places API for loan assignee address:', error);
      setIsLoadingLoanAssigneePredictions(prev => ({ ...prev, [assigneeIndex]: false }));
    }
  };

  // Handle borrower address prediction click
  const handleBorrowerPredictionClick = (borrowerId, prediction) => {
    if (!placesServiceRef.current) return;

    const request = {
      placeId: prediction.place_id,
      fields: ['address_components', 'formatted_address']
    };

    placesServiceRef.current.getDetails(request, (place, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
        const addressComponents = place.address_components;
        let streetNumber = '';
        let route = '';
        let city = '';
        let state = '';
        let zipCode = '';

        addressComponents.forEach(component => {
          const types = component.types;
          if (types.includes('street_number')) {
            streetNumber = component.long_name;
          } else if (types.includes('route')) {
            route = component.long_name;
          } else if (types.includes('locality')) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            state = component.short_name;
          } else if (types.includes('postal_code')) {
            zipCode = component.long_name;
          }
        });

        const fullAddress = `${streetNumber} ${route}`.trim();
        
        updateBorrower(borrowerId, 'mailingStreet1', fullAddress);
        updateBorrower(borrowerId, 'mailingCity', city);
        updateBorrower(borrowerId, 'mailingState', state);
        updateBorrower(borrowerId, 'mailingZip', zipCode);

        setShowBorrowerPredictions(prev => ({ ...prev, [borrowerId]: false }));
        setBorrowerPredictions(prev => ({ ...prev, [borrowerId]: [] }));
      }
    });
  };

  // Handle notice address prediction click
  const handleNoticePredictionClick = (prediction) => {
    if (!placesServiceRef.current) return;

    const request = {
      placeId: prediction.place_id,
      fields: ['address_components', 'formatted_address']
    };

    placesServiceRef.current.getDetails(request, (place, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
        const addressComponents = place.address_components;
        let streetNumber = '';
        let route = '';
        let city = '';
        let state = '';
        let zipCode = '';

        addressComponents.forEach(component => {
          const types = component.types;
          if (types.includes('street_number')) {
            streetNumber = component.long_name;
          } else if (types.includes('route')) {
            route = component.long_name;
          } else if (types.includes('locality')) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            state = component.short_name;
          } else if (types.includes('postal_code')) {
            zipCode = component.long_name;
          }
        });

        const fullAddress = `${streetNumber} ${route}`.trim();
        
        setFormData(prev => ({
          ...prev,
          noticeAddressStreet1: fullAddress,
          noticeAddressCity: city,
          noticeAddressState: state,
          noticeAddressZip: zipCode
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
      fields: ['address_components', 'formatted_address']
    };

    placesServiceRef.current.getDetails(request, (place, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
        const addressComponents = place.address_components;
        let streetNumber = '';
        let route = '';
        let city = '';
        let state = '';
        let zipCode = '';

        addressComponents.forEach(component => {
          const types = component.types;
          if (types.includes('street_number')) {
            streetNumber = component.long_name;
          } else if (types.includes('route')) {
            route = component.long_name;
          } else if (types.includes('locality')) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            state = component.short_name;
          } else if (types.includes('postal_code')) {
            zipCode = component.long_name;
          }
        });

        const fullAddress = `${streetNumber} ${route}`.trim();
        
        updateLoanAssignee(assigneeIndex, 'street1', fullAddress);
        updateLoanAssignee(assigneeIndex, 'city', city);
        updateLoanAssignee(assigneeIndex, 'addressState', state);
        updateLoanAssignee(assigneeIndex, 'zip', zipCode);

        setShowLoanAssigneePredictions(prev => ({ ...prev, [assigneeIndex]: false }));
        setLoanAssigneePredictions(prev => ({ ...prev, [assigneeIndex]: [] }));
      }
    });
  };

  // Validate address using Geocoding API
  const validateAddressWithGeocoding = () => {
    return new Promise((resolve) => {
      if (!geocoderRef.current || !formData.propertyStreet1.trim()) {
        resolve({ isValid: false, error: 'Street address is required' });
        return;
      }

      setIsValidatingAddress(true);
      setAddressValidationError('');

      const addressLine2 = formData.propertyStreet2 ? ` ${formData.propertyStreet2}` : '';
      const fullAddress = `${formData.propertyStreet1}${addressLine2}, ${formData.propertyCity}, ${formData.propertyState} ${formData.propertyZip}`.trim();

      geocoderRef.current.geocode({ address: fullAddress }, (results, status) => {
        setIsValidatingAddress(false);

        if (status === 'OK' && results && results.length > 0) {
          const result = results[0];
          const addressComponents = result.address_components;
          
          // Check if the geocoded result matches our input
          let foundCity = false;
          let foundState = false;
          let foundZip = false;
          let county = '';

          let actualState = '';
          
          addressComponents.forEach(component => {
            const types = component.types;
            if (types.includes('locality') || types.includes('administrative_area_level_2')) {
              if (component.long_name.toLowerCase().includes(formData.propertyCity.toLowerCase())) {
                foundCity = true;
              }
            }
            if (types.includes('administrative_area_level_1')) {
              actualState = component.short_name;
              if (component.short_name === 'MA') {
                foundState = true;
              }
            }
            if (types.includes('postal_code')) {
              if (component.long_name === formData.propertyZip) {
                foundZip = true;
              }
            }
            if (types.includes('administrative_area_level_2')) {
              // Extract county information for auto-filling
              county = component.long_name;
            }
          });

          // Check if the address is actually in Massachusetts
          if (actualState && actualState !== 'MA') {
            setIsAddressVerified(false);
            setAddressValidationError(`This address is in ${actualState}, but this system only accepts Massachusetts addresses. Please select a Massachusetts address.`);
            resolve({ isValid: false, error: 'Address is not in Massachusetts' });
            return;
          }

          // More strict validation - check if all components match
          let cityMatch = false;
          let zipMatch = false;
          let countyMatch = false;
          
          // Check city match (more flexible matching)
          addressComponents.forEach(component => {
            const types = component.types;
            if (types.includes('locality') || types.includes('administrative_area_level_2')) {
              const componentCity = component.long_name.toLowerCase();
              const inputCity = formData.propertyCity.toLowerCase();
              if (componentCity.includes(inputCity) || inputCity.includes(componentCity)) {
                cityMatch = true;
              }
            }
            if (types.includes('postal_code')) {
              if (component.long_name === formData.propertyZip) {
                zipMatch = true;
              }
            }
            if (types.includes('administrative_area_level_2')) {
              const componentCounty = component.long_name.toLowerCase();
              const inputCounty = formData.propertyCounty.toLowerCase();
              if (componentCounty.includes(inputCounty) || inputCounty.includes(componentCounty)) {
                countyMatch = true;
              }
            }
          });

          // Require all components to match for verification
          if (foundState && cityMatch && zipMatch && countyMatch) {
            // Auto-fill county if it was found and not already set
            if (county && !formData.propertyCounty) {
              setFormData(prev => ({
                ...prev,
                propertyCounty: county
              }));
            }
            setIsAddressVerified(true);
            resolve({ isValid: true, coordinates: result.geometry.location });
          } else {
            setIsAddressVerified(false);
            let errorMessage = 'Address verification failed. Please check:';
            if (!cityMatch) errorMessage += ' City does not match the address';
            if (!zipMatch) errorMessage += ' ZIP code does not match the address';
            if (!countyMatch) errorMessage += ' County does not match the address';
            
            setAddressValidationError(errorMessage);
            resolve({ isValid: false, error: 'Address verification failed' });
          }
        } else {
          setIsAddressVerified(false);
          setAddressValidationError('Invalid address. Please select from suggestions or enter a valid address.');
          resolve({ isValid: false, error: 'Invalid address' });
        }
      });
    });
  };

  // Validation functions
  const validateAddressFields = () => {
    const errors = {};
    let hasErrors = false;
    
    if (!formData.propertyStreet1.trim()) {
      errors.propertyStreet1 = 'Street address is required';
      hasErrors = true;
    }
    
    if (!formData.propertyCity.trim()) {
      errors.propertyCity = 'City is required';
      hasErrors = true;
    }
    
    if (!formData.propertyState.trim()) {
      errors.propertyState = 'State is required';
      hasErrors = true;
    }
    
    const zipPattern = /^\d{5}(-\d{4})?$/;
    if (!formData.propertyZip.trim()) {
      errors.propertyZip = 'ZIP code is required';
      hasErrors = true;
    } else if (!zipPattern.test(formData.propertyZip)) {
      errors.propertyZip = 'ZIP code must be in valid format (12345 or 12345-6789)';
      hasErrors = true;
    }
    
    if (!formData.propertyCounty.trim()) {
      errors.propertyCounty = 'County is required';
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
      setFieldErrors(prev => ({ ...prev, address: addressValidationError || 'Address validation failed' }));
      return { isValid: false, errors: { address: addressValidationError || 'Address validation failed' } };
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
      
      geocoderRef.current.geocode({ address: fullAddress }, (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          const result = results[0];
          const addressComponents = result.address_components;
          
          let detectedCity = '';
          let detectedCounty = '';
          let isInMA = false;

          addressComponents.forEach(component => {
            const types = component.types;
            if (types.includes('locality')) {
              detectedCity = component.long_name;
            } else if (types.includes('administrative_area_level_2')) {
              detectedCounty = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              if (component.short_name === 'MA') {
                isInMA = true;
              }
            }
          });

          // Only auto-fill if the address is in Massachusetts
          if (isInMA && (detectedCity || detectedCounty)) {
            setFormData(prev => ({
              ...prev,
              ...(detectedCity && !prev.propertyCity ? { propertyCity: detectedCity } : {}),
              ...(detectedCounty && !prev.propertyCounty ? { propertyCounty: detectedCounty } : {})
            }));
          }
        }
      });
    } catch (error) {
      console.error('Auto-detection error:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Reset saved draft indicator when user makes changes
    if (hasSavedDraft) {
      setHasSavedDraft(false);
    }

    // Reset address verification when manually editing address fields
    if (['propertyStreet1', 'propertyStreet2', 'propertyCity', 'propertyState', 'propertyZip', 'propertyCounty'].includes(name)) {
      setIsAddressVerified(false);
      setAddressValidationError('');
    }

    // Auto-detect city and county when street address and ZIP are both entered
    if (name === 'propertyStreet1' || name === 'propertyZip') {
      const currentFormData = { ...formData, [name]: value };
      const streetAddress = name === 'propertyStreet1' ? value : currentFormData.propertyStreet1;
      const zipCode = name === 'propertyZip' ? value : currentFormData.propertyZip;
      
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
    setFormData(prev => ({
      ...prev,
      [fileFieldName]: null
    }));
    
    // Clear any field errors for this file
    if (fieldErrors[fileFieldName]) {
      setFieldErrors(prev => ({
        ...prev,
        [fileFieldName]: ''
      }));
    }
  };

  // Borrower management functions
  const addBorrower = () => {
    const newBorrowerId = Math.max(...formData.borrowers.map(b => b.id)) + 1;
    setFormData(prev => ({
      ...prev,
      borrowers: [
        ...prev.borrowers,
        {
          id: newBorrowerId,
          firstName: '',
          middleName: '',
          lastName: '',
          suffix: '',
          borrowerIsPrimary: false,
          mailingStreet1: '',
          mailingCity: '',
          mailingState: '',
          mailingZip: '',
          phone: '',
          email: ''
        }
      ]
    }));
  };

  const removeBorrower = (borrowerId) => {
    if (formData.borrowers.length > 1) {
      const isRemovingPrimary = formData.borrowers.find(b => b.id === borrowerId)?.borrowerIsPrimary;
      
      setFormData(prev => {
        const newBorrowers = prev.borrowers.filter(borrower => borrower.id !== borrowerId);
        
        // If we're removing the primary borrower, make the first remaining borrower primary
        if (isRemovingPrimary && newBorrowers.length > 0) {
          newBorrowers[0].borrowerIsPrimary = true;
        }
        
        return {
          ...prev,
          borrowers: newBorrowers
        };
      });
    }
  };

  const updateBorrower = (borrowerId, field, value) => {
    setFormData(prev => ({
      ...prev,
      borrowers: prev.borrowers.map(borrower =>
        borrower.id === borrowerId
          ? { ...borrower, [field]: value }
          : borrower
      )
    }));
  };

  // Loan assignee management functions
  const addLoanAssignee = () => {
    setFormData(prev => ({
      ...prev,
      loanAssignees: [
        ...prev.loanAssignees,
        {
          assigneeName: '',
          assigneeTypeId: '',
          assigneeRoleId: '',
          contactEmail: '',
          contactPhone: ''
        }
      ]
    }));
  };

  const removeLoanAssignee = (index) => {
    if (formData.loanAssignees.length > 1) {
      setFormData(prev => ({
        ...prev,
        loanAssignees: prev.loanAssignees.filter((_, i) => i !== index)
      }));
    }
  };

  const updateLoanAssignee = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      loanAssignees: prev.loanAssignees.map((assignee, i) =>
        i === index ? { ...assignee, [field]: value } : assignee
      )
    }));

    // Clear field error when user starts typing
    const errorKey = `loanAssignees.${index}.${field}`;
    if (fieldErrors[errorKey]) {
      setFieldErrors(prev => {
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
      errors.minNumber = 'Either MIN Number or Loan Number is required';
      hasErrors = true;
    }
    
    // Loan Number is required if MIN Number is not provided
    if (!formData.loanNumber.trim() && !formData.minNumber.trim()) {
      errors.loanNumber = 'Either Loan Number or MIN Number is required';
      hasErrors = true;
    }
    
    // Loan Type is required (from lookup)
    if (!formData.petitionLoanTypeId) {
      errors.petitionLoanTypeId = 'Loan Type is required';
      hasErrors = true;
    }
    
    // Lien Position is required
    if (!formData.lienPosition || formData.lienPosition === '' || formData.lienPosition === 0) {
      errors.lienPosition = 'Lien Position is required';
      hasErrors = true;
    }
    
    // Origination Date is required and must be in the past
    if (!formData.originationDate.trim()) {
      errors.originationDate = 'Origination Date is required';
      hasErrors = true;
    } else {
      const originationDate = new Date(formData.originationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
      
      if (originationDate >= today) {
        errors.originationDate = 'Origination Date must be in the past';
        hasErrors = true;
      }
    }
    
    // Original Principal Amount is required and must be positive
    if (!formData.originalPrincipalAmount || formData.originalPrincipalAmount <= 0) {
      errors.originalPrincipalAmount = 'Original Principal Amount is required and must be greater than 0';
      hasErrors = true;
    }
    
    // Current Principal Balance is required and must be positive
    if (!formData.currentPrincipalBalance || formData.currentPrincipalBalance <= 0) {
      errors.currentPrincipalBalance = 'Current Principal Balance is required and must be greater than 0';
      hasErrors = true;
    }
    
    // Interest Rate is required and must be between 0-100%
    if (formData.interestRatePercent === '' || formData.interestRatePercent === null || formData.interestRatePercent === undefined) {
      errors.interestRatePercent = 'Interest Rate is required';
      hasErrors = true;
    } else if (formData.interestRatePercent < 0 || formData.interestRatePercent > 100) {
      errors.interestRatePercent = 'Interest Rate must be between 0% and 100%';
      hasErrors = true;
    }
    
    // Monthly Payment Amount is required and must be positive
    if (!formData.monthlyPaymentAmount || formData.monthlyPaymentAmount <= 0) {
      errors.monthlyPaymentAmount = 'Monthly Payment Amount is required and must be greater than 0';
      hasErrors = true;
    }
    
    // Delinquency Days at Filing is required and must be non-negative
    if (formData.delinquencyDaysAtFiling === '' || formData.delinquencyDaysAtFiling < 0) {
      errors.delinquencyDaysAtFiling = 'Delinquency Days at Filing is required and must be 0 or greater';
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
      errors.borrowers = 'At least one borrower must be entered';
      hasErrors = true;
    } else {
      formData.borrowers.forEach((borrower, index) => {
        if (!borrower.firstName.trim()) {
          errors[`borrower_${borrower.id}_firstName`] = 'First name is required';
          hasErrors = true;
        } else if (!validNamePattern.test(borrower.firstName.trim())) {
          errors[`borrower_${borrower.id}_firstName`] = 'First name must contain only valid characters (no numbers or invalid symbols)';
          hasErrors = true;
        }
        
        if (!borrower.lastName.trim()) {
          errors[`borrower_${borrower.id}_lastName`] = 'Last name is required';
          hasErrors = true;
        } else if (!validNamePattern.test(borrower.lastName.trim())) {
          errors[`borrower_${borrower.id}_lastName`] = 'Last name must contain only valid characters (no numbers or invalid symbols)';
          hasErrors = true;
        }
        
        // Validate middle name if provided
        if (borrower.middleName.trim() && !validNamePattern.test(borrower.middleName.trim())) {
          errors[`borrower_${borrower.id}_middleName`] = 'Middle name must contain only valid characters (no numbers or invalid symbols)';
          hasErrors = true;
        }
        
        // Validate suffix if provided
        if (borrower.suffix.trim() && !validNamePattern.test(borrower.suffix.trim())) {
          errors[`borrower_${borrower.id}_suffix`] = 'Suffix must contain only valid characters (no numbers or invalid symbols)';
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
      errors.noticeSent = 'Please select whether the Right-to-Cure notice was sent';
      hasErrors = true;
    }
    
    if (formData.noticeSent === true) {
      // Validate notice date
      if (!formData.noticeDate.trim()) {
        errors.noticeDate = 'Notice date is required';
        hasErrors = true;
      }
      
      // Validate amount in default
      if (!formData.amountInDefault || formData.amountInDefault <= 0) {
        errors.amountInDefault = 'Amount in default is required and must be greater than 0';
        hasErrors = true;
      }
      
      // Validate days delinquent
      if (formData.daysDelinquentAtNotice === '' || formData.daysDelinquentAtNotice < 0) {
        errors.daysDelinquentAtNotice = 'Days delinquent is required and must be 0 or greater';
        hasErrors = true;
      }
      
      // Validate cure expiration date
      if (!formData.cureExpirationDate.trim()) {
        errors.cureExpirationDate = 'Cure expiration date is required';
        hasErrors = true;
      } else if (formData.noticeDate && formData.cureExpirationDate && new Date(formData.cureExpirationDate) <= new Date(formData.noticeDate)) {
        errors.cureExpirationDate = 'Cure expiration date must be after notice date';
        hasErrors = true;
      }
      
      // Validate notice address
      if (!formData.noticeAddressStreet1.trim()) {
        errors.noticeAddressStreet1 = 'Notice mailing address is required';
        hasErrors = true;
      }
      
      if (!formData.noticeAddressCity.trim()) {
        errors.noticeAddressCity = 'City is required';
        hasErrors = true;
      }
      
      if (!formData.noticeAddressState.trim()) {
        errors.noticeAddressState = 'State is required';
        hasErrors = true;
      }
      
      if (!formData.noticeAddressZip.trim()) {
        errors.noticeAddressZip = 'ZIP code is required';
        hasErrors = true;
      }
    } else if (formData.noticeSent === false) {
      // Validate acceleration date for non-notice path
      if (!formData.manualOverrideReason.trim()) {
        errors.manualOverrideReason = 'Acceleration date is required';
        hasErrors = true;
      } else {
        const accelerationDate = new Date(formData.manualOverrideReason);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
        
        if (accelerationDate >= today) {
          errors.manualOverrideReason = 'Acceleration date must be in the past';
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
    if (formData.certainMortgageLoan === null || formData.certainMortgageLoan === undefined) {
      errors.certainMortgageLoan = 'Please select whether this loan qualifies as a certain mortgage loan';
      hasErrors = true;
    }
    
    // If loan qualifies as certain mortgage loan, compliance affidavit is required
    if (formData.certainMortgageLoan === true) {
      if (!formData.form35bComplianceAffidavitPdf || formData.form35bComplianceAffidavitPdf === null || formData.form35bComplianceAffidavitPdf === undefined) {
        errors.form35bComplianceAffidavitPdf = 'Form 35B Compliance Affidavit is required for certain mortgage loans';
        hasErrors = true;
      } else {
        // Validate file type
        const fileName = formData.form35bComplianceAffidavitPdf.name;
        if (!fileName || !fileName.toLowerCase().endsWith('.pdf')) {
          errors.form35bComplianceAffidavitPdf = 'File must be in PDF format';
          hasErrors = true;
        }
      }
      
      // Validate affiant details for certain mortgage loans
      if (!formData.affiantName || formData.affiantName.trim() === '') {
        errors.affiantName = 'Affiant Name is required for certain mortgage loans';
        hasErrors = true;
      }
      
      if (!formData.affiantTitle || formData.affiantTitle.trim() === '') {
        errors.affiantTitle = 'Affiant Title is required for certain mortgage loans';
        hasErrors = true;
      }
      
      if (!formData.affidavitExecutionDate || formData.affidavitExecutionDate.trim() === '') {
        errors.affidavitExecutionDate = 'Date of Affidavit Execution is required for certain mortgage loans';
        hasErrors = true;
      }
    }
    
    // Validate affiant details if any affidavit is uploaded (regardless of certain mortgage loan status)
    if (formData.form35bComplianceAffidavitPdf || formData.form35bNonApplicabilityAffidavitPdf) {
      if (!formData.affiantName || formData.affiantName.trim() === '') {
        errors.affiantName = 'Affiant Name is required when an affidavit is uploaded';
        hasErrors = true;
      }
      
      if (!formData.affiantTitle || formData.affiantTitle.trim() === '') {
        errors.affiantTitle = 'Affiant Title is required when an affidavit is uploaded';
        hasErrors = true;
      }
      
      if (!formData.affidavitExecutionDate || formData.affidavitExecutionDate.trim() === '') {
        errors.affidavitExecutionDate = 'Date of Affidavit Execution is required when an affidavit is uploaded';
        hasErrors = true;
      }
    }
    
    // If loan does not qualify, non-applicability affidavit is optional
    // No validation needed for optional field

    setFieldErrors(errors);
    return { hasErrors, errors };
  };

  // Validate Filing Entity details
  const validateFilingEntity = () => {
    const errors = {};
    let hasErrors = false;
    
    // Validate required fields
    if (!formData.filingEntityLegalName || formData.filingEntityLegalName.trim() === '') {
      errors.filingEntityLegalName = 'Filing Entity Legal Name is required';
      hasErrors = true;
    }
    
    // Filing Entity Role is read-only from profile, no validation needed
    
    if (!formData.filingEntityStreet1 || formData.filingEntityStreet1.trim() === '') {
      errors.filingEntityStreet1 = 'Street Address Line 1 is required';
      hasErrors = true;
    }
    
    if (!formData.filingEntityCity || formData.filingEntityCity.trim() === '') {
      errors.filingEntityCity = 'City is required';
      hasErrors = true;
    }
    
    if (!formData.filingEntityState || formData.filingEntityState.trim() === '') {
      errors.filingEntityState = 'State is required';
      hasErrors = true;
    }
    
    if (!formData.filingEntityZip || formData.filingEntityZip.trim() === '') {
      errors.filingEntityZip = 'ZIP Code is required';
      hasErrors = true;
    }
    
    if (!formData.filingContactName || formData.filingContactName.trim() === '') {
      errors.filingContactName = 'Filing Contact Name is required';
      hasErrors = true;
    }
    
    if (!formData.filingContactEmail || formData.filingContactEmail.trim() === '') {
      errors.filingContactEmail = 'Filing Contact Email is required';
      hasErrors = true;
    } else {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.filingContactEmail)) {
        errors.filingContactEmail = 'Please enter a valid email address';
        hasErrors = true;
      }
    }
    
    if (!formData.filingContactPhone || formData.filingContactPhone.trim() === '') {
      errors.filingContactPhone = 'Filing Contact Phone is required';
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
      if (!assignee.assigneeName || assignee.assigneeName.trim() === '') {
        errors[`loanAssignees.${index}.assigneeName`] = 'Assignee Name is required';
        hasErrors = true;
      }
      
      if (!assignee.assigneeTypeId || assignee.assigneeTypeId.trim() === '') {
        errors[`loanAssignees.${index}.assigneeTypeId`] = 'Assignee Type is required';
        hasErrors = true;
      }
      
      if (!assignee.assigneeRoleId || assignee.assigneeRoleId.trim() === '') {
        errors[`loanAssignees.${index}.assigneeRoleId`] = 'Assignee Role is required';
        hasErrors = true;
      }
      
      if (!assignee.street1 || assignee.street1.trim() === '') {
        errors[`loanAssignees.${index}.street1`] = 'Street Address is required';
        hasErrors = true;
      }
      
      if (!assignee.city || assignee.city.trim() === '') {
        errors[`loanAssignees.${index}.city`] = 'City is required';
        hasErrors = true;
      }
      
      if (!assignee.addressState || assignee.addressState.trim() === '') {
        errors[`loanAssignees.${index}.addressState`] = 'State is required';
        hasErrors = true;
      }
      
      if (!assignee.zip || assignee.zip.trim() === '') {
        errors[`loanAssignees.${index}.zip`] = 'ZIP Code is required';
        hasErrors = true;
      }
    });

    setFieldErrors(errors);
    return { hasErrors, errors };
  };

  // Validate borrower address with Google Geocoding API
  const validateBorrowerAddressWithGeocoding = async (borrowerId) => {
    const borrower = formData.borrowers.find(b => b.id === borrowerId);
    if (!borrower || !borrower.mailingStreet1 || !borrower.mailingCity || !borrower.mailingState || !borrower.mailingZip) {
      return { isValid: false, error: 'Incomplete address information' };
    }

    if (!geocoderRef.current) {
      return { isValid: false, error: 'Geocoding service not available' };
    }

    return new Promise((resolve) => {
      const address = `${borrower.mailingStreet1}, ${borrower.mailingCity}, ${borrower.mailingState} ${borrower.mailingZip}`;
      
      geocoderRef.current.geocode({ address }, (results, status) => {
        if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
          const result = results[0];
          const addressComponents = result.address_components;
          
          let foundCity = false;
          let foundState = false;
          let foundZip = false;
          let actualState = '';
          
          addressComponents.forEach(component => {
            const types = component.types;
            if (types.includes('locality') || types.includes('administrative_area_level_2')) {
              if (component.long_name.toLowerCase().includes(borrower.mailingCity.toLowerCase())) {
                foundCity = true;
              }
            }
            if (types.includes('administrative_area_level_1')) {
              actualState = component.short_name;
              if (component.short_name === 'MA') {
                foundState = true;
              }
            }
            if (types.includes('postal_code')) {
              if (component.long_name === borrower.mailingZip) {
                foundZip = true;
              }
            }
          });

          if (actualState && actualState !== 'MA') {
            setBorrowerAddressValidationErrors(prev => ({
              ...prev,
              [`borrower_${borrowerId}_mailingAddress`]: `This address is in ${actualState}, but this system only accepts Massachusetts addresses.`
            }));
            resolve({ isValid: false, error: 'Address is not in Massachusetts' });
            return;
          }

          if (!foundCity || !foundState || !foundZip) {
            const errorMessage = 'Address validation failed. Please ensure the address is complete and accurate.';
            setBorrowerAddressValidationErrors(prev => ({
              ...prev,
              [`borrower_${borrowerId}_mailingAddress`]: errorMessage
            }));
            resolve({ isValid: false, error: errorMessage });
            return;
          }

          setBorrowerAddressValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[`borrower_${borrowerId}_mailingAddress`];
            return newErrors;
          });
          resolve({ isValid: true });
        } else {
          const errorMessage = 'Invalid address. Please enter a valid address.';
          setBorrowerAddressValidationErrors(prev => ({
            ...prev,
            [`borrower_${borrowerId}_mailingAddress`]: errorMessage
          }));
          resolve({ isValid: false, error: errorMessage });
        }
      });
    });
  };

  // Validate notice address with Google Geocoding API
  const validateNoticeAddressWithGeocoding = async () => {
    if (!formData.noticeAddressStreet1 || !formData.noticeAddressCity || !formData.noticeAddressState || !formData.noticeAddressZip) {
      return { isValid: false, error: 'Incomplete address information' };
    }

    if (!geocoderRef.current) {
      return { isValid: false, error: 'Geocoding service not available' };
    }

    return new Promise((resolve) => {
      const address = `${formData.noticeAddressStreet1}, ${formData.noticeAddressCity}, ${formData.noticeAddressState} ${formData.noticeAddressZip}`;
      
      geocoderRef.current.geocode({ address }, (results, status) => {
        if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
          const result = results[0];
          const addressComponents = result.address_components;
          
          let foundCity = false;
          let foundState = false;
          let foundZip = false;
          let actualState = '';
          
          addressComponents.forEach(component => {
            const types = component.types;
            if (types.includes('locality') || types.includes('administrative_area_level_2')) {
              if (component.long_name.toLowerCase().includes(formData.noticeAddressCity.toLowerCase())) {
                foundCity = true;
              }
            }
            if (types.includes('administrative_area_level_1')) {
              actualState = component.short_name;
              if (component.short_name === 'MA') {
                foundState = true;
              }
            }
            if (types.includes('postal_code')) {
              if (component.long_name === formData.noticeAddressZip) {
                foundZip = true;
              }
            }
          });

          if (actualState && actualState !== 'MA') {
            setNoticeAddressValidationErrors(prev => ({
              ...prev,
              noticeAddress: `This address is in ${actualState}, but this system only accepts Massachusetts addresses.`
            }));
            resolve({ isValid: false, error: 'Address is not in Massachusetts' });
            return;
          }

          if (!foundCity || !foundState || !foundZip) {
            const errorMessage = 'Address validation failed. Please ensure the address is complete and accurate.';
            setNoticeAddressValidationErrors(prev => ({
              ...prev,
              noticeAddress: errorMessage
            }));
            resolve({ isValid: false, error: errorMessage });
            return;
          }

          setNoticeAddressValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.noticeAddress;
            return newErrors;
          });
          resolve({ isValid: true });
        } else {
          const errorMessage = 'Invalid address. Please enter a valid address.';
          setNoticeAddressValidationErrors(prev => ({
            ...prev,
            noticeAddress: errorMessage
          }));
          resolve({ isValid: false, error: errorMessage });
        }
      });
    });
  };

  // Validate loan assignee address with Google Geocoding API
  const validateLoanAssigneeAddressWithGeocoding = async (assigneeIndex) => {
    const assignee = formData.loanAssignees[assigneeIndex];
    if (!assignee || !assignee.street1 || !assignee.city || !assignee.addressState || !assignee.zip) {
      return { isValid: false, error: 'Incomplete address information' };
    }

    if (!geocoderRef.current) {
      return { isValid: false, error: 'Geocoding service not available' };
    }

    return new Promise((resolve) => {
      const address = `${assignee.street1}, ${assignee.city}, ${assignee.addressState} ${assignee.zip}`;
      
      geocoderRef.current.geocode({ address }, (results, status) => {
        if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
          const result = results[0];
          const addressComponents = result.address_components;
          
          let foundCity = false;
          let foundState = false;
          let foundZip = false;
          let actualState = '';
          
          addressComponents.forEach(component => {
            const types = component.types;
            if (types.includes('locality') || types.includes('administrative_area_level_2')) {
              if (component.long_name.toLowerCase().includes(assignee.city.toLowerCase())) {
                foundCity = true;
              }
            }
            if (types.includes('administrative_area_level_1')) {
              actualState = component.short_name;
              if (component.short_name === 'MA') {
                foundState = true;
              }
            }
            if (types.includes('postal_code')) {
              if (component.long_name === assignee.zip) {
                foundZip = true;
              }
            }
          });

          if (actualState && actualState !== 'MA') {
            setLoanAssigneeAddressValidationErrors(prev => ({
              ...prev,
              [`assignee_${assigneeIndex}_address`]: `This address is in ${actualState}, but this system only accepts Massachusetts addresses.`
            }));
            resolve({ isValid: false, error: 'Address is not in Massachusetts' });
            return;
          }

          if (!foundCity || !foundState || !foundZip) {
            const errorMessage = 'Address validation failed. Please ensure the address is complete and accurate.';
            setLoanAssigneeAddressValidationErrors(prev => ({
              ...prev,
              [`assignee_${assigneeIndex}_address`]: errorMessage
            }));
            resolve({ isValid: false, error: errorMessage });
            return;
          }

          setLoanAssigneeAddressValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[`assignee_${assigneeIndex}_address`];
            return newErrors;
          });
          resolve({ isValid: true });
        } else {
          const errorMessage = 'Invalid address. Please enter a valid address.';
          setLoanAssigneeAddressValidationErrors(prev => ({
            ...prev,
            [`assignee_${assigneeIndex}_address`]: errorMessage
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
        isDraft: true
      };
      
      // In a real application, you would send this to your backend
      console.log('Auto-saving step data:', saveData);
      
      // Store in localStorage for now (in real app, this would be API call)
      const existingDrafts = JSON.parse(localStorage.getItem('petitionDrafts') || '[]');
      const draftIndex = existingDrafts.findIndex(draft => draft.step === currentStep);
      
      if (draftIndex >= 0) {
        existingDrafts[draftIndex] = saveData;
      } else {
        existingDrafts.push(saveData);
      }
      
      localStorage.setItem('petitionDrafts', JSON.stringify(existingDrafts));
      
      setHasSavedDraft(true);
      
    } catch (error) {
      console.error('Error auto-saving step:', error);
      // Don't show error toast for auto-save failures to avoid interrupting user flow
    }
  };

  // Save current step data (draft - no validation required)
  const saveCurrentStep = async () => {
    setIsSaving(true);
    
    try {
      // No validation required for saving drafts - just save the current form data
      // Here you would typically send the data to your API
      // For now, we'll simulate a save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create save data object
      const saveData = {
        step: currentStep,
        formData: formData,
        timestamp: new Date().toISOString(),
        isDraft: true
      };
      
      // In a real application, you would save this to your backend
      console.log('Saving step data as draft:', saveData);
      
      // Store in localStorage for now (in real app, this would be API call)
      const existingDrafts = JSON.parse(localStorage.getItem('petitionDrafts') || '[]');
      const draftIndex = existingDrafts.findIndex(draft => draft.step === currentStep);
      
      if (draftIndex >= 0) {
        existingDrafts[draftIndex] = saveData;
      } else {
        existingDrafts.push(saveData);
      }
      
      localStorage.setItem('petitionDrafts', JSON.stringify(existingDrafts));
      
      setHasSavedDraft(true);
      toast.success(`Step ${currentStep} saved as draft!`);
      
    } catch (error) {
      console.error('Error saving step:', error);
      toast.error("Failed to save step. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const nextStep = async (direction) => {
    const newStep = currentStep + direction;
    
    // Check if user has set filing entity type when trying to proceed from step 4
    if (currentStep === 4 && direction === 1 && !userFilingEntityType) {
      toast.error('Please set your filing entity type in your profile before proceeding.');
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
        setAddressValidationMessage(addressValidationError || 'Address validation failed');
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
        if (borrower.mailingStreet1 && borrower.mailingCity && borrower.mailingState && borrower.mailingZip) {
          const addressValidation = await validateBorrowerAddressWithGeocoding(borrower.id);
          if (!addressValidation.isValid) {
            hasAddressErrors = true;
          }
        }
      }
      
      if (hasAddressErrors) {
        setAddressValidationType('borrower');
        setAddressValidationContext({ hasAddressErrors: true });
        setAddressValidationMessage('One or more borrower addresses could not be validated. Please check the addresses and try again.');
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
      if (formData.noticeSent === true && formData.noticeAddressStreet1 && formData.noticeAddressCity && formData.noticeAddressState && formData.noticeAddressZip) {
        const addressValidation = await validateNoticeAddressWithGeocoding();
        if (!addressValidation.isValid) {
          setAddressValidationType('notice');
          setAddressValidationContext({ addressValidation });
          setAddressValidationMessage(addressValidation.error || 'Notice address validation failed. Please check the address and try again.');
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
        if (assignee.street1 && assignee.city && assignee.addressState && assignee.zip) {
          const addressValidation = await validateLoanAssigneeAddressWithGeocoding(i);
          if (!addressValidation.isValid) {
            hasAddressErrors = true;
          }
        }
      }
      
      if (hasAddressErrors) {
        setAddressValidationType('loanAssignee');
        setAddressValidationContext({ hasAddressErrors: true });
        setAddressValidationMessage('One or more loan assignee addresses could not be validated. Please check the addresses and try again.');
        setShowAddressValidationDialog(true);
        return;
      }
    }

    // Validate Attestation step before proceeding to Review & Submit
    if (currentStep === 8 && direction === 1) {
      // Check if user has signature
      if (!user?.signatureUrl) {
        toast.error('You must upload a digital signature to your profile before proceeding to review.');
        return;
      }
      
      // Check if certification checkbox is checked
      if (!formData.certification_check) {
        toast.error('Please check the Electronic Certification checkbox before proceeding to review.');
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
    setAddressValidationMessage('');
    setAddressValidationType('');
    setAddressValidationContext(null);
    
    // Focus on the appropriate address input field based on type
    if (addressValidationType === 'property' && autocompleteRef.current) {
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
    setAddressValidationMessage('');
    setAddressValidationType('');
    setAddressValidationContext(null);
    
    // Proceed to next step without validation
    const newStep = currentStep + 1;
    if (newStep >= 1 && newStep <= totalSteps) {
      // Auto-save current step before proceeding
      await autoSaveCurrentStep();
      
      setCurrentStep(newStep);
      // Scroll to top on step change for better mobile UX
      window.scrollTo(0, 0);
    }
  };


  const handleSubmit = async (e, isIntentional = false) => {
    e.preventDefault();
    
    console.log('=== HANDLE SUBMIT CALLED ===');
    console.log('Current step:', currentStep);
    console.log('Total steps:', totalSteps);
    console.log('Is intentional submit:', isIntentional);
    
    // Only validate certification if we're actually on the last step and trying to submit
    if (currentStep !== totalSteps || !isIntentional) {
      console.log('Early return - not on last step or not intentional submit');
      return;
    }
    
    if (!formData.certification_check) {
      toast.error("Please certify the petition by checking the certification checkbox.");
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
      const petitionData = {
        ...formData,
        signatures: [
          {
            signerFullName: user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
            signerTitle: user?.role || 'FILIR User',
            signerEmail: user?.email || '',
            esignConsent: true,
            signatureDrawnOrTyped: user?.signatureUrl || '',
            signedAt: new Date().toISOString(),
            signerIp: '', // Will be filled by backend
            otpCode: '' // Will be filled by backend
          }
        ]
      };
      
      // Submit petition using API
      await submitPetition(petitionData);
      
      // Clear petition wizard state and drafts from localStorage after successful submission
      localStorage.removeItem('petitionDrafts');
      
      // Notify parent component that petition was submitted successfully
      if (onPetitionSubmitted) {
        onPetitionSubmitted();
      }
      
      onClose();
      
      // Reload the entire petitions section page
      window.location.reload();
    } catch (error) {
      console.error('Error submitting petition:', error);
      // Error is already handled in the submitPetition function with toast
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2 className="theme-color font-med mb-1">1. Property Details</h2>
            <p className="text-muted small mb-3">Enter the full address and location details of the property subject to foreclosure.</p>
            <div className="row g-3">
              <div className="col-12">
                <label htmlFor="propertyStreet1" className="form-label">
                  Street Address Line 1 *
                  {isAddressVerified && <span className="text-success ms-2">✓ Verified</span>}
                </label>
                {loadError ? (
                  <div>
                <input 
                  type="text" 
                  id="propertyStreet1" 
                  name="propertyStreet1" 
                  className={`form-control ${fieldErrors.propertyStreet1 ? 'is-invalid' : ''}`}
                  value={formData.propertyStreet1}
                  onChange={handleInputChange}
                      placeholder="Enter address manually (Google Maps unavailable)"
                      autoComplete="off"
                    />
                    {fieldErrors.propertyStreet1 && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.propertyStreet1}
                      </div>
                    )}
                    <div className="text-danger small mt-1">
                      ⚠️ Google Maps API failed to load. Please enter address manually.
                    </div>
                  </div>
                ) : isLoaded ? (
                  <div className="position-relative">
                    <input
                      ref={autocompleteRef}
                      type="text"
                      id="propertyStreet1"
                      name="propertyStreet1"
                      className={`form-control ${fieldErrors.propertyStreet1 ? 'is-invalid' : ''}`}
                      value={formData.propertyStreet1}
                      onChange={(e) => {
                        handleInputChange(e);
                        handleAddressInput(e.target.value);
                      }}
                      onKeyDown={handleKeyDown}
                      onBlur={() => {
                        // Delay hiding suggestions to allow click events
                        setTimeout(() => setShowPredictions(false), 300);
                      }}
                      onFocus={() => {
                        if (predictions.length > 0) {
                          setShowPredictions(true);
                        }
                      }}
                      placeholder="Start typing an address..."
                      autoComplete="off"
                    />
                    
                    {/* Loading indicator */}
                    {isLoadingPredictions && (
                      <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                        <div className="spinner-border spinner-border-sm text-muted" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Address suggestions dropdown */}
                    {showPredictions && predictions.length > 0 && (
                      <div className="position-absolute w-100 bg-white border border-top-0 rounded-bottom shadow-sm" style={{ zIndex: 1050, maxHeight: '200px', overflowY: 'auto' }}>
                        {predictions.map((prediction, index) => (
                          <div
                            key={prediction.place_id}
                            className={`px-3 py-2 cursor-pointer border-bottom ${
                              index === selectedPredictionIndex ? 'bg-primary text-white' : 'hover-bg-light'
                            }`}
                            onMouseDown={() => selectPrediction(prediction.place_id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="fw-medium">{prediction.structured_formatting.main_text}</div>
                            <div className="small text-muted">{prediction.structured_formatting.secondary_text}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Field error display */}
                    {fieldErrors.propertyStreet1 && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.propertyStreet1}
                      </div>
                    )}
                    
                    {/* Address validation error */}
                    {addressValidationError && (
                      <div className="text-danger small mt-2">
                        {addressValidationError}
                      </div>
                    )}
                    
                    {/* Address validation loading */}
                    {isValidatingAddress && (
                      <div className="text-muted small mt-2">
                        Validating address...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="form-control d-flex align-items-center justify-content-center" style={{ height: '38px' }}>
                    <div className="spinner-border spinner-border-sm text-muted me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <span className="text-muted">Loading Google Maps...</span>
                  </div>
                )}
              </div>
              
              <div className="col-12">
                <label htmlFor="propertyStreet2" className="form-label">Street Address Line 2 (Optional)</label>
                <input 
                  type="text" 
                  id="propertyStreet2" 
                  name="propertyStreet2" 
                  className="form-control"
                  value={formData.propertyStreet2}
                  onChange={handleInputChange}
                  placeholder="Apartment, suite, unit, building, floor, etc."
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="propertyCity" className="form-label">City *</label>
                <input 
                  type="text" 
                  id="propertyCity" 
                  name="propertyCity" 
                  className={`form-control ${fieldErrors.propertyCity ? 'is-invalid' : ''}`}
                  value={formData.propertyCity}
                  onChange={handleInputChange}
                  placeholder="Enter city name"
                />
                {fieldErrors.propertyCity && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.propertyCity}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label htmlFor="propertyState" className="form-label">State *</label>
                <select 
                  id="propertyState" 
                  name="propertyState" 
                  className={`form-select ${fieldErrors.propertyState ? 'is-invalid' : ''}`}
                  value={formData.propertyState}
                  onChange={handleInputChange}
                  disabled
                >
                  <option value="MA">Massachusetts (MA)</option>
                </select>
                {fieldErrors.propertyState && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.propertyState}
                  </div>
                )}
                
              </div>
              <div className="col-md-6">
                <label htmlFor="propertyZip" className="form-label">ZIP Code *</label>
                <input 
                  type="text" 
                  id="propertyZip" 
                  name="propertyZip" 
                  pattern="\d{5}(?:-\d{4})?" 
                  className={`form-control ${fieldErrors.propertyZip ? 'is-invalid' : ''}`}
                  value={formData.propertyZip}
                  onChange={handleInputChange}
                  placeholder="12345 or 12345-6789"
                />
                {fieldErrors.propertyZip && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.propertyZip}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label htmlFor="propertyCounty" className="form-label">County (Filing Location) *</label>
                <input 
                  type="text" 
                  id="propertyCounty" 
                  name="propertyCounty" 
                  className={`form-control ${fieldErrors.propertyCounty ? 'is-invalid' : ''}`}
                  value={formData.propertyCounty}
                  onChange={handleInputChange}
                  placeholder="Enter county name"
                />
                {fieldErrors.propertyCounty && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.propertyCounty}
                  </div>
                )}
              </div>
              <div className="col-12">
                <label htmlFor="assessorParcelId" className="form-label">Assessor Parcel ID (Optional)</label>
                <input 
                  type="text" 
                  id="assessorParcelId" 
                  name="assessorParcelId" 
                  className="form-control"
                  value={formData.assessorParcelId}
                  onChange={handleInputChange}
                  placeholder="Enter assessor parcel ID"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h2 className="theme-color font-med mb-1">2. Loan Details</h2>
            <p className="text-muted small mb-3">Provide the key financial information for the loan. <span className="fw-semibold text-success">MERS Integration:</span> System validates Loan Account Number.</p>
            
            {commonDataError && (
              <div className="alert alert-warning" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {commonDataError}
              </div>
            )}
            
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="minNumber" className="form-label">MIN Number *</label>
                <input 
                  type="text" 
                  id="minNumber" 
                  name="minNumber" 
                  className={`form-control ${fieldErrors.minNumber ? 'is-invalid' : ''}`}
                  value={formData.minNumber}
                  onChange={handleInputChange}
                  placeholder="Enter MIN number"
                />
                {fieldErrors.minNumber && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.minNumber}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label htmlFor="loanNumber" className="form-label">Loan Number *</label>
                <input 
                  type="text" 
                  id="loanNumber" 
                  name="loanNumber" 
                  className={`form-control ${fieldErrors.loanNumber ? 'is-invalid' : ''}`}
                  value={formData.loanNumber}
                  onChange={handleInputChange}
                  placeholder="Enter loan number"
                />
                {fieldErrors.loanNumber && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.loanNumber}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label htmlFor="petitionLoanTypeId" className="form-label">Loan Type *</label>
                <select 
                  id="petitionLoanTypeId" 
                  name="petitionLoanTypeId" 
                  className={`form-select ${fieldErrors.petitionLoanTypeId ? 'is-invalid' : ''}`}
                  value={formData.petitionLoanTypeId}
                  onChange={handleInputChange}
                  disabled={commonDataLoading}
                >
                  <option value="">Select Loan Type</option>
                  {getLoanTypes().map(loanType => (
                    <option key={loanType.id} value={loanType.id}>
                      {loanType.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.petitionLoanTypeId && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.petitionLoanTypeId}
                  </div>
                )}
                {commonDataLoading && (
                  <div className="form-text">
                    <i className="fas fa-spinner fa-spin me-1"></i>
                    Loading loan types...
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label htmlFor="lienPosition" className="form-label">Lien Position *</label>
                <select 
                  id="lienPosition" 
                  name="lienPosition" 
                  className={`form-select ${fieldErrors.lienPosition ? 'is-invalid' : ''}`}
                  value={formData.lienPosition}
                  onChange={handleInputChange}
                  disabled={commonDataLoading}
                >
                  <option value="">Select Position</option>
                  {getLienPositions().map(position => (
                    <option key={position.value} value={position.value}>
                      {position.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.lienPosition && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.lienPosition}
                  </div>
                )}
                {commonDataLoading && (
                  <div className="form-text">
                    <i className="fas fa-spinner fa-spin me-1"></i>
                    Loading lien positions...
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label htmlFor="originationDate" className="form-label">Origination Date *</label>
                <input 
                  type="date" 
                  id="originationDate" 
                  name="originationDate" 
                  className={`form-control ${fieldErrors.originationDate ? 'is-invalid' : ''}`}
                  value={formData.originationDate}
                  onChange={handleInputChange}
                />
                {fieldErrors.originationDate && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.originationDate}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label htmlFor="originalPrincipalAmount" className="form-label">Original Principal Amount ($) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  id="originalPrincipalAmount" 
                  name="originalPrincipalAmount" 
                  className={`form-control ${fieldErrors.originalPrincipalAmount ? 'is-invalid' : ''}`}
                  value={formData.originalPrincipalAmount}
                  onChange={handleInputChange}
                />
                {fieldErrors.originalPrincipalAmount && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.originalPrincipalAmount}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label htmlFor="currentPrincipalBalance" className="form-label">Current Principal Balance ($) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  id="currentPrincipalBalance" 
                  name="currentPrincipalBalance" 
                  className={`form-control ${fieldErrors.currentPrincipalBalance ? 'is-invalid' : ''}`}
                  value={formData.currentPrincipalBalance}
                  onChange={handleInputChange}
                />
                {fieldErrors.currentPrincipalBalance && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.currentPrincipalBalance}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label htmlFor="interestRatePercent" className="form-label">Interest Rate (%) *</label>
                <input 
                  type="number" 
                  step="0.001" 
                  id="interestRatePercent" 
                  name="interestRatePercent" 
                  className={`form-control ${fieldErrors.interestRatePercent ? 'is-invalid' : ''}`}
                  value={formData.interestRatePercent}
                  onChange={handleInputChange}
                />
                {fieldErrors.interestRatePercent && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.interestRatePercent}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label htmlFor="monthlyPaymentAmount" className="form-label">Monthly Payment Amount ($) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  id="monthlyPaymentAmount" 
                  name="monthlyPaymentAmount" 
                  className={`form-control ${fieldErrors.monthlyPaymentAmount ? 'is-invalid' : ''}`}
                  value={formData.monthlyPaymentAmount}
                  onChange={handleInputChange}
                />
                {fieldErrors.monthlyPaymentAmount && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.monthlyPaymentAmount}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label htmlFor="delinquencyDaysAtFiling" className="form-label">Delinquency Days at Filing *</label>
                <input 
                  type="number" 
                  id="delinquencyDaysAtFiling" 
                  name="delinquencyDaysAtFiling" 
                  min="0"
                  className={`form-control ${fieldErrors.delinquencyDaysAtFiling ? 'is-invalid' : ''}`}
                  value={formData.delinquencyDaysAtFiling}
                  onChange={handleInputChange}
                />
                {fieldErrors.delinquencyDaysAtFiling && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.delinquencyDaysAtFiling}
                  </div>
                )}
              </div>
              <div className="col-12">
                <div className="row">
                  <div className="col-md-4">
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="variableRate" 
                        name="variableRate"
                        checked={formData.variableRate}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label" htmlFor="variableRate">
                        Variable Rate
                      </label>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="interestOnly" 
                        name="interestOnly"
                        checked={formData.interestOnly}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label" htmlFor="interestOnly">
                        Interest Only
                      </label>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="negativeAmortization" 
                        name="negativeAmortization"
                        checked={formData.negativeAmortization}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label" htmlFor="negativeAmortization">
                        Negative Amortization
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h2 className="theme-color font-med mb-1">3. Borrower Details</h2>
            <p className="text-muted small mb-3">Enter the full name for each borrower on the loan. At least one borrower is required.</p>
            
            {formData.borrowers.map((borrower, index) => (
              <div key={borrower.id} className="p-3 border rounded bg-light mb-3 position-relative">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-semibold text-dark mb-0 font-base">Borrower {index + 1}</h5>
                  {formData.borrowers.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-sm border-0"
                      style={{ 
                        background: '#dc3545', 
                        color: '#ffffff',
                        border: '1px solid #dc3545',
                        borderRadius: '4px',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onClick={() => removeBorrower(borrower.id)}
                      title="Remove this borrower"
                    >
                      <i className="fas fa-times" style={{ fontSize: '12px' }}></i>
                    </button>
                  )}
                </div>
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label">First Name *</label>
                    <input 
                      type="text" 
                      className={`form-control ${fieldErrors[`borrower_${borrower.id}_firstName`] ? 'is-invalid' : ''}`}
                      value={borrower.firstName}
                      onChange={(e) => {
                        updateBorrower(borrower.id, 'firstName', e.target.value);
                        // Clear field error when user starts typing
                        if (fieldErrors[`borrower_${borrower.id}_firstName`]) {
                          setFieldErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors[`borrower_${borrower.id}_firstName`];
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="Enter first name"
                    />
                    {fieldErrors[`borrower_${borrower.id}_firstName`] && (
                      <div className="text-danger small mt-1">
                        {fieldErrors[`borrower_${borrower.id}_firstName`]}
                      </div>
                    )}
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Middle Name</label>
                    <input 
                      type="text" 
                      className={`form-control ${fieldErrors[`borrower_${borrower.id}_middleName`] ? 'is-invalid' : ''}`}
                      value={borrower.middleName}
                      onChange={(e) => {
                        updateBorrower(borrower.id, 'middleName', e.target.value);
                        // Clear field error when user starts typing
                        if (fieldErrors[`borrower_${borrower.id}_middleName`]) {
                          setFieldErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors[`borrower_${borrower.id}_middleName`];
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="Middle"
                    />
                    {fieldErrors[`borrower_${borrower.id}_middleName`] && (
                      <div className="text-danger small mt-1">
                        {fieldErrors[`borrower_${borrower.id}_middleName`]}
                      </div>
                    )}
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Last Name *</label>
                    <input 
                      type="text" 
                      className={`form-control ${fieldErrors[`borrower_${borrower.id}_lastName`] ? 'is-invalid' : ''}`}
                      value={borrower.lastName}
                      onChange={(e) => {
                        updateBorrower(borrower.id, 'lastName', e.target.value);
                        // Clear field error when user starts typing
                        if (fieldErrors[`borrower_${borrower.id}_lastName`]) {
                          setFieldErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors[`borrower_${borrower.id}_lastName`];
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="Enter last name"
                    />
                    {fieldErrors[`borrower_${borrower.id}_lastName`] && (
                      <div className="text-danger small mt-1">
                        {fieldErrors[`borrower_${borrower.id}_lastName`]}
                      </div>
                    )}
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Suffix</label>
                    <input 
                      type="text" 
                      className={`form-control ${fieldErrors[`borrower_${borrower.id}_suffix`] ? 'is-invalid' : ''}`}
                      value={borrower.suffix}
                      onChange={(e) => {
                        updateBorrower(borrower.id, 'suffix', e.target.value);
                        // Clear field error when user starts typing
                        if (fieldErrors[`borrower_${borrower.id}_suffix`]) {
                          setFieldErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors[`borrower_${borrower.id}_suffix`];
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="Jr, Sr, III"
                    />
                    {fieldErrors[`borrower_${borrower.id}_suffix`] && (
                      <div className="text-danger small mt-1">
                        {fieldErrors[`borrower_${borrower.id}_suffix`]}
                      </div>
                    )}
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Primary Borrower</label>
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="radio" 
                        name="primaryBorrower"
                        checked={borrower.borrowerIsPrimary}
                        onChange={(e) => {
                          // Set all borrowers to not primary first
                          setFormData(prev => ({
                            ...prev,
                            borrowers: prev.borrowers.map(b => ({
                              ...b,
                              borrowerIsPrimary: false
                            }))
                          }));
                          // Then set the selected one as primary
                          updateBorrower(borrower.id, 'borrowerIsPrimary', true);
                        }}
                      />
                      <label className="form-check-label">
                        Primary
                      </label>
                    </div>
                  </div>
                </div>
                <div className="row g-3 mt-2">
                  <div className="col-md-6">
                    <label className="form-label">Mailing Address</label>
                    <div className="position-relative">
                      <input 
                        type="text" 
                        className={`form-control ${borrowerAddressValidationErrors[`borrower_${borrower.id}_mailingAddress`] ? 'is-invalid' : ''}`}
                        value={borrower.mailingStreet1}
                        onChange={(e) => {
                          updateBorrower(borrower.id, 'mailingStreet1', e.target.value);
                          handleBorrowerAddressInput(borrower.id, e.target.value);
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowBorrowerPredictions(prev => ({ ...prev, [borrower.id]: false })), 300);
                        }}
                        onFocus={() => {
                          if (borrowerPredictions[borrower.id] && borrowerPredictions[borrower.id].length > 0) {
                            setShowBorrowerPredictions(prev => ({ ...prev, [borrower.id]: true }));
                          }
                        }}
                        placeholder="Street address"
                        autoComplete="off"
                      />
                      
                      {/* Loading indicator */}
                      {isLoadingBorrowerPredictions[borrower.id] && (
                        <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                          <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Predictions dropdown */}
                      {showBorrowerPredictions[borrower.id] && borrowerPredictions[borrower.id] && borrowerPredictions[borrower.id].length > 0 && (
                        <div className="position-absolute w-100 bg-white border rounded shadow-lg" style={{ zIndex: 1000, top: '100%' }}>
                          {borrowerPredictions[borrower.id].map((prediction, index) => (
                            <div
                              key={prediction.place_id}
                              className="p-2 cursor-pointer hover-bg-light"
                              style={{
                                backgroundColor: selectedBorrowerPredictionIndex[borrower.id] === index ? '#f8f9fa' : 'transparent',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleBorrowerPredictionClick(borrower.id, prediction)}
                              onMouseEnter={() => setSelectedBorrowerPredictionIndex(prev => ({ ...prev, [borrower.id]: index }))}
                            >
                              <div className="d-flex align-items-center">
                                <i className="fas fa-map-marker-alt text-muted me-2"></i>
                                <div>
                                  <div className="fw-medium">{prediction.structured_formatting.main_text}</div>
                                  <div className="text-muted small">{prediction.structured_formatting.secondary_text}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {borrowerAddressValidationErrors[`borrower_${borrower.id}_mailingAddress`] && (
                      <div className="text-danger small mt-1">
                        {borrowerAddressValidationErrors[`borrower_${borrower.id}_mailingAddress`]}
                      </div>
                    )}
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">City</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={borrower.mailingCity}
                      onChange={(e) => updateBorrower(borrower.id, 'mailingCity', e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div className="col-md-1">
                    <label className="form-label">State</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={borrower.mailingState}
                      onChange={(e) => updateBorrower(borrower.id, 'mailingState', e.target.value)}
                      placeholder="MA"
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">ZIP</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={borrower.mailingZip}
                      onChange={(e) => updateBorrower(borrower.id, 'mailingZip', e.target.value)}
                      placeholder="02101"
                    />
                  </div>
                </div>
                <div className="row g-3 mt-2">
                  <div className="col-md-6">
                    <label className="form-label">Phone Number</label>
                    <input 
                      type="tel" 
                      className="form-control"
                      value={borrower.phone}
                      onChange={(e) => updateBorrower(borrower.id, 'phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email" 
                      className="form-control"
                      value={borrower.email}
                      onChange={(e) => updateBorrower(borrower.id, 'email', e.target.value)}
                      placeholder="borrower@example.com"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <div className="text-center">
              <button
                type="button"
                className="dashboard-btn-create"
                onClick={addBorrower}
              >
                <i className="fas fa-plus me-2"></i>
                Add Another Borrower
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <h2 className="theme-color font-med mb-1">4. Filing Entity</h2>
            <p className="text-muted small mb-3">Provide the organization and contact details for the party submitting this petition.</p>
            
            {/* Organization Data Loading Indicator */}
            {organizationLoading && (
              <div className="alert alert-info d-flex align-items-center mb-3">
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <span>Loading organization details...</span>
              </div>
            )}
            
            <div className="row g-3">
              <div className="col-12">
                <label htmlFor="filingEntityLegalName" className="form-label">
                  Filing Entity Legal Name *
                  {organizationData && (
                    <span className="text-success small ms-2">
                      <i className="fas fa-check-circle me-1"></i>Prefilled from organization
                    </span>
                  )}
                </label>
                <input 
                  type="text" 
                  id="filingEntityLegalName" 
                  name="filingEntityLegalName" 
                  className={`form-control form-control-lg ${fieldErrors.filingEntityLegalName ? 'is-invalid' : ''}`}
                  value={formData.filingEntityLegalName}
                  onChange={handleInputChange}
                />
                {fieldErrors.filingEntityLegalName && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.filingEntityLegalName}
                  </div>
                )}
              </div>
              
              {/* Filing Entity Role - Read Only from Profile */}
              <div className="col-12">
                <label htmlFor="filingEntityRole" className="form-label">Filing Entity Role</label>
                {profileLoading ? (
                  <div className="form-control form-control-lg bg-light">
                    <span className="text-muted">Loading...</span>
                  </div>
                ) : userFilingEntityType ? (
                  <div className="form-control form-control-lg bg-light">
                    <span className="text-success">
                      {filingEntityTypes.find(type => type.id === userFilingEntityType)?.name || 'Unknown Type'}
                    </span>
                  </div>
                ) : (
                  <div className="form-control form-control-lg bg-light">
                    <span className="text-muted">
                      <i className="fa fa-exclamation-triangle me-2"></i>
                      Please set your filing entity type in your profile
                    </span>
                  </div>
                )}
              </div>

              {/* Address Fields */}
              <div className="col-12">
                <label htmlFor="filingEntityStreet1" className="form-label">
                  Street Address Line 1 *
                  {organizationData && (
                    <span className="text-success small ms-2">
                      <i className="fas fa-check-circle me-1"></i>Prefilled from organization
                    </span>
                  )}
                </label>
                <input 
                  type="text" 
                  id="filingEntityStreet1" 
                  name="filingEntityStreet1" 
                  className={`form-control ${fieldErrors.filingEntityStreet1 ? 'is-invalid' : ''}`}
                  value={formData.filingEntityStreet1}
                  onChange={handleInputChange}
                />
                {fieldErrors.filingEntityStreet1 && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.filingEntityStreet1}
                  </div>
                )}
              </div>
              
              <div className="col-12">
                <label htmlFor="filingEntityStreet2" className="form-label">Street Address Line 2 (Optional)</label>
                <input 
                  type="text" 
                  id="filingEntityStreet2" 
                  name="filingEntityStreet2" 
                  className="form-control"
                  value={formData.filingEntityStreet2}
                  onChange={handleInputChange}
                  placeholder="Apartment, suite, unit, building, floor, etc."
                />
              </div>
              
              <div className="col-md-4">
                <label htmlFor="filingEntityCity" className="form-label">City *</label>
                <input 
                  type="text" 
                  id="filingEntityCity" 
                  name="filingEntityCity" 
                  className={`form-control ${fieldErrors.filingEntityCity ? 'is-invalid' : ''}`}
                  value={formData.filingEntityCity}
                  onChange={handleInputChange}
                />
                {fieldErrors.filingEntityCity && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.filingEntityCity}
                  </div>
                )}
              </div>
              
              <div className="col-md-4">
                <label htmlFor="filingEntityState" className="form-label">State *</label>
                <input 
                  type="text" 
                  id="filingEntityState" 
                  name="filingEntityState" 
                  className={`form-control ${fieldErrors.filingEntityState ? 'is-invalid' : ''}`}
                  value={formData.filingEntityState}
                  onChange={handleInputChange}
                />
                {fieldErrors.filingEntityState && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.filingEntityState}
                  </div>
                )}
              </div>
              
              <div className="col-md-4">
                <label htmlFor="filingEntityZip" className="form-label">ZIP Code *</label>
                <input 
                  type="text" 
                  id="filingEntityZip" 
                  name="filingEntityZip" 
                  className={`form-control ${fieldErrors.filingEntityZip ? 'is-invalid' : ''}`}
                  value={formData.filingEntityZip}
                  onChange={handleInputChange}
                />
                {fieldErrors.filingEntityZip && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.filingEntityZip}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label htmlFor="filingContactName" className="form-label">
                  Filing Contact Name *
                  {organizationData && (
                    <span className="text-success small ms-2">
                      <i className="fas fa-check-circle me-1"></i>Prefilled from organization
                    </span>
                  )}
                </label>
                <input 
                  type="text" 
                  id="filingContactName" 
                  name="filingContactName" 
                  className={`form-control ${fieldErrors.filingContactName ? 'is-invalid' : ''}`}
                  value={formData.filingContactName}
                  onChange={handleInputChange}
                />
                {fieldErrors.filingContactName && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.filingContactName}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label htmlFor="filingContactPhone" className="form-label">
                  Filing Contact Phone *
                  {organizationData && (
                    <span className="text-success small ms-2">
                      <i className="fas fa-check-circle me-1"></i>Prefilled from organization
                    </span>
                  )}
                </label>
                <input 
                  type="tel" 
                  id="filingContactPhone" 
                  name="filingContactPhone" 
                  className={`form-control ${fieldErrors.filingContactPhone ? 'is-invalid' : ''}`}
                  value={formData.filingContactPhone}
                  onChange={handleInputChange}
                />
                {fieldErrors.filingContactPhone && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.filingContactPhone}
                  </div>
                )}
              </div>
              <div className="col-12">
                <label htmlFor="filingContactEmail" className="form-label">
                  Filing Contact Email *
                  {organizationData && (
                    <span className="text-success small ms-2">
                      <i className="fas fa-check-circle me-1"></i>Prefilled from organization
                    </span>
                  )}
                </label>
                <input 
                  type="email" 
                  id="filingContactEmail" 
                  name="filingContactEmail" 
                  className={`form-control ${fieldErrors.filingContactEmail ? 'is-invalid' : ''}`}
                  value={formData.filingContactEmail}
                  onChange={handleInputChange}
                />
                {fieldErrors.filingContactEmail && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.filingContactEmail}
                  </div>
                )}
              </div>
              <div className="col-md-4">
                <label htmlFor="nmlsLicenseNumber" className="form-label">NMLS License Number</label>
                <input 
                  type="text" 
                  id="nmlsLicenseNumber" 
                  name="nmlsLicenseNumber" 
                  className="form-control"
                  value={formData.nmlsLicenseNumber}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="stateLicenseNumber" className="form-label">State License Number</label>
                <input 
                  type="text" 
                  id="stateLicenseNumber" 
                  name="stateLicenseNumber" 
                  className="form-control"
                  value={formData.stateLicenseNumber}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="stateLicenseState" className="form-label">License State</label>
                <input 
                  type="text" 
                  id="stateLicenseState" 
                  name="stateLicenseState" 
                  className="form-control"
                  value={formData.stateLicenseState}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div>
            <h2 className="theme-color font-med mb-1">5. Right-to-Cure (§35A)</h2>
            <p className="text-muted small mb-3">Enter details proving the §35A notice was properly issued to the borrower.</p>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-bold">Was the Right-to-Cure notice sent? *</label>
                <div className="d-flex gap-4">
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="radio" 
                      id="noticeSentYes" 
                      name="noticeSent"
                      value="yes"
                      checked={formData.noticeSent === true}
                      onChange={(e) => setFormData(prev => ({ ...prev, noticeSent: true }))}
                    />
                    <label className="form-check-label fw-medium" htmlFor="noticeSentYes">
                      Yes
                    </label>
                  </div>
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="radio" 
                      id="noticeSentNo" 
                      name="noticeSent"
                      value="no"
                      checked={formData.noticeSent === false}
                      onChange={(e) => setFormData(prev => ({ ...prev, noticeSent: false }))}
                    />
                    <label className="form-check-label fw-medium" htmlFor="noticeSentNo">
                      No
                    </label>
                  </div>
                </div>
                {fieldErrors.noticeSent && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.noticeSent}
                  </div>
                )}
              </div>
              
              {formData.noticeSent && (
                <>
                  <div className="col-md-6">
                    <label htmlFor="noticeDate" className="form-label">Notice Date *</label>
                    <input 
                      type="date" 
                      id="noticeDate" 
                      name="noticeDate" 
                      className={`form-control ${fieldErrors.noticeDate ? 'is-invalid' : ''}`}
                      value={formData.noticeDate}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.noticeDate && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.noticeDate}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="daysDelinquentAtNotice" className="form-label">Days Delinquent on Notice Date *</label>
                    <input 
                      type="number" 
                      id="daysDelinquentAtNotice" 
                      name="daysDelinquentAtNotice" 
                      min="0" 
                      className={`form-control ${fieldErrors.daysDelinquentAtNotice ? 'is-invalid' : ''}`}
                      value={formData.daysDelinquentAtNotice}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.daysDelinquentAtNotice && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.daysDelinquentAtNotice}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="amountInDefault" className="form-label">Amount in Default ($) *</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      id="amountInDefault" 
                      name="amountInDefault" 
                      className={`form-control ${fieldErrors.amountInDefault ? 'is-invalid' : ''}`}
                      value={formData.amountInDefault}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.amountInDefault && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.amountInDefault}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="cureExpirationDate" className="form-label">Cure Expiration Date *</label>
                    <input 
                      type="date" 
                      id="cureExpirationDate" 
                      name="cureExpirationDate" 
                      className={`form-control ${fieldErrors.cureExpirationDate ? 'is-invalid' : ''}`}
                      value={formData.cureExpirationDate}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.cureExpirationDate && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.cureExpirationDate}
                      </div>
                    )}
                  </div>
                  <div className="col-12">
                    <label htmlFor="noticeAddressStreet1" className="form-label">Notice Mailing Address *</label>
                    <div className="position-relative">
                      <input 
                        type="text" 
                        id="noticeAddressStreet1" 
                        name="noticeAddressStreet1" 
                        className={`form-control ${fieldErrors.noticeAddressStreet1 || noticeAddressValidationErrors.noticeAddress ? 'is-invalid' : ''}`}
                        value={formData.noticeAddressStreet1}
                        onChange={(e) => {
                          handleInputChange(e);
                          handleNoticeAddressInput(e.target.value);
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowNoticePredictions(false), 300);
                        }}
                        onFocus={() => {
                          if (noticePredictions && noticePredictions.length > 0) {
                            setShowNoticePredictions(true);
                          }
                        }}
                        placeholder="Street address"
                        autoComplete="off"
                      />
                      
                      {/* Loading indicator */}
                      {isLoadingNoticePredictions && (
                        <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                          <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Predictions dropdown */}
                      {showNoticePredictions && noticePredictions && noticePredictions.length > 0 && (
                        <div className="position-absolute w-100 bg-white border rounded shadow-lg" style={{ zIndex: 1000, top: '100%' }}>
                          {noticePredictions.map((prediction, index) => (
                            <div
                              key={prediction.place_id}
                              className="p-2 cursor-pointer hover-bg-light"
                              style={{
                                backgroundColor: selectedNoticePredictionIndex === index ? '#f8f9fa' : 'transparent',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleNoticePredictionClick(prediction)}
                              onMouseEnter={() => setSelectedNoticePredictionIndex(index)}
                            >
                              <div className="d-flex align-items-center">
                                <i className="fas fa-map-marker-alt text-muted me-2"></i>
                                <div>
                                  <div className="fw-medium">{prediction.structured_formatting.main_text}</div>
                                  <div className="text-muted small">{prediction.structured_formatting.secondary_text}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {fieldErrors.noticeAddressStreet1 && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.noticeAddressStreet1}
                      </div>
                    )}
                    {noticeAddressValidationErrors.noticeAddress && (
                      <div className="text-danger small mt-1">
                        {noticeAddressValidationErrors.noticeAddress}
                      </div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="noticeAddressCity" className="form-label">City *</label>
                    <input 
                      type="text" 
                      id="noticeAddressCity" 
                      name="noticeAddressCity" 
                      className={`form-control ${fieldErrors.noticeAddressCity ? 'is-invalid' : ''}`}
                      value={formData.noticeAddressCity}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.noticeAddressCity && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.noticeAddressCity}
                      </div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="noticeAddressState" className="form-label">State *</label>
                    <input 
                      type="text" 
                      id="noticeAddressState" 
                      name="noticeAddressState" 
                      className={`form-control ${fieldErrors.noticeAddressState ? 'is-invalid' : ''}`}
                      value={formData.noticeAddressState}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.noticeAddressState && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.noticeAddressState}
                      </div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="noticeAddressZip" className="form-label">ZIP Code *</label>
                    <input 
                      type="text" 
                      id="noticeAddressZip" 
                      name="noticeAddressZip" 
                      className={`form-control ${fieldErrors.noticeAddressZip ? 'is-invalid' : ''}`}
                      value={formData.noticeAddressZip}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.noticeAddressZip && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.noticeAddressZip}
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {formData.noticeSent === false && (
                <div className="col-12">
                  <label htmlFor="manualOverrideReason" className="form-label">Acceleration Date *</label>
                  <input 
                    type="date" 
                    id="manualOverrideReason" 
                    name="manualOverrideReason" 
                    className={`form-control ${fieldErrors.manualOverrideReason ? 'is-invalid' : ''}`}
                    value={formData.manualOverrideReason}
                    onChange={handleInputChange}
                  />
                  {fieldErrors.manualOverrideReason && (
                    <div className="text-danger small mt-1">
                      {fieldErrors.manualOverrideReason}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div>
            <h2 className="theme-color font-med mb-1">6. Form 35B Compliance</h2>
            <p className="text-muted small mb-3">Determine if this loan qualifies as a "certain mortgage loan" and upload the appropriate affidavit.</p>
            <div className="alert alert-info small" role="alert">
              <strong>Examples of "Certain Mortgage Loans"</strong> include Interest-Only Mortgages, Payment-Option or Negative Amortization Loans, High Loan-to-Value Mortgages (e.g., 90%+ with limited documentation), Low-Doc / No-Doc Mortgages, and Subprime Loans.
            </div>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-bold">Does this loan qualify as a "certain mortgage loan"? *</label>
                <div className="d-flex gap-4">
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="radio" 
                      id="certainMortgageLoanYes" 
                      name="certainMortgageLoan"
                      value="yes"
                      checked={formData.certainMortgageLoan === true}
                      onChange={(e) => setFormData(prev => ({ ...prev, certainMortgageLoan: true }))}
                    />
                    <label className="form-check-label fw-medium" htmlFor="certainMortgageLoanYes">
                      Yes
                    </label>
                  </div>
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="radio" 
                      id="certainMortgageLoanNo" 
                      name="certainMortgageLoan"
                      value="no"
                      checked={formData.certainMortgageLoan === false}
                      onChange={(e) => setFormData(prev => ({ ...prev, certainMortgageLoan: false }))}
                    />
                    <label className="form-check-label fw-medium" htmlFor="certainMortgageLoanNo">
                      No
                    </label>
                  </div>
                </div>
                {fieldErrors.certainMortgageLoan && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.certainMortgageLoan}
                  </div>
                )}
              </div>
              
              {formData.certainMortgageLoan === true && (
                <>
                  <div className="col-12">
                    <label htmlFor="form35bComplianceAffidavitPdf" className="form-label">Upload Form 35B Compliance Affidavit (PDF only) *</label>
                    
                    {!formData.form35bComplianceAffidavitPdf ? (
                      <input 
                        type="file" 
                        id="form35bComplianceAffidavitPdf" 
                        name="form35bComplianceAffidavitPdf" 
                        accept=".pdf" 
                        className={`form-control ${fieldErrors.form35bComplianceAffidavitPdf ? 'is-invalid' : ''}`}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <div className="p-3 bg-light rounded border d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                          <i className="fas fa-file-pdf text-danger me-2"></i>
                          <span className="text-muted">
                            {formData.form35bComplianceAffidavitPdf.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger p-1"
                          onClick={() => handleRemoveFile('form35bComplianceAffidavitPdf')}
                          title="Remove file"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    )}
                    
                    {fieldErrors.form35bComplianceAffidavitPdf && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.form35bComplianceAffidavitPdf}
                      </div>
                    )}
                    <div className="form-text">Required for certain mortgage loans. File must be in PDF format.</div>
                  </div>
                </>
              )}
              
              {formData.certainMortgageLoan === false && (
                <div className="col-12">
                  <label htmlFor="form35bNonApplicabilityAffidavitPdf" className="form-label">Upload Form 35B Non-Applicability Affidavit (PDF only) - Optional</label>
                  
                  {!formData.form35bNonApplicabilityAffidavitPdf ? (
                    <input 
                      type="file" 
                      id="form35bNonApplicabilityAffidavitPdf" 
                      name="form35bNonApplicabilityAffidavitPdf" 
                      accept=".pdf" 
                      className="form-control"
                      onChange={handleInputChange}
                    />
                  ) : (
                    <div className="p-3 bg-light rounded border d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <i className="fas fa-file-pdf text-danger me-2"></i>
                        <span className="text-muted">
                          {formData.form35bNonApplicabilityAffidavitPdf.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger p-1"
                        onClick={() => handleRemoveFile('form35bNonApplicabilityAffidavitPdf')}
                        title="Remove file"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  )}
                  
                  <div className="form-text">Optional for loans that do not qualify as certain mortgage loans.</div>
                </div>
              )}
              
              {/* Show affiant fields if any affidavit is uploaded */}
              {(formData.form35bComplianceAffidavitPdf || formData.form35bNonApplicabilityAffidavitPdf) && (
                <>
                  <div className="col-12">
                    <hr className="my-3" />
                    <h6 className="text-muted mb-3">Affidavit Details</h6>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="affiantName" className="form-label">Affiant Name *</label>
                    <input 
                      type="text" 
                      id="affiantName" 
                      name="affiantName" 
                      className={`form-control ${fieldErrors.affiantName ? 'is-invalid' : ''}`}
                      value={formData.affiantName}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.affiantName && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.affiantName}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="affiantTitle" className="form-label">Affiant Title *</label>
                    <input 
                      type="text" 
                      id="affiantTitle" 
                      name="affiantTitle" 
                      className={`form-control ${fieldErrors.affiantTitle ? 'is-invalid' : ''}`}
                      value={formData.affiantTitle}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.affiantTitle && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.affiantTitle}
                      </div>
                    )}
                  </div>
                  <div className="col-12">
                    <label htmlFor="affidavitExecutionDate" className="form-label">Date of Affidavit Execution *</label>
                    <input 
                      type="date" 
                      id="affidavitExecutionDate" 
                      name="affidavitExecutionDate" 
                      className={`form-control ${fieldErrors.affidavitExecutionDate ? 'is-invalid' : ''}`}
                      value={formData.affidavitExecutionDate}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.affidavitExecutionDate && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.affidavitExecutionDate}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 7:
        return (
          <div>
            <h2 className="theme-color font-med mb-1">7. Loan Assignees</h2>
            <p className="text-muted small mb-3">List any prior holders or assignees of the loan.</p>
            
            {commonDataError && (
              <div className="alert alert-warning" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {commonDataError}
              </div>
            )}
            
            {formData.loanAssignees.map((assignee, index) => (
              <div key={index} className="p-3 border rounded bg-light mb-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-semibold text-dark mb-0">Assignee {index + 1}</h5>
                  {formData.loanAssignees.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => removeLoanAssignee(index)}
                      title="Remove this assignee"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Assignee Name *</label>
                    <input 
                      type="text" 
                      className={`form-control ${fieldErrors[`loanAssignees.${index}.assigneeName`] ? 'is-invalid' : ''}`}
                      value={assignee.assigneeName}
                      onChange={(e) => updateLoanAssignee(index, 'assigneeName', e.target.value)}
                      placeholder="Enter assignee name"
                    />
                    {fieldErrors[`loanAssignees.${index}.assigneeName`] && (
                      <div className="text-danger small mt-1">
                        {fieldErrors[`loanAssignees.${index}.assigneeName`]}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Assignee Type *</label>
                    <select 
                      className={`form-select ${fieldErrors[`loanAssignees.${index}.assigneeTypeId`] ? 'is-invalid' : ''}`}
                      value={assignee.assigneeTypeId}
                      onChange={(e) => updateLoanAssignee(index, 'assigneeTypeId', e.target.value)}
                      disabled={commonDataLoading}
                    >
                      <option value="">Select Type</option>
                      {getAssigneeTypes().map(type => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors[`loanAssignees.${index}.assigneeTypeId`] && (
                      <div className="text-danger small mt-1">
                        {fieldErrors[`loanAssignees.${index}.assigneeTypeId`]}
                      </div>
                    )}
                    {commonDataLoading && (
                      <div className="form-text">
                        <i className="fas fa-spinner fa-spin me-1"></i>
                        Loading assignee types...
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Assignee Role *</label>
                    <select 
                      className={`form-select ${fieldErrors[`loanAssignees.${index}.assigneeRoleId`] ? 'is-invalid' : ''}`}
                      value={assignee.assigneeRoleId}
                      onChange={(e) => updateLoanAssignee(index, 'assigneeRoleId', e.target.value)}
                      disabled={commonDataLoading}
                    >
                      <option value="">Select Role</option>
                      {getAssigneeRoles().map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors[`loanAssignees.${index}.assigneeRoleId`] && (
                      <div className="text-danger small mt-1">
                        {fieldErrors[`loanAssignees.${index}.assigneeRoleId`]}
                      </div>
                    )}
                    {commonDataLoading && (
                      <div className="form-text">
                        <i className="fas fa-spinner fa-spin me-1"></i>
                        Loading assignee roles...
                      </div>
                    )}
                  </div>
                  <div className="col-12">
                    <label className="form-label">Street Address Line 1 *</label>
                    <div className="position-relative">
                      <input 
                        type="text" 
                        className={`form-control ${fieldErrors[`loanAssignees.${index}.street1`] || loanAssigneeAddressValidationErrors[`assignee_${index}_address`] ? 'is-invalid' : ''}`}
                        value={assignee.street1}
                        onChange={(e) => {
                          updateLoanAssignee(index, 'street1', e.target.value);
                          handleLoanAssigneeAddressInput(index, e.target.value);
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowLoanAssigneePredictions(prev => ({ ...prev, [index]: false })), 300);
                        }}
                        onFocus={() => {
                          if (loanAssigneePredictions[index] && loanAssigneePredictions[index].length > 0) {
                            setShowLoanAssigneePredictions(prev => ({ ...prev, [index]: true }));
                          }
                        }}
                        placeholder="Enter street address"
                        autoComplete="off"
                      />
                      
                      {/* Loading indicator */}
                      {isLoadingLoanAssigneePredictions[index] && (
                        <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                          <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Predictions dropdown */}
                      {showLoanAssigneePredictions[index] && loanAssigneePredictions[index] && loanAssigneePredictions[index].length > 0 && (
                        <div className="position-absolute w-100 bg-white border rounded shadow-lg" style={{ zIndex: 1000, top: '100%' }}>
                          {loanAssigneePredictions[index].map((prediction, predIndex) => (
                            <div
                              key={prediction.place_id}
                              className="p-2 cursor-pointer hover-bg-light"
                              style={{
                                backgroundColor: selectedLoanAssigneePredictionIndex[index] === predIndex ? '#f8f9fa' : 'transparent',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleLoanAssigneePredictionClick(index, prediction)}
                              onMouseEnter={() => setSelectedLoanAssigneePredictionIndex(prev => ({ ...prev, [index]: predIndex }))}
                            >
                              <div className="d-flex align-items-center">
                                <i className="fas fa-map-marker-alt text-muted me-2"></i>
                                <div>
                                  <div className="fw-medium">{prediction.structured_formatting.main_text}</div>
                                  <div className="text-muted small">{prediction.structured_formatting.secondary_text}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {fieldErrors[`loanAssignees.${index}.street1`] && (
                      <div className="text-danger small mt-1">
                        {fieldErrors[`loanAssignees.${index}.street1`]}
                      </div>
                    )}
                    {loanAssigneeAddressValidationErrors[`assignee_${index}_address`] && (
                      <div className="text-danger small mt-1">
                        {loanAssigneeAddressValidationErrors[`assignee_${index}_address`]}
                      </div>
                    )}
                  </div>
                  <div className="col-12">
                    <label className="form-label">Street Address Line 2 (Optional)</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={assignee.street2}
                      onChange={(e) => updateLoanAssignee(index, 'street2', e.target.value)}
                      placeholder="Apartment, suite, unit, building, floor, etc."
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">City *</label>
                    <input 
                      type="text" 
                      className={`form-control ${fieldErrors[`loanAssignees.${index}.city`] ? 'is-invalid' : ''}`}
                      value={assignee.city}
                      onChange={(e) => updateLoanAssignee(index, 'city', e.target.value)}
                      placeholder="Enter city"
                    />
                    {fieldErrors[`loanAssignees.${index}.city`] && (
                      <div className="text-danger small mt-1">
                        {fieldErrors[`loanAssignees.${index}.city`]}
                      </div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">State *</label>
                    <input 
                      type="text" 
                      className={`form-control ${fieldErrors[`loanAssignees.${index}.addressState`] ? 'is-invalid' : ''}`}
                      value={assignee.addressState}
                      onChange={(e) => updateLoanAssignee(index, 'addressState', e.target.value)}
                      placeholder="Enter state"
                    />
                    {fieldErrors[`loanAssignees.${index}.addressState`] && (
                      <div className="text-danger small mt-1">
                        {fieldErrors[`loanAssignees.${index}.addressState`]}
                      </div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">ZIP Code *</label>
                    <input 
                      type="text" 
                      className={`form-control ${fieldErrors[`loanAssignees.${index}.zip`] ? 'is-invalid' : ''}`}
                      value={assignee.zip}
                      onChange={(e) => updateLoanAssignee(index, 'zip', e.target.value)}
                      placeholder="Enter ZIP code"
                    />
                    {fieldErrors[`loanAssignees.${index}.zip`] && (
                      <div className="text-danger small mt-1">
                        {fieldErrors[`loanAssignees.${index}.zip`]}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">License Number (Optional)</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={assignee.licenseNumber}
                      onChange={(e) => updateLoanAssignee(index, 'licenseNumber', e.target.value)}
                      placeholder="Enter license number"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">License State (Optional)</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={assignee.licenseState}
                      onChange={(e) => updateLoanAssignee(index, 'licenseState', e.target.value)}
                      placeholder="Enter license state"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <div className="text-center">
              <button
                type="button"
                className="dashboard-btn-create"
                onClick={addLoanAssignee}
              >
                <i className="fas fa-plus me-2"></i>
                Add Another Assignee
              </button>
            </div>
          </div>
        );

      case 8:
        return (
          <div>
            <h2 className="theme-color font-med mb-1">8. Petition Attestation & Certification</h2>
            <p className="text-muted small mb-3">By completing this section, you formally certify the accuracy and completeness of the entire petition.</p>
            <div className="p-4 border border-warning bg-warning-subtle rounded mb-4">
              <h5 className="fw-bold font-base mb-3">Attester Details</h5>
              <div className="row g-3">
                <div className="col-md-4">
                  <label htmlFor="attester_first_name" className="form-label">First Name</label>
                  <input 
                    type="text" 
                    id="attester_first_name" 
                    name="attester_first_name" 
                    className="form-control"
                    value={formData.attester_first_name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-4">
                  <label htmlFor="attester_middle_initial" className="form-label">Middle Initial (Optional)</label>
                  <input 
                    type="text" 
                    id="attester_middle_initial" 
                    name="attester_middle_initial" 
                    maxLength="1" 
                    className="form-control"
                    value={formData.attester_middle_initial}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-4">
                  <label htmlFor="attester_last_name" className="form-label">Last Name</label>
                  <input 
                    type="text" 
                    id="attester_last_name" 
                    name="attester_last_name" 
                    className="form-control"
                    value={formData.attester_last_name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Digital Signature Section */}
            {user?.signatureUrl && (
              <div className="p-4 border border-info bg-info-subtle rounded mb-4">
                <h5 className="fw-bold font-base mb-3">
                  <i className="fas fa-signature me-2"></i>
                  Digital Signature
                </h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Signature Preview</label>
                    <div className="signature-preview-container p-3 border rounded bg-light">
                      <img 
                        src={user.signatureUrl} 
                        alt="Digital Signature" 
                        className="signature-preview-img"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100px',
                          objectFit: 'contain',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          backgroundColor: 'white'
                        }}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Signature Status</label>
                    <p className="fw-medium mb-0">
                      <span className="badge bg-success fs-6">
                        <i className="fa-solid fa-check-circle me-1"></i>
                        Available
                      </span>
                    </p>
                    <div className="mt-2">
                      <small className="text-muted">
                        <i className="fa-solid fa-user me-1"></i>
                        Signer: {user.fullName || `${user.firstName} ${user.lastName}`}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Digital Signature Requirement */}
            {!user?.signatureUrl ? (
              <div className="p-4 border border-danger bg-danger-subtle rounded mb-4">
                <div className="d-flex align-items-center">
                  <i className="fas fa-exclamation-triangle text-danger me-3" style={{ fontSize: '24px' }}></i>
                  <div className="flex-grow-1">
                    <h5 className="fw-bold text-danger mb-2">Digital Signature Required</h5>
                    <p className="mb-3">You must upload a digital signature to your profile before you can proceed to review and submit the petition.</p>
                    <button
                      type="button"
                      className="dashboard-btn-create"
                      onClick={() => {
                        // Close petition modal and navigate to profile
                        onClose();
                        window.location.href = '/profile';
                      }}
                    >
                      <i className="fas fa-user me-2"></i>
                      Go to Profile to Upload Signature
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 border border-success bg-success-subtle rounded mb-4">
                <div className="d-flex align-items-center">
                  <i className="fas fa-check-circle text-success me-3" style={{ fontSize: '24px' }}></i>
                  <div className="flex-grow-1">
                    <h5 className="fw-bold text-success mb-2">Digital Signature Available</h5>
                    <p className="mb-0">Your digital signature is ready for petition submission.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="form-check mb-5">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="certification_check" 
                name="certification_check"
                checked={formData.certification_check}
                onChange={handleInputChange}
                disabled={!user?.signatureUrl}
              />
              <label className="form-check-label font-sm fw-medium" htmlFor="certification_check">
                Electronic Certification: I solemnly certify under the pains and penalties of perjury that the information contained in this petition is true and correct to the best of my knowledge and belief.
                {!user?.signatureUrl && (
                  <span className="text-danger ms-2">(Signature required)</span>
                )}
              </label>
            </div>

            <div className="border-top pt-3 text-muted small">
              <p>Submission Timestamp: <span className="text-dark">Will be captured upon submission</span></p>
            </div>
          </div>
        );

      case 9:
        return (
          <div>
            <h2 className="theme-color font-med mb-1">9. Review & Submit Petition</h2>
            <p className="text-muted small mb-3">Please review all entered petition details before final submission.</p>
            
            {/* Read-only Summary */}
            <div className="petition-review-summary">
              {/* Property Information */}
              <div className="review-section mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="review-section-title mb-0">Property Information</h5>
                  <button 
                    type="button" 
                    className="dashboard-btn-create"
                    onClick={() => handleEditSection(1)}
                    style={{ padding: '6px 12px', fontSize: '13px' }}
                  >
                    <i className="fas fa-edit me-1"></i>Edit
                  </button>
                </div>
                <div className="review-content">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <strong>Street Address:</strong> {formData.propertyStreet1}
                      {formData.propertyStreet2 && <><br/><span className="text-muted">{formData.propertyStreet2}</span></>}
                    </div>
                    <div className="col-md-3">
                      <strong>City:</strong> {formData.propertyCity}
                    </div>
                    <div className="col-md-3">
                      <strong>State:</strong> {formData.propertyState}
                    </div>
                    <div className="col-md-3">
                      <strong>ZIP Code:</strong> {formData.propertyZip}
                    </div>
                    <div className="col-md-3">
                      <strong>County:</strong> {formData.propertyCounty}
                    </div>
                  </div>
                </div>
              </div>

              {/* Loan Information */}
              <div className="review-section mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="review-section-title mb-0">Loan Information</h5>
                  <button 
                    type="button" 
                    className="dashboard-btn-create"
                    onClick={() => handleEditSection(2)}
                    style={{ padding: '6px 12px', fontSize: '13px' }}
                  >
                    <i className="fas fa-edit me-1"></i>Edit
                  </button>
                </div>
                <div className="review-content">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <strong>Loan Type:</strong> {getLoanTypes().find(type => type.id === formData.petitionLoanTypeId)?.name || formData.petitionLoanTypeName || 'N/A'}
                    </div>
                    <div className="col-md-6">
                      <strong>Original Loan Amount:</strong> ${formData.originalPrincipalAmount}
                    </div>
                    <div className="col-md-6">
                      <strong>Current Balance:</strong> ${formData.currentPrincipalBalance}
                    </div>
                    <div className="col-md-6">
                      <strong>Interest Rate:</strong> {formData.interestRatePercent}%
                    </div>
                    <div className="col-md-6">
                      <strong>Loan Number:</strong> {formData.loanNumber}
                    </div>
                    <div className="col-md-6">
                      <strong>Lien Position:</strong> {getLienPositions().find(position => position.value === formData.lienPosition)?.name || formData.lienPosition}
                    </div>
                  </div>
                </div>
              </div>

              {/* Borrower Information */}
              <div className="review-section mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="review-section-title mb-0">Borrower Information</h5>
                  <button 
                    type="button" 
                    className="dashboard-btn-create"
                    onClick={() => handleEditSection(3)}
                    style={{ padding: '6px 12px', fontSize: '13px' }}
                  >
                    <i className="fas fa-edit me-1"></i>Edit
                  </button>
                </div>
                <div className="review-content">
                  {formData.borrowers && formData.borrowers.length > 0 ? (
                    formData.borrowers.map((borrower, index) => (
                      <div key={borrower.id} className="row g-3 mb-3">
                        <div className="col-12">
                          <strong>Borrower {index + 1}:</strong>
                        </div>
                        <div className="col-md-6">
                          <strong>Name:</strong> {borrower.firstName} {borrower.middleName} {borrower.lastName} {borrower.suffix}
                        </div>
                        <div className="col-md-6">
                          <strong>Phone:</strong> {borrower.phone}
                        </div>
                        <div className="col-md-6">
                          <strong>Email:</strong> {borrower.email}
                        </div>
                        <div className="col-md-6">
                          <strong>Primary:</strong> {borrower.borrowerIsPrimary ? 'Yes' : 'No'}
                        </div>
                        {borrower.mailingStreet1 && (
                          <div className="col-12">
                            <strong>Mailing Address:</strong> {borrower.mailingStreet1}, {borrower.mailingCity}, {borrower.mailingState} {borrower.mailingZip}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-muted">No borrower information available</div>
                  )}
                </div>
              </div>

              {/* Filing Entity Information */}
              <div className="review-section mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="review-section-title mb-0">Filing Entity Information</h5>
                  <button 
                    type="button" 
                    className="dashboard-btn-create"
                    onClick={() => handleEditSection(4)}
                    style={{ padding: '6px 12px', fontSize: '13px' }}
                  >
                    <i className="fas fa-edit me-1"></i>Edit
                  </button>
                </div>
                <div className="review-content">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <strong>Entity Name:</strong> {formData.filingEntityLegalName}
                    </div>
                    <div className="col-md-6">
                      <strong>Entity Type:</strong> {filingEntityTypes.find(type => type.id === formData.filingEntityTypeId)?.name || 'N/A'}
                    </div>
                    <div className="col-md-6">
                      <strong>Address:</strong> {formData.filingEntityStreet1}
                      {formData.filingEntityStreet2 && <><br/><span className="text-muted">{formData.filingEntityStreet2}</span></>}
                      <br/>{formData.filingEntityCity}, {formData.filingEntityState} {formData.filingEntityZip}
                    </div>
                    <div className="col-md-6">
                      <strong>Contact Name:</strong> {formData.filingContactName}
                    </div>
                    <div className="col-md-6">
                      <strong>Contact Email:</strong> {formData.filingContactEmail}
                    </div>
                    <div className="col-md-6">
                      <strong>Contact Phone:</strong> {formData.filingContactPhone}
                    </div>
                    {formData.nmlsLicenseNumber && (
                      <div className="col-md-6">
                        <strong>NMLS License:</strong> {formData.nmlsLicenseNumber}
                      </div>
                    )}
                    {formData.stateLicenseNumber && (
                      <div className="col-md-6">
                        <strong>State License:</strong> {formData.stateLicenseNumber} ({formData.stateLicenseState})
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right-to-Cure (35A) Proofs */}
              <div className="review-section mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="review-section-title mb-0">Right-to-Cure (35A) Proofs</h5>
                  <button 
                    type="button" 
                    className="dashboard-btn-create"
                    onClick={() => handleEditSection(5)}
                    style={{ padding: '6px 12px', fontSize: '13px' }}
                  >
                    <i className="fas fa-edit me-1"></i>Edit
                  </button>
                </div>
                <div className="review-content">
                  <div className="row g-3">
                    <div className="col-12">
                      <strong>35A Notice Sent:</strong> {formData.noticeSent ? 'Yes' : 'No'}
                    </div>
                    {formData.noticeSent && (
                      <>
                        <div className="col-md-6">
                          <strong>Notice Date:</strong> {formData.noticeDate}
                        </div>
                        <div className="col-md-6">
                          <strong>Amount in Default:</strong> ${formData.amountInDefault}
                        </div>
                        <div className="col-md-6">
                          <strong>Days Delinquent:</strong> {formData.daysDelinquentAtNotice}
                        </div>
                        <div className="col-md-6">
                          <strong>Cure Expiration:</strong> {formData.cureExpirationDate}
                        </div>
                        <div className="col-12">
                          <strong>Notice Address:</strong> {formData.noticeAddressStreet1}, {formData.noticeAddressCity}, {formData.noticeAddressState} {formData.noticeAddressZip}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Form 35B Information */}
              <div className="review-section mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="review-section-title mb-0">Form 35B Information</h5>
                  <button 
                    type="button" 
                    className="dashboard-btn-create"
                    onClick={() => handleEditSection(6)}
                    style={{ padding: '6px 12px', fontSize: '13px' }}
                  >
                    <i className="fas fa-edit me-1"></i>Edit
                  </button>
                </div>
                <div className="review-content">
                  <div className="row g-3">
                    <div className="col-12">
                      <strong>35B Filed:</strong> {formData.certainMortgageLoan ? 'Yes' : 'No'}
                    </div>
                    {formData.certainMortgageLoan && (
                      <>
                        <div className="col-md-6">
                          <strong>Affiant Name:</strong> {formData.affiantName}
                        </div>
                        <div className="col-md-6">
                          <strong>Affiant Title:</strong> {formData.affiantTitle}
                        </div>
                        <div className="col-md-6">
                          <strong>Execution Date:</strong> {formData.affidavitExecutionDate}
                        </div>
                        <div className="col-md-6">
                          <strong>Compliance Affidavit:</strong> {formData.form35bComplianceAffidavitPdf ? 'Uploaded' : 'Not uploaded'}
                        </div>
                        <div className="col-md-6">
                          <strong>Non-Applicability Affidavit:</strong> {formData.form35bNonApplicabilityAffidavitPdf ? 'Uploaded' : 'Not uploaded'}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Loan Assignees */}
              <div className="review-section mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="review-section-title mb-0">Loan Assignees</h5>
                  <button 
                    type="button" 
                    className="dashboard-btn-create"
                    onClick={() => handleEditSection(7)}
                    style={{ padding: '6px 12px', fontSize: '13px' }}
                  >
                    <i className="fas fa-edit me-1"></i>Edit
                  </button>
                </div>
                <div className="review-content">
                  {formData.loanAssignees && formData.loanAssignees.length > 0 ? (
                    formData.loanAssignees.map((assignee, index) => (
                      <div key={index} className="row g-3 mb-3">
                        <div className="col-12">
                          <strong>Assignee {index + 1}:</strong>
                        </div>
                        <div className="col-md-6">
                          <strong>Name:</strong> {assignee.assigneeName}
                        </div>
                        <div className="col-md-6">
                          <strong>Type:</strong> {getAssigneeTypes().find(type => type.id === assignee.assigneeTypeId)?.name || assignee.assigneeTypeId}
                        </div>
                        <div className="col-md-6">
                          <strong>Role:</strong> {getAssigneeRoles().find(role => role.id === assignee.assigneeRoleId)?.name || assignee.assigneeRoleId}
                        </div>
                        <div className="col-12">
                          <strong>Address:</strong> {assignee.street1}
                          {assignee.street2 && <><br/><span className="text-muted">{assignee.street2}</span></>}
                          <br/>{assignee.city}, {assignee.addressState} {assignee.zip}
                        </div>
                        {assignee.licenseNumber && (
                          <div className="col-md-6">
                            <strong>License Number:</strong> {assignee.licenseNumber}
                          </div>
                        )}
                        {assignee.licenseState && (
                          <div className="col-md-6">
                            <strong>License State:</strong> {assignee.licenseState}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-muted">No assignee information available</div>
                  )}
                </div>
              </div>

              {/* Attestation Data */}
              <div className="review-section mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="review-section-title mb-0">Attestation Data</h5>
                  <button 
                    type="button" 
                    className="dashboard-btn-create"
                    onClick={() => handleEditSection(8)}
                    style={{ padding: '6px 12px', fontSize: '13px' }}
                  >
                    <i className="fas fa-edit me-1"></i>Edit
                  </button>
                </div>
                <div className="review-content">
                  {formData.signatures && formData.signatures.length > 0 ? (
                    formData.signatures.map((signature, index) => (
                      <div key={index} className="row g-3 mb-3">
                        <div className="col-12">
                          <strong>Signer {index + 1}:</strong>
                        </div>
                        <div className="col-md-6">
                          <strong>Name:</strong> {signature.signerFullName}
                        </div>
                        <div className="col-md-6">
                          <strong>Title:</strong> {signature.signerTitle}
                        </div>
                        <div className="col-md-6">
                          <strong>Email:</strong> {signature.signerEmail}
                        </div>
                        <div className="col-md-6">
                          <strong>E-sign Consent:</strong> {signature.esignConsent ? 'Yes' : 'No'}
                        </div>
                        <div className="col-md-6">
                          <strong>Signature:</strong> {signature.signatureDrawnOrTyped ? 'Provided' : 'Not provided'}
                        </div>
                        <div className="col-md-6">
                          <strong>Signed At:</strong> {signature.signedAt || 'Not signed'}
                        </div>
                        {user?.signatureUrl && (
                          <div className="col-12">
                            <strong>Signature Preview:</strong>
                            <div className="signature-preview-container p-2 border rounded bg-light mt-2" style={{ maxWidth: '300px' }}>
                              <img 
                                src={user.signatureUrl} 
                                alt="Digital Signature" 
                                className="signature-preview-img"
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '80px',
                                  objectFit: 'contain',
                                  border: '1px solid #dee2e6',
                                  borderRadius: '4px',
                                  backgroundColor: 'white'
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-muted">No signature information available</div>
                  )}
                  
                  {/* Legacy attestation fields */}
                  <div className="row g-3 mt-3">
                    <div className="col-12">
                      <strong>Attester:</strong> {formData.attester_first_name} {formData.attester_middle_initial} {formData.attester_last_name}
                    </div>
                    <div className="col-12">
                      <strong>Certification:</strong> {formData.certification_check ? 'Certified' : 'Not Certified'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {addressValidationType === 'property' && 'Property Address Validation'}
                  {addressValidationType === 'borrower' && 'Borrower Address Validation'}
                  {addressValidationType === 'notice' && 'Notice Address Validation'}
                  {addressValidationType === 'loanAssignee' && 'Loan Assignee Address Validation'}
                  {!addressValidationType && 'Address Validation'}
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
                  <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '3rem' }}></i>
                </div>
                <p className="text-center mb-3">
                  {addressValidationMessage || 'We couldn\'t verify the address you entered. Would you like to correct it, or continue to the next step with the current address?'}
                </p>
              </div>
              <div className="modal-footer justify-content-center">
                <button 
                  type="button" 
                  className="dashboard-btn-refresh me-2"
                  onClick={handleAddressValidationEdit}
                >
                  <i className="fas fa-edit me-2"></i>
                  {addressValidationType === 'borrower' || addressValidationType === 'loanAssignee' ? 'Edit Addresses' : 'Edit Address'}
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


      {/* Main Modal */}
      <div className="modal fade show d-block petition-steps-modal" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
        <div className="modal-dialog petition-steps-modal-dialog modal-dialog-centered">
          <div className="modal-content petition-steps-modal-content">
            <div className="modal-header text-white theme-bg petition-steps-header">
              <h5 className="modal-title">Foreclosure Petition Filing</h5>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={onClose}
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
                    <p className="font-base text-muted">Complete the 9 steps below to submit your foreclosure petition details.</p>
                  </header>

                  <div className="position-relative">
                    <p className="font-base fw-bold">Step {currentStep} of {totalSteps}</p>
                    
                    <form onSubmit={handleSubmit}>
                      {renderStep()}
                    </form>
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
                        className={`btn create-org-btn ${currentStep === 1 ? 'd-none' : ''}`}
                        onClick={() => nextStep(-1)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-left me-2" viewBox="0 0 16 16">
                          <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"/>
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
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Saving...
                            </>
                          ) : (
                            'Save as Draft'
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
                              console.log('Submit button clicked!');
                              await handleSubmit({ preventDefault: () => {} }, true);
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

