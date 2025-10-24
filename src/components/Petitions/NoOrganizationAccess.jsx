import React, { useState, useEffect, useRef } from 'react';
import { getAllOrganizations, searchOrganizations, submitJoinRequest, getUserJoinRequests, createOrganization, getOrganizationById } from '../../services/organizationService';
import { useDebounce } from '../../hooks/useDebounce';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/dateUtils';

const NoOrganizationAccess = () => {
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

  const [isCreatingOrg, setIsCreatingOrg] = useState(false);

  const searchRef = useRef(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  useEffect(() => {
    loadJoinRequests();
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
                  organizationAddress: orgResponse.data.address,
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
  };

  const handleOrgSubmit = async (e) => {
    e.preventDefault();
    setIsCreatingOrg(true);

    try {
      const organizationData = {
        name: orgFormData.orgName,
        type: orgFormData.orgType,
        address: `${orgFormData.addressStreet}, ${orgFormData.addressCity}, ${orgFormData.addressState} ${orgFormData.addressZip}`,
        primaryContact: `${orgFormData.contactName}, ${orgFormData.contactEmail}, ${orgFormData.contactPhone}`,
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
                        {selectedOrganization.address && (
                          <span className="selected-org-address">
                            {" "}
                            • {selectedOrganization.address}
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
                                {org.address && (
                                  <span className="org-item-address ms-3">
                                    <i className="fa-solid fa-location-dot me-1"></i>
                                    {org.address}
                                  </span>
                                )}
                              </div>
                              {org.primaryContact && (
                                <div className="org-item-contact">
                                  <i className="fa-solid fa-user me-1"></i>
                                  {org.primaryContact}
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
      {hasLoadedJoinRequests && joinRequests.length > 0 && (
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

          {isLoadingJoinRequests ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted fs-6">Loading join requests...</p>
            </div>
          ) : (
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
          )}
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
                      Organization Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="orgName"
                      required
                      value={orgFormData.orgName}
                      onChange={handleOrgFormChange}
                    />
                  </div>
                  <div className="col-12">
                    <label htmlFor="orgType" className="form-label">
                      Type
                    </label>
                    <select
                      className="form-select"
                      id="orgType"
                      required
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
                  </div>
                  <div className="col-12">
                    <label htmlFor="addressStreet" className="form-label">
                      Street Address
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="addressStreet"
                      required
                      value={orgFormData.addressStreet}
                      onChange={handleOrgFormChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="addressCity" className="form-label">
                      City
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="addressCity"
                      required
                      value={orgFormData.addressCity}
                      onChange={handleOrgFormChange}
                    />
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="addressState" className="form-label">
                      State
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="addressState"
                      required
                      value={orgFormData.addressState}
                      onChange={handleOrgFormChange}
                    />
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="addressZip" className="form-label">
                      Zip Code
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="addressZip"
                      required
                      value={orgFormData.addressZip}
                      onChange={handleOrgFormChange}
                    />
                  </div>
                  <div className="col-12">
                    <label htmlFor="contactName" className="form-label">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="contactName"
                      required
                      value={orgFormData.contactName}
                      onChange={handleOrgFormChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="contactEmail" className="form-label">
                      Email
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="contactEmail"
                      required
                      value={orgFormData.contactEmail}
                      onChange={handleOrgFormChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="contactPhone" className="form-label">
                      Phone
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      id="contactPhone"
                      required
                      value={orgFormData.contactPhone}
                      onChange={handleOrgFormChange}
                    />
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
  );
};

export default NoOrganizationAccess;

