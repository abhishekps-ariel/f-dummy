import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routerConstants';

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
              You need to be part of an organization to access the Petition Dashboard. 
              This ensures that petitions are properly managed and associated with the correct organization.
            </p>
            
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h5 className="card-title mb-3">
                  <i className="fas fa-info-circle text-info me-2"></i>
                  What you need to do:
                </h5>
                
                <div className="text-start">
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <span className="badge bg-primary me-2">1</span>
                      <strong>Join an existing organization</strong>
                    </div>
                    <p className="text-muted small ms-4 mb-0">
                      Request to join an organization that you're affiliated with.
                    </p>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <span className="badge bg-primary me-2">2</span>
                      <strong>Create a new organization</strong>
                    </div>
                    <p className="text-muted small ms-4 mb-0">
                      If you represent a new organization, create one and invite members.
                    </p>
                  </div>
                  
                  <div className="mb-0">
                    <div className="d-flex align-items-center mb-2">
                      <span className="badge bg-primary me-2">3</span>
                      <strong>Wait for approval</strong>
                    </div>
                    <p className="text-muted small ms-4 mb-0">
                      Once approved, you'll have access to the Petition Dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <Link 
                to={ROUTES.DASHBOARD} 
                className="dashboard-btn-create"
                style={{ textDecoration: 'none' }}
              >
                <i className="fas fa-building me-2"></i>
                Manage Organizations
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoOrganizationAccess;
