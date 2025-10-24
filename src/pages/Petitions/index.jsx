import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout as logoutApi } from '../../services/authService';
import { ROUTES } from '../../constants/routerConstants';
import Sidebar from '../../components/shared/Sidebar';
import Header from '../../components/shared/Header';
import ViewAllPetitions from '../../components/Petitions/ViewAllPetitions';

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
          {/* View All Petitions Component */}
          <ViewAllPetitions />
        </div>
      </main>
    </div>
  );
};

export default Petitions;
