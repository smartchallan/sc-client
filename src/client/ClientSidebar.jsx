import React, { useState } from "react";
import scLogo from "../assets/sc-logo.png";
import { resolvePerHostEnv, getWhitelabelHosts } from "../utils/whitelabel";
import { trackLogoutActivity, trackMenuClick } from "../utils/activityTracker";

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
  const [permissionDeniedModal, setPermissionDeniedModal] = useState({ open: false, message: '' });
  
  // Permission mapping for menu items
  const PERMISSION_MAP = {
    'Register Vehicle': 'add_vehicle',
    'Add Client': 'add_clients',
    'My Clients': 'add_clients',
    'Vehicle Challans': 'fetch_challans',
    'RTO Details': 'fetch_rto_data',
    // Add more mappings as needed
  };
  
  const PERMISSION_MESSAGES = {
    'add_vehicle': 'You do not have required permission to add vehicles in your account. Please contact your dealer.',
    'add_clients': 'You do not have required permission to manage clients in your account. Please contact your dealer.',
    'fetch_challans': 'You do not have required permission to fetch challans in your account. Please contact your dealer.',
    'fetch_rto_data': 'You do not have required permission to fetch RTO data in your account. Please contact your dealer.',
  };
  
  // Get logged in user from localStorage
  let userName = "John Smith";
  let initials = "JS";
  let userRole = "client";
  let showClientPages = false;
  let hasAddClientsPermission = false;
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
      // Show client management pages when login response or user options allow it.
      // Keep legacy parent account detection in case it's still relevant.
      const parentVal = userObj.user.parent_id;
      // loose equality handles '0' (string) and numeric 0; null/undefined also match with == null
      const isParentAccount = (parentVal == null) || (parentVal == 0);
      // Use hasClients flag from login response - this determines if user is in client management mode
      const hasClientsFlag = !!(userObj.hasClients);
    // Check add_clients permission for showing Add Client menu
    const userOptions = userObj?.user_options || userObj?.user?.user_options || {};
    hasAddClientsPermission = userOptions.add_clients === "1" || userOptions.add_clients === 1;
    // Final decision to show client management UI (selectors, My Clients page, etc.)
    // Show client pages only if user actually has clients OR is a parent account
    // Having add_clients permission alone is not enough to show client management UI
    showClientPages = !!(hasClientsFlag || isParentAccount);
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
    { icon: "ri-truck-line", label: showClientPages ? "Client Vehicles" : "My Fleet" },
    {
      icon: "ri-file-list-3-line",
      label: "Challan Management",
      group: true,
      children: challanChildren,
    },
    // Conditionally include RTO Details, DL Details, and Fastag Details only when showClientPages is false
    ...(!showClientPages ? [
      { icon: "ri-car-line", label: "RTO Details" },
      { icon: "ri-id-card-line", label: "DL Details" },
      { icon: "ri-bank-card-line", label: "Fastag Details" },
    ] : []),
    { icon: "ri-car-line", label: "Register Vehicle" },
    // { icon: "ri-money-rupee-circle-line", label: "My Billing" },
    { icon: "ri-user-3-line", label: "Profile" },
    // Conditionally include Activity Tracker only when showClientPages is true
    ...(showClientPages ? [
      { icon: "ri-history-line", label: "Activity Tracker" },
    ] : []),
  ];

  // Build final menu and add client management items when appropriate
  const menu = [...baseMenu];
  const clientMenuItems = [];
  
  // Add "Add Client" if user has permission (even without clients)
  if (hasAddClientsPermission) {
    clientMenuItems.push({ icon: "ri-user-add-line", label: "Add Client" });
  }
  
  // Add "My Clients" only if user has clients or is parent account
  if (showClientPages) {
    clientMenuItems.push({ icon: "ri-group-line", label: "My Clients" });
  }
  
  // Insert client menu items at position 1 (after Dashboard)
  if (clientMenuItems.length > 0) {
    menu.splice(1, 0, ...clientMenuItems);
  }

  const handleLogout = () => {
    // open confirmation modal
    setLogoutOpen(true);
  };

  const confirmLogout = async () => {
    // Track logout activity before clearing localStorage
    try {
      const userObj = JSON.parse(localStorage.getItem("sc_user"));
      const userId = userObj?.user?.id || userObj?.user?.user_id;
      const parentId = userObj?.user?.parent_id ?? null; // Use nullish coalescing to preserve 0
      const clientName = userObj?.user?.name || null;
      if (userId) {
        await trackLogoutActivity(userId, parentId, clientName);
      }
    } catch (error) {
      console.error('Failed to track logout activity:', error);
    }
    
    localStorage.clear();
    sessionStorage.clear();
    // close modal then redirect
    setLogoutOpen(false);
    // replace history entry so back button doesn't return to the dashboard template
    window.location.replace("/");
  };

  const cancelLogout = () => setLogoutOpen(false);

  const handleMenuClick = (menuLabel) => {
    // Check if this menu item requires a permission
    const requiredPermission = PERMISSION_MAP[menuLabel];
    
    if (requiredPermission) {
      // Get user_options from localStorage
      try {
        const userObj = JSON.parse(localStorage.getItem("sc_user"));
        const userOptions = userObj?.user_options || userObj?.user?.user_options || {};
        
        // Check if permission is granted (value should be "1" or 1)
        const hasPermission = userOptions[requiredPermission] === "1" || userOptions[requiredPermission] === 1;
        
        if (!hasPermission) {
          // Show permission denied modal
          const message = PERMISSION_MESSAGES[requiredPermission] || 'You do not have required permission to access this feature. Please contact your dealer.';
          setPermissionDeniedModal({ open: true, message });
          return; // Don't proceed with navigation
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
      }
    }
    
    // Track menu click activity
    try {
      const userObj = JSON.parse(localStorage.getItem("sc_user"));
      const userId = userObj?.user?.id || userObj?.user?.user_id;
      const parentId = userObj?.user?.parent_id ?? null; // Use nullish coalescing to preserve 0
      const clientName = userObj?.user?.name || null;
      if (userId) {
        trackMenuClick(userId, parentId, clientName, menuLabel).catch(err => {
          console.error('Failed to track menu click:', err);
        });
      }
    } catch (error) {
      console.error('Error tracking menu click:', error);
    }
    
    // Call the original onMenuClick callback
    if (onMenuClick) {
      onMenuClick(menuLabel);
    }
  };

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
                  <i className={item.icon} style={{ color: import.meta.env.VITE_MENU_ICON_COLOR }}></i>
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
                        onClick={() => handleMenuClick(child.label)}
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
                onClick={() => handleMenuClick(item.label)}
                style={{cursor: 'pointer'}}
              >
                <i className={item.icon} style={{ color: import.meta.env.VITE_MENU_ICON_COLOR }}></i>
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
      
      <CustomModal 
        open={permissionDeniedModal.open} 
        title="Permission Denied" 
        description={permissionDeniedModal.message} 
        icon="ri-error-warning-line" 
        onConfirm={() => setPermissionDeniedModal({ open: false, message: '' })} 
        confirmText="OK" 
        onCancel={() => setPermissionDeniedModal({ open: false, message: '' })}
        cancelText=""
      />
    </aside>
  );
}

export default ClientSidebar;
