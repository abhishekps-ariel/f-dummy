import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getAuthData, clearAuthData } from "../../utils/storage";
import { useAuth } from "../../context/AuthContext";
import { usePetitionWizard } from "../../context/PetitionWizardContext";
import { ROUTES } from "../../constants/routerConstants";
import { logout as logoutApi } from "../../services/authService";
import { getUserJoinRequests, getOrganizationById } from "../../services/organizationService";
import { getFilingEntityTypes } from "../../services/commonService";
import OrganizationActions from "../../components/Petitions/OrganizationActions";
import Sidebar from "../../components/shared/Sidebar";
import Header from "../../components/shared/Header";
import { usePetitions } from "../../hooks/usePetitions";
import "../../styles/custom.css";


function Dashboard() {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  
  // Use the petitions hook for organization-based data
  const { 
    petitions, 
    loading: petitionsLoading, 
    petitionCounts,
    hasOrganizationAccess,
    organization,
    organizationCheckComplete,
    fetchPetitions,
    fetchPetitionCounts
  } = usePetitions();
  
  // Get resetWizard function from PetitionWizard context
  const { resetWizard } = usePetitionWizard();
  
  const [userOrganization, setUserOrganization] = useState(null);
  const [isLoadingOrgData, setIsLoadingOrgData] = useState(false);
  const [hasLoadedOrgData, setHasLoadedOrgData] = useState(false);
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
  const { logout: authLogout } = useAuth();


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
      loadOrganizationData();
      loadFilingEntityTypes();
    }
  }, [user]);

  const loadOrganizationData = async () => {
    setIsLoadingOrgData(true);
    try {
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
            } catch (error) {
              return request;
            }
          })
        );
        
        // Check if user has any approved requests and load their organization
        const approvedRequest = requestsWithOrgNames.find(request => request.status === 1);
        if (approvedRequest) {
          setUserOrganization(approvedRequest);
        }
      } else {
      }
    } catch (error) {
    } finally {
      setIsLoadingOrgData(false);
      setHasLoadedOrgData(true);
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
    } catch (error) {
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
    } catch (error) {
      // Continue with logout even if API fails
    } finally {
      // Always clear local data and redirect
      clearAuthData();
      authLogout();
      
      // Clear petition form data from localStorage on logout
      try {
        localStorage.removeItem('petitionFormData');
      } catch (error) {
        console.error('Error clearing petition form data on logout:', error);
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
            (petitionsLoading || !organizationCheckComplete) ? (
              <div className="shadow-custom bg-white org-search-box">
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-muted">Checking organization access...</p>
                </div>
              </div>
            ) : hasOrganizationAccess ? (
            <div className="shadow-custom bg-white org-search-box">
              <h2 className="font-med mb-4">Dashboard</h2>
              <div className="row mb-5">
                <div className="col-md-4 mb-3">
                  <div className="stat-card">
                    <h4 className="stat-count">{petitionCounts.totalRecords}</h4>
                    <p className="stat-title">Total Petitions</p>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="stat-card">
                    <h4 className="stat-count">{petitionCounts.totalSubmittedCount}</h4>
                    <p className="stat-title">Total Submitted Petitions</p>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="stat-card">
                    <h4 className="stat-count">{petitionCounts.totalClosedCount}</h4>
                    <p className="stat-title">Total Closed Petitions</p>
                  </div>
                </div>
              </div>
              

              {/* New Information Cards */}
              <div className="row mb-4">
                {/* Organization Details Card */}
                <div className="col-md-4 mb-3">
                  <div className="stat-card h-100">
                    <h5 className="stat-count mb-3" style={{ fontSize: '1.2rem' }}>Organization Details</h5>
                    {isLoadingOrgData ? (
                      <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2 text-muted small">Loading organization details...</p>
                      </div>
                    ) : userOrganization ? (
                      <div className="organization-info">
                        <h6 className="mb-2 fw-bold">{userOrganization.organizationName || userOrganization.name}</h6>
                        <p className="text-muted small mb-1">
                          <i className="fa-solid fa-tag me-1"></i>
                          Type: {userOrganization.organizationType || userOrganization.type || "N/A"}
                        </p>
                        {userOrganization.organizationAddress && (
                            <p className="text-muted small mb-1">
                              <i className="fa-solid fa-location-dot me-1"></i>
                            Address: {userOrganization.organizationAddress}
                            </p>
                        )}
                        {userOrganization.primaryContact && (
                            <p className="text-muted small mb-1">
                              <i className="fa-solid fa-user me-1"></i>
                            Contact: {userOrganization.primaryContact}
                          </p>
                        )}
                        <span className="badge bg-success">
                          <i className="fa-solid fa-check-circle me-1"></i>
                          Active Member
                            </span>
                          </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-muted small mb-0">Organization details not available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* User Details Card */}
                <div className="col-md-4 mb-3">
                  <div className="stat-card h-100">
                    <h5 className="stat-count mb-3" style={{ fontSize: '1.2rem' }}>User Details</h5>
                    <div className="user-info">
                      <h6 className="mb-2 fw-bold">{user.firstName} {user.lastName}</h6>
                      <p className="text-muted small mb-1">
                        <i className="fa-solid fa-envelope me-1"></i>
                        Email: {user.email}
                      </p>
                      <p className="text-muted small mb-1">
                        <i className="fa-solid fa-user-tag me-1"></i>
                        Role: {user.role || "FILIR"}
                          </p>
                          <p className="text-muted small mb-0">
                            <i className="fa-solid fa-tag me-1"></i>
                        Filing Entity Type: {
                          user.filingEntityTypeId && filingEntityTypes.length > 0 
                            ? filingEntityTypes.find(et => et.id === user.filingEntityTypeId)?.name || "Not Set"
                            : isLoadingFilingEntityTypes 
                              ? "Loading..." 
                              : "Not Set"
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Alerts Card */}
                <div className="col-md-4 mb-3">
                  <div className="stat-card h-100">
                    <h5 className="stat-count mb-3" style={{ fontSize: '1.2rem' }}>Action Alerts</h5>
                    <div className="d-flex align-items-center justify-content-center h-100">
                      <p className="text-muted small mb-0">All alerts will be displayed here</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Table View */}
              <h3 className="font-med mb-4">Recent Petitions</h3>
              <div className="d-none d-lg-block table-responsive petition-table-container dashboard-petition-table">
                <table className="table table-hover w-100">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '20%' }}>Petition Number</th>
                      <th style={{ width: '25%' }}>Property Address</th>
                      <th style={{ width: '16%' }}>Borrower</th>
                      <th style={{ width: '12%' }}>Status</th>
                      <th style={{ width: '13%' }}>Filing Date</th>
                      <th style={{ width: '14%' }}>Last Updated</th>
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
                              {petition.status}
                            </span>
                          </td>
                          <td>{petition.filingDate}</td>
                          <td>{petition.lastUpdated}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-muted">
                          No petitions found
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
                        <div className="petition-mobile-row">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="petition-main-info">
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <span className="fw-medium petition-number">
                                  {petition.petitionNumber}
                                </span>
                                <span className={`badge status-${petition.statusClass || petition.status.toLowerCase().replace(' ', '-')}`}>
                                  {petition.status}
                                </span>
                              </div>
                              <div className="petition-details-row">
                                <span className="small text-muted">{petition.propertyAddress}</span>
                                <span className="small text-muted">• {petition.borrower}</span>
                                <span className="small text-muted">• {petition.filingDate}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="fa-solid fa-file-circle-plus text-muted mb-3" style={{ fontSize: '2rem' }}></i>
                    <p className="text-muted mb-0">No petitions found</p>
                    <small className="text-muted">Create your first petition to see it here</small>
                  </div>
                )}
              </div>
            </div>
            ) : (
              <OrganizationActions />
            )
          )}


        </div>



      </main>
    </div>
  );
}

export default Dashboard;
