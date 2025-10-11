



import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import "./VehicleTableOnly.css";
import CustomModal from "./CustomModal";

export default function VehicleTableOnly() {
  const [vehicles, setVehicles] = useState([]);
  const [fetchingVehicles, setFetchingVehicles] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' or 'desc'
  const [modal, setModal] = useState({ open: false, action: null, vehicle: null });
  const API_ROOT = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Helper to get client id
  const getClientId = () => {
    const userObj = JSON.parse(localStorage.getItem("sc_user"));
    const user = userObj && userObj.user ? userObj.user : {};
    return user.client_id || user.id;
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

  useEffect(() => {
    const client_id = getClientId();
    if (client_id) fetchVehicles(client_id);
  }, []);


  // Filtered and searched vehicles
  let filteredVehicles = vehicles.filter(v => {
    const searchVal = search.trim().toUpperCase();
    const matchesSearch =
      !searchVal ||
      (v.vehicle_number && v.vehicle_number.toUpperCase().includes(searchVal)) ||
      (v.engine_number && v.engine_number.toUpperCase().includes(searchVal)) ||
      (v.chasis_number && v.chasis_number.toUpperCase().includes(searchVal));
    const matchesStatus =
      !statusFilter || (v.status && v.status.toUpperCase() === statusFilter.toUpperCase());
    return matchesSearch && matchesStatus;
  });

  // Sort by registered_at
  filteredVehicles = filteredVehicles.slice().sort((a, b) => {
    const dateA = a.registered_at ? new Date(a.registered_at) : new Date(0);
    const dateB = b.registered_at ? new Date(b.registered_at) : new Date(0);
    if (sortOrder === "asc") return dateA - dateB;
    else return dateB - dateA;
  });

  return (
    <div className="dashboard-latest">
      <h2 style={{ fontSize: '1.2rem', marginBottom: 12 }}>Registered Vehicles</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="text"
          className="form-control"
          style={{ minWidth: 200, maxWidth: 300, textTransform: 'uppercase' }}
          placeholder="Search by Vehicle No, Engine No or Chasis No"
          value={search}
          onChange={e => setSearch(e.target.value.toUpperCase())}
        />
        <select
          className="form-control"
          style={{ minWidth: 160, maxWidth: 200 }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="DELETED">Deleted</option>
        </select>
      </div>
      {fetchingVehicles ? (
        <div>Loading vehicles...</div>
      ) : filteredVehicles.length === 0 ? (
        <div style={{ color: '#888' }}>No vehicles registered yet.</div>
      ) : (
        <table className="latest-table" style={{ width: '100%', marginTop: 8 }}>
          <thead>
            <tr>
              <th>Vehicle Number</th>
              <th>Engine Number</th>
              <th>Chasis Number</th>
              <th>Status</th>
              <th
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                title="Sort by Registered At"
              >
                Registered Date {sortOrder === 'asc' ? '▲' : '▼'}
              </th>
                <th>Data</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.map((v, idx) => {
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
                      <button
                        className="action-btn"
                        style={{padding: '2px 10px', fontSize: 14, opacity: status === 'INACTIVE' ? 0.6 : 1, cursor: status === 'INACTIVE' ? 'not-allowed' : 'pointer'}}
                        disabled={status === 'INACTIVE'}
                        onClick={() => {
                          if (status === 'INACTIVE') {
                            setModal({ open: true, action: 'info', vehicle: v });
                          } else {
                            // ...existing get data logic...
                          }
                        }}
                      >
                        Get Data <i className="ri-car-line" style={{marginLeft: 6}}></i><i className="ri-information-line" style={{marginLeft: 2}}></i>
                      </button>
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
          </tbody>
        </table>
      )}
      {/* Custom Modal for confirmation */}
      <CustomModal
        open={modal.open}
        title={
          modal.action === 'inactivate' ? 'Are you sure you want to inactivate this vehicle?'
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
              fetchVehicles(getClientId());
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
          <span style={{color:'#d35400', fontWeight:500}}>Please activate your vehicle first.</span>
        )}
      </CustomModal>
    </div>
  );
}
