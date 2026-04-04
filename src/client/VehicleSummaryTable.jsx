import React from "react";

export default function VehicleSummaryTable({ data, loading, onRefresh, onView, onViewAll }) {

  /* ── helpers ── */
  const parseDate = (dateStr) => {
    if (!dateStr || dateStr === '-' || dateStr === 'NA' || dateStr === 'N/A') return null;
    let d = null;
    if (/\d{2}-[A-Za-z]{3}-\d{4}/.test(dateStr)) d = new Date(dateStr.replace(/-/g, ' '));
    else if (/\d{2}-\d{2}-\d{4}/.test(dateStr)) { const [day, month, year] = dateStr.split('-'); d = new Date(`${year}-${month}-${day}`); }
    else if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) d = new Date(dateStr);
    else d = new Date(dateStr);
    return isNaN(d?.getTime()) ? null : d;
  };

  const formatDate = (dateStr) => {
    const d = parseDate(dateStr);
    if (!d) return '-';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
  };

  /** Returns 'expired' | 'expiring' | 'valid' | null */
  const expiryStatus = (dateStr) => {
    const d = parseDate(dateStr);
    if (!d) return null;
    const now = new Date();
    if (d < now) return 'expired';
    const diff = (d - now) / (1000 * 60 * 60 * 24);
    if (diff <= 30) return 'expiring';
    return 'valid';
  };

  const resolveField = (row, ...paths) => {
    for (const p of paths) {
      let val = p.split('.').reduce((o, k) => o?.[k], row);
      if (!val) continue;
      if (typeof val === 'string' && val.trim().startsWith('{') && val.trim().endsWith('}')) {
        try { val = JSON.parse(val); } catch { continue; }
      }
      if (typeof val === 'object' && val !== null) { val = val.value ?? null; }
      if (val) return val;
    }
    return null;
  };

  /* ── data ── */
  const vehicles = Array.isArray(data?.vehicles) ? data.vehicles : (Array.isArray(data) ? data : []);
  const sortedAll = [...vehicles].sort((a, b) => new Date(b.registered_at) - new Date(a.registered_at));
  const DEFAULT_VISIBLE = 10;
  const sorted = sortedAll.slice(0, DEFAULT_VISIBLE);

  const getRcStatus = (row) => {
    const status = resolveField(row, 'rc_status', 'rcStatus', '_raw.rc_status', '_raw.rcStatus');
    return status ? String(status).trim().toLowerCase() : null;
  };

  const RegnDateCell = ({ value, rcStatus }) => {
    const formatted = formatDate(value);
    if (formatted === '-') return <span className="vst-cell--empty">—</span>;
    const isActive = rcStatus === 'active';
    const className = `vst-date ${isActive ? 'vst-date--valid' : 'vst-date--expired'}`;
    return <span className={className}>{formatted}</span>;
  };

  /* ── columns config ── */
  const cols = [
    { key: 'vehicle_number', label: 'Vehicle No.', icon: 'ri-roadster-line' },
    { key: 'regn', label: 'Regn. Date', icon: 'ri-calendar-check-line' },
    { key: 'insurance', label: 'Insurance', icon: 'ri-shield-check-line' },
    { key: 'road_tax', label: 'Road Tax', icon: 'ri-money-rupee-circle-line' },
    { key: 'np_upto', label: 'National Permit', icon: 'ri-file-paper-2-line' },
    { key: 'permit_valid', label: 'State Permit', icon: 'ri-file-shield-2-line' },
    { key: 'fitness', label: 'Fitness', icon: 'ri-heart-pulse-line' },
    { key: 'pollution', label: 'Pollution', icon: 'ri-leaf-line' },
  ];

  const getCellValue = (row, key) => {
    switch (key) {
      case 'vehicle_number': return row.vehicle_number || '-';
      case 'regn': return row.rc_regn_dt || row.registration_date || row.registered_at || null;
      case 'insurance': return typeof row.insurance_exp === 'object' ? row.insurance_exp?.value : row.insurance_exp;
      case 'road_tax': return typeof row.road_tax_exp === 'object' ? row.road_tax_exp?.value : row.road_tax_exp;
      case 'np_upto': return resolveField(row, 'rc_np_upto', '_raw.rc_np_upto', 'temp_permit.rc_np_upto', '_raw.temp_permit.rc_np_upto');
      case 'permit_valid': return resolveField(row, 'rc_permit_valid_upto', '_raw.rc_permit_valid_upto', 'temp_permit.rc_permit_valid_upto', '_raw.temp_permit.rc_permit_valid_upto');
      case 'fitness': return typeof row.fitness_exp === 'object' ? row.fitness_exp?.value : row.fitness_exp;
      case 'pollution': return typeof row.pollution_exp === 'object' ? row.pollution_exp?.value : row.pollution_exp;
      default: return '-';
    }
  };

  const isDateCol = (key) => key !== 'vehicle_number';

  /* ── render helpers ── */
  const DateCell = ({ value }) => {
    const formatted = formatDate(value);
    if (formatted === '-') return <span className="vst-cell--empty">—</span>;
    const status = expiryStatus(value);
    return <span className={`vst-date ${status ? `vst-date--${status}` : ''}`}>{formatted}</span>;
  };

  const ChallanBadge = ({ count, type }) => {
    const cls = count > 0 ? `vst-badge--${type}` : 'vst-badge--zero';
    return <span className={`vst-badge ${cls}`}>{count ?? 0}</span>;
  };

  /* ── skeleton loader ── */
  const SkeletonRows = () => (
    Array.from({ length: 6 }).map((_, i) => (
      <tr key={i} className="vst-skeleton-row">
        <td><div className="vst-skeleton" style={{ width: 20 }} /></td>
        {cols.map((c) => <td key={c.key}><div className="vst-skeleton" style={{ width: c.key === 'vehicle_number' ? 100 : 80 }} /></td>)}
        <td><div className="vst-skeleton" style={{ width: 30 }} /></td>
        <td><div className="vst-skeleton" style={{ width: 30 }} /></td>
        <td><div className="vst-skeleton" style={{ width: 28 }} /></td>
      </tr>
    ))
  );

  return (
    <div className="vst-card">
      {/* ── Header ── */}
      <div className="vst-header">
        <div className="vst-header__left">
          <div className="vst-header__icon-box">
            <i className="ri-truck-line" />
          </div>
          <div>
            <h2 className="vst-header__title">Vehicle Summary</h2>
          </div>
        </div>
        <div className="vst-header__actions">
          <span className="vst-header__count">Showing {sorted.length} of {sortedAll.length}</span>
          <button
            className="vst-btn vst-btn--outline"
            onClick={() => onViewAll?.()}
          >
            <i className="ri-list-check-2" /> View All
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="vst-table-wrap" id="vehicle-summary-table-print-area">
        <table className="vst-table">
          <thead>
            <tr>
              <th className="vst-th--num" rowSpan={2}>#</th>
              {cols.map(c => (
                <th key={c.key} rowSpan={2}>
                  <span className="vst-th__inner">
                    <i className={c.icon} /> {c.label}
                  </span>
                </th>
              ))}
              <th colSpan={2} className="challans-header">
                <span className="vst-th__inner"><i className="ri-ticket-2-line" /> Challans</span>
              </th>
              <th className="vst-th--center" rowSpan={2}>Action</th>
            </tr>
            <tr>
              <th className="vst-th--center" style={{ color: '#dc2626' }}>Pending</th>
              <th className="vst-th--center" style={{ color: '#16a34a' }}>Settled</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <SkeletonRows /> : sorted.length === 0 ? (
              <tr>
                <td colSpan={cols.length + 4} className="vst-empty">
                  <i className="ri-inbox-2-line" />
                  <p>No vehicles found</p>
                </td>
              </tr>
            ) : sorted.map((row, idx) => (
              <tr key={row.vehicle_id || idx} className="vst-row" onClick={() => onView(row)}>
                <td className="vst-td--num">{idx + 1}</td>
                {cols.map(c => (
                  <td key={c.key}>
                    {c.key === 'vehicle_number' ? (
                      <span className="vst-vehicle-num">{row.vehicle_number || '-'}</span>
                    ) : c.key === 'regn' ? (
                      <RegnDateCell
                        value={getCellValue(row, c.key)}
                        rcStatus={getRcStatus(row)}
                      />
                    ) : (
                      <DateCell value={getCellValue(row, c.key)} />
                    )}
                  </td>
                ))}
                <td className="vst-td--center"><ChallanBadge count={row.pending_challan_count} type="pending" /></td>
                <td className="vst-td--center"><ChallanBadge count={row.disposed_challan_count} type="settled" /></td>
                <td className="vst-td--center">
                  <button className="vst-view-btn" title="View Vehicle" onClick={e => { e.stopPropagation(); onView(row); }}>
                    <i className="ri-eye-line" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
