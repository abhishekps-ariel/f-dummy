import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout as logoutApi } from '../../services/authService';
import { clearAuthData, getAuthData } from '../../utils/storage';
import { ROUTES } from '../../constants/routerConstants';
import Sidebar from '../../components/shared/Sidebar';
import Header from '../../components/shared/Header';
import NoOrganizationAccess from '../../components/Petitions/NoOrganizationAccess';

const FAQ = () => {
  const { user, logout, hasOrganizationAccess, organizationCheckComplete } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('faq');

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
          } else if (section === 'organizations') {
            navigate(ROUTES.DASHBOARD, { state: { activeSection: 'organizations' } });
          } else if (section === 'petitions') {
            navigate(ROUTES.PETITIONS);
          } else if (section === 'messages') {
            navigate(ROUTES.MESSAGES);
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
          pageTitle="FAQ"
          onLogout={handleLogout}
        />

        {/* Main FAQ Content */}
        <div className="dashboard-content-section">
          {!organizationCheckComplete ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Checking organization access...</p>
            </div>
          ) : !hasOrganizationAccess ? (
            <NoOrganizationAccess />
          ) : (
            <div className="shadow-custom bg-white org-search-box">
              <div className="p-4">
                <h2 className="h4 mb-3 fw-bold theme-color">Frequently Asked Questions</h2>
                <p className="text-muted mb-4">Find answers to common questions about the FILIR system.</p>
                
                {/* Placeholder content */}
                <div className="row">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-body text-center py-5">
                        <i className="fa-solid fa-question-circle fa-3x text-muted mb-3"></i>
                        <h5 className="card-title">FAQ Section</h5>
                        <p className="card-text text-muted">
                          This section will contain frequently asked questions and answers.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FAQ;
