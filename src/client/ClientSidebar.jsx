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
    { icon: "ri-file-warning-line", label: "Vehicle Challans" },
    { icon: "ri-wallet-3-line", label: "Pay Challans" },
  ];

  if (challanSettlementLive) {
    challanChildren.push({ icon: "ri-list-check-2", label: "Challan Requests" });
  }

  // Base menu; we'll insert Client Management below Dashboard when appropriate
  const baseMenu = [
    { icon: "ri-dashboard-3-line", label: "Dashboard" },
    { icon: "ri-truck-line", label: showClientPages ? "Client Vehicles" : "My Fleet" },
    {
      icon: "ri-folder-warning-line",
      label: "Challan Management",
      group: true,
      children: challanChildren,
    },
    // Conditionally include RTO Details, DL Details, and Fastag Details only when showClientPages is false
    ...(!showClientPages ? [
      { icon: "ri-shield-check-line", label: "RTO Details" },
      { icon: "ri-id-card-line", label: "DL Details" },
      { icon: "ri-bank-card-2-line", label: "Fastag Details" },
    ] : []),
    { icon: "ri-add-circle-line", label: "Register Vehicle" },
    // { icon: "ri-money-rupee-circle-line", label: "My Billing" },
    { icon: "ri-user-settings-line", label: "Profile" },
    // Conditionally include Activity Tracker only when showClientPages is true
    ...(showClientPages ? [
      { icon: "ri-time-line", label: "Activity Tracker" },
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
    clientMenuItems.push({ icon: "ri-team-line", label: "My Clients" });
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
    <aside className={`fixed top-0 left-0 h-screen border-r border-blue-700 transition-all duration-300 ease-in-out z-40 flex flex-col ${sidebarOpen ? 'w-[280px]' : 'w-[72px]'}`} style={{
      background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)',
      overflow: 'hidden'
    }}>
      {/* Decorative gradient circle - top right */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-20%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }}></div>

      {/* Decorative outline circle - left side */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '-80px',
        width: '200px',
        height: '200px',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 0
      }}></div>

      {/* Decorative outline circle - bottom right */}
      <div style={{
        position: 'absolute',
        bottom: '-60px',
        right: '-60px',
        width: '250px',
        height: '250px',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 0
      }}></div>

      {/* Vertical accent line */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '100px',
        bottom: '100px',
        width: '1px',
        background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(59,130,246,0.3) 50%, rgba(255,255,255,0) 100%)',
        pointerEvents: 'none',
        zIndex: 0
      }}></div>
      
      {/* Shimmer line at bottom */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, #3b82f6, #60a5fa, #0ea5e9, #3b82f6)',
        backgroundSize: '300% 100%',
        animation: 'shimmer 4s ease infinite',
        zIndex: 1
      }}></div>
      
      <style>{`
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      
      {/* Logo & Toggle Button */}
      <div className="h-[72px] flex items-center justify-between px-4 border-b border-blue-600 relative" style={{ 
        backgroundColor: 'rgba(30, 58, 138, 0.3)',
        backdropFilter: 'blur(10px)',
        zIndex: 10 
      }}>
        <div className={`flex items-center gap-3 transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
          <img 
            src={resolvedCustomLogo || scLogo} 
            alt="Smart Challan" 
            className="h-11 w-auto object-contain"
          />
        </div>
        <button 
          className={`p-2.5 rounded-lg hover:bg-blue-600 transition-all duration-200 text-white hover:text-white ${!sidebarOpen && 'mx-auto'}`}
          onClick={onToggleSidebar} 
          aria-label="Toggle sidebar"
        >
          <i className={`${sidebarOpen ? 'ri-menu-fold-line' : 'ri-menu-unfold-line'} text-xl`} />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-transparent" style={{ position: 'relative', zIndex: 10 }}>
        {menu.map((item) => {
          if (item.logout) {
            return (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3.5 text-red-300 hover:bg-red-600/30 hover:text-red-100 transition-all duration-200 rounded-lg mb-1 ${!sidebarOpen && 'justify-center'}`}
                onClick={handleLogout}
                title={!sidebarOpen ? item.label : ''}
              >
                <i className={`${item.icon} text-[21px]`}></i>
                {sidebarOpen && <span className="font-medium text-[14px]">{item.label}</span>}
              </button>
            );
          } else if (item.group && item.children) {
            const isChildActive = item.children.some((child) => activeMenu === child.label);
            const isOpen = openGroups[item.label] || isChildActive;
            return (
              <div key={item.label} className="mb-1">
                <button
                  className={`w-full flex items-center gap-3.5 px-3.5 py-3.5 transition-all duration-200 rounded-lg ${
                    isChildActive 
                      ? 'bg-blue-600 text-white font-medium border-l-2 border-white shadow-sm' 
                      : 'text-white hover:bg-blue-600 hover:text-white'
                  } ${!sidebarOpen && 'justify-center'}`}
                  onClick={() => setOpenGroups(prev => ({ ...prev, [item.label]: !prev[item.label] }))}
                  title={!sidebarOpen ? item.label : ''}
                >
                  <i className={`${item.icon} text-[21px]`}></i>
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 font-medium text-[14px] text-left">{item.label}</span>
                      <i className={`${isOpen ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} text-[19px]`} />
                    </>
                  )}
                </button>
                {isOpen && sidebarOpen && (
                  <div className="mt-1 mb-2 bg-blue-600/20 rounded-lg border border-blue-400 overflow-hidden">
                    {item.children.map((child) => (
                      <button
                        key={child.label}
                        className={`w-full flex items-center gap-3.5 pl-14 pr-3.5 py-3 text-[13px] transition-all duration-200 ${
                          activeMenu === child.label 
                            ? 'bg-blue-600 text-white font-semibold' 
                            : 'text-white/80 hover:bg-blue-600 hover:text-white'
                        }`}
                        onClick={() => handleMenuClick(child.label)}
                      >
                        <i className={`${child.icon} text-[19px]`}></i>
                        <span className="font-medium">{child.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          } else {
            return (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3.5 transition-all duration-200 rounded-lg mb-1 ${
                  activeMenu === item.label 
                    ? 'bg-blue-600 text-white font-medium border-l-2 border-white shadow-sm' 
                    : 'text-white hover:bg-blue-600 hover:text-white font-medium'
                } ${!sidebarOpen && 'justify-center'}`}
                onClick={() => handleMenuClick(item.label)}
                title={!sidebarOpen ? item.label : ''}
              >
                <i className={`${item.icon} text-[21px]`}></i>
                {sidebarOpen && <span className="font-medium text-[14px]">{item.label}</span>}
              </button>
            );
          }
        })}

        {/* Logout Button */}
        <button
          className={`w-full flex items-center gap-3.5 px-3.5 py-3.5 text-red-300 hover:bg-red-600/30 hover:text-red-100 transition-all duration-200 mt-4 rounded-lg border border-red-600/50 ${!sidebarOpen && 'justify-center'}`}
          onClick={handleLogout}
          title={!sidebarOpen ? 'Logout' : ''}
        >
          <i className="ri-logout-box-r-line text-[21px]"></i>
          {sidebarOpen && <span className="font-medium text-[14px]">Logout</span>}
        </button>
      </nav>
      
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
