import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthData, clearAuthData } from "../services/auth.service";
import loginImg from "../assets/logo-sample.png";
import "../styles/custom.css";

function Profile() {
  const [user, setUser] = useState(null);
  const [tokenExpiration, setTokenExpiration] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { user: userData, token } = getAuthData();
    
    if (!userData || !token) {
      navigate("/login");
      return;
    }

    setUser(userData);
    
    // Get token expiration from localStorage if available
    const authData = localStorage.getItem('authData');
    if (authData) {
      const parsed = JSON.parse(authData);
      setTokenExpiration(parsed.tokenExpiration);
    }
  }, [navigate]);

  const handleLogout = () => {
    clearAuthData();
    navigate("/login");
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
    <div className="login">
      <div className="container container-md-auto">
        <div className="row m-0">
          <div className="col-lg-7 col-md-8 mx-auto">
            <div className="login-inner d-flex flex-column align-items-center justify-content-center">
              <div className="w-100">
                <div className="login-header mb-5 text-center">
                  <div className="login-logo">
                    <img src={loginImg} alt="logo" className="w-100" />
                  </div>
                  <h2 className="font-xl-med fw-bold">User Profile</h2>
                  <p className="font-base text-muted">Welcome back, {user.firstName}!</p>
                </div>

                <div className="profile-info">
                  <div className="row g-4">
                    <div className="col-12">
                      <div className="info-card p-4 border rounded">
                        <h5 className="fw-bold mb-3">Personal Information</h5>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label fw-medium">Full Name</label>
                            <p className="form-control-plaintext">{user.fullName || `${user.firstName} ${user.lastName}`}</p>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-medium">Email</label>
                            <p className="form-control-plaintext">{user.email}</p>
                          </div>
                          {user.department && (
                            <div className="col-md-6">
                              <label className="form-label fw-medium">Department</label>
                              <p className="form-control-plaintext">{user.department}</p>
                            </div>
                          )}
                          <div className="col-md-6">
                            <label className="form-label fw-medium">Account Status</label>
                            <p className="form-control-plaintext">
                              <span className={`badge ${user.isActive ? 'bg-success' : 'bg-danger'}`}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {user.roles && user.roles.length > 0 && (
                      <div className="col-12">
                        <div className="info-card p-4 border rounded">
                          <h5 className="fw-bold mb-3">Roles & Permissions</h5>
                          <div className="d-flex flex-wrap gap-2">
                            {user.roles.map((role, index) => (
                              <span key={index} className="badge bg-primary">{role}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="col-12">
                      <div className="info-card p-4 border rounded">
                        <h5 className="fw-bold mb-3">Account Details</h5>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label fw-medium">User ID</label>
                            <p className="form-control-plaintext font-monospace small">{user.id}</p>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-medium">Created At</label>
                            <p className="form-control-plaintext">
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-medium">Last Login</label>
                            <p className="form-control-plaintext">
                              {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'N/A'}
                            </p>
                          </div>
                          {tokenExpiration && (
                            <div className="col-md-6">
                              <label className="form-label fw-medium">Token Expires</label>
                              <p className="form-control-plaintext">
                                {new Date(tokenExpiration).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center mt-4">
                    <button
                      onClick={handleLogout}
                      className="btn btn-outline-danger me-3"
                    >
                      <i className="fa-solid fa-sign-out-alt me-2"></i>
                      Logout
                    </button>
                    <button
                      onClick={() => navigate("/")}
                      className="btn btn-primary"
                    >
                      <i className="fa-solid fa-home me-2"></i>
                      Back to Home
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
