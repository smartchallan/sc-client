
import React, { useState } from "react";
import "./AdminDashboard.css";
import "./AdminHome.css";
import AdminSidebar from "./AdminSidebar";
import AdminProfile from "./AdminProfile";
import RegisterVehicle from "./RegisterVehicle";
import UserChallan from "./UserChallan";


function AdminDashboard() {
  const userRole = "admin";
  const [activeMenu, setActiveMenu] = useState("Home");
  // Get user info from localStorage
  const user = (() => {
    try {

    // console.log('>>>>>>>>>>>' + localStorage.getItem('sc_user'));
      return JSON.parse(localStorage.getItem('sc_user')) || {};

    } catch {
      return {};
    }
  })();

  // Sidebar click handler
  const handleMenuClick = (label) => {
    setActiveMenu(label);
  };

  return (
    <div className="admin-dashboard-layout" style={{display: 'flex', width: '100vw', minHeight: '100vh'}}>
      <AdminSidebar role={userRole} onMenuClick={handleMenuClick} activeMenu={activeMenu} />
      <main className="main-content admin-home-content" style={{flex: 1, minHeight: '100vh'}}>
        {activeMenu === "Home" && (
          <>
            {/* ...existing dashboard content... */}
            <div className="dashboard-header">
                {/* console.log('hello' + {user}); */}
              <h1 className="dashboard-title">Welcome back{user.user.name ? `, ${user.user.name}` : '123'}!</h1>
              <p>Here's an overview of your challan status</p>
            </div>
            <div className="dashboard-stats">
              <div className="stat-card">
                <i className="ri-file-list-3-line"></i>
                <div>Total Challans</div>
                <div className="stat-value">24</div>
              </div>
              <div className="stat-card">
                <i className="ri-error-warning-line"></i>
                <div>Active Challans</div>
                <div className="stat-value">5</div>
              </div>
              <div className="stat-card">
                <i className="ri-checkbox-circle-line"></i>
                <div>Paid Challans</div>
                <div className="stat-value">19</div>
              </div>
              <div className="stat-card">
                <i className="ri-money-rupee-circle-line"></i>
                <div>Total Amount Due</div>
                <div className="stat-value">₹3,250</div>
              </div>
            </div>
            <div className="dashboard-latest">
              <div className="latest-header">
                <h2>Latest Challans</h2>
                <a href="#" className="view-all">View All</a>
              </div>
              <table className="latest-table">
                <thead>
                  <tr>
                    <th>Challan No</th>
                    <th>Vehicle No</th>
                    <th>Date</th>
                    <th>Offense</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>CH-2023-8754</td>
                    <td>MH02AB1234</td>
                    <td>15 Jun 2023</td>
                    <td>Speeding</td>
                    <td>₹1,000</td>
                    <td><span className="status pending">Pending</span></td>
                  </tr>
                  <tr>
                    <td>CH-2023-8753</td>
                    <td>MH02AB1234</td>
                    <td>10 Jun 2023</td>
                    <td>No Parking</td>
                    <td>₹500</td>
                    <td><span className="status pending">Pending</span></td>
                  </tr>
                  <tr>
                    <td>CH-2023-8752</td>
                    <td>MH02CD5678</td>
                    <td>05 Jun 2023</td>
                    <td>Red Light</td>
                    <td>₹1,500</td>
                    <td><span className="status paid">Paid</span></td>
                  </tr>
                  <tr>
                    <td>CH-2023-8751</td>
                    <td>MH02AB1234</td>
                    <td>01 Jun 2023</td>
                    <td>No Helmet</td>
                    <td>₹500</td>
                    <td><span className="status overdue">Overdue</span></td>
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
          </>
        )}
        {activeMenu === "Profile" && (
          <AdminProfile />
        )}
        {activeMenu === "Register Vehicle" && (
          <RegisterVehicle />
        )}
        {activeMenu === "Challans" && (
          <UserChallan />
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
