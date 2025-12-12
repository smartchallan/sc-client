import React from "react";
import { FaSyncAlt, FaEye } from "react-icons/fa";
import BlueTickIcon from "./BlueTickIcon";

export default function MyFleetTable({ data, loading, onRefresh, onView, totalCount, upcomingRenewalRange }) {
  // Get filter info from window (set by ClientDashboard)
  const urgentRenewalFilter = (window.urgentRenewalFilter || 'none').toLowerCase();
  const upcomingRenewalFilter = (window.upcomingRenewalFilter || 'none').toLowerCase();
  // Use prop upcomingRenewalRange if provided, else fallback to window
  const effectiveUpcomingRenewalRange = typeof upcomingRenewalRange === 'number' ? upcomingRenewalRange : (window.upcomingRenewalRange ? Number(window.upcomingRenewalRange) : 15);
  // Helper to check if a cell should be highlighted
  const shouldHighlight = (row, type) => {
    const now = new Date('2025-12-12');
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
  const sorted = [...(data || [])].sort((a, b) => new Date(b.registered_at) - new Date(a.registered_at));

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
      transition: 'box-shadow 0.2s',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0, padding: '0 24px 0 0', minHeight: 54 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 4, height: 32, background: 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)', borderRadius: 3, marginRight: 14 }} />
          <h2 style={{
            margin: 0,
            fontSize: 19,
            color: '#1565c0',
            letterSpacing: '0.01em',
            fontFamily: 'Segoe UI, Arial, sans-serif',
            lineHeight: 1.2,
            fontWeight: 700,
          }}>My Fleet</h2>
        </div>
        <div style={{ color: '#1565c0', fontSize: 14, background: '#f5f8fa', border: '1.5px solid #2196f3', borderRadius: 6, padding: '4px 12px', fontWeight: 700, display: 'inline-block', marginLeft: 16, boxShadow: '0 1px 4px #21cbf322' }}>
          Showing {sorted.length}{typeof totalCount === 'number' && totalCount > sorted.length ? ` of ${totalCount}` : ''} records
        </div>
      </div>
      <div className="table-container">
        <table className="latest-table vehicle-summary-table" style={{ width: '100%', marginTop: 8 }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Vehicle</th>
              <th>Registration Date</th>
              <th>Insurance Upto</th>
              <th>Road Tax Upto</th>
              <th>Fitness Upto</th>
              <th>Pollution Upto</th>
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
            ) : sorted.length === 0 ? (
              <tr><td colSpan={11}>No data found.</td></tr>
            ) : (
              sorted.map((row, idx) => (
                <tr key={row.vehicle_id || idx}>
                  <td>{idx + 1}</td>
                  <td>
                    {row.vehicle_number || '-'}
                    {isAllFit(row) && <BlueTickIcon />}
                  </td>
                  <td>{row.rc_regn_dt || row.registration_date || row.registered_at || '-'}</td>
                  <td className={shouldHighlight(row, 'insurance') ? 'highlight-anim highlight-insurance' : ''}>{typeof (row.rc_insurance_upto || row.insurance_exp) === 'object' && (row.rc_insurance_upto || row.insurance_exp) !== null ? ((row.rc_insurance_upto || row.insurance_exp).value ?? JSON.stringify(row.rc_insurance_upto || row.insurance_exp)) : (row.rc_insurance_upto || row.insurance_exp || '-')}</td>
                  <td className={shouldHighlight(row, 'roadtax') ? 'highlight-anim highlight-roadtax' : ''}>{typeof (row.rc_tax_upto || row.road_tax_exp) === 'object' && (row.rc_tax_upto || row.road_tax_exp) !== null ? ((row.rc_tax_upto || row.road_tax_exp).value ?? JSON.stringify(row.rc_tax_upto || row.road_tax_exp)) : (row.rc_tax_upto || row.road_tax_exp || '-')}</td>
                  <td className={shouldHighlight(row, 'fitness') ? 'highlight-anim highlight-fitness' : ''}>{typeof (row.rc_fit_upto || row.fitness_exp) === 'object' && (row.rc_fit_upto || row.fitness_exp) !== null ? ((row.rc_fit_upto || row.fitness_exp).value ?? JSON.stringify(row.rc_fit_upto || row.fitness_exp)) : (row.rc_fit_upto || row.fitness_exp || '-')}</td>
                  <td className={shouldHighlight(row, 'pollution') ? 'highlight-anim highlight-pollution' : ''}>{typeof (row.rc_pucc_upto || row.pollution_exp) === 'object' && (row.rc_pucc_upto || row.pollution_exp) !== null ? ((row.rc_pucc_upto || row.pollution_exp).value ?? JSON.stringify(row.rc_pucc_upto || row.pollution_exp)) : (row.rc_pucc_upto || row.pollution_exp || '-')}</td>
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
      </div>
    </div>
  );
}
