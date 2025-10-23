import React from "react";
import "./CustomModal.css";

export default function CustomModal({ open, title, description, icon, onConfirm, onCancel, confirmText = "Yes", cancelText = "Cancel", children }) {
  if (!open) return null;
  return (
    <div className="custom-modal-overlay">
      <div className="custom-modal">
        {icon ? <div className="custom-modal-icon"><i className={icon}></i></div> : null}
        <div className="custom-modal-title">{title}</div>
        {description ? <div className="custom-modal-desc">{description}</div> : null}
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
