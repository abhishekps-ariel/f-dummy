import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import petitionApiService from "../../services/petitionApiService";

const NotesModal = ({ isOpen, onClose, petition, noteToEdit = null, onNoteSaved }) => {
  const { t } = useTranslation();
  const [noteText, setNoteText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isEditMode = !!noteToEdit;

  // Initialize note text when editing or modal opens
  useEffect(() => {
    if (isOpen) {
      if (noteToEdit) {
        setNoteText(noteToEdit.noteText || noteToEdit.content || "");
      } else {
        setNoteText("");
      }
    }
  }, [isOpen, noteToEdit]);

  const handleSaveNote = async () => {
    if (!noteText.trim()) {
      toast.error(t("modals.notes.validation.pleaseEnterNote"));
      return;
    }

    if (!petition?.id) {
      toast.error(t("modals.notes.validation.petitionIdRequired"));
      return;
    }

    setIsSaving(true);
    try {
      // Call the notes API directly
      await petitionApiService.submitNote(
        petition.id,
        noteToEdit?.id || null, // null for new notes, actual ID for updates
        noteText.trim()
      );

      // Clear the input
      setNoteText("");
      toast.success(isEditMode ? t("modals.notes.success.update") : t("modals.notes.success.add"));
      
      // Call the callback to refetch petition data
      if (onNoteSaved) {
        await onNoteSaved();
      }
      
      // Close the modal after successful save
      onClose();
    } catch (error) {
      console.error("Error saving note:", error);
      const errorMessage = error?.response?.data?.message || error?.message || 
        (isEditMode ? t("modals.notes.failedUpdate") : t("modals.notes.failedAdd"));
      toast.error(errorMessage);
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
            <h5 className="modal-title">{isEditMode ? t("modals.notes.editTitle") : t("modals.notes.addTitle")}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label={t("common.close")}
            ></button>
          </div>
          <div className="modal-body">
            {/* Note Form */}
            <div className="mb-3">
              <label htmlFor="noteText" className="form-label fw-semibold">
                {t("modals.notes.note")}
              </label>
              <textarea
                id="noteText"
                className="form-control"
                rows="5"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={t("modals.notes.placeholder")}
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
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="dashboard-btn-create"
              onClick={handleSaveNote}
              disabled={!noteText.trim() || isSaving}
            >
              {isSaving ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  {isEditMode ? t("modals.notes.updating") : t("modals.notes.adding")}
                </>
              ) : (
                <>
                  <i className={`fas ${isEditMode ? "fa-save" : "fa-plus"} me-1`}></i>
                  {isEditMode ? t("modals.notes.updateButton") : t("modals.notes.addButton")}
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

