import React, { useState } from "react";
import scLogo from "../assets/sc-logo.png";
import { resolvePerHostEnv, getWhitelabelHosts } from "../utils/whitelabel";

const WHITELABEL_HOSTS = getWhitelabelHosts();
const CURRENT_HOSTNAME = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '';
const DEFAULT_HOST = 'app.smartchallan.com';
const IS_DEFAULT_DOMAIN = CURRENT_HOSTNAME === DEFAULT_HOST;
const IS_WHITELABEL = WHITELABEL_HOSTS.includes(CURRENT_HOSTNAME) && !IS_DEFAULT_DOMAIN;

// Resolve per-host logo (supports VITE_<HOST>_LOGO_URL, VITE_<DOMAIN>_LOGO_URL, VITE_<SECOND>_LOGO_URL, or VITE_CUSTOM_LOGO_URL)
const CUSTOM_LOGO_URL = resolvePerHostEnv(CURRENT_HOSTNAME, 'LOGO_URL') || import.meta.env.VITE_CUSTOM_LOGO_URL;
const resolvedCustomLogo = (IS_WHITELABEL && CUSTOM_LOGO_URL && (CUSTOM_LOGO_URL.startsWith('/') || CUSTOM_LOGO_URL.startsWith('http'))) ? CUSTOM_LOGO_URL : null;
import { getInitials } from "../utils/getInitials";
import CustomModal from "./CustomModal";
import "../shared/CommonDashboard.css";

function ClientSidebar({ onMenuClick, activeMenu, sidebarOpen, onToggleSidebar }) {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({});
  // Get logged in user from localStorage
  let userName = "John Smith";
  let initials = "JS";
  let userRole = "client";
  let showClientPages = false;
  let userObj = null;
  try {
    userObj = JSON.parse(localStorage.getItem("sc_user"));
    if (userObj && userObj.user) {
      if (userObj.user.name) {
        userName = userObj.user.name;
        // Get only first two letters from first two words, or first two letters of name
        const nameParts = userName.trim().split(/\s+/);
        if (nameParts.length >= 2) {
          initials = (nameParts[0][0] + nameParts[1][0]).toUpperCase();
        } else {
          initials = userName.substring(0,2).toUpperCase();
        }
      }
      if (userObj.user.role) {
        userRole = userObj.user.role;
      }
      // Show client management pages only for parent accounts (parent_id === 0 OR null/absent)
      const parentVal = userObj.user.parent_id;
      // loose equality handles '0' (string) and numeric 0; null/undefined also match with == null
      showClientPages = (parentVal == null) || (parentVal == 0);
    }
  } catch {}

  const challanSettlementLive = import.meta.env.VITE_CHALLAN_SETTLEMENT_LIVE === "true";

  const challanChildren = [
    { icon: "ri-file-list-3-line", label: "Vehicle Challans" },
    { icon: "ri-wallet-3-line", label: "Pay Challans" },
  ];

  if (challanSettlementLive) {
    challanChildren.push({ icon: "ri-list-check-2", label: "Challan Requests" });
  }

  // Base menu; we'll insert Client Management below Dashboard when appropriate
  const baseMenu = [
    { icon: "ri-home-4-line", label: "Dashboard" },
    { icon: "ri-truck-line", label: "My Fleet" },
    {
      icon: "ri-file-list-3-line",
      label: "Challan Management",
      group: true,
      children: challanChildren,
    },
    { icon: "ri-car-line", label: "RTO Details" },
    { icon: "ri-id-card-line", label: "DL Details" },
    { icon: "ri-bank-card-line", label: "Fastag Details" },
    { icon: "ri-car-line", label: "Register Vehicle" },
    { icon: "ri-money-rupee-circle-line", label: "My Billing" },
    { icon: "ri-user-3-line", label: "Profile" },
  ];

  // Build final menu and insert Client Management after Dashboard (index 0)
  const menu = [...baseMenu];
  if (showClientPages) {
    const clientChildren = [
      { icon: "ri-user-add-line", label: "Add Client" },
      { icon: "ri-group-line", label: "My Clients" },
      { icon: "ri-settings-3-line", label: "Client Settings" },
    ];
    const clientManagement = { icon: "ri-briefcase-line", label: "Client Management", group: true, children: clientChildren };
    // insert at position 1 (after Dashboard)
    menu.splice(1, 0, clientManagement);
  }

  const handleLogout = () => {
    // open confirmation modal
    setLogoutOpen(true);
  };

  const confirmLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    // close modal then redirect
    setLogoutOpen(false);
    // replace history entry so back button doesn't return to the dashboard template
    window.location.replace("/");
  };

  const cancelLogout = () => setLogoutOpen(false);

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`} style={{minWidth: '270px', left: 0}}>
      <div className="logo-container">
        <div className="logo">
          <img src={resolvedCustomLogo || scLogo} alt="Smart Challan" className="logo-img" />
          {/* <span className="logo-text">Smart Challan</span> */}
        </div>
        <button className="sidebar-collapse-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar" style={{marginLeft: 'auto', background:'transparent', border:'none', color:'#0f5a7a', cursor:'pointer'}}>
          <i className="ri-menu-3-line" />
        </button>
      </div>
      

      <div className="nav-menu">
        {menu.map((item) => {
          // All icons dark green except logout
          if (item.logout) {
            return (
              <div className="nav-item" key={item.label} onClick={handleLogout} style={{color: '#ff5252', cursor: 'pointer'}}>
                <i className={item.icon} style={{ color: '#ff5252' }}></i>
                <span>{item.label}</span>
              </div>
            );
          } else if (item.group && item.children) {
            const isChildActive = item.children.some((child) => activeMenu === child.label);
            const isOpen = openGroups[item.label] || isChildActive;
            return (
              <div key={item.label}>
                <div
                  className={`nav-item${isChildActive ? " active" : ""}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setOpenGroups(prev => ({ ...prev, [item.label]: !prev[item.label] }))}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpenGroups(prev => ({ ...prev, [item.label]: !prev[item.label] })); }}
                >
                  <i className={item.icon} style={{ color: '#006400' }}></i>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <i
                    className={isOpen ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}
                    style={{ marginLeft: 8, fontSize: 18 }}
                  />
                </div>
                {isOpen && (
                  <div className="nav-submenu">
                    {item.children.map((child) => (
                      <div
                        key={child.label}
                        className={`nav-subitem${activeMenu === child.label ? " active" : ""}`}
                        onClick={() => onMenuClick && onMenuClick(child.label)}
                      >
                        <i className={child.icon}></i>
                        <span>{child.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          } else {
            return (
              <div
                className={`nav-item${activeMenu === item.label ? " active" : ""}`}
                key={item.label}
                onClick={() => onMenuClick && onMenuClick(item.label)}
                style={{cursor: 'pointer'}}
              >
                <i className={item.icon} style={{ color: '#006400' }}></i>
                <span>{item.label}</span>
              </div>
            );
          }
        })}

        {/* Client management is now a submenu inserted into the main menu when applicable */}

        {/* Logout stays last */}
        <div className="nav-item" onClick={handleLogout} style={{color: '#ff5252', cursor: 'pointer'}}>
          <i className="ri-logout-box-r-line" style={{ color: '#ff5252' }}></i>
          <span>Logout</span>
        </div>
      </div>
      
      <CustomModal open={logoutOpen} title="Confirm logout" description="You will be signed out of Smart Challan and returned to the login page." icon="ri-logout-box-r-line" onConfirm={confirmLogout} onCancel={cancelLogout} confirmText="Logout" cancelText="Stay">
      </CustomModal>
    </aside>
  );
}

export default ClientSidebar;
