import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../constants/routerConstants";
import { logout as logoutApi } from "../../services/authService";
import { clearAuthData, getAuthData, getUserRole, getImpersonationState } from "../../utils/storage";
import Sidebar from "../../components/shared/Sidebar";
import Header from "../../components/shared/Header";
import { JoinRequestTabProvider } from "../../context/JoinRequestTabContext";
import ViewAllJoinRequests from "../../components/OrganizationJoinRequests/ViewAllJoinRequests";
import "../../styles/custom.css";

// Helper function to check if user is org admin (matches Login.jsx logic)
// When impersonating, we strictly check the impersonated user's role only
const isOrgAdminUser = (userData, isImpersonating = false) => {
  if (!userData) return false;
  
  // When impersonating, we need to be extra strict about role checking
  // Only check actual role fields, not isManager (which might be inherited from admin session)
  if (isImpersonating) {
    // When impersonating, only check roles array or role field
    // Do NOT check isManager during impersonation as it might be from the admin's session
    if (userData.roles && Array.isArray(userData.roles)) {
      return userData.roles.some(
        (role) =>
          role === "Organisation Admin" ||
          role === "Organization Admin" ||
          role === "orgAdmin"
      );
    }
    
    // Check single role field
    const userRole = getUserRole(userData);
    return userRole === "orgAdmin" || userRole === "Organisation Admin" || userRole === "Organization Admin";
  }
  
  // Normal check (not impersonating)
  // Check if isManager is true
  if (userData.isManager === true) {
    return true;
  }
  
  // Check roles array for "Organisation Admin"
  if (userData.roles && Array.isArray(userData.roles)) {
    return userData.roles.some(
      (role) =>
        role === "Organisation Admin" ||
        role === "Organization Admin" ||
        role === "orgAdmin"
    );
  }
  
  // Check single role field
  const userRole = getUserRole(userData);
  if (userRole === "orgAdmin" || userRole === "Organisation Admin" || userRole === "Organization Admin") {
    return true;
  }
  
  return false;
};

const OrganizationJoinRequests = () => {
  const navigate = useNavigate();
  const { user, organization, logout: authLogout } = useAuth();
  const [activeSection, setActiveSection] = useState("organization-join-requests");
  const { isImpersonating } = getImpersonationState();
  
  // Check if user is org admin (pass impersonation state for stricter checking)
  const isOrgAdmin = isOrgAdminUser(user, isImpersonating);
  const organizationId = user?.organizationId || organization?.id;

  const handleLogout = async () => {
    try {
      const { refreshToken } = getAuthData();
      if (refreshToken) {
        await logoutApi(refreshToken);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuthData();
      authLogout();
      navigate(ROUTES.LOGIN);
    }
  };

  if (!organizationId || !isOrgAdmin) {
    return (
      <div className="dashboard-wrapper">
        <Sidebar 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onLogout={handleLogout}
        />
        <main className="dashboard-main-area container-fluid">
          <Header 
            user={user}
            pageTitle="Organization Join Requests"
            onLogout={handleLogout}
          />
          <div className="dashboard-content-section">
            <div className="alert alert-warning">
              <i className="fa-solid fa-exclamation-triangle me-2"></i>
              Access Denied. This page is only accessible to organization administrators.
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <Sidebar 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={handleLogout}
      />
      <main className="dashboard-main-area container-fluid">
        <Header 
          user={user}
          pageTitle="Organization Join Requests"
          onLogout={handleLogout}
        />
        <div className="dashboard-content-section">
          <JoinRequestTabProvider>
            <ViewAllJoinRequests 
              organizationId={organizationId}
            />
          </JoinRequestTabProvider>
        </div>
      </main>
    </div>
  );
};

export default OrganizationJoinRequests;
