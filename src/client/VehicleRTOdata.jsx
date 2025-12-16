import React, { useEffect, useState } from "react";
import SelectShowMore from "./SelectShowMore";
import { FaDownload, FaPrint, FaEye } from "react-icons/fa";
import * as XLSX from "xlsx";
import "../shared/CommonDashboard.css";
import CustomModal from "./CustomModal";
import RightSidebar from "./RightSidebar";
import "./RightSidebar.css";
import "../RegisterVehicle.css";

export default function VehicleRTOdataTable({ clientId, onViewAll, selectedRtoData, setSelectedRtoData, hideSearchSortFilter }) {
      // Urgent renewals filter: multiple types and day range
      const [urgentTypes, setUrgentTypes] = useState([]); // e.g. ['insurance', 'roadtax']
      const [showUrgentDropdown, setShowUrgentDropdown] = useState(false);
      const [urgentRange, setUrgentRange] = useState(15); // days, default 15
    // Expired filter: multiple types
    const [expiredTypes, setExpiredTypes] = useState([]); // e.g. ['insurance', 'roadtax']
    const [showExpiredDropdown, setShowExpiredDropdown] = useState(false);
  // Document type: 'insurance', 'roadtax', 'fitness', 'pollution'
  const [docType, setDocType] = useState('insurance');
  // Renewal period: 'all', 'urgent', 'upcoming'
  const [renewalPeriod, setRenewalPeriod] = useState('all');
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

  // Sidebar state is now managed by parent
  // Search, sort, filter state
  const [search, setSearch] = useState('');
  // Removed sortAsc and expiryFilter state

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
  // Apply expired filter (multi)
  if (expiredTypes.length > 0) {
    filtered = filtered.filter(v => {
      return expiredTypes.some(type => {
        let exp = '-';
        if (type === 'insurance') exp = v.insurance_exp || v.rc_insurance_upto;
        else if (type === 'roadtax') exp = v.road_tax_exp || v.rc_tax_upto;
        else if (type === 'fitness') exp = v.fitness_exp || v.rc_fit_upto;
        else if (type === 'pollution') exp = v.pollution_exp || v.rc_pucc_upto;
        if (!exp || exp === '-') return false;
        let d = null;
        if (/\d{2}-[A-Za-z]{3}-\d{4}/.test(exp)) d = new Date(exp.replace(/-/g, ' '));
        else if (/\d{2}-\d{2}-\d{4}/.test(exp)) { const [day, month, year] = exp.split('-'); d = new Date(`${year}-${month}-${day}`); }
        else if (/\d{4}-\d{2}-\d{2}/.test(exp)) d = new Date(exp);
        else d = new Date(exp);
        if (isNaN(d.getTime())) return false;
        const now = new Date();
        return d < now;
      });
    });
  }
  // Apply urgent renewals filter (multi, range)
  if (urgentTypes.length > 0) {
    filtered = filtered.filter(v => {
      return urgentTypes.some(type => {
        let exp = '-';
        if (type === 'insurance') exp = v.insurance_exp || v.rc_insurance_upto;
        else if (type === 'roadtax') exp = v.road_tax_exp || v.rc_tax_upto;
        else if (type === 'fitness') exp = v.fitness_exp || v.rc_fit_upto;
        else if (type === 'pollution') exp = v.pollution_exp || v.rc_pucc_upto;
        if (!exp || exp === '-') return false;
        let d = null;
        if (/\d{2}-[A-Za-z]{3}-\d{4}/.test(exp)) d = new Date(exp.replace(/-/g, ' '));
        else if (/\d{2}-\d{2}-\d{4}/.test(exp)) { const [day, month, year] = exp.split('-'); d = new Date(`${year}-${month}-${day}`); }
        else if (/\d{4}-\d{2}-\d{2}/.test(exp)) d = new Date(exp);
        else d = new Date(exp);
        if (isNaN(d.getTime())) return false;
        const now = new Date();
        const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= urgentRange;
      });
    });
  }
  // Apply document and renewal period filters
  if (renewalPeriod !== 'all') {
    filtered = filtered.filter(v => {
      let exp = '-';
      if (docType === 'insurance') exp = v.insurance_exp || v.rc_insurance_upto;
      else if (docType === 'roadtax') exp = v.road_tax_exp || v.rc_tax_upto;
      else if (docType === 'fitness') exp = v.fitness_exp || v.rc_fit_upto;
      else if (docType === 'pollution') exp = v.pollution_exp || v.rc_pucc_upto;
      if (!exp || exp === '-') return false;
      let d = null;
      if (/\d{2}-[A-Za-z]{3}-\d{4}/.test(exp)) d = new Date(exp.replace(/-/g, ' '));
      else if (/\d{2}-\d{2}-\d{4}/.test(exp)) { const [day, month, year] = exp.split('-'); d = new Date(`${year}-${month}-${day}`); }
      else if (/\d{4}-\d{2}-\d{2}/.test(exp)) d = new Date(exp);
      else d = new Date(exp);
      if (isNaN(d.getTime())) return false;
      const now = new Date();
      const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
      if (renewalPeriod === 'urgent') return diffDays <= 7;
      if (renewalPeriod === 'upcoming') return diffDays > 7 && diffDays <= 30;
      return true;
    });
  }
  // Removed expiryFilter and sorting logic
  // Show 30 records by default
  const DEFAULT_LIMIT = 30;
  const [visibleCount, setVisibleCount] = useState(DEFAULT_LIMIT);
  useEffect(() => { setVisibleCount(DEFAULT_LIMIT); }, [search, vehicleData]);
  const displayed = visibleCount > 0 ? filtered.slice(0, visibleCount) : filtered;

  return (
    <div className="dashboard-latest">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0, padding: '0 24px 0 0', minHeight: 54 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 4, height: 32, background: 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)', borderRadius: 3, marginRight: 14 }} />
          <h2 style={{ margin: 0, fontSize: 19, color: '#1565c0', letterSpacing: '0.01em', fontFamily: 'Segoe UI, Arial, sans-serif', lineHeight: 1.2, fontWeight: 700 }}>Vehicle RTO Data</h2>
        </div>
        <div style={{ color: '#1565c0', fontSize: 14, background: '#f5f8fa', border: '1.5px solid #2196f3', borderRadius: 6, padding: '4px 12px', fontWeight: 700, display: 'inline-block', marginLeft: 16, boxShadow: '0 1px 4px #21cbf322' }}>
          Showing {displayed.length} of {filtered.length} records
        </div>
      </div>
      {/* Controls section, separated from table, matching My Fleet */}
      {!hideSearchSortFilter && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 18,
          marginTop: 0,
          flexWrap: 'wrap',
          background: '#f5f8fa',
          borderRadius: 8,
          padding: '16px 18px 10px 18px',
          border: '1.5px solid #e3eaf1',
          boxShadow: '0 1px 4px #21cbf322',
          position: 'relative'
        }}>
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
          {/* Expired records filter */}
          <div style={{ position: 'relative' }}>
            <button
              className="filter-select"
              style={{ minWidth: 180, textAlign: 'left', padding: '8px 12px', border: '1px solid #bcd', borderRadius: 6, background: '#fff', cursor: 'pointer' }}
              onClick={() => setShowExpiredDropdown(v => !v)}
            >
              {expiredTypes.length === 0 ? 'Select expired records' : expiredTypes.map(t => {
                if (t === 'insurance') return 'Insurance';
                if (t === 'roadtax') return 'Road Tax';
                if (t === 'fitness') return 'Fitness';
                if (t === 'pollution') return 'Pollution';
                return t;
              }).join(', ')}
              <span style={{ float: 'right', fontWeight: 700, fontSize: 16, marginLeft: 8 }}>▼</span>
            </button>
            {showExpiredDropdown && (
              <div style={{ position: 'absolute', top: 38, left: 0, zIndex: 10, background: '#fff', border: '1.5px solid #bcd', borderRadius: 8, boxShadow: '0 2px 8px #0001', minWidth: 180, padding: 8 }}>
                {['insurance', 'roadtax', 'fitness', 'pollution'].map(type => (
                  <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={expiredTypes.includes(type)}
                      onChange={e => {
                        if (e.target.checked) setExpiredTypes(prev => [...prev, type]);
                        else setExpiredTypes(prev => prev.filter(t => t !== type));
                      }}
                    />
                    {type === 'insurance' ? 'Insurance' : type === 'roadtax' ? 'Road Tax' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </label>
                ))}
                <div style={{ textAlign: 'right', marginTop: 6 }}>
                  <button style={{ fontSize: 13, padding: '2px 10px', borderRadius: 5, border: '1px solid #bcd', background: '#f5f8fa', cursor: 'pointer' }} onClick={() => setShowExpiredDropdown(false)}>Close</button>
                </div>
              </div>
            )}
          </div>
          {/* Urgent renewals filter */}
          <div style={{ position: 'relative' }}>
            <button
              className="filter-select"
              style={{ minWidth: 180, textAlign: 'left', padding: '8px 12px', border: '1px solid #bcd', borderRadius: 6, background: '#fff', cursor: 'pointer' }}
              onClick={() => setShowUrgentDropdown(v => !v)}
            >
              {urgentTypes.length === 0 ? 'Select urgent renewals' : urgentTypes.map(t => {
                if (t === 'insurance') return 'Insurance';
                if (t === 'roadtax') return 'Road Tax';
                if (t === 'fitness') return 'Fitness';
                if (t === 'pollution') return 'Pollution';
                return t;
              }).join(', ')}
              <span style={{ float: 'right', fontWeight: 700, fontSize: 16, marginLeft: 8 }}>▼</span>
            </button>
            {showUrgentDropdown && (
              <div style={{ position: 'absolute', top: 38, left: 0, zIndex: 10, background: '#fff', border: '1.5px solid #bcd', borderRadius: 8, boxShadow: '0 2px 8px #0001', minWidth: 220, padding: 8 }}>
                {['insurance', 'roadtax', 'fitness', 'pollution'].map(type => (
                  <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={urgentTypes.includes(type)}
                      onChange={e => {
                        if (e.target.checked) setUrgentTypes(prev => [...prev, type]);
                        else setUrgentTypes(prev => prev.filter(t => t !== type));
                      }}
                    />
                    {type === 'insurance' ? 'Insurance' : type === 'roadtax' ? 'Road Tax' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </label>
                ))}
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13 }}>Days:</span>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={urgentRange}
                    onChange={e => {
                      let val = Number(e.target.value);
                      if (isNaN(val) || val < 1) val = 1;
                      if (val > 50) val = 50;
                      setUrgentRange(val);
                    }}
                    style={{ width: 50, fontSize: 14, padding: '2px 6px', borderRadius: 4, border: '1px solid #bcd' }}
                  />
                  <span style={{ fontSize: 13 }}>(1-50)</span>
                </div>
                <div style={{ textAlign: 'right', marginTop: 6 }}>
                  <button style={{ fontSize: 13, padding: '2px 10px', borderRadius: 5, border: '1px solid #bcd', background: '#f5f8fa', cursor: 'pointer' }} onClick={() => setShowUrgentDropdown(false)}>Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="table-container" id="vehicle-rto-table-print-area">
        <table className="latest-table" style={{ width: '100%', marginTop: 8 }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Vehicle No.</th>
              {!hideSearchSortFilter && <th>Registration Date</th>}
              <th
                style={expiredTypes.includes('insurance') ? { background: '#e3f2fd', color: '#1976d2', fontWeight: 700 } : {}}
              >Insurance Exp</th>
              <th
                style={expiredTypes.includes('roadtax') ? { background: '#e3f2fd', color: '#1976d2', fontWeight: 700 } : {}}
              >Road Tax Exp</th>
              <th
                style={expiredTypes.includes('fitness') ? { background: '#e3f2fd', color: '#1976d2', fontWeight: 700 } : {}}
              >Fitness Exp</th>
              <th
                style={expiredTypes.includes('pollution') ? { background: '#e3f2fd', color: '#1976d2', fontWeight: 700 } : {}}
              >Pollution Exp</th>
              <th className="print-hide" style={{color:'#1565c0',fontWeight:700,fontSize:15,textAlign:'center'}}>Action</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr><td colSpan={hideSearchSortFilter ? 7 : 8}>No vehicle data found.</td></tr>
            ) : (
              displayed.map((v, idx) => (
                <tr key={v.rc_regn_no || idx}>
                  <td>{idx + 1}</td>
                  <td>{v.rc_regn_no || '-'}</td>
                  {!hideSearchSortFilter && <td>{formatExpiry(v.rc_regn_dt, false)}</td>}
                  <td
                    style={expiredTypes.includes('insurance') ? { background: '#e3f2fd', fontWeight: 600 } : {}}
                  >{formatExpiry(v.insurance_exp || v.rc_insurance_upto, true)}</td>
                  <td
                    style={expiredTypes.includes('roadtax') ? { background: '#e3f2fd', fontWeight: 600 } : {}}
                  >{formatExpiry(v.road_tax_exp || v.rc_tax_upto, true)}</td>
                  <td
                    style={expiredTypes.includes('fitness') ? { background: '#e3f2fd', fontWeight: 600 } : {}}
                  >{formatExpiry(v.fitness_exp || v.rc_fit_upto, true)}</td>
                  <td
                    style={expiredTypes.includes('pollution') ? { background: '#e3f2fd', fontWeight: 600 } : {}}
                  >{formatExpiry(v.pollution_exp || v.rc_pucc_upto, true)}</td>
                  <td className="print-hide" style={{textAlign:'center'}}>
                    <button className="action-btn flat-btn" title="View Vehicle" style={{fontSize:'80%',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={() => {
                      // Always set the latest vehicle data from the full vehicleData array
                      const found = vehicleData.find(item => item.rc_regn_no === v.rc_regn_no);
                      setSelectedRtoData(found || v);
                    }}>
                      <i className="ri-eye-line" style={{fontSize:'1.2em'}} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, marginLeft: 24 }}>
          <span style={{ color: '#1976d2', fontSize: 15 }}>Show more records:</span>
          <SelectShowMore
            onShowMoreRecords={val => {
              if (val === 'all') setVisibleCount(filtered.length);
              else setVisibleCount(Number(val));
            }}
            onResetRecords={() => setVisibleCount(DEFAULT_LIMIT)}
            maxCount={filtered.length}
          />
        </div>
      )}

      <RightSidebar
        open={!!selectedRtoData}
        onClose={() => {
          setTimeout(() => setSelectedRtoData(null), 300);
        }}
        title={selectedRtoData ? `Vehicle RTO Data: ${selectedRtoData.rc_regn_no}` : ''}
      >
        {selectedRtoData && selectedRtoData.rc_regn_no ? (
          <table className="latest-table" style={{ width: '100%', fontSize: 15 }}>
            <tbody>
              <tr><td><b>Vehicle No</b></td><td>{selectedRtoData.rc_regn_no || '-'}</td></tr>
              <tr><td><b>Owner Name</b></td><td>{selectedRtoData.rc_owner_name || '-'}</td></tr>
              <tr><td><b>Registration Date</b></td><td>{formatExpiry(selectedRtoData.rc_regn_dt, false)}</td></tr>
              <tr><td><b>Insurance Expiry</b></td><td>{formatExpiry(selectedRtoData.insurance_exp || selectedRtoData.rc_insurance_upto, false)}</td></tr>
              <tr><td><b>Road Tax Expiry</b></td><td>{formatExpiry(selectedRtoData.road_tax_exp || selectedRtoData.rc_tax_upto, false)}</td></tr>
              <tr><td><b>Fitness Expiry</b></td><td>{formatExpiry(selectedRtoData.fitness_exp || selectedRtoData.rc_fit_upto, false)}</td></tr>
              <tr><td><b>Pollution Expiry</b></td><td>{formatExpiry(selectedRtoData.pollution_exp || selectedRtoData.rc_pucc_upto, false)}</td></tr>
              <tr><td><b>Chassis No</b></td><td>{selectedRtoData.rc_chasi_no || '-'}</td></tr>
              <tr><td><b>Engine No</b></td><td>{selectedRtoData.rc_engine_no || '-'}</td></tr>
              <tr><td><b>Vehicle Class</b></td><td>{selectedRtoData.rc_vh_class_desc || '-'}</td></tr>
              <tr><td><b>Fuel Type</b></td><td>{selectedRtoData.rc_fuel_desc || '-'}</td></tr>
              <tr><td><b>Maker</b></td><td>{selectedRtoData.rc_maker_desc || '-'}</td></tr>
              <tr><td><b>Model</b></td><td>{selectedRtoData.rc_maker_model || '-'}</td></tr>
              <tr><td><b>RTO</b></td><td>{selectedRtoData.rc_off_cd || '-'}</td></tr>
              <tr><td><b>State</b></td><td>{selectedRtoData.rc_state_cd || '-'}</td></tr>
              <tr><td><b>Mobile No</b></td><td>{selectedRtoData.rc_mobile_no || '-'}</td></tr>
              <tr><td><b>Address</b></td><td>{selectedRtoData.rc_present_address || '-'}</td></tr>
            </tbody>
          </table>
        ) : (
          <div style={{padding:24, fontSize:16, color:'#b00'}}>No vehicle data found for this record.</div>
        )}
      </RightSidebar>

    </div>
  );
}
