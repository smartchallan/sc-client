import React from "react";
import "./CustomModal.css";

export default function CustomModal({ open, title, onConfirm, onCancel, confirmText = "Yes", cancelText = "Cancel", children }) {
  if (!open) return null;
  return (
    <div className="custom-modal-overlay">
      <div className="custom-modal">
        <div className="custom-modal-title">{title}</div>
        {children && <div className="custom-modal-content">{children}</div>}
        <div className="custom-modal-btns">
          <button className="custom-modal-btn confirm" onClick={onConfirm}>{confirmText}</button>
          {cancelText ? (
            <button className="custom-modal-btn cancel" onClick={onCancel}>{cancelText}</button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
