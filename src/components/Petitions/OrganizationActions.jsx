import React, { useState, useEffect, useRef } from 'react';
import { getAllOrganizations, searchOrganizations, submitJoinRequest, getUserJoinRequests, createOrganization, getOrganizationById } from '../../services/organizationService';
import { useDebounce } from '../../hooks/useDebounce';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/dateUtils';
import { getAuthData } from '../../utils/storage';
import { useJsApiLoader } from '@react-google-maps/api';
import Config from '../../config/index';

const OrganizationActions = () => {
  // Google Maps API configuration
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: Config.GOOGLE_PLACES_API_KEY,
    libraries: ['places']
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [isSubmittingJoinRequest, setIsSubmittingJoinRequest] = useState(false);

  const [joinRequests, setJoinRequests] = useState([]);
  const [isLoadingJoinRequests, setIsLoadingJoinRequests] = useState(false);
  const [hasLoadedJoinRequests, setHasLoadedJoinRequests] = useState(false);

  const [orgFormData, setOrgFormData] = useState({
    orgName: "",
    orgType: "",
    addressStreet: "",
    addressCity: "",
    addressState: "",
    addressZip: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });

  const [orgFormErrors, setOrgFormErrors] = useState({});
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);

  // Google Places API state
  const [predictions, setPredictions] = useState([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const [selectedPredictionIndex, setSelectedPredictionIndex] = useState(-1);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [addressValidationError, setAddressValidationError] = useState('');
  const [isAddressVerified, setIsAddressVerified] = useState(false);
  const [showAddressValidationDialog, setShowAddressValidationDialog] = useState(false);
  const [addressValidationMessage, setAddressValidationMessage] = useState('');

  // Google Maps API refs
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const geocoderRef = useRef(null);
  const autocompleteRef = useRef(null);

  const searchRef = useRef(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  useEffect(() => {
    loadJoinRequests();
  }, []);

  // Initialize Google Maps API services
  useEffect(() => {
    console.log('Google Maps API initialization check:', { isLoaded, loadError });
    if (isLoaded && !loadError) {
      try {
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        placesServiceRef.current = new window.google.maps.places.PlacesService(document.createElement('div'));
        geocoderRef.current = new window.google.maps.Geocoder();
        console.log('Google Places services initialized successfully');
        console.log('Services:', { 
          autocomplete: !!autocompleteServiceRef.current, 
          places: !!placesServiceRef.current, 
          geocoder: !!geocoderRef.current 
        });
      } catch (error) {
        console.error('Error initializing Google Places services:', error);
      }
    } else {
      console.log('Google Maps API not loaded yet or has error:', { isLoaded, loadError });
    }
  }, [isLoaded, loadError]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debouncedAddressInput.current) {
        clearTimeout(debouncedAddressInput.current);
      }
    };
  }, []);

  // Prefill contact fields with user data from localStorage
  useEffect(() => {
    const prefillContactFields = () => {
      try {
        const { user } = getAuthData();
        if (user) {
          setOrgFormData(prev => ({
            ...prev,
            contactName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || user.lastName || '',
            contactEmail: user.email || '',
            contactPhone: user.phone || ''
          }));
        }
      } catch (error) {
        console.error('Error prefilling contact fields:', error);
      }
    };

    prefillContactFields();
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (!hasSearched) return;

      if (debouncedSearchQuery.trim() === "") {
        setIsLoadingOrgs(true);
        try {
          const response = await getAllOrganizations();
          if (response.isSuccess) {
            setOrganizations(response.data || []);
          } else {
            setOrganizations([]);
          }
        } catch (error) {
          console.error("Error fetching organizations:", error);
          setOrganizations([]);
        } finally {
          setIsLoadingOrgs(false);
        }
      } else {
        setIsLoadingOrgs(true);
        try {
          const response = await searchOrganizations(debouncedSearchQuery);
          if (response.isSuccess) {
            setOrganizations(response.data || []);
          } else {
            setOrganizations([]);
          }
        } catch (error) {
          console.error("Error searching organizations:", error);
          setOrganizations([]);
        } finally {
          setIsLoadingOrgs(false);
        }
      }
    };

    performSearch();
  }, [debouncedSearchQuery, hasSearched]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const modalElement = document.getElementById("createorganizationModal");

    const handleModalHidden = () => {
      setOrgFormData({
        orgName: "",
        orgType: "",
        addressStreet: "",
        addressCity: "",
        addressState: "",
        addressZip: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
      });
    };

    if (modalElement) {
      modalElement.addEventListener("hidden.bs.modal", handleModalHidden);
    }

    return () => {
      if (modalElement) {
        modalElement.removeEventListener("hidden.bs.modal", handleModalHidden);
      }
    };
  }, []);

  const loadJoinRequests = async () => {
    setIsLoadingJoinRequests(true);
    try {
      const response = await getUserJoinRequests();
      if (response.isSuccess) {
        const requests = response.data || [];

        const sortedRequests = requests.sort((a, b) => {
          return new Date(b.requestedOn) - new Date(a.requestedOn);
        });

        // Fetch organization details for each request using specific org ID
        const requestsWithOrgNames = await Promise.all(
          sortedRequests.map(async (request) => {
            try {
              const orgResponse = await getOrganizationById(request.organizationId);
              if (orgResponse.isSuccess && orgResponse.data) {
                return {
                  ...request,
                  organizationName: orgResponse.data.name,
                  organizationType: orgResponse.data.type,
                  organizationAddress: `${orgResponse.data.addressStreet1 || ''}${orgResponse.data.addressStreet2 ? ', ' + orgResponse.data.addressStreet2 : ''}, ${orgResponse.data.addressCity || ''}, ${orgResponse.data.addressState || ''} ${orgResponse.data.addressZip || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, ''),
                  primaryContactName: orgResponse.data.primaryContactName,
                  primaryContactEmail: orgResponse.data.primaryContactEmail,
                  primaryContactPhone: orgResponse.data.primaryContactPhone,
                };
              }
              return request;
            } catch (error) {
              console.error(`Error fetching organization ${request.organizationId}:`, error);
              return request;
            }
          })
        );

        setJoinRequests(requestsWithOrgNames);
      } else {
        console.error("Failed to load join requests:", response.msg);
        setJoinRequests([]);
      }
    } catch (error) {
      console.error("Error loading join requests:", error);
      setJoinRequests([]);
    } finally {
      setIsLoadingJoinRequests(false);
      setHasLoadedJoinRequests(true);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 0:
        return { text: "Pending", class: "status-pending", icon: "fa-clock" };
      case 1:
        return {
          text: "Approved",
          class: "status-approved",
          icon: "fa-check-circle",
        };
      case 2:
        return {
          text: "Rejected",
          class: "status-rejected",
          icon: "fa-times-circle",
        };
      default:
        return {
          text: "Unknown",
          class: "status-unknown",
          icon: "fa-question-circle",
        };
    }
  };

  const handleOrgFormChange = (e) => {
    const { id, value } = e.target;
    setOrgFormData({ ...orgFormData, [id]: value });
    
    // Clear error for this field when user starts typing
    if (orgFormErrors[id]) {
      setOrgFormErrors({ ...orgFormErrors, [id]: '' });
    }
  };

  // Address autocomplete functionality
  const handleAddressInput = (input) => {
    console.log('handleAddressInput called with:', input);
    console.log('autocompleteServiceRef.current:', autocompleteServiceRef.current);
    
    if (!autocompleteServiceRef.current || !input || !input.trim()) {
      console.log('Clearing predictions - no service or empty input');
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    console.log('Making Google Places API request...');
    setIsLoadingPredictions(true);
    
    const request = {
      input: input,
      types: ['address'],
      componentRestrictions: { country: 'us' }
    };

    try {
      autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
        console.log('Google Places API response:', { predictions, status });
        setIsLoadingPredictions(false);
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          console.log('Setting predictions:', predictions);
          setPredictions(predictions);
          setShowPredictions(true);
          setSelectedPredictionIndex(-1);
        } else {
          console.log('No predictions or error:', status);
          setPredictions([]);
          setShowPredictions(false);
        }
      });
    } catch (error) {
      console.error('Error calling Google Places API:', error);
      setIsLoadingPredictions(false);
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  // Debounced address input using setTimeout
  const debouncedAddressInput = useRef(null);
  const handleDebouncedAddressInput = (input) => {
    console.log('handleDebouncedAddressInput called with:', input);
    if (debouncedAddressInput.current) {
      clearTimeout(debouncedAddressInput.current);
    }
    debouncedAddressInput.current = setTimeout(() => {
      console.log('Debounced timeout triggered, calling handleAddressInput');
      handleAddressInput(input);
    }, 300);
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
        
        setOrgFormData(prev => ({
          ...prev,
          addressStreet: fullAddress,
          addressCity: city,
          addressState: state,
          addressZip: zipCode
        }));

        setShowPredictions(false);
        setPredictions([]);
        setIsAddressVerified(true);
        setAddressValidationError('');
      }
    });
  };

  // Handle keyboard navigation for predictions
  const handleKeyDown = (e) => {
    if (!showPredictions || predictions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedPredictionIndex(prev => 
          prev < predictions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedPredictionIndex(prev => 
          prev > 0 ? prev - 1 : predictions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedPredictionIndex >= 0 && selectedPredictionIndex < predictions.length) {
          selectPrediction(predictions[selectedPredictionIndex].place_id);
        }
        break;
      case 'Escape':
        setShowPredictions(false);
        setSelectedPredictionIndex(-1);
        break;
    }
  };

  // Validate address using Geocoding API
  const validateAddressWithGeocoding = () => {
    return new Promise((resolve) => {
      if (!geocoderRef.current || !orgFormData.addressStreet.trim()) {
        resolve({ isValid: false, error: 'Street address is required' });
        return;
      }

      setIsValidatingAddress(true);
      setAddressValidationError('');

      const fullAddress = `${orgFormData.addressStreet}, ${orgFormData.addressCity}, ${orgFormData.addressState} ${orgFormData.addressZip}`.trim();

      geocoderRef.current.geocode({ address: fullAddress }, (results, status) => {
        setIsValidatingAddress(false);

        if (status === 'OK' && results && results.length > 0) {
          const result = results[0];
          const addressComponents = result.address_components;
          
          let foundCity = false;
          let foundState = false;
          let foundZip = false;
          let actualState = '';
          
          addressComponents.forEach(component => {
            const types = component.types;
            if (types.includes('locality') || types.includes('administrative_area_level_2')) {
              if (component.long_name.toLowerCase().includes(orgFormData.addressCity.toLowerCase())) {
                foundCity = true;
              }
            }
            if (types.includes('administrative_area_level_1')) {
              actualState = component.short_name;
              if (component.short_name === orgFormData.addressState) {
                foundState = true;
              }
            }
            if (types.includes('postal_code')) {
              if (component.long_name === orgFormData.addressZip) {
                foundZip = true;
              }
            }
          });

          if (foundState && foundCity && foundZip) {
            setIsAddressVerified(true);
            resolve({ isValid: true, coordinates: result.geometry.location });
          } else {
            setIsAddressVerified(false);
            let errorMessage = 'Address verification failed. Please check:';
            if (!foundCity) errorMessage += ' City does not match the address';
            if (!foundZip) errorMessage += ' ZIP code does not match the address';
            if (!foundState) errorMessage += ' State does not match the address';
            
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

  const validateOrgForm = () => {
    const errors = {};
    
    if (!orgFormData.orgName.trim()) {
      errors.orgName = 'Organization name is required';
    }
    
    if (!orgFormData.orgType.trim()) {
      errors.orgType = 'Organization type is required';
    }
    
    if (!orgFormData.addressStreet.trim()) {
      errors.addressStreet = 'Street address is required';
    }
    
    if (!orgFormData.addressCity.trim()) {
      errors.addressCity = 'City is required';
    }
    
    if (!orgFormData.addressState.trim()) {
      errors.addressState = 'State is required';
    }
    
    if (!orgFormData.addressZip.trim()) {
      errors.addressZip = 'ZIP code is required';
    }
    
    if (!orgFormData.contactName.trim()) {
      errors.contactName = 'Contact name is required';
    }
    
    if (!orgFormData.contactEmail.trim()) {
      errors.contactEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orgFormData.contactEmail)) {
      errors.contactEmail = 'Please enter a valid email address';
    }
    
    if (!orgFormData.contactPhone.trim()) {
      errors.contactPhone = 'Phone number is required';
    }
    
    setOrgFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOrgSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateOrgForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    // Validate address with Geocoding API
    const addressValidation = await validateAddressWithGeocoding();
    if (!addressValidation.isValid) {
      setAddressValidationMessage(addressValidationError || 'Address validation failed');
      setShowAddressValidationDialog(true);
      return;
    }
    
    setIsCreatingOrg(true);

    try {
      const organizationData = {
        name: orgFormData.orgName,
        type: orgFormData.orgType,
        addressStreet1: orgFormData.addressStreet,
        addressStreet2: "", // Not used in current form
        addressCity: orgFormData.addressCity,
        addressState: orgFormData.addressState,
        addressZip: orgFormData.addressZip,
        primaryContactName: orgFormData.contactName,
        primaryContactPhone: orgFormData.contactPhone,
        primaryContactEmail: orgFormData.contactEmail,
      };

      const response = await createOrganization(organizationData);

      if (response.isSuccess) {
        toast.success(response.msg || "Organization created successfully");
        loadJoinRequests();

        const modalElement = document.getElementById("createorganizationModal");
        const modal = window.bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }

        setOrgFormData({
          orgName: "",
          orgType: "",
          addressStreet: "",
          addressCity: "",
          addressState: "",
          addressZip: "",
          contactName: "",
          contactEmail: "",
          contactPhone: "",
        });
        setOrgFormErrors({});
      } else {
        toast.error(response.msg || "Failed to create organization");
      }
    } catch (error) {
      console.error("Error submitting organization:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsCreatingOrg(false);
    }
  };

  // Handle address validation dialog actions
  const handleAddressValidationEdit = () => {
    setShowAddressValidationDialog(false);
    // Focus on the address field
    if (autocompleteRef.current) {
      autocompleteRef.current.focus();
    }
  };

  const handleAddressValidationProceed = async () => {
    setShowAddressValidationDialog(false);
    setIsCreatingOrg(true);

    try {
      const organizationData = {
        name: orgFormData.orgName,
        type: orgFormData.orgType,
        addressStreet1: orgFormData.addressStreet,
        addressStreet2: "", // Not used in current form
        addressCity: orgFormData.addressCity,
        addressState: orgFormData.addressState,
        addressZip: orgFormData.addressZip,
        primaryContactName: orgFormData.contactName,
        primaryContactPhone: orgFormData.contactPhone,
        primaryContactEmail: orgFormData.contactEmail,
      };

      const response = await createOrganization(organizationData);

      if (response.isSuccess) {
        toast.success(response.msg || "Organization created successfully");
        loadJoinRequests();

        const modalElement = document.getElementById("createorganizationModal");
        const modal = window.bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }

        setOrgFormData({
          orgName: "",
          orgType: "",
          addressStreet: "",
          addressCity: "",
          addressState: "",
          addressZip: "",
          contactName: "",
          contactEmail: "",
          contactPhone: "",
        });
        setOrgFormErrors({});
      } else {
        toast.error(response.msg || "Failed to create organization");
      }
    } catch (error) {
      console.error("Error submitting organization:", error);
      toast.error("Failed to create organization. Please try again.");
    } finally {
      setIsCreatingOrg(false);
    }
  };

  const handleSearchFocus = async () => {
    setHasSearched(true);
    if (searchQuery.trim() === "") {
      setIsLoadingOrgs(true);
      try {
        const response = await getAllOrganizations();
        if (response.isSuccess) {
          setOrganizations(response.data || []);
          setShowDropdown(true);
        } else {
          toast.error(response.msg || "Failed to fetch organizations");
          setOrganizations([]);
        }
      } catch (error) {
        console.error("Error fetching organizations:", error);
        toast.error("Failed to fetch organizations");
        setOrganizations([]);
      } finally {
        setIsLoadingOrgs(false);
      }
    } else {
      setShowDropdown(true);
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
    setShowDropdown(true);
  };

  const handleOrganizationSelect = (org) => {
    console.log("Selected organization:", org);
    setSelectedOrganization(org);
    setSearchQuery("");
    setShowDropdown(false);
  };

  const handleRemoveOrganization = () => {
    setSelectedOrganization(null);
    setSearchQuery("");
  };

  const handleJoinRequest = async (e) => {
    e.preventDefault();

    if (!selectedOrganization) {
      toast.error("Please select an organization first");
      return;
    }

    setIsSubmittingJoinRequest(true);
    try {
      const response = await submitJoinRequest(selectedOrganization.id);

      if (response.isSuccess) {
        toast.success(response.msg || "Join request submitted successfully!");
        loadJoinRequests();
        setSelectedOrganization(null);
      } else {
        toast.error(response.msg || "Failed to submit join request");
      }
    } catch (error) {
      console.error("Error submitting join request:", error);
      toast.error("Failed to submit join request. Please try again.");
    } finally {
      setIsSubmittingJoinRequest(false);
    }
  };

  return (
    <>
    <div className="shadow-custom bg-white org-search-box">
      {/* Show organization search section only if user has no join requests */}
      {hasLoadedJoinRequests && joinRequests.length === 0 && (
        <>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h2 className="h5 mb-0">Organization Required</h2>
            <button
              className="dashboard-btn-create"
              data-bs-toggle="modal"
              data-bs-target="#createorganizationModal"
            >
              <i className="fa-solid fa-plus me-1"></i> Create Organization
            </button>
          </div>

          <p className="text-muted mb-4">
            You need to be part of an organization to access the Petition Dashboard. You can either join an existing organization or create a new organization.
          </p>

          {/* Organization Search */}
          <div className="search-form-wrapper mb-4" ref={searchRef}>
            <form
              className="search-form"
              role="search"
              onSubmit={handleJoinRequest}
            >
              {/* Selected Organization Display */}
              {selectedOrganization ? (
                <div className="selected-org-container">
                  <div className="selected-org-badge">
                    <div className="selected-org-icon">
                      <i className="fa-solid fa-building"></i>
                    </div>
                    <div className="selected-org-info">
                      <div className="selected-org-name">
                        {selectedOrganization.name}
                      </div>
                      <div className="selected-org-details">
                        {selectedOrganization.type && (
                          <span className="selected-org-type">
                            {selectedOrganization.type}
                          </span>
                        )}
                        {selectedOrganization.addressStreet1 && (
                          <span className="selected-org-address">
                            {" "}
                            • {`${selectedOrganization.addressStreet1 || ''}${selectedOrganization.addressStreet2 ? ', ' + selectedOrganization.addressStreet2 : ''}, ${selectedOrganization.addressCity || ''}, ${selectedOrganization.addressState || ''} ${selectedOrganization.addressZip || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '')}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="selected-org-remove"
                      onClick={handleRemoveOrganization}
                      title="Remove selection"
                    >
                      <i className="fa-solid fa-times"></i>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="search-input-container">
                  <input
                    className="form-control"
                    type="search"
                    placeholder="Search by organization name or EIN"
                    aria-label="Search"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onFocus={handleSearchFocus}
                  />

                  {/* Search Dropdown */}
                  {showDropdown && (
                    <div className="org-search-dropdown">
                      {isLoadingOrgs ? (
                        <div className="org-search-loading">
                          <div
                            className="spinner-border spinner-border-sm text-primary me-2"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <span>Loading organizations...</span>
                        </div>
                      ) : organizations.length > 0 ? (
                        <div className="org-search-results">
                          {organizations.map((org) => (
                            <div
                              key={org.id}
                              className="org-search-item"
                              onClick={() => handleOrganizationSelect(org)}
                            >
                              <div className="org-item-name">{org.name}</div>
                              <div className="org-item-details">
                                <span className="org-item-type">
                                  <i className="fa-solid fa-building me-1"></i>
                                  {org.type || "N/A"}
                                </span>
                                {(org.addressStreet1 || org.addressCity || org.addressState || org.addressZip) && (
                                  <span className="org-item-address ms-3">
                                    <i className="fa-solid fa-location-dot me-1"></i>
                                    {`${org.addressStreet1 || ''}${org.addressStreet2 ? ', ' + org.addressStreet2 : ''}, ${org.addressCity || ''}, ${org.addressState || ''} ${org.addressZip || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '')}
                                  </span>
                                )}
                              </div>
                              {(org.primaryContactName || org.primaryContactEmail || org.primaryContactPhone) && (
                                <div className="org-item-contact">
                                  <i className="fa-solid fa-user me-1"></i>
                                  {org.primaryContactName && <span>{org.primaryContactName}</span>}
                                  {org.primaryContactEmail && <span className="ms-2">{org.primaryContactEmail}</span>}
                                  {org.primaryContactPhone && <span className="ms-2">{org.primaryContactPhone}</span>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="org-search-no-results">
                          <i className="fa-solid fa-search me-2"></i>
                          No organizations found.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-3">
                <button
                  className="dashboard-btn-submit"
                  type="submit"
                  disabled={!selectedOrganization || isSubmittingJoinRequest}
                >
                  {isSubmittingJoinRequest ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Submitting...
                    </>
                  ) : (
                    "Submit Join Request"
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Join Request Status */}
      {(isLoadingJoinRequests || (hasLoadedJoinRequests && joinRequests.length > 0)) && (
        <div className="join-requests-section">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <h2 className="h4 mb-0 fw-bold">Request Status</h2>
            <button
              className="dashboard-btn-refresh"
              onClick={loadJoinRequests}
              disabled={isLoadingJoinRequests}
            >
              <i
                className={`fa-solid fa-refresh ${isLoadingJoinRequests ? "fa-spin" : ""}`}
              ></i>
            </button>
          </div>

          {isLoadingJoinRequests ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted fs-6">Loading join requests...</p>
            </div>
          ) : joinRequests.length > 0 ? (
            <>
              {/* Status Message */}
              <div className="alert alert-info mb-4" role="alert">
                <div className="d-flex align-items-center">
                  <i className="fa-solid fa-info-circle me-3 fs-5"></i>
                  <div>
                    <h6 className="alert-heading mb-1">Join Request Already Sent</h6>
                    <p className="mb-0 fs-6">Your request has been submitted successfully. Please wait for organization approval.</p>
                  </div>
                </div>
              </div>
            <div className="join-requests-list">
              {joinRequests.map((request) => {
                const statusInfo = getStatusInfo(request.status);
                return (
                  <div key={request.id} className="join-request-item p-4 border rounded-3 mb-3">
                    <div className="join-request-header d-flex justify-content-between align-items-start mb-3">
                      <div className="join-request-org">
                        <i className="fa-solid fa-building me-2 fs-5"></i>
                        <span className="org-name fs-5 fw-bold">
                          {request.organizationName || "Organization"}
                        </span>
                      </div>
                      <div className={`join-request-status ${statusInfo.class} px-3 py-2 rounded-pill`}>
                        <i className={`fa-solid ${statusInfo.icon} me-2`}></i>
                        <span className="fw-semibold">{statusInfo.text}</span>
                      </div>
                    </div>
                    <div className="join-request-details">
                      {request.organizationType && (
                        <div className="join-request-org-details mb-2">
                          <i className="fa-solid fa-tag me-2 text-muted"></i>
                          <span className="fs-6">
                            <strong>Type:</strong> {request.organizationType}
                          </span>
                        </div>
                      )}
                      {request.organizationAddress && (
                        <div className="join-request-org-details mb-2">
                          <i className="fa-solid fa-location-dot me-2 text-muted"></i>
                          <span className="fs-6">
                            <strong>Address:</strong> {request.organizationAddress}
                          </span>
                        </div>
                      )}
                      <div className="join-request-date mb-2">
                        <i className="fa-solid fa-calendar me-2 text-muted"></i>
                        <span className="fs-6">
                          <strong>Requested:</strong> {formatDate(request.requestedOn)}
                        </span>
                      </div>
                      {request.respondedOn && (
                        <div className="join-request-response-date mb-2">
                          <i className="fa-solid fa-check me-2 text-muted"></i>
                          <span className="fs-6">
                            <strong>Responded:</strong> {formatDate(request.respondedOn)}
                          </span>
                        </div>
                      )}
                      {request.adminComment && (
                        <div className="join-request-comment mt-3 p-3 bg-light rounded">
                          <i className="fa-solid fa-comment me-2 text-muted"></i>
                          <span className="fs-6">
                            <strong>Admin Comment:</strong> {request.adminComment}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            </>
          ) : null}
        </div>
      )}

      {/* Create Organization Modal */}
      <div
        className="modal fade"
        id="createorganizationModal"
        tabIndex="-1"
        aria-labelledby="organizationModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="organizationModalLabel">
                Create Organization
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body p-4">
              <form id="organizationForm" onSubmit={handleOrgSubmit}>
                <div className="row g-3">
                  <div className="col-12">
                    <label htmlFor="orgName" className="form-label">
                      Organization Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${orgFormErrors.orgName ? 'is-invalid' : ''}`}
                      id="orgName"
                      value={orgFormData.orgName}
                      onChange={handleOrgFormChange}
                    />
                    {orgFormErrors.orgName && (
                      <div className="text-danger small mt-1">
                        {orgFormErrors.orgName}
                      </div>
                    )}
                  </div>
                  <div className="col-12">
                    <label htmlFor="orgType" className="form-label">
                      Type <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${orgFormErrors.orgType ? 'is-invalid' : ''}`}
                      id="orgType"
                      value={orgFormData.orgType}
                      onChange={handleOrgFormChange}
                    >
                      <option value="">Select type</option>
                      <option value="corporate">Corporate</option>
                      <option value="nonprofit">Non-Profit</option>
                      <option value="government">Government</option>
                      <option value="educational">Educational</option>
                      <option value="other">Other</option>
                    </select>
                    {orgFormErrors.orgType && (
                      <div className="text-danger small mt-1">
                        {orgFormErrors.orgType}
                      </div>
                    )}
                  </div>
                  <div className="col-12">
                    <label htmlFor="addressStreet" className="form-label">
                      Street Address <span className="text-danger">*</span>
                      {isAddressVerified && <span className="text-success ms-2">✓ Verified</span>}
                    </label>
                    {loadError ? (
                      <div>
                    <input
                      type="text"
                          className={`form-control ${orgFormErrors.addressStreet ? 'is-invalid' : ''}`}
                      id="addressStreet"
                      value={orgFormData.addressStreet}
                      onChange={handleOrgFormChange}
                          placeholder="Enter address manually (Google Maps unavailable)"
                        />
                        {orgFormErrors.addressStreet && (
                          <div className="text-danger small mt-1">
                            {orgFormErrors.addressStreet}
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
                          className={`form-control ${orgFormErrors.addressStreet ? 'is-invalid' : ''}`}
                          id="addressStreet"
                          value={orgFormData.addressStreet}
                          onChange={(e) => {
                            handleOrgFormChange(e);
                            handleDebouncedAddressInput(e.target.value);
                          }}
                          onKeyDown={handleKeyDown}
                          onBlur={() => {
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
                        {orgFormErrors.addressStreet && (
                          <div className="text-danger small mt-1">
                            {orgFormErrors.addressStreet}
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
                  <div className="col-md-6">
                    <label htmlFor="addressCity" className="form-label">
                      City <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${orgFormErrors.addressCity ? 'is-invalid' : ''} ${isAddressVerified ? 'bg-light' : ''}`}
                      id="addressCity"
                      value={orgFormData.addressCity}
                      onChange={handleOrgFormChange}
                      readOnly={isAddressVerified}
                    />
                    {orgFormErrors.addressCity && (
                      <div className="text-danger small mt-1">
                        {orgFormErrors.addressCity}
                      </div>
                    )}
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="addressState" className="form-label">
                      State <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${orgFormErrors.addressState ? 'is-invalid' : ''} ${isAddressVerified ? 'bg-light' : ''}`}
                      id="addressState"
                      value={orgFormData.addressState}
                      onChange={handleOrgFormChange}
                      readOnly={isAddressVerified}
                    />
                    {orgFormErrors.addressState && (
                      <div className="text-danger small mt-1">
                        {orgFormErrors.addressState}
                      </div>
                    )}
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="addressZip" className="form-label">
                      Zip Code <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${orgFormErrors.addressZip ? 'is-invalid' : ''} ${isAddressVerified ? 'bg-light' : ''}`}
                      id="addressZip"
                      value={orgFormData.addressZip}
                      onChange={handleOrgFormChange}
                      readOnly={isAddressVerified}
                    />
                    {orgFormErrors.addressZip && (
                      <div className="text-danger small mt-1">
                        {orgFormErrors.addressZip}
                      </div>
                    )}
                  </div>
                  <div className="col-12">
                    <label htmlFor="contactName" className="form-label">
                      Contact Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${orgFormErrors.contactName ? 'is-invalid' : ''}`}
                      id="contactName"
                      value={orgFormData.contactName}
                      onChange={handleOrgFormChange}
                    />
                    {orgFormErrors.contactName && (
                      <div className="text-danger small mt-1">
                        {orgFormErrors.contactName}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="contactEmail" className="form-label">
                      Email <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className={`form-control ${orgFormErrors.contactEmail ? 'is-invalid' : ''}`}
                      id="contactEmail"
                      value={orgFormData.contactEmail}
                      onChange={handleOrgFormChange}
                    />
                    {orgFormErrors.contactEmail && (
                      <div className="text-danger small mt-1">
                        {orgFormErrors.contactEmail}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="contactPhone" className="form-label">
                      Phone <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      className={`form-control ${orgFormErrors.contactPhone ? 'is-invalid' : ''}`}
                      id="contactPhone"
                      value={orgFormData.contactPhone}
                      onChange={handleOrgFormChange}
                    />
                    {orgFormErrors.contactPhone && (
                      <div className="text-danger small mt-1">
                        {orgFormErrors.contactPhone}
                      </div>
                    )}
                  </div>

                </div>

                <div className="mt-4">
                  <button
                    className="dashboard-btn-submit w-100"
                    type="submit"
                    disabled={isCreatingOrg}
                  >
                    {isCreatingOrg ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Creating...
                      </>
                    ) : (
                      "Create Organization"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Address Validation Dialog */}
      {showAddressValidationDialog && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Organization Address Validation</h5>
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
                  {addressValidationMessage || 'We couldn\'t verify the address you entered. Would you like to correct it, or continue creating the organization with the current address?'}
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
    </>
  );
};

export default OrganizationActions;

