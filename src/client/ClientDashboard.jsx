// ...existing imports...
// ...other imports...
import LatestChallansTable from "./LatestChallansTable";
import TrafficLightLoader from "../assets/TrafficLightLoader";

// Fetch all client challans on dashboard load
// (move this after imports and inside ClientDashboard function)
import React, { useState, useRef, useEffect, lazy, Suspense } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
import VehicleDataTable from "./VehicleDataTable";
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

const DriverVerification = lazy(() => import("./DriverVerification"));
const LazyVehicleFastag = lazy(() => import("./VehicleFastag"));

function ClientDashboard() {
  // Handler for 'View All' in Latest Challans Table
  React.useEffect(() => {
    window.handleViewAllChallans = () => setActiveMenu('My Challans');
    return () => { delete window.handleViewAllChallans; };
  }, []);
  // User role for sidebar
  const userRole = 'client';
  // Per-row loader state for RTO/Challan API calls
  const [rtoLoadingId, setRtoLoadingId] = useState(null);
  const [challanLoadingId, setChallanLoadingId] = useState(null);
  // Modal state for confirmation
  const [modal, setModal] = useState({ open: false, action: null, vehicle: null });
  const [infoModal, setInfoModal] = useState({ open: false, message: '' });
  const [supportModal, setSupportModal] = useState(false);
  // Chart refs
  const chartRefTotal = useRef(null);
  const chartRefActive = useRef(null);
  const chartRefPaid = useRef(null);
  const chartRefAmount = useRef(null);
  // Client data
  const [clientData, setClientData] = useState(null);
  const [loadingClient, setLoadingClient] = useState(true);
  // Vehicle challan data
  const [vehicleChallanData, setVehicleChallanData] = useState([]);
  const [loadingVehicleChallan, setLoadingVehicleChallan] = useState(false);
  const [vehicleChallanError, setVehicleChallanError] = useState("");
  // Loader state
  const [showLoader, setShowLoader] = useState(false);
  // Active menu
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [selectedChallan, setSelectedChallan] = useState(null);

  // Modal confirmation logic for RTO/Challan requests
  const handleModalConfirm = async () => {
    if (modal.action === 'info') {
      setModal({ open: false, action: null, vehicle: null });
      return;
    }
    if (!modal.vehicle) return setModal({ open: false, action: null, vehicle: null });
    setModal({ open: false, action: null, vehicle: null });
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    // RTO/Challan loader
    if (modal.action === 'getRTO') {
      setRtoLoadingId(modal.vehicle.id || modal.vehicle._id);
      return;
    }
    if (modal.action === 'getChallan') {
      setChallanLoadingId(modal.vehicle.id || modal.vehicle._id);
      return;
    }
    // Vehicle status update API
    if (["activate", "inactivate", "delete"].includes(modal.action)) {
      setShowLoader(true);
      try {
        const statusValue = modal.action === "activate" ? "active" : modal.action === "inactivate" ? "inactive" : "deleted";
        const res = await fetch(`${baseUrl}/updatevehiclestatus`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicle_id: modal.vehicle.id || modal.vehicle._id,
            status: statusValue
          })
        });
        const data = await res.json();
        // Success detection: check for success, status, or updated vehicle
        const isSuccess = data && (data.success === true || data.status === "success" || data.updated_vehicle || data.vehicle);
        if (isSuccess) {
          toast.success(data && data.message ? data.message : "Vehicle status updated successfully.");
          // Use updated vehicle from response if available, else update locally
          setClientData(prev => {
            if (!prev || !Array.isArray(prev.vehicles)) return prev;
            const updatedVehicles = prev.vehicles.map(v => {
              if ((v.id || v._id) === (modal.vehicle.id || modal.vehicle._id)) {
                // Prefer API response for updated vehicle
                if (data.updated_vehicle) return { ...v, ...data.updated_vehicle };
                if (data.vehicle) return { ...v, ...data.vehicle };
                return { ...v, status: statusValue.toUpperCase() };
              }
              return v;
            });
            return { ...prev, vehicles: updatedVehicles };
          });
        } else {
          toast.error(data && data.message ? data.message : "Failed to update vehicle status.");
        }
      } catch (err) {
        toast.error("Error updating vehicle status.");
      } finally {
        setShowLoader(false);
      }
    }
  };

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
    // Delay chart drawing to ensure canvas refs are mounted
    const timeout = setTimeout(() => {
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
        // Active Challans (pending vs disposed)
        const ctxActive = chartRefActive.current.getContext('2d');
        if (window._clientActiveChart) window._clientActiveChart.destroy();
        let activePendingCount = 0, activeDisposedCount = 0;
        if (Array.isArray(vehicleChallanData)) {
          vehicleChallanData.forEach(item => {
            activePendingCount += Array.isArray(item.pending_data) ? item.pending_data.length : 0;
            activeDisposedCount += Array.isArray(item.disposed_data) ? item.disposed_data.length : 0;
          });
        }
        const totalChallans = activePendingCount + activeDisposedCount;
        window._clientActiveChart = new Chart(ctxActive, {
          type: 'pie',
          data: {
            labels: ['Pending', 'Disposed'],
            datasets: [{
              label: 'Active Challans',
              data: [activePendingCount, activeDisposedCount],
              backgroundColor: ['#ffa726', '#66bb6a'],
            }],
          },
          options: {
            plugins: { legend: { display: true } }
          }
        });
        // Challans Fetched (spider/radar chart: pending vs disposed)
        const ctxPaid = chartRefPaid.current.getContext('2d');
        if (window._clientPaidChart) window._clientPaidChart.destroy();
        let pendingCount = 0, disposedCount = 0;
        if (Array.isArray(vehicleChallanData)) {
          vehicleChallanData.forEach(item => {
            pendingCount += Array.isArray(item.pending_data) ? item.pending_data.length : 0;
            disposedCount += Array.isArray(item.disposed_data) ? item.disposed_data.length : 0;
          });
        }
        window._clientPaidChart = new Chart(ctxPaid, {
          type: 'bar',
          data: {
            labels: ['Pending', 'Disposed'],
            datasets: [{
              label: 'Challans',
              data: [pendingCount, disposedCount],
              backgroundColor: ['#ffa726', '#66bb6a'],
              borderColor: ['#ffa726', '#66bb6a'],
              borderWidth: 2,
            }],
          },
          options: {
            plugins: { legend: { display: false } },
            scales: {
              x: { display: true, title: { display: true, text: 'Status' } },
              y: { display: true, beginAtZero: true, title: { display: true, text: 'Count' } }
            }
          }
        });
        // Amount Due (bar) - red: pending, green: paid
        let pendingFine = 0, disposedFine = 0;
        if (Array.isArray(vehicleChallanData)) {
          vehicleChallanData.forEach(item => {
            if (Array.isArray(item.pending_data)) {
              pendingFine += item.pending_data.reduce((sum, c) => sum + (parseFloat(c.fine_imposed) || 0), 0);
            }
            if (Array.isArray(item.disposed_data)) {
              disposedFine += item.disposed_data.reduce((sum, c) => sum + (parseFloat(c.fine_imposed) || 0), 0);
            }
          });
        }
        const ctxAmount = chartRefAmount.current.getContext('2d');
        if (window._clientAmountChart) window._clientAmountChart.destroy();
        window._clientAmountChart = new Chart(ctxAmount, {
          type: 'bar',
          data: {
            labels: ['Pending', 'Paid'],
            datasets: [{
              data: [pendingFine, disposedFine],
              backgroundColor: ['#e15759', '#66bb6a'],
            }],
          },
          options: { plugins: { legend: { display: false } }, scales: { x: { display: true }, y: { display: true, beginAtZero: true } } }
        });
      });
    }, 50); // 50ms delay to ensure DOM is ready
    return () => {
      clearTimeout(timeout);
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

  useEffect(() => {
    if (activeMenu !== "Dashboard") return;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const clientId = user && user.user && (user.user.id || user.user._id || user.user.client_id);
    if (!clientId) return;
    setLoadingVehicleChallan(true);
    setVehicleChallanError("");
    fetch(`${baseUrl}/getvehicleechallandata?clientId=${clientId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setVehicleChallanData(data);
        else if (Array.isArray(data.challans)) setVehicleChallanData(data.challans);
        else setVehicleChallanData([]);
      })
      .catch(() => setVehicleChallanData([]))
      .finally(() => setLoadingVehicleChallan(false));
  }, [activeMenu]);

  // Calculate latestChallanRows for LatestChallansTable
  let latestChallanRows = [];
  if (Array.isArray(vehicleChallanData)) {
    let allChallans = [];
    vehicleChallanData.forEach(item => {
      if (Array.isArray(item.pending_data)) {
        item.pending_data.forEach(c => {
          allChallans.push({ ...c, vehicle_number: item.vehicle_number, statusType: 'Pending' });
        });
      }
      if (Array.isArray(item.disposed_data)) {
        item.disposed_data.forEach(c => {
          allChallans.push({ ...c, vehicle_number: item.vehicle_number, statusType: 'Disposed' });
        });
      }
    });
    // Sort by challan_date_time descending
    allChallans.sort((a, b) => {
      const dateA = new Date(a.challan_date_time);
      const dateB = new Date(b.challan_date_time);
      return dateB - dateA;
    });
    // Take only 5 latest
    const latestChallans = allChallans.slice(0, 5);
    if (latestChallans.length === 0) {
      latestChallanRows = [<tr key="no-challans"><td colSpan={9} style={{textAlign:'center',color:'#888'}}>No challans found.</td></tr>];
    } else {
      latestChallanRows = latestChallans.map((c, idx) => (
        <tr key={`${c.statusType}-${c.vehicle_number}-${c.challan_no}-${idx}`}>
          <td>{c.vehicle_number}</td>
          <td>
            <span title={c.challan_no} style={{cursor:'pointer'}}>
              {c.challan_no && c.challan_no.length > 10 ? c.challan_no.slice(0,10) + '...' : c.challan_no}
            </span>
          </td>
          <td>
            <span title={c.challan_date_time} style={{cursor:'pointer'}}>
              {c.challan_date_time && c.challan_date_time.length > 10 ? c.challan_date_time.slice(0,10) + '...' : c.challan_date_time}
            </span>
          </td>
          <td>
            {/* Google Maps icon logic */}
            {(() => {
              const loc = c.challan_place || c.location || c.challan_location;
              if (loc && typeof loc === 'string' && loc.trim()) {
                const openMap = (address) => {
                  setInfoModal({
                    open: true,
                    message: (
                      <iframe
                        title="Google Maps"
                        width="910"
                        height="500"
                        style={{ border: 0, borderRadius: 12 }}
                        src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
                        allowFullScreen
                      />
                    )
                  });
                };
                return (
                  <span
                    style={{ cursor: 'pointer', color: '#4285F4', fontSize: 24, verticalAlign: 'middle' }}
                    title="View on Google Maps"
                    onClick={() => {
                      // Try original address first
                      const testImg = new window.Image();
                      testImg.src = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(loc)}&zoom=15&size=200x200&key=AIzaSyDUMMYKEY`;
                      testImg.onload = () => openMap(loc);
                      testImg.onerror = () => {
                        // Remove flat/unit from start and retry
                        const simplified = loc.replace(/^([\w-]+,?\s*)/, '');
                        openMap(simplified);
                      };
                      // Fallback: open original immediately (for embed)
                      setTimeout(() => openMap(loc), 500);
                    }}
                  >
                    <i className="ri-map-pin-2-fill" />
                  </span>
                );
              }
              return 'Not Available';
            })()}
          </td>
          <td>{Array.isArray(c.offence_details) && c.offence_details.length > 0 ? c.offence_details[0].act : ''}</td>
          <td style={{ textAlign: "center"}}>{c.fine_imposed}</td>
          <td><span className={c.challan_status === 'Pending' ? 'status pending' : c.challan_status === 'Disposed' ? 'status paid' : ''}>{c.challan_status}</span></td>
          <td>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {Array.isArray(c.offence_details) && c.offence_details.map((o, j) => (
                <li key={j} className="cell-ellipsis" title={o.name}>{o.name}</li>
              ))}
            </ul>
          </td>
          <td style={{ textAlign: "center"}}>
            <button
              className="action-btn flat-btn"
              onClick={() => setSelectedChallan(c)}
            >
              View Challan
            </button>
          </td>
        </tr>
      ));
    }
  }

  return (
    <>
    <ToastContainer position="top-right" autoClose={2000} />
    <div className="admin-dashboard-layout" style={{display: 'flex', width: '100vw', minHeight: '100vh'}}>
      {showLoader && <TrafficLightLoader />}
      <ClientSidebar role={userRole} onMenuClick={handleMenuClick} activeMenu={activeMenu} />
      <main className="main-content admin-home-content" style={{flex: 1, minHeight: '100vh'}}>
        <div className="header" style={{marginBottom: 24}}>
          <div className="header-left" style={{display:'flex',alignItems:'center',gap:16}}>
            <div className="menu-toggle" style={{fontSize:22,cursor:'pointer'}}>
              <i className="ri-menu-line"></i>
            </div>
            <div className="header-title" style={{fontWeight:600,fontSize:20}}>
              {activeMenu === 'Dashboard' ? 'Dashboard'
                : activeMenu === 'Profile' ? 'Profile'
                : activeMenu === 'Registered Vehicles' ? 'Registered Vehicles'
                : activeMenu === 'Challans' ? 'My Challans'
                : activeMenu === 'Billing' ? 'My Billing'
                : activeMenu === 'Settings' ? 'Settings'
                : activeMenu}
            </div>
          </div>
          <div className="header-right" style={{display:'flex',alignItems:'center',gap:18}}>
            <div className="notification-icon" style={{position:'relative',fontSize:22,cursor:'pointer'}}>
              <i className="ri-notification-3-line"></i>
              <div className="notification-badge" style={{position:'absolute',top:-6,right:-8,background:'#e74c3c',color:'#fff',borderRadius:'50%',fontSize:12,padding:'2px 6px',fontWeight:600}}>3</div>
            </div>
            <div className="header-profile" style={{marginLeft:8}}>
              <div className="header-avatar" style={{background:'#0072ff',color:'#fff',borderRadius:'50%',width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:600,fontSize:16}}>{headerInitials || 'JS'}</div>
            </div>
          </div>
        </div>
        {activeMenu === "Dashboard" && (
          <>
            <div className="dashboard-header" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div>
                <h1 className="dashboard-title">Welcome back{user.user && user.user.name ? `, ${user.user.name}` : '123'}!</h1>
                <p>Here's an overview of your challan status</p>
              </div>
              <div className="header-profile">
                <span className="header-avatar">{headerInitials || 'JS'}</span>
              </div>
            </div>
            <div className="dashboard-stats">
              <div className="stat-card">
                <i className="ri-car-line"></i>
                <div>Registered Vehicles</div>
                <div className="stat-value">
                  {loadingClient ? '...' : (clientData && Array.isArray(clientData.vehicles) ? clientData.vehicles.length : 0)}
                </div>
                <div className="stat-chart-container" style={{maxWidth: 160, margin: '12px auto'}}>
                  <canvas ref={chartRefTotal} width={160} height={160} />
                </div>
              </div>
              <div className="stat-card">
                <i className="ri-error-warning-line"></i>
                <div>Active Challans</div>
                <div className="stat-value">
                  {loadingVehicleChallan
                    ? '...'
                    : (() => {
                        let pending = 0, disposed = 0;
                        if (Array.isArray(vehicleChallanData)) {
                          vehicleChallanData.forEach(item => {
                            pending += Array.isArray(item.pending_data) ? item.pending_data.length : 0;
                            disposed += Array.isArray(item.disposed_data) ? item.disposed_data.length : 0;
                          });
                        }
                        return (
                          <>
                            <span style={{color: 'red', fontWeight: 600}}>{pending}</span>
                            {' / '}
                            <span>{disposed}</span>
                          </>
                        );
                      })()
                  }
                </div>
                <div className="stat-chart-container" style={{maxWidth: 160, margin: '12px auto'}}>
                  <canvas ref={chartRefActive} width={160} height={160} />
                </div>
              </div>
              <div className="stat-card">
                <i className="ri-checkbox-circle-line"></i>
                <div>Challans Fetched</div>
                <div className="stat-value">
                  {loadingVehicleChallan
                    ? '...'
                    : Array.isArray(vehicleChallanData)
                      ? vehicleChallanData.reduce((total, item) => {
                          const pending = Array.isArray(item.pending_data) ? item.pending_data.length : 0;
                          const disposed = Array.isArray(item.disposed_data) ? item.disposed_data.length : 0;
                          return total + pending + disposed;
                        }, 0)
                      : 0}
                </div>
                <div className="stat-chart-container" style={{maxWidth: 280, margin: '12px auto'}}>
                  <canvas ref={chartRefPaid} width={280} height={280} />
                </div>
              </div>
              <div className="stat-card">
                <i className="ri-money-rupee-circle-line"></i>
                <div>Challan Amount</div>
                <div className="stat-value">
                  {loadingVehicleChallan
                    ? '...'
                    : (() => {
                        let pendingFine = 0, disposedFine = 0;
                        if (Array.isArray(vehicleChallanData)) {
                          vehicleChallanData.forEach(item => {
                            if (Array.isArray(item.pending_data)) {
                              pendingFine += item.pending_data.reduce((sum, c) => sum + (parseFloat(c.fine_imposed) || 0), 0);
                            }
                            if (Array.isArray(item.disposed_data)) {
                              disposedFine += item.disposed_data.reduce((sum, c) => sum + (parseFloat(c.fine_imposed) || 0), 0);
                            }
                          });
                        }
                        return (
                          <>
                            <span style={{color: 'red', fontWeight: 600}}>Pending: ₹{pendingFine.toLocaleString()}</span>
                            {' | '}
                            <span>Paid: ₹{disposedFine.toLocaleString()}</span>
                          </>
                        );
                      })()
                  }
                </div>
                <div className="stat-chart-container" style={{maxWidth: 160, margin: '12px auto'}}>
                  <canvas ref={chartRefAmount} width={160} height={160} />
                </div>
              </div>
            </div>
            <LatestChallansTable
              latestChallanRows={latestChallanRows}
              loadingVehicleChallan={loadingVehicleChallan}
              vehicleChallanError={vehicleChallanError}
            />
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
                            <div style={{display:'flex',gap:8}}>
                              <button
                                className="action-btn flat-btn"
                                // style={{padding: '12px 32px', fontSize: 18, border: 'none', borderRadius: 6, background: '#f5f5f5', color: '#222', boxShadow: 'none', fontWeight: 600, opacity: status === 'INACTIVE' ? 0.6 : 1, cursor: status === 'INACTIVE' ? 'not-allowed' : 'pointer', transition: 'background 0.2s'}}
                                disabled={rtoLoadingId === (v.id || v._id)}
                                onClick={() => {
                                  if (status === 'INACTIVE') {
                                    setInfoModal({ open: true, message: 'Your vehicle is inactive. Please activate your vehicle to get the RTO data.' });
                                  } else {
                                    setModal({ open: true, action: 'getRTO', vehicle: v });
                                  }
                                }}
                              >
                                {rtoLoadingId === (v.id || v._id) ? 'Loading...' : 'Get RTO Data'}
                              </button>
                              <button
                                className="action-btn flat-btn"
                                // style={{padding: '12px 32px', fontSize: 18, border: 'none', borderRadius: 6, background: '#f5f5f5', color: '#222', boxShadow: 'none', fontWeight: 600, opacity: status === 'INACTIVE' ? 0.6 : 1, cursor: status === 'INACTIVE' ? 'not-allowed' : 'pointer', transition: 'background 0.2s'}}
                                disabled={challanLoadingId === (v.id || v._id)}
                                onClick={() => {
                                  if (status === 'INACTIVE') {
                                    setInfoModal({ open: true, message: 'Your vehicle is inactive. Please activate your vehicle to get the Challan data.' });
                                  } else {
                                    setModal({ open: true, action: 'getChallan', vehicle: v });
                                  }
                                }}
                              >
                                {challanLoadingId === (v.id || v._id) ? 'Loading...' : 'Get Challan Data'}
                              </button>
                            </div>
  {/* Confirmation Modal for RTO/Challan requests */}
  <CustomModal
    open={modal.open}
    title={
      modal.action === 'getRTO' ? 'Are you sure you want to request vehicle RTO data?'
      : modal.action === 'getChallan' ? 'Are you sure you want to request vehicle Challan data?'
      : modal.action === 'inactivate' ? 'Are you sure you want to inactivate this vehicle?'
      : modal.action === 'activate' ? 'Are you sure you want to activate this vehicle?'
      : modal.action === 'delete' ? 'Are you sure you want to delete this vehicle?'
      : modal.action === 'info' ? 'Vehicle Inactive'
      : ''
    }
    onConfirm={handleModalConfirm}
    onCancel={() => setModal({ open: false, action: null, vehicle: null })}
    confirmText={modal.action === 'delete' ? 'Delete' : modal.action === 'activate' ? 'Activate' : modal.action === 'inactivate' ? 'Inactivate' : modal.action === 'info' ? 'OK' : 'Yes'}
    cancelText={modal.action === 'info' ? null : 'Cancel'}
  >
    {modal.action === 'delete' && (
      <span style={{color:'red', fontWeight:600}}>This action is non-reversible.<br/>Your vehicle and all related RTO, challan data will be deleted permanently.</span>
    )}
    {modal.action === 'info' && (
      <span style={{color:'#d35400', fontWeight:500}}>Please activate your vehicle first to get RTO and Challan data.</span>
    )}
  </CustomModal>
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
        {activeMenu === "My Vehicles" && (
          <>
            <MyVehicles />
            <VehicleDataTable clientId={user.user && (user.user.id || user.user._id || user.user.client_id)} />
          </>
        )}
        {activeMenu === "My Challans" && <MyChallans />}
        {activeMenu === "Challans" && <UserChallan />}
        {activeMenu === "My Billing" && <MyBilling clientId={user.user && (user.user.id || user.user._id)} />}
        {activeMenu === "Settings" && <UserSettings users={[]} />}
        {activeMenu === "Driver Verification" && (
          <Suspense fallback={<div>Loading...</div>}>
            <DriverVerification />
          </Suspense>
        )}
        {activeMenu === "Vehicle Fastag" && (
          <Suspense fallback={<div>Loading...</div>}>
            <LazyVehicleFastag />
          </Suspense>
        )}
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
      <CustomModal
        open={!!selectedChallan}
        title={selectedChallan ? `Challan Details: ${selectedChallan.challan_no}` : ''}
        onConfirm={() => setSelectedChallan(null)}
        onCancel={() => setSelectedChallan(null)}
        confirmText="Close"
        cancelText={null}
      >
        {selectedChallan && (
          <div style={{lineHeight:1.7, fontSize:15}}>
            <div><b>Status:</b> {selectedChallan.challan_status}</div>
            <div><b>Vehicle Number:</b> {selectedChallan.vehicle_number}</div>
            <div><b>Challan No:</b> {selectedChallan.challan_no}</div>
            <div><b>Date/Time:</b> {selectedChallan.challan_date_time}</div>
            <div><b>Location:</b> {selectedChallan.challan_place || selectedChallan.location || selectedChallan.challan_location}</div>
            <div><b>Owner Name:</b> {selectedChallan.owner_name}</div>
            <div><b>Driver Name:</b> {selectedChallan.driver_name}</div>
            <div><b>Name of Violator:</b> {selectedChallan.name_of_violator}</div>
            <div><b>Department:</b> {selectedChallan.department}</div>
            <div><b>State Code:</b> {selectedChallan.state_code}</div>
            <div><b>RTO District Name:</b> {selectedChallan.rto_distric_name}</div>
            <div><b>Remark:</b> {selectedChallan.remark}</div>
            <div><b>Document Impounded:</b> {selectedChallan.document_impounded}</div>
            <div><b>Sent to Court On:</b> {selectedChallan.sent_to_court_on}</div>
            <div><b>Sent to Reg Court:</b> {selectedChallan.sent_to_reg_court}</div>
            <div><b>Sent to Virtual Court:</b> {selectedChallan.sent_to_virtual_court}</div>
            <div><b>Court Name:</b> {selectedChallan.court_name}</div>
            <div><b>Court Address:</b> {selectedChallan.court_address}</div>
            <div><b>Date of Proceeding:</b> {selectedChallan.date_of_proceeding}</div>
            <div><b>DL No:</b> {selectedChallan.dl_no}</div>
            {selectedChallan.challan_status === 'Disposed' && (
              <>
                <div><b>Receipt No:</b> {selectedChallan.receipt_no}</div>
                <div><b>Received Amount:</b> {selectedChallan.received_amount}</div>
              </>
            )}
            <div><b>Fine Imposed:</b> {selectedChallan.fine_imposed}</div>
            <div><b>Amount of Fine Imposed:</b> {selectedChallan.amount_of_fine_imposed}</div>
            <div><b>Act:</b> {Array.isArray(selectedChallan.offence_details) && selectedChallan.offence_details.length > 0 ? selectedChallan.offence_details[0].act : ''}</div>
            <div><b>Offence Details:</b>
              <ul style={{margin:0,paddingLeft:18}}>
                {Array.isArray(selectedChallan.offence_details) && selectedChallan.offence_details.map((o, j) => (
                  <li key={j} className="cell-ellipsis" title={o.name}>{o.name}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CustomModal>
    </div>
    </>
  );
}

export default ClientDashboard;
