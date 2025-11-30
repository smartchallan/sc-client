import React, { useEffect, useState } from "react";
import "../shared/CommonDashboard.css";
import CustomModal from "./CustomModal";
import RightSidebar from "./RightSidebar";
import "./RightSidebar.css";
import "../RegisterVehicle.css";

export default function VehicleRTOdataTable({ clientId, onViewAll }) {
  const formatExpiry = (dateStr, useColor = true) => {
    if (!dateStr || dateStr === '-') return '-';
    let d = null;
    if (/\d{2}-[A-Za-z]{3}-\d{4}/.test(dateStr)) {
      d = new Date(dateStr.replace(/-/g, ' '));
    } else if (/\d{2}-\d{2}-\d{4}/.test(dateStr)) {
      const [day, month, year] = dateStr.split('-');
      d = new Date(`${year}-${month}-${day}`);
    } else if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      d = new Date(dateStr);
    } else {
      d = new Date(dateStr);
    }
    if (isNaN(d.getTime())) return dateStr;
    const formatted = d.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    }).replace(/ /g, '-');
    if (!useColor) return formatted;
    const now = new Date();
    const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    let color = 'green';
    let fontWeight = 'bold';
    if (diffDays < 0) color = 'red';
    else if (diffDays <= 30) color = 'orange';
    else fontWeight = 'normal';
    return <span style={{color, fontWeight}}>{formatted}</span>;
  };
  const [vehicleData, setVehicleData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    setError("");
    fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/getvehiclertodata?clientId=${clientId}`)
      .then(res => res.json())
      .then(data => {
        console.log("Vehicle RTO API response:", data);
        let arr = [];
        if (Array.isArray(data)) {
          arr = data.map(item => {
            if (item.rto_data && item.rto_data.VehicleDetails) {
              return item.rto_data.VehicleDetails;
            } else if (item.vehicle_number) {
              return {
                rc_regn_no: item.vehicle_number,
                rc_regn_dt: item.created_at || '-',
                insurance_exp: '-',
                road_tax_exp: '-',
                fitness_exp: '-',
                pollution_exp: '-',
                rc_owner_name: '-',
                rc_chasi_no: '-',
                rc_engine_no: '-',
                rc_vh_class_desc: '-',
                rc_fuel_desc: '-',
                rc_maker_desc: '-',
                rc_maker_model: '-',
                rc_off_cd: '-',
                rc_state_cd: '-',
                rc_mobile_no: '-',
                rc_present_address: '-'
              };
            }
            return null;
          }).filter(item => item !== null);
        } else if (Array.isArray(data.vehicleDetails)) {
          arr = data.vehicleDetails;
        } else if (Array.isArray(data.vehicles)) {
          arr = data.vehicles;
        } else if (Array.isArray(data.data)) {
          arr = data.data;
        } else {
          for (const k in data) {
            if (Array.isArray(data[k])) {
              arr = data[k];
              break;
            }
          }
        }
        const getCreatedTime = (item) => {
          if (item && item.created_at) return new Date(item.created_at).getTime();
          if (item && item.rc_regn_dt) return new Date(item.rc_regn_dt).getTime();
          return 0;
        };
        arr.sort((a, b) => (getCreatedTime(b) || 0) - (getCreatedTime(a) || 0));
        setVehicleData(arr);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch vehicle data.");
        setLoading(false);
      });
  }, [clientId]);

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Search, sort, filter state
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(false); // false = newest first
  const [expiryFilter, setExpiryFilter] = useState('all'); // all, expired, expiring, valid

  // Helper to determine expiry status
  const getExpiryStatus = (v) => {
    const exp = v.insurance_exp || v.rc_insurance_upto || v.road_tax_exp || v.rc_tax_upto || v.fitness_exp || v.rc_fit_upto || v.pollution_exp || v.rc_pucc_upto;
    if (!exp || exp === '-') return 'unknown';
    let d = null;
    if (/\d{2}-[A-Za-z]{3}-\d{4}/.test(exp)) d = new Date(exp.replace(/-/g, ' '));
    else if (/\d{2}-\d{2}-\d{4}/.test(exp)) { const [day, month, year] = exp.split('-'); d = new Date(`${year}-${month}-${day}`); }
    else if (/\d{4}-\d{2}-\d{2}/.test(exp)) d = new Date(exp);
    else d = new Date(exp);
    if (isNaN(d.getTime())) return 'unknown';
    const now = new Date();
    const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'expired';
    if (diffDays <= 30) return 'expiring';
    return 'valid';
  };

  // Filter, search, sort
  let filtered = vehicleData;
  if (search.trim() !== '') {
    filtered = filtered.filter(v => (v.rc_regn_no || '').toString().toUpperCase().includes(search.trim().toUpperCase()));
  }
  if (expiryFilter !== 'all') {
    filtered = filtered.filter(v => getExpiryStatus(v) === expiryFilter);
  }
  filtered = filtered.slice().sort((a, b) => {
    const parse = s => s ? new Date(String(s).replace(/(\d{2})-(\d{2})-(\d{4})/, '$2/$1/$3')) : new Date(0);
    const dateA = parse(a.rc_regn_dt);
    const dateB = parse(b.rc_regn_dt);
    return sortAsc ? dateA - dateB : dateB - dateA;
  });
  // Always show 20 records by default
  const DEFAULT_LIMIT = 20;
  const [recordsToShow, setRecordsToShow] = useState(DEFAULT_LIMIT);
  useEffect(() => { setRecordsToShow(DEFAULT_LIMIT); }, [search, expiryFilter, sortAsc, vehicleData]);
  const displayed = recordsToShow > 0 ? filtered.slice(0, recordsToShow) : filtered;

  return (
    <div className="dashboard-latest" style={{marginTop:32}}>
      <div className="latest-header">
        <h2>Vehicle RTO Data</h2>
      </div>
      <div style={{display:'flex',gap:16,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
        <div className="number-plate-container" style={{ width: 330 }}>
          <div className="number-plate-wrapper">
            <div className="number-plate-badge">IND</div>
            <div className="tricolor-strip">
              <div className="saffron"></div>
              <div className="white"></div>
              <div className="green"></div>
            </div>
            <input
              type="text"
              placeholder="Search Vehicle Number"
              value={search}
              onChange={e => setSearch(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              className="number-plate-input"
              maxLength={12}
            />
          </div>
          <div className="security-features">
            <div className="hologram"></div>
            <div className="chakra">⚙</div>
          </div>
        </div>
        <select
          value={expiryFilter}
          onChange={e => setExpiryFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All</option>
          <option value="expired">Expired</option>
          <option value="expiring">Expiring Soon (≤30d)</option>
          <option value="valid">Valid (&gt;30d)</option>
        </select>
        <button
          className="action-btn flat-btn sort-btn"
          onClick={() => setSortAsc(s => !s)}
        >
          Sort Reg Date {sortAsc ? '▲' : '▼'}
        </button>
      </div>
      {loading && <div>Loading vehicle data...</div>}
      {error && <div style={{color:'red'}}>{error}</div>}
      <div className="table-caption-row">
        <div />
        <div
          style={{
            marginBottom: 8,
            color: '#222',
            fontSize: 15,
            background: '#e3f7d6',
            border: '1.5px solid #4caf50',
            borderRadius: 6,
            padding: '4px 12px',
            fontWeight: 600,
            display: 'inline-block',
          }}
        >
          Showing {displayed.length} of {filtered.length} records
        </div>
      </div>
  <div className="table-container">
    <table className="latest-table" style={{ width: '100%', marginTop: 8 }}>
          <thead>
            <tr>
              <th>S. No.</th>
              <th>Vehicle No.</th>
              <th>Registration Date</th>
              <th>Insurance Exp</th>
              <th>Road Tax Exp</th>
              <th>Fitness Exp</th>
              <th>Pollution Exp</th>
              <th>Action</th>
            </tr>
          </thead>
        <tbody>
          {displayed.length === 0 ? (
            <tr><td colSpan={8}>No vehicle data found.</td></tr>
          ) : (
            displayed.map((v, idx) => (
              <tr key={v.rc_regn_no || idx}>
                <td>{idx + 1}</td>
                <td>{v.rc_regn_no || '-'}</td>
                <td>{formatExpiry(v.rc_regn_dt, false)}</td>
                <td>{formatExpiry(v.insurance_exp || v.rc_insurance_upto, true)}</td>
                <td>{formatExpiry(v.road_tax_exp || v.rc_tax_upto, true)}</td>
                <td>{formatExpiry(v.fitness_exp || v.rc_fit_upto, true)}</td>
                <td>{formatExpiry(v.pollution_exp || v.rc_pucc_upto, true)}</td>
                <td style={{textAlign:'center'}}>
                  <button className="action-btn flat-btn" style={{padding:'4px 10px',fontSize:14}} onClick={() => { setSelectedVehicle(v); setSidebarOpen(true); }}>
                    View Vehicle
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

      {(recordsToShow < filtered.length) && (
        <div style={{ textAlign: 'left', marginTop: 16, marginBottom: 8 }}>
          <span style={{
            fontWeight: 600,
            marginRight: 12,
            color: '#1976d2',
            fontSize: 15
          }}>
            Show more records:
          </span>
          <select
            style={{
              padding: '7px 16px',
              borderRadius: 6,
              border: '1.5px solid #1976d2',
              fontSize: 15,
              fontWeight: 600,
              color: '#1976d2',
              background: '#f5faff',
              outline: 'none',
              marginRight: 8
            }}
            value={0}
            onChange={e => {
              const val = e.target.value;
              if (val === 'all') setRecordsToShow(filtered.length);
              else setRecordsToShow(prev => Math.min(prev + Number(val), filtered.length));
            }}
          >
            <option value={0} disabled>Select</option>
            <option value={50}>50 more</option>
            <option value={100}>100 more</option>
            <option value={200}>200 more</option>
            <option value="all">All records</option>
          </select>
        </div>
      )}

      <RightSidebar
        open={sidebarOpen && !!selectedVehicle}
        onClose={() => {
          setSidebarOpen(false);
          setTimeout(() => setSelectedVehicle(null), 300);
        }}
        title={selectedVehicle ? `Vehicle RTO Data: ${selectedVehicle.rc_regn_no}` : ''}
      >
        {selectedVehicle && (
          <table className="latest-table" style={{ width: '100%', fontSize: 15 }}>
            <tbody>
              <tr><td><b>Vehicle No</b></td><td>{selectedVehicle.rc_regn_no || '-'}</td></tr>
              <tr><td><b>Owner Name</b></td><td>{selectedVehicle.rc_owner_name || '-'}</td></tr>
              <tr><td><b>Registration Date</b></td><td>{formatExpiry(selectedVehicle.rc_regn_dt, false)}</td></tr>
              <tr><td><b>Insurance Expiry</b></td><td>{formatExpiry(selectedVehicle.insurance_exp || selectedVehicle.rc_insurance_upto, false)}</td></tr>
              <tr><td><b>Road Tax Expiry</b></td><td>{formatExpiry(selectedVehicle.road_tax_exp || selectedVehicle.rc_tax_upto, false)}</td></tr>
              <tr><td><b>Fitness Expiry</b></td><td>{formatExpiry(selectedVehicle.fitness_exp || selectedVehicle.rc_fit_upto, false)}</td></tr>
              <tr><td><b>Pollution Expiry</b></td><td>{formatExpiry(selectedVehicle.pollution_exp || selectedVehicle.rc_pucc_upto, false)}</td></tr>
              <tr><td><b>Chassis No</b></td><td>{selectedVehicle.rc_chasi_no || '-'}</td></tr>
              <tr><td><b>Engine No</b></td><td>{selectedVehicle.rc_engine_no || '-'}</td></tr>
              <tr><td><b>Vehicle Class</b></td><td>{selectedVehicle.rc_vh_class_desc || '-'}</td></tr>
              <tr><td><b>Fuel Type</b></td><td>{selectedVehicle.rc_fuel_desc || '-'}</td></tr>
              <tr><td><b>Maker</b></td><td>{selectedVehicle.rc_maker_desc || '-'}</td></tr>
              <tr><td><b>Model</b></td><td>{selectedVehicle.rc_maker_model || '-'}</td></tr>
              <tr><td><b>RTO</b></td><td>{selectedVehicle.rc_off_cd || '-'}</td></tr>
              <tr><td><b>State</b></td><td>{selectedVehicle.rc_state_cd || '-'}</td></tr>
              <tr><td><b>Mobile No</b></td><td>{selectedVehicle.rc_mobile_no || '-'}</td></tr>
              <tr><td><b>Address</b></td><td>{selectedVehicle.rc_present_address || '-'}</td></tr>
            </tbody>
          </table>
        )}
      </RightSidebar>

    </div>
  );
}
