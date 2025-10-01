import React from "react";
import "../admin/AdminDashboard.css";

export default function UserSettings({ users = [] }) {
  return (
    <div className="register-vehicle-content">
      <h1>User Settings</h1>
      <p style={{marginBottom: 16, color: '#444', fontWeight: 500}}>
        Manage permissions for each user below. You can allow or restrict actions for each user.
      </p>
      <div className="card">
        <div style={{marginTop: 16}}>
          <h2 style={{fontSize: '1.2rem', marginBottom: 12}}>Users</h2>
          {users.length === 0 ? (
            <div style={{color: '#888'}}>No users found.</div>
          ) : (
            <table className="latest-table" style={{ width: '100%', marginTop: 8 }}>
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>User Name</th>
                  <th>Pay Challan</th>
                  <th>Download Receipt</th>
                  <th>Delete Account</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => (
                  <tr key={user.id || user._id || idx}>
                    <td>{user.id || user._id || '-'}</td>
                    <td>{user.name || user.email || '-'}</td>
                    <td>
                      <div style={{display: 'flex', alignItems: 'center', height: '100%', paddingLeft: 8}}>
                        <input type="checkbox" checked readOnly style={{accentColor: '#4e79a7', width: 18, height: 18}} />
                      </div>
                    </td>
                    <td>
                      <div style={{display: 'flex', alignItems: 'center', height: '100%', paddingLeft: 8}}>
                        <input type="checkbox" checked readOnly style={{accentColor: '#4e79a7', width: 18, height: 18}} />
                      </div>
                    </td>
                    <td>
                      <div style={{display: 'flex', alignItems: 'center', height: '100%', paddingLeft: 8}}>
                        <input type="checkbox" checked readOnly style={{accentColor: '#4e79a7', width: 18, height: 18}} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
