import React, { useState, useRef, useEffect } from "react";
// Chart.js for stat card graphs
// Install with: npm install chart.js
// Import Chart.js dynamically in useEffect
import "./ClientDashboard.css";
import "./ClientHome.css";
import "./ClientProfile.css";
import ClientSidebar from "./ClientSidebar";
import ClientProfile from "./ClientProfile";

import RegisterVehicle from "../RegisterVehicle";
import UserChallan from "../UserChallan";
import MyVehicles from "./MyVehicles";
import MyChallans from "./MyChallans";
import MyBilling from "./MyBilling";
import UserSettings from "./UserSettings";
import CustomModal from "./CustomModal";

// Get user info from localStorage
const user = (() => {
  try {
    return JSON.parse(localStorage.getItem('sc_user')) || {};
  } catch {
    return {};
  }
})();

function ClientDashboard() {
  // Loader state
  const [showLoader, setShowLoader] = useState(false);

  // Custom loader component
  const TrafficLightLoader = () => (
    <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
        {/* Realistic traffic light UI */}
        <div style={{width:90, height:260, background:'#222', borderRadius:28, boxShadow:'0 8px 32px #aaa', display:'flex', flexDirection:'column', justifyContent:'space-between', alignItems:'center', padding:28, position:'relative', border:'6px solid #444'}}>
          {/* Top cap */}
          <div style={{position:'absolute', top:-24, left:'50%', transform:'translateX(-50%)', width:60, height:24, background:'#444', borderRadius:'30px 30px 0 0'}}></div>
          {/* Bottom cap */}
          <div style={{position:'absolute', bottom:-24, left:'50%', transform:'translateX(-50%)', width:60, height:24, background:'#444', borderRadius:'0 0 30px 30px'}}></div>
          {/* Lights */}
          <div className="traffic-light" style={{width:44, height:44, borderRadius:'50%', background:'radial-gradient(circle at 60% 40%, #ff6b6b 70%, #c0392b 100%)', boxShadow:'0 0 24px #e74c3c, 0 0 0 #fff', border:'4px solid #b71c1c', animation:'pulseRed 1.2s infinite alternate', marginBottom:10}}></div>
          <div className="traffic-light" style={{width:44, height:44, borderRadius:'50%', background:'radial-gradient(circle at 60% 40%, #ffe066 70%, #f1c40f 100%)', boxShadow:'0 0 24px #f1c40f, 0 0 0 #fff', border:'4px solid #b59f3b', animation:'pulseYellow 1.2s infinite alternate', marginBottom:10}}></div>
          <div className="traffic-light" style={{width:44, height:44, borderRadius:'50%', background:'radial-gradient(circle at 60% 40%, #6bff6b 70%, #27ae60 100%)', boxShadow:'0 0 24px #2ecc40, 0 0 0 #fff', border:'4px solid #1b5e20', animation:'pulseGreen 1.2s infinite alternate'}}></div>
          {/* Animated car icon moving left to right */}
          <div style={{position:'absolute', bottom:-70, left:0, width:'100%', height:60, overflow:'visible'}}>
            <div style={{position:'absolute', left:0, top:0, width:'100%', height:'100%', animation:'carMove 2s linear infinite'}}>
              <svg width="70" height="44" viewBox="0 0 70 44" style={{display:'block'}}>
                <ellipse cx="35" cy="39" rx="26" ry="7" fill="#bbb" />
                <rect x="12" y="18" width="46" height="18" rx="9" fill="#4e79a7" />
                <rect x="22" y="12" width="26" height="14" rx="7" fill="#fff" />
                <circle cx="22" cy="37" r="6" fill="#222" stroke="#888" strokeWidth="2" />
                <circle cx="48" cy="37" r="6" fill="#222" stroke="#888" strokeWidth="2" />
                <rect x="12" y="32" width="46" height="7" rx="3.5" fill="#e74c3c" />
                {/* Headlights */}
                <ellipse cx="12" cy="25" rx="3" ry="2" fill="#ffe066" opacity="0.7" />
                <ellipse cx="58" cy="25" rx="3" ry="2" fill="#ffe066" opacity="0.7" />
              </svg>
            </div>
          </div>
        </div>
        <div style={{marginTop:48, fontSize:24, color:'#333', fontWeight:700, letterSpacing:1}}>Loading, please wait...</div>
        <div style={{marginTop:10, fontSize:16, color:'#666'}}>SmartChallan is fetching your data</div>
        <style>{`
          @keyframes pulseRed { 0%{box-shadow:0 0 24px #e74c3c,0 0 0 #fff;} 100%{box-shadow:0 0 48px #e74c3c,0 0 12px #fff;} }
          @keyframes pulseYellow { 0%{box-shadow:0 0 24px #f1c40f,0 0 0 #fff;} 100%{box-shadow:0 0 48px #f1c40f,0 0 12px #fff;} }
          @keyframes pulseGreen { 0%{box-shadow:0 0 24px #2ecc40,0 0 0 #fff;} 100%{box-shadow:0 0 48px #2ecc40,0 0 12px #fff;} }
          @keyframes carMove { 0%{left:0;} 100%{left:calc(100% - 70px);} }
        `}</style>
      </div>
    </div>
  );
  const userRole = "client";
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [clientData, setClientData] = useState(null);
  const [loadingClient, setLoadingClient] = useState(true);
  const [modal, setModal] = useState({ open: false, action: null, vehicle: null });
  const [infoModal, setInfoModal] = useState({ open: false, message: '' });
  const [supportModal, setSupportModal] = useState(false);
  // Chart refs
  const chartRefTotal = useRef(null);
  const chartRefActive = useRef(null);
  const chartRefPaid = useRef(null);
  const chartRefAmount = useRef(null);
  // Fetch client data on mount
  useEffect(() => {
    const fetchData = async () => {
      setShowLoader(true);
      setLoadingClient(true);
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      // Get client id from logged-in user
      const clientId = user && user.user && (user.user.id || user.user._id || user.user.client_id);
      if (!clientId) {
        setClientData(null);
        setLoadingClient(false);
        setTimeout(() => setShowLoader(false), 1000);
        return;
      }
      const url = `${baseUrl}/clientdata/${clientId}`;
      const start = Date.now();
      try {
        const res = await fetch(url);
        const data = await res.json();
        setClientData(data);
      } catch {
        setClientData(null);
      } finally {
        setLoadingClient(false);
        const elapsed = Date.now() - start;
        if (elapsed < 1000) {
          setTimeout(() => setShowLoader(false), 1000 - elapsed);
        } else {
          setShowLoader(false);
        }
      }
    };
    fetchData();
  }, [user]);
  // Draw charts for stat cards
  useEffect(() => {
    if (activeMenu !== "Dashboard") return;
    if (!chartRefTotal.current || !chartRefActive.current || !chartRefPaid.current || !chartRefAmount.current) return;
    Promise.all([
      import('chart.js/auto')
    ]).then(([{ default: Chart }]) => {
      // Registered Vehicles (doughnut)
      let active = 0, inactive = 0, deleted = 0;
      if (clientData && Array.isArray(clientData.vehicles)) {
        clientData.vehicles.forEach(v => {
          const status = (v.status || '').toLowerCase();
          if (status === 'active') active++;
          else if (status === 'inactive') inactive++;
          else if (status === 'deleted') deleted++;
        });
      }
      const ctxTotal = chartRefTotal.current.getContext('2d');
      if (window._clientTotalChart) window._clientTotalChart.destroy();
      window._clientTotalChart = new Chart(ctxTotal, {
        type: 'doughnut',
        data: {
          labels: ['Active', 'Inactive', 'Deleted'],
          datasets: [{
            data: [active, inactive, deleted],
            backgroundColor: ['#42a5f5', '#ffa726', '#e15759'],
          }],
        },
        options: { plugins: { legend: { display: false } }, cutout: '70%' }
      });
      // Active Challans (pie)
      const ctxActive = chartRefActive.current.getContext('2d');
      if (window._clientActiveChart) window._clientActiveChart.destroy();
      window._clientActiveChart = new Chart(ctxActive, {
        type: 'pie',
        data: {
          labels: ['Active', 'Other'],
          datasets: [{
            data: [5, 19],
            backgroundColor: ['#ffa726', '#bdbdbd'],
          }],
        },
        options: { plugins: { legend: { display: false } } }
      });
      // Paid Challans (doughnut)
      const ctxPaid = chartRefPaid.current.getContext('2d');
      if (window._clientPaidChart) window._clientPaidChart.destroy();
      window._clientPaidChart = new Chart(ctxPaid, {
        type: 'doughnut',
        data: {
          labels: ['Paid', 'Other'],
          datasets: [{
            data: [19, 10],
            backgroundColor: ['#66bb6a', '#bdbdbd'],
          }],
        },
        options: { plugins: { legend: { display: false } }, cutout: '70%' }
      });
      // Amount Due (bar)
      const ctxAmount = chartRefAmount.current.getContext('2d');
      if (window._clientAmountChart) window._clientAmountChart.destroy();
      window._clientAmountChart = new Chart(ctxAmount, {
        type: 'bar',
        data: {
          labels: ['Due', 'Paid'],
          datasets: [{
            data: [3250, 5000],
            backgroundColor: ['#e15759', '#66bb6a'],
          }],
        },
        options: { plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
      });
    });
    return () => {
      if (window._clientTotalChart) window._clientTotalChart.destroy();
      if (window._clientActiveChart) window._clientActiveChart.destroy();
      if (window._clientPaidChart) window._clientPaidChart.destroy();
      if (window._clientAmountChart) window._clientAmountChart.destroy();
    };
  }, [clientData, activeMenu]);
  // Sidebar click handler
  const handleMenuClick = (label) => {
    setShowLoader(true);
    setTimeout(() => {
      setActiveMenu(label);
      setShowLoader(false);
    }, 1000);
  };

  // Get initials for header (first two letters from first two words, or first two letters)
  let headerInitials = "";
  if (user && user.user && user.user.name) {
    const nameParts = user.user.name.trim().split(/\s+/);
    if (nameParts.length >= 2) {
      headerInitials = (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    } else {
      headerInitials = user.user.name.substring(0,2).toUpperCase();
    }
  }
  return (
    <div className="admin-dashboard-layout" style={{display: 'flex', width: '100vw', minHeight: '100vh'}}>
      {showLoader && <TrafficLightLoader />}
      <ClientSidebar role={userRole} onMenuClick={handleMenuClick} activeMenu={activeMenu} />
      <main className="main-content admin-home-content" style={{flex: 1, minHeight: '100vh'}}>
        {activeMenu === "Dashboard" && (
          <>
            <div className="dashboard-header">
              <h1 className="dashboard-title">Welcome back{user.user && user.user.name ? `, ${user.user.name}` : '123'}!
                {/* {headerInitials && (
                  <span style={{marginLeft:8, background:'#eee', borderRadius:'50%', padding:'4px 10px', fontWeight:'bold', fontSize:18, color:'#555'}}>
                    {headerInitials}
                  </span>
                )} */}
              </h1>
              <p>Here's an overview of your challan status</p>
            </div>
            <div className="dashboard-stats">
              <div className="stat-card">
                <i className="ri-car-line"></i>
                <div>Registered Vehicles</div>
                <div className="stat-value">
                  {loadingClient ? '...' : (clientData && Array.isArray(clientData.vehicles) ? clientData.vehicles.length : 0)}
                </div>
                <div className="stat-chart-container" style={{maxWidth: 80, margin: '12px auto'}}>
                  <canvas ref={chartRefTotal} width={80} height={80} />
                </div>
              </div>
              <div className="stat-card">
                <i className="ri-error-warning-line"></i>
                <div>Active Challans</div>
                <div className="stat-value">5</div>
                <div className="stat-chart-container" style={{maxWidth: 80, margin: '12px auto'}}>
                  <canvas ref={chartRefActive} width={80} height={80} />
                </div>
              </div>
              <div className="stat-card">
                <i className="ri-checkbox-circle-line"></i>
                <div>Paid Challans</div>
                <div className="stat-value">19</div>
                <div className="stat-chart-container" style={{maxWidth: 80, margin: '12px auto'}}>
                  <canvas ref={chartRefPaid} width={80} height={80} />
                </div>
              </div>
              <div className="stat-card">
                <i className="ri-money-rupee-circle-line"></i>
                <div>Total Amount Due</div>
                <div className="stat-value">₹3,250</div>
                <div className="stat-chart-container" style={{maxWidth: 80, margin: '12px auto'}}>
                  <canvas ref={chartRefAmount} width={80} height={80} />
                </div>
              </div>
            </div>
            <div className="dashboard-latest">
              <div className="latest-header">
                <h2>Latest Challans</h2>
                <a href="#" className="view-all">View All</a>
              </div>
              {/* Use the same sample data and structure as MyChallans */}
              <table className="latest-table" style={{ width: '100%', marginTop: 8, tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '20%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Challan No</th>
                    <th>Date/Time</th>
                    <th>Owner</th>
                    <th>Fine Imposed</th>
                    <th>Status</th>
                    <th>Offence Details</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Pending challans first, then disposed */}
                  {[
                    ...[
                      {
                        challan_no: "KL548476230713105383",
                        challan_date_time: "01-09-2023 17:36:00",
                        owner_name: "T**T P*T L*D",
                        fine_imposed: "7750",
                        challan_status: "Pending",
                        offence_details: [
                          { name: "Fitness certificate (CF) of a transport vehicle not produced on demand for examination by the officer authorised." },
                          { name: "Driving or causing or allowing to be driven a vehicle as contract carriage without valid permit.(MMV and HMV)" }
                        ]
                      },
                      {
                        challan_no: "KL48648220311114937",
                        challan_date_time: "11-03-2022 11:49:37",
                        owner_name: "T**T P*T L*D",
                        fine_imposed: "1",
                        challan_status: "Pending",
                        offence_details: [
                          { name: "test offence 1 rupee" }
                        ]
                      }
                    ],
                    ...[
                      {
                        challan_no: "KL48648220311113821",
                        challan_date_time: "11-03-2022 11:38:21",
                        owner_name: "T**T P*T L*D",
                        fine_imposed: "1",
                        challan_status: "Disposed",
                        offence_details: [
                          { name: "test offence 1 rupee" }
                        ]
                      },
                      {
                        challan_no: "KL48648220225112001",
                        challan_date_time: "25-02-2022 11:20:01",
                        owner_name: "T**T P*T L*D",
                        fine_imposed: "1",
                        challan_status: "Disposed",
                        offence_details: [
                          { name: "test offence 1 rupee" }
                        ]
                      }
                    ]
                  ].flat().map((c, idx) => (
                    <tr key={c.challan_no || idx}>
                      <td>
                        <div className="cell-ellipsis" title={c.challan_no}>{c.challan_no}</div>
                      </td>
                      <td>
                        <div className="cell-ellipsis" title={c.challan_date_time}>{c.challan_date_time}</div>
                      </td>
                      <td>
                        <div className="cell-ellipsis" title={c.owner_name}>{c.owner_name}</div>
                      </td>
                      <td>{c.fine_imposed}</td>
                      <td>
                        <span className={
                          c.challan_status === 'Pending' ? 'status pending' :
                          c.challan_status === 'Disposed' ? 'status paid' : ''
                        }>
                          {c.challan_status}
                        </span>
                      </td>
                      <td>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {Array.isArray(c.offence_details) && c.offence_details.map((o, i) => (
                            <li key={i} className="cell-ellipsis" title={o.name}>{o.name}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="dashboard-latest">
              <h2 style={{ fontSize: '1.2rem', marginBottom: 12 }}>Registered Vehicles</h2>
              {loadingClient ? (
                <div>Loading vehicles...</div>
              ) : !clientData || !Array.isArray(clientData.vehicles) || clientData.vehicles.length === 0 ? (
                <div style={{ color: '#888' }}>No vehicles registered yet.</div>
              ) : (
                <table className="latest-table" style={{ width: '100%', marginTop: 8 }}>
                  <thead>
                    <tr>
                      <th>Vehicle Number</th>
                      <th>Engine Number</th>
                      <th>Chasis Number</th>
                      <th>Status</th>
                      <th>Registered At</th>
                      <th>Data</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientData.vehicles.map((v, idx) => {
                      let status = (v.status || 'Not Available').toUpperCase();
                      let statusColor = '#888';
                      if (status === 'ACTIVE') statusColor = 'green';
                      else if (status === 'INACTIVE') statusColor = 'orange';
                      else if (status === 'DELETED') statusColor = 'red';
                      // Action handlers
                      const handleInactivate = () => setModal({ open: true, action: 'inactivate', vehicle: v });
                      const handleActivate = () => setModal({ open: true, action: 'activate', vehicle: v });
                      const handleDelete = () => setModal({ open: true, action: 'delete', vehicle: v });
                      return (
                        <tr key={v.id || v._id || idx}>
                          <td>{v.vehicle_number || 'Not Available'}</td>
                          <td>{v.engine_number || 'Not Available'}</td>
                          <td>{v.chasis_number || 'Not Available'}</td>
                          <td style={{ color: statusColor, fontWeight: 600, letterSpacing: 1 }}>{status}</td>
                          <td>{v.registered_at ? new Date(v.registered_at).toLocaleString() : 'Not Available'}</td>
                          <td>
                            <button className="action-btn" style={{padding: '2px 10px', fontSize: 14}}>Get Data <i className="ri-car-line" style={{marginLeft: 6}}></i><i className="ri-information-line" style={{marginLeft: 2}}></i></button>
                          </td>
                          <td>
                            {status === 'INACTIVE' ? (
                              <span
                                title="Activate Vehicle"
                                style={{color: 'green', cursor: 'pointer', marginRight: 8, fontSize: 20, verticalAlign: 'middle'}}
                                onClick={handleActivate}
                              >
                                <i className="ri-checkbox-circle-line"></i>
                              </span>
                            ) : status === 'ACTIVE' ? (
                              <span
                                title="Inactivate Vehicle"
                                style={{color: 'orange', cursor: 'pointer', marginRight: 8, fontSize: 20, verticalAlign: 'middle'}}
                                onClick={handleInactivate}
                              >
                                <i className="ri-close-circle-line"></i>
                              </span>
                            ) : null}
                            <span
                              title="Delete Vehicle"
                              style={{color: 'red', cursor: 'pointer', fontSize: 20, verticalAlign: 'middle'}} onClick={handleDelete}
                            >
                              <i className="ri-delete-bin-6-line"></i>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {/* Custom Modal for confirmation */}
              <CustomModal
                open={modal.open}
                title={
                  modal.action === 'inactivate' ? 'Are you sure you want to inactivate this vehicle?'
                  : modal.action === 'activate' ? 'Are you sure you want to activate this vehicle?'
                  : modal.action === 'delete' ? 'Are you sure you want to delete this vehicle?'
                  : ''
                }
                onConfirm={() => {
                  setModal({ open: false, action: null, vehicle: null });
                  // TODO: Implement actual API call for action here
                }}
                onCancel={() => setModal({ open: false, action: null, vehicle: null })}
                confirmText={modal.action === 'delete' ? 'Delete' : modal.action === 'activate' ? 'Activate' : modal.action === 'inactivate' ? 'Inactivate' : 'Yes'}
                cancelText="Cancel"
              />
            </div>
            <div className="dashboard-actions">
              <h2>Quick Actions</h2>
              <div className="actions-list">
                <button className="action-btn" onClick={() => setActiveMenu('Register Vehicle')}><i className="ri-add-circle-line"></i> Add New Vehicle</button>
                <button className="action-btn" onClick={() => setInfoModal({ open: true, message: 'Feature not rolled back yet. Stay tuned. We will notify you.' })}><i className="ri-wallet-3-line"></i> Pay Challans</button>
                <button className="action-btn" onClick={() => setInfoModal({ open: true, message: 'Feature not rolled back yet. Stay tuned. We will notify you.' })}><i className="ri-bar-chart-2-line"></i> Generate Reports</button>
                <button className="action-btn" onClick={() => setSupportModal(true)}><i className="ri-customer-service-2-line"></i> Contact Support</button>
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
          <div className="client-profile-section-isolated">
            <ClientProfile />
          </div>
        )}
        {activeMenu === "Register Vehicle" && <RegisterVehicle />}
        {activeMenu === "My Vehicles" && <MyVehicles />}
        {activeMenu === "My Challans" && <MyChallans />}
        {activeMenu === "Challans" && <UserChallan />}
        {activeMenu === "My Billing" && <MyBilling clientId={user.user && (user.user.id || user.user._id)} />}
        {activeMenu === "Settings" && <UserSettings users={[]} />}
      </main>
      <CustomModal
        open={infoModal.open}
        title={infoModal.message}
        onConfirm={() => setInfoModal({ open: false, message: '' })}
        onCancel={() => setInfoModal({ open: false, message: '' })}
        confirmText="OK"
        cancelText={null}
      />
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
  );
}

export default ClientDashboard;
