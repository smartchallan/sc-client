import React from "react";
import "../shared/CommonDashboard.css";

export default function AdminQuickActions({ title = 'Quick Actions', sticky = false, onAddDealer, onAddClient, onAddVehicle, onReports, onContact }) {
  const wrapperClass = sticky ? 'main-quick-actions-wrapper quick-actions-sticky' : 'main-quick-actions-wrapper';
  return (
    <div className={wrapperClass}>
      <nav className="quick-actions-bar" role="navigation" aria-label={title}>
        <div className="quick-actions-heading" aria-hidden={false}>{title}</div>
        <div className="quick-actions-list" aria-hidden={false}>
          <button className="action-btn" onClick={onAddDealer}>
            <i className="ri-user-add-line"></i> Add Dealer
          </button>
          <button className="action-btn" onClick={onAddClient}>
            <i className="ri-user-add-line"></i> Add Client
          </button>
          <button className="action-btn" onClick={onAddVehicle}>
            <i className="ri-car-line"></i> Add Vehicle
          </button>
          <button className="action-btn" onClick={onReports}>
            <i className="ri-file-chart-line"></i> Reports
          </button>
          <button className="action-btn" onClick={onContact}>
            <i className="ri-customer-service-2-line"></i> Support
          </button>
        </div>
      </nav>
    </div>
  );
}
