// ...existing imports...
// ...other imports...
import LatestChallansTable from "./LatestChallansTable";
import TrafficLightLoader from "../assets/TrafficLightLoader";
import QuickActions from "./QuickActions";

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
import "./SpeedometerLoader.css"; /* For default loader styles */
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

// NOTE: do not read `sc_user` at module load time (causes stale user after login)
// ClientDashboard will read `sc_user` from localStorage when the component mounts.

const DriverVerification = lazy(() => import("./DriverVerification"));
const LazyVehicleFastag = lazy(() => import("./VehicleFastag"));

function ClientDashboard() {
  // Read current logged-in user from localStorage when component mounts.
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sc_user')) || {};
    } catch {
      return {};
    }
  });

  // Keep `user` in sync if other tabs update localStorage
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'sc_user') {
        try { setUser(JSON.parse(e.newValue) || {}); } catch { setUser({}); }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  // Handler for 'View All' in Latest Challans Table
  React.useEffect(() => {
    window.handleViewAllChallans = () => setActiveMenu('Vehicle Challan Data');
    // Also provide a handler for Vehicle RTO Data view all from VehicleDataTable
    window.handleViewAllRtoData = () => setActiveMenu('Vehicle RTO Data');
    return () => { delete window.handleViewAllChallans; delete window.handleViewAllRtoData; };
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
  const [reportsModal, setReportsModal] = useState({ open: false });
  // Chart refs
  const chartRefTotal = useRef(null);
  const chartRefActive = useRef(null);
  const chartRefPaid = useRef(null);
  const chartRefAmount = useRef(null);
  // Chart loading states
  const [chartLoading, setChartLoading] = useState({
    total: true,
    active: true, 
    paid: true,
    amount: true
  });
  const [chartErrors, setChartErrors] = useState({
    total: false,
    active: false,
    paid: false,
    amount: false
  });
  const [retryTrigger, setRetryTrigger] = useState(0);
  // Client data
  const [clientData, setClientData] = useState(null);
  const [selectedVehicleStatus, setSelectedVehicleStatus] = useState(null);
  const [loadingClient, setLoadingClient] = useState(true);
  // Vehicle challan data
  const [vehicleChallanData, setVehicleChallanData] = useState([]);
  const [loadingVehicleChallan, setLoadingVehicleChallan] = useState(false);
  const [vehicleChallanError, setVehicleChallanError] = useState("");
  // Vehicle RTO data for expiry tracking
  const [vehicleRtoData, setVehicleRtoData] = useState([]);
  const [loadingVehicleRto, setLoadingVehicleRto] = useState(false);
  // Vehicle search text (lifted state so MyVehicles can render the input and VehicleDataTable can filter)
  const [vehicleSearchText, setVehicleSearchText] = useState('');
  // Loader state
  const [showLoader, setShowLoader] = useState(false);
  // Active menu
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [selectedChallan, setSelectedChallan] = useState(null);
  // Sidebar open state: open by default on wide screens, closed on small screens
  const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth > 900 : true));

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
      // setShowLoader(true); // Page loader disabled
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
        // setShowLoader(false); // Page loader disabled
      }
    }
  };

  // Fetch client data on mount
  useEffect(() => {
    const fetchData = async () => {
      // setShowLoader(true); // Page loader disabled
      setLoadingClient(true);
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      // Get client id from logged-in user
      const clientId = user && user.user && (user.user.id || user.user._id || user.user.client_id);
      if (!clientId) {
        setClientData(null);
        setLoadingClient(false);
        // setTimeout(() => setShowLoader(false), 1000); // Page loader disabled
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
        // Page loader disabled - using only graph loaders now
        // const elapsed = Date.now() - start;
        // if (elapsed < 1000) {
        //   setTimeout(() => setShowLoader(false), 1000 - elapsed);
        // } else {
        //   setShowLoader(false);
        // }
      }
    };
    fetchData();
  }, [user]);

  // Fetch vehicle RTO data for expiry tracking
  useEffect(() => {
    const fetchVehicleRtoData = async () => {
      const clientId = user && user.user && (user.user.id || user.user._id || user.user.client_id);
      if (!clientId) return;

      setLoadingVehicleRto(true);
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      
      try {
        const res = await fetch(`${baseUrl}/getvehiclertodata?clientId=${clientId}`);
        const data = await res.json();
        let rtoData = [];
        if (Array.isArray(data)) {
          rtoData = data.map(item => item.rto_data && item.rto_data.VehicleDetails ? item.rto_data.VehicleDetails : null).filter(Boolean);
        } else if (Array.isArray(data.vehicleDetails)) {
          rtoData = data.vehicleDetails;
        }
        setVehicleRtoData(rtoData);
      } catch (error) {
        console.error("Failed to fetch vehicle RTO data:", error);
        setVehicleRtoData([]);
      } finally {
        setLoadingVehicleRto(false);
      }
    };
    
    fetchVehicleRtoData();
  }, [user]);

  // Calculate expiry statistics with color-based categorization (matching VehicleDataTable logic)
  const calculateExpiryStats = () => {
    if (!Array.isArray(vehicleRtoData)) return { 
      red: { pollution: 0, insurance: 0, roadTax: 0, fitness: 0, total: 0 },
      orange: { pollution: 0, insurance: 0, roadTax: 0, fitness: 0, total: 0 },
      green: { pollution: 0, insurance: 0, roadTax: 0, fitness: 0, total: 0 },
      total: { pollution: 0, insurance: 0, roadTax: 0, fitness: 0, total: 0 }
    };
    
    const now = new Date();
    
    const parseDate = (dateStr) => {
      if (!dateStr || dateStr === '-') return null;
      
      // Handle different date formats
      if (/\d{2}-[A-Za-z]{3}-\d{4}/.test(dateStr)) {
        return new Date(dateStr.replace(/-/g, ' '));
      } else if (/\d{2}-\d{2}-\d{4}/.test(dateStr)) {
        const [day, month, year] = dateStr.split('-');
        return new Date(`${year}-${month}-${day}`);
      } else if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        return new Date(dateStr);
      }
      return new Date(dateStr);
    };
    
    const getExpiryCategory = (dateStr) => {
      const date = parseDate(dateStr);
      if (!date || isNaN(date.getTime())) return null;
      const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 60) return 'red';
      else if (diffDays <= 90) return 'orange';
      else return 'green';
    };
    
    let stats = {
      red: { pollution: 0, insurance: 0, roadTax: 0, fitness: 0, total: 0 },
      orange: { pollution: 0, insurance: 0, roadTax: 0, fitness: 0, total: 0 },
      green: { pollution: 0, insurance: 0, roadTax: 0, fitness: 0, total: 0 },
      total: { pollution: 0, insurance: 0, roadTax: 0, fitness: 0, total: 0 }
    };
    
    vehicleRtoData.forEach(vehicle => {
      // Pollution expiry
      const pollutionCategory = getExpiryCategory(vehicle.pollution_exp);
      if (pollutionCategory) {
        stats[pollutionCategory].pollution++;
        stats.total.pollution++;
      }
      
      // Insurance expiry
      const insuranceCategory = getExpiryCategory(vehicle.insurance_exp);
      if (insuranceCategory) {
        stats[insuranceCategory].insurance++;
        stats.total.insurance++;
      }
      
      // Road tax expiry
      const roadTaxCategory = getExpiryCategory(vehicle.road_tax_exp);
      if (roadTaxCategory) {
        stats[roadTaxCategory].roadTax++;
        stats.total.roadTax++;
      }
      
      // Fitness expiry
      const fitnessCategory = getExpiryCategory(vehicle.fitness_exp);
      if (fitnessCategory) {
        stats[fitnessCategory].fitness++;
        stats.total.fitness++;
      }
    });
    
    // Calculate totals for each category
    Object.keys(stats).forEach(category => {
      if (category !== 'total') {
        stats[category].total = stats[category].pollution + stats[category].insurance + 
                               stats[category].roadTax + stats[category].fitness;
      }
    });
    
    stats.total.total = stats.total.pollution + stats.total.insurance + 
                       stats.total.roadTax + stats.total.fitness;
    
    return stats;
  };

  // Draw charts for stat cards
  useEffect(() => {
    if (activeMenu !== "Dashboard") return;
    
    // Check if required data is available and not still loading
    const hasRequiredData = clientData && vehicleChallanData && vehicleRtoData;
    const isStillLoading = loadingVehicleChallan || loadingVehicleRto;
    
    console.log('Data and loading state:', {
      clientData: !!clientData,
      vehicleChallanData: !!vehicleChallanData,
      vehicleRtoData: !!vehicleRtoData,
      loadingVehicleChallan,
      loadingVehicleRto,
      hasRequiredData,
      isStillLoading
    });
    
    if (!hasRequiredData || isStillLoading) {
      console.log('Data not ready or still loading, keeping loaders...');
      setChartLoading({ total: true, active: true, paid: true, amount: true });
      setChartErrors({ total: false, active: false, paid: false, amount: false });
      return;
    }
    
    // Reset loading states when starting
    setChartLoading({ total: true, active: true, paid: true, amount: true });
    setChartErrors({ total: false, active: false, paid: false, amount: false });
    
    // Record start time for minimum display duration
    const loadingStartTime = Date.now();
    const minDisplayTime = 4000; // 4 seconds
    
    // Delay chart drawing to ensure canvas refs are mounted
    const timeout = setTimeout(() => {
      console.log('Starting chart creation with data available...');
      
      let retryCount = 0;
      const maxRetries = 20; // 2 seconds total (20 * 100ms)
      
      const checkCanvasRefsAndCreateCharts = () => {
        console.log(`Canvas refs check (attempt ${retryCount + 1}):`, {
          total: !!chartRefTotal.current,
          active: !!chartRefActive.current,
          paid: !!chartRefPaid.current,
          amount: !!chartRefAmount.current
        });
        
        if (!chartRefTotal.current || !chartRefActive.current || !chartRefPaid.current || !chartRefAmount.current) {
          retryCount++;
          if (retryCount >= maxRetries) {
            console.log('Canvas refs timeout - showing error state');
            setChartErrors({ total: true, active: true, paid: true, amount: true });
            setChartLoading({ total: false, active: false, paid: false, amount: false });
            return;
          }
          console.log(`Canvas refs not ready yet, retrying in 100ms... (${retryCount}/${maxRetries})`);
          setTimeout(checkCanvasRefsAndCreateCharts, 100);
          return;
        }
        
        console.log('All canvas refs ready, loading Chart.js...');
        Promise.all([
          import('chart.js/auto')
        ]).then(([{ default: Chart }]) => {
          console.log('Chart.js loaded successfully');
          
          // Double-check data is still available (in case component unmounted/data changed)
          if (!clientData || !vehicleChallanData || !vehicleRtoData) {
            console.log('Data no longer available, aborting chart creation');
            return;
          }
          
          try {
          
          // Calculate expiry counts for the paid chart
          const expiryThresholdDays = parseInt(import.meta.env.VITE_EXPIRY_PERIOD_DAYS || '60', 10) || 60;
          const expiryCounts = { insurance: 0, roadTax: 0, fitness: 0, pollution: 0 };
          if (Array.isArray(vehicleRtoData)) {
            const now = new Date();
            const parseDateStr = (dateStr) => {
              if (!dateStr || dateStr === '-') return null;
              if (/\d{2}-[A-Za-z]{3}-\d{4}/.test(dateStr)) return new Date(dateStr.replace(/-/g, ' '));
              if (/\d{2}-\d{2}-\d{4}/.test(dateStr)) {
                const [d, m, y] = dateStr.split('-');
                return new Date(`${y}-${m}-${d}`);
              }
              if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) return new Date(dateStr);
              return new Date(dateStr);
            };
            const withinThreshold = (dateStr) => {
              const d = parseDateStr(dateStr);
              if (!d || isNaN(d.getTime())) return false;
              const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
              return diffDays <= expiryThresholdDays;
            };
            vehicleRtoData.forEach(v => {
              if (withinThreshold(v.insurance_exp || v.insuranceUpto || v.rc_insurance_upto)) expiryCounts.insurance++;
              if (withinThreshold(v.road_tax_exp || v.roadTaxExp || v.rc_tax_upto)) expiryCounts.roadTax++;
              if (withinThreshold(v.fitness_exp || v.fitnessUpto || v.rc_fit_upto)) expiryCounts.fitness++;
              if (withinThreshold(v.pollution_exp || v.pollutionUpto || v.rc_pucc_upto)) expiryCounts.pollution++;
            });
          }
          
          // Helper function to clear loading state with minimum display time
          const clearLoadingWithDelay = (chartType) => {
            const elapsed = Date.now() - loadingStartTime;
            const remainingTime = Math.max(0, minDisplayTime - elapsed);
            
            setTimeout(() => {
              setChartLoading(prev => ({ ...prev, [chartType]: false }));
              setChartErrors(prev => ({ ...prev, [chartType]: false }));
            }, remainingTime);
          };
          
          // Set individual chart loading states to false as each chart is created successfully
          // Registered Vehicles (doughnut) - compute counts and draw interactive chart
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
        const totalData = [active, inactive, deleted];
        window._clientTotalChart = new Chart(ctxTotal, {
          type: 'doughnut',
          data: {
            labels: ['Active', 'Inactive', 'Deleted'],
            datasets: [{
              data: totalData,
              backgroundColor: ['#42a5f5', '#ffa726', '#e15759'],
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            cutout: '60%',
            onClick: (evt, elements) => {
              if (elements && elements.length > 0) {
                const idx = elements[0].index;
                const label = ['active','inactive','deleted'][idx];
                try { setSelectedVehicleStatus(label); } catch (e) {}
                // navigate to Registered Vehicles view for details
                try { setActiveMenu('Registered Vehicles'); } catch(e) {}
              }
            }
          }
        });
        clearLoadingWithDelay('total');
        console.log('Total vehicles chart created successfully');
        
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
              backgroundColor: ['#e74c3c', '#66bb6a'],
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            cutout: '20%'
          }
        });
        clearLoadingWithDelay('active');
        
        // Vehicle Expiry Statistics (horizontal bar showing counts per expiry type)
        const ctxPaid = chartRefPaid.current && chartRefPaid.current.getContext('2d');
        if (ctxPaid) {
          // Use a polar area chart for clearer proportion view of expiry counts
          if (window._clientPaidChart) window._clientPaidChart.destroy();
          const paidData = [
            (expiryCounts.insurance || 0),
            (expiryCounts.roadTax || 0),
            (expiryCounts.fitness || 0),
            (expiryCounts.pollution || 0)
          ];
          window._clientPaidChart = new Chart(ctxPaid, {
            type: 'polarArea',
            data: {
              labels: ['Insurance', 'Road Tax', 'Fitness', 'Pollution'],
              datasets: [{
                data: paidData,
                backgroundColor: ['#ff5252', '#ff8a65', '#f4b400', '#42a5f5'],
                borderColor: '#ffffff',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { r: { ticks: { precision: 0, beginAtZero: true } } }
            }
          });
          clearLoadingWithDelay('paid');
        }
        
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
        // Create gentle vertical gradients for Pending and Paid slices
        const pendingGradient = ctxAmount.createLinearGradient(0, 0, 0, 160);
        pendingGradient.addColorStop(0, '#ff8a80');
        pendingGradient.addColorStop(1, '#e15759');
        const paidGradient = ctxAmount.createLinearGradient(0, 0, 0, 160);
        paidGradient.addColorStop(0, '#a5d6a7');
        paidGradient.addColorStop(1, '#66bb6a');

        window._clientAmountChart = new Chart(ctxAmount, {
          type: 'polarArea',
          data: {
            labels: ['Pending', 'Paid'],
            datasets: [{
              data: [pendingFine, disposedFine],
              backgroundColor: [pendingGradient, paidGradient],
              borderColor: '#ffffff',
              borderWidth: 1,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const label = context.label || '';
                    const value = Number(context.raw || 0);
                    return `${label}: ₹${value.toLocaleString()}`;
                  }
                }
              }
            },
            scales: {
              r: { ticks: { beginAtZero: true, precision: 0 } }
            }
          }
        });
        clearLoadingWithDelay('amount');
        console.log('All charts created successfully!');
        
          } catch (error) {
            console.error('Chart creation failed:', error);
            setChartErrors({ total: true, active: true, paid: true, amount: true });
            setChartLoading({ total: false, active: false, paid: false, amount: false });
          }
        }).catch(error => {
          console.error('Chart.js import failed:', error);
          setChartErrors({ total: true, active: true, paid: true, amount: true });
          setChartLoading({ total: false, active: false, paid: false, amount: false });
        });
      };
      
      // Start checking for canvas refs
      checkCanvasRefsAndCreateCharts();
    }, 100); // 100ms delay to ensure DOM is ready
    return () => {
      clearTimeout(timeout);
      // Destroy existing charts to prevent memory leaks
      if (window._clientTotalChart) {
        window._clientTotalChart.destroy();
        window._clientTotalChart = null;
      }
      if (window._clientActiveChart) {
        window._clientActiveChart.destroy();
        window._clientActiveChart = null;
      }
      if (window._clientPaidChart) {
        window._clientPaidChart.destroy();
        window._clientPaidChart = null;
      }
      if (window._clientAmountChart) {
        window._clientAmountChart.destroy();
        window._clientAmountChart = null;
      }
    };
  }, [clientData, vehicleChallanData, vehicleRtoData, activeMenu, retryTrigger, loadingVehicleChallan, loadingVehicleRto]);
  
  // Function to format numbers in brief format (1k, 1M, etc.)
  const formatBriefAmount = (amount) => {
    if (!amount || isNaN(amount)) return '0';
    
    const absAmount = Math.abs(amount);
    
    if (absAmount >= 10000000) { // 1 crore
      return (amount / 10000000).toFixed(1).replace(/\.0$/, '') + 'Cr';
    } else if (absAmount >= 100000) { // 1 lakh
      return (amount / 100000).toFixed(1).replace(/\.0$/, '') + 'L';
    } else if (absAmount >= 1000) { // 1 thousand
      return (amount / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    } else {
      return amount.toString();
    }
  };

  // Function to retry chart loading
  const retryCharts = () => {
    // Reset states
    setChartLoading({ total: true, active: true, paid: true, amount: true });
    setChartErrors({ total: false, active: false, paid: false, amount: false });
    
    // Trigger useEffect to run again
    setRetryTrigger(prev => prev + 1);
  };
  // Sidebar click handler
  const handleMenuClick = (label) => {
    // Page loader disabled - only using graph loaders now
    // setShowLoader(true);
    // setTimeout(() => {
      setActiveMenu(label);
      // setShowLoader(false);
      // on small screens, close sidebar after selecting a menu
      if (window.innerWidth <= 900) setSidebarOpen(false);
    // }, 300);
  };

  const toggleSidebar = () => setSidebarOpen(s => !s);

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
        // Helper to parse various date formats and return epoch time
        const parse = s => s ? new Date(String(s).replace(/(\d{2})-(\d{2})-(\d{4})/, '$2/$1/$3')).getTime() : 0;
        const sortByCreatedDesc = (arr) => {
          if (!Array.isArray(arr)) return arr || [];
          return arr.slice().sort((a, b) => {
            const aT = parse(a.created_at || a.createdAt || a.challan_date_time);
            const bT = parse(b.created_at || b.createdAt || b.challan_date_time);
            return (bT || 0) - (aT || 0);
          });
        };

        if (Array.isArray(data)) {
          // For each vehicle, sort its pending and disposed arrays by newest first
          const processed = data.map(vehicle => ({
            ...vehicle,
            pending_data: sortByCreatedDesc(vehicle.pending_data),
            disposed_data: sortByCreatedDesc(vehicle.disposed_data)
          }));
          setVehicleChallanData(processed);
        } else if (Array.isArray(data.challans)) {
          const processed = data.challans.map(vehicle => ({
            ...vehicle,
            pending_data: sortByCreatedDesc(vehicle.pending_data),
            disposed_data: sortByCreatedDesc(vehicle.disposed_data)
          }));
          setVehicleChallanData(processed);
        } else setVehicleChallanData([]);
      })
      .catch(() => setVehicleChallanData([]))
      .finally(() => setLoadingVehicleChallan(false));
  }, [activeMenu]);

  // Calculate latestChallanRows for LatestChallansTable
  let latestChallanRows = [];
  let totalChallans = 0;

  const formatRegCourtValue = (v) => {
    if (v === null || v === undefined || v === '') return '-';
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (typeof v === 'string') {
      const s = v.trim();
      if (!s) return '-';
      if (s.toLowerCase() === 'yes' || s.toLowerCase() === 'no') return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      // If it's a date-like string, shorten to YYYY-MM-DD or first 10 chars
      if (/\d{4}-\d{2}-\d{2}/.test(s) || /\d{2}-\d{2}-\d{4}/.test(s) || /\d{2}-[A-Za-z]{3}-\d{4}/.test(s)) return s.length > 10 ? s.slice(0, 10) : s;
      return s;
    }
    return String(v);
  };
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
    totalChallans = allChallans.length;
    // Sort by newest first using the same parsing logic as MyChallans
    // Prefer `created_at`, then `createdAt`, then fallback to `challan_date_time`.
    const parseDate = s => s ? new Date(String(s).replace(/(\d{2})-(\d{2})-(\d{4})/, '$2/$1/$3')).getTime() : 0;
    allChallans.sort((a, b) => {
      const aTime = parseDate(a.created_at || a.createdAt || a.challan_date_time);
      const bTime = parseDate(b.created_at || b.createdAt || b.challan_date_time);
      return (bTime || 0) - (aTime || 0);
    });
    // Take only 5 latest
    const latestChallans = allChallans.slice(0, 5);
    if (latestChallans.length === 0) {
      latestChallanRows = [<tr key="no-challans"><td colSpan={11} style={{textAlign:'center',color:'#888'}}>No challans found.</td></tr>];
    } else {
      latestChallanRows = latestChallans.map((c, idx) => (
        <tr key={`${c.statusType}-${c.vehicle_number}-${c.challan_no}-${idx}`}>
          <td>{idx + 1}</td>
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
          <td style={{ textAlign: 'center' }}>
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
          <td style={{ textAlign: 'center' }}>{formatRegCourtValue(c.sent_to_reg_court ?? c.sent_to_court_on ?? c.sent_to_court)}</td>
          <td style={{ textAlign: 'center' }}>{formatRegCourtValue(c.sent_to_virtual_court ?? c.sent_to_virtual)}</td>
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

  // Counts for dashboard stat card: pending and disposed
  let dashboardPendingCount = 0, dashboardDisposedCount = 0;
  if (Array.isArray(vehicleChallanData)) {
    vehicleChallanData.forEach(item => {
      dashboardPendingCount += Array.isArray(item.pending_data) ? item.pending_data.length : 0;
      dashboardDisposedCount += Array.isArray(item.disposed_data) ? item.disposed_data.length : 0;
    });
  }
  const dashboardTotalChallans = dashboardPendingCount + dashboardDisposedCount;

  // Vehicle RTO expiry counts (expiring soon) - compute from vehicleRtoData
  const expiryThresholdDays = parseInt(import.meta.env.VITE_EXPIRY_PERIOD_DAYS || '60', 10) || 60;
  const expiryCounts = { insurance: 0, roadTax: 0, fitness: 0, pollution: 0 };
  if (Array.isArray(vehicleRtoData)) {
    const now = new Date();
    const parseDateStr = (dateStr) => {
      if (!dateStr || dateStr === '-') return null;
      // Handle common formats used earlier
      if (/\d{2}-[A-Za-z]{3}-\d{4}/.test(dateStr)) return new Date(dateStr.replace(/-/g, ' '));
      if (/\d{2}-\d{2}-\d{4}/.test(dateStr)) {
        const [d, m, y] = dateStr.split('-');
        return new Date(`${y}-${m}-${d}`);
      }
      if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) return new Date(dateStr);
      return new Date(dateStr);
    };
    const withinThreshold = (dateStr) => {
      const d = parseDateStr(dateStr);
      if (!d || isNaN(d.getTime())) return false;
      const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
      // Include already-passed dates (expired) as well as upcoming dates within threshold
      return diffDays <= expiryThresholdDays;
    };
    vehicleRtoData.forEach(v => {
      if (withinThreshold(v.insurance_exp || v.insuranceUpto || v.rc_insurance_upto)) expiryCounts.insurance++;
      if (withinThreshold(v.road_tax_exp || v.roadTaxExp || v.rc_tax_upto)) expiryCounts.roadTax++;
      if (withinThreshold(v.fitness_exp || v.fitnessUpto || v.rc_fit_upto)) expiryCounts.fitness++;
      if (withinThreshold(v.pollution_exp || v.pollutionUpto || v.rc_pucc_upto)) expiryCounts.pollution++;
    });
  }

  // Total renewals count (sum of categories) for display in stat card
  const vehicleRenewalsTotal = (expiryCounts.insurance || 0) + (expiryCounts.roadTax || 0) + (expiryCounts.fitness || 0) + (expiryCounts.pollution || 0);

  // Compute challan amount totals (pending and disposed) so we can show total at card title
  let pendingFineTotal = 0, disposedFineTotal = 0;
  if (Array.isArray(vehicleChallanData)) {
    vehicleChallanData.forEach(item => {
      if (Array.isArray(item.pending_data)) {
        pendingFineTotal += item.pending_data.reduce((sum, c) => sum + (parseFloat(c.fine_imposed) || 0), 0);
      }
      if (Array.isArray(item.disposed_data)) {
        disposedFineTotal += item.disposed_data.reduce((sum, c) => sum + (parseFloat(c.fine_imposed) || 0), 0);
      }
    });
  }
  const totalFineAmount = pendingFineTotal + disposedFineTotal;

    // Helper: convert array of objects to CSV string
      const arrayToCsv = (arr) => {
        if (!Array.isArray(arr) || arr.length === 0) return '';
        const headers = Array.from(arr.reduce((set, item) => { Object.keys(item || {}).forEach(k => set.add(k)); return set; }, new Set()));
        const rows = arr.map(obj => headers.map(h => {
          let val = obj[h] == null ? '' : obj[h];
          if (typeof val === 'object') val = JSON.stringify(val);
          val = String(val).replace(/"/g, '""');
          if (/[,"\n]/.test(val)) val = `"${val}"`;
          return val;
        }).join(','));
        return [headers.join(','), ...rows].join('\n');
      };

      // Helper: create CSV with deterministic header order and friendly labels
      const arrayToCsvWithOrder = (arr, preferredOrder = [], labelMap = {}) => {
        if (!Array.isArray(arr) || arr.length === 0) return '';
        // Collect all keys present in the data
        const keySet = arr.reduce((set, item) => { Object.keys(item || {}).forEach(k => set.add(k)); return set; }, new Set());
        const remaining = Array.from(keySet);
        // Start with preferredOrder keys that actually exist
        const headers = [];
        preferredOrder.forEach(k => {
          if (remaining.includes(k)) {
            headers.push(k);
            const idx = remaining.indexOf(k);
            if (idx >= 0) remaining.splice(idx, 1);
          }
        });
        // Append any remaining keys in stable alphabetical order
        remaining.sort();
        headers.push(...remaining);

        // Build CSV header row using friendly labels when available
        const headerLabels = headers.map(h => labelMap[h] || h);
        const rows = arr.map(obj => headers.map(h => {
          let val = obj[h] == null ? '' : obj[h];
          if (typeof val === 'object') val = JSON.stringify(val);
          val = String(val).replace(/"/g, '""');
          if (/[,"\n]/.test(val)) val = `"${val}"`;
          return val;
        }).join(','));

        return [headerLabels.join(','), ...rows].join('\n');
      };

      // Exporting state for showing spinner/disabled
      const [exporting, setExporting] = useState({ rto: false, challan: false });

    const downloadCsv = (csv, filename) => {
      if (!csv) { toast.info('No data available for export'); return; }
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Report download started');
      setReportsModal({ open: false });
    };

    const generateRtoReport = () => {
      if (!Array.isArray(vehicleRtoData) || vehicleRtoData.length === 0) { toast.info('No RTO data available to export'); return; }
      // Wrap in async IIFE so we can set exporting state and ensure it resets
      (async () => {
        try {
          setExporting(e => ({ ...e, rto: true }));
          const rows = vehicleRtoData.map((r, idx) => {
            // Prefer rc_regn_no as the canonical vehicle number for RTO exports
            const vnum = r.rc_regn_no || r.vehicle_number || r.vehicle_no || r.registration_no || r.regn_no || r.reg_no || r.regNo || r.vehicleNo || '';
            // create a shallow copy and remove noisy/internal fields we don't want in the CSV
            const r2 = { ...r };
            // remove API response message column (column C) if present
            if (r2.api_response_message) delete r2.api_response_message;
            // also remove the original rc_regn_no field so it doesn't appear twice
            if (r2.rc_regn_no) delete r2.rc_regn_no;
            return ({ "S. No.": idx + 1, vehicle_number: vnum, ...r2 });
          });
          // Preferred column order and friendly labels for RTO exports
          const preferredOrder = ["S. No.", "vehicle_number", "owner_name", "engine_no", "chasis_no", "registration_no", "regn_no", "rc_no", "insurance_exp", "road_tax_exp", "fitness_exp", "pollution_exp", "created_at", "createdAt"];
          const labelMap = {
            "S. No.": "S. No.",
            vehicle_number: "Vehicle Number",
            owner_name: "Owner Name",
            engine_no: "Engine Number",
            chasis_no: "Chassis Number",
            registration_no: "Registration No",
            regn_no: "Registration No",
            rc_no: "RC No",
            insurance_exp: "Insurance Upto",
            road_tax_exp: "Road Tax Upto",
            fitness_exp: "Fitness Upto",
            pollution_exp: "Pollution Upto",
            created_at: "Created At",
            createdAt: "Created At"
          };
          const csv = arrayToCsvWithOrder(rows, preferredOrder, labelMap);
          const name = `rto-data-report-${new Date().toISOString().slice(0,10)}.csv`;
          downloadCsv(csv, name);
        } finally {
          setExporting(e => ({ ...e, rto: false }));
        }
      })();
    };

    const generateChallanReport = () => {
      let rows = [];
      if (Array.isArray(vehicleChallanData)) {
        vehicleChallanData.forEach(item => {
          const vnum = item.vehicle_number || item.vehicle_no || item.registration_no || '';
          if (Array.isArray(item.pending_data)) item.pending_data.forEach(c => rows.push({ ...c, vehicle_number: vnum, statusType: 'Pending' }));
          if (Array.isArray(item.disposed_data)) item.disposed_data.forEach(c => rows.push({ ...c, vehicle_number: vnum, statusType: 'Disposed' }));
        });
      }
      if (rows.length === 0) { toast.info('No challan data available to export'); return; }
      (async () => {
        try {
          setExporting(e => ({ ...e, challan: true }));
          const numbered = rows.map((r, idx) => ({ "S. No.": idx + 1, vehicle_number: r.vehicle_number || '', ...r }));
          const preferredOrder = ["S. No.", "vehicle_number", "challan_no", "challan_date_time", "created_at", "createdAt", "challan_status", "fine_imposed", "received_amount", "receipt_no", "owner_name", "driver_name", "department", "rto_distric_name", "state_code", "statusType"];
          const labelMap = {
            "S. No.": "S. No.",
            vehicle_number: "Vehicle Number",
            challan_no: "Challan No",
            challan_date_time: "Challan Date/Time",
            created_at: "Created At",
            createdAt: "Created At",
            challan_status: "Status",
            fine_imposed: "Fine Imposed",
            received_amount: "Received Amount",
            receipt_no: "Receipt No",
            owner_name: "Owner Name",
            driver_name: "Driver Name",
            department: "Department",
            rto_distric_name: "RTO District",
            state_code: "State Code",
            statusType: "Status Type"
          };
          const csv = arrayToCsvWithOrder(numbered, preferredOrder, labelMap);
          const name = `challan-data-report-${new Date().toISOString().slice(0,10)}.csv`;
          downloadCsv(csv, name);
        } finally {
          setExporting(e => ({ ...e, challan: false }));
        }
      })();
    };

    return (
    <>
    <ToastContainer position="top-right" autoClose={2000} />
  <div className="admin-dashboard-layout" style={{display: 'flex', width: '100%', minHeight: '100vh'}}>
      {/* Page loader commented out - only using graph loaders now */}
      {/* {showLoader && (
        <div className="page-loader-overlay">
          <TrafficLightLoader />
        </div>
      )} */}
  <ClientSidebar role={userRole} onMenuClick={handleMenuClick} activeMenu={activeMenu} sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
      <main className="main-content admin-home-content" style={{flex: 1, minHeight: '100vh'}}>
        <div className="header" style={{marginBottom: 24}}>
            <div className="header-left" style={{display:'flex',alignItems:'center',gap:16}}>
            <div className="menu-toggle" style={{fontSize:22,cursor:'pointer'}} onClick={toggleSidebar}>
              <i className="ri-menu-line"></i>
            </div>
            <div className="header-title" style={{fontWeight:600}}>
              {activeMenu === 'Dashboard' ? 'Dashboard'
                : activeMenu === 'Profile' ? 'Profile'
                : activeMenu === 'Registered Vehicles' ? 'Registered Vehicles'
                : activeMenu === 'Challans' ? 'Vehicle Challan Data'
                : activeMenu === 'Billing' ? 'My Billing'
                : activeMenu === 'Settings' ? 'Settings'
                : activeMenu}
            </div>
          </div>
          <div className="header-right" style={{display:'flex',alignItems:'center',gap:18,cursor:'pointer'}} onClick={() => setActiveMenu('Profile')} role="button" aria-label="Open profile">
            <button className="header-more" title="Hide / Show sidebar" onClick={(e)=>{ e.stopPropagation(); setSidebarOpen(s => !s); }} style={{background:'transparent',border:'none',cursor:'pointer',color:'#333',fontSize:20}}>
              <i className="ri-more-2-fill" />
            </button>
            <div className="header-profile" style={{marginLeft:8}} onClick={(e)=>{ e.stopPropagation(); setActiveMenu('Profile'); }} role="button">
              <div className="header-avatar" style={{background:'#0072ff',color:'#fff',borderRadius:'50%',width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:600,fontSize:16}}>{headerInitials || 'JS'}</div>
            </div>
          </div>
        </div>
        {activeMenu === "Dashboard" && (
          <>
            <div className="dashboard-header" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div>
                <h1 className="dashboard-title">Welcome back{user.user && user.user.name ? `, ${user.user.name}` : '123'}!</h1>
                <p>Here's an overview of your Fleet status</p>
              </div>
              {/* <div className="header-profile">
                <span className="header-avatar">{headerInitials || 'JS'}</span>
              </div> */}
            </div>
            <div className="dashboard-stats">
              <div className="stat-card">
                <div className="stat-card-content">
                  <i className="ri-car-line"></i>
                  <div style={{display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-start'}}>
                    <div>Registered Vehicles</div>
                    <div className="stat-value" style={{ display: 'inline-block', marginLeft: 6 }}>
                      {loadingClient ? '...' : (clientData && Array.isArray(clientData.vehicles) ? clientData.vehicles.length : 0)}
                    </div>
                  </div>
                  {/* Show active/inactive/deleted counts as badges */}
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start', marginTop: 8 }}>
                    {(() => {
                      const counts = { active: 0, inactive: 0, deleted: 0 };
                      if (clientData && Array.isArray(clientData.vehicles)) {
                        clientData.vehicles.forEach(v => {
                          const s = (v.status || '').toLowerCase();
                          if (s === 'active') counts.active++;
                          else if (s === 'inactive') counts.inactive++;
                          else if (s === 'deleted') counts.deleted++;
                        });
                      }
                      return [
                        <div key="act" className={`status-badge`} style={{  }} onClick={() => { setSelectedVehicleStatus('active'); setActiveMenu('Registered Vehicles'); }}>
                          <div style={{ color: '#42a5f5', fontWeight: 700 }}>{counts.active}</div>
                          <div style={{ fontSize: 12, color: '#666' }}>Active</div>
                        </div>,
                        <div key="inact" className={`status-badge`} style={{ }} onClick={() => { setSelectedVehicleStatus('inactive'); setActiveMenu('Registered Vehicles'); }}>
                          <div style={{ color: '#ffa726', fontWeight: 700 }}>{counts.inactive}</div>
                          <div style={{ fontSize: 12, color: '#666' }}>Inactive</div>
                        </div>,
                        <div key="del" className={`status-badge`} style={{ }} onClick={() => { setSelectedVehicleStatus('deleted'); setActiveMenu('Registered Vehicles'); }}>
                          <div style={{ color: '#e15759', fontWeight: 700 }}>{counts.deleted}</div>
                          <div style={{ fontSize: 12, color: '#666' }}>Deleted</div>
                        </div>
                      ];
                    })()}
                  </div>
                </div>
                <div className="stat-chart-container">
                  <canvas ref={chartRefTotal} style={{display: chartLoading.total || chartErrors.total ? 'none' : 'block'}} />
                    {chartLoading.total ? (
                      <div className="default-loader" style={{ zIndex: 10 }}>
                        <div className="loader-spinner"></div>
                      </div>
                    ) : chartErrors.total ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{ color: '#666', marginBottom: '8px', fontSize: '13px' }}>Chart failed to load</div>
                        <button className="action-btn" onClick={retryCharts} style={{ padding: '6px 12px', fontSize: '12px' }}>
                          <i className="ri-refresh-line" style={{ marginRight: '4px' }}></i>Retry
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              <div className="stat-card">
                <div className="stat-card-content">
                  <i className="ri-error-warning-line"></i>
                  <div style={{display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-start'}}>
                    <div>Challans Fetched</div>
                    <div className="stat-value" style={{ display: 'inline-block', marginLeft: 6 }}>
                      {loadingVehicleChallan ? '...' : dashboardTotalChallans}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start', marginTop: 8 }}>
                    <div key="pending" className={`status-badge`} style={{ cursor: 'default' }}>
                      <div style={{ color: '#e74c3c', fontWeight: 700 }}>{loadingVehicleChallan ? '...' : dashboardPendingCount}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>Pending</div>
                    </div>
                    <div key="disposed" className={`status-badge`} style={{ cursor: 'default' }}>
                      <div style={{ color: '#66bb6a', fontWeight: 700 }}>{loadingVehicleChallan ? '...' : dashboardDisposedCount}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>Disposed</div>
                    </div>
                  </div>
                </div>
                <div className="stat-chart-container">
                  <canvas ref={chartRefActive} style={{display: chartLoading.active || chartErrors.active ? 'none' : 'block'}} />
                  {chartLoading.active ? (
                    <div className="default-loader" style={{ zIndex: 10 }}>
                      <div className="loader-spinner"></div>
                    </div>
                  ) : chartErrors.active ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <div style={{ color: '#666', marginBottom: '8px', fontSize: '13px' }}>Chart failed to load</div>
                      <button className="action-btn" onClick={retryCharts} style={{ padding: '6px 12px', fontSize: '12px' }}>
                        <i className="ri-refresh-line" style={{ marginRight: '4px' }}></i>Retry
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-content">
                  <i className="ri-alarm-warning-line"></i>
                  <div style={{display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-start'}}>
                    <div>Vehicle Renewals</div>
                    <div className="stat-value" style={{ display: 'inline-block', marginLeft: 6 }}>
                      {loadingVehicleRto ? '...' : vehicleRenewalsTotal}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-start', marginTop: 10 }}>
                    <div className={`status-badge`} style={{ cursor: 'default' }}>
                      <div style={{ color: '#ff5252', fontWeight: 700 }}>{loadingVehicleRto ? '...' : expiryCounts.insurance}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>Insurance</div>
                    </div>
                    <div className={`status-badge`} style={{ cursor: 'default' }}>
                      <div style={{ color: '#ff8a65', fontWeight: 700 }}>{loadingVehicleRto ? '...' : expiryCounts.roadTax}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>Road Tax</div>
                    </div>
                    <div className={`status-badge`} style={{ cursor: 'default' }}>
                      <div style={{ color: '#f4b400', fontWeight: 700 }}>{loadingVehicleRto ? '...' : expiryCounts.fitness}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>Fitness</div>
                    </div>
                    <div className={`status-badge`} style={{ cursor: 'default' }}>
                      <div style={{ color: '#42a5f5', fontWeight: 700 }}>{loadingVehicleRto ? '...' : expiryCounts.pollution}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>Pollution</div>
                    </div>
                  </div>
                </div>
                {/* Info line (threshold) intentionally hidden to save vertical space */}
                <div className="stat-chart-container">
                  <canvas ref={chartRefPaid} style={{display: chartLoading.paid || chartErrors.paid ? 'none' : 'block'}} />
                  {chartLoading.paid ? (
                    <div className="default-loader" style={{ zIndex: 10 }}>
                      <div className="loader-spinner"></div>
                    </div>
                  ) : chartErrors.paid ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <div style={{ color: '#666', marginBottom: '8px', fontSize: '13px' }}>Chart failed to load</div>
                      <button className="action-btn" onClick={retryCharts} style={{ padding: '6px 12px', fontSize: '12px' }}>
                        <i className="ri-refresh-line" style={{ marginRight: '4px' }}></i>Retry
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-content">
                  <i className="ri-money-rupee-circle-line"></i>
                  <div style={{display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-start'}}>
                    <div>Challan Amount</div>
                    <div className="stat-value" style={{ display: 'inline-block', marginLeft: 6 }}>
                      {loadingVehicleChallan ? '...' : `₹${formatBriefAmount(totalFineAmount)}`}
                    </div>
                  </div>
                  <div className="stat-value" style={{ marginTop: 8 }}>
                    {loadingVehicleChallan
                      ? '...'
                      : (
                          <>
                            <span style={{color: 'red', fontWeight: 600, fontSize: '0.55em'}}>Pending: ₹{formatBriefAmount(pendingFineTotal)}</span>
                            <span style={{margin: '0 6px', color: '#999', fontSize: '0.55em'}}>|</span>
                            <span style={{fontSize: '0.55em'}}>Paid: ₹{formatBriefAmount(disposedFineTotal)}</span>
                          </>
                        )}
                  </div>
                </div>
                <div className="stat-chart-container">
                  <canvas ref={chartRefAmount} style={{display: chartLoading.amount || chartErrors.amount ? 'none' : 'block'}} />
  
                  {chartLoading.amount ? (
                    <div className="default-loader" style={{ zIndex: 10 }}>
                      <div className="loader-spinner"></div>
                    </div>
                  ) : chartErrors.amount ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <div style={{ color: '#666', marginBottom: '8px', fontSize: '13px' }}>Chart failed to load</div>
                      <button className="action-btn" onClick={retryCharts} style={{ padding: '6px 12px', fontSize: '12px' }}>
                        <i className="ri-refresh-line" style={{ marginRight: '4px' }}></i>Retry
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <LatestChallansTable
              latestChallanRows={latestChallanRows}
              loadingVehicleChallan={loadingVehicleChallan}
              vehicleChallanError={vehicleChallanError}
              totalCount={totalChallans}
              limit={5}
            />
            <VehicleDataTable clientId={user.user && (user.user.id || user.user._id || user.user.client_id)} onViewAll={() => setActiveMenu('Vehicle RTO Data')} limit={10} searchText={vehicleSearchText} />
            {/* QuickActions moved to a shared component rendered below so it's available on every page */}
            {/* Removed dashboard 'due' data section as requested */}
          </>
        )}
        {activeMenu === "Profile" && (
          <div className="client-profile-section-isolated">
            <ClientProfile />
          </div>
        )}
        {activeMenu === "Register Vehicle" && <RegisterVehicle />}
        {activeMenu === "Vehicle RTO Data" && (
          <>
            <MyVehicles searchText={vehicleSearchText} setSearchText={setVehicleSearchText} />
            <VehicleDataTable clientId={user.user && (user.user.id || user.user._id || user.user.client_id)} onViewAll={() => setActiveMenu('Vehicle RTO Data')} limit={0} searchText={vehicleSearchText} />
          </>
        )}
        {activeMenu === "Vehicle Challan Data" && <MyChallans />}
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
      {/* Shared quick actions bar available on every page (placed inside main so it flows under content) */}
      <div className="main-quick-actions-wrapper" style={{ padding: '0 30px 30px 30px' }}>
        <QuickActions
          title="Quick Actions"
          sticky={true}
          onAddVehicle={() => setActiveMenu('Register Vehicle')}
          onBulkUpload={() => {
            setActiveMenu('Register Vehicle');
            // Give the page a little time to render and then try to scroll/focus the file input and highlight the upload card
            setTimeout(() => {
              try {
                const el = document.querySelector('input[type=file][accept*=".xlsx"]');
                if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); try { el.focus(); } catch(e){} }
              } catch (e) {}
              try {
                const card = document.querySelector('.upload-card');
                if (card) {
                  // restart animation if already applied
                  card.classList.remove('highlight-upload');
                  // trigger reflow to restart CSS animation
                  // eslint-disable-next-line no-unused-expressions
                  void card.offsetWidth;
                  card.classList.add('highlight-upload');
                  // remove class after animation completes (2.5s)
                  setTimeout(() => card.classList.remove('highlight-upload'), 2600);
                }
              } catch (e) {}
            }, 300);
          }}
          onPay={() => setInfoModal({ open: true, message: 'Feature not rolled back yet. Stay tuned. We will notify you.' })}
          onReports={() => setReportsModal({ open: true })}
          onContact={() => setSupportModal(true)}
        />
      </div>
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
        open={reportsModal.open}
        title="Generate Reports"
        description="Choose which report you want to generate and download as CSV."
        onConfirm={() => setReportsModal({ open: false })}
        onCancel={() => setReportsModal({ open: false })}
        confirmText="Close"
        cancelText={null}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ color: '#333' }}>Select a report to generate and download:</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="action-btn" onClick={generateRtoReport} title="Generate RTO Data Report" disabled={exporting.rto}>
              {exporting.rto ? 'Generating RTO...' : 'Generate RTO Data Report'}
            </button>
            <button className="action-btn" onClick={generateChallanReport} title="Generate Challan Data Report" disabled={exporting.challan}>
              {exporting.challan ? 'Generating Challans...' : 'Generate Challan Data Report'}
            </button>
          </div>
          <div style={{ fontSize: 13, color: '#666' }}>Files will download as CSV. If your browser blocks downloads, allow downloads for this site.</div>
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
