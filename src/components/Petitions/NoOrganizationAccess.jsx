import React from 'react';

const NoOrganizationAccess = ({ onNavigateToOrganizations }) => {
  const handleOrgDashboardClick = () => {
    if (onNavigateToOrganizations) {
      onNavigateToOrganizations();
    }
  };

  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-6">
          <div className="text-center py-5">
            <div className="mb-4">
              <i className="fas fa-building-slash text-muted" style={{ fontSize: '4rem' }}></i>
            </div>
            
            <h2 className="h3 mb-3">Organization Required</h2>
            
            <p className="text-muted mb-4">
              You need to be part of an organization to access the Petition Dashboard. You can either join an existing organization or create a new organization on the org dashboard.
            </p>
            
            <div className="mt-4">
              <button 
                onClick={handleOrgDashboardClick} 
                className="dashboard-btn-create"
              >
                <i className="fas fa-arrow-right me-2"></i>
                Go to Org Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoOrganizationAccess;
