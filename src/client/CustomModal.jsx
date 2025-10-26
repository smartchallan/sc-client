import React from "react";
import { createPortal } from "react-dom";
import "./CustomModal.css";

export default function CustomModal({ open, title, description, icon, onConfirm, onCancel, confirmText = "Yes", cancelText = "Cancel", children }) {
  if (!open) return null;

  const modal = (
    <div className="custom-modal-overlay">
      <div className="custom-modal" role="dialog" aria-modal="true">
        {/* Top-right close button for easier closing on small screens */}
        <button className="custom-modal-close" onClick={onCancel} aria-label="Close modal">×</button>
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

  // Render modal into document.body to avoid being affected by parent stacking contexts or transforms
  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modal, document.body);
  }
  return modal;
}
