import React from "react";
import { formatDateTime } from "../../../utils/dateUtils";

const NotesDisplaySection = ({ formData, onClose }) => {
  // Get notes from formData, sorted by most recent first
  const notes = (formData?.notes || []).sort((a, b) => {
    const dateA = new Date(a.createdAt || a.createdDate || 0);
    const dateB = new Date(b.createdAt || b.createdDate || 0);
    return dateB - dateA; // Most recent first
  });

  return (
    <div className="card mb-4">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Notes</h5>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={onClose}
          aria-label="Close"
          style={{ 
            minWidth: "30px",
            padding: "0.25rem 0.5rem",
            lineHeight: "1.2"
          }}
          title="Close Notes"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
      <div className="card-body">
        {notes.length === 0 ? (
          <div className="text-muted text-center py-4">
            <div>
              <i className="fas fa-sticky-note me-2"></i>
              No notes yet.
            </div>
          </div>
        ) : (
          <div className="notes-list" style={{ maxHeight: "400px", overflowY: "auto" }}>
            {notes.map((note, index) => (
              <div key={note.id || index} className="note-item mb-3 p-3 border rounded bg-light">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <i className="fas fa-sticky-note text-muted"></i>
                    <span className="text-muted small">
                      {formatDateTime(note.createdAt || note.createdDate)}
                    </span>
                  </div>
                  <div className="note-content" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {note.noteText || note.content}
                  </div>
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

