import React from "react";
import "./CustomModal.css";

export default function CustomModal({ open, title, onConfirm, onCancel, confirmText = "Yes", cancelText = "Cancel" }) {
  if (!open) return null;
  return (
    <div className="custom-modal-overlay">
      <div className="custom-modal">
        <div className="custom-modal-title">{title}</div>
        <div className="custom-modal-btns">
          <button className="custom-modal-btn confirm" onClick={onConfirm}>{confirmText}</button>
          <button className="custom-modal-btn cancel" onClick={onCancel}>{cancelText}</button>
        </div>
      </div>
    </div>
  );
}
