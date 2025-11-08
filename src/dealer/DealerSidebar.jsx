import React, { useState } from "react";
import "../shared/CommonDashboard.css";
import scLogo from "../assets/sc-logo.png";
import CustomModal from "../client/CustomModal";

function DealerSidebar({ role = "dealer", onMenuClick, activeMenu, sidebarOpen, onToggleSidebar }) {
	const [logoutOpen, setLogoutOpen] = useState(false);
	// Get logged in user from localStorage
	let userName = "John Smith";
	let initials = "JS";
	try {
		const userObj = JSON.parse(localStorage.getItem("sc_user"));
		if (userObj && userObj.user && userObj.user.name) {
			userName = userObj.user.name;
			initials = userName.split(' ').map(w => w[0]).join('').toUpperCase();
		}
	} catch {}

	// Dealer menu (no Register Dealer)
	const menu = [
		{ icon: "ri-home-4-line", label: "Home" },
		{ icon: "ri-user-3-line", label: "Profile" },
		{ icon: "ri-user-add-line", label: "Register Client" },
		{ icon: "ri-car-line", label: "Register Vehicle" },
		{ icon: "ri-settings-3-line", label: "Settings" },
		{ icon: "ri-logout-box-r-line", label: "Logout", logout: true },
	];

		const handleLogout = () => setLogoutOpen(true);

		const confirmLogout = () => {
			localStorage.clear();
			sessionStorage.clear();
			setLogoutOpen(false);
				window.location.replace("/");
		};

		const cancelLogout = () => setLogoutOpen(false);

	return (
		<aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`} style={{minWidth: '270px'}}>
			<div className="logo-container">
				<div className="logo">
					<img src={scLogo} alt="Smart Challan" className="logo-img" />
				</div>
				<button className="sidebar-collapse-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar">
					<i className="ri-menu-3-line" />
				</button>
			</div>
			<div className="nav-menu">
				{menu.map((item, idx) => {
				  if (item.logout) {
				    return (
				      <div className="nav-item" key={item.label} onClick={handleLogout} style={{color: '#ff5252', cursor: 'pointer'}}>
				        <i className={item.icon} style={{ color: '#ff5252' }}></i>
				        <span>{item.label}</span>
				      </div>
				    );
				  } else {
				    return (
				      <div
				        className={`nav-item${activeMenu === item.label ? " active" : ""}`}
				        key={item.label}
				        onClick={() => onMenuClick && onMenuClick(item.label)}
				        style={{cursor: 'pointer'}}>
				        <i className={item.icon} style={{ color: '#222' }}></i>
				        <span>{item.label}</span>
				      </div>
				    );
				  }
				})}
			</div>
					<div className="sidebar-user">
				<span className="user-avatar">{initials}</span>
				<span className="user-name">{userName}</span>
				<span className="user-role">{role}</span>
			</div>
							<CustomModal open={logoutOpen} title="Confirm logout" description="Signing out will end your session and return you to the login screen." icon="ri-logout-box-r-line" onConfirm={confirmLogout} onCancel={cancelLogout} confirmText="Logout" cancelText="Stay">
							</CustomModal>
		</aside>
	);
}

export default DealerSidebar;
