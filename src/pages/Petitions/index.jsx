import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout as logoutApi } from '../../services/authService';
import { clearAuthData, getAuthData } from '../../utils/storage';
import { ROUTES } from '../../constants/routerConstants';
import Sidebar from '../../components/shared/Sidebar';
import Header from '../../components/shared/Header';
import ViewAllPetitions from '../../components/Petitions/ViewAllPetitions';
import { usePetitions } from '../../hooks/usePetitions';
import { TabProvider } from '../../context/TabContext';

const Petitions = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('petitions');
  const { petitions, loading, error, fetchPetitions, submitPetition } = usePetitions();

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
      logout();
      navigate(ROUTES.LOGIN);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar 
        activeSection={activeSection}
        onSectionChange={(section) => {
          if (section === 'dashboard') {
            navigate(ROUTES.DASHBOARD);
          } else if (section === 'form35') {
            navigate(ROUTES.FORM35);
          } else if (section === 'messages') {
            navigate(ROUTES.MESSAGES);
          } else if (section === 'faq') {
            navigate(ROUTES.FAQ);
          } else if (section === 'training') {
            navigate(ROUTES.TRAINING);
          }
        }}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="dashboard-main-area container-fluid">
        <Header 
          user={user}
          pageTitle={t("petitionsPage.title")}
          onLogout={handleLogout}
        />

        {/* Main Petitions Content */}
        <div className="dashboard-content-section">
          <TabProvider>
            <ViewAllPetitions />
          </TabProvider>
        </div>
      </main>
    </div>
  );
};

export default Petitions;
