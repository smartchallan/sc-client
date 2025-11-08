import React, { useState } from "react";
import "./UserChallan.css";
import CustomModal from "./client/CustomModal";

export default function UserChallan() {
  const [supportModal, setSupportModal] = useState(false);

  // Demo challan data (replace with real data if available)
  const challans = [
    { no: 'CH-2023-0045782', date: '12 Jun 2023', amount: 1200, desc: 'Speeding violation on NH-48', status: 'Active' },
    { no: 'CH-2023-0045689', date: '08 Jun 2023', amount: 500, desc: 'Parking violation at MG Road', status: 'Paid' },
    { no: 'CH-2023-0045521', date: '02 Jun 2023', amount: 2000, desc: 'Signal jumping at City Center', status: 'Overdue' },
    { no: 'CH-2023-0044982', date: '28 May 2023', amount: 800, desc: 'No helmet violation', status: 'Paid' },
    { no: 'CH-2023-0044756', date: '22 May 2023', amount: 1500, desc: 'Driving without license', status: 'Paid' },
    { no: 'CH-2023-0044321', date: '15 May 2023', amount: 1000, desc: 'Wrong side driving', status: 'Active' },
    { no: 'CH-2023-0043987', date: '10 May 2023', amount: 700, desc: 'No parking zone violation', status: 'Overdue' },
  ];
  // Pending: Active or Overdue
  const pendingChallans = challans.filter(c => c.status === 'Active' || c.status === 'Overdue');
  // Disposed: Paid
  const disposedChallans = challans.filter(c => c.status === 'Paid');
  const pendingLimit = 5;
  const disposedLimit = 5;

  // Debug: log array lengths
  console.log('pendingChallans:', pendingChallans.length, 'disposedChallans:', disposedChallans.length);
  return (
    <div className="user-challan-content">
      <div className="dashboard-header">
        <h1>Your Vehicle Challans</h1>
        <p>Manage and settle your vehicle challans in one place</p>
      </div>
      {/* <div className="dashboard-stats">
        <div className="stat-card">
          <i className="ri-file-list-3-line"></i>
          <div>Total Challans</div>
          <div className="stat-value">6</div>
        </div>
        <div className="stat-card">
          <i className="ri-error-warning-line"></i>
          <div>Active Challans</div>
          <div className="stat-value">2</div>
        </div>
        <div className="stat-card">
          <i className="ri-checkbox-circle-line"></i>
          <div>Paid Challans</div>
          <div className="stat-value">3</div>
        </div>
        <div className="stat-card">
          <i className="ri-money-rupee-circle-line"></i>
          <div>Total Amount Due</div>
          <div className="stat-value">₹5,700</div>
        </div>
      </div> */}
      <div className="challan-filter-bar  filter-section">
        <div className="filter-group">
<span className="filter-label">Status</span>
        <select className="filter-select">
          <option>All</option>
          <option>Active</option>
          <option>Paid</option>
          <option>Overdue</option>
        </select>
        </div>
        <div className="filter-group">
            <span className="filter-label">From Date</span>
        <input type="date" className="filter-input"/>
        </div>
        <div className="filter-group">
            <span className="filter-label">To Date</span>
        <input type="date" className="filter-input" />
        </div>
        <div className="filter-group">
            <span className="filter-label">Amount Range</span>
        <input type="text" className="filter-input" placeholder="Min" style={{width: '60px'}} />
        <input type="text" className="filter-input" placeholder="Max" style={{width: '60px', marginRight: '12px'}} />
        </div>
        <div className="filter-group">
             <span>Type</span>
        <select className="filter-select">
          <option>All</option>
          <option>Speeding</option>
          <option>Parking</option>
          <option>Signal Jumping</option>
          <option>No Helmet</option>
          <option>License</option>
        </select>
        </div>
        
        
        
        
        
       
        <button className="action-btn" style={{marginLeft: '16px'}}><i className="ri-search-line"></i> Filter</button>
      </div>
      {/* Pending Challans Table */}
      <div className="dashboard-latest">
        <div className="latest-header">
          <h2>Pending Challans</h2>
        </div>
        {pendingChallans.length > 0 && (
          <div style={{
            marginBottom: 8,
            color: '#222',
            fontSize: 15,
            background: '#ffe9b3',
            border: '1.5px solid #f7b500',
            borderRadius: 6,
            padding: '4px 12px',
            fontWeight: 600,
            display: 'inline-block'
          }}>
            Showing {Math.min(pendingChallans.length, pendingLimit)} of {pendingChallans.length} challans
          </div>
        )}
        <table className="latest-table">
          <thead>
            <tr>
              <th>Challan No</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingChallans.slice(0, pendingLimit).map((c, i) => (
              <tr key={c.no}>
                <td>{c.no}</td>
                <td>{c.date}</td>
                <td>₹{c.amount.toLocaleString()}</td>
                <td>{c.desc}</td>
                <td><span className={`status ${c.status.toLowerCase()}`}>{c.status}</span></td>
                <td>
                  <button className="action-btn"><i className="ri-eye-line"></i> View</button>
                  {(c.status === 'Active' || c.status === 'Overdue') && <button className="action-btn"><i className="ri-wallet-3-line"></i> Pay</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Disposed Challans Table */}
      <div className="dashboard-latest">
        <div className="latest-header">
          <h2>Disposed Challans</h2>
        </div>
        {disposedChallans.length > 0 && (
          <div style={{
            marginBottom: 8,
            color: '#222',
            fontSize: 15,
            background: '#e3f7d6',
            border: '1.5px solid #4caf50',
            borderRadius: 6,
            padding: '4px 12px',
            fontWeight: 600,
            display: 'inline-block'
          }}>
            Showing {Math.min(disposedChallans.length, disposedLimit)} of {disposedChallans.length} challans
          </div>
        )}
        <table className="latest-table">
          <thead>
            <tr>
              <th>Challan No</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {disposedChallans.slice(0, disposedLimit).map((c, i) => (
              <tr key={c.no}>
                <td>{c.no}</td>
                <td>{c.date}</td>
                <td>₹{c.amount.toLocaleString()}</td>
                <td>{c.desc}</td>
                <td><span className={`status ${c.status.toLowerCase()}`}>{c.status}</span></td>
                <td>
                  <button className="action-btn"><i className="ri-eye-line"></i> View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="dashboard-actions">
        <h2>Quick Actions</h2>
        <div className="actions-list">
          <button className="action-btn"><i className="ri-add-circle-line"></i> Add New Vehicle</button>
          <button className="action-btn"><i className="ri-wallet-3-line"></i> Pay Challans</button>
          <button className="action-btn"><i className="ri-bar-chart-2-line"></i> Generate Reports</button>
          <button className="action-btn" onClick={() => setSupportModal(true)}><i className="ri-customer-service-2-line"></i> Contact Support</button>
      <CustomModal
        open={supportModal}
        title="Contact Support"
        onConfirm={() => setSupportModal(false)}
        onCancel={() => setSupportModal(false)}
        confirmText="OK"
        cancelText={null}
      >
        <div style={{lineHeight: 1.7, fontSize: 15}}>
          <div><b>Email:</b> <a href="mailto:support@smartchallan.com">support@smartchallan.com</a></div>
          <div><b>Phone:</b> <a href="tel:+911234567890">+91-1234-567-890</a></div>
          <div style={{marginTop: 10}}><b>Support Hours:</b> Mon - Sat, 9 AM to 6 PM</div>
          <div style={{color: '#b77', marginTop: 4}}>Public holidays: Team is not available. Next working day we will contact you.</div>
        </div>
      </CustomModal>
        </div>
      </div>
      <div className="dashboard-due">
        <h2>Challans Due Today</h2>
        <div className="due-list">
          <div className="due-item">
            <div className="due-date">18 JUN</div>
            <div className="due-info">Speeding Violation <span>MH02AB1234</span> <span>₹1,000</span></div>
          </div>
          <div className="due-item">
            <div className="due-date">18 JUN</div>
            <div className="due-info">No Parking Zone <span>MH02CD5678</span> <span>₹500</span></div>
          </div>
        </div>
        <h2>Upcoming Due Dates</h2>
        <div className="due-list">
          <div className="due-item">
            <div className="due-date">22 JUN</div>
            <div className="due-info">Red Light Violation <span>MH02AB1234</span> <span>₹1,500</span></div>
          </div>
          <div className="due-item">
            <div className="due-date">25 JUN</div>
            <div className="due-info">Improper Parking <span>MH02CD5678</span> <span>₹750</span></div>
          </div>
          <div className="due-item">
            <div className="due-date">30 JUN</div>
            <div className="due-info">No Helmet <span>MH02AB1234</span> <span>₹500</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
