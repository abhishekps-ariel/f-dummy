import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useJsApiLoader } from '@react-google-maps/api';
import Config from '../../config/index';
import { usePetitionCommonData } from '../../hooks/usePetitionCommonData';
import { usePetitions } from '../../hooks/usePetitions';

// Static libraries array to prevent LoadScript reload
const LIBRARIES = ['places'];

const PetitionSteps = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isIntentionalSubmit, setIsIntentionalSubmit] = useState(false);
  const totalSteps = 8;
  
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
  const { submitPetition, hasOrganizationAccess } = usePetitions();
  
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
  const autocompleteRef = useRef(null);
  const placesServiceRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const geocoderRef = useRef(null);
  
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
    lienPosition: 0,
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
    filingEntityRole: 0,
    filingEntityStreet1: '',
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
        contactEmail: '',
        contactPhone: ''
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
      setFormData(prev => ({
        ...prev,
        borrowers: prev.borrowers.filter(borrower => borrower.id !== borrowerId)
      }));
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
  };

  // Validate borrower details
  const validateBorrowerDetails = () => {
    const errors = [];
    
    if (!formData.borrowers || formData.borrowers.length === 0) {
      errors.push('At least one borrower must be entered');
      return { isValid: false, errors };
    }

    formData.borrowers.forEach((borrower, index) => {
      if (!borrower.firstName.trim()) {
        errors.push(`Borrower ${index + 1}: First name is required`);
      }
      if (!borrower.lastName.trim()) {
        errors.push(`Borrower ${index + 1}: Last name is required`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
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
    
    // Validate Borrower Details step before proceeding
    if (currentStep === 3 && direction === 1) {
      const validation = validateBorrowerDetails();
      if (!validation.isValid) {
        toast.error(`Please fix the following errors: ${validation.errors.join(', ')}`);
        return;
      }
    }
    
    if (newStep >= 1 && newStep <= totalSteps) {
      // Auto-save current step before moving to next step
      await autoSaveCurrentStep();
      
      setCurrentStep(newStep);
      // Scroll to top on step change for better mobile UX
      window.scrollTo(0, 0);
    }
  };

  // Handle address validation dialog actions
  const handleAddressValidationEdit = () => {
    setShowAddressValidationDialog(false);
    setAddressValidationMessage('');
    // Focus on the address input field
    if (autocompleteRef.current) {
      autocompleteRef.current.focus();
    }
  };

  const handleAddressValidationProceed = async () => {
    setShowAddressValidationDialog(false);
    setAddressValidationMessage('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    
    // Only validate certification if we're actually on the last step and trying to submit
    if (currentStep !== totalSteps || !isIntentionalSubmit) {
      return;
    }
    
    if (!formData.certification_check) {
      toast.error("Please certify the petition by checking the certification checkbox.");
      setIsIntentionalSubmit(false); // Reset the flag
      return;
    }

    // Validate address fields
    const addressValidation = validateAddressFields();
    if (addressValidation.hasErrors) {
      setIsIntentionalSubmit(false); // Reset the flag
      return;
    }

    // Check organization access
    if (!hasOrganizationAccess) {
      toast.error("You must be part of an organization to submit petitions.");
      setIsIntentionalSubmit(false);
      return;
    }

    try {
      // Submit petition using API
      await submitPetition(formData);
      setIsIntentionalSubmit(false); // Reset the flag
      onClose();
    } catch (error) {
      console.error('Error submitting petition:', error);
      setIsIntentionalSubmit(false); // Reset the flag
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
                <label htmlFor="minNumber" className="form-label">MIN Number</label>
                <input 
                  type="text" 
                  id="minNumber" 
                  name="minNumber" 
                  className="form-control"
                  value={formData.minNumber}
                  onChange={handleInputChange}
                  placeholder="Enter MIN number"
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="loanNumber" className="form-label">Loan Number</label>
                <input 
                  type="text" 
                  id="loanNumber" 
                  name="loanNumber" 
                  className="form-control"
                  value={formData.loanNumber}
                  onChange={handleInputChange}
                  placeholder="Enter loan number"
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="petitionLoanTypeId" className="form-label">Loan Type</label>
                <select 
                  id="petitionLoanTypeId" 
                  name="petitionLoanTypeId" 
                  className="form-select"
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
                {commonDataLoading && (
                  <div className="form-text">
                    <i className="fas fa-spinner fa-spin me-1"></i>
                    Loading loan types...
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label htmlFor="lienPosition" className="form-label">Lien Position</label>
                <select 
                  id="lienPosition" 
                  name="lienPosition" 
                  className="form-select"
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
                {commonDataLoading && (
                  <div className="form-text">
                    <i className="fas fa-spinner fa-spin me-1"></i>
                    Loading lien positions...
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label htmlFor="originationDate" className="form-label">Origination Date</label>
                <input 
                  type="date" 
                  id="originationDate" 
                  name="originationDate" 
                  className="form-control"
                  value={formData.originationDate}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="originalPrincipalAmount" className="form-label">Original Principal Amount ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  id="originalPrincipalAmount" 
                  name="originalPrincipalAmount" 
                  className="form-control"
                  value={formData.originalPrincipalAmount}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="currentPrincipalBalance" className="form-label">Current Principal Balance ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  id="currentPrincipalBalance" 
                  name="currentPrincipalBalance" 
                  className="form-control"
                  value={formData.currentPrincipalBalance}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="interestRatePercent" className="form-label">Interest Rate (%)</label>
                <input 
                  type="number" 
                  step="0.001" 
                  id="interestRatePercent" 
                  name="interestRatePercent" 
                  className="form-control"
                  value={formData.interestRatePercent}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="monthlyPaymentAmount" className="form-label">Monthly Payment Amount ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  id="monthlyPaymentAmount" 
                  name="monthlyPaymentAmount" 
                  className="form-control"
                  value={formData.monthlyPaymentAmount}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="delinquencyDaysAtFiling" className="form-label">Delinquency Days at Filing</label>
                <input 
                  type="number" 
                  id="delinquencyDaysAtFiling" 
                  name="delinquencyDaysAtFiling" 
                  min="0"
                  className="form-control"
                  value={formData.delinquencyDaysAtFiling}
                  onChange={handleInputChange}
                />
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
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => removeBorrower(borrower.id)}
                      title="Remove this borrower"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label">First Name *</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={borrower.firstName}
                      onChange={(e) => updateBorrower(borrower.id, 'firstName', e.target.value)}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Middle Name</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={borrower.middleName}
                      onChange={(e) => updateBorrower(borrower.id, 'middleName', e.target.value)}
                      placeholder="Middle"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Last Name *</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={borrower.lastName}
                      onChange={(e) => updateBorrower(borrower.id, 'lastName', e.target.value)}
                      placeholder="Enter last name"
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Suffix</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={borrower.suffix}
                      onChange={(e) => updateBorrower(borrower.id, 'suffix', e.target.value)}
                      placeholder="Jr, Sr, III"
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Primary Borrower</label>
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        checked={borrower.borrowerIsPrimary}
                        onChange={(e) => updateBorrower(borrower.id, 'borrowerIsPrimary', e.target.checked)}
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
                    <input 
                      type="text" 
                      className="form-control"
                      value={borrower.mailingStreet1}
                      onChange={(e) => updateBorrower(borrower.id, 'mailingStreet1', e.target.value)}
                      placeholder="Street address"
                    />
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
            <div className="row g-3">
              <div className="col-12">
                <label htmlFor="filingEntityLegalName" className="form-label">Organization Name</label>
                <input 
                  type="text" 
                  id="filingEntityLegalName" 
                  name="filingEntityLegalName" 
                  className="form-control form-control-lg"
                  value={formData.filingEntityLegalName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="filingContactName" className="form-label">Contact Name</label>
                <input 
                  type="text" 
                  id="filingContactName" 
                  name="filingContactName" 
                  className="form-control"
                  value={formData.filingContactName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="filingContactPhone" className="form-label">Contact Phone Number</label>
                <input 
                  type="tel" 
                  id="filingContactPhone" 
                  name="filingContactPhone" 
                  className="form-control"
                  value={formData.filingContactPhone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-12">
                <label htmlFor="filingContactEmail" className="form-label">Contact Email Address</label>
                <input 
                  type="email" 
                  id="filingContactEmail" 
                  name="filingContactEmail" 
                  className="form-control"
                  value={formData.filingContactEmail}
                  onChange={handleInputChange}
                />
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
                <div className="form-check mb-3">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="noticeSent" 
                    name="noticeSent"
                    checked={formData.noticeSent}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="noticeSent">
                    Right-to-Cure Notice was sent
                  </label>
                </div>
              </div>
              
              {formData.noticeSent && (
                <>
                  <div className="col-md-6">
                    <label htmlFor="noticeDate" className="form-label">Notice Date</label>
                    <input 
                      type="date" 
                      id="noticeDate" 
                      name="noticeDate" 
                      className="form-control"
                      value={formData.noticeDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="daysDelinquentAtNotice" className="form-label">Days Delinquent on Notice Date</label>
                    <input 
                      type="number" 
                      id="daysDelinquentAtNotice" 
                      name="daysDelinquentAtNotice" 
                      min="0" 
                      className="form-control"
                      value={formData.daysDelinquentAtNotice}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="amountInDefault" className="form-label">Amount in Default ($)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      id="amountInDefault" 
                      name="amountInDefault" 
                      className="form-control"
                      value={formData.amountInDefault}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="cureExpirationDate" className="form-label">Cure Expiration Date</label>
                    <input 
                      type="date" 
                      id="cureExpirationDate" 
                      name="cureExpirationDate" 
                      className="form-control"
                      value={formData.cureExpirationDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12">
                    <label htmlFor="noticeAddressStreet1" className="form-label">Notice Mailing Address</label>
                    <input 
                      type="text" 
                      id="noticeAddressStreet1" 
                      name="noticeAddressStreet1" 
                      className="form-control"
                      value={formData.noticeAddressStreet1}
                      onChange={handleInputChange}
                      placeholder="Street address"
                    />
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="noticeAddressCity" className="form-label">City</label>
                    <input 
                      type="text" 
                      id="noticeAddressCity" 
                      name="noticeAddressCity" 
                      className="form-control"
                      value={formData.noticeAddressCity}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="noticeAddressState" className="form-label">State</label>
                    <input 
                      type="text" 
                      id="noticeAddressState" 
                      name="noticeAddressState" 
                      className="form-control"
                      value={formData.noticeAddressState}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="noticeAddressZip" className="form-label">ZIP Code</label>
                    <input 
                      type="text" 
                      id="noticeAddressZip" 
                      name="noticeAddressZip" 
                      className="form-control"
                      value={formData.noticeAddressZip}
                      onChange={handleInputChange}
                    />
                  </div>
                </>
              )}
              
              {!formData.noticeSent && (
                <div className="col-12">
                  <label htmlFor="manualOverrideReason" className="form-label">Acceleration Date (If NO Right-to-Cure notice was issued)</label>
                  <input 
                    type="date" 
                    id="manualOverrideReason" 
                    name="manualOverrideReason" 
                    className="form-control"
                    value={formData.manualOverrideReason}
                    onChange={handleInputChange}
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div>
            <h2 className="theme-color font-med mb-1">6. Form 35B Compliance</h2>
            <p className="text-muted small mb-3">If applicable, upload the signed **Form 35B Affidavit of Compliance** and provide details.</p>
            <div className="alert alert-info small" role="alert">
              Required for "certain mortgage loans" (e.g., Interest-Only, Subprime, Low-Doc).
            </div>
            <div className="row g-3">
              <div className="col-12">
                <div className="form-check mb-3">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="certainMortgageLoan" 
                    name="certainMortgageLoan"
                    checked={formData.certainMortgageLoan}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="certainMortgageLoan">
                    This loan qualifies as a "certain mortgage loan" (Interest-Only, Subprime, Low-Doc, etc.)
                  </label>
                </div>
              </div>
              
              {formData.certainMortgageLoan && (
                <>
                  <div className="col-12">
                    <label htmlFor="form35bComplianceAffidavitPdf" className="form-label">Upload Form 35B Compliance Affidavit (PDF only)</label>
                    <input 
                      type="file" 
                      id="form35bComplianceAffidavitPdf" 
                      name="form35bComplianceAffidavitPdf" 
                      accept=".pdf" 
                      className="form-control"
                      onChange={handleInputChange}
                    />
                  </div>
                </>
              )}
              
              {!formData.certainMortgageLoan && (
                <div className="col-12">
                  <label htmlFor="form35bNonApplicabilityAffidavitPdf" className="form-label">Upload Form 35B Non-Applicability Affidavit (PDF only) - Optional</label>
                  <input 
                    type="file" 
                    id="form35bNonApplicabilityAffidavitPdf" 
                    name="form35bNonApplicabilityAffidavitPdf" 
                    accept=".pdf" 
                    className="form-control"
                    onChange={handleInputChange}
                  />
                </div>
              )}
              
              <div className="col-md-6">
                <label htmlFor="affiantName" className="form-label">Affiant Name</label>
                <input 
                  type="text" 
                  id="affiantName" 
                  name="affiantName" 
                  className="form-control"
                  value={formData.affiantName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="affiantTitle" className="form-label">Affiant Title</label>
                <input 
                  type="text" 
                  id="affiantTitle" 
                  name="affiantTitle" 
                  className="form-control"
                  value={formData.affiantTitle}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-12">
                <label htmlFor="affidavitExecutionDate" className="form-label">Date of Affidavit Execution</label>
                <input 
                  type="date" 
                  id="affidavitExecutionDate" 
                  name="affidavitExecutionDate" 
                  className="form-control"
                  value={formData.affidavitExecutionDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div>
            <h2 className="theme-color font-med mb-1">7. Loan Assignees (Optional)</h2>
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
                    <label className="form-label">Assignee Name</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={assignee.assigneeName}
                      onChange={(e) => updateLoanAssignee(index, 'assigneeName', e.target.value)}
                      placeholder="Enter assignee name"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Assignee Type</label>
                    <select 
                      className="form-select"
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
                    {commonDataLoading && (
                      <div className="form-text">
                        <i className="fas fa-spinner fa-spin me-1"></i>
                        Loading assignee types...
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Assignee Role</label>
                    <select 
                      className="form-select"
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
                    {commonDataLoading && (
                      <div className="form-text">
                        <i className="fas fa-spinner fa-spin me-1"></i>
                        Loading assignee roles...
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Contact Email</label>
                    <input 
                      type="email" 
                      className="form-control"
                      value={assignee.contactEmail}
                      onChange={(e) => updateLoanAssignee(index, 'contactEmail', e.target.value)}
                      placeholder="Enter contact email"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Contact Phone</label>
                    <input 
                      type="tel" 
                      className="form-control"
                      value={assignee.contactPhone}
                      onChange={(e) => updateLoanAssignee(index, 'contactPhone', e.target.value)}
                      placeholder="Enter contact phone"
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

            <div className="form-check mb-5">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="certification_check" 
                name="certification_check"
                checked={formData.certification_check}
                onChange={handleInputChange}
              />
              <label className="form-check-label font-sm fw-medium" htmlFor="certification_check">
                Electronic Certification: I solemnly certify under the pains and penalties of perjury that the information contained in this petition is true and correct to the best of my knowledge and belief.
              </label>
            </div>

            <div className="border-top pt-3 text-muted small">
              <p>Submission Timestamp: <span className="text-dark">Will be captured upon submission</span></p>
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
                <h5 className="modal-title">Address Validation</h5>
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
                  We couldn't verify the address you entered. Would you like to correct it, or continue to the next step with the current address?
                </p>
              </div>
              <div className="modal-footer justify-content-center">
                <button 
                  type="button" 
                  className="dashboard-btn-refresh me-2"
                  onClick={handleAddressValidationEdit}
                >
                  <i className="fas fa-edit me-2"></i>
                  Edit Address
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
      <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header text-white theme-bg">
              <h5 className="modal-title">Foreclosure Petition Filing</h5>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
            <div className="container">
              <header className="border-bottom mb-3">
                <p className="font-base text-muted">Complete the 8 steps below to submit your foreclosure petition details.</p>
              </header>

              <div className="position-relative">
                <p className="font-base fw-bold">Step {currentStep} of {totalSteps}</p>
                
                <form onSubmit={handleSubmit}>
                  {renderStep()}

                  {/* Navigation Buttons */}
                  <div className="mt-4 pt-3 border-top">
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
                        
                        {/* Next Step or Submit Button */}
                        {currentStep < totalSteps ? (
                          <button 
                            type="button" 
                            className="dashboard-btn-create"
                            onClick={() => nextStep(1)}
                          >
                            Next Step
                          </button>
                        ) : (
                          <button 
                            type="submit" 
                            className="dashboard-btn-create"
                            onClick={() => setIsIntentionalSubmit(true)}
                          >
                            Submit Petition
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
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
