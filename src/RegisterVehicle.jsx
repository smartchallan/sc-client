import React, { useState, useEffect, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CustomModal from "./client/CustomModal";
import SelectShowMore from "./client/SelectShowMore";
import { saveUserActivity } from "./utils/activityTracker";

const FIELD_OPTIONS = [
  { value: "vehicle_number", label: "Vehicle Number" },
  { value: "engine_number", label: "Engine Number" },
  { value: "chassis_number", label: "chassis Number" },
];

export default function RegisterVehicle() {
  // Sidebar for vehicle details
  const [sidebarVehicle, setSidebarVehicle] = useState(null);
  // Registration form state
  const [registerField, setRegisterField] = useState("");
  const [registerValue, setRegisterValue] = useState("");
  const [registerError, setRegisterError] = useState("");
  // Table search/filter state
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [loading, setLoading] = useState(false);
  const [sortDesc, setSortDesc] = useState(true); // true => newest first
  const [vehicles, setVehicles] = useState([]);
  const [fetchingVehicles, setFetchingVehicles] = useState(false);
  const [modal, setModal] = useState({ open: false, action: null, vehicle: null });
  // Upload Excel states
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [uploadModal, setUploadModal] = useState({ open: false, count: 0, invalids: [] });
  const [parsedVehicles, setParsedVehicles] = useState([]);
  const fileInputRef = useRef(null);
  const [skipHeader, setSkipHeader] = useState(true);
  const [previewLimit] = useState(10);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [finalSummary, setFinalSummary] = useState({ open: false, success: 0, fail: 0, failures: [] });
  // Bulk upload section collapsed state
  const [bulkUploadEnabled, setBulkUploadEnabled] = useState(false);
  // Loader state for Challan API calls (per vehicle)
  const [challanLoadingId, setChallanLoadingId] = useState(null);
  
  // Confirmation modal for adding vehicle
  const [confirmModal, setConfirmModal] = useState(false);
  const [addToClientAccount, setAddToClientAccount] = useState(false);
  const [selectedClientForAdd, setSelectedClientForAdd] = useState(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientList, setClientList] = useState([]);
  const [hasClients, setHasClients] = useState(false);
  const confirmModalRef = useRef(null);
  const clientDropdownRef = useRef(null);

  // Get Vehicle Data and Challan handler
  const [dataLoadingId, setDataLoadingId] = useState(null);
  const handleGetVehicleData = async (vehicleNumber) => {
    const { client_id } = getUserIds();
    if (!vehicleNumber || !client_id) {
      toast.error("Vehicle number or client ID missing");
      return;
    }
    setDataLoadingId(vehicleNumber);
    try {
      // 1. Get RTO Data
      const rtoRes = await fetch(`${API_ROOT}/getvehiclertodata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleNumber, clientID: client_id })
      });
      const rtoData = await rtoRes.json();
      if (!rtoRes.ok) {
        toast.error(rtoData.message || "Failed to fetch RTO data");
      } else {
        toast.success("RTO data fetched successfully");
        // Optionally, show rtoData in a modal or log it
        // console.log(rtoData);
      }
      // 2. Get Challan Data
      const challanRes = await fetch(`${API_ROOT}/getvehicleechallandata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleNumber, clientID: client_id })
      });
      const challanData = await challanRes.json();
      if (!challanRes.ok) {
        toast.error(challanData.message || "Failed to fetch challan data");
      } else {
        toast.success("Challan data fetched successfully");
        // Optionally, show challanData in a modal or log it
        // console.log(challanData);
      }
    } catch (err) {
      toast.error("Error fetching vehicle data");
    } finally {
      setDataLoadingId(null);
    }
  };
  // Pagination state
  const [activeVehiclesLimit, setActiveVehiclesLimit] = useState(10);
  const [deletedVehiclesLimit, setDeletedVehiclesLimit] = useState(10);

  const API_ROOT = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const REGISTER_ENDPOINT = "/uservehicle/register";

  // Helper to get user/client/dealer/admin ids
  const getUserIds = () => {
    const userObj = JSON.parse(localStorage.getItem("sc_user"));
    const user = userObj && userObj.user ? userObj.user : {};
    return {
      user_id: user.id,
      client_id: user.client_id || user.id,
      dealer_id: user.dealer_id,
      admin_id: user.admin_id,
      parent_id: user.parent_id,
    };
  };

  // Fetch vehicles for client
  const fetchVehicles = async (clientId) => {
    if (!clientId) return;
    setFetchingVehicles(true);
    try {
      const res = await fetch(`${API_ROOT}/uservehicle?client_id=${clientId}`);
      const data = await res.json();
      if (Array.isArray(data)) setVehicles(data);
      else if (Array.isArray(data.vehicles)) setVehicles(data.vehicles);
      else setVehicles([]);
    } catch {
      setVehicles([]);
    } finally {
      setFetchingVehicles(false);
    }
  };

  // Fetch on mount if client_id available
  useEffect(() => {
    const { client_id } = getUserIds();
    if (client_id) fetchVehicles(client_id);
  }, []);

  // Reset pagination when search or filter changes
  useEffect(() => {
    setActiveVehiclesLimit(10);
  }, [searchValue, statusFilter]);

  useEffect(() => {
    setDeletedVehiclesLimit(10);
  }, [sortDesc]);
  
  // Check if user has clients and load client list
  useEffect(() => {
    try {
      const userObj = JSON.parse(localStorage.getItem('sc_user'));
      if (userObj && userObj.user) {
        const parentVal = userObj.user.parent_id;
        const isParentAccount = (parentVal == null) || (parentVal == 0);
        const hasClientsFlag = !!(userObj.hasClients);
        setHasClients(!!(hasClientsFlag || isParentAccount));
        
        // Load client list from localStorage
        if (hasClientsFlag || isParentAccount) {
          const cachedData = localStorage.getItem('client_network');
          if (cachedData) {
            const data = JSON.parse(cachedData);
            const rawData = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
            const flattenChildren = (node, dealerName = null) => {
              const result = [];
              result.push({ ...node, dealerName, isParent: !dealerName });
              if (Array.isArray(node.children) && node.children.length > 0) {
                node.children.forEach(child => {
                  result.push(...flattenChildren(child, node.name));
                });
              }
              return result;
            };
            const flatClients = [];
            rawData.forEach(parent => {
              flatClients.push(...flattenChildren(parent));
            });
            setClientList(flatClients);
          }
        }
      }
    } catch (e) {
      console.error('Error checking hasClients:', e);
    }
  }, []);
  
  // Close client dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target)) {
        setShowClientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('handleSubmit called', { registerField, registerValue });
    if (!registerField || !registerValue) {
      toast.error("Please select a field and enter a value.");
      return;
    }
    // Additional validation for vehicle number field
    if (registerField === 'vehicle_number') {
      const re = /^[A-Z0-9]{5,11}$/; // input is uppercased
      if (!re.test(registerValue)) {
        setRegisterError('Vehicle number must be 5-11 alphanumeric characters (no spaces).');
        toast.error('Invalid vehicle number.');
        return;
      }
    }
    // Show confirmation modal
    console.log('Setting confirmModal to true');
    setConfirmModal(true);
  };
  
  // Actual registration function called from modal
  const performRegistration = async () => {
    setConfirmModal(false);
    setLoading(true);
    try {
      const ids = getUserIds();
      let payload = {
        ...ids,
        admin_id: ids.admin_id, // ensure admin_id is always present
        vehicle_number: registerField === "vehicle_number" ? registerValue : undefined,
        engine_number: registerField === "engine_number" ? registerValue : undefined,
        chassis_number: registerField === "chassis_number" ? registerValue : undefined,
      };
      
      // If adding to client account, override client_id with selected client and add parent_id
      if (addToClientAccount && selectedClientForAdd) {
        payload.client_id = selectedClientForAdd;
        payload.parent_id = ids.client_id; // current user becomes parent
      }
      
      const res = await fetch(API_ROOT + REGISTER_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        // Show specific API error message, including "vehicle already registered"
        const errorMessage = data.message || "Failed to register vehicle";
        toast.error(errorMessage);
      } else {
        toast.success(data.message);
        
        // Track activity for vehicle addition
        try {
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipResponse.json();
          const ip = ipData.ip || 'Unknown';
          
          const locationResponse = await fetch(`http://ip-api.com/json/${ip}`);
          const locationData = await locationResponse.json();
          const location = locationData.status === 'success' 
            ? `${locationData.city || ''}, ${locationData.regionName || ''}, ${locationData.country || ''}`.replace(/^, |, $/g, '') 
            : 'Unknown';
          
          const vehicleNumber = registerField === "vehicle_number" ? registerValue : 
                                registerField === "engine_number" ? `Engine: ${registerValue}` :
                                `Chassis: ${registerValue}`;
          
          const description = `Added vehicle ${vehicleNumber} from web portal ${ip} and ${location}`;
          
          // Get user info from localStorage
          const scUser = JSON.parse(localStorage.getItem('sc_user')) || {};
          const userId = scUser.user?.id || scUser.user?._id;
          const parentId = scUser.user?.parent_id || null;
          const clientName = scUser.user?.name || null;
          
          await saveUserActivity(userId, parentId, clientName, 'vehicle added', description);
        } catch (err) {
          console.error('Failed to track vehicle addition activity:', err);
          // Don't show error to user, activity tracking failure shouldn't affect the main flow
        }
        
        setRegisterValue("");
        setRegisterField("");
        // Reset modal states
        setAddToClientAccount(false);
        setSelectedClientForAdd(null);
        setClientSearchTerm('');
        // Fetch vehicles after successful registration
        if (ids.client_id) fetchVehicles(ids.client_id);
      }
    } catch (err) {
      toast.error("Error registering vehicle");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Bulk upload handlers ----------------
  const handleFileSelect = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    // Only accept excel files
    const allowed = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
    // We will still attempt parsing even if mime differs; rely on XLSX
    setUploadingExcel(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        // Get raw rows as arrays so we can take second column (index 1)
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  // Skip first row if user indicated the file has header; extract second column values
  const dataRows = Array.isArray(rows) ? (skipHeader ? rows.slice(1) : rows) : [];
        const extracted = dataRows.map(r => (Array.isArray(r) ? (r[1] || '') : ''))
                              .map(v => (typeof v === 'string' ? v.trim() : String(v).trim()));
        // Validation regex per requirement: ^[a-zA-Z0-9]{5,11}$
        const validRe = /^[A-Za-z0-9]{5,11}$/;
        const seen = new Set();
        const normalized = [];
        const invalids = [];
        extracted.forEach(v => {
          if (!v) return;
          const up = v.toUpperCase();
          if (seen.has(up)) return;
          seen.add(up);
          // validate using case-insensitive pattern (original characters matter only for validation of allowed chars)
          if (!validRe.test(v)) {
            invalids.push(up);
          } else {
            normalized.push(up);
          }
        });
  setParsedVehicles(normalized);
  setUploadModal({ open: true, count: normalized.length, invalids });
      } catch (err) {
        toast.error('Failed to parse the uploaded file. Make sure it is a valid Excel file.');
      } finally {
        setUploadingExcel(false);
        // Reset file input to allow uploading same file again if needed
        try { if (fileInputRef.current) fileInputRef.current.value = null; } catch {}
      }
    };
    reader.onerror = () => {
      setUploadingExcel(false);
      toast.error('Failed to read the file');
      try { if (fileInputRef.current) fileInputRef.current.value = null; } catch {}
    };
    reader.readAsArrayBuffer(f);
  };

  const confirmAndUploadParsed = async () => {
    if (!Array.isArray(parsedVehicles) || parsedVehicles.length === 0) {
      setUploadModal({ open: false, count: 0, invalids: [] });
      toast.info('No valid vehicle numbers found in the file.');
      return;
    }
    setUploadModal({ open: false, count: 0, invalids: [] });
    setUploadingExcel(true);
    setUploadProgress({ current: 0, total: parsedVehicles.length });
    const ids = getUserIds();
    const failures = [];
    let successCount = 0;
    try {
      for (let i = 0; i < parsedVehicles.length; i++) {
        const vehicle_number = (parsedVehicles[i] || '').toUpperCase();
        if (!vehicle_number) {
          // shouldn't happen
          setUploadProgress(p => ({ ...p, current: p.current + 1 }));
          continue;
        }
        try {
          let payload = { ...ids, vehicle_number };
          
          // If adding to client account, override client_id and add parent_id
          if (addToClientAccount && selectedClientForAdd) {
            payload = {
              ...payload,
              client_id: selectedClientForAdd,
              parent_id: ids.client_id || ids.user_id
            };
          }
          
          const res = await fetch(API_ROOT + REGISTER_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok) {
            successCount++;
            toast.success(`(${i+1}/${parsedVehicles.length}) ${vehicle_number}: Registered`);
          } else {
            const reason = data && data.message ? data.message : 'Failed';
            failures.push({ vehicle: vehicle_number, reason });
            toast.error(`(${i+1}/${parsedVehicles.length}) ${vehicle_number}: ${reason}`);
          }
        } catch (err) {
          failures.push({ vehicle: vehicle_number, reason: 'API Error' });
          toast.error(`(${i+1}/${parsedVehicles.length}) ${vehicle_number}: API Error`);
        }
        setUploadProgress(p => ({ ...p, current: p.current + 1 }));
      }
      // Refresh list after bulk add
      if (ids.client_id) fetchVehicles(ids.client_id);
    } finally {
      setUploadingExcel(false);
      setParsedVehicles([]);
      setFinalSummary({ open: true, success: successCount, fail: failures.length, failures });
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <ToastContainer position="top-right" autoClose={2000} />
      
      <h1 className="page-title">🚗 Register New Vehicle</h1>
      <p className="page-subtitle">Register vehicles using <b>Vehicle Number</b>, <b>Engine Number</b>, or <b>Chassis Number</b></p>
      
      {/* Registration Form Card */}
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '2px', border: 'none' }}>
        <div style={{ background: '#fff', borderRadius: '11px', padding: '28px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>➕</span>
            Add Single Vehicle
          </h2>
          <form className="vehicle-form" onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div className="form-group">
              <label htmlFor="select_field" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                Select Registration Field *
              </label>
              <select
                id="select_field"
                className="form-control"
                value={registerField}
                onChange={e => {
                  setRegisterField(e.target.value);
                  setRegisterValue("");
                }}
                style={{ width: '100%' }}
              >
                <option value="">Choose field...</option>
                {FIELD_OPTIONS.map(opt => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.value !== 'vehicle_number'}
                    style={opt.value !== 'vehicle_number' ? { color: '#999' } : {}}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            
            {registerField && (
              <div className="form-group">
                <label htmlFor="field_value" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  {FIELD_OPTIONS.find(f => f.value === registerField)?.label} *
                </label>
                {registerField === 'vehicle_number' ? (
                  <div className="number-plate-container">
                    <div className={"number-plate-wrapper" + (registerError ? ' input-invalid' : (registerValue.length >= 5 ? ' input-valid' : ''))}>
                      <div className="number-plate-badge">IND</div>
                      <div className="tricolor-strip">
                        <div className="saffron"></div>
                        <div className="white"></div>
                        <div className="green"></div>
                      </div>
                      <input
                        type="text"
                        id="field_value"
                        name="field_value"
                        className={"number-plate-input" + (registerError ? ' input-invalid' : (registerValue.length >= 5 ? ' input-valid' : ''))}
                        value={registerValue}
                        onChange={e => {
                          const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                          setRegisterValue(v);
                          if (v.length > 11) {
                            setRegisterError('Vehicle number cannot exceed 11 characters.');
                          } else if (v.length > 0 && v.length < 5) {
                            setRegisterError('Vehicle number must be at least 5 characters long.');
                          } else {
                            setRegisterError('');
                          }
                        }}
                        placeholder="Enter vehicle number"
                        maxLength={11}
                      />
                    </div>
                    <div className="security-features">
                      <div className="hologram"></div>
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    id="field_value"
                    name="field_value"
                    className="form-control"
                    value={registerValue}
                    onChange={e => {
                      setRegisterValue(e.target.value.toUpperCase());
                      setRegisterError('');
                    }}
                    style={{ textTransform: 'uppercase' }}
                    placeholder={`Enter ${FIELD_OPTIONS.find(f => f.value === registerField)?.label?.toLowerCase()}`}
                  />
                )}
                {registerField === 'vehicle_number' && registerError && (
                  <div className="alert alert-danger" style={{ marginTop: '8px', padding: '8px 12px', fontSize: '12px' }}>
                    {registerError}
                  </div>
                )}
              </div>
            )}
            
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading || !!registerError}
                style={{ 
                  flex: 1,
                  padding: '12px 24px',
                  fontSize: '15px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Adding...
                  </>
                ) : (
                  <>
                    <span>➕</span>
                    Add Vehicle
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
  {/* Upload Vehicles by Excel (collapsible) */}
  <div className="card" style={{ marginBottom: '24px' }}>
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 16, marginBottom: bulkUploadEnabled ? 20 : 0, cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={bulkUploadEnabled}
        onChange={e => setBulkUploadEnabled(e.target.checked)}
        style={{ width: 20, height: 20 }}
      />
      <span style={{ fontSize: '18px' }}>📊</span>
      <span>Bulk Upload Vehicles via Excel</span>
    </label>
    {bulkUploadEnabled && (
      <div>
        {/* Add to client account checkbox */}
        {hasClients && (
          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e0e0e0' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={addToClientAccount} 
                onChange={e => {
                  setAddToClientAccount(e.target.checked);
                  if (!e.target.checked) {
                    setSelectedClientForAdd(null);
                    setClientSearchTerm('');
                    setShowClientDropdown(false);
                  }
                }}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ color: '#444', fontWeight: 500 }}>Add vehicles to client account</span>
            </label>
            
            {addToClientAccount && (
              <div style={{ marginTop: 12, position: 'relative' }} ref={clientDropdownRef}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500, color: '#333' }}>
                  Select Client *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search client..."
                    value={clientSearchTerm}
                    onChange={(e) => {
                      setClientSearchTerm(e.target.value);
                      setShowClientDropdown(true);
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    style={{
                      width: '100%',
                      maxWidth: 400,
                      padding: '10px 40px 10px 14px',
                      border: '2px solid ' + (showClientDropdown ? '#2196f3' : '#ddd'),
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#1a1a1a',
                      background: '#fff',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                  />
                  <i className="ri-search-line" style={{
                    position: 'absolute',
                    left: 'auto',
                    right: clientSearchTerm ? 48 : 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#78909c',
                    fontSize: 18,
                    pointerEvents: 'none'
                  }}></i>
                  {clientSearchTerm && (
                    <button
                      onClick={() => {
                        setClientSearchTerm('');
                        setSelectedClientForAdd(null);
                        setShowClientDropdown(false);
                      }}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: 'none',
                        background: '#e3f2fd',
                        color: '#1565c0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 700,
                        transition: 'all 0.2s',
                        lineHeight: 1
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#1565c0';
                        e.target.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#e3f2fd';
                        e.target.style.color = '#1565c0';
                      }}
                      title="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>
                {showClientDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    maxWidth: 400,
                    width: '100%',
                    maxHeight: 240,
                    overflowY: 'auto',
                    background: '#fff',
                    border: '2px solid #2196f3',
                    borderRadius: 8,
                    boxShadow: '0 8px 24px rgba(33, 150, 243, 0.2)',
                    zIndex: 1000
                  }}>
                    {(() => {
                      const filteredList = clientList.filter(client => {
                        const searchLower = clientSearchTerm.toLowerCase();
                        const name = client.name || '';
                        const email = client.email || '';
                        const company = (client.user_meta || client.userMeta)?.company_name || '';
                        return name.toLowerCase().includes(searchLower) || 
                               email.toLowerCase().includes(searchLower) ||
                               company.toLowerCase().includes(searchLower);
                      });
                      
                      if (filteredList.length === 0) {
                        return (
                          <div style={{ padding: '20px', textAlign: 'center', color: '#78909c' }}>
                            {clientList.length === 0 ? 'No clients found' : 'No matching clients'}
                          </div>
                        );
                      }
                      
                      return filteredList.map(client => (
                        <div
                          key={client.id || client._id}
                          onClick={() => {
                            setSelectedClientForAdd(client.id || client._id);
                            setClientSearchTerm(`${client.name} (${(client.user_meta || client.userMeta)?.company_name || 'N/A'})`);
                            setShowClientDropdown(false);
                          }}
                          style={{
                            padding: '12px 16px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #e8f4fd',
                            background: (client.id || client._id) === selectedClientForAdd ? '#e3f2fd' : '#fff',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#f5f9ff'}
                          onMouseLeave={(e) => e.target.style.background = (client.id || client._id) === selectedClientForAdd ? '#e3f2fd' : '#fff'}
                        >
                          <div style={{ fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>
                            {client.name}
                          </div>
                          <div style={{ fontSize: 12, color: '#78909c' }}>
                            {(client.user_meta || client.userMeta)?.company_name || 'N/A'}
                          </div>
                          <div style={{ fontSize: 11, color: '#90a4ae', marginTop: 2 }}>
                            {client.email}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        <h3 style={{ marginTop: 0 }}>Upload Vehicles (Excel)</h3>
        <p style={{ marginTop: 0, color: '#666' }}>Upload an Excel file where the <strong>second column</strong> contains vehicle numbers (one per row). We'll read the file, show you the number of vehicles found, and then register them sequentially.</p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={skipHeader} onChange={e => setSkipHeader(!!e.target.checked)} />
            <span style={{ color: '#444' }}>File has header row (skip first row)</span>
          </label>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} />
          <button className="action-btn" onClick={() => { if (fileInputRef.current) fileInputRef.current.click(); }} disabled={uploadingExcel} title="Select Excel file">Select File</button>
          <div style={{ color: '#666' }}>{uploadingExcel ? (uploadProgress.total > 0 ? `Uploading ${uploadProgress.current}/${uploadProgress.total}` : 'Processing file...') : ''}</div>
        </div>
        
        {uploadingExcel && uploadProgress.total > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ height: 10, background: '#eee', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: `${Math.round((uploadProgress.current/uploadProgress.total)*100)}%`, height: '100%', background: '#4caf50' }} />
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: '#444' }}>{uploadProgress.current} of {uploadProgress.total} uploaded</div>
          </div>
        )}
      </div>
    )}
  </div>
      {/* Registered Vehicles Section */}
      <div id="registered-vehicles-section" className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>🚙</span>
              Registered Vehicles
              {vehicles && vehicles.filter(v => (v.status || '').toUpperCase() !== 'DELETED').length > 0 && (
                <span className="badge badge-info" style={{ fontSize: '12px', marginLeft: '8px' }}>
                  {vehicles.filter(v => (v.status || '').toUpperCase() !== 'DELETED').length} total
                </span>
              )}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>View and manage all your registered vehicles</p>
          </div>
        </div>
        
        {/* Search and Filter Controls */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by Vehicle/Engine/Chassis No"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            maxLength={20}
            className="simple-search-input"
            style={{ flex: '1', minWidth: '280px', maxWidth: '400px' }}
          />
          
          <div style={{ minWidth: '180px' }}>
            <select
              className="form-control"
              style={{ textTransform: 'uppercase' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="ACTIVE">✅ Active</option>
              <option value="INACTIVE">⏸️ Inactive</option>
            </select>
          </div>
        </div>
        
        {/* Table */}
        {fetchingVehicles ? (
          <div className="empty-state" style={{ padding: '40px' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 16px', width: '40px', height: '40px', borderWidth: '4px' }}></div>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Loading vehicles...</p>
          </div>
        ) : vehicles.filter(v => (v.status || '').toUpperCase() !== 'DELETED').length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚗</div>
            <div className="empty-state-title">No Vehicles Registered</div>
            <div className="empty-state-description">Get started by registering your first vehicle using the form above</div>
          </div>
        ) : (
          <div className="table-container" id="registered-vehicles-table-print-area">
            <table className="latest-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'center', width: '60px' }}>S.No.</th>
                  <th style={{ textAlign: 'left' }}>Vehicle Number</th>
                  <th style={{ textAlign: 'left' }}>Engine Number</th>
                  <th style={{ textAlign: 'left' }}>Chassis Number</th>
                  <th style={{ textAlign: 'center', width: '120px' }}>Status</th>
                  <th style={{ textAlign: 'left', width: '180px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Registered At
                      <span style={{ cursor: 'pointer', fontSize: '18px', display: 'inline-flex', alignItems: 'center' }} onClick={() => setSortDesc(s => !s)}>
                        {sortDesc ? '⬇️' : '⬆️'}
                      </span>
                    </span>
                  </th>
                  <th style={{ textAlign: 'center', width: '100px' }}>Data</th>
                  <th style={{ textAlign: 'center', width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles
                  .filter(v => {
                    // Exclude deleted vehicles from main table
                    const status = (v.status || '').toUpperCase();
                    if (status === 'DELETED') return false;
                    
                    const searchVal = searchValue.trim().toUpperCase();
                    const matchesSearch =
                      !searchVal ||
                      (v.vehicle_number && v.vehicle_number.toUpperCase().includes(searchVal)) ||
                      (v.engine_number && v.engine_number.toUpperCase().includes(searchVal)) ||
                      (v.chassis_number && v.chassis_number.toUpperCase().includes(searchVal));
                    const matchesStatus =
                      !statusFilter || (v.status && v.status.toUpperCase() === statusFilter.toUpperCase());
                    return matchesSearch && matchesStatus;
                  })
                  .sort((a, b) => {
                    const dateA = a.registered_at ? new Date(a.registered_at) : new Date(0);
                    const dateB = b.registered_at ? new Date(b.registered_at) : new Date(0);
                    return sortDesc ? dateB - dateA : dateA - dateB;
                  })
                  .slice(0, activeVehiclesLimit)
                  .map((v, idx) => {
                    let status = (v.status || 'Not Available').toUpperCase();
                    const handleInactivate = () => setModal({ open: true, action: 'inactivate', vehicle: v });
                    const handleActivate = () => setModal({ open: true, action: 'activate', vehicle: v });
                    const handleDelete = () => setModal({ open: true, action: 'delete', vehicle: v });
                    
                    return (
                      <tr key={v.id || v._id || idx}>
                        <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 500 }}>{idx + 1}</td>
                        <td>
                          <span
                            style={{
                              fontWeight: 600,
                              cursor: 'pointer',
                              color: '#1e40af',
                              textDecoration: 'underline',
                              textDecorationStyle: 'dotted',
                              textDecorationThickness: '1px',
                              textUnderlineOffset: '3px',
                            }}
                            onClick={() => setSidebarVehicle(v)}
                            title="View vehicle details"
                          >
                            {v.vehicle_number || 'Not Available'}
                          </span>
                        </td>
                        <td style={{ color: '#475569', fontSize: '13px' }}>{v.engine_number || 'Not Available'}</td>
                        <td style={{ color: '#475569', fontSize: '13px' }}>{v.chassis_number || 'Not Available'}</td>
                        <td style={{ textAlign: 'center' }}>
                          {status === 'ACTIVE' ? (
                            <span className="status-pill status-pill-success">✅ Active</span>
                          ) : status === 'INACTIVE' ? (
                            <span className="status-pill status-pill-warning">⏸️ Inactive</span>
                          ) : status === 'DELETED' ? (
                            <span className="status-pill status-pill-danger">🗑️ Deleted</span>
                          ) : (
                            <span className="status-pill">{status}</span>
                          )}
                        </td>
                        <td style={{ color: '#64748b', fontSize: '13px' }}>
                          {v.registered_at ? new Date(v.registered_at).toLocaleString('en-IN', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Not Available'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {status === 'DELETED' ? (
                            <span style={{ color: '#cbd5e1' }}>—</span>
                          ) : (
                            <button
                              className="btn-sm btn-outline"
                              disabled={dataLoadingId === v.vehicle_number}
                              onClick={() => handleGetVehicleData(v.vehicle_number)}
                              style={{ fontSize: '12px' }}
                            >
                              {dataLoadingId === v.vehicle_number ? (
                                <>
                                  <span className="loading-spinner" style={{ width: '12px', height: '12px', borderWidth: '2px', marginRight: '6px' }}></span>
                                  Loading...
                                </>
                              ) : (
                                <>📊 Get Data</>
                              )}
                            </button>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {status === 'DELETED' ? (
                            <span style={{ color: '#cbd5e1' }}>—</span>
                          ) : (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                              {status === 'INACTIVE' ? (
                                <button
                                  className="btn-sm btn-success"
                                  onClick={handleActivate}
                                  title="Activate Vehicle"
                                  style={{ fontSize: '12px', padding: '4px 10px' }}
                                >
                                  ✅
                                </button>
                              ) : (
                                <button
                                  className="btn-sm"
                                  onClick={handleInactivate}
                                  title="Inactivate Vehicle"
                                  style={{ fontSize: '12px', padding: '4px 10px', background: '#f59e0b', color: 'white', border: 'none' }}
                                >
                                  🚫
                                </button>
                              )}
                              <button
                                className="btn-sm btn-danger"
                                onClick={handleDelete}
                                title="Delete Vehicle"
                                style={{ fontSize: '12px', padding: '4px 10px' }}
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              </table>
            </div>
          )}
          
          {/* Load More / Show more control for Active/Inactive Vehicles */}
          {(() => {
            const filteredActiveVehicles = vehicles.filter(v => {
              const status = (v.status || '').toUpperCase();
              if (status === 'DELETED') return false;
              const searchVal = searchValue.trim().toUpperCase();
              const matchesSearch =
                !searchVal ||
                (v.vehicle_number && v.vehicle_number.toUpperCase().includes(searchVal)) ||
                (v.engine_number && v.engine_number.toUpperCase().includes(searchVal)) ||
                (v.chassis_number && v.chassis_number.toUpperCase().includes(searchVal));
              const matchesStatus =
                !statusFilter || (v.status && v.status.toUpperCase() === statusFilter.toUpperCase());
              return matchesSearch && matchesStatus;
            });
            if (filteredActiveVehicles.length > activeVehiclesLimit) {
              return (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '12px', 
                  marginTop: '20px',
                  padding: '16px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <span style={{ fontWeight: 600, color: '#475569', fontSize: '14px' }}>
                    📊 Showing {activeVehiclesLimit} of {filteredActiveVehicles.length} vehicles
                  </span>
                  <SelectShowMore
                    onShowMoreRecords={val => {
                      if (val === 'all') setActiveVehiclesLimit(filteredActiveVehicles.length);
                      else setActiveVehiclesLimit(Number(val));
                    }}
                    onResetRecords={() => setActiveVehiclesLimit(10)}
                    maxCount={filteredActiveVehicles.length}
                  />
                </div>
              );
            }
            return null;
          })()}
        </div>

        {/* Deleted Vehicles Table */}
        {(() => {
          const deletedVehicles = vehicles.filter(v => (v.status || '').toUpperCase() === 'DELETED');
          if (deletedVehicles.length === 0) return null;
          
          return (
            <div id="deleted-vehicles-section" className="card" style={{ marginTop: '24px', borderColor: '#fee2e2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px' }}>🗑️</span>
                  Deleted Vehicles
                  <span className="badge badge-danger" style={{ fontSize: '12px', marginLeft: '8px' }}>
                    {deletedVehicles.length} deleted
                  </span>
                </h2>
              </div>
              <div className="table-container" id="deleted-vehicles-table-print-area">
                <table className="latest-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'center', width: '60px' }}>S.No.</th>
                      <th style={{ textAlign: 'left' }}>Vehicle Number</th>
                      <th style={{ textAlign: 'left' }}>Engine Number</th>
                      <th style={{ textAlign: 'left' }}>Chassis Number</th>
                      <th style={{ textAlign: 'center', width: '120px' }}>Status</th>
                      <th style={{ textAlign: 'left', width: '180px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          Registered At
                          <span style={{ cursor: 'pointer', fontSize: '18px', display: 'inline-flex', alignItems: 'center' }} onClick={() => setSortDesc(s => !s)}>
                            {sortDesc ? '⬇️' : '⬆️'}
                          </span>
                        </span>
                      </th>
                      <th style={{ textAlign: 'center', width: '120px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                  {deletedVehicles
                    .sort((a, b) => {
                      const dateA = a.registered_at ? new Date(a.registered_at) : new Date(0);
                      const dateB = b.registered_at ? new Date(b.registered_at) : new Date(0);
                      return sortDesc ? dateB - dateA : dateA - dateB;
                    })
                    .slice(0, deletedVehiclesLimit)
                    .map((v, idx) => {
                      const handleReactivate = () => setModal({ open: true, action: 'restore-info', vehicle: v });
                      
                      return (
                        <tr key={v.id || v._id || idx} style={{ opacity: 0.7 }}>
                          <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 500 }}>{idx + 1}</td>
                          <td style={{ color: '#475569', fontSize: '13px', textDecoration: 'line-through' }}>{v.vehicle_number || 'Not Available'}</td>
                          <td style={{ color: '#475569', fontSize: '13px' }}>{v.engine_number || 'Not Available'}</td>
                          <td style={{ color: '#475569', fontSize: '13px' }}>{v.chassis_number || 'Not Available'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="status-pill status-pill-danger">🗑️ Deleted</span>
                          </td>
                          <td style={{ color: '#64748b', fontSize: '13px' }}>
                            {v.registered_at ? new Date(v.registered_at).toLocaleString('en-IN', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Not Available'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className="btn-sm btn-success"
                              onClick={handleReactivate}
                              title="Reactivate Vehicle"
                              style={{ fontSize: '12px', padding: '4px 10px' }}
                            >
                              ♻️ Restore
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Load More / Show more control for Deleted Vehicles */}
              {deletedVehicles.length > deletedVehiclesLimit && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '12px', 
                  marginTop: '20px',
                  padding: '16px',
                  background: '#fef2f2',
                  borderRadius: '8px',
                  border: '1px solid #fecaca'
                }}>
                  <span style={{ fontWeight: 600, color: '#dc2626', fontSize: '14px' }}>
                    📊 Showing {deletedVehiclesLimit} of {deletedVehicles.length} deleted vehicles
                  </span>
                  <SelectShowMore
                    onShowMoreRecords={val => {
                      if (val === 'all') setDeletedVehiclesLimit(deletedVehicles.length);
                      else setDeletedVehiclesLimit(Number(val));
                    }}
                    onResetRecords={() => setDeletedVehiclesLimit(10)}
                    maxCount={deletedVehicles.length}
                  />
                </div>
              )}
            </div>
          );
        })()}

      <CustomModal
        open={uploadModal.open}
        title={`Upload Vehicles — Confirm (${uploadModal.count} valid)`}
        onConfirm={confirmAndUploadParsed}
        onCancel={() => { setUploadModal({ open: false, count: 0, invalids: [] }); setParsedVehicles([]); }}
        confirmText={uploadingExcel ? 'Processing...' : 'Confirm and Upload'}
        cancelText={uploadingExcel ? null : 'Cancel'}
      >
        <div style={{ lineHeight: 1.6 }}>
          <div>We found <b>{uploadModal.count}</b> valid vehicle number{uploadModal.count === 1 ? '' : 's'} in the uploaded file.</div>
          {Array.isArray(uploadModal.invalids) && uploadModal.invalids.length > 0 && (
            <>
              <div style={{ marginTop: 10 }}>
                <div style={{ color: '#b33', fontWeight: 700 }}>The following {uploadModal.invalids.length} entries failed validation (they will be skipped):</div>
                <div style={{ marginTop: 8, maxHeight: 140, overflow: 'auto', padding: 8, background: '#fff7f7', borderRadius: 6, border: '1px solid #f2dede' }}>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {uploadModal.invalids.map((v, i) => <li key={i} style={{ color: '#b33' }}>{v}</li>)}
                  </ul>
                </div>
                <div style={{ marginTop: 8, color: '#666' }}>Only valid vehicle numbers will be registered. Please correct and re-upload if you need those entries processed.</div>
              </div>
            </>
          )}
          <div style={{ marginTop: 8, color: '#666' }}>Click <b>Confirm and Upload</b> to start registering valid numbers one-by-one. Each response will be shown as a toast.</div>
        </div>
      </CustomModal>
      <CustomModal
        open={finalSummary.open}
        title={`Upload Summary: ${finalSummary.success} succeeded, ${finalSummary.fail} failed`}
        onConfirm={() => setFinalSummary({ open: false, success: 0, fail: 0, failures: [] })}
        onCancel={() => setFinalSummary({ open: false, success: 0, fail: 0, failures: [] })}
        confirmText="Close"
        cancelText={null}
      >
        <div style={{ lineHeight: 1.6 }}>
          <div>Upload completed.</div>
          <div style={{ marginTop: 8 }}>Success: <b>{finalSummary.success}</b></div>
          <div>Failed: <b>{finalSummary.fail}</b></div>
          {finalSummary.fail > 0 && (
            <>
              <div style={{ marginTop: 10, color: '#b33', fontWeight: 700 }}>Failed entries:</div>
              <div style={{ maxHeight: 180, overflow: 'auto', padding: 8, borderRadius: 6, background: '#fff7f7', border: '1px solid #f2dede', marginTop: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr><th style={{ textAlign: 'left', padding: '6px 8px' }}>Vehicle</th><th style={{ textAlign: 'left', padding: '6px 8px' }}>Reason</th></tr>
                  </thead>
                  <tbody>
                    {finalSummary.failures.map((f, i) => (
                      <tr key={i}><td style={{ padding: '6px 8px' }}>{f.vehicle}</td><td style={{ padding: '6px 8px' }}>{f.reason}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button className="action-btn" onClick={() => {
                  // build CSV and download
                  const rows = finalSummary.failures.map(f => ({ vehicle: f.vehicle, reason: f.reason }));
                  const header = 'vehicle,reason\n';
                  const csv = header + rows.map(r => `${(r.vehicle||'').replace(/"/g,'""')},"${(r.reason||'').replace(/"/g,'""')}"`).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = `upload-failures-${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
                }}>Download Failures CSV</button>
              </div>
            </>
          )}
        </div>
      </CustomModal>
      
      {/* Confirmation Modal for Vehicle Status Actions (Inactivate / Activate / Delete) */}
      <CustomModal
        open={modal.open}
        title={
          modal.action === 'inactivate' ? 'Inactivate Vehicle?'
          : modal.action === 'activate' ? 'Activate Vehicle?'
          : modal.action === 'delete' ? 'Delete Vehicle?'
          : modal.action === 'restore-info' ? 'Cannot Restore Vehicle'
          : ''
        }
        onConfirm={async () => {
          if (modal.action === 'restore-info') {
            setModal({ open: false, action: null, vehicle: null });
            return;
          }
          if (!modal.vehicle) return setModal({ open: false, action: null, vehicle: null });
          let status = '';
          if (modal.action === 'inactivate') status = 'inactive';
          else if (modal.action === 'activate') status = 'active';
          else if (modal.action === 'delete') status = 'delete';
          try {
            const res = await fetch(`${API_ROOT}/updatevehiclestatus`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ vehicle_id: modal.vehicle.id || modal.vehicle._id, status })
            });
            if (res.ok) {
              toast.success('Vehicle status updated successfully');
              const { client_id } = getUserIds();
              fetchVehicles(client_id);
            } else {
              const data = await res.json().catch(() => ({}));
              toast.error(data.message || 'Failed to update vehicle status');
            }
          } catch {
            toast.error('API call failed');
          }
          setModal({ open: false, action: null, vehicle: null });
        }}
        onCancel={() => setModal({ open: false, action: null, vehicle: null })}
        confirmText={modal.action === 'delete' ? 'Delete' : modal.action === 'activate' ? 'Activate' : modal.action === 'restore-info' ? 'OK' : 'Inactivate'}
        cancelText={modal.action === 'restore-info' ? null : 'Cancel'}
      >
        {modal.action === 'delete' && (
          <span style={{ color: 'red', fontWeight: 600 }}>This action is non-reversible.<br />Your vehicle and all related data will be deleted permanently.</span>
        )}
        {modal.action === 'restore-info' && (
          <span style={{ color: '#475569' }}>Deleted vehicles cannot be restored from here.<br />Please contact your dealer to restore this vehicle.</span>
        )}
      </CustomModal>

      {/* Confirmation Modal for Adding Vehicle */}
      <CustomModal
        open={confirmModal}
        onCancel={() => {
          setConfirmModal(false);
          setAddToClientAccount(false);
          setSelectedClientForAdd(null);
          setClientSearchTerm('');
        }}
        title="Confirm Vehicle Registration"
      >
        <div ref={confirmModalRef} style={{ padding: '20px', minWidth: '400px' }}>
          <p style={{ marginBottom: '20px', fontSize: '15px', color: '#1a1a1a' }}>
            Are you sure you want to add this vehicle?
          </p>
          
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
              {FIELD_OPTIONS.find(f => f.value === registerField)?.label}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a', fontFamily: 'monospace' }}>
              {registerValue}
            </div>
          </div>
          
          {hasClients && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={addToClientAccount}
                    onChange={(e) => {
                      setAddToClientAccount(e.target.checked);
                      if (!e.target.checked) {
                        setSelectedClientForAdd(null);
                        setClientSearchTerm('');
                      }
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>Add vehicle to client account</span>
                </label>
              </div>
              
              {addToClientAccount && (
                <div ref={clientDropdownRef} style={{ position: 'relative', marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500, color: '#1a1a1a' }}>
                    Select Client *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search client..."
                      value={clientSearchTerm}
                      onChange={(e) => {
                        setClientSearchTerm(e.target.value);
                        setShowClientDropdown(true);
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 14px',
                        border: '2px solid ' + (showClientDropdown ? '#2196f3' : '#ddd'),
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#1a1a1a',
                        background: '#fff',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                    />
                    <i className="ri-search-line" style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#78909c',
                      fontSize: 18,
                      pointerEvents: 'none'
                    }}></i>
                    {clientSearchTerm && (
                      <button
                        onClick={() => {
                          setClientSearchTerm('');
                          setSelectedClientForAdd(null);
                          setShowClientDropdown(false);
                        }}
                        style={{
                          position: 'absolute',
                          right: 36,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          border: 'none',
                          background: '#e3f2fd',
                          color: '#1565c0',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 16,
                          fontWeight: 700,
                          transition: 'all 0.2s',
                          lineHeight: 1
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#1565c0';
                          e.target.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#e3f2fd';
                          e.target.style.color = '#1565c0';
                        }}
                        title="Clear search"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  {showClientDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      maxHeight: 240,
                      overflowY: 'auto',
                      background: '#fff',
                      border: '2px solid #2196f3',
                      borderRadius: 8,
                      boxShadow: '0 8px 24px rgba(33, 150, 243, 0.2)',
                      zIndex: 1000
                    }}>
                      {(() => {
                        const filteredList = clientList.filter(client => {
                          const searchLower = clientSearchTerm.toLowerCase();
                          const name = client.name || '';
                          const email = client.email || '';
                          const company = (client.user_meta || client.userMeta)?.company_name || '';
                          return name.toLowerCase().includes(searchLower) || 
                                 email.toLowerCase().includes(searchLower) ||
                                 company.toLowerCase().includes(searchLower);
                        });
                        
                        if (filteredList.length === 0) {
                          return (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#78909c' }}>
                              {clientList.length === 0 ? 'No clients found' : 'No matching clients'}
                            </div>
                          );
                        }
                        
                        return filteredList.map(client => (
                          <div
                            key={client.id || client._id}
                            onClick={() => {
                              setSelectedClientForAdd(client.id || client._id);
                              setClientSearchTerm(`${client.name} (${(client.user_meta || client.userMeta)?.company_name || 'N/A'})`);
                              setShowClientDropdown(false);
                            }}
                            style={{
                              padding: '12px 16px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #e8f4fd',
                              background: (client.id || client._id) === selectedClientForAdd ? '#e3f2fd' : '#fff',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = (client.id || client._id) === selectedClientForAdd ? '#bbdefb' : '#f5f9fc'}
                            onMouseLeave={(e) => e.currentTarget.style.background = (client.id || client._id) === selectedClientForAdd ? '#e3f2fd' : '#fff'}
                          >
                            <div style={{ fontWeight: 600, fontSize: 14, color: '#1565c0', marginBottom: 4 }}>
                              {client.name || 'Unknown'}
                            </div>
                            <div style={{ fontSize: 12, color: '#546e7a', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {(client.user_meta || client.userMeta)?.company_name && (
                                <span>{(client.user_meta || client.userMeta).company_name}</span>
                              )}
                              {client.email && (
                                <span style={{ color: '#78909c' }}>• {client.email}</span>
                              )}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              onClick={() => {
                setConfirmModal(false);
                setAddToClientAccount(false);
                setSelectedClientForAdd(null);
                setClientSearchTerm('');
              }}
              style={{
                padding: '10px 20px',
                background: '#f5f5f5',
                color: '#1a1a1a',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#e0e0e0'}
              onMouseLeave={(e) => e.target.style.background = '#f5f5f5'}
            >
              Cancel
            </button>
            <button
              onClick={performRegistration}
              disabled={addToClientAccount && !selectedClientForAdd}
              style={{
                padding: '10px 20px',
                background: (addToClientAccount && !selectedClientForAdd) ? '#ccc' : 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: (addToClientAccount && !selectedClientForAdd) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: (addToClientAccount && !selectedClientForAdd) ? 'none' : '0 2px 8px rgba(33, 150, 243, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!(addToClientAccount && !selectedClientForAdd)) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!(addToClientAccount && !selectedClientForAdd)) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(33, 150, 243, 0.3)';
                }
              }}
            >
              Confirm & Add Vehicle
            </button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}
