import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { logout as logoutApi } from '../../services/authService';
import { clearAuthData, getAuthData } from '../../utils/storage';
import { ROUTES } from '../../constants/routerConstants';
import Sidebar from '../../components/shared/Sidebar';
import Header from '../../components/shared/Header';

const Form35 = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('dashboard');

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
          } else if (section === 'petitions') {
            navigate(ROUTES.PETITIONS);
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
          pageTitle="Form 35B Compliance"
          onLogout={handleLogout}
        />

        {/* Main Form 35B Content */}
        <div className="dashboard-content-section">
          <div className="shadow-custom bg-white org-search-box">
            <div className="p-4">
              <h2 className="h4 mb-3 fw-bold theme-color">Form 35B Compliance</h2>
              <p className="text-muted mb-4">Manage and view Form 35B compliance information.</p>
              
              {/* Placeholder content */}
              <div className="row">
                <div className="col-12">
                  <div className="card">
                    <div className="card-body text-center py-5">
                      <i className="fa-solid fa-file-contract fa-3x text-muted mb-3"></i>
                      <h5 className="card-title">Form 35B Compliance</h5>
                      <p className="card-text text-muted">
                        This page will contain Form 35B compliance information and management tools.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Form35;

