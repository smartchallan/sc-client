

import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CustomModal from "./client/CustomModal";

const FIELD_OPTIONS = [
  { value: "vehicle_number", label: "Vehicle Number" },
  { value: "engine_number", label: "Engine Number" },
  { value: "chasis_number", label: "Chasis Number" },
];

export default function RegisterVehicle() {
  // Registration form state
  const [registerField, setRegisterField] = useState("");
  const [registerValue, setRegisterValue] = useState("");
  // Table search/filter state
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [fetchingVehicles, setFetchingVehicles] = useState(false);
  const [modal, setModal] = useState({ open: false, action: null, vehicle: null });
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
                <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                className="form-control"
                value={registerValue}
                onChange={e => setRegisterValue(e.target.value.toUpperCase())}
                style={{textTransform: 'uppercase'}}
                placeholder={`Enter ${FIELD_OPTIONS.find(f => f.value === registerField)?.label?.toLowerCase()}`}
              />
            </div>
          )}
          <div className="button-group" style={{width: '100%'}}>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Adding..." : "Add New Vehicle"}</button>
          </div>
        </form>
      </div>
      {/* Vehicle table below form */}

      <div className="dashboard-latest">
        <div style={{marginTop: 32}}>
          <h2 style={{fontSize: '1.2rem', marginBottom: 12}}>Registered Vehicles</h2>
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
                  <th>Vehicle Number</th>
                  <th>Engine Number</th>
                  <th>Chasis Number</th>
                  <th>Status</th>
                  <th>
                    Registered At
                    <span style={{marginLeft:6, cursor:'pointer', fontSize:16}} onClick={() => setLoading(!loading)}>
                      {loading ? <i className="ri-arrow-down-s-line" title="Sort: Newest First"></i> : <i className="ri-arrow-up-s-line" title="Sort: Oldest First"></i>}
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
                    return loading ? dateB - dateA : dateA - dateB;
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
                    return (
                      <tr key={v.id || v._id || idx}>
                        <td>{v.vehicle_number || 'Not Available'}</td>
                        <td>{v.engine_number || 'Not Available'}</td>
                        <td>{v.chasis_number || 'Not Available'}</td>
                        <td style={{ color: statusColor, fontWeight: 600, letterSpacing: 1 }}>{status}</td>
                        <td>{v.registered_at ? new Date(v.registered_at).toLocaleString() : 'Not Available'}</td>
                        <td>
                          <div style={{display:'flex',gap:8}}>
                            <button
                              className="action-btn flat-btn"
                              style={{padding: '12px 32px', fontSize: 18, border: 'none', borderRadius: 6, background: '#f5f5f5', color: '#222', boxShadow: 'none', fontWeight: 600, opacity: status === 'INACTIVE' ? 0.6 : 1, cursor: status === 'INACTIVE' ? 'not-allowed' : 'pointer', transition: 'background 0.2s'}}
                              disabled={status === 'INACTIVE' || rtoLoadingId === v.id}
                              onClick={() => {
                                if (status === 'INACTIVE') {
                                  setModal({ open: true, action: 'info', vehicle: v });
                                } else {
                                  setModal({ open: true, action: 'getRTO', vehicle: v });
                                }
                              }}
                            >
                              {rtoLoadingId === v.id ? 'Loading...' : 'Get RTO Data'}
                            </button>
                            <button
                              className="action-btn flat-btn"
                              style={{padding: '12px 32px', fontSize: 18, border: 'none', borderRadius: 6, background: '#f5f5f5', color: '#222', boxShadow: 'none', fontWeight: 600, opacity: status === 'INACTIVE' ? 0.6 : 1, cursor: status === 'INACTIVE' ? 'not-allowed' : 'pointer', transition: 'background 0.2s'}}
                              disabled={status === 'INACTIVE' || challanLoadingId === v.id}
                              onClick={() => {
                                if (status === 'INACTIVE') {
                                  setModal({ open: true, action: 'info', vehicle: v });
                                } else {
                                  setModal({ open: true, action: 'getChallan', vehicle: v });
                                }
                              }}
                            >
                              {challanLoadingId === v.id ? 'Loading...' : 'Get Challan Data'}
                            </button>
                          </div>
                        </td>
                        <td>
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
                    : modal.action === 'info' ? 'Vehicle Inactive' 
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
                    <span style={{color:'#d35400', fontWeight:500}}>Please activate your vehicle first to get RTO and Challan data.</span>
                  )}
                </CustomModal>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
