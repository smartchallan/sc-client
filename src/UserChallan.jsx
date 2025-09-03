import React from "react";
import "./UserChallan.css";

export default function UserChallan() {
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
      <div className="dashboard-latest">
        <div className="latest-header">
          <h2>Challan List</h2>
        </div>
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
            <tr>
              <td>CH-2023-0045782</td>
              <td>12 Jun 2023</td>
              <td>₹1,200</td>
              <td>Speeding violation on NH-48</td>
              <td><span className="status pending">Active</span></td>
              <td><button className="action-btn"><i className="ri-eye-line"></i> View</button> <button className="action-btn"><i className="ri-wallet-3-line"></i> Pay</button></td>
            </tr>
            <tr>
              <td>CH-2023-0045689</td>
              <td>08 Jun 2023</td>
              <td>₹500</td>
              <td>Parking violation at MG Road</td>
              <td><span className="status paid">Paid</span></td>
              <td><button className="action-btn"><i className="ri-eye-line"></i> View</button></td>
            </tr>
            <tr>
              <td>CH-2023-0045521</td>
              <td>02 Jun 2023</td>
              <td>₹2,000</td>
              <td>Signal jumping at City Center</td>
              <td><span className="status overdue">Overdue</span></td>
              <td><button className="action-btn"><i className="ri-eye-line"></i> View</button> <button className="action-btn"><i className="ri-wallet-3-line"></i> Pay</button></td>
            </tr>
            <tr>
              <td>CH-2023-0044982</td>
              <td>28 May 2023</td>
              <td>₹800</td>
              <td>No helmet violation</td>
              <td><span className="status paid">Paid</span></td>
              <td><button className="action-btn"><i className="ri-eye-line"></i> View</button></td>
            </tr>
            <tr>
              <td>CH-2023-0044756</td>
              <td>22 May 2023</td>
              <td>₹1,500</td>
              <td>Driving without license</td>
              <td><span className="status paid">Paid</span></td>
              <td><button className="action-btn"><i className="ri-eye-line"></i> View</button></td>
            </tr>
            <tr>
              <td>CH-2023-0044321</td>
              <td>15 May 2023</td>
              <td>₹1,000</td>
              <td>Wrong side driving</td>
              <td><span className="status pending">Active</span></td>
              <td>
                <button className="btn btn-view"><i className="ri-eye-line"></i> Views</button> 
                <button className="btn btn-pay"><i className="ri-wallet-3-line"></i> Pay</button></td>
            </tr>
            <tr>
              <td>CH-2023-0043987</td>
              <td>10 May 2023</td>
              <td>₹700</td>
              <td>No parking zone violation</td>
              <td><span className="status overdue">Overdue</span></td>
              <td>
                <button className="btn btn-view"><i className="ri-eye-line"></i> Viewsssss</button> 
                <button className="btn btn-pay"><i className="ri-wallet-3-line"></i> Pay</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="dashboard-actions">
        <h2>Quick Actions</h2>
        <div className="actions-list">
          <button className="action-btn"><i className="ri-add-circle-line"></i> Add New Vehicle</button>
          <button className="action-btn"><i className="ri-wallet-3-line"></i> Pay Challans</button>
          <button className="action-btn"><i className="ri-bar-chart-2-line"></i> Generate Reports</button>
          <button className="action-btn"><i className="ri-customer-service-2-line"></i> Contact Support</button>
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
