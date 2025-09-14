import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CustomModal from "../client/CustomModal";

const FIELD_OPTIONS = [
  { value: "vehicle_number", label: "Vehicle Number" },
  { value: "engine_number", label: "Engine Number" },
  { value: "chasis_number", label: "Chasis Number" },
];

export default function DealerRegisterVehicle() {
  const [selectedClient, setSelectedClient] = useState("");
  const [clients, setClients] = useState([]);
  const [selectedField, setSelectedField] = useState("");
  const [fieldValue, setFieldValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [fetchingVehicles, setFetchingVehicles] = useState(false);
  const [modal, setModal] = useState({ open: false, action: null, vehicle: null });

  const API_ROOT = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const REGISTER_ENDPOINT = "/uservehicle/register";

  // Helper to get dealer id
  const getDealerId = () => {
    try {
      const userObj = JSON.parse(localStorage.getItem("sc_user"));
      return userObj && userObj.user && userObj.user.id ? userObj.user.id : null;
    } catch {
      return null;
    }
  };

  // Fetch clients for dealer on mount
  useEffect(() => {
    const dealerId = getDealerId();
    if (!dealerId) return;
    const fetchClients = async () => {
      try {
        const res = await fetch(`${API_ROOT}/dealerdata/${dealerId}`);
        const data = await res.json();
        setClients(Array.isArray(data.clients) ? data.clients : []);
      } catch {
        setClients([]);
      }
    };
    fetchClients();
  }, []);

  // Fetch vehicles for selected client
  useEffect(() => {
    if (!selectedClient) {
      setVehicles([]);
      return;
    }
    setFetchingVehicles(true);
    fetch(`${API_ROOT}/uservehicle?client_id=${selectedClient}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setVehicles(data);
        else if (Array.isArray(data.vehicles)) setVehicles(data.vehicles);
        else setVehicles([]);
      })
      .catch(() => setVehicles([]))
      .finally(() => setFetchingVehicles(false));
  }, [selectedClient]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClient) {
      toast.error("Please select a client.");
      return;
    }
    if (!selectedField || !fieldValue) {
      toast.error("Please select a field and enter a value.");
      return;
    }
    setLoading(true);
    try {
      const dealerId = getDealerId();
      const payload = {
        dealer_id: dealerId,
        client_id: selectedClient,
        vehicle_number: selectedField === "vehicle_number" ? fieldValue : undefined,
        engine_number: selectedField === "engine_number" ? fieldValue : undefined,
        chasis_number: selectedField === "chasis_number" ? fieldValue : undefined,
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
        setFieldValue("");
        setSelectedField("");
        // Fetch vehicles after successful registration
        if (selectedClient) {
          setFetchingVehicles(true);
          fetch(`${API_ROOT}/uservehicle?client_id=${selectedClient}`)
            .then(res => res.json())
            .then(data => {
              if (Array.isArray(data)) setVehicles(data);
              else if (Array.isArray(data.vehicles)) setVehicles(data.vehicles);
              else setVehicles([]);
            })
            .catch(() => setVehicles([]))
            .finally(() => setFetchingVehicles(false));
        }
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
      <h1>Register New Vehicle (Dealer)</h1>
      <p style={{marginBottom: 16, color: '#444', fontWeight: 500}}>
        As dealer, please select a <b>Client</b> under you, then register the vehicle using <b>any one</b> of the following details: <b>Vehicle Number</b>, <b>Engine Number</b>, or <b>Chasis Number</b>.
      </p>
      <div className="card">
        <form className="vehicle-form" onSubmit={handleSubmit} style={{display: 'flex', flexWrap: 'wrap', gap: 16}}>
          <div className="form-group" style={{flex: '1 1 45%', minWidth: 220, maxWidth: '50%'}}>
            <label htmlFor="select_client">Select Client</label>
            <select
              id="select_client"
              className="form-control"
              value={selectedClient}
              onChange={e => setSelectedClient(e.target.value)}
              required
            >
              <option value="">Select Client</option>
              {clients.length === 0 && <option disabled>No clients found</option>}
              {clients.map(c => (
                <option key={c.id || c._id || c.email} value={c.id || c._id || c.email}>
                  {c.name || c.email}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{flex: '1 1 45%', minWidth: 220, maxWidth: '50%'}}>
            <label htmlFor="select_field">Select Field to Register By</label>
            <select
              id="select_field"
              className="form-control"
              value={selectedField}
              onChange={e => {
                setSelectedField(e.target.value);
                setFieldValue("");
              }}
              required
              disabled={!selectedClient}
            >
              <option value="">Select Field</option>
              {FIELD_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {selectedField && (
            <div className="form-group" style={{flex: '1 1 45%', minWidth: 220, maxWidth: '50%'}}>
              <label htmlFor="field_value">{FIELD_OPTIONS.find(f => f.value === selectedField)?.label}</label>
              <input
                type="text"
                id="field_value"
                name="field_value"
                className="form-control"
                value={fieldValue}
                onChange={e => setFieldValue(e.target.value.toUpperCase())}
                style={{textTransform: 'uppercase'}}
                placeholder={`Enter ${FIELD_OPTIONS.find(f => f.value === selectedField)?.label?.toLowerCase()}`}
                required
                disabled={!selectedClient}
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
                  <th>Registered At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v, idx) => {
                  let status = (v.status || 'Not Available').toUpperCase();
                  let statusColor = '#888';
                  if (status === 'ACTIVE') statusColor = 'green';
                  else if (status === 'INACTIVE') statusColor = 'orange';
                  else if (status === 'DELETED') statusColor = 'red';

                  // Action handlers with custom modal
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
            modal.action === 'inactivate' ? 'Are you sure you want to inactivate this vehicle?'
            : modal.action === 'activate' ? 'Are you sure you want to activate this vehicle?'
            : modal.action === 'delete' ? 'Are you sure you want to delete this vehicle?'
            : ''
          }
          onConfirm={() => {
            setModal({ open: false, action: null, vehicle: null });
            // TODO: Implement actual API call for action here
            if (modal.action === 'inactivate') toast.info('Inactivate action confirmed');
            if (modal.action === 'activate') toast.info('Activate action confirmed');
            if (modal.action === 'delete') toast.info('Delete action confirmed');
          }}
          onCancel={() => setModal({ open: false, action: null, vehicle: null })}
          confirmText={modal.action === 'delete' ? 'Delete' : modal.action === 'activate' ? 'Activate' : modal.action === 'inactivate' ? 'Inactivate' : 'Yes'}
          cancelText="Cancel"
        />
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
