import React from "react";
import "../admin/AdminDashboard.css";

export default function ClientSettings({ clients = [] }) {
  return (
    <div className="register-vehicle-content">
      <h1>Client Settings</h1>
      <p style={{marginBottom: 16, color: '#444', fontWeight: 500}}>
        Manage permissions for each client below. You can allow or restrict actions for each client.
      </p>
      <div className="card">
        <div style={{marginTop: 16}}>
          <h2 style={{fontSize: '1.2rem', marginBottom: 12}}>Clients</h2>
          {clients.length === 0 ? (
            <div style={{color: '#888'}}>No clients found.</div>
          ) : (
            <table className="latest-table" style={{ width: '100%', marginTop: 8 }}>
              <thead>
                <tr>
                  <th>Client ID</th>
                  <th>Client Name</th>
                  <th>Add Vehicle</th>
                  <th>Inactivate Vehicle</th>
                  <th>Delete Vehicle</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client, idx) => (
                  <tr key={client.id || client._id || idx}>
                    <td>{client.id || client._id || '-'}</td>
                    <td>{client.name || client.email || '-'}</td>
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
