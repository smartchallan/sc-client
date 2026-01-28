
import React, { useState } from "react";
import { getInitials } from "../utils/getInitials";
import "../shared/CommonDashboard.css";
import "./DealerDashboardOverrides.css";
import CustomModal from "../client/CustomModal";

export default function DealerProfile() {
	const [supportModal, setSupportModal] = useState(false);
	// Get user info from localStorage
	const scUser = (() => {
		try {
			return JSON.parse(localStorage.getItem("sc_user")) || {};
		} catch {
			return {};
		}
	})();
	const user = scUser.user || {};
	const userMeta = scUser.userMeta || {};
	const userName = user.name || "John Smith";
	const userEmail = user.email || "johnsmith@example.com";
	const userPhone = (userMeta.phone && userMeta.phone.trim()) ? userMeta.phone : (user.phone || "+91 98760");
	const companyName = userMeta.company_name ? userMeta.company_name : "Not available";
	const gtin = userMeta.gtin ? userMeta.gtin : "Not available";
	const address = userMeta.address || "";
	let userJoined = "June 15, 2023";
	if (user.created_at) {
		const date = new Date(user.created_at);
		if (!isNaN(date)) {
			userJoined = date.toLocaleString('en-US', {
				month: 'short', day: '2-digit', year: 'numeric'
			});
		}
	}
	// Generate initials from username
	const initials = userName.split(' ').map(w => w[0]).join('').toUpperCase();

		return (
			<div className="profile-content1" style={{padding:0, background:'#f5f8fa', minHeight:'100vh'}}>
				<div className="modern-form-card" style={{padding:'32px 32px 24px 32px', borderRadius:18}}>
					<div className="profile-header-profile" style={{marginBottom:32}}>
						<div className="profile-picture">{initials}</div>
						<div>
							<h2 style={{fontWeight:800, fontSize:28, marginBottom:8}}>{userName}</h2>
							<p style={{color:'#555', fontSize:16, marginBottom:2}}>{userEmail}</p>
							<p style={{color:'#888', fontSize:15}}>Member since: {userJoined}</p>
						</div>
					</div>
					<div className="profile-section" style={{marginBottom:32}}>
						<div className="card-icon personal"><i className="ri-user-settings-line"></i></div>
						<h3 className="card-title" style={{marginBottom:18}}>Personal Information</h3>
						<form className="profile-form">
							<div className="form-row">
								<div className="form-col">
									<div className="form-group">
										<label className="form-label">Full Name</label>
										<input className="form-control" type="text" value={userName} readOnly />
									</div>
								</div>
								<div className="form-col">
									<div className="form-group">
										<label className="form-label">Email Address</label>
										<input className="form-control" type="email" value={userEmail} readOnly />
									</div>
								</div>
							</div>
          
					<div className="form-row">
						<div className="form-col">
							<div className="form-group">
								<label className="form-label">Mobile Number</label>
								<input className="form-control" type="text" value={userPhone} readOnly />
							</div>
						</div>
						<div className="form-col">
							<div className="form-group">
								<label className="form-label">Address</label>
								<input className="form-control" type="text" value={address} readOnly />
							</div>
						</div>
					</div>
					<div className="form-row">
						<div className="form-col">
							<div className="form-group">
								<label className="form-label">Company Name</label>
								<input className="form-control" type="text" value={companyName} readOnly />
							</div>
						</div>
						<div className="form-col">
							<div className="form-group">
								<label className="form-label">GTIN</label>
								<input className="form-control" type="text" value={gtin} readOnly />
							</div>
						</div>
					</div>
					<div className="form-row">
						<div className="form-col">
							<div className="form-group">
								<label className="form-label">Date Joined</label>
								<input className="form-control" type="text" value={userJoined} readOnly />
							</div>
						</div>
					</div>
          
								<div style={{textAlign:"right", marginTop:'10px'}}>
									<button className="btn btn-primary" disabled>Save Changes</button>
								</div>
								</form>
							</div>
							{/* You can add more sections here as needed, using modern-form-card or similar classes for consistency */}

						</div>
					</div>
	);
}
