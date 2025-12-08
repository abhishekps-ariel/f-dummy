import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { getAuthData, clearAuthData, getUserRole, updateStoredUser } from "../../utils/storage";
import { useAuth } from "../../context/AuthContext";
import { usePetitionWizard } from "../../context/PetitionWizardContext";
import { ROUTES } from "../../constants/routerConstants";
import { logout as logoutApi, updateUser, getUserById, uploadUserSignature, getSignatureById, getBase64ByS3Key } from "../../services/authService";
import { getFilingEntityTypes } from "../../services/commonService";
import { toast } from "react-toastify";
import Sidebar from "../../components/shared/Sidebar";
import Header from "../../components/shared/Header";
import SignatureCapture from "../../components/shared/SignatureCapture";
import CustomDropdown from "../../components/shared/CustomDropdown";
import "../../styles/custom.css";
import "../../components/shared/CustomDropdown.css";

function Profile() {
  const { t } = useTranslation();
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


  // Signature capture state
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [signatureStatus, setSignatureStatus] = useState('pending'); // pending, captured, saved
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const navigate = useNavigate();
  const {
    logout: authLogout,
    login,
    updateUserSignature,
  } = useAuth();
  
  // Get resetWizard function from PetitionWizard context
  const { resetWizard } = usePetitionWizard();

  // Check if user is a filer
  const isFiler = () => {
    if (!user) return false;
    const userRole = getUserRole(user);
    return userRole && userRole.toLowerCase() === 'filer';
  };

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
      // New format: signatureBase64 and signatureImageName instead of signatureUrl
      if (userData.signatureBase64 && 
          userData.signatureBase64.trim() !== "" && 
          userData.signatureImageName) {
        const dataUrl = `data:image/png;base64,${userData.signatureBase64}`;
        setSignatureStatus('saved');
        setSignatureData(dataUrl);
        setIsImageLoading(true);
      } else if (userData.signatureUrl && 
          userData.signatureUrl.trim() !== "" && 
          userData.signatureImageName) {
        // Fallback for old format
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
      } catch {
        setFilingEntityTypes([]);
      } finally {
        setIsLoadingEntityTypes(false);
      }
    };

    fetchFilingEntityTypes();
  }, []); // Load on page load instead of only when entering edit mode


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
        // New format: signatureBase64 and signatureImageName instead of signatureUrl
        if (signatureData.signatureBase64 && 
            signatureData.signatureBase64.trim() !== "" && 
            signatureData.signatureImageName) {
          // Convert base64 to data URL for display
          const dataUrl = `data:image/png;base64,${signatureData.signatureBase64}`;
          setSignatureData(dataUrl);
          setSignatureStatus('saved');
          
          // Update context with new format (include both base64 and imageName for compatibility)
          const updatedSignatureData = {
            ...signatureData,
            signatureUrl: dataUrl, // Keep for backward compatibility
          };
          updateUserSignature(updatedSignatureData);
          
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
    } catch {
      setSignatureStatus('pending');
      setSignatureData(null);
      return false;
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
      toast.error(t("profile.userInfoNotFound"));
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
        toast.success(response.msg || t("profile.profileUpdatedSuccess"));
        
        // Fetch the updated user data from the API to ensure we have the latest information
        try {
          const userResponse = await getUserById(user.id);
          
          if (userResponse.isSuccess && userResponse.data) {
            // Update local user data with fresh data from API
            const updatedUser = userResponse.data;
            setUser(updatedUser);
            
            // Update auth context with new user data
            updateStoredUser(updatedUser);
            
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
        } catch {
          // Fallback: Update with the data we sent
          const updatedUser = {
            ...user,
            firstName: editFormData.firstName,
            lastName: editFormData.lastName,
            filingEntityTypeId: selectedFilingEntityType,
            fullName: `${editFormData.firstName} ${editFormData.lastName}`.trim(),
          };
          setUser(updatedUser);
          updateStoredUser(updatedUser);
  
        }
        
        setIsEditMode(false);
      } else {
        toast.error(response.msg || t("profile.failedUpdateProfile"));
      }
    } catch (err) {
      toast.error(err?.message || t("profile.failedUpdateProfileRetry"));
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
      toast.error(t("profile.userInfoNotFound"));
      return;
    }

    setIsUploadingSignature(true);
    try {
      // Show preview immediately using the captured signature data URL
      setSignatureData(signatureDataUrl);
      setSignatureStatus('saved');
      setIsImageLoading(false);
      
      // Convert data URL to blob
      const response = await fetch(signatureDataUrl);
      const blob = await response.blob();
      
      // Create a file from the blob
      const file = new File([blob], 'signature.png', { type: 'image/png' });
      
      // Upload signature to API
      const uploadResponse = await uploadUserSignature(user.id, file);
      
      if (uploadResponse.isSuccess) {
        // Extract base64 from the data URL for storage
        const base64Match = signatureDataUrl.match(/data:image\/[^;]+;base64,(.+)/);
        const signatureBase64 = base64Match ? base64Match[1] : null;
        
        // Get signatureImageName (S3 key) from API response
        const signatureImageName = uploadResponse.data.signatureImageName;
        
        // Update user data in context and storage
        const updatedUser = {
          ...user,
          signatureImageName: signatureImageName,
          signatureBase64: signatureBase64,
          signatureUrl: signatureDataUrl, // Use the captured data URL for immediate display
        };
        setUser(updatedUser);
        
        // Update context with signature data
        updateUserSignature({
          signatureImageName: signatureImageName,
          signatureBase64: signatureBase64,
          signatureUrl: signatureDataUrl,
        });
        
        // Update storage - preserve refreshToken and activeOrganizationId
        updateStoredUser(updatedUser);
        
        // Optionally fetch the signature base64 from server using the S3 key
        // This ensures we have the server's version, but preview is already showing
        if (signatureImageName) {
          try {
            const signatureResponse = await getBase64ByS3Key(signatureImageName);
            if (signatureResponse.isSuccess && signatureResponse.data?.signatureBase64) {
              const serverBase64 = signatureResponse.data.signatureBase64;
              const serverDataUrl = `data:image/png;base64,${serverBase64}`;
              setSignatureData(serverDataUrl);
              const finalUpdatedUser = {
                ...updatedUser,
                signatureBase64: serverBase64,
                signatureUrl: serverDataUrl,
              };
              setUser(finalUpdatedUser);
              updateUserSignature({
                signatureImageName: signatureImageName,
                signatureBase64: serverBase64,
                signatureUrl: serverDataUrl,
              });
              updateStoredUser(finalUpdatedUser);
            }
          } catch (fetchError) {
            // If fetching fails, we still have the preview from the upload
          }
        }
        
        toast.success(t("profile.signatureUploadedSuccess"));
        setShowSignatureModal(false);
      } else {
        // If upload fails, reset the preview
        setSignatureData(null);
        setSignatureStatus('pending');
        toast.error(uploadResponse.msg || t("profile.failedUploadSignature"));
      }
    } catch (err) {
      // If upload fails, reset the preview
      setSignatureData(null);
      setSignatureStatus('pending');
      toast.error(err?.message || t("profile.failedUploadSignatureRetry"));
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
          <span className="visually-hidden">{t("common.loading")}</span>
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
          <div className="profile-page-container">
            {/* Profile Header Card */}
            <div className="profile-header-card">
              <div className="profile-header-content">
                <div className="profile-avatar-wrapper">
                  <img
                    className="profile-avatar"
                    src="https://static.vecteezy.com/system/resources/thumbnails/003/337/584/small/default-avatar-photo-placeholder-profile-icon-vector.jpg"
                    alt="User Avatar"
                  />
                </div>
                <div className="profile-header-info">
                  <h3 className="profile-user-name">
                    {user.firstName} {user.lastName}
                  </h3>
                  <div className="profile-user-details">
                    <span className="profile-detail-item">
                      <i className="fas fa-envelope"></i>
                      {user.email}
                    </span>
                  </div>
                  <div className="profile-header-badges">
                    <div className="profile-header-badge-item">
                      <label className="profile-field-label">{t("profile.role")}</label>
                      <span className="profile-badge profile-badge-primary">{getUserRole(user) || t("header.nA")}</span>
                    </div>
                    <div className="profile-header-badge-item">
                      <label className="profile-field-label">{t("profile.accountStatus")}</label>
                      <span className="profile-badge profile-badge-success">{t("profile.active")}</span>
                    </div>
                  </div>
                </div>
                <div className="profile-header-actions">
                  {isEditMode ? (
                    <>
                      <button 
                        className="profile-btn profile-btn-primary" 
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            {t("profile.saving")}
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-save me-1"></i> {t("common.save")}
                          </>
                        )}
                      </button>
                      <button 
                        className="profile-btn profile-btn-secondary" 
                        onClick={handleCancel}
                      >
                        {t("common.cancel")}
                      </button>
                    </>
                  ) : (
                    <button 
                      className="profile-btn profile-btn-primary" 
                      onClick={handleEditProfile}
                    >
                      <i className="fa-solid fa-edit me-1"></i> {t("profile.editProfile")}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Information Cards */}
            <div className="profile-sections-grid">
              {/* Filing Entity Type Card */}
              <div className="profile-section-card">
                <div className="profile-section-header">
                  <i className="fas fa-building profile-section-icon"></i>
                  <h4 className="profile-section-title">{t("profile.filingEntityType")}</h4>
                </div>
                <div className="profile-section-content">
                  <div className="profile-field">
                    <label className="profile-field-label">{t("profile.entityType")}</label>
                    {isEditMode ? (
                      isLoadingEntityTypes ? (
                        <div className="profile-loading">
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          <span className="text-muted">{t("profile.loadingEntityTypes")}</span>
                        </div>
                      ) : (
                        <CustomDropdown
                          name="filingEntityTypeId"
                          value={selectedFilingEntityType}
                          onChange={handleFilingEntityTypeChange}
                          placeholder={t("profile.selectFilingEntityType")}
                          options={[
                            { value: "", label: t("profile.selectFilingEntityType") },
                            ...filingEntityTypes.map((entityType) => ({
                              value: entityType.id,
                              label: entityType.name,
                            })),
                          ]}
                        />
                      )
                    ) : (
                      <p className="profile-field-value">
                        {isLoadingEntityTypes ? (
                          <span className="text-muted">{t("common.loading")}</span>
                        ) : selectedFilingEntityType ? (
                          filingEntityTypes.find(et => et.id === selectedFilingEntityType)?.name || t("profile.notSet")
                        ) : (
                          t("profile.notSet")
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Information Card */}
              <div className="profile-section-card">
                <div className="profile-section-header">
                  <i className="fas fa-user profile-section-icon"></i>
                  <h4 className="profile-section-title">{t("profile.personalInformation")}</h4>
                </div>
                <div className="profile-section-content">
                  <div className="profile-fields-grid">
                    <div className="profile-field">
                      <label className="profile-field-label">{t("profile.firstName")}</label>
                      {isEditMode ? (
                        <input
                          type="text"
                          name="firstName"
                          className="form-control profile-input"
                          value={editFormData.firstName}
                          onChange={handleFormInputChange}
                          placeholder={t("profile.enterFirstName")}
                        />
                      ) : (
                        <p className="profile-field-value">{user.firstName}</p>
                      )}
                    </div>
                    <div className="profile-field">
                      <label className="profile-field-label">{t("profile.lastName")}</label>
                      {isEditMode ? (
                        <input
                          type="text"
                          name="lastName"
                          className="form-control profile-input"
                          value={editFormData.lastName}
                          onChange={handleFormInputChange}
                          placeholder={t("profile.enterLastName")}
                        />
                      ) : (
                        <p className="profile-field-value">{user.lastName}</p>
                      )}
                    </div>
                    <div className="profile-field profile-field-full">
                      <label className="profile-field-label">{t("profile.emailAddress")}</label>
                      <p className="profile-field-value">{user.email}</p>
                    </div>
                    {user.phone && (
                      <div className="profile-field profile-field-full">
                        <label className="profile-field-label">{t("profile.phoneNumber")}</label>
                        <p className="profile-field-value">{user.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Digital Signature Section */}
              <div className="profile-section-card profile-section-card-full">
                <div className="profile-section-header">
                  <i className="fas fa-signature profile-section-icon"></i>
                  <h4 className="profile-section-title">{t("profile.signature")}</h4>
                </div>
                <div className="profile-section-content">
                  <div className="profile-field">
                    <label className="profile-field-label">{t("profile.signatureStatus")}</label>
                    {signatureStatus === 'saved' ? (
                      <span className="profile-badge profile-badge-success">
                        <i className="fa-solid fa-check-circle me-1"></i>
                        {t("profile.captured")}
                      </span>
                    ) : (
                      <span className="profile-badge profile-badge-warning">
                        <i className="fa-solid fa-clock me-1"></i>
                        {t("profile.pending")}
                      </span>
                    )}
                  </div>
                  
                  {/* Signature Preview */}
                  {signatureStatus === 'saved' && signatureData && (
                    <div className="profile-field">
                      <label className="profile-field-label">{t("profile.signaturePreview")}</label>
                      <div className="signature-preview-wrapper">
                        <img 
                          src={signatureData} 
                          alt={t("profile.digitalSignature")} 
                          className="signature-preview-image"
                          onLoad={() => setIsImageLoading(false)}
                          onError={() => {
                            setIsImageLoading(false);
                          }}
                        />
                        {isImageLoading && (
                          <div className="signature-loading">
                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                              <span className="visually-hidden">Loading signature...</span>
                            </div>
                            <p className="mt-1 text-muted small">{t("profile.loadingSignature")}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="profile-field">
                    <label className="profile-field-label">Last Updated</label>
                    <p className="profile-field-value profile-field-value-muted">
                      {signatureStatus === 'saved' ? new Date().toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                  <div className="profile-signature-action">
                    <button 
                      className="profile-btn profile-btn-primary profile-btn-full"
                      onClick={handleSignatureCapture}
                      disabled={isUploadingSignature}
                    >
                      {isUploadingSignature ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          {t("profile.uploadingSignature")}
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-pen-to-square me-1"></i>
                          {signatureStatus === 'saved' ? t("profile.updateDigitalSignature") : t("profile.captureDigitalSignature")}
                        </>
                      )}
                    </button>
                  </div>
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

