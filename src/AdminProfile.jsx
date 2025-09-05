import React from "react";
import "./AdminProfile.css";

export default function AdminProfile() {
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
    <div className="profile-content1">
      <div className="content">
        <div className="profile-header-profile">
          <div className="profile-picture">{initials}</div>
          <div>
            <h2>{userName}</h2>
            <p>{userEmail}</p>
            <p>Member since: {userJoined}</p>
          </div>
        </div>
      <div className="profile-section">
        <div className="card-icon personal">
            <i className="ri-user-settings-line"></i>
        </div>
        <h3 className="card-title">Personal Information</h3>
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
                    <button className="btn btn-primary" fdprocessedid="3zl7hn">Save Changes</button>
                </div>
        </form>
      </div>
      <div className="profile-section">
        <h3>Account Settings</h3>
        <form className="profile-form">

          <div className="form-group">
              <label className="form-label">Current Password</label>
              <input type="password" class="form-control" placeholder="Enter current password"/>
          </div>

          <div className="form-row">
            <div className="form-col">
              <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" class="form-control" placeholder="Enter new password" />
              </div>
            </div>
            <div className="form-col">
              <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input type="password" class="form-control" placeholder="confirm new password" />
              </div>
            </div>
          </div>
          
          
          <div style={{margin: '12px 0'}}>
           
            <div className="toggle-container">
                <div className="toggle-text">Email Notifications</div>
                <label className="toggle-switch">
                    <input type="checkbox" checked=""/>
                    <span className="toggle-slider"></span>
                </label>
            </div>

            <div className="toggle-container">
                <div className="toggle-text">SMS Notifications</div>
                <label className="toggle-switch">
                    <input type="checkbox"/>
                    <span className="toggle-slider"></span>
                </label>
            </div>

            <div className="toggle-container">
                <div className="toggle-text">Marketing Communications</div>
                <label className="toggle-switch">
                    <input type="checkbox" checked=""/>
                    <span className="toggle-slider"></span>
                </label>
            </div>

          </div>

          

          <div style={{textAlign:"right", marginTop:'10px'}}>
            <button type="button" className="btn btn-outline" style={{marginRight: '8px'}}>Cancel</button>
            <button type="button" className="btn btn-primary">Update Settings</button>
          </div>
          
        </form>
      </div>
      <div className="profile-section">
        <h3>Security</h3>
        <div>Two-Factor Authentication</div>
        <div className="devices-list">
          <div className="device-item">
            <i className="ri-smartphone-line"></i> iPhone 13 Pro <span>Last active: Today, 10:30 AM</span>
          </div>
          <div className="device-item">
            <i className="ri-macbook-line"></i> MacBook Pro <span>Last active: Yesterday, 6:45 PM</span>
          </div>
        </div>
        <div className="login-history">
          <h4>Login History</h4>
          <table>
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Device</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Today, 10:30 AM</td>
                <td>iPhone 13 Pro</td>
                <td>Mumbai, India</td>
                <td><span className="status paid">Successful</span></td>
              </tr>
              <tr>
                <td>Yesterday, 6:45 PM</td>
                <td>MacBook Pro</td>
                <td>Mumbai, India</td>
                <td><span className="status paid">Successful</span></td>
              </tr>
              <tr>
                <td>Jun 20, 2023, 9:15 AM</td>
                <td>Chrome on Windows</td>
                <td>Delhi, India</td>
                <td><span className="status paid">Successful</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="profile-section">
        <h3>Help & Support</h3>
        <div className="help-list">
          <div className="help-item"><i className="ri-customer-service-2-line"></i> Contact Support</div>
          <div className="help-item"><i className="ri-question-line"></i> FAQ</div>
          <div className="help-item"><i className="ri-feedback-line"></i> Feedback</div>
        </div>
      </div>
      </div>
      
    </div>
  );
}
