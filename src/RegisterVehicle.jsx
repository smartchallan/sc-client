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
  const [bulkUploadEnabled, setBulkUploadEnabled] = useState(true);
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

  // Fire-and-forget stakeholder notification via the generic /sendemail endpoint.
  // Never throws — email failure must not affect the main registration flow.
  const notifyStakeholders = (subject, body) => {
    fetch(`${API_ROOT}/sendemail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // No "to" — server defaults to STAKEHOLDER_EMAILS env var
      body: JSON.stringify({ subject, body }),
    }).catch(err => console.error('[notifyStakeholders] failed:', err));
  };

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
    if (addToClientAccount && !selectedClientForAdd) {
      toast.error('Please select a client to add this vehicle to.');
      return;
    }
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
        toast.success(data.message || 'Vehicle registered successfully');

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
        
        // Notify stakeholders (isolated — must never affect the main flow)
        try {
          const _su = JSON.parse(localStorage.getItem('sc_user')) || {};
          const userName = _su.user?.name || 'Unknown User';
          const vehicleLabel = registerField === 'vehicle_number' ? registerValue
            : registerField === 'engine_number' ? `Engine: ${registerValue}`
            : `Chassis: ${registerValue}`;
          notifyStakeholders(
            `New Vehicle Registered: ${vehicleLabel.toUpperCase()}`,
            `A new vehicle has been registered on SmartChallan.\n\nVehicle: ${vehicleLabel.toUpperCase()}\nRegistered by: ${userName}\nTime: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`
          );
        } catch (_e) {
          console.error('[notifyStakeholders] single vehicle:', _e);
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

      // Notify stakeholders about bulk upload completion (isolated)
      try {
        const _su = JSON.parse(localStorage.getItem('sc_user')) || {};
        const userName = _su.user?.name || 'Unknown User';
        const failureLines = failures.length > 0
          ? '\n\nFailed vehicles:\n' + failures.map(f => `  • ${f.vehicle}: ${f.reason}`).join('\n')
          : '';
        notifyStakeholders(
          `Bulk Vehicle Upload Complete — ${successCount} registered`,
          `Bulk vehicle upload completed on SmartChallan.\n\nUploaded by: ${userName}\nTotal attempted: ${parsedVehicles.length}\nSuccessfully registered: ${successCount}\nFailed: ${failures.length}\nTime: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}${failureLines}`
        );
      } catch (_e) {
        console.error('[notifyStakeholders] bulk upload:', _e);
      }
    } finally {
      setUploadingExcel(false);
      setParsedVehicles([]);
      setFinalSummary({ open: true, success: successCount, fail: failures.length, failures });
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div style={{ padding: '4px 0' }}>
      <ToastContainer position="top-right" autoClose={2000} />
      <style>{`
        .rv-nc-grid { display: grid; grid-template-columns: 420px 1fr; gap: 20px; align-items: start; }
        @media (max-width: 960px) { .rv-nc-grid { grid-template-columns: 1fr; } }
        @keyframes rv-spin { to { transform: rotate(360deg); } }
        @keyframes rv-fade-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="rv-nc-grid">

        {/* ── LEFT: Register panel ── */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(37,99,235,0.08)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>

          {/* Blue gradient header */}
          <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="ri-car-line" style={{ color: '#fff', fontSize: 20 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Register Vehicle</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>Add by vehicle number, engine or chassis</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '5px 12px', textAlign: 'center' }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, lineHeight: 1 }}>{vehicles.filter(v => (v.status || '').toUpperCase() !== 'DELETED').length}</div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, marginTop: 3 }}>Total</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '5px 12px', textAlign: 'center' }}>
                <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 18, lineHeight: 1 }}>{vehicles.filter(v => (v.status || '').toUpperCase() === 'ACTIVE').length}</div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, marginTop: 3 }}>Active</div>
              </div>
            </div>
          </div>

          <div style={{ padding: 24 }}>

            {/* Registration Type */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                  Registration Type <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={registerField}
                  onChange={e => { setRegisterField(e.target.value); setRegisterValue(''); }}
                  style={{ width: '100%', border: `1.5px solid ${registerField ? '#3b82f6' : '#e2e8f0'}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', background: '#f8fafc', boxSizing: 'border-box', color: '#1e293b', transition: 'border-color 0.15s' }}
                >
                  <option value="">Select field type...</option>
                  {FIELD_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value} disabled={opt.value !== 'vehicle_number'}>
                      {opt.label}{opt.value !== 'vehicle_number' ? ' (coming soon)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {registerField && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                    {FIELD_OPTIONS.find(f => f.value === registerField)?.label} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={registerValue}
                    onChange={e => {
                      const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      setRegisterValue(v);
                      if (registerField === 'vehicle_number') {
                        if (v.length > 11) setRegisterError('Cannot exceed 11 characters.');
                        else if (v.length > 0 && v.length < 5) setRegisterError('Must be at least 5 characters.');
                        else setRegisterError('');
                      } else setRegisterError('');
                    }}
                    placeholder={`Enter ${FIELD_OPTIONS.find(f => f.value === registerField)?.label?.toLowerCase()}`}
                    maxLength={registerField === 'vehicle_number' ? 11 : 50}
                    style={{ width: '100%', border: `1.5px solid ${registerError ? '#ef4444' : registerValue ? '#3b82f6' : '#e2e8f0'}`, borderRadius: 10, padding: '11px 14px', fontSize: 15, fontWeight: 700, fontFamily: "'Roboto Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase', outline: 'none', background: '#f8fafc', boxSizing: 'border-box', color: '#1e293b', transition: 'border-color 0.15s' }}
                  />
                  {registerError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 12, color: '#ef4444' }}>
                      <i className="ri-error-warning-line" /> {registerError}
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !!registerError || !registerField || !registerValue}
                style={{
                  width: '100%',
                  background: (!loading && !registerError && registerField && registerValue) ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : '#e2e8f0',
                  color: (!loading && !registerError && registerField && registerValue) ? '#fff' : '#94a3b8',
                  border: 'none', borderRadius: 10, padding: '13px 24px',
                  fontSize: 15, fontWeight: 700, cursor: (!loading && !registerError && registerField && registerValue) ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  transition: 'all 0.2s',
                  boxShadow: (!loading && !registerError && registerField && registerValue) ? '0 4px 12px rgba(37,99,235,0.3)' : 'none',
                }}
              >
                {loading
                  ? <><i className="ri-loader-4-line" style={{ animation: 'rv-spin 1s linear infinite', fontSize: 18 }} /> Adding...</>
                  : <><i className="ri-add-circle-line" style={{ fontSize: 18 }} /> Add Vehicle</>
                }
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>or</span>
              <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
            </div>

            {/* Bulk upload toggle */}
            <button
              type="button"
              onClick={() => setBulkUploadEnabled(v => !v)}
              style={{ width: '100%', border: `1.5px solid ${bulkUploadEnabled ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: 10, padding: '12px 16px', background: bulkUploadEnabled ? '#f0fdf4' : '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', transition: 'all 0.15s' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: bulkUploadEnabled ? '#dcfce7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="ri-file-excel-2-line" style={{ color: bulkUploadEnabled ? '#16a34a' : '#64748b', fontSize: 18 }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>Bulk Upload via Excel</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Register multiple vehicles from a spreadsheet</div>
              </div>
              <i className={`ri-arrow-${bulkUploadEnabled ? 'up' : 'down'}-s-line`} style={{ color: '#94a3b8', fontSize: 20, flexShrink: 0 }} />
            </button>

            {/* Bulk upload body */}
            {bulkUploadEnabled && (
              <div style={{ marginTop: 12, padding: 16, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', animation: 'rv-fade-in 0.2s ease' }}>

                {hasClients && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#334155', fontWeight: 500 }}>
                      <input type="checkbox" checked={addToClientAccount} onChange={e => { setAddToClientAccount(e.target.checked); if (!e.target.checked) { setSelectedClientForAdd(null); setClientSearchTerm(''); setShowClientDropdown(false); } }} />
                      Add vehicles to a client account
                    </label>
                    {addToClientAccount && (
                      <div ref={clientDropdownRef} style={{ position: 'relative', marginTop: 10 }}>
                        <div style={{ position: 'relative' }}>
                          <i className="ri-search-line" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14, pointerEvents: 'none' }} />
                          <input
                            type="text"
                            placeholder="Search by name, email or company..."
                            value={clientSearchTerm}
                            onChange={e => { setClientSearchTerm(e.target.value); setShowClientDropdown(true); }}
                            onFocus={() => setShowClientDropdown(true)}
                            style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '9px 32px 9px 32px', fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box', color: '#1e293b' }}
                          />
                          {clientSearchTerm && (
                            <button type="button" onClick={() => { setClientSearchTerm(''); setSelectedClientForAdd(null); setShowClientDropdown(false); }} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16, padding: 0 }}>
                              <i className="ri-close-line" />
                            </button>
                          )}
                        </div>
                        {showClientDropdown && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: 200, overflowY: 'auto', marginTop: 4 }}>
                            {(() => {
                              const filtered = clientList.filter(c => {
                                const q = clientSearchTerm.toLowerCase();
                                return (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || ((c.user_meta || c.userMeta)?.company_name || '').toLowerCase().includes(q);
                              });
                              if (!filtered.length) return <div style={{ padding: '12px 14px', color: '#94a3b8', fontSize: 13 }}>{clientList.length === 0 ? 'No clients available' : 'No matching clients'}</div>;
                              return filtered.map(c => (
                                <div
                                  key={c.id || c._id}
                                  onClick={() => { setSelectedClientForAdd(c.id || c._id); setClientSearchTerm(`${c.name} (${(c.user_meta || c.userMeta)?.company_name || 'N/A'})`); setShowClientDropdown(false); }}
                                  style={{ padding: '10px 14px', cursor: 'pointer', background: (c.id || c._id) === selectedClientForAdd ? '#eff6ff' : 'transparent', borderBottom: '1px solid #f8fafc' }}
                                >
                                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{c.name || 'Unknown'}</div>
                                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{(c.user_meta || c.userMeta)?.company_name || ''}{c.email ? ` · ${c.email}` : ''}</div>
                                </div>
                              ));
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 14, padding: '10px 12px', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd', fontSize: 12, color: '#0369a1', lineHeight: 1.5 }}>
                  <i className="ri-information-line" style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }} />
                  <span>Vehicle numbers should be in the <strong>second column</strong> of your Excel file, one per row.</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#334155' }}>
                    <input type="checkbox" checked={skipHeader} onChange={e => setSkipHeader(!!e.target.checked)} />
                    Skip first row (has header)
                  </label>
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} style={{ display: 'none' }} />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingExcel}
                    style={{ border: '1.5px solid #2563eb', borderRadius: 8, padding: '8px 16px', background: '#fff', color: '#2563eb', fontWeight: 600, fontSize: 13, cursor: uploadingExcel ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <i className="ri-upload-2-line" /> Select File
                  </button>
                </div>

                {uploadingExcel && uploadProgress.total > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ height: 6, background: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'linear-gradient(90deg, #2563eb, #60a5fa)', borderRadius: 10, width: `${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%`, transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, textAlign: 'center' }}>{uploadProgress.current} of {uploadProgress.total} uploaded</div>
                  </div>
                )}
                {uploadingExcel && uploadProgress.total === 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 13, color: '#475569' }}>
                    <i className="ri-loader-4-line" style={{ animation: 'rv-spin 1s linear infinite' }} /> Processing file...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Vehicles panel ── */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(37,99,235,0.08)', border: '1px solid #e2e8f0', overflow: 'hidden', minHeight: 500 }}>

          {/* Panel header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="ri-car-wash-line" style={{ color: '#2563eb', fontSize: 20 }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  Registered Vehicles
                  {vehicles.filter(v => (v.status || '').toUpperCase() !== 'DELETED').length > 0 && (
                    <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 20, padding: '1px 8px', fontSize: 12, fontWeight: 700 }}>
                      {vehicles.filter(v => (v.status || '').toUpperCase() !== 'DELETED').length}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>View and manage your registered vehicles</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, gap: 2 }}>
                {[['', 'All'], ['ACTIVE', 'Active'], ['INACTIVE', 'Inactive']].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setStatusFilter(val)}
                    style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s', background: statusFilter === val ? '#fff' : 'transparent', color: statusFilter === val ? '#2563eb' : '#64748b', boxShadow: statusFilter === val ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}
                  >{label}</button>
                ))}
              </div>
              <button
                onClick={() => setSortDesc(s => !s)}
                style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 12px', background: '#fff', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <i className={`ri-sort-${sortDesc ? 'desc' : 'asc'}`} />
                {sortDesc ? 'Newest' : 'Oldest'}
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div style={{ padding: '14px 24px 0' }}>
            <div style={{ position: 'relative', maxWidth: 400 }}>
              <i className="ri-search-line" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14, pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search vehicle, engine or chassis number..."
                value={searchValue}
                onChange={e => setSearchValue(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                maxLength={20}
                style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '9px 32px 9px 34px', fontSize: 13, outline: 'none', background: '#f8fafc', boxSizing: 'border-box', color: '#1e293b' }}
              />
              {searchValue && (
                <button onClick={() => setSearchValue('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16, padding: 0 }}>
                  <i className="ri-close-line" />
                </button>
              )}
            </div>
          </div>

          {/* Table content */}
          <div>
            {fetchingVehicles ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 0', textAlign: 'center' }}>
                <div style={{ width: 40, height: 40, border: '3px solid #dbeafe', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'rv-spin 0.9s linear infinite', marginBottom: 14 }} />
                <div style={{ color: '#64748b', fontSize: 14 }}>Loading vehicles...</div>
              </div>
            ) : (() => {
              const filtered = vehicles.filter(v => {
                if ((v.status || '').toUpperCase() === 'DELETED') return false;
                const q = searchValue.trim();
                const matchSearch = !q || (v.vehicle_number || '').includes(q) || (v.engine_number || '').includes(q) || (v.chassis_number || '').includes(q);
                const matchStatus = !statusFilter || (v.status || '').toUpperCase() === statusFilter;
                return matchSearch && matchStatus;
              }).sort((a, b) => {
                const dA = a.registered_at ? new Date(a.registered_at) : new Date(0);
                const dB = b.registered_at ? new Date(b.registered_at) : new Date(0);
                return sortDesc ? dB - dA : dA - dB;
              });

              if (!filtered.length) return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 0', textAlign: 'center' }}>
                  <i className="ri-car-line" style={{ fontSize: 40, color: '#cbd5e1', marginBottom: 12, display: 'block' }} />
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#475569', marginBottom: 6 }}>
                    {vehicles.filter(v => (v.status || '').toUpperCase() !== 'DELETED').length === 0 ? 'No Vehicles Registered' : 'No results found'}
                  </div>
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>
                    {vehicles.filter(v => (v.status || '').toUpperCase() !== 'DELETED').length === 0
                      ? 'Use the form on the left to register your first vehicle'
                      : 'Try adjusting your search or filter'}
                  </div>
                </div>
              );

              return (
                <>
                  <div className="table-container" id="registered-vehicles-table-print-area">
                    <table className="latest-table">
                      <thead>
                        <tr>
                          <th style={{ width: 44, textAlign: 'center' }}>#</th>
                          <th>Vehicle No.</th>
                          <th style={{ width: 130 }}>RTO data fetched<br/><span style={{fontSize:8}}>(from PARIVAHAN)</span></th>
                          <th style={{ width: 130 }}>Challan data fetched<br/><span style={{fontSize:8}}>(from PARIVAHAN)</span></th>
                          <th style={{ width: 110, textAlign: 'center' }}>Status</th>
                          <th style={{ width: 150 }}>Registered On</th>
                          <th style={{ width: 120, textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.slice(0, activeVehiclesLimit).map((v, idx) => {
                          const status = (v.status || '').toUpperCase();
                          return (
                            <tr key={v.id || v._id || idx}>
                              <td style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 500 }}>{idx + 1}</td>
                              <td>
                                <span className="rv-vehicle-num" onClick={() => setSidebarVehicle(v)} title="View details">
                                  {v.vehicle_number || '—'}
                                </span>
                              </td>
                              <td className="rv-date-cell">
                                {v.rto_updated_at ? new Date(v.rto_updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : <span style={{ color: '#cbd5e1' }}>—</span>}
                              </td>
                              <td className="rv-date-cell">
                                {v.challan_updated_at ? new Date(v.challan_updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : <span style={{ color: '#cbd5e1' }}>—</span>}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {status === 'ACTIVE'
                                  ? <span className="client-status-pill active">Active</span>
                                  : status === 'INACTIVE'
                                    ? <span className="client-status-pill inactive">Inactive</span>
                                    : <span className="badge badge-gray">{status}</span>}
                              </td>
                              <td className="rv-date-cell">
                                {v.registered_at ? new Date(v.registered_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                              </td>
                              <td>
                                <div className="rv-action-row">
                                  <button className="rv-icon-btn rv-icon-btn--data" disabled={dataLoadingId === v.vehicle_number} onClick={() => handleGetVehicleData(v.vehicle_number)} title="Fetch RTO & challan data">
                                    {dataLoadingId === v.vehicle_number ? <span className="loading-spinner rv-spinner-sm rv-spinner-dark" /> : <i className="ri-database-2-line" />}
                                  </button>
                                  {status === 'INACTIVE'
                                    ? <button className="rv-icon-btn rv-icon-btn--success" onClick={() => setModal({ open: true, action: 'activate', vehicle: v })} title="Activate"><i className="ri-checkbox-circle-line" /></button>
                                    : <button className="rv-icon-btn rv-icon-btn--warn" onClick={() => setModal({ open: true, action: 'inactivate', vehicle: v })} title="Deactivate"><i className="ri-pause-circle-line" /></button>
                                  }
                                  <button className="rv-icon-btn rv-icon-btn--danger" onClick={() => setModal({ open: true, action: 'delete', vehicle: v })} title="Delete"><i className="ri-delete-bin-6-line" /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {filtered.length > activeVehiclesLimit && (
                    <div className="vst-show-more" style={{ padding: '0 24px 16px' }}>
                      <span className="vst-show-more__label">Showing {activeVehiclesLimit} of {filtered.length} vehicles</span>
                      <SelectShowMore
                        onShowMoreRecords={val => val === 'all' ? setActiveVehiclesLimit(filtered.length) : setActiveVehiclesLimit(Number(val))}
                        onResetRecords={() => setActiveVehiclesLimit(10)}
                        maxCount={filtered.length}
                      />
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── Deleted Vehicles ── */}
      {(() => {
        const deleted = vehicles.filter(v => (v.status || '').toUpperCase() === 'DELETED');
        if (!deleted.length) return null;
        return (
          <div style={{ marginTop: 20, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(239,68,68,0.06)', border: '1.5px solid #fecaca', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="ri-delete-bin-2-line" style={{ color: '#ef4444', fontSize: 18 }} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', flex: 1 }}>Deleted Vehicles</div>
              <span style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{deleted.length}</span>
            </div>
            <div className="table-container" id="deleted-vehicles-table-print-area">
              <table className="latest-table">
                <thead>
                  <tr>
                    <th style={{ width: 44, textAlign: 'center' }}>#</th>
                    <th>Vehicle No.</th>
                    <th style={{ width: 110, textAlign: 'center' }}>Status</th>
                    <th style={{ width: 150 }}>Registered</th>
                    <th style={{ width: 96, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deleted.sort((a, b) => {
                    const dA = a.registered_at ? new Date(a.registered_at) : new Date(0);
                    const dB = b.registered_at ? new Date(b.registered_at) : new Date(0);
                    return sortDesc ? dB - dA : dA - dB;
                  }).slice(0, deletedVehiclesLimit).map((v, idx) => (
                    <tr key={v.id || v._id || idx} className="rv-deleted-row">
                      <td style={{ textAlign: 'center', color: '#94a3b8' }}>{idx + 1}</td>
                      <td><span className="rv-deleted-num">{v.vehicle_number || '—'}</span></td>
                      <td style={{ textAlign: 'center' }}><span className="badge badge-danger">Deleted</span></td>
                      <td className="rv-date-cell">{v.registered_at ? new Date(v.registered_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="rv-icon-btn rv-icon-btn--restore" onClick={() => setModal({ open: true, action: 'restore-info', vehicle: v })} title="Restore info">
                          <i className="ri-refresh-line" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {deleted.length > deletedVehiclesLimit && (
              <div className="vst-show-more" style={{ padding: '0 24px 16px' }}>
                <span className="vst-show-more__label">Showing {deletedVehiclesLimit} of {deleted.length} deleted</span>
                <SelectShowMore
                  onShowMoreRecords={val => val === 'all' ? setDeletedVehiclesLimit(deleted.length) : setDeletedVehiclesLimit(Number(val))}
                  onResetRecords={() => setDeletedVehiclesLimit(10)}
                  maxCount={deleted.length}
                />
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Modals ── */}

      {/* Bulk upload preview */}
      <CustomModal
        open={uploadModal.open}
        title={`Confirm Bulk Upload — ${uploadModal.count} valid vehicle${uploadModal.count === 1 ? '' : 's'}`}
        onConfirm={confirmAndUploadParsed}
        onCancel={() => { setUploadModal({ open: false, count: 0, invalids: [] }); setParsedVehicles([]); }}
        confirmText={uploadingExcel ? 'Processing...' : 'Confirm & Upload'}
        cancelText={uploadingExcel ? null : 'Cancel'}
      >
        <div style={{ lineHeight: 1.7 }}>
          <p>Found <strong>{uploadModal.count}</strong> valid vehicle number{uploadModal.count === 1 ? '' : 's'} ready to register.</p>
          {Array.isArray(uploadModal.invalids) && uploadModal.invalids.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p style={{ color: '#b91c1c', fontWeight: 600, marginBottom: 6 }}>
                {uploadModal.invalids.length} entries failed validation and will be skipped:
              </p>
              <div style={{ maxHeight: 130, overflowY: 'auto', padding: '8px 12px', background: '#fef2f2', borderRadius: 6, border: '1px solid #fecaca' }}>
                <ul style={{ margin: 0, paddingLeft: 16, color: '#b91c1c', fontSize: 13 }}>
                  {uploadModal.invalids.map((v, i) => <li key={i}>{v}</li>)}
                </ul>
              </div>
            </div>
          )}
          <p style={{ marginTop: 10, color: '#64748b', fontSize: 13 }}>Each vehicle will be registered sequentially. Results appear as toasts.</p>
        </div>
      </CustomModal>

      {/* Bulk upload summary */}
      <CustomModal
        open={finalSummary.open}
        title={`Upload Complete — ${finalSummary.success} succeeded, ${finalSummary.fail} failed`}
        onConfirm={() => setFinalSummary({ open: false, success: 0, fail: 0, failures: [] })}
        onCancel={() => setFinalSummary({ open: false, success: 0, fail: 0, failures: [] })}
        confirmText="Close"
        cancelText={null}
      >
        <div style={{ lineHeight: 1.7 }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
            <span className="badge badge-success" style={{ fontSize: 13, padding: '4px 12px' }}>Succeeded: {finalSummary.success}</span>
            {finalSummary.fail > 0 && <span className="badge badge-danger" style={{ fontSize: 13, padding: '4px 12px' }}>Failed: {finalSummary.fail}</span>}
          </div>
          {finalSummary.fail > 0 && (
            <>
              <p style={{ color: '#b91c1c', fontWeight: 600, marginBottom: 8 }}>Failed entries:</p>
              <div style={{ maxHeight: 180, overflowY: 'auto', borderRadius: 6, border: '1px solid #fecaca', marginBottom: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead style={{ background: '#fef2f2' }}>
                    <tr>
                      <th style={{ padding: '6px 10px', textAlign: 'left' }}>Vehicle</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left' }}>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalSummary.failures.map((f, i) => (
                      <tr key={i}>
                        <td style={{ padding: '6px 10px' }}>{f.vehicle}</td>
                        <td style={{ padding: '6px 10px', color: '#64748b' }}>{f.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => {
                const rows = finalSummary.failures.map(f => `${(f.vehicle || '').replace(/"/g, '""')},"${(f.reason || '').replace(/"/g, '""')}"`);
                const csv = 'vehicle,reason\n' + rows.join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `upload-failures-${new Date().toISOString().slice(0, 10)}.csv`;
                document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
              }}>
                <i className="ri-download-2-line" /> Download Failures CSV
              </button>
            </>
          )}
        </div>
      </CustomModal>

      {/* Vehicle status actions */}
      <CustomModal
        open={modal.open}
        title={
          modal.action === 'inactivate' ? 'Deactivate Vehicle?'
            : modal.action === 'activate' ? 'Activate Vehicle?'
              : modal.action === 'delete' ? 'Delete Vehicle?'
                : modal.action === 'restore-info' ? 'Cannot Restore Vehicle'
                  : ''
        }
        onConfirm={async () => {
          if (modal.action === 'restore-info') { setModal({ open: false, action: null, vehicle: null }); return; }
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
          } catch { toast.error('API call failed'); }
          setModal({ open: false, action: null, vehicle: null });
        }}
        onCancel={() => setModal({ open: false, action: null, vehicle: null })}
        confirmText={modal.action === 'delete' ? 'Delete' : modal.action === 'activate' ? 'Activate' : modal.action === 'restore-info' ? 'OK' : 'Deactivate'}
        cancelText={modal.action === 'restore-info' ? null : 'Cancel'}
      >
        {modal.action === 'delete' && (
          <p style={{ color: '#b91c1c', fontWeight: 600 }}>
            This action is permanent. The vehicle and all related data will be deleted.
          </p>
        )}
        {modal.action === 'restore-info' && (
          <p style={{ color: '#475569' }}>
            Deleted vehicles cannot be restored from here. Please contact your dealer to restore this vehicle.
          </p>
        )}
      </CustomModal>

      {/* Confirm single vehicle add */}
      <CustomModal
        open={confirmModal}
        onConfirm={performRegistration}
        confirmText="Confirm & Add Vehicle"
        onCancel={() => { setConfirmModal(false); setAddToClientAccount(false); setSelectedClientForAdd(null); setClientSearchTerm(''); }}
        cancelText="Cancel"
        title="Confirm Vehicle Registration"
      >
        <div ref={confirmModalRef} style={{ minWidth: 360 }}>
          <p style={{ marginBottom: 16, color: '#475569' }}>Review the details before confirming.</p>
          <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {FIELD_OPTIONS.find(f => f.value === registerField)?.label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
              {registerValue}
            </div>
          </div>

          {hasClients && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label className="rv-checkbox-label" style={{ fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={addToClientAccount}
                    onChange={e => { setAddToClientAccount(e.target.checked); if (!e.target.checked) { setSelectedClientForAdd(null); setClientSearchTerm(''); } }}
                  />
                  <span>Add vehicle to a client account</span>
                </label>
              </div>

              {addToClientAccount && (
                <div ref={clientDropdownRef} style={{ position: 'relative', marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6 }}>
                    Select Client <span className="rv-required">*</span>
                  </label>
                  <div className="rv-client-search__wrap">
                    <i className="ri-search-line rv-client-search__icon" />
                    <input
                      type="text"
                      className="form-control rv-client-search__input"
                      placeholder="Search by name, email or company..."
                      value={clientSearchTerm}
                      onChange={e => { setClientSearchTerm(e.target.value); setShowClientDropdown(true); }}
                      onFocus={() => setShowClientDropdown(true)}
                    />
                    {clientSearchTerm && (
                      <button type="button" className="rv-client-search__clear" onClick={() => { setClientSearchTerm(''); setSelectedClientForAdd(null); setShowClientDropdown(false); }}>
                        <i className="ri-close-line" />
                      </button>
                    )}
                  </div>
                  {showClientDropdown && (
                    <div className="rv-client-dropdown">
                      {(() => {
                        const filteredList = clientList.filter(client => {
                          const searchLower = clientSearchTerm.toLowerCase();
                          const name = client.name || '';
                          const email = client.email || '';
                          const company = (client.user_meta || client.userMeta)?.company_name || '';
                          return name.toLowerCase().includes(searchLower) || email.toLowerCase().includes(searchLower) || company.toLowerCase().includes(searchLower);
                        });
                        if (filteredList.length === 0) return (
                          <div className="rv-client-dropdown__empty">
                            {clientList.length === 0 ? 'No clients available' : 'No matching clients'}
                          </div>
                        );
                        return filteredList.map(client => (
                          <div
                            key={client.id || client._id}
                            className={`rv-client-option${(client.id || client._id) === selectedClientForAdd ? ' rv-client-option--selected' : ''}`}
                            onClick={() => { setSelectedClientForAdd(client.id || client._id); setClientSearchTerm(`${client.name} (${(client.user_meta || client.userMeta)?.company_name || 'N/A'})`); setShowClientDropdown(false); }}
                          >
                            <div className="rv-client-option__name">{client.name || 'Unknown'}</div>
                            <div className="rv-client-option__meta">
                              {(client.user_meta || client.userMeta)?.company_name && <span>{(client.user_meta || client.userMeta).company_name}</span>}
                              {client.email && <span>{client.email}</span>}
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
        </div>
      </CustomModal>
    </div>
  );
}
