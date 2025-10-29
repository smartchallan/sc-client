import React, { useState, useEffect, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CustomModal from "./client/CustomModal";
import * as XLSX from 'xlsx';

const FIELD_OPTIONS = [
  { value: "vehicle_number", label: "Vehicle Number" },
  { value: "engine_number", label: "Engine Number" },
  { value: "chasis_number", label: "Chasis Number" },
];

export default function RegisterVehicle() {
  // Registration form state
  const [registerField, setRegisterField] = useState("");
  const [registerValue, setRegisterValue] = useState("");
  const [registerError, setRegisterError] = useState("");
  // Table search/filter state
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
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
  // Loader state for RTO/Challan API calls
  const [rtoLoadingId, setRtoLoadingId] = useState(null);
  const [challanLoadingId, setChallanLoadingId] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    setLoading(true);
    try {
      const ids = getUserIds();
      const payload = {
        ...ids,
        vehicle_number: registerField === "vehicle_number" ? registerValue : undefined,
        engine_number: registerField === "engine_number" ? registerValue : undefined,
        chasis_number: registerField === "chasis_number" ? registerValue : undefined,
      };
      const res = await fetch(API_ROOT + REGISTER_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to register vehicle");
      } else {
        toast.success("Vehicle registered successfully!");
        setRegisterValue("");
        setRegisterField("");
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
          const payload = { ...ids, vehicle_number };
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
    <div className="register-vehicle-content">
      <ToastContainer position="top-right" autoClose={2000} />
      <h1 className="page-title">Register New Vehicle</h1>
      <p className="page-subtitle">
        You can register your vehicle using <b>any one</b> of the following details: <b>Vehicle Number</b>, <b>Engine Number</b>, or <b>Chasis Number</b>.
      </p>
      <div className="card">
        <form className="vehicle-form" onSubmit={handleSubmit} style={{display: 'flex', flexWrap: 'wrap', gap: 16}}>
          <div className="form-group" style={{flex: '1 1 45%', minWidth: 220, maxWidth: '50%'}}>
            <label htmlFor="select_field">Select Field to Register By</label>
            <select
              id="select_field"
              className="form-control"
              value={registerField}
              onChange={e => {
                setRegisterField(e.target.value);
                setRegisterValue("");
              }}
            >
              <option value="">Select Field</option>
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
            <div className="form-group" style={{flex: '1 1 45%', minWidth: 220, maxWidth: '50%'}}>
              <label htmlFor="field_value">{FIELD_OPTIONS.find(f => f.value === registerField)?.label}</label>
              <input
                type="text"
                id="field_value"
                name="field_value"
                className={"form-control" + (registerField === 'vehicle_number' ? (registerError ? ' input-invalid' : (registerValue.length >= 5 ? ' input-valid' : '')) : '')}
                value={registerValue}
                onChange={e => {
                  const v = e.target.value.toUpperCase();
                  setRegisterValue(v);
                  // validate vehicle number format when that field is selected
                  if (registerField === 'vehicle_number') {
                    const re = /^[A-Z0-9]{0,11}$/; // allow partial input up to 11 for UX
                    if (!re.test(v)) {
                      setRegisterError('Only alphanumeric characters allowed (max 11).');
                    } else if (v.length > 0 && (v.length < 5 || v.length > 11)) {
                      setRegisterError('Vehicle number must be 5-11 characters long.');
                    } else {
                      setRegisterError('');
                    }
                  } else {
                    setRegisterError('');
                  }
                }}
                style={{textTransform: 'uppercase'}}
                placeholder={`Enter ${FIELD_OPTIONS.find(f => f.value === registerField)?.label?.toLowerCase()}`}
              />
              {registerField === 'vehicle_number' && registerError && (
                <div style={{color: 'red', marginTop: 6, fontSize: 13}}>{registerError}</div>
              )}
            </div>
          )}
          <div className="button-group" style={{width: '100%'}}>
            <button type="submit" className="btn btn-primary" disabled={loading || !!registerError}>{loading ? "Adding..." : "Add New Vehicle"}</button>
          </div>
        </form>
      </div>
  {/* Upload Vehicles by Excel */}
  <div className="card upload-card" style={{ marginTop: 18 }}>
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
      {/* Vehicle table below form */}

      <div className="dashboard-latest">
          <div style={{marginTop: 32}}>
          <h2 style={{fontSize: '1.2rem', marginBottom: 12}}>Registered Vehicles {vehicles && vehicles.length ? `(${vehicles.length})` : ''}</h2>
          {/* Search and status filter controls */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-control"
              style={{ minWidth: 200, maxWidth: 300, textTransform: 'uppercase' }}
              placeholder="Search by Vehicle No, Engine No or Chasis No"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value.toUpperCase())}
            />
            <select
              className="form-control"
              style={{ minWidth: 200, maxWidth: 300, textTransform: 'uppercase' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          {/* Table logic with search/filter/sort */}
          {fetchingVehicles ? (
            <div>Loading vehicles...</div>
          ) : vehicles.length === 0 ? (
            <div style={{color: '#888'}}>No vehicles registered yet.</div>
          ) : (
            <table className="latest-table" style={{ width: '100%', marginTop: 8 }}>
              <thead>
                <tr>
                  <th>S. No.</th>
                  <th>Vehicle Number</th>
                  <th>Engine Number</th>
                  <th>Chasis Number</th>
                  <th>Status</th>
                  <th>
                    Registered At
                    <span style={{marginLeft:6, cursor:'pointer', fontSize:16}} onClick={() => setSortDesc(s => !s)}>
                      {sortDesc ? <i className="ri-arrow-down-s-line" title="Sort: Newest First"></i> : <i className="ri-arrow-up-s-line" title="Sort: Oldest First"></i>}
                    </span>
                  </th>
                  <th>Data</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles
                  .filter(v => {
                    const searchVal = searchValue.trim().toUpperCase();
                    const matchesSearch =
                      !searchVal ||
                      (v.vehicle_number && v.vehicle_number.toUpperCase().includes(searchVal)) ||
                      (v.engine_number && v.engine_number.toUpperCase().includes(searchVal)) ||
                      (v.chasis_number && v.chasis_number.toUpperCase().includes(searchVal));
                    const matchesStatus =
                      !statusFilter || (v.status && v.status.toUpperCase() === statusFilter.toUpperCase());
                    return matchesSearch && matchesStatus;
                  })
                  .sort((a, b) => {
                    const dateA = a.registered_at ? new Date(a.registered_at) : new Date(0);
                    const dateB = b.registered_at ? new Date(b.registered_at) : new Date(0);
                    return sortDesc ? dateB - dateA : dateA - dateB;
                  })
                  .map((v, idx) => {
                    let status = (v.status || 'Not Available').toUpperCase();
                    let statusColor = '#888';
                    if (status === 'ACTIVE') statusColor = 'green';
                    else if (status === 'INACTIVE') statusColor = 'orange';
                    else if (status === 'DELETED') statusColor = 'red';
                    const handleInactivate = () => setModal({ open: true, action: 'inactivate', vehicle: v });
                    const handleActivate = () => setModal({ open: true, action: 'activate', vehicle: v });
                    const handleDelete = () => setModal({ open: true, action: 'delete', vehicle: v });
                    const setInfoModal = (vehicle, lastAction) => setModal({ open: true, action: 'info', vehicle: { ...vehicle, lastAction, status: (vehicle.status || '').toUpperCase() } });
                    return (
                          <tr key={v.id || v._id || idx}>
                            <td>{idx + 1}</td>
                            <td>{v.vehicle_number || 'Not Available'}</td>
                        <td>{v.engine_number || 'Not Available'}</td>
                        <td>{v.chasis_number || 'Not Available'}</td>
                        <td style={{ color: statusColor, fontWeight: 600, letterSpacing: 1 }}>{status}</td>
                        <td>{v.registered_at ? new Date(v.registered_at).toLocaleString() : 'Not Available'}</td>
                        <td>
                          <div style={{display:'flex',gap:8}}>
                            <button
                              className="action-btn flat-btn"
                              disabled={rtoLoadingId === v.id}
                              onClick={() => {
                                // Allow clicks even when vehicle is INACTIVE/DELETED so we can show the info modal.
                                if (status === 'INACTIVE' || status === 'DELETED') {
                                  setInfoModal(v, 'getRTO');
                                } else {
                                  setModal({ open: true, action: 'getRTO', vehicle: v });
                                }
                              }}
                              style={{ opacity: status === 'DELETED' ? 0.6 : status === 'INACTIVE' ? 0.85 : 1 }}
                              title={rtoLoadingId === v.id ? 'Loading...' : (status === 'DELETED' ? 'Vehicle deleted' : status === 'INACTIVE' ? 'Vehicle inactive' : 'Get RTO Data')}
                            >
                              {rtoLoadingId === v.id ? 'Loading...' : 'Get RTO Data'}
                            </button>
                            <button
                              className="action-btn flat-btn"
                              disabled={challanLoadingId === v.id}
                              onClick={() => {
                                // Allow clicks to show info modal for INACTIVE/DELETED states.
                                if (status === 'INACTIVE' || status === 'DELETED') {
                                  setInfoModal(v, 'getChallan');
                                } else {
                                  setModal({ open: true, action: 'getChallan', vehicle: v });
                                }
                              }}
                              style={{ opacity: status === 'DELETED' ? 0.6 : status === 'INACTIVE' ? 0.85 : 1 }}
                              title={challanLoadingId === v.id ? 'Loading...' : (status === 'DELETED' ? 'Vehicle deleted' : status === 'INACTIVE' ? 'Vehicle inactive' : 'Get Challan Data')}
                            >
                              {challanLoadingId === v.id ? 'Loading...' : 'Get Challan Data'}
                            </button>
                          </div>
                        </td>
                        <td>
                          {status === 'DELETED' ? (
                            <span style={{ color: '#999' }}>—</span>
                          ) : (
                            <>
                              {status === 'INACTIVE' ? (
                                <span
                                  title="Activate Vehicle"
                                  style={{ cursor: 'pointer', marginRight: 12, fontSize: 18, color: 'green' }}
                                  onClick={handleActivate}
                                  role="button"
                                  aria-label="Activate Vehicle"
                                >
                                  ✅
                                </span>
                              ) : (
                                <span
                                  title="Inactivate Vehicle"
                                  style={{ cursor: 'pointer', marginRight: 12, fontSize: 18 }}
                                  onClick={handleInactivate}
                                  role="button"
                                  aria-label="Inactivate Vehicle"
                                >
                                  🚫
                                </span>
                              )}
                              <span
                                title="Delete Vehicle"
                                style={{ cursor: 'pointer', color: 'red', fontSize: 18 }}
                                onClick={handleDelete}
                                role="button"
                                aria-label="Delete Vehicle"
                              >
                                🗑️
                              </span>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                {/* Custom Modal for confirmation */}
                <CustomModal
                  open={modal.open}
                  title={
                    modal.action === 'getRTO' ? 'Are you sure you want to request vehicle RTO data?'
                    : modal.action === 'getChallan' ? 'Are you sure you want to request vehicle Challan data?'
                    : modal.action === 'inactivate' ? 'Are you sure you want to inactivate this vehicle?'
                    : modal.action === 'activate' ? 'Are you sure you want to activate this vehicle?'
                    : modal.action === 'delete' ? 'Are you sure you want to delete this vehicle?'
                    : modal.action === 'info' ? (modal.vehicle && ((modal.vehicle.status || '').toUpperCase() === 'DELETED') ? 'Vehicle Deleted' : 'Vehicle Inactive')
                    : ''
                  }
                  onConfirm={async () => {
                    if (modal.action === 'info') {
                      setModal({ open: false, action: null, vehicle: null });
                      return;
                    }
                    if (!modal.vehicle) return setModal({ open: false, action: null, vehicle: null });
                    // Close modal immediately after confirmation
                    setModal({ open: false, action: null, vehicle: null });
                    if (modal.action === 'getRTO') {
                      setRtoLoadingId(modal.vehicle.id);
                      try {
                        const userObj = JSON.parse(localStorage.getItem("sc_user"));
                        const clientID = userObj && userObj.user ? userObj.user.client_id || userObj.user.id : null;
                        const vehicleNumber = modal.vehicle.vehicle_number;
                        const res = await fetch(`${API_ROOT}/getvehiclertodata`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ vehicleNumber, clientID })
                        });
                        const data = await res.json();
                        if (res.ok) {
                          toast.success('RTO data fetched successfully');
                        } else {
                          toast.error(data.message || 'Failed to fetch RTO data');
                        }
                      } catch (err) {
                        toast.error('API call failed');
                      }
                      setRtoLoadingId(null);
                      return;
                    }
                    if (modal.action === 'getChallan') {
                      setChallanLoadingId(modal.vehicle.id);
                      try {
                        const userObj = JSON.parse(localStorage.getItem("sc_user"));
                        const clientID = userObj && userObj.user ? userObj.user.client_id || userObj.user.id : null;
                        const vehicleNumber = modal.vehicle.vehicle_number;
                        const res = await fetch(`${API_ROOT}/getvehicleechallandata`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ vehicleNumber, clientID })
                        });
                        const data = await res.json();
                        if (res.ok) {
                          toast.success('Challan data fetched successfully');
                        } else {
                          toast.error(data.message || 'Failed to fetch Challan data');
                        }
                      } catch (err) {
                        toast.error('API call failed');
                      }
                      setChallanLoadingId(null);
                      return;
                    }
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
                        if (client_id) fetchVehicles(client_id);
                      } else {
                        const data = await res.json();
                        toast.error(data.message || 'Failed to update vehicle status');
                      }
                    } catch (err) {
                      toast.error('API call failed');
                    }
                    setModal({ open: false, action: null, vehicle: null });
                  }}
                  onCancel={() => setModal({ open: false, action: null, vehicle: null })}
                  confirmText={modal.action === 'delete' ? 'Delete' : modal.action === 'activate' ? 'Activate' : modal.action === 'inactivate' ? 'Inactivate' : modal.action === 'info' ? 'OK' : 'Yes'}
                  cancelText={modal.action === 'info' ? null : 'Cancel'}
                >
                  {modal.action === 'delete' && (
                    <span style={{color:'red', fontWeight:600}}>This action is non-reversible.<br/>Your vehicle and all related RTO, challan data will be deleted permanently.</span>
                  )}
                  {modal.action === 'info' && (
                    (() => {
                      const statusStr = modal.vehicle && modal.vehicle.status ? String(modal.vehicle.status).toUpperCase() : '';
                      const lastAct = modal.vehicle && modal.vehicle.lastAction ? String(modal.vehicle.lastAction).toLowerCase() : '';
                      if (statusStr === 'DELETED') {
                        return (
                          <span style={{color:'#d35400', fontWeight:500}}>
                            RTO / Challan data can not be requested for deleted vehicles. Please contact admin to activate vehicle again.
                          </span>
                        );
                      }
                      if (lastAct === 'getrto') {
                        return (
                          <span style={{color:'#d35400', fontWeight:500}}>
                            Selected vehicle is currently inactive. Please activate first to get RTO data.
                          </span>
                        );
                      }
                      if (lastAct === 'getchallan') {
                        return (
                          <span style={{color:'#d35400', fontWeight:500}}>
                            Selected vehicle is currently inactive. Please activate first to get Challan data.
                          </span>
                        );
                      }
                      return (
                        <span style={{color:'#d35400', fontWeight:500}}>
                          Please activate your vehicle first to get RTO and Challan data.
                        </span>
                      );
                    })()
                  )}
                </CustomModal>
              </tbody>
            </table>
          )}
        </div>
      </div>
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
            <div style={{ marginTop: 10 }}>
              <div style={{ color: '#b33', fontWeight: 700 }}>The following {uploadModal.invalids.length} entries failed validation (they will be skipped):</div>
              <div style={{ marginTop: 8, maxHeight: 140, overflow: 'auto', padding: 8, background: '#fff7f7', borderRadius: 6, border: '1px solid #f2dede' }}>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {uploadModal.invalids.map((v, i) => (
                    <li key={i} style={{ color: '#b33' }}>{v}</li>
                  ))}
                </ul>
              </div>
              <div style={{ marginTop: 8, color: '#666' }}>Only valid vehicle numbers will be registered. Please correct and re-upload if you need those entries processed.</div>
            </div>
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
    </div>
  );
}
