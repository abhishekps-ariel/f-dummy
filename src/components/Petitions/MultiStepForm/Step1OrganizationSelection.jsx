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
  const displayOrganizationId = selectedOrganizationId || organizationId;
  const displayOrganizationData = selectedOrganizationData || organizationData;

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
        <div className="card border">
          <div className="card-body">
            {displayOrganizationData ? (
              <div>
                <h5 className="mb-2">
                  <i className="fa-solid fa-building me-2 text-primary"></i>
                  {displayOrganizationData.name}
                </h5>
                {displayOrganizationData.addressCity && displayOrganizationData.addressState && (
                  <p className="text-muted mb-0">
                    <i className="fa-solid fa-location-dot me-2"></i>
                    {displayOrganizationData.addressCity}, {displayOrganizationData.addressState}
                  </p>
                )}
                <div className="mt-2">
                  <span className="badge bg-success">
                    <i className="fa-solid fa-check-circle me-1"></i>
                    Pre-selected
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted mb-0">Loading organization details...</p>
            )}
          </div>
        </div>
      ) : (
        // For filers, show the organization selector
        <div className="embedded-org-selector" ref={searchRef} style={{ maxWidth: "600px" }}>
          {displayOrganizationData ? (
            <div className="card border">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1">
                      <i className="fa-solid fa-building me-2 text-primary"></i>
                      {displayOrganizationData.name}
                    </h5>
                    {displayOrganizationData.addressCity && displayOrganizationData.addressState && (
                      <p className="text-muted mb-0 small">
                        <i className="fa-solid fa-location-dot me-2"></i>
                        {displayOrganizationData.addressCity}, {displayOrganizationData.addressState}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => {
                      setShowDropdown(!showDropdown);
                      setSearchTerm("");
                    }}
                  >
                    <i className="fa-solid fa-pencil me-1"></i>
                    Change
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card border">
              <div className="card-body">
                <button
                  type="button"
                  className="btn btn-outline-primary w-100"
                  onClick={() => {
                    setShowDropdown(!showDropdown);
                    if (!showDropdown) {
                      loadAllOrganizations();
                    }
                  }}
                >
                  <i className="fa-solid fa-building me-2"></i>
                  Select Organization
                </button>
              </div>
            </div>
          )}

          {showDropdown && (
            <div className="embedded-org-dropdown" style={{ position: "relative", marginTop: "8px" }}>
              <div className="embedded-org-search">
                <input
                  className="form-control form-control-sm"
                  type="search"
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                  }}
                  onFocus={handleSearchFocus}
                  autoFocus
                />
              </div>
              <div className="embedded-org-results">
                {isLoading ? (
                  <div className="embedded-org-loading">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <span className="ms-2">Loading...</span>
                  </div>
                ) : organizations.length > 0 ? (
                  organizations.map((org) => {
                    const orgId = org.id || org.organizationId;
                    const isSelected = orgId === displayOrganizationId;
                    return (
                      <div
                        key={orgId}
                        className={`embedded-org-item ${isSelected ? "selected" : ""}`}
                        onClick={() => handleOrganizationSelect(org)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="embedded-org-item-name">{org.name}</div>
                        {org.addressCity && org.addressState && (
                          <div className="embedded-org-item-location">
                            {org.addressCity}, {org.addressState}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="embedded-org-no-results">
                    No organizations found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Step1OrganizationSelection;

