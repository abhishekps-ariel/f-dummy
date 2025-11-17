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
      const note = {
        id: null, // Will be set by backend
        noteText: newNote.trim(),
        petitionId: petition?.id || null,
      };

      const updatedFormData = {
        ...formData,
        notes: [...(formData.notes || []), note],
        // Preserve judgment if it exists
        judgment: formData.judgment || null,
      };

      // Save to backend
      await onSave(updatedFormData);

      setNewNote("");
      toast.success("Note added successfully.");
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) {
      return;
    }

    setIsSaving(true);
    try {
      const updatedFormData = {
        ...formData,
        notes: (formData.notes || []).filter((note) => note.id !== noteId),
        // Preserve judgment if it exists
        judgment: formData.judgment || null,
      };

      // Save to backend
      await onSave(updatedFormData);

      toast.success("Note deleted successfully.");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note. Please try again.");
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
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Notes</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            {/* Add Note Form */}
            <div className="mb-4 p-3 border rounded bg-light">
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
                className="btn btn-primary btn-sm"
                onClick={handleAddNote}
                disabled={!newNote.trim() || isSaving}
              >
                {isSaving ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-1"
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
              <div className="text-muted text-center py-4">
                <i className="fas fa-sticky-note me-2"></i>
                No notes yet. Add your first note above.
              </div>
            ) : (
              <div className="notes-list" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {notes.map((note, index) => (
                  <div key={note.id || index} className="note-item mb-3 p-3 border rounded bg-white">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <i className="fas fa-user text-muted"></i>
                          <strong className="small text-primary">
                            {user?.fullName || user?.name || "You"}
                          </strong>
                          <span className="text-muted small">
                            {formatDateTime(note.createdAt || note.createdDate)}
                          </span>
                        </div>
                        <div className="note-content" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                          {note.noteText || note.content}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-danger p-0 ms-2"
                        onClick={() => handleDeleteNote(note.id)}
                        title="Delete note"
                        disabled={isSaving}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSaving}
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

