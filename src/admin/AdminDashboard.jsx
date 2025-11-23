import React, { useState, useEffect, useRef } from "react";
import { getInitials } from "../utils/getInitials";

import "../shared/CommonDashboard.css";
import "./AdminDashboardOverrides.css";
import "./AdminHome.css";
import AdminSidebar from "./AdminSidebar";
import AdminProfile from "./AdminProfile";
import RegisterDealer from "./RegisterDealer";
import RegisterClient from "./RegisterClient";
import RegisterVehicle from "../RegisterVehicle";
import AdminRegisterVehicle from "./AdminRegisterVehicle";
import ClientBillingSettings from "./ClientBillingSettings";
import UserChallan from "../UserChallan";
import DealerSettings from "./DealerSettings";
import CustomModal from "../client/CustomModal";
import AdminSidebarViewer from "./AdminSidebarViewer";
import "./AdminSidebarViewer.css";

import AdminQuickActions from "./AdminQuickActions";


function AdminDashboard() {

  const userRole = "admin";
  const [supportModal, setSupportModal] = useState(false);
  // Sidebar open/close state
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 900);
  const [searchDealer, setSearchDealer] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [dealers, setDealers] = useState([]);
  const [clients, setClients] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loadingAdminData, setLoadingAdminData] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [adminDataError, setAdminDataError] = useState(null);
  // ...existing code...

  // Sidebar for viewing dealer/client details
  const [sidebarViewerOpen, setSidebarViewerOpen] = useState(false);
  const [sidebarViewerTitle, setSidebarViewerTitle] = useState("");
  const [sidebarViewerData, setSidebarViewerData] = useState(null);

  // Toggle dealer status (activate/deactivate)
  function handleToggleDealerStatus(dealer) {
    if (!dealer) return;
    // Here you would call your API to update status, then update state
    const newStatus = dealer.status === 'Active' ? 'Inactive' : 'Active';
    setDealers(prev => prev.map(d => (d.id === dealer.id ? { ...d, status: newStatus } : d)));
  }

  // Toggle client status (activate/deactivate)
  function handleToggleClientStatus(client) {
    if (!client) return;
    // Here you would call your API to update status, then update state
    const newStatus = client.status === 'Active' ? 'Inactive' : 'Active';
    setClients(prev => prev.map(c => (c.id === client.id ? { ...c, status: newStatus } : c)));
  }

  function handleViewDealer(dealer) {
    // Remove unwanted fields and transform meta
    if (!dealer) return;
    const {
      updated_at,
      admin_id,
      dealer_id,
      client_id,
      created_at,
      meta = {},
      ...rest
    } = dealer;
    // Flatten meta except id/user_id
    const { id: metaId, user_id: metaUserId, ...metaRest } = meta || {};
    // Compose new object
    const filtered = {
      ...rest,
      ...metaRest,
      'Member Since': created_at ? new Date(created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : undefined,
    };
    // Remove undefined/null fields
    Object.keys(filtered).forEach(k => (filtered[k] === undefined || filtered[k] === null) && delete filtered[k]);
    setSidebarViewerTitle("Dealer Details");
    setSidebarViewerData(filtered);
    setSidebarViewerOpen(true);
  }
  function handleViewClient(client) {
    // Remove unwanted fields and transform meta
    if (!client) return;
    const {
      updated_at,
      admin_id,
      dealer_id,
      client_id,
      created_at,
      meta = {},
      ...rest
    } = client;
    // Flatten meta except id/user_id
    const { id: metaId, user_id: metaUserId, ...metaRest } = meta || {};
    // Compose new object
    const filtered = {
      ...rest,
      ...metaRest,
      'Member Since': created_at ? new Date(created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : undefined,
    };
    // Remove undefined/null fields
    Object.keys(filtered).forEach(k => (filtered[k] === undefined || filtered[k] === null) && delete filtered[k]);
    setSidebarViewerTitle("Client Details");
    setSidebarViewerData(filtered);
    setSidebarViewerOpen(true);
  }
  function handleCloseSidebarViewer() {
    setSidebarViewerOpen(false);
    setSidebarViewerData(null);
    setSidebarViewerTitle("");
  }
  const chartRef = useRef(null); // Dealers by State
  const chartRefCity = useRef(null); // Dealers by City
  const chartRefCountry = useRef(null); // Dealers by Country
  const chartRef2 = useRef(null); // Clients by Status
  const chartRef3 = useRef(null); // Vehicles by Type
  const chartRef4 = useRef(null); // Challans Settled

  const filteredDealers = Array.isArray(dealers) ? dealers.filter(d => {
    if (!d) return false;
    let matchesSearch = true;
    let matchesStatus = true;
    if (searchDealer) {
      const s = searchDealer.toLowerCase();
      matchesSearch = (d.name && d.name.toLowerCase().includes(s)) ||
        (d.dealer_name && d.dealer_name.toLowerCase().includes(s)) ||
        (d.phone && d.phone.toLowerCase().includes(s)) ||
        (d.mobile && d.mobile.toLowerCase().includes(s)) ||
        (d.email && d.email.toLowerCase().includes(s));
    }
    if (statusFilter) {
      matchesStatus = d.status && d.status.toLowerCase() === statusFilter.toLowerCase();
    }
    return matchesSearch && matchesStatus;
  }) : [];

  // Get user info from localStorage
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('sc_user')) || {};
    } catch {
      return {};
    }
  })();

  // Fetch admin data (dealers, clients, vehicles) only once on mount
  useEffect(() => {
    const adminId = user.user && user.user.id;
    if (!adminId) return;
    let loaderTimeout;
    const fetchAdminData = async () => {
      setLoadingAdminData(true);
      setShowLoader(true);
      setAdminDataError(null);
      const minLoaderTime = 3000;
      const start = Date.now();
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
        const url = `${baseUrl}/admindata/${adminId}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        setDealers(Array.isArray(data.dealers) ? data.dealers : []);
        setClients(Array.isArray(data.clients) ? data.clients : []);
        setVehicles(Array.isArray(data.vehicles) ? data.vehicles : []);
      } catch (err) {
        setAdminDataError(err.message || "Failed to fetch admin data");
        setDealers([]); setClients([]); setVehicles([]);
      } finally {
        setLoadingAdminData(false);
        const elapsed = Date.now() - start;
        if (elapsed < minLoaderTime) {
          loaderTimeout = setTimeout(() => setShowLoader(false), minLoaderTime - elapsed);
        } else {
          setShowLoader(false);
        }
      }
    };
    fetchAdminData();
    return () => { if (loaderTimeout) clearTimeout(loaderTimeout); };
    // eslint-disable-next-line
  }, []);

  // Draw pie chart for dealers by city
  useEffect(() => {
    if (showLoader) return; // Don't draw chart while loader is visible
    if (!Array.isArray(dealers) || dealers.length === 0) return;
    if (!chartRef.current) return;
    import('chart.js/auto').then(({ default: Chart }) => {
      const ctx = chartRef.current.getContext('2d');
      ctx.clearRect(0, 0, chartRef.current.width, chartRef.current.height);
      // Count dealers by city
      const cityCounts = {};
      dealers.filter(Boolean).forEach(d => {
        const city = d.meta && d.meta.city ? d.meta.city : 'Unknown';
        cityCounts[city] = (cityCounts[city] || 0) + 1;
      });
      const data = {
        labels: Object.keys(cityCounts),
        datasets: [{
          data: Object.values(cityCounts),
          backgroundColor: [
            '#42a5f5', '#66bb6a', '#ffa726', '#ab47bc', '#bdbdbd', '#ffb74d', '#90caf9', '#a5d6a7',
          ],
        }],
      };
      if (window._dealersPieChart) window._dealersPieChart.destroy();
      window._dealersPieChart = new Chart(ctx, {
        type: 'pie',
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { display: false },
          },
        },
      });
    });
    return () => {
      if (window._dealersPieChart) window._dealersPieChart.destroy();
    };
  }, [dealers, chartRef, showLoader]);

  // Pie chart for dealers by city
  useEffect(() => {
    if (!Array.isArray(dealers) || dealers.length === 0) return;
    if (!chartRefCity.current) return;
    import('chart.js/auto').then(({ default: Chart }) => {
      const ctx = chartRefCity.current.getContext('2d');
      ctx.clearRect(0, 0, chartRefCity.current.width, chartRefCity.current.height);
      const cityCounts = {};
      dealers.filter(Boolean).forEach(d => {
        const city = d.meta && d.meta.city ? d.meta.city : 'Unknown';
        cityCounts[city] = (cityCounts[city] || 0) + 1;
      });
      const data = {
        labels: Object.keys(cityCounts),
        datasets: [{
          data: Object.values(cityCounts),
          backgroundColor: [
            '#42a5f5', '#66bb6a', '#ffa726', '#ab47bc', '#bdbdbd', '#ffb74d', '#90caf9', '#a5d6a7',
          ],
        }],
      };
      if (window._dealersCityPieChart) window._dealersCityPieChart.destroy();
      window._dealersCityPieChart = new Chart(ctx, {
        type: 'pie',
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { display: false },
          },
        },
      });
    });
    return () => {
      if (window._dealersCityPieChart) window._dealersCityPieChart.destroy();
    };
  }, [dealers, chartRefCity]);

  // Pie chart for dealers by country
  useEffect(() => {
    if (!Array.isArray(dealers) || dealers.length === 0) return;
    if (!chartRefCountry.current) return;
    import('chart.js/auto').then(({ default: Chart }) => {
      const ctx = chartRefCountry.current.getContext('2d');
      ctx.clearRect(0, 0, chartRefCountry.current.width, chartRefCountry.current.height);
      const countryCounts = {};
      dealers.filter(Boolean).forEach(d => {
        const country = d.meta && d.meta.country ? d.meta.country : 'Unknown';
        countryCounts[country] = (countryCounts[country] || 0) + 1;
      });
      const data = {
        labels: Object.keys(countryCounts),
        datasets: [{
          data: Object.values(countryCounts),
          backgroundColor: [
            '#ff6384', '#36a2eb', '#ffce56', '#8bc34a', '#b39ddb', '#ffb74d', '#90caf9', '#a5d6a7',
          ],
        }],
      };
      if (window._dealersCountryPieChart) window._dealersCountryPieChart.destroy();
      window._dealersCountryPieChart = new Chart(ctx, {
        type: 'pie',
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { display: false },
          },
        },
      });
    });
    return () => {
      if (window._dealersCountryPieChart) window._dealersCountryPieChart.destroy();
    };
  }, [dealers, chartRefCountry]);

  // Draw pie chart for clients by state
  useEffect(() => {
    if (!Array.isArray(clients) || clients.length === 0) return;
    if (!chartRef2.current) return;
    import('chart.js/auto').then(({ default: Chart }) => {
      const ctx = chartRef2.current.getContext('2d');
      ctx.clearRect(0, 0, chartRef2.current.width, chartRef2.current.height);
      // Count clients by state (using meta.state)
      const stateCounts = {};
      clients.filter(Boolean).forEach(c => {
        const state = c.meta && c.meta.state ? c.meta.state : 'Unknown';
        stateCounts[state] = (stateCounts[state] || 0) + 1;
      });
      const data = {
        labels: Object.keys(stateCounts),
        datasets: [{
          data: Object.values(stateCounts),
          backgroundColor: [
            '#ff6384', '#36a2eb', '#ffce56', '#8bc34a', '#b39ddb', '#ffb74d', '#90caf9', '#a5d6a7',
          ],
        }],
      };
      if (window._clientsPieChart) window._clientsPieChart.destroy();
      window._clientsPieChart = new Chart(ctx, {
        type: 'doughnut',
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { display: false },
          },
        },
      });
    });
    return () => {
      if (window._clientsPieChart) window._clientsPieChart.destroy();
    };
  }, [clients]);

  // Draw radial (polar area) chart for vehicles by status (active, inactive, deleted)
  useEffect(() => {
    if (!Array.isArray(vehicles) || vehicles.length === 0) return;
    if (!chartRef3.current) return;
    import('chart.js/auto').then(({ default: Chart }) => {
      const ctx = chartRef3.current.getContext('2d');
      ctx.clearRect(0, 0, chartRef3.current.width, chartRef3.current.height);
      // Count vehicles by status
      const statusCounts = { Active: 0, Inactive: 0, Deleted: 0 };
      vehicles.forEach(v => {
        let status = (v.status || '').toLowerCase();
        if (status === 'active') statusCounts.Active++;
        else if (status === 'inactive') statusCounts.Inactive++;
        else if (status === 'deleted') statusCounts.Deleted++;
        else statusCounts.Inactive++;
      });
      const data = {
        labels: ['Active', 'Inactive', 'Deleted'],
        datasets: [{
          data: [statusCounts.Active, statusCounts.Inactive, statusCounts.Deleted],
          backgroundColor: [
            '#66bb6a', '#ffa726', '#e15759',
          ],
        }],
      };
      if (window._vehiclesRadialChart) window._vehiclesRadialChart.destroy();
      window._vehiclesRadialChart = new Chart(ctx, {
        type: 'polarArea',
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { display: false },
          },
        },
      });
    });
    return () => {
      if (window._vehiclesRadialChart) window._vehiclesRadialChart.destroy();
    };
  }, [vehicles]);

  // Draw column (bar) chart for sample data in last stat-card
  useEffect(() => {
    if (!chartRef4.current) return;
    import('chart.js/auto').then(({ default: Chart }) => {
      const ctx = chartRef4.current.getContext('2d');
      ctx.clearRect(0, 0, chartRef4.current.width, chartRef4.current.height);
      // Sample data for Challans Settled (radial chart)
      const data = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Challans Settled',
          data: [1200, 1500, 1100, 1800, 1700, 2000],
          backgroundColor: [
            '#42a5f5', '#66bb6a', '#ffa726', '#ab47bc', '#bdbdbd', '#ffb74d'
          ],
        }],
      };
      if (window._challansBarChart) window._challansBarChart.destroy();
      window._challansBarChart = new Chart(ctx, {
        type: 'polarArea',
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { display: false },
          },
        },
      });
    });
    return () => {
      if (window._challansBarChart) window._challansBarChart.destroy();
    };
  }, []);

  // Sidebar click handler
  const handleMenuClick = (label) => {
    setActiveMenu(label);
    // Close sidebar on mobile after menu selection
    if (window.innerWidth <= 900) setSidebarOpen(false);
  };
  
  const toggleSidebar = () => setSidebarOpen(s => !s);

  console.log('dasdasdad', dealers);
  // Quick Action handlers
  const handleQuickAddDealer = () => setActiveMenu('Register Dealer');
  const handleQuickAddClient = () => setActiveMenu('Register Client');

  // Toggle dealer status (activate/deactivate)
  function handleToggleDealerStatus(dealer) {
    if (!dealer) return;
    // Here you would call your API to update status, then update state
    const newStatus = dealer.status === 'Active' ? 'Inactive' : 'Active';
    setDealers(prev => prev.map(d => (d.id === dealer.id ? { ...d, status: newStatus } : d)));
  }

  // Toggle client status (activate/deactivate)
  function handleToggleClientStatus(client) {
    if (!client) return;
    // Here you would call your API to update status, then update state
    const newStatus = client.status === 'Active' ? 'Inactive' : 'Active';
    setClients(prev => prev.map(c => (c.id === client.id ? { ...c, status: newStatus } : c)));
  }

  return (
    <div className={`dashboard-layout ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
      {sidebarOpen && window.innerWidth <= 900 && (
        <div className="sidebar-overlay show" onClick={() => setSidebarOpen(false)} />
      )}
      {(sidebarOpen || window.innerWidth <= 900) && (
        <AdminSidebar role={userRole} onMenuClick={handleMenuClick} activeMenu={activeMenu} sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
      )}
      <main className="main-content admin-home-content" style={{flex: 1, minHeight: '100vh', transition: 'all 0.35s cubic-bezier(.4,1.3,.5,1)', WebkitTransition: 'all 0.35s cubic-bezier(.4,1.3,.5,1)'}}>
        <AdminQuickActions
          sticky={true}
          onAddDealer={() => setActiveMenu('Register Dealer')}
          onAddClient={() => setActiveMenu('Register Client')}
          onAddVehicle={() => setActiveMenu('Register Vehicle')}
          onReports={() => setActiveMenu('Settings')}
          onContact={() => setSupportModal(true)}
        />
        <div className="header" style={{marginBottom: 24}}>
          <div className="header-left" style={{display:'flex',alignItems:'center',gap:16}}>
            <div className="menu-toggle" style={{fontSize:22,cursor:'pointer'}} onClick={toggleSidebar}>
              <i className="ri-menu-line"></i>
            </div>
            <div className="header-title" style={{fontWeight:600}}>
              {activeMenu === 'Dashboard' ? 'Admin Dashboard' : activeMenu}
            </div>
          </div>
          <div className="header-right" style={{display:'flex',alignItems:'center',gap:18,cursor:'pointer'}} onClick={() => setActiveMenu('Profile')} role="button" aria-label="Open profile">
            <button className="header-more" title="Hide / Show sidebar" onClick={(e)=>{ e.stopPropagation(); setSidebarOpen(s => !s); }} style={{background:'transparent',border:'none',cursor:'pointer',color:'#333',fontSize:20}}>
              <i className="ri-more-2-fill" />
            </button>
            {(() => {
              let headerInitials = 'JS';
              try {
                const userObj = JSON.parse(localStorage.getItem('sc_user'));
                if (userObj && userObj.user && userObj.user.name) {
                  const nameParts = userObj.user.name.trim().split(/\s+/);
                  if (nameParts.length >= 2) {
                    headerInitials = (nameParts[0][0] + nameParts[1][0]).toUpperCase();
                  } else {
                    headerInitials = userObj.user.name.substring(0,2).toUpperCase();
                  }
                }
              } catch {}
              return (
                <div className="header-profile" style={{marginLeft:8}}>
                  <div className="header-avatar" style={{background:'#0072ff',color:'#fff',borderRadius:'50%',width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:600,fontSize:16}}>{headerInitials}</div>
                </div>
              );
            })()}
          </div>
        </div>
        {/* Stat Cards and Dashboard Graphs */}
        {activeMenu === 'Dashboard' && (
          <>
            <div className="dashboard-header">
              <h1 className="page-title">Welcome, {user.user && user.user.name ? user.user.name : 'Admin'}
                <span style={{marginLeft:8, background:'#eee', borderRadius:'50%', padding:'4px 10px', fontWeight:'bold', fontSize:18, color:'#555'}}>
                  {getInitials(user.user && user.user.name ? user.user.name : 'A')}
                </span>
              </h1>
              <p className="page-subtitle">Here's an overview of your challan status</p>
            </div>
            <div className="dashboard-stats">
              <div className="stat-card">
                <i className="ri-file-list-3-line"></i>
                <div>Smart Dealers</div>
                <div style={{position:'relative', width:'100%'}}>
                  <div style={{display: showLoader ? 'flex' : 'none', justifyContent:'center',alignItems:'center',height:'100%', minHeight:120, width:'100%', position:'absolute', top:0, left:0, right:0, bottom:0, zIndex:2, background:'white'}}>
                    <div className="bar-loader">
                      <div></div><div></div><div></div><div></div><div></div>
                    </div>
                  </div>
                  <div style={{display: showLoader ? 'none' : 'block', width:'100%'}}>
                    <div className="stat-value">{Array.isArray(dealers) ? dealers.length : 0}</div>
                    <div className="stat-chart-container">
                      <canvas ref={chartRef} width={220} height={180} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <i className="ri-error-warning-line"></i>
                <div>Happy Clients</div>
                <div style={{position:'relative', width:'100%'}}>
                  <div style={{display: showLoader ? 'flex' : 'none', justifyContent:'center',alignItems:'center',height:'100%', minHeight:120, width:'100%', position:'absolute', top:0, left:0, right:0, bottom:0, zIndex:2, background:'white'}}>
                    <div className="bar-loader">
                      <div></div><div></div><div></div><div></div><div></div>
                    </div>
                  </div>
                  <div style={{display: showLoader ? 'none' : 'block', width:'100%'}}>
                    <div className="stat-value">{Array.isArray(clients) ? clients.length : 0}</div>
                    <div className="stat-chart-container">
                      <canvas ref={chartRef2} width={220} height={180} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <i className="ri-car-line"></i>
                <div>Registered Vehicles</div>
                <div style={{position:'relative', width:'100%'}}>
                  <div style={{display: showLoader ? 'flex' : 'none', justifyContent:'center',alignItems:'center',height:'100%', minHeight:120, width:'100%', position:'absolute', top:0, left:0, right:0, bottom:0, zIndex:2, background:'white'}}>
                    <div className="bar-loader">
                      <div></div><div></div><div></div><div></div><div></div>
                    </div>
                  </div>
                  <div style={{display: showLoader ? 'none' : 'block', width:'100%'}}>
                    <div className="stat-value">{Array.isArray(vehicles) ? vehicles.length : 0}</div>
                    <div className="stat-chart-container">
                      <canvas ref={chartRef3} width={220} height={180} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <i className="ri-money-rupee-circle-line"></i>
                <div>Challans Received</div>
                <div className="stat-value">₹3,250</div>
                <div className="stat-chart-container">
                  <canvas ref={chartRef4} width={220} height={180} />
                </div>
              </div>
            </div>
            {/* Dealer Table (updated to match client dashboard) */}
            {/* Dealer Table (updated to match client dashboard) */}
            <div className="dashboard-latest" style={{marginBottom: 32}}>
              <div className="latest-header">
                <h2>Dealer Network</h2>
              </div>
              <div className="table-container">
                <table className="latest-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Clients</th>
                      <th>Vehicles</th>
                      <th>Status</th>
                      <th>View</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(dealers) && dealers.length > 0 ? (
                      dealers.map((dealer, idx) => {
                        const totalClients = Array.isArray(clients)
                          ? clients.filter(c => {
                              const cDealerId = c.dealer_id && typeof c.dealer_id === 'object' ? c.dealer_id.id || c.dealer_id._id : c.dealer_id;
                              const dId = dealer.id || dealer._id || dealer.email;
                              return String(cDealerId) === String(dId);
                            }).length
                          : '-';
                        const totalVehicles = Array.isArray(vehicles)
                          ? vehicles.filter(v => {
                              const vDealerId = v.dealer_id && typeof v.dealer_id === 'object' ? v.dealer_id.id || v.dealer_id._id : v.dealer_id;
                              const dId = dealer.id || dealer._id || dealer.email;
                              return String(vDealerId) === String(dId);
                            }).length
                          : '-';
                        return (
                          <tr key={dealer.id || idx}>
                            <td>{dealer.name || dealer.dealer_name || '-'}</td>
                            <td>{dealer.meta && dealer.meta.phone ? dealer.meta.phone : (dealer.phone || dealer.mobile || '-')}</td>
                            <td>{dealer.email || '-'}</td>
                            <td>{totalClients}</td>
                            <td>{totalVehicles}</td>
                            <td><span className={`status ${dealer.status ? dealer.status.toLowerCase() : ''}`}>{dealer.status || '-'}</span></td>
                            <td>
                              <button
                                className="action-btn"
                                style={{
                                  padding: '6px 14px',
                                  fontSize: 14,
                                  border: '1.5px solid #b3b3b3',
                                  background: '#fff',
                                  color: '#333',
                                  borderRadius: 6,
                                  fontWeight: 500,
                                  boxShadow: 'none',
                                  transition: 'background 0.15s, color 0.15s, border 0.15s',
                                  cursor: 'pointer',
                                }}
                                onMouseOver={e => {
                                  e.currentTarget.style.background = '#f5f7fa';
                                  e.currentTarget.style.color = '#1976d2';
                                  e.currentTarget.style.borderColor = '#1976d2';
                                }}
                                onMouseOut={e => {
                                  e.currentTarget.style.background = '#fff';
                                  e.currentTarget.style.color = '#333';
                                  e.currentTarget.style.borderColor = '#b3b3b3';
                                }}
                                onClick={() => handleViewDealer(dealer)}
                              >
                                View Dealer
                              </button>
                            </td>
                            <td>
                              <button
                                className="action-btn"
                                style={{padding: '6px 14px', fontSize: 14, background: dealer.status === 'Active' ? '#e74c3c' : '#43e97b', color: '#fff'}}
                                onClick={() => handleToggleDealerStatus(dealer)}
                              >
                                {(dealer.status && dealer.status.toLowerCase() === 'active') ? (
                                  <i className="ri-lock-line" title="Inactivate" aria-label="Inactivate" style={{fontSize:18, verticalAlign:'middle', color:'#e74c3c'}}></i>
                                ) : (
                                  <i className="ri-lock-unlock-line" title="Activate" aria-label="Activate" style={{fontSize:18, verticalAlign:'middle'}}></i>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan={8}>No dealers found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Client Table (updated to match client dashboard) */}
            <div className="dashboard-latest" style={{marginBottom: 32}}>
              <div className="latest-header">
                <h2>Client Network</h2>
              </div>
              <div className="table-container">
                <table className="latest-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Dealer</th>
                      <th>Vehicles</th>
                      <th>Status</th>
                      <th>View</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(clients) && clients.length > 0 ? (
                      clients.map((client, idx) => {
                        const dealerName = (() => {
                          if (!client.dealer_id) return '-';
                          if (typeof client.dealer_id === 'object') {
                            return client.dealer_id.name || client.dealer_id.dealer_name || client.dealer_id.email || '-';
                          }
                          const found = Array.isArray(dealers) ? dealers.find(d => (d.id || d._id || d.email) === client.dealer_id) : null;
                          return found ? (found.name || found.dealer_name || found.email) : '-';
                        })();
                        const totalVehicles = Array.isArray(vehicles)
                          ? vehicles.filter(v => {
                              const vClientId = v.client_id && typeof v.client_id === 'object' ? v.client_id.id || v.client_id._id : v.client_id;
                              const cId = client.id || client._id || client.email;
                              return String(vClientId) === String(cId);
                            }).length
                          : '-';
                        return (
                          <tr key={client.id || idx}>
                            <td>{client.name || client.client_name || '-'}</td>
                            <td>{client.meta && client.meta.phone ? client.meta.phone : (client.phone || client.mobile || '-')}</td>
                            <td>{client.email || '-'}</td>
                            <td>{dealerName}</td>
                            <td>{totalVehicles}</td>
                            <td><span className={`status ${client.status ? client.status.toLowerCase() : ''}`}>{client.status || '-'}</span></td>
                            <td>
                              <button
                                className="action-btn"
                                style={{
                                  padding: '6px 14px',
                                  fontSize: 14,
                                  border: '1.5px solid #b3b3b3',
                                  background: '#fff',
                                  color: '#333',
                                  borderRadius: 6,
                                  fontWeight: 500,
                                  boxShadow: 'none',
                                  transition: 'background 0.15s, color 0.15s, border 0.15s',
                                  cursor: 'pointer',
                                }}
                                onMouseOver={e => {
                                  e.currentTarget.style.background = '#f5f7fa';
                                  e.currentTarget.style.color = '#1976d2';
                                  e.currentTarget.style.borderColor = '#1976d2';
                                }}
                                onMouseOut={e => {
                                  e.currentTarget.style.background = '#fff';
                                  e.currentTarget.style.color = '#333';
                                  e.currentTarget.style.borderColor = '#b3b3b3';
                                }}
                                onClick={() => handleViewClient(client)}
                              >
                                View Client
                              </button>
                            </td>
                            <td>
                              <button
                                className="action-btn"
                                style={{padding: '6px 14px', fontSize: 14, background: client.status === 'Active' ? '#e74c3c' : '#43e97b', color: '#fff'}}
                                onClick={() => handleToggleClientStatus(client)}
                              >
                                {(client.status && client.status.toLowerCase() === 'active') ? (
                                  <i className="ri-lock-line" title="Inactivate" aria-label="Inactivate" style={{fontSize:18, verticalAlign:'middle', color:'#e74c3c'}}></i>
                                ) : (
                                  <i className="ri-lock-unlock-line" title="Activate" aria-label="Activate" style={{fontSize:18, verticalAlign:'middle'}}></i>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan={8}>No clients found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        {activeMenu === "Profile" && (
          <AdminProfile />
        )}
        {activeMenu === "Register Dealer" && (
          <RegisterDealer />
        )}
        {activeMenu === "Register Client" && (
          <RegisterClient dealers={dealers} />
        )}
        {activeMenu === "Challans" && (
          <UserChallan />
        )}
        {activeMenu === "Register Vehicle" && (
          <AdminRegisterVehicle dealers={dealers} clients={clients} vehicles={vehicles} />
        )}
        {activeMenu === "Settings" && (
          <>
            <DealerSettings dealers={dealers} />
            <ClientBillingSettings clients={clients} />
          </>
        )}
  <AdminSidebarViewer open={sidebarViewerOpen} onClose={handleCloseSidebarViewer} title={sidebarViewerTitle} data={sidebarViewerData} />
  </main>
    </div>
  );
}

export default AdminDashboard;
