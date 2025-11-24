import React, { useState } from "react";
import { getInitials } from "../utils/getInitials";
import "./AdminProfile.css";
import CustomModal from "../client/CustomModal";

export default function AdminProfile() {
  // State for support modal
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
  // Calculate initials for avatar
  const initials = getInitials ? getInitials(userName) : (userName.split(' ').map(w => w[0]).join('').toUpperCase());
  let userJoined = "June 15, 2023";
  if (user.created_at) {
    const date = new Date(user.created_at);
    if (!isNaN(date)) {
      userJoined = date.toLocaleString('en-US', {
        month: 'short', day: '2-digit', year: 'numeric'
      });
    }
  }
  // Password reset form state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Password validation
  React.useEffect(() => {
    setPasswordError("");
    setPasswordSuccess("");
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
    } else if (oldPassword && newPassword && oldPassword === newPassword) {
      setPasswordError("New password must be different from old password.");
    }
  }, [oldPassword, newPassword, confirmPassword]);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }
    if (oldPassword === newPassword) {
      setPasswordError("New password must be different from old password.");
      return;
    }
    setPasswordLoading(true);
    try {
      const userId = user._id || user.id;
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const res = await fetch(`${baseUrl}/userprofile/updatepassword/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: oldPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update password");
      setPasswordSuccess(data.message || "Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err.message || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };
  // (All these variables are already declared at the top of the component. Removed duplicate declarations.)
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
        {/* Password Reset Section */}
        <div className="profile-section" style={{marginTop:32, marginBottom:32}}>
          <div className="card-icon personal"><i className="ri-lock-password-line"></i></div>
          <h3 className="card-title" style={{marginBottom:18}}>Reset Password</h3>
          <form className="profile-form" onSubmit={handlePasswordUpdate} autoComplete="off">
            <div className="form-row">
              <div className="form-col">
                <div className="form-group">
                  <label className="form-label">Old Password</label>
                  <input className="form-control" type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} autoComplete="current-password" required />
                </div>
              </div>
              <div className="form-col">
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input className="form-control" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" required />
                </div>
              </div>
              <div className="form-col">
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input className="form-control" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" required />
                </div>
              </div>
            </div>
            {passwordError && <div style={{color:'#e74c3c', marginTop:8, fontWeight:500}}>{passwordError}</div>}
            {passwordSuccess && <div style={{color:'#27ae60', marginTop:8, fontWeight:500}}>{passwordSuccess}</div>}
            <div style={{textAlign:"right", marginTop:'10px'}}>
              <button className="btn btn-primary" type="submit" disabled={passwordLoading || !!passwordError}>
                {passwordLoading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
        {/* End Password Reset Section */}
        <div className="profile-section" style={{marginTop:32}}>
          <h3>Help & Support</h3>
          <div className="help-list">
            <div className="help-item" style={{cursor:'pointer'}} onClick={() => setSupportModal(true)}><i className="ri-customer-service-2-line"></i> Contact Support</div>
            <CustomModal
              open={supportModal}
              title="Contact Support"
              onConfirm={() => setSupportModal(false)}
              onCancel={() => setSupportModal(false)}
              confirmText="OK"
              cancelText={null}
            >
              <div style={{lineHeight: 1.7, fontSize: 15}}>
                <div style={{display: 'flex', flexDirection: 'row', gap: 18, justifyContent: 'space-between', marginBottom: 12}}>
                  <div style={{flex:1, minWidth: 0, display:'flex', alignItems:'center', gap:10, borderRight:'1px solid #eee', paddingRight:12}}>
                    <span style={{background:'#e3f0ff', color:'#1976d2', borderRadius:'50%', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20}}>
                      <i className="ri-mail-line"></i>
                    </span>
                    <div style={{overflow:'hidden'}}>
                      <div style={{fontWeight:600, fontSize:16, whiteSpace:'nowrap'}}>Email</div>
                      <a href="mailto:support@smartchallan.com" style={{color:'#1976d2', textDecoration:'underline', fontSize:15, wordBreak:'break-all'}}>support@smartchallan.com</a>
                    </div>
                  </div>
                  <div style={{flex:1, minWidth: 0, display:'flex', alignItems:'center', gap:10, borderRight:'1px solid #eee', paddingRight:12, paddingLeft:12}}>
                    <span style={{background:'#fff3e0', color:'#ffa726', borderRadius:'50%', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20}}>
                      <i className="ri-phone-line"></i>
                    </span>
                    <div style={{overflow:'hidden'}}>
                      <div style={{fontWeight:600, fontSize:16, whiteSpace:'nowrap'}}>Phone</div>
                      <a href="tel:+919315489988" style={{color:'#ffa726', textDecoration:'underline', fontSize:15, wordBreak:'break-all'}}>+91-9315-489-988</a>
                    </div>
                  </div>
                  <div style={{flex:1, minWidth: 0, display:'flex', alignItems:'center', gap:10, paddingLeft:12}}>
                    <span style={{background:'#e8f5e9', color:'#43e97b', borderRadius:'50%', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20}}>
                      <i className="ri-time-line"></i>
                    </span>
                    <div style={{overflow:'hidden'}}>
                      <div style={{fontWeight:600, fontSize:16, whiteSpace:'nowrap'}}>Support Hours</div>
                      <div style={{fontSize:15}}>Mon - Sat, 9 AM to 6 PM</div>
                    </div>
                  </div>
                </div>
                <div style={{marginTop: 4, color: '#b77', display:'flex', alignItems:'center', gap:8}}>
                  <i className="ri-error-warning-line" style={{fontSize:18}}></i>
                  <span>Public holidays: Team is not available. Next working day we will contact you.</span>
                </div>
              </div>
            </CustomModal>
          </div>
        </div>
      </div>
    </div>
  );
}
