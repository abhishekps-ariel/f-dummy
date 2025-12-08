import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { register } from "../../services/authService";
import {
  bindUserToOrganization,
} from "../../services/organizationService";
import { useDebounce } from "../../hooks/useDebounce";
import { ROUTES } from "../../constants/routerConstants";
import { VALIDATION } from "../../constants/appConstants";
import loginImg from "../../assets/logo-sample.png";
import PasswordGuidelines from "../../components/shared/PasswordGuidelines";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "../../styles/custom.css";
import { checkPasswordGuidelines } from "../../helpers/auth/passwordValidation";
import { fetchInviteData } from "../../helpers/auth/inviteFlow";
import { searchOrganizationsByQuery } from "../../helpers/auth/organizationSearch";

function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordGuidelines, setShowPasswordGuidelines] = useState(false);
  const [passwordGuidelines, setPasswordGuidelines] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  // Invite flow state
  const [inviteData, setInviteData] = useState(null);
  const [isInviteFlow, setIsInviteFlow] = useState(false);
  const [isLoadingInvite, setIsLoadingInvite] = useState(false);
  const [inviteError, setInviteError] = useState(null);

  // Role selection state (Filer or Organisation Admin)
  const [selectedRole, setSelectedRole] = useState(null);

  // Organization search state (for Organisation Admin registration)
  const [organizationSearchQuery, setOrganizationSearchQuery] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const orgSearchRef = useRef(null);
  const debouncedOrgSearchQuery = useDebounce(organizationSearchQuery, 300);

  // Handle invite parameters and role on component mount
  useEffect(() => {
    const joinRequestId = searchParams.get("joinRequestId");
    const isAdminInvite = searchParams.get("isAdminInvite") === "true";
    const role = searchParams.get("role");

    if (joinRequestId) {
      setIsInviteFlow(true);
      setIsLoadingInvite(true);
      setInviteError(null);

      // Fetch invite data
      handleFetchInviteData(joinRequestId, isAdminInvite);
    } else {
      // Not an invite flow
      // Set role if provided in URL, otherwise default to "filer"
      if (role) {
        setSelectedRole(role === "orgAdmin" ? "orgAdmin" : "filer");
      } else {
        // Default to "filer" when coming from login page or direct navigation
        setSelectedRole("filer");
      }
    }
  }, [searchParams]);

  // Organization search effect
  useEffect(() => {
    const performOrgSearch = async () => {
      if (!hasSearched) return;

      setIsLoadingOrgs(true);
      try {
        const orgs = await searchOrganizationsByQuery(debouncedOrgSearchQuery || "");
        setOrganizations(orgs);
        setShowOrgDropdown(true);
      } catch {
        setOrganizations([]);
      } finally {
        setIsLoadingOrgs(false);
      }
    };

    performOrgSearch();
  }, [debouncedOrgSearchQuery, hasSearched]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        orgSearchRef.current &&
        !orgSearchRef.current.contains(event.target)
      ) {
        setShowOrgDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Helper functions are now imported from helpers/auth
  // fetchInviteData from helpers/auth/inviteFlow
  // checkPasswordGuidelines from helpers/auth/passwordValidation

  const handleFetchInviteData = async (joinRequestId, isAdminInvite) => {
    setIsLoadingInvite(true);
    setInviteError(null);
    
    const result = await fetchInviteData(joinRequestId, isAdminInvite);
    
    if (result.success) {
      setInviteData(result.data);
      // Pre-fill email field
      setFormData((prev) => ({
        ...prev,
        email: result.data.email,
      }));
    } else {
      setInviteError(result.error);
    }
    
    setIsLoadingInvite(false);
  };

  const handleCheckPasswordGuidelines = (password) => {
    const guidelines = checkPasswordGuidelines(password);
    setPasswordGuidelines(guidelines);
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate role selection (only for non-invite flows)
    if (!isInviteFlow && !selectedRole) {
      toast.error("Please select a registration type (Filer or Organisation Admin)");
      return false;
    }

    // Validate organization selection for Organisation Admin
    if (!isInviteFlow && selectedRole === "orgAdmin" && !selectedOrganization) {
      setErrors((prev) => ({ ...prev, organization: "Please select an organization" }));
      return false;
    } else if (selectedOrganization) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.organization;
        return newErrors;
      });
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (formData.phoneNumber.length < 10) {
      newErrors.phoneNumber = "Please enter a valid phone number";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    } else if (formData.email.toLowerCase().endsWith("@gmail.com")) {
      newErrors.email = "Gmail addresses are not accepted. Please use a different email domain.";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else {
      if (formData.password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
        newErrors.password = "Password must be at least 8 characters long";
      } else if (!/[A-Z]/.test(formData.password)) {
        newErrors.password =
          "Password must contain at least one uppercase letter";
      } else if (!/[a-z]/.test(formData.password)) {
        newErrors.password =
          "Password must contain at least one lowercase letter";
      } else if (!/\d/.test(formData.password)) {
        newErrors.password = "Password must contain at least one number";
      } else if (!/[@#$%^&*]/.test(formData.password)) {
        newErrors.password =
          "Password must contain at least one special character (@#$%^&*)";
      }
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }

    // Real-time email validation to block @gmail.com
    if (name === "email" && value.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setErrors({ ...errors, email: "Please enter a valid email address" });
      } else if (value.toLowerCase().endsWith("@gmail.com")) {
        setErrors({ ...errors, email: "Gmail addresses are not accepted. Please use a different email domain." });
      }
    }

    if (name === "password") {
      if (value.length > 0) {
        setShowPasswordGuidelines(true);
      }
      handleCheckPasswordGuidelines(value);
    }
  };

  const handleSearchInputChange = (e) => {
    setOrganizationSearchQuery(e.target.value);
    setHasSearched(true);
    setShowOrgDropdown(true);
    if (errors.organization) {
      setErrors({ ...errors, organization: "" });
    }
  };

  const handleOrganizationSelect = (org) => {
    setSelectedOrganization(org);
    setOrganizationSearchQuery("");
    setShowOrgDropdown(false);
    if (errors.organization) {
      setErrors({ ...errors, organization: "" });
    }
  };

  const handleRemoveOrganization = () => {
    setSelectedOrganization(null);
    setOrganizationSearchQuery("");
    setShowOrgDropdown(false);
    setHasSearched(false);
  };

  const handleSearchFocus = async () => {
    setHasSearched(true);
    if (organizationSearchQuery.trim() === "") {
      setIsLoadingOrgs(true);
      try {
        const orgs = await searchOrganizationsByQuery("");
        setOrganizations(orgs);
        setShowOrgDropdown(true);
      } catch {
        setOrganizations([]);
      } finally {
        setIsLoadingOrgs(false);
      }
    } else {
      setShowOrgDropdown(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // For invite flow, pass invite data to registration
      // Pass selectedRole and organizationId if not in invite flow (invite flow role is determined by invite)
      const organizationId = !isInviteFlow && selectedRole === "orgAdmin" && selectedOrganization
        ? selectedOrganization.id
        : null;
      
      const response = await register(
        formData,
        inviteData,
        !isInviteFlow ? selectedRole : null,
        organizationId
      );

      if (response.isSuccess) {
        if (isInviteFlow) {
          // For invite flow, bind user to organization if userId is returned
          if (response.data && response.data.userId && inviteData) {
            try {
              await bindUserToOrganization(
                inviteData.joinRequestId,
                response.data.userId
              );
              toast.success(
                "Account created and organization access granted! Please login to continue."
              );
            } catch (bindError) {
              toast.success(
                "Account created successfully! Please login to continue."
              );
              // Still navigate to login even if binding fails
            }
          } else {
            toast.success(
              "Account created successfully! Please login to continue."
            );
          }
          navigate(ROUTES.LOGIN);
        } else {
          // For normal registration, go to email verification
          navigate(ROUTES.VERIFICATION_EMAIL_SENT);
        }
      } else {
        toast.error(response.msg || "Registration failed!");
      }
    } catch (err) {
      // Handle specific error messages from API response
      if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error(err?.message || "Registration failed!");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Show loading state while fetching invite data
  if (isLoadingInvite) {
    return (
      <div className="login">
        <div className="container container-md-auto">
          <div className="row m-0">
            <div className="col-lg-5 col-md-4 px-0">
              <div className="login-right-image"></div>
            </div>
            <div className="col-lg-7 col-md-8">
              <div className="login-inner d-flex flex-column align-items-center justify-content-center register-inner">
                <div className="text-center">
                  <div
                    className="spinner-border text-primary mb-3"
                    role="status"
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <h5>Loading invite details...</h5>
                  <p className="text-muted">
                    Please wait while we verify your invite link.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if invite is invalid
  if (inviteError) {
    return (
      <div className="login">
        <div className="container container-md-auto">
          <div className="row m-0">
            <div className="col-lg-5 col-md-4 px-0">
              <div className="login-right-image"></div>
            </div>
            <div className="col-lg-7 col-md-8">
              <div className="login-inner d-flex flex-column align-items-center justify-content-center register-inner">
                <div className="text-center">
                  <div className="alert alert-danger" role="alert">
                    <i className="fa-solid fa-exclamation-triangle mb-2"></i>
                    <h5>Invalid Invite Link</h5>
                    <p>{inviteError}</p>
                    <Link to={ROUTES.REGISTER} className="btn btn-primary">
                      Try Regular Registration
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login">
      <div className="container container-md-auto">
        <div className="row m-0">
          <div className="col-lg-5 col-md-4 px-0">
            <div className="login-right-image"></div>
          </div>
          <div className="col-lg-7 col-md-8">
            <div className="login-inner d-flex flex-column align-items-center justify-content-center register-inner">
              <form className="w-100" onSubmit={handleSubmit}>
                <div className="login-header mb-5 text-center">
                  <div className="login-logo">
                    <Link to="/">
                      <img src={loginImg} alt="logo" className="w-100" />
                    </Link>
                  </div>
                  <h2 className="font-xl-med fw-bold">
                    {isInviteFlow ? "Complete Your Registration" : "Register"}
                  </h2>
                  {isInviteFlow ? (
                    <div className="alert alert-info mb-3" role="alert">
                      <i className="fa-solid fa-info-circle me-2"></i>
                      You've been invited to join an organization. Complete your
                      registration below.
                    </div>
                  ) : (
                    <p className="font-base">
                      Have an account?{" "}
                      <Link to="/login" className="text-dark-black fw-semibold">
                        Login{" "}
                      </Link>
                    </p>
                  )}
                  {!isInviteFlow && (
                    <div className="role-selection-container mb-4">
                      <label className="label-text mb-3 d-block text-center">
                        Select Registration Type
                      </label>
                      <div className="d-flex gap-3 justify-content-center">
                        <button
                          type="button"
                          className={`btn role-toggle-btn ${selectedRole === "filer" ? "active" : ""}`}
                          onClick={() => {
                            setSelectedRole("filer");
                            setSelectedOrganization(null);
                            setOrganizationSearchQuery("");
                          }}
                          style={{
                            flex: 1,
                            maxWidth: "200px",
                            padding: "12px 24px",
                            border: selectedRole === "filer" ? "2px solid #0265A3" : "2px solid #dee2e6",
                            borderRadius: "8px",
                            backgroundColor: selectedRole === "filer" ? "#0265A3" : "#fff",
                            color: selectedRole === "filer" ? "#fff" : "#333",
                            fontWeight: "600",
                            transition: "all 0.3s ease",
                            cursor: "pointer"
                          }}
                          onMouseEnter={(e) => {
                            if (selectedRole !== "filer") {
                              e.target.style.borderColor = "#0265A3";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedRole !== "filer") {
                              e.target.style.borderColor = "#dee2e6";
                            }
                          }}
                        >
                          <i className="fa-solid fa-user me-2"></i>
                          Filer
                        </button>
                        <button
                          type="button"
                          className={`btn role-toggle-btn ${selectedRole === "orgAdmin" ? "active" : ""}`}
                          onClick={() => setSelectedRole("orgAdmin")}
                          style={{
                            flex: 1,
                            maxWidth: "200px",
                            padding: "12px 24px",
                            border: selectedRole === "orgAdmin" ? "2px solid #0265A3" : "2px solid #dee2e6",
                            borderRadius: "8px",
                            backgroundColor: selectedRole === "orgAdmin" ? "#0265A3" : "#fff",
                            color: selectedRole === "orgAdmin" ? "#fff" : "#333",
                            fontWeight: "600",
                            transition: "all 0.3s ease",
                            cursor: "pointer"
                          }}
                          onMouseEnter={(e) => {
                            if (selectedRole !== "orgAdmin") {
                              e.target.style.borderColor = "#0265A3";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedRole !== "orgAdmin") {
                              e.target.style.borderColor = "#dee2e6";
                            }
                          }}
                        >
                          <i className="fa-solid fa-building me-2"></i>
                          Organisation Admin
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Organization Search - Only for Organisation Admin */}
                {selectedRole === "orgAdmin" && !isInviteFlow && (
                  <div className="form-group mb-4">
                    <label className="label-text mb-2">Organization</label>
                    <div className="search-form-wrapper" ref={orgSearchRef}>
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
                                    •{" "}
                                    {`${selectedOrganization.addressStreet1 || ""}${
                                      selectedOrganization.addressStreet2
                                        ? ", " + selectedOrganization.addressStreet2
                                        : ""
                                    }, ${selectedOrganization.addressCity || ""}, ${
                                      selectedOrganization.addressState || ""
                                    } ${selectedOrganization.addressZip || ""}`
                                      .replace(/^,\s*/, "")
                                      .replace(/,\s*$/, "")}
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
                            className={`form-control ${
                              errors.organization ? "is-invalid" : ""
                            }`}
                            type="search"
                            placeholder="Search by organization name or EIN"
                            aria-label="Search"
                            value={organizationSearchQuery}
                            onChange={handleSearchInputChange}
                            onFocus={handleSearchFocus}
                            required
                          />

                          {/* Search Dropdown */}
                          {showOrgDropdown && (
                            <div className="org-search-dropdown">
                              {isLoadingOrgs ? (
                                <div className="org-search-loading">
                                  <div
                                    className="spinner-border spinner-border-sm text-primary me-2"
                                    role="status"
                                  >
                                    <span className="visually-hidden">
                                      Loading...
                                    </span>
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
                    </div>
                    {errors.organization && (
                      <div className="invalid-feedback d-block mt-2">
                        <small className="text-danger">{errors.organization}</small>
                      </div>
                    )}
                    <small className="text-muted d-block mt-2">
                      Search and select the organization you want to register as admin for.
                    </small>
                  </div>
                )}

                <div className="form-group">
                  <label className="label-text">First Name</label>
                  <div className="input-group">
                    <div className="user-icon">
                      <i className="fa-solid fa-user"></i>
                    </div>
                    <input
                      name="firstName"
                      type="text"
                      className={`form-control ${
                        errors.firstName ? "is-invalid" : ""
                      }`}
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {errors.firstName && (
                    <div className="invalid-feedback d-block">
                      <small className="text-danger">{errors.firstName}</small>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="label-text">Last Name</label>
                  <div className="input-group">
                    <div className="user-icon">
                      <i className="fa-solid fa-user"></i>
                    </div>
                    <input
                      name="lastName"
                      type="text"
                      className={`form-control ${
                        errors.lastName ? "is-invalid" : ""
                      }`}
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {errors.lastName && (
                    <div className="invalid-feedback d-block">
                      <small className="text-danger">{errors.lastName}</small>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="label-text">Phone Number</label>
                  <PhoneInput
                    country={"us"}
                    value={formData.phoneNumber}
                    onChange={(phone) => {
                      setFormData({ ...formData, phoneNumber: `+${phone}` });
                      if (errors.phoneNumber) {
                        setErrors({ ...errors, phoneNumber: "" });
                      }
                    }}
                    inputClass={`form-control ${
                      errors.phoneNumber ? "is-invalid" : ""
                    }`}
                    containerClass="phone-input-container"
                    buttonClass="phone-input-button"
                    dropdownClass="phone-input-dropdown"
                    inputStyle={{
                      width: "100%",
                      height: "48px",
                      fontSize: "16px",
                      paddingLeft: "48px",
                      borderRadius: "8px",
                      border: errors.phoneNumber
                        ? "1px solid #dc3545"
                        : "1px solid #ced4da",
                    }}
                    buttonStyle={{
                      borderRadius: "8px 0 0 8px",
                      border: errors.phoneNumber
                        ? "1px solid #dc3545"
                        : "1px solid #ced4da",
                      borderRight: "none",
                      backgroundColor: "#fff",
                    }}
                    containerStyle={{
                      width: "100%",
                    }}
                  />
                  {errors.phoneNumber && (
                    <div className="invalid-feedback d-block">
                      <small className="text-danger">
                        {errors.phoneNumber}
                      </small>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="label-text">Email</label>
                  <div className="input-group">
                    <div className="user-icon">
                      <i className="fa-solid fa-envelope"></i>
                    </div>
                    <input
                      name="email"
                      type="email"
                      className={`form-control ${
                        errors.email ? "is-invalid" : ""
                      } ${isInviteFlow ? "bg-light" : ""}`}
                      placeholder="hello@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      readOnly={isInviteFlow}
                      required
                      style={isInviteFlow ? { cursor: "not-allowed" } : {}}
                    />
                  </div>
                  {errors.email && (
                    <div className="invalid-feedback d-block">
                      <small className="text-danger">{errors.email}</small>
                    </div>
                  )}
                  {isInviteFlow && (
                    <small className="text-muted">
                      Email is pre-filled from your invite link
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label className="label-text">Create Password</label>
                  <div className="input-group position-relative">
                    <div className="user-icon">
                      <i className="fa-solid fa-lock"></i>
                    </div>
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      className={`form-control ${
                        errors.password ? "is-invalid" : ""
                      }`}
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => setShowPasswordGuidelines(true)}
                      onBlur={() => setShowPasswordGuidelines(false)}
                      required
                    />
                    <span
                      className="password-eye"
                      onClick={togglePasswordVisibility}
                      style={{ cursor: "pointer" }}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      <i
                        className={`fa-solid ${
                          showPassword ? "fa-eye" : "fa-eye-slash"
                        }`}
                      ></i>
                    </span>
                    {/* Password Guidelines Tooltip */}
                    <PasswordGuidelines
                      showGuidelines={showPasswordGuidelines}
                      passwordGuidelines={passwordGuidelines}
                    />
                  </div>
                  {errors.password && (
                    <div className="invalid-feedback d-block">
                      <small className="text-danger">{errors.password}</small>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="label-text">Confirm Password</label>
                  <div className="input-group position-relative">
                    <div className="user-icon">
                      <i className="fa-solid fa-lock"></i>
                    </div>
                    <input
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      className={`form-control ${
                        errors.confirmPassword ? "is-invalid" : ""
                      }`}
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                    <span
                      className="password-eye"
                      onClick={togglePasswordVisibility}
                      style={{ cursor: "pointer" }}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      <i
                        className={`fa-solid ${
                          showPassword ? "fa-eye" : "fa-eye-slash"
                        }`}
                      ></i>
                    </span>
                  </div>
                  {errors.confirmPassword && (
                    <div className="invalid-feedback d-block">
                      <small className="text-danger">
                        {errors.confirmPassword}
                      </small>
                    </div>
                  )}
                </div>

                <button
                  className="btn custom-btn theme-btn text-center w-100"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      {isInviteFlow
                        ? "Completing Registration..."
                        : "Creating Account..."}
                    </>
                  ) : isInviteFlow ? (
                    "Complete Registration"
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
