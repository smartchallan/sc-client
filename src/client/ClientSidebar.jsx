import React, { useState } from "react";
import scLogo from "../assets/sc-logo.png";
const IS_DEFAULT_DOMAIN = window.location.hostname === 'app.smartchallan.com';
const CUSTOM_LOGO_URL = import.meta.env.VITE_CUSTOM_LOGO_URL;
// Resolve custom logo: allow absolute URLs or root-relative paths (e.g. /tspl-logo.png).
// If env contains a module path like `src/assets/...` it won't resolve after build,
// so fall back to the bundled `scLogo` import.
const resolvedCustomLogo = (!IS_DEFAULT_DOMAIN && CUSTOM_LOGO_URL && (CUSTOM_LOGO_URL.startsWith('/') || CUSTOM_LOGO_URL.startsWith('http'))) ? CUSTOM_LOGO_URL : null;
import { getInitials } from "../utils/getInitials";
import CustomModal from "./CustomModal";
import "../shared/CommonDashboard.css";

function ClientSidebar({ onMenuClick, activeMenu, sidebarOpen, onToggleSidebar }) {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [challanMenuOpen, setChallanMenuOpen] = useState(false);
  // Get logged in user from localStorage
  let userName = "John Smith";
  let initials = "JS";
  let userRole = "client";
  try {
    const userObj = JSON.parse(localStorage.getItem("sc_user"));
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

  // Always show client menu for client sidebar
  const menu = [
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
    { icon: "ri-logout-box-r-line", label: "Logout", logout: true },
  ];

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
            const isOpen = challanMenuOpen || isChildActive;
            return (
              <div
                key={item.label}
                onMouseEnter={() => setChallanMenuOpen(true)}
                onMouseLeave={() => setChallanMenuOpen(false)}
              >
                <div
                  className={`nav-item${isChildActive ? " active" : ""}`}
                  style={{ cursor: 'pointer' }}
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
      </div>
      
      <CustomModal open={logoutOpen} title="Confirm logout" description="You will be signed out of Smart Challan and returned to the login page." icon="ri-logout-box-r-line" onConfirm={confirmLogout} onCancel={cancelLogout} confirmText="Logout" cancelText="Stay">
      </CustomModal>
    </aside>
  );
}

export default ClientSidebar;
