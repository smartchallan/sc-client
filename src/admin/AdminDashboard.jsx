import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import "./AdminDashboard.css";
import "./AdminHome.css";
import AdminSidebar from "./AdminSidebar";
import AdminProfile from "./AdminProfile";
import RegisterDealer from "./RegisterDealer";
import RegisterClient from "./RegisterClient";
import RegisterVehicle from "../RegisterVehicle";
import AdminRegisterVehicle from "./AdminRegisterVehicle";
import UserChallan from "../UserChallan";

function AdminDashboard() {
  const userRole = "admin";
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [dealers, setDealers] = useState([]);
  const [clients, setClients] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loadingAdminData, setLoadingAdminData] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [adminDataError, setAdminDataError] = useState(null);
  const chartRef = useRef(null); // Dealers by State
  const chartRefCity = useRef(null); // Dealers by City
  const chartRefCountry = useRef(null); // Dealers by Country
  const chartRef2 = useRef(null); // Clients by Status
  const chartRef3 = useRef(null); // Vehicles by Type
  const chartRef4 = useRef(null); // Challans Settled

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
          plugins: {
            legend: { position: 'bottom' },
            title: { display: true, text: 'Dealers by City' },
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
          plugins: {
            legend: { position: 'bottom' },
            // title: { display: true, text: 'Dealers by City' },
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
          plugins: {
            legend: { position: 'bottom' },
            title: { display: true, text: 'Dealers by Country' },
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
          plugins: {
            legend: { position: 'bottom' },
            // title: { display: true, text: 'Clients by State' },
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
          plugins: {
            legend: { position: 'bottom' },
            // title: { display: true, text: 'Vehicles by Status' },
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
      // Sample data for Challans Settled
      const data = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Challans Settled',
          data: [1200, 1500, 1100, 1800, 1700, 2000],
          backgroundColor: '#42a5f5',
        }],
      };
      if (window._challansBarChart) window._challansBarChart.destroy();
      window._challansBarChart = new Chart(ctx, {
        type: 'bar',
        data,
        options: {
          plugins: {
            legend: { display: false },
            title: { display: false },
          },
          scales: {
            x: { beginAtZero: true },
            y: { beginAtZero: true },
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
  };

  console.log('dasdasdad', dealers);
  // Quick Action handlers
  const handleQuickAddDealer = () => setActiveMenu('Register Dealer');
  const handleQuickAddClient = () => setActiveMenu('Register Client');

  return (
    <div className="admin-dashboard-layout" style={{display: 'flex', width: '100vw', minHeight: '100vh'}}>
      <AdminSidebar role={userRole} onMenuClick={handleMenuClick} activeMenu={activeMenu} />
      <main className="main-content admin-home-content" style={{flex: 1, minHeight: '100vh'}}>
  {activeMenu === "Dashboard" && (
          <>
            <div className="dashboard-header">
              <h1 className="dashboard-title">Welcome back{user.user && user.user.name ? `, ${user.user.name}` : '123'}!</h1>
              <p>Here's an overview of your challan status</p>
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
                    <style>{`
                      .bar-loader { display: flex; align-items: flex-end; height: 48px; gap: 4px; }
                      .bar-loader div {
                        width: 8px; height: 16px; background: #4e79a7; border-radius: 2px;
                        animation: barGrow 1s infinite;
                      }
                      .bar-loader div:nth-child(2) { animation-delay: 0.1s; }
                      .bar-loader div:nth-child(3) { animation-delay: 0.2s; }
                      .bar-loader div:nth-child(4) { animation-delay: 0.3s; }
                      .bar-loader div:nth-child(5) { animation-delay: 0.4s; }
                      @keyframes barGrow {
                        0%, 100% { height: 16px; background: #4e79a7; }
                        50% { height: 48px; background: #f28e2b; }
                      }
                    `}</style>
                  </div>
                  <div style={{display: showLoader ? 'none' : 'block', width:'100%'}}>
                    <div className="stat-value">{Array.isArray(dealers) ? dealers.length : 0}</div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center'}}>
                      <div className="dealers-state-pie-chart-container" style={{maxWidth: 200, margin: '8px auto'}}>
                        <canvas ref={chartRef} width={200} height={200} />
                      </div>
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
                    <div className="clients-pie-chart-container" style={{maxWidth: 200, margin: '16px auto'}}>
                      <canvas ref={chartRef2} width={200} height={200} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <i className="ri-checkbox-circle-line"></i>
                <div>Registered Vehicles</div>
                <div style={{position:'relative', width:'100%'}}>
                  <div style={{display: showLoader ? 'flex' : 'none', justifyContent:'center',alignItems:'center',height:'100%', minHeight:120, width:'100%', position:'absolute', top:0, left:0, right:0, bottom:0, zIndex:2, background:'white'}}>
                    <div className="bar-loader">
                      <div></div><div></div><div></div><div></div><div></div>
                    </div>
                  </div>
                  <div style={{display: showLoader ? 'none' : 'block', width:'100%'}}>
                    <div className="stat-value">{Array.isArray(vehicles) ? vehicles.length : 0}</div>
                    <div className="vehicles-radial-chart-container" style={{maxWidth: 200, margin: '16px auto'}}>
                      <canvas ref={chartRef3} width={200} height={200} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <i className="ri-money-rupee-circle-line"></i>
                <div>Challans Received</div>
                <div className="stat-value">₹3,250</div>
                <div className="challans-bar-chart-container" style={{maxWidth: 220, margin: '16px auto'}}>
                  <canvas ref={chartRef4} width={220} height={180} />
                </div>
              </div>
            </div>

            <div className="map-dealer-data" style={{ width: '100%', height: 450, margin: '32px 0', position: 'relative' }}>
              {/* Modern map with colored markers by state */}
              {Array.isArray(dealers) && dealers.length > 0 ? (
                <>
                  <MapContainer
                    center={[20.5937, 78.9629]}
                    zoom={4}
                    style={{ width: '100%', height: '100%' }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    />
                    {(() => {
                      // Assign a color to each state
                      const stateColors = {};
                      const palette = [
                        '#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab',
                        '#8c564b', '#d62728', '#9467bd', '#c49c94', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
                      ];
                      let colorIdx = 0;
                      dealers.filter(Boolean).forEach(d => {
                        const state = d.meta && d.meta.state ? d.meta.state : 'Unknown';
                        if (!(state in stateColors)) {
                          stateColors[state] = palette[colorIdx % palette.length];
                          colorIdx++;
                        }
                      });
                      // Static mapping of Indian states to lat/lng (approximate centers)
                      const stateLatLng = {
                        'Andhra Pradesh': [15.9129, 79.74],
                        'Arunachal Pradesh': [28.218, 94.7278],
                        'Assam': [26.2006, 92.9376],
                        'Bihar': [25.0961, 85.3131],
                        'Chhattisgarh': [21.2787, 81.8661],
                        'Goa': [15.2993, 74.124],
                        'Gujarat': [22.2587, 71.1924],
                        'Haryana': [29.0588, 76.0856],
                        'Himachal Pradesh': [31.1048, 77.1734],
                        'Jharkhand': [23.6102, 85.2799],
                        'Karnataka': [15.3173, 75.7139],
                        'Kerala': [10.8505, 76.2711],
                        'Madhya Pradesh': [22.9734, 78.6569],
                        'Maharashtra': [19.7515, 75.7139],
                        'Manipur': [24.6637, 93.9063],
                        'Meghalaya': [25.467, 91.3662],
                        'Mizoram': [23.1645, 92.9376],
                        'Nagaland': [26.1584, 94.5624],
                        'Odisha': [20.9517, 85.0985],
                        'Punjab': [31.1471, 75.3412],
                        'Rajasthan': [27.0238, 74.2179],
                        'Sikkim': [27.533, 88.5122],
                        'Tamil Nadu': [11.1271, 78.6569],
                        'Telangana': [18.1124, 79.0193],
                        'Tripura': [23.9408, 91.9882],
                        'Uttar Pradesh': [26.8467, 80.9462],
                        'Uttarakhand': [30.0668, 79.0193],
                        'West Bengal': [22.9868, 87.855],
                        'Delhi': [28.7041, 77.1025],
                        'Jammu and Kashmir': [33.7782, 76.5762],
                        'Ladakh': [34.1526, 77.5771],
                        'Puducherry': [11.9416, 79.8083],
                        'Unknown': [20.5937, 78.9629],
                      };
                      return dealers.filter(Boolean).filter(d => {
                        const state = d.meta && d.meta.state ? d.meta.state : 'Unknown';
                        return stateLatLng[state] !== undefined;
                      }).map((dealer, idx) => {
                        const state = dealer.meta && dealer.meta.state ? dealer.meta.state : 'Unknown';
                        const color = stateColors[state] || '#4e79a7';
                        const [lat, lng] = stateLatLng[state] || stateLatLng['Unknown'];
                        const icon = L.divIcon({
                          className: '',
                          html: `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='40' viewBox='0 0 28 40'><path d='M14 0C6.27 0 0 6.27 0 14c0 10.5 13.1 25.1 13.6 25.6.2.2.5.4.8.4s.6-.1.8-.4C14.9 39.1 28 24.5 28 14 28 6.27 21.73 0 14 0zm0 21c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z' fill='${color}'/></svg>`,
                          iconSize: [28, 40],
                          iconAnchor: [14, 40],
                          popupAnchor: [0, -36],
                        });
                        const dealerState = dealer.meta && dealer.meta.state ? dealer.meta.state : null;
                        const dealerCity = dealer.meta && dealer.meta.city ? dealer.meta.city : null;
                        return (
                          <Marker
                            key={dealer.id || idx}
                            position={[lat, lng]}
                            icon={icon}
                            zIndexOffset={1000}
                          >
                            <Popup>
                              <b>{dealer.name || dealer.dealer_name || 'Dealer'}</b><br/>
                              {dealerState ? (
                                <span>State: {dealerState}<br/></span>
                              ) : null}
                              <span>City: {dealerCity ? dealerCity : 'Unknown'}<br/></span>
                              {dealer.phone || dealer.mobile || ''}
                            </Popup>
                          </Marker>
                        );
                      });
                    })()}
                  </MapContainer>
                  {/* Legend for state colors */}
                  <div style={{position:'absolute', right:10, top:10, background:'#fff', borderRadius:8, boxShadow:'0 2px 8px #0001', padding:'8px 12px', fontSize:12, zIndex:1000, maxHeight:260, overflowY:'auto'}}>
                    <b>State Legend</b>
                    <ul style={{listStyle:'none', margin:0, padding:0}}>
                      {(() => {
                        // Recompute stateColors for legend
                        const stateColors = {};
                        const palette = [
                          '#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab',
                          '#8c564b', '#d62728', '#9467bd', '#c49c94', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
                        ];
                        let colorIdx = 0;
                        dealers.filter(Boolean).forEach(d => {
                          const state = d.meta && d.meta.state ? d.meta.state : 'Unknown';
                          if (!(state in stateColors)) {
                            stateColors[state] = palette[colorIdx % palette.length];
                            colorIdx++;
                          }
                        });
                        return Object.entries(stateColors).map(([state, color]) => (
                          <li key={state} style={{display:'flex',alignItems:'center',marginBottom:2}}>
                            <span style={{display:'inline-block',width:14,height:14,background:color,borderRadius:3,marginRight:6,border:'1px solid #ccc'}}></span>
                            {state}
                          </li>
                        ));
                      })()}
                    </ul>
                  </div>
                </>
              ) : (
                <div style={{textAlign: 'center', padding: 40, color: '#888'}}>No dealer locations to show on map.</div>
              )}
            </div>
            <div className="dashboard-latest">
              <div className="latest-header">
                <h2>Smart Challan Network</h2>
                <a href="#" className="view-all">View All</a>
              </div>
              <table className="latest-table">
                <thead>
                  <tr>
                    <th>Dealer Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Total Clients</th>
                    <th>Vehicles Registered</th>
                    <th>Status</th>
                  </tr>
                </thead>
                
                <tbody>
                  {loadingAdminData && (
                    <tr><td colSpan={6}>Loading dealers...</td></tr>
                  )}
                  {adminDataError && (
                    <tr><td colSpan={6} style={{color: 'red'}}>{adminDataError}</td></tr>
                  )}
                  {!loadingAdminData && !adminDataError && Array.isArray(dealers) && dealers.length > 0 && dealers.filter(Boolean).map((dealer, idx) => {
                    // Count clients under this dealer
                    const totalClients = Array.isArray(clients)
                      ? clients.filter(c => {
                          const dealerId = c.dealer_id && typeof c.dealer_id === 'object' ? c.dealer_id.id || c.dealer_id._id : c.dealer_id;
                          const dId = dealer.id || dealer._id || dealer.email;
                          return dealerId === dId;
                        }).length
                      : '-';
                    const totalVehicles = Array.isArray(vehicles)
                      ? vehicles.filter(v => {
                          const vDealerId = v.dealer_id && typeof v.dealer_id === 'object' ? v.dealer_id.id || v.dealer_id._id : v.dealer_id;
                          const dId = dealer.id || dealer._id || dealer.email;
                          return vDealerId === dId;
                        }).length
                      : '-';
                    return (
                      <tr key={dealer.id || idx}>
                        <td>{dealer.name || dealer.dealer_name || '-'}</td>
                        <td>{dealer.phone || dealer.mobile || '-'}</td>
                        <td>{dealer.email || '-'}</td>
                        <td>{totalClients}</td>
                        <td>{totalVehicles}</td>
                        <td><span className={`status ${dealer.status ? dealer.status.toLowerCase() : ''}`}>{dealer.status || '-'}</span></td>
                      </tr>
                    );
                  })}
                  {!loadingAdminData && !adminDataError && Array.isArray(dealers) && dealers.length === 0 && (
                    <tr><td colSpan={6}>No dealers found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="dashboard-actions">
              <h2>Quick Actions</h2>
              <div className="actions-list">
                <button className="action-btn" onClick={handleQuickAddDealer}><i className="ri-add-circle-line"></i> Add New Dealer</button>
                <button className="action-btn" onClick={handleQuickAddClient}><i className="ri-wallet-3-line"></i>Add New Client</button>
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
          <AdminRegisterVehicle />
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
