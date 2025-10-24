import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout as logoutApi } from '../../services/authService';
import { ROUTES } from '../../constants/routerConstants';
import Sidebar from '../../components/shared/Sidebar';
import Header from '../../components/shared/Header';

const Petitions = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('petitions');

  const handleLogout = async () => {
    try {
      await logoutApi();
      logout();
      navigate(ROUTES.LOGIN);
    } catch (error) {
      console.error('Logout error:', error);
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
          pageTitle="Petitions"
          onLogout={handleLogout}
        />

        {/* Main Petitions Content */}
        <div className="dashboard-content-section">
          <div className="shadow-custom bg-white org-search-box">
            <div className="p-4">
              <h2 className="h4 mb-3 fw-bold theme-color">Petitions</h2>
              <p className="text-muted mb-4">Manage and track your petitions here.</p>
              
              {/* Placeholder content */}
              <div className="row">
                <div className="col-12">
                  <div className="card">
                    <div className="card-body text-center py-5">
                      <i className="fa-solid fa-file-contract fa-3x text-muted mb-3"></i>
                      <h5 className="card-title">Petitions Management</h5>
                      <p className="card-text text-muted">
                        This section will contain petition management functionality.
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

export default Petitions;
