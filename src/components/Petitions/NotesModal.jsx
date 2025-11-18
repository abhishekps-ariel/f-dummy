import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { formatDateTime } from "../../utils/dateUtils";
import { useAuth } from "../../context/AuthContext";

const NotesModal = ({ isOpen, onClose, petition, formData, setFormData, onSave }) => {
  const { user } = useAuth();
  const [newNote, setNewNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Get notes from formData, sorted by most recent first
  const notes = (formData?.notes || []).sort((a, b) => {
    const dateA = new Date(a.createdAt || a.createdDate || 0);
    const dateB = new Date(b.createdAt || b.createdDate || 0);
    return dateB - dateA; // Most recent first
  });

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error("Please enter a note.");
      return;
    }

    setIsSaving(true);
    try {
      // Create the new note object
      const newNoteData = {
        id: null, // Will be set by backend
        noteText: newNote.trim(),
        petitionId: petition?.id || null,
      };

      // Only send notes that don't have IDs (new notes) to avoid duplicates
      // Filter out existing notes that already have IDs
      const existingNotesWithIds = (formData.notes || []).filter(note => note.id);
      const newNotesWithoutIds = (formData.notes || []).filter(note => !note.id);
      
      // Combine existing new notes (without IDs) with the new note we're adding
      const updatedFormData = {
        ...formData,
        notes: [...newNotesWithoutIds, newNoteData],
        // Preserve judgment if it exists
        judgment: formData.judgment || null,
      };

      // Save to backend - only new notes (without IDs) will be sent
      await onSave(updatedFormData);

      // Clear the input
      setNewNote("");
      toast.success("Note added successfully.");
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1100 }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content" style={{ height: "600px", display: "flex", flexDirection: "column" }}>
          <div className="modal-header" style={{ flexShrink: 0 }}>
            <h5 className="modal-title">Notes</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "1rem" }}>
            {/* Add Note Form */}
            <div className="mb-3 p-3 border rounded bg-light" style={{ flexShrink: 0 }}>
              <div className="mb-2">
                <label htmlFor="newNote" className="form-label fw-semibold">
                  Add New Note
                </label>
                <textarea
                  id="newNote"
                  className="form-control"
                  rows="3"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Enter your note here..."
                  disabled={isSaving}
                />
              </div>
              <button
                type="button"
                className="dashboard-btn-create"
                onClick={handleAddNote}
                disabled={!newNote.trim() || isSaving}
                style={{ minWidth: '120px' }}
              >
                {isSaving ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Adding...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus me-1"></i>
                    Add Note
                  </>
                )}
              </button>
            </div>

            {/* Notes List */}
            {notes.length === 0 ? (
              <div className="text-muted text-center py-4" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div>
                  <i className="fas fa-sticky-note me-2"></i>
                  No notes yet. Add your first note above.
                </div>
              </div>
            ) : (
              <div className="notes-list custom-scrollbar" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                {notes.map((note, index) => (
                  <div key={note.id || index} className="note-item mb-3 p-3 border rounded bg-white">
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
          <div className="modal-footer" style={{ flexShrink: 0 }}>
            <button
              type="button"
              className="dashboard-btn-refresh"
              onClick={onClose}
              disabled={isSaving}
              style={{ minWidth: '80px' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesModal;

