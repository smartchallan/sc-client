  // Ensure handlers are always defined to avoid ReferenceError
  const handleShowMoreRecords = typeof onShowMoreRecords === 'function' ? onShowMoreRecords : () => {};
  const handleResetRecords = typeof onResetRecords === 'function' ? onResetRecords : () => {};
import React, { useState } from "react";
import SelectShowMore from "./SelectShowMore";
import { FaSyncAlt, FaEye } from "react-icons/fa";
import BlueTickIcon from "./BlueTickIcon";

export default function MyFleetTable({ data, loading, onRefresh, onView, totalCount, upcomingRenewalRange, filteredFleet = null }) {
  // Search state for vehicle number
  const [search, setSearch] = useState('');
  // Expired filter: multiple types (insurance, roadtax, fitness, pollution)
  const [expiredTypes, setExpiredTypes] = useState([]); // e.g. ['insurance', 'roadtax']
  const [showExpiredDropdown, setShowExpiredDropdown] = useState(false);
  // Urgent renewals filter: multiple types and day range
  const [urgentTypes, setUrgentTypes] = useState([]); // e.g. ['insurance', 'roadtax']
  const [showUrgentDropdown, setShowUrgentDropdown] = useState(false);
  const [urgentRange, setUrgentRange] = useState(15); // days, default 15
  // Get filter info from window (set by ClientDashboard)
  // Normalize filter values to match type keys used in shouldHighlight
  let urgentRenewalFilter = (window.urgentRenewalFilter || 'none').toLowerCase();
  let upcomingRenewalFilter = (window.upcomingRenewalFilter || 'none').toLowerCase();
  // Map possible filter values to the type keys used in shouldHighlight
  if (urgentRenewalFilter === 'roadtax' || urgentRenewalFilter === 'road tax') urgentRenewalFilter = 'roadtax';
  if (upcomingRenewalFilter === 'roadtax' || upcomingRenewalFilter === 'road tax') upcomingRenewalFilter = 'roadtax';
  // Use prop upcomingRenewalRange if provided, else fallback to window
  const effectiveUpcomingRenewalRange = typeof upcomingRenewalRange === 'number' ? upcomingRenewalRange : (window.upcomingRenewalRange ? Number(window.upcomingRenewalRange) : 15);
  // Helper to check if a cell should be highlighted (expiredTypes or legacy urgent/upcoming)
  const shouldHighlight = (row, type) => {
    // Highlight if selected in expiredTypes
    if (expiredTypes.includes(type)) return true;
    // Legacy highlight logic (urgent/upcoming)
    const now = new Date();
    const parseDate = (dateStr) => {
      if (!dateStr || dateStr === '-') return null;
      if (typeof dateStr === 'object' && dateStr !== null && dateStr.value) return new Date(dateStr.value);
      if (/\d{2}-[A-Za-z]{3}-\d{4}/.test(dateStr)) return new Date(dateStr.replace(/-/g, ' '));
      if (/\d{2}-\d{2}-\d{4}/.test(dateStr)) {
        const [d, m, y] = dateStr.split('-');
        return new Date(`${y}-${m}-${d}`);
      }
      if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) return new Date(dateStr);
      return new Date(dateStr);
    };
    let date;
    if (type === 'insurance') date = parseDate(row.rc_insurance_upto || row.insurance_exp);
    if (type === 'roadtax') date = parseDate(row.rc_tax_upto || row.road_tax_exp);
    if (type === 'fitness') date = parseDate(row.rc_fit_upto || row.fitness_exp);
    if (type === 'pollution') date = parseDate(row.rc_pucc_upto || row.pollution_exp);
    if (!date) return false;
    if (urgentRenewalFilter === type.toLowerCase()) return date < now;
    if (upcomingRenewalFilter === type.toLowerCase()) {
      const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= effectiveUpcomingRenewalRange;
    }
    return false;
  };
  // Sort by registered_at DESC
  let sortedAll = [...(filteredFleet || data || [])].sort((a, b) => new Date(b.registered_at) - new Date(a.registered_at));
  // Filter by vehicle number search
  if (search.trim() !== '') {
    sortedAll = sortedAll.filter(v => (v.vehicle_number || '').toString().toUpperCase().includes(search.trim().toUpperCase()));
  }
  // Apply expired filter (multi)
  if (expiredTypes.length > 0) {
    sortedAll = sortedAll.filter(v => {
      return expiredTypes.some(type => {
        let exp = '-';
        if (type === 'insurance') exp = v.rc_insurance_upto || v.insurance_exp;
        else if (type === 'roadtax') exp = v.rc_tax_upto || v.road_tax_exp;
        else if (type === 'fitness') exp = v.rc_fit_upto || v.fitness_exp;
        else if (type === 'pollution') exp = v.rc_pucc_upto || v.pollution_exp;
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
    sortedAll = sortedAll.filter(v => {
      return urgentTypes.some(type => {
        let exp = '-';
        if (type === 'insurance') exp = v.rc_insurance_upto || v.insurance_exp;
        else if (type === 'roadtax') exp = v.rc_tax_upto || v.road_tax_exp;
        else if (type === 'fitness') exp = v.rc_fit_upto || v.fitness_exp;
        else if (type === 'pollution') exp = v.rc_pucc_upto || v.pollution_exp;
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
  // Default visible count is 30
  const [visibleCount, setVisibleCount] = React.useState(30);
  const visibleRows = sortedAll.slice(0, visibleCount);

  // Helper to check if all expiry fields are fit
  const isAllFit = (row) => {
    const now = new Date();
    const parseDate = (dateStr) => {
      if (!dateStr || dateStr === '-') return null;
      if (typeof dateStr === 'object' && dateStr !== null && dateStr.value) return new Date(dateStr.value);
      if (/\d{2}-[A-Za-z]{3}-\d{4}/.test(dateStr)) return new Date(dateStr.replace(/-/g, ' '));
      if (/\d{2}-\d{2}-\d{4}/.test(dateStr)) {
        const [d, m, y] = dateStr.split('-');
        return new Date(`${y}-${m}-${d}`);
      }
      if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) return new Date(dateStr);
      return new Date(dateStr);
    };
    // Helper for new API format: { value, status }
    const isFit = (field) => {
      if (field && typeof field === 'object' && field.status) {
        return field.status === 'fit';
      }
      return false;
    };
    return (
      isFit(row.rc_insurance_upto || row.insurance_exp) &&
      isFit(row.rc_tax_upto || row.road_tax_exp) &&
      isFit(row.rc_fit_upto || row.fitness_exp) &&
      isFit(row.rc_pucc_upto || row.pollution_exp)
    );
  };
  return (
    <div className="dashboard-latest" style={{
      background: '#fff',
      borderRadius: 14,
      boxShadow: '0 2px 12px 0 rgba(30,136,229,0.07)',
      border: '1.5px solid #e3eaf1',
      padding: '0 0 18px 0',
      marginBottom: 0,
      minHeight: 340,
      transition: 'box-shadow 0.2s'
    }}>
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
        position: 'relative',
        maxWidth: 900
      }}>
        <div className="number-plate-container" style={{ width: 330 }}>
          {/* ...existing code for number plate input... */}
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
      <div className="table-container">
        <table className="latest-table vehicle-summary-table" style={{ width: '100%', marginTop: 8 }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Vehicle</th>
              <th>Registration Date</th>
              <th
                style={expiredTypes.includes('insurance') ? { background: '#e3f2fd', color: '#1976d2', fontWeight: 700 } : {}}
              >Insurance Upto</th>
              <th
                style={expiredTypes.includes('roadtax') ? { background: '#e3f2fd', color: '#1976d2', fontWeight: 700 } : {}}
              >Road Tax Upto</th>
              <th
                style={expiredTypes.includes('fitness') ? { background: '#e3f2fd', color: '#1976d2', fontWeight: 700 } : {}}
              >Fitness Upto</th>
              <th
                style={expiredTypes.includes('pollution') ? { background: '#e3f2fd', color: '#1976d2', fontWeight: 700 } : {}}
              >Pollution Upto</th>
              <th colSpan={2} style={{textAlign:'center'}}>Vehicle Challans</th>
              <th>Action</th>
              <th>View</th>
            </tr>
            <tr>
              <th colSpan={7}></th>
              <th style={{textAlign:'center',color:'#e74c3c'}}>Pending</th>
              <th style={{textAlign:'center',color:'#43a047'}}>Settled</th>
              <th colSpan={2}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11}>Loading...</td></tr>
            ) : sortedAll.length === 0 ? (
              <tr><td colSpan={11}>No data found.</td></tr>
            ) : (
              visibleRows.map((row, idx) => (
                <tr key={row.vehicle_id || idx}>
                  <td>{idx + 1}</td>
                  <td>
                    {row.vehicle_number || '-'}
                    {isAllFit(row) && <BlueTickIcon />}
                  </td>
                  <td>{row.rc_regn_dt || row.registration_date || row.registered_at || '-'}</td>
                  <td
                    style={expiredTypes.includes('insurance') ? { background: '#e3f2fd', fontWeight: 600 } : {}}
                  >{typeof (row.rc_insurance_upto || row.insurance_exp) === 'object' && (row.rc_insurance_upto || row.insurance_exp) !== null ? ((row.rc_insurance_upto || row.insurance_exp).value ?? JSON.stringify(row.rc_insurance_upto || row.insurance_exp)) : (row.rc_insurance_upto || row.insurance_exp || '-')}</td>
                  <td
                    style={expiredTypes.includes('roadtax') ? { background: '#e3f2fd', fontWeight: 600 } : {}}
                  >{typeof (row.rc_tax_upto || row.road_tax_exp) === 'object' && (row.rc_tax_upto || row.road_tax_exp) !== null
                      ? ((row.rc_tax_upto || row.road_tax_exp).value ?? JSON.stringify(row.rc_tax_upto || row.road_tax_exp))
                      : (row.rc_tax_upto || row.road_tax_exp || '-')}</td>
                  <td
                    style={expiredTypes.includes('fitness') ? { background: '#e3f2fd', fontWeight: 600 } : {}}
                  >{typeof (row.rc_fit_upto || row.fitness_exp) === 'object' && (row.rc_fit_upto || row.fitness_exp) !== null ? ((row.rc_fit_upto || row.fitness_exp).value ?? JSON.stringify(row.rc_fit_upto || row.fitness_exp)) : (row.rc_fit_upto || row.fitness_exp || '-')}</td>
                  <td
                    style={expiredTypes.includes('pollution') ? { background: '#e3f2fd', fontWeight: 600 } : {}}
                  >{typeof (row.rc_pucc_upto || row.pollution_exp) === 'object' && (row.rc_pucc_upto || row.pollution_exp) !== null ? ((row.rc_pucc_upto || row.pollution_exp).value ?? JSON.stringify(row.rc_pucc_upto || row.pollution_exp)) : (row.rc_pucc_upto || row.pollution_exp || '-')}</td>
                  <td className={
                    row.pending_challan_count > 0
                      ? 'pending-challan-count'
                      : 'zero-challan-count'
                  } style={{textAlign:'center',fontWeight:600}}>{row.pending_challan_count ?? 0}</td>
                  <td className={
                    row.disposed_challan_count > 0
                      ? 'disposed-challan-count'
                      : 'zero-challan-count'
                  } style={{textAlign:'center',fontWeight:600}}>{row.disposed_challan_count ?? 0}</td>
                  <td style={{textAlign:'center'}}>
                    <button className="action-btn flat-btn" title="Refresh" style={{fontSize:'80%',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={() => onRefresh(row)}>
                      <FaSyncAlt style={{fontSize:'1.2em'}} />
                    </button>
                  </td>
                  <td style={{textAlign:'center'}}>
                    <button className="action-btn flat-btn" title="View" style={{fontSize:'80%',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={() => onView(row)}>
                      <FaEye style={{fontSize:'1.2em'}} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      {/* Show more records control to match VehicleRtoData UI */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, marginLeft: 24 }}>
        <span style={{
          color: '#1976d2',
          fontSize: 15
        }}>
          Show more records:
        </span>
        <SelectShowMore
          onShowMoreRecords={val => {
            if (val === 'all') setVisibleCount(sortedAll.length);
            else setVisibleCount(Number(val));
          }}
          onResetRecords={() => setVisibleCount(30)}
          maxCount={sortedAll.length}
        />
      </div>
      </div>
    </div>
  );
}
