const resolveOrganizationId = (organization) =>
  organization?.organizationId || organization?.id || null;

export const storeAuthData = (authData) => {
  // Clear all existing data before storing new user data
  localStorage.clear();

  const { token, refreshToken, user } = authData;
  localStorage.setItem("token", token);
  localStorage.setItem("refreshToken", refreshToken);
  localStorage.setItem("user", JSON.stringify(user));

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
  // Clear authentication data
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("activeOrganizationId");

  // Clear petition-related data
  localStorage.removeItem("petitionTabs");
  localStorage.removeItem("activePetitionTab");
  localStorage.removeItem("petitionDrafts");

  // Clear any other user-specific data
  localStorage.removeItem("resetEmail");

  localStorage.clear();
};

export const setImpersonationState = (isImpersonating, impersonatedUserName = '') => {
  if (isImpersonating) {
    localStorage.setItem('isImpersonating', 'true');
    if (impersonatedUserName) localStorage.setItem('impersonatedUserName', impersonatedUserName);
  } else {
    localStorage.removeItem('isImpersonating');
    localStorage.removeItem('impersonatedUserName');
  }
};

export const getImpersonationState = () => {
  const isImpersonating = localStorage.getItem("isImpersonating") === "true";
  const impersonatedUserName = localStorage.getItem("impersonatedUserName") || "";
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

