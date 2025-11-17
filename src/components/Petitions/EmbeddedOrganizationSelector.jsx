import React, { useState, useEffect, useRef } from "react";
import { getAllOrganizations, searchOrganizations } from "../../services/organizationService";
import { useDebounce } from "../../hooks/useDebounce";

const EmbeddedOrganizationSelector = ({ 
  selectedOrganizationId, 
  selectedOrganizationData,
  onSelect, 
  isOrgAdmin 
}) => {
  const [organizations, setOrganizations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const debouncedSearchQuery = useDebounce(searchTerm, 300);

  // Don't show for org admins
  if (isOrgAdmin) return null;

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

  return (
    <div className="embedded-org-selector" ref={searchRef}>
      {selectedOrganizationData ? (
        <div 
          className="selected-org-display"
          onClick={() => setShowDropdown(!showDropdown)}
          style={{ cursor: "pointer" }}
        >
          <i className="fa-solid fa-building me-1" style={{ fontSize: "0.75rem" }}></i>
          <span className="org-name">{selectedOrganizationData.name}</span>
          <i className="fa-solid fa-chevron-down ms-1" style={{ fontSize: "0.65rem" }}></i>
        </div>
      ) : (
        <button
          type="button"
          className="btn-select-org-minimal"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <i className="fa-solid fa-building me-1" style={{ fontSize: "0.75rem" }}></i>
          <span>Select Organization</span>
        </button>
      )}

      {showDropdown && (
        <div className="embedded-org-dropdown">
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
                const isSelected = orgId === selectedOrganizationId;
                return (
                  <div
                    key={orgId}
                    className={`embedded-org-item ${isSelected ? "selected" : ""}`}
                    onClick={() => handleOrganizationSelect(org)}
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
  );
};

export default EmbeddedOrganizationSelector;

