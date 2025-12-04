const resolveOrganizationId = (organization) =>
  organization?.organizationId || organization?.id || null;

export const storeAuthData = (authData) => {
  // Only clear auth-related data, not all storage (to preserve other app data)
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("activeOrganizationId");
  
  // Clear sessionStorage auth-related items only
  sessionStorage.removeItem("isImpersonating");
  sessionStorage.removeItem("impersonatedUserName");

  const { token, refreshToken, user } = authData;
  
  // Store auth data in localStorage
  if (token) {
    localStorage.setItem("token", token);
  }
  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  }

  // Set active organization ID
  const organizations = Array.isArray(user?.organizations) ? user.organizations : [];
  if (organizations.length > 0) {
    const primaryOrganization =
      organizations.find((org) => org?.isPrimary) ??
      organizations.find(
        (org) => resolveOrganizationId(org) && resolveOrganizationId(org) === user?.organizationId
      ) ??
      organizations[0];

    const resolvedPrimaryId = resolveOrganizationId(primaryOrganization);
    if (resolvedPrimaryId) {
      setActiveOrganizationId(resolvedPrimaryId);
    }
  } else if (user?.organizationId) {
    setActiveOrganizationId(user.organizationId);
  } else {
    setActiveOrganizationId(null);
  }
};

export const getAuthData = () => {
  const token = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refreshToken");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const activeOrganizationId = getActiveOrganizationId();

  return { token, refreshToken, user, activeOrganizationId };
};

export const clearAuthData = () => {
  // Clear authentication data from localStorage (only auth-related items)
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("activeOrganizationId");

  // Clear sessionStorage auth-related items only
  sessionStorage.removeItem("isImpersonating");
  sessionStorage.removeItem("impersonatedUserName");
  // Note: We don't clear all sessionStorage to preserve other app data like petitionFormData, tabs, etc.
};

export const setImpersonationState = (isImpersonating, impersonatedUserName = '') => {
  if (isImpersonating) {
    sessionStorage.setItem('isImpersonating', 'true');
    if (impersonatedUserName) sessionStorage.setItem('impersonatedUserName', impersonatedUserName);
  } else {
    sessionStorage.removeItem('isImpersonating');
    sessionStorage.removeItem('impersonatedUserName');
  }
};

export const getImpersonationState = () => {
  const isImpersonating = sessionStorage.getItem("isImpersonating") === "true";
  const impersonatedUserName = sessionStorage.getItem("impersonatedUserName") || "";
  return { isImpersonating, impersonatedUserName };
};

/**
 * Get user role from user object
 * Checks user.role first, then user.roles array, then returns null if neither exists
 * @param {Object} user - User object from storage
 * @returns {string|null} - User role or null if not found
 */
export const getUserRole = (user) => {
  if (!user) return null;
  
  // Check for single role field first
  if (user.role) {
    return user.role;
  }
  
  // Check for roles array
  if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
    return user.roles[0];
  }
  
  return null;
};

export const getActiveOrganizationId = () => {
  return localStorage.getItem("activeOrganizationId") || null;
};

export const setActiveOrganizationId = (organizationId) => {
  if (organizationId) {
    localStorage.setItem("activeOrganizationId", organizationId);
  } else {
    localStorage.removeItem("activeOrganizationId");
  }
};

export const updateStoredUser = (user) => {
  if (!user) {
    localStorage.removeItem("user");
    return;
  }
  localStorage.setItem("user", JSON.stringify(user));
};

