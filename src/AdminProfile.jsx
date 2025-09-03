import React from "react";
import "./AdminProfile.css";

export default function AdminProfile() {
  return (
    <div className="profile-content">
      <h1>User Profile</h1>
      <div className="profile-header">
        <div className="profile-avatar">JS</div>
        <div>
          <h2>John Smith</h2>
          <p>johnsmith@example.com</p>
          <p>Member since: June 15, 2023</p>
        </div>
      </div>
      <div className="profile-section">
        <h3>Personal Information</h3>
        <form className="profile-form">
          <label>Full Name</label>
          <input type="text" value="John Smith" readOnly />
          <label>Email Address</label>
          <input type="email" value="johnsmith@example.com" readOnly />
          <label>Mobile Number</label>
          <input type="text" value="+91 9876543210" readOnly />
          <label>Date Joined</label>
          <input type="text" value="June 15, 2023" readOnly />
          <button type="button" className="action-btn" style={{marginTop: '16px'}}>
            <i className="ri-save-line"></i> Save Changes
          </button>
        </form>
      </div>
      <div className="profile-section">
        <h3>Account Settings</h3>
        <form className="profile-form">
          <label>Current Password</label>
          <input type="password" placeholder="Enter current password" />
          <label>New Password</label>
          <input type="password" placeholder="Enter new password" />
          <label>Confirm New Password</label>
          <input type="password" placeholder="Confirm new password" />
          <div style={{margin: '12px 0'}}>
            <label><input type="checkbox" /> Email Notifications</label>
            <label><input type="checkbox" /> SMS Notifications</label>
            <label><input type="checkbox" /> Marketing Communications</label>
          </div>
          <button type="button" className="action-btn" style={{marginRight: '8px'}}>Cancel</button>
          <button type="button" className="action-btn">Update Settings</button>
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
  );
}
