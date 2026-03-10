import React from "react";
import { useNavigate } from "react-router-dom";

import * as XLSX from "xlsx";

export default function LatestRTOTable({ vehicleData = [], loading, error, setSelectedRtoData, totalCount }) {
  const navigate = useNavigate();
  const formatExpiry = (dateStr) => {
    if (!dateStr || dateStr === '-' || dateStr === 'NA' || dateStr === 'N/A') return '-';
    let val = dateStr;
    if (typeof val === 'object' && val !== null) {
      if ('value' in val && val.value) val = val.value; else return '-';
    }
    if (typeof val === 'string' && val.trim().startsWith('{') && val.trim().endsWith('}')) {
      try { const parsed = JSON.parse(val); if (parsed && parsed.value) val = parsed.value; else if (parsed) val = parsed; } catch (e) { }
    }
    let d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
  };
  return (
    <div className="vst-card">
      <div className="vst-header">
        <div className="vst-header__left">
          <span className="vst-header__icon-box">
            <i className="ri-file-text-line"></i>
          </span>
          <div>
            <h2 className="vst-header__title">RTO Details</h2>
            <span className="vst-header__count">{vehicleData.length} of {totalCount ?? vehicleData.length} records</span>
          </div>
        </div>
        <span className="vst-record-badge">
          Showing {vehicleData.length} of {totalCount ?? vehicleData.length}
        </span>
      </div>
      {loading && <div>Loading vehicle data...</div>}
      {error && <div style={{color:'red'}}>{error}</div>}
      {/* Caption row removed, now next to title */}
      
      {vehicleData.length === 0 ? (
        <div className="vst-table-wrap" id="latest-rto-table-print-area">
          <table className="vst-table">
            <thead>
                <tr>
                  <th>#</th>
                  <th>Vehicle No.</th>
                  <th>Insurance</th>
                  <th>RoadTax</th>
                  <th>National Permit</th>
                  <th>Permit Valid</th>
                  <th>Fitness</th>
                  <th>Pollution</th>
                  <th className="print-hide">Action</th>
                </tr>
            </thead>
            <tbody>
              <tr><td colSpan={7}>No vehicle data found.</td></tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          <div className="vst-table-wrap" id="latest-rto-table-print-area">
            <table className="vst-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Vehicle No.</th>
                  <th>Insurance</th>
                  <th>RoadTax</th>
                  <th>National Permit</th>
                  <th>Permit Valid</th>
                  <th>Fitness</th>
                  <th>Pollution</th>
                  <th className="print-hide">Action</th>
                </tr>
              </thead>
              <tbody>
                {vehicleData.map((v, idx) => (
                  <tr key={v.rc_regn_no || idx}>
                    <td>{idx + 1}</td>
                    <td>{v.rc_regn_no || '-'}</td>
                    <td>{v.insurance_exp || v.rc_insurance_upto || '-'}</td>
                    <td>{v.road_tax_exp || v.rc_tax_upto || '-'}</td>
                    <td>{(() => {
                      let val = v.rc_np_upto ?? v._raw?.rc_np_upto ?? v.temp_permit?.rc_np_upto ?? v._raw?.temp_permit?.rc_np_upto;
                      if (!val) return '-';
                      return formatExpiry(val);
                    })()}</td>
                    <td>{(() => {
                      let val = v.rc_permit_valid_upto ?? v._raw?.rc_permit_valid_upto ?? v.temp_permit?.rc_permit_valid_upto ?? v._raw?.temp_permit?.rc_permit_valid_upto;
                      if (!val) return '-';
                      return formatExpiry(val);
                    })()}</td>
                    <td>{v.fitness_exp || v.rc_fit_upto || '-'}</td>
                    <td>{v.pollution_exp || v.rc_pucc_upto || '-'}</td>
                    <td className="print-hide vst-td--center">
                      <button className="vst-view-btn" onClick={() => setSelectedRtoData && setSelectedRtoData(v)} title="View Vehicle">
                        <i className="ri-eye-line" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ textAlign: 'right', padding: '12px 20px' }}>
            <button
              className="vst-btn vst-btn--outline"
              style={{ background: '#fff', color: '#3b82f6', border: '1.5px solid #bfdbfe' }}
              onClick={e => {
                e.preventDefault();
                if (typeof window !== 'undefined' && window.handleViewAllRtoData) {
                  window.handleViewAllRtoData();
                } else {
                  navigate('/vehiclertodata');
                }
              }}
            >
              View All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
