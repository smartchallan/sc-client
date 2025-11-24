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
import CustomConfirmModal from "./CustomConfirmModal";
import "./CustomConfirmModal.css";
import AdminSidebarViewer from "./AdminSidebarViewer";
import "./AdminSidebarViewer.css";

import AdminQuickActions from "./AdminQuickActions";


function AdminDashboard() {

  // Handler to close the custom confirm modal
  const handleCancelConfirmModal = () => setConfirmModal(m => ({ ...m, open: false }));

  // State for custom confirm modal
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
  });

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
  const [vehicleCounts, setVehicleCounts] = useState({ Active: 0, Inactive: 0, Deleted: 0 });
  const [dealerCounts, setDealerCounts] = useState({ Active: 0, Inactive: 0 });
  const [clientCounts, setClientCounts] = useState({ Active: 0, Inactive: 0 });
  const [rawAdminData, setRawAdminData] = useState(null); // For debugging
  const [loadingAdminData, setLoadingAdminData] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [adminDataError, setAdminDataError] = useState(null);
  // ...existing code...

  // Sidebar for viewing dealer/client details
  const [sidebarViewerOpen, setSidebarViewerOpen] = useState(false);
  const [sidebarViewerTitle, setSidebarViewerTitle] = useState("");
  const [sidebarViewerData, setSidebarViewerData] = useState(null);

  // --- Client search and filter state ---
  const [searchClient, setSearchClient] = useState("");
  const [dealerFilter, setDealerFilter] = useState("");

  // --- Filtered clients for table ---
  const filteredClients = Array.isArray(clients) ? clients.filter(c => {
    let matchesSearch = true;
    let matchesDealer = true;
    if (searchClient) {
      const s = searchClient.toLowerCase();
      matchesSearch = (c.name && c.name.toLowerCase().includes(s)) ||
        (c.client_name && c.client_name.toLowerCase().includes(s)) ||
        (c.phone && c.phone.toLowerCase().includes(s)) ||
        (c.mobile && c.mobile.toLowerCase().includes(s)) ||
        (c.email && c.email.toLowerCase().includes(s));
    }
    if (dealerFilter) {
      let cDealerId = c.dealer_id;
      if (typeof cDealerId === 'object') cDealerId = cDealerId.id || cDealerId._id || cDealerId.email;
      matchesDealer = String(cDealerId) === String(dealerFilter);
    }
    return matchesSearch && matchesDealer;
  }) : [];

  // Toggle dealer status (activate/deactivate)
  function handleToggleDealerStatus(dealer) {
  if (!dealer) return;
  const isActive = String(dealer.status).toLowerCase() === 'active';
  const newStatus = isActive ? 'inactive' : 'active';
  const userId = dealer.id || dealer._id;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const confirmMsg = isActive
    ? 'Are you sure you want to deactivate this dealer?'
    : 'Are you sure you want to activate this dealer?';
  setConfirmModal({
    open: true,
    title: 'Confirm Status Change',
    message: confirmMsg,
    onConfirm: () => {
      setConfirmModal(m => ({ ...m, open: false }));
      fetch(`${baseUrl}/userprofile/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, status: newStatus })
      })
        .then(async res => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Failed to update status');
          setDealers(prev => prev.map(d => (d.id === dealer.id ? { ...d, status: newStatus } : d)));
          if (window.toast) window.toast.success(data.message || 'Status updated successfully!');
          else if (typeof toast !== 'undefined') toast.success(data.message || 'Status updated successfully!');
        })
        .catch(err => {
          if (window.toast) window.toast.error(err.message || 'Failed to update status');
          else if (typeof toast !== 'undefined') toast.error(err.message || 'Failed to update status');
        });
    },
  });
  }

  // Toggle client status (activate/deactivate)
  function handleToggleClientStatus(client) {
  if (!client) return;
  const isActive = String(client.status).toLowerCase() === 'active';
  const newStatus = isActive ? 'inactive' : 'active';
  const userId = client.id || client._id;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const confirmMsg = isActive
    ? 'Are you sure you want to deactivate this client?'
    : 'Are you sure you want to activate this client?';
  setConfirmModal({
    open: true,
    title: 'Confirm Status Change',
    message: confirmMsg,
    onConfirm: () => {
      setConfirmModal(m => ({ ...m, open: false }));
      fetch(`${baseUrl}/userprofile/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, status: newStatus })
      })
        .then(async res => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Failed to update status');
          setClients(prev => prev.map(c => (c.id === client.id ? { ...c, status: newStatus } : c)));
          if (window.toast) window.toast.success(data.message || 'Status updated successfully!');
          else if (typeof toast !== 'undefined') toast.success(data.message || 'Status updated successfully!');
        })
        .catch(err => {
          if (window.toast) window.toast.error(err.message || 'Failed to update status');
          else if (typeof toast !== 'undefined') toast.error(err.message || 'Failed to update status');
        });
    },
  });
  // Render custom confirm modal
  const handleCancelConfirmModal = () => setConfirmModal(m => ({ ...m, open: false }));
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

  // Fetch admin data (dealers, clients, vehicles) on mount and when returning to Dashboard
  const fetchAdminData = React.useCallback(async () => {
    const adminId = user.user && user.user.id;
    if (!adminId) return;
    setLoadingAdminData(true);
    setShowLoader(true);
    setAdminDataError(null);
    const minLoaderTime = 3000;
    const start = Date.now();
    let loaderTimeout;
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const url = `${baseUrl}/admindata/${adminId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      console.log('[AdminDashboard] /admindata API response:', data);
      setRawAdminData(data); // For debugging
      setDealers(Array.isArray(data.dealers) ? data.dealers : []);
      setClients(Array.isArray(data.clients) ? data.clients : []);
      setVehicles(Array.isArray(data.vehicles) ? data.vehicles : []);
      // Aggregate dealer status counts
      if (Array.isArray(data.dealers)) {
        const dCounts = { Active: 0, Inactive: 0 };
        data.dealers.forEach(d => {
          const status = (d.status || '').toLowerCase();
          if (status === 'active') dCounts.Active++;
          else if (status === 'inactive') dCounts.Inactive++;
        });
        setDealerCounts(dCounts);
      }
      // Aggregate client status counts
      if (Array.isArray(data.clients)) {
        const cCounts = { Active: 0, Inactive: 0 };
        data.clients.forEach(c => {
          const status = (c.status || '').toLowerCase();
          if (status === 'active') cCounts.Active++;
          else if (status === 'inactive') cCounts.Inactive++;
        });
        setClientCounts(cCounts);
      }
      // Aggregate vehicle_counts from all clients
      if (Array.isArray(data.clients)) {
        const counts = { Active: 0, Inactive: 0, Deleted: 0 };
        data.clients.forEach(c => {
          if (c.vehicle_counts) {
            // Map possible keys to expected casing
            Object.entries(c.vehicle_counts).forEach(([k, v]) => {
              let key = k.toLowerCase();
              if (key === 'active') counts.Active += Number(v) || 0;
              else if (key === 'inactive') counts.Inactive += Number(v) || 0;
              else if (key === 'deleted') counts.Deleted += Number(v) || 0;
            });
          }
        });
        console.log('[AdminDashboard] Aggregated vehicle_counts from clients:', counts);
        setVehicleCounts(counts);
      }
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
    return () => { if (loaderTimeout) clearTimeout(loaderTimeout); };
  }, [user.user]);

  // On mount, fetch admin data
  useEffect(() => {
    fetchAdminData();
    // eslint-disable-next-line
  }, []);

  // Refetch admin data when returning to Dashboard tab
  useEffect(() => {
    if (activeMenu === 'Dashboard') {
      fetchAdminData();
    }
    // eslint-disable-next-line
  }, [activeMenu]);

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

  // Draw pie chart for vehicles by status (active, inactive, deleted)
  useEffect(() => {
    if (!chartRef3.current) return;
    import('chart.js/auto').then(({ default: Chart }) => {
      const ctx = chartRef3.current.getContext('2d');
      ctx.clearRect(0, 0, chartRef3.current.width, chartRef3.current.height);
      const data = {
        labels: ['Active', 'Inactive', 'Deleted'],
        datasets: [{
          data: [vehicleCounts.Active, vehicleCounts.Inactive, vehicleCounts.Deleted],
          backgroundColor: ['#66bb6a', '#ffa726', '#e15759'],
        }],
      };
      if (window._vehiclesPieChart) window._vehiclesPieChart.destroy();
      window._vehiclesPieChart = new Chart(ctx, {
        type: 'pie',
        data,
        options: {
          responsive: false,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { display: false },
          },
        },
      });
    });
    return () => {
      if (window._vehiclesPieChart) window._vehiclesPieChart.destroy();
    };
  }, [vehicleCounts]);

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



  return (
    <>
      <CustomConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={handleCancelConfirmModal}
      />
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
                {/* <span style={{marginLeft:8, background:'#eee', borderRadius:'50%', padding:'4px 10px', fontWeight:'bold', fontSize:18, color:'#555'}}>
                  {getInitials(user.user && user.user.name ? user.user.name : 'A')}
                </span> */}
              </h1>
              {/* <p className="page-subtitle">Here's an overview of your challan status</p> */}
            </div>
            <div className="dashboard-stats">
              <div className="stat-card">
                <i className="ri-file-list-3-line"></i>
                <div>Smart Dealers <span style={{fontWeight:700, color:'#fff', fontSize:22, marginLeft:8, verticalAlign:'middle'}}>{Array.isArray(dealers) ? dealers.length : 0}</span></div>
                <div style={{position:'relative', width:'100%'}}>
                  <div style={{display: showLoader ? 'flex' : 'none', justifyContent:'center',alignItems:'center',height:'100%', minHeight:120, width:'100%', position:'absolute', top:0, left:0, right:0, bottom:0, zIndex:2, background:'white'}}>
                    <div className="bar-loader">
                      <div></div><div></div><div></div><div></div><div></div>
                    </div>
                  </div>
                  <div style={{display: showLoader ? 'none' : 'block', width:'100%'}}>
                    {/* <div className="stat-value">{Array.isArray(dealers) ? dealers.length : 0}</div> */}
                    <div style={{ fontSize: '12px', color: '#fff', margin: '4px 0 28px 0', display: 'flex', gap: 10 }}>
                      <span>Active: {dealerCounts.Active}</span>
                      <span>Inactive: {dealerCounts.Inactive}</span>
                    </div>
                    <div className="stat-chart-container" style={{marginTop: '32px'}}>
                      <canvas ref={chartRef} width={220} height={180} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <i className="ri-error-warning-line"></i>
                <div>Happy Clients <span style={{fontWeight:700, color:'#fff', fontSize:22, marginLeft:8, verticalAlign:'middle'}}>{Array.isArray(clients) ? clients.length : 0}</span></div>
                <div style={{position:'relative', width:'100%'}}>
                  <div style={{display: showLoader ? 'flex' : 'none', justifyContent:'center',alignItems:'center',height:'100%', minHeight:120, width:'100%', position:'absolute', top:0, left:0, right:0, bottom:0, zIndex:2, background:'white'}}>
                    <div className="bar-loader">
                      <div></div><div></div><div></div><div></div><div></div>
                    </div>
                  </div>
                  <div style={{display: showLoader ? 'none' : 'block', width:'100%'}}>
                    {/* <div className="stat-value">{Array.isArray(clients) ? clients.length : 0}</div> */}
                    <div style={{ fontSize: '12px', color: '#fff', margin: '4px 0 28px 0', display: 'flex', gap: 10 }}>
                      <span>Active: {clientCounts.Active}</span>
                      <span>Inactive: {clientCounts.Inactive}</span>
                    </div>
                    <div className="stat-chart-container" style={{marginTop: '32px'}}>
                      <canvas ref={chartRef2} width={220} height={180} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <i className="ri-car-line"></i>
                <div>Registered Vehicles <span style={{fontWeight:700, color:'#fff', fontSize:22, marginLeft:8, verticalAlign:'middle'}}>{vehicleCounts.Active + vehicleCounts.Inactive + vehicleCounts.Deleted}</span></div>
                <div style={{position:'relative', width:'100%'}}>
                  <div style={{display: showLoader ? 'flex' : 'none', justifyContent:'center',alignItems:'center',height:'100%', minHeight:120, width:'100%', position:'absolute', top:0, left:0, right:0, bottom:0, zIndex:2, background:'white'}}>
                    <div className="bar-loader">
                      <div></div><div></div><div></div><div></div><div></div>
                    </div>
                  </div>
                  <div style={{display: showLoader ? 'none' : 'block', width:'100%'}}>
                    {/* <div className="stat-value">{vehicleCounts.Active + vehicleCounts.Inactive + vehicleCounts.Deleted}</div> */}
                    <div style={{ fontSize: '12px', color: '#fff', margin: '4px 0 28px 0', display: 'flex', gap: 10 }}>
                      <span>Active: {vehicleCounts.Active}</span>
                      <span>Inactive: {vehicleCounts.Inactive}</span>
                      <span>Deleted: {vehicleCounts.Deleted}</span>
                    </div>
                    <div className="stat-chart-container" style={{marginTop: '32px'}}>
                      <canvas ref={chartRef3} width={220} height={180} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <i className="ri-money-rupee-circle-line"></i>
                <div>Challans Received <span style={{fontWeight:700, color:'#fff', fontSize:22, marginLeft:8, verticalAlign:'middle'}}>₹0</span></div>
                {/* <div className="stat-value">₹0</div> */}
                <div className="stat-chart-container" style={{marginTop: '32px'}}>
                  <canvas ref={chartRef4} width={220} height={180} />
                </div>
              </div>
            </div>
            {/* Dealer Table (updated to match client dashboard) */}
            {/* Dealer Table (updated to match client dashboard) */}
            <div className="dashboard-latest" style={{marginBottom: 32}}>
              <div className="latest-header">
                <h2 className="page-title" style={{marginBottom: 0}}>Dealer Network</h2>
                <p className="page-subtitle" style={{marginTop: 2, marginBottom: 0}}>Manage and view all registered dealers in your network.</p>
              </div>
              <div className="table-container">
                <table className="latest-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Clients</th>
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
                        return (
                          <tr key={dealer.id || idx}>
                            <td>{dealer.name || dealer.dealer_name || '-'}</td>
                            <td>{dealer.meta && dealer.meta.phone ? dealer.meta.phone : (dealer.phone || dealer.mobile || '-')}</td>
                            <td>{dealer.email || '-'}</td>
                            <td>{totalClients}</td>
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
                                className={`action-btn ${dealer.status && dealer.status.toLowerCase() === 'active' ? 'inactivate' : 'activate'}`}
                                style={{padding: '6px 14px', fontSize: 14}}
                                onClick={() => handleToggleDealerStatus(dealer)}
                              >
                                {(dealer.status && dealer.status.toLowerCase() === 'active') ? (
                                  <i className="ri-lock-line" title="Inactivate" aria-label="Inactivate" style={{fontSize:18, verticalAlign:'middle', color:'#fff'}}></i>
                                ) : (
                                  <i className="ri-lock-unlock-line" title="Activate" aria-label="Activate" style={{fontSize:18, verticalAlign:'middle', color:'#fff'}}></i>
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
                <h2 className="page-title" style={{marginBottom: 0}}>Client Network</h2>
                <p className="page-subtitle" style={{marginTop: 2, marginBottom: 0}}>Manage and view all registered clients in your network.</p>
                <div style={{display:'flex', gap:16, marginTop:12, alignItems:'center', flexWrap:'wrap'}}>
                  <input
                    type="text"
                    placeholder="Search clients by name, phone, or email..."
                    value={searchClient || ''}
                    onChange={e => setSearchClient(e.target.value)}
                    style={{padding:'7px 12px', borderRadius:6, border:'1px solid #bbb', fontSize:15, minWidth:220, background:'#fff', color:'#222'}}
                  />
                  <select
                    value={dealerFilter || ''}
                    onChange={e => setDealerFilter(e.target.value)}
                    style={{padding:'7px 12px', borderRadius:6, border:'1px solid #bbb', fontSize:15, minWidth:180, background:'#fff', color:'#222'}}
                  >
                    <option value="">All Dealers</option>
                    {Array.isArray(dealers) && dealers.map(d => (
                      <option key={d.id || d._id || d.email} value={d.id || d._id || d.email}>
                        {d.name || d.dealer_name || d.email}
                      </option>
                    ))}
                  </select>
                </div>
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
                    {filteredClients.length > 0 ? (
                      filteredClients.map((client, idx) => {
                        const dealerName = (() => {
                          if (!client.dealer_id) return '-';
                          if (typeof client.dealer_id === 'object') {
                            return client.dealer_id.name || client.dealer_id.dealer_name || client.dealer_id.email || '-';
                          }
                          const found = Array.isArray(dealers) ? dealers.find(d => (d.id || d._id || d.email) === client.dealer_id) : null;
                          return found ? (found.name || found.dealer_name || found.email) : '-';
                        })();
                        // Prefer vehicle_counts from client object if available
                        let totalVehicles = '-';
                        if (client.vehicle_counts) {
                          // Only sum active, inactive, and deleted keys to avoid double counting
                          const keys = Object.keys(client.vehicle_counts);
                          totalVehicles = 0;
                          ['active', 'inactive', 'deleted'].forEach(k => {
                            if (keys.includes(k) || keys.includes(k.charAt(0).toUpperCase() + k.slice(1))) {
                              // Try both lower and capitalized keys
                              totalVehicles += Number(client.vehicle_counts[k]) || Number(client.vehicle_counts[k.charAt(0).toUpperCase() + k.slice(1)]) || 0;
                            }
                          });
                        } else if (Array.isArray(vehicles)) {
                          totalVehicles = vehicles.filter(v => {
                            const vClientId = v.client_id && typeof v.client_id === 'object' ? v.client_id.id || v.client_id._id : v.client_id;
                            const cId = client.id || client._id || client.email;
                            return String(vClientId) === String(cId);
                          }).length;
                        }
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
                                className={`action-btn ${client.status && client.status.toLowerCase() === 'active' ? 'inactivate' : 'activate'}`}
                                style={{padding: '6px 14px', fontSize: 14}}
                                onClick={() => handleToggleClientStatus(client)}
                              >
                                {(client.status && client.status.toLowerCase() === 'active') ? (
                                  <i className="ri-lock-line" title="Inactivate" aria-label="Inactivate" style={{fontSize:18, verticalAlign:'middle', color:'#fff'}}></i>
                                ) : (
                                  <i className="ri-lock-unlock-line" title="Activate" aria-label="Activate" style={{fontSize:18, verticalAlign:'middle', color:'#fff'}}></i>
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
    </>
  );
}

export default AdminDashboard;
