// Copy of AdminDashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import DealerSidebar from "./DealerSidebar";
import DealerProfile from "./DealerProfile";
import RegisterClient from "./RegisterClient";
import "../shared/CommonDashboard.css";
import "./DealerDashboardOverrides.css";
import "./DealerHome.css";

import DealerRegisterVehicle from "./DealerRegisterVehicle";
import ClientSettings from "./ClientSettings";
import CustomModal from "../client/CustomModal";
import QuickActions from "../client/QuickActions";

function DealerDashboard() {
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
	const user = (() => {
		try {
			return JSON.parse(localStorage.getItem('sc_user')) || {};
		} catch {
			return {};
		}
	})();

	// Fetch dealer data using new endpoint
	useEffect(() => {
		const dealerId = user.user && user.user.id;
		const userRole = user.user && user.user.role;
		
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
	}, [user.user?.id, user.user?.role]); // Run when dealer ID or role changes

	// Clients pie chart - show clients by city
	useEffect(() => {
		if (!chartRef2.current || !dealerData?.clients) return;
		import('chart.js/auto').then(({ default: Chart }) => {
			const ctx = chartRef2.current.getContext('2d');
			ctx.clearRect(0, 0, chartRef2.current.width, chartRef2.current.height);
			
			// Group clients by city
			const cityCount = {};
			dealerData.clients.forEach(client => {
				const city = client.city || client.address?.split(',').pop()?.trim() || 'Other';
				cityCount[city] = (cityCount[city] || 0) + 1;
			});
			
			// Convert to chart data
			const cities = Object.keys(cityCount);
			const counts = Object.values(cityCount);
			const colors = [
				'#ff6384', '#36a2eb', '#ffce56', '#8bc34a', 
				'#ff9f40', '#c9cbcf', '#4bc0c0', '#ff6384'
			];
			
			const data = {
				labels: cities.length > 0 ? cities : ['No Data'],
				datasets: [{
					data: counts.length > 0 ? counts : [1],
					backgroundColor: cities.length > 0 ? colors.slice(0, cities.length) : ['#e0e0e0'],
				}],
			};
			
			if (window._clientsPieChart) window._clientsPieChart.destroy();
			window._clientsPieChart = new Chart(ctx, {
				type: 'doughnut',
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
		if (!chartRef3.current || !dealerData?.vehicle_types) return;
		import('chart.js/auto').then(({ default: Chart }) => {
			const ctx = chartRef3.current.getContext('2d');
			ctx.clearRect(0, 0, chartRef3.current.width, chartRef3.current.height);
			
			// Use API data for vehicle types or show default data
			const vehicleData = dealerData.vehicle_types || {
				'Car': dealerData.vehicles_registered ? Math.floor(dealerData.vehicles_registered * 0.5) : 0,
				'Bike': dealerData.vehicles_registered ? Math.floor(dealerData.vehicles_registered * 0.3) : 0,
				'Truck': dealerData.vehicles_registered ? Math.floor(dealerData.vehicles_registered * 0.15) : 0,
				'Others': dealerData.vehicles_registered ? Math.floor(dealerData.vehicles_registered * 0.05) : 0,
			};
			
			const labels = Object.keys(vehicleData);
			const counts = Object.values(vehicleData);
			
			const data = {
				labels: labels.length > 0 ? labels : ['No Data'],
				datasets: [{
					data: counts.length > 0 && counts.some(c => c > 0) ? counts : [1],
					backgroundColor: labels.length > 0 ? [
						'#42a5f5', '#66bb6a', '#ffa726', '#ab47bc',
					].slice(0, labels.length) : ['#e0e0e0'],
				}],
			};
			
			if (window._vehiclesRadialChart) window._vehiclesRadialChart.destroy();
			window._vehiclesRadialChart = new Chart(ctx, {
				type: 'polarArea',
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
			if (window._vehiclesRadialChart) window._vehiclesRadialChart.destroy();
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
		setActiveMenu(label);
		// Close sidebar on mobile after menu selection
		if (window.innerWidth <= 900) setSidebarOpen(false);
	};
	
	const toggleSidebar = () => setSidebarOpen(s => !s);

	return (
		<div className={`dashboard-layout ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
			{sidebarOpen && window.innerWidth <= 900 && (
				<div className="sidebar-overlay show" onClick={() => setSidebarOpen(false)} />
			)}
			<DealerSidebar role={userRole} onMenuClick={handleMenuClick} activeMenu={activeMenu} sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
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
						<div className="dashboard-header">
							<h1 className="dashboard-title">Welcome back{user.user && user.user.name ? `, ${user.user.name}` : '123'}!</h1>
							<p>Here's an overview of your challan status</p>
						</div>
						<div className="dashboard-stats">
							{/* First stat-card (Happy Dealers) removed for dealer dashboard */}
							<div className="stat-card">
								<i className="ri-user-heart-line"></i>
								<div>Happy Clients</div>
								<div className="stat-value">
									{loadingDealerData ? '...' : (dealerData?.total_clients || 0)}
								</div>
								<div className="clients-pie-chart-container" style={{maxWidth: 200, margin: '16px auto'}}>
									<canvas ref={chartRef2} width={200} height={200} />
								</div>
							</div>
							<div className="stat-card">
								<i className="ri-car-line"></i>
								<div>Registered Vehicles</div>
								<div className="stat-value">
									{loadingDealerData ? '...' : (dealerData?.vehicles_registered || 0)}
								</div>
								<div className="vehicles-radial-chart-container" style={{maxWidth: 200, margin: '16px auto'}}>
									<canvas ref={chartRef3} width={200} height={200} />
								</div>
							</div>
							<div className="stat-card">
								<i className="ri-money-rupee-circle-line"></i>
								<div>Challans Settled</div>
								<div className="stat-value">
									{loadingDealerData ? '...' : `₹${dealerData?.total_challans_amount?.toLocaleString() || dealerData?.challans_settled || '0'}`}
								</div>
								<div className="challans-bar-chart-container" style={{maxWidth: 220, margin: '16px auto'}}>
									<canvas ref={chartRef4} width={220} height={180} />
								</div>
							</div>
						</div>
						{/* Client Locations Map */}
						<div className="map-client-data" style={{ width: '100%', height: 450, margin: '32px 0', position: 'relative' }}>
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
										scrollWheelZoom={true}
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
						{/* Quick Actions using shared component */}
						<div style={{ padding: '0 30px 30px 30px' }}>
							<QuickActions
								title="Quick Actions"
								sticky={true}
								onAddVehicle={() => setActiveMenu('Register Client')}
								onBulkUpload={() => setActiveMenu('Register Vehicle')}
								onPay={() => {
									// For dealers, this could open billing info
									setSupportModal(true);
								}}
								onReports={() => {
									// For dealers, this could show dealer reports
									setSupportModal(true);
								}}
								onContact={() => setSupportModal(true)}
							/>
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
				{activeMenu === "Profile" && <DealerProfile />}
				{activeMenu === "Register Client" && <RegisterClient />}
				{activeMenu === "Register Vehicle" && <DealerRegisterVehicle />}
				{activeMenu === "Settings" && <ClientSettings clients={[]} />}
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
