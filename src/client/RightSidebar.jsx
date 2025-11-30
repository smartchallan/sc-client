import React from "react";
import "../shared/CommonDashboard.css";

export default function RightSidebar({ open, onClose, title, children }) {
  return (
    <div className={`right-sidebar${open ? " open" : ""}`}> 
      <div className="right-sidebar-header">
        <span className="right-sidebar-title">{title}</span>
        <button className="right-sidebar-close" onClick={onClose}>
          &times;
        </button>
      </div>
      <div className="right-sidebar-content">{children}</div>
    </div>
  );
}
