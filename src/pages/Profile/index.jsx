import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuthData, clearAuthData, getUserRole } from "../../utils/storage";
import { useAuth } from "../../context/AuthContext";
import { usePetitionWizard } from "../../context/PetitionWizardContext";
import { ROUTES } from "../../constants/routerConstants";
import { logout as logoutApi, updateUser, getUserById, uploadUserSignature, getSignatureById } from "../../services/authService";
import { getFilingEntityTypes } from "../../services/commonService";
import { getUserJoinRequests, getOrganizationById } from "../../services/organizationService";
import { toast } from "react-toastify";
import Sidebar from "../../components/shared/Sidebar";
import Header from "../../components/shared/Header";
import SignatureCapture from "../../components/shared/SignatureCapture";
import CustomDropdown from "../../components/shared/CustomDropdown";
import "../../styles/custom.css";
import "../../components/shared/CustomDropdown.css";

function Profile() {
  const [user, setUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [filingEntityTypes, setFilingEntityTypes] = useState([]);
  const [selectedFilingEntityType, setSelectedFilingEntityType] = useState("");
  const [isLoadingEntityTypes, setIsLoadingEntityTypes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
  });

  // Organization state
  const [joinRequests, setJoinRequests] = useState([]);
  const [userOrganization, setUserOrganization] = useState(null);
  const [isLoadingOrgData, setIsLoadingOrgData] = useState(false);
  const [hasLoadedOrgData, setHasLoadedOrgData] = useState(false);

  // Signature capture state
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [signatureStatus, setSignatureStatus] = useState('pending'); // pending, captured, saved
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const navigate = useNavigate();
  const { logout: authLogout, login, updateUserSignature, organization: organizationFromContext, checkOrganizationAccess } = useAuth();
  
  // Get resetWizard function from PetitionWizard context
  const { resetWizard } = usePetitionWizard();

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
    
    // Initialize edit form data
    if (userData) {
      
      setEditFormData({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
      });
      
      // Check for existing signature data
      // Only set as saved if both signatureUrl is non-empty and signatureImageName is not null/empty
      if (userData.signatureUrl && 
          userData.signatureUrl.trim() !== "" && 
          userData.signatureImageName) {
        setSignatureStatus('saved');
        setSignatureData(userData.signatureUrl);
        setIsImageLoading(true);
      } else {
        setSignatureStatus('pending');
        setSignatureData(null);
      }
      setSelectedFilingEntityType(userData.filingEntityTypeId || "");
    }
  }, [navigate]);

  // Fetch filing entity types on page load
  useEffect(() => {
    const fetchFilingEntityTypes = async () => {
      setIsLoadingEntityTypes(true);
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
        setIsLoadingEntityTypes(false);
      }
    };

    fetchFilingEntityTypes();
  }, []); // Load on page load instead of only when entering edit mode

  // Re-check organization access when Profile mounts or user changes
  // This ensures access is always validated when navigating to Profile
  useEffect(() => {
    if (user) {
      // Re-check organization access to ensure it's current
      checkOrganizationAccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only depend on user, not checkOrganizationAccess function reference

  // Load organization data (only for join requests, not for org admins who already have organizationId)
  useEffect(() => {
    if (user && !organizationFromContext) {
      // Only load join requests if user doesn't have organization from context
      // Org admins already have organizationId in their user object, so we skip this
      loadOrganizationData();
    } else if (organizationFromContext) {
      // If we have organization from context, mark as loaded
      setIsLoadingOrgData(false);
      setHasLoadedOrgData(true);
    }
  }, [user, organizationFromContext]);

  // Load signature separately to avoid infinite loop
  useEffect(() => {
    if (user?.id) {
      fetchUserSignature(user.id);
    }
  }, [user?.id]); // Only depend on user.id, not the entire user object

  const fetchUserSignature = async (userId) => {
    try {
      const response = await getSignatureById(userId);
      if (response.isSuccess && response.data) {
        const signatureData = response.data;
        // Check if signature actually exists (not empty/null)
        if (signatureData.signatureUrl && 
            signatureData.signatureUrl.trim() !== "" && 
            signatureData.signatureImageName) {
          setSignatureData(signatureData.signatureUrl);
          setSignatureStatus('saved');
          
          // Update context only - don't update local user state to avoid infinite loop
          updateUserSignature(signatureData);
          
          return true;
        } else {
          // Signature data exists but is empty/null - user hasn't uploaded signature
          setSignatureStatus('pending');
          setSignatureData(null);
          return false;
        }
      } else {
        setSignatureStatus('pending');
        setSignatureData(null);
        return false;
      }
    } catch (error) {
      setSignatureStatus('pending');
      setSignatureData(null);
      return false;
    }
  };

  const loadOrganizationData = async () => {
    setIsLoadingOrgData(true);
    try {
      // If user has organizationId from context (org admins), use that instead of join requests
      if (organizationFromContext) {
        // Organization already loaded from AuthContext, just mark as complete
        setHasLoadedOrgData(true);
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
                  primaryContactName: orgResponse.data.primaryContactName,
                  primaryContactEmail: orgResponse.data.primaryContactEmail,
                  primaryContactPhone: orgResponse.data.primaryContactPhone,
                };
              }
              return request;
            } catch (error) {
              return request;
            }
          })
        );

        setJoinRequests(requestsWithOrgNames);
        
        // Check if user has any approved requests and load their organization
        // Note: This is only for display - actual organizationId should come from AuthContext
        const approvedRequest = requestsWithOrgNames.find(request => request.status === 1);
        if (approvedRequest) {
          setUserOrganization(approvedRequest);
        }
      } else {
        setJoinRequests([]);
      }
    } catch (error) {
      setJoinRequests([]);
    } finally {
      setIsLoadingOrgData(false);
      setHasLoadedOrgData(true);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 0:
        return { text: "Pending", class: "status-pending", icon: "fa-clock" };
      case 1:
        return {
          text: "Approved",
          class: "status-approved",
          icon: "fa-check-circle",
        };
      case 2:
        return {
          text: "Rejected",
          class: "status-rejected",
          icon: "fa-times-circle",
        };
      default:
        return {
          text: "Unknown",
          class: "status-unknown",
          icon: "fa-question-circle",
        };
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

  const handleEditProfile = () => {
    setIsEditMode(true);
  };

  const handleFilingEntityTypeChange = (e) => {
    setSelectedFilingEntityType(e.target.value);
  };

  const handleFormInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("User information not found");
      return;
    }

    setIsSaving(true);
    try {
      const response = await updateUser(
        user.id,
        selectedFilingEntityType,
        editFormData.firstName,
        editFormData.lastName
      );

      if (response.isSuccess) {
        toast.success(response.msg || "Profile updated successfully");
        
        // Fetch the updated user data from the API to ensure we have the latest information
        try {
          const userResponse = await getUserById(user.id);
          
          if (userResponse.isSuccess && userResponse.data) {
            // Update local user data with fresh data from API
            const updatedUser = userResponse.data;
            setUser(updatedUser);
            
            // Update auth context with new user data
             const { token } = getAuthData();
            clearAuthData();
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            // Update the form data with the fresh data
            setEditFormData({
              firstName: updatedUser.firstName || "",
              lastName: updatedUser.lastName || "",
            });
            setSelectedFilingEntityType(updatedUser.filingEntityTypeId || "");
          } else {
            // Fallback: Update with the data we sent
            const updatedUser = {
              ...user,
              firstName: editFormData.firstName,
              lastName: editFormData.lastName,
              filingEntityTypeId: selectedFilingEntityType,
              fullName: `${editFormData.firstName} ${editFormData.lastName}`.trim(),
            };
            setUser(updatedUser);
            
            localStorage.setItem('user', JSON.stringify(updatedUser));
            // Update the auth context state
            login(updatedUser);
          }
        } catch (error) {
          // Fallback: Update with the data we sent
          const updatedUser = {
            ...user,
            firstName: editFormData.firstName,
            lastName: editFormData.lastName,
            filingEntityTypeId: selectedFilingEntityType,
            fullName: `${editFormData.firstName} ${editFormData.lastName}`.trim(),
          };
          setUser(updatedUser);
          
          const { token } = getAuthData();
            clearAuthData();
            localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(updatedUser));
  
        }
        
        setIsEditMode(false);
      } else {
        toast.error(response.msg || "Failed to update profile");
      }
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (user) {
      setEditFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
      });
      setSelectedFilingEntityType(user.filingEntityTypeId || "");
    }
    setIsEditMode(false);
  };

  const handleSignatureCapture = () => {
    setShowSignatureModal(true);
  };

  const handleSignatureSave = async (signatureDataUrl) => {
    if (!user?.id) {
      toast.error("User information not found");
      return;
    }

    setIsUploadingSignature(true);
    try {
      // Convert data URL to blob
      const response = await fetch(signatureDataUrl);
      const blob = await response.blob();
      
      // Create a file from the blob
      const file = new File([blob], 'signature.png', { type: 'image/png' });
      
      // Upload signature to API
      const uploadResponse = await uploadUserSignature(user.id, file);
      
      if (uploadResponse.isSuccess) {
        // Update local state with the API response URL
        setSignatureData(uploadResponse.data.signatureUrl);
        setSignatureStatus('saved');
        
        // Update user data in context and storage
        const updatedUser = {
          ...user,
          signatureImageName: uploadResponse.data.signatureImageName,
          signatureUrl: uploadResponse.data.signatureUrl,
        };
        setUser(updatedUser);
        updateUserSignature(uploadResponse.data);
        
        // Update storage
        const { token } = getAuthData();
        clearAuthData();
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        toast.success('Signature uploaded successfully!');
        setShowSignatureModal(false);
      } else {
        toast.error(uploadResponse.msg || 'Failed to upload signature');
      }
    } catch (error) {
      toast.error('Failed to upload signature. Please try again.');
    } finally {
      setIsUploadingSignature(false);
    }
  };

  const handleSignatureClose = () => {
    setShowSignatureModal(false);
  };

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <Sidebar 
        activeSection="profile"
        onSectionChange={(section) => {
          if (section === 'dashboard') {
            navigate(ROUTES.DASHBOARD);
          } else if (section === 'organizations') {
            navigate(ROUTES.DASHBOARD, { state: { activeSection: 'organizations' } });
          }
        }}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="dashboard-main-area container-fluid">
        <Header 
          user={user}
          pageTitle="Profile"
          onLogout={handleLogout}
        />

        {/* Main Profile Content */}
        <div className="dashboard-content-section">
          {/* Profile Dashboard Section */}
          <div className="shadow-custom bg-white org-search-box">
            <h2 className="font-med mb-4 fw-medium">My Profile</h2>
            

            {/* Profile Header Card */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="stat-card p-4">
                  <div className="d-flex flex-column flex-md-row align-items-center gap-4">
                    <div className="profile-avatar-large">
                      <img
                        className="rounded-circle object-fit-cover"
                        src="https://static.vecteezy.com/system/resources/thumbnails/003/337/584/small/default-avatar-photo-placeholder-profile-icon-vector.jpg"
                        alt="User Avatar"
                        style={{ width: "120px", height: "120px" }}
                      />
                    </div>
                    <div className="text-center text-md-start flex-grow-1">
                      <h3 className="fw-medium mb-2">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-muted mb-2">
                        <i className="fas fa-envelope me-2"></i>
                        {user.email}
                      </p>
                      <p className="text-muted mb-0">
                        <i className="fas fa-user-tag me-2"></i>
                        {getUserRole(user) || "N/A"}
                      </p>
                    </div>
                    <div className="d-flex gap-2">
                      {isEditMode ? (
                        <>
                          <button 
                            className="dashboard-btn-create" 
                            onClick={handleSave}
                            disabled={isSaving}
                            style={{ minHeight: '40px', padding: '10px 20px' }}
                          >
                            {isSaving ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Saving...
                              </>
                            ) : (
                              <>
                                <i className="fa-solid fa-save me-1"></i> Save
                              </>
                            )}
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-secondary" 
                            onClick={handleCancel}
                            style={{ minHeight: '40px', padding: '8px 16px' }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button 
                          className="dashboard-btn-create" 
                          onClick={handleEditProfile}
                          style={{ minHeight: '40px', padding: '10px 20px' }}
                        >
                          <i className="fa-solid fa-edit me-1"></i> Edit Profile
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Information Cards */}
            <div className="row mb-4">
              {/* Filing Entity Type Card */}
              <div className="col-12 mb-3">
                <div className="stat-card p-4">
                  <h4 className="fw-medium mb-4">
                    <i className="fas fa-building me-2 text-secondary"></i>
                    Filing Entity Type
                  </h4>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label text-muted small">Entity Type</label>
                      {isEditMode ? (
                        isLoadingEntityTypes ? (
                          <div className="d-flex align-items-center">
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            <span className="text-muted">Loading entity types...</span>
                          </div>
                        ) : (
                          <CustomDropdown
                            name="filingEntityTypeId"
                            value={selectedFilingEntityType}
                            onChange={handleFilingEntityTypeChange}
                            placeholder="Select Filing Entity Type"
                            options={[
                              { value: "", label: "Select Filing Entity Type" },
                              ...filingEntityTypes.map((entityType) => ({
                                value: entityType.id,
                                label: entityType.name,
                              })),
                            ]}
                          />
                        )
                      ) : (
                        <p className="fw-medium mb-0">
                          {isLoadingEntityTypes ? (
                            <span className="text-muted">Loading...</span>
                          ) : selectedFilingEntityType ? (
                            filingEntityTypes.find(et => et.id === selectedFilingEntityType)?.name || "Not Set"
                          ) : (
                            "Not Set"
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 mb-3">
                <div className="stat-card p-4">
                  <h4 className="fw-medium mb-4">
                    <i className="fas fa-user me-2 text-secondary"></i>
                    Personal Information
                  </h4>
                  <div className="row g-3">
                    <div className="col-sm-6">
                      <label className="form-label text-muted small">First Name</label>
                      {isEditMode ? (
                        <input
                          type="text"
                          name="firstName"
                          className="form-control"
                          value={editFormData.firstName}
                          onChange={handleFormInputChange}
                          placeholder="Enter first name"
                        />
                      ) : (
                        <p className="fw-medium mb-0">{user.firstName}</p>
                      )}
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label text-muted small">Last Name</label>
                      {isEditMode ? (
                        <input
                          type="text"
                          name="lastName"
                          className="form-control"
                          value={editFormData.lastName}
                          onChange={handleFormInputChange}
                          placeholder="Enter last name"
                        />
                      ) : (
                        <p className="fw-medium mb-0">{user.lastName}</p>
                      )}
                    </div>
                    <div className="col-12">
                      <label className="form-label text-muted small">Email Address</label>
                      <p className="fw-medium mb-0">{user.email}</p>
                    </div>
                    {user.phone && (
                      <div className="col-12">
                        <label className="form-label text-muted small">Phone Number</label>
                        <p className="fw-medium mb-0">{user.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-12 mb-3">
                <div className="stat-card p-4">
                  <h4 className="fw-medium mb-4">
                    <i className="fas fa-id-card me-2 text-secondary"></i>
                    Account Details
                  </h4>
                  <div className="row g-3">
                    <div className="col-sm-6">
                      <label className="form-label text-muted small">Role</label>
                      <p className="fw-medium mb-0">
                        <span className="badge bg-primary fs-6">{getUserRole(user) || "N/A"}</span>
                      </p>
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label text-muted small">Account Status</label>
                      <p className="fw-medium mb-0">
                        <span className="badge bg-success fs-6">Active</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Digital Signature Section */}
              <div className="col-12 mb-3">
                <div className="stat-card p-4">
                  <h4 className="fw-medium mb-4">
                    <i className="fas fa-signature me-2 text-secondary"></i>
                     Signature
                  </h4>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label text-muted small">Signature Status</label>
                      <p className="fw-medium mb-0">
                        {signatureStatus === 'saved' ? (
                          <span className="badge bg-success fs-6">
                            <i className="fa-solid fa-check-circle me-1"></i>
                            Captured
                          </span>
                        ) : (
                          <span className="badge bg-warning fs-6">
                            <i className="fa-solid fa-clock me-1"></i>
                            Pending
                          </span>
                        )}
                      </p>
                    </div>
                    
                    {/* Signature Preview */}
                    {signatureStatus === 'saved' && signatureData && (
                      <div className="col-12">
                        <label className="form-label text-muted small">Signature Preview</label>
                        <div className="signature-preview-container p-3 border rounded bg-light">
                          <img 
                            src={signatureData} 
                            alt="Digital Signature" 
                            className="signature-preview-img"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '120px',
                              objectFit: 'contain',
                              border: '1px solid #dee2e6',
                              borderRadius: '4px',
                              backgroundColor: 'white'
                            }}
                            onLoad={() => setIsImageLoading(false)}
                            onError={() => {
                              setIsImageLoading(false);
                            }}
                          />
                          {isImageLoading && (
                            <div className="text-center py-2">
                              <div className="spinner-border spinner-border-sm text-primary" role="status">
                                <span className="visually-hidden">Loading signature...</span>
                              </div>
                              <p className="mt-1 text-muted small">Loading signature...</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="col-12">
                      <label className="form-label text-muted small">Last Updated</label>
                      <p className="fw-medium mb-0 text-muted small">
                        {signatureStatus === 'saved' ? new Date().toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                    <div className="col-12 mt-3">
                      <button 
                        className="dashboard-btn-create w-100"
                        onClick={handleSignatureCapture}
                        disabled={isUploadingSignature}
                      >
                        {isUploadingSignature ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-pen-to-square me-1"></i>
                            {signatureStatus === 'saved' ? 'Update Digital Signature' : 'Capture Digital Signature'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Organization Section */}
            <div className="row mb-4">
              <div className="col-12 mb-3">
                <div className="stat-card p-4">
                  <h4 className="fw-medium mb-4">
                    <i className="fas fa-building me-2 text-secondary"></i>
                    Organization Information
                  </h4>
                  
                  {isLoadingOrgData && !organizationFromContext ? (
                    <div className="text-center py-3">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2 text-muted small">Loading...</p>
                    </div>
                  ) : hasLoadedOrgData || organizationFromContext ? (
                    <>
                      {displayOrganization ? (
                        // User is part of an organization
                        <div className="row g-3">
                          <div className="col-12">
                            <label className="form-label text-muted small">Organization</label>
                            <p className="fw-medium mb-0">{displayOrganization.organizationName || displayOrganization.name}</p>
                          </div>
                          <div className="col-12">
                            <label className="form-label text-muted small">Type</label>
                            <p className="fw-medium mb-0">{displayOrganization.organizationType || displayOrganization.type || "N/A"}</p>
                          </div>
                          {(displayOrganization.organizationAddress || (displayOrganization.addressStreet1 || displayOrganization.addressCity)) && (
                            <div className="col-12">
                              <label className="form-label text-muted small">Address</label>
                              <p className="fw-medium mb-0 small">
                                {displayOrganization.organizationAddress || 
                                 `${displayOrganization.addressStreet1 || ''}${displayOrganization.addressStreet2 ? ', ' + displayOrganization.addressStreet2 : ''}, ${displayOrganization.addressCity || ''}, ${displayOrganization.addressState || ''} ${displayOrganization.addressZip || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '')}
                              </p>
                            </div>
                          )}
                          {(displayOrganization.primaryContactName || displayOrganization.primaryContactEmail || displayOrganization.primaryContactPhone) && (
                            <div className="col-12">
                              <label className="form-label text-muted small">Primary Contact</label>
                              <div className="fw-medium mb-0 small">
                                {displayOrganization.primaryContactName && (
                                  <div><i className="fa-solid fa-user me-1"></i>{displayOrganization.primaryContactName}</div>
                                )}
                                {displayOrganization.primaryContactEmail && (
                                  <div><i className="fa-solid fa-envelope me-1"></i>{displayOrganization.primaryContactEmail}</div>
                                )}
                                {displayOrganization.primaryContactPhone && (
                                  <div><i className="fa-solid fa-phone me-1"></i>{displayOrganization.primaryContactPhone}</div>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="col-12">
                            <label className="form-label text-muted small">Status</label>
                            <p className="fw-medium mb-0">
                              <span className="badge bg-success fs-6">
                                <i className="fa-solid fa-check-circle me-1"></i>
                                Active Member
                              </span>
                            </p>
                          </div>
                          {(displayOrganization.respondedOn || displayOrganization.requestedOn) && (
                            <div className="col-12">
                              <label className="form-label text-muted small">Joined</label>
                              <p className="fw-medium mb-0">
                                {new Date(displayOrganization.respondedOn || displayOrganization.requestedOn).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : joinRequests.length > 0 ? (
                        // User has pending requests
                        <div className="row g-3">
                          <div className="col-12">
                            <div className="alert alert-info py-2 px-3 mb-3">
                              <i className="fa-solid fa-clock me-1"></i>
                              <small>You have pending requests</small>
                            </div>
                          </div>
                          {joinRequests.slice(0, 2).map((request) => {
                            const statusInfo = getStatusInfo(request.status);
                            return (
                              <div key={request.id} className="col-12">
                                <div className="border rounded p-3">
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                      <h6 className="mb-1 small">{request.organizationName}</h6>
                                      <small className="text-muted">{request.organizationType}</small>
                                    </div>
                                    <span className={`badge ${statusInfo.class} fs-6`}>
                                      <i className={`fa-solid ${statusInfo.icon} me-1`}></i>
                                      {statusInfo.text}
                                    </span>
                                  </div>
                                  <small className="text-muted">
                                    <i className="fa-solid fa-calendar me-1"></i>
                                    Requested: {new Date(request.requestedOn).toLocaleDateString()}
                                  </small>
                                </div>
                              </div>
                            );
                          })}
                          {joinRequests.length > 2 && (
                            <div className="col-12">
                              <small className="text-muted">
                                +{joinRequests.length - 2} more requests
                              </small>
                            </div>
                          )}
                          <div className="col-12 mt-2">
                            <button 
                              className="dashboard-btn-create w-100"
                              onClick={() => navigate(ROUTES.DASHBOARD, { state: { activeSection: 'organizations' } })}
                            >
                              <i className="fa-solid fa-building me-1"></i>
                              View All Requests
                            </button>
                          </div>
                        </div>
                      ) : (
                        // User is not part of any organization
                        <div className="text-center py-3">
                          <div className="mb-3">
                            <i className="fa-solid fa-building text-muted" style={{ fontSize: "2rem" }}></i>
                          </div>
                          <h6 className="text-muted mb-2">Not part of any organization</h6>
                          <p className="text-muted mb-3 small">
                            Join an organization to access the petition filing dashboard.
                          </p>
                          <button 
                            className="dashboard-btn-create w-100"
                            onClick={() => navigate(ROUTES.DASHBOARD, { state: { activeSection: 'organizations' } })}
                          >
                            <i className="fa-solid fa-building me-1"></i>
                            Join Organization
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-3">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2 text-muted small">Loading...</p>
                    </div>
                  )}
                </div>
              </div>
              
            </div>

          </div>
        </div>
      </main>

      {/* Signature Capture Modal */}
      <SignatureCapture
        isOpen={showSignatureModal}
        onClose={handleSignatureClose}
        onSave={handleSignatureSave}
        isUploading={isUploadingSignature}
      />
    </div>
  );
}

export default Profile;

