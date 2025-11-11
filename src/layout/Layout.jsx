import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/routerConstants';
import LoadingFallback from '../components/shared/LoadingFallback';
import { getUserJoinRequests } from '../services/organizationService';
import { getUserRole } from '../utils/storage';

const Layout = ({ children }) => {
  const {
    isAuthenticated,
    isLoading,
    user,
    hasOrganizationAccess,
    organizationCheckComplete,
    setHasOrganizationAccess,
    setOrganizationCheckComplete,
    setOrganization,
    activeOrganizationId,
    setActiveOrganization,
  } = useAuth();
  const location = useLocation();

  // Helper to check if user is org admin
  const isOrgAdminUser = (userData) => {
    if (!userData) return false;
    if (userData.isManager === true) return true;
    if (userData.roles && Array.isArray(userData.roles)) {
      return userData.roles.some(
        (role) =>
          role === "Organisation Admin" ||
          role === "Organization Admin" ||
          role === "orgAdmin"
      );
    }
    const userRole = getUserRole(userData);
    return userRole === "orgAdmin" || userRole === "Organisation Admin" || userRole === "Organization Admin";
  };

  // Re-check organization access on route changes for non-org admins
  // This ensures that if org admin removes them, they'll see "No Organization Access"
  useEffect(() => {
    const recheckAccess = async () => {
      if (!isAuthenticated || !user || !organizationCheckComplete) return;
      
      const isOrgAdmin = isOrgAdminUser(user);
      if (isOrgAdmin) return; // Org admins don't need re-checking
      
      // For non-org admins, re-verify access on each navigation
      try {
        const requestsResponse = await getUserJoinRequests();
        if (requestsResponse.isSuccess && Array.isArray(requestsResponse.data)) {
          const approvedRequest = requestsResponse.data.find(
            (request) => request.status === 1
          );
          
          const userOrgId = user.organizationId || activeOrganizationId;
          const approvedOrgId = approvedRequest?.organizationId;
          
          // If user has an approved request, grant access
          // The approved request is the source of truth, not the user's organizationId
          if (approvedRequest && approvedOrgId) {
            // Check if user's organizationId conflicts (if it exists and doesn't match)
            // If userOrgId is null/empty, that's fine - they might not be synced yet
            const orgIdConflicts = userOrgId && 
              typeof userOrgId === 'string' && 
              userOrgId.trim() !== '' && 
              userOrgId !== approvedOrgId;
            
            if (!orgIdConflicts) {
              // User has approved access - ensure access is granted
              if (!hasOrganizationAccess) {
                setHasOrganizationAccess(true);
                // Also set organization if not already set
                const { getOrganizationById } = await import('../services/organizationService');
                try {
                  const orgResponse = await getOrganizationById(approvedOrgId);
                  if (orgResponse.isSuccess && orgResponse.data) {
                    setOrganization(orgResponse.data);
                  } else {
                    setOrganization({ id: approvedOrgId });
                  }
                } catch (error) {
                  setOrganization({ id: approvedOrgId });
                }
                if (typeof setActiveOrganization === 'function') {
                  setActiveOrganization(approvedOrgId);
                }
              }
            } else {
              // User's organizationId conflicts with approved request - they were removed
              if (hasOrganizationAccess) {
                setHasOrganizationAccess(false);
              }
            }
          } else {
            // User doesn't have matching approved request and orgId - they were removed
            // Set hasOrganizationAccess to false
            // This will show them the "No Organization Access" component
            if (hasOrganizationAccess) {
              setHasOrganizationAccess(false);
            }
          }
        } else {
          // No requests or API failed - user doesn't have access
          if (hasOrganizationAccess) {
            setHasOrganizationAccess(false);
          }
        }
      } catch (error) {
        console.error('Error re-checking organization access:', error);
        // On error, assume user doesn't have access
        if (hasOrganizationAccess) {
          setHasOrganizationAccess(false);
        }
      }
    };

    recheckAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, isAuthenticated, user, organizationCheckComplete, activeOrganizationId]);

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default Layout;
