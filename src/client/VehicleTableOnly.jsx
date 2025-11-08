



import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import "./VehicleTableOnly.css";
import CustomModal from "./CustomModal";

export default function VehicleTableOnly({ visibleCountProp = 20 }) {
  const [vehicles, setVehicles] = useState([]);
  const [fetchingVehicles, setFetchingVehicles] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' or 'desc'
  const [modal, setModal] = useState({ open: false, action: null, vehicle: null });
  const [visibleCount, setVisibleCount] = useState(visibleCountProp);
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

  const limitedVehicles = filteredVehicles.slice(0, visibleCount);
  const hasMore = filteredVehicles.length > limitedVehicles.length;

  return (
    <div className="dashboard-latest">
      <h2 style={{ fontSize: '1.2rem', marginBottom: 12 }}>Registered Vehicles</h2>
      {filteredVehicles.length > 0 && (
        <div style={{
          marginBottom: 8,
          color: '#222',
          fontSize: 15,
          background: '#ffe9b3',
          border: '1.5px solid #f7b500',
          borderRadius: 6,
          padding: '4px 12px',
          fontWeight: 600,
          display: 'inline-block',
        }}>
          Showing {Math.min(limitedVehicles.length, filteredVehicles.length)} of {filteredVehicles.length} vehicles
        </div>
      )}
      {/* No search or filter controls for RTO data page */}
      {fetchingVehicles ? (
        <div>Loading vehicles...</div>
      ) : filteredVehicles.length === 0 ? (
        <div style={{ color: '#888' }}>No vehicles registered yet.</div>
      ) : (
        <div>
          <table className="vehicle-challan-table">
            <thead>
              <tr>
                <th><i className="ri-car-line" style={{marginRight: 4}}></i>Vehicle No.</th>
                <th><i className="ri-engine-line" style={{marginRight: 4}}></i>Engine No.</th>
                <th><i className="ri-vip-diamond-line" style={{marginRight: 4}}></i>Chassis No.</th>
                <th><i className="ri-shield-check-line" style={{marginRight: 4}}></i>Status</th>
                <th
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  title="Sort by Registered At"
                >
                  <i className="ri-calendar-check-line" style={{marginRight: 4}}></i>Reg. Date {sortOrder === 'asc' ? '▲' : '▼'}
                </th>
                <th><i className="ri-database-2-line" style={{marginRight: 4}}></i>Data</th>
                <th><i className="ri-settings-3-line" style={{marginRight: 4}}></i>Actions</th>
              </tr>
            </thead>
            <tbody>
              {limitedVehicles.map((v, idx) => {
                let status = (v.status || 'Not Available').toUpperCase();
                let statusColor = '#888';
                if (status === 'ACTIVE') statusColor = '#43e97b';
                else if (status === 'INACTIVE') statusColor = '#ffa726';
                else if (status === 'DELETED') statusColor = '#e57373';

                // Action handlers with custom modal
                const handleInactivate = () => setModal({ open: true, action: 'inactivate', vehicle: v });
                const handleActivate = () => setModal({ open: true, action: 'activate', vehicle: v });
                const handleDelete = () => setModal({ open: true, action: 'delete', vehicle: v });

                return (
                  <tr key={v.id || v._id || idx}>
                    <td style={{fontWeight:600, color:'#42a5f5', letterSpacing:1}}>{v.vehicle_number || <span style={{color:'#bbb'}}>N/A</span>}</td>
                    <td>{v.engine_number || <span style={{color:'#bbb'}}>N/A</span>}</td>
                    <td>{v.chasis_number || <span style={{color:'#bbb'}}>N/A</span>}</td>
                    <td style={{ color: statusColor, fontWeight: 700, letterSpacing: 1 }}>{status}</td>
                    <td>{v.registered_at ? <span style={{color:'#43e97b', fontWeight:600}}>{new Date(v.registered_at).toLocaleString()}</span> : <span style={{color:'#bbb'}}>N/A</span>}</td>
                    <td>
                      <button
                        className="action-btn"
                        style={{padding: '2px 10px', fontSize: 14, opacity: status === 'INACTIVE' ? 0.6 : 1, cursor: status === 'INACTIVE' ? 'not-allowed' : 'pointer', background: 'linear-gradient(90deg,#42a5f5,#43e97b)', color: '#fff', border: 'none', borderRadius: 6, boxShadow: '0 2px 8px rgba(66,165,245,0.10)'}}
                        disabled={status === 'INACTIVE'}
                        onClick={() => {
                          if (status === 'INACTIVE') {
                            setModal({ open: true, action: 'info', vehicle: v });
                          } else {
                            // ...existing get data logic...
                          }
                        }}
                      >
                        Get Data <i className="ri-car-line" style={{marginLeft: 6}}></i>
                      </button>
                    </td>
                    <td>
                      {status === 'INACTIVE' ? (
                        <span
                          title="Activate Vehicle"
                          style={{ cursor: 'pointer', marginRight: 12, fontSize: 18, color: '#43e97b' }}
                          onClick={handleActivate}
                          role="button"
                          aria-label="Activate Vehicle"
                        >
                          <i className="ri-checkbox-circle-line"></i>
                        </span>
                      ) : (
                        <span
                          title="Inactivate Vehicle"
                          style={{ cursor: 'pointer', marginRight: 12, fontSize: 18, color: '#ffa726' }}
                          onClick={handleInactivate}
                          role="button"
                          aria-label="Inactivate Vehicle"
                        >
                          <i className="ri-close-circle-line"></i>
                        </span>
                      )}
                      <span
                        title="Delete Vehicle"
                        style={{ cursor: 'pointer', color: '#e57373', fontSize: 18 }}
                        onClick={handleDelete}
                        role="button"
                        aria-label="Delete Vehicle"
                      >
                        <i className="ri-delete-bin-6-line"></i>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{marginTop:12, textAlign:'center'}}>
            {hasMore ? (
              <button className="action-btn flat-btn" onClick={() => setVisibleCount(v => v + 20)}>Load more vehicles</button>
            ) : (
              <button className="action-btn flat-btn" disabled style={{opacity:0.7}}>No more vehicles</button>
            )}
          </div>
        </div>
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
