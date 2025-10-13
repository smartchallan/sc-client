import React from "react";
import { getInitials } from "../utils/getInitials";
import "./ClientDashboard.css";

function ClientDashboard({ onMenuClick, activeMenu }) {
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

  // Always show client menu for client sidebar
  const menu = [
    { icon: "ri-home-4-line", label: "Dashboard" },
    { icon: "ri-user-3-line", label: "Profile" },
    { icon: "ri-car-line", label: "Register Vehicle" },
    { icon: "ri-car-line", label: "Vehicles RTO Data" },
    { icon: "ri-file-list-3-line", label: "Vehicles Challan Data" },
    // { icon: "ri-history-line", label: "History" },
    { icon: "ri-id-card-line", label: "Driver Verification" },
    { icon: "ri-bank-card-line", label: "Vehicle Fastag" },
    { icon: "ri-money-rupee-circle-line", label: "My Billing" },
    { icon: "ri-logout-box-r-line", label: "Logout", logout: true },
  ];

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  };

  return (
    <aside className="sidebar" style={{minWidth: '270px'}}>
      <div className="logo-container">
        <div className="logo">
          <i className="ri-shield-check-line"></i>
          <span>Smart Challan</span>
        </div>
      </div>
      <div className="nav-menu">
        {menu.map((item, idx) => (
          item.logout ? (
            <div className="nav-item" key={item.label} onClick={handleLogout} style={{color: '#ff5252', cursor: 'pointer'}}>
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </div>
          ) : (
            <div
              className={`nav-item${activeMenu === item.label ? " active" : ""}`}
              key={item.label}
              onClick={() => onMenuClick && onMenuClick(item.label)}
              style={{cursor: 'pointer'}}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </div>
          )
        ))}
      </div>
      <div className="sidebar-user">
        <span className="user-avatar">{initials}</span>
        <span className="user-name">{userName}</span>
        <span className="user-role">{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</span>
      </div>
    </aside>
  );
}

export default ClientDashboard;
