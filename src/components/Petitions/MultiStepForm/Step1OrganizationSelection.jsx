import React, { useState, useEffect, useRef } from "react";
import { getAllOrganizations, searchOrganizations } from "../../../services/organizationService";
import { useDebounce } from "../../../hooks/useDebounce";

const Step1OrganizationSelection = ({
  selectedOrganizationId,
  selectedOrganizationData,
  onSelect,
  isOrgAdmin,
  organizationId,
  organizationData,
  organizationLoading,
  fieldErrors,
}) => {
  const [organizations, setOrganizations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const debouncedSearchQuery = useDebounce(searchTerm, 300);

  // Load all organizations function
  const loadAllOrganizations = async () => {
    setIsLoading(true);
    try {
      const response = await getAllOrganizations();
      if (response.isSuccess && Array.isArray(response.data)) {
        setOrganizations(response.data);
      } else {
        setOrganizations([]);
      }
    } catch (error) {
      setOrganizations([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  useEffect(() => {
    const query = debouncedSearchQuery.trim();
    if (!query) {
      if (showDropdown) {
        loadAllOrganizations();
      }
      return;
    }

    const fetchBySearch = async () => {
      setIsLoading(true);
      try {
        const response = await searchOrganizations(query);
        if (response.isSuccess && Array.isArray(response.data)) {
          setOrganizations(response.data);
        } else {
          setOrganizations([]);
        }
      } catch (error) {
        setOrganizations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBySearch();
  }, [debouncedSearchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearchFocus = () => {
    setShowDropdown(true);
    if (!searchTerm.trim()) {
      loadAllOrganizations();
    }
  };

  const handleOrganizationSelect = (org) => {
    const orgId = org.organizationId || org.id;
    if (onSelect) {
      onSelect(orgId, org);
    }
    setShowDropdown(false);
    setSearchTerm("");
  };

  // For org admins, show the pre-selected organization
  // For filers, only show explicitly selected organization (not from context/auth)
  const displayOrganizationId = isOrgAdmin 
    ? (selectedOrganizationId || organizationId)
    : selectedOrganizationId;
  const displayOrganizationData = isOrgAdmin
    ? (selectedOrganizationData || organizationData)
    : selectedOrganizationData;

  return (
    <div>
      <h2 className="theme-color font-med mb-1">1. Select Organization</h2>

      <p className="text-muted small mb-3">
        {isOrgAdmin
          ? "You are associated with the following organization. This organization will be used for filing the petition."
          : "Please select the organization that will be filing this petition. The organization details will be used to pre-fill the filing entity information."}
      </p>

      {isOrgAdmin ? (
        // For org admins, show the pre-selected organization as read-only
        <div className="selected-org-container">
          {organizationLoading && !displayOrganizationData ? (
            <div className="d-flex align-items-center text-muted">
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <span>Loading organization details...</span>
            </div>
          ) : displayOrganizationData ? (
            <div className="selected-org-badge">
              <div className="selected-org-icon">
                <i className="fa-solid fa-building"></i>
              </div>
              <div className="selected-org-info">
                <div className="selected-org-name">
                  {displayOrganizationData.name}
                </div>
                <div className="selected-org-details">
                  {displayOrganizationData.type && (
                    <span className="selected-org-type">
                      {displayOrganizationData.type}
                    </span>
                  )}
                  {(displayOrganizationData.addressStreet1 ||
                    displayOrganizationData.addressCity ||
                    displayOrganizationData.addressState ||
                    displayOrganizationData.addressZip) && (
                    <span className="selected-org-address">
                      {" "}
                      •{" "}
                      {`${displayOrganizationData.addressStreet1 || ""}${
                        displayOrganizationData.addressStreet2
                          ? ", " + displayOrganizationData.addressStreet2
                          : ""
                      }, ${displayOrganizationData.addressCity || ""}, ${
                        displayOrganizationData.addressState || ""
                      } ${displayOrganizationData.addressZip || ""}`
                        .replace(/^,\s*/, "")
                        .replace(/,\s*$/, "")}
                    </span>
                  )}
                </div>
              </div>
              <span className="badge bg-success ms-2">
                <i className="fa-solid fa-check-circle me-1"></i>
                Pre-selected
              </span>
            </div>
          ) : (
            <div className="text-muted">Unable to load organization details</div>
          )}
        </div>
      ) : (
        // For filers, show the organization selector matching OrganizationActions styling
        <div className="search-form-wrapper" ref={searchRef}>
          {displayOrganizationData ? (
            <div className="selected-org-container">
              <div className="selected-org-badge">
                <div className="selected-org-icon">
                  <i className="fa-solid fa-building"></i>
                </div>
                <div className="selected-org-info">
                  <div className="selected-org-name">
                    {displayOrganizationData.name}
                  </div>
                  <div className="selected-org-details">
                    {displayOrganizationData.type && (
                      <span className="selected-org-type">
                        {displayOrganizationData.type}
                      </span>
                    )}
                    {(displayOrganizationData.addressStreet1 ||
                      displayOrganizationData.addressCity ||
                      displayOrganizationData.addressState ||
                      displayOrganizationData.addressZip) && (
                      <span className="selected-org-address">
                        {" "}
                        •{" "}
                        {`${displayOrganizationData.addressStreet1 || ""}${
                          displayOrganizationData.addressStreet2
                            ? ", " + displayOrganizationData.addressStreet2
                            : ""
                        }, ${displayOrganizationData.addressCity || ""}, ${
                          displayOrganizationData.addressState || ""
                        } ${displayOrganizationData.addressZip || ""}`
                          .replace(/^,\s*/, "")
                          .replace(/,\s*$/, "")}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="selected-org-remove"
                  onClick={() => {
                    if (onSelect) {
                      onSelect(null, null);
                    }
                    setShowDropdown(false);
                    setSearchTerm("");
                  }}
                  title="Remove selection"
                >
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
            </div>
          ) : (
            <div className="search-input-container">
              <input
                className={`form-control ${fieldErrors?.organizationId ? "is-invalid" : ""}`}
                type="search"
                placeholder="Search by organization name or EIN"
                aria-label="Search"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
                onFocus={handleSearchFocus}
              />
              {fieldErrors?.organizationId && (
                <div className="text-danger small mt-1">
                  {fieldErrors.organizationId}
                </div>
              )}
            </div>
          )}

          {/* Search Dropdown */}
          {showDropdown && (
            <div className="org-search-dropdown">
              {isLoading ? (
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
                  {organizations.map((org) => {
                    const orgId = org.id || org.organizationId;
                    const isSelected = orgId === displayOrganizationId;
                    return (
                      <div
                        key={orgId}
                        className={`org-search-item ${isSelected ? "bg-light" : ""}`}
                        onClick={() => handleOrganizationSelect(org)}
                      >
                        <div className="org-item-name">{org.name}</div>
                        <div className="org-item-details">
                          <span className="org-item-type">
                            <i className="fa-solid fa-building me-1"></i>
                            {org.type || "N/A"}
                          </span>
                          {(org.addressStreet1 ||
                            org.addressCity ||
                            org.addressState ||
                            org.addressZip) && (
                            <span className="org-item-address ms-3">
                              <i className="fa-solid fa-location-dot me-1"></i>
                              {`${org.addressStreet1 || ""}${
                                org.addressStreet2
                                  ? ", " + org.addressStreet2
                                  : ""
                              }, ${org.addressCity || ""}, ${
                                org.addressState || ""
                              } ${org.addressZip || ""}`
                                .replace(/^,\s*/, "")
                                .replace(/,\s*$/, "")}
                            </span>
                          )}
                        </div>
                        {(org.primaryContactName ||
                          org.primaryContactEmail ||
                          org.primaryContactPhone) && (
                          <div className="org-item-contact">
                            <i className="fa-solid fa-user me-1"></i>
                            {org.primaryContactName && (
                              <span>{org.primaryContactName}</span>
                            )}
                            {org.primaryContactEmail && (
                              <span className="ms-2">
                                {org.primaryContactEmail}
                              </span>
                            )}
                            {org.primaryContactPhone && (
                              <span className="ms-2">
                                {org.primaryContactPhone}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
    </div>
  );
};

export default Step1OrganizationSelection;

