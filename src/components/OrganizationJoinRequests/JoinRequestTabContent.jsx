import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { reviewJoinRequest } from "../../services/organizationService";
import { getFilingEntityTypes, getJoinRequestStatusEnum } from "../../services/commonService";
import { useJoinRequestTabs } from "../../context/JoinRequestTabContext";
import "../../components/Petitions/PetitionForm.css";

const JoinRequestTabContent = ({ request, userDetails, organizationId, onRefresh }) => {
  const [filingEntityTypes, setFilingEntityTypes] = useState([]);
  const [statusEnum, setStatusEnum] = useState([]);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(""); // "approve" or "deny"
  const [adminComment, setAdminComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { refreshTab, getActiveTab } = useJoinRequestTabs();

  useEffect(() => {
    loadFilingEntityTypes();
    loadStatusEnum();
  }, []);

  const loadFilingEntityTypes = async () => {
    try {
      const response = await getFilingEntityTypes();
      if (response.isSuccess && response.data) {
        setFilingEntityTypes(response.data || []);
      }
    } catch (error) {
      console.error("Error loading filing entity types:", error);
    }
  };

  const loadStatusEnum = async () => {
    try {
      const response = await getJoinRequestStatusEnum();
      if (response.isSuccess && response.data) {
        setStatusEnum(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error("Error loading status enum:", error);
    }
  };

  const getFilingEntityTypeName = (filingEntityTypeId) => {
    if (!filingEntityTypeId || filingEntityTypes.length === 0) {
      return "Not Set";
    }
    const entityType = filingEntityTypes.find(
      (type) => type.id === filingEntityTypeId
    );
    return entityType ? entityType.name : "Not Set";
  };

  const getStatusInfo = (status) => {
    const statusItem = statusEnum.find(item => item.value === status);
    if (statusItem) {
      let badgeClass = "status-badge";
      if (status === 1) badgeClass += " status-approved";
      else if (status === 2) badgeClass += " status-denied status-rejected";
      else badgeClass += " status-pending";
      
      return {
        text: statusItem.name || statusItem.label || "Pending",
        class: badgeClass,
      };
    }
    if (status === 1) return { text: "Approved", class: "status-badge status-approved" };
    if (status === 2) return { text: "Denied", class: "status-badge status-denied status-rejected" };
    return { text: "Pending", class: "status-badge status-pending" };
  };

  const handleAction = (type) => {
    setActionType(type);
    setAdminComment("");
    setShowActionModal(true);
  };

  const handleSubmitAction = async () => {
    if (!request) return;

    const status = actionType === "approve" ? 1 : 2; // 1 = Approved, 2 = Denied

    setIsSubmitting(true);
    try {
      const response = await reviewJoinRequest(
        request.id,
        status,
        adminComment
      );

      if (response.isSuccess) {
        toast.success(response.msg || `Request ${actionType}d successfully`);
        setShowActionModal(false);
        setAdminComment("");
        
        // Refresh the tab data
        const activeTab = getActiveTab();
        if (activeTab) {
          await refreshTab(activeTab.id);
        }
        
        // Refresh the list
        if (onRefresh) {
          onRefresh();
        }
      } else {
        toast.error(response.msg || `Failed to ${actionType} request`);
      }
    } catch (error) {
      console.error(`Error ${actionType}ing request:`, error);
      toast.error(`Failed to ${actionType} request`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusInfo = getStatusInfo(request?.status || 0);

  return (
    <div className="shadow-custom bg-white org-search-box">
      {/* Header */}
      <div className="petitions-header-section mb-4">
        <div className="d-flex align-items-center justify-content-between">
          <h2 className="font-med mb-0" style={{
            display: "inline-block",
            padding: "8px 16px",
            backgroundColor: "rgba(2, 101, 163, 0.1)",
            border: "1px solid rgba(2, 101, 163, 0.3)",
            borderRadius: "8px",
            color: "var(--theme-color, #0265a3)"
          }}>
            Join Request Details
          </h2>
          <div className="d-flex gap-2">
            {request?.status !== 1 && (
              <button
                className="dashboard-btn-refresh text-success"
                onClick={() => handleAction("approve")}
              >
                Approve
              </button>
            )}
            {request?.status !== 2 && (
              <button
                className="dashboard-btn-refresh text-danger"
                onClick={() => handleAction("deny")}
              >
                Deny
              </button>
            )}
          </div>
        </div>
      </div>

      {/* User Details Section */}
      <div className="mb-4">
        <h2 className="font-med mb-3">User Information</h2>
        <div className="row g-3">
          {/* Row 1: First Name and Last Name */}
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label fw-semibold text-muted small">First Name</label>
              <div className="form-control-plaintext">
                {userDetails?.firstName || "N/A"}
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label fw-semibold text-muted small">Last Name</label>
              <div className="form-control-plaintext">
                {userDetails?.lastName || "N/A"}
              </div>
            </div>
          </div>

          {/* Row 2: Email and Filing Entity Type */}
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label fw-semibold text-muted small">Email</label>
              <div className="form-control-plaintext">
                {userDetails?.email || request?.email || "N/A"}
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label fw-semibold text-muted small">Filing Entity Type</label>
              <div className="form-control-plaintext">
                {getFilingEntityTypeName(userDetails?.filingEntityTypeId)}
              </div>
            </div>
          </div>

          {/* Row 3: Status */}
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label fw-semibold text-muted small">Status</label>
              <div>
                <span className={statusInfo.class}>
                  {statusInfo.text}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Request Details Section */}
      <div className="mb-4">
        <h2 className="font-med mb-3">Request Details</h2>
        <div className="row g-3">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label fw-semibold text-muted small">Requested On</label>
              <div className="form-control-plaintext">
                {request?.requestedOn
                  ? new Date(request.requestedOn).toLocaleString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "N/A"}
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label fw-semibold text-muted small">Responded On</label>
              <div className="form-control-plaintext">
                {request?.respondedOn
                  ? new Date(request.respondedOn).toLocaleString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "N/A"}
              </div>
            </div>
          </div>
          {request?.adminComment && (
            <div className="col-12">
              <div className="mb-3">
                <label className="form-label fw-semibold text-muted small">Admin Comment</label>
                <div className="form-control-plaintext">
                  {request.adminComment}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && (
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
              setShowActionModal(false);
            }
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {actionType === "approve" ? "Approve" : "Deny"} Join Request
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowActionModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to {actionType} this join request?
                </p>
                <div className="mb-3">
                  <label htmlFor="adminComment" className="form-label">
                    Comment (Optional)
                  </label>
                  <textarea
                    className="form-control"
                    id="adminComment"
                    rows="3"
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    placeholder="Add a comment..."
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="dashboard-btn-refresh"
                  onClick={() => setShowActionModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`dashboard-btn-refresh ${actionType === "approve" ? "text-success" : "text-danger"}`}
                  onClick={handleSubmitAction}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      {actionType === "approve" ? "Approving..." : "Denying..."}
                    </>
                  ) : (
                    <>
                      {actionType === "approve" ? "Approve" : "Deny"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinRequestTabContent;

