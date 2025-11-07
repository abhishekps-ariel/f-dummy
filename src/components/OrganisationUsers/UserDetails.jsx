import React, { useEffect, useState } from "react";
import { getUserById } from "../../services/authService";
import { getFilingEntityTypes } from "../../services/commonService";

const UserDetails = ({ userId, onClose }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filingEntityTypes, setFilingEntityTypes] = useState([]);

  // Fetch filing entity types
  useEffect(() => {
    const fetchFilingEntityTypes = async () => {
      try {
        const response = await getFilingEntityTypes();
        if (response.isSuccess && response.data) {
          setFilingEntityTypes(response.data || []);
        }
      } catch (error) {
        console.error("Error fetching filing entity types:", error);
      }
    };
    fetchFilingEntityTypes();
  }, []);

  useEffect(() => {
    // Reset state when userId changes
    setUserData(null);
    setLoading(true);
    
    const fetchUserDetails = async () => {
      try {
        if (!userId) {
          setLoading(false);
          return;
        }
        
        const res = await getUserById(userId);
        if (res.isSuccess && res.data) {
          setUserData(res.data);
        } else {
          setUserData(null);
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserDetails();
  }, [userId]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Get filing entity type name from ID
  const getFilingEntityTypeName = (filingEntityTypeId) => {
    if (!filingEntityTypeId || filingEntityTypes.length === 0) {
      return "Not Set";
    }
    const entityType = filingEntityTypes.find(
      (type) => type.id === filingEntityTypeId
    );
    return entityType ? entityType.name : "Not Set";
  };

  if (loading) {
    return (
      <div
        className="modal fade show"
        style={{
          display: "block",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1055,
        }}
        tabIndex="-1"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-body p-5 text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <div className="mt-3 text-muted">Loading user details...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userData && !loading) {
    return (
      <div
        className="modal fade show"
        style={{
          display: "block",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1055,
        }}
        tabIndex="-1"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">User Details</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body text-center py-5">
              <i className="fa-solid fa-exclamation-triangle text-warning mb-3" style={{ fontSize: "2rem" }}></i>
              <p className="text-muted">Failed to load user details. Please try again.</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="dashboard-btn-refresh"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="modal fade show"
      style={{
        display: "block",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 1055,
      }}
      tabIndex="-1"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">User Details</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <div className="row g-3">
              {/* Row 1: First Name and Last Name */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-semibold text-muted small">First Name</label>
                  <div className="form-control-plaintext">{userData.firstName || "N/A"}</div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-semibold text-muted small">Last Name</label>
                  <div className="form-control-plaintext">{userData.lastName || "N/A"}</div>
                </div>
              </div>

              {/* Row 2: Email and Filing Entity Type */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-semibold text-muted small">Email</label>
                  <div className="form-control-plaintext">{userData.email || "N/A"}</div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-semibold text-muted small">Filing Entity Type</label>
                  <div className="form-control-plaintext">
                    {getFilingEntityTypeName(userData.filingEntityTypeId)}
                  </div>
                </div>
              </div>

              {/* Row 3: Status */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-semibold text-muted small">Status</label>
                  <div>
                    {userData.isActive ? (
                      <span className="badge bg-success">Active</span>
                    ) : (
                      <span className="badge bg-secondary">Inactive</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="dashboard-btn-refresh"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;

