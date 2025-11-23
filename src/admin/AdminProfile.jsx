import React, { useState } from "react";
import { getInitials } from "../utils/getInitials";
import "./AdminProfile.css";
import CustomModal from "../client/CustomModal";

export default function AdminProfile() {
  const [supportModal, setSupportModal] = useState(false);
  // Get user info from localStorage
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("sc_user"))?.user || {};
    } catch {
      return {};
    }
  })();
  const userName = user.name || "John Smith";
  const userEmail = user.email || "johnsmith@example.com";
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
                  <input className="form-control" type="text" value={user.mobile || "+91 9876543210"} readOnly />
                </div>
              </div>
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
                  Public holidays: Team is not available. Next working day we will contact you.
                </div>
              </div>
            </CustomModal>
          </div>
        </div>
      </div>
    </div>
  );
}
