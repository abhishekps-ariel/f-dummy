import React, { useState, useEffect, useRef } from "react";
import { getAllOrganizations, searchOrganizations } from "../../services/organizationService";
import { useDebounce } from "../../hooks/useDebounce";

const OrganizationSelectionModal = ({ isOpen, onSelect, onClose }) => {
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

  // Load all organizations on mount
  useEffect(() => {
    if (isOpen) {
      loadAllOrganizations();
    }
  }, [isOpen]);

  // Handle search
  useEffect(() => {
    if (!isOpen) return;
    
    const query = debouncedSearchQuery.trim();
    if (!query) {
      loadAllOrganizations();
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
  }, [debouncedSearchQuery, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

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
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1090 }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Select Organization</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <p className="text-muted mb-3">
              Please select the organization that will be filing this petition. The organization details will be used to pre-fill the filing entity information.
            </p>

            <div className="search-form-wrapper" ref={searchRef}>
              <div className="search-input-container">
                <label htmlFor="orgSearch" className="form-label">
                  Search Organization *
                </label>
                <input
                  id="orgSearch"
                  className="form-control"
                  type="search"
                  placeholder="Search by organization name or EIN"
                  aria-label="Search"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={handleSearchFocus}
                />

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
                          return (
                            <div
                              key={orgId}
                              className="org-search-item"
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
                                      org.addressStreet2 ? ", " + org.addressStreet2 : ""
                                    }, ${org.addressCity || ""}, ${org.addressState || ""} ${
                                      org.addressZip || ""
                                    }`
                                      .replace(/^,\s*/, "")
                                      .replace(/,\s*$/, "")}
                                  </span>
                                )}
                              </div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationSelectionModal;

