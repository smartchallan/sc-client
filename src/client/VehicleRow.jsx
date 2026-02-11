import React from 'react';
import StatusPill from './StatusPill';

export default function VehicleRow({ row, idx, onView, formatExpiry, visibleColumns = [], selected = false, onToggleSelect = () => {} }) {
  const cells = {
    select: <td><input type="checkbox" checked={!!selected} onChange={() => onToggleSelect(row.vehicle_id || row.id || row._id)} /></td>,
    index: <td>{idx + 1}</td>,
    vehicle_number: <td>{row.vehicle_number || '-'}</td>,
    registration_date: <td>{row.rc_regn_dt || row.registration_date || row.registered_at || '-'}</td>,
    insurance_exp: <td>{typeof row.insurance_exp === 'object' && row.insurance_exp !== null ? (row.insurance_exp.value ?? JSON.stringify(row.insurance_exp)) : (row.insurance_exp || '-')}</td>,
    road_tax_exp: <td>{typeof row.road_tax_exp === 'object' && row.road_tax_exp !== null ? (row.road_tax_exp.value ?? JSON.stringify(row.road_tax_exp)) : (row.road_tax_exp || '-')}</td>,
    national_permit: <td>{(() => {
      let val = row.rc_np_upto ?? row._raw?.rc_np_upto ?? row.temp_permit?.rc_np_upto ?? row._raw?.temp_permit?.rc_np_upto;
      if (!val) return '-';
      if (typeof val === 'string' && val.trim().startsWith('{') && val.trim().endsWith('}')) {
        try { val = JSON.parse(val); } catch (e) { return '-'; }
      }
      if (typeof val === 'object') {
        if ('value' in val && val.value) val = val.value; else return '-';
      }
      if (!val) return '-';
      return formatExpiry ? formatExpiry(val, false) : (val || '-');
    })()}</td>,
    permit_valid: <td>{(() => {
      let val = row.rc_permit_valid_upto ?? row._raw?.rc_permit_valid_upto ?? row.temp_permit?.rc_permit_valid_upto ?? row._raw?.temp_permit?.rc_permit_valid_upto;
      if (!val) return '-';
      if (typeof val === 'string' && val.trim().startsWith('{') && val.trim().endsWith('}')) {
        try { val = JSON.parse(val); } catch (e) { return '-'; }
      }
      if (typeof val === 'object') {
        if ('value' in val && val.value) val = val.value; else return '-';
      }
      if (!val) return '-';
      return formatExpiry ? formatExpiry(val, false) : (val || '-');
    })()}</td>,
    fitness_exp: <td>{typeof row.fitness_exp === 'object' && row.fitness_exp !== null ? (row.fitness_exp.value ?? JSON.stringify(row.fitness_exp)) : (row.fitness_exp || '-')}</td>,
    pollution_exp: <td>{typeof row.pollution_exp === 'object' && row.pollution_exp !== null ? (row.pollution_exp.value ?? JSON.stringify(row.pollution_exp)) : (row.pollution_exp || '-')}</td>,
    pending_challans: <td style={{textAlign:'center'}}><StatusPill status="Pending" count={row.pending_challan_count ?? 0} /></td>,
    disposed_challans: <td style={{textAlign:'center'}}><StatusPill status="Settled" count={row.disposed_challan_count ?? 0} /></td>,
    view: <td style={{textAlign:'center'}}>
      <button className="action-btn flat-btn" title="View Vehicle" style={{fontSize:'80%',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={() => onView(row)}>
        <i className="ri-eye-line" style={{fontSize:'1.2em'}} />
      </button>
    </td>,
  };

  return (
    <tr key={row.vehicle_id || idx}>
      {Object.keys(cells).map(k => visibleColumns.includes(k) ? React.cloneElement(cells[k], { key: k }) : null)}
    </tr>
  );
}
