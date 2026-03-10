import React, { useState } from "react";

export default function QuickActionsRibbon({ onRegister, onChallans, onRTO, onClients }) {
  const [open, setOpen] = useState(false);

  const actions = [
    { label: 'Register Vehicle', action: onRegister, icon: 'ri-add-circle-line', color: '#2563eb' },
    { label: 'View Challans', action: onChallans, icon: 'ri-file-list-3-line', color: '#ef4444' },
    { label: 'RTO Details', action: onRTO, icon: 'ri-clipboard-line', color: '#10b981' },
    { label: 'My Clients', action: onClients, icon: 'ri-group-line', color: '#f59e0b' },
  ];

  return (
    <>
      {/* Overlay */}
      {open && <div className="qa-ribbon-overlay" onClick={() => setOpen(false)} />}

      <div className={`qa-ribbon ${open ? 'qa-ribbon--open' : ''}`}>
        {/* Tab / trigger */}
        <button
          className="qa-ribbon-tab"
          onClick={() => setOpen(o => !o)}
          aria-label="Quick Actions"
          title="Quick Actions"
        >
          <i className={open ? 'ri-close-line' : 'ri-flashlight-line'} />
          {!open && <span className="qa-ribbon-tab-label">Quick Actions</span>}
        </button>

        {/* Panel */}
        <div className="qa-ribbon-panel">
          <div className="qa-ribbon-header">
            <span className="qa-ribbon-title"><i className="ri-flashlight-line" /> Quick Actions</span>
          </div>
          <div className="qa-ribbon-actions">
            {actions.map(a => (
              <button
                key={a.label}
                className="qa-ribbon-action"
                onClick={() => { a.action(); setOpen(false); }}
                style={{ '--qa-accent': a.color }}
              >
                <span className="qa-ribbon-action-icon" style={{ background: a.color }}>
                  <i className={a.icon} />
                </span>
                <span className="qa-ribbon-action-label">{a.label}</span>
                <i className="ri-arrow-right-s-line qa-ribbon-action-arrow" />
              </button>
            ))}
          </div>
          <div className="qa-ribbon-tip">
            <i className="ri-lightbulb-line" />
            <span>Keep vehicle documents up-to-date to avoid penalties.</span>
          </div>
        </div>
      </div>
    </>
  );
}
