import React, { useState, useEffect, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CustomModal from "./client/CustomModal";
import SelectShowMore from "./client/SelectShowMore";
import "./RegisterVehicle.css";

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
        admin_id: ids.admin_id, // ensure admin_id is always present
        vehicle_number: registerField === "vehicle_number" ? registerValue : undefined,
        engine_number: registerField === "engine_number" ? registerValue : undefined,
        chassis_number: registerField === "chassis_number" ? registerValue : undefined,
      };
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
      {/* <h1 className="page-title">Register New Vehicle</h1> */}
      <p className="page-subtitle">
        You can register your vehicle using <b>any one</b> of the following details: <b>Vehicle Number</b>, <b>Engine Number</b>, or <b>chassis Number</b>.
      </p>
      <div className="modern-form-card">
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
                        // validate vehicle number format
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
                    <div className="chakra">⚙</div>
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
                  style={{textTransform: 'uppercase'}}
                  placeholder={`Enter ${FIELD_OPTIONS.find(f => f.value === registerField)?.label?.toLowerCase()}`}
                />
              )}
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
  {/* Upload Vehicles by Excel (collapsible) */}
  <div className="modern-form-card upload-card" style={{ marginTop: 18 }}>
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500, fontSize: 16, marginBottom: bulkUploadEnabled ? 12 : 0 }}>
      <input
        type="checkbox"
        checked={bulkUploadEnabled}
        onChange={e => setBulkUploadEnabled(e.target.checked)}
        style={{ width: 18, height: 18 }}
      />
      Enable bulk vehicle upload
    </label>
    {bulkUploadEnabled && (
      <div>
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
      {/* Vehicle table below form */}

  <div id="registered-vehicles-section" className="dashboard-latest modern-form-card">
          <div style={{marginTop: 32}}>
          <h2 style={{fontSize: '1.2rem', marginBottom: 12}}>Active & Inactive Vehicles {vehicles && vehicles.filter(v => (v.status || '').toUpperCase() !== 'DELETED').length ? `(${vehicles.filter(v => (v.status || '').toUpperCase() !== 'DELETED').length})` : ''}</h2>
          {/* Search and status filter controls */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="number-plate-container" style={{ minWidth: 200, maxWidth: 330 }}>
              <div className="number-plate-wrapper">
                <div className="number-plate-badge">IND</div>
                <div className="tricolor-strip">
                  <div className="saffron"></div>
                  <div className="white"></div>
                  <div className="green"></div>
                </div>
                <input
                  type="text"
                  className="number-plate-input"
                  placeholder="Search by Vehicle No, Engine No or chassis No"
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  maxLength={20}
                />
              </div>
              <div className="security-features">
                <div className="hologram"></div>
                <div className="chakra">⚙</div>
              </div>
            </div>
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
          ) : vehicles.filter(v => (v.status || '').toUpperCase() !== 'DELETED').length === 0 ? (
            <div style={{color: '#888'}}>No active or inactive vehicles found.</div>
          ) : (
            <div className="table-container" id="registered-vehicles-table-print-area">
              <table className="latest-table" style={{ width: '100%', marginTop: 8 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center' }}>S. No.</th>
                    <th style={{ textAlign: 'center' }}>Vehicle Number</th>
                    <th style={{ textAlign: 'center' }}>Engine Number</th>
                    <th style={{ textAlign: 'center' }}>chassis Number</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'center' }}>
                      Registered At
                      <span style={{marginLeft:6, cursor:'pointer', fontSize:16}} onClick={() => setSortDesc(s => !s)}>
                        {sortDesc ? <i className="ri-arrow-down-s-line" title="Sort: Newest First"></i> : <i className="ri-arrow-up-s-line" title="Sort: Oldest First"></i>}
                      </span>
                    </th>
                    <th style={{ textAlign: 'center' }}>Data</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
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
                    let statusColor = '#888';
                    if (status === 'ACTIVE') statusColor = 'green';
                    else if (status === 'INACTIVE') statusColor = 'orange';
                    else if (status === 'DELETED') statusColor = 'red';
                    const handleInactivate = () => setModal({ open: true, action: 'inactivate', vehicle: v });
                    const handleActivate = () => setModal({ open: true, action: 'activate', vehicle: v });
                    const handleDelete = () => setModal({ open: true, action: 'delete', vehicle: v });
                    // Remove setInfoModal and RTO/Challan actions
                    return (
                      <tr key={v.id || v._id || idx}>
                        <td>{idx + 1}</td>
                        <td>
                          <span
                            // style={{
                            //   fontWeight: 700,
                            //   cursor: 'pointer',
                            //   background: 'linear-gradient(90deg, #ffe082 0%, #f8b500 100%)',
                            //   color: '#7c5700',
                            //   padding: '3px 14px',
                            //   borderRadius: '18px',
                            //   fontSize: '1.08em',
                            //   boxShadow: '0 2px 8px #f8b50022',
                            //   border: '1.5px solid #ffe082',
                            //   letterSpacing: 0.5,
                            //   transition: 'box-shadow 0.2s, background 0.2s, color 0.2s',
                            //   display: 'inline-block',
                            //   textShadow: '0 1px 0 #fff, 0 2px 8px #f8b50022',
                            // }}
                            onMouseOver={e => {
                              e.currentTarget.style.background='linear-gradient(90deg, #ffe082 0%, #ffd54f 100%)';
                              e.currentTarget.style.color='#a67c00';
                              e.currentTarget.style.boxShadow='0 4px 16px #f8b50033';
                            }}
                            onMouseOut={e => {
                              e.currentTarget.style.background='linear-gradient(90deg, #ffe082 0%, #f8b500 100%)';
                              e.currentTarget.style.color='#7c5700';
                              e.currentTarget.style.boxShadow='0 2px 8px #f8b50022';
                            }}
                            onClick={() => setSidebarVehicle(v)}
                            title="View vehicle details"
                          >
                            {v.vehicle_number || 'Not Available'}
                          </span>
                        </td>
                        <td>{v.engine_number || 'Not Available'}</td>
                        <td>{v.chassis_number || 'Not Available'}</td>
                        <td style={{ color: statusColor, fontWeight: 600, letterSpacing: 1 }}>{status}</td>
                        <td>{v.registered_at ? new Date(v.registered_at).toLocaleString() : 'Not Available'}</td>
                        <td>
                          {status === 'DELETED' ? (
                            <span style={{ color: '#999' }}>—</span>
                          ) : (
                            <button
                              className="action-btn"
                              disabled={dataLoadingId === v.vehicle_number}
                              onClick={() => handleGetVehicleData(v.vehicle_number)}
                            >
                              {dataLoadingId === v.vehicle_number ? 'Getting Data...' : 'Vehicle Data'}
                            </button>
                          )}
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
      {/* Right Sidebar for Vehicle Details */}
      {sidebarVehicle && (
        <div style={{position:'fixed',top:0,right:0,height:'100vh',width:'370px',minWidth:260,maxWidth:'90vw',background:'#f8fafc',borderLeft:'2px solid #e3e8ee',boxShadow:'-2px 0 16px #0001',zIndex:1000,padding:'24px 18px 12px 18px',overflowY:'auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <span style={{fontWeight:700,fontSize:'1.1rem',color:'#1976d2'}}>Vehicle Details</span>
            <button onClick={()=>setSidebarVehicle(null)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#888',fontWeight:700}} title="Close">×</button>
          </div>
          {/* RTO Data Card */}
          <div style={{marginBottom:18,background:'#fff',border:'1.5px solid #b3e5fc',borderRadius:8,padding:'12px 12px 8px 12px',boxShadow:'0 1px 6px #00bcd41a',position:'relative'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
              <div style={{fontWeight:600,fontSize:15,color:'#0288d1'}}>Vehicle RTO Data</div>
              <button onClick={()=>setSidebarVehicle(s => s ? {...s, showRTO:false} : s)} style={{background:'none',border:'none',fontSize:18,cursor:'pointer',color:'#888',fontWeight:700}} title="Close">×</button>
            </div>
            {(sidebarVehicle.showRTO !== false) && (
              <div>
                <div><b>Owner:</b> John Doe</div>
                <div><b>Vehicle No:</b> {sidebarVehicle.vehicle_number || '-'}</div>
                <div><b>Engine No:</b> {sidebarVehicle.engine_number || '-'}</div>
                <div><b>chassis No:</b> {sidebarVehicle.chassis_number || '-'}</div>
                <div><b>Type:</b> Car</div>
                <div><b>Fuel:</b> Petrol</div>
                <div><b>Reg Date:</b> 2022-01-15</div>
                <div><b>Status:</b> Active</div>
              </div>
            )}
          </div>
          {/* Challan Data Card */}
          <div style={{marginBottom:0,background:'#fff',border:'1.5px solid #ffe082',borderRadius:8,padding:'12px 12px 8px 12px',boxShadow:'0 1px 6px #ffb3001a',position:'relative'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
              <div style={{fontWeight:600,fontSize:15,color:'#ff9800'}}>Vehicle Challans</div>
              <button onClick={()=>setSidebarVehicle(s => s ? {...s, showChallan:false} : s)} style={{background:'none',border:'none',fontSize:18,cursor:'pointer',color:'#888',fontWeight:700}} title="Close">×</button>
            </div>
            {(sidebarVehicle.showChallan !== false) && (
              <div>
                <div><b>Total Challans:</b> 2</div>
                <div><b>Last Challan Date:</b> 2025-10-12</div>
                <div><b>Amount Due:</b> ₹1500</div>
                <div><b>Status:</b> Pending</div>
              </div>
            )}
          </div>
        </div>
      )}
                  })}
                {/* Custom Modal for confirmation */}
                <CustomModal
                  open={modal.open}
                  title={
                    modal.action === 'inactivate' ? 'Are you sure you want to inactivate this vehicle?'
                    : modal.action === 'activate' ? 'Are you sure you want to activate this vehicle?'
                    : modal.action === 'delete' ? 'Are you sure you want to delete this vehicle?'
                    : ''
                  }
                  onConfirm={async () => {
                    if (!modal.vehicle) return setModal({ open: false, action: null, vehicle: null });
                    setModal({ open: false, action: null, vehicle: null });
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
                  confirmText={modal.action === 'delete' ? 'Delete' : modal.action === 'activate' ? 'Activate' : modal.action === 'inactivate' ? 'Inactivate' : 'Yes'}
                  cancelText={'Cancel'}
                >
                  {modal.action === 'delete' && (
                    <span style={{color:'red', fontWeight:600}}>This action is non-reversible.<br/>Your vehicle and all related data will be deleted permanently.</span>
                  )}
                </CustomModal>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
                  <span style={{ fontWeight: 600, color: '#1976d2', fontSize: 15 }}>Show more records:</span>
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
            <div id="deleted-vehicles-section" className="deleted-vehicles-section">
              <h2>Deleted Vehicles ({deletedVehicles.length})</h2>
              <div className="table-container" id="deleted-vehicles-table-print-area">
                <table className="latest-table" style={{ width: '100%', marginTop: 8 }}>
                  <thead>
                    <tr>
                      <th>S. No.</th>
                      <th>Vehicle Number</th>
                      <th>Engine Number</th>
                      <th>chassis Number</th>
                      <th>Status</th>
                      <th>
                        Registered At
                        <span style={{marginLeft:6, cursor:'pointer', fontSize:16}} onClick={() => setSortDesc(s => !s)}>
                          {sortDesc ? <i className="ri-arrow-down-s-line" title="Sort: Newest First"></i> : <i className="ri-arrow-up-s-line" title="Sort: Oldest First"></i>}
                        </span>
                      </th>
                      <th>Actions</th>
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
                      const handleReactivate = () => setModal({ open: true, action: 'activate', vehicle: v });
                      
                      return (
                        <tr key={v.id || v._id || idx}>
                          <td>{idx + 1}</td>
                          <td>{v.vehicle_number || 'Not Available'}</td>
                          <td>{v.engine_number || 'Not Available'}</td>
                          <td>{v.chassis_number || 'Not Available'}</td>
                          <td style={{ color: '#dc2626', fontWeight: 600, letterSpacing: 1 }}>DELETED</td>
                          <td>{v.registered_at ? new Date(v.registered_at).toLocaleString() : 'Not Available'}</td>
                          <td>
                            <span
                              title="Reactivate Vehicle"
                              style={{ cursor: 'pointer', fontSize: 18, color: '#16a34a' }}
                              onClick={handleReactivate}
                              role="button"
                              aria-label="Reactivate Vehicle"
                            >
                              ♻️
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Load More / Show more control for Deleted Vehicles */}
              {deletedVehicles.length > deletedVehiclesLimit && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
                  <span style={{ fontWeight: 600, color: '#b91c1c', fontSize: 15 }}>Show more deleted records:</span>
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
