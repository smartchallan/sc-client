import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./VehicleSummaryTable.css";
import { FaSyncAlt } from "react-icons/fa";
import * as XLSX from "xlsx";

export default function VehicleSummaryTable({ data, loading, onRefresh, onView }) {
  // Local formatExpiry function for date formatting (matches MyFleetTable)
  const formatExpiry = (dateStr, useColor = false) => {
    if (!dateStr || dateStr === '-' || dateStr === 'NA' || dateStr === 'N/A') return '-';
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
    // color logic not used here; return formatted
    return formatted;
  };
  // If API response is { total, vehicles: [...] }, use vehicles array
  const vehicles = Array.isArray(data?.vehicles) ? data.vehicles : (Array.isArray(data) ? data : []);
  // Sort by registered_at DESC
  const sortedAll = [...vehicles].sort((a, b) => new Date(b.registered_at) - new Date(a.registered_at));
  // Show only first 50 records by default
  const DEFAULT_VISIBLE = 50;
  const [visibleLimit, setVisibleLimit] = React.useState(DEFAULT_VISIBLE);
  const sorted = sortedAll.slice(0, visibleLimit);

  const navigate = useNavigate();
  // Handler for View All
  const handleViewAll = () => {
    navigate('/myfleet');
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
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0, padding: '0 24px 0 0', minHeight: 54 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 4, height: 32, background: 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)', borderRadius: 3, marginRight: 14 }} />
          <h2 style={{
            margin: 0,
            fontSize: 19,
            color: '#1565c0',
            letterSpacing: '0.01em',
            lineHeight: 1.2,
            fontWeight: 700,
          }}>Vehicle Summary</h2>
        </div>
          <button
            className="action-btn"
            style={{ marginTop: 10 }}
            onClick={e => {
              e.preventDefault();
              if (typeof window !== 'undefined' && window.handleViewAllMyFleet) {
                window.handleViewAllMyFleet();
              }
            }}
          >
            View All
          </button>
      </div>

      <div className="vehicle-summary-table-container table-container" id="vehicle-summary-table-print-area">
        <table className="latest-table" style={{ width: '100%', marginTop: 8 }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Vehicle No.</th>
              <th>Registration Date</th>
              <th>Insurance Upto</th>
              <th>Road Tax Upto</th>
              <th>National Permit</th>
              <th>Permit Valid</th>
              <th>Fitness Upto</th>
              <th>Pollution Upto</th>
              <th colSpan={2} className="challans-header">Vehicle Challans</th>
              <th>View</th>
            </tr>
            <tr>
              <th colSpan={9}></th>
              <th className="challan-sub-header" style={{color:'#e74c3c'}}>Pending</th>
              <th className="challan-sub-header" style={{color:'#43a047'}}>Settled</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12}>Loading...</td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan={12}>No data found.</td></tr>
            ) : (
              sorted.map((row, idx) => (
                <tr key={row.vehicle_id || idx}>
                  <td>{idx + 1}</td>
                  <td>{row.vehicle_number || '-'}</td>
                  <td>{row.rc_regn_dt || row.registration_date || row.registered_at || '-'}</td>
                  <td>{typeof row.insurance_exp === 'object' && row.insurance_exp !== null ? (row.insurance_exp.value ?? JSON.stringify(row.insurance_exp)) : (row.insurance_exp || '-')}</td>
                  <td>{typeof row.road_tax_exp === 'object' && row.road_tax_exp !== null ? (row.road_tax_exp.value ?? JSON.stringify(row.road_tax_exp)) : (row.road_tax_exp || '-')}</td>
                  <td>{(() => {
                    let val = row.rc_np_upto ?? row._raw?.rc_np_upto ?? row.temp_permit?.rc_np_upto ?? row._raw?.temp_permit?.rc_np_upto;
                    if (!val) return '-';
                    if (typeof val === 'string' && val.trim().startsWith('{') && val.trim().endsWith('}')) {
                      try { val = JSON.parse(val); } catch (e) { return '-'; }
                    }
                    if (typeof val === 'object') {
                      if ('value' in val && val.value) val = val.value; else return '-';
                    }
                    if (!val) return '-';
                    return formatExpiry(val, false);
                  })()}</td>
                  <td>{(() => {
                    let val = row.rc_permit_valid_upto ?? row._raw?.rc_permit_valid_upto ?? row.temp_permit?.rc_permit_valid_upto ?? row._raw?.temp_permit?.rc_permit_valid_upto;
                    if (!val) return '-';
                    if (typeof val === 'string' && val.trim().startsWith('{') && val.trim().endsWith('}')) {
                      try { val = JSON.parse(val); } catch (e) { return '-'; }
                    }
                    if (typeof val === 'object') {
                      if ('value' in val && val.value) val = val.value; else return '-';
                    }
                    if (!val) return '-';
                    return formatExpiry(val, false);
                  })()}</td>
                  <td>{typeof row.fitness_exp === 'object' && row.fitness_exp !== null ? (row.fitness_exp.value ?? JSON.stringify(row.fitness_exp)) : (row.fitness_exp || '-')}</td>
                  <td>{typeof row.pollution_exp === 'object' && row.pollution_exp !== null ? (row.pollution_exp.value ?? JSON.stringify(row.pollution_exp)) : (row.pollution_exp || '-')}</td>
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
                    <button className="action-btn flat-btn" title="View Vehicle" style={{fontSize:'80%',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={() => onView(row)}>
                      <i className="ri-eye-line" style={{fontSize:'1.2em'}} />
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
