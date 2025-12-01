	<style>{`
		.sidebar,
		.main-content,
		.main-content.admin-home-content {
			transition: all 0.35s cubic-bezier(.4,1.3,.5,1) !important;
		}
	`}</style>
// Copy of AdminDashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import DealerSidebar from "./DealerSidebar";
import DealerProfile from "./DealerProfile";
import "../shared/CommonDashboard.css";
import "./DealerDashboardOverrides.css";
import "./DealerHome.css";

import DealerRegisterVehicle from "./DealerRegisterVehicle";
import ClientVehiclesPage from "./ClientVehiclesPage";
import ClientSettings from "./ClientSettings";
import CustomModal from "../client/CustomModal";
import QuickActions from "../client/QuickActions";
import AddClientPage from "./AddClientPage";

function DealerDashboard() {
	const [selectedClient, setSelectedClient] = useState(null);
	const [clientVehiclesPageClient, setClientVehiclesPageClient] = useState(null);
	const userRole = "dealer";
	const [supportModal, setSupportModal] = useState(false);
	const [activeMenu, setActiveMenu] = useState("Home");
	const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth > 900 : true));
	const [dealerData, setDealerData] = useState(null);
	const [loadingDealerData, setLoadingDealerData] = useState(false);
	const [dealerDataError, setDealerDataError] = useState(null);
	const chartRef2 = useRef(null);
	const chartRef3 = useRef(null);
	const chartRef4 = useRef(null);

	// Get user info from localStorage
// Remove static user object; always read from localStorage in effect

		// Fetch dealer data using new endpoint
		useEffect(() => {
			let user = {};
					try {
						user = JSON.parse(localStorage.getItem('sc_user')) || {};
					} catch {
						user = {};
					}
					// Support both {user: ...} and flat user object
					const dealerObj = user.user ? user.user : user;
					const dealerId = dealerObj && dealerObj.id;
					const userRole = dealerObj && dealerObj.role;
					if (!dealerId) {
						console.log('No dealer ID found, skipping API call');
						return;
					}
					if (userRole !== 'dealer') {
						console.log('User is not a dealer, skipping API call. Role:', userRole);
						return;
					}
			const fetchDealerData = async () => {
				console.log('Fetching dealer data for ID:', dealerId);
				setLoadingDealerData(true);
				setDealerDataError(null);
				try {
					const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
					const url = `${baseUrl}/dealerdata?dealer_id=${dealerId}`;
					const res = await fetch(url);
					if (!res.ok) throw new Error(`API error: ${res.status}`);
					const data = await res.json();
					setDealerData(data);
					console.log('Dealer data fetched successfully:', data);
				} catch (err) {
					setDealerDataError(err.message || "Failed to fetch dealer data");
					console.error('Error fetching dealer data:', err);
				} finally {
					setLoadingDealerData(false);
				}
			};
			fetchDealerData();
		}, []); // Only on mount; always reads latest user from localStorage

	// Clients pie chart - show clients by city
	useEffect(() => {
		if (!chartRef2.current) return;
		if (!dealerData?.clients || !dealerData.clients.length) {
			if (window._clientsPieChart) window._clientsPieChart.destroy();
			return;
		}
		import('chart.js/auto').then(({ default: Chart }) => {
			if (window._clientsPieChart) window._clientsPieChart.destroy();
			const ctx = chartRef2.current.getContext('2d');
			// Pie chart by client status (active/inactive)
			let active = 0, inactive = 0;
			dealerData.clients.forEach(client => {
				const status = (client.status || '').toLowerCase();
				if (status === 'active') active++;
				else inactive++;
			});
			const data = {
				labels: ['Active', 'Inactive'],
				datasets: [{
					data: [active, inactive],
					backgroundColor: ['#43e97b', '#ffa726'],
					borderColor: '#fff',
					borderWidth: 3,
				}],
			};
			window._clientsPieChart = new Chart(ctx, {
				type: 'pie',
				data,
				options: {
					plugins: {
						legend: { position: 'bottom' },
						title: { display: false },
					},
				},
			});
		});
		return () => {
			if (window._clientsPieChart) window._clientsPieChart.destroy();
		};
	}, [dealerData]);
	useEffect(() => {
		if (!chartRef3.current || !dealerData?.clients) return;
		import('chart.js/auto').then(({ default: Chart }) => {
			if (window._vehiclesBarChart) window._vehiclesBarChart.destroy();
			const ctx = chartRef3.current.getContext('2d');
			ctx.clearRect(0, 0, chartRef3.current.width, chartRef3.current.height);
			// Group vehicles by week (registered_at)
			const vehicles = (dealerData.vehicles || []).filter(v => v.registered_at);
			// Get last 8 months
			const now = new Date();
			const months = [];
			for (let i = 7; i >= 0; i--) {
				const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
				months.push(new Date(d));
			}
			// Count vehicles per month
			const monthLabels = months.map((d) => d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }));
			const monthCounts = months.map((start, i) => {
				const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
				return vehicles.filter(v => {
					const reg = new Date(v.registered_at);
					return reg >= start && reg <= end;
				}).length;
			});
			const data = {
				labels: monthLabels,
				datasets: [{
					label: 'Vehicles Registered',
					data: monthCounts,
					backgroundColor: '#1976d2',
					borderColor: '#fff',
					borderWidth: 3,
				}],
			};
			window._vehiclesBarChart = new Chart(ctx, {
				type: 'bar',
				data,
				options: {
					plugins: {
						legend: { display: false },
						title: { display: false },
					},
					scales: {
						x: {
							beginAtZero: true,
							ticks: {
								color: '#222',
								font: { weight: 'bold' },
							},
						},
						y: {
							beginAtZero: true,
							ticks: {
								color: '#222',
								font: { weight: 'bold' },
							},
						},
					},
				},
			});
		});
		return () => {
			if (window._vehiclesBarChart) window._vehiclesBarChart.destroy();
		};
	}, [dealerData]);
	useEffect(() => {
		if (!chartRef4.current) return;
		import('chart.js/auto').then(({ default: Chart }) => {
			const ctx = chartRef4.current.getContext('2d');
			ctx.clearRect(0, 0, chartRef4.current.width, chartRef4.current.height);
			
			// Use API data for challans or show sample data
			const challansData = dealerData?.challans_monthly || [
				{ month: 'Jan', amount: 1200 },
				{ month: 'Feb', amount: 1500 },
				{ month: 'Mar', amount: 1100 },
				{ month: 'Apr', amount: 1800 },
				{ month: 'May', amount: 1700 },
				{ month: 'Jun', amount: 2000 }
			];
			
			const data = {
				labels: challansData.map(item => item.month),
				datasets: [{
					label: 'Challans Settled',
					data: challansData.map(item => item.amount || item.value || 0),
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
	}, [dealerData]);

	const handleMenuClick = (label) => {
		// Map 'Dashboard' menu label to 'Home' for dashboard content
		const menuLabel = label === 'Dashboard' ? 'Home' : label;
		setActiveMenu(menuLabel);
		// Reset dashboard state when returning to Home/Dashboard
		if (menuLabel === "Home") {
			setLoadingDealerData(false);
			setDealerDataError(null);
					// Always read user from localStorage at the time of click
							let user = {};
							try {
								user = JSON.parse(localStorage.getItem('sc_user')) || {};
							} catch { user = {}; }
							const dealerObj = user.user ? user.user : user;
							if (dealerObj && dealerObj.id && dealerObj.role === 'dealer') {
								const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
								const url = `${baseUrl}/dealerdata?dealer_id=${dealerObj.id}`;
								setLoadingDealerData(true);
								fetch(url)
									.then(res => res.json())
									.then(data => setDealerData(data))
									.catch(() => setDealerDataError("Failed to fetch dealer data"))
									.finally(() => setLoadingDealerData(false));
							}
		}
		if (window.innerWidth <= 900) setSidebarOpen(false);
	};
	
	const toggleSidebar = () => setSidebarOpen(s => !s);

		return (
			<div className={`dashboard-layout ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
				{sidebarOpen && window.innerWidth <= 900 && (
					<div className="sidebar-overlay show" onClick={() => setSidebarOpen(false)} />
				)}
					{(sidebarOpen || window.innerWidth <= 900) && (
						<DealerSidebar role={userRole} onMenuClick={handleMenuClick} activeMenu={activeMenu} sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
					)}
				<main className="main-content">
					<div className="header" style={{marginBottom: 24}}>
						<div className="header-left" style={{display:'flex',alignItems:'center',gap:16}}>
							<div className="menu-toggle" style={{fontSize:22,cursor:'pointer'}} onClick={toggleSidebar}>
								<i className="ri-menu-line"></i>
							</div>
							<div className="header-title" style={{fontWeight:600}}>
								{activeMenu === 'Home' ? 'Dashboard' : activeMenu}
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
					{activeMenu === "Home" && (
						<>
							<div>
								{(() => {
									let user = {};
									try {
										user = JSON.parse(localStorage.getItem('sc_user')) || {};
									} catch { user = {}; }
									return <h1 className="page-title">Welcome{user.user && user.user.name ? `, ${user.user.name}` : ''}</h1>;
								})()}
								<p className="page-subtitle">Manage your clients, vehicles, and challans all in one place.</p>
							</div>
						<div className="dashboard-stats">
							{/* Stat card: Happy Clients (from summary.total_clients) */}
							<div className="stat-card">
								<i className="ri-user-heart-line"></i>
								<div>Happy Clients</div>
								{(() => {
									if (!dealerData?.clients || !dealerData.clients.length) return null;
									let active = 0, inactive = 0;
									dealerData.clients.forEach(client => {
										const status = (client.status || '').toLowerCase();
										if (status === 'active') active++;
										else inactive++;
									});
									return (
										<div style={{
											textAlign:'center',
											margin:'6px 0 2px 0',
											fontSize:'0.98em',
											letterSpacing:0.5
										}}>
											<span style={{color:'#fff', fontWeight:400}}>Active </span>
											<span style={{color:'#43e97b', fontWeight:700}}>{active}</span>
											<span style={{color:'#fff', fontWeight:400}}>&nbsp; Inactive </span>
											<span style={{color:'#ffa726', fontWeight:700}}>{inactive}</span>
										</div>
									);
								})()}
								<div className="clients-pie-chart-container" style={{maxWidth: 200, margin: '16px auto'}}>
									<canvas ref={chartRef2} width={200} height={200} />
								</div>
							</div>
							{/* Stat card: Registered Vehicles (from summary.total_vehicles) */}
							<div className="stat-card">
								<i className="ri-car-line"></i>
								<div>Registered Vehicles</div>
								<div className="stat-value">
									{loadingDealerData ? '...' : (dealerData?.summary?.total_vehicles ?? dealerData?.vehicles_registered ?? 0)}
								</div>
								<div className="vehicles-radial-chart-container" style={{maxWidth: 200, margin: '16px auto'}}>
									<canvas ref={chartRef3} width={200} height={200} />
								</div>
							</div>
							{/* Stat card: Challans Fetched (from summary.total_challan_records) */}
							<div className="stat-card" style={{background: 'linear-gradient(120deg, #6ee7b7 60%, #d1fae5 100%)', borderRadius: 18, boxShadow: '0 6px 24px rgba(16, 185, 129, 0.10)', border: '1.5px solid #d1fae5'}}>
								<div className="stat-card-content">
									<i className="ri-error-warning-line"></i>
									<div style={{display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-start'}}>
										<div>Challans Fetched</div>
										<div className="stat-value" style={{ display: 'inline-block', marginLeft: 6 }}>
											{loadingDealerData ? '...' : (dealerData?.summary?.total_challan_records ?? dealerData?.total_challan_records ?? 0)}
										</div>
									</div>
									<div className="challans-pie-chart-container" style={{maxWidth: 200, margin: '16px auto'}}>
										<canvas ref={chartRef4} width={200} height={200} />
									</div>
								</div>
							</div>
							{/* Stat card: Vehicle Renewals */}
							<div className="stat-card" style={{background: 'linear-gradient(120deg, #f9a8d4 60%, #fce7f3 100%)', borderRadius: 18, boxShadow: '0 6px 24px rgba(236, 72, 153, 0.10)', border: '1.5px solid #fce7f3'}}>
								<div className="stat-card-content">
									<i className="ri-alarm-warning-line"></i>
									<div style={{display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-start'}}>
										<div>Vehicle Renewals</div>
										<div className="stat-value" style={{ display: 'inline-block', marginLeft: 6 }}>
											{loadingDealerData ? '...' : (dealerData?.summary?.vehicle_renewals ?? dealerData?.vehicle_renewals ?? 0)}
										</div>
									</div>
								</div>
							</div>
						</div>
						{/* Client Locations Map */}
						<div className="map-client-data" style={{ width: '100%', height: 450, margin: '32px 0 0 0', position: 'relative' }}>
							<div className="latest-header" style={{marginBottom: 20}}>
								<h2>Client Locations</h2>
								<span style={{fontSize: 14, color: '#666'}}>
									{loadingDealerData ? 'Loading...' : `${dealerData?.clients?.length || 0} clients`}
								</span>
							</div>
							{loadingDealerData ? (
								<div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f8f9fa', borderRadius: 12}}>
									<div style={{textAlign: 'center'}}>
										<div className="default-loader">
											<div className="loader-spinner"></div>
										</div>
										<p style={{marginTop: 20, color: '#888'}}>Loading client locations...</p>
									</div>
								</div>
							) : dealerDataError ? (
								<div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f8f9fa', borderRadius: 12}}>
									<div style={{textAlign: 'center', color: '#e74c3c'}}>
										<i className="ri-error-warning-line" style={{fontSize: 48, marginBottom: 16, display: 'block'}}></i>
										<p>Failed to load client locations</p>
										<p style={{fontSize: 14, marginTop: 8}}>{dealerDataError}</p>
									</div>
								</div>
							) : dealerData?.clients && Array.isArray(dealerData.clients) && dealerData.clients.length > 0 ? (
								<>
									<MapContainer
										center={[20.5937, 78.9629]}
										zoom={5}
										style={{ width: '100%', height: '100%', borderRadius: 12 }}
										scrollWheelZoom={false}
									>
										<TileLayer
											attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
											url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
										/>
										{dealerData.clients.map((client, idx) => {
											// Default coordinates for major Indian cities if client location is not available
											const defaultLocations = [
												[28.6139, 77.2090], // Delhi
												[19.0760, 72.8777], // Mumbai
												[12.9716, 77.5946], // Bangalore
												[13.0827, 80.2707], // Chennai
												[22.5726, 88.3639], // Kolkata
												[17.3850, 78.4867], // Hyderabad
												[23.0225, 72.5714], // Ahmedabad
												[18.5204, 73.8567], // Pune
												[26.9124, 75.7873], // Jaipur
												[21.1458, 79.0882]  // Nagpur
											];
											
											// Use client's coordinates or default to a city
											const lat = client.latitude || client.lat || defaultLocations[idx % defaultLocations.length][0];
											const lng = client.longitude || client.lng || defaultLocations[idx % defaultLocations.length][1];
											
											const icon = L.divIcon({
												className: '',
												html: `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='40' viewBox='0 0 28 40'><path d='M14 0C6.27 0 0 6.27 0 14c0 10.5 13.1 25.1 13.6 25.6.2.2.5.4.8.4s.6-.1.8-.4C14.9 39.1 28 24.5 28 14 28 6.27 21.73 0 14 0zm0 21c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z' fill='#0072ff'/></svg>`,
												iconSize: [28, 40],
												iconAnchor: [14, 40],
												popupAnchor: [0, -36],
											});
											
											return (
												<Marker
													key={client.id || idx}
													position={[lat, lng]}
													icon={icon}
													zIndexOffset={1000}
												>
													<Popup>
														<div style={{minWidth: 200}}>
															<b>{client.name || client.client_name || 'Client'}</b><br/>
															{client.email && <div>Email: {client.email}</div>}
															{client.phone && <div>Phone: {client.phone}</div>}
															{client.address && <div>Address: {client.address}</div>}
															<div>Vehicles: {client.vehicle_count || client.vehicles || 0}</div>
														</div>
													</Popup>
												</Marker>
											);
										})}
									</MapContainer>
									<div style={{position:'absolute', right:10, top:50, background:'#fff', borderRadius:8, boxShadow:'0 2px 8px #0001', padding:'8px 12px', fontSize:12, zIndex:1000, maxHeight:200, overflowY:'auto'}}>
										<b>Clients ({dealerData.clients.length})</b>
										<ul style={{listStyle:'none', margin:'8px 0 0', padding:0, maxHeight:150, overflowY:'auto'}}>
											{dealerData.clients.slice(0, 10).map((client, idx) => (
												<li key={client.id || idx} style={{display:'flex',alignItems:'center',marginBottom:4, fontSize:11}}>
													<span style={{display:'inline-block',width:8,height:8,background:'#0072ff',borderRadius:'50%',marginRight:6}}></span>
													{client.name || client.client_name || `Client ${idx + 1}`}
												</li>
											))}
											{dealerData.clients.length > 10 && (
												<li style={{fontSize:11, color:'#666', fontStyle:'italic', marginTop:4}}>
													...and {dealerData.clients.length - 10} more
												</li>
											)}
										</ul>
									</div>
								</>
							) : (
								<div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f8f9fa', borderRadius: 12}}>
									<div style={{textAlign: 'center', color: '#888'}}>
										<i className="ri-map-pin-line" style={{fontSize: 48, marginBottom: 16, display: 'block'}}></i>
										<p>No client locations available</p>
										<p style={{fontSize: 14, marginTop: 8}}>Client locations will appear here once available.</p>
									</div>
								</div>
							)}
												</div>
												{/* My Clients Table - below map */}
												<div className="dashboard-latest" style={{ marginTop: 100, marginBottom: 32, display: 'flex', gap: 32, alignItems: 'flex-start' }}>
													<div className="table-container" style={{ flex: 1, minWidth: 0 }}>
														<table className="vehicle-challan-table my-clients-table" style={{ width: '100%', marginTop: 8, tableLayout: 'fixed', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px #0001' }}>
															<colgroup>
																<col style={{ width: '5%', textAlign: 'center' }} />
																<col style={{ width: '18%' }} />
																<col style={{ width: '14%' }} />
																<col style={{ width: '13%' }} />
																<col style={{ width: '13%' }} />
																<col style={{ width: '13%' }} />
																<col style={{ width: '13%' }} />
																<col style={{ width: '11%' }} />
																<col style={{ width: '10%' }} />
															</colgroup>
															<thead style={{ background: '#f5f7fa' }}>
																<tr>
																	<th style={{ textAlign: 'center' }}>S. No.</th>
																	<th style={{ textAlign: 'left' }}>Client Name</th>
																	<th style={{ textAlign: 'center' }}>Phone</th>
																	<th style={{ textAlign: 'center' }}>Registered Date</th>
																	<th style={{ textAlign: 'center' }}>Status</th>
																	<th style={{ textAlign: 'center' }}>Vehicles Registered</th>
																	<th style={{ textAlign: 'center' }}>RTO Records</th>
																	<th style={{ textAlign: 'center' }}>Challan Records</th>
																	<th style={{ textAlign: 'center' }}>View Client</th>
																</tr>
															</thead>
															<tbody>
																{loadingDealerData ? (
																	<tr><td colSpan={9} style={{ textAlign: 'center', color: '#888' }}>Loading clients...</td></tr>
																) : dealerDataError ? (
																	<tr><td colSpan={9} style={{ textAlign: 'center', color: 'red' }}>{dealerDataError}</td></tr>
																) : !dealerData?.clients?.length ? (
																	<tr><td colSpan={9} style={{ textAlign: 'center', color: '#888' }}>No clients found.</td></tr>
																) : (
																	dealerData.clients.map((client, idx) => {
																		let status = (client.status || 'Not Available').toUpperCase();
																		let statusColor = '#888';
																		if (status === 'ACTIVE') statusColor = '#43e97b';
																		else if (status === 'INACTIVE') statusColor = '#ffa726';
																		else if (status === 'DELETED') statusColor = '#e57373';
																		let regDate = client.registered_at || client.created_at || client.registration_date;
																		let regDateStr = regDate ? new Date(regDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
																		let stats = client.statistics || {};
																		let vehiclesRegistered = stats.vehicles_registered ?? '';
																		let rtoRecords = stats.rto_records ?? '';
																		let challanRecords = stats.challan_records ?? '';
																		let phone = (client.meta && client.meta.phone) || client.phone || client.mobile || client.contact || '-';
																		return (
																			<tr key={client.id || client._id || idx} className="my-clients-row" style={{ transition: 'background 0.2s', cursor: 'pointer' }}>
																				<td style={{ textAlign: 'center', fontWeight: 500 }}>{idx + 1}</td>
																																																																																<td style={{ textAlign: 'left', background: 'none', border: 'none' }}>
																																																																																	<span
																																																																																		style={{
																																																																																			display: 'inline-block',
																																																																																			fontWeight: 600,
																																																																																			color: '#222',
																																																																																			background: '#f3f6fa',
																																																																																			letterSpacing: 0.5,
																																																																																			cursor: 'pointer',
																																																																																			borderRadius: '8px',
																																																																																			padding: '7px 18px',
																																																																																			fontSize: '1em',
																																																																																			border: '1px solid #e3e8ee',
																																																																																			boxShadow: '0 1px 4px #0001',
																																																																																			transition: 'background 0.18s, color 0.18s',
																																																																																			margin: '6px 0',
																																																																																			minWidth: 120,
																																																																																		}}
																																																																																		onClick={() => {
																																																																																			setClientVehiclesPageClient(client.id || client._id || client.email);
																																																																																			setActiveMenu('Client Vehicles');
																																																																																		}}
																																																																																		onMouseOver={e => {
																																																																																			e.currentTarget.style.background='#e3f0ff';
																																																																																			e.currentTarget.style.color='#1976d2';
																																																																																		}}
																																																																																		onMouseOut={e => {
																																																																																			e.currentTarget.style.background='#f3f6fa';
																																																																																			e.currentTarget.style.color='#222';
																																																																																		}}
																																																																																	>
																																																																																		{client.name || client.client_name || 'Client'}
																																																																																	</span>
																																																																																</td>
																				<td style={{ textAlign: 'center' }}>{phone}</td>
																				<td style={{ textAlign: 'center' }}>{regDateStr}</td>
																				<td style={{ color: statusColor, fontWeight: 700, letterSpacing: 1, textAlign: 'center' }}>{status}</td>
																				<td style={{ textAlign: 'center' }}>{vehiclesRegistered}</td>
																				<td style={{ textAlign: 'center' }}>{rtoRecords}</td>
																				<td style={{ textAlign: 'center' }}>{challanRecords}</td>
																				<td style={{ textAlign: 'center' }}>
																					<button className="action-btn flat-btn" style={{ padding: '4px 10px', fontSize: 14 }} onClick={e => { e.stopPropagation(); setSelectedClient(client); }}>
																						View Client
																					</button>
																				</td>
																			</tr>
																		);
																	})
																)}
															</tbody>
														</table>
													</div>
													{/* Right Sidebar for Client Details */}
													{selectedClient && (
														<div style={{width:'370px',minWidth:260,maxWidth:'90vw',background:'#f8fafc',border:'1.5px solid #e3e8ee',borderRadius:10,boxShadow:'0 2px 12px #0001',padding:'18px 18px 12px 18px',position:'sticky',top:24,alignSelf:'flex-start',zIndex:2}}>
															<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
																<span style={{fontWeight:700,fontSize:'1.1rem',color:'#1976d2'}}>Client Details</span>
																<button onClick={()=>setSelectedClient(null)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#888',fontWeight:700}} title="Close">×</button>
															</div>
															<div style={{ fontSize: 15, minWidth: 260 }}>
																<table style={{ width: '100%', borderCollapse: 'collapse' }}>
																	<tbody>
																		{Object.entries(selectedClient).map(([key, value]) => {
																			if (["password", "role", "admin_id", "dealer_id", "client_id", "updated_at"].includes(key)) return null;
																			if (key === 'meta' && value && typeof value === 'object') {
																				return Object.entries(value)
																					.filter(([mKey]) => mKey !== 'id' && mKey !== 'user_id')
																					.map(([mKey, mVal]) => (
																						<tr key={"meta-" + mKey}>
																							<td style={{ fontWeight: 600, padding: '6px 12px', background: '#f5f7fa', border: '1px solid #e3f0ff', width: '38%', textAlign: 'left', verticalAlign: 'top' }}>{mKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td>
																							<td style={{ padding: '6px 12px', border: '1px solid #e3f0ff', background: '#fff', textAlign: 'left', verticalAlign: 'top', width: '62%' }}>{mVal == null ? '-' : String(mVal)}</td>
																						</tr>
																					));
																			}
																			if (key === 'statistics' && value && typeof value === 'object') {
																				return Object.entries(value).map(([sKey, sVal]) => (
																					<tr key={"statistics-" + sKey}>
																						<td style={{ fontWeight: 600, padding: '6px 12px', background: '#f5f7fa', border: '1px solid #e3f0ff', width: '38%', textAlign: 'left', verticalAlign: 'top' }}>{sKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td>
																						<td style={{ padding: '6px 12px', border: '1px solid #e3f0ff', background: '#fff', textAlign: 'left', verticalAlign: 'top', width: '62%' }}>{sVal == null ? '-' : String(sVal)}</td>
																					</tr>
																				));
																			}
																			if (typeof value === 'object' && value !== null) {
																				return null;
																			}
																			return (
																				<tr key={key}>
																					<td style={{ fontWeight: 600, padding: '6px 12px', background: '#f5f7fa', border: '1px solid #e3f0ff', width: '38%', textAlign: 'left', verticalAlign: 'top' }}>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td>
																					<td style={{ padding: '6px 12px', border: '1px solid #e3f0ff', background: '#fff', textAlign: 'left', verticalAlign: 'top', width: '62%' }}>{value == null ? '-' : String(value)}</td>
																				</tr>
																			);
																		})}
																	</tbody>
																</table>
															</div>
														</div>
													)}
												</div>
					</>
				)}
				{activeMenu === "Profile" && <DealerProfile />}
								{activeMenu === "Register Vehicle" && <DealerRegisterVehicle clients={dealerData?.clients || []} />}
								{activeMenu === "Client Vehicles" && (
									<ClientVehiclesPage
										clients={dealerData?.clients || []}
										initialClientId={clientVehiclesPageClient}
										key={clientVehiclesPageClient || 'default'}
									/>
								)}
				{activeMenu === "Settings" && <ClientSettings clients={dealerData?.clients || []} />}
				{activeMenu === "Register Client" && <DealerRegisterClientPage />}
				{activeMenu === "Add client" && <AddClientPage />}
				{activeMenu === "Register New Client" && <AddClientPage />}
			</main>
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

export default DealerDashboard;
