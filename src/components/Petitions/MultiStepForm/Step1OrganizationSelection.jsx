import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
    } catch {
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
      } catch {
        setOrganizations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBySearch();
  }, [debouncedSearchQuery, showDropdown]);

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

  const handleOrganizationItemKeyDown = (event, org) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOrganizationSelect(org);
    }
  };

  const renderOrganizationItem = (org) => {
    const orgId = org.id || org.organizationId;
    const isSelected = orgId === displayOrganizationId;
    return (
      <button
        type="button"
        key={orgId}
        className={`org-search-item ${isSelected ? "bg-light" : ""}`}
        onClick={() => handleOrganizationSelect(org)}
        onKeyDown={(e) => handleOrganizationItemKeyDown(e, org)}
      >
        <div className="org-item-name">{org.name}</div>
        <div className="org-item-details">
          <span className="org-item-type">
            <i className="fa-solid fa-building me-1"></i>
            {org.type || t("common.nA")}
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
      </button>
    );
  };

  const renderSearchDropdownContent = () => {
    if (isLoading) {
      return (
        <div className="org-search-loading">
          <div
            className="spinner-border spinner-border-sm text-primary me-2"
            aria-hidden="true"
          />
          <output className="visually-hidden">{t("common.loading")}</output>
          <span>{t("petitionSteps.step1.loadingOrganizations")}</span>
        </div>
      );
    }

    if (organizations.length > 0) {
      return (
        <div className="org-search-results">
          {organizations.map((org) => renderOrganizationItem(org))}
        </div>
      );
    }

    return (
      <div className="org-search-no-results">
        <i className="fa-solid fa-search me-2"></i>
        {t("petitionSteps.step1.noOrganizationsFound")}
      </div>
    );
  };

  const getDisplayOrganizationId = () => {
    if (isOrgAdmin) {
      return selectedOrganizationId || organizationId;
    }
    return selectedOrganizationId;
  };

  const getDisplayOrganizationData = () => {
    if (isOrgAdmin) {
      return selectedOrganizationData || organizationData;
    }
    return selectedOrganizationData;
  };

  const displayOrganizationId = getDisplayOrganizationId();
  const displayOrganizationData = getDisplayOrganizationData();

  const renderAdminContent = () => {
    if (organizationLoading && !displayOrganizationData) {
      return (
        <div className="d-flex align-items-center text-muted">
          <div className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
          <output className="visually-hidden">{t("common.loading")}</output>
          <span>{t("petitionSteps.step1.loadingOrganization")}</span>
        </div>
      );
    }

    if (displayOrganizationData) {
      return (
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
            {t("petitionSteps.step1.preSelected")}
          </span>
        </div>
      );
    }

    return (
      <div className="text-muted">{t("petitionSteps.step1.unableToLoad")}</div>
    );
  };

  const renderSelectedOrganization = () => {
    if (!displayOrganizationData) {
      return null;
    }

    return (
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
            title={t("petitionSteps.step1.removeSelection")}
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
      </div>
    );
  };

  const renderFilerContent = () => {
    return (
      <div className="search-form-wrapper" ref={searchRef}>
        {displayOrganizationData ? (
          renderSelectedOrganization()
        ) : (
          <div className="search-input-container">
            <input
              className={`form-control ${fieldErrors?.organizationId ? "is-invalid" : ""}`}
              type="search"
              placeholder={t("petitionSteps.step1.searchPlaceholder")}
              aria-label={t("common.search")}
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

        {showDropdown && (
          <div className="org-search-dropdown">
            {renderSearchDropdownContent()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h2 className="theme-color font-med mb-1">{t("petitionSteps.step1.title")}</h2>

      <p className="text-muted small mb-3">
        {isOrgAdmin
          ? t("petitionSteps.step1.descriptionOrgAdmin")
          : t("petitionSteps.step1.description")}
      </p>

      {isOrgAdmin ? (
        <div className="selected-org-container">{renderAdminContent()}</div>
      ) : (
        renderFilerContent()
      )}
    </div>
  );
};

Step1OrganizationSelection.propTypes = {
  selectedOrganizationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  selectedOrganizationData: PropTypes.object,
  onSelect: PropTypes.func,
  isOrgAdmin: PropTypes.bool,
  organizationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  organizationData: PropTypes.object,
  organizationLoading: PropTypes.bool,
  fieldErrors: PropTypes.shape({
    organizationId: PropTypes.string,
  }),
};

export default Step1OrganizationSelection;

