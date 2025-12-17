import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getAuthData, clearAuthData, getUserRole } from "../../utils/storage";
import { useAuth } from "../../context/AuthContext";
import { usePetitionWizard } from "../../context/PetitionWizardContext";
import { ROUTES } from "../../constants/routerConstants";
import { logout as logoutApi } from "../../services/authService";
import { getUserJoinRequests, getOrganizationById } from "../../services/organizationService";
import { getFilingEntityTypes } from "../../services/commonService";
import Sidebar from "../../components/shared/Sidebar";
import Header from "../../components/shared/Header";
import { usePetitions } from "../../hooks/usePetitions";
import "../../styles/custom.css";


function Dashboard() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  
  // Use the petitions hook for organization-based data
  const { 
    petitions, 
    loading: petitionsLoading, 
    petitionCounts,
    organization,
    fetchPetitions,
    fetchPetitionCounts
  } = usePetitions();
  
  // Get resetWizard function from PetitionWizard context
  const { resetWizard } = usePetitionWizard();
  
  const [userOrganization, setUserOrganization] = useState(null);
  const [isLoadingOrgData, setIsLoadingOrgData] = useState(true);
  const [filingEntityTypes, setFilingEntityTypes] = useState([]);
  const [isLoadingFilingEntityTypes, setIsLoadingFilingEntityTypes] = useState(false);
  const [dashboardPetitions, setDashboardPetitions] = useState([]);
  const [petitionStats, setPetitionStats] = useState({
    total: 0,
    accepted: 0,
    submitted: 0,
    returned: 0,
    resubmitted: 0,
    draft: 0,
    closed: 0
  });

  const navigate = useNavigate();
  const location = useLocation();
  const {
    logout: authLogout,
    organization: organizationFromContext,
  } = useAuth();

  // Use organization from context (for org admins) or from join requests (for regular users)
  // Priority: organizationFromContext > userOrganization
  const displayOrganization = organizationFromContext || userOrganization;


  useEffect(() => {
    const { user: userData, token } = getAuthData();

    if (!userData || !token) {
      navigate(ROUTES.LOGIN);
      return;
    }

    setUser(userData);
    
    // Check if we should show organizations section
    // Only set to organizations if explicitly requested via navigation
    if (location.state?.activeSection === 'organizations') {
      setActiveSection('organizations');
    } else {
      // Default to dashboard section on page load
      setActiveSection('dashboard');
    }
    
    // Clear location state to prevent it from persisting on page reload
    if (location.state) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [navigate]);


  // Load organization data when user is available
  useEffect(() => {
    if (user) {
      // Only load join requests if user doesn't have organization from context
      // Org admins already have organizationId in their user object, so we skip this
      if (!organizationFromContext) {
        loadOrganizationData();
      } else {
        // If we have organization from context, mark as loaded
        setIsLoadingOrgData(false);
      }
      loadFilingEntityTypes();
    }
  }, [user, organizationFromContext]);

  const loadOrganizationData = async () => {
    setIsLoadingOrgData(true);
    try {
      // If user has organizationId from context (org admins), use that instead of join requests
      if (organizationFromContext) {
        // Organization already loaded from AuthContext, just mark as complete
        setIsLoadingOrgData(false);
        return;
      }

      // For regular users, fetch join requests to see pending/approved status
      const response = await getUserJoinRequests();
      if (response.isSuccess) {
        const requests = response.data || [];

        // Sort requests by date
        const sortedRequests = requests.sort((a, b) => {
          return new Date(b.requestedOn) - new Date(a.requestedOn);
        });

        // Fetch organization details for each request
        const requestsWithOrgNames = await Promise.all(
          sortedRequests.map(async (request) => {
            try {
              const orgResponse = await getOrganizationById(request.organizationId);
              if (orgResponse.isSuccess && orgResponse.data) {
                return {
                  ...request,
                  organizationName: orgResponse.data.name,
                  organizationType: orgResponse.data.type,
                  organizationAddress: `${orgResponse.data.addressStreet1 || ''}${orgResponse.data.addressStreet2 ? ', ' + orgResponse.data.addressStreet2 : ''}, ${orgResponse.data.addressCity || ''}, ${orgResponse.data.addressState || ''} ${orgResponse.data.addressZip || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, ''),
                  primaryContact: `${orgResponse.data.primaryContactName || ''}, ${orgResponse.data.primaryContactEmail || ''}, ${orgResponse.data.primaryContactPhone || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, ''),
                };
              }
              return request;
            } catch {
              return request;
            }
          })
        );
        
        // Check if user has any approved requests and load their organization
        // Note: This is only for display - actual organizationId should come from AuthContext
        const approvedRequest = requestsWithOrgNames.find(request => request.status === 1);
        if (approvedRequest) {
          setUserOrganization(approvedRequest);
        }
      } else {
      }
    } catch {
      // Error loading organization data - non-critical
    } finally {
      setIsLoadingOrgData(false);
    }
  };

  const loadFilingEntityTypes = async () => {
    setIsLoadingFilingEntityTypes(true);
    try {
      const response = await getFilingEntityTypes();
      if (response.isSuccess) {
        setFilingEntityTypes(response.data || []);
      } else {
        setFilingEntityTypes([]);
      }
    } catch {
      setFilingEntityTypes([]);
    } finally {
      setIsLoadingFilingEntityTypes(false);
    }
  };


  const handleLogout = async () => {
    try {
      // Get refresh token from storage
      const { refreshToken } = getAuthData();
      
      if (refreshToken) {
        // Call logout API
        await logoutApi(refreshToken);
      }
    } catch {
      // Continue with logout even if API fails
    } finally {
      // Always clear local data and redirect
      clearAuthData();
      authLogout();
      
      // Clear petition form data from localStorage on logout
      try {
        sessionStorage.removeItem('petitionFormData');
      } catch {
        // Error clearing petition form data on logout - non-critical
      }
      
      // Reset petition wizard progress
      resetWizard();
      
      navigate(ROUTES.LOGIN);
    }
  };




  if (!user) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
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

      {/* Main Content Area */}
      <main className="dashboard-main-area container-fluid">
        <Header 
          user={user}
          pageTitle="Dashboard"
          onLogout={handleLogout}
        />

        {/* Main Dashboard Content */}
        <div className="dashboard-content-section">
          {/* Petition Dashboard Section */}
          {activeSection === "dashboard" && (
            petitionsLoading ? (
              <div className="shadow-custom bg-white org-search-box">
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t("common.loading")}</span>
                  </div>
                  <p className="mt-3 text-muted">{t("common.loading")}</p>
                </div>
              </div>
            ) : (
            <div className="shadow-custom bg-white org-search-box">
              <h2 className="h4 mb-3 fw-bold theme-color">{t("dashboard.title")}</h2>
              <div className="row mb-5">
                <div className="col-md-4 mb-3">
                  <div className="stat-card stat-card-metric h-100">
                    <h4 className="stat-count">{petitionCounts.totalRecords}</h4>
                    <p className="stat-title">{t("dashboard.totalPetitions")}</p>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="stat-card stat-card-metric h-100">
                    <h4 className="stat-count">{petitionCounts.totalSubmittedCount}</h4>
                    <p className="stat-title">{t("dashboard.totalSubmittedPetitions")}</p>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="stat-card stat-card-metric h-100">
                    <h4 className="stat-count">{petitionCounts.totalClosedCount}</h4>
                    <p className="stat-title">{t("dashboard.totalClosedPetitions")}</p>
                  </div>
                </div>
              </div>
              

              {/* New Information Cards */}
              <div className="row mb-4">
                {/* Form 35B Compliance Card */}
                <div className="col-md-4 mb-3">
                  <div className="stat-card h-100">
                    <h5 className="stat-count mb-3" style={{ fontSize: '1.2rem' }}>{t("dashboard.form35BCompliance")}</h5>
                    <div className="d-flex flex-column justify-content-between h-100" style={{ minHeight: '150px' }}>
                      <div>
                        <div className="mb-3 pb-2 border-bottom">
                          <p className="text-muted small mb-0" style={{ fontSize: '0.75rem', fontWeight: '500' }}>
                            {t("dashboard.currentYear")}: <strong style={{ color: '#333' }}>{new Date().getFullYear()}</strong>
                          </p>
                        </div>
                        <div className="mb-2">
                          <div className="d-flex align-items-center mb-2" style={{ gap: '12px' }}>
                            <span className="text-muted small" style={{ fontSize: '0.8rem', flex: '1', minWidth: '140px' }}>
                              {t("dashboard.januaryJune")}
                            </span>
                            <span style={{ color: '#357a5b', fontWeight: '600', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', minWidth: '70px' }}>
                              <i className="fa-solid fa-check-circle"></i>
                              {t("dashboard.ready")}
                            </span>
                          </div>
                          <div className="d-flex align-items-center" style={{ gap: '12px' }}>
                            <span className="text-muted small" style={{ fontSize: '0.8rem', flex: '1', minWidth: '140px' }}>
                              {t("dashboard.julyDecember")}
                            </span>
                            <span style={{ color: '#dc3545', fontWeight: '600', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', minWidth: '70px' }}>
                              <i className="fa-solid fa-clock"></i>
                              {t("dashboard.due")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button 
                        className="btn btn-sm w-100 mt-3"
                        onClick={() => navigate(ROUTES.FORM35)}
                        style={{
                          background: '#357a5b',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#2d6349';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#357a5b';
                        }}
                      >
                        {t("dashboard.form35BReporting")}
                        <i className="fa-solid fa-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                </div>

                {/* User Details Card */}
                <div className="col-md-4 mb-3">
                  <div className="stat-card h-100">
                    <h5 className="stat-count mb-3" style={{ fontSize: '1.2rem' }}>{t("dashboard.userDetails")}</h5>
                    <div className="user-info">
                      <h6 className="mb-2 fw-bold">{user.firstName} {user.lastName}</h6>
                      <p className="text-muted small mb-1">
                        <i className="fa-solid fa-envelope me-1"></i>
                        {t("dashboard.email")}: {user.email}
                      </p>
                      <p className="text-muted small mb-1">
                        <i className="fa-solid fa-user-tag me-1"></i>
                        {t("profile.role")}: {getUserRole(user) || t("header.nA")}
                          </p>
                          <p className="text-muted small mb-0">
                            <i className="fa-solid fa-tag me-1"></i>
                        {t("dashboard.filingEntityType")}: {
                          user.filingEntityTypeId && filingEntityTypes.length > 0 
                            ? filingEntityTypes.find(et => et.id === user.filingEntityTypeId)?.name || t("profile.notSet")
                            : isLoadingFilingEntityTypes 
                              ? t("common.loading") 
                              : t("profile.notSet")
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Alerts Card */}
                <div className="col-md-4 mb-3">
                  <div className="stat-card h-100">
                    <h5 className="stat-count mb-3" style={{ fontSize: '1.2rem' }}>{t("dashboard.actionAlerts")}</h5>
                    <div className="d-flex align-items-center justify-content-center h-100">
                      <p className="text-muted small mb-0">{t("dashboard.allAlertsDisplayedHere")}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Table View */}
              <h3 className="font-med mb-4">{t("dashboard.recentPetitions")}</h3>
              <div className="d-none d-lg-block table-responsive petition-table-container dashboard-petition-table">
                <table className="table table-hover w-100">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '20%' }}>{t("dashboard.petitionNumber")}</th>
                      <th style={{ width: '25%' }}>{t("dashboard.propertyAddress")}</th>
                      <th style={{ width: '16%' }}>{t("dashboard.borrower")}</th>
                      <th style={{ width: '15%', minWidth: '180px' }}>{t("dashboard.status")}</th>
                      <th style={{ width: '13%' }}>{t("dashboard.filingDate")}</th>
                      <th style={{ width: '14%' }}>{t("dashboard.lastUpdated")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {petitions.length > 0 ? (
                      petitions
                        .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
                        .slice(0, 5)
                        .map((petition) => (
                        <tr
                          key={petition.id}
                          className="petition-row"
                        >
                          <td>
                            <span className="petition-number">
                              {petition.petitionNumber}
                            </span>
                          </td>
                          <td>{petition.propertyAddress}</td>
                          <td>{petition.borrower}</td>
                          <td>
                            <span className={`status-badge status-${petition.statusClass || petition.status.toLowerCase().replace(' ', '-')}`}>
                              {petition.status === "Foreclosure Sale Initiated" 
                                ? <>Foreclosure Sale<br />Initiated</>
                                : petition.status === "Judgment Submitted"
                                ? <>Judgment<br />Submitted</>
                                : petition.status}
                            </span>
                          </td>
                          <td>{petition.filingDate}</td>
                          <td>{petition.lastUpdated}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-muted">
                          {t("dashboard.noPetitionsFound")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="d-lg-none">
                {petitions.length > 0 ? (
                  <div className="row g-3">
                    {petitions
                      .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
                      .slice(0, 5)
                      .map((petition) => (
                      <div key={petition.id} className="col-12">
                        <div className="petition-mobile-card">
                          <div className="petition-card-header">
                            <span className="fw-semibold petition-number" style={{ color: "#015080", fontSize: "0.95rem" }}>
                              {petition.petitionNumber}
                            </span>
                          </div>
                          <div className="petition-card-status">
                            <span className={`status-badge status-${petition.statusClass || petition.status.toLowerCase().replace(' ', '-')}`}>
                              {petition.status}
                            </span>
                          </div>
                          <div className="petition-card-body">
                            <div className="petition-card-detail">
                              <i className="fas fa-map-marker-alt text-muted me-2" style={{ fontSize: "0.75rem" }}></i>
                              <span className="small text-muted">{petition.propertyAddress}</span>
                            </div>
                            {petition.borrower && (
                              <div className="petition-card-detail">
                                <i className="fas fa-user text-muted me-2" style={{ fontSize: "0.75rem" }}></i>
                                <span className="small text-muted">{petition.borrower}</span>
                              </div>
                            )}
                            <div className="petition-card-detail">
                              <i className="fas fa-calendar text-muted me-2" style={{ fontSize: "0.75rem" }}></i>
                              <span className="small text-muted">{petition.filingDate}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="fa-solid fa-file-circle-plus text-muted mb-3" style={{ fontSize: '2rem' }}></i>
                    <p className="text-muted mb-0">{t("dashboard.noPetitionsFound")}</p>
                    <small className="text-muted">{t("dashboard.createFirstPetition")}</small>
                  </div>
                )}
              </div>
            </div>
            )
          )}


        </div>



      </main>
    </div>
  );
}

export default Dashboard;
