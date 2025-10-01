import React from "react";
import "./AdminDashboard.css";

export default function DealerSettings({ dealers = [] }) {
  return (
    <div className="register-vehicle-content">
      <h1>Dealer Settings</h1>
      <p style={{marginBottom: 16, color: '#444', fontWeight: 500}}>
        Manage permissions for each dealer below. You can allow or restrict adding clients and vehicles for each dealer.
      </p>
      <div className="card">
        <div style={{marginTop: 16}}>
          <h2 style={{fontSize: '1.2rem', marginBottom: 12}}>Dealers</h2>
          {dealers.length === 0 ? (
            <div style={{color: '#888'}}>No dealers found.</div>
          ) : (
            <table className="latest-table" style={{ width: '100%', marginTop: 8 }}>
              <thead>
                <tr>
                  <th>Dealer ID</th>
                  <th>Dealer Name</th>
                  <th>Add Clients</th>
                  <th>Inactivate Client</th>
                  <th>Delete Client</th>
                  <th>Add Vehicle</th>
                  <th>Delete Vehicle</th>
                </tr>
              </thead>
              <tbody>
                {dealers.map((dealer, idx) => (
                  <tr key={dealer.id || dealer._id || idx}>
                    <td>{dealer.id || dealer._id || '-'}</td>
                    <td>{dealer.name || dealer.dealer_name || dealer.email || '-'}</td>
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
