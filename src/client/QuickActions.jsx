import React from 'react';

export default function QuickActions({ title = 'Quick Actions', sticky = false, onAddVehicle, onPay, onReports, onContact }) {
  const wrapperClass = sticky ? 'main-quick-actions-wrapper quick-actions-sticky' : 'main-quick-actions-wrapper';
  return (
    <div className={wrapperClass}>
      <nav className="quick-actions-bar" role="navigation" aria-label={title}>
        <div className="quick-actions-heading" aria-hidden={false}>
          {/* inline bolt/flash SVG to avoid relying on icon font */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
            <path d="M13 2L3 14h7l-1 8L21 10h-7l-1-8z" fill="#1a3a8f" />
          </svg>
          <span>{title}</span>
        </div>
        <div className="quick-actions-list" aria-hidden={false}>
          <button className="action-btn" onClick={onAddVehicle} title="Add New Vehicle"><i className="ri-add-circle-line"></i> Add New Vehicle</button>
          <button className="action-btn" onClick={onPay} title="Pay Challans"><i className="ri-wallet-3-line"></i> Pay Challans</button>
          <button className="action-btn" onClick={onReports} title="Generate Reports"><i className="ri-bar-chart-2-line"></i> Generate Reports</button>
          <button className="action-btn" onClick={onContact} title="Contact Support"><i className="ri-customer-service-2-line"></i> Contact Support</button>
        </div>
      </nav>
    </div>
  );
}
