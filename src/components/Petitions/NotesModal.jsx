import React, { useState } from "react";
import { toast } from "react-toastify";

const NotesModal = ({ isOpen, onClose, petition, formData, setFormData, onSave }) => {
  const [newNote, setNewNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add Note</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            {/* Add Note Form */}
            <div className="mb-3">
              <label htmlFor="newNote" className="form-label fw-semibold">
                Note
              </label>
              <textarea
                id="newNote"
                className="form-control"
                rows="5"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter your note here..."
                disabled={isSaving}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="dashboard-btn-refresh"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="dashboard-btn-create"
              onClick={handleAddNote}
              disabled={!newNote.trim() || isSaving}
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
        </div>
      </div>
    </div>
  );
};

export default NotesModal;

