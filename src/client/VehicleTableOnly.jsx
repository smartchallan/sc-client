



import React, { useState, useEffect } from "react";
import { FaDownload, FaPrint } from "react-icons/fa";
import * as XLSX from "xlsx";
import { toast } from 'react-toastify';
import "./VehicleTableOnly.css";
import CustomModal from "./CustomModal";

export default function VehicleTableOnly() {
  const [vehicles, setVehicles] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10);
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
    const notDeleted = v.status && v.status.toUpperCase() !== 'DELETED';
    return matchesSearch && matchesStatus && notDeleted;
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
        <>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8, gap: 10 }}>
          <button onClick={() => {
            if (!filteredVehicles || filteredVehicles.length === 0) return;
            const exportData = filteredVehicles.slice(0, visibleCount).map(({ Actions, ...row }) => row);
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Vehicles");
            XLSX.writeFile(workbook, "vehicles.xlsx");
          }} title="Download Excel" style={{ padding: '8px 16px', background: '#2196f3', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaDownload size={18} />
          </button>
          <button onClick={() => {
            const printContents = document.getElementById('vehicle-tableonly-print-area')?.innerHTML;
            if (!printContents) return;
            const printWindow = window.open('', '', 'height=600,width=900');
            printWindow.document.write('<html><head><title>Print Vehicles</title>');
            printWindow.document.write('<style>body{font-family:sans-serif;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ccc;padding:8px;} th{background:#f5f8fa;} .print-hide{display:none !important;}</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(printContents);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
          }} title="Print" style={{ padding: '8px 16px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaPrint size={18} />
          </button>
        </div>
        <div id="vehicle-tableonly-print-area">
        <table className="vehicle-challan-table">
          <thead>
            <tr>
              <th>Vehicle No.</th>
              <th>Engine No.</th>
              <th>Chassis No.</th>
              <th>Status</th>
              <th>Type</th>
              <th>Registration Date</th>
              <th>Data</th>
              <th className="print-hide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.slice(0, visibleCount).map((v, idx) => {
              let status = (v.status || 'Not Available').toUpperCase();
              let statusColor = '#888';
              if (status === 'ACTIVE') statusColor = '#43e97b';
              else if (status === 'INACTIVE') statusColor = '#ffa726';
              else if (status === 'DELETED') statusColor = '#e57373';
              const handleInactivate = () => setModal({ open: true, action: 'inactivate', vehicle: v });
              const handleActivate = () => setModal({ open: true, action: 'activate', vehicle: v });
              const handleDelete = () => setModal({ open: true, action: 'delete', vehicle: v });
              return (
                <tr key={v.id || v._id || idx}>
                  <td style={{fontWeight:600, color:'#42a5f5', letterSpacing:1}}>{v.vehicle_number || <span style={{color:'#bbb'}}>N/A</span>}</td>
                  <td>{v.engine_number || <span style={{color:'#bbb'}}>N/A</span>}</td>
                  <td>{v.chasis_number || <span style={{color:'#bbb'}}>N/A</span>}</td>
                  <td style={{ color: statusColor, fontWeight: 700, letterSpacing: 1 }}>{status}</td>
                  <td>{v.vehicle_type || <span style={{color:'#bbb'}}>N/A</span>}</td>
                  <td>{v.registered_at ? <span style={{color:'#43e97b', fontWeight:600}}>{new Date(v.registered_at).toLocaleString()}</span> : <span style={{color:'#bbb'}}>N/A</span>}</td>
                  <td>
                    <button
                      className="action-btn flat-btn"
                      style={{padding:'4px 10px',fontSize:13,borderRadius:4,border:'1px solid #ccc',background:'#f5f5f5',color:'#222'}}
                      onClick={async () => {
                        setModal({ open: true, action: 'fetch', vehicle: v, message: 'Loading...' });
                        try {
                          const res = await fetch(`${API_ROOT}/fetchvehicledetails?vehicle_number=${encodeURIComponent(v.vehicle_number)}`);
                          const data = await res.json();
                          setModal({ open: true, action: 'fetch', vehicle: v, message: JSON.stringify(data, null, 2) });
                        } catch (err) {
                          setModal({ open: true, action: 'fetch', vehicle: v, message: 'Failed to fetch data.' });
                        }
                      }}
                    >
                      Fetch Data
                    </button>
                  </td>
                  <td className="print-hide">
                    {status === 'INACTIVE' ? (
                      <span title="Activate Vehicle" style={{ cursor: 'pointer', marginRight: 12, fontSize: 18, color: '#43e97b' }} onClick={handleActivate} role="button" aria-label="Activate Vehicle"><i className="ri-checkbox-circle-line"></i></span>
                    ) : (
                      <span title="Inactivate Vehicle" style={{ cursor: 'pointer', marginRight: 12, fontSize: 18, color: '#ffa726' }} onClick={handleInactivate} role="button" aria-label="Inactivate Vehicle"><i className="ri-close-circle-line"></i></span>
                    )}
                    <span title="Delete Vehicle" style={{ cursor: 'pointer', color: '#e57373', fontSize: 18 }} onClick={handleDelete} role="button" aria-label="Delete Vehicle"><i className="ri-delete-bin-6-line"></i></span>
                  </td>
                </tr>
              );
            })}
          </tbody>
  </table>
  </div>
        {/* Load more dropdown */}
        {filteredVehicles.length > visibleCount && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <select
              className="form-control"
              style={{ maxWidth: 180, display: 'inline-block' }}
              value={visibleCount}
              onChange={e => setVisibleCount(Number(e.target.value))}
            >
              <option value={visibleCount}>Show More...</option>
              {filteredVehicles.length >= 50 && <option value={visibleCount + 50}>Show 50 more</option>}
              {filteredVehicles.length >= 100 && <option value={visibleCount + 100}>Show 100 more</option>}
              {filteredVehicles.length >= 200 && <option value={visibleCount + 200}>Show 200 more</option>}
              <option value={filteredVehicles.length}>Show All</option>
            </select>
          </div>
        )}
        </>
      )}
      {/* Custom Modal for confirmation */}
      <CustomModal
        open={modal.open}
        title={
          modal.action === 'inactivate' ? 'Are you sure you want to inactivate this vehicle?'
          : modal.action === 'activate' ? 'Are you sure you want to activate this vehicle?'
          : modal.action === 'delete' ? 'Are you sure you want to delete this vehicle?'
          : modal.action === 'info' ? 'Vehicle Inactive'
          : modal.action === 'fetch' ? `API Response for ${modal.vehicle?.vehicle_number}`
          : ''
        }
        onConfirm={async () => {
          if (modal.action === 'info' || modal.action === 'fetch') {
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
        confirmText={modal.action === 'delete' ? 'Delete' : modal.action === 'activate' ? 'Activate' : modal.action === 'inactivate' ? 'Inactivate' : modal.action === 'info' || modal.action === 'fetch' ? 'OK' : 'Yes'}
        cancelText={modal.action === 'info' || modal.action === 'fetch' ? null : 'Cancel'}
      >
        {modal.action === 'delete' && (
          <span style={{color:'red', fontWeight:600}}>This action is non-reversible.<br/>Your vehicle and all related data will be deleted permanently.</span>
        )}
        {modal.action === 'info' && (
          <span style={{color:'#d35400', fontWeight:500}}>Please activate your vehicle first.</span>
        )}
        {modal.action === 'fetch' && (
          <pre style={{background:'#f5f5f5',padding:12,borderRadius:6,maxHeight:400,overflow:'auto',fontSize:13}}>{modal.message}</pre>
        )}
      </CustomModal>
    </div>
  );
}
