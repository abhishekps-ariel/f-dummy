import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../constants/routerConstants";
import { logout as logoutApi } from "../../services/authService";
import { clearAuthData, getAuthData } from "../../utils/storage";
import Sidebar from "../../components/shared/Sidebar";
import Header from "../../components/shared/Header";
import {
  getAllOrganizations,
  getUserJoinRequests,
  getOrganizationsByUser,
  searchOrganizations,
  submitJoinRequest,
} from "../../services/organizationService";
import { useDebounce } from "../../hooks/useDebounce";
import { toast } from "react-toastify";
import { formatDate } from "../../utils/dateUtils";
import "../../styles/custom.css";

const REQUEST_STATUS_META = {
  0: { label: "Pending", badgeClass: "status-pending" },
  1: { label: "Approved", badgeClass: "status-approved" },
  2: { label: "Denied", badgeClass: "status-rejected" },
};

const Organizations = () => {
  const navigate = useNavigate();
  const {
    user,
    logout,
    organizations: linkedOrganizations,
    organization: activeOrganization,
    activeOrganizationId,
    setActiveOrganization,
    syncUserData,
  } = useAuth();
  const [activeSection, setActiveSection] = useState("organizations");
  const [searchTerm, setSearchTerm] = useState("");
  const [switchSearchTerm, setSwitchSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [selectedSwitchOrgId, setSelectedSwitchOrgId] = useState(null);
  const searchRef = useRef(null);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [isLoadingJoinRequests, setIsLoadingJoinRequests] = useState(false);
  const [hasLoadedJoinRequests, setHasLoadedJoinRequests] = useState(false);
  const [isSubmittingJoinRequest, setIsSubmittingJoinRequest] = useState(false);
  const [isLoadingUserOrganizations, setIsLoadingUserOrganizations] = useState(false);
  const debouncedSearchQuery = useDebounce(searchTerm, 300);
  const redirectGuardRef = useRef(false);
  const hasFetchedUserOrganizationsRef = useRef(false);

  const isOrgAdminUser = useMemo(() => {
    if (!user) return false;
    if (user.isManager === true) return true;

    if (Array.isArray(user.roles)) {
      const normalizedRoles = user.roles.map((role) => role?.toLowerCase?.() ?? role);
      if (
        normalizedRoles.includes("organisation admin") ||
        normalizedRoles.includes("organization admin") ||
        normalizedRoles.includes("orgadmin")
      ) {
        return true;
      }
    }

    const primaryRole =
      user.role ||
      (Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : null);
    return (
      primaryRole === "orgAdmin" ||
      primaryRole === "Organisation Admin" ||
      primaryRole === "Organization Admin"
    );
  }, [user]);

  const handleLogout = async () => {
    try {
      const { refreshToken } = getAuthData();
      if (refreshToken) {
        await logoutApi(refreshToken);
      }
    } catch (error) {
      // Continue with logout even if API fails
    } finally {
      clearAuthData();
      logout();
      navigate(ROUTES.LOGIN);
    }
  };

  useEffect(() => {
    if (isOrgAdminUser && !redirectGuardRef.current) {
      redirectGuardRef.current = true;
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [isOrgAdminUser, navigate]);

  const loadAllOrganizations = useCallback(async () => {
      setIsLoadingOrgs(true);
      try {
      const response = await getAllOrganizations();
      if (response.isSuccess && Array.isArray(response.data)) {
        setSearchResults(response.data);
        } else {
        setSearchResults([]);
        }
      } catch (error) {
      setSearchResults([]);
      } finally {
        setIsLoadingOrgs(false);
      }
  }, []);

  const loadJoinRequests = useCallback(async () => {
    setIsLoadingJoinRequests(true);
    try {
      const response = await getUserJoinRequests();
      if (response.isSuccess && Array.isArray(response.data)) {
        setJoinRequests(response.data);
      } else {
        setJoinRequests([]);
      }
    } catch (error) {
      setJoinRequests([]);
    } finally {
      setIsLoadingJoinRequests(false);
      setHasLoadedJoinRequests(true);
    }
  }, []);

  useEffect(() => {
    const query = debouncedSearchQuery.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }

    const fetchBySearch = async () => {
      setIsLoadingOrgs(true);
      try {
        const response = await searchOrganizations(query);
        if (response.isSuccess && Array.isArray(response.data)) {
          setSearchResults(response.data);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        setSearchResults([]);
      } finally {
        setIsLoadingOrgs(false);
      }
    };

      fetchBySearch();
  }, [debouncedSearchQuery]);

  useEffect(() => {
    if (isOrgAdminUser) {
      return;
    }
    loadJoinRequests();
  }, [isOrgAdminUser, loadJoinRequests]);

  const fetchUserOrganizations = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    setIsLoadingUserOrganizations(true);
    try {
      const response = await getOrganizationsByUser(user.id);
      if (response.isSuccess && Array.isArray(response.data)) {
        const organizations = response.data.map((org) => ({
          ...org,
          organizationId: org.organizationId || org.id || null,
        }));
        const updatedUser = {
          ...user,
          organizations,
        };
        syncUserData(updatedUser);
      }
    } catch (error) {
      // swallow errors for now
    } finally {
      hasFetchedUserOrganizationsRef.current = true;
      setIsLoadingUserOrganizations(false);
    }
  }, [user, syncUserData]);

  useEffect(() => {
    if (!user || isOrgAdminUser) {
      return;
    }

    if (hasFetchedUserOrganizationsRef.current) {
      return;
    }

    fetchUserOrganizations();
  }, [user, isOrgAdminUser, fetchUserOrganizations]);

  const refreshUserOrganizations = async () => {
    hasFetchedUserOrganizationsRef.current = false;
    await fetchUserOrganizations();
  };

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

  const handleSearchFocus = () => {
    setShowDropdown(true);
    if (!searchTerm.trim()) {
      loadAllOrganizations();
    }
  };

  const handleOrganizationSelect = (org) => {
    setSelectedOrganization(org);
    setSearchTerm("");
    setShowDropdown(false);
  };

  const handleRemoveSelectedOrganization = () => {
    setSelectedOrganization(null);
    setSearchTerm("");
    setShowDropdown(false);
  };

  const handleSubmitJoinRequest = async (event) => {
    event.preventDefault();

    if (!selectedOrganization) {
      toast.error("Please select an organization first");
      return;
    }

    const organizationIdForRequest =
      selectedOrganization.organizationId || selectedOrganization.id;

    if (!organizationIdForRequest) {
      toast.error("Unable to determine organization id for this request.");
      return;
    }

    setIsSubmittingJoinRequest(true);
    try {
      const response = await submitJoinRequest(organizationIdForRequest);

      if (response.isSuccess) {
        toast.success(response.msg || "Join request submitted successfully!");
        setSelectedOrganization(null);
        setSearchTerm("");
        setShowDropdown(false);
        await loadJoinRequests();

        const updatedUserDetail = response.data?.userDetail;
        if (updatedUserDetail) {
          syncUserData(updatedUserDetail);
        }
      } else {
        toast.error(response.msg || "Failed to submit join request");
      }
    } catch (error) {
      toast.error("Failed to submit join request. Please try again.");
    } finally {
      setIsSubmittingJoinRequest(false);
    }
  };

  const filteredSwitchOrganizations = useMemo(() => {
    const organizationsList = Array.isArray(linkedOrganizations)
      ? linkedOrganizations
      : [];
    if (!switchSearchTerm.trim()) return organizationsList;

    return organizationsList.filter((org) =>
      (org.name || "")
        .toLowerCase()
        .includes(switchSearchTerm.toLowerCase())
    );
  }, [linkedOrganizations, switchSearchTerm]);

  const getOrganizationSummary = useCallback((org) => {
    if (!org || typeof org !== "object") {
      return {
        name: "Organization",
        type: "N/A",
        address: null,
        contactName: null,
        contactEmail: null,
        contactPhone: null,
        email: null,
        phone: null,
      };
    }

    const addressSegments = [
      [org.addressStreet1, org.addressStreet2].filter(Boolean).join(", "),
      org.addressCity,
      org.addressState,
      org.addressZip,
    ].filter(Boolean);

    return {
      name: org.name || "Organization",
      type: org.type || "N/A",
      address: addressSegments.length > 0 ? addressSegments.join(", ") : null,
      contactName:
        org.primaryContactName ||
        org.contactName ||
        org.organizationContactName ||
        null,
      contactEmail:
        org.primaryContactEmail ||
        org.organizationEmail ||
        org.contactEmail ||
        null,
      contactPhone:
        org.primaryContactPhone ||
        org.organizationPhone ||
        org.contactPhone ||
        null,
      email: org.organizationEmail || org.primaryContactEmail || null,
      phone: org.organizationPhone || org.primaryContactPhone || null,
    };
  }, []);

  const resolveOrganizationId = useCallback(
    (org) => org?.organizationId || org?.id || null,
    []
  );

  const activeOrganizationEntity = useMemo(() => {
    if (activeOrganization && Object.keys(activeOrganization).length > 0) {
      return activeOrganization;
    }

    return (linkedOrganizations || []).find(
      (org) => resolveOrganizationId(org) === activeOrganizationId
    );
  }, [activeOrganization, linkedOrganizations, activeOrganizationId, resolveOrganizationId]);

  const activeOrganizationSummary = useMemo(
    () => getOrganizationSummary(activeOrganizationEntity),
    [activeOrganizationEntity, getOrganizationSummary]
  );
  const hasActiveOrganization = Boolean(activeOrganizationEntity);

  const filteredJoinRequests = useMemo(() => {
    if (!Array.isArray(joinRequests)) return [];

    return joinRequests.filter((request) => {
      switch (selectedTab) {
        case "pending":
          return request.status === 0;
        case "approved":
          return request.status === 1;
        case "denied":
          return request.status === 2;
        case "all":
        default:
          return true;
      }
    });
  }, [joinRequests, selectedTab]);

  const activeOrganizationContact = useMemo(() => {
    if (!activeOrganizationEntity) {
      return {
        name: null,
        email: null,
        phone: null,
      };
    }

    const summary = getOrganizationSummary(activeOrganizationEntity);
    return {
      name: summary.contactName,
      email: summary.contactEmail,
      phone: summary.contactPhone,
    };
  }, [activeOrganizationEntity, getOrganizationSummary]);

  if (isOrgAdminUser) {
    return null;
  }

  return (
    <div className="dashboard-wrapper">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={handleLogout}
      />

      <main className="dashboard-main-area container-fluid">
        <Header user={user} pageTitle="Organizations" onLogout={handleLogout} />

        <div className="dashboard-content-section">
          <section className="shadow-custom bg-white p-4 mb-4 rounded-3 border border-light-subtle">
            <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
              <div>
                <h3 className="h6 mb-2">Active Organization</h3>
                <h2 className="h5 mb-2 text-dark">
                  {hasActiveOrganization ? activeOrganizationSummary.name : "No Active Organization"}
                </h2>
                <div className="text-muted small d-flex flex-wrap gap-3">
                  <span>
                    <i className="fa-solid fa-tag me-1"></i>
                    {hasActiveOrganization ? activeOrganizationSummary.type : "Select from your organization list"}
                  </span>
                  {hasActiveOrganization && (
                    <>
                      {activeOrganizationSummary.address && (
                  <span>
                  <i className="fa-solid fa-location-dot me-1"></i>
                          {activeOrganizationSummary.address}
                  </span>
                      )}
                  {activeOrganizationContact.name && (
                    <span>
                      <i className="fa-solid fa-user me-1"></i>
                      {activeOrganizationContact.name}
                    </span>
                  )}
                  {activeOrganizationContact.email && (
                    <span>
                    <i className="fa-solid fa-envelope me-1"></i>
                      {activeOrganizationContact.email}
                    </span>
                  )}
                  {activeOrganizationContact.phone && (
                    <span>
                      <i className="fa-solid fa-phone me-1"></i>
                      {activeOrganizationContact.phone}
                  </span>
                      )}
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm d-inline-flex align-items-center gap-2 bg-warning-subtle text-warning fw-semibold border-0 rounded-pill"
                onClick={() => {
                  setSelectedSwitchOrgId(activeOrganizationId);
                  setIsSwitchModalOpen(true);
                }}
              >
                <i className="fa-solid fa-retweet"></i>
                Switch Organization
              </button>
            </div>
          </section>

          <section className="shadow-custom bg-white p-4 mb-4 rounded-3 border border-light-subtle">
                <h3 className="h6 mb-3">Join Organization</h3>
                <p className="text-muted small mb-4">
                  Search for an organization and send a join request.
                </p>
                <div className="search-form-wrapper" ref={searchRef}>
                  <form className="search-form" onSubmit={handleSubmitJoinRequest}>
                    {selectedOrganization ? (
                      <div className="selected-org-container mb-3">
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
                              {(selectedOrganization.addressStreet1 ||
                                selectedOrganization.addressCity ||
                                selectedOrganization.addressState ||
                                selectedOrganization.addressZip) && (
                                <span className="selected-org-address">
                              {`
                                ${selectedOrganization.addressStreet1 || ""}${
                                    selectedOrganization.addressStreet2
                                      ? ", " + selectedOrganization.addressStreet2
                                      : ""
                                  }, ${selectedOrganization.addressCity || ""}, ${
                                    selectedOrganization.addressState || ""
                                } ${selectedOrganization.addressZip || ""}
                              `
                                    .replace(/^,\s*/, "")
                                    .replace(/,\s*$/, "")}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="selected-org-remove"
                            title="Remove selection"
                            onClick={handleRemoveSelectedOrganization}
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
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setShowDropdown(true);
                        }}
                          onFocus={handleSearchFocus}
                      />

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
                          ) : searchResults.length > 0 ? (
                            <div className="org-search-results">
                              {searchResults.map((org) => {
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
          </section>

          <section className="row g-4">
            <div className="col-12 col-xl-6">
              <div className="shadow-custom bg-white p-4 h-100 rounded-3 border border-light-subtle">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="h6 mb-0">My Organizations</h3>
                  <div className="d-flex align-items-center gap-2">
                    {isLoadingUserOrganizations && (
                      <span
                        className="spinner-border spinner-border-sm text-primary"
                        role="status"
                        aria-hidden="true"
                      ></span>
                    )}
                    <button
                      type="button"
                      className="dashboard-btn-refresh d-inline-flex align-items-center gap-2"
                      onClick={refreshUserOrganizations}
                      disabled={isLoadingUserOrganizations}
                    >
                      {isLoadingUserOrganizations ? (
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        ></span>
                      ) : (
                        <i className="fa-solid fa-sync-alt"></i>
                      )}
                    </button>
                    <span className="badge bg-light text-dark">
                      {(linkedOrganizations || []).length} linked
                    </span>
                  </div>
                </div>
                <p className="text-muted small mb-4">
                  Organizations currently associated with your account. Select one to make it your active organization.
                </p>

                {(!linkedOrganizations || linkedOrganizations.length === 0) ? (
                  <div className="text-center text-muted py-4">
                    <i className="fa-solid fa-circle-nodes mb-2" style={{ fontSize: "2rem" }}></i>
                    <p className="mb-0">You are not linked to any organizations yet.</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {linkedOrganizations.map((org, index) => {
                      const orgId = resolveOrganizationId(org);
                      const isActive = orgId === activeOrganizationId;
                      const orgSummary = getOrganizationSummary(org);
                      return (
                        <div
                          key={orgId || index}
                          className={`border rounded-3 p-3 ${isActive ? "border-primary" : "border-light"}`}
                          style={{ cursor: "default", backgroundColor: isActive ? "rgba(2,101,163,0.05)" : "#fff" }}
                        >
                          <div className="d-flex justify-content-between align-items-start gap-2">
                            <div>
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <h4 className="h6 mb-0">{orgSummary.name}</h4>
                                {isActive && (
                                  <span className="badge bg-success-subtle text-success">
                                    <i className="fa-solid fa-circle-check me-1"></i>
                                    Active
                                  </span>
                                )}
                              </div>
                              <div className="text-muted small d-flex flex-column gap-1">
                                <span>
                                  <i className="fa-solid fa-tag me-1"></i>
                                  {orgSummary.type}
                                </span>
                                {orgSummary.address && (
                                  <span>
                                    <i className="fa-solid fa-location-dot me-1"></i>
                                    {orgSummary.address}
                                  </span>
                                )}
                                {(orgSummary.contactName ||
                                  orgSummary.contactEmail ||
                                  orgSummary.contactPhone) && (
                                  <span>
                                    <i className="fa-solid fa-user me-1"></i>
                                    {[orgSummary.contactName, orgSummary.contactEmail, orgSummary.contactPhone]
                                      .filter(Boolean)
                                      .join(" • ")}
                                  </span>
                                )}
                              </div>
                            </div>
                            {!isActive && (
                              <span className="badge bg-light text-muted">
                                {org.isPrimary ? "Primary" : "Linked"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            </div>

            <div className="col-12 col-xl-6">
              <div className="shadow-custom bg-white p-4 h-100 rounded-3 border border-light-subtle">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="h6 mb-0">Join Request Activity</h3>
                  <button
                    className="dashboard-btn-refresh d-inline-flex align-items-center gap-2"
                    type="button"
                    onClick={loadJoinRequests}
                    disabled={isLoadingJoinRequests}
                  >
                    {isLoadingJoinRequests ? (
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      ></span>
                    ) : (
                      <i className="fa-solid fa-sync-alt"></i>
                    )}
                  </button>
                </div>
                <p className="text-muted small mb-4">
                  Keep track of pending and historical join requests. Status updates reflect the latest responses from organization admins.
                </p>

                <ul className="nav nav-pills mb-3 flex-wrap gap-2">
                  {["all", "pending", "approved", "denied"].map((tab) => (
                    <li className="nav-item" key={tab}>
                      <button
                        className={`nav-btn-pill ${selectedTab === tab ? "active" : ""}`}
                        type="button"
                        onClick={() => setSelectedTab(tab)}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    </li>
                  ))}
                </ul>

                {isLoadingJoinRequests && !hasLoadedJoinRequests ? (
                  <div className="text-center text-muted py-4">
                    <div className="spinner-border text-primary mb-3" role="status">
                      <span className="visually-hidden">Loading join requests...</span>
                    </div>
                    <p className="mb-0">Loading join requests...</p>
                  </div>
                ) : filteredJoinRequests.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    <i className="fa-solid fa-inbox mb-2" style={{ fontSize: "2.2rem" }}></i>
                    <p className="mb-0">No join requests submitted yet.</p>
                    <small>Submit a request to see it appear here.</small>
                  </div>
                ) : (
                  <div className="d-flex flex-column">
                    {filteredJoinRequests.map((request) => {
                      const statusMeta =
                        REQUEST_STATUS_META[request.status] || {
                          label: "Unknown",
                          badgeClass: "bg-secondary",
                        };
                      const orgDetail = request.organizationDetail || request.organization || null;
                      const orgSummary = getOrganizationSummary(orgDetail);
                      return (
                        <div key={request.id} className="border rounded-3 p-3 mb-3">
                          <div className="d-flex justify-content-between align-items-start gap-3">
                            <div>
                              <h4 className="h6 mb-1">
                                {orgSummary.name}
                              </h4>
                              <div className="text-muted small d-flex flex-column gap-1">
                                <span>
                                  <i className="fa-solid fa-tag me-1"></i>
                                  {orgSummary.type}
                                </span>
                                {orgSummary.address && (
                                  <span>
                                    <i className="fa-solid fa-location-dot me-1"></i>
                                    {orgSummary.address}
                                  </span>
                                )}
                                {(orgSummary.contactName ||
                                  orgSummary.contactEmail ||
                                  orgSummary.contactPhone) && (
                                  <span>
                                    <i className="fa-solid fa-user me-1"></i>
                                    {[orgSummary.contactName, orgSummary.contactEmail, orgSummary.contactPhone]
                                      .filter(Boolean)
                                      .join(" • ")}
                                  </span>
                                )}
                              </div>
                              <div className="text-muted small">
                                {request.requestedOn && (
                                  <>
                                    <i className="fa-solid fa-calendar me-1"></i>
                                    Requested {formatDate(request.requestedOn)}
                                  </>
                                )}
                                {request.respondedOn && (
                                  <span className="ms-3">
                                    <i className="fa-solid fa-clock-rotate-left me-1"></i>
                                    Responded {formatDate(request.respondedOn)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={`badge ${statusMeta.badgeClass}`}>
                              {statusMeta.label}
                            </span>
                          </div>
                          {request.adminComment && (
                            <p className="text-muted small mt-3 mb-0">
                              <i className="fa-solid fa-comment-dots me-1 text-primary"></i>
                              {request.adminComment}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      {isSwitchModalOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Switch Organization</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setIsSwitchModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small text-muted">Search</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by organization name"
                    value={switchSearchTerm}
                    onChange={(e) => setSwitchSearchTerm(e.target.value)}
                  />
                </div>
                <div className="list-group">
                  {filteredSwitchOrganizations.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      <i className="fa-solid fa-magnifying-glass mb-2"></i>
                      <p className="mb-0">No matches found.</p>
                    </div>
                  ) : (
                    filteredSwitchOrganizations.map((org, index) => {
                      const orgId = resolveOrganizationId(org);
                      const orgSummary = getOrganizationSummary(org);
                      const isSelected = orgId === selectedSwitchOrgId;
                      return (
                        <div
                          key={orgId || index}
                          className={`switch-org-item ${isSelected ? "active" : ""}`}
                          onClick={() => setSelectedSwitchOrgId(orgId)}
                        >
                          <div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <span className="fw-semibold">{orgSummary.name}</span>
                              {isSelected && <i className="fa-solid fa-circle-check text-primary"></i>}
                            </div>
                            <div className="text-muted small d-flex flex-column gap-1">
                              <span>
                                <i className="fa-solid fa-tag me-1"></i>
                                {orgSummary.type}
                              </span>
                              {orgSummary.address && (
                                <span>
                                  <i className="fa-solid fa-location-dot me-1"></i>
                                  {orgSummary.address}
                                </span>
                              )}
                              {(orgSummary.contactName ||
                                orgSummary.contactEmail ||
                                orgSummary.contactPhone) && (
                                <span>
                                  <i className="fa-solid fa-user me-1"></i>
                                  {[orgSummary.contactName, orgSummary.contactEmail, orgSummary.contactPhone]
                                    .filter(Boolean)
                                    .join(" • ")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="dashboard-btn-refresh"
                  style={{ minWidth: "80px" }}
                  onClick={() => setIsSwitchModalOpen(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="dashboard-btn-create"
                  style={{ minWidth: "120px" }}
                  disabled={!selectedSwitchOrgId}
                  onClick={() => {
                    if (selectedSwitchOrgId) {
                      setActiveOrganization(selectedSwitchOrgId);
                    }
                    setIsSwitchModalOpen(false);
                  }}
                >
                  <i className="fa-solid fa-check me-2"></i>
                  Confirm Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Organizations;

