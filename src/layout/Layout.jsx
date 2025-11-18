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
    setOrganization,
    activeOrganizationId,
    setActiveOrganization,
  } = useAuth();
  const location = useLocation();

  const isOrgAdminUser = (userData) => {
    if (!userData) return false;
    if (userData.isManager === true) return true;
    if (userData.roles && Array.isArray(userData.roles)) {
      return userData.roles.some(
        (role) =>
          role === 'Organisation Admin' ||
          role === 'Organization Admin' ||
          role === 'orgAdmin'
      );
    }
    const userRole = getUserRole(userData);
    return (
      userRole === 'orgAdmin' ||
      userRole === 'Organisation Admin' ||
      userRole === 'Organization Admin'
    );
  };

  useEffect(() => {
    const recheckAccess = async () => {
      if (!isAuthenticated || !user || !organizationCheckComplete) return;
      const isOrgAdmin = isOrgAdminUser(user);
      if (isOrgAdmin) return;

      console.log('[Layout] Rechecking org access on route change', {
        pathname: location.pathname,
        hasOrganizationAccess,
        activeOrganizationId,
      });

      try {
        const requestsResponse = await getUserJoinRequests();
        if (requestsResponse.isSuccess && Array.isArray(requestsResponse.data)) {
          const approvedRequests = requestsResponse.data.filter(
            (request) => request.status === 1 && request.organizationId
          );

          if (approvedRequests.length === 0) {
            if (hasOrganizationAccess) {
              console.log('[Layout] No approved requests found, revoking access');
              setHasOrganizationAccess(false);
            }
            return;
          }

          const approvedOrgIds = approvedRequests.map((request) => request.organizationId);
          const storedActiveId = activeOrganizationId;
          const preferredOrgId = storedActiveId && approvedOrgIds.includes(storedActiveId)
            ? storedActiveId
            : approvedOrgIds[0];

          console.log('[Layout] Recheck approved orgs', {
            approvedOrgIds,
            storedActiveId,
            preferredOrgId,
          });

          if (!hasOrganizationAccess) {
            setHasOrganizationAccess(true);
          }

          if (preferredOrgId && preferredOrgId !== activeOrganizationId && typeof setActiveOrganization === 'function') {
            console.log('[Layout] Updating active organization to match approved list', preferredOrgId);
            setActiveOrganization(preferredOrgId);
          }

          if (preferredOrgId) {
            const matchingRequest = approvedRequests.find(
              (request) => request.organizationId === preferredOrgId
            );
            const orgDetail = matchingRequest?.organizationDetail || {};
            setOrganization((prev) => ({
              ...(prev || {}),
              id: preferredOrgId,
              organizationId: preferredOrgId,
              name: orgDetail.name || prev?.name || 'Organization',
              type: orgDetail.type || prev?.type || '',
              addressStreet1: orgDetail.addressStreet1 || prev?.addressStreet1 || '',
              addressStreet2: orgDetail.addressStreet2 || prev?.addressStreet2 || '',
              addressCity: orgDetail.addressCity || prev?.addressCity || '',
              addressState: orgDetail.addressState || prev?.addressState || '',
              addressZip: orgDetail.addressZip || prev?.addressZip || '',
              primaryContactName: orgDetail.primaryContactName || prev?.primaryContactName || '',
              primaryContactEmail: orgDetail.primaryContactEmail || prev?.primaryContactEmail || '',
              primaryContactPhone: orgDetail.primaryContactPhone || prev?.primaryContactPhone || '',
            }));
          }
        } else if (hasOrganizationAccess) {
          console.log('[Layout] Join requests API unsuccessful, revoking access');
          setHasOrganizationAccess(false);
        }
      } catch (error) {
        console.error('Error re-checking organization access:', error);
        if (hasOrganizationAccess) {
          console.log('[Layout] Error during recheck, revoking access');
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
