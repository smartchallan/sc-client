import React from "react";
import "../admin/AdminDashboard.css";

function DealerSidebar({ role = "dealer", onMenuClick, activeMenu }) {
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
							style={{cursor: 'pointer'}}>
							<i className={item.icon}></i>
							<span>{item.label}</span>
						</div>
					)
				))}
			</div>
			<div className="sidebar-user">
				<span className="user-avatar">{initials}</span>
				<span className="user-name">{userName}</span>
				<span className="user-role">{role}</span>
			</div>
		</aside>
	);
}

export default DealerSidebar;
