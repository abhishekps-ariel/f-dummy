import React from "react";
import { useTranslation } from "react-i18next";
import { formatDateTime } from "../../../utils/dateUtils";

const NotesDisplaySection = ({ formData, onClose, onEditNote }) => {
  const { t } = useTranslation();
  // Get notes from formData, sorted by most recent first
  const notes = (formData?.notes || []).sort((a, b) => {
    const dateA = new Date(a.createdAt || a.createdDate || 0);
    const dateB = new Date(b.createdAt || b.createdDate || 0);
    return dateB - dateA; // Most recent first
  });

  return (
    <div className="card mb-4">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">{t("petitionTabContent.notes")}</h5>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={onClose}
          aria-label={t("common.close") || "Close"}
          style={{ 
            minWidth: "30px",
            padding: "0.25rem 0.5rem",
            lineHeight: "1.2"
          }}
          title={t("common.close") || "Close Notes"}
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        {notes.length === 0 ? (
          <div className="text-muted text-center py-4 px-3">
            <div>
              <i className="fas fa-sticky-note me-2"></i>
              No notes yet.
            </div>
          </div>
        ) : (
          <div 
            className="notes-list px-3 pb-3" 
            style={{ 
              maxHeight: "450px", 
              overflowY: "auto",
              overflowX: "hidden",
              paddingTop: "1rem"
            }}
          >
            {notes.map((note, index) => (
              <div key={note.id || index} className="note-item mb-3 p-3 border rounded bg-light">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                      {note.createdBy ? (
                        <>
                          <span className="fw-semibold" style={{ color: "#0d6efd", fontSize: "0.875rem" }}>
                            {note.createdBy}
                          </span>
                          <span className="text-muted small">•</span>
                        </>
                      ) : null}
                      <span className="text-muted small">
                        {formatDateTime(note.createdAt || note.createdDate)}
                      </span>
                    </div>
                    <div className="note-content" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {note.noteText || note.content}
                    </div>
                  </div>
                  {/* Edit note functionality commented out - only allowing adding notes for now */}
                  {/* {onEditNote && note.id && (
                    <button
                      type="button"
                      className="btn btn-link p-0 ms-2 border-0"
                      onClick={() => onEditNote(note)}
                      title="Edit Note"
                      style={{ 
                        padding: "0.125rem",
                        minWidth: "auto",
                        fontSize: "0.8rem",
                        color: "#6c757d",
                        textDecoration: "none",
                        background: "transparent",
                        lineHeight: "1"
                      }}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                  )} */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesDisplaySection;

