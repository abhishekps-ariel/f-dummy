import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useJsApiLoader } from '@react-google-maps/api';
import Config from '../config/envConfig';

// Static libraries array to prevent LoadScript reload
const LIBRARIES = ['places'];

const PetitionSteps = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 8;
  
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
  
  const [formData, setFormData] = useState({
    // Step 1: Property Details
    street_address: '',
    city: '',
    state: 'MA',
    zip_code: '',
    county: '',
    
    // Step 2: Loan Details
    loan_account_number: '',
    lien_position: '',
    loan_type_term: '',
    year_originated: '',
    original_amount: '',
    current_amount: '',
    original_rate: '',
    current_rate: '',
    
    // Step 3: Borrower Details
    borrower_first_name_1: '',
    borrower_middle_initial_1: '',
    borrower_last_name_1: '',
    
    // Step 4: Filing Entity
    organization_name: '',
    contact_first_name: '',
    contact_last_name: '',
    contact_phone: '',
    contact_email: '',
    
    // Step 5: Right-to-Cure
    notice_date: '',
    days_delinquent: '',
    amount_default: '',
    cure_expiration_date: '',
    notice_mailing_address: '',
    acceleration_date: '',
    
    // Step 6: Form 35B Compliance
    form_35b_upload: null,
    affiant_name: '',
    affiant_title: '',
    affidavit_date: '',
    notary_info: '',
    
    // Step 7: Loan Assignees
    assignee_lender_name_1: '',
    assignee_lender_type_1: '',
    assignee_originator_name_1: '',
    assignee_license_number_1: '',
    assignee_license_state_1: '',
    assignee_lender_address_1: '',
    
    // Step 8: Petition Attestation
    attester_first_name: '',
    attester_middle_initial: '',
    attester_last_name: '',
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
          street_address: fullAddress,
          city: city,
          state: state || 'MA',
          zip_code: zipCode
        }));

        // Mark address as verified and clear any validation errors
        setIsAddressVerified(true);
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
      if (!geocoderRef.current || !formData.street_address.trim()) {
        resolve({ isValid: false, error: 'Address is required' });
        return;
      }

      setIsValidatingAddress(true);
      setAddressValidationError('');

      const fullAddress = `${formData.street_address}, ${formData.city}, ${formData.state} ${formData.zip_code}`.trim();

      geocoderRef.current.geocode({ address: fullAddress }, (results, status) => {
        setIsValidatingAddress(false);

        if (status === 'OK' && results && results.length > 0) {
          const result = results[0];
          const addressComponents = result.address_components;
          
          // Check if the geocoded result matches our input
          let foundCity = false;
          let foundState = false;
          let foundZip = false;

          addressComponents.forEach(component => {
            const types = component.types;
            if (types.includes('locality') || types.includes('administrative_area_level_2')) {
              if (component.long_name.toLowerCase().includes(formData.city.toLowerCase())) {
                foundCity = true;
              }
            }
            if (types.includes('administrative_area_level_1')) {
              if (component.short_name === formData.state) {
                foundState = true;
              }
            }
            if (types.includes('postal_code')) {
              if (component.long_name === formData.zip_code) {
                foundZip = true;
              }
            }
          });

          if (foundCity && foundState && foundZip) {
            setIsAddressVerified(true);
            resolve({ isValid: true, coordinates: result.geometry.location });
          } else {
            setIsAddressVerified(false);
            setAddressValidationError('Address could not be verified. Please select from suggestions or enter a valid address.');
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
    const errors = [];
    
    if (!formData.street_address.trim()) {
      errors.push('Street address is required');
    }
    
    if (!formData.city.trim()) {
      errors.push('City is required');
    }
    
    if (!formData.state.trim()) {
      errors.push('State is required');
    }
    
    const zipPattern = /^\d{5}(-\d{4})?$/;
    if (!formData.zip_code.trim()) {
      errors.push('ZIP code is required');
    } else if (!zipPattern.test(formData.zip_code)) {
      errors.push('ZIP code must be in valid format (12345 or 12345-6789)');
    }
    
    return errors;
  };

  // Validate Property Details step
  const validatePropertyDetailsStep = async () => {
    const basicErrors = validateAddressFields();
    
    if (basicErrors.length > 0) {
      return { isValid: false, errors: basicErrors };
    }

    // If address is not verified through autocomplete, validate with Geocoding API
    if (!isAddressVerified) {
      const addressValidation = await validateAddressWithGeocoding();
      if (!addressValidation.isValid) {
        return { isValid: false, errors: [addressValidationError || 'Address validation failed'] };
      }
    }

    return { isValid: true, errors: [] };
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }));

    // Reset address verification when manually editing address fields
    if (['street_address', 'city', 'state', 'zip_code'].includes(name)) {
      setIsAddressVerified(false);
      setAddressValidationError('');
    }
  };

  const nextStep = async (direction) => {
    const newStep = currentStep + direction;
    
    // Validate Property Details step before proceeding
    if (currentStep === 1 && direction === 1) {
      const validation = await validatePropertyDetailsStep();
      if (!validation.isValid) {
        toast.error(`Please fix the following errors: ${validation.errors.join(', ')}`);
        return;
      }
    }
    
    if (newStep >= 1 && newStep <= totalSteps) {
      setCurrentStep(newStep);
      // Scroll to top on step change for better mobile UX
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.certification_check) {
      toast.error("Please certify the petition by checking the certification checkbox.");
      return;
    }

    // Validate address fields
    const addressErrors = validateAddressFields();
    if (addressErrors.length > 0) {
      toast.error(`Address validation failed: ${addressErrors.join(', ')}`);
      return;
    }

    // Capture final timestamp
    // eslint-disable-next-line no-unused-vars
    const now = new Date();
    
    // Here you would typically send the data to your API
    console.log('Petition Data:', formData);
    
    toast.success("Petition submitted successfully!");
    onClose();
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
                <label htmlFor="street_address" className="form-label">
                  Street Address 
                  {isAddressVerified && <span className="text-success ms-2">✓ Verified</span>}
                </label>
                {loadError ? (
                  <div>
                <input 
                  type="text" 
                  id="street_address" 
                  name="street_address" 
                  className="form-control"
                  value={formData.street_address}
                  onChange={handleInputChange}
                      placeholder="Enter address manually (Google Maps unavailable)"
                      autoComplete="off"
                    />
                    <div className="text-danger small mt-1">
                      ⚠️ Google Maps API failed to load. Please enter address manually.
                    </div>
                  </div>
                ) : isLoaded ? (
                  <div className="position-relative">
                    <input
                      ref={autocompleteRef}
                      type="text"
                      id="street_address"
                      name="street_address"
                      className="form-control"
                      value={formData.street_address}
                      onChange={(e) => {
                        handleInputChange(e);
                        handleAddressInput(e.target.value);
                      }}
                      onKeyDown={handleKeyDown}
                      onBlur={() => {
                        // Delay hiding suggestions to allow click events
                        setTimeout(() => setShowPredictions(false), 200);
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
                            onClick={() => selectPrediction(prediction.place_id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="fw-medium">{prediction.structured_formatting.main_text}</div>
                            <div className="small text-muted">{prediction.structured_formatting.secondary_text}</div>
                          </div>
                        ))}
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
                      <div className="text-info small mt-2">
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
              <div className="col-md-6">
                <label htmlFor="city" className="form-label">City</label>
                <input 
                  type="text" 
                  id="city" 
                  name="city" 
                  className="form-control"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Enter city name"
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="state" className="form-label">State</label>
                <select 
                  id="state" 
                  name="state" 
                  className="form-select"
                  value={formData.state}
                  onChange={handleInputChange}
                >
                  <option value="">Select State</option>
                  <option value="AL">Alabama (AL)</option>
                  <option value="AK">Alaska (AK)</option>
                  <option value="AZ">Arizona (AZ)</option>
                  <option value="AR">Arkansas (AR)</option>
                  <option value="CA">California (CA)</option>
                  <option value="CO">Colorado (CO)</option>
                  <option value="CT">Connecticut (CT)</option>
                  <option value="DE">Delaware (DE)</option>
                  <option value="FL">Florida (FL)</option>
                  <option value="GA">Georgia (GA)</option>
                  <option value="HI">Hawaii (HI)</option>
                  <option value="ID">Idaho (ID)</option>
                  <option value="IL">Illinois (IL)</option>
                  <option value="IN">Indiana (IN)</option>
                  <option value="IA">Iowa (IA)</option>
                  <option value="KS">Kansas (KS)</option>
                  <option value="KY">Kentucky (KY)</option>
                  <option value="LA">Louisiana (LA)</option>
                  <option value="ME">Maine (ME)</option>
                  <option value="MD">Maryland (MD)</option>
                  <option value="MA">Massachusetts (MA)</option>
                  <option value="MI">Michigan (MI)</option>
                  <option value="MN">Minnesota (MN)</option>
                  <option value="MS">Mississippi (MS)</option>
                  <option value="MO">Missouri (MO)</option>
                  <option value="MT">Montana (MT)</option>
                  <option value="NE">Nebraska (NE)</option>
                  <option value="NV">Nevada (NV)</option>
                  <option value="NH">New Hampshire (NH)</option>
                  <option value="NJ">New Jersey (NJ)</option>
                  <option value="NM">New Mexico (NM)</option>
                  <option value="NY">New York (NY)</option>
                  <option value="NC">North Carolina (NC)</option>
                  <option value="ND">North Dakota (ND)</option>
                  <option value="OH">Ohio (OH)</option>
                  <option value="OK">Oklahoma (OK)</option>
                  <option value="OR">Oregon (OR)</option>
                  <option value="PA">Pennsylvania (PA)</option>
                  <option value="RI">Rhode Island (RI)</option>
                  <option value="SC">South Carolina (SC)</option>
                  <option value="SD">South Dakota (SD)</option>
                  <option value="TN">Tennessee (TN)</option>
                  <option value="TX">Texas (TX)</option>
                  <option value="UT">Utah (UT)</option>
                  <option value="VT">Vermont (VT)</option>
                  <option value="VA">Virginia (VA)</option>
                  <option value="WA">Washington (WA)</option>
                  <option value="WV">West Virginia (WV)</option>
                  <option value="WI">Wisconsin (WI)</option>
                  <option value="WY">Wyoming (WY)</option>
                  <option value="DC">District of Columbia (DC)</option>
                </select>
              </div>
              <div className="col-md-6">
                <label htmlFor="zip_code" className="form-label">ZIP Code</label>
                <input 
                  type="text" 
                  id="zip_code" 
                  name="zip_code" 
                  pattern="\d{5}(?:-\d{4})?" 
                  className="form-control"
                  value={formData.zip_code}
                  onChange={handleInputChange}
                  placeholder="12345 or 12345-6789"
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="county" className="form-label">County (Filing Location)</label>
                <input 
                  type="text" 
                  id="county" 
                  name="county" 
                  className="form-control"
                  value={formData.county}
                  onChange={handleInputChange}
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
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="loan_account_number" className="form-label">Loan Account Number</label>
                <input 
                  type="text" 
                  id="loan_account_number" 
                  name="loan_account_number" 
                  className="form-control"
                  value={formData.loan_account_number}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="lien_position" className="form-label">Lien Position</label>
                <select 
                  id="lien_position" 
                  name="lien_position" 
                  className="form-select"
                  value={formData.lien_position}
                  onChange={handleInputChange}
                >
                  <option value="">Select Position</option>
                  <option value="First">First Lien</option>
                  <option value="Second">Second Lien</option>
                </select>
              </div>
              <div className="col-md-6">
                <label htmlFor="loan_type_term" className="form-label">Loan Type and Term (e.g., 30-Year Fixed)</label>
                <input 
                  type="text" 
                  id="loan_type_term" 
                  name="loan_type_term" 
                  className="form-control"
                  value={formData.loan_type_term}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="year_originated" className="form-label">Year Loan Originated</label>
                <input 
                  type="number" 
                  id="year_originated" 
                  name="year_originated" 
                  min="1900" 
                  max="2100" 
                  className="form-control"
                  value={formData.year_originated}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="original_amount" className="form-label">Original Loan Amount ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  id="original_amount" 
                  name="original_amount" 
                  className="form-control"
                  value={formData.original_amount}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="current_amount" className="form-label">Current Loan Amount ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  id="current_amount" 
                  name="current_amount" 
                  className="form-control"
                  value={formData.current_amount}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="original_rate" className="form-label">Original Interest Rate (%)</label>
                <input 
                  type="number" 
                  step="0.001" 
                  id="original_rate" 
                  name="original_rate" 
                  className="form-control"
                  value={formData.original_rate}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="current_rate" className="form-label">Current Interest Rate (%)</label>
                <input 
                  type="number" 
                  step="0.001" 
                  id="current_rate" 
                  name="current_rate" 
                  className="form-control"
                  value={formData.current_rate}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h2 className="theme-color font-med mb-1">3. Borrower Details</h2>
            <p className="text-muted small mb-3">Enter the full name for each borrower on the loan.</p>
            <div className="p-3 border rounded bg-light mb-3">
              <h5 className="fw-semibold text-dark mb-3 font-base">Borrower 1</h5>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">First Name</label>
                  <input 
                    type="text" 
                    name="borrower_first_name_1" 
                    className="form-control"
                    value={formData.borrower_first_name_1}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Middle Initial (Optional)</label>
                  <input 
                    type="text" 
                    name="borrower_middle_initial_1" 
                    maxLength="1" 
                    className="form-control"
                    value={formData.borrower_middle_initial_1}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Last Name</label>
                  <input 
                    type="text" 
                    name="borrower_last_name_1" 
                    className="form-control"
                    value={formData.borrower_last_name_1}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
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
                <label htmlFor="organization_name" className="form-label">Organization Name</label>
                <input 
                  type="text" 
                  id="organization_name" 
                  name="organization_name" 
                  className="form-control form-control-lg"
                  value={formData.organization_name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="contact_first_name" className="form-label">Contact First Name</label>
                <input 
                  type="text" 
                  id="contact_first_name" 
                  name="contact_first_name" 
                  className="form-control"
                  value={formData.contact_first_name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="contact_last_name" className="form-label">Contact Last Name</label>
                <input 
                  type="text" 
                  id="contact_last_name" 
                  name="contact_last_name" 
                  className="form-control"
                  value={formData.contact_last_name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="contact_phone" className="form-label">Contact Phone Number</label>
                <input 
                  type="tel" 
                  id="contact_phone" 
                  name="contact_phone" 
                  className="form-control"
                  value={formData.contact_phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="contact_email" className="form-label">Contact Email Address</label>
                <input 
                  type="email" 
                  id="contact_email" 
                  name="contact_email" 
                  className="form-control"
                  value={formData.contact_email}
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
              <div className="col-md-6">
                <label htmlFor="notice_date" className="form-label">Notice Date</label>
                <input 
                  type="date" 
                  id="notice_date" 
                  name="notice_date" 
                  className="form-control"
                  value={formData.notice_date}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="days_delinquent" className="form-label">Days Delinquent on Notice Date</label>
                <input 
                  type="number" 
                  id="days_delinquent" 
                  name="days_delinquent" 
                  min="1" 
                  className="form-control"
                  value={formData.days_delinquent}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="amount_default" className="form-label">Amount in Default ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  id="amount_default" 
                  name="amount_default" 
                  className="form-control"
                  value={formData.amount_default}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="cure_expiration_date" className="form-label">Cure Expiration Date</label>
                <input 
                  type="date" 
                  id="cure_expiration_date" 
                  name="cure_expiration_date" 
                  className="form-control"
                  value={formData.cure_expiration_date}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-12">
                <label htmlFor="notice_mailing_address" className="form-label">Notice Mailing Address</label>
                <textarea 
                  id="notice_mailing_address" 
                  name="notice_mailing_address" 
                  rows="3" 
                  className="form-control"
                  value={formData.notice_mailing_address}
                  onChange={handleInputChange}
                ></textarea>
              </div>
              <div className="col-12 border-top pt-4">
                <label htmlFor="acceleration_date" className="form-label text-muted">Acceleration Date (If NO Right-to-Cure notice was issued)</label>
                <input 
                  type="date" 
                  id="acceleration_date" 
                  name="acceleration_date" 
                  className="form-control"
                  value={formData.acceleration_date}
                  onChange={handleInputChange}
                />
              </div>
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
                <label htmlFor="form_35b_upload" className="form-label">Upload Form 35B Affidavit (PDF only)</label>
                <input 
                  type="file" 
                  id="form_35b_upload" 
                  name="form_35b_upload" 
                  accept=".pdf" 
                  className="form-control"
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="affiant_name" className="form-label">Affiant Name</label>
                <input 
                  type="text" 
                  id="affiant_name" 
                  name="affiant_name" 
                  className="form-control"
                  value={formData.affiant_name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="affiant_title" className="form-label">Affiant Title</label>
                <input 
                  type="text" 
                  id="affiant_title" 
                  name="affiant_title" 
                  className="form-control"
                  value={formData.affiant_title}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="affidavit_date" className="form-label">Date of Affidavit</label>
                <input 
                  type="date" 
                  id="affidavit_date" 
                  name="affidavit_date" 
                  className="form-control"
                  value={formData.affidavit_date}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="notary_info" className="form-label">Notary Information</label>
                <input 
                  type="text" 
                  id="notary_info" 
                  name="notary_info" 
                  placeholder="Name, Commission Expiry" 
                  className="form-control"
                  value={formData.notary_info}
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
            <div className="p-3 border rounded bg-light mb-3">
              <h5 className="fw-semibold text-dark mb-3">Assignee 1</h5>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Lender Name</label>
                  <input 
                    type="text" 
                    name="assignee_lender_name_1" 
                    className="form-control"
                    value={formData.assignee_lender_name_1}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Lender Type</label>
                  <input 
                    type="text" 
                    name="assignee_lender_type_1" 
                    className="form-control"
                    value={formData.assignee_lender_type_1}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Loan Originator Name</label>
                  <input 
                    type="text" 
                    name="assignee_originator_name_1" 
                    className="form-control"
                    value={formData.assignee_originator_name_1}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Loan Originator License Number</label>
                  <input 
                    type="text" 
                    name="assignee_license_number_1" 
                    className="form-control"
                    value={formData.assignee_license_number_1}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">License State</label>
                  <input 
                    type="text" 
                    name="assignee_license_state_1" 
                    className="form-control"
                    value={formData.assignee_license_state_1}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Lender Address</label>
                  <textarea 
                    name="assignee_lender_address_1" 
                    rows="2" 
                    className="form-control"
                    value={formData.assignee_lender_address_1}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
              </div>
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
                  <div className="mt-4 pt-3 border-top d-flex justify-content-between">
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
                    
                    {currentStep < totalSteps ? (
                      <button 
                        type="button" 
                        className="btn custom-btn theme-btn text-center ms-auto py-2 px-3"
                        onClick={() => nextStep(1)}
                      >
                        Next Step
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-right ms-2" viewBox="0 0 16 16">
                          <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/>
                        </svg>
                      </button>
                    ) : (
                      <button 
                        type="submit" 
                        className="btn custom-btn theme-btn text-center ms-auto py-2 px-3"
                      >
                        Submit Petition
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetitionSteps;
