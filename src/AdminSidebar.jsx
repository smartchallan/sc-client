import React from "react";
import "./AdminDashboard.css";

function AdminSidebar({ role, onMenuClick, activeMenu }) {
  // Example: show different menu for admin vs user
  const menu = role === "admin"
    ? [
        { icon: "ri-home-4-line", label: "Home" },
        { icon: "ri-user-3-line", label: "Profile" },
        { icon: "ri-car-line", label: "Register Vehicle" },
        { icon: "ri-file-list-3-line", label: "Challans" },
        { icon: "ri-history-line", label: "History" },
        { icon: "ri-settings-3-line", label: "Settings" },
        { icon: "ri-logout-box-r-line", label: "Logout", logout: true },
      ]
    : [
        { icon: "ri-home-4-line", label: "Home" },
        { icon: "ri-user-3-line", label: "Profile" },
        { icon: "ri-car-line", label: "My Vehicles" },
        { icon: "ri-file-list-3-line", label: "My Challans" },
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
        <div className="logo">CS</div>
        <div className="logo-text">SmartChallan</div>
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
        <span className="user-avatar">JS</span>
        <span className="user-name">John Smith</span>
        {/* <span className="user-role">{role === "admin" ? "Premium Admin" : "Premium User"}</span> */}
      </div>
    </aside>
  );
}

export default AdminSidebar;
