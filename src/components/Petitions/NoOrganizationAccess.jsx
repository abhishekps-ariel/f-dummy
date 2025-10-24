import React from 'react';

const NoOrganizationAccess = () => {

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
              You need to be part of an organization to access this section. You can either join an existing organization or create a new organization on thedashboard.
            </p>
            
            <div className="mt-4">
              <div className="d-flex align-items-center justify-content-center">
                <i className="fas fa-exclamation-triangle text-warning me-2" style={{ fontSize: '1.5rem' }}></i>
                <span className="text-muted">Organization access required</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoOrganizationAccess;

